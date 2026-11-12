/* FAAMA Explorer 2.3 — Missão 01: A Chave Desaparecida.
   Progresso independente do mapa: armazenamento local com validação e fallback. */
"use strict";

window.createFaamaQuest = function createFaamaQuest({ ctx, P, storage }) {
  const STORAGE_KEY = "faama-explorer-quest-01-v1";
  const clueData = [
    {id:"bilhete",name:"Bilhete amassado",x:15.4,y:33.1,
      detail:"O bilhete diz: 'Passei pela praça perto do Prédio Central...'."},
    {id:"pegadas",name:"Pegadas na calçada",x:23.0,y:34.0,
      detail:"As pegadas seguem até o caminho que leva à entrada do Prédio Central."},
    {id:"caderno",name:"Caderno esquecido",x:18.5,y:29.6,
      detail:"Uma anotação no caderno: 'Deixei a chave perto da porta central!'."}
  ];
  const keyItem={id:"chave",name:"Chave dourada",x:20.7,y:31.0};
  const defaultState=()=>({started:false,found:[],hasKey:false,completed:false});
  const validIds=new Set(clueData.map(c=>c.id));

  function load() {
    try {
      const raw=storage?.getItem(STORAGE_KEY);
      if(!raw)return defaultState();
      const parsed=JSON.parse(raw);
      if(!parsed||parsed.version!==1||typeof parsed!=="object")return defaultState();
      const found=[...new Set(
        Array.isArray(parsed.found)?parsed.found.filter(id=>validIds.has(id)):[]
      )];
      const completed=parsed.completed===true;
      const hasKey=completed||(
        parsed.hasKey===true&&found.length===clueData.length
      );
      return {
        started:parsed.started===true||found.length>0||hasKey||completed,
        found:hasKey?[...validIds]:found,hasKey,completed
      };
    } catch(_error) {
      return defaultState();
    }
  }
  const state=load();
  function persist(){
    try {storage?.setItem(STORAGE_KEY,JSON.stringify({version:1,...state}));}
    catch(_error){/* Navegação privada pode bloquear armazenamento. */}
  }
  const xp=()=>state.completed?100:0;
  const achievement=()=>state.completed?"Guardião da Chave":null;

  function stage(){
    if(state.completed)return "completed";
    if(!state.started)return "ready";
    if(state.hasKey)return "return";
    if(state.found.length===clueData.length)return "key";
    return "clues";
  }

  function talkToLia() {
    const at=stage();
    if(at==="ready"){
      state.started=true;
      persist();
      return {changed:true,lines:[
        "Ainda bem que você chegou! Perdi uma chave importante perto do Prédio Central.",
        "Encontrei sinais de que passei pela praça, mas não lembro onde deixei a chave.",
        "Pode investigar três pistas, encontrar a chave dourada e trazê-la para mim?"
      ],message:"Missão iniciada! Procure 3 pistas na praça do Prédio Central."};
    }
    if(at==="return"){
      if(state.completed)return talkToLia();
      state.completed=true;
      persist();
      return {changed:true,rewarded:true,lines:[
        "Você encontrou minha chave! Muito obrigada por me ajudar.",
        "Você ganhou 100 XP e a conquista 'Guardião da Chave'!",
        "Primeira aventura concluída. Continue explorando o campus!"
      ],message:"Missão concluída! +100 XP • Conquista: Guardião da Chave!"};
    }
    if(at==="clues")return {changed:false,lines:[
      "Você já encontrou "+state.found.length+" de 3 pistas. Continue procurando pela praça.",
      "As pistas brilham perto das calçadas e dos jardins do Prédio Central."
    ]};
    if(at==="key")return {changed:false,lines:[
      "Ótimo! Você reuniu as três pistas.",
      "Agora procure uma chave dourada brilhando perto da entrada do Prédio Central!"
    ]};
    return {changed:false,lines:[
      "Obrigada de novo por encontrar minha chave!",
      "Sua conquista 'Guardião da Chave' está registrada. Aproveite a FAAMA!"
    ]};
  }

  function availableItems(){
    const at=stage();
    if(at==="clues")return clueData.filter(c=>!state.found.includes(c.id));
    if(at==="key")return [keyItem];
    return [];
  }

  function nearItem(x,y,radius=1.75){
    let best=null,distance=radius;
    for(const item of availableItems()){
      const d=Math.hypot(item.x-x,item.y-y);
      if(d<distance){best=item;distance=d;}
    }
    return best?{item:best,distance}:null;
  }

  function collect(itemId){
    const at=stage();
    if(at==="clues"){
      const clue=clueData.find(c=>c.id===itemId);
      if(!clue||state.found.includes(clue.id))return null;
      state.found.push(clue.id);
      persist();
      const all=state.found.length===clueData.length;
      return {
        changed:true,
        message:clue.detail+(all?" As três pistas foram encontradas!":""),
        item:clue.id
      };
    }
    if(at==="key"&&itemId===keyItem.id){
      state.hasKey=true;
      persist();
      return {changed:true,message:"Você encontrou a chave dourada! Volte até Lia para entregá-la.",item:"chave"};
    }
    return null;
  }

  function objective(){
    const at=stage();
    if(at==="ready")return "Converse com Lia, perto da entrada, para começar a Missão 01.";
    if(at==="clues")return "Investigue a praça: encontre "+(3-state.found.length)+" pista(s) restante(s).";
    if(at==="key")return "Encontre a chave dourada perto da entrada do Prédio Central.";
    if(at==="return")return "Chave na mochila! Encontre Lia e entregue a chave.";
    return "Missão concluída! Explore o campus e descubra novas aventuras.";
  }

  function progress(){
    return {stage:stage(),started:state.started,
      found:[...state.found],hasKey:state.hasKey,completed:state.completed,
      xp:xp(),achievement:achievement(),objective:objective(),
      totalClues:clueData.length,clues:clueData.map(c=>({
        id:c.id,name:c.name,done:state.found.includes(c.id)
      }))};
  }

  function draw(item,time,player){
    const p=P(item.x,item.y);
    const shine=Math.sin(time*3+(item.x+item.y)*.4);
    const key=item.id==="chave";
    const glow=key?"#ffdb64":"#87e8f0";
    ctx.save();
    // Marcador com pulso suave e sombra no chão.
    ctx.beginPath();
    ctx.ellipse(p.x,p.y+2,15+shine*2,5.8,0,0,Math.PI*2);
    ctx.fillStyle=key?"#e4aa4e5a":"#4fabb05a";ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y-14-shine*2,key?13:11,0,Math.PI*2);
    ctx.fillStyle=key?"#ffd46b4b":"#7de6f055";ctx.fill();
    ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=key?"#ffe38b":"#fff1c6";
    if(key){
      // Chave de metal com argola e dentes.
      ctx.beginPath();ctx.arc(p.x-6,p.y-17-shine*2,5,0,Math.PI*2);
      ctx.lineWidth=4;ctx.strokeStyle="#ffcf50";ctx.stroke();
      ctx.beginPath();ctx.moveTo(p.x-2,p.y-14-shine*2);
      ctx.lineTo(p.x+13,p.y-5-shine*2);
      ctx.lineTo(p.x+9,p.y-2-shine*2);
      ctx.moveTo(p.x+7,p.y-8-shine*2);
      ctx.lineTo(p.x+5,p.y-5-shine*2);
      ctx.strokeStyle="#ffd363";ctx.lineWidth=4;ctx.stroke();
    }else{
      ctx.fillStyle="#fcf0cc";
      ctx.beginPath();ctx.roundRect(p.x-9,p.y-25-shine*2,18,22,3);ctx.fill();
      ctx.strokeStyle="#d8aa68";ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle="#b99e75";ctx.lineWidth=1.3;
      for(let n=0;n<3;n++){
        ctx.beginPath();ctx.moveTo(p.x-5,p.y-19+n*5-shine*2);
        ctx.lineTo(p.x+5,p.y-19+n*5-shine*2);ctx.stroke();
      }
    }
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3+time*.8,rx=p.x+Math.cos(a)*18,ry=p.y-14+Math.sin(a)*10;
      ctx.fillStyle=glow;ctx.fillRect(rx,ry,2.5,2.5);
    }
    if(Math.hypot(player.x-item.x,player.y-item.y)<3){
      const label=key?"CHAVE":item.name.toUpperCase();
      ctx.font="bold 11px Arial";ctx.textAlign="center";
      const width=ctx.measureText(label).width+14;
      ctx.fillStyle="#163b4ce8";
      ctx.beginPath();ctx.roundRect(p.x-width/2,p.y-53,width,20,5);ctx.fill();
      ctx.fillStyle="#fff1c8";ctx.fillText(label,p.x,p.y-39);
    }
    ctx.restore();
  }
  function renderables(time,player){
    return availableItems().map(item=>({
      depth:item.y+item.x*.02,
      draw:()=>draw(item,time,player)
    }));
  }
  function drawMinimapMarkers(m,ox,oy,sx,sy){
    for(const item of availableItems()){
      const x=ox+item.x*sx,y=oy+item.y*sy;
      m.fillStyle=item.id==="chave"?"#ffda58":"#73f2ef";
      m.beginPath();m.arc(x,y,item.id==="chave"?4.3:3.4,0,Math.PI*2);m.fill();
      m.strokeStyle="#15313d";m.lineWidth=1;m.stroke();
    }
  }

  return {stage,progress,objective,talkToLia,availableItems,
    nearItem,collect,renderables,drawMinimapMarkers};
};
