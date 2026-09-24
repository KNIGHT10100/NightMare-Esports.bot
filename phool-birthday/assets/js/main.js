/* main.js · scene manager, top bar, sound toggle, taps anywhere, back button, start-up. */
(function () {
  'use strict';

  const P = window.Phool;
  const C = P.config;
  const S = P.scenes;
  const { $, $$, h } = P;

  P.build = window.PHOOL_BUILD || {};

  const ORDER = ['gift', 'celebrate', 'wish', 'memories', 'khat', 'surprises', 'question', 'forever'];
  const LABELS = {
    celebrate: 'Fireworks', wish: 'Make a wish', memories: 'Our memories', khat: 'Your letter',
    surprises: 'Sweet surprises', question: 'One tiny question', forever: 'Forever',
  };
  const sceneEl = (name) => document.getElementById('scene-' + name);
  const visited = new Set(['gift']);
  P.current = 'gift';

  // ── Names from the config ────────────────────────────────────────────────────
  $$('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    if (key === 'initial') el.textContent = P.fill('{initial}');
    else if (C[key]) el.textContent = C[key];
  });

  // ── Progress hearts ──────────────────────────────────────────────────────────
  const progress = $('#progress');
  const navButtons = ORDER.slice(1).map((name) => {
    const b = h('button', { class: 'progress__dot', type: 'button', 'aria-label': LABELS[name], disabled: true });
    b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#s-heart"/></svg>';
    b.addEventListener('click', () => go(name));
    progress.append(b);
    return { name, b };
  });
  function updateNav() {
    navButtons.forEach(({ name, b }) => {
      b.disabled = !visited.has(name);
      b.classList.toggle('is-visited', visited.has(name));
      b.classList.toggle('is-current', name === P.current);
      if (name === P.current) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
  }

  // ── Scene manager ────────────────────────────────────────────────────────────
  ['wait'].concat(ORDER).forEach((name) => {
    const el = sceneEl(name);
    const heading = el.querySelector('h1, h2');
    if (heading) heading.tabIndex = -1;
    if (name !== 'gift') { el.inert = true; el.setAttribute('aria-hidden', 'true'); }
  });

  function go(name, fromHistory) {
    if (!S[name] || name === P.current) return;
    const from = P.current;
    if (S[from].leave) S[from].leave(name);
    const a = sceneEl(from);
    const b = sceneEl(name);
    a.classList.remove('is-active');
    a.setAttribute('aria-hidden', 'true');
    a.inert = true;
    b.classList.add('is-active');
    b.removeAttribute('aria-hidden');
    b.inert = false;
    b.scrollTop = 0;
    P.current = name;
    visited.add(name);
    updateNav();
    $('#hud').hidden = name === 'gift' || name === 'wait';
    P.audio.whoosh();
    if (!fromHistory) {
      try { history.pushState({ scene: name }, ''); } catch (e) { /* sandboxed */ }
    }
    if (S[name].enter) S[name].enter(from);
    const heading = b.querySelector('h1, h2');
    if (heading) setTimeout(() => heading.focus({ preventScroll: true }), 50);
  }
  P.go = go;

  P.next = function () {
    const i = ORDER.indexOf(P.current);
    if (i >= 0 && i < ORDER.length - 1) go(ORDER[i + 1]);
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) P.next();
  });

  // Android's back button steps back through the surprises instead of leaving the page.
  try { history.replaceState({ scene: 'gift' }, ''); } catch (e) { /* sandboxed */ }
  window.addEventListener('popstate', (e) => {
    const name = e.state && e.state.scene;
    if (name && S[name]) go(name, true);
  });

  P.replayAll = function () {
    ORDER.forEach((name) => { if (S[name].reset) S[name].reset(); });
    visited.clear();
    visited.add('gift');
    go('gift');
  };

  // ── Music: her song all the way through (or the music box if there is no song),
  //    and 'quiet' while the music box sings Happy Birthday.
  P.music = function (mode) {
    if (!P.audio.ready) return;
    if (mode === 'quiet') {
      P.audio.quietSong();
      P.audio.ambient(false);
    } else if (!P.audio.startSong()) {
      P.audio.ambient(true);
    }
  };

  /** Her very first touch: unlock sound, start the song, keep the screen on, warm up the photos. */
  P.start = function () {
    P.audio.unlock();
    if (P.state.started) return;
    P.state.started = true;
    P.keepAwake();
    P.music('play');
    P.sky.startButterflies(16000);
    (C.photos || []).forEach((p) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = p.src;
    });
  };

  // ── Sound toggle (remembered on this device) ─────────────────────────────────
  const soundBtn = $('#soundBtn');
  function renderSound() {
    const muted = P.state.muted;
    soundBtn.classList.toggle('is-muted', muted);
    soundBtn.setAttribute('aria-pressed', String(!muted));
    soundBtn.setAttribute('aria-label', muted ? 'Sound is off. Tap to turn it on.' : 'Sound is on. Tap to mute.');
  }
  try { P.state.muted = localStorage.getItem('phool-muted') === '1'; } catch (e) { /* storage blocked */ }
  renderSound();
  soundBtn.addEventListener('click', () => {
    P.audio.unlock();
    P.audio.setMuted(!P.state.muted);
    renderSound();
    try { localStorage.setItem('phool-muted', P.state.muted ? '1' : '0'); } catch (e) { /* storage blocked */ }
  });

  // ── Taps anywhere: fireworks where the sky is open, little hearts everywhere else ──
  const INTERACTIVE = 'button, a, input, .deck, .scratch, .letter__paper, .lantern, .bfly, .moon, .hud';
  document.addEventListener('pointerdown', (e) => {
    if (!P.state.started || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target.closest(INTERACTIVE)) return;
    const canFire = (P.current === 'celebrate' && S.celebrate.canFire()) || (P.current === 'forever' && S.forever.canFire());
    if (canFire) {
      P.fireworks.launch({ x: e.clientX, y: Math.min(e.clientY, P.screen.h * 0.6) });
      P.fx.sparkles(e.clientX, e.clientY, 5);
    } else {
      P.fx.hearts(e.clientX, e.clientY, 4);
    }
  }, { passive: true });

  // Phones only allow sound after a touch, so the music starts with her first touch anywhere
  // (pointerup/touchend/click/keydown are the events browsers accept for that).
  const firstTouch = (e) => {
    if (e.type === 'keydown' && (e.ctrlKey || e.metaKey || e.altKey)) return;
    // Browsers differ on which of these events count as a real touch (iPhones trust touchend and
    // click most), so every one of them makes sure sound is switched on.
    P.audio.unlock();
    if (!P.state.started) P.start();
    else P.audio.retrySong();
  };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((type) => document.addEventListener(type, firstTouch, { passive: true }));

  // ── Start-up ─────────────────────────────────────────────────────────────────
  if (!P.build.noSong) P.audio.initSong(C.songFile);

  // Before midnight of her birthday, begin with the countdown (add #preview to the link to skip it).
  if (S.wait.locked() && !/^#preview$/i.test(location.hash)) {
    const gift = sceneEl('gift');
    const wait = sceneEl('wait');
    gift.classList.remove('is-active');
    gift.inert = true;
    gift.setAttribute('aria-hidden', 'true');
    wait.classList.add('is-active');
    wait.inert = false;
    wait.removeAttribute('aria-hidden');
    P.current = 'wait';
    try { history.replaceState({ scene: 'wait' }, ''); } catch (e) { /* sandboxed */ }
    S.wait.enter();
  }

  const ready = () => document.documentElement.classList.add('is-ready');
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, P.wait(1800)]).then(ready);
    // Warm up the faces used later so nothing flashes in a fallback font mid-story.
    ['800 60px "Baloo 2"', '600 20px "Baloo 2"', '400 40px "Great Vibes"', '400 20px Kalam', '700 20px Kalam', '300 20px Kalam']
      .forEach((f) => document.fonts.load(f).catch(() => {}));
  } else {
    ready();
  }

  updateNav();
  P.loop.start();
})();
