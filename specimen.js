// Specimen MOSS-01: a pale, ceramic-like bloom, overgrown by moss, ferns and
// small white flowers - grown live when the page opens, then breathing.
//
//   0-2.5s  the bloom opens
//   0.6-7s  moss creeps outwards from the centre and over the petal edges
//   2-7.5s  ferns unfurl around the rim
//   4-8.5s  small flowers open in the moss
// A scan line sweeps over it now and then. With "reduce motion" on, it is
// drawn once, fully grown.
(function () {
  const canvas = document.getElementById("specimen");
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  let W, H, dpr, cx, cy, R;
  let moss = [], ferns = [], flowers = [], petals = [], stamens = [];
  let mossLayer, mossCtx, mossDrawn = 0;

  // A small seeded random, so the specimen looks the same on every visit.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const between = (a, b) => a + rand() * (b - a);
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
  const phase = (t, a, b) => ease((t - a) / (b - a));

  // Lumpy outline of the overgrowth: radius as a function of angle.
  const edge = (a) => 1 + 0.12 * Math.sin(a * 3 + 0.6) + 0.08 * Math.sin(a * 7 + 2.1) + 0.05 * Math.sin(a * 13 + 4);

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phone = W < 860;
    cx = W / 2; cy = phone ? H * 0.53 : H * 0.47;
    R = Math.min(W * (phone ? 0.4 : 0.26), H * (phone ? 0.21 : 0.29));

    seed = 7;
    petals = Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * TAU + between(-0.12, 0.12) - Math.PI / 2, len: R * between(0.84, 0.95), wid: between(0.3, 0.38) }));
    stamens = Array.from({ length: 70 }, () => ({ a: rand() * TAU, d: Math.sqrt(rand()) * R * 0.11, h: between(0.4, 1) }));

    // Moss grows in fuzzy cushions around and between the petals, creeping
    // only a little onto their edges, so the bloom stays the centre.
    const onPetal = (a, d) => petals.some((p) => {
      const u = d / p.len;
      if (u >= 0.97) return false;
      let da = Math.abs(a - p.a) % TAU; if (da > Math.PI) da = TAU - da;
      return da < p.wid * 1.15 * Math.pow(1 - u, 0.45) * Math.min(1, u * 6);
    });
    const n = phone ? 520 : 950;
    moss = [];
    while (moss.length < n) {
      const a = rand() * TAU, e = edge(a);
      const d = R * e * (0.3 + Math.pow(rand(), 0.7) * 0.78);
      if (onPetal(a, d) && rand() < 0.93) continue;
      moss.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.94, d, r: between(7, 17) * (R / 260), tone: rand() });
    }
    moss.sort((p, q) => p.d - q.d);

    ferns = [];
    for (let i = 0; i < (phone ? 34 : 56); i++) {
      const a = (i / (phone ? 34 : 56)) * TAU + between(-0.1, 0.1);
      const e = edge(a);
      ferns.push({ a, base: R * e * between(0.78, 0.95), len: R * between(0.22, 0.42), curl: between(-0.5, 0.5), seed: rand() * 10, t0: 2 + rand() * 3 });
    }

    flowers = [];
    for (let i = 0; i < (phone ? 34 : 60); i++) {
      const a = rand() * TAU, d = R * edge(a) * between(0.38, 0.95);
      flowers.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.94, s: between(3.5, 8) * (R / 260), rot: rand() * TAU, t0: 4 + rand() * 4 });
    }

    // Moss is drawn once onto its own layer as it grows, not every frame.
    mossLayer = document.createElement("canvas");
    mossLayer.width = canvas.width; mossLayer.height = canvas.height;
    mossCtx = mossLayer.getContext("2d");
    mossCtx.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);
    mossDrawn = 0;
  }

  function petalPath(len, wid) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.35, -len * wid, len * 0.82, -len * wid * 0.5, len, 0);
    ctx.bezierCurveTo(len * 0.82, len * wid * 0.5, len * 0.35, len * wid, 0, 0);
  }

  function drawPetals(open) {
    for (const p of petals) {
      const len = p.len * (0.55 + 0.45 * open);
      ctx.save();
      ctx.rotate(p.a);
      ctx.globalAlpha = 0.3 + 0.7 * open;
      // Glazed, creamy ceramic: light at the heart, deeper towards the edges.
      const g = ctx.createRadialGradient(len * 0.3, -len * p.wid * 0.15, len * 0.05, len * 0.4, 0, len * 0.75);
      g.addColorStop(0, "#fbf9f1");
      g.addColorStop(0.55, "#e6e6d6");
      g.addColorStop(1, "#b9bfa8");
      ctx.fillStyle = g;
      petalPath(len, p.wid);
      ctx.fill();
      ctx.strokeStyle = "rgba(150, 160, 132, 0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // A few soft ridges running out along the petal.
      ctx.strokeStyle = "rgba(140, 150, 125, 0.2)";
      ctx.lineWidth = 1.2;
      for (const k of [-2, -1, 0, 1, 2]) {
        ctx.beginPath();
        ctx.moveTo(len * 0.18, k * len * p.wid * 0.08);
        ctx.quadraticCurveTo(len * 0.55, k * len * p.wid * 0.18, len * 0.9, k * len * p.wid * 0.05);
        ctx.stroke();
      }
      // The glaze's highlight.
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(len * 0.2, -len * p.wid * 0.3);
      ctx.quadraticCurveTo(len * 0.5, -len * p.wid * 0.46, len * 0.74, -len * p.wid * 0.3);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function clump(m) {
    const c = mossCtx, r = m.r;
    // A soft, dark mound underneath...
    const g = c.createRadialGradient(m.x - r * 0.2, m.y - r * 0.25, 0, m.x, m.y, r * 1.15);
    g.addColorStop(0, m.tone < 0.5 ? "rgba(46, 104, 46, 0.95)" : "rgba(38, 92, 40, 0.95)");
    g.addColorStop(0.7, "rgba(20, 58, 26, 0.9)");
    g.addColorStop(1, "rgba(10, 32, 14, 0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(m.x, m.y, r * 1.15, 0, TAU); c.fill();
    // ...covered in tiny strands, brighter where the light catches the top.
    const dots = Math.round(r * 3.2);
    for (let k = 0; k < dots; k++) {
      const a = rand() * TAU, d = r * Math.sqrt(rand());
      const x = m.x + Math.cos(a) * d, y = m.y + Math.sin(a) * d * 0.9;
      const lit = 0.5 - (Math.cos(a) * d + Math.sin(a) * d) / (2 * r * 1.4) + (rand() - 0.5) * 0.4;
      c.fillStyle = lit > 0.85 ? "#b5e08a" : lit > 0.62 ? "#7dc25c" : lit > 0.4 ? "#4f9a43" : lit > 0.2 ? "#357a35" : "#245a28";
      c.beginPath(); c.arc(x, y, r * between(0.045, 0.1), 0, TAU); c.fill();
    }
  }

  function growMoss(t) {
    const target = Math.floor(moss.length * phase(t, 0.6, 7));
    for (; mossDrawn < target; mossDrawn++) clump(moss[mossDrawn]);
    return target / moss.length;
  }

  function drawFern(f, t) {
    const grow = phase(t, f.t0, f.t0 + 2.5);
    if (grow <= 0) return;
    const sway = still ? 0 : Math.sin(t * 0.7 + f.seed) * 0.05;
    const len = f.len * grow;
    ctx.save();
    ctx.rotate(f.a + sway);
    ctx.translate(f.base, 0);
    ctx.strokeStyle = "#3f8a3a";
    ctx.lineWidth = 1.2;
    const steps = 16;
    let px = 0, py = 0;
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const x = u * len, y = Math.sin(u * 2.4) * f.curl * len * 0.35 * u;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      // Leaflets on both sides, shrinking towards the tip (and unfurling last there).
      const leaf = (1 - u) * len * 0.22 * Math.min(1, grow * 1.4 - u * 0.4);
      if (leaf > 0.5) {
        ctx.fillStyle = i % 3 ? "#4f9a40" : "#6db554";
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(side * 1.05);
          ctx.beginPath(); ctx.ellipse(leaf * 0.5, 0, leaf * 0.5, leaf * 0.16, 0, 0, TAU); ctx.fill();
          ctx.restore();
        }
      }
      px = x; py = y;
    }
    ctx.restore();
  }

  function drawFlower(f, t) {
    const open = phase(t, f.t0, f.t0 + 1.6);
    if (open <= 0) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    const s = f.s * open;
    ctx.fillStyle = "#f3f5ec";
    for (let k = 0; k < 5; k++) {
      ctx.rotate(TAU / 5);
      ctx.beginPath(); ctx.ellipse(s * 0.55, 0, s * 0.55, s * 0.28, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#c9c27a";
    ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);
    const breathe = still ? 1 : 1 + Math.sin(t * 0.5) * 0.006;
    ctx.scale(breathe, breathe);

    // A dark, damp base under everything.
    const base = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.15);
    base.addColorStop(0, "rgba(18, 40, 22, 0.9)");
    base.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.15 * phase(t, 0, 3), 0, TAU); ctx.fill();

    drawPetals(phase(t, 0, 2.5));
    const coverage = growMoss(t);
    ctx.restore();
    ctx.drawImage(mossLayer, 0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(breathe, breathe);

    for (const f of ferns) drawFern(f, t);
    for (const f of flowers) drawFlower(f, t);

    // Stamens at the heart of the bloom.
    const st = phase(t, 1.2, 3.5);
    for (const s of stamens) {
      const x = Math.cos(s.a) * s.d, y = Math.sin(s.a) * s.d;
      ctx.strokeStyle = "rgba(215, 225, 190, 0.85)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x * 0.3, y * 0.3); ctx.lineTo(x, y - s.h * R * 0.05 * st); ctx.stroke();
      ctx.fillStyle = "#efe8c8";
      ctx.beginPath(); ctx.arc(x, y - s.h * R * 0.05 * st, 1.4 * st, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // Scanner sweep across the specimen every few seconds.
    if (!still) {
      const sweep = ((t - 1) % 7) / 2.4;
      if (sweep >= 0 && sweep <= 1) {
        const y = cy - R * 1.2 + sweep * R * 2.4;
        const g = ctx.createLinearGradient(0, y - 30, 0, y + 2);
        g.addColorStop(0, "rgba(156, 245, 154, 0)");
        g.addColorStop(1, "rgba(156, 245, 154, 0.22)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - R * 1.3, y - 30, R * 2.6, 32);
        ctx.fillStyle = "rgba(190, 255, 190, 0.6)";
        ctx.fillRect(cx - R * 1.3, y, R * 2.6, 1);
      }
    }
    canvas.dataset.coverage = (coverage * 100).toFixed(1);
  }

  let start = performance.now(), running = true;
  function frame(now) {
    if (!running) return;
    draw((now - start) / 1000);
    canvas.dataset.frames = String((+canvas.dataset.frames || 0) + 1);
    requestAnimationFrame(frame);
  }

  setup();
  if (still) { draw(30); canvas.dataset.frames = "1"; }
  else requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    const grownFor = (performance.now() - start) / 1000;
    setup();
    if (still) draw(30); else growMoss(grownFor);
  });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !still) requestAnimationFrame(frame);
  });
})();
