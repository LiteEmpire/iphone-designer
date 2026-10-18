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
    cpu: { name: "Nova CPU · N1", x: 145, y: 165, w: 118, h: 58, color: "#4b638c", radius: 8, layer: 8 },
    gpu: { name: "Nova GPU · NG1", x: 145, y: 238, w: 118, h: 58, color: "#536b56", radius: 8, layer: 9 },
    ram: { name: "Nova RAM · NR1", x: 145, y: 311, w: 118, h: 42, color: "#a77b48", radius: 7, layer: 10 },
    ssd: { name: "Nova SSD · NS1", x: 145, y: 366, w: 118, h: 42, color: "#76619c", radius: 7, layer: 11 },
    screen: { name: "Display", x: 127, y: 98, w: 166, h: 384, color: "#252b38", radius: 25, layer: 1 },
    camera: { name: "Camera module", x: 132, y: 112, w: 76, h: 94, color: "#343a47", radius: 18, layer: 2 },
    lens: { name: "Camera lens", x: 145, y: 124, w: 25, h: 25, color: "#111827", radius: 13, layer: 3 },
    flash: { name: "Flash", x: 181, y: 131, w: 13, h: 13, color: "#f4dca2", radius: 7, layer: 4 },
    logo: { name: "Nova logo", x: 191, y: 280, w: 44, h: 44, color: "#657084", radius: 22, layer: 5 },
    button: { name: "Side button", x: 302, y: 205, w: 8, h: 58, color: "#9da5b2", radius: 4, layer: 6 },
    detail: { name: "Custom detail", x: 220, y: 350, w: 40, h: 24, color: "#91a8c7", radius: 8, layer: 7 }
  };
  const initial = ["body", "screen", "camera", "lens", "lens", "flash", "logo", "button"];
  let toastTimer;
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function makeItem(type, overrides = {}) {
    const d = defaults[type] || defaults.detail;
    const defaultView = ["body", "button"].includes(type) ? "both" : type === "screen" ? "front" : ["camera", "lens", "flash", "logo"].includes(type) ? "rear" : ["nc", "cpu", "gpu", "ram", "ssd"].includes(type) ? "inside" : state.view;
    const item = { id: state.nextId++, type, name: d.name, x: d.x, y: d.y, w: d.w, h: d.h, color: d.color, radius: d.radius || 0, rotation: 0, layer: type === "nc" ? -1 : state.items.length, view: defaultView, ...overrides };
    if (type === "lens" && state.items.some(i => i.type === "lens")) {
      const count = state.items.filter(i => i.type === "lens").length;
      item.x = d.x + (count % 2) * 31; item.y = d.y + Math.floor(count / 2) * 31;
    }
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
    if (item.type === "nc") {
      shape = el("g");
      // Compound even-odd path: the interior subpaths are real transparent cutouts,
      // not painted-on rectangles. Layout is a conceptual smartphone midframe.
      const x=item.x, y=item.y, w=item.w, h=item.h;
      const holes = [
        // Rear camera cluster at the upper-left.
        `M ${x+12} ${y+12} h 62 a 8 8 0 0 1 8 8 v 78 a 8 8 0 0 1 -8 8 h -62 a 8 8 0 0 1 -8 -8 v -78 a 8 8 0 0 1 8 -8 Z`,
        // Main-board/chip area.
        `M ${x+91} ${y+20} h 105 a 7 7 0 0 1 7 7 v 175 a 7 7 0 0 1 -7 7 h -105 a 7 7 0 0 1 -7 -7 v -175 a 7 7 0 0 1 7 -7 Z`,
        // Battery cavity.
        `M ${x+28} ${y+145} h 50 a 8 8 0 0 1 8 8 v 142 a 8 8 0 0 1 -8 8 h -50 a 8 8 0 0 1 -8 -8 v -142 a 8 8 0 0 1 8 -8 Z`,
        // Lower daughterboard / loudspeaker well.
        `M ${x+91} ${y+310} h 105 a 7 7 0 0 1 7 7 v 43 a 7 7 0 0 1 -7 7 h -105 a 7 7 0 0 1 -7 -7 v -43 a 7 7 0 0 1 7 -7 Z`,
        // USB-C port opening and screw/mounting holes.
        `M ${x+w/2-17} ${y+h-9} h 34 a 4 4 0 0 1 4 4 v 8 h -42 v -8 a 4 4 0 0 1 4 -4 Z`
      ].join(" ");
      const outer = `M ${x+22} ${y} H ${x+w-22} Q ${x+w} ${y} ${x+w} ${y+22} V ${y+h-22} Q ${x+w} ${y+h} ${x+w-22} ${y+h} H ${x+22} Q ${x} ${y+h} ${x} ${y+h-22} V ${y+22} Q ${x} ${y} ${x+22} ${y} Z`;
      shape.appendChild(el("path", {d:outer+" "+holes,fill:item.color,stroke:"#d8dee8","stroke-width":3,"fill-rule":"evenodd","fill-opacity":0.96}));
      // Reinforcing ribs and screw bosses around the component cavities.
      [[x+10,y+105],[x+w-10,y+105],[x+10,y+285],[x+w-10,y+285],[x+18,y+h-25],[x+w-18,y+h-25]].forEach(([cx,cy])=>{
        shape.appendChild(el("circle",{cx,cy,r:4,fill:"#4b5565",stroke:"#e2e8f0","stroke-width":1.3}));
      });
      // Small rail details make the frame look machined rather than like a plain plate.
      shape.appendChild(el("path",{d:`M ${x+83} ${y+22} v 100 M ${x+83} ${y+140} v 150 M ${x+87} ${y+312} v 42`,fill:"none",stroke:"#d8dee8","stroke-width":2,"stroke-linecap":"round"}));
    } else if (["cpu","gpu","ram","ssd"].includes(item.type)) {
      shape = el("rect", {x:item.x,y:item.y,width:item.w,height:item.h,rx:item.radius||8,fill:item.color,stroke:"#ffffff99","stroke-width":1.5});
    } else if (item.type === "logo") {
      shape = el("text", { x: item.x + item.w/2, y: item.y + item.h*.72, "text-anchor":"middle", "font-family":"Space Grotesk, sans-serif", "font-size":Math.max(12,item.w*.65), "font-weight":"700", fill:item.color });
      shape.textContent = "N";
    } else if (item.type === "lens") {
      shape = el("g");
      shape.appendChild(el("circle", {cx:item.x+item.w/2,cy:item.y+item.h/2,r:Math.min(item.w,item.h)*.49,fill:item.color,stroke:"#8792a5","stroke-width":2}));
      shape.appendChild(el("circle", {cx:item.x+item.w/2,cy:item.y+item.h/2,r:Math.min(item.w,item.h)*.29,fill:"#263c5a",stroke:"#617da5","stroke-width":2}));
      shape.appendChild(el("circle", {cx:item.x+item.w*.39,cy:item.y+item.h*.35,r:Math.min(item.w,item.h)*.09,fill:"#dbeafe","fill-opacity":.8}));
    } else if (item.type === "flash") {
      shape = el("circle", {cx:item.x+item.w/2,cy:item.y+item.h/2,r:Math.min(item.w,item.h)/2,fill:item.color,stroke:"#b6bbc5","stroke-width":1.5});
    } else {
      const radius = item.type === "body" ? Math.min(item.w,item.h)*.16 : Math.min(item.radius || 8,item.w/2,item.h/2);
      shape = el("rect", {x:item.x,y:item.y,width:item.w,height:item.h,rx:radius,fill:item.color,stroke:item.type==="body"?"#9ca5b4":"#ffffff55","stroke-width":item.type==="body"?2:1});
      if (item.type === "screen") {
        shape.setAttribute("stroke","#111827");
      }
      if (item.type === "camera") {
        shape.setAttribute("stroke","#555e6e"); shape.setAttribute("stroke-width","1.5");
      }
    }
    group.appendChild(shape);
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
      group.appendChild(el("circle",{cx:item.x+item.w+3,cy:item.y+item.h+3,r:6,fill:"#355fe8",stroke:"#fff","stroke-width":2,"data-resize":item.id,cursor:"nwse-resize"}));
    }
    group.addEventListener("pointerdown", ev => startPointer(ev,item.id, ev.target.hasAttribute("data-resize")));
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
    $("canvasTitle").textContent = "Horizon · " + (state.view === "rear" ? "Rear design" : state.view === "front" ? "Front design" : "Internal layout");
    $("dropHint").classList.toggle("hidden", state.items.some(i => isVisibleInView(i)));
    $("componentCount").textContent = state.items.length;
  }
  function isVisibleInView(item) {
    // Older saved designs do not have a view property; infer their original component side.
    const side = item.view || (["body", "button"].includes(item.type) ? "both" : item.type === "screen" ? "front" : ["camera", "lens", "flash", "logo"].includes(item.type) ? "rear" : ["nc", "cpu", "gpu", "ram", "ssd"].includes(item.type) ? "inside" : "both");
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
    $("posX").value = Math.round(item.x); $("posY").value = Math.round(item.y);
    $("sizeW").value = Math.round(item.w); $("sizeH").value = Math.round(item.h);
    $("rotation").value = item.rotation; $("rotationValue").value = item.rotation + "°";
  }
  function validHex(value) { return /^#[0-9a-f]{6}$/i.test(value); }
  function setColor(value) {
    const item = selectedItem(); if (!item || !validHex(value)) return;
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
    state.selected = id;
    render();
    const point = canvasPoint(ev);
    pointer = { id, startX: point.x, startY: point.y, x:item.x, y:item.y, w:item.w, h:item.h, resizing };
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
      item.w = Math.max(8,Math.min(420-item.x,pointer.w+dx));
      item.h = Math.max(8,Math.min(620-item.y,pointer.h+dy));
    } else {
      item.x = Math.max(0,Math.min(420-item.w,pointer.x+moveX));
      item.y = Math.max(0,Math.min(620-item.h,pointer.y+dy));
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
    state.nextId = Math.max(0,...state.items.map(i=>i.id))+1; state.view=data.view||"rear"; state.selected=null;
    $("rearViewBtn").classList.toggle("active",state.view==="rear"); $("frontViewBtn").classList.toggle("active",state.view==="front"); $("internalViewBtn").classList.toggle("active",state.view==="inside"); render();
  }
  async function loadSaved() {
    if (state.user) {
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
      const name=document.createElement("b"); name.textContent=d.title || "Horizon concept";
      const sub=document.createElement("small"); sub.textContent=d.items.length+" components";
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
    state.saved.unshift({ ...row.design, cloudId: row.id, title: row.name }); state.saved=state.saved.slice(0,30); renderSaved(); toast("Design saved privately to your account");
  }
  function reset() {
    state.items=[]; state.nextId=1; initial.forEach(type=>state.items.push(makeItem(type)));
    // Make the second lens sit beside the first and use a simple, balanced camera layout.
    const lenses=state.items.filter(i=>i.type==="lens"); if(lenses[1]) {lenses[1].x=174;lenses[1].y=124;}
    state.items.forEach((item,index)=>item.layer=index);
    state.view="rear";state.selected=null;$("rearViewBtn").classList.add("active");$("frontViewBtn").classList.remove("active");$("internalViewBtn").classList.remove("active");$("canvasGrid").classList.remove("hidden");state.grid=true;$("gridBtn").classList.add("active");render();
  }
  function switchView(view) {
    if (view !== "rear" && view !== "front" && view !== "inside") return;
    state.view = view;
    state.selected = null;
    $("rearViewBtn").classList.toggle("active", view === "rear");
    $("frontViewBtn").classList.toggle("active", view === "front");
    $("internalViewBtn").classList.toggle("active", view === "inside");
    render();
  }
  $("mobileNudge").addEventListener("click",ev=>{const btn=ev.target.closest("[data-nudge]");if(!btn)return;const item=selectedItem();if(!item){toast("Select a component first");return;}const step=4;const direction=btn.dataset.nudge;if(direction==="up")item.y=Math.max(0,item.y-step);if(direction==="down")item.y=Math.min(620-item.h,item.y+step);if(direction==="left")item.x=Math.max(0,item.x-step);if(direction==="right")item.x=Math.min(420-item.w,item.x+step);render();});
  document.querySelectorAll("#componentList [data-add], #internalComponentList [data-add]").forEach(btn=>{
    btn.addEventListener("click",()=>addItem(btn.dataset.add));
    btn.addEventListener("dragstart",ev=>{ev.dataTransfer.setData("text/plain",btn.dataset.add);ev.dataTransfer.effectAllowed="copy";});
  });
  const canvasArea=$("canvasArea");
  canvasArea.addEventListener("dragover",ev=>{ev.preventDefault();canvasArea.classList.add("drag-over");if(ev.dataTransfer)ev.dataTransfer.dropEffect="copy";});
  canvasArea.addEventListener("dragleave",ev=>{if(!canvasArea.contains(ev.relatedTarget))canvasArea.classList.remove("drag-over");});
  canvasArea.addEventListener("drop",ev=>{ev.preventDefault();canvasArea.classList.remove("drag-over");const type=ev.dataTransfer.getData("text/plain");if(!defaults[type])return;const item=makeItem(type);const point=canvasPoint({clientX:ev.clientX,clientY:ev.clientY});item.x=Math.max(0,Math.min(420-item.w,point.x-item.w/2));item.y=Math.max(0,Math.min(620-item.h,point.y-item.h/2));state.items.push(item);if(item.view!=="both"&&item.view!==state.view){switchView(item.view);state.selected=item.id;render();}else{state.selected=item.id;render();}toast(item.name+" added to frame");});
  $("componentName").addEventListener("input",ev=>{const i=selectedItem();if(i){i.name=ev.target.value||"Component";$("selectionLabel").textContent=i.name+" selected";}});
  $("componentColor").addEventListener("input",ev=>setColor(ev.target.value));
  $("hexColor").addEventListener("change",ev=>{let v=ev.target.value.trim();if(!v.startsWith("#"))v="#"+v;if(validHex(v))setColor(v);else updateProperties();});
  $("presetColors").addEventListener("click",ev=>{const b=ev.target.closest("[data-color]");if(b)setColor(b.dataset.color);});
  $("posX").addEventListener("change",ev=>{const i=selectedItem();if(i){i.x=Math.max(0,Math.min(420-i.w,Number(ev.target.value)||0));render();}});
  $("posY").addEventListener("change",ev=>{const i=selectedItem();if(i){i.y=Math.max(0,Math.min(620-i.h,Number(ev.target.value)||0));render();}});
  $("sizeW").addEventListener("change",ev=>{const i=selectedItem();if(i){i.w=Math.max(8,Math.min(420,Number(ev.target.value)||8));render();}});
  $("sizeH").addEventListener("change",ev=>{const i=selectedItem();if(i){i.h=Math.max(8,Math.min(620,Number(ev.target.value)||8));render();}});
  $("rotation").addEventListener("input",ev=>{const i=selectedItem();if(i){i.rotation=Number(ev.target.value);$("rotationValue").value=i.rotation+"°";render();}});
  $("duplicateBtn").addEventListener("click",()=>{const i=selectedItem();if(!i){toast("Select a component first");return;}const copy={...i,id:state.nextId++,name:i.name+" copy",x:Math.min(420-i.w,i.x+18),y:Math.min(620-i.h,i.y+18),layer:Math.max(...state.items.map(n=>n.layer))+1};state.items.push(copy);selectItem(copy.id);render();toast("Component duplicated");});
  $("deleteBtn").addEventListener("click",()=>{if(!state.selected){toast("Select a component first");return;}state.items=state.items.filter(i=>i.id!==state.selected);state.selected=null;render();toast("Component removed");});
  $("bringFrontBtn").addEventListener("click",()=>reorder(state.selected,"front"));
  $("sendBackBtn").addEventListener("click",()=>reorder(state.selected,"back"));
  $("rearViewBtn").addEventListener("click",()=>switchView("rear"));
  $("frontViewBtn").addEventListener("click",()=>switchView("front"));
  $("internalViewBtn").addEventListener("click",()=>switchView("inside"));
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