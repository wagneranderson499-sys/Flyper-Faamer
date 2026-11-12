/* FAAMA Explorer 2.8 — O Restaurante Misterioso.
 * Interior e jogo de cozinha independentes das missões anteriores.
 * Pratos fictícios, inspirados em refeições vegetarianas de cafeteria.
 */
"use strict";
window.createFaamaRestaurant=function createFaamaRestaurant({ctx,storage,canvasWidth=1200,canvasHeight=760}){
  const KEY="faama-explorer-quest-05-v1",W=28,H=20,T=30,LIMIT=180,PENALTY=7;
  const ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const pt=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const ingredients=[
    {id:"alface",name:"Alface",icon:"🥬"},{id:"tomate",name:"Tomate",icon:"🍅"},
    {id:"cenoura",name:"Cenoura",icon:"🥕"},{id:"goma",name:"Goma de tapioca",icon:"⚪"},
    {id:"queijo",name:"Queijo",icon:"🧀"},{id:"banana",name:"Banana",icon:"🍌"},
    {id:"mamao",name:"Mamão",icon:"🍈"},{id:"granola",name:"Granola",icon:"🥣"},
    {id:"pao",name:"Pão integral",icon:"🍞"},{id:"iogurte",name:"Iogurte",icon:"🥛"}
  ];
  const orders=[
    {id:"salada",name:"Salada tropical",customer:"Ana",icon:"🥗",
      hint:"Folhas frescas e dois vegetais coloridos.",ingredients:["alface","tomate","cenoura"],x:19.2,y:6.5},
    {id:"tapioca",name:"Tapioca com queijo",customer:"Pedro",icon:"🫓",
      hint:"Goma de tapioca, queijo e um toque de tomate.",ingredients:["goma","queijo","tomate"],x:23.1,y:6.5},
    {id:"frutas",name:"Tigela de frutas",customer:"Júlia",icon:"🍌",
      hint:"Banana, mamão e granola para finalizar.",ingredients:["banana","mamao","granola"],x:19.2,y:10.4},
    {id:"sanduiche",name:"Sanduíche natural",customer:"Lucas",icon:"🥪",
      hint:"Pão integral, alface e queijo.",ingredients:["pao","alface","queijo"],x:23.1,y:10.4},
    {id:"iogurte",name:"Iogurte com frutas",customer:"Bia",icon:"🥛",
      hint:"Iogurte, banana e granola.",ingredients:["iogurte","banana","granola"],x:20.7,y:15.0}
  ];
  const chef={id:"clara-chef",name:"Clara",role:"Cozinheira do Restaurante",
    x:10.5,y:14.7,skin:"#ba8057",hair:"#392f32",shirt:"#f1ba73"};
  const prep={x:14.4,y:9.6,name:"Bancada de preparo"};
  const exit={x:14,y:18.48};
  const furniture=[
    {kind:"counter",x:12.6,y:8.1,w:3.65,h:1.05},
    {kind:"fridge",x:3.2,y:3.5,w:1.2,h:1.6},
    {kind:"stove",x:5.5,y:3.5,w:2.0,h:1.0},
    {kind:"counter",x:8.4,y:3.5,w:2.2,h:1.0},
    {kind:"counter",x:4.6,y:7.3,w:4.1,h:.85},
    {kind:"table",x:18.2,y:5.0,w:2.1,h:.9},
    {kind:"table",x:22.1,y:5.0,w:2.1,h:.9},
    {kind:"table",x:18.2,y:8.8,w:2.1,h:.9},
    {kind:"table",x:22.1,y:8.8,w:2.1,h:.9},
    {kind:"table",x:19.7,y:13.4,w:2.1,h:.9},
    {kind:"bench",x:4.6,y:13.4,w:3.3,h:.7},
    {kind:"bench",x:4.6,y:16.0,w:3.3,h:.7},
    {kind:"plant",x:24.6,y:16.7,w:.7,h:.7},
    {kind:"plant",x:3.1,y:11.0,w:.75,h:.75},
    {kind:"plant",x:11.3,y:5.7,w:.72,h:.72}
  ];
  const player={x:14,y:17.25,walk:0,moving:false,facing:"up"};
  let active=false,anim=0,phase="idle",elapsed=0,served=0,prepared=false,errors=0;
  let camX=canvasWidth/2,camY=canvasHeight/2;
  const fresh=()=>({completed:false,bestTime:null,attempt:null});
  function load(){
    try{
      const v=JSON.parse(storage?.getItem(KEY)||"null");
      if(!v||v.version!==1)return fresh();
      const completed=v.completed===true;
      const time=Number(v.bestTime);
      const bestTime=completed&&Number.isFinite(time)&&time>0&&time<=LIMIT?time:null;
      const a=v.attempt;
      let attempt=null;
      if(a&&typeof a==="object"&&
        Number.isInteger(a.served)&&a.served>=0&&a.served<5 &&
        Number.isFinite(a.elapsed)&&a.elapsed>=0&&a.elapsed<LIMIT &&
        Number.isInteger(a.errors)&&a.errors>=0&&a.errors<=999){
        attempt={served:a.served,elapsed:a.elapsed,errors:a.errors,prepared:a.prepared===true};
      }
      return {completed,bestTime,attempt};
    }catch(_err){return fresh();}
  }
  const saved=load();
  function persist(){
    try{storage?.setItem(KEY,JSON.stringify({version:1,...saved}));}
    catch(_err){/* Navegação privada pode bloquear armazenamento. */}
  }
  function snapshot(){
    saved.attempt=phase==="running"||phase==="paused"
      ?{served,elapsed:Math.round(elapsed*10)/10,prepared,errors}:null;
    persist();
  }
  function currentOrder(){return orders[served]||null;}
  function progress(){
    const running=phase==="running",done=saved.completed;
    return {stage:phase,active,completed:done,served,total:orders.length,
      prepared,errors,elapsed,timeLimit:LIMIT,timeLeft:Math.max(0,LIMIT-elapsed),
      bestTime:saved.bestTime,bestLabel:saved.bestTime===null?"—":saved.bestTime.toFixed(1).replace(".",",")+"s",
      xp:done?200:0,achievement:done?"Chef do Campus":null,
      order:currentOrder(),objective:objective()};
  }
  function objective(){
    if(phase==="running"){
      const o=currentOrder();
      if(prepared)return "Entregue "+o.name+" para "+o.customer+" ("+served+"/5 pedidos).";
      return "Prepare "+o.name+" para "+o.customer+" na bancada ("+served+"/5 entregues).";
    }
    if(phase==="paused")return "Converse com Clara para retomar o preparo do pedido "+(served+1)+".";
    if(phase==="failed")return "Tempo esgotado! Converse com Clara para tentar novamente.";
    if(phase==="finished")return "Todos os pedidos entregues! Novo recorde pode ser conquistado em outra tentativa.";
    if(saved.completed)return "Conquista Chef do Campus garantida! Converse com Clara para jogar novamente.";
    return "Converse com a cozinheira Clara para começar os cinco pedidos vegetarianos.";
  }
  function enter(){
    active=true;anim=0;player.x=14;player.y=17.25;player.moving=false;player.facing="up";
    if(saved.attempt){
      ({served,elapsed,errors,prepared}=saved.attempt);
      phase="paused";
    }else{phase="idle";elapsed=0;served=0;prepared=false;errors=0;}
  }
  function leave(){
    if(phase==="running"){phase="paused";snapshot();}
    active=false;player.moving=false;
  }
  function talkChef(){
    if(phase==="running")return {startOnClose:false,lines:[
      "O cronômetro está correndo! Prepare o prato na bancada e entregue ao estudante certo.",
      "Confira a dica do pedido antes de escolher os ingredientes."
    ]};
    if(phase==="paused")return {startOnClose:true,lines:[
      "Bem-vindo de volta! Seu progresso foi guardado.",
      "Você já entregou "+served+" de cinco pedidos. Quando terminarmos a conversa, retomaremos de onde parou."
    ]};
    if(phase==="failed")return {startOnClose:true,lines:[
      "O tempo acabou, mas podemos tentar de novo!",
      "Prepare os cinco pedidos e entregue a cada estudante antes dos três minutos."
    ]};
    if(saved.completed)return {startOnClose:true,lines:[
      "Você já conquistou o título Chef do Campus! Quer melhorar seu recorde?",
      "Depois dessa conversa, começará uma nova rodada de pedidos vegetarianos."
    ]};
    return {startOnClose:true,lines:[
      "Olá! Sou Clara, cozinheira do Restaurante. Os pedidos dos estudantes ficaram misturados!",
      "Ajude-me a preparar cinco refeições vegetarianas. Cada prato precisa de três ingredientes corretos.",
      "Aproxime-se da bancada e pressione E para escolher ingredientes. Depois entregue ao estudante indicado.",
      "Você terá 180 segundos! Erros de preparo descontam 7 segundos. Ao encerrar a conversa, começamos!"
    ]};
  }
  function begin(){
    if(!active||phase==="running")return false;
    if(phase==="paused"){phase="running";snapshot();return true;}
    phase="running";elapsed=0;served=0;prepared=false;errors=0;snapshot();
    return true;
  }
  function reset(){
    Object.assign(saved,fresh());phase="idle";elapsed=0;served=0;
    prepared=false;errors=0;persist();
  }
  function fail(){
    phase="failed";saved.attempt=null;persist();
    return {kind:"timeout",message:"Tempo esgotado! Converse com Clara e tente novamente."};
  }
  function prepare(ids){
    if(phase!=="running")return {ignored:true};
    if(prepared)return {ignored:true,message:"Prato pronto! Entregue-o ao estudante indicado."};
    const order=currentOrder();
    if(!order)return {ignored:true};
    const list=Array.isArray(ids)?[...new Set(ids)]:[];
    if(list.length!==3)return {correct:false,wrong:false,message:"Escolha exatamente três ingredientes para preparar o prato."};
    const expected=new Set(order.ingredients);
    if(!list.every(id=>expected.has(id))){
      errors++;elapsed=Math.min(LIMIT,elapsed+PENALTY);
      if(elapsed>=LIMIT)return {correct:false,wrong:true,...fail()};
      snapshot();
      return {correct:false,wrong:true,message:"Ingredientes incorretos! -7 segundos. Confira a dica do pedido e tente novamente."};
    }
    prepared=true;snapshot();
    return {correct:true,kind:"prepared",message:order.icon+" "+order.name+" pronto! Entregue para "+order.customer+"."};
  }
  function deliver(customerId){
    if(phase!=="running")return {ignored:true,message:"Converse com Clara para iniciar a cozinha."};
    const order=currentOrder();
    if(!order||order.id!==customerId)return {ignored:true,message:"Esse pedido pertence a outro estudante."};
    if(!prepared)return {ignored:true,message:"Prepare primeiro o pedido na bancada!"};
    served++;prepared=false;
    if(served===orders.length){
      phase="finished";
      const seconds=Math.max(.1,Math.round(elapsed*10)/10);
      const first=!saved.completed;
      const newBest=saved.bestTime===null||seconds<saved.bestTime;
      saved.completed=true;
      if(newBest)saved.bestTime=seconds;
      saved.attempt=null;
      persist();
      return {kind:"finished",first,newBest,time:seconds,
        message:(first?"Missão 05 concluída! +200 XP • Chef do Campus! ":"Todos os pedidos entregues! ")+
        "Tempo: "+seconds.toFixed(1).replace(".",",")+"s"+
        (newBest?" • Novo recorde!":"")};
    }
    snapshot();
    return {kind:"delivered",message:"Pedido entregue a "+order.customer+"! "+served+
      "/5 concluídos. Próximo: "+currentOrder().name+"."};
  }
  function solid(x,y){
    const radius=.28;
    if(x<2.4+radius||x>25.6-radius||y<2.3+radius||y>18.95-radius)return true;
    if(furniture.some(f=>x>f.x-radius&&x<f.x+f.w+radius&&
      y>f.y-radius&&y<f.y+f.h+radius))return true;
    if(dist({x,y},chef)<radius+.35)return true;
    if(orders.some(o=>dist({x,y},o)<radius+.34))return true;
    return false;
  }
  function nearest(){
    if(dist(player,exit)<1.1)return {kind:"exit",name:"Voltar ao campus"};
    if(dist(player,chef)<2)return {kind:"chef",name:"Cozinheira Clara"};
    if(dist(player,prep)<2.2)return {kind:"prep",name:"Bancada de preparo"};
    const o=currentOrder();
    if(o&&dist(player,o)<1.8)return {kind:"customer",id:o.id,name:"Entregar para "+o.customer};
    return null;
  }
  function update(dt,held){
    if(!active)return null;
    const step=clamp(Number(dt)||0,0,.05);
    anim+=step;
    const dx0=Number(held.has("ArrowRight")||held.has("d"))-
      Number(held.has("ArrowLeft")||held.has("a"));
    const dy0=Number(held.has("ArrowDown")||held.has("s"))-
      Number(held.has("ArrowUp")||held.has("w"));
    const len=Math.hypot(dx0,dy0)||1;
    const dx=dx0/len*4.75*step,dy=dy0/len*4.75*step;
    const old={x:player.x,y:player.y};
    if(!solid(player.x+dx,player.y))player.x+=dx;
    if(!solid(player.x,player.y+dy))player.y+=dy;
    player.moving=dist(old,player)>.0001;
    if(player.moving){
      player.walk+=step*11;
      player.facing=Math.abs(dx0)>Math.abs(dy0)?dx0>0?"right":"left":dy0>0?"down":"up";
    }
    if(phase==="running"){
      elapsed=Math.min(LIMIT,elapsed+step);
      if(elapsed>=LIMIT)return fail();
      // Atualização periódica para restaurar progresso mesmo após atualizar a página.
      const previousTenth=Math.floor((elapsed-step)*2),nowTenth=Math.floor(elapsed*2);
      if(nowTenth>previousTenth)snapshot();
    }
    return null;
  }
  function pause(){player.moving=false;}
  function line(x,y,x2,y2,c,w=2){
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);
    ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap="round";ctx.stroke();
  }
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function round(x,y,w,h,r,c,stroke){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function ellipse(x,y,rx,ry,c){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
  }
  function text(s,x,y,size=12,c="#fff2d8",bold=false){
    ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=c;ctx.fillText(s,x,y);
  }
  function furnitureDraw(f){
    const p=pt(f.x,f.y),w=f.w*T,h=f.h*T;
    ellipse(p.x+w/2+3,p.y+h+6,w/2+2,6,"#182b3751");
    if(f.kind==="plant"){
      round(p.x+4,p.y+12,w-8,h-12,3,"#bd7650");
      ellipse(p.x+w/2,p.y+7,13,10,"#377d51");
      ellipse(p.x+w/2-8,p.y+3,9,10,"#68ad69");
      ellipse(p.x+w/2+8,p.y+2,9,10,"#8ad47c");
      return;
    }
    if(f.kind==="fridge"){
      round(p.x,p.y-23,w,h+23,5,"#e5ebe8","#708f94");
      line(p.x,p.y+h*.33,p.x+w,p.y+h*.33,"#aac2c2",2);
      round(p.x+w-9,p.y-10,3,15,2,"#6c858e");
      round(p.x+w-9,p.y+h*.44,3,12,2,"#6c858e");
      return;
    }
    if(f.kind==="stove"){
      round(p.x,p.y,w,h,4,"#6d828a","#c5d4d8");
      for(let i=0;i<2;i++)ellipse(p.x+w*(.28+i*.45),p.y+h*.5,8,7,"#283c46");
      return;
    }
    if(f.kind==="bench"){
      round(p.x,p.y,w,h,5,"#967655","#554a3d");
      for(let j=1;j<4;j++)line(p.x+5,p.y+h*j/4,p.x+w-5,p.y+h*j/4,"#d3ac79",2);
      return;
    }
    const wood=f.kind==="table"?"#cba477":"#a97951";
    round(p.x,p.y,w,h,6,wood,"#78573c");
    rect(p.x+5,p.y+5,w-10,3,"#ffe6b16e");
    if(f.kind==="table"){
      ellipse(p.x+w/2,p.y+h/2,13,8,"#f7e2c5");
      ellipse(p.x+w/2,p.y+h/2,7,4,"#78a26c");
    }else if(f.x===12.6){
      text("PREPARO",p.x+w/2,p.y+h*.68,12,"#fff3d3",true);
    }
  }
  function character(person,isPlayer=false,highlight=false){
    const p=pt(person.x,person.y),s=isPlayer&&person.moving?Math.sin(person.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#1c34415a");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(s)*2:0));
    ctx.scale(isPlayer&&person.facing==="left"?-1:1,1);
    line(-5,-14,-5+s*4,-1,"#345169",7);
    line(5,-14,5-s*4,-1,"#345169",7);
    line(-8,-2,-1,-2,"#fff5dc",4);line(4,-2,10,-2,"#fff5dc",4);
    round(-12,-38,24,28,6,isPlayer?"#68a9cb":person.shirt||"#7b9a9a","#35536a");
    line(-14,-32,-15-s*4,-17,"#c18a62",6);line(14,-32,15+s*4,-17,"#c18a62",6);
    ellipse(0,-52,12,14,isPlayer?"#dca780":person.skin||"#bd8661");
    ellipse(-5,-63,10,6,isPlayer?"#393139":person.hair||"#48353c");
    ellipse(5,-64,9,6,isPlayer?"#393139":person.hair||"#48353c");
    ellipse(-4,-52,1.4,1.4,"#253a45");ellipse(4,-52,1.4,1.4,"#253a45");
    ctx.restore();
    if(highlight){
      ellipse(p.x,p.y-84+Math.sin(anim*3)*2,13,11,"#ffe2a4");
      text("E",p.x,p.y-80+Math.sin(anim*3)*2,12,"#2d4b57",true);
    }
    if(!isPlayer)text(person.name||person.customer,p.x,p.y-95,11,"#fff0da",true);
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const factor=clamp(zoom/.8,.82,1.8);
    ctx.setTransform(1,0,0,1,0,0);
    const bg=ctx.createLinearGradient(0,0,0,canvasHeight);
    bg.addColorStop(0,"#263f4b");bg.addColorStop(1,"#18303d");
    rect(0,0,canvasWidth,canvasHeight,bg);
    const fp=pt(player.x,player.y);
    camX+=(canvasWidth/2+(fp.x-canvasWidth/2)*Math.max(0,factor-1)*.65-camX)*.13;
    camY+=(canvasHeight/2+(fp.y-canvasHeight/2)*Math.max(0,factor-1)*.65-camY)*.13;
    ctx.save();ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(factor,factor);
    ctx.translate(-camX,-camY);
    const shell=pt(2.2,2.1);
    round(shell.x-14,shell.y-16,23.7*T+29,17.1*T+34,14,"#445d5a","#e5c991");
    const kitchen=pt(2.4,2.3),dining=pt(2.4,10.3);
    rect(kitchen.x,kitchen.y,23.2*T,8*T,"#cbb08b");
    rect(dining.x,dining.y,23.2*T,8.6*T,"#e3c7a1");
    for(let x=0;x<24;x++)for(let y=0;y<17;y++){
      const a=pt(2.4+x,2.3+y);
      if((x+y)%2===0)rect(a.x,a.y,T,T,"#fff8d921");
      line(a.x,a.y,a.x+T,a.y,"#776e5940",.7);
      line(a.x,a.y,a.x,a.y+T,"#776e5940",.7);
    }
    const service=pt(14,3.1);
    round(service.x-131,service.y-19,262,30,8,"#38756d","#f4d7a6");
    text("RESTAURANTE DA FAAMA",service.x,service.y+1,17,"#fff4db",true);
    const cuisine=pt(7,3.1);
    round(cuisine.x-56,cuisine.y-17,112,26,6,"#a67452","#f2d5a8");
    text("COZINHA",cuisine.x,cuisine.y+1,13,"#fff3d2",true);
    const room=pt(21.5,3.1);
    round(room.x-70,room.y-17,140,26,6,"#50806b","#e8d9b1");
    text("SALÃO DE REFEIÇÕES",room.x,room.y+1,11,"#fff4db",true);
    const aisle=pt(14,14);
    round(aisle.x-38,aisle.y-100,76,118,9,"#dca8754c","#f5dfb044");
    furniture.forEach(furnitureDraw);
    orders.forEach((o,i)=>{
      const hue=["#b57878","#6b9a80","#8a8ec0","#c2a16c","#72a6a9"][i];
      character({...o,name:o.customer,shirt:hue},false,
        phase==="running"&&currentOrder()?.id===o.id&&prepared);
      if(phase==="running"&&currentOrder()?.id===o.id){
        const q=pt(o.x,o.y);
        ellipse(q.x,q.y-111+Math.sin(anim*4)*3,17,14,"#ffe09e");
        text(prepared?"!":"?",q.x,q.y-106+Math.sin(anim*4)*3,16,"#37516a",true);
      }
    });
    character(chef,false,phase!=="running");
    if(phase==="running"&&!prepared){
      const p=pt(prep.x,prep.y);
      ellipse(p.x,p.y-28+Math.sin(anim*3)*2,16,12,"#ffe4ab");
      text("E",p.x,p.y-23+Math.sin(anim*3)*2,14,"#38526a",true);
    }
    character(player,true);
    const e=pt(14,18.9);
    round(e.x-57,e.y-5,114,14,4,"#2d7889","#ffe5a7");
    text("SAÍDA [E]",e.x,e.y+25,12,"#fff2d9",true);
    ctx.restore();
  }
  return {enter,leave,begin,reset,talkChef,nearest,prepare,deliver,update,pause,
    progress,objective,draw,solid,ingredients,orders,chef,prep,exit,
    get active(){return active;},get phase(){return phase;},get player(){return player;}};
};
