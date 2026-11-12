/* FAAMA Explorer 2.4 — interior do Prédio Central.
 * Mapa independente: não altera a planta do campus nem o progresso das missões.
 * Cenário e personagens fictícios, inspirados nos ambientes universitários.
 */
"use strict";

window.createFaamaInterior = function createFaamaInterior({ctx, canvasWidth=1200, canvasHeight=760}) {
  const WIDTH=28, HEIGHT=20, TILE=30;
  const offsetX=(canvasWidth-WIDTH*TILE)/2;
  const offsetY=(canvasHeight-HEIGHT*TILE)/2;
  const rooms=[
    {id:"classroom",name:"SALA DE AULA",x:2,y:2,w:9,h:10,floor:"#d6aa77"},
    {id:"hall",name:"CORREDOR CENTRAL",x:11,y:2,w:6,h:13,floor:"#e8d0a6"},
    {id:"reading",name:"SALA DE ESTUDOS",x:17,y:2,w:9,h:10,floor:"#9fb5a9"},
    {id:"reception",name:"RECEPÇÃO",x:7,y:12,w:14,h:7,floor:"#dec5a3"}
  ];
  const desk={id:"reception-desk",kind:"desk",x:15,y:15.2,w:3.3,h:1.05};
  const furniture=[
    desk,
    {id:"reception-bench",kind:"bench",x:9.0,y:16.8,w:3.0,h:.65},
    {id:"reception-planter",kind:"plant",x:19.2,y:17,w:.8,h:.8},
    {id:"class-table-a",kind:"studentDesk",x:3.7,y:5.1,w:2.25,h:.85},
    {id:"class-table-b",kind:"studentDesk",x:7.1,y:5.1,w:2.25,h:.85},
    {id:"class-table-c",kind:"studentDesk",x:3.7,y:8.1,w:2.25,h:.85},
    {id:"class-table-d",kind:"studentDesk",x:7.1,y:8.1,w:2.25,h:.85},
    {id:"teacher-table",kind:"teacherDesk",x:4.0,y:3.45,w:3.6,h:.75},
    {id:"class-plant",kind:"plant",x:2.55,y:10.8,w:.75,h:.7},
    {id:"reading-bookcase",kind:"bookcase",x:21.6,y:3.1,w:3.55,h:1.2},
    {id:"reading-table",kind:"studyTable",x:19.25,y:6.6,w:3.5,h:1.25},
    {id:"reading-bench",kind:"bench",x:20.15,y:9.4,w:2.1,h:.7},
    {id:"reading-plant",kind:"plant",x:25,y:10.6,w:.7,h:.7},
    {id:"hall-water",kind:"water",x:15.45,y:10.6,w:.85,h:1.0},
    {id:"hall-plant",kind:"plant",x:11.5,y:11.2,w:.75,h:.75}
  ];
  const walls=[
    // Limites externos das duas salas.
    [2,2,11,2],[2,2,2,12],[2,12,11,12],
    [17,2,26,2],[26,2,26,12],[17,12,26,12],
    // Corredor e portas abertas nas paredes laterais.
    [11,2,17,2],
    [11,2,11,6.55],[11,8.45,11,12],
    [17,2,17,6.55],[17,8.45,17,12],
    // Recepção ligada ao corredor.
    [7,12,11,12],[17,12,21,12],
    [7,12,7,19],[21,12,21,19],
    // Porta de saída na parede inferior.
    [7,19,12.5,19],[15.5,19,21,19]
  ];
  const objects=[
    {id:"mural",x:9.5,y:13.0,name:"Mural de avisos",
      icon:"📌",text:"Há horários de atendimento, comunicados e eventos no mural. Um lembrete diz: 'A organização também faz parte de uma grande aventura!'"},
    {id:"quadro",x:5.8,y:3.1,name:"Quadro da sala de aula",
      icon:"📚",text:"No quadro está escrito: 'Aprender é explorar, perguntar e descobrir.'"},
    {id:"livros",x:7.9,y:8.3,name:"Material de estudo",
      icon:"📖",text:"Você encontrou cadernos, lápis e anotações de uma aula. Nada foi acrescentado ao inventário da Missão 01."},
    {id:"estante",x:23.1,y:4.0,name:"Estante de livros",
      icon:"📚",text:"Livros de diferentes áreas do conhecimento. Você pode continuar explorando as salas e corredores."},
    {id:"mesa",x:20.9,y:7.15,name:"Mesa de estudos",
      icon:"✏️",text:"Um espaço tranquilo para estudar, conversar e organizar ideias."},
    {id:"bebedouro",x:15.65,y:11.0,name:"Bebedouro",
      icon:"💧",text:"Uma pausa para beber água ajuda a recuperar o foco durante o dia."}
  ];
  const attendant={
    id:"marina",name:"Marina",role:"Recepção do Prédio Central",x:13.1,y:15.1,
    skin:"#b57950",hair:"#2b222b",shirt:"#467aa2",pants:"#324b61",
    lines:[
      "Olá, bem-vindo ao Prédio Central! Eu sou Marina, da recepção.",
      "À esquerda está a sala de aula. À direita fica a sala de estudos.",
      "Explore os objetos, conheça as salas e, quando quiser, volte ao campus pela porta da entrada."
    ]
  };

  const player={x:14,y:17.8,walk:0,facing:"up",moving:false};
  let active=false,elapsed=0;
  let cameraX=canvasWidth/2,cameraY=canvasHeight/2;
  const exitPoint={x:14,y:18.45};
  const point=(x,y)=>({x:offsetX+x*TILE,y:offsetY+y*TILE});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const inside=(r,x,y,pad=0)=>
    x>=r.x+pad&&x<=r.x+r.w-pad&&y>=r.y+pad&&y<=r.y+r.h-pad;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function segmentDistance(x,y,segment){
    const [x1,y1,x2,y2]=segment,dx=x2-x1,dy=y2-y1;
    const l2=dx*dx+dy*dy,ratio=l2?clamp(((x-x1)*dx+(y-y1)*dy)/l2,0,1):0;
    return Math.hypot(x-(x1+dx*ratio),y-(y1+dy*ratio));
  }
  const radius=.28;
  function blocked(x,y) {
    if(!rooms.some(r=>inside(r,x,y,radius)))return true;
    if(walls.some(s=>segmentDistance(x,y,s)<radius+.15))return true;
    if(furniture.some(f=>x>f.x-radius && x<f.x+f.w+radius &&
        y>f.y-radius && y<f.y+f.h+radius))return true;
    if(Math.hypot(x-attendant.x,y-attendant.y)<radius+.35)return true;
    return false;
  }
  function enter(){
    active=true;elapsed=0;
    player.x=14;player.y=17.8;player.walk=0;
    player.facing="up";player.moving=false;
  }
  function leave(){active=false;player.moving=false;}
  function roomName(){
    if(inside(rooms[0],player.x,player.y))return "Sala de aula";
    if(inside(rooms[2],player.x,player.y))return "Sala de estudos";
    if(inside(rooms[3],player.x,player.y))return "Recepção";
    return "Corredor central";
  }
  function update(dt,held){
    if(!active)return;
    elapsed+=dt;
    const dx0=Number(held.has("ArrowRight")||held.has("d"))-
      Number(held.has("ArrowLeft")||held.has("a"));
    const dy0=Number(held.has("ArrowDown")||held.has("s"))-
      Number(held.has("ArrowUp")||held.has("w"));
    const len=Math.hypot(dx0,dy0)||1;
    const dx=dx0/len*4.7*dt,dy=dy0/len*4.7*dt;
    const oldX=player.x,oldY=player.y;
    const nx=clamp(player.x+dx,radius,WIDTH-radius);
    const ny=clamp(player.y+dy,radius,HEIGHT-radius);
    if(!blocked(nx,player.y))player.x=nx;
    if(!blocked(player.x,ny))player.y=ny;
    player.moving=distance({x:oldX,y:oldY},player)>.00001;
    if(player.moving){
      player.walk+=dt*11;
      player.facing=Math.abs(dx0)>Math.abs(dy0)
        ? (dx0>0?"right":"left") : (dy0>0?"down":"up");
    }
  }
  function pause(){player.moving=false;}
  function nearest(){
    // O botão E aciona objetos, recepcionista e saída sem ações automáticas.
    let best=null,d=1.75;
    for(const o of objects){
      const candidate=distance(player,o);
      if(candidate<d){d=candidate;best={kind:"object",id:o.id,name:o.name,text:o.text};}
    }
    const dc=distance(player,attendant);
    if(dc<2.10 && dc<d+.35){
      d=dc;best={kind:"npc",id:attendant.id,name:attendant.name,npc:attendant};
    }
    const de=distance(player,exitPoint);
    if(de<1.45 && de<d){
      best={kind:"exit",id:"exit",name:"Voltar ao campus"};
    }
    return best;
  }
  function interact(){
    const action=nearest();
    if(!action)return null;
    return action;
  }

  const color={ink:"#17374a",cream:"#fff4d9",wall:"#f0dec2",
    grass:"#438d72",gold:"#e1bd79",line:"#c1ac90"};

  function fillRect(x,y,w,h,fill){
    ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
  }
  function roundRect(x,y,w,h,r,fill,stroke=null){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function text(s,x,y,size,color,bold=false){
    ctx.fillStyle=color;
    ctx.font=(bold?"bold ":"")+size+"px Arial, sans-serif";
    ctx.textAlign="center";ctx.fillText(s,x,y);
  }
  function ellipse(x,y,rx,ry,color){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
  }
  function line(x1,y1,x2,y2,c,w){
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap="round";ctx.stroke();
  }
  function drawFloor(r){
    const p=point(r.x,r.y);
    fillRect(p.x,p.y,r.w*TILE,r.h*TILE,r.floor);
    for(let yy=0;yy<r.h;yy++){
      for(let xx=0;xx<r.w;xx++){
        if((xx+yy)%2===0){
          fillRect(p.x+xx*TILE,p.y+yy*TILE,TILE,TILE,
            r.id==="reading"?"#b4cbbf28":"#fff9dc1a");
        }
      }
    }
    ctx.strokeStyle="#967f6d42";ctx.lineWidth=1;
    for(let x=0;x<=r.w;x++){
      line(p.x+x*TILE,p.y,p.x+x*TILE,p.y+r.h*TILE,"#836f5340",.7);
    }
    for(let y=0;y<=r.h;y++){
      line(p.x,p.y+y*TILE,p.x+r.w*TILE,p.y+y*TILE,"#846c5a40",.7);
    }
  }
  function drawWall(segment){
    const [x1,y1,x2,y2]=segment,a=point(x1,y1),b=point(x2,y2);
    line(a.x+4,a.y+7,b.x+4,b.y+7,"#3b4b5555",15);
    line(a.x,a.y,b.x,b.y,"#917e6c",14);
    line(a.x,a.y-4,b.x,b.y-4,"#f0e6cd",11);
    line(a.x,a.y-8,b.x,b.y-8,"#fff9ea",5);
  }
  function drawDoors(){
    for(const x of [11,17]){
      const a=point(x,6.55),b=point(x,8.45),mid=point(x,7.5);
      fillRect(mid.x-5,a.y,10,b.y-a.y,"#4f8a93");
      line(mid.x,mid.y-24,mid.x-24*(x===11?-1:1),
        mid.y-36,"#c38d51",5);
      text(x===11?"AULA":"ESTUDOS",mid.x+(x===11?-63:63),
        mid.y-28,10,"#31536a",true);
    }
    const e=point(14,19);
    roundRect(e.x-56,e.y-5,112,13,4,"#276c88","#e8d39c");
    line(e.x-8,e.y-5,e.x-8,e.y+9,"#f5ead1",2);
    text("SAÍDA PARA O CAMPUS",e.x,e.y+27,11,"#425e6b",true);
  }
  function drawFurniture(f){
    const p=point(f.x,f.y),w=f.w*TILE,h=f.h*TILE;
    ellipse(p.x+w/2+3,p.y+h+5,Math.max(w/2,10),6,"#253c3440");
    if(f.kind==="plant"){
      fillRect(p.x+4,p.y+13,w-8,h-13,"#b9714f");
      ellipse(p.x+w/2,p.y+11,11,10,"#337b4f");
      ellipse(p.x+w/2-9,p.y+5,9,9,"#4d9857");
      ellipse(p.x+w/2+8,p.y+4,9,9,"#62b566");
      return;
    }
    if(f.kind==="bookcase"){
      roundRect(p.x,p.y,w,h,4,"#875a3d","#573d2d");
      for(let row=0;row<2;row++){
        fillRect(p.x+5,p.y+3+row*(h/2),w-10,h/2-6,"#4a332c");
        for(let i=0;i<Math.floor((w-12)/9);i++){
          const hues=["#cf7256","#5fa8af","#dec16f","#7e95c5","#9cb76f"];
          fillRect(p.x+8+i*9,p.y+5+row*(h/2),6,h/2-11,
            hues[(row*3+i)%hues.length]);
        }
      }
      return;
    }
    if(f.kind==="water"){
      roundRect(p.x,p.y,w,h,4,"#c8d7df","#597f91");
      roundRect(p.x+4,p.y+3,w-8,h*.43,3,"#77bace");
      text("H₂O",p.x+w/2,p.y+h*.71,10,"#31576b",true);
      return;
    }
    const isDesk=["desk","studentDesk","teacherDesk","studyTable"].includes(f.kind);
    if(isDesk){
      const wood=f.kind==="desk"?"#a16e51":
        f.kind==="studyTable"?"#86745d":"#b58357";
      fillRect(p.x+5,p.y+h-5,6,10,"#664f3b");
      fillRect(p.x+w-11,p.y+h-5,6,10,"#664f3b");
      roundRect(p.x,p.y,w,h,5,wood,"#624c3f");
      fillRect(p.x+5,p.y+5,w-10,3,"#ffe6b164");
      if(f.kind==="desk"){
        text("INFORMAÇÕES",p.x+w/2,p.y+h*.6,12,"#f8e8bc",true);
        roundRect(p.x+w*.15,p.y+8,15,11,3,"#f0d8a1");
      }else if(f.kind==="teacherDesk"){
        roundRect(p.x+7,p.y+5,27,h-12,3,"#ece1c8");
        fillRect(p.x+w-26,p.y+6,15,11,"#6b8ea2");
      }else{
        roundRect(p.x+7,p.y+6,17,12,2,"#f5f1d9");
        line(p.x+11,p.y+12,p.x+19,p.y+12,"#a2b8ae",1.2);
      }
      return;
    }
    if(f.kind==="bench"){
      roundRect(p.x,p.y,w,h,5,"#9a6b49","#5b4937");
      for(let i=1;i<4;i++)line(p.x+4,p.y+i*h/4,p.x+w-4,p.y+i*h/4,
        "#dbad78",2);
      fillRect(p.x+5,p.y+h-3,5,8,"#5e5143");
      fillRect(p.x+w-11,p.y+h-3,5,8,"#5e5143");
    }
  }
  function drawDecor(){
    const title=point(14,12.5);
    roundRect(title.x-84,title.y-9,168,27,8,"#356f83","#f4d8a4");
    text("PRÉDIO CENTRAL",title.x,title.y+9,16,"#fff4d8",true);
    const classBoard=point(5.75,2.6);
    roundRect(classBoard.x-65,classBoard.y-4,130,33,4,"#255b58","#e5bb6c");
    text("BEM-VINDOS!",classBoard.x,classBoard.y+17,13,"#e5e9c9",true);
    const recBoard=point(9.35,12.75);
    roundRect(recBoard.x-38,recBoard.y-2,76,28,4,"#c9a173","#6c5542");
    text("AVISOS",recBoard.x,recBoard.y+17,11,"#294f60",true);

    for(const [x,y,label] of [[5.5,10.9,"SALA DE AULA"],
                               [22,10.9,"SALA DE ESTUDOS"]]){
      const p=point(x,y);
      roundRect(p.x-61,p.y-12,122,22,6,"#355d6e","#c9a66b");
      text(label,p.x,p.y+3,10,"#fff5db",true);
    }
    const carpets=[[14,17,2.5,1.1],[14,9.6,1.6,3.6],[22,9,2.5,.85]];
    carpets.forEach(([x,y,w,h],i)=>{
      const p=point(x-w/2,y-h/2);
      roundRect(p.x,p.y,w*TILE,h*TILE,6,
        i===0?"#799ca2c5":i===1?"#c6ad8e66":"#b0b2a3ba","#ecdfc3a0");
    });

    // Luzes suspensas e janelas.
    [[5.2,3.2],[22.8,3.2],[14,4.1],[14,16.1]].forEach(([x,y])=>{
      const p=point(x,y);
      ellipse(p.x+1,p.y+2,30,14,"#fff5d341");
      ellipse(p.x,p.y,10,6,"#fff0bc");
    });
    for(const [x,y] of [[2,4],[26,4],[2,9],[26,9]]){
      const p=point(x,y);
      roundRect(p.x-5,p.y-25,10,52,3,"#80c5d8","#f6ecce");
      line(p.x-5,p.y,p.x+5,p.y,"#f4f5d9",2);
    }
  }
  function drawActor(npc,kind){
    const p=point(npc.x,npc.y);
    const walk=kind==="player"&&npc.moving?Math.sin(npc.walk):0;
    const bob=kind==="player"&&npc.moving?Math.abs(walk)*2:0;
    ellipse(p.x+2,p.y+4,12,5,"#1d3f4370");
    ctx.save();ctx.translate(p.x,p.y-bob);
    const flip=npc.facing==="left"?-1:1;
    ctx.scale(flip,1);
    line(-5,-13,-5+walk*4,-2,"#334c69",7);
    line(5,-13,5-walk*4,-2,"#334c69",7);
    line(-8,-2,-1,-2,"#fff6e2",4);
    line(4,-2,11,-2,"#fff6e2",4);
    roundRect(-12,-38,24,28,7,kind==="player"?"#f0efe0":"#467aa2","#35556a");
    line(-14,-33,-15-walk*3,-17,"#b77f59",6);
    line(14,-33,15+walk*3,-17,"#b77f59",6);
    fillRect(-4,-41,8,8,"#b77f59");
    ellipse(0,-52,12,14,kind==="player"?"#e6ad83":npc.skin);
    ellipse(-5,-63,10,6,kind==="player"?"#41302c":npc.hair);
    ellipse(5,-64,9,6,kind==="player"?"#41302c":npc.hair);
    ellipse(-4,-51,1.6,1.6,"#25343f");
    ellipse(4,-51,1.6,1.6,"#25343f");
    line(-2,-45,2,-45,"#9c644b",1.3);
    ctx.restore();

    if(kind==="npc"){
      const pulse=Math.sin(elapsed*3)*2;
      ellipse(p.x,p.y-83+pulse,12,10,"#ffe29f");
      text("E",p.x,p.y-79+pulse,12,"#2c4354",true);
      text("Marina",p.x,p.y-96+pulse,13,"#f7ecda",true);
    }
  }
  function drawNearby(){
    const near=nearest();
    if(!near)return;
    if(near.kind==="exit")return;
    const obj=objects.find(o=>o.id===near.id);
    if(!obj)return;
    const p=point(obj.x,obj.y);
    ellipse(p.x,p.y-17+Math.sin(elapsed*3)*2,14,12,"#ffe09a99");
    text("E",p.x,p.y-13+Math.sin(elapsed*3)*2,12,"#253f4e",true);
  }
  function draw(time,zoom=.8){
    if(!active)return;
    const z=clamp(zoom/.8,.82,1.8);
    ctx.setTransform(1,0,0,1,0,0);
    const bg=ctx.createLinearGradient(0,0,0,canvasHeight);
    bg.addColorStop(0,"#263d4e");bg.addColorStop(1,"#142d3b");
    fillRect(0,0,canvasWidth,canvasHeight,bg);
    ctx.save();
    const current=point(player.x,player.y);
    const targetX=canvasWidth/2+(current.x-canvasWidth/2)*Math.max(0,z-1)*.65;
    const targetY=canvasHeight/2+(current.y-canvasHeight/2)*Math.max(0,z-1)*.65;
    cameraX+=(targetX-cameraX)*.13;
    cameraY+=(targetY-cameraY)*.13;
    ctx.translate(canvasWidth/2,canvasHeight/2);
    ctx.scale(z,z);
    ctx.translate(-cameraX,-cameraY);

    // Sombra do prédio e pisos distintos para cada ambiente.
    const shell=point(1.8,1.8);
    roundRect(shell.x-13,shell.y-16,24.4*TILE+25,18*TILE+33,15,
      "#354f58","#d0ba91");
    rooms.forEach(drawFloor);
    drawDecor();
    furniture.forEach(drawFurniture);
    walls.forEach(drawWall);
    drawDoors();
    drawActor(attendant,"npc");
    drawActor(player,"player");
    drawNearby();
    ctx.restore();
  }
  return {enter,leave,update,pause,draw,nearest,interact,roomName,blocked,
    get active(){return active},
    get player(){return player},
    rooms,objects,furniture,attendant};
};
