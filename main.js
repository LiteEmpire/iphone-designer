import * as THREE from "three";

const $ = (id) => document.getElementById(id);
const wrap = $("canvasWrap");
const state = { model:"iPhone 17 Pro", color:"#f4f0e9", colorName:"Starlight", finish:"matte", clearCase:false, sticker:false, name:"My dream iPhone", view:"front" };
const presets = {
 "iPhone 17 Pro":[1.02,2.02,.105,3],"iPhone 17 Pro Max":[1.08,2.18,.105,3],"iPhone 17":[1.02,2.02,.105,2],
 "iPhone 16 Pro":[1.01,2.0,.105,3],"iPhone 16 Pro Max":[1.07,2.15,.105,3],"iPhone 16":[1,1.98,.105,2],
 "iPhone 15 Pro":[1.0,1.98,.105,3],"iPhone 15 Pro Max":[1.06,2.13,.105,3],"iPhone 15":[.99,1.97,.105,2],
 "iPhone 14 Pro":[.99,1.96,.11,3],"iPhone 14":[.99,1.96,.105,2],"iPhone 13":[.98,1.94,.105,2],"iPhone 12":[.98,1.94,.105,2],
 "iPhone 11":[1.01,1.94,.12,2],"iPhone XS":[.94,1.88,.105,2],"iPhone X":[.94,1.88,.105,2],"iPhone 8":[.9,1.82,.105,1],"iPhone SE (2nd / 3rd gen)":[.9,1.82,.105,1],"My concept phone":[1,2,.11,3]
};
let scene,camera,renderer,phone,bodyMat,screenMat,caseMesh,stickerMesh,dragging=false,lastX=0,lastY=0,toastTimer;
const mats=(color,rough=.35,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
function roundedBox(w,h,d,r,material){const shape=new THREE.Shape();const x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.35,bevelThickness:r*.35,curveSegments:8});geo.translate(0,0,-d/2);return new THREE.Mesh(geo,material);}
function addBox(parent,w,h,d,x,y,z,mat,r=.02){const mesh=roundedBox(w,h,d,r,mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function buildPhone(){
 if(phone)scene.remove(phone);
 const [w,h,d,lenses]=presets[state.model]||presets["iPhone 17 Pro"];phone=new THREE.Group();scene.add(phone);
 const metal=mats(state.finish==="metal"?"#c4c6cf":state.color,state.finish==="matte"?.72:state.finish==="glossy"?.12:.25,state.finish==="metal"?.8:.28);
 bodyMat=metal;addBox(phone,w,h,d,0,0,0,metal,.105);
 const screen=mats("#080b14",.18,.05);screenMat=screen;
 addBox(phone,w-.09,h-.1,.012,0,0,d/2+.006,screen,.085);
 const edge=mats("#11131a",.25,.25);
 // Dynamic island / speaker detail
 if(h>1.9){addBox(phone,w*.29,.075,.014,0,h*.405,d/2+.017,edge,.04);addBox(phone,.045,.045,.016,w*.11,h*.405,d/2+.018,mats("#252d48",.2,.2),.02);}
 else {addBox(phone,.28,.035,.014,0,h*.405,d/2+.017,edge,.016);}
 // Side buttons
 addBox(phone,.025,.22,d*.48,w/2+.007,.25,0,metal,.012);addBox(phone,.025,.13,d*.48,-w/2-.007,.35,0,metal,.012);addBox(phone,.025,.1,d*.48,-w/2-.007,.15,0,metal,.012);
 // Rear camera platform and lenses
 const bump=addBox(phone,lenses===3?.49:.38,lenses===3?.52:.37,.045,-w*.27,h*.34,-d/2-.018,mats(state.finish==="metal"?"#a7a9b2":state.color,.4,.2),.055);
 const lensMat=mats("#10131e",.18,.25),glass=mats("#263b64",.15,.3);
 const positions=lenses===3?[[-.12,.13],[.12,.13],[0,-.11]]:lenses===2?[[-.09,.09],[.09,-.09]]:[[0,0]];
 positions.forEach(([x,y])=>{const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.067,.067,.022,32),lensMat);cyl.rotation.x=Math.PI/2;cyl.position.set(-w*.27+x,h*.34+y,-d/2-.049);phone.add(cyl);const gl=new THREE.Mesh(new THREE.CircleGeometry(.046,32),glass);gl.position.set(-w*.27+x,h*.34+y,-d/2-.062);phone.add(gl);const shine=new THREE.Mesh(new THREE.CircleGeometry(.012,20),mats("#a9d8ff",.1,.2));shine.position.set(-w*.27+x-.012,h*.34+y+.012,-d/2-.064);phone.add(shine);});
 const flash=new THREE.Mesh(new THREE.CircleGeometry(.025,20),mats("#fff0b5",.2));flash.position.set(-w*.27+.14,h*.34-.12,-d/2-.05);phone.add(flash);
 const logo=new THREE.Mesh(new THREE.CircleGeometry(.065,32),mats(state.finish==="metal"?"#dedee8":state.color,.4,.25));logo.position.set(0,-.08,-d/2-.008);phone.add(logo);
 caseMesh=addBox(phone,w+.045,h+.045,d+.035,0,0,0,new THREE.MeshPhysicalMaterial({color:"#d8d5e8",roughness:.17,metalness:0,transparent:true,opacity:.18,clearcoat:1,clearcoatRoughness:.1}),.115);caseMesh.visible=state.clearCase;
 stickerMesh=new THREE.Group();const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2===0?.075:.035;const x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?starShape.moveTo(x,y):starShape.lineTo(x,y);}starShape.closePath();const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),mats("#ffb7d3",.4));star.position.set(w*.25,-h*.24,-d/2-.015);stickerMesh.add(star);phone.add(stickerMesh);stickerMesh.visible=state.sticker;
 if(state.view==="front")phone.rotation.y=Math.PI;else phone.rotation.y=0;
 phone.rotation.x=-.08;phone.scale.setScalar(Math.min(1.06,2.0/h));updateLabels();
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#f8f5ff");
 camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,.08,6.1);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;wrap.prepend(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#fff8ff","#b4a4dc",2));
 const key=new THREE.DirectionalLight("#fff3e7",3.1);key.position.set(3,4,5);scene.add(key);const rim=new THREE.DirectionalLight("#a78bfa",2.5);rim.position.set(-4,1,-3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.5,64),new THREE.MeshBasicMaterial({color:"#eee6ff",transparent:true,opacity:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.35;scene.add(floor);
 buildPhone();resize();window.addEventListener("resize",resize);renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;phone.rotation.y+=(e.clientX-lastX)*.012;phone.rotation.x+=(e.clientY-lastY)*.009;phone.rotation.x=Math.max(-1.1,Math.min(1.1,phone.rotation.x));lastX=e.clientX;lastY=e.clientY;});renderer.domElement.addEventListener("pointerup",()=>dragging=false);renderer.domElement.addEventListener("pointercancel",()=>dragging=false);renderer.domElement.addEventListener("wheel",e=>{camera.position.z=Math.max(4,Math.min(8,camera.position.z+e.deltaY*.003));},{passive:true});
 $("loadingLabel").hidden=true;animate();
}
function resize(){if(!renderer)return;const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function animate(){requestAnimationFrame(animate);if(!dragging&&phone)phone.rotation.y+=(state.view==="front"?Math.PI:0)-phone.rotation.y>Math.PI?0:0;renderer.render(scene,camera);}
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
$("frontView").onclick=()=>{state.view="front";phone.rotation.y=Math.PI;document.querySelectorAll(".view-buttons button").forEach(b=>b.classList.remove("active"));$("frontView").classList.add("active")};
$("backView").onclick=()=>{state.view="back";phone.rotation.y=0;document.querySelectorAll(".view-buttons button").forEach(b=>b.classList.remove("active"));$("backView").classList.add("active")};
$("resetView").onclick=()=>{phone.rotation.set(-.08,state.view==="front"?Math.PI:0,0);camera.position.z=6.1};
$("saveDesign").onclick=saveDesign;$("saveTop").onclick=saveDesign;$("clearSaved").onclick=()=>{if(confirm("Clear all saved designs from this browser?")){localStorage.removeItem("phonelab-designs");renderSaved()}};
$("resetDesign").onclick=()=>{Object.assign(state,{model:"iPhone 17 Pro",color:"#f4f0e9",colorName:"Starlight",finish:"matte",clearCase:false,sticker:false,name:"My dream iPhone",view:"front"});$("modelSelect").value=state.model;$("designName").value=state.name;$("caseToggle").checked=false;$("stickerToggle").checked=false;document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.finish==="matte"));applyColor(state.color,state.colorName);$("frontView").click();showToast("Design reset")};
$("downloadImage").onclick=()=>{renderer.render(scene,camera);const a=document.createElement("a");a.download=(snapshot().name||"phone-design").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".png";a.href=renderer.domElement.toDataURL("image/png");a.click();showToast("Image exported!")};
renderSaved();try{init()}catch(err){$("loadingLabel").hidden=false;$("loadingLabel").textContent="3D preview couldn't start. Try a browser with WebGL enabled.";console.error(err)}
