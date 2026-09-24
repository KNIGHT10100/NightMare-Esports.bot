/* sky.js · the night behind everything: twinkling stars, shooting stars, falling blossom petals,
 * a moon with a secret (tap it three times) and butterflies she can catch. */
(function () {
  'use strict';

  const P = window.Phool;
  const C = P.config;
  const { rand, pick, clamp, TAU } = P;

  const canvas = document.getElementById('sky');
  let ctx = P.fitCanvas(canvas);
  let stars = [];
  let petals = [];
  const shooters = [];
  let clock = 0;
  let nextShooter = rand(300, 700);

  // ── Stars ────────────────────────────────────────────────────────────────
  const TINTS = ['255,255,255', '255,244,214', '214,228,255', '255,214,236'];
  function makeStars() {
    const { w, h } = P.screen;
    const count = Math.round(clamp((w * h) / 2600, 90, 300));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.pow(Math.random(), 1.35) * h * 0.9, // denser towards the top of the sky
      r: Math.random() < 0.07 ? rand(1.1, 1.7) : rand(0.35, 1.05),
      a: rand(0.35, 0.95),
      speed: rand(0.02, 0.06),
      phase: rand(0, TAU),
      tint: pick(TINTS),
    }));
  }

  // ── Petals (pre-rendered sprites, drawn with a 3D-ish flip) ─────────────────
  function petalSprite(top, bottom) {
    const size = 48;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    const grad = g.createLinearGradient(0, -20, 0, 20);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 20);
    g.bezierCurveTo(-18, 8, -16, -14, -5, -19);
    g.lineTo(0, -14); // the little notch of a cherry blossom petal
    g.lineTo(5, -19);
    g.bezierCurveTo(16, -14, 18, 8, 0, 20);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.45)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, 16);
    g.quadraticCurveTo(-1.5, 2, 0, -11);
    g.stroke();
    return c;
  }
  const SPRITES = [
    petalSprite('#ffd6e6', '#ff9fc3'),
    petalSprite('#ffe3ee', '#ffb5cf'),
    petalSprite('#ffc2d9', '#ff85b1'),
  ];

  function makePetal(fromTop) {
    const { w, h } = P.screen;
    return {
      x: rand(-20, w + 20),
      y: fromTop ? rand(-60, -20) : rand(-20, h),
      s: rand(0.28, 0.62),
      vy: rand(0.35, 0.85),
      sway: rand(0.25, 0.7),
      swayRate: rand(0.012, 0.03),
      phase: rand(0, TAU),
      rot: rand(0, TAU),
      vr: rand(-0.02, 0.02),
      flip: rand(0, TAU),
      vflip: rand(0.02, 0.05),
      sprite: pick(SPRITES),
    };
  }
  function makePetals() {
    const count = P.reducedMotion ? 0 : Math.round(clamp(P.screen.w / 28, 10, 22));
    petals = Array.from({ length: count }, () => makePetal(false));
  }

  function shootingStar() {
    const { w, h } = P.screen;
    const leftToRight = Math.random() < 0.5;
    const angle = rand(0.35, 0.65);
    const speed = rand(13, 18);
    shooters.push({
      x: leftToRight ? rand(-40, w * 0.5) : rand(w * 0.5, w + 40),
      y: rand(-20, h * 0.3),
      vx: Math.cos(angle) * speed * (leftToRight ? 1 : -1),
      vy: Math.sin(angle) * speed,
      life: 42,
      max: 42,
    });
  }

  function tick(dt) {
    const { w, h } = P.screen;
    clock += dt;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(clock * s.speed + s.phase));
      ctx.fillStyle = 'rgba(' + s.tint + ',' + a.toFixed(3) + ')';
      if (s.r < 0.9) {
        ctx.fillRect(s.x, s.y, s.r * 1.7, s.r * 1.7);
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
        if (s.r > 1.2) { // a soft cross-shaped glint on the brightest stars
          ctx.fillStyle = 'rgba(' + s.tint + ',' + (a * 0.35).toFixed(3) + ')';
          ctx.fillRect(s.x - s.r * 4, s.y - 0.4, s.r * 8, 0.8);
          ctx.fillRect(s.x - 0.4, s.y - s.r * 4, 0.8, s.r * 8);
        }
      }
    }

    if (!P.reducedMotion) {
      nextShooter -= dt;
      if (nextShooter <= 0) { shootingStar(); nextShooter = rand(420, 960); }
    }
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) { shooters.splice(i, 1); continue; }
      const k = s.life / s.max;
      const tail = 7;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
      grad.addColorStop(0, 'rgba(255,255,255,' + (0.95 * k).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,220,240,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
      ctx.stroke();
    }

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.y += p.vy * dt;
      p.x += Math.sin(p.phase + clock * p.swayRate) * p.sway * dt;
      p.rot += p.vr * dt;
      p.flip += p.vflip * dt;
      if (p.y > h + 30 || p.x < -60 || p.x > w + 60) petals[i] = makePetal(true);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.s * (0.25 + 0.75 * Math.abs(Math.cos(p.flip))), p.s);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(p.sprite, -24, -24);
      ctx.restore();
    }
  }

  makeStars();
  makePetals();
  P.onResize(() => {
    ctx = P.fitCanvas(canvas);
    makeStars();
    makePetals();
  });
  P.loop.add({ tick });

  // ── The moon: three taps tell a secret ──────────────────────────────────────
  const moon = document.getElementById('moon');
  let moonTaps = 0;
  let moonTimer = 0;
  moon.addEventListener('click', () => {
    moonTaps++;
    clearTimeout(moonTimer);
    moonTimer = setTimeout(() => { moonTaps = 0; }, 4000);
    P.replay(moon, 'is-boop');
    const r = moon.getBoundingClientRect();
    P.fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 7);
    if (moonTaps >= 3) {
      moonTaps = 0;
      for (let i = 0; i < 6; i++) setTimeout(shootingStar, i * 180);
      P.audio.chime('low');
      P.toast(P.fill(C.moonSecret), 6500);
    } else {
      P.audio.tick(moonTaps === 2);
    }
  });

  // ── Butterflies ("nabi") she can catch for a secret ──────────────────────────
  const layer = document.getElementById('butterflies');
  const flutter = { el: null, t: 0, dur: 0, pts: null, first: true, timer: 0, running: false, secret: 0 };

  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  function wingSvg(viewBox) {
    return '<svg viewBox="' + viewBox + '" aria-hidden="true"><use href="#s-butterfly" width="100" height="100"/></svg>';
  }

  function spawnButterfly() {
    if (flutter.el) return;
    if (document.hidden) { scheduleButterfly(5000); return; }
    const { w, h } = P.screen;
    const fromLeft = Math.random() < 0.5;
    const x0 = fromLeft ? -50 : w + 50;
    const x3 = fromLeft ? w + 50 : -50;
    flutter.pts = {
      x: [x0, rand(w * 0.15, w * 0.85), rand(w * 0.15, w * 0.85), x3],
      y: [rand(h * 0.25, h * 0.75), rand(h * 0.1, h * 0.8), rand(h * 0.1, h * 0.8), rand(h * 0.15, h * 0.7)],
    };
    flutter.t = 0;
    flutter.dur = rand(560, 760) * (P.reducedMotion ? 1.5 : 1);

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'bfly';
    el.setAttribute('aria-label', 'A butterfly. Catch it for a secret.');
    el.innerHTML =
      '<span class="bfly__wing bfly__wing--l">' + wingSvg('0 0 50 100') + '</span>' +
      '<span class="bfly__wing bfly__wing--r">' + wingSvg('50 0 50 100') + '</span>' +
      (flutter.first ? '<span class="bfly__hint">catch me!</span>' : '');
    el.addEventListener('pointerdown', catchButterfly);
    el.addEventListener('click', catchButterfly);
    layer.append(el);
    flutter.el = el;
    flutter.first = false;
  }

  function catchButterfly(e) {
    e.preventDefault();
    const el = flutter.el;
    if (!el || el.classList.contains('is-caught')) return;
    el.classList.add('is-caught');
    const r = el.getBoundingClientRect();
    P.fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 12);
    P.fx.hearts(r.left + r.width / 2, r.top + r.height / 2, 5);
    P.audio.chime();
    P.vibrate(20);
    const secrets = C.secrets || [];
    if (secrets.length) P.toast('You caught a nabi! ' + P.fill(secrets[flutter.secret++ % secrets.length]), 7000);
    setTimeout(() => removeButterfly(), 900);
  }

  function removeButterfly() {
    if (flutter.el) flutter.el.remove();
    flutter.el = null;
    scheduleButterfly(rand(22000, 38000));
  }

  function scheduleButterfly(ms) {
    clearTimeout(flutter.timer);
    if (flutter.running) flutter.timer = setTimeout(spawnButterfly, ms);
  }

  P.loop.add({
    tick(dt) {
      const el = flutter.el;
      if (!el || el.classList.contains('is-caught')) return;
      flutter.t += dt / flutter.dur;
      if (flutter.t >= 1) { removeButterfly(); return; }
      const t = flutter.t;
      const x = bezier(flutter.pts.x[0], flutter.pts.x[1], flutter.pts.x[2], flutter.pts.x[3], t);
      const y = bezier(flutter.pts.y[0], flutter.pts.y[1], flutter.pts.y[2], flutter.pts.y[3], t) + Math.sin(t * 60) * 7;
      const ahead = Math.min(1, t + 0.01);
      const dx = bezier(flutter.pts.x[0], flutter.pts.x[1], flutter.pts.x[2], flutter.pts.x[3], ahead) - x;
      const tilt = clamp(dx * 2.2, -18, 18);
      el.style.transform = 'translate3d(' + (x - 23).toFixed(1) + 'px,' + (y - 23).toFixed(1) + 'px,0) rotate(' + tilt.toFixed(1) + 'deg)';
    },
  });

  P.sky = {
    shower(n) { for (let i = 0; i < n; i++) setTimeout(shootingStar, i * 160); },
    startButterflies(firstDelay) {
      if (flutter.running) return;
      flutter.running = true;
      scheduleButterfly(firstDelay || 9000);
    },
  };
})();
