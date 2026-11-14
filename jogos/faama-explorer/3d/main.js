import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import {createMissions3D} from "./missions3d.js";
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js";

const data={...window.FAAMA_MAP,sites:window.FAAMA_MAP.sites.map(site=>site.id==="male"?{...site,x:28.5,y:18,w:5,h:4}:site)};
// O residencial masculino ocupa a antiga posição da árvore florida rosa (31,20).
// A mudança é exclusiva da versão 3D: o mapa original permanece intacto.
if(!data?.sites||!data?.roads)throw Error("map-data.js não foi carregado");
const stage=document.getElementById("stage"),place=document.getElementById("place"),hint=document.getElementById("hint");
const scene=new THREE.Scene();scene.background=new THREE.Color("#a7d9e8");scene.fog=new THREE.FogExp2("#a7d9e8",.008);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,360);
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
const unit=2.4,spacing=1.4,originX=-17*unit*spacing,originZ=-22*unit*spacing;
// Aumenta as distâncias entre construções sem alterar as dimensões dos modelos.
const at=(x,y)=>({x:originX+x*unit*spacing,z:originZ+y*unit*spacing});
const base=new THREE.Mesh(new THREE.PlaneGeometry(300,320),mat("#739c68"));base.rotation.x=-Math.PI/2;base.position.y=-.13;base.receiveShadow=true;scene.add(base);
const campus=new THREE.Mesh(new THREE.PlaneGeometry(34*unit*spacing,44*unit*spacing),mat("#81ac72"));campus.rotation.x=-Math.PI/2;campus.position.set(originX+17*unit*spacing,-.07,originZ+22*unit*spacing);campus.receiveShadow=true;scene.add(campus);
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
// Fachada do Residencial Masculino modelada a partir da foto enviada.
function maleResidencePhotoModel(p,w,d){
 const x=p.x,z=p.z,front=z+d/2;
 const cream="#e9e6dc",tile="#f4f0e9",blue="#343f93",green="#2a9e7f",glass="#244a59";
 const add=(W,H,D,C,X,Y,Z)=>box(W,H,D,C,X,Y,Z);
 const sloped=(x0,z0,width,depth,height,angle)=>{
  const roofMesh=new THREE.Mesh(new THREE.BoxGeometry(width,.28,depth),mat(green));
  roofMesh.position.set(x0,height,z0);roofMesh.rotation.z=angle;roofMesh.castShadow=true;scene.add(roofMesh);
  for(let j=0;j<Math.floor(width/.36);j++){
   const xx=x0-width/2+.18+j*.36;
   const rib=box(.045,.065,depth,"#73c6ad",xx,height+.16+Math.tan(angle)*(xx-x0),z0,false);
   rib.rotation.z=angle;
  }
 };
 // Duas alas largas com fachadas de azulejo branco.
 add(w*.42,7.1,d*.95,cream,x-w*.3,3.55,z);
 add(w*.42,7.1,d*.95,cream,x+w*.3,3.55,z);
 add(w*.2,6.6,d*.84,"#d9d8d0",x,3.3,z-d*.06);
 for(const side of [-1,1]){
  const sx=x+side*w*.31;
  // Janelas de blocos de vidro no pavimento superior.
  for(let row=0;row<5;row++)for(let col=0;col<3;col++){
   add(.24,.26,.11,"#abc3cb",sx+(col-1)*.28,4.8+row*.3,front+.16);
   add(.04,.27,.13,"#f9f9f3",sx+(col-1)*.28+.14,4.8+row*.3,front+.22);
  }
  // Janelas térreas estreitas.
  add(w*.13,1.45,.13,glass,sx,2.05,front+.17);
  for(let k=0;k<4;k++)add(.055,1.45,.15,"#eeeae2",sx-w*.055+k*w*.037,2.05,front+.26);
  // Coberturas verdes inclinadas sobre as alas.
  sloped(sx,z,w*.49,d*1.1,7.5,-side*.09);
  // Mãos-francesas metálicas sob a borda do telhado.
  for(const dx of [-w*.16,w*.16]){
   const brace=add(.11,.85,.11,"#283b42",sx+dx,6.9,front+.42);
   brace.rotation.z=side*.4;
  }
 }
 // Entrada central profunda, envidraçada e com quatro portas.
 add(w*.39,3.45,.18,"#d9d8d0",x,1.75,front+.15);
 for(let i=0;i<4;i++){
  const xx=x+(i-1.5)*w*.09;
  add(w*.082,2.7,.19,glass,xx,1.5,front+.29);
  add(.055,2.8,.23,"#d7e2df",xx+w*.043,1.5,front+.43);
  add(w*.075,.06,.23,"#7fa7aa",xx,2.55,front+.44);
 }
 // Faixa de azulejos azul-violeta contornando a varanda.
 add(w*.49,.76,1.65,blue,x,3.77,front+1.1);
 add(w*.35,.8,.18,tile,x,4.52,front+1.91);
 for(const side of [-1,1]){
  const railing=add(w*.24,.13,.13,"#a6c2c8",x+side*w*.13,5.2,front+1.92);
  railing.rotation.y=side*.42;
  for(let i=0;i<4;i++){
   const xx=x+side*(w*.02+i*w*.055);
   add(.05,.65,.06,"#dce9e7",xx,4.9,front+1.91-i*.1);
  }
 }
 // Pórtico triangular frontal e empena acima da varanda.
 const triangle=new THREE.Shape();triangle.moveTo(-w*.23,0);triangle.lineTo(0,2.05);triangle.lineTo(w*.23,0);triangle.closePath();
 const tg=new THREE.ExtrudeGeometry(triangle,{depth:.38,bevelEnabled:false});
 const tympanum=new THREE.Mesh(tg,mat("#f0eee6"));tympanum.position.set(x,7.25,front-.35);tympanum.castShadow=true;scene.add(tympanum);
 // Coluna cilíndrica verde-clara, contínua entre os dois pavimentos.
 const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.38,.44,9.1,20),mat("#9bc9bf"));
 pillar.position.set(x,4.55,front+1.68);pillar.castShadow=true;scene.add(pillar);
 for(let j=0;j<20;j++){
  const theta=j*Math.PI*2/20;
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.07,8.85,.035),mat(j%3===0?"#d5e8e0":"#6fa99f"));
  strip.position.set(x+Math.cos(theta)*.405,4.55,front+1.68+Math.sin(theta)*.405);
  strip.rotation.y=-theta;scene.add(strip);
 }
 // Jardins e passeio em frente à entrada.
 add(w*.55,.12,3.1,"#e4dfd4",x,.07,front+2.5);
 for(const side of [-1,1]){
  const bx=x+side*w*.4;
  add(w*.18,.48,1.45,"#d9d1c4",bx,.24,front+2.3);
  for(let i=0;i<4;i++){
   const xx=bx+(i-1.5)*w*.035;
   const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.29,1),mat(i%2?"#578a4b":"#8a6449"));
   leaf.position.set(xx,.76,front+2.3);scene.add(leaf);
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
 if(s.type==="male"){
  buildings.push({site:s,x:p.x,z:p.z,w,d});
  maleResidencePhotoModel(p,w,d);
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
  // Complexo esportivo: ginásio arqueado, quadra interna, quadras externas e arena.
  // Dimensões em unidades do mundo; a área externa se estende para a esquerda do ginásio.
  const group=new THREE.Group();group.position.set(p.x,0,p.z);scene.add(group);
  const add=(geo,color,x,y,z,opts={})=>{
   const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.78,metalness:opts.metalness??0,side:opts.double?THREE.DoubleSide:THREE.FrontSide}));
   mesh.position.set(x,y,z);mesh.castShadow=!!opts.shadow;mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const slab=(W,H,D,color,x,y,z)=>add(new THREE.BoxGeometry(W,H,D),color,x,y,z);
  const line=(x1,z1,x2,z2,color="#f5f2df",width=.085,y=.12)=>{
   const length=Math.hypot(x2-x1,z2-z1);
   const mesh=slab(width,.018,length,color,(x1+x2)/2,y,(z1+z2)/2);
   mesh.rotation.y=Math.atan2(x2-x1,z2-z1);
  };
  const court=(cx,cz,W,D,ground,markings=true)=>{
   slab(W+.7,.2,D+.7,"#d4d0c0",cx,.08,cz);
   slab(W,.06,D,ground,cx,.21,cz);
   if(markings){
    const l=cx-W*.45,r=cx+W*.45,t=cz-D*.44,bt=cz+D*.44;
    line(l,t,r,t);line(l,bt,r,bt);line(l,t,l,bt);line(r,t,r,bt);line(cx,t,cx,bt);
    const circle=add(new THREE.TorusGeometry(Math.min(W,D)*.16,.052,5,40),"#f5f2df",cx,.27,cz);
    circle.rotation.x=Math.PI/2;
   }
  };
  const goal=(gx,gz,dir)=>{
   const white="#f4f4e8",side=dir*1.05;
   slab(.12,1.65,.12,white,gx-1.15,1.03,gz);
   slab(.12,1.65,.12,white,gx+1.15,1.03,gz);
   slab(2.45,.12,.12,white,gx,1.86,gz);
   for(let j=0;j<5;j++)line(gx-1.12+j*.56,gz,gx-1.12+j*.56,gz+side,"#d8e4e0",.024,1.02);
  };
  // Quadra externa de futsal e basquete, com tela de proteção.
  const outerX=-w*.95,outerZ=0,outerW=w*.96,outerD=d*.85;
  court(outerX,outerZ,outerW,outerD,"#327eaa");
  slab(outerW*.4,.055,outerD*.8,"#367b5d",outerX,.245,outerZ);
  goal(outerX,outerZ-outerD*.45,1);goal(outerX,outerZ+outerD*.45,-1);
  for(const side of [-1,1]){
   const bx=outerX+side*outerW*.39;
   slab(.09,3,.09,"#dce6e7",bx,1.6,outerZ);
   const back=slab(1.35,.75,.06,"#e9ecea",bx,3.2,outerZ);
   const hoop=add(new THREE.TorusGeometry(.29,.055,7,24),"#d47b32",bx-side*.42,2.93,outerZ);
   hoop.rotation.y=Math.PI/2;
  }
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const px=outerX+side*(outerW/2+.2),pz=outerZ-outerD/2+i*outerD/4;
   slab(.065,3.6,.065,"#a6c3c0",px,1.9,pz);
  }
  for(const side of [-1,1]){
   const zz=outerZ+side*(outerD/2+.22);
   for(let i=0;i<9;i++)slab(.025,2.6,.025,"#9abdb8",outerX-outerW/2+i*outerW/8,1.5,zz);
   slab(outerW,.045,.045,"#a6c3c0",outerX,2.75,zz);
  }
  // Ginásio coberto, com piso poliesportivo, arquibancadas e cobertura arqueada.
  const gymX=w*.12,gymZ=0,gymW=w*1.08,gymD=d*.95;
  slab(gymW+1,.26,gymD+1,"#d2cfc1",gymX,.1,gymZ);
  court(gymX,gymZ,gymW*.85,gymD*.76,"#327d59");
  for(const side of [-1,1]){
   for(let level=0;level<3;level++){
    slab(.72,.24,gymD*.73,"#c5b48e",gymX+side*(gymW*.46+level*.25),.48+level*.36,gymZ);
   }
  }
  // Arco elíptico contínuo: painel translúcido branco e estrutura azul.
  const roofBase=6.9,archRise=3.15,roofHalf=gymW*.59,segments=32;
  const vertices=[],faces=[];
  for(let i=0;i<=segments;i++){
   const u=i/segments,xx=gymX-roofHalf+u*roofHalf*2;
   const height=roofBase+archRise*Math.sin(Math.PI*u);
   vertices.push(xx,height,gymZ-gymD*.58,xx,height,gymZ+gymD*.58);
   if(i<segments){const n=i*2;faces.push(n,n+1,n+2,n+1,n+3,n+2)}
  }
  const roofGeo=new THREE.BufferGeometry();
  roofGeo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  roofGeo.setIndex(faces);roofGeo.computeVertexNormals();
  add(roofGeo,"#f0eee1",0,0,0,{double:true});
  const beam=(x1,y1,z1,x2,y2,z2,color,thickness)=>{
   const from=new THREE.Vector3(x1,y1,z1),to=new THREE.Vector3(x2,y2,z2);
   const mesh=add(new THREE.CylinderGeometry(thickness,thickness,from.distanceTo(to),8),color,0,0,0,{shadow:true});
   mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());
  };
  for(let i=0;i<=segments;i+=4){
   const u=i/segments,xx=gymX-roofHalf+u*roofHalf*2,yy=roofBase+archRise*Math.sin(Math.PI*u);
   beam(xx,yy,gymZ-gymD*.6,xx,yy,gymZ+gymD*.6,"#1768b4",.075);
  }
  for(const zz of [gymZ-gymD*.6,gymZ+gymD*.6]){
   for(let i=0;i<segments;i++){
    const u=i/segments,v=(i+1)/segments;
    beam(gymX-roofHalf+u*roofHalf*2,roofBase+archRise*Math.sin(Math.PI*u),zz,
     gymX-roofHalf+v*roofHalf*2,roofBase+archRise*Math.sin(Math.PI*v),zz,"#1465af",.13);
   }
  }
  for(const xx of [gymX-roofHalf,gymX+roofHalf]){
   for(const zz of [gymZ-gymD*.54,gymZ+gymD*.54]){
    beam(xx,.2,zz,xx,roofBase,zz,"#e5e9e4",.11);
   }
  }
  // Iluminação suspensa no interior.
  for(const xx of [gymX-gymW*.23,gymX+gymW*.23]){
   for(const zz of [gymZ-gymD*.25,gymZ+gymD*.25]){
    const lamp=add(new THREE.BoxGeometry(1.25,.08,.32),"#f8f4d8",xx,roofBase-.8,zz);
    lamp.material.emissive=new THREE.Color("#d9cba1");lamp.material.emissiveIntensity=.35;
   }
  }
  // Quadra de areia ao lado, como espaço adicional do conjunto.
  const sandX=-w*.92,sandZ=d*.93,sandW=w*.86,sandD=d*.65;
  slab(sandW+.45,.18,sandD+.45,"#bfb8a5",sandX,.07,sandZ);
  slab(sandW,.07,sandD,"#e6c78b",sandX,.18,sandZ);
  line(sandX-sandW*.43,sandZ,sandX+sandW*.43,sandZ,"#f6f4ed",.065,.26);
  for(const side of [-1,1]){
   const px=sandX+side*sandW*.46;
   slab(.08,2.45,.08,"#e5e6e0",px,1.25,sandZ);
  }
  slab(sandW*.92,.05,.04,"#dbe6e6",sandX,1.6,sandZ);
  // Placa de identificação e acesso.
  slab(gymW*.44,.5,.16,"#185b9a",gymX,3.55,gymZ+gymD*.64);
  buildings.push({site:s,x:p.x,z:p.z,w:Math.max(w*2.9,outerW+gymW),d:d*2.5});
  return;
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
for(const s of data.sites){
 if(s.id!=="male"&&s.id!=="academic"&&s.id!=="church"&&s.id!=="school"){addBuilding(s);continue}
 // Girar os prédios masculino, acadêmico e igreja para apresentar suas fachadas ao caminho.
 const before=new Set(scene.children);
 addBuilding(s);
 const p=at(s.x+s.w/2,s.y+s.h/2);
 const group=new THREE.Group();group.position.set(p.x,0,p.z);
 for(const child of [...scene.children]){
  if(before.has(child))continue;
  scene.remove(child);
  child.position.x-=p.x;child.position.z-=p.z;
  group.add(child);
 }
 group.rotation.y=(s.id==="church"||s.id==="school")?Math.PI/2:-Math.PI/2;
 scene.add(group);
}
function path(points,width,color){
 for(let i=0;i<points.length-1;i++){
  const a=at(...points[i]),b=at(...points[i+1]),len=Math.hypot(b.x-a.x,b.z-a.z);
  const o=box(width,.065,len,color,(a.x+b.x)/2,.015,(a.z+b.z)/2,false);
  o.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
 }
}
for(const road of data.roads){path(road,3.5,"#c7bea4");path(road,2.85,"#e4d6b8")}
const trunkMat=mat("#6e5740"),leaves=[mat("#346e48"),mat("#4a8753"),mat("#629a5e"),mat("#3b7d4a")];
// Vegetação orgânica otimizada: galhos visíveis e folhagens irregulares.
// Inspirada nas referências HighPoly Tree Packs, sem copiar ativos comerciais.
const leafGeo=new THREE.IcosahedronGeometry(1,2);
const branchGeo=new THREE.CylinderGeometry(.07,.12,1,6);
function organicTree(x,z,seed,pink=false){
 const rand=(n)=>rng(seed*3.79+n*17.23);
 const height=3.5+rand(1)*1.8,spread=1.65+rand(2)*.7;
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.28,height*.72,9),mat("#73543c"));
 trunk.position.set(x,height*.36,z);trunk.castShadow=true;scene.add(trunk);
 const palette=pink?["#ef8ab9","#f3a6c9","#df6aa7","#f5bad4"]:["#437b3b","#579246","#6e9f4f","#356e40","#83aa56"];
 for(let i=0;i<7;i++){
  const theta=i*Math.PI*2/7+rand(i+5)*.55,rad=spread*(.35+rand(i+18)*.48);
  const bx=x+Math.cos(theta)*rad,bz=z+Math.sin(theta)*rad,by=height*(.68+rand(i+30)*.26);
  const from=new THREE.Vector3(x,height*.55,z),to=new THREE.Vector3(bx,by,bz),v=to.clone().sub(from);
  const branch=new THREE.Mesh(branchGeo,mat("#73543c"));branch.position.copy(from).add(to).multiplyScalar(.5);branch.scale.set(1,v.length(),1);branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());scene.add(branch);
  const cluster=new THREE.Mesh(leafGeo,mat(palette[i%palette.length],.93));
  cluster.position.set(bx,by,bz);cluster.scale.set(.8+rand(i+40)*.55,.9+rand(i+50)*.65,.85+rand(i+60)*.55);cluster.castShadow=i%2===0;scene.add(cluster);
 }
 for(let i=0;i<3;i++){
  const crown=new THREE.Mesh(leafGeo,mat(palette[(i+2)%palette.length],.93));
  crown.position.set(x+(i-1)*.48,height+.15+(i%2)*.28,z+(i-1)*.3);
  crown.scale.set(1.02,.85,1.05);crown.castShadow=true;scene.add(crown);
 }
}
function tree(x,z,seed){organicTree(x,z,seed,false)}
function nearRoad(x,y){for(const road of data.roads)for(let i=1;i<road.length;i++){const [ax,ay]=road[i-1],[bx,by]=road[i],vx=bx-ax,vy=by-ay;const t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy||1)));if(Math.hypot(x-ax-vx*t,y-ay-vy*t)<1.8)return true}return false}
function insideBuilding(x,y,pad=0){return data.sites.some(s=>x>s.x-pad&&x<s.x+s.w+pad&&y>s.y-pad&&y<s.y+s.h+pad)}
// Praça principal grande diretamente ATRÁS do Prédio Central (ao norte no mapa), conforme referência aérea.
// Praça principal circular com anéis concêntricos e três pequenos jardins redondos.
// Praça principal: ocupa a área imediatamente atrás do Prédio Central.
const plazas=[{x:19,y:18.2,r:16},{x:11.7,y:19.2,r:3.5},{x:11.5,y:22,r:3.1},{x:13,y:15.9,r:3.2}];
function inPlaza(gx,gy,pad=0){return plazas.some(q=>Math.hypot((gx-q.x)*unit*spacing,(gy-q.y)*unit*spacing)<q.r+pad)}
function plazaCircle(gx,gy,r,kind="main"){
 const p=at(gx,gy),n=64;
 const disc=(radius,color,y)=>{
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.09,n),mat(color));
  mesh.position.set(p.x,y,p.z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
 };
 const ring=(radius,tube,color,y)=>{
  const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,n),mat(color));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,y,p.z);mesh.receiveShadow=true;scene.add(mesh);
 };
 disc(r,"#e3dcca",.24);ring(r-.09,.19,"#faf8f1",.32);
 if(kind==="main"){
  disc(r*.83,"#48864c",.26);ring(r*.82,.18,"#eee8da",.34);
  disc(r*.61,"#ddd7c7",.36);ring(r*.60,.15,"#f9f7f0",.44);
  disc(r*.36,"#43814c",.46);ring(r*.35,.14,"#e8e4d8",.54);
  disc(r*.13,"#ddd8c9",.56);
  // Canteiros floridos, anéis de arbustos e bancos como na referência.
  for(let i=0;i<48;i++){
   const angle=i*Math.PI*2/48,rr=r*(i%3===0?.73:.88);
   const bloom=new THREE.Mesh(new THREE.IcosahedronGeometry(.22+(i%4)*.035,1),mat(i%4===0?"#f08bb4":i%4===1?"#e5c755":i%4===2?"#e56e96":"#55954d"));
   bloom.position.set(p.x+Math.cos(angle)*rr,.46,p.z+Math.sin(angle)*rr);scene.add(bloom);
  }
  for(let i=0;i<12;i++){
   const angle=i*Math.PI*2/12,rr=r*.47;
   const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.26,1),mat(i%2?"#d979a0":"#5b9b53"));
   shrub.position.set(p.x+Math.cos(angle)*rr,.52,p.z+Math.sin(angle)*rr);scene.add(shrub);
  }
  for(let i=0;i<8;i++){
   const t=i*Math.PI/4,xx=p.x+Math.cos(t)*r*.66,zz=p.z+Math.sin(t)*r*.66;
   const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,1),mat(i%2?"#417a45":"#598e4d"));
   shrub.position.set(xx,.51,zz);scene.add(shrub);
  }
  for(let i=0;i<4;i++){
   const t=i*Math.PI/2,xx=p.x+Math.cos(t)*r*.93,zz=p.z+Math.sin(t)*r*.93;
   const bench=box(.85,.17,.3,"#9b7650",xx,.42,zz);
   bench.rotation.y=-t;
  }
 }else{
  disc(r*.76,"#48824a",.18);ring(r*.76,.11,"#f2f0e7",.24);
  for(let i=0;i<5;i++){
   const t=i*Math.PI*2/5;
   const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,1),mat(i%2?"#e7b257":"#bd6580"));
   shrub.position.set(p.x+Math.cos(t)*r*.45,.43,p.z+Math.sin(t)*r*.45);scene.add(shrub);
  }
 }
}
function plazaWalk(a,b,width=1.7){
 const A=at(...a),B=at(...b),length=Math.hypot(B.x-A.x,B.z-A.z);
 const walk=box(width,.065,length,"#e7dfcd",(A.x+B.x)/2,.12,(A.z+B.z)/2,false);
 walk.rotation.y=Math.atan2(B.x-A.x,B.z-A.z);
}
// Praça reconstruída na traseira do Central. O disco é grande e claramente visível na panorâmica.
plazaWalk([19,24],[19,18.2],3.3);
plazaWalk([19,18.2],[19,12.8],2.4);
plazaWalk([19,18.2],[11.7,19.2],2);
plazaWalk([11.7,19.2],[11.5,22],1.6);
plazaWalk([11.7,19.2],[13,15.9],1.6);
plazaCircle(19,18.2,16);
plazaCircle(11.7,19.2,3.5,"garden");
plazaCircle(11.5,22,3.1,"garden");
plazaCircle(13,15.9,3.2,"garden");
// Elemento identificador visível, inclusive quando a câmera estiver distante.
const plazaMarker=document.createElement("div");
plazaMarker.textContent="✓ CENÁRIO ATUALIZADO · PRAÇA GRANDE V5";
Object.assign(plazaMarker.style,{position:"fixed",bottom:"12px",left:"12px",zIndex:"9999",background:"#123b31",color:"#fff",padding:"9px 12px",borderRadius:"9px",font:"bold 12px system-ui",pointerEvents:"none"});
document.body.appendChild(plazaMarker);
for(let y=1;y<43;y+=1.6)for(let x=1;x<33;x+=1.55){const seed=rng(x*31+y*17);if(seed<.57||insideBuilding(x,y,1.3)||nearRoad(x,y)||inPlaza(x,y,1.3))continue;const p=at(x+(seed-.5)*.7,y+(rng(seed*22)-.5)*.7);tree(p.x,p.z,seed)}
for(let i=0;i<85;i++){const x=1+rng(i*19)*32,y=1+rng(i*47)*42;if(insideBuilding(x,y,.8)||nearRoad(x,y)||inPlaza(x,y,.5))continue;const p=at(x,y);box(.12,.25,.12,i%4===0?"#e7d49a":"#5c9553",p.x,.08,p.z,false)}
// Paisagismo inspirado na referência: palmeiras, ipês floridos, postes e portaria.
function palm(x,z){
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.13,.25,5.8,9),mat("#8d7250"));stem.position.set(x,2.9,z);stem.castShadow=true;scene.add(stem);
 for(let i=0;i<9;i++){const angle=i*Math.PI*2/9;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.45,3.6,5),mat(i%2?"#3e994e":"#5db95b"));leaf.position.set(x+Math.cos(angle)*1.25,5.9,z+Math.sin(angle)*1.25);leaf.rotation.z=Math.cos(angle)*.88;leaf.rotation.x=-Math.sin(angle)*.88;leaf.castShadow=true;scene.add(leaf)}
}
function flowering(x,z,seed){organicTree(x,z,seed,true)}
for(const [x,y] of [[12,24],[24,25],[11,33],[26,34],[12,17],[23,18],[10,39],[27,24],[8,21],[15,14],[24,10]]){const p=at(x,y);if(!insideBuilding(x,y,.4)&&!inPlaza(x,y,1))palm(p.x,p.z)}
for(const [x,y] of [[9,27],[12,30],[13,36],[25,35],[24,30],[8,36],[11,18],[23,13],[7,24]]){const p=at(x,y);if(!insideBuilding(x,y,.2)&&!inPlaza(x,y,1))flowering(p.x,p.z,x*y)}
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
const plazaTarget=at(19,18.2);
const plazaButton=document.getElementById("cameraPlaza");
const thirdButton=document.getElementById("cameraThird"),overviewButton=document.getElementById("cameraOverview"),centralButton=document.getElementById("cameraCentral");
function setCameraMode(mode){
 cameraMode=["central","overview","plaza"].includes(mode)?mode:"third";held.clear();dragging=false;
 plazaButton.classList.toggle("selected",cameraMode==="plaza");
 plazaButton.setAttribute("aria-pressed",String(cameraMode==="plaza"));
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
plazaButton.addEventListener("click",()=>setCameraMode("plaza"));
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
renderer.domElement.addEventListener("wheel",e=>{if(cameraMode==="third")dist=THREE.MathUtils.clamp(dist+e.deltaY*.012,6,22);else overviewDistance=THREE.MathUtils.clamp(overviewDistance+e.deltaY*.12,80,255);e.preventDefault()},{passive:false});
function blocked(x,z){if(missionEngine.active)return missionEngine.blocked(x,z);const gx=(x-originX)/(unit*spacing),gy=(z-originZ)/(unit*spacing),r=playerRadius/(unit*spacing);if(gx<.5+r||gx>33.5-r||gy<.5+r||gy>43.5-r)return true;return buildings.some(b=>b.site.type!=="pool"&&Math.abs(x-b.x)<b.w/2+playerRadius&&Math.abs(z-b.z)<b.d/2+playerRadius)}
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
 const target=(cameraMode==="third"||missionEngine.active)?avatar.position.clone().add(new THREE.Vector3(0,1.6,0)):cameraMode==="central"?centralTarget:cameraMode==="plaza"?new THREE.Vector3(plazaTarget.x,0,plazaTarget.z):overviewTarget;
 const desired=(cameraMode==="third"||missionEngine.active)?target.clone().add(new THREE.Vector3(Math.sin(yaw)*dist*Math.cos(pitch),dist*Math.sin(pitch)+2,Math.cos(yaw)*dist*Math.cos(pitch))):cameraMode==="central"?centralTarget.clone().add(new THREE.Vector3(13,15,34)):cameraMode==="plaza"?new THREE.Vector3(plazaTarget.x+16,39,plazaTarget.z+27):new THREE.Vector3(Math.sin(overviewYaw)*overviewDistance*.65,overviewDistance*.8,Math.cos(overviewYaw)*overviewDistance*.65);
 camera.position.lerp(desired,1-Math.exp(-dt*4));look.lerp(target,1-Math.exp(-dt*6));camera.lookAt(look);
 let nearest=null,range=Infinity;for(const b of buildings){const d=Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z);if(d<range){nearest=b;range=d}}
 missionEngine.update();
 nearbyMission=!missionEngine.active&&cameraMode==="third"&&nearest&&range<Math.max(nearest.w,nearest.d)*.85+5?nearest.site.id:null;
 if(missionEngine.active){place.textContent="Missão 3D em andamento";}
 else if(cameraMode==="plaza"){place.textContent="Praça principal atrás do Prédio Central";hint.textContent="Praça circular principal e jardins menores. Use Terceira pessoa para explorar a pé."}
 else if(cameraMode==="central"){place.textContent="Prédio Central — estudo arquitetônico";hint.textContent="Fachada em desenvolvimento com arco azul, janelas, alas amarelas e jardins inspirados na referência."}
 else if(cameraMode==="overview"){place.textContent="Vista panorâmica da FAAMA";hint.textContent="Campus completo em 3D. Arraste para girar, use o scroll para zoom ou pressione C para explorar."}
 else if(nearest&&range<Math.max(nearest.w,nearest.d)*.85+4){place.textContent=nearest.site.short||nearest.site.name;hint.textContent=nearest.site.info+" • Pressione E para entrar no interior 3D."}
 else{place.textContent="Explorando o campus";hint.textContent="Explore os prédios em 3D. Pressione M para acessar as dez missões."}
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.getElementById("loading").remove();frame();
