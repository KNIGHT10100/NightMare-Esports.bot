/* core.js · shared helpers: maths, one animation loop, canvas sizing, timers, haptics, wake lock, toast. */
(function () {
  'use strict';

  const P = (window.Phool = window.Phool || {});
  const C = window.PHOOL_CONFIG || {};

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /** Fill {name}, {nickname} and {initial} placeholders from the config. */
  function fill(text) {
    const nickname = C.nickname || 'Phool';
    return String(text)
      .replace(/\{name\}/g, C.name || nickname)
      .replace(/\{nickname\}/g, nickname)
      .replace(/\{initial\}/g, nickname.charAt(0).toUpperCase());
  }

  // ── Screen metrics (CSS px). Canvases are backed at up to 2× for crisp but affordable pixels.
  const screen = { w: window.innerWidth, h: window.innerHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) };
  const resizeHandlers = [];
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      screen.w = window.innerWidth;
      screen.h = window.innerHeight;
      screen.dpr = Math.min(window.devicePixelRatio || 1, 2);
      resizeHandlers.forEach((fn) => fn(screen));
    }, 120);
  });
  const onResize = (fn) => resizeHandlers.push(fn);

  function fitCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = Math.round(screen.w * screen.dpr);
    canvas.height = Math.round(screen.h * screen.dpr);
    ctx.setTransform(screen.dpr, 0, 0, screen.dpr, 0, 0);
    return ctx;
  }

  // ── One requestAnimationFrame loop drives every animated system.
  //    dt is measured in 60 fps frames so physics reads the same on 60/90/120 Hz screens.
  const systems = new Set();
  let running = false;
  let last = 0;
  const perf = { avg: 16.7 };
  function frame(now) {
    if (!running) return;
    const ms = last ? now - last : 16.7;
    last = now;
    perf.avg = perf.avg * 0.95 + Math.min(ms, 100) * 0.05;
    const dt = Math.min(ms, 50) / (1000 / 60);
    systems.forEach((s) => s.tick(dt, now));
    requestAnimationFrame(frame);
  }
  const loop = {
    add: (s) => systems.add(s),
    remove: (s) => systems.delete(s),
    start() { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } },
    stop() { running = false; },
    perf,
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? loop.stop() : loop.start()));

  /** Timers that belong to one scene, so leaving the scene cancels everything it scheduled. */
  class Timers {
    constructor() { this.ids = new Set(); }
    after(ms, fn) {
      const id = setTimeout(() => { this.ids.delete(id); fn(); }, ms);
      this.ids.add(id);
      return id;
    }
    every(ms, fn) {
      const id = setInterval(fn, ms);
      this.ids.add(id);
      return id;
    }
    clear() {
      this.ids.forEach((id) => { clearTimeout(id); clearInterval(id); });
      this.ids.clear();
    }
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Restart a CSS animation class on an element. */
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow so the animation starts again
    el.classList.add(cls);
  }

  // ── Haptics (Android; silently ignored elsewhere).
  function vibrate(pattern) {
    try { if (navigator.vibrate && P.state && P.state.started) navigator.vibrate(pattern); } catch (e) { /* not allowed here */ }
  }

  // ── Keep the screen awake while she reads (released automatically when the tab hides).
  let wakeLock = null;
  async function keepAwake() {
    if (wakeLock || !('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { wakeLock = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && P.state && P.state.started) keepAwake();
  });

  // ── DOM helpers.
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style') node.style.cssText = v;
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach((c) => node.append(c));
    return node;
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  /** An inline sticker from the sprite sheet, e.g. sticker('heart', {'--c': '#f69'}). */
  function sticker(name, vars, cls) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', cls || 'sticker');
    if (vars) Object.keys(vars).forEach((k) => svg.style.setProperty(k, vars[k]));
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#s-' + name);
    use.setAttribute('filter', 'url(#sticker-edge)');
    svg.append(use);
    return svg;
  }

  // ── Toast for little secrets and hints.
  let toastTimer = 0;
  function toast(message, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), ms || 5200);
  }

  /** Split text into user-perceived characters (keeps emoji and accents whole). */
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text));

  Object.assign(P, {
    config: C, TAU, rand, randInt, pick, clamp, lerp, easeOutCubic, easeInOutSine, reducedMotion,
    fill, screen, onResize, fitCanvas, loop, Timers, wait, replay, vibrate, keepAwake,
    $, $$, h, sticker, toast, graphemes,
    state: { started: false, muted: false },
  });
})();
