// The swamp at night: two soft treelines, layers of drifting mist, reeds
// swaying at the water's edge, fireflies that wander and pulse (and drift
// towards a pointer), and their reflections shimmering in still water.
// Plain 2D canvas, no libraries.
(function () {
  const canvas = document.getElementById("swamp");
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, horizon = 0, waterTop = 0;
  let mist = [], flies = [], crowns = [], reeds = [];
  const pointer = { x: -1e4, y: -1e4, active: false };

  // Smooth pseudo-random wander, so nothing moves in straight lines.
  const wave = (t, a, b, c) => Math.sin(t * a + c) * 0.6 + Math.sin(t * b + c * 1.7) * 0.4;

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizon = H * 0.64;
    waterTop = H * 0.82;

    // Tree crowns: rounded shapes along the horizon, far (hazy) and near.
    crowns = [];
    for (const [layer, base, size] of [[0, horizon - H * 0.035, 0.75], [1, horizon + H * 0.02, 1]]) {
      for (let x = -40; x < W + 60; x += 26 + Math.random() * 30) {
        crowns.push({ layer, x, y: base - Math.random() * 40 * size, r: (22 + Math.random() * 34) * size });
      }
    }

    // Reeds: clusters of thin blades at both edges, a few scattered between.
    reeds = [];
    const cluster = (cx, spread, n) => {
      for (let i = 0; i < n; i++) {
        reeds.push({ x: cx + (Math.random() - 0.5) * spread, h: 50 + Math.random() * Math.min(190, H * 0.24), lean: (Math.random() - 0.5) * 0.5, w: 1.4 + Math.random() * 2.2, seed: Math.random() * 10 });
      }
    };
    cluster(W * 0.06, W * 0.18, Math.round(16 + W / 90));
    cluster(W * 0.94, W * 0.18, Math.round(16 + W / 90));
    for (let i = 0; i < Math.round(W / 140); i++) cluster(W * (0.2 + Math.random() * 0.6), 40, 3);

    mist = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * W,
      y: horizon - H * 0.12 + Math.random() * H * 0.3,
      r: Math.max(W, H) * (0.22 + Math.random() * 0.28),
      speed: (4 + Math.random() * 9) * (i % 2 ? 1 : -1),
      alpha: 0.035 + Math.random() * 0.045,
    }));

    const count = Math.round(Math.min(46, Math.max(18, (W * H) / 32000)));
    flies = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: H * 0.2 + Math.random() * (waterTop - H * 0.22),
      vx: 0, vy: 0,
      seed: Math.random() * 100,
      size: 0.7 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      rate: 0.6 + Math.random() * 1.2,
    }));
  }

  function glow(x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(236, 255, 196, ${a})`);
    g.addColorStop(0.25, `rgba(190, 245, 140, ${a * 0.55})`);
    g.addColorStop(1, "rgba(150, 230, 110, 0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function draw(t) {
    // Sky: near-black green, a touch lighter towards the horizon.
    const sky = ctx.createLinearGradient(0, 0, 0, waterTop);
    sky.addColorStop(0, "#030705");
    sky.addColorStop(0.75, "#0a1710");
    sky.addColorStop(1, "#0f2117");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, waterTop);

    // A faint moon-glow behind the mist.
    const moon = ctx.createRadialGradient(W * 0.5, horizon - H * 0.22, 0, W * 0.5, horizon - H * 0.22, Math.max(W, H) * 0.45);
    moon.addColorStop(0, "rgba(140, 190, 150, 0.10)");
    moon.addColorStop(1, "rgba(140, 190, 150, 0)");
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, W, waterTop);

    // Treelines: a hazy far layer, then a darker near one.
    for (const layer of [0, 1]) {
      ctx.save();
      if (layer === 0) ctx.filter = "blur(3px)";
      ctx.fillStyle = layer === 0 ? "#0c1c13" : "#050c08";
      ctx.beginPath();
      for (const c of crowns) if (c.layer === layer) { ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); }
      ctx.fill();
      ctx.fillRect(0, layer === 0 ? horizon - H * 0.04 : horizon + H * 0.02, W, waterTop);
      ctx.restore();
    }

    // Water.
    const water = ctx.createLinearGradient(0, waterTop, 0, H);
    water.addColorStop(0, "#08130d");
    water.addColorStop(1, "#020403");
    ctx.fillStyle = water;
    ctx.fillRect(0, waterTop, W, H - waterTop);

    // Mist, drifting slowly sideways over the horizon.
    for (const m of mist) {
      const x = ((m.x + m.speed * t) % (W + m.r * 2) + (W + m.r * 2)) % (W + m.r * 2) - m.r;
      const y = m.y + wave(t * 0.05, 1, 1.7, m.x) * 12;
      const g = ctx.createRadialGradient(x, y, 0, x, y, m.r);
      g.addColorStop(0, `rgba(190, 215, 195, ${m.alpha})`);
      g.addColorStop(1, "rgba(190, 215, 195, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - m.r, y - m.r, m.r * 2, m.r * 2);
    }

    // Fireflies, and their reflections in the water.
    for (const f of flies) {
      if (!still) {
        const ax = wave(t * 0.35 + f.seed, 0.9, 1.6, f.seed) * 0.04;
        const ay = wave(t * 0.3 + f.seed * 2, 1.1, 1.9, f.seed) * 0.03;
        f.vx += ax; f.vy += ay;
        if (pointer.active) {
          const dx = pointer.x - f.x, dy = pointer.y - f.y, d = Math.hypot(dx, dy);
          if (d < 260 && d > 1) { f.vx += (dx / d) * 0.02; f.vy += (dy / d) * 0.02; }
        }
        f.vx *= 0.96; f.vy *= 0.96;
        f.x += f.vx; f.y += f.vy;
        if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
        if (f.y < H * 0.12) f.vy += 0.05;
        if (f.y > waterTop - 8) f.vy -= 0.06;
      }
      const pulse = Math.pow(Math.max(0, Math.sin(t * f.rate + f.phase)), 3);
      const a = 0.18 + pulse * 0.82;
      glow(f.x, f.y, (9 + pulse * 10) * f.size, a * 0.9);
      ctx.fillStyle = `rgba(250, 255, 230, ${0.35 + pulse * 0.65})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, 1.3 * f.size, 0, Math.PI * 2); ctx.fill();

      // Reflection: mirrored about the waterline, fainter and stretched.
      const ry = waterTop + (waterTop - f.y) * 0.55;
      if (ry < H) {
        ctx.save();
        ctx.translate(f.x + Math.sin(t * 1.4 + f.seed) * 2, ry);
        ctx.scale(1.8, 0.5);
        glow(0, 0, (8 + pulse * 8) * f.size, a * 0.28);
        ctx.restore();
      }
    }

    // Reeds, swaying, with a faint reflection.
    for (const r of reeds) {
      const sway = (still ? 0 : Math.sin(t * 0.6 + r.seed) * 6) + r.lean * r.h * 0.3;
      for (const [dir, alpha] of [[-1, 1], [1, 0.18]]) {
        ctx.strokeStyle = dir < 0 ? "#020503" : `rgba(2, 5, 3, ${alpha})`;
        ctx.lineWidth = r.w;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(r.x, waterTop);
        ctx.quadraticCurveTo(r.x + sway * 0.3, waterTop + dir * r.h * 0.55, r.x + sway, waterTop + dir * r.h * (dir < 0 ? 1 : 0.5));
        ctx.stroke();
      }
    }

    // Shimmer on the water.
    ctx.strokeStyle = "rgba(170, 220, 180, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = waterTop + 6 + ((i * 37) % Math.max(1, H - waterTop - 10));
      const x = ((i * 191 + t * (10 + i)) % (W + 200)) - 100;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + (i % 4) * 30, y); ctx.stroke();
    }
  }

  let start = performance.now(), running = true;
  function frame(now) {
    if (!running) return;
    draw((now - start) / 1000);
    canvas.dataset.frames = String((+canvas.dataset.frames || 0) + 1);
    if (!still) requestAnimationFrame(frame);
  }

  setup();
  if (still) { draw(12); canvas.dataset.frames = "1"; }
  else requestAnimationFrame(frame);

  window.addEventListener("resize", () => { setup(); if (still) draw(12); });
  window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; });
  window.addEventListener("pointerleave", () => { pointer.active = false; });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !still) requestAnimationFrame(frame);
  });
})();
