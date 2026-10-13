// The terminal around the specimen: live readouts, telemetry, a BPM gauge,
// a survey map of the swamp, a spectrum and a reticle that tracks the pointer.
(function () {
  const $ = (id) => document.getElementById(id);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PHOS = "#9cf59a", DIM = "rgba(95, 174, 99, 0.8)", FAINT = "rgba(156, 245, 154, 0.18)";
  const start = performance.now();

  function sized(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* ---------- Readouts ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  function readouts(t) {
    $("clock").textContent = `${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}`;
    $("v-cov").textContent = String($("specimen").dataset.coverage || "0.0").padStart(4, "0");
    $("v-hum").textContent = (98 + Math.sin(t * 0.7) * 0.6).toFixed(1);
    $("v-sig").textContent = String(Math.round(-48 + Math.sin(t * 1.3) * 4 + Math.sin(t * 3.1) * 2));
  }

  /* ---------- Telemetry feed ---------- */
  const LINES = [
    "spore.dispersal ........ ok", "substrate.ph ............ 5.8", "root.freq ........... 42.0 hz",
    "canopy.humidity ........ 98%", "bassline.root .......... A1", "frond.unfurl ........ nominal",
    "mycelium.link ...... stable", "kick.pattern ......... 4/4", "lux.ambient ........... 0.3",
    "bloom.state ......... open", "waterline .......... -0.4 m", "signal.carrier ..... locked",
    "chlorophyll ........ rising", "tempo.sync .......... 124", "transmission ......... soon",
  ];
  const feed = $("feed");
  let li = 0;
  function pushLine() {
    const el = document.createElement("li");
    el.textContent = `> ${LINES[li++ % LINES.length]}`;
    feed.appendChild(el);
    while (feed.children.length > 12) feed.firstChild.remove();
  }
  for (let i = 0; i < 9; i++) pushLine();

  /* ---------- BPM gauge ---------- */
  function gauge(t) {
    const s = sized($("gauge")); if (!s) return;
    const { ctx, w, h } = s, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 8;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
    for (const k of [1, 0.72, 0.42]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
      ctx.strokeStyle = long ? DIM : FAINT;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * (long ? 0.86 : 0.92), cy + Math.sin(a) * r * (long ? 0.86 : 0.92));
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
    // One sweep per beat at 124 bpm, and a slower outer hand.
    const beat = (t * 124) / 60;
    for (const [a, len, col] of [[(beat % 1) * Math.PI * 2 - Math.PI / 2, 0.9, PHOS], [((t / 16) % 1) * Math.PI * 2 - Math.PI / 2, 0.6, DIM]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * len, cy + Math.sin(a) * r * len); ctx.stroke();
    }
    const pulse = Math.pow(1 - (beat % 1), 4);
    ctx.fillStyle = `rgba(156, 245, 154, ${0.25 + pulse * 0.75})`;
    ctx.beginPath(); ctx.arc(cx, cy, 3 + pulse * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PHOS; ctx.font = "18px VT323, monospace"; ctx.textAlign = "left";
    ctx.fillText("124 BPM", 4, h - 4);
  }

  /* ---------- Survey map: land, waterways, a scan grid ---------- */
  let mapImage = null;
  function buildMap() {
    const s = sized($("map")); if (!s) return;
    const { w, h } = s;
    const px = 3, cols = Math.ceil(w / px), rows = Math.ceil(h / px);
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const o = off.getContext("2d");
    const n = (x, y) => Math.sin(x * 0.11 + Math.sin(y * 0.07) * 2.2) + Math.sin(y * 0.09 + Math.sin(x * 0.05) * 2.6) + Math.sin((x + y) * 0.04) * 0.8;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = n(x, y);
      o.fillStyle = Math.abs(v) < 0.22 ? "#2b55c9" : Math.abs(v) < 0.34 ? "#3e74d6" : v > 1.2 ? "#2f6b2c" : v > 0 ? "#3d7d34" : "#4a8c3c";
      o.fillRect(x * px, y * px, px, px);
    }
    mapImage = off;
  }
  function map(t) {
    const s = sized($("map")); if (!s) return;
    if (!mapImage) buildMap();
    const { ctx, w, h } = s;
    ctx.globalAlpha = 0.82; ctx.drawImage(mapImage, 0, 0, w, h); ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // A target marker drifting across the survey.
    const mx = w * (0.5 + Math.sin(t * 0.21) * 0.3), my = h * (0.5 + Math.sin(t * 0.17 + 1) * 0.3);
    ctx.strokeStyle = PHOS; ctx.lineWidth = 1;
    ctx.strokeRect(mx - 7, my - 7, 14, 14);
    ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, h); ctx.moveTo(0, my); ctx.lineTo(w, my); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
  }

  /* ---------- Spectrum ---------- */
  function spectrum(t) {
    const s = sized($("spectrum")); if (!s) return;
    const { ctx, w, h } = s, bars = 32, bw = w / bars;
    ctx.clearRect(0, 0, w, h);
    const beat = Math.pow(1 - (((t * 124) / 60) % 1), 3);
    for (let i = 0; i < bars; i++) {
      const low = Math.max(0, 1 - i / 6) * beat;
      const v = 0.12 + low * 0.8 + 0.3 * Math.abs(Math.sin(t * (1.3 + i * 0.37) + i)) * (1 - i / bars * 0.6);
      const bh = Math.min(1, v) * h;
      ctx.fillStyle = i < 5 ? PHOS : DIM;
      ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    }
  }

  /* ---------- Reticle ---------- */
  const ret = $("reticle"), coords = $("coords");
  window.addEventListener("pointermove", (e) => {
    ret.style.left = `${e.clientX}px`; ret.style.top = `${e.clientY}px`;
    ret.classList.add("on");
    const lat = (41.15 + (e.clientY / innerHeight - 0.5) * -0.02).toFixed(4);
    const lon = (8.61 + (e.clientX / innerWidth - 0.5) * 0.03).toFixed(4);
    coords.textContent = `${lat}N ${lon}W`;
  });
  document.addEventListener("pointerleave", () => ret.classList.remove("on"));

  /* ---------- Loop ---------- */
  let lastLine = 0, running = true;
  function tick(now) {
    if (!running) return;
    const t = (now - start) / 1000;
    readouts(t); gauge(t); map(t); spectrum(t);
    if (t - lastLine > 1.6) { pushLine(); lastLine = t; }
    requestAnimationFrame(tick);
  }
  if (still) { readouts(30); gauge(0); map(0); spectrum(0.2); $("v-cov").textContent = "100.0"; }
  else requestAnimationFrame(tick);
  window.addEventListener("resize", () => { mapImage = null; if (still) { gauge(0); map(0); spectrum(0.2); } });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !still) requestAnimationFrame(tick);
  });
})();
