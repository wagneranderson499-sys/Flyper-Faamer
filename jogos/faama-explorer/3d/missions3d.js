// Missões nativas do Three.js. Não depende do motor Canvas 2D.
export function createMissions3D(THREE,{scene,avatar,at,unit,sites,held,box,mat,place,hint}){
 const panel=document.getElementById("mission3dPanel"),title=document.getElementById("mission3dTitle");
 const description=document.getElementById("mission3dDescription"),progress=document.getElementById("mission3dProgress");
 const choices=document.getElementById("mission3dChoices"),list=document.getElementById("missionList");
 const toggle=document.getElementById("missionsToggle"),menu=document.getElementById("missionsPanel"),count=document.getElementById("missionCount");
 const conf={
  central:{title:"Prédio Central — Enigma da Chave",npc:"Marina",color:"#ecaa56",task:"Encontre as três pistas no saguão e resolva o código do armário.",labels:["Mural","Quadro","Estante"],question:"Qual é o código das pistas: mural (2), quadro (3), estante (1)?",answers:["231","312","123"],correct:0},
  academic:{title:"Prédio Acadêmico — Conhecimento",npc:"Professora Helena",color:"#6385bd",task:"Colete os três selos e responda à pergunta.",labels:["Biblioteca","Laboratório","Sala de aula"],question:"Qual atitude favorece a aprendizagem?",answers:["Estudar só na véspera","Revisar com regularidade","Ignorar dúvidas"],correct:1},
  sports:{title:"Complexo Esportivo — Circuito",npc:"Rafael",color:"#52aa77",task:"Recolha cinco medalhas antes que o tempo acabe.",labels:["Medalha 1","Medalha 2","Medalha 3","Medalha 4","Medalha 5"],seconds:90},
  restaurant:{title:"Restaurante Misterioso",npc:"Clara",color:"#d48d54",task:"Encontre os cinco pedidos e entregue-os à cozinheira.",labels:["Pedido 1","Pedido 2","Pedido 3","Pedido 4","Pedido 5"],seconds:180},
  school:{title:"FAAMinha — Caça ao Tesouro",npc:"Sofia",color:"#a0c64e",task:"Encontre cinco pistas escondidas na escola.",labels:["Pista 1","Pista 2","Pista 3","Pista 4","Pista 5"]},
  pool:{title:"Piscina — Desafio Aquático",npc:"Nara",color:"#42bde0",task:"Recolha as cinco boias do circuito.",labels:["Boia 1","Boia 2","Boia 3","Boia 4","Boia 5"],seconds:120},
  female:{title:"Residencial Feminino — Organização",npc:"Monitora",color:"#c87691",task:"Encontre três objetos e organize a rotina.",labels:["Planner","Livro","Chave"],question:"Qual hábito ajuda na organização?",answers:["Planejar tarefas","Adiar tudo","Dormir sem rotina"],correct:0},
  male:{title:"Residencial Masculino — Organização",npc:"Monitor",color:"#69aa95",task:"Encontre três objetos e organize a rotina.",labels:["Agenda","Caderno","Chave"],question:"Qual estratégia evita a procrastinação?",answers:["Dividir tarefas em etapas","Deixar tudo para depois","Ignorar prazos"],correct:0},
  church:{title:"Igreja — Desafio Final",npc:"Samuel",color:"#d6a26b",task:"Reúna três símbolos e conclua a jornada.",labels:["Esperança","Solidariedade","Gratidão"],question:"Qual atitude fortalece a convivência?",answers:["Respeitar e ajudar","Excluir colegas","Evitar diálogo"],correct:0}
 };
 const storageKey="faama-explorer-3d-progress-v1";
 let completed={};try{completed=JSON.parse(localStorage.getItem(storageKey)||"{}")}catch{}
 let active=null,room=null,items=[],collected=new Set(),started=0,entryPosition=null,nearItem=null;
 const completedCount=()=>Object.keys(conf).filter(k=>completed[k]).length;
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(completed))}catch{}renderMenu()}
 function renderMenu(){
  count.textContent=completedCount()+" / "+Object.keys(conf).length;
  list.replaceChildren();
  for(const [id,c] of Object.entries(conf)){
   const b=document.createElement("button");b.textContent=(completed[id]?"✓ ":"○ ")+c.title;
   b.addEventListener("click",()=>{menu.hidden=true;const site=sites.find(s=>s.id===id);if(site){const pos=at(site.x+site.w/2,site.y+site.h+1.4);avatar.position.set(pos.x,0,pos.z);hint.textContent="Você chegou à entrada. Pressione E para entrar."}});
   list.appendChild(b);
  }
 }
 function show(){if(!active)return;const c=conf[active];title.textContent=c.title;description.textContent=c.task+" • Converse com "+c.npc+" e explore a sala.";progress.textContent=collected.size+" / "+c.labels.length+" objetos"+(c.seconds?" • Tempo restante: "+Math.max(0,Math.ceil(c.seconds-(performance.now()-started)/1000))+"s":"");}
 function makeBox(parent,w,h,d,color,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 function createRoom(c){
  room=new THREE.Group();room.position.set(175,0,0);scene.add(room);
  makeBox(room,26,.35,22,"#c4b9a5",0,-.2,0);
  makeBox(room,26,9,.35,c.color,0,4.5,-11);
  makeBox(room,.35,9,22,"#e8e5d9",-13,4.5,0);
  makeBox(room,.35,9,22,"#e8e5d9",13,4.5,0);
  for(let i=0;i<4;i++){
   makeBox(room,3,2.7,.15,"#4b9eb9",-9+i*6,5.2,-10.76);
   makeBox(room,3.2,.16,.25,"#f4f2e6",-9+i*6,3.75,-10.61);
  }
  makeBox(room,6,1.15,2.4,"#916d4d",0,.7,-7);
  makeBox(room,5,.18,2.8,"#e9d5b1",0,1.4,-7);
  for(const x of [-9,9])for(const z of [-5,4]){
   makeBox(room,2.8,1.4,2.5,"#a88763",x,.7,z);
   makeBox(room,2.8,.15,2.5,"#e3c6a2",x,1.45,z);
  }
  const npc=new THREE.Group();npc.position.set(0,0,-7);room.add(npc);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,4,10),mat("#32688c"));torso.position.y=1.35;npc.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.4,14,12),mat("#c99070"));head.position.y=2.35;npc.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.42,14,10,0,Math.PI*2,0,Math.PI*.45),mat("#36291f"));hair.position.y=2.46;npc.add(hair);
  items=[];
  const points=[[-9,-7],[9,-7],[-9,1],[9,1],[-6,7],[6,7]];
  c.labels.forEach((label,i)=>{
   const [x,z]=points[i],group=new THREE.Group();group.position.set(x,1.95,z);
   const shape=new THREE.Mesh(new THREE.IcosahedronGeometry(.63,1),new THREE.MeshStandardMaterial({color:i%2?"#f4d27b":"#70e5df",metalness:.28,roughness:.25,emissive:"#214f4c",emissiveIntensity:.25}));
   group.add(shape);room.add(group);items.push({label,group,x,z,index:i});
  });
 }
 function enter(id){
  if(active||!conf[id])return;
  if(id==="church"&&Object.keys(conf).filter(k=>k!=="church"&&completed[k]).length<8){hint.textContent="Conclua as outras oito aventuras antes da fase final!";return}
  active=id;collected=new Set();started=performance.now();entryPosition=avatar.position.clone();
  createRoom(conf[id]);avatar.position.set(175,0,7);held.clear();panel.hidden=false;menu.hidden=true;
  choices.replaceChildren();show();hint.textContent="Missão 3D: WASD para caminhar, E para coletar e Esc para sair.";
 }
 function leave(){
  if(!active)return;scene.remove(room);room.traverse(o=>{if(o.geometry)o.geometry.dispose()});room=null;items=[];nearItem=null;
  avatar.position.copy(entryPosition);active=null;panel.hidden=true;choices.replaceChildren();held.clear();
 }
 function finish(){
  completed[active]=true;save();description.textContent="Missão concluída! Parabéns pela conquista.";
  progress.textContent="✓ Concluída • Progresso salvo";
  choices.replaceChildren();const b=document.createElement("button");b.textContent="Voltar ao campus";b.onclick=leave;choices.appendChild(b);
 }
 function interact(){
  if(!active)return false;
  if(nearItem){collected.add(nearItem.index);nearItem.group.visible=false;nearItem=null;show();if(collected.size===items.length)resolve();return true}
  if(collected.size===items.length){resolve();return true}
  hint.textContent="Aproxime-se dos objetos brilhantes e pressione E.";return true;
 }
 function resolve(){
  const c=conf[active];if(c.question){
   description.textContent=c.question;choices.replaceChildren();
   c.answers.forEach((answer,i)=>{const b=document.createElement("button");b.textContent=answer;b.onclick=()=>{if(i===c.correct)finish();else progress.textContent="Resposta incorreta. Tente novamente."};choices.appendChild(b)});
  }else finish();
 }
 function update(){
  if(!active)return;
  const elapsed=(performance.now()-started)/1000,c=conf[active];
  if(c.seconds&&elapsed>=c.seconds&&collected.size<items.length){description.textContent="O tempo acabou! Saia e tente novamente.";progress.textContent="Tempo esgotado";items.forEach(x=>x.group.visible=false);return}
  nearItem=null;let best=2.1;
  for(const item of items){if(collected.has(item.index))continue;item.group.rotation.y+=.014;item.group.position.y=1.95+Math.sin(performance.now()*.002+item.index)*.18;
   const d=Math.hypot(avatar.position.x-(175+item.x),avatar.position.z-item.z);
   if(d<best){best=d;nearItem=item}
  }
  if(nearItem)hint.textContent="E • Coletar "+nearItem.label;
  else hint.textContent="Explore a sala e encontre os objetos brilhantes.";
  if(c.seconds)progress.textContent=collected.size+" / "+items.length+" • "+Math.max(0,Math.ceil(c.seconds-elapsed))+"s";
 }
 function blocked(x,z){return active&&(x<163||x>187||z< -10||z>10)}
 toggle.addEventListener("click",()=>{menu.hidden=!menu.hidden});
 document.getElementById("exit3dMission").addEventListener("click",leave);
 document.getElementById("new3dJourney").addEventListener("click",()=>{if(!confirm("Reiniciar todas as missões 3D?"))return;completed={};save();if(active)leave()});
 renderMenu();
 return {enter,leave,interact,update,blocked,get active(){return active},get completed(){return completedCount()}};
}
