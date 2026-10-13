import * as THREE from "three";

const $ = (id) => document.getElementById(id);
const wrap = $("canvasWrap");
const state = { model:"iPhone 17 Pro", color:"#f4f0e9", colorName:"Starlight", finish:"matte", clearCase:false, sticker:false, name:"My dream iPhone", view:"front" };

// Dimensions are based on Apple's published height, width and depth specifications where available.
// Ratios are preserved in the preview; the generation-specific details below are modeled separately.
const models = {
 "iPhone 17 Pro": {mm:[150,71.9,8.75],family:"pro17",edge:"flat",screen:"island",cams:3,camStyle:"bar",action:true,cameraControl:true,corner:.105,bezel:.035},
 "iPhone 17 Pro Max": {mm:[163.4,78,8.75],family:"pro17",edge:"flat",screen:"island",cams:3,camStyle:"bar",action:true,cameraControl:true,corner:.11,bezel:.035},
 "iPhone 17": {mm:[149.6,71.5,7.95],family:"base17",edge:"flat",screen:"island",cams:2,camStyle:"verticalPill",action:true,cameraControl:true,corner:.12,bezel:.036},
 "iPhone 16 Pro": {mm:[149.6,71.5,8.25],family:"pro16",edge:"flat",screen:"island",cams:3,camStyle:"squareTriple",action:true,cameraControl:true,corner:.085,bezel:.034},
 "iPhone 16 Pro Max": {mm:[163,77.6,8.25],family:"pro16",edge:"flat",screen:"island",cams:3,camStyle:"squareTriple",action:true,cameraControl:true,corner:.09,bezel:.034},
 "iPhone 16": {mm:[147.6,71.6,7.8],family:"base16",edge:"flat",screen:"island",cams:2,camStyle:"verticalPill",action:true,cameraControl:true,corner:.12,bezel:.036},
 "iPhone 15 Pro": {mm:[146.6,70.6,8.25],family:"pro15",edge:"softFlat",screen:"island",cams:3,camStyle:"squareTriple",action:true,cameraControl:false,corner:.085,bezel:.034},
 "iPhone 15 Pro Max": {mm:[159.9,76.7,8.25],family:"pro15",edge:"softFlat",screen:"island",cams:3,camStyle:"squareTriple",action:true,cameraControl:false,corner:.09,bezel:.034},
 "iPhone 15": {mm:[147.6,71.6,7.8],family:"base15",edge:"softFlat",screen:"island",cams:2,camStyle:"diagonal",action:false,cameraControl:false,corner:.12,bezel:.038},
 "iPhone 14 Pro": {mm:[147.5,71.5,7.85],family:"pro14",edge:"flat",screen:"island",cams:3,camStyle:"squareTriple",action:false,cameraControl:false,corner:.085,bezel:.035},
 "iPhone 14": {mm:[146.7,71.5,7.8],family:"base14",edge:"flat",screen:"notch",cams:2,camStyle:"diagonal",action:false,cameraControl:false,corner:.12,bezel:.04},
 "iPhone 13": {mm:[146.7,71.5,7.65],family:"base13",edge:"flat",screen:"notchSmall",cams:2,camStyle:"diagonal",action:false,cameraControl:false,corner:.12,bezel:.042},
 "iPhone 12": {mm:[146.7,71.5,7.4],family:"base12",edge:"flat",screen:"notchSmall",cams:2,camStyle:"diagonal",action:false,cameraControl:false,corner:.12,bezel:.043},
 "iPhone 11": {mm:[150.9,75.7,8.3],family:"base11",edge:"round",screen:"notch",cams:2,camStyle:"squareDual",action:false,cameraControl:false,corner:.16,bezel:.055},
 "iPhone XS": {mm:[143.6,70.9,7.7],family:"xs",edge:"round",screen:"notch",cams:2,camStyle:"vertical",action:false,cameraControl:false,corner:.16,bezel:.055},
 "iPhone X": {mm:[143.6,70.9,7.7],family:"x",edge:"round",screen:"notch",cams:2,camStyle:"vertical",action:false,cameraControl:false,corner:.16,bezel:.055},
 "iPhone 8": {mm:[138.4,67.3,7.3],family:"home",edge:"round",screen:"home",cams:1,camStyle:"single",action:false,cameraControl:false,corner:.13,bezel:.095},
 "iPhone SE (2nd / 3rd gen)": {mm:[138.4,67.3,7.3],family:"home",edge:"round",screen:"home",cams:1,camStyle:"single",action:false,cameraControl:false,corner:.13,bezel:.095},
 "My concept phone": {mm:[150,72,8.2],family:"concept",edge:"flat",screen:"island",cams:3,camStyle:"squareTriple",action:true,cameraControl:true,corner:.11,bezel:.04}
};
let scene,camera,renderer,phone,bodyMat,screenMat,caseMesh,stickerMesh,dragging=false,lastX=0,lastY=0,toastTimer;
const mats=(color,rough=.35,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
function roundedBox(w,h,d,r,material){
 const shape=new THREE.Shape(),x=-w/2,y=-h/2;
 shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
 shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
 shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(r*.24,d*.16),bevelThickness:Math.min(r*.24,d*.16),curveSegments:12});
 geo.translate(0,0,-d/2);return new THREE.Mesh(geo,material);
}
function addBox(parent,w,h,d,x,y,z,mat,r=.02){const mesh=roundedBox(w,h,d,r,mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function addDisc(parent,r,depth,x,y,z,mat,segments=32){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,segments),mat);mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function addSlot(parent,w,h,d,x,y,z,mat){return addBox(parent,w,h,d,x,y,z,mat,Math.min(w,h)*.48);}
function cameraLens(parent,x,y,z,r,scale=1){
 const rim=mats("#171923",.24,.42),glass=mats("#243c60",.12,.32),glint=mats("#83bce9",.14,.22);
 addDisc(parent,r*1.16,.025,x,y,z,rim,40);addDisc(parent,r,.016,x,y,z-.018,glass,40);
 const shine=new THREE.Mesh(new THREE.CircleGeometry(r*.24,20),glint);shine.position.set(x-r*.25,y+r*.25,z-.029);parent.add(shine);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(r*.12,16),mats("#111b30",.1,.1));inner.position.set(x+r*.18,y-r*.18,z-.03);parent.add(inner);
}
function addCameraIsland(parent,cfg,w,h,d,metalColor){
 const z=-d/2-.022, x0=-w*.29, y0=h*.335;
 const islandMat=mats(cfg.family==="pro17"?"#777b82":metalColor,.42,.28);
 const lensMat=mats("#11141c",.2,.35);
 if(cfg.camStyle==="bar"){
   // The 17 Pro family uses a wide, horizontal camera plateau rather than the older compact square.
   addBox(parent,w*.88,.48,.075,0,y0,z-.015,islandMat,.10);
   const p=[[x0-.015,y0+.11],[x0+.18,y0+.11],[x0+.08,y0-.13]];
   p.forEach(([x,y])=>cameraLens(parent,x,y,z-.065,.085));
   addDisc(parent,.036,.018,w*.32,y0+.13,z-.065,mats("#f6f0dc",.2,.05),24);
   addDisc(parent,.021,.018,w*.32,y0-.12,z-.065,mats("#242833",.2,.1),24);
   return;
 }
 if(cfg.camStyle==="verticalPill"){
   addBox(parent,.32,.62,.055,x0,y0,z,islandMat,.15);
   cameraLens(parent,x0,y0+.13,z-.042,.082);
   cameraLens(parent,x0,y0-.13,z-.042,.082);
   addDisc(parent,.027,.015,x0+.18,y0-.12,z-.043,mats("#fff0c9",.25),24);
   addDisc(parent,.014,.015,x0+.18,y0+.12,z-.043,mats("#303541",.2),20);
   return;
 }
 if(cfg.camStyle==="squareTriple" || cfg.camStyle==="squareDual"){
   const size=cfg.camStyle==="squareTriple"?.52:.47;
   addBox(parent,size,size,.065,x0,y0,z,islandMat,.09);
   if(cfg.camStyle==="squareTriple"){
     cameraLens(parent,x0-.12,y0+.13,z-.055,.078);
     cameraLens(parent,x0+.12,y0+.13,z-.055,.078);
     cameraLens(parent,x0-.12,y0-.12,z-.055,.078);
     addDisc(parent,.028,.018,x0+.13,y0-.12,z-.055,mats("#fff0c9",.22),24);
     addDisc(parent,.017,.018,x0+.13,y0-.005,z-.055,mats("#252a35",.2),20);
   } else {
     cameraLens(parent,x0-.11,y0+.12,z-.055,.078);
     cameraLens(parent,x0+.11,y0-.12,z-.055,.078);
     addDisc(parent,.027,.018,x0+.13,y0+.12,z-.055,mats("#fff0c9",.22),24);
   }
   return;
 }
 if(cfg.camStyle==="diagonal"){
   addBox(parent,.43,.47,.06,x0,y0,z,islandMat,.09);
   cameraLens(parent,x0-.095,y0+.105,z-.05,.078);
   cameraLens(parent,x0+.095,y0-.105,z-.05,.078);
   addDisc(parent,.027,.016,x0+.105,y0+.12,z-.052,mats("#fff0c9",.22),24);
   addDisc(parent,.013,.016,x0-.12,y0-.12,z-.052,mats("#2b303a",.2),20);
   return;
 }
 if(cfg.camStyle==="vertical"){
   addBox(parent,.30,.55,.05,x0,y0,z,islandMat,.07);
   cameraLens(parent,x0,y0+.12,z-.043,.075);cameraLens(parent,x0,y0-.12,z-.043,.075);
   addDisc(parent,.022,.014,x0+.12,y0-.12,z-.044,mats("#fff0c9",.2),20);
   return;
 }
 // iPhone 8 / SE: single camera without a large multi-camera island.
 cameraLens(parent,x0,y0,z-.02,.085);
 addDisc(parent,.027,.014,x0+.14,y0,z-.022,mats("#fff0c9",.2),24);
}
function buildPhone(){
 if(phone)scene.remove(phone);
 const cfg=models[state.model]||models["iPhone 17 Pro"];
 const [mmH,mmW,mmD]=cfg.mm;
 const h=mmH/75,w=mmW/75,d=mmD/75;
 phone=new THREE.Group();scene.add(phone);
 const finishMetal=state.finish==="metal";
 const frameColor=finishMetal?"#c3c6ce":state.color;
 const metal=mats(frameColor,state.finish==="matte"?.72:state.finish==="glossy"?.13:.28,finishMetal?.82:.42);
 bodyMat=metal;
 // Outer frame and generation-appropriate corner profile.
 addBox(phone,w,h,d,0,0,0,metal,cfg.corner);
 const backColor=mats(state.color,state.finish==="glossy"?.16:state.finish==="matte"?.72:.32,finishMetal?.15:.03);
 addBox(phone,w-.035,h-.035,.012,0,0,-d/2-.003,backColor,Math.max(.045,cfg.corner-.018));
 // Front glass is inset by the model's characteristic bezel amount.
 const screen=mats("#070910",.16,.06);screenMat=screen;
 const sw=w-cfg.bezel*2, sh=h-cfg.bezel*2;
 addBox(phone,sw,sh,.014,0,0,d/2+.006,screen,Math.max(.04,cfg.corner-cfg.bezel*.6));
 const edge=mats("#090b12",.2,.2);
 if(cfg.screen==="island"){
   addSlot(phone,w*.27,.074,.016,0,h*.405,d/2+.019,edge);
   addDisc(phone,.015,.015,w*.102,h*.405,d/2+.02,mats("#19253c",.2,.2),24);
 } else if(cfg.screen==="notch"||cfg.screen==="notchSmall"){
   const notchW=cfg.screen==="notchSmall"?w*.34:w*.39;
   addSlot(phone,notchW,.105,.018,0,h*.425,d/2+.02,edge);
   addDisc(phone,.017,.015,notchW*.25,h*.425,d/2+.022,mats("#1b2b45",.2,.2),24);
   addBox(phone,notchW*.25,.009,.016,0,h*.385,d/2+.02,mats("#282b34",.25,.1),.004);
 } else {
   // iPhone 8 / SE have broad top and bottom bezels with a circular Home button.
   addSlot(phone,w*.23,.018,.014,0,h*.405,d/2+.02,edge);
   const homeR=w*.095;
   addDisc(phone,homeR,.018,0,-h*.405,d/2+.02,mats("#171923",.28,.18),40);
   const homeRing=new THREE.Mesh(new THREE.TorusGeometry(homeR*.72,.004,8,40),mats("#52535a",.28,.3));
   homeRing.position.set(0,-h*.405,d/2+.033);phone.add(homeRing);
 }
 // Side controls: older generations have a mute switch; Action button and Camera Control appear only on supported families.
 const btnDepth=d*.46;
 addSlot(phone,.025,.19,btnDepth,w/2+.006,h*.20,0,metal);
 if(cfg.cameraControl) addSlot(phone,.022,.16,btnDepth,w/2+.007,-h*.06,0,metal);
 if(cfg.action) addSlot(phone,.025,.075,btnDepth,-w/2-.006,h*.28,0,metal);
 else addSlot(phone,.024,.055,btnDepth,-w/2-.006,h*.31,0,metal);
 addSlot(phone,.025,.15,btnDepth,-w/2-.006,h*.12,0,metal);
 addSlot(phone,.025,.15,btnDepth,-w/2-.006,-h*.02,0,metal);
 // Back camera layout varies by model generation, not just by lens count.
 addCameraIsland(phone,cfg,w,h,d,finishMetal?"#b7bac4":state.color);
 // Bottom edge: USB-C on iPhone 15 and newer, Lightning on earlier models; simplified port and speaker perforations.
 const portMat=mats("#161922",.3,.2);
 const usbC=Number((state.model.match(/iPhone (\d+)/)||[])[1]||0)>=15 || state.model==="iPhone 17" || state.model==="iPhone 17 Pro" || state.model==="iPhone 17 Pro Max" || state.model==="My concept phone";
 addSlot(phone,usbC?.19:.16,.035,.012,0,-h/2-.002,d*.02,portMat);
 for(let i=0;i<4;i++){
   const xx=-w*.32+i*w*.075;
   addDisc(phone,.012,.012,xx,-h/2-.001,d*.02,portMat,12);
   addDisc(phone,.012,.012,-xx,-h/2-.001,d*.02,portMat,12);
 }
 // Subtle Apple-like centered mark is intentionally generic, not an official logo asset.
 const logoMat=mats(finishMetal?"#e1e2e8":state.colorName==="Midnight"?"#34363d":"#b6b7bd",.42,.18);
 const logo=new THREE.Mesh(new THREE.CircleGeometry(.058,32),logoMat);logo.position.set(0,-.08,-d/2-.012);phone.add(logo);
 caseMesh=addBox(phone,w+.045,h+.045,d+.035,0,0,0,new THREE.MeshPhysicalMaterial({color:"#d8d5e8",roughness:.17,metalness:0,transparent:true,opacity:.18,clearcoat:1,clearcoatRoughness:.1}),cfg.corner+.02);
 caseMesh.visible=state.clearCase;
 stickerMesh=new THREE.Group();const starShape=new THREE.Shape();
 for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2===0?.075:.035,x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?starShape.moveTo(x,y):starShape.lineTo(x,y);}
 starShape.closePath();const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),mats("#ffb7d3",.4));
 star.position.set(w*.25,-h*.24,-d/2-.018);stickerMesh.add(star);phone.add(stickerMesh);stickerMesh.visible=state.sticker;
 phone.rotation.set(-.08,state.view==="front"?0:Math.PI,0);
 updateLabels();
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#f8f5ff");
 camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,.08,6.1);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;wrap.prepend(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#fff8ff","#b4a4dc",2));
 const key=new THREE.DirectionalLight("#fff3e7",3.1);key.position.set(3,4,5);scene.add(key);const rim=new THREE.DirectionalLight("#a78bfa",2.5);rim.position.set(-4,1,-3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.5,64),new THREE.MeshBasicMaterial({color:"#eee6ff",transparent:true,opacity:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.35;scene.add(floor);
 buildPhone();resize();window.addEventListener("resize",resize);
 renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
 renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;phone.rotation.y+=(e.clientX-lastX)*.012;phone.rotation.x+=(e.clientY-lastY)*.009;phone.rotation.x=Math.max(-1.1,Math.min(1.1,phone.rotation.x));lastX=e.clientX;lastY=e.clientY;});
 renderer.domElement.addEventListener("pointerup",()=>dragging=false);renderer.domElement.addEventListener("pointercancel",()=>dragging=false);
 renderer.domElement.addEventListener("wheel",e=>{camera.position.z=Math.max(4,Math.min(8,camera.position.z+e.deltaY*.003));},{passive:true});
 $("loadingLabel").hidden=true;animate();
}
function resize(){if(!renderer)return;const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function animate(){requestAnimationFrame(animate);renderer.render(scene,camera);}
function updateLabels(){$("previewTitle").textContent=state.model;$("previewSubtitle").textContent=state.colorName+" · "+state.finish[0].toUpperCase()+state.finish.slice(1)+" finish";$("finishName").textContent=state.colorName;$("finishDot").style.background=state.color;}
function applyColor(hex,name){state.color=hex;state.colorName=name||"Custom color";buildPhone();document.querySelectorAll(".swatch").forEach(b=>b.classList.toggle("active",b.dataset.color.toLowerCase()===hex.toLowerCase()));$("customColor").value=hex;updateLabels();}
function snapshot(){return {...state,name:$("designName").value.trim()||"My dream iPhone"}}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200);}
function getSaved(){try{return JSON.parse(localStorage.getItem("phonelab-designs")||"[]")}catch{return []}}
function renderSaved(){const list=getSaved();$("savedCount").textContent=list.length;const root=$("savedDesigns");root.innerHTML="";if(!list.length){root.innerHTML='<div class="empty"><span>✧</span><strong>Your gallery is waiting</strong><p>Save a design to start your personal collection.</p></div>';return}list.forEach((d,i)=>{const card=document.createElement("article");card.className="saved-card";card.innerHTML='<div class="saved-thumb">📱</div><strong></strong><small></small><button type="button">Load this design</button><button type="button">Delete</button>';card.querySelector("strong").textContent=d.name;card.querySelector("small").textContent=d.model+" · "+d.colorName;card.querySelector(".saved-thumb").style.background="radial-gradient(circle,"+d.color+"80,#faf8ff)";card.querySelectorAll("button")[0].onclick=()=>loadDesign(d);card.querySelectorAll("button")[1].onclick=()=>{const arr=getSaved();arr.splice(i,1);localStorage.setItem("phonelab-designs",JSON.stringify(arr));renderSaved()};root.append(card)})}
function saveDesign(){const d=snapshot(),list=getSaved();list.unshift(d);localStorage.setItem("phonelab-designs",JSON.stringify(list.slice(0,30)));renderSaved();showToast("Design saved to your collection!")}
function loadDesign(d){Object.assign(state,d);$("modelSelect").value=state.model;$("designName").value=state.name;$("caseToggle").checked=state.clearCase;$("stickerToggle").checked=state.sticker;document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.finish===state.finish));applyColor(state.color,state.colorName);showToast("Design loaded!")}
$("modelSelect").addEventListener("change",e=>{state.model=e.target.value;buildPhone()});
document.querySelectorAll(".swatch").forEach(b=>b.addEventListener("click",()=>applyColor(b.dataset.color,b.dataset.name)));
$("customColor").addEventListener("input",e=>applyColor(e.target.value,"Custom color"));
document.querySelectorAll(".segment").forEach(b=>b.addEventListener("click",()=>{state.finish=b.dataset.finish;document.querySelectorAll(".segment").forEach(x=>x.classList.toggle("active",x===b));buildPhone()}));
$("caseToggle").addEventListener("change",e=>{state.clearCase=e.target.checked;buildPhone()});$("stickerToggle").addEventListener("change",e=>{state.sticker=e.target.checked;buildPhone()});
$("frontView").onclick=()=>{state.view="front";phone.rotation.y=0;document.querySelectorAll(".view-buttons button").forEach(b=>b.classList.remove("active"));$("frontView").classList.add("active")};
$("backView").onclick=()=>{state.view="back";phone.rotation.y=Math.PI;document.querySelectorAll(".view-buttons button").forEach(b=>b.classList.remove("active"));$("backView").classList.add("active")};
$("resetView").onclick=()=>{phone.rotation.set(-.08,state.view==="front"?0:Math.PI,0);camera.position.z=6.1};
$("saveDesign").onclick=saveDesign;$("saveTop").onclick=saveDesign;$("clearSaved").onclick=()=>{if(confirm("Clear all saved designs from this browser?")){localStorage.removeItem("phonelab-designs");renderSaved()}};
$("resetDesign").onclick=()=>{Object.assign(state,{model:"iPhone 17 Pro",color:"#f4f0e9",colorName:"Starlight",finish:"matte",clearCase:false,sticker:false,name:"My dream iPhone",view:"front"});$("modelSelect").value=state.model;$("designName").value=state.name;$("caseToggle").checked=false;$("stickerToggle").checked=false;document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.finish==="matte"));applyColor(state.color,state.colorName);$("frontView").click();showToast("Design reset")};
$("downloadImage").onclick=()=>{renderer.render(scene,camera);const a=document.createElement("a");a.download=(snapshot().name||"phone-design").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".png";a.href=renderer.domElement.toDataURL("image/png");a.click();showToast("Image exported!")};
renderSaved();try{init()}catch(err){$("loadingLabel").hidden=false;$("loadingLabel").textContent="3D preview couldn't start. Try a browser with WebGL enabled.";console.error(err)}
