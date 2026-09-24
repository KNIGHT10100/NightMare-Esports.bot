/* fireworks.js · rockets climb from the bottom of the screen and burst into shapes:
 * peony, ring, heart, flower (phool), butterfly (nabi), golden willow, crackle,
 * and whole words written in sparks.
 *
 * Rendering: every star is a short streak (head -> head - velocity * trail) drawn twice,
 * a wide faint halo and a thin bright core, with additive blending. Streaks are bucketed by
 * colour, alpha step, layer and size so a frame costs ~50 stroke() calls however many stars fly.
 */
(function () {
  'use strict';

  const P = window.Phool;
  const { rand, pick, clamp, lerp, easeOutCubic, TAU } = P;

  const canvas = document.getElementById('fireworks');
  let ctx = P.fitCanvas(canvas);

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  const PALETTE = [
    { name: 'rose', h: 342, s: 100, l: 66 },
    { name: 'pink', h: 318, s: 100, l: 72 },
    { name: 'gold', h: 42, s: 100, l: 62 },
    { name: 'lilac', h: 268, s: 95, l: 74 },
    { name: 'sky', h: 198, s: 100, l: 68 },
    { name: 'mint', h: 158, s: 85, l: 62 },
    { name: 'coral', h: 14, s: 100, l: 66 },
    { name: 'white', h: 45, s: 60, l: 92 },
  ];
  const COL = {};
  PALETTE.forEach((c, i) => { COL[c.name] = i; c.rgb = hslToRgb(c.h, c.s, c.l); });
  const ROMANTIC = [COL.rose, COL.pink, COL.gold, COL.lilac, COL.rose, COL.gold, COL.sky, COL.coral, COL.mint, COL.white];

  // ── Batching buckets ─────────────────────────────────────────────────────
  const ALPHA_STEPS = 10;
  const LAYERS = 2; // 0 halo, 1 core
  const SIZES = 2; // 0 small, 1 normal
  const KEYS = PALETTE.length * LAYERS * SIZES * ALPHA_STEPS;
  const bucketData = Array.from({ length: KEYS }, () => []);
  const bucketLen = new Int32Array(KEYS);
  const styleOf = new Array(KEYS);
  const widthOf = new Float32Array(KEYS);
  const used = [];
  let scale = 1; // shell size relative to a ~400px phone screen

  function keyOf(color, layer, size, alphaStep) {
    return ((color * LAYERS + layer) * SIZES + size) * ALPHA_STEPS + alphaStep;
  }

  function buildStyles() {
    const w = Math.sqrt(scale);
    PALETTE.forEach((c, ci) => {
      for (let layer = 0; layer < LAYERS; layer++) {
        for (let size = 0; size < SIZES; size++) {
          for (let s = 0; s < ALPHA_STEPS; s++) {
            const a = (s + 1) / ALPHA_STEPS;
            const k = keyOf(ci, layer, size, s);
            if (layer === 0) {
              styleOf[k] = 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,' + (a * 0.3).toFixed(3) + ')';
              widthOf[k] = (size ? 4.8 : 2.8) * w;
            } else {
              styleOf[k] = 'hsla(' + c.h + ',' + Math.max(c.s - 10, 0) + '%,' + Math.min(c.l + 22, 97) + '%,' + a.toFixed(3) + ')';
              widthOf[k] = (size ? 1.7 : 1.1) * w;
            }
          }
        }
      }
    });
  }

  function measure() {
    scale = clamp(Math.min(P.screen.w, P.screen.h) / 400, 0.8, 1.7);
    buildStyles();
  }
  measure();
  P.onResize(() => { ctx = P.fitCanvas(canvas); measure(); wake(); });

  // ── Particles ─────────────────────────────────────────────────────────────
  const stars = [];
  const pool = [];
  const rockets = [];
  const flashes = [];
  let density = P.reducedMotion ? 0.45 : 1;
  let idle = true;
  let skyAlpha = 0;
  const sky = [255, 200, 220];
  const MAX_STARS = 3400;

  /** Kinds: 0 physics star, 1 text star (flies to a target, holds, then falls), 2 spark. */
  function star(x, y, vx, vy, color, life, o) {
    if (stars.length >= MAX_STARS) return null;
    const s = pool.pop() || {};
    s.kind = 0;
    s.x = x; s.y = y; s.vx = vx; s.vy = vy;
    s.c = color;
    s.c2 = o && o.c2 != null ? o.c2 : -1;
    s.switchAt = o && o.switchAt ? o.switchAt : 0.45;
    s.life = s.max = life;
    s.drag = o && o.drag ? o.drag : 0.965;
    s.grav = o && o.grav != null ? o.grav : 0.035;
    s.tail = o && o.tail ? o.tail : 2.6;
    s.size = o && o.size != null ? o.size : 1;
    s.twinkle = !!(o && o.twinkle);
    s.crackle = !!(o && o.crackle);
    s.sparks = o && o.sparks ? o.sparks : 0;
    stars.push(s);
    return s;
  }

  function spark(x, y, vx, vy, color, life) {
    const s = star(x, y, vx, vy, color, life, { drag: 0.9, grav: 0.05, tail: 1.3, size: 0 });
    if (s) s.kind = 2;
    return s;
  }

  function flash(x, y, size, rgb) {
    flashes.push({ x, y, r: 95 * scale * size, life: 16, max: 16, rgb });
  }

  // ── Shell shapes ────────────────────────────────────────────────────────────
  const baseSpeed = () => 5.2 * scale;

  /** Stars on a sphere, seen in projection: dense rim, soft centre. */
  function peony(x, y, o) {
    const n = Math.round(95 * density * o.size);
    const S = baseSpeed() * o.size;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const u = rand(-1, 1);
      const sp = S * Math.sqrt(1 - u * u) * rand(0.93, 1.04);
      star(x, y, Math.cos(a) * sp, Math.sin(a) * sp, o.c, rand(64, 96), { c2: o.c2, twinkle: o.glitter, crackle: o.crackle });
    }
  }

  function ring(x, y, o) {
    const n = Math.round(60 * Math.max(density, 0.7));
    const S = baseSpeed() * 0.95 * o.size;
    const squash = rand(0.3, 0.95);
    const rot = rand(0, TAU);
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const vx = Math.cos(a) * S;
      const vy = Math.sin(a) * S * squash;
      star(x, y, vx * cr - vy * sr, vx * sr + vy * cr, o.c, rand(72, 88), { grav: 0.028, tail: 2.2 });
    }
    for (let i = 0; i < 22 * density; i++) {
      const a = rand(0, TAU);
      const sp = S * rand(0.15, 0.4);
      star(x, y, Math.cos(a) * sp, Math.sin(a) * sp, o.c2 >= 0 ? o.c2 : COL.white, rand(50, 70), { size: 0 });
    }
  }

  /** Classic parametric heart: x = 16 sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t. */
  function heart(x, y, o) {
    const n = Math.round(84 * Math.max(density, 0.75));
    const S = baseSpeed() * 1.05 * o.size;
    const tilt = rand(-0.18, 0.18);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    for (let layer = 0; layer < 2; layer++) {
      const k = layer ? 0.58 : 1;
      const count = layer ? Math.round(n * 0.5) : n;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * TAU;
        const hx = (16 * Math.pow(Math.sin(t), 3)) / 16.5;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) / 16.5;
        const vx = (hx * ct - hy * st) * S * k;
        const vy = (hx * st + hy * ct) * S * k;
        star(x, y, vx * rand(0.985, 1.015), vy * rand(0.985, 1.015), layer ? o.c2 : o.c, rand(84, 98), { drag: 0.962, grav: 0.012, tail: 2, size: layer ? 0 : 1 });
      }
    }
  }

  /** Five-petal rose curve r = |cos(5θ/2)|, with a golden centre: a phool in the sky. */
  function flower(x, y, o) {
    const n = Math.round(124 * Math.max(density, 0.75));
    const S = baseSpeed() * 1.08 * o.size;
    const spin = rand(-0.25, 0.25);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const r = 0.2 + 0.8 * Math.abs(Math.cos(2.5 * t));
      const outer = i % 2 === 0;
      const k = outer ? 1 : 0.6;
      const a = t - Math.PI / 2 + spin;
      star(x, y, Math.cos(a) * r * k * S, Math.sin(a) * r * k * S, outer ? o.c : o.c2, rand(84, 98), { drag: 0.962, grav: 0.013, tail: 2, size: outer ? 1 : 0 });
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      star(x, y, Math.cos(a) * S * 0.2, Math.sin(a) * S * 0.2, COL.gold, rand(70, 86), { drag: 0.96, grav: 0.012, size: 0, twinkle: true });
    }
  }

  /** Temple Fay's butterfly curve, one loop: a nabi made of light. */
  function butterfly(x, y, o) {
    const n = Math.round(150 * Math.max(density, 0.75));
    const S = (baseSpeed() / 2.9) * 1.05 * o.size;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const e = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
      const bx = Math.sin(t) * e;
      const by = Math.cos(t) * e - 0.66;
      star(x, y, bx * S, -by * S, by > 0 ? o.c : o.c2, rand(84, 98), { drag: 0.962, grav: 0.012, tail: 2, size: 1 });
    }
  }

  /** Golden willow: slow, heavy stars that droop and shed glitter. */
  function willow(x, y, o) {
    const n = Math.round(70 * density * o.size);
    const S = baseSpeed() * 0.85 * o.size;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const u = rand(-1, 1);
      const sp = S * Math.sqrt(1 - u * u) * rand(0.9, 1.03);
      star(x, y, Math.cos(a) * sp, Math.sin(a) * sp, COL.gold, rand(130, 170), { drag: 0.95, grav: 0.03, tail: 5, twinkle: true, sparks: 0.14 });
    }
  }

  function crackleShell(x, y, o) {
    peony(x, y, { c: o.c, c2: COL.white, size: o.size * 0.9, crackle: true, glitter: true });
  }

  // Colours for each shape, so hearts are pink and flowers bloom like flowers.
  const SHAPES = {
    peony: { make: peony, weight: 3, colors: () => { const c = pick(ROMANTIC); return [c, Math.random() < 0.5 ? pick(ROMANTIC) : -1]; } },
    heart: { make: heart, weight: 2.6, colors: () => [pick([COL.rose, COL.pink, COL.coral]), pick([COL.white, COL.gold, COL.pink])] },
    flower: { make: flower, weight: 2.2, colors: () => [pick([COL.pink, COL.rose, COL.lilac]), pick([COL.white, COL.gold, COL.rose])] },
    ring: { make: ring, weight: 1.4, colors: () => [pick(ROMANTIC), pick(ROMANTIC)] },
    butterfly: { make: butterfly, weight: 1.3, colors: () => [pick([COL.lilac, COL.sky]), pick([COL.pink, COL.rose, COL.gold])] },
    willow: { make: willow, weight: 1.1, colors: () => [COL.gold, COL.gold] },
    crackle: { make: crackleShell, weight: 1.1, colors: () => [pick([COL.gold, COL.white, COL.rose]), COL.white] },
  };
  const SHAPE_NAMES = Object.keys(SHAPES);
  const TOTAL_WEIGHT = SHAPE_NAMES.reduce((sum, k) => sum + SHAPES[k].weight, 0);
  function randomShape() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (let i = 0; i < SHAPE_NAMES.length; i++) {
      r -= SHAPES[SHAPE_NAMES[i]].weight;
      if (r <= 0) return SHAPE_NAMES[i];
    }
    return 'peony';
  }

  // ── Words written in sparks ─────────────────────────────────────────────────
  function textPoints(word) {
    const maxW = Math.min(P.screen.w * 0.86, 760);
    let px = Math.min(130, P.screen.w * 0.26);
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = (size) => '800 ' + size + 'px "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    g.font = font(px);
    let tw = g.measureText(word).width;
    if (tw > maxW) {
      px *= maxW / tw;
      g.font = font(px);
      tw = g.measureText(word).width;
    }
    const W = Math.ceil(tw + 10);
    const H = Math.ceil(px * 1.3);
    c.width = W;
    c.height = H;
    g.font = font(px);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(word, W / 2, H / 2 + px * 0.06);
    const data = g.getImageData(0, 0, W, H).data;
    // Dense enough that neighbouring glows touch, so letters read as solid light.
    const gap = Math.max(3.1, px / 22);
    const pts = [];
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 140) pts.push([x - W / 2 + rand(-0.5, 0.5), y - H / 2 + rand(-0.5, 0.5), (x / W)]);
      }
    }
    return pts;
  }

  function writeWord(x, y, word, o) {
    const pts = textPoints(word);
    const colors = [COL.rose, COL.pink, COL.gold];
    pts.forEach((p) => {
      const s = star(x, y, 0, 0, colors[Math.min(2, Math.floor(p[2] * 3))], 1e9, { size: 1, drag: 0.985, grav: 0, tail: 1.6 });
      if (!s) return;
      s.kind = 1;
      s.ox = x; s.oy = y;
      s.tx = x + p[0]; s.ty = y + p[1];
      s.t = 0;
      s.delay = rand(0, 10);
      s.fly = rand(48, 62);
      s.hold = (o && o.hold) || 150;
      s.phase = rand(0, TAU);
      s.arc = rand(-18, 18);
    });
  }

  // ── Rockets ──────────────────────────────────────────────────────────────────
  const ROCKET_G = 0.15;
  const panOf = (x) => ((x / P.screen.w) * 2 - 1) * 0.7;

  /**
   * Launch a rocket that bursts near (x, y) in CSS px.
   * opts: { x, y, shape, word, size, silent }
   */
  function launch(opts) {
    const o = opts || {};
    const { w, h } = P.screen;
    const tx = clamp(o.x != null ? o.x : rand(w * 0.15, w * 0.85), w * 0.08, w * 0.92);
    const ty = clamp(o.y != null ? o.y : rand(h * 0.13, h * 0.42), h * 0.08, h * 0.62);
    const x0 = clamp(tx + rand(-w * 0.08, w * 0.08), 12, w - 12);
    const y0 = h + 8;
    const vy = -Math.sqrt(2 * ROCKET_G * (y0 - ty));
    const T = -vy / ROCKET_G;
    const shape = o.word ? 'word' : o.shape && SHAPES[o.shape] ? o.shape : randomShape();
    const colors = o.word ? [COL.gold, COL.pink] : SHAPES[shape].colors();
    rockets.push({ x: x0, y: y0, vx: (tx - x0) / T, vy, shape, word: o.word, c: colors[0], c2: colors[1], size: o.size || rand(0.88, 1.12), hold: o.hold });
    if (!o.silent) P.audio.launch(panOf(x0));
    wake();
  }

  function explode(r) {
    if (r.shape === 'word') {
      writeWord(r.x, r.y, r.word, { hold: r.hold });
      peony(r.x, r.y, { c: COL.white, c2: COL.gold, size: 0.55, glitter: true });
    } else {
      SHAPES[r.shape].make(r.x, r.y, { c: r.c, c2: r.c2, size: r.size });
    }
    flash(r.x, r.y, r.shape === 'word' ? 1.4 : r.size, PALETTE[r.c].rgb);
    P.audio.boom(r.shape === 'word' ? 1.4 : r.size, panOf(r.x));
    if (r.shape === 'willow') setTimeout(() => P.audio.crackle(panOf(r.x), 22), 900);
    P.vibrate(12);
  }

  function wake() {
    idle = false;
  }

  // ── Frame ────────────────────────────────────────────────────────────────────
  let frameNo = 0;
  function tick(dt) {
    if (idle) return;
    const { w, h } = P.screen;
    frameNo++;

    // Adapt to slower phones: fewer stars per shell when the frame rate drops.
    if (frameNo % 60 === 0) {
      const ms = P.loop.perf.avg;
      if (ms > 24 && density > 0.45) density = Math.max(0.45, density * 0.88);
      else if (ms < 18 && density < (P.reducedMotion ? 0.45 : 1)) density = Math.min(1, density + 0.04);
    }

    // Rockets climb, shedding embers, and burst at the top of their arc.
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.vy += ROCKET_G * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (Math.random() < 0.9) spark(r.x, r.y + 2, r.vx * 0.2 + rand(-0.5, 0.5), r.vy * 0.15 + rand(0.4, 1.4), COL.gold, rand(14, 26));
      if (r.vy >= -0.35) {
        rockets.splice(i, 1);
        explode(r);
      }
    }

    // Stars.
    used.length = 0;
    let tr = 0;
    let tg = 0;
    let tb = 0;
    let tw = 0;
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      let a = 1;
      if (s.kind === 1) {
        if (s.delay > 0) {
          s.delay -= dt;
          continue;
        }
        if (s.t < 1) {
          s.t = Math.min(1, s.t + dt / s.fly);
          const e = easeOutCubic(s.t);
          const nx = lerp(s.ox, s.tx, e) + Math.sin(e * Math.PI) * s.arc;
          const ny = lerp(s.oy, s.ty, e);
          s.vx = (nx - s.x) / Math.max(dt, 0.1);
          s.vy = (ny - s.y) / Math.max(dt, 0.1);
          s.x = nx;
          s.y = ny;
        } else if (s.hold > 0) {
          s.hold -= dt;
          s.vx = 0;
          s.vy = 0;
          s.phase += 0.12 * dt;
          a = 0.82 + 0.18 * Math.sin(s.phase);
        } else {
          s.kind = 0;
          s.vx = rand(-0.3, 0.3);
          s.vy = rand(-0.35, 0.15);
          s.grav = 0.022;
          s.drag = 0.985;
          s.life = s.max = rand(60, 95);
          s.twinkle = true;
        }
      } else {
        const d = Math.pow(s.drag, dt);
        s.vx *= d;
        s.vy = s.vy * d + s.grav * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0 || s.y > h + 40) {
          if (s.crackle) {
            for (let k = 0; k < 3; k++) spark(s.x, s.y, rand(-1.6, 1.6), rand(-1.6, 1.6), COL.white, rand(6, 12));
            P.audio.crackle(panOf(s.x), 14);
          }
          stars[i] = stars[stars.length - 1];
          stars.pop();
          pool.push(s);
          continue;
        }
        const k = s.life / s.max;
        a = k < 0.38 ? k / 0.38 : 1;
        if (s.twinkle && k < 0.6 && Math.random() < 0.35) a *= 0.2;
        if (s.sparks && Math.random() < s.sparks * dt) spark(s.x, s.y, s.vx * 0.1, s.vy * 0.1 + 0.2, COL.gold, rand(26, 44));
      }

      const color = s.c2 >= 0 && s.kind === 0 && s.life / s.max < s.switchAt ? s.c2 : s.c;
      const step = Math.min(ALPHA_STEPS - 1, Math.max(0, Math.round(a * ALPHA_STEPS) - 1));
      if (a < 0.05) continue;

      // Streak from tail to head (at least a dot).
      let x2 = s.x - s.vx * s.tail;
      let y2 = s.y - s.vy * s.tail;
      if (Math.abs(s.x - x2) + Math.abs(s.y - y2) < 0.7) { x2 = s.x - 0.7; y2 = s.y; }
      for (let layer = 0; layer < 2; layer++) {
        const key = keyOf(color, layer, s.size, step);
        const n = bucketLen[key];
        if (n === 0) used.push(key);
        const arr = bucketData[key];
        arr[n] = s.x; arr[n + 1] = s.y; arr[n + 2] = x2; arr[n + 3] = y2;
        bucketLen[key] = n + 4;
      }
      if (s.kind !== 2) {
        const rgb = PALETTE[color].rgb;
        tr += rgb[0] * a; tg += rgb[1] * a; tb += rgb[2] * a; tw += a;
      }
    }

    // Draw.
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    // The whole sky picks up a little of the fireworks' colour.
    if (tw > 0) {
      sky[0] = lerp(sky[0], tr / tw, 0.15);
      sky[1] = lerp(sky[1], tg / tw, 0.15);
      sky[2] = lerp(sky[2], tb / tw, 0.15);
    }
    skyAlpha = lerp(skyAlpha, Math.min(1, tw / 900) * 0.11, 0.08);
    if (skyAlpha > 0.004) {
      ctx.fillStyle = 'rgba(' + (sky[0] | 0) + ',' + (sky[1] | 0) + ',' + (sky[2] | 0) + ',' + skyAlpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life -= dt;
      if (f.life <= 0) { flashes.splice(i, 1); continue; }
      const k = f.life / f.max;
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(' + f.rgb[0] + ',' + f.rgb[1] + ',' + f.rgb[2] + ',' + (0.5 * k).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + f.rgb[0] + ',' + f.rgb[1] + ',' + f.rgb[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }

    // Rocket heads.
    for (let i = 0; i < rockets.length; i++) {
      const r = rockets[i];
      for (let layer = 0; layer < 2; layer++) {
        const key = keyOf(COL.gold, layer, 1, ALPHA_STEPS - 1);
        const n = bucketLen[key];
        if (n === 0) used.push(key);
        const arr = bucketData[key];
        arr[n] = r.x; arr[n + 1] = r.y; arr[n + 2] = r.x - r.vx * 3; arr[n + 3] = r.y - r.vy * 3;
        bucketLen[key] = n + 4;
      }
    }

    ctx.lineCap = 'round';
    for (let u = 0; u < used.length; u++) {
      const key = used[u];
      const arr = bucketData[key];
      const n = bucketLen[key];
      ctx.strokeStyle = styleOf[key];
      ctx.lineWidth = widthOf[key];
      ctx.beginPath();
      for (let j = 0; j < n; j += 4) {
        ctx.moveTo(arr[j], arr[j + 1]);
        ctx.lineTo(arr[j + 2], arr[j + 3]);
      }
      ctx.stroke();
      bucketLen[key] = 0;
    }

    if (!rockets.length && !stars.length && !flashes.length && skyAlpha < 0.004) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      idle = true;
    }
  }
  P.loop.add({ tick });

  // ── Shows ────────────────────────────────────────────────────────────────────
  let showing = false;
  let showTimer = 0;
  let showStarted = 0;

  function scheduleShow(ms) {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      if (!showing) return;
      if (!document.hidden) {
        launch({});
        if (Math.random() < 0.25) setTimeout(() => showing && launch({}), 240);
      }
      const elapsed = Date.now() - showStarted;
      const next = elapsed < 14000 ? rand(650, 1500) : rand(2300, 4200);
      scheduleShow(P.reducedMotion ? next * 2.2 : next);
    }, ms);
  }

  P.fireworks = {
    launch,
    /** Several rockets at once, spread across the sky. */
    volley(n) {
      const { w, h } = P.screen;
      const count = n || 6;
      for (let i = 0; i < count; i++) {
        setTimeout(() => launch({ x: w * (0.12 + (0.76 * (i + 0.5)) / count) + rand(-18, 18), y: rand(h * 0.12, h * 0.4) }), i * 150 + rand(0, 60));
      }
    },
    word(word, y, hold) {
      launch({ x: P.screen.w / 2, y: y != null ? y : P.screen.h * 0.24, word, hold });
    },
    show(on) {
      if (on === showing) return;
      showing = on;
      clearTimeout(showTimer);
      if (on) {
        showStarted = Date.now();
        scheduleShow(350);
      }
    },
    get active() { return !idle; },
    get count() { return stars.length; },
  };
})();
