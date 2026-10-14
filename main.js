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
function addSideSlot(parent, side, width, height, protrusion, x, y, z, material) {
 const mesh=roundedBox(width,height,protrusion,Math.min(width,height)*.45,material);
 mesh.rotation.y=side==="right"?Math.PI/2:-Math.PI/2;
 mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function cameraLens(parent,x,y,z,r,scale=1){
 const rim=mats("#171923",.24,.42),glass=mats("#243c60",.12,.32),glint=mats("#83bce9",.14,.22);
 addDisc(parent,r*1.16,.025,x,y,z,rim,40);addDisc(parent,r,.016,x,y,z-.018,glass,40);
 const shine=new THREE.Mesh(new THREE.CircleGeometry(r*.24,20),glint);shine.position.set(x-r*.25,y+r*.25,z-.029);shine.rotation.y=Math.PI;parent.add(shine);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(r*.12,16),mats("#111b30",.1,.1));inner.position.set(x+r*.18,y-r*.18,z-.03);parent.add(inner);
}
function addCameraIsland(parent,cfg,w,h,d,metalColor){
 const z=-d/2-.014, x0=-w*.285, y0=h*.325;
 const islandColor=cfg.family==="base11" || cfg.family==="base12" || cfg.family==="base13" || cfg.family==="base14" || cfg.family==="base15" || cfg.family==="base16" || cfg.family==="base17" ? state.color : metalColor;
 const islandMat=mats(islandColor,.4,.18);
 const darkIsland=mats("#10131b",.25,.18);
 const lensR=w*.068;
 if(cfg.camStyle==="bar"){
   // 17 Pro generation: wide horizontal camera plateau, with the camera cluster on the left.
   addBox(parent,w*.91,h*.215,.045,0,y0,z,islandMat,w*.07);
   cameraLens(parent,-w*.30,y0+h*.045,z-.035,lensR);
   cameraLens(parent,-w*.125,y0+h*.045,z-.035,lensR);
   cameraLens(parent,-w*.30,y0-h*.055,z-.035,lensR);
   addDisc(parent,w*.035,.018,w*.245,y0+h*.045,z-.037,mats("#f8f1dd",.22),28);
   addDisc(parent,w*.022,.016,w*.245,y0-h*.055,z-.037,darkIsland,24);
   return;
 }
 if(cfg.camStyle==="verticalPill"){
   addBox(parent,w*.32,h*.235,.045,x0,y0,z,islandMat,w*.14);
   cameraLens(parent,x0,y0+h*.052,z-.035,lensR);
   cameraLens(parent,x0,y0-h*.052,z-.035,lensR);
   addDisc(parent,w*.027,.014,x0+w*.095,y0-h*.052,z-.037,mats("#fff0c9",.22),24);
   addDisc(parent,w*.014,.014,x0+w*.095,y0+h*.052,z-.037,darkIsland,20);
   return;
 }
 if(cfg.camStyle==="squareTriple"){
   addBox(parent,w*.49,h*.245,.05,x0,y0,z,islandMat,w*.065);
   cameraLens(parent,x0-w*.105,y0+h*.052,z-.04,lensR);
   cameraLens(parent,x0+w*.105,y0+h*.052,z-.04,lensR);
   cameraLens(parent,x0-w*.105,y0-h*.052,z-.04,lensR);
   addDisc(parent,w*.031,.016,x0+w*.105,y0-h*.052,z-.042,mats("#fff0c9",.22),24);
   addDisc(parent,w*.018,.016,x0+w*.105,y0,z-.042,darkIsland,20);
   return;
 }
 if(cfg.camStyle==="squareDual"){
   addBox(parent,w*.46,h*.235,.05,x0,y0,z,islandMat,w*.065);
   cameraLens(parent,x0-w*.085,y0+h*.05,z-.04,lensR*1.03);
   cameraLens(parent,x0+w*.085,y0-h*.05,z-.04,lensR*1.03);
   addDisc(parent,w*.028,.016,x0+w*.10,y0+h*.05,z-.042,mats("#fff0c9",.22),24);
   return;
 }
 if(cfg.camStyle==="diagonal"){
   addBox(parent,w*.405,h*.205,.045,x0,y0,z,islandMat,w*.07);
   cameraLens(parent,x0-w*.083,y0+h*.047,z-.035,lensR);
   cameraLens(parent,x0+w*.083,y0-h*.047,z-.035,lensR);
   addDisc(parent,w*.028,.014,x0+w*.095,y0+h*.047,z-.037,mats("#fff0c9",.22),24);
   addDisc(parent,w*.014,.014,x0-w*.095,y0-h*.047,z-.037,darkIsland,20);
   return;
 }
 if(cfg.camStyle==="vertical"){
   addBox(parent,w*.30,h*.245,.045,x0,y0,z,islandMat,w*.06);
   cameraLens(parent,x0,y0+h*.053,z-.035,lensR);
   cameraLens(parent,x0,y0-h*.053,z-.035,lensR);
   // On the X / XS family, the flash sits between the two vertically stacked lenses.
   addDisc(parent,w*.025,.014,x0+w*.10,y0,z-.037,mats("#fff0c9",.22),24);
   return;
 }
 // iPhone 8 / SE: one rear camera with a small individual rim, not a multi-camera island.
 cameraLens(parent,x0,y0,z-.025,lensR*1.08);
 addDisc(parent,w*.026,.014,x0+w*.105,y0,z-.027,mats("#fff0c9",.22),24);
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
 // Aluminum / titanium-like frame, with generation-specific roundedness.
 addBox(phone,w,h,d,0,0,0,metal,cfg.corner);
 const backColor=mats(state.color,state.finish==="glossy"?.16:state.finish==="matte"?.72:.32,finishMetal?.15:.03);
 addBox(phone,w-.018,h-.018,.012,0,0,-d/2-.004,backColor,Math.max(.045,cfg.corner-.012));
 const screenGlass=mats("#05070d",.14,.08);
 addBox(phone,w-.018,h-.018,.012,0,0,d/2+.004,screenGlass,Math.max(.045,cfg.corner-.012));
 const screen=mats("#080b13",.13,.05);screenMat=screen;
 const bezel=cfg.bezel;
 if(cfg.screen==="home"){
   // The 4.7-inch Home-button designs have visibly broad top and bottom bezels and a 16:9 display.
   addBox(phone,w*.84,h*.685,.008,0,h*.015,d/2+.012,screen,w*.045);
   addSlot(phone,w*.25,.025,.012,0,h*.405,d/2+.016,mats("#151923",.2,.2));
   const homeR=w*.095;
   addDisc(phone,homeR,.018,0,-h*.405,d/2+.014,mats("#171923",.28,.18),40);
   const homeRing=new THREE.Mesh(new THREE.TorusGeometry(homeR*.72,.004,8,40),mats("#5a5c64",.28,.3));
   homeRing.position.set(0,-h*.405,d/2+.027);phone.add(homeRing);
 } else {
   const sw=w-bezel*2, sh=h-bezel*2;
   addBox(phone,sw,sh,.008,0,0,d/2+.012,screen,Math.max(.04,cfg.corner-bezel*.6));
   const edge=mats("#090b12",.2,.2);
   if(cfg.screen==="island"){
     addSlot(phone,w*.265,.066,.014,0,h*.405,d/2+.021,edge);
     addDisc(phone,w*.016,.014,w*.102,h*.405,d/2+.022,mats("#19253c",.2,.2),24);
   } else {
     const notchW=cfg.screen==="notchSmall"?w*.325:w*.385;
     const notchH=cfg.screen==="notchSmall"?.09:.105;
     addSlot(phone,notchW,notchH,.014,0,h*.425,d/2+.021,edge);
     addDisc(phone,w*.017,.014,notchW*.255,h*.425,d/2+.022,mats("#1b2b45",.2,.2),24);
     addBox(phone,notchW*.22,.008,.012,0,h*.385,d/2+.022,mats("#282b34",.25,.1),.004);
   }
 }
 // Side controls are mounted to the side rails, not laid flat on the front glass.
 const buttonMat=mats(finishMetal?"#d1d3d9":state.color,.3,.55);
 const rightX=w/2+.008,leftX=-w/2-.008,sideDepth=d*.42;
 addSideSlot(phone,"right",sideDepth,.17,.024,rightX,h*.205,0,buttonMat);
 if(cfg.cameraControl) addSideSlot(phone,"right",sideDepth,.145,.024,rightX,-h*.28,0,buttonMat);
 if(cfg.action) addSideSlot(phone,"left",sideDepth,.072,.024,leftX,h*.285,0,buttonMat);
 else addSideSlot(phone,"left",sideDepth,.052,.024,leftX,h*.315,0,buttonMat);
 addSideSlot(phone,"left",sideDepth,.135,.024,leftX,h*.135,0,buttonMat);
 addSideSlot(phone,"left",sideDepth,.135,.024,leftX,-h*.015,0,buttonMat);
 // Bottom port and speaker/microphone perforations.
 const portMat=mats("#11141b",.3,.2);
 const gen=Number((state.model.match(/iPhone (\d+)/)||[])[1]||0);
 const usbC=gen>=15 || state.model==="My concept phone";
 addSlot(phone,usbC?w*.205:w*.17,.028,.012,0,-h/2-.003,d*.02,portMat);
 for(let i=0;i<5;i++){
   const xx=-w*.32+i*w*.065;
   addDisc(phone,w*.010,.012,xx,-h/2-.002,d*.02,portMat,12);
   addDisc(phone,w*.010,.012,-xx,-h/2-.002,d*.02,portMat,12);
 }
 addCameraIsland(phone,cfg,w,h,d,finishMetal?"#b7bac4":state.color);
 // Small Apple-like silhouette on the rear glass, oriented toward the back-view camera.
 const logoMat=mats(finishMetal?"#e1e2e8":state.colorName==="Midnight"?"#34363d":"#a9abb2",.42,.18);
 const lr=w*.061, logoShape=new THREE.Shape();
 logoShape.moveTo(0,-lr*.9);
 logoShape.bezierCurveTo(-lr*.43,-lr*.88,-lr*.83,-lr*.5,-lr*.78,-lr*.08);
 logoShape.bezierCurveTo(-lr*.74,lr*.42,-lr*.38,lr*.72,-lr*.08,lr*.55);
 logoShape.bezierCurveTo(lr*.12,lr*.68,lr*.47,lr*.65,lr*.64,lr*.34);
 logoShape.bezierCurveTo(lr*.77,lr*.11,lr*.57,-lr*.02,lr*.47,lr*.12);
 logoShape.bezierCurveTo(lr*.34,lr*.3,lr*.45,lr*.49,lr*.61,lr*.5);
 logoShape.bezierCurveTo(lr*.43,lr*.8,lr*.18,lr*.86,0,lr*.64);
 logoShape.bezierCurveTo(-lr*.2,lr*.84,-lr*.48,lr*.74,-lr*.61,lr*.5);
 logoShape.bezierCurveTo(-lr*.79,lr*.25,-lr*.78,-lr*.4,0,-lr*.9);
 logoShape.closePath();
 const logo=new THREE.Mesh(new THREE.ShapeGeometry(logoShape),logoMat);
 logo.position.set(0,-h*.08,-d/2-.014);logo.rotation.y=Math.PI;phone.add(logo);
 const leafShape=new THREE.Shape();leafShape.moveTo(lr*.06,lr*.68);leafShape.quadraticCurveTo(lr*.1,lr*1.03,lr*.43,lr*.94);leafShape.quadraticCurveTo(lr*.4,lr*.69,lr*.06,lr*.68);
 const leaf=new THREE.Mesh(new THREE.ShapeGeometry(leafShape),logoMat);leaf.position.set(0,-h*.08,-d/2-.014);leaf.rotation.y=Math.PI;phone.add(leaf);
 caseMesh=addBox(phone,w+.035,h+.035,d+.03,0,0,0,new THREE.MeshPhysicalMaterial({color:"#d8d5e8",roughness:.17,metalness:0,transparent:true,opacity:.16,clearcoat:1,clearcoatRoughness:.1}),cfg.corner+.018);
 caseMesh.visible=state.clearCase;
 stickerMesh=new THREE.Group();const starShape=new THREE.Shape();
 for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2===0?w*.078:w*.036,x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?starShape.moveTo(x,y):starShape.lineTo(x,y);}
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
