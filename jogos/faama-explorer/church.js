/* FAAMA Explorer 3.3 — A Luz que Permanece
   Último capítulo: Igreja da FAAMA.
   O acesso e a recompensa dependem sempre das nove missões anteriores.
   Cenário top-down fictício, sem representar a planta oficial da igreja.
*/
"use strict";
window.createFaamaChurch=function createFaamaChurch({ctx,storage,canvasWidth=1200,canvasHeight=760,isUnlocked}){
  const KEY="faama-explorer-quest-10-v1",W=28,H=20,T=30;
  const ox=(canvasWidth-W*T)/2,oy=(canvasHeight-H*T)/2;
  const point=(x,y)=>({x:ox+x*T,y:oy+y*T});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // As nove lembranças são acessíveis apenas depois da conclusão das missões.
  const memories=[
    {id:"key",place:"A Chave Desaparecida",icon:"🔑",
      question:"Você ajudou Lia a encontrar uma chave. Qual valor essa atitude representa?",
      choices:["Indiferença","Solidariedade","Competição"],correct:1,
      reflection:"Ajudar alguém também é parte de uma grande conquista."},
    {id:"central",place:"Mistério do Prédio Central",icon:"🗂️",
      question:"Para desvendar as pistas do Prédio Central, o que foi essencial?",
      choices:["Atenção e raciocínio","Pressa sem observar","Desistência"],correct:0,
      reflection:"Observar com atenção permite compreender o que antes parecia escondido."},
    {id:"academic",place:"Desafio do Conhecimento",icon:"📚",
      question:"As atividades do Prédio Acadêmico lembram que crescer envolve...",
      choices:["Evitar novas ideias","Saber tudo sozinho","Buscar conhecimento"],correct:2,
      reflection:"Aprender abre caminhos e ajuda a fazer escolhas melhores."},
    {id:"sports",place:"Circuito dos Campeões",icon:"🏅",
      question:"Ao superar cones e obstáculos no ginásio, você demonstrou...",
      choices:["Perseverança","Desinteresse","Impaciência"],correct:0,
      reflection:"Os desafios podem ser enfrentados um passo de cada vez."},
    {id:"restaurant",place:"O Restaurante Misterioso",icon:"🍽️",
      question:"Preparar refeições para os estudantes foi uma forma de...",
      choices:["Pensar só em si","Servir e cuidar","Ignorar as necessidades"],correct:1,
      reflection:"O cuidado se revela nas pequenas atitudes de serviço."},
    {id:"school",place:"O Tesouro da FAAMinha",icon:"🗺️",
      question:"Os cinco enigmas da FAAMinha incentivaram a...",
      choices:["Desistir de investigar","Evitar perguntas","Curiosidade e descoberta"],correct:2,
      reflection:"A curiosidade pode transformar pistas simples em grandes descobertas."},
    {id:"pool",place:"Desafio Aquático",icon:"🏊",
      question:"O circuito na Piscina mostrou a importância de...",
      choices:["Superar desafios","Fugir das dificuldades","Desvalorizar o esforço"],correct:0,
      reflection:"Superação é descobrir que o esforço de hoje prepara o amanhã."},
    {id:"female",place:"A Rotina Equilibrada",icon:"📒",
      question:"A missão do Residencial Feminino destacou a importância de...",
      choices:["Viver sem descanso","Equilibrar estudos e autocuidado","Ignorar limites"],correct:1,
      reflection:"Cuidar de si permite continuar cuidando do que importa."},
    {id:"male",place:"Projeto em Equipe",icon:"🤝",
      question:"No Residencial Masculino, o projeto avançou por meio da...",
      choices:["Falta de diálogo","Ação individual sem escuta","Cooperação"],correct:2,
      reflection:"Construir com os outros dá força ao que fazemos juntos."}
  ];
  const virtues=[
    {id:"faith",title:"Fé",icon:"✦",x:4.3,y:8.25,color:"#f6dca1",
      prompt:"Um amigo enfrenta um momento difícil e teme não conseguir seguir em frente. Como agir com fé?",
      choices:["Desprezar o que ele sente",
        "Ouvir com respeito, oferecer apoio e confiar que há caminhos possíveis",
        "Dizer que ele não pode ter dúvidas"],correct:1,
      reflection:"A fé não precisa apagar as dúvidas. Ela pode caminhar com a escuta, a coragem e a confiança."},
    {id:"hope",title:"Esperança",icon:"☀️",x:23.7,y:8.25,color:"#bde3e0",
      prompt:"Uma pessoa se esforçou, mas seu plano não deu certo. O que pode expressar esperança?",
      choices:["Reconhecer a dificuldade e buscar novos passos possíveis",
        "Prometer que tudo será sempre fácil",
        "Parar de tentar para sempre"],correct:0,
      reflection:"Esperança não é negar a dificuldade: é encontrar motivos e possibilidades para continuar."},
    {id:"love",title:"Amor",icon:"♥",x:23.7,y:14.2,color:"#f8c1bb",
      prompt:"Ao perceber um colega isolado, qual escolha manifesta amor ao próximo?",
      choices:["Ignorar, porque não é sua responsabilidade",
        "Espalhar comentários sobre ele",
        "Aproximar-se com gentileza, respeitar seu espaço e oferecer companhia"],correct:2,
      reflection:"O amor cresce em gestos concretos de respeito, presença e cuidado."}
  ];
  const samuel={id:"samuel-chapel",name:"Capelão Samuel",role:"Capelania da Igreja da FAAMA",
    x:11.5,y:16.35,shirt:"#557f90",skin:"#b98564",hair:"#423d39"};
  const book={id:"journey-book",name:"Livro da Jornada",x:14.2,y:10.4};
  const exit={x:14,y:18.52};
  const player={x:14,y:17.2,walk:0,moving:false,facing:"up"};
  const pews=[];
  for(let i=0;i<4;i++){
    pews.push({x:5.5,y:7.2+i*2.4,w:5.2,h:.85});
    pews.push({x:17.25,y:7.2+i*2.4,w:5.2,h:.85});
  }
  const furniture=[
    ...pews.map(p=>({...p,kind:"pew"})),
    {x:12.5,y:4.6,w:3.0,h:1.15,kind:"pulpit"},
    {x:3.6,y:3.7,w:2.45,h:1.25,kind:"piano"},
    {x:21.9,y:3.7,w:2.35,h:1.1,kind:"organ"},
    {x:12.8,y:9.75,w:2.5,h:.75,kind:"book"},
    {x:3.45,y:16.5,w:.8,h:.8,kind:"plant"},
    {x:23.65,y:16.7,w:.8,h:.8,kind:"plant"}
  ];
  function allowed(){try{return isUnlocked?.()===true;}catch(_err){return false;}}
  function defaults(){return {started:false,book:0,virtues:0,completed:false};}
  function load(){
    try{
      const obj=JSON.parse(storage?.getItem(KEY)||"null");
      if(obj?.version!==1)return defaults();
      const b=Number.isInteger(obj.book)?clamp(obj.book,0,9):0;
      const v=b===9&&Number.isInteger(obj.virtues)?clamp(obj.virtues,0,3):0;
      const completed=b===9&&v===3&&obj.completed===true;
      return {started:obj.started===true||b>0,book:b,virtues:v,completed};
    }catch(_err){return defaults();}
  }
  const saved=load();
  function persist(){try{storage?.setItem(KEY,JSON.stringify({version:1,...saved}));}catch(_err){}}
  let active=false,anim=0,cameraX=canvasWidth/2,cameraY=canvasHeight/2,glow=0;
  function stage(){
    if(!allowed())return "locked";
    if(saved.completed)return "completed";
    if(!saved.started)return "ready";
    if(saved.book<9)return "book";
    if(saved.virtues<3)return "virtues";
    return "return";
  }
  function objective(){
    const s=stage();
    if(s==="locked")return "Igreja bloqueada: conclua as nove missões anteriores.";
    if(s==="ready")return "Converse com o capelão Samuel no corredor da Igreja.";
    if(s==="book")return "Abra o Livro da Jornada e relembre as nove missões ("+saved.book+"/9).";
    if(s==="virtues")return "Encontre o painel de "+virtues[saved.virtues].title+" ("+saved.virtues+"/3 desafios).";
    if(s==="return")return "Volte ao capelão Samuel para concluir a sua jornada.";
    return "Você zerou o jogo! Explore o campus ou reveja o encerramento.";
  }
  function progress(){
    const s=stage();
    return {stage:s,active,started:saved.started,book:saved.book,bookTotal:memories.length,
      virtues:saved.virtues,virtueTotal:virtues.length,
      completed:s==="completed",xp:s==="completed"?200:0,
      achievement:s==="completed"?"Lenda da FAAMA":null,objective:objective(),
      glow,memories:memories.map((m,i)=>({id:m.id,place:m.place,done:i<saved.book})),
      panels:virtues.map((v,i)=>({id:v.id,title:v.title,done:i<saved.virtues,
        active:s==="virtues"&&i===saved.virtues}))};
  }
  function enter(){
    if(!allowed())return false;
    active=true;anim=0;glow=0;player.x=14;player.y=17.2;player.moving=false;player.facing="up";return true;
  }
  function leave(){active=false;player.moving=false;glow=0;}
  function pause(){player.moving=false;}
  function restart(){Object.assign(saved,defaults());persist();glow=0;}
  function talk(){
    const s=stage();
    if(s==="locked")return {changed:false,lines:["A Igreja será a última aventura. Termine antes as nove missões do campus."]};
    if(s==="ready"){
      saved.started=true;persist();
      return {changed:true,message:"Última missão iniciada! Procure o Livro da Jornada no corredor central.",
        lines:[
          "Bem-vindo à Igreja da FAAMA! Sou Samuel, da capelania. Você chegou ao último capítulo da sua jornada.",
          "Em cada lugar do campus você ajudou, aprendeu, perseverou e encontrou pessoas especiais.",
          "Há um Livro da Jornada no corredor. Ele guarda nove lembranças das suas aventuras.",
          "Complete o livro e depois encontre os painéis de Fé, Esperança e Amor.",
          "Esses valores são lembrados em 1 Coríntios 13:13. No fim, volte aqui para celebrarmos a caminhada."
        ]};
    }
    if(s==="book")return {changed:false,lines:[
      "O Livro da Jornada registra nove lembranças do campus.",
      "Você já recuperou "+saved.book+" de nove. Leia a próxima página perto do corredor central."]};
    if(s==="virtues")return {changed:false,lines:[
      "Todas as lembranças do Livro já estão reunidas.",
      "O painel de "+virtues[saved.virtues].title+" espera por você. São três reflexões finais: fé, esperança e amor."]};
    if(s==="return"){
      // Verificar novamente a liberação antes da vitória; não confiar numa flag antiga.
      if(!allowed())return {changed:false,lines:["Conclua todas as missões anteriores para continuar."]};
      saved.completed=true;persist();glow=1;
      return {changed:true,rewarded:true,celebrate:true,
        message:"Jornada concluída! +200 XP • Lenda da FAAMA!",
        lines:[
          "Você completou o Livro da Jornada e descobriu a luz que permanece!",
          "O caminho trouxe conhecimento, serviço, equilíbrio, coragem e cooperação.",
          "E agora, fé, esperança e amor lembram que a aventura continua em cada escolha cotidiana.",
          "Parabéns, explorador! Você recebeu 200 XP e o título Lenda da FAAMA.",
          "A história chegou ao fim, mas a luz que você leva consigo permanece."
        ]};
    }
    return {changed:false,lines:[
      "Sua história está escrita no Livro da Jornada. Parabéns por chegar até aqui!",
      "Volte ao campus quando desejar. Você também pode rever a celebração no diário da missão."]};
  }
  function inspect(id){
    const s=stage();
    if(s==="locked")return {message:"Conclua primeiro as nove missões anteriores."};
    if(id==="book"){
      if(s==="book")return {challenge:{type:"book",...memories[saved.book],index:saved.book,total:9}};
      return {message:s==="ready"?"Converse primeiro com Samuel.":
        "O Livro da Jornada já tem todas as nove lembranças."};
    }
    const ix=virtues.findIndex(v=>v.id===id);
    if(ix<0)return null;
    if(s==="virtues"&&ix===saved.virtues)
      return {challenge:{type:"virtue",...virtues[ix],question:virtues[ix].prompt,index:ix,total:3}};
    return {message:s==="book"?"Complete o Livro da Jornada antes de visitar os painéis.":
      s==="ready"?"Converse primeiro com Samuel.":
      "Este painel só estará ativo na etapa correta."};
  }
  function answer(type,id,index){
    const s=stage();
    if(type==="book"){
      if(s!=="book"||memories[saved.book]?.id!==id)return {ignored:true};
      const m=memories[saved.book];
      if(index!==m.correct)return {correct:false,message:"Essa lembrança pede outra resposta. Releia a situação e tente novamente."};
      saved.book++;persist();
      return {correct:true,changed:true,finishedSet:saved.book===9,
        next:saved.book<9?{type:"book",...memories[saved.book],index:saved.book,total:9}:null,
        message:m.reflection+(saved.book===9?" Livro completo! Agora encontre o painel da Fé.":"")};
    }
    if(type==="virtue"){
      if(s!=="virtues"||virtues[saved.virtues]?.id!==id)return {ignored:true};
      const v=virtues[saved.virtues];
      if(index!==v.correct)return {correct:false,message:"Pense na escolha que demonstra respeito e cuidado. Tente novamente."};
      saved.virtues++;persist();
      return {correct:true,changed:true,finishedSet:true,next:null,
        message:v.reflection+(saved.virtues===3?" Volte ao capelão Samuel para encerrar a jornada.":"")};
    }
    return {ignored:true};
  }
  function solid(x,y){
    const r=.28;
    if(x<2.4+r||x>25.6-r||y<2.25+r||y>18.95-r)return true;
    if(furniture.some(f=>x>f.x-r&&x<f.x+f.w+r&&y>f.y-r&&y<f.y+f.h+r))return true;
    if(dist({x,y},samuel)<r+.36)return true;
    return false;
  }
  function nearest(){
    if(dist(player,exit)<1.03)return {kind:"exit",id:"exit",name:"Voltar ao campus"};
    if(dist(player,samuel)<1.8)return {kind:"npc",id:samuel.id,name:"Capelão Samuel"};
    if(stage()==="book"&&dist(player,book)<1.85)
      return {kind:"book",id:book.id,name:"Livro da Jornada"};
    if(stage()==="virtues"){
      const v=virtues[saved.virtues];
      if(v&&dist(player,v)<1.8)return {kind:"virtue",id:v.id,name:"Painel da "+v.title};
    }
    return null;
  }
  function update(dt,keys){
    if(!active)return;
    const step=clamp(Number(dt)||0,0,.05);anim+=step;
    if(glow>0)glow=Math.min(1,glow+step*.1);
    const dx0=Number(keys.has("ArrowRight")||keys.has("d"))-Number(keys.has("ArrowLeft")||keys.has("a"));
    const dy0=Number(keys.has("ArrowDown")||keys.has("s"))-Number(keys.has("ArrowUp")||keys.has("w"));
    const m=Math.hypot(dx0,dy0)||1,dx=dx0/m*4.65*step,dy=dy0/m*4.65*step;
    const old={x:player.x,y:player.y};
    if(!solid(player.x+dx,player.y))player.x+=dx;
    if(!solid(player.x,player.y+dy))player.y+=dy;
    player.moving=dist(old,player)>.0001;
    if(player.moving){
      player.walk+=step*11;player.facing=Math.abs(dx0)>Math.abs(dy0)?dx0>0?"right":"left":dy0>0?"down":"up";
    }
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function line(x,y,xx,yy,color,w=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.lineWidth=w;ctx.lineCap="round";ctx.strokeStyle=color;ctx.stroke();}
  function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function round(x,y,w,h,r,color,stroke){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
    if(stroke){ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function label(s,x,y,size=12,color="#fff3dc",bold=false){
    ctx.font=(bold?"bold ":"")+size+"px Arial,sans-serif";
    ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(s,x,y);
  }
  function drawFurniture(f){
    const p=point(f.x,f.y),w=f.w*T,h=f.h*T;
    ellipse(p.x+w/2+3,p.y+h+6,Math.max(12,w/2),5,"#1d334065");
    if(f.kind==="plant"){
      round(p.x+5,p.y+13,w-10,h-13,3,"#a87653");ellipse(p.x+w/2,p.y+7,12,10,"#377d68");
      ellipse(p.x+w/2-7,p.y,9,8,"#78bb7d");ellipse(p.x+w/2+8,p.y,9,8,"#92ca85");return;
    }
    if(f.kind==="piano"||f.kind==="organ"){
      round(p.x,p.y-8,w,h+8,5,f.kind==="piano"?"#253544":"#7a604c","#e5c68b");
      for(let k=0;k<11;k++)rect(p.x+8+k*(w-16)/11,p.y+h*.4,Math.max(1,(w-16)/11-1),h*.22,k%2?"#f5f0e4":"#fff9f0");
      for(let k=0;k<7;k++)rect(p.x+10+k*(w-18)/7,p.y+h*.4,Math.max(1,(w-18)/7-5),h*.1,"#263543");
      return;
    }
    if(f.kind==="pulpit"){
      round(p.x-12,p.y-18,w+24,h+24,8,"#926c48","#d3b183");
      round(p.x+9,p.y-15,w-18,15,4,"#bb925f","#f0d7a5");
      label("✝",p.x+w/2,p.y+h*.76,21,"#f6dda8",true);return;
    }
    if(f.kind==="book"){
      round(p.x,p.y,w,h,5,"#986f51","#f0d49c");
      const b=point(book.x,book.y);
      ellipse(b.x,b.y-12,18,10,"#ffe6a7");
      label("📖",b.x,b.y-6,22,"#3c5771",true);return;
    }
    round(p.x,p.y,w,h,5,"#9b724e","#e0bf8c");
    round(p.x+3,p.y+5,w-6,h*.48,3,"#c8a076");
    line(p.x+5,p.y+7,p.x+w-5,p.y+7,"#edcf9c",3);
    rect(p.x+6,p.y+h-5,w-12,3,"#674b3b");
  }
  function character(person,isPlayer){
    const p=point(person.x,person.y),walk=isPlayer&&person.moving?Math.sin(person.walk):0;
    ellipse(p.x+2,p.y+4,12,5,"#152a3e72");
    ctx.save();ctx.translate(p.x,p.y-(isPlayer?Math.abs(walk)*2:0));
    ctx.scale(isPlayer&&person.facing==="left"?-1:1,1);
    line(-5,-14,-5+walk*4,-1,"#304966",7);line(5,-14,5-walk*4,-1,"#304966",7);
    line(-8,-2,-1,-2,"#f4e7d6",4);line(4,-2,10,-2,"#f4e7d6",4);
    round(-12,-38,24,27,6,isPlayer?"#64a8c9":person.shirt,"#3a506b");
    line(-14,-31,-15-walk*4,-17,"#c18d6a",6);line(14,-31,15+walk*4,-17,"#c18d6a",6);
    ellipse(0,-51,12,14,isPlayer?"#dba782":person.skin);
    ellipse(-5,-62,11,7,isPlayer?"#41363c":person.hair);
    ellipse(5,-63,9,6,isPlayer?"#41363c":person.hair);
    ellipse(-4,-51,1.4,1.4,"#24364a");ellipse(4,-51,1.4,1.4,"#24364a");
    ctx.restore();
    if(!isPlayer){
      label("Capelão Samuel",p.x,p.y-96,12,"#fff2d5",true);
      ellipse(p.x,p.y-82+Math.sin(anim*3)*2,12,10,"#ffe4a8");
      label("E",p.x,p.y-77+Math.sin(anim*3)*2,12,"#3e566a",true);
    }
  }
  function draw(_time,zoom=.8){
    if(!active)return;
    const scale=clamp(zoom/.8,.82,1.8),focus=point(player.x,player.y);
    cameraX+=(canvasWidth/2+(focus.x-canvasWidth/2)*Math.max(0,scale-1)*.65-cameraX)*.13;
    cameraY+=(canvasHeight/2+(focus.y-canvasHeight/2)*Math.max(0,scale-1)*.65-cameraY)*.13;
    ctx.setTransform(1,0,0,1,0,0);
    const backdrop=ctx.createLinearGradient(0,0,0,canvasHeight);
    backdrop.addColorStop(0,"#233c50");backdrop.addColorStop(1,"#152c3e");
    rect(0,0,canvasWidth,canvasHeight,backdrop);
    ctx.save();
    ctx.translate(canvasWidth/2,canvasHeight/2);ctx.scale(scale,scale);
    ctx.translate(-cameraX,-cameraY);
    const base=point(2.2,2.15);
    round(base.x-8,base.y-13,23.7*T+16,17.4*T+27,13,"#6a776c","#f1d6a9");
    const floor=point(2.4,2.35);
    rect(floor.x,floor.y,23.2*T,16.5*T,"#ddc7a4");
    for(let x=0;x<24;x++)for(let y=0;y<17;y++){
      const p=point(2.4+x,2.35+y);
      if((x+y)%2===0)rect(p.x,p.y,T,T,"#fff8dc20");
      line(p.x,p.y,p.x+T,p.y,"#92795d28",.75);
      line(p.x,p.y,p.x,p.y+T,"#92795d28",.75);
    }
    const center=point(14,10.8);
    round(center.x-59,floor.y,118,16.5*T,2,"#ba936fa6");
    round(center.x-46,floor.y,92,16.5*T,3,"#d1aa80a0");
    // Vitrais iluminando o piso: efeitos suaves e animados.
    for(let i=0;i<5;i++){
      const p=point(4.2+i*4.7,2.65);
      const hue=["#e8b97a","#8ebdc4","#e9ad97","#9ecca0","#e5c798"][i];
      round(p.x-19,p.y-13,38,48,17,"#4f6474","#d9bf98");
      round(p.x-13,p.y-8,26,36,12,hue);
      line(p.x,p.y-7,p.x,p.y+27,"#f5efd1",2);
      line(p.x-12,p.y+10,p.x+12,p.y+10,"#f5efd1",2);
      const beam=ctx.createLinearGradient(p.x,p.y+34,p.x+70,p.y+260);
      beam.addColorStop(0,"#ffe7b84e");beam.addColorStop(1,"#ffe5b100");
      ctx.beginPath();ctx.moveTo(p.x-13,p.y+35);ctx.lineTo(p.x+12,p.y+35);
      ctx.lineTo(p.x+126,p.y+260);ctx.lineTo(p.x+44,p.y+260);
      ctx.closePath();ctx.fillStyle=beam;ctx.fill();
    }
    // Púlpito e instrumentos musicais.
    furniture.forEach(drawFurniture);
    // Quatro flores de destaque na área da frente.
    for(const [x,y] of [[8.4,5.1],[19.5,5.1],[9.2,6.2],[18.8,6.2]]){
      const p=point(x,y);ellipse(p.x,p.y,11,7,"#4e946c");
      ellipse(p.x-4,p.y-4,5,5,"#efc19c");ellipse(p.x+4,p.y-4,5,5,"#fff0c7");
    }
    const title=point(14,3.2);
    round(title.x-157,title.y-16,314,30,8,"#745b4d","#e8ce99");
    label("IGREJA DA FAAMA • A LUZ QUE PERMANECE",title.x,title.y+5,14,"#fff6dc",true);
    for(let i=0;i<virtues.length;i++){
      const v=virtues[i],p=point(v.x,v.y);
      const unlocked=saved.book===9&&allowed(),done=i<saved.virtues;
      const current=stage()==="virtues"&&i===saved.virtues;
      round(p.x-21,p.y-27,42,49,8,done?"#6ba18b":current?"#cfb071":"#6c7670",
        done?"#e8f0b9":"#e2c78c");
      label(v.icon,p.x,p.y+2,23,"#fff8df",true);
      if(unlocked&&(current||done)){
        ellipse(p.x,p.y-43+Math.sin(anim*3)*2,15,11,current?"#ffe6a5":"#c1eac8");
        label(done?"✓":"E",p.x,p.y-38+Math.sin(anim*3)*2,13,"#2d5361",true);
      }
      label(v.title.toUpperCase(),p.x,p.y+36,11,"#fff3d4",true);
    }
    if(stage()==="book"){
      const p=point(book.x,book.y);
      ellipse(p.x,p.y-48+Math.sin(anim*4)*3,15,11,"#ffdf9e");
      label("E",p.x,p.y-43+Math.sin(anim*4)*3,13,"#31526c",true);
    }
    character(samuel,false);character(player,true);
    const d=point(14,18.95);
    round(d.x-57,d.y-5,114,13,4,"#447c88","#f3e0ad");
    label("SAÍDA [E]",d.x,d.y+24,12,"#fff3d4",true);
    // Luz dourada da última missão e partículas sobre o interior.
    if(saved.completed&&allowed()){
      const glowAmt=.11+.045*Math.sin(anim*1.6);
      rect(base.x,base.y,23.3*T,17*T,"rgba(255,224,144,"+glowAmt.toFixed(3)+")");
      for(let i=0;i<28;i++){
        const px=4+(i*37%200)/10,py=3.3+((i*73+Math.sin(anim*1.6+i)*20)%140)/10;
        const p=point(px,py);
        ellipse(p.x,p.y,1.7+(i%3),1.7+(i%3),"#fff3c6ba");
      }
    }
    ctx.restore();
  }
  return {enter,leave,update,pause,draw,nearest,solid,talk,inspect,answer,restart,
    progress,stage,objective,memories,virtues,samuel,book,exit,
    get active(){return active;},get player(){return player;},get glow(){return glow;}};
};
