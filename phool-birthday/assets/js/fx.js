/* fx.js · the top layer: confetti, little hearts where she taps, sparkles and heart explosions.
 * Draws only while something is alive, so an idle page costs nothing. */
(function () {
  'use strict';

  const P = window.Phool;
  const { rand, pick, TAU } = P;

  const canvas = document.getElementById('fx');
  let ctx = P.fitCanvas(canvas);
  P.onResize(() => { ctx = P.fitCanvas(canvas); });

  const CONFETTI_COLORS = ['#ff6f9f', '#ffb3cd', '#ffcf6e', '#b8a2ff', '#8fe3cf', '#ffffff', '#ff9a76'];
  const HEART_COLORS = ['#ff5f98', '#ff8fb8', '#ffb3cd', '#ffcf6e', '#e23c78'];

  // Pre-rendered heart sprites (one per colour) keep hundreds of hearts cheap to draw.
  const heartSprites = {};
  function heartSprite(color) {
    if (heartSprites[color]) return heartSprites[color];
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.scale(size / 100, size / 100);
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(50, 88);
    g.bezierCurveTo(22, 68, 7, 52, 7, 33);
    g.bezierCurveTo(7, 19, 18, 9, 31, 9);
    g.bezierCurveTo(39, 9, 46, 13, 50, 20);
    g.bezierCurveTo(54, 13, 61, 9, 69, 9);
    g.bezierCurveTo(82, 9, 93, 19, 93, 33);
    g.bezierCurveTo(93, 52, 78, 68, 50, 88);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.beginPath();
    g.ellipse(30, 30, 9, 6, -0.7, 0, TAU);
    g.fill();
    heartSprites[color] = c;
    return c;
  }

  const bits = [];
  let dirty = false;

  function add(bit) {
    if (bits.length > 900) return;
    bits.push(bit);
    dirty = true;
  }

  /** Confetti bursting upwards from (x, y). */
  function confetti(x, y, opts) {
    const o = opts || {};
    const count = Math.round((o.count || 90) * (P.reducedMotion ? 0.4 : 1));
    const power = o.power || 1;
    const spread = o.spread || Math.PI * 0.9;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + rand(-spread / 2, spread / 2);
      const sp = rand(6, 15) * power;
      add({
        type: Math.random() < 0.18 ? 'heart' : Math.random() < 0.3 ? 'circle' : 'rect',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 0.28, drag: 0.94,
        w: rand(6, 11), h: rand(4, 7),
        rot: rand(0, TAU), vr: rand(-0.25, 0.25),
        tilt: rand(0, TAU), vt: rand(0.08, 0.2),
        wob: rand(0, TAU),
        color: pick(CONFETTI_COLORS),
        life: rand(150, 230), max: 230,
      });
    }
  }

  /** Gentle rain of confetti from the top edge. */
  function rain(count) {
    const w = P.screen.w;
    for (let i = 0; i < (count || 80); i++) {
      add({
        type: Math.random() < 0.2 ? 'heart' : 'rect',
        x: rand(0, w), y: rand(-120, -10),
        vx: rand(-1, 1), vy: rand(1, 3),
        g: 0.05, drag: 0.99,
        w: rand(6, 11), h: rand(4, 7),
        rot: rand(0, TAU), vr: rand(-0.15, 0.15),
        tilt: rand(0, TAU), vt: rand(0.06, 0.16),
        wob: rand(0, TAU),
        color: pick(CONFETTI_COLORS),
        life: rand(260, 360), max: 360,
      });
    }
  }

  /** Little hearts floating up from a tap. */
  function hearts(x, y, count) {
    const n = count || 4;
    for (let i = 0; i < n; i++) {
      add({
        type: 'float-heart',
        x: x + rand(-8, 8), y: y + rand(-6, 6),
        vx: rand(-0.9, 0.9), vy: rand(-2.6, -1.2),
        g: -0.012, drag: 0.985,
        size: rand(12, 24),
        wob: rand(0, TAU),
        sprite: heartSprite(pick(HEART_COLORS)),
        life: rand(60, 90), max: 90,
      });
    }
  }

  /** Four-point twinkles. */
  function sparkles(x, y, count) {
    const n = count || 8;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(0.8, 3.2);
      add({
        type: 'sparkle',
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        g: 0, drag: 0.93,
        size: rand(5, 11),
        rot: rand(0, TAU), vr: rand(-0.1, 0.1),
        color: pick(['#fff4c9', '#ffcf6e', '#ffffff', '#ffd1e3']),
        life: rand(38, 60), max: 60,
      });
    }
  }

  /** A big burst of hearts in every direction. */
  function heartBurst(x, y, count) {
    const n = Math.round((count || 40) * (P.reducedMotion ? 0.5 : 1));
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(3, 11);
      add({
        type: 'float-heart',
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        g: 0.09, drag: 0.955,
        size: rand(14, 34),
        wob: rand(0, TAU),
        sprite: heartSprite(pick(HEART_COLORS)),
        life: rand(80, 130), max: 130,
      });
    }
    sparkles(x, y, 18);
  }

  function drawSparkle(s, size) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.fill();
  }

  function tick(dt) {
    if (!dirty) return;
    const { w, h } = P.screen;
    ctx.clearRect(0, 0, w, h);
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      const d = Math.pow(b.drag, dt);
      b.vx *= d;
      b.vy = b.vy * d + b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > h + 40 || b.y < -200) {
        bits[i] = bits[bits.length - 1];
        bits.pop();
        continue;
      }
      const k = b.life / b.max;
      const alpha = Math.min(1, k * 3);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (b.type === 'float-heart') {
        b.wob += 0.08 * dt;
        const s = b.size * (0.6 + 0.4 * Math.min(1, (b.max - b.life) / 10));
        ctx.translate(b.x + Math.sin(b.wob) * 4, b.y);
        ctx.rotate(Math.sin(b.wob) * 0.25);
        ctx.drawImage(b.sprite, -s / 2, -s / 2, s, s);
      } else if (b.type === 'sparkle') {
        b.rot += b.vr * dt;
        const s = b.size * (0.4 + 0.6 * Math.abs(Math.sin((b.max - b.life) * 0.15)));
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        drawSparkle(b, s);
      } else {
        b.rot += b.vr * dt;
        b.tilt += b.vt * dt;
        b.wob += 0.1 * dt;
        ctx.translate(b.x + Math.sin(b.wob) * 1.5, b.y);
        ctx.rotate(b.rot);
        ctx.scale(1, Math.cos(b.tilt)); // flipping paper
        ctx.fillStyle = b.color;
        if (b.type === 'rect') ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        else if (b.type === 'circle') { ctx.beginPath(); ctx.arc(0, 0, b.h / 2 + 1, 0, TAU); ctx.fill(); }
        else ctx.drawImage(heartSprite(b.color), -b.w / 2 - 2, -b.w / 2 - 2, b.w + 4, b.w + 4);
      }
      ctx.restore();
    }
    if (!bits.length) {
      ctx.clearRect(0, 0, w, h);
      dirty = false;
    }
  }
  P.loop.add({ tick });

  P.fx = { confetti, rain, hearts, sparkles, heartBurst };
})();
