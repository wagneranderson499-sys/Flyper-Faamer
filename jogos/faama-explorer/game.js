
"use strict";

(() => {
  const canvas = document.getElementById("world");

  if (!canvas) {
    console.error("Canvas com id='world' não encontrado.");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Não foi possível iniciar o Canvas 2D.");
    return;
  }

  const ui = {
    location: document.getElementById("location"),
    objective: document.getElementById("objective"),
    interact: document.getElementById("interact"),
    toast: document.getElementById("toast"),
    fatal: document.getElementById("fatal"),
    zoom: document.getElementById("zoomLabel")
  };

  const SW = 1200;
  const SH = 760;
  const W = 34;
  const H = 44;
  const TW = 39;
  const TH = 19.5;

  canvas.width = SW;
  canvas.height = SH;

  // Planta do campus separada do motor de renderização.
  const sites = window.FAAMA_MAP.sites;

  const player = {
    x: 20,
    y: 42,
    speed: 5,
    walk: 0,
    facing: "down",
    moving: false
  };

  const held = new Set();

  let zoom = 0.8;
  let time = 0;
  let previous = 0;
  let toastUntil = 0;
  let near = null;

  const camera = iso(18, 24.5);

  const roads = window.FAAMA_MAP.roads;

  // Projeção 2,5D: x representa posição horizontal e y a profundidade.
  // A projeção anterior em losango invertia os setores esquerdo/direito.
  function iso(x, y, z = 0) {
    return {
      x: x * TW * .73 - y * TW * .12,
      y: x * TH * .18 + y * TH * .82 - z
    };
  }

  function P(x, y, z = 0) {
    return iso(x, y, z);
  }

  function polygon(points, color, stroke = null) {
    ctx.beginPath();

    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(
      x, y,
      Math.max(1, rx),
      Math.max(1, ry),
      0, 0, Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(a, b, color, width) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function tile(x, y, color) {
    polygon([P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)],color);
  }

  function seeded(n) {
    const v = Math.sin(n * 78.233 + 4.32) * 43758.5453;
    return v - Math.floor(v);
  }

  function inside(x, y, s, pad = 0) {
    return (
      x >= s.x - pad &&
      x <= s.x + s.w + pad &&
      y >= s.y - pad &&
      y <= s.y + s.h + pad
    );
  }

  function roadNear(x, y) {
    for (const road of roads) {
      for (let i = 0; i < road.length - 1; i++) {
        const a = road[i];
        const b = road[i + 1];

        const vx = b[0] - a[0];
        const vy = b[1] - a[1];

        const lengthSquared = vx * vx + vy * vy;

        if (lengthSquared === 0) continue;

        const t = Math.max(
          0,
          Math.min(
            1,
            ((x - a[0]) * vx + (y - a[1]) * vy) / lengthSquared
          )
        );

        const px = a[0] + t * vx;
        const py = a[1] + t * vy;

        if (Math.hypot(x - px, y - py) < 1.25) {
          return true;
        }
      }
    }

    return false;
  }


  // A mata é mais densa ao redor do campus, sem tampar o centro e os caminhos.
  const trees = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const noise = seeded(x * 23 + y * 79);
      const perimeter = x < 4 || x > W-5 || y < 6 || y > H-6;
      const occupied = sites.some(s => inside(x, y, s, perimeter ? 1 : 2.1));
      if (occupied || roadNear(x, y)) continue;
      if (noise > (perimeter ? 0.63 : 0.93)) {
        trees.push({
          x: x + 0.15 + seeded(x * 17 + y) * .35,
          y: y + 0.15 + seeded(y * 13 + x) * .35,
          size: .72 + seeded(x * 41 + y * 13) * .54,
          flowering: noise > .981,
          seed: x * 33 + y * 19
        });
      }
    }
  }

  const palms = [
    {x:12.3,y:25.6},{x:24.4,y:27.9},{x:12.1,y:33.4},
    {x:24.7,y:35.2},{x:13.1,y:17},{x:22.6,y:17.5},
    {x:10.5,y:37.3},{x:27,y:23},{x:9.5,y:22.6}
  ];

  function ground() {
    // Diferentes tons de grama criam volume, mesmo sem texturas externas.
    const colors = ["#7ea85d","#80af62","#8fba68","#75a95b","#97bb6c"];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = seeded(x * 7 + y * 47);
        const color = colors[Math.min(colors.length-1,Math.floor(n*colors.length))];
        tile(x, y, color);
        if (n > .89) {
          const p=P(x+.36,y+.36);
          line({x:p.x-3,y:p.y},{x:p.x-1,y:p.y-4},"#65984d",1);
          line({x:p.x+2,y:p.y},{x:p.x+1,y:p.y-3},"#b0d17b",1);
        }
      }
    }
    // Margem arborizada do perímetro.
    line(P(0,H),P(W,H),"#6a995b",7);
  }

  function drawRoads() {
    // Três camadas fazem as calçadas parecerem lajes em vez de traços planos.
    for (const road of roads) {
      for (let i=0; i<road.length-1; i++) {
        const a=P(...road[i]), b=P(...road[i+1]);
        line({x:a.x+2,y:a.y+3},{x:b.x+2,y:b.y+3},"#33594355",36);
        line(a,b,"#829b79",32);
        line(a,b,"#f7e5ba",27);
        line(a,b,"#d8bfa0",24);
        line(a,b,"#e9d6b4",20);
        // Riscos regulares imitam divisões de pedra/piso.
        const dx=b.x-a.x,dy=b.y-a.y, len=Math.hypot(dx,dy);
        const nx=-dy/(len||1),ny=dx/(len||1);
        for(let t=11; t<len-5; t+=13) {
          const px=a.x+dx*t/len,py=a.y+dy*t/len;
          line({x:px+nx*7,y:py+ny*7},{x:px-nx*7,y:py-ny*7},
            "#b9997a55",1);
        }
      }
    }
    // Rodovia PA-391 ao sul do portão.
    const yRoad=P(18,45).y;
    const start=P(-4,45).x, end=P(48,45).x;
    line({x:start,y:yRoad},{x:end,y:yRoad},"#34454b",64);
    line({x:start,y:yRoad},{x:end,y:yRoad},"#d7d9c8",57);
    line({x:start,y:yRoad},{x:end,y:yRoad},"#65717b",51);
    line({x:start,y:yRoad-21},{x:end,y:yRoad-21},"#eee7b9",1.6);
    line({x:start,y:yRoad+21},{x:end,y:yRoad+21},"#eee7b9",1.6);
    for(let x=start+18;x<end-18;x+=58) {
      line({x,y:yRoad},{x:x+28,y:yRoad},"#f4da87",3);
    }
  }

  function garden(x,y,r=1) {
    const p=P(x,y);
    ellipse(p.x+2,p.y+4,18*r,7*r,"#315f3b66");
    ellipse(p.x,p.y,18*r,8*r,"#f8dfa7");
    ellipse(p.x,p.y-2,15*r,6*r,"#418c50");
    for(let i=0;i<11;i++){
      const n=seeded(i*33+x*9+y*13),a=i*Math.PI*2/11;
      const xx=p.x+Math.cos(a)*12*r*n;
      const yy=p.y-2+Math.sin(a)*4*r*n;
      ellipse(xx,yy,2.5*r,1.8*r,
        i%3===0?"#f9f5b6":i%3===1?"#f7a2c5":"#f5c66e");
      ellipse(xx-.7,yy-.8,.65*r,.65*r,"#fff6df");
    }
  }

  function plazaPaving(x1,y1,x2,y2) {
    polygon([P(x1,y1),P(x2,y1),P(x2,y2),P(x1,y2)],"#f0d7b1","#bb9975");
    for(let y=y1+.6;y<y2;y+=.95){
      line(P(x1+.15,y),P(x2-.15,y),"#cda88577",.9);
    }
    for(let x=x1+.5;x<x2;x+=1.35){
      line(P(x,y1+.2),P(x,y2-.2),"#cda88550",.8);
    }
  }

  function plazas() {
    // Praça central e caminhos de entrada; sem mudar os edifícios.
    plazaPaving(14.7,29.2,23.3,36.1);
    garden(13.7,30.2,1.1);
    garden(24.4,30.1,1.1);
    garden(14.4,34.8,.95);
    garden(23.6,34.6,.95);
    garden(12.1,24.1,.85);
    garden(25.3,24.4,.95);
    garden(10.6,19.9,.9);
  }


  function building(b) {
    const footprint = P(b.x + b.w / 2, b.y + b.h / 2);
    ellipse(footprint.x + 9, footprint.y + 11,
      b.w * TW * 0.48, b.h * TH * 0.50, "#163c3440");
    const A = P(b.x, b.y);
    const B = P(b.x + b.w, b.y);
    const C = P(b.x + b.w, b.y + b.h);
    const D = P(b.x, b.y + b.h);
    const z = b.z;

    polygon([
      A, D,
      { x: D.x, y: D.y - z },
      { x: A.x, y: A.y - z }
    ], b.wall);

    polygon([
      D, C,
      { x: C.x, y: C.y - z },
      { x: D.x, y: D.y - z }
    ], b.side);

    polygon([
      A, B,
      { x: B.x, y: B.y - z },
      { x: A.x, y: A.y - z }
    ], b.wall);

    polygon([
      B, C,
      { x: C.x, y: C.y - z },
      { x: B.x, y: B.y - z }
    ], b.side);

    polygon(
      [A, B, C, D].map(p => ({
        x: p.x,
        y: p.y - z
      })),
      b.roof,
      "#315c4b"
    );

    const roofA = P(b.x + 0.3, b.y + 0.3, z + 5);
    const roofB = P(b.x + b.w - 0.3, b.y + 0.3, z + 5);
    const roofC = P(b.x + b.w - 0.3, b.y + b.h - 0.3, z + 5);
    const roofD = P(b.x + 0.3, b.y + b.h - 0.3, z + 5);

    polygon(
      [roofA, roofB, roofC, roofD],
      b.type === "church" ? "#4e6673" :
      b.type === "central" ? "#1e817a" :
      b.roof
    );

    // Janelas das fachadas
    for (let i = 1; i < b.w; i++) {
      const t = i / b.w;
      const x = A.x + (B.x - A.x) * t;
      const y = A.y + (B.y - A.y) * t - z + 24;

      polygon([
        { x: x - 7, y: y - 8 },
        { x: x + 7, y: y - 1 },
        { x: x + 7, y: y + 11 },
        { x: x - 7, y: y + 4 }
      ], b.type === "central"
        ? (i % 2 ? "#274a82" : "#9cdbd9")
        : "#8fc2c3");
    }

    for (let i = 1; i < b.h; i++) {
      const t = i / b.h;
      const x = D.x + (C.x - D.x) * t;
      const y = D.y + (C.y - D.y) * t - z + 24;

      polygon([
        { x: x - 7, y: y - 1 },
        { x: x + 7, y: y - 8 },
        { x: x + 7, y: y + 4 },
        { x: x - 7, y: y + 11 }
      ], b.type === "central" ? "#243f79" : "#94c2bd");
    }

    buildingDetails(b, A, B, C, D, z);

    if (b.type === "central") {
      const p = P(
        b.x + b.w * 0.58,
        b.y + b.h,
        z - 5
      );

      polygon([
        { x: p.x - 17, y: p.y - 18 },
        { x: p.x + 16, y: p.y - 2 },
        { x: p.x + 16, y: p.y + 20 },
        { x: p.x - 17, y: p.y + 4 }
      ], "#e88938");
    }

    if (b.type === "pool") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 8
      );

      ellipse(p.x, p.y, b.w * TW * 0.32, b.h * TH * 0.3, "#f2f5ed");
      ellipse(p.x, p.y - 2, b.w * TW * 0.28, b.h * TH * 0.24, "#3faed2");

      for (let i = -2; i <= 2; i++) {
        line(
          { x: p.x - 25, y: p.y + i * 4 },
          { x: p.x + 25, y: p.y + i * 4 },
          "#9de8ed",
          1
        );
      }
    }

    if (b.type === "sports") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 6
      );

      ellipse(p.x, p.y, 38, 17, "#2d91a4");

      line(
        { x: p.x - 35, y: p.y },
        { x: p.x + 35, y: p.y },
        "#d4f2e8",
        2
      );
    }

    if (b.type === "church") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 20
      );

      line(
        { x: p.x, y: p.y - 20 },
        { x: p.x, y: p.y + 4 },
        "#f4e2ba",
        4
      );

      line(
        { x: p.x - 9, y: p.y - 11 },
        { x: p.x + 9, y: p.y - 11 },
        "#f4e2ba",
        4
      );
    }

    const center = P(
      b.x + b.w / 2,
      b.y + b.h / 2,
      z + 30
    );

    ctx.save();
    ctx.font = "bold 13px 'DM Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    const label = b.short || b.name;
    const labelWidth = ctx.measureText(label).width + 24;
    ctx.shadowColor = "#0a221dc2";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#112a30e8";
    ctx.strokeStyle = "#e8c272";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(center.x - labelWidth/2, center.y-20, labelWidth, 26, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.fillStyle = "#fff6de";
    ctx.fillText(label, center.x, center.y-2);
    ctx.restore();
  }


  // Fachadas inspiradas nas fotos do usuário, desenhadas em faces isométricas.
  function buildingDetails(b, A, B, C, D, z) {
    const wallAB = (t, depth) => ({
      x: A.x + (B.x - A.x) * t,
      y: A.y + (B.y - A.y) * t - z + depth
    });
    const wallBC = (t, depth) => ({
      x: B.x + (C.x - B.x) * t,
      y: B.y + (C.y - B.y) * t - z + depth
    });

    // Frisos de pavimentos e iluminação nas fachadas.
    if (z > 40) {
      const a = wallAB(0, z * .55);
      const bEnd = wallAB(1, z * .55);
      line(a, bEnd,
        b.type === "male" ? "#6656bb" :
        b.type === "central" ? "#134ca5" : "#ccd8d1", 6);
      line(wallBC(0, z * .55), wallBC(1, z * .55), "#527c81", 3);
      for (const depth of [z*.69, z*.86]) {
        for (let i=1; i<Math.max(3, b.w); i++) {
          const p = wallAB(i / Math.max(3,b.w), depth);
          polygon([
            {x:p.x-7,y:p.y-9},{x:p.x+6,y:p.y-2},
            {x:p.x+6,y:p.y+5},{x:p.x-7,y:p.y-2}
          ], "#315d77", "#e0ece6");
        }
      }
    }

    if (b.type === "female") {
      // Vidraça panorâmica com moldura vermelha.
      const frame = [wallAB(.05,8),wallAB(.95,8),
        wallAB(.95,z-12),wallAB(.05,z-12)];
      polygon(frame, "#79bbce", "#d83043");
      line(wallAB(.05,8), wallAB(.95,8), "#cf293f", 8);
      line(wallAB(.05,z-12), wallAB(.95,z-12), "#cf293f", 8);
      for (let k=1;k<7;k++) {
        line(wallAB(k/7,10), wallAB(k/7,z-14), "#dff6ffab", 2);
      }
      line(wallAB(.06,z*.51),wallAB(.94,z*.51),"#e8f6f1aa",2);
    }

    if (b.type === "male") {
      line(wallAB(0,z*.47),wallAB(1,z*.47),"#6c4bba",8);
      line(wallBC(0,z*.47),wallBC(1,z*.47),"#594ba8",6);
      line(wallAB(0,z*.19),wallAB(1,z*.19),"#37a486",6);
      // Coluna principal da entrada, inspirada na foto.
      const p = wallAB(.52,z-8);
      line({x:p.x-3,y:p.y-35},{x:p.x-3,y:p.y+5},"#72aaa0",9);
    }

    if (b.type === "school") {
      const l=wallAB(0,15), r=wallAB(1,15);
      line(l,r,"#236acc",12);
      line(wallAB(0,22),wallAB(1,22),"#b7d9e1",3);
      const p=wallAB(.72,z-5);
      ctx.fillStyle="#e4a24a";
      ctx.fillRect(p.x-10,p.y-17,20,16);
    }

    if (b.type === "restaurant") {
      const l=wallAB(.15,25), r=wallAB(.85,25);
      line(l,r,"#31393f",18);
      const p=wallAB(.5,22);
      ctx.font="bold 10px Arial";
      ctx.textAlign="center";
      ctx.fillStyle="#fff8db";
      ctx.fillText("RESTAURANTE",p.x,p.y+3);
    }

    if (b.type === "academic") {
      line(wallAB(0,z*.5),wallAB(1,z*.5),"#63819a",6);
      line(wallBC(0,z*.5),wallBC(1,z*.5),"#7298a4",5);
    }

    if (b.type === "sports") {
      // Cobertura curvada com arcos azuis.
      const center=P(b.x+b.w/2,b.y+b.h/2,z+22);
      ctx.save();
      ctx.strokeStyle="#1c68c1";
      ctx.lineWidth=6;
      ctx.beginPath();
      ctx.moveTo(center.x-75,center.y+30);
      ctx.quadraticCurveTo(center.x,center.y-62,center.x+75,center.y+30);
      ctx.stroke();
      ctx.strokeStyle="#e9e0c6";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(center.x-65,center.y+22);
      ctx.quadraticCurveTo(center.x,center.y-47,center.x+65,center.y+22);
      ctx.stroke();
      ctx.restore();
    }

    if (b.type === "central") {
      // Marquise laranja e azul e sinalização brilhante da missão.
      const door=wallAB(.52,z-4);
      line({x:door.x-21,y:door.y-22},{x:door.x+21,y:door.y-2},
           "#f29035",12);
      const mark=P(b.x+b.w/2,b.y+b.h+1);
      const pulse=1 + Math.sin(time*3)*.14;
      ellipse(mark.x,mark.y,15*pulse,6*pulse,"#ffd65c55");
      ellipse(mark.x,mark.y,8*pulse,3*pulse,"#ffe082");
      ctx.font="bold 20px Arial";
      ctx.textAlign="center";
      ctx.fillStyle="#ffca48";
      ctx.fillText("!",mark.x,mark.y-15-Math.sin(time*3)*3);
    }
  }

  function tree(t) {
    const p = P(t.x, t.y);
    const s = t.size;

    ellipse(p.x + 6, p.y + 4, 13 * s, 6 * s, "#315d3944");

    line(
      { x: p.x, y: p.y },
      { x: p.x, y: p.y - 26 * s },
      "#75583a",
      6 * s
    );

    polygon([
      { x: p.x, y: p.y - 67 * s },
      { x: p.x + 22 * s, y: p.y - 49 * s },
      { x: p.x + 21 * s, y: p.y - 30 * s },
      { x: p.x, y: p.y - 17 * s },
      { x: p.x - 22 * s, y: p.y - 30 * s },
      { x: p.x - 22 * s, y: p.y - 49 * s }
    ], "#367846");

    polygon([
      { x: p.x, y: p.y - 67 * s },
      { x: p.x + 22 * s, y: p.y - 49 * s },
      { x: p.x, y: p.y - 36 * s },
      { x: p.x - 22 * s, y: p.y - 49 * s }
    ], "#63a55a");
  }

  function palm(t) {
    const p = P(t.x, t.y);

    line(
      p,
      { x: p.x + 2, y: p.y - 55 },
      "#82643e",
      5
    );

    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;

      line(
        { x: p.x + 2, y: p.y - 56 },
        {
          x: p.x + 2 + Math.cos(a) * 23,
          y: p.y - 56 + Math.sin(a) * 13
        },
        "#3d8e4b",
        5
      );
    }
  }


  function character() {
    const p=P(player.x,player.y);
    const step=player.moving ? Math.sin(player.walk) : 0;
    const bob=player.moving ? Math.abs(Math.sin(player.walk))*2 : 0;
    const side=player.facing==="left" ? -1 : 1;
    ellipse(p.x+3,p.y+3,13,5,"#10282077");

    ctx.save();
    ctx.translate(p.x,p.y-bob);
    ctx.scale(side,1);
    ctx.lineCap="round";
    ctx.lineJoin="round";

    // Pernas com deslocamento alternado e tênis brancos.
    const leg=(x, swing)=>{
      ctx.strokeStyle="#273c66";
      ctx.lineWidth=7;
      ctx.beginPath();
      ctx.moveTo(x,-13);
      ctx.lineTo(x+swing,-3);
      ctx.stroke();
      ctx.strokeStyle="#f2dfc4";
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.moveTo(x+swing-2,-2);
      ctx.lineTo(x+swing+6,-2);
      ctx.stroke();
    };
    leg(-5,step*5);
    leg(5,-step*5);

    // Mochila, braços e uniforme.
    ctx.fillStyle="#1f394d";
    ctx.beginPath();
    ctx.roundRect(-15,-34,11,24,4); ctx.fill();
    ctx.strokeStyle="#dca96f";
    ctx.lineWidth=6;
    for (const arm of [-1,1]) {
      ctx.beginPath();
      ctx.moveTo(arm*10,-30);
      ctx.lineTo(arm*(12+step*3),-17+arm*step*3);
      ctx.stroke();
    }
    const shirt=ctx.createLinearGradient(-12,-36,11,-13);
    shirt.addColorStop(0,"#f6faf4");
    shirt.addColorStop(1,"#b6d5df");
    ctx.fillStyle=shirt;
    ctx.strokeStyle="#2c5975";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.roundRect(-12,-36,24,24,7);ctx.fill();ctx.stroke();
    ctx.fillStyle="#326eac";
    ctx.fillRect(-4,-26,8,3);
    ctx.fillStyle="#233d60";
    ctx.fillRect(-11,-15,22,4);

    // Pescoço e rosto em estilo RPG (em vez de blocos retangulares).
    ctx.fillStyle="#d89c6d";
    ctx.fillRect(-4,-43,8,9);
    ellipse(0,-49,13,15,"#b46e47");
    ellipse(0,-50,12,14,"#e4a67a");
    ellipse(-12,-50,3,4,"#d59268");
    ellipse(12,-50,3,4,"#d59268");
    for (const [x,y,r] of [[-10,-61,6],[-4,-65,7],[4,-64,7],[10,-60,6],[-13,-57,4]]) {
      ellipse(x,y,r,r*.8,"#3e2a28");
    }
    if(player.facing!=="up") {
      ellipse(-4,-50,1.6,2.1,"#202d35");
      ellipse(5,-50,1.6,2.1,"#202d35");
      line({x:-2,y:-43},{x:3,y:-43},"#995943",1.5);
      ellipse(-8,-46,3,1.5,"#ed917844");
    }
    ctx.restore();
  }

  // Flores e relva: detalhes independentes das colisões e das construções.
  function campusDecor() {
    for (let y=2;y<H-2;y+=2.2) {
      for (let x=2;x<W-2;x+=2.7) {
        const n=seeded(x*83+y*37);
        if (n<.45 || roadNear(x,y) ||
            sites.some(b=>inside(x,y,b,1))) continue;
        const p=P(x,y);
        line({x:p.x,y:p.y},{x:p.x-3,y:p.y-6}, "#3a894a", 1.5);
        line({x:p.x,y:p.y},{x:p.x+3,y:p.y-4}, "#4c9f50", 1.5);
        if (n>.77) {
          ellipse(p.x-2,p.y-7,3,2,n>.91?"#f0b2db":"#ffe59b");
          ellipse(p.x+2,p.y-6,2,2,"#fff2ca");
        }
      }
    }
    // Luminárias nos caminhos principais.
    [[13,37],[17,31],[12,30],[23,32],[12,21],[22,21],[26,20]]
      .forEach(([x,y])=>{
        const p=P(x,y);
        ellipse(p.x+3,p.y+2,7,3,"#233d3644");
        line(p,{x:p.x,y:p.y-29},"#34594e",3);
        ellipse(p.x,p.y-30,6,6,"#ffd86b33");
        ellipse(p.x,p.y-31,3,4,"#fff2ad");
      });
  }

  function gateway() {
    const p=P(20,42.7);
    // Portaria com a cobertura azul translúcida e duas colunas.
    ctx.save();
    ctx.shadowColor="#193b4144";
    ctx.shadowBlur=12;
    for (const dx of [-49,49]) {
      ctx.fillStyle="#e3ddbe";
      ctx.fillRect(p.x+dx-6,p.y-64,12,66);
      ctx.fillStyle="#2b7194";
      ctx.fillRect(p.x+dx-6,p.y-10,12,6);
    }
    ctx.shadowBlur=0;
    const roof=ctx.createLinearGradient(0,p.y-77,0,p.y-50);
    roof.addColorStop(0,"#97e5ef");
    roof.addColorStop(1,"#287ea5");
    ctx.fillStyle=roof;
    ctx.strokeStyle="#f6e5b2";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(p.x-63,p.y-67);
    ctx.lineTo(p.x+63,p.y-67);
    ctx.lineTo(p.x+52,p.y-52);
    ctx.lineTo(p.x-52,p.y-52);
    ctx.closePath(); ctx.fill();ctx.stroke();
    ctx.fillStyle="#f6edd2";
    ctx.fillRect(p.x-59,p.y-83,118,20);
    ctx.fillStyle="#23446e";
    ctx.textAlign="center";
    ctx.font="bold 10px Arial";
    ctx.fillText("FAAMA • ENTRADA",p.x,p.y-69);
    ctx.restore();
  }

  const miniCanvas=document.getElementById("miniMap");
  const miniCtx=miniCanvas?.getContext("2d");
  function drawMinimap() {
    if (!miniCtx) return;
    const m=miniCtx, sx=4,sy=3.65,ox=14,oy=10;
    m.clearRect(0,0,miniCanvas.width,miniCanvas.height);
    const ground=m.createLinearGradient(0,0,160,190);
    ground.addColorStop(0,"#79aa69");
    ground.addColorStop(1,"#315f54");
    m.fillStyle=ground;
    m.fillRect(0,0,miniCanvas.width,miniCanvas.height);
    m.strokeStyle="#d2be91";
    m.lineWidth=4;
    for (const road of roads) {
      m.beginPath();
      road.forEach(([x,y],i)=>{
        if (i===0) m.moveTo(ox+x*sx,oy+y*sy);
        else m.lineTo(ox+x*sx,oy+y*sy);
      });
      m.stroke();
    }
    for (const b of sites) {
      m.fillStyle=
        b.id==="pool"?"#49c5e4":
        b.id==="female"?"#e55b6e":
        b.id==="male"?"#8058b4":
        b.id==="central"?"#e4b74e":
        b.id==="restaurant"?"#6b7372":
        b.id==="school"?"#44b2d1":
        b.id==="academic"?"#c9dce1":
        "#f1e0b5";
      m.fillRect(ox+b.x*sx,oy+b.y*sy,b.w*sx,b.h*sy);
      m.strokeStyle="#203d3a";
      m.lineWidth=1;
      m.strokeRect(ox+b.x*sx,oy+b.y*sy,b.w*sx,b.h*sy);
    }
    const px=ox+player.x*sx,py=oy+player.y*sy;
    m.beginPath();m.arc(px,py,6,0,Math.PI*2);
    m.fillStyle="#f3dc65";m.fill();
    m.lineWidth=2;m.strokeStyle="#102d35";m.stroke();
    m.font="bold 13px Arial";
    m.textAlign="right";
    m.fillStyle="#fcf7e7";
    m.fillText("N ↑",158,17);
  }


  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);

    g.addColorStop(0, "#80bed6");
    g.addColorStop(0.55, "#c2e3df");
    g.addColorStop(1, "#e7ebc9");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SW, SH);

    ellipse(1000, 105, 65, 65, "#f7e4a6aa");
  }

  function cloud(x, y, s) {
    ellipse(x, y, 54 * s, 15 * s, "#fffdf2b3");
    ellipse(x + 27 * s, y - 12 * s, 32 * s, 21 * s, "#fffdf2c2");
    ellipse(x - 28 * s, y - 7 * s, 30 * s, 17 * s, "#fffdf2c2");
  }

  function show(text, seconds = 4) {
    if (!ui.toast) return;

    ui.toast.textContent = text;
    ui.toast.classList.remove("hidden");
    toastUntil = time + seconds;
  }

  function blocked(x, y) {
    return sites.some(s => inside(x, y, s, 0.2));
  }

  function nearest() {
    let found = null;
    let distance = 2.2;

    for (const s of sites) {
      const nx = Math.max(s.x, Math.min(player.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(player.y, s.y + s.h));

      const d = Math.hypot(player.x - nx, player.y - ny);

      if (d < distance) {
        found = s;
        distance = d;
      }
    }

    return found;
  }

  function interact() {
    if (near) {
      show(near.info, 6);
    } else {
      show("Aproxime-se de um prédio para conhecer a missão.");
    }
  }

  function update(dt) {
    let dx =
      Number(held.has("ArrowRight") || held.has("d")) -
      Number(held.has("ArrowLeft") || held.has("a"));

    let dy =
      Number(held.has("ArrowDown") || held.has("s")) -
      Number(held.has("ArrowUp") || held.has("w"));

    const length = Math.hypot(dx, dy) || 1;

    dx = dx / length * player.speed * dt;
    dy = dy / length * player.speed * dt;

    const nx = Math.max(0.5, Math.min(W - 0.5, player.x + dx));
    const ny = Math.max(0.5, Math.min(H - 0.5, player.y + dy));

    if (!blocked(nx, player.y)) player.x = nx;
    if (!blocked(player.x, ny)) player.y = ny;

    player.moving = Boolean(dx || dy);
    if (player.moving) {
      player.walk += dt * 12;
      player.facing = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");
    }

    near = nearest();

    if (ui.location) {
      ui.location.textContent = near
        ? near.name
        : player.y > 38
          ? "ENTRADA DA FAAMA"
          : "CAMPUS DA FAAMA";
    }

    if (ui.interact) {
      ui.interact.disabled = !near;
    }

    if (ui.objective) {
      ui.objective.textContent = near
        ? "[E] Conhecer: " + (near.short || near.name)
        : "Visite o Prédio Central e conheça a FAAMA";
    }
  }

  function render(ms) {
    try {
      const dt = Math.min((ms - previous) / 1000 || 0, 0.05);

      previous = ms;
      time += dt;

      update(dt);

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      sky();

      cloud((time * 10 + 180) % (SW + 240) - 120, 100, 1.15);
      cloud((time * 7 + 740) % (SW + 240) - 120, 165, 0.8);
      cloud((time * 6 + 1050) % (SW + 240) - 120, 64, 0.65);

      const focus = iso(player.x, player.y);
      // Visão geral na entrada; a câmera segue quando o jogador
      // se aproxima das bordas da região visível.
      const overview = iso(18, 24.5);
      const follow = (axis, safe) => {
        const distance=focus[axis]-overview[axis];
        return overview[axis] + Math.sign(distance) *
          Math.max(0, Math.abs(distance)-safe/zoom);
      };
      const targetX=follow("x", SW*.39);
      const targetY=follow("y", SH*.39);
      const smoothing=1-Math.exp(-Math.min(dt,.05)*8);
      camera.x += (targetX-camera.x)*smoothing;
      camera.y += (targetY-camera.y)*smoothing;

      ctx.save();

      ctx.translate(SW / 2, SH / 2 + 55);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      ground();
      drawRoads();
      plazas();
      campusDecor();

      const objects = [
        ...trees.map(t => ({
          depth: t.y + t.x * .02,
          draw: () => tree(t)
        })),
        ...palms.map(t => ({
          depth: t.y + t.x * .02,
          draw: () => palm(t)
        })),
        ...sites.map(s => ({
          depth: s.y + s.h + s.x * .02,
          draw: () => building(s)
        })),
        {
          depth: player.y + player.x * .02,
          draw: character
        },
        {
          depth: 43.7,
          draw: gateway
        }
      ].sort((a, b) => a.depth - b.depth);

      objects.forEach(o => o.draw());

      ctx.restore();
      drawMinimap();

      if (ui.toast && time > toastUntil) {
        ui.toast.classList.add("hidden");
      }

      requestAnimationFrame(render);

    } catch (error) {
      console.error("Erro no FAAMA Explorer:", error);

      if (ui.fatal) {
        ui.fatal.textContent = "Erro no cenário: " + error.message;
        ui.fatal.classList.remove("hidden");
      }
    }
  }

  const allowed = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "w", "a", "s", "d"
  ]);

  window.addEventListener("keydown", e => {
    const k = e.key.length === 1
      ? e.key.toLowerCase()
      : e.key;

    if (k === "e" && !e.repeat) {
      interact();
    }

    if (allowed.has(k)) {
      held.add(k);
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", e => {
    const k = e.key.length === 1
      ? e.key.toLowerCase()
      : e.key;

    held.delete(k);
  });

  window.addEventListener("blur", () => {
    held.clear();
  });

  document.querySelectorAll("[data-key]").forEach(btn => {
    const k = btn.dataset.key;

    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      held.add(k);
      btn.setPointerCapture(e.pointerId);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(evento => {
      btn.addEventListener(evento, () => held.delete(k));
    });
  });

  if (ui.interact) {
    ui.interact.addEventListener("click", interact);
  }

  const reset = document.getElementById("reset");

  if (reset) {
    reset.addEventListener("click", () => {
      player.x = 20;
      player.y = 42;
      show("Você voltou à entrada da FAAMA.");
    });
  }

  function changeZoom(d) {
    zoom = Math.max(
      0.7,
      Math.min(1.6, Math.round((zoom + d) * 10) / 10)
    );

    if (ui.zoom) {
      ui.zoom.textContent = Math.round(zoom * 100) + "%";
    }
  }

  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");

  if (zoomIn) {
    zoomIn.addEventListener("click", () => changeZoom(0.1));
  }

  if (zoomOut) {
    zoomOut.addEventListener("click", () => changeZoom(-0.1));
  }

  console.log("FAAMA Explorer: JavaScript iniciado!");

  requestAnimationFrame(render);
})();
