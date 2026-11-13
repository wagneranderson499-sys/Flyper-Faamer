import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import {createMissions3D} from "./missions3d.js";
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js";

const data=window.FAAMA_MAP;
if(!data?.sites||!data?.roads)throw Error("map-data.js não foi carregado");
const stage=document.getElementById("stage"),place=document.getElementById("place"),hint=document.getElementById("hint");
const scene=new THREE.Scene();scene.background=new THREE.Color("#a7d9e8");scene.fog=new THREE.FogExp2("#a7d9e8",.011);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,260);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
stage.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight("#f0f9ff","#527a55",1.45));
const sun=new THREE.DirectionalLight("#fff5d8",2.35);sun.position.set(-35,75,-24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
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
function cylinder(radius,height,color,x,y,z,sides=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,sides),mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function windowGrid(p,w,d,h,front,rows,columns,frame="#f2f4e8"){
 const gap=w/(columns+1);
 for(let row=0;row<rows;row++)for(let i=1;i<=columns;i++){
  const x=p.x-w/2+i*gap,y=1.95+row*2.8;if(y+1>h)continue;
  box(gap*.79,1.85,.16,"#16465e",x,y,front+.08);
  box(.065,1.9,.23,frame,x,y,front+.19);
  box(gap*.8,.085,.25,frame,x,y+.95,front+.18);
  box(gap*.8,.085,.25,frame,x,y-.95,front+.18);
  box(gap*.75,.035,.03,"#8bd6e1",x,y+.4,front+.22,false);
 }
}
function planters(p,w,d){for(const side of [-1,1]){const x=p.x+side*(w*.32),z=p.z+d/2+2.5;box(2.7,.48,1.3,"#d8c49f",x,.24,z);for(let j=0;j<3;j++){const xx=x+(j-1)*.72;cylinder(.16,.65,"#477c3c",xx,.7,z,7);const flower=new THREE.Mesh(new THREE.IcosahedronGeometry(.29,1),mat(j%2?"#ed77ac":"#f4c456"));flower.position.set(xx,1.12,z);scene.add(flower)}}}
// Fachada autoral do Prédio Central, modelada por partes a partir da referência.
// Modelo arquitetônico próprio: corpo recuado, empena e telhado inclinado.
function centralBuilding(s,p,w,d){
 const front=p.z+d/2,back=p.z-d/2,blue="#0873d0",deep="#1262b6",cyan="#1aa6cc",gold="#f8c65c",orange="#e69c60";
 const solid=(vertices,indices,color)=>{
  const g=new THREE.BufferGeometry(),arr=[];
  for(const face of indices)for(const id of face)arr.push(...vertices[id]);
  g.setAttribute("position",new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.77,side:THREE.DoubleSide}));
  m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
 };
 const quad=(v,color)=>solid(v,[[0,1,2],[0,2,3]],color);
 const pane=(x,y,z,ww=1.05,hh=1.35)=>{
  box(ww+.22,hh+.2,.18,"#e5f0ef",x,y,z);
  box(ww,hh,.2,"#1c8fd1",x,y,z+.13);
  box(ww*.77,hh*.79,.21,"#9de8f2",x-.07,y+.06,z+.26,false);
  box(.055,hh,.28,"#f4f7f1",x,y,z+.3,false);
  box(ww+.28,.11,.44,"#f3f4e7",x,y-hh/2-.13,z+.22);
 };
 // Corpo com frente azul e topo amarelo; o telhado nasce de uma empena triangular.
 box(w,6.5,d,blue,p.x,3.25,p.z);
 box(w,1.55,d,gold,p.x,7.25,p.z);
 // Pequeno avanço da fachada inferior, deixando as laterais com profundidade.
 box(w*.96,.22,.55,deep,p.x,6.42,front+.27);
 box(w*.94,.24,.55,cyan,p.x,8.05,front+.3);
 const eave=8.2,ridge=11.45,over=.75;
 const lx=p.x-w/2-over,rx=p.x+w/2+over;
 const fz=front+over,bz=back-over,rz=(fz+bz)/2;
 // Duas águas reais, inclinadas no eixo da profundidade, com cumeeira e beirais.
 quad([[lx,eave,fz],[rx,eave,fz],[rx,ridge,rz],[lx,ridge,rz]],"#087eb5");
 quad([[lx,ridge,rz],[rx,ridge,rz],[rx,eave,bz],[lx,eave,bz]],"#0d9cc3");
 quad([[p.x-w/2,8.2,front+.02],[p.x+w/2,8.2,front+.02],[p.x+w/2,11.08,rz],[p.x-w/2,11.08,rz]],"#0789bb");
 quad([[p.x-w/2,11.08,rz],[p.x+w/2,11.08,rz],[p.x+w/2,8.2,back-.02],[p.x-w/2,8.2,back-.02]],"#0b87ac");
 // Fechamento triangular nas duas laterais (empenas).
 for(const x of [p.x-w/2,p.x+w/2])solid([[x,8.2,front],[x,8.2,back],[x,11.08,p.z]],[[0,1,2]],gold);
 // Beirais grossos, ripas e cumeeira visíveis.
 box(w+1.6,.22,.36,cyan,p.x,eave-.06,fz);
 box(w+1.6,.22,.36,deep,p.x,eave-.06,bz);
 box(w+1.6,.18,.24,"#2fc5da",p.x,ridge+.02,rz);
 for(let i=0;i<5;i++){
  const z=fz+(rz-fz)*(i+1)/6,y=eave+(ridge-eave)*(i+1)/6;
  box(w+1.1,.09,.14,i%2?"#18a9d0":"#0876bf",p.x,y+.06,z,false);
 }
 // Claraboias pequenas acompanham a inclinação do telhado frontal.
 for(let i=0;i<5;i++){
  const x=p.x+(i-2)*w*.165,t=.48,y=eave+(ridge-eave)*t,z=fz+(rz-fz)*t;
  const skylight=box(w*.09,.065,1.02,"#c4f6ff",x,y+.1,z);
  skylight.rotation.x=Math.atan2(ridge-eave,rz-fz);
  const trim=box(w*.11,.09,1.08,"#0754b6",x,y+.025,z-.03);
  trim.rotation.x=skylight.rotation.x;
 }
 // Janelas simétricas, separadas em dois pavimentos.
 for(let row=0;row<2;row++)for(let i=0;i<6;i++){
  if(row===0&&(i===2||i===3))continue;
  const x=p.x+(i-2.5)*w*.145;
  pane(x,row===0?2.2:4.8,front+.19,w*.073,row===0?1.25:1.13);
 }
 // Faixa amarela irregular que se projeta sobre a parte azul.
 box(w*.88,.67,.18,gold,p.x,6.08,front+.43);
 for(let i=0;i<6;i++){
  const x=p.x+(i-2.5)*w*.15;
  box(w*.12,.22,.21,i%2?orange:gold,x,5.65-(i%3)*.15,front+.51);
 }
 // Porta dupla envidraçada, com batente e soleira.
 box(w*.205,2.75,.26,"#e9eff0",p.x,1.43,front+.36);
 for(const side of [-1,1]){
  const x=p.x+side*w*.052;
  box(w*.095,2.5,.3,"#6cc9e6",x,1.4,front+.53);
  box(.055,2.52,.36,"#e8f5f5",x,1.4,front+.72);
  box(.045,.35,.18,"#f7f8ef",x-side*.14,1.35,front+.75);
 }
 // Arco duplo da entrada: curvas paralelas e projetadas, não um adesivo plano.
 for(const [z,radius,color,offset] of [[front+.72,.23,orange,0],[front+.93,.18,"#1b9fe6",-.27]]){
  const pts=[];
  for(let i=0;i<=32;i++){
   const t=i/32;
   pts.push(new THREE.Vector3(p.x+(t-.5)*w*.31,3.3+offset+1.35*Math.sin(Math.PI*t),z));
  }
  const arc=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),56,radius,9,false),mat(color,.5));
  arc.castShadow=true;scene.add(arc);
 }
 for(let i=0;i<2;i++)box(w*.24+i*.3,.13,.62,"#d6c9b5",p.x,.07+i*.13,front+1.2+i*.4);
 buildings.push({site:s,x:p.x,z:p.z,w,d});
}
// Reserva arquitetônica inspirada na fotografia real, sem retornar ao antigo prédio azul.
// Modelo arquitetônico V3: volumes assimétricos, fachada recuada e entrada com marquise curva.
function realCentralFallback(p,w,d){
 const x=p.x,z=p.z,wide=w*1.58,front=z+d*.5;
 w=wide;
 const wall="#edc75a",yellow="#f1cc5e",green="#397b53",dark="#142e4c",glass="#173c5b",orange="#d47736";
 const add=(W,H,D,color,X,Y,Z)=>box(W,H,D,color,X,Y,Z);
 const window=(X,Y,Z,W,H)=>{
  add(W+.2,H+.24,.18,"#f5f4eb",X,Y,Z);
  add(W,H,.2,glass,X,Y,Z+.11);
  add(W*.46,.035,.23,"#9ec2c4",X,Y,Z+.23);
  add(.055,H,.23,"#b6d0d1",X,Y,Z+.24);
 };
 // Ala principal baixa: dois blocos amarelos com alturas distintas.
 add(w*.99,5.5,d*.94,wall,x,2.75,z);
 add(w*.37,6.5,d*.92,yellow,x-w*.315,3.25,z+.08);
 add(w*.32,5.8,d*.96,"#dcb950",x+w*.34,2.9,z-.04);
 // Volume posterior verde elevado, com beirais e recuos.
 add(w*.42,8.8,d*.64,green,x+w*.04,4.4,z-d*.2);
 add(w*.44,.26,d*.68,"#f4f3ec",x+w*.04,8.95,z-d*.2);
 add(w*.45,.3,d*.7,"#ffffff",x+w*.04,9.2,z-d*.2);
 // Cobertura branca de baixa inclinação, respeitando a largura do bloco superior.
 const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.46,.22,d*.73),mat("#ffffff"));
 roof.position.set(x+w*.04,9.43,z-d*.2);roof.rotation.z=-.035;roof.castShadow=true;roof.receiveShadow=true;scene.add(roof);
 // Janelas altas: ritmo irregular na faixa superior.
 for(const t of [-.40,-.28,-.16,-.04,.08,.20,.32,.43]){
  const xx=x+w*t;
  window(xx,4.95,front+.12,w*.067,1.7);
 }
 // Portais e esquadrias no pavimento térreo.
 for(const side of [-1,1]){
  const xx=x+side*w*.36;
  add(w*.17,3.2,.23,"#142e4c",xx,1.95,front+.22);
  add(w*.15,3,.25,"#315a79",xx,1.95,front+.36);
  add(.075,3,.28,"#d1dbd4",xx,1.95,front+.52);
  add(w*.175,.2,.35,"#e5d9b4",xx,3.65,front+.4);
 }
 // Textura vertical em painéis laterais e painéis ventilados.
 for(const side of [-1,1]){
  const xx=x+side*w*.25;
  add(w*.16,3.2,.15,"#142e4c",xx,1.8,front+.22);
  for(let i=0;i<12;i++)add(w*.15,.035,.16,i%2?"#8b9b77":"#c1aa5c",xx,1.05+i*.19,front+.32,false);
 }
 // Entrada principal recuada, com pórtico laranja de altura integral.
 add(w*.19,6.3,.72,orange,x,3.15,front+.42);
 add(w*.145,4.35,.78,"#132b45",x,2.18,front+.83);
 add(w*.13,3.5,.8,"#132b45",x,1.8,front+.89);
 add(w*.028,4.35,.83,"#d47736",x-w*.09,2.18,front+.88);
 add(w*.028,4.35,.83,"#b86a3a",x+w*.09,2.18,front+.88);
 add(w*.21,.2,.85,"#e8b26b",x,6.25,front+.5);
 // Marquise arqueada construída por faixas trianguladas (curva frontal real).
 const canopyGroup=new THREE.Group();scene.add(canopyGroup);
 const R=w*.105,depth=2.45,segments=24,positions=[],indices=[];
 for(let i=0;i<=segments;i++){
  const t=Math.PI*i/segments,xx=-R*Math.cos(t),yy=3.25+R*.48*Math.sin(t);
  positions.push(xx,yy,0,xx,yy,depth);
  if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
 }
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 const cover=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:"#173b69",roughness:.56,side:THREE.DoubleSide}));cover.castShadow=true;canopyGroup.add(cover);
 canopyGroup.position.set(x,0,front+.8);
 add(w*.24,.18,2.4,"#173b69",x,3.24,front+1.95);
 // Degraus, calçada e jardineiras.
 for(let i=0;i<3;i++)add(w*.32+i*.28,.13,.78,"#ded9c8",x,.07+i*.11,front+3.2+i*.5);
 for(const side of [-1,1]){
  const xx=x+side*w*.53;
  add(1.9,.6,2.4,"#d2c6a5",xx,.3,front+1.2);
  add(1.6,.3,2.1,"#427e4b",xx,.72,front+1.2);
  for(let i=0;i<3;i++){
   const sx=xx+(i-1)*.48;
   cylinder(.07,1.4,"#56744b",sx,1.35,front+1.2);
   const crown=new THREE.Mesh(new THREE.SphereGeometry(.47,10,8),mat("#38764c"));crown.position.set(sx,2.05,front+1.2);scene.add(crown);
  }
 }
}
function addBuilding(s){
 const p=at(s.x+s.w/2,s.y+s.h/2),w=s.w*unit,d=s.h*unit;
 if(s.type==="central"){
  buildings.push({site:s,x:p.x,z:p.z,w,d});
  realCentralFallback(p,w,d);
  return;
 }
 if(s.type==="pool"){
  box(w+3,.3,d+3,"#e9d5b0",p.x,.1,p.z);
  const water=box(w-.7,.13,d-.7,"#1687b8",p.x,.34,p.z);water.material=new THREE.MeshPhysicalMaterial({color:"#35b6d9",metalness:.18,roughness:.1,transparent:true,opacity:.86,clearcoat:1});
  for(let i=1;i<5;i++)box(w-.8,.04,.075,i%2?"#faf4da":"#e3c35e",p.x,.44,p.z-d/2+i*d/5);
  for(let i=0;i<4;i++){const xx=p.x-w/2+1.5+i*(w-3)/3;cylinder(.09,2.4,"#ecebe2",xx,1.2,p.z-d/2-1.2);const umbrella=new THREE.Mesh(new THREE.ConeGeometry(1.2,.5,8),mat(i%2?"#fff1c8":"#37a3cf"));umbrella.position.set(xx,2.6,p.z-d/2-1.2);scene.add(umbrella)}
  buildings.push({site:s,x:p.x,z:p.z,w,d});return;
 }
 if(s.type==="sports"){
  box(w,.35,d,"#3780b6",p.x,.15,p.z);
  box(w*.82,.055,d*.77,"#297a5b",p.x,.38,p.z);
  for(const x of [-1,1])for(const z of [-1,1])cylinder(.13,6,"#e3e9e5",p.x+x*w*.43,3,p.z+z*d*.42);
  const canopy=box(w+1,.28,d+1,"#f5dfb4",p.x,6.2,p.z);canopy.rotation.z=.07;
  for(let i=0;i<6;i++)box(.1,.14,d+1,"#237ac0",p.x-w/2+i*w/5,6.42,p.z);
  buildings.push({site:s,x:p.x,z:p.z,w,d});return;
 }
 const h=Math.max(5,s.z*.125),front=p.z+d/2+.08;
 const wall=s.type==="central"?"#f6c535":s.type==="school"?"#9bc65b":s.type==="restaurant"?"#757d77":s.type==="female"?"#ece9e0":s.wall;
 const roofColor=s.type==="central"?"#1989c7":s.type==="female"?"#d9d5cf":s.type==="male"?"#28b58c":s.type==="school"?"#197dc4":s.roof;
 box(w,h,d,wall,p.x,h/2,p.z);
 box(w+.9,.36,d+.9,roofColor,p.x,h+.15,p.z);
 if(s.type==="church"||s.type==="school"||s.type==="male")roof(p.x,p.z,w,d,h+1.35,roofColor);
 if(s.type==="female"){
  box(w*.86,h*.83,.18,"#b82932",p.x,h*.52,front+.1);
  box(w*.77,h*.7,.2,"#235b72",p.x,h*.52,front+.22);
  for(let i=1;i<7;i++)box(.085,h*.67,.24,"#b8e2e9",p.x-w*.385+i*w*.77/7,h*.52,front+.36);
  for(let j=1;j<4;j++)box(w*.77,.08,.24,"#c4e0e4",p.x,h*.16+j*h*.15,front+.37);
 }else if(s.type==="central"){
  box(w*.94,h*.42,.22,"#1872c5",p.x,h*.72,front+.1);
  windowGrid(p,w*.93,d,h,front+.25,1,8,"#b5e8e9");
  box(w*.33,h*.53,.28,"#155fa5",p.x,h*.3,front+.24);
  box(w*.38,.65,2.1,"#1d7fbd",p.x,h*.55,front+1.1);
  for(const side of [-1,1])box(w*.23,h*.26,.2,"#e8b82c",p.x+side*w*.35,h*.25,front+.18);
 }else if(s.type==="male"){
  box(w+.1,.65,.22,"#5860b6",p.x,h*.5,front+.12);
  windowGrid(p,w,d,h,front,2,5);
 }else if(s.type==="church"){
  windowGrid(p,w,d,h,front,1,3);
  box(.24,2.2,.24,"#704d31",p.x,h+2,front+.1);
  box(1.4,.22,.24,"#704d31",p.x,h+2.4,front+.1);
 }else windowGrid(p,w,d,h,front,h>7?2:1,Math.max(3,Math.floor(s.w)));
 box(1.8,2.5,.18,"#3e5962",p.x,1.25,front+.38);
 box(3.4,.2,2.3,roofColor,p.x,2.78,front+1.2);
 for(let i=1;i<Math.floor(s.h);i++)box(.13,1.4,1.1,"#316477",p.x+w/2+.1,Math.min(h*.55,3.6),p.z-d/2+i*d/Math.floor(s.h));
 planters(p,w,d);
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
// Paisagismo inspirado na referência: palmeiras, ipês floridos, postes e portaria.
function palm(x,z){
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.13,.25,5.8,9),mat("#8d7250"));stem.position.set(x,2.9,z);stem.castShadow=true;scene.add(stem);
 for(let i=0;i<9;i++){const angle=i*Math.PI*2/9;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.45,3.6,5),mat(i%2?"#3e994e":"#5db95b"));leaf.position.set(x+Math.cos(angle)*1.25,5.9,z+Math.sin(angle)*1.25);leaf.rotation.z=Math.cos(angle)*.88;leaf.rotation.x=-Math.sin(angle)*.88;leaf.castShadow=true;scene.add(leaf)}
}
function flowering(x,z,seed){
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.16,.24,2.5,7),mat("#77573e"));stem.position.set(x,1.25,z);scene.add(stem);
 for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.98,1),mat(i%2?"#ed6eac":"#f59ac4"));crown.position.set(x+Math.cos(angle)*.85,3.1+(i%2)*.45,z+Math.sin(angle)*.85);crown.castShadow=true;scene.add(crown)}
}
for(const [x,y] of [[12,24],[24,25],[11,33],[26,34],[12,17],[23,18],[10,39],[27,24],[8,21],[15,14],[24,10]]){const p=at(x,y);if(!insideBuilding(x,y,.4))palm(p.x,p.z)}
for(const [x,y] of [[9,27],[12,30],[13,36],[25,35],[24,30],[8,36],[11,18],[23,13],[31,20],[7,24]]){const p=at(x,y);if(!insideBuilding(x,y,.2))flowering(p.x,p.z,x*y)}
function lamp(x,z){cylinder(.065,4.4,"#5b655f",x,2.2,z);const globe=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),new THREE.MeshStandardMaterial({color:"#fff3c5",emissive:"#e8c77e",emissiveIntensity:.45}));globe.position.set(x,4.48,z);scene.add(globe)}
for(const [x,y] of [[17,35],[22,35],[13,35],[25,34],[17,30],[22,30],[14,21],[23,21],[12,16],[25,17],[11,40],[28,38]]){const p=at(x,y);if(!insideBuilding(x,y,.3))lamp(p.x,p.z)}
// Portaria junto à rodovia, no extremo sul do campus.
const gate=at(20,43.4);
for(const side of [-1,1]){box(1.3,5,1.3,"#e5d5b4",gate.x+side*7,2.5,gate.z);box(1.6,.35,1.6,"#2b75a8",gate.x+side*7,5.1,gate.z)}
box(16,.9,2.2,"#e8e2ce",gate.x,5.4,gate.z);
box(15.8,.22,2.4,"#197bb9",gate.x,6,gate.z);
box(3,2.6,2.3,"#e2d5b9",gate.x,1.3,gate.z+1.6);
box(3.1,.12,2.4,"#197bb9",gate.x,2.7,gate.z+1.6);
box(34,.1,5,"#414850",gate.x,.02,gate.z+8,false);
for(let i=-6;i<=6;i++)box(1.5,.12,.14,"#e6ca65",gate.x+i*2.5,.1,gate.z+8,false);
// Wagner: personagem jogável estilizado, com silhueta e detalhes próprios.
const avatar=new THREE.Group();scene.add(avatar);avatar.name="Wagner";
function avatarMesh(geometry,color,x,y,z,parent=avatar){const mesh=new THREE.Mesh(geometry,mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
const torso=avatarMesh(new THREE.CapsuleGeometry(.43,.8,6,18),"#e6eee8",0,1.56,0);
avatarMesh(new THREE.BoxGeometry(.77,.16,.12),"#137eaf",0,1.78,-.4);
avatarMesh(new THREE.BoxGeometry(.24,.18,.14),"#e5b04b",.13,1.71,-.48);
avatarMesh(new THREE.CylinderGeometry(.17,.19,.28,14),"#bd8563",0,2.16,0);
avatarMesh(new THREE.SphereGeometry(.42,28,22),"#bd8563",0,2.53,-.04);
avatarMesh(new THREE.SphereGeometry(.43,28,18,0,Math.PI*2,0,Math.PI*.48),"#25272b",0,2.67,-.04);
for(const side of [-1,1]){
 avatarMesh(new THREE.SphereGeometry(.064,12,10),"#f8f4e9",side*.17,2.56,-.39);
 avatarMesh(new THREE.SphereGeometry(.034,12,10),"#252a32",side*.17,2.56,-.45);
 avatarMesh(new THREE.SphereGeometry(.092,12,10),"#bd8563",side*.41,2.47,-.03);
 avatarMesh(new THREE.BoxGeometry(.115,.5,.13),"#263d57",side*.35,1.56,.47);
 avatarMesh(new THREE.BoxGeometry(.11,.045,.06),"#40302c",side*.17,2.65,-.417);
}
avatarMesh(new THREE.BoxGeometry(.15,.035,.04),"#814b48",0,2.32,-.44);
avatarMesh(new THREE.BoxGeometry(.77,.95,.42),"#2d526d",0,1.48,.47);
avatarMesh(new THREE.BoxGeometry(.64,.18,.46),"#c79c54",0,1.83,.52);
avatarMesh(new THREE.BoxGeometry(.27,.3,.08),"#d1dbe0",.24,1.38,-.42);
const arms=[],legs=[];
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.53,1.96,0);avatar.add(arm);
 avatarMesh(new THREE.CapsuleGeometry(.145,.57,5,12),"#d4e3e8",0,-.38,0,arm);
 avatarMesh(new THREE.SphereGeometry(.145,12,10),"#bd8563",0,-.83,0,arm);
 arms.push(arm);
 const leg=new THREE.Group();leg.position.set(side*.23,1,0);avatar.add(leg);
 avatarMesh(new THREE.CapsuleGeometry(.17,.62,5,12),"#293d5b",0,-.39,0,leg);
 avatarMesh(new THREE.BoxGeometry(.35,.2,.6),"#f0f0e8",0,-.88,-.13,leg);
 avatarMesh(new THREE.BoxGeometry(.35,.07,.6),"#42556b",0,-.99,-.13,leg);
 legs.push(leg);
}
const playerName=document.getElementById("playerName");
if(playerName)playerName.textContent="Wagner";
const player=at(20,42);avatar.position.set(player.x,0,player.z);
const held=new Set();let yaw=0,dist=12,pitch=.36,dragging=false,lastX=0,lastY=0,walk=0;
let cameraMode="third",overviewYaw=0,overviewDistance=138;
const overviewTarget=new THREE.Vector3(0,0,0);
const thirdButton=document.getElementById("cameraThird"),overviewButton=document.getElementById("cameraOverview"),centralButton=document.getElementById("cameraCentral");
function setCameraMode(mode){
 cameraMode=mode==="central"?"central":mode==="overview"?"overview":"third";held.clear();dragging=false;
 thirdButton.classList.toggle("selected",cameraMode==="third");
 overviewButton.classList.toggle("selected",cameraMode==="overview");
 centralButton.classList.toggle("selected",cameraMode==="central");
 thirdButton.setAttribute("aria-pressed",String(cameraMode==="third"));
 overviewButton.setAttribute("aria-pressed",String(cameraMode==="overview"));
 centralButton.setAttribute("aria-pressed",String(cameraMode==="central"));
 hint.textContent=cameraMode==="overview"?"Vista panorâmica do campus. Arraste para girar e use o scroll para aproximar.":"Explore o campus com o personagem.";
}
thirdButton.addEventListener("click",()=>setCameraMode("third"));
overviewButton.addEventListener("click",()=>setCameraMode("overview"));
centralButton.addEventListener("click",()=>setCameraMode("central"));
const keyMap={ArrowUp:"w",ArrowLeft:"a",ArrowDown:"s",ArrowRight:"d"};
addEventListener("keydown",e=>{
 const k=keyMap[e.key]||e.key.toLowerCase();
 if(k==="escape"&&missionEngine.active){missionEngine.leave();e.preventDefault();return}
 if(k==="e"&&!e.repeat){if(missionEngine.active)missionEngine.interact();else if(nearbyMission)missionEngine.enter(nearbyMission);e.preventDefault();return}
 if(k==="m"&&!e.repeat){document.getElementById("missionsToggle").click();e.preventDefault();return}
 if(missionEngine.active&&["w","a","s","d","shift"].includes(k)){held.add(k);e.preventDefault();return}
 if(k==="c"&&!e.repeat&&!missionEngine.active){setCameraMode(cameraMode==="third"?"overview":"third");e.preventDefault();return}
 if(cameraMode==="third"&&["w","a","s","d","shift"].includes(k)){held.add(k);e.preventDefault()}
});
addEventListener("keyup",e=>held.delete(keyMap[e.key]||e.key.toLowerCase()));
addEventListener("blur",()=>held.clear());
for(const b of document.querySelectorAll("[data-key]")){const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();held.add(k);b.setPointerCapture(e.pointerId)});for(const ev of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,()=>held.delete(k))}
renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener("pointerup",()=>dragging=false);
renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;if(cameraMode==="third"){yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,.12,.8)}else if(cameraMode==="overview"){overviewYaw-=(e.clientX-lastX)*.004}lastX=e.clientX;lastY=e.clientY});
renderer.domElement.addEventListener("wheel",e=>{if(cameraMode==="third")dist=THREE.MathUtils.clamp(dist+e.deltaY*.012,6,22);else overviewDistance=THREE.MathUtils.clamp(overviewDistance+e.deltaY*.12,65,190);e.preventDefault()},{passive:false});
function blocked(x,z){if(missionEngine.active)return missionEngine.blocked(x,z);const gx=(x-originX)/unit,gy=(z-originZ)/unit,r=playerRadius/unit;if(gx<.5+r||gx>33.5-r||gy<.5+r||gy>43.5-r)return true;return data.sites.some(s=>s.type!=="pool"&&gx>s.x-r&&gx<s.x+s.w+r&&gy>s.y-r&&gy<s.y+s.h+r)}
const missionEngine=createMissions3D(THREE,{scene,avatar,at,unit,sites:data.sites,held,box,mat,place,hint});
let nearbyMission=null;
const clock=new THREE.Clock(),look=new THREE.Vector3();
const velocity=new THREE.Vector3();
const playerRadius=.38;
function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.045);
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const dx=(cameraMode==="third"||missionEngine.active)?(Number(held.has("d"))-Number(held.has("a"))):0,dz=(cameraMode==="third"||missionEngine.active)?(Number(held.has("w"))-Number(held.has("s"))):0;
 const move=forward.multiplyScalar(dz).addScaledVector(right,dx);
 const moving=move.lengthSq()>0;
 const maxSpeed=held.has("shift")?8.5:5.5;
 if(moving)move.normalize().multiplyScalar(maxSpeed);
 const smooth=1-Math.exp(-dt*(moving?9:14));
 velocity.x=THREE.MathUtils.lerp(velocity.x,move.x,smooth);
 velocity.z=THREE.MathUtils.lerp(velocity.z,move.z,smooth);
 if(Math.abs(velocity.x)<.015)velocity.x=0;
 if(Math.abs(velocity.z)<.015)velocity.z=0;
 const stepX=avatar.position.x+velocity.x*dt,stepZ=avatar.position.z+velocity.z*dt;
 if(!blocked(stepX,avatar.position.z))avatar.position.x=stepX;else velocity.x=0;
 if(!blocked(avatar.position.x,stepZ))avatar.position.z=stepZ;else velocity.z=0;
 const speed=Math.hypot(velocity.x,velocity.z);
 if(speed>.1){
  const targetAngle=Math.atan2(-velocity.x,-velocity.z);
  avatar.rotation.y+=Math.atan2(Math.sin(targetAngle-avatar.rotation.y),Math.cos(targetAngle-avatar.rotation.y))*(1-Math.exp(-dt*12));
  walk+=dt*speed*2;
  const amplitude=Math.min(.65,speed*.11);
  legs[0].rotation.x=Math.sin(walk)*amplitude;legs[1].rotation.x=-Math.sin(walk)*amplitude;
  arms[0].rotation.x=-Math.sin(walk)*amplitude*.7;arms[1].rotation.x=Math.sin(walk)*amplitude*.7;
 }else{
  for(const part of [...legs,...arms])part.rotation.x*=Math.exp(-dt*12);
 }
 const centralSite=buildings.find(b=>b.site.id==="central");
 const centralTarget=centralSite?new THREE.Vector3(centralSite.x,4.6,centralSite.z+centralSite.d*.25):overviewTarget;
 const target=(cameraMode==="third"||missionEngine.active)?avatar.position.clone().add(new THREE.Vector3(0,1.6,0)):cameraMode==="central"?centralTarget:overviewTarget;
 const desired=(cameraMode==="third"||missionEngine.active)?target.clone().add(new THREE.Vector3(Math.sin(yaw)*dist*Math.cos(pitch),dist*Math.sin(pitch)+2,Math.cos(yaw)*dist*Math.cos(pitch))):cameraMode==="central"?centralTarget.clone().add(new THREE.Vector3(13,15,34)):new THREE.Vector3(Math.sin(overviewYaw)*overviewDistance*.65,overviewDistance*.8,Math.cos(overviewYaw)*overviewDistance*.65);
 camera.position.lerp(desired,1-Math.exp(-dt*4));look.lerp(target,1-Math.exp(-dt*6));camera.lookAt(look);
 let nearest=null,range=Infinity;for(const b of buildings){const d=Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z);if(d<range){nearest=b;range=d}}
 missionEngine.update();
 nearbyMission=!missionEngine.active&&cameraMode==="third"&&nearest&&range<Math.max(nearest.w,nearest.d)*.85+5?nearest.site.id:null;
 if(missionEngine.active){place.textContent="Missão 3D em andamento";}
 else if(cameraMode==="central"){place.textContent="Prédio Central — estudo arquitetônico";hint.textContent="Fachada em desenvolvimento com arco azul, janelas, alas amarelas e jardins inspirados na referência."}
 else if(cameraMode==="overview"){place.textContent="Vista panorâmica da FAAMA";hint.textContent="Campus completo em 3D. Arraste para girar, use o scroll para zoom ou pressione C para explorar."}
 else if(nearest&&range<Math.max(nearest.w,nearest.d)*.85+4){place.textContent=nearest.site.short||nearest.site.name;hint.textContent=nearest.site.info+" • Pressione E para entrar no interior 3D."}
 else{place.textContent="Explorando o campus";hint.textContent="Explore os prédios em 3D. Pressione M para acessar as dez missões."}
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.getElementById("loading").remove();frame();
