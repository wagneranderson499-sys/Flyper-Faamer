/* FAAMA Explorer 2.9 — O Tesouro da FAAMinha.
   Cenário e desafios fictícios. Isolado das missões 01–05. */
"use strict";
window.createFaamaSchool=function createFaamaSchool({ctx,storage,canvasWidth=1200,canvasHeight=760}){
  const KEY="faama-explorer-quest-06-v1",W=28,H=20,T=30;
  const ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const pt=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const puzzles=[
    {id:"mural",name:"Mural colorido",room:"Recepção",x:9,y:14.2,icon:"🖼️",
      clue:"Pista 1/5 — A primeira mensagem fala de um lugar cheio de histórias.",
      question:"Tenho capa, páginas e muitas histórias. O que sou?",
      choices:["Um livro","Uma bola","Uma janela"],correct:0,
      found:"A primeira pista revela um desenho de uma ESTANTE. Procure a biblioteca infantil!"},
    {id:"livro",name:"Livro ilustrado",room:"Biblioteca infantil",x:13.1,y:4.4,icon:"📚",
      clue:"Pista 2/5 — Dentro do livro há uma página marcada com números.",
      question:"A sequência é 2, 4, 6, __. Qual número continua o padrão?",
      choices:["7","8","10"],correct:1,
      found:"O marcador mostra um QUADRO VERDE. A próxima pista está na sala de aula!"},
    {id:"quadro",name:"Quadro da turma",room:"Sala de aula",x:5.2,y:3.7,icon:"🧩",
      clue:"Pista 3/5 — A turma desenhou um objeto de três lados.",
      question:"Qual figura geométrica tem exatamente três lados?",
      choices:["Quadrado","Círculo","Triângulo"],correct:2,
      found:"Atrás do quadro havia a imagem de um BRINQUEDO. Visite a área de recreação!"},
    {id:"brinquedo",name:"Brinquedo escondido",room:"Recreação",x:21.5,y:5.2,icon:"🧸",
      clue:"Pista 4/5 — Um brinquedo tem um bilhete sobre as estações do ano.",
      question:"Qual estação vem depois do verão no ciclo das estações?",
      choices:["Outono","Primavera","Inverno"],correct:0,
      found:"A pista mostra um DESENHO na parede do corredor. Siga até lá!"},
    {id:"desenho",name:"Desenho misterioso",room:"Corredor",x:14,y:10.6,icon:"🎨",
      clue:"Pista 5/5 — O desenho mostra uma caixa fechada guardando lembranças para o futuro.",
      question:"Como chamamos uma caixa com lembranças guardadas para ser aberta no futuro?",
      choices:["Caixa de ferramentas","Cápsula do tempo","Caixa de primeiros socorros"],correct:1,
      found:"Cinco pistas resolvidas! A cápsula do tempo apareceu perto da área de recreação!"}
  ];
  const capsule={id:"capsule",name:"Cápsula do tempo",x:23.6,y:11.25,icon:"🎁"};
  const teacher={id:"sofia",name:"Professora Sofia",role:"Professora da FAAMinha",
    x:13.1,y:15.35,skin:"#bd895e",hair:"#4d354b",shirt:"#b774b8"};
  const rooms=[
    {id:"class",name:"Sala de aula",x:2,y:2,w:9,h:10,c:"#f1d18e"},
    {id:"library",name:"Biblioteca infantil",x:11,y:2,w:6,h:5.4,c:"#b7d6b1"},
    {id:"hall",name:"Corredor",x:11,y:7.4,w:6,h:7.6,c:"#f2daba"},
    {id:"recreation",name:"Recreação",x:17,y:2,w:9,h:10,c:"#a8cfe0"},
    {id:"lobby",name:"Recepção",x:7,y:12,w:14,h:7,c:"#dbc2a2"}
  ];
  const furniture=[
    {id:"desk",kind:"counter",x:15.5,y:15.1,w:2.7,h:.9},
    {id:"bench",kind:"bench",x:8.3,y:16.7,w:3.3,h:.65},
    {id:"shelf-left",kind:"shelf",x:11.6,y:3.1,w:.85,h:2.2},
    {id:"shelf-right",kind:"shelf",x:15.3,y:3.1,w:.85,h:2.2},
    {id:"reading",kind:"desk",x:13.45,y:5.6,w:1.4,h:.65},
    {id:"class-teacher",kind:"desk",x:4.4,y:3.9,w:3.5,h:.75},
    {id:"class-desk-a",kind:"desk",x:3.8,y:6.2,w:2.2,h:.8},
    {id:"class-desk-b",kind:"desk",x:7.0,y:6.2,w:2.2,h:.8},
    {id:"class-desk-c",kind:"desk",x:3.8,y:9.0,w:2.2,h:.8},
    {id:"class-desk-d",kind:"desk",x:7.0,y:9.0,w:2.2,h:.8},
    {id:"toy-chest",kind:"chest",x:19.0,y:3.2,w:1.6,h:.9},
    {id:"toy-mat",kind:"mat",x:18.5,y:7.0,w:3.3,h:2.2},
    {id:"toy-table",kind:"desk",x:23.2,y:7.3,w:1.6,h:1.0},
    {id:"plant",kind:"plant",x:19.5,y:16.8,w:.7,h:.7},
    {id:"plant2",kind:"plant",x:10.7,y:11.1,w:.7,h:.7}
  ];
  const walls=[
    [2,2,11,2],[2,2,2,12],[2,12,11,12],
    [11,2,17,2],[17,2,26,2],[26,2,26,12],[17,12,26,12],
    [11,2,11,8.25],[11,10.1,11,12],
    [17,2,17,8.25],[17,10.1,17,12],
    [11,7.4,12.5,7.4],[15.5,7.4,17,7.4],
    [7,12,11,12],[17,12,21,12],
    [7,12,7,19],[21,12,21,19],
    [7,19,12.5,19],[15.5,19,21,19]
  ];
  const exit={x:14,y:18.55},player={x:14,y:17.65,walk:0,facing:"up",moving:false};
  let active=false,clock=0,cameraX=canvasWidth/2,cameraY=canvasHeight/2;
  function blank(){return {started:false,solved:0,hasCapsule:false,completed:false};}
  function load(){
    try{
      const obj=JSON.parse(storage?.getItem(KEY)||"null");
      if(!obj||obj.version!==1)return blank();
      const solved=Number.isInteger(obj.solved)?clamp(obj.solved,0,5):0;
      const completed=solved===5&&obj.hasCapsule===true&&obj.completed===true;
      return {started:obj.started===true||solved>0,solved,
        hasCapsule:solved===5&&obj.hasCapsule===true,completed};
    }catch(_err){return blank();}
  }
  const state=load();
  function save(){
    try{storage?.setItem(KEY,JSON.stringify({version:1,...state}));}
    catch(_err){/* Salvamento local pode estar indisponível. */}
  }
  function stage(){
    if(state.completed)return "completed";
    if(!state.started)return "ready";
    if(state.solved<5)return "clues";
    return state.hasCapsule?"return":"capsule";
  }
  function objective(){
    const s=stage();
    if(s==="ready")return "Converse com a professora Sofia na recepção da FAAMinha.";
    if(s==="clues")return "Descubra a pista "+(state.solved+1)+
      "/5: "+puzzles[state.solved].name+" ("+puzzles[state.solved].room+").";
    if(s==="capsule")return "Cinco pistas resolvidas! Procure a cápsula do tempo na recreação.";
    if(s==="return")return "Cápsula encontrada! Entregue-a à professora Sofia.";
    return "Missão 06 concluída! Você se tornou Caçador de Tesouros.";
  }
  function progress(){
    return {stage:stage(),started:state.started,solved:state.solved,total:5,
      hasCapsule:state.hasCapsule,completed:state.completed,
      xp:state.completed?200:0,achievement:state.completed?"Caçador de Tesouros":null,
      clues:puzzles.map((p,i)=>({id:p.id,name:p.name,solved:i<state.solved,active:i===state.solved&&state.started})),
      objective:objective()};
  }
  function talk(){
    const s=stage();
    if(s==="ready"){
      state.started=true;save();
      return {changed:true,message:"Missão 06 iniciada! A primeira pista apareceu no mural da recepção.",
        lines:["Olá! Sou Sofia, professora da FAAMinha. Uma cápsula do tempo foi escondida para uma atividade especial!",
          "Para encontrá-la, resolva cinco enigmas em lugares diferentes da escola.",
          "Cada resposta libera a próxima pista. Comece pelo mural colorido da recepção!",
          "Quando encontrar a cápsula, traga-a para mim e celebraremos sua descoberta."]};
    }
    if(s==="return"){
      state.completed=true;save();
      return {changed:true,rewarded:true,
        message:"Missão 06 concluída! +200 XP • Conquista Caçador de Tesouros!",
        lines:["Você encontrou a cápsula do tempo! As lembranças da FAAMinha estão seguras.",
          "Parabéns pela curiosidade e pelas cinco pistas resolvidas!",
          "Você recebeu 200 XP e a conquista Caçador de Tesouros!"]};
    }
    if(s==="clues")return {changed:false,lines:[
      "Você encontrou "+state.solved+" de cinco pistas até agora.",
      "A próxima está em "+puzzles[state.solved].room+": "+puzzles[state.solved].name+"."]};
    if(s==="capsule")return {changed:false,lines:[
      "Muito bem! Você resolveu os cinco enigmas. Procure a cápsula perto da recreação!"]};
    return {changed:false,lines:["Obrigada pela ajuda! O Tesouro da FAAMinha já faz parte das suas conquistas."]};
  }
  function inspect(id){
    const s=stage();
    if(id==="capsule"){
      if(s==="capsule"){
        state.hasCapsule=true;save();
        return {changed:true,message:"🎁 Cápsula do tempo encontrada! Volte à professora Sofia para entregar."};
      }
      return {changed:false,message:state.hasCapsule?"A cápsula já está na mochila. Entregue à Sofia.":"A cápsula ainda não foi encontrada. Resolva todas as pistas."};
    }
    const index=puzzles.findIndex(p=>p.id===id);
    if(index<0)return null;
    if(s==="ready")return {changed:false,message:"Converse primeiro com a professora Sofia."};
    if(index<state.solved)return {changed:false,message:"Essa pista já foi resolvida. Procure a próxima."};
    if(index>state.solved||s!=="clues")return {changed:false,message:"Essa pista ainda não foi liberada."};
    return {puzzle:{...puzzles[index],number:index+1}};
  }
  function answer(id,index){
    if(stage()!=="clues"||puzzles[state.solved]?.id!==id)return {ignored:true};
    const puzzle=puzzles[state.solved];
    if(index!==puzzle.correct)return {correct:false,message:"Ainda não! Releia o enigma e tente outra resposta."};
    state.solved+=1;save();
    return {correct:true,changed:true,message:puzzle.found,last:state.solved===5};
  }
  function restart(){Object.assign(state,blank());save();}
  function activeClue(){
    if(stage()==="clues")return puzzles[state.solved];
    if(stage()==="capsule")return capsule;
    return null;
  }
  function inside(r,x,y){return x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;}
  function segmentDist(x,y,s){
    const [ax,ay,bx,by]=s,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
    const t=l?clamp(((x-ax)*dx+(y-ay)*dy)/l,0,1):0;
    return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
  }
  function blocked(x,y){
    const r=.28;
    if(!rooms.some(room=>inside(room,x,y)))return true;
    if(walls.some(s=>segmentDist(x,y,s)<r+.14))return true;
    if(furniture.some(f=>f.kind!=="mat"&&x>f.x-r&&x<f.x+f.w+r&&
      y>f.y-r&&y<f.y+f.h+r))return true;
    return distance({x,y},teacher)<r+.37;
  }
  function enter(){
    active=true;clock=0;player.x=14;player.y=17.65;
    player.facing="up";player.walk=0;player.moving=false;
  }
  function leave(){active=false;player.moving=false;}
  function pause(){player.moving=false;}
  function roomName(){return rooms.find(r=>inside(r,player.x,player.y))?.name||"FAAMinha";}
  function update(dt,held){
    if(!active)return;
    const step=clamp(Number(dt)||0,0,.05);
    clock+=step;
    const dx0=Number(held.has("ArrowRight")||held.has("d"))-
      Number(held.has("ArrowLeft")||held.has("a"));
    const dy0=Number(held.has("ArrowDown")||held.has("s"))-
      Number(held.has("ArrowUp")||held.has("w"));
    const len=Math.hypot(dx0,dy0)||1;
    const dx=dx0/len*4.8*step,dy=dy0/len*4.8*step;
    const old={x:player.x,y:player.y};
    if(!blocked(player.x+dx,player.y))player.x+=dx;
    if(!blocked(player.x,player.y+dy))player.y+=dy;
    player.moving=distance(old,player)>.00001;
    if(player.moving){
      player.walk+=step*11;
      player.facing=Math.abs(dx0)>Math.abs(dy0)?dx0>0?"right":"left":dy0>0?"down":"up";
    }
  }
  function nearest(){
    if(distance(player,exit)<1.12)return {kind:"exit",id:"exit",name:"Voltar ao campus"};
    if(distance(player,teacher)<1.85)return {kind:"teacher",id:"sofia",name:"Professora Sofia"};
    const c=activeClue();
    if(c&&distance(player,c)<1.8)return {kind:c.id==="capsule"?"capsule":"clue",id:c.id,name:c.name};
    return null;
  }
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function round(x,y,w,h,r,c,stroke){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();
    if(stroke){ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function line(x,y,x2,y2,c,w=2){
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);
    ctx.lineWidth=w;ctx.strokeStyle=c;ctx.lineCap="round";ctx.stroke();
  }
  function ellipse(x,y,rx,ry,c){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=c;ctx.fill();
  }
  function label(s,x,y,size=12,c="#fff5d5",bold=false){
    ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=c;ctx.fillText(s,x,y);
  }
  function furnitureDraw(f){
    const p=pt(f.x,f.y),w=f.w*T,h=f.h*T;
    if(f.kind==="mat"){
      round(p.x,p.y,w,h,11,"#f7a7a5","#ffdfce");
      for(let i=0;i<3;i++)for(let j=0;j<2;j++){
        const k=pt(f.x+.5+i*.95,f.y+.52+j*.95);
        ellipse(k.x,k.y,11,9,["#f8df85","#9ee5c6","#b9c5ee"][(i+j)%3]);
      }
      return;
    }
    ellipse(p.x+w/2+3,p.y+h+4,w/2+2,5,"#273c4b4e");
    if(f.kind==="plant"){
      round(p.x+3,p.y+11,w-6,h-11,3,"#c17850");
      ellipse(p.x+w/2,p.y+7,12,9,"#3d916b");
      ellipse(p.x+w/2-8,p.y+1,8,8,"#74bd6c");
      ellipse(p.x+w/2+7,p.y+1,8,8,"#9ed48a");
    }else if(f.kind==="shelf"){
      round(p.x,p.y,w,h,4,"#926b50","#4d3a36");
      for(let row=0;row<3;row++){
        rect(p.x+4,p.y+5+row*h/3,w-8,h/3-8,"#4d493d");
        for(let n=0;n<3;n++)rect(p.x+6+n*8,p.y+8+row*h/3,5,h/3-13,
          ["#e5b17f","#91bdaf","#c98c8a"][(n+row)%3]);
      }
    }else{
      const c=f.kind==="counter"?"#a36d4e":f.kind==="chest"?"#c68865":"#c09a71";
      round(p.x,p.y,w,h,5,c,"#6c5646");
      rect(p.x+4,p.y+5,w-8,3,"#ffe9be66");
      if(f.kind==="counter")label("BOAS-VINDAS",p.x+w/2,p.y+h*.68,11,"#fff0d2",true);
      if(f.kind==="chest")label("★",p.x+w/2,p.y+h*.7,16,"#ffedaa",true);
      if(f.kind==="desk"){round(p.x+w*.45,p.y+6,17,12,3,"#f3e6d5");}
    }
  }
  function actor(person,isPlayer){
    const p=pt(person.x,person.y),walk=isPlayer&&person.moving?Math.sin(person.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#1d35455c");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(walk)*2:0));
    ctx.scale(isPlayer&&person.facing==="left"?-1:1,1);
    line(-5,-14,-5+walk*4,-2,"#405070",7);
    line(5,-14,5-walk*4,-2,"#405070",7);
    line(-9,-2,-1,-2,"#f6f1df",4);line(4,-2,10,-2,"#f6f1df",4);
    round(-12,-38,24,28,6,isPlayer?"#6eaac4":person.shirt,"#45546c");
    line(-14,-31,-15-walk*3,-18,"#bb8e6c",6);
    line(14,-31,15+walk*3,-18,"#bb8e6c",6);
    ellipse(0,-52,12,14,isPlayer?"#d5a27c":person.skin);
    ellipse(-5,-62,11,7,isPlayer?"#403438":person.hair);
    ellipse(4,-63,10,6,isPlayer?"#403438":person.hair);
    ellipse(-4,-52,1.5,1.5,"#253746");ellipse(4,-52,1.5,1.5,"#253746");
    ctx.restore();
    if(!isPlayer){
      label("Prof. Sofia",p.x,p.y-95,12,"#fff2ce",true);
      ellipse(p.x,p.y-82+Math.sin(clock*3)*2,12,11,"#ffecaa");
      label("E",p.x,p.y-77+Math.sin(clock*3)*2,12,"#34536c",true);
    }
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const scale=clamp(zoom/.8,.82,1.8);
    ctx.setTransform(1,0,0,1,0,0);
    const sky=ctx.createLinearGradient(0,0,0,canvasHeight);
    sky.addColorStop(0,"#2c4b62");sky.addColorStop(1,"#182f48");
    rect(0,0,canvasWidth,canvasHeight,sky);
    const focus=pt(player.x,player.y);
    cameraX+=(canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,scale-1)*.65-cameraX)*.13;
    cameraY+=(canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,scale-1)*.65-cameraY)*.13;
    ctx.save();
    ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(scale,scale);
    ctx.translate(-cameraX,-cameraY);
    const base=pt(1.8,1.8);
    round(base.x-12,base.y-17,24.4*T+25,18*T+32,14,"#476a6a","#f2d49a");
    for(const r of rooms){
      const p=pt(r.x,r.y);rect(p.x,p.y,r.w*T,r.h*T,r.c);
      for(let x=0;x<r.w;x++)for(let y=0;y<r.h;y++){
        if((x+y)%2===0)rect(p.x+x*T,p.y+y*T,T,T,"#ffffff16");
      }
      for(let x=0;x<=r.w;x++)line(p.x+x*T,p.y,p.x+x*T,p.y+r.h*T,"#62827d22",.8);
      for(let y=0;y<=r.h;y++)line(p.x,p.y+y*T,p.x+r.w*T,p.y+y*T,"#62827d22",.8);
    }
    // Área de recreação com cores e desenhos infantis.
    const play=pt(18,3.2);
    round(play.x,play.y,7*T,1.1*T,7,"#82bfd4","#eaf7df");
    label("RECREAÇÃO • BRINCAR E APRENDER",play.x+3.5*T,play.y+21,12,"#285368",true);
    const art=pt(5.9,2.8);round(art.x-65,art.y-12,130,34,6,"#488b69","#ffe7b7");
    label("SALINHA DO SABER",art.x,art.y+10,13,"#fff3d4",true);
    const book=pt(14,2.65);round(book.x-70,book.y-10,140,30,5,"#6b9a6b","#f2dfa6");
    label("BIBLIOTECA INFANTIL",book.x,book.y+11,12,"#fff8da",true);
    const lobby=pt(14,12.65);round(lobby.x-109,lobby.y-13,218,29,7,"#629b85","#f8e3ae");
    label("BEM-VINDOS À FAAMINHA!",lobby.x,lobby.y+7,15,"#fff8da",true);
    const hall=pt(14,8.2);
    round(hall.x-47,hall.y-9,94,22,5,"#f5ebc3","#899c83");
    label("CORREDOR",hall.x,hall.y+6,10,"#41665c",true);
    furniture.forEach(furnitureDraw);
    for(const wall of walls){
      const [ax,ay,bx,by]=wall,a=pt(ax,ay),b=pt(bx,by);
      line(a.x+3,a.y+7,b.x+3,b.y+7,"#192f4466",16);
      line(a.x,a.y,b.x,b.y,"#6f8a7b",14);
      line(a.x,a.y-4,b.x,b.y-4,"#eaf0de",12);
      line(a.x,a.y-8,b.x,b.y-8,"#fff5df",4);
    }
    for(const x of [11,17]){
      const p=pt(x,9.18);
      round(p.x-5,p.y-27,10,52,3,"#8cc2b5");
      line(p.x,p.y-22,p.x+(x===11?19:-19),p.y-38,"#ab8967",3);
    }
    // Apenas a pista ativa é destacada: as próximas são reveladas em sequência.
    const clue=activeClue();
    if(clue){
      const p=pt(clue.x,clue.y);
      ellipse(p.x,p.y+2,19,9,"#d6a24166");
      ellipse(p.x,p.y-24+Math.sin(clock*4)*3,17,14,"#ffe69bc9");
      label(clue.icon,p.x,p.y-19+Math.sin(clock*4)*3,19,"#3a5364",true);
      label(clue.id==="capsule"?"TESOURO!":"PISTA "+(state.solved+1),
        p.x,p.y-49,11,"#fff1bf",true);
    }
    actor(teacher,false);actor(player,true);
    const door=pt(14,19);
    round(door.x-56,door.y-4,112,13,4,"#398394","#ffe2a3");
    label("SAÍDA [E]",door.x,door.y+24,11,"#fff5dd",true);
    ctx.restore();
  }
  return {enter,leave,pause,update,draw,nearest,blocked,roomName,
    talk,inspect,answer,restart,stage,progress,objective,puzzles,capsule,rooms,furniture,teacher,exit,
    get active(){return active;},get player(){return player;}};
};
