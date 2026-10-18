(() => {
  const $ = (id) => document.getElementById(id);
  const svgNS = "http://www.w3.org/2000/svg";
  const canvas = $("designCanvas");
  const state = { view: "rear", grid: true, selected: null, nextId: 1, items: [], saved: [] };
  const defaults = {
    body: { name: "Phone body", x: 115, y: 85, w: 190, h: 410, color: "#d9dde5", radius: 31, layer: 0 },
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
    const defaultView = ["body", "button"].includes(type) ? "both" : type === "screen" ? "front" : ["camera", "lens", "flash", "logo"].includes(type) ? "rear" : state.view;
    const item = { id: state.nextId++, type, name: d.name, x: d.x, y: d.y, w: d.w, h: d.h, color: d.color, radius: d.radius || 0, rotation: 0, layer: state.items.length, view: defaultView, ...overrides };
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
    if (item.type === "logo") {
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
    sorted.filter(item => isVisibleInView(item)).forEach(item => {\n      // A phone viewed from the front shows its side button on the opposite edge.\n      const visualItem = item.type === "button" && state.view === "front"\n        ? { ...item, x: 420 - item.x - item.w }\n        : item;\n      canvas.appendChild(shapeFor(visualItem));\n    });
    updateProperties();
    $("selectionLabel").textContent = selectedItem() ? selectedItem().name + " selected" : "No component selected";
    $("canvasTitle").textContent = "Horizon · " + (state.view === "rear" ? "Rear design" : "Front design");
  }
  function isVisibleInView(item) {
    // Older saved designs do not have a view property; infer their original component side.
    const side = item.view || (["body", "button"].includes(item.type) ? "both" : item.type === "screen" ? "front" : ["camera", "lens", "flash", "logo"].includes(item.type) ? "rear" : "both");
    return side === "both" || side === state.view;
  }
  function selectItem(id) { state.selected = id; updateProperties(); }
  function updateProperties() {
    const item = selectedItem();
    $("emptyProperties").hidden = !!item;
    $("propertyControls").hidden = !item;
    if (!item) { $("selectionLabel").textContent = "No component selected"; return; }
    $("selectionLabel").textContent = item.name + " selected";
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
    const realItem = state.items.find(i => i.id === pointer.id);\n    const dx = point.x-pointer.startX, dy = point.y-pointer.startY;\n    // In the front view, horizontal dragging of the mirrored side button is reversed.\n    const moveX = realItem && realItem.type === "button" && state.view === "front" ? -dx : dx;
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
    $("rearViewBtn").classList.toggle("active",state.view==="rear"); $("frontViewBtn").classList.toggle("active",state.view==="front"); render();
  }
  function loadSaved() {
    try { state.saved = JSON.parse(localStorage.getItem("nova-horizon-designs") || "[]"); } catch { state.saved=[]; }
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
      const remove=document.createElement("button"); remove.textContent="×"; remove.setAttribute("aria-label","Delete saved design"); remove.addEventListener("click",()=>{state.saved.splice(index,1);persistSaved();renderSaved();});
      card.append(thumb,info,load,remove); root.appendChild(card);
    });
  }
  function persistSaved() { localStorage.setItem("nova-horizon-designs",JSON.stringify(state.saved)); renderSaved(); }
  function saveDesign() {
    const data=serialize(); data.title=prompt("Name this Horizon concept:", "Horizon concept "+(state.saved.length+1));
    if (data.title === null) return;
    data.title=data.title.trim() || "Horizon concept";
    state.saved.unshift(data); state.saved=state.saved.slice(0,30); persistSaved(); toast("Horizon concept saved on this device");
  }
  function reset() {
    state.items=[]; state.nextId=1; initial.forEach(type=>state.items.push(makeItem(type)));
    // Make the second lens sit beside the first and use a simple, balanced camera layout.
    const lenses=state.items.filter(i=>i.type==="lens"); if(lenses[1]) {lenses[1].x=174;lenses[1].y=124;}
    state.items.forEach((item,index)=>item.layer=index);
    state.view="rear";state.selected=null;$("rearViewBtn").classList.add("active");$("frontViewBtn").classList.remove("active");$("canvasGrid").classList.remove("hidden");state.grid=true;$("gridBtn").classList.add("active");render();
  }
  function switchView(view) {
    if (view !== "rear" && view !== "front") return;
    state.view = view;
    state.selected = null;
    $("rearViewBtn").classList.toggle("active", view === "rear");
    $("frontViewBtn").classList.toggle("active", view === "front");
    render();
  }
  $("mobileNudge").addEventListener("click",ev=>{const btn=ev.target.closest("[data-nudge]");if(!btn)return;const item=selectedItem();if(!item){toast("Select a component first");return;}const step=4;const direction=btn.dataset.nudge;if(direction==="up")item.y=Math.max(0,item.y-step);if(direction==="down")item.y=Math.min(620-item.h,item.y+step);if(direction==="left")item.x=Math.max(0,item.x-step);if(direction==="right")item.x=Math.min(420-item.w,item.x+step);render();});
  $("componentList").addEventListener("click",ev=>{const btn=ev.target.closest("[data-add]");if(btn)addItem(btn.dataset.add);});
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
  $("gridBtn").addEventListener("click",()=>{state.grid=!state.grid;$("canvasGrid").classList.toggle("hidden",!state.grid);$("gridBtn").classList.toggle("active",state.grid);$("gridBtn").setAttribute("aria-pressed",String(state.grid));});
  $("saveBtn").addEventListener("click",saveDesign);
  $("resetBtn").addEventListener("click",()=>{if(confirm("Reset the current Horizon design?")){reset();toast("Canvas reset");}});
  $("clearSavedBtn").addEventListener("click",()=>{if(!state.saved.length)return;if(confirm("Delete all saved concepts from this browser?")){state.saved=[];persistSaved();toast("Saved concepts cleared");}});
  $("exportBtn").addEventListener("click",()=>{
    const clone=canvas.cloneNode(true); clone.setAttribute("xmlns",svgNS); clone.setAttribute("width","840"); clone.setAttribute("height","1240");
    const xml=new XMLSerializer().serializeToString(clone); const blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="nova-horizon-design.svg";a.click();URL.revokeObjectURL(url);toast("SVG design exported");
  });
  reset(); loadSaved();
})();