/* FAAMA Explorer 2.7 — Circuito dos Campeões.
   Ginásio e minigame independentes; não modifica a planta nem as missões 01–03. */
"use strict";
window.createFaamaSports=function createFaamaSports({ctx,storage,canvasWidth=1200,canvasHeight=760}){
  const STORAGE_KEY="faama-explorer-quest-04-v1";
  const WIDTH=28,HEIGHT=20,TILE=30,TIME_LIMIT=90;
  const ox=(canvasWidth-WIDTH*TILE)/2,oy=(canvasHeight-HEIGHT*TILE)/2;
  const pt=(x,y)=>({x:ox+x*TILE,y:oy+y*TILE});
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const medals=[
    {id:"a",x:8,y:14.3},{id:"b",x:7.6,y:7.2},
    {id:"c",x:14,y:4.8},{id:"d",x:20.7,y:7.2},{id:"e",x:20.3,y:13.4}
  ];
  const cones=[
    {x:10.4,y:12.1},{x:13.1,y:11.4},{x:16.7,y:13.0},
    {x:19.1,y:10.3},{x:15.5,y:7.4},{x:11.2,y:6.7},
    {x:9.5,y:10.0},{x:22,y:11.3},{x:17.5,y:5.6}
  ];
  const bleachers=[
    {x:2.6,y:3.4,w:2.1,h:7.8},{x:23.5,y:3.4,w:1.9,h:7.8},
    {x:11.0,y:2.2,w:6.0,h:1.0}
  ];
  const coach={
    id:"rafael",name:"Treinador Rafael",role:"Equipe do Complexo Esportivo",
    x:10.0,y:16.3,skin:"#bd8b66",hair:"#2d2b30",shirt:"#f1af3e"
  };
  const exit={x:14,y:18.45},finish={x:22.2,y:16.1,w:2.3};
  const player={x:14,y:16.85,walk:0,moving:false,facing:"up"};
  let active=false,elapsedAnim=0,phase="idle",raceTime=0;
  let heldMedals=new Set(),camX=canvasWidth/2,camY=canvasHeight/2;
  function load(){
    try{
      const v=JSON.parse(storage?.getItem(STORAGE_KEY)||"null");
      if(!v||v.version!==1)return {completed:false,bestTime:null};
      const best=Number(v.bestTime);
      return {completed:v.completed===true,
        bestTime:v.completed===true&&Number.isFinite(best)&&best>0&&best<=TIME_LIMIT?best:null};
    }catch(_err){return {completed:false,bestTime:null};}
  }
  const saved=load();
  function persist(){
    try{storage?.setItem(STORAGE_KEY,JSON.stringify({version:1,...saved}));}
    catch(_err){/* armazenamento opcional */}
  }
  const fmt=t=>Number.isFinite(t)?t.toFixed(1).replace(".",",")+"s":"—";
  function progress(){
    return {stage:phase,active,completed:saved.completed,bestTime:saved.bestTime,
      bestLabel:fmt(saved.bestTime),timeLeft:Math.max(0,TIME_LIMIT-raceTime),
      elapsed:raceTime,timeLimit:TIME_LIMIT,medals:heldMedals.size,medalTotal:medals.length,
      xp:saved.completed?200:0,
      achievement:saved.completed?"Atleta da FAAMA":null,
      objective:objective()};
  }
  function objective(){
    if(phase==="running")return "Colete "+(medals.length-heldMedals.size)+
      " medalha(s) e cruze a linha de chegada antes de "+TIME_LIMIT+" segundos.";
    if(phase==="failed")return "Tempo esgotado! Converse com Rafael para tentar novamente.";
    if(phase==="finished")return "Circuito concluído! Fale com Rafael para tentar melhorar o recorde.";
    if(saved.completed)return "Conquista garantida! Converse com Rafael para repetir o circuito.";
    return "Converse com o treinador Rafael para começar o Circuito dos Campeões.";
  }
  function resetRun(){
    raceTime=0;heldMedals=new Set();phase="idle";player.moving=false;
  }
  function enter(){
    active=true;elapsedAnim=0;
    player.x=14;player.y=16.85;player.walk=0;player.moving=false;player.facing="up";
    resetRun();
  }
  function leave(){
    active=false;
    // Uma tentativa abandonada não conta como vitória nem altera recordes.
    resetRun();
  }
  function start(){
    if(!active)return false;
    player.x=14;player.y=16.85;player.facing="up";player.walk=0;
    player.moving=false;
    raceTime=0;heldMedals=new Set();phase="running";
    return true;
  }
  function restartProgress(){
    resetRun();saved.completed=false;saved.bestTime=null;persist();
  }
  function talkCoach(){
    if(phase==="running")return {startOnClose:false,lines:[
      "Você já está no circuito! Pegue as cinco medalhas e alcance a linha de chegada.",
      "O cronômetro continua enquanto você caminha. Se precisar, fale comigo depois da tentativa."
    ]};
    if(phase==="finished"||saved.completed)return {startOnClose:true,lines:[
      "Parabéns pelo Circuito dos Campeões! A conquista Atleta da FAAMA já é sua.",
      "Quer melhorar seu recorde? Quando terminar nossa conversa, começará uma nova tentativa.",
      "Colete as cinco medalhas e atravesse a linha de chegada!"
    ]};
    if(phase==="failed")return {startOnClose:true,lines:[
      "O tempo acabou, mas você pode tentar de novo!",
      "Quando esta conversa terminar, vou reiniciar o cronômetro. Boa sorte!"
    ]};
    return {startOnClose:true,lines:[
      "Bem-vindo ao Complexo Esportivo! Sou Rafael, seu treinador.",
      "O desafio é recolher CINCO medalhas espalhadas pela quadra, desviando dos cones.",
      "Você tem 90 segundos. Depois de pegar todas as medalhas, cruze a faixa dourada da chegada!",
      "Ao terminar a conversa, o cronômetro começa. Preparado?"
    ]};
  }
  function solid(x,y){
    const radius=.29;
    if(x<2.4+radius||x>25.6-radius||y<2.2+radius||y>18.95-radius)return true;
    if(bleachers.some(b=>x>b.x-radius&&x<b.x+b.w+radius&&
      y>b.y-radius&&y<b.y+b.h+radius))return true;
    if(cones.some(c=>Math.hypot(x-c.x,y-c.y)<radius+.39))return true;
    if(Math.hypot(x-coach.x,y-coach.y)<radius+.39)return true;
    return false;
  }
  function nearest(){
    const dc=dist(player,coach),de=dist(player,exit);
    if(de<1.0)return {kind:"exit",name:"Voltar ao campus"};
    if(dc<1.85)return {kind:"coach",name:"Treinador Rafael"};
    if(dist(player,finish)<1.4)return {kind:"finish",name:"Linha de chegada"};
    return null;
  }
  function update(dt,held){
    if(!active)return null;
    const realDt=Math.max(0,Math.min(.05,Number(dt)||0));
    elapsedAnim+=realDt;
    const dx0=Number(held.has("ArrowRight")||held.has("d"))-
      Number(held.has("ArrowLeft")||held.has("a"));
    const dy0=Number(held.has("ArrowDown")||held.has("s"))-
      Number(held.has("ArrowUp")||held.has("w"));
    const length=Math.hypot(dx0,dy0)||1;
    const dx=dx0/length*5.35*realDt,dy=dy0/length*5.35*realDt;
    const old={x:player.x,y:player.y};
    if(!solid(player.x+dx,player.y))player.x+=dx;
    if(!solid(player.x,player.y+dy))player.y+=dy;
    player.moving=dist(old,player)>.0001;
    if(player.moving){
      player.walk+=realDt*12;
      player.facing=Math.abs(dx0)>Math.abs(dy0)?
        dx0>0?"right":"left":dy0>0?"down":"up";
    }
    if(phase!=="running")return null;
    raceTime=Math.min(TIME_LIMIT,raceTime+realDt);
    if(raceTime>=TIME_LIMIT){
      phase="failed";
      return {kind:"timeout",message:"Tempo esgotado! Converse com Rafael para tentar novamente."};
    }
    let newMedals=0;
    for(const medal of medals){
      if(!heldMedals.has(medal.id)&&dist(player,medal)<.74){
        heldMedals.add(medal.id);newMedals++;
      }
    }
    if(heldMedals.size===medals.length&&dist(player,finish)<1.14){
      phase="finished";
      const seconds=Math.max(.1,Math.round(raceTime*10)/10);
      const wasCompleted=saved.completed;
      const newBest=saved.bestTime===null||seconds<saved.bestTime;
      saved.completed=true;
      if(newBest)saved.bestTime=seconds;
      persist();
      return {kind:"finished",first:!wasCompleted,newBest,time:seconds,
        message:(!wasCompleted?"Missão 04 concluída! +200 XP • Atleta da FAAMA! ":"Circuito finalizado! ")+
          "Tempo: "+fmt(seconds)+(newBest?" • Novo recorde!":"")};
    }
    if(newMedals)return {kind:"medal",message:"Medalha coletada! "+heldMedals.size+"/5"};
    return null;
  }
  function pause(){player.moving=false;}
  function line(a,b,color,width=2){
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.stroke();
  }
  function fill(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  function ellipse(x,y,rx,ry,c){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
  }
  function round(x,y,w,h,r,c,border){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=c;ctx.fill();
    if(border){ctx.strokeStyle=border;ctx.lineWidth=2;ctx.stroke();}
  }
  function text(t,x,y,size=12,c="#f8f1d8",bold=false){
    ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=c;ctx.fillText(t,x,y);
  }
  function cone(c){
    const p=pt(c.x,c.y);
    ellipse(p.x+1,p.y+4,17,7,"#102c335b");
    round(p.x-10,p.y-6,20,13,3,"#c65b2e","#f8dcb2");
    ctx.beginPath();ctx.moveTo(p.x-9,p.y-6);ctx.lineTo(p.x,p.y-30);
    ctx.lineTo(p.x+9,p.y-6);ctx.closePath();ctx.fillStyle="#f18738";ctx.fill();
    line({x:p.x-5,y:p.y-17},{x:p.x+5,y:p.y-17},"#fff7df",3);
    line({x:p.x-7,y:p.y-11},{x:p.x+7,y:p.y-11},"#fff7df",3);
  }
  function drawMedal(m){
    const p=pt(m.x,m.y),wave=Math.sin(elapsedAnim*4+m.x)*3;
    ellipse(p.x,p.y+5,11,5,"#1c42475e");
    ctx.save();ctx.translate(p.x,p.y-19+wave);
    ctx.beginPath();ctx.moveTo(-7,-12);ctx.lineTo(-1,2);ctx.lineTo(4,2);
    ctx.lineTo(10,-12);ctx.fillStyle="#d45c5c";ctx.fill();
    ellipse(0,0,13,13,"#ffd970");
    ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.lineWidth=3;
    ctx.strokeStyle="#bb863a";ctx.stroke();
    text("★",0,5,16,"#9d6a2f",true);
    ctx.restore();
  }
  function athlete(o,isPlayer){
    const p=pt(o.x,o.y),walk=isPlayer&&o.moving?Math.sin(o.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#1e364e6b");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(walk)*2:0));
    ctx.scale(isPlayer&&o.facing==="left"?-1:1,1);
    line({x:-5,y:-14},{x:-5+walk*4,y:-2},"#344b69",7);
    line({x:5,y:-14},{x:5-walk*4,y:-2},"#344b69",7);
    line({x:-8,y:-2},{x:-1,y:-2},"#f8f4e8",4);
    line({x:4,y:-2},{x:10,y:-2},"#f8f4e8",4);
    round(-12,-38,24,27,6,isPlayer?"#63a5c7":"#f1af3e","#344f61");
    line({x:-14,y:-31},{x:-15-walk*3,y:-17},"#b98460",6);
    line({x:14,y:-31},{x:15+walk*3,y:-17},"#b98460",6);
    ellipse(0,-52,12,14,isPlayer?"#dfa782":o.skin);
    ellipse(-4,-63,11,6,isPlayer?"#463331":o.hair);
    ellipse(5,-64,9,6,isPlayer?"#463331":o.hair);
    ellipse(-4,-51,1.5,1.5,"#273a47");ellipse(4,-51,1.5,1.5,"#273a47");
    ctx.restore();
    if(!isPlayer){
      ellipse(p.x,p.y-84+Math.sin(elapsedAnim*3)*2,12,11,"#ffdf9b");
      text("E",p.x,p.y-80+Math.sin(elapsedAnim*3)*2,12,"#2b4351",true);
      text("Rafael",p.x,p.y-97,13,"#fff1d3",true);
    }
  }
  function drawScene(time,zoom=.8){
    if(!active)return;
    const factor=clamp(zoom/.8,.82,1.8);
    ctx.setTransform(1,0,0,1,0,0);
    const sky=ctx.createLinearGradient(0,0,0,canvasHeight);
    sky.addColorStop(0,"#234454");sky.addColorStop(1,"#162c3e");
    fill(0,0,canvasWidth,canvasHeight,sky);
    const focus=pt(player.x,player.y);
    const targetX=canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,factor-1)*.65;
    const targetY=canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,factor-1)*.65;
    camX+=(targetX-camX)*.13;camY+=(targetY-camY)*.13;
    ctx.save();ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(factor,factor);
    ctx.translate(-camX,-camY);
    const base=pt(2.1,2.0);
    round(base.x-13,base.y-18,24*TILE+27,17.2*TILE+29,13,"#536372","#e3cb8f");
    const court=pt(2.4,2.2);
    fill(court.x,court.y,23.2*TILE,16.75*TILE,"#c99660");
    for(let y=0;y<17;y++)for(let x=0;x<24;x++){
      if((x+y)%2===0)fill(court.x+x*TILE,court.y+y*TILE,TILE,TILE,"#ffebc314");
    }
    for(let x=0;x<=24;x++)
      line({x:court.x+x*TILE,y:court.y},{x:court.x+x*TILE,y:court.y+16.75*TILE},"#b27c5155",.8);
    for(let y=0;y<=17;y++)
      line({x:court.x,y:court.y+y*TILE},{x:court.x+23.2*TILE,y:court.y+y*TILE},"#b27c5155",.8);
    const edge=pt(5.1,3.6),innerW=18*TILE,innerH=11.8*TILE;
    ctx.strokeStyle="#fff1d6";ctx.lineWidth=5;
    ctx.strokeRect(edge.x,edge.y,innerW,innerH);
    line(pt(14,3.6),pt(14,15.4),"#ffe4aa",3);
    ctx.beginPath();const middle=pt(14,9.5);
    ctx.ellipse(middle.x,middle.y,83,83,0,0,Math.PI*2);
    ctx.strokeStyle="#fff0d3";ctx.lineWidth=4;ctx.stroke();
    // Faixas esportivas e cones em posições fixas.
    const track=pt(6,12.25);
    round(track.x,track.y,16.3*TILE,3.15*TILE,12,"#426e8c48","#fff2d655");
    for(const b of bleachers){
      const p=pt(b.x,b.y),w=b.w*TILE,h=b.h*TILE;
      round(p.x,p.y,w,h,7,"#435a6a","#d6c19a");
      const rows=b.w>b.h?2:6;
      for(let n=0;n<rows;n++){
        const yy=p.y+8+n*(h-16)/rows;
        round(p.x+6,yy,w-12,Math.max(6,(h-20)/rows-5),3,
          n%2?"#8ca5b0":"#6d8795");
      }
    }
    // Placas e equipamentos.
    const title=pt(14,2.9);
    round(title.x-131,title.y-17,262,30,7,"#244c68","#f5d49d");
    text("CIRCUITO DOS CAMPEÕES",title.x,title.y+3,17,"#ffeed0",true);
    const p0=pt(5.45,4.4),p1=pt(22.6,4.4);
    [p0,p1].forEach((p,i)=>{
      round(p.x-20,p.y-22,40,37,4,"#f0d4b0","#8b5d43");
      round(p.x-11,p.y-14,22,20,3,"#e9f2ec","#4d747e");
      ellipse(p.x,p.y-3,7,7,"#ba6944");
    });
    // Chegada visível à direita da recepção.
    const f=pt(finish.x,finish.y);
    round(f.x-28,f.y-18,80,45,5,"#d1a14877","#fff4c9");
    for(let i=0;i<8;i++)for(let j=0;j<3;j++){
      fill(f.x-25+i*10,f.y-14+j*13,10,13,(i+j)%2===0?"#f9e7ca":"#304e5d");
    }
    text("CHEGADA",f.x+12,f.y-27,13,"#fff8cf",true);
    for(const c of cones)cone(c);
    if(phase==="running"){
      medals.filter(m=>!heldMedals.has(m.id)).forEach(drawMedal);
    }else if(phase==="idle"||phase==="failed"){
      medals.forEach(m=>{
        const p=pt(m.x,m.y);ellipse(p.x,p.y-19,12,8,"#ffe0a755");
      });
    }
    athlete(coach,false);athlete(player,true);
    // Saída, perto da recepção.
    const door=pt(exit.x,18.9);
    round(door.x-51,door.y-4,102,13,4,"#2c798d","#ffe6b0");
    text("SAÍDA [E]",door.x,door.y+26,12,"#f0e3c0",true);
    if(phase==="running"){
      const p=pt(14,2.5);
      round(p.x-63,p.y+22,126,22,5,"#21465d","#ffdc8c");
      text(heldMedals.size+"/5 MEDALHAS",p.x,p.y+38,12,"#fff7ce",true);
    }
    ctx.restore();
  }
  return {enter,leave,start,talkCoach,update,pause,nearest,draw:drawScene,
    progress,objective,restartProgress,solid,medals,cones,bleachers,coach,exit,finish,
    get active(){return active;},get phase(){return phase;},get player(){return player;}};
};
