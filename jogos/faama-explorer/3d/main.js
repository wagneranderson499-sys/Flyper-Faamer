import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const data=window.FAAMA_MAP;
if(!data?.sites||!data?.roads)throw Error("map-data.js não foi carregado");
const stage=document.getElementById("stage"),place=document.getElementById("place"),hint=document.getElementById("hint");
const scene=new THREE.Scene();scene.background=new THREE.Color("#a7d9e8");scene.fog=new THREE.FogExp2("#a7d9e8",.011);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,260);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
stage.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight("#f0f9ff","#527a55",2.05));
const sun=new THREE.DirectionalLight("#fff0c7",3.1);sun.position.set(-35,75,-24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;sun.shadow.normalBias=.025;scene.add(sun);
const materials=new Map();
function mat(color,roughness=1){const key=color+roughness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness}));return materials.get(key)}
function box(w,h,d,color,x,y,z,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
const unit=2.4,originX=-17*unit,originZ=-22*unit;
const at=(x,y)=>({x:originX+x*unit,z:originZ+y*unit});
const base=new THREE.Mesh(new THREE.PlaneGeometry(220,230),mat("#739c68"));base.rotation.x=-Math.PI/2;base.position.y=-.13;base.receiveShadow=true;scene.add(base);
const campus=new THREE.Mesh(new THREE.PlaneGeometry(34*unit,44*unit),mat("#81ac72"));campus.rotation.x=-Math.PI/2;campus.position.set(originX+17*unit,-.07,originZ+22*unit);campus.receiveShadow=true;scene.add(campus);
const buildings=[];
function rng(n){const v=Math.sin(n*127.1+39.6)*43758.5453;return v-Math.floor(v)}
function roof(x,z,w,d,height,color){const shape=new THREE.ConeGeometry(1,1,4);shape.rotateY(Math.PI/4);shape.scale(w*.75,1,d*.75);const mesh=new THREE.Mesh(shape,mat(color,.82));mesh.position.set(x,height,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh)}
function addBuilding(s){
 const p=at(s.x+s.w/2,s.y+s.h/2),w=s.w*unit,d=s.h*unit;
 if(s.type==="pool"){
  box(w+.9,.28,d+.9,"#dfd6b9",p.x,.12,p.z);
  const water=box(w-.7,.12,d-.7,"#2189aa",p.x,.32,p.z);water.material=new THREE.MeshPhysicalMaterial({color:"#218db7",metalness:.2,roughness:.14,transparent:true,opacity:.88,clearcoat:1});
  for(let i=1;i<4;i++)box(w-.8,.045,.065,"#dce8c9",p.x,.42,p.z-d/2+i*d/4);
  buildings.push({site:s,x:p.x,z:p.z,w,d});return;
 }
 const h=Math.max(4.3,s.z*.125),wall=s.wall||"#eee7d5",top=s.roof||"#5a8278";
 box(w,h,d,wall,p.x,h/2,p.z);
 box(w+.65,.38,d+.65,top,p.x,h+.14,p.z);
 if(["church","female","male","school"].includes(s.type))roof(p.x,p.z,w,d,h+1.3,top);
 // Frontal glazing, lintels and entrance canopy.
 const front=p.z+d/2+.07,rows=h>7?2:1;
 for(let row=0;row<rows;row++)for(let i=1;i<=Math.max(2,Math.floor(s.w));i++){
  const xx=p.x-w/2+i*w/(Math.floor(s.w)+1),yy=1.95+row*3.05;
  if(yy+1.2>h)continue;
  box(1.1,1.4,.13,"#2c5969",xx,yy,front);
  box(.075,1.45,.17,"#d8e8dd",xx,yy,front+.1);
  box(1.2,.11,.24,"#f2e8d5",xx,yy+ .75,front+.12);
 }
 const doorX=p.x,doorZ=front+.09;
 box(1.8,2.5,.17,"#4c655e",doorX,1.28,doorZ);
 box(2.7,.16,1.5,top,doorX,2.75,doorZ+.55);
 const sideX=p.x+w/2+.08;
 for(let i=1;i<=Math.floor(s.h);i++){
  const zz=p.z-d/2+i*d/(Math.floor(s.h)+1);
  box(.12,1.45,1.1,"#325d69",sideX,Math.min(2.6,h*.56),zz);
 }
 buildings.push({site:s,x:p.x,z:p.z,w,d});
}
for(const s of data.sites)addBuilding(s);
function path(points,width,color){
 for(let i=0;i<points.length-1;i++){
  const a=at(...points[i]),b=at(...points[i+1]),len=Math.hypot(b.x-a.x,b.z-a.z);
  const o=box(width,.065,len,color,(a.x+b.x)/2,.015,(a.z+b.z)/2,false);
  o.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
 }
}
for(const road of data.roads){path(road,3.5,"#c7bea4");path(road,2.85,"#e4d6b8")}
const trunkMat=mat("#6e5740"),leaves=[mat("#346e48"),mat("#4a8753"),mat("#629a5e"),mat("#3b7d4a")];
function tree(x,z,seed){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,2.2,7),trunkMat);trunk.position.set(x,1.05,z);trunk.castShadow=true;scene.add(trunk);
 for(let i=0;i<3;i++){const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1+(seed+i)%3*.15,1),leaves[(Math.floor(seed*11)+i)%leaves.length]);
 foliage.position.set(x+(i-1)*.54,2.65+(i%2)*.44,z+(i%2)*.25);foliage.castShadow=true;scene.add(foliage)}
}
function nearRoad(x,y){for(const road of data.roads)for(let i=1;i<road.length;i++){const [ax,ay]=road[i-1],[bx,by]=road[i],vx=bx-ax,vy=by-ay;const t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy||1)));if(Math.hypot(x-ax-vx*t,y-ay-vy*t)<1.8)return true}return false}
function insideBuilding(x,y,pad=0){return data.sites.some(s=>x>s.x-pad&&x<s.x+s.w+pad&&y>s.y-pad&&y<s.y+s.h+pad)}
for(let y=1;y<43;y+=1.6)for(let x=1;x<33;x+=1.55){const seed=rng(x*31+y*17);if(seed<.57||insideBuilding(x,y,1.3)||nearRoad(x,y))continue;const p=at(x+(seed-.5)*.7,y+(rng(seed*22)-.5)*.7);tree(p.x,p.z,seed)}
for(let i=0;i<85;i++){const x=1+rng(i*19)*32,y=1+rng(i*47)*42;if(insideBuilding(x,y,.8)||nearRoad(x,y))continue;const p=at(x,y);box(.12,.25,.12,i%4===0?"#e7d49a":"#5c9553",p.x,.08,p.z,false)}
// Simple third-person explorer avatar.
const avatar=new THREE.Group();scene.add(avatar);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.95,4,8),mat("#e4f0e9"));body.position.y=1.48;body.castShadow=true;avatar.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),mat("#c99372"));head.position.y=2.42;head.castShadow=true;avatar.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.41,16,12,0,Math.PI*2,0,Math.PI*.49),mat("#38342e"));hair.position.y=2.51;avatar.add(hair);
const backpack=new THREE.Mesh(new THREE.BoxGeometry(.64,.9,.32),mat("#32596a"));backpack.position.set(0,1.48,.46);avatar.add(backpack);
const legs=[];
for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.57,3,6),mat("#283f62"));leg.position.set(side*.22,.56,0);avatar.add(leg);legs.push(leg)}
const player=at(20,42);avatar.position.set(player.x,0,player.z);
const held=new Set();let yaw=0,dist=12,pitch=.36,dragging=false,lastX=0,lastY=0,walk=0;
const keyMap={ArrowUp:"w",ArrowLeft:"a",ArrowDown:"s",ArrowRight:"d"};
addEventListener("keydown",e=>{const k=keyMap[e.key]||e.key.toLowerCase();if(["w","a","s","d","shift"].includes(k)){held.add(k);e.preventDefault()}});
addEventListener("keyup",e=>held.delete(keyMap[e.key]||e.key.toLowerCase()));
addEventListener("blur",()=>held.clear());
for(const b of document.querySelectorAll("[data-key]")){const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();held.add(k);b.setPointerCapture(e.pointerId)});for(const ev of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,()=>held.delete(k))}
renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener("pointerup",()=>dragging=false);
renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,.12,.8);lastX=e.clientX;lastY=e.clientY});
renderer.domElement.addEventListener("wheel",e=>{dist=THREE.MathUtils.clamp(dist+e.deltaY*.012,6,22);e.preventDefault()},{passive:false});
function blocked(x,z){const gx=(x-originX)/unit,gy=(z-originZ)/unit;if(gx<.5||gx>33.5||gy<.5||gy>43.5)return true;return data.sites.some(s=>s.type!=="pool"&&gx>s.x-.35&&gx<s.x+s.w+.35&&gy>s.y-.35&&gy<s.y+s.h+.35)}
const clock=new THREE.Clock(),look=new THREE.Vector3();
function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.045);
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const dx=Number(held.has("d"))-Number(held.has("a")),dz=Number(held.has("w"))-Number(held.has("s"));
 const move=forward.multiplyScalar(dz).addScaledVector(right,dx);
 if(move.lengthSq()>0){move.normalize().multiplyScalar(dt*(held.has("shift")?10:6));const x=avatar.position.x+move.x,z=avatar.position.z+move.z;if(!blocked(x,avatar.position.z))avatar.position.x=x;if(!blocked(avatar.position.x,z))avatar.position.z=z;avatar.rotation.y=Math.atan2(-move.x,-move.z);walk+=dt*11;legs[0].rotation.x=Math.sin(walk)*.55;legs[1].rotation.x=-Math.sin(walk)*.55}else{legs[0].rotation.x*=.8;legs[1].rotation.x*=.8}
 const target=avatar.position.clone().add(new THREE.Vector3(0,1.6,0));
 const desired=target.clone().add(new THREE.Vector3(Math.sin(yaw)*dist*Math.cos(pitch),dist*Math.sin(pitch)+2,Math.cos(yaw)*dist*Math.cos(pitch)));
 camera.position.lerp(desired,1-Math.exp(-dt*6));look.lerp(target,1-Math.exp(-dt*10));camera.lookAt(look);
 let nearest=null,range=Infinity;for(const b of buildings){const d=Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z);if(d<range){nearest=b;range=d}}
 if(nearest&&range<Math.max(nearest.w,nearest.d)*.85+4){place.textContent=nearest.site.short||nearest.site.name;hint.textContent=nearest.site.info+" • Missões disponíveis na versão 2D."}
 else{place.textContent="Explorando o campus";hint.textContent="Caminhe pelas vias e descubra os prédios em 3D."}
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.getElementById("loading").remove();frame();
