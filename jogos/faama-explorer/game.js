
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

  const sites = [
    {
      id: "pool",
      name: "PISCINA",
      x: 9, y: 6, w: 5, h: 3, z: 10,
      roof: "#d4d7c4",
      wall: "#f2f0dc",
      side: "#b6c5ac",
      type: "pool",
      info: "Piscina e área esportiva da FAAMA."
    },
    {
      id: "female",
      name: "RESIDENCIAL FEMININO",
      x: 16, y: 8, w: 5, h: 5, z: 65,
      roof: "#3d777b",
      wall: "#e4e9dd",
      side: "#9abcb1",
      type: "female",
      info: "Residencial feminino. Futuramente, parte da fase do labirinto."
    },
    {
      id: "male",
      name: "RESIDENCIAL MASCULINO",
      x: 27, y: 20, w: 5, h: 5, z: 65,
      roof: "#4c7773",
      wall: "#e9dfcb",
      side: "#bcae91",
      type: "male",
      info: "Residencial masculino. Futuramente, parte da fase do labirinto."
    },
    {
      id: "central",
      name: "PRÉDIO CENTRAL",
      x: 16, y: 24, w: 5, h: 4, z: 86,
      roof: "#2c8e83",
      wall: "#e2b348",
      side: "#d47e3c",
      type: "central",
      info: "Fase 1: fuja dos quero-queros, capivaras e Afuá e encontre a chave do Prédio Escolar."
    },
    {
      id: "academic",
      name: "PRÉDIO ACADÊMICO",
      x: 22, y: 32, w: 6, h: 4, z: 64,
      roof: "#42796b",
      wall: "#e5e5d7",
      side: "#b5c6b8",
      type: "academic",
      info: "Prédio acadêmico. A missão será definida depois."
    },
    {
      id: "school",
      name: "FAAMINHA • ESCOLA",
      x: 4, y: 27, w: 6, h: 5, z: 58,
      roof: "#498779",
      wall: "#f0ead9",
      side: "#c3c7b1",
      type: "school",
      info: "Fase 2: encontre os alunos escondidos nos banheiros."
    },
    {
      id: "church",
      name: "IGREJA DA FAAMA",
      x: 5, y: 39, w: 6, h: 3, z: 85,
      roof: "#405b65",
      wall: "#eee6d8",
      side: "#b9b6a9",
      type: "church",
      info: "Fase final: chegue à igreja e conclua a aventura."
    },
    {
      id: "sports",
      name: "COMPLEXO ESPORTIVO",
      x: 3, y: 12, w: 6, h: 5, z: 25,
      roof: "#397a82",
      wall: "#cbd6c6",
      side: "#a7b7a9",
      type: "sports",
      info: "Fase 3: administre sua energia e supere os desafios esportivos."
    }
  ];

  const player = {
    x: 15,
    y: 42,
    speed: 5,
    walk: 0
  };

  const held = new Set();

  let zoom = 1;
  let time = 0;
  let previous = 0;
  let toastUntil = 0;
  let near = null;

  const camera = { x: 0, y: 0 };

  const roads = [
    [[14, 43], [14, 36], [16, 31], [17, 27], [16, 19], [13, 15], [11, 10]],
    [[14, 36], [7, 34], [4, 30], [4, 23], [5, 15], [9, 10]],
    [[14, 36], [23, 38], [29, 34], [31, 25], [29, 19], [25, 12], [20, 8]],
    [[4, 23], [12, 21], [19, 21], [28, 21]],
    [[14, 36], [16, 30], [21, 27], [27, 22]],
    [[7, 34], [5, 39]]
  ];

  function iso(x, y, z = 0) {
    return {
      x: (x - y) * TW / 2,
      y: (x + y) * TH / 2 - z
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
    const p = P(x, y);

    polygon([
      { x: p.x, y: p.y - TH / 2 },
      { x: p.x + TW / 2, y: p.y },
      { x: p.x, y: p.y + TH / 2 },
      { x: p.x - TW / 2, y: p.y }
    ], color);
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

  const trees = [];

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const n = seeded(x * 23 + y * 79);

      const pertoDePredio = sites.some(s =>
        inside(x, y, s, 1.8)
      );

      if (n > 0.77 && !pertoDePredio && !roadNear(x, y)) {
        trees.push({
          x: x + 0.25,
          y: y + 0.25,
          size: 0.75 + seeded(x * 41 + y * 13) * 0.5
        });
      }
    }
  }

  const palms = [
    { x: 12, y: 25 },
    { x: 13, y: 29 },
    { x: 22, y: 24 },
    { x: 24, y: 28 },
    { x: 12, y: 35 }
  ];

  function ground() {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = seeded(x * 7 + y * 47);

        const color =
          n > 0.91 ? "#8fbf6a" :
          n > 0.5 ? "#83b962" :
          "#7caf5c";

        tile(x, y, color);
      }
    }

    line(P(0, H), P(W, H), "#668c5c", 7);
  }

  function drawRoads() {
    for (const road of roads) {
      for (let i = 0; i < road.length - 1; i++) {
        const a = P(...road[i]);
        const b = P(...road[i + 1]);

        line(a, b, "#7c866e", 30);
        line(a, b, "#c5bfa4", 24);
        line(a, b, "#d8ceb3", 19);
      }
    }

    // PA-391 ao sul da entrada
    const a = P(-2, 45);
    const b = P(36, 45);

    line(a, b, "#6c7372", 48);
    line(a, b, "#d0d1bc", 43);
    line(a, b, "#626b70", 35);
    line(a, b, "#e3d6a3", 2);
  }

  function garden(x, y, r = 1) {
    const p = P(x, y);

    ellipse(p.x, p.y, r * TW * 0.5, r * TH * 0.55, "#cfc7a4");
    ellipse(p.x, p.y - 2, r * TW * 0.39, r * TH * 0.42, "#438a50");

    for (let i = 0; i < 5; i++) {
      const a = i * 1.256;

      ellipse(
        p.x + Math.cos(a) * r * 7,
        p.y - 2 + Math.sin(a) * r * 3,
        2.6,
        1.8,
        i % 2 ? "#edc978" : "#f6e8c2"
      );
    }
  }

  function plazas() {
    garden(16, 29, 2.5);
    garden(17, 30, 1.1);
    garden(14, 32, 1.2);
    garden(18, 33, 1.1);
    garden(10, 24, 1.1);
    garden(12, 22, 1.1);
  }

  function building(b) {
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

    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#12372be6";
    ctx.strokeText(b.name, center.x, center.y);
    ctx.fillStyle = "#fff9e8";
    ctx.fillText(b.name, center.x, center.y);
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
    const p = P(player.x, player.y);
    const bob = held.size ? Math.sin(player.walk) * 2 : 0;

    ellipse(p.x + 2, p.y + 3, 12, 5, "#193e2d88");

    ctx.fillStyle = "#26374c";
    ctx.fillRect(p.x - 7, p.y - 8 + bob, 6, 9);
    ctx.fillRect(p.x + 2, p.y - 8 - bob, 6, 9);

    ctx.fillStyle = "#315da5";
    ctx.fillRect(p.x - 10, p.y - 31 + bob, 20, 24);

    ctx.fillStyle = "#bb793f";
    ctx.fillRect(p.x - 13, p.y - 29 + bob, 5, 17);

    ctx.fillStyle = "#e9bd90";
    ctx.fillRect(p.x - 9, p.y - 46 + bob, 18, 16);

    ctx.fillStyle = "#44312c";
    ctx.fillRect(p.x - 10, p.y - 49 + bob, 20, 7);

    ctx.fillStyle = "#f8eac9";
    ctx.fillRect(p.x + 3, p.y - 40 + bob, 3, 3);
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

    if (dx || dy) {
      player.walk += dt * 12;
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
        ? "Pressione E para conhecer este local"
        : "Explore o campus e encontre o Prédio Central";
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

      camera.x = focus.x;
      camera.y = focus.y;

      ctx.save();

      ctx.translate(SW / 2, SH / 2 + 55);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      ground();
      drawRoads();
      plazas();

      const objects = [
        ...trees.map(t => ({
          depth: t.x + t.y,
          draw: () => tree(t)
        })),
        ...palms.map(t => ({
          depth: t.x + t.y,
          draw: () => palm(t)
        })),
        ...sites.map(s => ({
          depth: s.x + s.y + s.w + s.h,
          draw: () => building(s)
        })),
        {
          depth: player.x + player.y,
          draw: character
        }
      ].sort((a, b) => a.depth - b.depth);

      objects.forEach(o => o.draw());

      ctx.restore();

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
      player.x = 15;
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
