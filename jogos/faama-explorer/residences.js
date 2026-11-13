/* FAAMA Explorer 3.1/3.2 — Residenciais Feminino e Masculino.
   Dois cenários e missões independentes, com desafios de organização e convivência.
   Moradias virtuais fictícias; nenhum cômodo representa uma planta real do internato.
*/
"use strict";
window.createFaamaResidence=function createFaamaResidence({kind,ctx,storage,canvasWidth=1200,canvasHeight=760}){
  if(kind!=="female"&&kind!=="male")throw Error("Residencial desconhecido");
  const female=kind==="female",KEY="faama-explorer-quest-0"+(female?"8":"9")+"-v1";
  const W=28,H=20,T=30,ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const point=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const conf=female?{
    name:"Residencial Feminino",short:"FEMININO",title:"A Rotina Equilibrada",
    npc:{id:"isabela-residencia",name:"Isabela",role:"Monitora do Residencial Feminino",
      x:12.8,y:15.55,skin:"#c18e6d",hair:"#44343e",shirt:"#be849c"},
    colors:{floor:"#f4d6cc",library:"#c4dccd",room:"#ddc9e3",wall:"#cfb7bc",accent:"#b6768c",banner:"#78506c"},
    items:[
      {id:"agenda",name:"Agenda semanal",icon:"📒",x:5.2,y:5.1,room:"Sala de estudos"},
      {id:"garrafa",name:"Garrafa de água",icon:"💧",x:14,y:4.7,room:"Espaço de convivência"},
      {id:"livro",name:"Livro de leitura",icon:"📖",x:21.2,y:7.1,room:"Quarto demonstrativo"}
    ],
    puzzles:[
      {title:"Organizar os estudos",question:"Há várias tarefas para a semana. O que ajuda a evitar a sobrecarga?",
        choices:["Deixar tudo para a última noite","Definir prioridades e dividir tarefas em etapas","Ignorar os prazos"],correct:1,
        success:"Etapa de estudos organizada! Próximo desafio: autocuidado."},
      {title:"Praticar autocuidado",question:"Durante uma rotina longa, qual atitude favorece o bem-estar?",
        choices:["Fazer pausas e beber água","Passar o dia sem descanso","Evitar pedir ajuda"],correct:0,
        success:"Autocuidado incluído! Falta planejar o descanso."},
      {title:"Preservar o descanso",question:"Como equilibrar estudo, convivência e sono?",
        choices:["Virar a noite sempre","Cancelar todas as atividades sociais","Reservar horários realistas para descanso e lazer"],correct:2,
        success:"Rotina equilibrada construída! Volte a Isabela."}
    ],
    startLines:[
      "Olá! Sou Isabela. Quero montar com você uma rotina equilibrada para a vida no internato.",
      "Três objetos importantes estão espalhados pelo residencial: uma agenda, uma garrafa de água e um livro.",
      "Encontre-os e venha ao quadro de organização na recepção.",
      "Depois, escolha boas estratégias para estudos, autocuidado e descanso. Volte a mim quando terminar!"
    ],
    reward:"Organizador da Rotina"
  }:{
    name:"Residencial Masculino",short:"MASCULINO",title:"Projeto em Equipe",
    npc:{id:"gabriel-residencia",name:"Gabriel",role:"Monitor do Residencial Masculino",
      x:12.8,y:15.55,skin:"#ae7955",hair:"#303844",shirt:"#7d9abc"},
    colors:{floor:"#cbdce0",library:"#dad7bd",room:"#b8d1ca",wall:"#a0b6c4",accent:"#588e9e",banner:"#315c75"},
    items:[
      {id:"cartaz",name:"Cartaz do projeto",icon:"🗒️",x:5.2,y:5.1,room:"Sala de estudos"},
      {id:"lanterna",name:"Lanterna de inspeção",icon:"🔦",x:14,y:4.7,room:"Espaço de convivência"},
      {id:"bloco",name:"Bloco de anotações",icon:"📝",x:21.2,y:7.1,room:"Quarto demonstrativo"}
    ],
    puzzles:[
      {title:"Planejar o trabalho coletivo",question:"Uma equipe precisa preparar uma atividade. Qual é o primeiro passo?",
        choices:["Organizar objetivos e dividir tarefas","Deixar tudo para uma única pessoa","Começar sem combinar responsabilidades"],correct:0,
        success:"Planejamento combinado! Próximo passo: verificar os materiais."},
      {title:"Preparar os materiais",question:"Antes da atividade, qual atitude é mais responsável?",
        choices:["Improvisar sem conferir nada","Testar materiais e combinar o uso seguro","Ignorar possíveis problemas"],correct:1,
        success:"Materiais verificados! Agora falta a etapa de convivência."},
      {title:"Celebrar o esforço do grupo",question:"Após realizar o projeto, qual atitude fortalece a cooperação?",
        choices:["Culpar quem teve dificuldades","Evitar ouvir os participantes","Reconhecer contribuições e conversar sobre melhorias"],correct:2,
        success:"Projeto coletivo concluído! Volte a Gabriel."}
    ],
    startLines:[
      "Bem-vindo! Sou Gabriel. Estamos preparando um projeto coletivo no residencial.",
      "Preciso reunir um cartaz, uma lanterna de inspeção e um bloco de anotações.",
      "Encontre esses materiais e organize as etapas do projeto no quadro da recepção.",
      "Depois converse comigo para encerrarmos nosso trabalho em equipe!"
    ],
    reward:"Mestre da Cooperação"
  };
  const npc=conf.npc,board={id:"board",x:18.9,y:15.5,name:"Quadro de organização"},exit={x:14,y:18.6};
  const rooms=[
    {id:"study",name:"Sala de estudos",x:2,y:2,w:9,h:10,c:conf.colors.library},
    {id:"common",name:"Espaço de convivência",x:11,y:2,w:6,h:5.3,c:conf.colors.floor},
    {id:"hall",name:"Corredor",x:11,y:7.3,w:6,h:7.7,c:"#edd8b5"},
    {id:"model",name:"Quarto demonstrativo",x:17,y:2,w:9,h:10,c:conf.colors.room},
    {id:"lobby",name:"Recepção",x:7,y:12,w:14,h:7,c:"#e1c9ad"}
  ];
  const furniture=[
    {kind:"desk",x:4.1,y:3.7,w:4.0,h:.95},
    {kind:"desk",x:3.8,y:7.0,w:2.0,h:.82},
    {kind:"desk",x:7.2,y:7.0,w:2.0,h:.82},
    {kind:"shelf",x:9.1,y:3.1,w:1.0,h:2.6},
    {kind:"sofa",x:11.55,y:3.1,w:1.1,h:2.3},
    {kind:"table",x:13.2,y:5.7,w:1.8,h:.72},
    {kind:"wardrobe",x:24.15,y:3.1,w:1.1,h:2.1},
    {kind:"bed",x:18.3,y:3.65,w:2.55,h:1.15},
    {kind:"bed",x:21.2,y:9.6,w:2.55,h:1.15},
    {kind:"plant",x:11.6,y:10.95,w:.72,h:.72},
    {kind:"sofa",x:8.2,y:16.55,w:2.35,h:.7},
    {kind:"desk",x:16.8,y:15.3,w:1.0,h:.88},
    {kind:"plant",x:19.6,y:17.3,w:.72,h:.72}
  ];
  const walls=[
    [2,2,11,2],[2,2,2,12],[2,12,11,12],[11,2,17,2],
    [17,2,26,2],[26,2,26,12],[17,12,26,12],
    [11,2,11,8.2],[11,10,11,12],
    [17,2,17,8.2],[17,10,17,12],
    [11,7.3,12.4,7.3],[15.6,7.3,17,7.3],
    [7,12,11,12],[17,12,21,12],
    [7,12,7,19],[21,12,21,19],[7,19,12.5,19],[15.5,19,21,19]
  ];
  const player={x:14,y:16.9,walk:0,facing:"up",moving:false};
  let active=false,anim=0,cameraX=canvasWidth/2,cameraY=canvasHeight/2;
  function empty(){return {started:false,found:[],solved:0,completed:false};}
  function load(){
    try{
      const v=JSON.parse(storage?.getItem(KEY)||"null");
      if(v?.version!==1)return empty();
      const valid=new Set(conf.items.map(o=>o.id));
      const found=[...new Set(Array.isArray(v.found)?v.found.filter(id=>valid.has(id)):[])];
      const solved=found.length===3&&Number.isInteger(v.solved)?clamp(v.solved,0,3):0;
      return {started:v.started===true||found.length>0||solved>0,
        found,solved,completed:found.length===3&&solved===3&&v.completed===true};
    }catch(_error){return empty();}
  }
  const state=load();
  function persist(){try{storage?.setItem(KEY,JSON.stringify({version:1,...state}));}catch(_error){}}
  function stage(){
    if(state.completed)return "completed";
    if(!state.started)return "ready";
    if(state.found.length<3)return "collect";
    if(state.solved<3)return "organize";
    return "return";
  }
  function objective(){
    const s=stage();
    if(s==="ready")return "Converse com "+npc.name+" na recepção do "+conf.name+".";
    if(s==="collect")return "Encontre os três objetos do residencial ("+state.found.length+"/3).";
    if(s==="organize")return "Vá até o quadro de organização e resolva as três etapas ("+state.solved+"/3).";
    if(s==="return")return "Atividade concluída! Converse novamente com "+npc.name+".";
    return "Missão concluída! Conquista "+conf.reward+" desbloqueada.";
  }
  function progress(){
    return {stage:stage(),started:state.started,found:[...state.found],solved:state.solved,total:3,
      collected:state.found.length,completed:state.completed,xp:state.completed?200:0,
      achievement:state.completed?conf.reward:null,objective:objective(),
      items:conf.items.map(it=>({id:it.id,name:it.name,icon:it.icon,found:state.found.includes(it.id)}))};
  }
  function talk(){
    const s=stage();
    if(s==="ready"){
      state.started=true;persist();
      return {changed:true,lines:conf.startLines,
        message:"Missão iniciada! Encontre os três objetos do "+conf.name+"."};
    }
    if(s==="return"){
      state.completed=true;persist();
      return {changed:true,rewarded:true,
        lines:["Excelente! Você encontrou os materiais e resolveu os desafios do residencial.",
          "Esta missão mostra a importância de "+(female?"organizar o dia e cuidar do bem-estar":"colaborar com o grupo e compartilhar responsabilidades")+".",
          "Você recebeu 200 XP e a conquista "+conf.reward+"!"],
        message:"Missão concluída! +200 XP • "+conf.reward+"!"};
    }
    if(s==="collect")return {changed:false,lines:[
      "Você encontrou "+state.found.length+" de três materiais.",
      "Explore a sala de estudos, a convivência e o quarto demonstrativo."]};
    if(s==="organize")return {changed:false,lines:[
      "Materiais reunidos! Agora vá ao quadro de organização na recepção.",
      "Você concluiu "+state.solved+" de três etapas."]};
    return {changed:false,lines:["Seu trabalho já está concluído! Obrigada por ajudar."]};
  }
  function inspect(id){
    if(id==="board"){
      if(stage()==="organize")return {puzzle:{...conf.puzzles[state.solved],index:state.solved}};
      return {message:stage()==="collect"?"Reúna os três objetos antes de organizar as etapas.":
        stage()==="ready"?"Converse com o monitor para começar.":"O quadro de organização já está completo."};
    }
    const item=conf.items.find(it=>it.id===id);
    if(!item)return null;
    if(stage()==="ready")return {message:"Fale primeiro com "+npc.name+"."};
    if(state.found.includes(id))return {message:"Você já encontrou "+item.name+"."};
    state.found.push(id);persist();
    return {changed:true,message:item.icon+" "+item.name+" encontrado! ("+state.found.length+"/3)"};
  }
  function answer(index){
    if(stage()!=="organize")return {ignored:true};
    const p=conf.puzzles[state.solved];
    if(index!==p.correct)return {correct:false,message:"Ainda não! Pense no que fortalece a "+(female?"rotina saudável":"cooperação")+". Tente novamente."};
    state.solved++;persist();
    return {correct:true,changed:true,message:p.success,last:state.solved===3};
  }
  function restart(){Object.assign(state,empty());persist();}
  function inside(r,x,y){return x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;}
  function segmentDistance(x,y,s){
    const [a,b,c,d]=s,vx=c-a,vy=d-b,len=vx*vx+vy*vy;
    const t=len?clamp(((x-a)*vx+(y-b)*vy)/len,0,1):0;
    return Math.hypot(x-a-t*vx,y-b-t*vy);
  }
  function blocked(x,y){
    const r=.28;
    if(!rooms.some(room=>inside(room,x,y)))return true;
    if(walls.some(w=>segmentDistance(x,y,w)<r+.14))return true;
    if(furniture.some(f=>x>f.x-r&&x<f.x+f.w+r&&y>f.y-r&&y<f.y+f.h+r))return true;
    if(distance({x,y},npc)<r+.37)return true;
    return false;
  }
  function enter(){active=true;anim=0;player.x=14;player.y=16.9;player.moving=false;player.facing="up";}
  function leave(){active=false;player.moving=false;}
  function pause(){player.moving=false;}
  function roomName(){return rooms.find(r=>inside(r,player.x,player.y))?.name||conf.name;}
  function update(dt,held){
    if(!active)return;
    const step=clamp(Number(dt)||0,0,.05);anim+=step;
    const dx0=Number(held.has("d")||held.has("ArrowRight"))-Number(held.has("a")||held.has("ArrowLeft"));
    const dy0=Number(held.has("s")||held.has("ArrowDown"))-Number(held.has("w")||held.has("ArrowUp"));
    const len=Math.hypot(dx0,dy0)||1;
    const dx=dx0/len*4.75*step,dy=dy0/len*4.75*step,old={x:player.x,y:player.y};
    if(!blocked(player.x+dx,player.y))player.x+=dx;
    if(!blocked(player.x,player.y+dy))player.y+=dy;
    player.moving=distance(old,player)>.0001;
    if(player.moving){
      player.walk+=step*11;
      player.facing=Math.abs(dx0)>Math.abs(dy0)?dx0>0?"right":"left":dy0>0?"down":"up";
    }
  }
  function nearest(){
    if(distance(player,exit)<1.08)return {kind:"exit",name:"Voltar ao campus"};
    if(distance(player,npc)<1.8)return {kind:"npc",name:npc.name};
    if(stage()==="organize"&&distance(player,board)<2.1)return {kind:"board",name:"Quadro de organização"};
    if(stage()==="collect"){
      let found=null,min=1.7;
      for(const it of conf.items)if(!state.found.includes(it.id)){
        const d=distance(player,it);if(d<min){min=d;found={kind:"item",id:it.id,name:it.name};}
      }
      if(found)return found;
    }
    return null;
  }
  function fill(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function round(x,y,w,h,r,c,edge){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();
    if(edge){ctx.lineWidth=2;ctx.strokeStyle=edge;ctx.stroke();}}
  function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
  function line(x,y,x2,y2,c,w=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}
  function label(s,x,y,size=12,c="#fff0d5",bold=false){ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=c;ctx.fillText(s,x,y);}
  function drawFurniture(f){
    const p=point(f.x,f.y),w=f.w*T,h=f.h*T;
    ellipse(p.x+w/2+3,p.y+h+5,w/2+3,6,"#20394e50");
    if(f.kind==="plant"){
      round(p.x+4,p.y+12,w-8,h-12,3,"#bc7955");ellipse(p.x+w/2,p.y+7,12,10,"#3f886b");
      ellipse(p.x+w/2-7,p.y,9,8,"#87c58b");ellipse(p.x+w/2+8,p.y+1,9,8,"#67a987");return;
    }
    if(f.kind==="shelf"||f.kind==="wardrobe"){
      round(p.x,p.y,w,h,5,f.kind==="wardrobe"?"#9a725c":"#8e6b55","#5f554b");
      for(let k=0;k<3;k++){
        const yy=p.y+6+k*h/3;
        if(f.kind==="shelf"){
          fill(p.x+4,yy,w-8,h/3-10,"#55463b");
          for(let b=0;b<3;b++)fill(p.x+5+b*8,yy+2,5,h/3-13,
            ["#e3bb9b","#9cc9b3","#b6addb"][(b+k)%3]);
        }else{
          line(p.x+4,yy,p.x+w-4,yy,"#d7b58a",2);
          ellipse(p.x+w/2+4,yy+6,2,2,"#eedbb5");
        }
      }
      return;
    }
    if(f.kind==="bed"){
      round(p.x,p.y,w,h,6,"#f0e4cb","#a77866");
      round(p.x+2,p.y+2,w-4,h-4,5,female?"#bf93b3":"#789fa4");
      round(p.x+5,p.y+5,22,h-10,5,"#f9e8d7");return;
    }
    if(f.kind==="sofa"){
      round(p.x,p.y,w,h,5,female?"#c398a9":"#819fa4","#63746c");
      fill(p.x+4,p.y+5,w-8,3,"#f0e2dd88");return;
    }
    round(p.x,p.y,w,h,5,f.kind==="table"?"#ad886f":"#b89b77","#705a49");
    fill(p.x+5,p.y+5,w-10,3,"#fff0c75c");
    if(f.kind==="desk")round(p.x+8,p.y+6,19,11,3,"#f4e6d3");
  }
  function actor(o,isPlayer){
    const p=point(o.x,o.y),step=isPlayer&&o.moving?Math.sin(o.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#18314467");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(step)*2:0));
    ctx.scale(isPlayer&&o.facing==="left"?-1:1,1);
    line(-5,-14,-5+step*4,-1,"#394f64",7);
    line(5,-14,5-step*4,-1,"#394f64",7);
    line(-8,-2,-1,-2,"#f4eadb",4);line(4,-2,10,-2,"#f4eadb",4);
    round(-12,-38,24,27,6,isPlayer?"#68a7c4":o.shirt,"#40536e");
    line(-14,-32,-15-step*4,-18,"#b88b67",6);line(14,-32,15+step*4,-18,"#b88b67",6);
    ellipse(0,-52,12,14,isPlayer?"#dca580":o.skin);
    ellipse(-5,-63,10,7,isPlayer?"#42323b":o.hair);ellipse(5,-64,9,7,isPlayer?"#42323b":o.hair);
    ellipse(-4,-52,1.5,1.5,"#23364a");ellipse(4,-52,1.5,1.5,"#23364a");
    ctx.restore();
    if(!isPlayer){
      label(o.name,p.x,p.y-95,12,"#fff5d5",true);
      ellipse(p.x,p.y-83+Math.sin(anim*3)*2,12,10,"#ffe2ab");
      label("E",p.x,p.y-79+Math.sin(anim*3)*2,12,"#315164",true);
    }
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const scale=clamp(zoom/.8,.82,1.8),focus=point(player.x,player.y);
    cameraX+=(canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,scale-1)*.65-cameraX)*.13;
    cameraY+=(canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,scale-1)*.65-cameraY)*.13;
    ctx.setTransform(1,0,0,1,0,0);
    const bg=ctx.createLinearGradient(0,0,0,canvasHeight);bg.addColorStop(0,"#223b53");bg.addColorStop(1,"#152b41");
    fill(0,0,canvasWidth,canvasHeight,bg);
    ctx.save();ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(scale,scale);ctx.translate(-cameraX,-cameraY);
    const shell=point(1.8,1.8);
    round(shell.x-12,shell.y-14,24.5*T+24,18*T+32,14,conf.colors.wall,"#f3ddad");
    for(const room of rooms){
      const p=point(room.x,room.y);fill(p.x,p.y,room.w*T,room.h*T,room.c);
      for(let x=0;x<room.w;x++)for(let y=0;y<room.h;y++)
        if((x+y)%2===0)fill(p.x+x*T,p.y+y*T,T,T,"#fff6db1b");
      for(let x=0;x<=room.w;x++)line(p.x+x*T,p.y,p.x+x*T,p.y+room.h*T,"#58787b22",.8);
      for(let y=0;y<=room.h;y++)line(p.x,p.y+y*T,p.x+room.w*T,p.y+y*T,"#58787b22",.8);
    }
    const title=point(14,12.75);
    round(title.x-130,title.y-14,260,28,6,conf.colors.banner,"#f5dfb5");
    label(conf.name.toUpperCase(),title.x,title.y+5,16,"#fff6da",true);
    for(const [x,y,txt,w] of [[5.8,2.65,"SALA DE ESTUDOS",158],[14,2.65,"CONVIVÊNCIA",135],[21.6,2.65,"QUARTO DEMONSTRATIVO",195]]){
      const p=point(x,y);round(p.x-w/2,p.y-13,w,26,5,conf.colors.accent,"#f2e4bc");
      label(txt,p.x,p.y+5,12,"#fff4db",true);
    }
    furniture.forEach(drawFurniture);
    for(const wall of walls){
      const [x,y,a,b]=wall,p=point(x,y),q=point(a,b);
      line(p.x+3,p.y+7,q.x+3,q.y+7,"#192f3a56",16);
      line(p.x,p.y,q.x,q.y,"#708a89",14);
      line(p.x,p.y-4,q.x,q.y-4,"#e7eee0",12);
      line(p.x,p.y-8,q.x,q.y-8,"#fdf3e3",4);
    }
    for(const x of [11,17]){
      const p=point(x,9.1);
      round(p.x-5,p.y-27,10,50,2,"#93c9b8");
    }
    const boardP=point(board.x,board.y);
    round(boardP.x-28,boardP.y-39,61,45,6,conf.colors.banner,"#f6dcaf");
    label("PLANO",boardP.x+3,boardP.y-19,12,"#fff4d6",true);
    label("DE AÇÃO",boardP.x+3,boardP.y-4,11,"#fff4d6",true);
    if(stage()==="collect"){
      for(const item of conf.items)if(!state.found.includes(item.id)){
        const p=point(item.x,item.y),float=Math.sin(anim*3+item.x)*3;
        ellipse(p.x,p.y+4,16,8,"#d9ae6e66");
        ellipse(p.x,p.y-22+float,16,14,"#ffe1a6");
        label(item.icon,p.x,p.y-16+float,18,"#31566c",true);
        label(item.name,p.x,p.y-47,11,"#fff1cc",true);
      }
    }else if(stage()==="organize"){
      ellipse(boardP.x,boardP.y-55+Math.sin(anim*3)*2,15,12,"#ffdfa2");
      label("!",boardP.x,boardP.y-49+Math.sin(anim*3)*2,16,"#39596b",true);
    }
    actor(npc,false);actor(player,true);
    const door=point(14,19);round(door.x-57,door.y-5,114,13,4,"#337c8e","#ffe0a3");
    label("SAÍDA [E]",door.x,door.y+25,12,"#fff2cf",true);
    ctx.restore();
  }
  return {enter,leave,pause,update,draw,nearest,blocked,roomName,talk,inspect,answer,restart,
    progress,objective,conf,items:conf.items,puzzles:conf.puzzles,board,npc,exit,
    get player(){return player;},get active(){return active;},get kind(){return kind;}};
};
