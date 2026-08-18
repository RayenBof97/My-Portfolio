/*==============================================================
  INTERACTIVE BACKGROUND — "DSP BENCH"
  ---------------------------------------------------------------
  Three signals, three DSP concepts, each in its own quiet band
  so nothing crowds the page content:

    1. Chirp        — a frequency sweep, phase accumulating
                       quadratically across x (classic radar /
                       spectrum-analyzer test signal).
    2. Sampled       — a continuous sine drawn faint, with its
                       ADC-style sample stems + dots on top —
                       the textbook "stem plot" of a discretised
                       signal.
    3. AM carrier    — a fast carrier whose amplitude is traced
                       by a slow envelope, with the envelope
                       itself drawn as a dashed outline, the way
                       an amplitude-modulation diagram is drawn.

  The grid stays as a quiet blueprint backdrop. A scope-cursor
  line on hover reads out each signal's instantaneous value.
  Drop-in replacement: targets #bg-canvas, respects
  prefers-reduced-motion.
================================================================*/
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- token system ------------------------------------------------- */
  const GRID   = { h: 208, s: 18, l: 50 };  // blueprint grid
  const CHIRP  = { h: 208, s: 55, l: 62 };  // steel-blue
  const SAMPLE = { h: 156, s: 65, l: 58 };  // phosphor-green
  const AM     = { h: 36,  s: 80, l: 62 };  // warm amber
  const CURSOR = { h: 0,   s: 0,  l: 92 };  // near-white

  let width, height, dpr;
  let chirp, sampled, am;
  let lastTime = 0;
  let globalT = 0;
  const mouse = { x: 0, y: 0, targetActive: 0, alpha: 0 };

  function hsla(c, a) { return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutSignals();
  }

  /* -------------------- three deliberate signals ---------------------- */
  function layoutSignals() {
    const amp = Math.min(58, height * 0.1);

    chirp = {
      color: CHIRP,
      yBase: height * 0.22,
      amp,
      f0: 0.002,             // start frequency (cycles/px)
      f1: 0.03,              // end frequency (cycles/px)
      speed: 0.6,            // phase drift, rad/s
      markerPhase: 0.15
    };

    sampled = {
      color: SAMPLE,
      yBase: height * 0.52,
      amp,
      freq: 0.012,           // underlying "analog" frequency
      speed: 0.5,
      spacing: width < 640 ? 22 : 26 // sample spacing, px
    };

    am = {
      color: AM,
      yBase: height * 0.8,
      amp,
      carrierFreq: 0.09,
      carrierSpeed: 2.6,
      envFreq: 0.006,
      envSpeed: 0.35,
      markerPhase: 0.6
    };
  }

  function chirpTheta(w, x) {
    const xn = x / width;
    // quadratic phase accumulation -> visibly increasing frequency L to R
    return 2 * Math.PI * (w.f0 * xn * width + 0.5 * (w.f1 - w.f0) * xn * xn * width);
  }
  function chirpY(w, x, t) { return w.yBase + w.amp * Math.sin(chirpTheta(w, x) + t * w.speed); }

  function sampledY(w, x, t) { return w.yBase + w.amp * Math.sin(x * w.freq + t * w.speed); }

  function amEnvelope(w, x, t) { return 0.28 + 0.72 * Math.abs(Math.sin(x * w.envFreq + t * w.envSpeed)); }
  function amY(w, x, t) {
    return w.yBase + w.amp * amEnvelope(w, x, t) * Math.sin(x * w.carrierFreq + t * w.carrierSpeed);
  }

  /* -------------------- drawing helpers ------------------------------- */

  function drawGrid() {
    const minor = 34;
    ctx.lineWidth = 1;
    ctx.strokeStyle = hsla(GRID, 0.05);
    ctx.beginPath();
    for (let x = 0; x < width; x += minor) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
    for (let y = 0; y < height; y += minor) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
    ctx.stroke();

    ctx.strokeStyle = hsla(GRID, 0.09);
    ctx.beginPath();
    const major = minor * 4;
    for (let x = 0; x < width; x += major) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
    for (let y = 0; y < height; y += major) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
    ctx.stroke();
  }

  function drawMarker(color, x, y, r) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, hsla(color, 0.8));
    glow.addColorStop(1, hsla(color, 0));
    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = hsla({ h: color.h, s: 15, l: 95 }, 0.9);
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChirp(t) {
    ctx.beginPath();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = hsla(chirp.color, 0.24);
    for (let x = 0; x <= width; x += 3) {
      const y = chirpY(chirp, x, t);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const mx = ((chirp.markerPhase + t * 0.03) % 1) * width;
    drawMarker(chirp.color, mx, chirpY(chirp, mx, t), 5.5);
  }

  function drawSampled(t) {
    // faint continuous "analog" signal underneath
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = hsla(sampled.color, 0.12);
    for (let x = 0; x <= width; x += 4) {
      const y = sampledY(sampled, x, t);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ADC-style sample stems + dots — the discretised version on top
    for (let x = 0; x <= width; x += sampled.spacing) {
      const y = sampledY(sampled, x, t);
      ctx.beginPath();
      ctx.strokeStyle = hsla(sampled.color, 0.22);
      ctx.lineWidth = 1;
      ctx.moveTo(x, sampled.yBase);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = hsla(sampled.color, 0.55);
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // baseline (0-level reference), like an axis on a stem plot
    ctx.beginPath();
    ctx.strokeStyle = hsla(sampled.color, 0.08);
    ctx.lineWidth = 1;
    ctx.moveTo(0, sampled.yBase);
    ctx.lineTo(width, sampled.yBase);
    ctx.stroke();
  }

  function drawAM(t) {
    // envelope outline, upper and mirrored lower — the classic AM diagram
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = hsla(am.color, 0.16);
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 4) {
      const e = am.amp * amEnvelope(am, x, t);
      const y = am.yBase - e;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 4) {
      const e = am.amp * amEnvelope(am, x, t);
      const y = am.yBase + e;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // fast carrier riding inside the envelope
    ctx.beginPath();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = hsla(am.color, 0.26);
    for (let x = 0; x <= width; x += 2) {
      const y = amY(am, x, t);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const mx = ((am.markerPhase + t * 0.025) % 1) * width;
    drawMarker(am.color, mx, amY(am, mx, t), 5.5);
  }

  function drawScopeCursor(t) {
    mouse.alpha += (mouse.targetActive - mouse.alpha) * 0.09;
    if (mouse.alpha < 0.003) return;

    ctx.beginPath();
    ctx.strokeStyle = hsla(CURSOR, 0.14 * mouse.alpha);
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;
    ctx.moveTo(mouse.x + 0.5, 0);
    ctx.lineTo(mouse.x + 0.5, height);
    ctx.stroke();
    ctx.setLineDash([]);

    const points = [
      { c: chirp.color, y: chirpY(chirp, mouse.x, t) },
      { c: sampled.color, y: sampledY(sampled, mouse.x, t) },
      { c: am.color, y: amY(am, mouse.x, t) }
    ];
    for (const p of points) {
      ctx.beginPath();
      ctx.fillStyle = hsla(p.c, 0.85 * mouse.alpha);
      ctx.arc(mouse.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = hsla(p.c, 0.35 * mouse.alpha);
      ctx.lineWidth = 1;
      ctx.arc(mouse.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawChirp(t);
    drawSampled(t);
    drawAM(t);
    drawScopeCursor(t);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    globalT += dt;
    drawFrame(globalT);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.targetActive = 1; });
  window.addEventListener('mouseleave', () => { mouse.targetActive = 0; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.targetActive = 1; }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.targetActive = 0; });

  resize();
  lastTime = performance.now();
  if (reduceMotion) {
    drawFrame(0);
  } else {
    requestAnimationFrame(loop);
  }
})();