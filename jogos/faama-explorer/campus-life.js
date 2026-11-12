/* FAAMA Explorer 2.2 — vida do campus.
   Personagens fictícios; nenhuma coordenada de prédio é alterada aqui. */
"use strict";

window.createCampusLife = function createCampusLife({ctx, P, sites, worldW, worldH,
  obstacleAt=()=>false}) {
  const students = [
    {
      id: "lia", name: "Lia", role: "Estudante de Psicologia",
      skin: "#b8764f", hair: "#292430", shirt: "#f0d75d",
      pants: "#334c75", backpack: "#b45869", hairStyle: "bun",
      route: [[20.8,41],[20.8,38],[20.8,36],[20.8,33],[20.8,30]],
      speed: 1.05, pause: .6,
      lines: [
        "Oi! Bem-vindo ao campus! Está procurando algum lugar?",
        "O Prédio Central fica seguindo este caminho. É um ótimo ponto para começar.",
        "Explore com calma: cada cantinho da FAAMA tem sua história!"
      ]
    },
    {
      id: "mateus", name: "Mateus", role: "Estudante de ADS",
      skin: "#b88459", hair: "#282c2e", shirt: "#3a82b1",
      pants: "#283e59", backpack: "#d1a35d", hairStyle: "short",
      route: [[11,35],[14,35],[17,35],[20,36],[20,39]],
      speed: 1.2, pause: 1.1,
      lines: [
        "E aí! Eu gosto de andar por aqui para espairecer entre as aulas.",
        "Você já viu o Prédio Acadêmico? Fica no lado direito do campus.",
        "Quem sabe a gente não cria um jogo sobre este lugar? Ah, espera..."
      ]
    },
    {
      id: "bia", name: "Bia", role: "Estudante de Enfermagem",
      skin: "#79533d", hair: "#222020", shirt: "#a3d5ce",
      pants: "#39496d", backpack: "#e1a056", hairStyle: "curly",
      route: [[24.5,37],[26,37],[28,35.7],[30,34.6]],
      speed: .96, pause: .9,
      lines: [
        "Olá! Você está conhecendo a FAAMA?",
        "O Prédio Acadêmico fica logo ali, à direita. Tem dois andares.",
        "Se precisar de uma pausa, aproveite a praça e os bancos pelo caminho."
      ]
    },
    {
      id: "daniel", name: "Daniel", role: "Estudante de Teologia",
      skin: "#d7a47b", hair: "#5a392c", shirt: "#bc715f",
      pants: "#334b4e", backpack: "#577b4b", hairStyle: "part",
      route: [[13,21],[17,21],[21,21],[25,21]],
      speed: .89, pause: 1.3,
      lines: [
        "Paz! O caminho até a igreja é muito bonito, não acha?",
        "A igreja fica no setor inferior esquerdo do mapa.",
        "Nos vemos por aí. Boa exploração!"
      ]
    },
    {
      id: "clara", name: "Clara", role: "Estudante de Pedagogia",
      skin: "#a36a53", hair: "#533126", shirt: "#9264a8",
      pants: "#374b6e", backpack: "#e6b86e", hairStyle: "long",
      route: [[11.1,17.8],[11.1,19.4],[12.3,21],[14.1,21]],
      speed: 1.0, pause: 1.5,
      lines: [
        "Oi! Estou indo dar uma volta perto da piscina.",
        "A FAAMinha fica no lado esquerdo, mais perto da entrada.",
        "Adoro encontrar gente nova passeando pelo campus!"
      ]
    }
  ].map((npc,i)=>({
    ...npc,x:npc.route[0][0],y:npc.route[0][1],target:1,
    heading:"down", walk:0, moving:false,wait:npc.pause + i*.25
  }));

  const animals = [
    {id:"capi-1",type:"capybara",x:13,y:24,homeX:13,homeY:24,
      color:"#996a42",speed:.47,radius:.58,seed:2.1,rest:1.3},
    {id:"capi-2",type:"capybara",x:12.1,y:38.3,homeX:12.1,homeY:38.3,
      color:"#b48150",speed:.42,radius:.58,seed:5.2,rest:1.8},
    {id:"bird-1",type:"lapwing",x:14.1,y:18.3,homeX:14.1,homeY:18.3,
      color:"#d6cba6",speed:.66,radius:.29,seed:1.1,rest:.8},
    {id:"bird-2",type:"lapwing",x:23.8,y:18.1,homeX:23.8,homeY:18.1,
      color:"#e2d8b7",speed:.72,radius:.29,seed:3.3,rest:1.5},
    {id:"bird-3",type:"lapwing",x:11.1,y:39.8,homeX:11.1,homeY:39.8,
      color:"#e0d0aa",speed:.8,radius:.29,seed:7.9,rest:.6}
  ].map(a=>({...a,timer:a.rest,phase:a.seed,heading:"right",moving:false,
    targetX:a.x,targetY:a.y,flapping:0}));

  let elapsed=0;

  const nearBuilding=(x,y,radius=0)=>sites.some(b=>
    x>b.x-radius && x<b.x+b.w+radius &&
    y>b.y-radius && y<b.y+b.h+radius
  );

  const distance=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);

  function solidAt(x,y,radius=.32) {
    return students.some(npc=>distance(x,y,npc.x,npc.y)<radius+.33) ||
      animals.some(a=>distance(x,y,a.x,a.y)<radius+a.radius);
  }

  function nearestTalker(x,y,maxDistance=1.9) {
    let chosen=null,closest=maxDistance;
    for(const npc of students) {
      const d=distance(x,y,npc.x,npc.y);
      if(d<closest){closest=d;chosen=npc;}
    }
    return chosen ? {npc:chosen,distance:closest} : null;
  }

  function direction(dx,dy,fallback) {
    if(Math.abs(dx)+Math.abs(dy)<.001)return fallback;
    if(Math.abs(dx)>Math.abs(dy))return dx>0?"right":"left";
    return dy>0?"down":"up";
  }

  function updateStudent(npc,dt,player,talkingTo) {
    npc.moving=false;
    if(talkingTo===npc.id) {
      npc.heading=direction(player.x-npc.x,player.y-npc.y,npc.heading);
      return;
    }
    if(npc.wait>0){npc.wait=Math.max(0,npc.wait-dt);return;}

    const goal=npc.route[npc.target];
    const dx=goal[0]-npc.x,dy=goal[1]-npc.y,d=Math.hypot(dx,dy);
    if(d<.055) {
      npc.x=goal[0];npc.y=goal[1];
      const end=npc.target===npc.route.length-1;
      const beginning=npc.target===0;
      if(end)npc.reverse=true;
      if(beginning)npc.reverse=false;
      npc.target+=npc.reverse?-1:1;
      npc.wait=.35 + (npc.pause*.55);
      return;
    }
    const step=Math.min(d,npc.speed*dt*(.93+.07*Math.sin(elapsed*1.2+npc.x)));
    const nx=npc.x+dx/d*step,ny=npc.y+dy/d*step;
    npc.heading=direction(dx,dy,npc.heading);
    // Pessoas não atravessam o jogador nem se empurram nas calçadas.
    const nowPlayerDist=distance(npc.x,npc.y,player.x,player.y);
    const nextPlayerDist=distance(nx,ny,player.x,player.y);
    // Não ficar preso: quando há alguém atrás, é permitido se afastar.
    const approachingPlayer=nextPlayerDist<.78 &&
      nextPlayerDist<=nowPlayerDist+.00001;
    const crowdingOther=students.some(other=>other!==npc&&
      distance(nx,ny,other.x,other.y)<.66 &&
      distance(nx,ny,other.x,other.y)<=
        distance(npc.x,npc.y,other.x,other.y)+.00001);
    if(approachingPlayer||crowdingOther) {
      npc.wait=Math.max(npc.wait,.18);
      return;
    }
    if(nearBuilding(nx,ny,.22)||obstacleAt(nx,ny,.25)) {
      npc.wait=.5;
      npc.reverse=!npc.reverse;
      npc.target=Math.max(0,Math.min(npc.route.length-1,
        npc.target+(npc.reverse?-1:1)));
      return;
    }
    npc.x=nx;npc.y=ny;npc.walk+=dt*9;
    npc.moving=true;
  }

  function newAnimalTarget(animal,player) {
    const tries=12;
    const capy=animal.type==="capybara";
    for(let i=0;i<tries;i++){
      const angle=elapsed*.48+animal.seed*3+i*2.1;
      const r=.65+(i%4)*.34;
      const tx=animal.homeX+Math.cos(angle)*r;
      const ty=animal.homeY+Math.sin(angle)*r*.72;
      if(tx<.8||tx>worldW-.8||ty<.8||ty>worldH-.8)continue;
      if(nearBuilding(tx,ty,capy?.48:.2)||
         obstacleAt(tx,ty,capy?.52:.25))continue;
      if(distance(tx,ty,player.x,player.y)<1.5)continue;
      animal.targetX=tx;animal.targetY=ty;return;
    }
    animal.targetX=animal.homeX;animal.targetY=animal.homeY;
  }

  function updateAnimal(animal,dt,player){
    animal.phase+=dt;
    animal.moving=false;
    const close=distance(animal.x,animal.y,player.x,player.y);
    if(animal.type==="lapwing"&&close<2.5){
      const angle=Math.atan2(animal.y-player.y,animal.x-player.x);
      animal.targetX=Math.max(1,Math.min(worldW-1,animal.x+Math.cos(angle)*2.3));
      animal.targetY=Math.max(1,Math.min(worldH-1,animal.y+Math.sin(angle)*2.3));
      animal.flapping=Math.min(1,animal.flapping+dt*4);
      animal.timer=0;
    } else {
      animal.flapping=Math.max(0,animal.flapping-dt*1.25);
    }
    if(animal.timer>0){animal.timer=Math.max(0,animal.timer-dt);return;}
    const dx=animal.targetX-animal.x,dy=animal.targetY-animal.y;
    const d=Math.hypot(dx,dy);
    if(d<.08){
      animal.timer=animal.type==="capybara"?1.1+animal.seed*.2:.5+animal.seed*.15;
      newAnimalTarget(animal,player);
      return;
    }
    const speed=animal.speed*(animal.flapping>.1?2.2:1);
    const step=Math.min(d,speed*dt);
    const nx=animal.x+dx/d*step,ny=animal.y+dy/d*step;
    const radius=animal.type==="capybara"?.45:.16;
    if(nearBuilding(nx,ny,radius) ||
       obstacleAt(nx,ny,radius) ||
       distance(nx,ny,player.x,player.y)<radius+.32 ||
       students.some(n=>distance(nx,ny,n.x,n.y)<radius+.34)) {
      animal.timer=.4;
      newAnimalTarget(animal,player);
      return;
    }
    animal.heading=direction(dx,dy,animal.heading);
    animal.x=nx;animal.y=ny;animal.moving=true;
  }

  function update(dt,player,talkingTo=null) {
    elapsed+=dt;
    for(const npc of students)updateStudent(npc,dt,player,talkingTo);
    for(const animal of animals)updateAnimal(animal,dt,player);
  }

  function ellipse(x,y,rx,ry,color) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
  }
  function stroke(x1,y1,x2,y2,color,width) {
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.stroke();
  }

  function drawStudent(npc,player) {
    const p=P(npc.x,npc.y);
    const step=npc.moving?Math.sin(npc.walk):0;
    const bob=npc.moving?Math.abs(step)*1.7:Math.sin(elapsed*1.3+npc.x)*.3;
    ellipse(p.x+2,p.y+4,10,3.8,"#0b332b6b");
    ctx.save();ctx.translate(p.x,p.y-bob);
    const faceBack=npc.heading==="up";
    const mirrored=npc.heading==="left";
    if(mirrored)ctx.scale(-1,1);

    // Mochila fica visível na lateral e troca de posição ao virar.
    ctx.fillStyle=npc.backpack;
    ctx.beginPath();ctx.roundRect(faceBack?-10:7,-34,11,22,4);ctx.fill();
    ctx.strokeStyle="#392e30";ctx.lineWidth=1.3;ctx.stroke();

    const legs=[[-5,step*4],[5,-step*4]];
    legs.forEach(([x,s])=>{
      stroke(x,-12,x+s,-2,npc.pants,7);
      stroke(x+s-3,-2,x+s+5,-2,"#f5ebd4",4);
    });
    const arm=(side,offset)=>{
      stroke(side*10,-30,side*12+offset,-16,
        npc.skin,5.8);
    };
    arm(-1,step*2);arm(1,-step*2);

    ctx.fillStyle=npc.shirt;
    ctx.strokeStyle="#263e42";
    ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-11,-34,22,23,6);ctx.fill();ctx.stroke();
    stroke(-4,-14,4,-14,"#f8e8c9",1.5);
    ctx.fillStyle=npc.skin;
    ctx.fillRect(-3,-40,6,8);
    ellipse(0,-48,11.8,13.3,npc.skin);
    if(npc.hairStyle==="long") {
      ellipse(-10,-52,5,14,npc.hair);
      ellipse(10,-52,5,14,npc.hair);
    }
    if(npc.hairStyle==="curly") {
      for(let i=0;i<7;i++){
        const a=i*Math.PI/6;
        ellipse(Math.cos(a)*11,-57-Math.sin(a)*8,5,5,npc.hair);
      }
    } else {
      ellipse(-2,-59,12,6,npc.hair);
      ellipse(-9,-54,5,7,npc.hair);
    }
    if(npc.hairStyle==="bun"){
      ellipse(7,-64,5.5,5.5,npc.hair);
    }
    if(npc.hairStyle==="part"){
      stroke(-5,-60,0,-65,"#7b543f",2.5);
    }
    if(!faceBack) {
      ellipse(-4,-48,1.3,1.5,"#283138");
      ellipse(4,-48,1.3,1.5,"#283138");
      stroke(-2,-42,2,-42,"#9f624c",1.3);
    }
    ctx.restore();

    // Sinal discreto de que é possível conversar.
    const proximity=distance(npc.x,npc.y,player.x,player.y);
    if(proximity<2.2){
      const lift=Math.sin(elapsed*3)*2;
      ellipse(p.x,p.y-75+lift,10,10,"#fff4d8");
      ctx.strokeStyle="#ba995c";ctx.lineWidth=1.8;ctx.stroke();
      ctx.fillStyle="#4d6771";ctx.font="bold 12px Arial";
      ctx.textAlign="center";ctx.fillText("E",p.x,p.y-71+lift);
    }
  }

  function drawCapybara(a) {
    const p=P(a.x,a.y),bounce=a.moving?Math.sin(a.phase*7)*1.2:0;
    ellipse(p.x+3,p.y+4,16,5,"#21372f66");
    ctx.save();ctx.translate(p.x,p.y-bounce);
    const flip=a.heading==="left"?-1:1;ctx.scale(flip,1);
    // Barriga, patas, focinho e orelhas.
    for(const x of [-11,1,10]){
      stroke(x,-7,x,-1,"#634b37",5);
    }
    ellipse(-2,-14,18,11,a.color);
    ellipse(12,-18,9,9,a.color);
    ellipse(7,-25,3.8,4,"#986e4f");
    ellipse(18,-23,3.5,4,"#986e4f");
    ellipse(20,-14,6,4,"#c59b73");
    ellipse(22,-16,2.8,2.2,"#45392f");
    ellipse(12,-20,1.4,1.4,"#1e2425");
    ctx.restore();
  }

  function drawLapwing(a) {
    const p=P(a.x,a.y);
    const flap=a.flapping>0?.55+Math.sin(a.phase*32)*.45:0;
    const hop=a.moving?Math.sin(a.phase*13)*2:0;
    const height=a.flapping>0?(8+Math.abs(Math.sin(a.phase*18))*12):0;
    ellipse(p.x+2,p.y+3,7+height*.25,2.5,"#263d3555");
    ctx.save();ctx.translate(p.x,p.y-hop-height);
    const flip=a.heading==="left"?-1:1;ctx.scale(flip,1);
    stroke(-3,-2,-3,9,"#985641",1.8);
    stroke(3,-2,3,9,"#985641",1.8);
    ellipse(0,-7,9,6,"#5b625e");
    ellipse(2,-10,8,4,a.color);
    if(a.flapping>.05){
      stroke(-3,-9,-12-flap*11,-20-flap*9,"#4b585e",4);
      stroke(3,-9,11+flap*12,-21-flap*10,"#4b585e",4);
    }else {
      ellipse(-4,-9,6,3,"#313c43");
    }
    ellipse(8,-16,5.5,5,"#f7f3e6");
    ellipse(9,-17,4,3.7,"#202c32");
    stroke(7,-21,6,-27,"#202b33",2.1);
    stroke(8,-24,9,-29,"#202b33",1.5);
    ctx.fillStyle="#db7c4a";
    ctx.beginPath();ctx.moveTo(12,-17);
    ctx.lineTo(19,-14);ctx.lineTo(12,-13);ctx.fill();
    ellipse(11,-18,1,1,"#f1eee3");
    ctx.restore();
  }

  function renderables(player) {
    return [
      ...students.map(npc=>({
        depth:npc.y+npc.x*.02,
        draw:()=>drawStudent(npc,player)
      })),
      ...animals.map(a=>({
        depth:a.y+a.x*.02,
        draw:()=>a.type==="capybara"?drawCapybara(a):drawLapwing(a)
      }))
    ];
  }

  function drawMinimapMarkers(m,ox,oy,sx,sy) {
    for(const npc of students){
      m.fillStyle="#f6e8b4";
      m.beginPath();m.arc(ox+npc.x*sx,oy+npc.y*sy,2.5,0,Math.PI*2);m.fill();
    }
    for(const a of animals){
      m.fillStyle=a.type==="capybara"?"#b17c4f":"#eaf5db";
      m.beginPath();m.arc(ox+a.x*sx,oy+a.y*sy,1.8,0,Math.PI*2);m.fill();
    }
  }

  return {students,animals,update,renderables,nearestTalker,solidAt,
    drawMinimapMarkers};
};
