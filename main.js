(() => {
  const $ = (id) => document.getElementById(id);
  const svgNS = "http://www.w3.org/2000/svg";
  const canvas = $("designCanvas");
  const state = { view: "rear", grid: true, selected: null, nextId: 1, items: [], saved: [], user: null };
  const SUPABASE_URL = "https://zvcycttznebsfdzerijj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_n_ojTLFmbI41ZMJOujRArg_Gg1E2tNP";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const SITE_URL = "https://liteempire.github.io/iphone-designer/";
  const defaults = {
    body: { name: "Phone body", x: 115, y: 85, w: 190, h: 410, color: "#d9dde5", radius: 31, layer: 0 },
    nc: { name: "Nova Chassis · NC", x: 95, y: 115, w: 230, h: 390, color: "#8b96a8", radius: 22, layer: 0 },
    battery: { name: "Battery · NB1", x: 119, y: 270, w: 54, h: 130, color: "#354657", radius: 8, layer: 5 },
    motherboard: { name: "Motherboard · NMB1", x: 190, y: 145, w: 100, h: 185, color: "#244b3a", radius: 7, layer: 6 },
    cpu: { name: "Nova CPU · N1", x: 196, y: 150, w: 86, h: 42, color: "#4b638c", radius: 8, layer: 8 },
    gpu: { name: "Nova GPU · NG1", x: 196, y: 198, w: 86, h: 42, color: "#536b56", radius: 8, layer: 9 },
    ram: { name: "Nova RAM · NR1", x: 196, y: 246, w: 86, h: 34, color: "#a77b48", radius: 7, layer: 10 },
    ssd: { name: "Nova SSD · NS1", x: 196, y: 285, w: 86, h: 30, color: "#76619c", radius: 7, layer: 11 },
    frontCamera: { name: "Front camera", x: 198, y: 102, w: 16, h: 16, color: "#111827", radius: 8, layer: 3 },
    screen: { name: "Display", x: 127, y: 98, w: 166, h: 384, color: "#252b38", radius: 25, layer: 1 },
    camera: { name: "Camera module", x: 132, y: 112, w: 76, h: 94, color: "#343a47", radius: 18, layer: 2 },
    lens: { name: "Camera lens", x: 145, y: 124, w: 25, h: 25, color: "#111827", radius: 13, layer: 3 },
    flash: { name: "Flash", x: 181, y: 131, w: 13, h: 13, color: "#f4dca2", radius: 7, layer: 4 },
    logo: { name: "Nova logo", x: 191, y: 280, w: 44, h: 44, color: "#657084", radius: 22, layer: 5 },
    button: { name: "Side button", x: 302, y: 205, w: 8, h: 58, color: "#9da5b2", radius: 4, layer: 6 },
    detail: { name: "Custom detail", x: 220, y: 350, w: 40, h: 24, color: "#91a8c7", radius: 8, layer: 7 }
  };
  const initial = ["body", "screen", "frontCamera", "camera", "lens", "lens", "flash", "logo", "button"];
  let toastTimer;
  let designCheckpoint = "";
  let contextBodyId = null;
  function checkpointDesign() { designCheckpoint = JSON.stringify(serialize()); }
  function hasUnsavedCanvasChanges() { return designCheckpoint !== JSON.stringify(serialize()); }
  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedCanvasChanges()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  const INNER_TYPES = ["cpu","gpu","ram","ssd"];
  const FIXED_TYPES = ["nc","battery","cpu","gpu","ram","ssd"];
  const LOCKED_POSITION_TYPES = [...FIXED_TYPES,"screen"];
  const PHONE_BOUNDS = { x:115, y:85, w:190, h:410 };
  function clampToPhone(item) { if (!item || item.type === "body" || item.type === "button") return; item.x=Math.max(PHONE_BOUNDS.x,Math.min(PHONE_BOUNDS.x+PHONE_BOUNDS.w-item.w,item.x)); item.y=Math.max(PHONE_BOUNDS.y,Math.min(PHONE_BOUNDS.y+PHONE_BOUNDS.h-item.h,item.y)); }
  function makeItem(type, overrides = {}) {
    const d = defaults[type] || defaults.detail;
    const defaultView = ["body", "button"].includes(type) ? "both" : type === "screen" || type === "frontCamera" ? "front" : ["camera", "lens", "flash", "logo"].includes(type) ? "rear" : ["nc", "battery", "motherboard", "cpu", "gpu", "ram", "ssd"].includes(type) ? "inside" : state.view;
    const parentBoard = INNER_TYPES.includes(type) ? state.items.find(i=>i.type==="motherboard") : null;
    const item = { id: state.nextId++, type, name: d.name, x: d.x, y: d.y, w: d.w, h: d.h, color: d.color, radius: d.radius || 0, rotation: 0, layer: type === "nc" ? -1 : state.items.length, view: defaultView, ...(parentBoard ? {parentId:parentBoard.id} : {}), ...overrides };
    if (type === "lens" && state.items.some(i => i.type === "lens")) {
      const count = state.items.filter(i => i.type === "lens").length;
      item.x = d.x + (count % 2) * 31; item.y = d.y + Math.floor(count / 2) * 31;
    }
    clampToPhone(item);
    return item;
  }
  function addItem(type) {
    const item = makeItem(type);
    state.items.push(item);
    if (item.view !== "both" && item.view !== state.view) {
      state.view = item.view;
      $("rearViewBtn").classList.toggle("active", state.view === "rear");
      $("frontViewBtn").classList.toggle("active", state.view === "front");
      $("internalViewBtn").classList.toggle("active", state.view === "inside");
    }
    state.selected = item.id;
    render();
    toast(item.name + " added");
  }
  function selectedItem() { return state.items.find(i => i.id === state.selected); }
  function el(tag, attrs = {}) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, String(v)));
    return node;
  }
  function shapeFor(item) {
    const group = el("g", { "data-id": item.id, transform: `rotate(${item.rotation} ${item.x + item.w/2} ${item.y + item.h/2})`, cursor: "move" });
    let shape;
    if ((state.view === "top" || state.view === "bottom") && item.type === "body") {
      const edgeY = state.view === "top" ? 285 : 285;
      const edgeX = 90, edgeW = 240, edgeH = 34;
      const edge = el("rect",{x:edgeX,y:edgeY,width:edgeW,height:edgeH,rx:14,fill:item.color,stroke:"#7f8999","stroke-width":2});
      group.appendChild(edge);
      group.appendChild(el("rect",{x:edgeX+10,y:edgeY+5,width:edgeW-20,height:edgeH-10,rx:9,fill:"none",stroke:"#ffffff88","stroke-width":1}));
      if (state.view === "bottom") {
        group.appendChild(el("rect",{x:edgeX+edgeW/2-28,y:edgeY+5,width:56,height:edgeH-10,rx:4,fill:"#171c25",stroke:"#b8c1ce","stroke-width":1.5}));
        for(let p=0;p<5;p++) group.appendChild(el("circle",{cx:edgeX+edgeW/2-48+p*12,cy:edgeY+edgeH/2,r:1.8,fill:"#202632"}));
      } else {
        group.appendChild(el("circle",{cx:edgeX+edgeW/2,cy:edgeY+edgeH/2,r:5,fill:"#111827",stroke:"#b8c1ce","stroke-width":1.5}));
      }
      return group;
    }
    if (item.type === "nc") {
      shape = el("g");
      // Compound even-odd path: the interior subpaths are real transparent cutouts,
      // not painted-on rectangles. Layout is a conceptual smartphone midframe.
      const x=item.x, y=item.y, w=item.w, h=item.h;
      const insideParts = state.items.filter(part => ["motherboard","battery"].includes(part.type));
      const holes = insideParts.map(part => {
        const px = part.x, py = part.y, pw = part.w, ph = part.h;
        const radius = Math.max(2, Math.min(part.radius || 7, pw/2, ph/2));
        // Each chassis opening follows the matching component's position, size, and corner radius.
        return `M ${px+radius} ${py} H ${px+pw-radius} Q ${px+pw} ${py} ${px+pw} ${py+radius} V ${py+ph-radius} Q ${px+pw} ${py+ph} ${px+pw-radius} ${py+ph} H ${px+radius} Q ${px} ${py+ph} ${px} ${py+ph-radius} V ${py+radius} Q ${px} ${py} ${px+radius} ${py} Z`;
      }).join(" ");
      const outer = `M ${x+22} ${y} H ${x+w-22} Q ${x+w} ${y} ${x+w} ${y+22} V ${y+h-22} Q ${x+w} ${y+h} ${x+w-22} ${y+h} H ${x+22} Q ${x} ${y+h} ${x} ${y+h-22} V ${y+22} Q ${x} ${y} ${x+22} ${y} Z`;
      shape.appendChild(el("path", {d:outer+" "+holes,fill:item.color,stroke:"#d8dee8","stroke-width":3,"fill-rule":"evenodd","fill-opacity":0.96}));
      // Reinforcing ribs and screw bosses around the component cavities.
      [[x+10,y+105],[x+w-10,y+105],[x+10,y+285],[x+w-10,y+285],[x+18,y+h-25],[x+w-18,y+h-25]].forEach(([cx,cy])=>{
        shape.appendChild(el("circle",{cx,cy,r:4,fill:"#4b5565",stroke:"#e2e8f0","stroke-width":1.3}));
      });
      // Small rail details make the frame look machined rather than like a plain plate.
      shape.appendChild(el("path",{d:`M ${x+83} ${y+22} v 100 M ${x+83} ${y+140} v 150`,fill:"none",stroke:"#d8dee8","stroke-width":2,"stroke-linecap":"round"}));
    } else if (item.type === "battery") {
      shape = el("g");
      shape.appendChild(el("rect", {x:item.x,y:item.y,width:item.w,height:item.h,rx:item.radius||8,fill:item.color,stroke:"#b9c6d3","stroke-width":2}));
      shape.appendChild(el("rect", {x:item.x+item.w*.36,y:item.y-4,width:item.w*.28,height:5,rx:2,fill:"#cbd5e1"}));
      const bt = el("text",{x:item.x+item.w/2,y:item.y+item.h/2-4,"text-anchor":"middle","font-family":"DM Sans, sans-serif","font-size":10,"font-weight":"700",fill:"#ffffff"}); bt.textContent="BATTERY"; shape.appendChild(bt);
      const bc = el("text",{x:item.x+item.w/2,y:item.y+item.h/2+11,"text-anchor":"middle","font-family":"DM Sans, sans-serif","font-size":9,fill:"#dbeafe"}); bc.textContent="NB1"; shape.appendChild(bc);
    } else if (item.type === "motherboard") {
      shape = el("g");
      shape.appendChild(el("rect",{x:item.x,y:item.y,width:item.w,height:item.h,rx:item.radius||7,fill:item.color,stroke:"#8cb8a1","stroke-width":2}));
      [[.18,.12],[.78,.16],[.2,.8],[.82,.82]].forEach(([px,py])=>shape.appendChild(el("circle",{cx:item.x+item.w*px,cy:item.y+item.h*py,r:3,fill:"#d5c69b"})));
      // Four visible component sockets on the Nova motherboard. The chips sit
      // over these outlined ports, leaving gold contacts visible at the sides.
      const sockets = [
        {label:"CPU SOCKET", x:item.x+3, y:item.y+4, w:item.w-6, h:46, pins:7},
        {label:"GPU SOCKET", x:item.x+3, y:item.y+52, w:item.w-6, h:46, pins:7},
        {label:"RAM PORT", x:item.x+3, y:item.y+100, w:item.w-6, h:38, pins:6},
        {label:"SSD PORT", x:item.x+3, y:item.y+139, w:item.w-6, h:34, pins:6}
      ];
      sockets.forEach(socket => {
        shape.appendChild(el("rect",{x:socket.x,y:socket.y,width:socket.w,height:socket.h,rx:4,fill:"#142d24",stroke:"#e0bd70","stroke-width":1.5}));
        for(let p=0;p<socket.pins;p++){
          const py=socket.y+5+p*((socket.h-10)/Math.max(1,socket.pins-1));
          shape.appendChild(el("rect",{x:socket.x+1.5,y:py,width:3,height:2,rx:0.7,fill:"#e6c66f"}));
          shape.appendChild(el("rect",{x:socket.x+socket.w-4.5,y:py,width:3,height:2,rx:0.7,fill:"#e6c66f"}));
        }
      });
      const mt = el("text",{x:item.x+item.w/2,y:item.y+item.h-14,"text-anchor":"middle","font-family":"DM Sans, sans-serif","font-size":9,"font-weight":"700",fill:"#f0fdf4"}); mt.textContent="MOTHERBOARD"; shape.appendChild(mt);
      const mc = el("text",{x:item.x+item.w/2,y:item.y+item.h-3,"text-anchor":"middle","font-family":"DM Sans, sans-serif","font-size":8,fill:"#d1fae5"}); mc.textContent="NMB1"; shape.appendChild(mc);
    } else if (["cpu","gpu","ram","ssd"].includes(item.type)) {
      shape = el("rect", {x:item.x,y:item.y,width:item.w,height:item.h,rx:item.radius||8,fill:item.color,stroke:"#ffffff99","stroke-width":1.5});
    } else if (item.type === "logo") {
      shape = el("text", { x: item.x + item.w/2, y: item.y + item.h*.72, "text-anchor":"middle", "font-family":"Space Grotesk, sans-serif", "font-size":Math.max(12,item.w*.65), "font-weight":"700", fill:item.color });
      shape.textContent = "N";
    } else if (item.type === "lens" || item.type === "frontCamera") {
      // Realistic camera optics: machined metal bezel, concentric lens rings,
      // deep blue-purple coated glass, and a small reflected highlight.
      shape = el("g");
      const cx=item.x+item.w/2, cy=item.y+item.h/2, r=Math.min(item.w,item.h)*.49;
      shape.appendChild(el("circle",{cx,cy,r,fill:"#11151d",stroke:"#c2cad5","stroke-width":Math.max(1.2,r*.12)}));
      shape.appendChild(el("circle",{cx,cy,r:r*.83,fill:"#242b38",stroke:"#596779","stroke-width":Math.max(1,r*.07)}));
      shape.appendChild(el("circle",{cx,cy,r:r*.68,fill:"#080d18",stroke:"#101a2b","stroke-width":Math.max(1,r*.06)}));
      shape.appendChild(el("circle",{cx,cy,r:r*.53,fill:"#102746",stroke:"#31537b","stroke-width":Math.max(.8,r*.07)}));
      shape.appendChild(el("circle",{cx:cx-r*.13,cy:cy-r*.16,r:r*.28,fill:"#2b6da1","fill-opacity":.72}));
      shape.appendChild(el("circle",{cx:cx-r*.19,cy:cy-r*.23,r:r*.12,fill:"#e5f4ff","fill-opacity":.9}));
      shape.appendChild(el("path",{d:`M ${cx-r*.48} ${cy+r*.38} Q ${cx} ${cy+r*.65} ${cx+r*.42} ${cy+r*.28}`,fill:"none",stroke:"#7ca8dc","stroke-opacity":.65,"stroke-width":Math.max(.7,r*.07)}));
    } else if (item.type === "flash") {
      shape = el("circle", {cx:item.x+item.w/2,cy:item.y+item.h/2,r:Math.min(item.w,item.h)/2,fill:item.color,stroke:"#b6bbc5","stroke-width":1.5});
    } else {
      const radius = item.type === "body" ? Math.min(item.w,item.h)*.16 : Math.min(item.radius || 8,item.w/2,item.h/2);
      shape = el("rect", {x:item.x,y:item.y,width:item.w,height:item.h,rx:radius,fill:item.color,stroke:item.type==="body"?"#9ca5b4":"#ffffff55","stroke-width":item.type==="body"?2:1});
      if (item.material === "aluminium" || item.material === "titanium") {
        shape.setAttribute("stroke", item.material === "titanium" ? "#d8dee8" : "#aeb8c6");
        shape.setAttribute("stroke-width", "3");
      } else if (item.material === "glass" || item.material === "glossy") {
        shape.setAttribute("stroke", "#ffffffcc");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("fill-opacity", item.material === "glass" ? "0.78" : "0.94");
      } else if (item.material === "matte" || item.material === "rubber") {
        shape.setAttribute("stroke", "#00000044");
        shape.setAttribute("stroke-width", "1.5");
      } else if (item.material === "plastic") {
        shape.setAttribute("stroke", "#ffffff66");
        shape.setAttribute("stroke-width", "1.5");
      }
      if (item.type === "screen") {
        shape.setAttribute("stroke","#111827");
      }
      if (item.type === "camera") {
        // Camera module background intentionally omitted; individual lens and flash components remain.
        return group;
      }
    }
    group.appendChild(shape);
    if (item.type === "body" && item.imageData) {
      const clipId = `body-image-clip-${item.id}`;
      const defs = el("defs");
      const clip = el("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
      clip.appendChild(el("rect", { x:item.x, y:item.y, width:item.w, height:item.h, rx:Math.min(item.w,item.h)*.16 }));
      defs.appendChild(clip);
      group.appendChild(defs);
      group.appendChild(el("image", { href:item.imageData, x:item.x, y:item.y, width:item.w, height:item.h, preserveAspectRatio:"xMidYMid slice", "clip-path":`url(#${clipId})`, "pointer-events":"none" }));
      group.appendChild(el("rect", { x:item.x, y:item.y, width:item.w, height:item.h, rx:Math.min(item.w,item.h)*.16, fill:"none", stroke:"#9ca5b4", "stroke-width":2, "pointer-events":"none" }));
    }
    if (["cpu","gpu","ram","ssd"].includes(item.type)) {
      const code = ({cpu:"N1",gpu:"NG1",ram:"NR1",ssd:"NS1"})[item.type];
      const chipText = el("text",{x:item.x+item.w/2,y:item.y+item.h*.43,"text-anchor":"middle","font-family":"Space Grotesk, sans-serif","font-size":Math.max(10,Math.min(16,item.w*.12)),"font-weight":"700",fill:"#ffffff"}); chipText.textContent=code; group.appendChild(chipText);
      const label = el("text",{x:item.x+item.w/2,y:item.y+item.h*.72,"text-anchor":"middle","font-family":"DM Sans, sans-serif","font-size":Math.max(7,Math.min(10,item.w*.075)),"font-weight":"600",fill:"#ffffffdd"}); label.textContent=({cpu:"CPU",gpu:"GPU",ram:"RAM",ssd:"SSD"})[item.type]; group.appendChild(label);
    }
    if (item.type === "body") {
      group.appendChild(el("rect",{x:item.x+item.w*.42,y:item.y+item.h-13,width:item.w*.16,height:3,rx:2,fill:"#737d8d","fill-opacity":.55}));
    }
    if (state.selected === item.id) {
      const box = el("rect",{x:item.x-3,y:item.y-3,width:item.w+6,height:item.h+6,rx:Math.min(item.radius||5,12),fill:"none",stroke:"#355fe8","stroke-width":1.5,"stroke-dasharray":"5 4","pointer-events":"none"});
      group.appendChild(box);
      // Four directional resize handles: drag an edge to resize along that axis.
      const handles = [
        { dir: "up", x: item.x + item.w/2, y: item.y, d: `M ${item.x+item.w/2} ${item.y-9} v 7 M ${item.x+item.w/2-3} ${item.y-5} l 3 3 3 -3`, cursor: "ns-resize" },
        { dir: "down", x: item.x + item.w/2, y: item.y + item.h, d: `M ${item.x+item.w/2} ${item.y+item.h+9} v -7 M ${item.x+item.w/2-3} ${item.y+item.h+5} l 3 -3 3 3`, cursor: "ns-resize" },
        { dir: "left", x: item.x, y: item.y + item.h/2, d: `M ${item.x-9} ${item.y+item.h/2} h 7 M ${item.x-5} ${item.y+item.h/2-3} l -3 3 3 3`, cursor: "ew-resize" },
        { dir: "right", x: item.x + item.w, y: item.y + item.h/2, d: `M ${item.x+item.w+9} ${item.y+item.h/2} h -7 M ${item.x+item.w+5} ${item.y+item.h/2-3} l 3 3 -3 3`, cursor: "ew-resize" }
      ];
      handles.forEach(handle => {
        group.appendChild(el("circle", { cx: handle.x, cy: handle.y, r: 7, fill: "#355fe8", stroke: "#fff", "stroke-width": 1.8, "data-resize": item.id, "data-resize-direction": handle.dir, cursor: handle.cursor }));
        group.appendChild(el("path", { d: handle.d, fill: "none", stroke: "#355fe8", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "pointer-events": "none" }));
      });
    }
    group.addEventListener("pointerdown", ev => startPointer(ev,item.id, ev.target.hasAttribute("data-resize")));
    if (item.type === "body" && state.view === "rear") {
      group.addEventListener("contextmenu", ev => {
        ev.preventDefault(); ev.stopPropagation();
        contextBodyId = item.id;
        const menu = $("bodyContextMenu");
        const area = $("canvasArea").getBoundingClientRect();
        menu.hidden = false;
        menu.style.left = `${Math.max(8,Math.min(area.width-190,ev.clientX-area.left))}px`;
        menu.style.top = `${Math.max(8,Math.min(area.height-82,ev.clientY-area.top))}px`;
        $("removeBodyImageBtn").hidden = !item.imageData;
      });
    }
    return group;
  }
  function render() {
    canvas.querySelectorAll("[data-id]").forEach(n => n.remove());
    const sorted = [...state.items].sort((a,b) => a.layer-b.layer);
    sorted.filter(item => isVisibleInView(item)).forEach(item => {
      // A phone viewed from the front shows its side button on the opposite edge.
      const visualItem = item.type === "button" && state.view === "front"
        ? { ...item, x: 420 - item.x - item.w }
        : item;
      canvas.appendChild(shapeFor(visualItem));
    });
    updateProperties();
    $("selectionLabel").textContent = selectedItem() ? selectedItem().name + " selected" : "No component selected";
    const viewNames = {rear:"Rear design",front:"Front design",inside:"Internal layout",top:"Top edge",bottom:"Bottom edge"};
    $("canvasTitle").textContent = "Horizon · " + (viewNames[state.view] || "Rear design");
    $("dropHint").classList.toggle("hidden", state.items.some(i => isVisibleInView(i)));
    $("componentCount").textContent = state.items.length;
  }
  function isVisibleInView(item) {
    // Older saved designs do not have a view property; infer their original component side.
    const side = item.view || (["body", "button"].includes(item.type) ? "both" : item.type === "screen" || item.type === "frontCamera" ? "front" : ["camera", "lens", "flash", "logo"].includes(item.type) ? "rear" : ["nc", "battery", "motherboard", "cpu", "gpu", "ram", "ssd"].includes(item.type) ? "inside" : "both");
    // The exterior shell must not cover the chassis in the internal layout.
    // The NC chassis is the base layer; internal parts render above it.
    if (state.view === "inside" && ["body", "button"].includes(item.type)) return false;
    if (state.view === "top" || state.view === "bottom") return ["body","button"].includes(item.type);
    return side === "both" || side === state.view;
  }
  function selectItem(id) { state.selected = id; updateProperties(); }
  function updateProperties() {
    const item = selectedItem();
    $("emptyProperties").hidden = !!item;
    $("propertyControls").hidden = !item;
    if (!item) { $("selectionLabel").textContent = "No component selected"; $("propertyTarget").textContent = "None"; return; }
    $("selectionLabel").textContent = item.name + " selected";
    $("propertyTarget").textContent = item.name;
    $("componentName").value = item.name;
    $("componentColor").value = validHex(item.color) ? item.color : "#d9dde5";
    $("hexColor").value = item.color.toUpperCase();
    $("componentMaterial").value = item.material || "default";
    const fixedSize = FIXED_TYPES.includes(item.type) || item.type==="motherboard" || item.type==="screen"; const fixedPosition = LOCKED_POSITION_TYPES.includes(item.type) || item.type==="motherboard";
    $("posX").value = Math.round(item.x); $("posY").value = Math.round(item.y); $("posX").disabled=fixedPosition; $("posY").disabled=fixedPosition;
    $("sizeW").value = Math.round(item.w); $("sizeH").value = Math.round(item.h);
    $("sizeW").disabled = fixedSize; $("sizeH").disabled = fixedSize;
    $("sizeW").title = fixedSize ? "Internal components have fixed sizes" : "";
    $("sizeH").title = fixedSize ? "Internal components have fixed sizes" : "";
    $("rotation").value = item.rotation; $("rotationValue").value = item.rotation + "°"; $("rotation").disabled=FIXED_TYPES.includes(item.type)||item.type==="motherboard";
  }
  function validHex(value) { return /^#[0-9a-f]{6}$/i.test(value); }
  function setColor(value) {
    const item = selectedItem(); if (!item || FIXED_TYPES.includes(item.type) || item.type==="motherboard" || !validHex(value)) return;
    item.color = value; $("componentColor").value = value; $("hexColor").value = value.toUpperCase(); render();
  }
  let pointer = null;
  function canvasPoint(ev) {
    const point = canvas.createSVGPoint();
    point.x = ev.clientX;
    point.y = ev.clientY;
    const matrix = canvas.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : { x: ev.clientX, y: ev.clientY };
  }
  function startPointer(ev, id, resizing) {
    ev.preventDefault(); ev.stopPropagation();
    const item = state.items.find(i => i.id === id); if (!item) return;
    if (LOCKED_POSITION_TYPES.includes(item.type) || (item.type === "motherboard" && resizing)) { toast("Internal components are fixed in their slots"); return; }
    state.selected = id;
    render();
    const point = canvasPoint(ev);
    pointer = { id, startX: point.x, startY: point.y, x:item.x, y:item.y, w:item.w, h:item.h, resizing, resizeDirection: ev.target.getAttribute("data-resize-direction") || "down-right" };
    window.addEventListener("pointermove", movePointer);
    window.addEventListener("pointerup", stopPointer, { once:true });
    window.addEventListener("pointercancel", stopPointer, { once:true });
  }
  function movePointer(ev) {
    if (!pointer) return;
    const item = state.items.find(i => i.id === pointer.id); if (!item) return;
    const point = canvasPoint(ev);
    const realItem = state.items.find(i => i.id === pointer.id);
    const dx = point.x-pointer.startX, dy = point.y-pointer.startY;
    // In the front view, horizontal dragging of the mirrored side button is reversed.
    const moveX = realItem && realItem.type === "button" && state.view === "front" ? -dx : dx;
    if (pointer.resizing) {
      const dir = pointer.resizeDirection;
      const minSize = 8;
      if (dir === "left") {
        const right = pointer.x + pointer.w;
        item.x = Math.max(0, Math.min(right - minSize, pointer.x + dx));
        item.w = right - item.x;
      } else if (dir === "right") {
        item.w = Math.max(minSize, Math.min(420 - pointer.x, pointer.w + dx));
      } else if (dir === "up") {
        const bottom = pointer.y + pointer.h;
        item.y = Math.max(0, Math.min(bottom - minSize, pointer.y + dy));
        item.h = bottom - item.y;
      } else if (dir === "down") {
        item.h = Math.max(minSize, Math.min(620 - pointer.y, pointer.h + dy));
      } else {
        item.w = Math.max(minSize, Math.min(420 - item.x, pointer.w + dx));
        item.h = Math.max(minSize, Math.min(620 - item.y, pointer.h + dy));
      }
    } else {
      item.x = Math.max(PHONE_BOUNDS.x,Math.min(PHONE_BOUNDS.x+PHONE_BOUNDS.w-item.w,pointer.x+moveX));
      item.y = Math.max(PHONE_BOUNDS.y,Math.min(PHONE_BOUNDS.y+PHONE_BOUNDS.h-item.h,pointer.y+dy));
      if (item.type === "motherboard") { const sx=item.x-pointer.x, sy=item.y-pointer.y; INNER_TYPES.forEach(type=>state.items.filter(part=>part.type===type && (part.parentId===item.id || part.parentId==null)).forEach(part=>{part.parentId=item.id;part.x+=sx;part.y+=sy;})); }
    }
    render();
  }
  function stopPointer() {
    pointer = null;
    window.removeEventListener("pointermove", movePointer);
    window.removeEventListener("pointerup", stopPointer);
    window.removeEventListener("pointercancel", stopPointer);
  }
  function reorder(id, direction) {
    const item = selectedItem(); if (!item) return;
    const layers = state.items.map(i=>i.layer);
    item.layer = direction === "front" ? Math.max(...layers)+1 : Math.min(...layers)-1;
    render();
  }
  function serialize() { return {name:"Horizon",view:state.view,items:state.items.map(i=>({...i}))}; }
  function loadDesign(data) {
    state.items = (data.items || []).map(i=>({...i}));
    const board=state.items.find(i=>i.type==="motherboard"); if(board) state.items.filter(i=>INNER_TYPES.includes(i.type)).forEach(part=>{if(part.parentId==null)part.parentId=board.id;}); state.items.forEach(clampToPhone);
    state.nextId = Math.max(0,...state.items.map(i=>i.id))+1; state.view=data.view||"rear"; state.selected=null;
    $("rearViewBtn").classList.toggle("active",state.view==="rear"); $("frontViewBtn").classList.toggle("active",state.view==="front"); $("internalViewBtn").classList.toggle("active",state.view==="inside"); $("topViewBtn").classList.toggle("active",state.view==="top"); $("bottomViewBtn").classList.toggle("active",state.view==="bottom"); render(); checkpointDesign();
  }
  async function loadSaved() {
    if (state.user) {
      // Import older browser-only designs into the signed-in account for cross-device access.
      let localDesigns = [];
      try { localDesigns = JSON.parse(localStorage.getItem("nova-horizon-designs") || "[]"); } catch { localDesigns = []; }
      if (Array.isArray(localDesigns) && localDesigns.length) {
        const rows = localDesigns.map(d => {
          const title = String(d.title || d.name || "Horizon concept").trim() || "Horizon concept";
          return { user_id: state.user.id, name: title, design: { ...d, title } };
        });
        const { error: migrationError } = await supabase.from("designs").insert(rows);
        if (migrationError) {
          console.error(migrationError);
          toast("Browser-only designs could not sync; local copies were kept.");
        } else {
          localStorage.removeItem("nova-horizon-designs");
          toast("Previous saved designs synced to your account");
        }
      }
      const { data, error } = await supabase.from("designs").select("id,name,design,created_at").order("updated_at", { ascending: false });
      if (error) { toast("Could not load your cloud designs"); console.error(error); return; }
      state.saved = (data || []).map(row => ({ ...row.design, cloudId: row.id, title: row.name }));
    } else {
      try { state.saved = JSON.parse(localStorage.getItem("nova-horizon-designs") || "[]"); } catch { state.saved=[]; }
    }
    renderSaved();
  }
  function renderSaved() {
    $("savedCount").textContent = state.saved.length;
    const root = $("savedDesigns"); root.replaceChildren();
    if (!state.saved.length) { const empty=document.createElement("div"); empty.className="saved-empty"; empty.textContent="Your saved Horizon concepts will appear here."; root.appendChild(empty); return; }
    state.saved.forEach((d,index)=>{
      const card=document.createElement("div"); card.className="saved-card";
      const thumb=document.createElement("div"); thumb.className="saved-thumb";
      const body=d.items.find(i=>i.type==="body"); if(body) thumb.style.background=body.color;
      const info=document.createElement("div"); info.className="saved-card-info";
      const name=document.createElement("b"); name.textContent=d.title || d.name || (d.design && d.design.title) || "Untitled project"; name.title=name.textContent;
      const sub=document.createElement("small"); sub.textContent=(Array.isArray(d.items)?d.items.length:0)+" components";
      info.append(name,sub);
      const load=document.createElement("button"); load.textContent="Open"; load.addEventListener("click",()=>{loadDesign(d);toast("Design opened");window.scrollTo({top:0,behavior:"smooth"});});
      const update=document.createElement("button"); update.textContent="Update with current design"; update.className="text-button"; update.setAttribute("aria-label","Replace "+(d.title || "saved design")+" with the current canvas design"); update.addEventListener("click",async()=>{
        const target=state.saved[index];
        if(!target)return;
        const targetName=target.title || "Horizon concept";
        if(!confirm("Replace “"+targetName+"” with the design currently on your canvas? This cannot be undone."))return;
        const current=serialize();
        current.title=targetName;
        if(state.user){
          if(!target.cloudId){toast("This saved design is local-only. Sign in to update cloud projects.");return;}
          const {error}=await supabase.from("designs").update({name:targetName,design:current,updated_at:new Date().toISOString()}).eq("id",target.cloudId).eq("user_id",state.user.id);
          if(error){console.error(error);toast("Could not update project. Please try again.");return;}
          state.saved[index]={...current,cloudId:target.cloudId,title:targetName};
        }else{
          state.saved[index]={...current,title:targetName};
          try{localStorage.setItem("nova-horizon-designs",JSON.stringify(state.saved));}catch(error){console.error(error);toast("Could not update this browser's saved project");return;}
        }
        renderSaved();toast("Project updated: "+targetName);
      });
      const remove=document.createElement("button"); remove.textContent="×"; remove.setAttribute("aria-label","Delete saved design"); remove.addEventListener("click",async()=>{const target=state.saved[index];if(state.user && target.cloudId){const {error}=await supabase.from("designs").delete().eq("id",target.cloudId);if(error){toast("Could not delete design");return;}}state.saved.splice(index,1);persistSaved();renderSaved();});
      card.append(thumb,info,load,update,remove); root.appendChild(card);
    });
  }
  async function persistSaved() {
    if (!state.user) { localStorage.setItem("nova-horizon-designs",JSON.stringify(state.saved)); renderSaved(); return; }
    // Cloud saves are written individually by save/delete actions, never shared across users.
    renderSaved();
  }
  async function saveDesign() {
    if (!state.user) { toast("Sign in with Google to save privately"); return; }
    const data=serialize(); data.title=prompt("Name this Horizon concept:", "Horizon concept "+(state.saved.length+1));
    if (data.title === null) return;
    data.title=data.title.trim() || "Horizon concept";
    const { data: row, error } = await supabase.from("designs").insert({ user_id: state.user.id, name: data.title, design: data }).select("id,name,design,created_at").single();
    if (error) { console.error(error); toast("Could not save design. Please try again."); return; }
    state.saved.unshift({ ...row.design, cloudId: row.id, title: row.name }); state.saved=state.saved.slice(0,30); renderSaved(); checkpointDesign(); toast("Design saved privately to your account");
  }
  function reset() {
    state.items=[]; state.nextId=1; initial.forEach(type=>state.items.push(makeItem(type)));
    // Make the second lens sit beside the first and use a simple, balanced camera layout.
    const lenses=state.items.filter(i=>i.type==="lens"); if(lenses[1]) {lenses[1].x=174;lenses[1].y=124;}
    state.items.forEach((item,index)=>item.layer=index);
    state.view="rear";state.selected=null;$("rearViewBtn").classList.add("active");$("frontViewBtn").classList.remove("active");$("internalViewBtn").classList.remove("active");$("topViewBtn").classList.remove("active");$("bottomViewBtn").classList.remove("active");$("canvasGrid").classList.remove("hidden");state.grid=true;$("gridBtn").classList.add("active");render();checkpointDesign();
  }
  function switchView(view) {
    if (!["rear","front","inside","top","bottom"].includes(view)) return;
    state.view = view;
    state.selected = null;
    $("rearViewBtn").classList.toggle("active", view === "rear");
    $("frontViewBtn").classList.toggle("active", view === "front");
    $("internalViewBtn").classList.toggle("active", view === "inside");
    $("topViewBtn").classList.toggle("active", view === "top");
    $("bottomViewBtn").classList.toggle("active", view === "bottom");
    render();
  }
  $("mobileNudge").addEventListener("click",ev=>{const btn=ev.target.closest("[data-nudge]");if(!btn)return;const item=selectedItem();if(!item){toast("Select a component first");return;}const step=4;const direction=btn.dataset.nudge;if(direction==="up")item.y=Math.max(0,item.y-step);if(direction==="down")item.y=Math.min(620-item.h,item.y+step);if(direction==="left")item.x=Math.max(0,item.x-step);if(direction==="right")item.x=Math.min(420-item.w,item.x+step);render();});
  document.querySelectorAll("#componentList [data-add], #internalComponentList [data-add]").forEach(btn=>{
    btn.addEventListener("click",()=>addItem(btn.dataset.add));
    btn.addEventListener("dragstart",ev=>{ev.dataTransfer.setData("text/plain",btn.dataset.add);ev.dataTransfer.effectAllowed="copy";});
  });
  const canvasArea=$("canvasArea");
  const bodyImageInput=$("bodyImageInput");
  function closeBodyContextMenu(){ $("bodyContextMenu").hidden=true; }
  $("insertBodyImageBtn").addEventListener("click",()=>{closeBodyContextMenu();if(contextBodyId===null)return;bodyImageInput.value="";bodyImageInput.click();});
  $("removeBodyImageBtn").addEventListener("click",()=>{const item=state.items.find(i=>i.id===contextBodyId);if(item){delete item.imageData;delete item.imageMime;render();toast("Phone body image removed");}closeBodyContextMenu();});
  bodyImageInput.addEventListener("change",()=>{
    const file=bodyImageInput.files&&bodyImageInput.files[0];
    const item=state.items.find(i=>i.id===contextBodyId);
    if(!file||!item)return;
    const allowedTypes=["image/jpeg","image/png"];
    const extOk=/\.(jpe?g|png)$/i.test(file.name);
    if(!allowedTypes.includes(file.type)||!extOk){toast("Choose a JPEG or PNG image");bodyImageInput.value="";return;}
    if(file.size>5*1024*1024){toast("Image must be 5 MB or smaller");bodyImageInput.value="";return;}
    const reader=new FileReader();
    reader.onload=()=>{if(typeof reader.result!=="string")return;item.imageData=reader.result;item.imageMime=file.type;render();toast("Image added to phone body");};
    reader.onerror=()=>toast("Could not read that image");
    reader.readAsDataURL(file);
  });
  canvasArea.addEventListener("contextmenu",ev=>{if(state.view==="rear"&&!ev.target.closest("[data-id]"))closeBodyContextMenu();});
  document.addEventListener("pointerdown",ev=>{if(!ev.target.closest("#bodyContextMenu"))closeBodyContextMenu();});
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape")closeBodyContextMenu();});
  canvasArea.addEventListener("dragover",ev=>{ev.preventDefault();canvasArea.classList.add("drag-over");if(ev.dataTransfer)ev.dataTransfer.dropEffect="copy";});
  canvasArea.addEventListener("dragleave",ev=>{if(!canvasArea.contains(ev.relatedTarget))canvasArea.classList.remove("drag-over");});
  canvasArea.addEventListener("drop",ev=>{ev.preventDefault();canvasArea.classList.remove("drag-over");const type=ev.dataTransfer.getData("text/plain");if(!defaults[type])return;const item=makeItem(type);const point=canvasPoint({clientX:ev.clientX,clientY:ev.clientY});item.x=Math.max(0,Math.min(420-item.w,point.x-item.w/2));item.y=Math.max(0,Math.min(620-item.h,point.y-item.h/2));state.items.push(item);if(item.view!=="both"&&item.view!==state.view){switchView(item.view);state.selected=item.id;render();}else{state.selected=item.id;render();}toast(item.name+" added to frame");});
  $("componentName").addEventListener("input",ev=>{const i=selectedItem();if(i){i.name=ev.target.value||"Component";$("selectionLabel").textContent=i.name+" selected";}});
  $("componentColor").addEventListener("input",ev=>setColor(ev.target.value));
  $("componentMaterial").addEventListener("change",ev=>{const item=selectedItem();if(!item)return;item.material=ev.target.value;render();});
  $("hexColor").addEventListener("change",ev=>{let v=ev.target.value.trim();if(!v.startsWith("#"))v="#"+v;if(validHex(v))setColor(v);else updateProperties();});
  $("presetColors").addEventListener("click",ev=>{const b=ev.target.closest("[data-color]");if(b)setColor(b.dataset.color);});
  $("posX").addEventListener("change",ev=>{const i=selectedItem();if(i&&!FIXED_TYPES.includes(i.type)&&i.type!=="motherboard"){i.x=Math.max(PHONE_BOUNDS.x,Math.min(PHONE_BOUNDS.x+PHONE_BOUNDS.w-i.w,Number(ev.target.value)||PHONE_BOUNDS.x));render();}});
  $("posY").addEventListener("change",ev=>{const i=selectedItem();if(i&&!FIXED_TYPES.includes(i.type)&&i.type!=="motherboard"){i.y=Math.max(PHONE_BOUNDS.y,Math.min(PHONE_BOUNDS.y+PHONE_BOUNDS.h-i.h,Number(ev.target.value)||PHONE_BOUNDS.y));render();}});
  $("sizeW").addEventListener("change",ev=>{const i=selectedItem();if(i&&!FIXED_TYPES.includes(i.type)&&i.type!=="motherboard"){i.w=Math.max(8,Math.min(PHONE_BOUNDS.x+PHONE_BOUNDS.w-i.x,Number(ev.target.value)||8));render();}});
  $("sizeH").addEventListener("change",ev=>{const i=selectedItem();if(i&&!FIXED_TYPES.includes(i.type)&&i.type!=="motherboard"){i.h=Math.max(8,Math.min(PHONE_BOUNDS.y+PHONE_BOUNDS.h-i.y,Number(ev.target.value)||8));render();}});
  $("rotation").addEventListener("input",ev=>{const i=selectedItem();if(i&&!FIXED_TYPES.includes(i.type)&&i.type!=="motherboard"){i.rotation=Number(ev.target.value);$("rotationValue").value=i.rotation+"°";render();}});
  $("duplicateBtn").addEventListener("click",()=>{const i=selectedItem();if(!i){toast("Select a component first");return;}const copy={...i,id:state.nextId++,name:i.name+" copy",x:Math.min(420-i.w,i.x+18),y:Math.min(620-i.h,i.y+18),layer:Math.max(...state.items.map(n=>n.layer))+1};state.items.push(copy);selectItem(copy.id);render();toast("Component duplicated");});
  $("deleteBtn").addEventListener("click",()=>{if(!state.selected){toast("Select a component first");return;}state.items=state.items.filter(i=>i.id!==state.selected);state.selected=null;render();toast("Component removed");});
  $("bringFrontBtn").addEventListener("click",()=>reorder(state.selected,"front"));
  $("sendBackBtn").addEventListener("click",()=>reorder(state.selected,"back"));
  $("rearViewBtn").addEventListener("click",()=>switchView("rear"));
  $("frontViewBtn").addEventListener("click",()=>switchView("front"));
  $("internalViewBtn").addEventListener("click",()=>switchView("inside"));
  $("topViewBtn").addEventListener("click",()=>switchView("top"));
  $("bottomViewBtn").addEventListener("click",()=>switchView("bottom"));
  $("gridBtn").addEventListener("click",()=>{state.grid=!state.grid;$("canvasGrid").classList.toggle("hidden",!state.grid);$("gridBtn").classList.toggle("active",state.grid);$("gridBtn").setAttribute("aria-pressed",String(state.grid));});
  $("saveBtn").addEventListener("click",saveDesign);
  async function updateAccountUI() {
    $("signInBtn").hidden = !!state.user;
    $("signOutBtn").hidden = !state.user;
    $("accountStatus").textContent = state.user ? (state.user.email || "Signed in") : "";
    $("saveDescription").textContent = state.user ? "Saved privately to your Google account." : "Sign in with Google to save designs privately to your account.";
    $("saveBtn").textContent = state.user ? "Save to my account ↗" : "Sign in to save ↗";
  }
  $("signInBtn").addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SITE_URL } });
    if (error) { console.error(error); toast("Google sign-in is not configured yet"); }
  });
  $("signOutBtn").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast("Could not sign out"); return; }
    state.user = null; state.saved = []; await loadSaved(); await updateAccountUI(); toast("Signed out");
  });
  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    await updateAccountUI();
    await loadSaved();
  });
  const settingsPanel=$("settingsPanel"),settingsBtn=$("settingsBtn"),themeToggle=$("themeToggle");
  function applyTheme(theme){const dark=theme==="dark";document.body.dataset.theme=dark?"dark":"light";themeToggle.setAttribute("aria-checked",String(dark));$("themeLabel").textContent=dark?"Dark":"Light";document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark?"#11141b":"#f7f8fb");try{localStorage.setItem("nova-studio-theme",dark?"dark":"light");}catch{}}
  try{applyTheme(localStorage.getItem("nova-studio-theme")==="dark"?"dark":"light");}catch{applyTheme("light");}
  settingsBtn.addEventListener("click",()=>{const opening=settingsPanel.hidden;settingsPanel.hidden=!opening;settingsBtn.setAttribute("aria-expanded",String(opening));if(opening)settingsPanel.scrollIntoView({behavior:"smooth",block:"nearest"});});
  $("closeSettingsBtn").addEventListener("click",()=>{settingsPanel.hidden=true;settingsBtn.setAttribute("aria-expanded","false");settingsBtn.focus();});
  themeToggle.addEventListener("click",()=>applyTheme(document.body.dataset.theme==="dark"?"light":"dark"));
  $("resetBtn").addEventListener("click",()=>{if(confirm("Reset the current Horizon design?")){reset();toast("Canvas reset");}});
  $("clearSavedBtn").addEventListener("click",async()=>{if(!state.saved.length)return;if(confirm(state.user?"Delete all saved concepts from your account?":"Delete all saved concepts from this browser?")){if(state.user){const {error}=await supabase.from("designs").delete().eq("user_id",state.user.id);if(error){toast("Could not clear cloud designs");return;}}state.saved=[];persistSaved();toast("Saved concepts cleared");}});
  $("exportBtn").addEventListener("click",()=>{
    const clone=canvas.cloneNode(true); clone.setAttribute("xmlns",svgNS); clone.setAttribute("width","840"); clone.setAttribute("height","1240");
    const xml=new XMLSerializer().serializeToString(clone); const blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="nova-horizon-design.svg";a.click();URL.revokeObjectURL(url);toast("SVG design exported");
  });
  reset(); updateAccountUI(); loadSaved();
})();