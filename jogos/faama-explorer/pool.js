/* FAAMA Explorer 3.0 — Desafio Aquático.
 * Minigame fictício e seguro, inspirado na área da piscina do campus.
 * Salvamento independente; não altera outras missões.
 */
"use strict";
window.createFaamaPool=function createFaamaPool({ctx,storage,canvasWidth=1200,canvasHeight=760}){
  const KEY="faama-explorer-quest-07-v1",W=28,H=20,T=30,LIMIT=120;
  const ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const point=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const buoys=[
    {id:"onda",x:6.2,y:11.5},{id:"sol",x:8.2,y:6},
    {id:"estrela",x:14.1,y:9.6},{id:"gota",x:20.4,y:6.1},
    {id:"coral",x:22,y:12.2}
  ];
  const obstacles=[
    {x:9,y:9.3,r:.48},{x:12.3,y:6.8,r:.5},{x:16.8,y:11.2,r:.52},
    {x:18.4,y:8.6,r:.53},{x:13.7,y:12.7,r:.4}
  ];
  const coach={id:"nara-pool",name:"Guarda-vidas Nara",role:"Orientadora do Desafio Aquático",
    x:9.2,y:16.4,skin:"#bd875d",hair:"#3c3746",shirt:"#d6a848"};
  const finish={x:14,y:16.1},exit={x:14,y:18.55};
  const player={x:14,y:17.3,walk:0,facing:"up",moving:false};
  let active=false,phase="idle",elapsed=0,anim=0,cameraX=canvasWidth/2,cameraY=canvasHeight/2;
  let collected=new Set();
  function savedLoad(){
    try{
      const s=JSON.parse(storage?.getItem(KEY)||"null");
      if(s?.version!==1)return {completed:false,bestTime:null};
      const best=Number(s.bestTime);
      return {completed:s.completed===true,bestTime:s.completed===true&&Number.isFinite(best)&&best>0&&best<=LIMIT?best:null};
    }catch(_error){return {completed:false,bestTime:null};}
  }
  const saved=savedLoad();
  function persist(){try{storage?.setItem(KEY,JSON.stringify({version:1,...saved}));}catch(_error){}}
  function timeLabel(v){return Number.isFinite(v)?v.toFixed(1).replace(".",",")+"s":"—";}
  function objective(){
    if(phase==="running")return "Colete as "+(5-collected.size)+" boias restantes e toque a faixa de chegada antes de 120 segundos.";
    if(phase==="failed")return "Tempo encerrado! Fale com Nara para tentar novamente.";
    if(phase==="finished")return "Circuito concluído! Fale com Nara para melhorar seu recorde.";
    return saved.completed?"Conquista Explorador Aquático garantida! Fale com Nara para competir de novo.":
      "Converse com a guarda-vidas Nara para iniciar o Desafio Aquático.";
  }
  function progress(){
    return {stage:phase,active,completed:saved.completed,elapsed,timeLeft:Math.max(0,LIMIT-elapsed),timeLimit:LIMIT,
      buoys:collected.size,total:buoys.length,bestTime:saved.bestTime,bestLabel:timeLabel(saved.bestTime),
      xp:saved.completed?200:0,achievement:saved.completed?"Explorador Aquático":null,objective:objective()};
  }
  function enter(){active=true;phase="idle";elapsed=0;collected.clear();anim=0;player.x=14;player.y=17.3;
    player.moving=false;player.facing="up";}
  function leave(){active=false;phase="idle";elapsed=0;collected.clear();player.moving=false;}
  function restartProgress(){saved.completed=false;saved.bestTime=null;persist();phase="idle";elapsed=0;collected.clear();}
  function talkCoach(){
    if(phase==="running")return {startOnClose:false,lines:collected.size===buoys.length?[
      "Parabéns! Você já pegou as cinco boias. Não precisa procurar mais nenhuma.",
      "Agora vá até o centro da faixa quadriculada com a palavra CHEGADA, na parte inferior da piscina, para concluir o desafio."
    ]:[
      "Você já pegou "+collected.size+" de "+buoys.length+" boias. Ainda faltam "+(buoys.length-collected.size)+".",
      "Continue explorando a piscina e depois vá até a faixa quadriculada CHEGADA, na parte inferior."
    ]};
    if(phase==="failed")return {startOnClose:true,lines:[
      "O tempo acabou! Você pode tentar novamente sem problema.",
      "Prepare-se: serão cinco boias e 120 segundos para completar o circuito."]};
    if(saved.completed)return {startOnClose:true,lines:[
      "Você já conquistou o título Explorador Aquático! Que tal bater seu recorde?",
      "Depois da conversa, uma nova tentativa começará sem duplicar seus pontos."]};
    return {startOnClose:true,lines:[
      "Oi! Sou Nara, responsável por orientar as atividades nesta piscina.",
      "Preparei um circuito fictício: colete cinco boias coloridas, evitando os obstáculos flutuantes.",
      "Depois de coletar as cinco, volte à faixa dourada de chegada. Você tem 120 segundos!",
      "Ao terminar nossa conversa, começa o desafio. Boa sorte!"]};
  }
  function start(){if(!active)return false;phase="running";elapsed=0;collected.clear();
    player.x=14;player.y=16.75;player.moving=false;return true;}
  function solid(x,y){
    const rad=.28;
    if(x<2.5+rad||x>25.5-rad||y<2.8+rad||y>18.95-rad)return true;
    if(obstacles.some(o=>distance({x,y},o)<rad+o.r))return true;
    if(distance({x,y},coach)<rad+.37)return true;
    // Deck has a few non-traversable planters.
    if([[3.1,16],[24.3,16],[3.3,4.5],[24.3,4.5]].some(([a,b])=>Math.hypot(x-a,y-b)<rad+.4))return true;
    return false;
  }
  function nearest(){
    if(distance(player,exit)<1.05)return {kind:"exit",name:"Voltar ao campus"};
    if(distance(player,coach)<1.85)return {kind:"coach",name:"Guarda-vidas Nara"};
    if(distance(player,finish)<1.6)return {kind:"finish",name:"Faixa de chegada"};
    return null;
  }
  function update(dt,held){
    if(!active)return null;
    const step=clamp(Number(dt)||0,0,.05);anim+=step;
    const dx0=Number(held.has("d")||held.has("ArrowRight"))-Number(held.has("a")||held.has("ArrowLeft"));
    const dy0=Number(held.has("s")||held.has("ArrowDown"))-Number(held.has("w")||held.has("ArrowUp"));
    const mag=Math.hypot(dx0,dy0)||1;
    const swimming=player.x>4.1&&player.x<23.85&&player.y>4.1&&player.y<14.1;
    const speed=swimming?4.7:5.3,dx=dx0/mag*speed*step,dy=dy0/mag*speed*step;
    const old={x:player.x,y:player.y};
    if(!solid(player.x+dx,player.y))player.x+=dx;
    if(!solid(player.x,player.y+dy))player.y+=dy;
    player.moving=distance(old,player)>.0001;
    if(player.moving){
      player.walk+=step*12;
      player.facing=Math.abs(dx0)>Math.abs(dy0)?dx0>0?"right":"left":dy0>0?"down":"up";
    }
    if(phase!=="running")return null;
    elapsed=Math.min(LIMIT,elapsed+step);
    if(elapsed>=LIMIT){phase="failed";return {kind:"timeout",message:"Tempo esgotado! Converse com Nara para tentar novamente."};}
    let caught=0;
    for(const b of buoys)if(!collected.has(b.id)&&distance(player,b)<.7){collected.add(b.id);caught++;}
    if(collected.size===buoys.length&&distance(player,finish)<1.25){
      phase="finished";const duration=Math.max(.1,Math.round(elapsed*10)/10);
      const first=!saved.completed,newBest=saved.bestTime===null||duration<saved.bestTime;
      saved.completed=true;if(newBest)saved.bestTime=duration;persist();
      return {kind:"finished",first,newBest,time:duration,
        message:(first?"Missão 07 concluída! +200 XP • Explorador Aquático! ":"Circuito concluído! ")+
        "Tempo: "+timeLabel(duration)+(newBest?" • Novo recorde!":"")};
    }
    if(caught)return {kind:"buoy",message:"Boia coletada! "+collected.size+"/5"};
    return null;
  }
  function pause(){player.moving=false;}
  const fill=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
  function line(x,y,x2,y2,c,width=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=c;ctx.stroke();}
  function round(x,y,w,h,r,c,edge){ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=c;ctx.fill();if(edge){ctx.lineWidth=2;ctx.strokeStyle=edge;ctx.stroke();}}
  function label(s,x,y,size=12,color="#fff7dc",bold=false){ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(s,x,y);}
  function drawActor(actor,isPlayer){
    const p=point(actor.x,actor.y),stride=isPlayer&&actor.moving?Math.sin(actor.walk):0;
    const water=isPlayer&&actor.x>4.1&&actor.x<23.85&&actor.y>4.1&&actor.y<14.1;
    ellipse(p.x,p.y+5,13,5,"#163e4e68");
    ctx.save();ctx.translate(p.x,p.y);
    line(-5,-14,-5+stride*5,-1,"#2f5564",6);line(5,-14,5-stride*5,-1,"#2f5564",6);
    round(-12,-37,24,25,6,isPlayer?"#48a3ca":actor.shirt,"#29576b");
    line(-14,-32,-14-stride*4,-18,"#bc8b66",6);line(14,-32,14+stride*4,-18,"#bc8b66",6);
    ellipse(0,-50,12,14,isPlayer?"#d8a17d":actor.skin);
    ellipse(-5,-62,10,7,isPlayer?"#473a35":actor.hair);ellipse(5,-62,9,6,isPlayer?"#473a35":actor.hair);
    ellipse(-4,-50,1.3,1.3,"#1e354a");ellipse(4,-50,1.3,1.3,"#1e354a");
    if(water){ellipse(0,-20,18,7,"#baf5f2a5");line(-18,-20,17,-20,"#e8f6df",2);}
    ctx.restore();
    if(!isPlayer){
      label("Guarda-vidas Nara",p.x,p.y-89,12,"#fff1d2",true);
      ellipse(p.x,p.y-79+Math.sin(anim*3)*2,12,10,"#ffe0a0");
      label("E",p.x,p.y-74+Math.sin(anim*3)*2,12,"#23475e",true);
    }
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const scale=clamp(zoom/.8,.82,1.8),focus=point(player.x,player.y);
    const goalX=canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,scale-1)*.65;
    const goalY=canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,scale-1)*.65;
    cameraX+=(goalX-cameraX)*.13;cameraY+=(goalY-cameraY)*.13;
    ctx.setTransform(1,0,0,1,0,0);
    const bg=ctx.createLinearGradient(0,0,0,canvasHeight);bg.addColorStop(0,"#1b425a");bg.addColorStop(1,"#123145");
    fill(0,0,canvasWidth,canvasHeight,bg);
    ctx.save();ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(scale,scale);ctx.translate(-cameraX,-cameraY);
    const base=point(2.2,2.5);round(base.x-8,base.y-8,23.7*T,16.7*T,12,"#d1c4a4","#f8e0b8");
    for(let x=3;x<25;x++)for(let y=3;y<19;y++)if((x+y)%2===0){const p=point(x,y);fill(p.x,p.y,T,T,"#fff8e71e");}
    const pool=point(4,4);
    round(pool.x-8,pool.y-8,20*T+16,10.3*T+16,15,"#f4f1d7","#83b2b0");
    round(pool.x,pool.y,20*T,10.3*T,12,"#258fb9","#d1f7e9");
    for(let x=0;x<20;x++)for(let y=0;y<10;y++){
      const p=point(4+x,4+y);if((x+y)%2)fill(p.x,p.y,T,T,"#a5ecf01b");
    }
    for(let i=1;i<4;i++){
      const y=4+10.3*i/4;
      const a=point(4.2,y),b=point(23.8,y);
      line(a.x,a.y,b.x,b.y,i%2?"#e8f9e6ad":"#e6f1b8ba",3);
      for(let j=0;j<12;j++){const x=4.5+j*1.65,p=point(x,y);
        ellipse(p.x,p.y,5,3,(j+i)%2?"#f6dd90":"#fbf7e2");}
    }
    for(let j=0;j<22;j++){
      const p=point(4.2+(j%11)*1.8,4.7+(j%3)*3.2);
      line(p.x-7,p.y+Math.sin(anim*3+j)*2,p.x+10,p.y+Math.sin(anim*3+j)*2,
        "#d0fcf380",1.7);
    }
    const title=point(14,3.2);round(title.x-135,title.y-18,270,28,8,"#286b83","#f3e0ae");
    label("PISCINA • DESAFIO AQUÁTICO",title.x,title.y+2,15,"#f3f6df",true);
    const lane=point(finish.x,finish.y);round(lane.x-53,lane.y-25,110,44,5,"#dbb98179","#fff2cb");
    for(let i=0;i<10;i++)for(let j=0;j<3;j++){
      fill(lane.x-50+i*10,lane.y-22+j*13,10,13,(i+j)%2?"#e9f0eb":"#3b7888");
    }
    label(collected.size===buoys.length&&phase==="running"?"CHEGADA • ENTRE AQUI":"CHEGADA",lane.x,lane.y-32,12,"#f8edba",true);
    if(collected.size===buoys.length&&phase==="running"){
      const pulse=.45+.3*Math.sin(anim*6);
      ctx.lineWidth=4;ctx.strokeStyle="rgba(255,245,150,"+pulse+")";
      ctx.strokeRect(lane.x-57,lane.y-29,118,52);
    }
    for(const b of buoys){
      if(collected.has(b.id))continue;
      const p=point(b.x,b.y),z=Math.sin(anim*3+b.x)*3;
      ellipse(p.x,p.y+4,15,6,"#124b6277");
      ellipse(p.x,p.y-15+z,15,12,"#fff7e7");
      ellipse(p.x,p.y-15+z,11,9,"#f8bd53");
      ellipse(p.x,p.y-15+z,5,5,"#319bc0");
      line(p.x-11,p.y-15+z,p.x+11,p.y-15+z,"#e9e6d7",2);
    }
    for(const o of obstacles){
      const p=point(o.x,o.y);
      ellipse(p.x,p.y+3,19,8,"#143e5865");
      round(p.x-15,p.y-15,30,18,5,"#e17e4e","#ffe2be");
      label("!",p.x,p.y-3,14,"#fff3d8",true);
    }
    for(const [x,y] of [[3.1,16],[24.3,16],[3.3,4.5],[24.3,4.5]]){
      const p=point(x,y);round(p.x-10,p.y-8,20,22,4,"#ad8159");
      ellipse(p.x,p.y-12,13,11,"#46916b");ellipse(p.x-6,p.y-15,8,8,"#a1d27b");
    }
    drawActor(coach,false);drawActor(player,true);
    const door=point(14,18.95);round(door.x-55,door.y-5,110,13,4,"#358d95","#f5e4b8");
    label("SAÍDA [E]",door.x,door.y+24,12,"#fff1cc",true);
    ctx.restore();
  }
  return {enter,leave,update,draw,pause,nearest,talkCoach,start,restartProgress,progress,objective,solid,
    buoys,obstacles,finish,coach,exit,get player(){return player;},get active(){return active;},get phase(){return phase;}};
};
