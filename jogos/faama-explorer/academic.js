/* FAAMA Explorer 2.6 — Prédio Acadêmico e Missão 03.
   Cenário fictício inspirado em ambientes universitários.
   Não altera a planta do campus, o Prédio Central ou os salvamentos anteriores. */
"use strict";
window.createFaamaAcademic=function createFaamaAcademic({ctx,storage,canvasWidth=1200,canvasHeight=760}){
  const KEY="faama-explorer-quest-03-v1",T=30,W=28,H=20;
  const ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const point=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const stations=[
    {id:"quadro",name:"Desafio da Sala de Aula",room:"Sala de aula",
      x:5.1,y:3.2,mark:"📚",
      question:"Qual hábito ajuda a aprender de forma consistente?",
      choices:["Estudar só na véspera","Revisar o conteúdo e tirar dúvidas","Evitar fazer perguntas"],
      correct:1,
      success:"Selo da Sala de Aula conquistado! Aprender também é ter curiosidade."},
    {id:"catalogo",name:"Desafio da Biblioteca",room:"Biblioteca",
      x:14,y:3.1,mark:"📖",
      question:"Qual é a melhor maneira de localizar um livro na biblioteca?",
      choices:["Consultar o catálogo e a localização","Procurar ao acaso em todas as estantes","Retirar qualquer livro sem verificar"],
      correct:0,
      success:"Selo da Biblioteca conquistado! Informação bem organizada ajuda na pesquisa."},
    {id:"terminal",name:"Desafio do Laboratório",room:"Laboratório",
      x:22.2,y:7.0,mark:"💻",
      question:"Antes de usar um computador compartilhado, o mais adequado é:",
      choices:["Compartilhar sua senha","Desativar as proteções","Seguir as orientações de uso e proteger sua conta"],
      correct:2,
      success:"Selo do Laboratório conquistado! Você completou os três desafios."}
  ];
  const defaultState=()=>({started:false,done:[],completed:false});
  const valid=new Set(stations.map(s=>s.id));
  function load(){
    try{
      const parsed=JSON.parse(storage?.getItem(KEY)||"null");
      if(!parsed||parsed.version!==1)return defaultState();
      const done=[...new Set(Array.isArray(parsed.done)?parsed.done.filter(x=>valid.has(x)):[])];
      const completed=parsed.completed===true && done.length===stations.length;
      return {started:parsed.started===true||done.length>0||completed,done,completed};
    }catch(_err){return defaultState();}
  }
  const state=load();
  function save(){
    try{storage?.setItem(KEY,JSON.stringify({version:1,...state}));}
    catch(_err){/* Alguns navegadores não permitem armazenamento. */ }
  }
  function stage(){
    if(state.completed)return "completed";
    if(!state.started)return "ready";
    if(state.done.length===stations.length)return "return";
    return "challenges";
  }
  function objective(){
    const s=stage();
    if(s==="ready")return "Converse com a professora Helena na recepção do Prédio Acadêmico.";
    if(s==="challenges")return "Resolva os desafios da sala de aula, biblioteca e laboratório ("+
      state.done.length+"/3).";
    if(s==="return")return "Você reuniu os três selos! Volte à professora Helena.";
    return "Missão 03 concluída! Continue explorando o campus.";
  }
  function progress(){
    return {stage:stage(),started:state.started,done:[...state.done],
      completed:state.completed,xp:state.completed?200:0,
      achievement:state.completed?"Mestre do Conhecimento":null,
      stations:stations.map(s=>({id:s.id,name:s.name,done:state.done.includes(s.id)})),
      objective:objective()};
  }
  function restart(){Object.assign(state,defaultState());save();}
  const professor={id:"helena",name:"Professora Helena",
    role:"Orientadora acadêmica",x:13.1,y:15.15,
    skin:"#ab744e",hair:"#50392c",shirt:"#667cb4"};
  function talk(){
    const s=stage();
    if(s==="ready"){
      state.started=true;save();
      return {changed:true,lines:[
        "Bem-vindo ao Prédio Acadêmico! Sou Helena, sua orientadora nesta aventura.",
        "Preparei um Desafio do Conhecimento em três ambientes: sala de aula, biblioteca e laboratório.",
        "Responda corretamente à pergunta de cada ambiente e reúna três selos. Depois volte para conversar comigo!"
      ],message:"Missão 03 iniciada! Procure os três desafios pelo Prédio Acadêmico."};
    }
    if(s==="return"){
      state.completed=true;save();
      return {changed:true,rewarded:true,
        lines:["Você conseguiu os três selos do conhecimento! Excelente exploração!",
          "Você recebeu 200 XP e conquistou o título 'Mestre do Conhecimento'.",
          "A curiosidade abre portas. Continue descobrindo o campus!"],
        message:"Missão 03 concluída! +200 XP • Mestre do Conhecimento!"};
    }
    if(s==="completed")return {changed:false,lines:[
      "Muito bem, Mestre do Conhecimento! Você já completou o desafio acadêmico.",
      "Seu progresso está registrado. Aproveite os outros espaços da FAAMA!"
    ]};
    return {changed:false,lines:[
      "Você já conquistou "+state.done.length+" dos três selos.",
      "Procure os pontos brilhantes na sala de aula, na biblioteca e no laboratório."
    ]};
  }
  function inspect(id){
    const challenge=stations.find(s=>s.id===id);
    if(!challenge)return null;
    if(stage()==="ready")return {message:"Converse com a professora Helena para iniciar o desafio."};
    if(state.done.includes(id))return {message:"Você já conquistou o selo deste ambiente!"};
    return {quiz:{...challenge}};
  }
  function answer(id,index){
    if(stage()!=="challenges")return {ignored:true};
    const ch=stations.find(s=>s.id===id);
    if(!ch||state.done.includes(id))return {ignored:true};
    if(index!==ch.correct)return {correct:false,message:"Essa não é a melhor resposta. Reflita e tente novamente."};
    state.done.push(ch.id);save();
    return {correct:true,changed:true,message:ch.success,
      all:state.done.length===stations.length};
  }

  const rooms=[
    {id:"classroom",name:"Sala de aula",x:2,y:2,w:9,h:10,color:"#d9ae7b"},
    {id:"library",name:"Biblioteca",x:11,y:2,w:6,h:5.2,color:"#a5b99a"},
    {id:"corridor",name:"Corredor acadêmico",x:11,y:7.2,w:6,h:7.8,color:"#e5cdac"},
    {id:"lab",name:"Laboratório de informática",x:17,y:2,w:9,h:10,color:"#9cb6c4"},
    {id:"lobby",name:"Recepção",x:7,y:12,w:14,h:7,color:"#dbc3a4"}
  ];
  const furniture=[
    {id:"desk",kind:"counter",x:15.1,y:15.1,w:3.1,h:1},
    {id:"bench",kind:"bench",x:8.3,y:16.4,w:3.6,h:.65},
    {id:"lobby-plant",kind:"plant",x:19.3,y:17.2,w:.75,h:.75},
    {id:"class-teacher",kind:"teacher",x:4.3,y:3.65,w:3.4,h:.75},
    {id:"class-desk-1",kind:"desk",x:3.7,y:5.6,w:2.2,h:.9},
    {id:"class-desk-2",kind:"desk",x:7.1,y:5.6,w:2.2,h:.9},
    {id:"class-desk-3",kind:"desk",x:3.7,y:8.7,w:2.2,h:.9},
    {id:"class-desk-4",kind:"desk",x:7.1,y:8.7,w:2.2,h:.9},
    {id:"library-shelf-1",kind:"shelf",x:11.6,y:3.1,w:1.0,h:2.2},
    {id:"library-shelf-2",kind:"shelf",x:15.5,y:3.1,w:.95,h:2.2},
    {id:"library-desk",kind:"desk",x:12.0,y:5.4,w:1.65,h:.67},
    {id:"lab-pc-1",kind:"computer",x:18.4,y:4.7,w:2.7,h:1.2},
    {id:"lab-pc-2",kind:"computer",x:22.2,y:4.7,w:2.7,h:1.2},
    {id:"lab-pc-3",kind:"computer",x:18.4,y:8.6,w:2.7,h:1.2},
    {id:"lab-pc-4",kind:"computer",x:22.2,y:8.6,w:2.7,h:1.2},
    {id:"hall-plant",kind:"plant",x:11.6,y:11.0,w:.7,h:.75}
  ];
  const walls=[
    [2,2,11,2],[2,2,2,12],[2,12,11,12],
    [17,2,26,2],[26,2,26,12],[17,12,26,12],
    [11,2,17,2],
    [11,2,11,8.2],[11,10.0,11,12],
    [17,2,17,8.2],[17,10.0,17,12],
    // Biblioteca conecta com corredor por um vão central.
    [11,7.2,12.6,7.2],[15.4,7.2,17,7.2],
    [7,12,11,12],[17,12,21,12],
    [7,12,7,19],[21,12,21,19],
    [7,19,12.5,19],[15.5,19,21,19]
  ];
  const exitPoint={x:14,y:18.55};
  const player={x:14,y:17.65,walk:0,facing:"up",moving:false};
  let active=false,elapsed=0,zoomCameraX=canvasWidth/2,zoomCameraY=canvasHeight/2;
  function inside(r,x,y){return x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;}
  function distToSegment(x,y,s){
    const [ax,ay,bx,by]=s,dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
    const t=len?clamp(((x-ax)*dx+(y-ay)*dy)/len,0,1):0;
    return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
  }
  function blocked(x,y){
    const radius=.28;
    if(!rooms.some(r=>inside(r,x,y)))return true;
    if(walls.some(s=>distToSegment(x,y,s)<radius+.14))return true;
    if(furniture.some(f=>x>f.x-radius&&x<f.x+f.w+radius&&
         y>f.y-radius&&y<f.y+f.h+radius))return true;
    if(distance({x,y},professor)<radius+.37)return true;
    return false;
  }
  function enter(){active=true;elapsed=0;player.x=14;player.y=17.65;player.walk=0;
    player.facing="up";player.moving=false;}
  function leave(){active=false;player.moving=false;}
  function pause(){player.moving=false;}
  function roomName(){
    const room=rooms.find(r=>inside(r,player.x,player.y));
    return room?.name||"Prédio Acadêmico";
  }
  function update(dt,held){
    if(!active)return;
    elapsed+=dt;
    const dx0=Number(held.has("ArrowRight")||held.has("d"))-
      Number(held.has("ArrowLeft")||held.has("a"));
    const dy0=Number(held.has("ArrowDown")||held.has("s"))-
      Number(held.has("ArrowUp")||held.has("w"));
    const n=Math.hypot(dx0,dy0)||1;
    const dx=dx0/n*4.7*dt,dy=dy0/n*4.7*dt;
    const old={x:player.x,y:player.y};
    if(!blocked(player.x+dx,player.y))player.x+=dx;
    if(!blocked(player.x,player.y+dy))player.y+=dy;
    player.moving=distance(old,player)>.00001;
    if(player.moving){
      player.walk+=dt*11;
      player.facing=Math.abs(dx0)>Math.abs(dy0)
        ?(dx0>0?"right":"left"):(dy0>0?"down":"up");
    }
  }
  function nearest(){
    let best=null,d=1.8;
    for(const obj of stations){
      const v=distance(player,obj);
      if(v<d){d=v;best={kind:"station",id:obj.id,name:obj.name};}
    }
    const p=distance(player,professor);
    if(p<1.95 && p<d+.25){d=p;best={kind:"npc",id:"helena",name:professor.name,npc:professor};}
    const e=distance(player,exitPoint);
    if(e<1.35&&e<d)return {kind:"exit",id:"exit",name:"Voltar ao campus"};
    return best;
  }

  function fill(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=c;ctx.fill();}
  function line(x1,y1,x2,y2,c,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap="round";ctx.stroke();}
  function rounded(x,y,w,h,r,c,stroke){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function label(s,x,y,size=11,c="#f7efd8",bold=false){
    ctx.font=(bold?"bold ":"")+size+"px Arial, sans-serif";
    ctx.textAlign="center";ctx.fillStyle=c;ctx.fillText(s,x,y);
  }
  function floor(r){
    const p=point(r.x,r.y);
    fill(p.x,p.y,r.w*T,r.h*T,r.color);
    for(let x=0;x<r.w;x++)for(let y=0;y<r.h;y++){
      if((x+y)%2===0)fill(p.x+x*T,p.y+y*T,T,T,"#fff8df19");
    }
    for(let x=0;x<=r.w;x++)line(p.x+x*T,p.y,p.x+x*T,p.y+r.h*T,"#425e5e26",.8);
    for(let y=0;y<=r.h;y++)line(p.x,p.y+y*T,p.x+r.w*T,p.y+y*T,"#425e5e26",.8);
  }
  function wall(s){
    const [a,b,c,d]=s,p=point(a,b),q=point(c,d);
    line(p.x+3,p.y+7,q.x+3,q.y+7,"#193d5066",16);
    line(p.x,p.y,q.x,q.y,"#6f7c77",14);
    line(p.x,p.y-4,q.x,q.y-4,"#dfebdb",12);
    line(p.x,p.y-8,q.x,q.y-8,"#f6f0df",4);
  }
  function drawFurniture(f){
    const p=point(f.x,f.y),w=f.w*T,h=f.h*T;
    ellipse(p.x+w/2+3,p.y+h+5,w/2+2,5,"#182e3d40");
    if(f.kind==="plant"){
      rounded(p.x+4,p.y+12,w-8,h-12,3,"#bc7651");
      ellipse(p.x+w/2,p.y+9,13,11,"#367d5c");
      ellipse(p.x+w/2-8,p.y+1,9,8,"#5eaf78");
      ellipse(p.x+w/2+8,p.y+3,8,9,"#78c891");
      return;
    }
    if(f.kind==="shelf"){
      rounded(p.x,p.y,w,h,4,"#896344","#4c392e");
      for(let yy=0;yy<3;yy++){
        fill(p.x+3,p.y+5+yy*h/3,w-6,h/3-8,"#57422f");
        for(let j=0;j<3;j++)fill(p.x+5+j*9,p.y+8+yy*h/3,6,h/3-13,
          ["#7db6a4","#e1bc78","#b67f71"][(yy+j)%3]);
      }
      return;
    }
    const base=f.kind==="counter"?"#9c6e4c":f.kind==="computer"?"#668ba5":"#ac845a";
    rounded(p.x,p.y,w,h,5,base,"#624e3e");
    fill(p.x+4,p.y+5,w-8,3,"#ffebc066");
    if(f.kind==="computer"){
      const screen=point(f.x+.35,f.y+.1);
      rounded(screen.x,screen.y,w-21,h-11,3,"#263d55","#d6e4df");
      fill(screen.x+5,screen.y+6,w-31,3,"#75e1cd");
      fill(screen.x+5,screen.y+13,w-42,2,"#f4da9a");
      fill(p.x+8,p.y+h-7,w-16,3,"#e0d7c2");
    }else if(f.kind==="counter"){
      label("ATENDIMENTO",p.x+w/2,p.y+h*.6,12,"#f9e8c7",true);
    }else if(f.kind==="bench"){
      for(let j=1;j<4;j++)line(p.x+5,p.y+j*h/4,p.x+w-5,p.y+j*h/4,"#dabb90",2);
    }else if(f.kind==="teacher"){
      rounded(p.x+8,p.y+5,22,13,3,"#ece2ce");
    }else{
      rounded(p.x+7,p.y+7,17,12,3,"#f2e6d5");
      line(p.x+12,p.y+14,p.x+18,p.y+14,"#a6bab1",1.5);
    }
  }
  function drawWallsAndDoors(){
    walls.forEach(wall);
    for(const x of [11,17]){
      const p=point(x,9.1);
      rounded(p.x-5,p.y-27,10,53,2,"#74b5ad");
      line(p.x,p.y-26,p.x+(x===11?20:-20),p.y-37,"#bb9164",4);
      label(x===11?"SALA DE AULA":"LABORATÓRIO",
        p.x+(x===11?-69:75),p.y-29,10,"#375668",true);
    }
    const lib=point(14,7.2);
    rounded(lib.x-34,lib.y-7,68,13,3,"#82ad8e");
    label("BIBLIOTECA",lib.x,lib.y-15,10,"#425d55",true);
    const exit=point(14,19);
    rounded(exit.x-54,exit.y-6,108,14,4,"#32768b","#dfd5b7");
    label("SAÍDA",exit.x,exit.y+23,11,"#486372",true);
  }
  function decor(){
    const p=point(14,12.6);
    rounded(p.x-114,p.y-8,228,27,8,"#346781","#d8c394");
    label("PRÉDIO ACADÊMICO",p.x,p.y+10,17,"#fff5dc",true);
    const q=point(5.2,2.6);
    rounded(q.x-60,q.y-5,120,32,5,"#27595e","#d8b975");
    label("APRENDER É DESCOBRIR",q.x,q.y+16,11,"#f8edcf",true);
    const l=point(14,2.55);
    rounded(l.x-64,l.y-5,128,27,5,"#52775c","#ded7b0");
    label("BIBLIOTECA",l.x,l.y+13,12,"#f8edcd",true);
    const c=point(22,2.6);
    rounded(c.x-65,c.y-5,130,28,5,"#446f85","#d3dcce");
    label("LABORATÓRIO DIGITAL",c.x,c.y+14,12,"#f6f5e3",true);
    for(const [x,y] of [[3,4],[25,4],[3,10],[25,10]]){
      const v=point(x,y);
      rounded(v.x-6,v.y-28,12,58,4,"#91d4d9","#e3eee3");
      line(v.x-6,v.y,v.x+6,v.y,"#e9ebdc",2);
    }
    for(const [x,y] of [[5.5,3.5],[22,3.5],[14,10],[14,16]]){
      const v=point(x,y);ellipse(v.x,v.y,29,13,"#fffae536");
      ellipse(v.x,v.y,10,6,"#fff8d0");
    }
    const carpet=point(12.8,16.4);
    rounded(carpet.x,carpet.y,2.6*T,1.1*T,8,"#609ea08a","#e1e1caaa");
  }
  function actor(o,isPlayer){
    const p=point(o.x,o.y),stride=isPlayer&&o.moving?Math.sin(o.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#1e35415e");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(stride)*2:0));
    const flip=isPlayer&&o.facing==="left"?-1:1;ctx.scale(flip,1);
    line(-5,-14,-5+stride*4,-1,"#304d62",7);
    line(5,-14,5-stride*4,-1,"#304d62",7);
    line(-8,-2,-1,-2,"#eee9dc",4);line(4,-2,10,-2,"#eee9dc",4);
    rounded(-12,-38,24,27,7,isPlayer?"#ebdca4":o.shirt,"#3f5765");
    line(-14,-32,-15-stride*3,-18,"#be8b69",6);
    line(14,-32,15+stride*3,-18,"#be8b69",6);
    ellipse(0,-52,12,14,isPlayer?"#dfa481":o.skin);
    ellipse(-5,-63,10,6,isPlayer?"#3c3030":o.hair);
    ellipse(5,-64,9,6,isPlayer?"#3c3030":o.hair);
    ellipse(-4,-51,1.5,1.5,"#283748");ellipse(4,-51,1.5,1.5,"#283748");
    ctx.restore();
    if(!isPlayer){
      ellipse(p.x,p.y-84+Math.sin(elapsed*3)*2,12,10,"#ffe5a5");
      label("E",p.x,p.y-80+Math.sin(elapsed*3)*2,12,"#274456",true);
      label("Prof. Helena",p.x,p.y-96,12,"#fff4df",true);
    }
  }
  function markers(){
    const targets=stage()==="ready"?[professor]:
      stage()==="return"?[professor]:
      stage()==="challenges"?stations.filter(s=>!state.done.includes(s.id)):[];
    for(const item of targets){
      const p=point(item.x,item.y),b=Math.sin(elapsed*3+item.x)*2;
      ellipse(p.x,p.y-36+b,14,13,"#ffe4a6ae");
      label(item.id? "?" : "!",p.x,p.y-31+b,15,"#284b5b",true);
    }
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const factor=clamp(zoom/.8,.82,1.8);
    ctx.setTransform(1,0,0,1,0,0);
    const grad=ctx.createLinearGradient(0,0,0,canvasHeight);
    grad.addColorStop(0,"#233b4d");grad.addColorStop(1,"#142e3d");
    fill(0,0,canvasWidth,canvasHeight,grad);
    const focus=point(player.x,player.y);
    const targetX=canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,factor-1)*.65;
    const targetY=canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,factor-1)*.65;
    zoomCameraX+=(targetX-zoomCameraX)*.13;
    zoomCameraY+=(targetY-zoomCameraY)*.13;
    ctx.save();ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(factor,factor);
    ctx.translate(-zoomCameraX,-zoomCameraY);
    const shell=point(1.8,1.8);
    rounded(shell.x-15,shell.y-16,24.4*T+30,18*T+32,15,"#344f60","#d2c69a");
    rooms.forEach(floor);
    decor();furniture.forEach(drawFurniture);
    drawWallsAndDoors();
    actor(professor,false);markers();actor(player,true);
    ctx.restore();
  }
  return {enter,leave,pause,update,draw,nearest,blocked,roomName,talk,inspect,answer,restart,
    progress,objective,stage,stations,rooms,furniture,professor,
    get player(){return player;},get active(){return active;}};
};
