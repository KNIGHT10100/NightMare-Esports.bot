/* scenes.js · one controller per surprise. Each has enter(), leave() and reset(),
 * and owns its timers so leaving a scene halfway never leaves anything running. */
(function () {
  'use strict';

  const P = window.Phool;
  const C = P.config;
  const { $, h, rand, clamp, wait, Timers, replay } = P;
  const S = {};

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  };

  // ═══ 0 · Countdown to midnight (only before her birthday) ════════════════════
  S.wait = (function () {
    const scene = $('#scene-wait');
    const num = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
    const daysUnit = $('#cdDaysUnit');
    const daysSep = $('#cdDaysSep');
    const target = P.birthdayDate ? P.birthdayDate.getTime() : 0;
    const tl = new Timers();
    let timer = 0;
    let opened = false;
    let lastShown = -1;
    const pad = (n) => String(n).padStart(2, '0');

    if (P.birthdayDate) {
      $('#waitDate').textContent = P.birthdayDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
    }

    function render() {
      const left = target - Date.now();
      if (left <= 0) { open(); return; }
      const total = Math.ceil(left / 1000);
      const d = Math.floor(total / 86400);
      daysUnit.hidden = daysSep.hidden = d === 0;
      num.d.textContent = String(d);
      num.h.textContent = pad(Math.floor((total % 86400) / 3600));
      num.m.textContent = pad(Math.floor((total % 3600) / 60));
      num.s.textContent = pad(total % 60);
      if (total <= 10 && total !== lastShown) {
        lastShown = total;
        replay(num.s, 'is-tick');
        P.audio.tick(total <= 3);
        P.vibrate(8);
      }
    }

    function open() {
      if (opened) return;
      opened = true;
      clearInterval(timer);
      num.h.textContent = num.m.textContent = num.s.textContent = '00';
      scene.classList.add('is-open');
      $('#waitEyebrow').textContent = 'it’s midnight';
      $('#wait-title').textContent = 'It’s your birthday!';
      $('#waitLede').textContent = P.fill('Happy Birthday, {nickname}. Your surprise is ready.');
      P.fireworks.volley(9);
      tl.after(900, () => P.fireworks.launch({ x: P.screen.w / 2, y: P.screen.h * 0.22, shape: 'heart', size: 1.2 }));
      P.fx.rain(110);
      P.audio.chime();
      P.vibrate([30, 60, 30, 60, 90]);
      tl.after(5200, () => {
        P.go('gift', true);
        try { history.replaceState({ scene: 'gift' }, ''); } catch (e) { /* sandboxed */ }
      });
    }

    return {
      /** True while it is still before midnight of her birthday on this device. */
      locked: () => !!target && Date.now() < target,
      enter() {
        render();
        timer = setInterval(render, 250);
      },
      leave() {
        clearInterval(timer);
        tl.clear();
      },
      reset() {},
    };
  })();

  // ═══ 1 · The gift ═══════════════════════════════════════════════════════════
  S.gift = (function () {
    const btn = $('#giftBtn');
    let opened = false;

    btn.addEventListener('click', async () => {
      if (opened) return;
      opened = true;
      P.start();
      btn.classList.add('is-opening');
      P.vibrate([12, 60, 12, 60, 12]);
      await wait(P.reducedMotion ? 150 : 700);
      btn.classList.add('is-open');
      P.audio.pop();
      P.audio.chime();
      const c = centerOf(btn);
      P.fx.confetti(c.x, c.r.top + c.r.height * 0.35, { count: 130, power: 1.15 });
      P.fx.heartBurst(c.x, c.r.top + c.r.height * 0.35, 18);
      await wait(1150);
      P.go('celebrate');
    });

    return {
      enter() { this.reset(); },
      leave() {},
      reset() {
        opened = false;
        btn.classList.remove('is-opening', 'is-open');
      },
    };
  })();

  // ═══ 2 · Countdown and fireworks ════════════════════════════════════════════
  S.celebrate = (function () {
    const scene = $('#scene-celebrate');
    const countdown = $('#countdown');
    const tl = new Timers();
    let introDone = false;

    $('#volleyBtn').addEventListener('click', () => P.fireworks.volley(7));

    const reveal = () => scene.classList.add('is-revealed');

    return {
      canFire: () => scene.classList.contains('is-revealed'),
      enter() {
        P.music('play');
        if (introDone) {
          reveal();
          P.fireworks.show(true);
          return;
        }
        scene.classList.remove('is-revealed');
        ['3', '2', '1'].forEach((n, i) => {
          tl.after(600 + i * 850, () => {
            countdown.textContent = n;
            replay(countdown, 'is-ticking');
            P.audio.tick(i === 2);
            P.vibrate(10);
          });
        });
        tl.after(600 + 3 * 850, () => {
          countdown.textContent = '';
          countdown.classList.remove('is-ticking');
          const { w, h: hh } = P.screen;
          P.fireworks.word(P.fill(C.skyWords.celebrate), hh * 0.2, 170);
          // Side shells burst low and small so they frame the word instead of covering it.
          tl.after(250, () => P.fireworks.launch({ x: w * 0.16, y: hh * 0.44, shape: 'heart', size: 0.8 }));
          tl.after(500, () => P.fireworks.launch({ x: w * 0.84, y: hh * 0.44, shape: 'flower', size: 0.8 }));
          tl.after(1500, () => { reveal(); P.fx.rain(70); });
          tl.after(5200, () => { introDone = true; P.fireworks.show(true); });
        });
      },
      leave() {
        tl.clear();
        P.fireworks.show(false);
        countdown.textContent = '';
        countdown.classList.remove('is-ticking');
      },
      reset() {
        introDone = false;
        scene.classList.remove('is-revealed');
      },
    };
  })();

  // ═══ 3 · Cake, song and the wish ════════════════════════════════════════════
  S.wish = (function () {
    const scene = $('#scene-wish');
    const cake = $('#cake');
    const lyrics = $('#lyrics');
    const candlesEl = $('#candles');
    const hint = $('#wishHint');
    const micBtn = $('#micBtn');
    const done = $('#wishDone');
    const nextBtn = $('#wishNext');
    const lanternLayer = $('#lanterns');
    const tl = new Timers();
    const micLabel = micBtn.textContent;
    const hintText = hint.textContent;
    let blown = false;
    let stopMic = null;
    let listening = false;
    let blowCooldown = 0;

    const CANDLES = [
      { c1: '#ff8fb8', h: 44 }, { c1: '#b8a2ff', h: 52 }, { c1: '#ffcf6e', h: 58 }, { c1: '#8fe3cf', h: 52 }, { c1: '#ff9a76', h: 44 },
    ];
    const candles = CANDLES.map((cfg, i) => {
      const b = h('button', {
        class: 'candle',
        type: 'button',
        'aria-label': 'Blow out candle ' + (i + 1),
        style: '--c1:' + cfg.c1 + ';--h:' + cfg.h + 'px',
      }, [h('span', { class: 'candle__stick' }), h('span', { class: 'candle__flame' }), h('span', { class: 'candle__smoke' })]);
      b.addEventListener('click', () => blowOut(i));
      candlesEl.append(b);
      return b;
    });

    // Sprinkles scattered on both tiers (fixed seed so they look the same every visit).
    const SPRINKLE_COLORS = ['#ffcf6e', '#8fe3cf', '#b8a2ff', '#ffffff', '#ff6f9f'];
    let seed = 7;
    const seeded = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    scene.querySelectorAll('.cake__sprinkles').forEach((layer) => {
      for (let i = 0; i < 16; i++) {
        layer.append(h('i', { style: 'left:' + (6 + seeded() * 88).toFixed(1) + '%;top:' + (30 + seeded() * 55).toFixed(1) + '%;transform:rotate(' + Math.round(seeded() * 180) + 'deg);background:' + SPRINKLE_COLORS[i % SPRINKLE_COLORS.length] }));
      }
    });
    scene.querySelectorAll('.cake__drips').forEach((layer) => {
      for (let i = 0; i < 9; i++) {
        layer.append(h('i', { style: 'left:' + (4 + i * 11.2 + seeded() * 3).toFixed(1) + '%;height:' + Math.round(9 + seeded() * 17) + 'px' }));
      }
    });

    const lines = ((C.song && C.song.lyrics) || []).map((l) => h('li', { text: P.fill(l) }));
    lines.forEach((li) => lyrics.append(li));

    function sing() {
      P.music('quiet');
      const perf = P.audio.playBirthday();
      lines.forEach((l) => l.classList.remove('is-on', 'is-done'));
      if (!perf) {
        lines.forEach((l) => l.classList.add('is-done'));
        return;
      }
      perf.lines.forEach((ms, i) => {
        tl.after(ms, () => {
          if (i > 0) { lines[i - 1].classList.remove('is-on'); lines[i - 1].classList.add('is-done'); }
          lines[i].classList.add('is-on');
        });
      });
      tl.after(perf.total + 200, () => {
        lines.forEach((l) => { l.classList.remove('is-on'); l.classList.add('is-done'); });
        if (!blown) {
          hint.classList.add('is-nudge');
          if (!listening) P.music('play');
        }
      });
    }

    function litCandles() {
      return candles.filter((c) => !c.classList.contains('is-out'));
    }

    function blowOut(i) {
      const c = candles[i];
      if (!c || blown || c.classList.contains('is-out')) return;
      c.classList.add('is-out');
      c.setAttribute('aria-label', 'Candle ' + (i + 1) + ' is blown out');
      if (!listening) P.audio.puff(); // a synthetic puff near the microphone could blow the next candle
      P.vibrate(15);
      if (!litCandles().length) allOut();
    }

    function allOut() {
      blown = true;
      stopListening();
      micBtn.hidden = true;
      hint.hidden = true;
      scene.classList.add('is-wished');
      tl.after(450, () => {
        const c = centerOf(cake);
        P.fx.confetti(c.x, c.r.top + 30, { count: 150, power: 1.2 });
        P.audio.stopBirthday();
        P.audio.chime();
        P.music('play');
        done.hidden = false;
        replay(done, 'is-in');
        releaseLanterns();
        lines.forEach((l) => { l.classList.remove('is-on'); l.classList.add('is-done'); });
      });
      tl.after(1700, () => {
        nextBtn.hidden = false;
        replay(nextBtn, 'is-in');
      });
    }

    function releaseLanterns() {
      if (lanternLayer.childElementCount) return;
      const wishes = C.wishes || [];
      // Spread the lanes so neighbouring wishes don't rise side by side.
      const lanes = wishes.map((_, i) => i).sort(() => Math.random() - 0.5);
      wishes.forEach((wish, i) => {
        const lane = (lanes[i] + 0.5) / wishes.length;
        const text = P.fill(wish);
        const edge = lane < 0.3 ? ' lantern--left' : lane > 0.7 ? ' lantern--right' : '';
        const el = h('button', {
          class: 'lantern' + edge,
          type: 'button',
          'aria-label': 'A wish for you: ' + text,
          style: '--x:' + (6 + lane * 88).toFixed(1) + '%;--delay:' + (i * 1.3 + rand(0, 0.5)).toFixed(2) + 's;--dur:' + rand(15, 19).toFixed(1) + 's;--sway:' + Math.round(rand(10, 22)) + 'px;--size:' + rand(0.85, 1.15).toFixed(2),
        }, [h('span', { class: 'lantern__body' }), h('span', { class: 'lantern__wish', text })]);
        el.addEventListener('click', () => {
          const c = centerOf(el);
          P.fx.sparkles(c.x, c.y, 8);
          P.audio.chime('low');
          P.toast('A wish for you: ' + text, 4200);
        });
        lanternLayer.append(el);
      });
    }

    // Blowing for real, if a microphone is allowed here.
    function stopListening() {
      listening = false;
      if (stopMic) { stopMic(); stopMic = null; }
      cake.style.setProperty('--wind', '0');
      micBtn.disabled = false;
      micBtn.textContent = micLabel;
    }
    micBtn.addEventListener('click', async () => {
      if (stopMic || listening || blown) return;
      listening = true;
      // The room goes quiet for the candles: the phone's own speaker would reach its microphone.
      P.music('quiet');
      micBtn.disabled = true;
      micBtn.textContent = 'Listening… blow gently towards your phone';
      try {
        const stop = await P.audio.listenForBreath((f) => {
          cake.style.setProperty('--wind', f.level.toFixed(3));
          if (f.blowing && Date.now() > blowCooldown) {
            const lit = litCandles();
            if (lit.length) {
              blowOut(candles.indexOf(lit[Math.floor(Math.random() * lit.length)]));
              blowCooldown = Date.now() + 130;
            }
          }
        });
        if (blown || P.current !== 'wish') stop();
        else stopMic = stop;
      } catch (e) {
        listening = false;
        micBtn.hidden = true;
        hint.textContent = 'No microphone? No problem. Tap each flame to blow it out.';
        if (P.current === 'wish') P.music('play');
      }
    });

    return {
      enter() {
        if (blown) { P.music('play'); return; }
        micBtn.hidden = !P.audio.canListen() || !!P.build.noMic;
        tl.after(900, sing);
      },
      leave() {
        tl.clear();
        stopListening();
        P.audio.stopBirthday();
      },
      reset() {
        tl.clear();
        stopListening();
        blown = false;
        candles.forEach((c, i) => { c.classList.remove('is-out'); c.setAttribute('aria-label', 'Blow out candle ' + (i + 1)); });
        scene.classList.remove('is-wished');
        hint.hidden = false;
        hint.textContent = hintText;
        hint.classList.remove('is-nudge');
        done.hidden = true;
        nextBtn.hidden = true;
        lanternLayer.textContent = '';
        lines.forEach((l) => l.classList.remove('is-on', 'is-done'));
      },
    };
  })();

  // ═══ 4 · Polaroid memories ══════════════════════════════════════════════════
  S.memories = (function () {
    const scene = $('#scene-memories');
    const deck = $('#deck');
    const dotsEl = $('#deckDots');
    const photos = C.photos || [];
    let cards = [];
    let order = [];
    let dots = [];
    let built = false;
    let drag = null;
    let busy = false;
    let nudged = false;
    const seen = new Set();

    function build() {
      if (built) return;
      built = true;
      cards = photos.map((p, i) => {
        const img = h('img', { src: p.src, alt: p.alt || '', draggable: 'false', decoding: 'async' });
        const photo = h('div', { class: 'polaroid__photo' }, [img, h('span', { class: 'polaroid__missing', text: 'photo coming soon' })]);
        img.addEventListener('error', () => photo.classList.add('is-missing'), { once: true });
        const caption = P.fill(p.caption || '');
        const front = h('figure', { class: 'polaroid card__front' + (p.wide ? ' polaroid--wide' : '') }, [
          h('span', { class: 'tape tape--' + (p.tape || 'pink') }),
          photo,
          h('figcaption', { class: 'polaroid__caption' + (caption.length > 20 ? ' polaroid__caption--long' : ''), text: caption }),
        ]);
        (p.stickers || []).forEach((s) => front.append(P.sticker(s[0], null, 'sticker sticker--' + s[1])));
        const back = h('div', { class: 'polaroid card__back' }, [
          h('span', { class: 'tape tape--' + (p.tape || 'pink') }),
          h('p', { class: 'card__note', text: P.fill(p.note || '') }),
          h('span', { class: 'card__turn', text: 'tap to turn back' }),
        ]);
        back.append(P.sticker('heart', null, 'sticker sticker--br'));
        const card = h('div', { class: 'card', role: 'group', 'aria-roledescription': 'photo', 'aria-label': (p.alt || 'Photo') + '. Photo ' + (i + 1) + ' of ' + photos.length }, [
          h('div', { class: 'card__inner' }, [front, back]),
        ]);
        card.dataset.tilt = rand(-7, 7).toFixed(1);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(card); }
        });
        deck.append(card);
        return card;
      });
      order = cards.map((_, i) => i);
      dots = photos.map(() => {
        const d = h('span', { class: 'deck-dot' });
        dotsEl.append(d);
        return d;
      });
      layout(false);

      deck.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      $('#deckNext').addEventListener('click', () => throwTop(1));
      $('#deckPrev').addEventListener('click', bringBack);
      scene.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') throwTop(1);
        if (e.key === 'ArrowLeft') bringBack();
      });
    }

    function restingTransform(card, depth) {
      const tilt = parseFloat(card.dataset.tilt);
      return 'translate(-50%, -50%) translateY(' + depth * 7 + 'px) rotate(' + (depth === 0 ? tilt * 0.35 : tilt).toFixed(2) + 'deg) scale(' + (1 - depth * 0.035).toFixed(3) + ')';
    }

    function layout(animate) {
      order.forEach((ci, depth) => {
        const card = cards[ci];
        card.style.zIndex = String(100 - depth);
        card.style.transition = animate ? 'transform .55s var(--ease-out), opacity .4s ease' : 'none';
        card.style.transform = restingTransform(card, depth);
        card.style.opacity = depth > 3 ? '0' : '1';
        card.classList.toggle('is-top', depth === 0);
        card.tabIndex = depth === 0 ? 0 : -1;
        card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
      });
      dots.forEach((d, i) => d.classList.toggle('is-on', i === order[0]));
      seen.add(order[0]);
      if (seen.size === cards.length) scene.classList.add('is-complete');
    }

    function flip(card) {
      card.classList.toggle('is-flipped');
      P.audio.rustle();
      P.vibrate(8);
    }

    function onDown(e) {
      const card = e.target.closest('.card');
      if (!card || !card.classList.contains('is-top') || drag || busy) return;
      drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t0: Date.now(), moved: false };
      card.style.transition = 'none';
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x0;
      drag.dy = e.clientY - drag.y0;
      if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 8) drag.moved = true;
      if (drag.moved) {
        const tilt = parseFloat(drag.card.dataset.tilt) * 0.35;
        drag.card.style.transform = 'translate(-50%, -50%) translate(' + drag.dx + 'px,' + (drag.dy * 0.35).toFixed(1) + 'px) rotate(' + (tilt + drag.dx * 0.06).toFixed(2) + 'deg)';
      }
    }

    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      const speed = d.dx / Math.max(Date.now() - d.t0, 1);
      if (!d.moved && e.type === 'pointerup') {
        flip(d.card);
        layout(true);
      } else if (Math.abs(d.dx) > 90 || Math.abs(speed) > 0.55) {
        throwTop(Math.sign(d.dx) || 1);
      } else {
        layout(true);
      }
    }

    function throwTop(dir) {
      if (busy || !cards.length) return;
      busy = true;
      const card = cards[order[0]];
      card.style.transition = 'transform .42s cubic-bezier(.4,.1,.7,1), opacity .42s ease';
      card.style.transform = 'translate(-50%, -50%) translate(' + dir * (P.screen.w * 0.9 + 140) + 'px,' + rand(-40, 20).toFixed(0) + 'px) rotate(' + dir * 28 + 'deg)';
      P.audio.whoosh();
      P.vibrate(8);
      setTimeout(() => {
        order.push(order.shift());
        card.classList.remove('is-flipped');
        layout(true);
        busy = false;
      }, 360);
    }

    function bringBack() {
      if (busy || !cards.length) return;
      busy = true;
      order.unshift(order.pop());
      const card = cards[order[0]];
      card.classList.remove('is-flipped');
      card.style.transition = 'none';
      card.style.transform = 'translate(-50%, -50%) translate(' + -(P.screen.w * 0.9 + 140) + 'px, 0) rotate(-28deg)';
      void card.offsetWidth;
      layout(true);
      P.audio.whoosh();
      setTimeout(() => { busy = false; }, 420);
    }

    return {
      enter() {
        build();
        P.music('play');
        if (!nudged) {
          nudged = true;
          setTimeout(() => replay(deck, 'is-nudging'), 1100);
        }
      },
      leave() {},
      reset() {
        if (!built) return;
        order = cards.map((_, i) => i);
        cards.forEach((c) => c.classList.remove('is-flipped'));
        seen.clear();
        scene.classList.remove('is-complete');
        nudged = false;
        layout(false);
      },
    };
  })();

  // ═══ 5 · The handwritten khat ═══════════════════════════════════════════════
  S.khat = (function () {
    const intro = $('#khatIntro');
    const envelope = $('#envelope');
    const seal = $('#sealBtn');
    const letter = $('#letter');
    const paper = $('#letterPaper');
    const textEl = $('#letterText');
    const pen = $('#pen');
    const sign = $('#letterSign');
    const skip = $('#skipWriting');
    const nextBtn = $('#khatNext');
    const tl = new Timers();
    const items = []; // { el, ch } for characters, { pause } between paragraphs
    let built = false;
    let opened = false;
    let finished = false;
    let writing = false;
    let idx = 0;
    let userTouchedAt = 0;

    function build() {
      if (built) return;
      built = true;
      const L = C.letter;
      // Dated on her birthday, whichever day she happens to read it.
      $('#letterDate').textContent = (P.birthdayDate || new Date()).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
      const blocks = [{ text: P.fill(L.greeting), cls: 'letter__greeting' }].concat(L.paragraphs.map((p) => ({ text: P.fill(p) })));
      blocks.forEach((b) => {
        const para = h('p', { class: b.cls || null });
        b.text.split('==').forEach((part, pi) => {
          let target = para;
          if (pi % 2 === 1) {
            target = h('mark', { class: 'hl' });
            para.append(target);
          }
          part.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) {
              const sp = h('span', { class: 'ch' });
              sp.textContent = ' ';
              target.append(sp);
              items.push({ el: sp, ch: ' ' });
              return;
            }
            const word = h('span', { class: 'w' });
            P.graphemes(tok).forEach((g) => {
              const c = h('span', { class: 'ch' });
              c.textContent = g;
              word.append(c);
              items.push({ el: c, ch: g });
            });
            target.append(word);
          });
          // The highlighter sweeps across once the pen reaches the end of the marked words.
          if (target !== para && items.length) items[items.length - 1].lights = target;
        });
        textEl.append(para);
        items.push({ pause: 480 });
      });
      $('#letterClosing').textContent = P.fill(L.closing);
      $('#letterSignature').textContent = C.from ? P.fill(C.from) : '';
      ['touchstart', 'wheel', 'pointerdown'].forEach((t) => paper.addEventListener(t, () => { userTouchedAt = Date.now(); }, { passive: true }));
    }

    function follow(el) {
      const x = el.offsetLeft + el.offsetWidth;
      const y = el.offsetTop;
      pen.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      if (Date.now() - userTouchedAt > 2500) {
        const target = y - paper.clientHeight * 0.55;
        if (target > paper.scrollTop + 30) paper.scrollTop = target;
      }
    }

    function writeNext() {
      if (!writing) return;
      if (idx >= items.length) { finish(); return; }
      const item = items[idx++];
      let delay;
      if (item.pause) {
        delay = item.pause;
      } else {
        item.el.classList.add('is-in');
        if (item.lights) item.lights.classList.add('is-lit');
        follow(item.el);
        const ch = item.ch;
        delay = ch === ' ' ? 16 : /[.!?]/.test(ch) ? 300 : /[,;:]/.test(ch) ? 160 : rand(20, 40);
        if (P.reducedMotion) delay *= 0.35;
      }
      tl.after(delay, writeNext);
    }

    function finish() {
      writing = false;
      finished = true;
      tl.clear();
      items.forEach((it) => {
        if (it.el) it.el.classList.add('is-in');
        if (it.lights) it.lights.classList.add('is-lit');
      });
      pen.classList.add('is-done');
      sign.hidden = false;
      replay(sign, 'is-in');
      skip.hidden = true;
      nextBtn.hidden = false;
      replay(nextBtn, 'is-in');
      P.audio.chime('low');
    }

    seal.addEventListener('click', async () => {
      if (opened) return;
      opened = true;
      P.vibrate(20);
      P.audio.pop();
      intro.classList.add('is-opening');
      envelope.classList.add('is-open');
      await wait(650);
      P.audio.rustle();
      await wait(P.reducedMotion ? 200 : 900);
      intro.classList.add('is-gone');
      await wait(420);
      intro.hidden = true;
      build();
      letter.hidden = false;
      replay(letter, 'is-in');
      await wait(600);
      if (P.current === 'khat' && !finished) {
        writing = true;
        writeNext();
      }
    });

    skip.addEventListener('click', finish);

    return {
      enter() {
        P.music('play');
        if (opened && !finished && !writing && !letter.hidden) {
          writing = true;
          writeNext();
        }
      },
      leave() {
        writing = false;
        tl.clear();
      },
      reset() {
        tl.clear();
        writing = false;
        finished = false;
        opened = false;
        idx = 0;
        items.forEach((it) => {
          if (it.el) it.el.classList.remove('is-in');
          if (it.lights) it.lights.classList.remove('is-lit');
        });
        envelope.classList.remove('is-open');
        intro.hidden = false;
        intro.classList.remove('is-gone', 'is-opening');
        letter.hidden = true;
        sign.hidden = true;
        skip.hidden = false;
        nextBtn.hidden = true;
        pen.classList.remove('is-done');
        pen.style.transform = '';
        paper.scrollTop = 0;
      },
      showFinished() {
        if (!built) build();
        opened = true;
        intro.hidden = true;
        letter.hidden = false;
        if (!finished) finish();
      },
    };
  })();

  // ═══ 6 · Scratch cards ══════════════════════════════════════════════════════
  S.surprises = (function () {
    const scene = $('#scene-surprises');
    const grid = $('#scratchGrid');
    const items = C.surprises || [];
    const cards = [];
    let built = false;

    function miniHeart(g, x, y, s) {
      g.beginPath();
      g.moveTo(x, y + s * 0.9);
      g.bezierCurveTo(x - s * 1.4, y, x - s * 0.6, y - s, x, y - s * 0.3);
      g.bezierCurveTo(x + s * 0.6, y - s, x + s * 1.4, y, x, y + s * 0.9);
      g.fill();
    }

    function paint(sc) {
      // Layout size, not getBoundingClientRect: the scene may still be mid-zoom when this runs.
      const r = { width: sc.card.offsetWidth, height: sc.card.offsetHeight };
      if (!r.width || sc.revealed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sc.canvas.width = Math.round(r.width * dpr);
      sc.canvas.height = Math.round(r.height * dpr);
      const g = sc.canvas.getContext('2d', { willReadFrequently: true });
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      sc.ctx = g;
      g.globalCompositeOperation = 'source-over';
      const grad = g.createLinearGradient(0, 0, r.width, r.height);
      grad.addColorStop(0, '#f8d894');
      grad.addColorStop(0.38, '#f5b9cc');
      grad.addColorStop(0.72, '#cbb9f6');
      grad.addColorStop(1, '#f8d894');
      g.fillStyle = grad;
      g.fillRect(0, 0, r.width, r.height);
      g.fillStyle = 'rgba(255,255,255,.16)';
      for (let x = -r.height; x < r.width; x += 26) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + 10, 0);
        g.lineTo(x + 10 + r.height, r.height);
        g.lineTo(x + r.height, r.height);
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.4)';
      for (let y = 16, row = 0; y < r.height; y += 26, row++) {
        for (let x = (row % 2) * 13 + 12; x < r.width; x += 26) miniHeart(g, x, y, 4.5);
      }
      g.fillStyle = 'rgba(255,255,255,.75)';
      g.beginPath();
      g.roundRect ? g.roundRect(r.width / 2 - 52, r.height / 2 - 17, 104, 34, 17) : g.rect(r.width / 2 - 52, r.height / 2 - 17, 104, 34);
      g.fill();
      g.fillStyle = '#7a2350';
      g.font = '700 15px "Baloo 2", "Trebuchet MS", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('scratch me', r.width / 2, r.height / 2 + 1);
      sc.card.classList.add('is-ready');
    }

    /** Finger position in the canvas's own CSS pixels, correct even while the card is scaled. */
    const posOf = (sc, e) => {
      const r = sc.canvas.getBoundingClientRect();
      const kx = r.width ? sc.canvas.offsetWidth / r.width : 1;
      const ky = r.height ? sc.canvas.offsetHeight / r.height : 1;
      return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky };
    };

    function scratchLine(sc, a, b) {
      const g = sc.ctx;
      if (!g) return;
      g.globalCompositeOperation = 'destination-out';
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineWidth = 38;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x + 0.01, b.y);
      g.stroke();
    }

    function cleared(sc) {
      const g = sc.ctx;
      const { width, height } = sc.canvas;
      const data = g.getImageData(0, 0, width, height).data;
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 4 * 13) {
        total++;
        if (data[i] < 40) clear++;
      }
      return total ? clear / total : 0;
    }

    function reveal(sc) {
      if (sc.revealed) return;
      sc.revealed = true;
      sc.drawing = false;
      sc.card.classList.add('is-revealed');
      sc.card.setAttribute('aria-label', sc.label);
      P.audio.scratchEnd();
      P.audio.chime();
      P.vibrate([15, 40, 25]);
      const c = centerOf(sc.card);
      P.fx.sparkles(c.x, c.y, 14);
      P.fx.confetti(c.x, c.y, { count: 36, power: 0.7 });
      if (cards.every((k) => k.revealed)) {
        scene.classList.add('is-complete');
        setTimeout(() => P.fx.rain(60), 500);
      }
    }

    function build() {
      if (built) return;
      built = true;
      items.forEach((it, i) => {
        const title = P.fill(it.title);
        const text = P.fill(it.text);
        const content = h('div', { class: 'scratch__content' }, [
          P.sticker(it.icon || 'heart', null, 'sticker scratch__icon'),
          h('p', { class: 'scratch__title', text: title }),
          h('p', { class: 'scratch__text', text }),
        ]);
        const canvas = h('canvas', { class: 'scratch__foil', 'aria-hidden': 'true' });
        const card = h('div', { class: 'scratch', tabindex: '0', role: 'button', 'aria-label': 'Scratch card ' + (i + 1) + ' of ' + items.length + '. Press Enter to reveal it.' }, [content, canvas]);
        grid.append(card);
        const sc = { card, canvas, ctx: null, revealed: false, drawing: false, last: null, moves: 0, label: title + '. ' + text };
        cards.push(sc);

        canvas.addEventListener('pointerdown', (e) => {
          if (sc.revealed) return;
          sc.drawing = true;
          sc.last = posOf(sc, e);
          try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          scratchLine(sc, sc.last, sc.last);
        });
        canvas.addEventListener('pointermove', (e) => {
          if (!sc.drawing || sc.revealed) return;
          const p = posOf(sc, e);
          const dist = Math.hypot(p.x - sc.last.x, p.y - sc.last.y);
          scratchLine(sc, sc.last, p);
          P.audio.scratch(Math.min(1, dist / 16));
          sc.last = p;
          if (++sc.moves % 8 === 0 && cleared(sc) > 0.45) reveal(sc);
        });
        const end = () => {
          if (!sc.drawing) return;
          sc.drawing = false;
          P.audio.scratchEnd();
          if (!sc.revealed && sc.ctx && cleared(sc) > 0.45) reveal(sc);
        };
        canvas.addEventListener('pointerup', end);
        canvas.addEventListener('pointercancel', end);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(sc); }
        });
      });
      P.onResize(() => cards.forEach(paint));
    }

    return {
      enter() {
        build();
        P.music('play');
        requestAnimationFrame(() => cards.forEach((sc) => { if (!sc.ctx) paint(sc); }));
      },
      leave() { P.audio.scratchEnd(); },
      reset() {
        cards.forEach((sc) => {
          sc.revealed = false;
          sc.ctx = null;
          sc.card.classList.remove('is-revealed', 'is-ready');
        });
        scene.classList.remove('is-complete');
      },
    };
  })();

  // ═══ 7 · One tiny question ══════════════════════════════════════════════════
  S.question = (function () {
    const Q = C.question;
    const yes = $('#yesBtn');
    const no = $('#noBtn');
    const plead = $('#plead');
    let tries = 0;
    let answered = false;

    $('#questionText').textContent = P.fill(Q.ask);
    yes.textContent = P.fill(Q.yes);
    no.textContent = P.fill(Q.no);

    function say(text) {
      plead.textContent = text;
      replay(plead, 'is-in');
    }

    function dodge(e) {
      if (answered || no.classList.contains('is-converted')) return;
      tries++;
      const pleads = Q.pleads || [];
      say(P.fill(pleads[Math.min(tries, pleads.length) - 1] || ''));
      yes.style.setProperty('--grow', String(1 + Math.min(tries, 6) * 0.15));
      P.vibrate(10);
      P.audio.tick(false);
      if (tries >= pleads.length) {
        no.textContent = P.fill(Q.yes);
        no.classList.add('is-converted');
        return;
      }
      const { w, h: hh } = P.screen;
      const bw = no.offsetWidth;
      const bh = no.offsetHeight;
      const px = e && e.clientX != null ? e.clientX : w / 2;
      const py = e && e.clientY != null ? e.clientY : hh / 2;
      // Keep clear of the Yes button and every line of text, and jump well away from the finger.
      const avoid = [yes, plead, $('#questionText'), $('#question-title')].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
      const hits = (x, top) => avoid.some((r) => x < r.right + 14 && x + bw > r.left - 14 && top < r.bottom + 10 && top + bh > r.top - 10);
      let x = 0;
      let top = 0;
      for (let attempt = 0; attempt < 80; attempt++) {
        x = rand(16, w - bw - 16);
        top = rand(hh * 0.14, hh * 0.86 - bh);
        if (!hits(x, top) && Math.hypot(x + bw / 2 - px, top + bh / 2 - py) > 120) break;
      }
      no.classList.add('is-running');
      no.style.left = x.toFixed(0) + 'px';
      no.style.top = top.toFixed(0) + 'px';
      no.style.setProperty('--shrink', String(Math.max(0.62, 1 - tries * 0.08)));
    }

    function accept(btn) {
      if (answered) { P.go('forever'); return; }
      answered = true;
      say(P.fill(Q.yay));
      const c = centerOf(btn);
      P.fx.heartBurst(c.x, c.y, 55);
      P.fx.confetti(c.x, c.y, { count: 90, power: 1.1 });
      P.audio.chime();
      P.vibrate([20, 50, 20, 50, 60]);
      setTimeout(() => { if (P.current === 'question') P.go('forever'); }, 2300);
    }

    yes.addEventListener('click', () => accept(yes));
    no.addEventListener('pointerdown', (e) => {
      if (!no.classList.contains('is-converted')) { e.preventDefault(); dodge(e); }
    });
    no.addEventListener('click', (e) => {
      if (no.classList.contains('is-converted')) accept(no);
      else if (e.detail === 0) dodge(null); // keyboard
    });

    return {
      enter() {
        P.music('play');
        if (answered) say('You already said yes. No take-backs.');
      },
      leave() {},
      reset() {
        tries = 0;
        answered = false;
        yes.style.removeProperty('--grow');
        no.textContent = P.fill(Q.no);
        no.classList.remove('is-running', 'is-converted');
        no.style.left = '';
        no.style.top = '';
        no.style.removeProperty('--shrink');
        plead.textContent = '';
      },
    };
  })();

  // ═══ 8 · Forever ════════════════════════════════════════════════════════════
  S.forever = (function () {
    const heart = $('#loveHeart');
    const ring = $('#loveRing');
    const holdEl = $('#foreverHold');
    const finale = $('#finale');
    const F = C.finale;
    const tl = new Timers();
    const CIRC = 2 * Math.PI * 54;
    const HOLD_MS = 2400;
    let progress = 0;
    let holding = false;
    let done = false;
    let raf = 0;
    let lastT = 0;
    let lastBeat = 0;

    $('#finaleTitle').textContent = P.fill(F.title);
    $('#finaleLine').textContent = P.fill(F.line);
    $('#finaleQuote').textContent = P.fill(F.quote);
    // "Happy Birthday, my Phool." breaks after the comma, never before the name.
    const wish = P.fill(F.wish);
    const comma = wish.indexOf(', ');
    if (comma > 0) {
      $('#finaleWish').append(wish.slice(0, comma + 1), h('br'), wish.slice(comma + 2));
    } else {
      $('#finaleWish').textContent = wish;
    }
    ring.style.strokeDasharray = CIRC.toFixed(2);
    ring.style.strokeDashoffset = CIRC.toFixed(2);

    function setProgress(p) {
      progress = p;
      ring.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(2);
      heart.style.setProperty('--p', p.toFixed(3));
    }

    function run() {
      if (raf || done) return;
      lastT = performance.now();
      const step = (t) => {
        const dt = Math.min(t - lastT, 60);
        lastT = t;
        setProgress(clamp(progress + (holding ? dt / HOLD_MS : -dt / 900), 0, 1));
        if (holding && t - lastBeat > 560 - progress * 280) {
          lastBeat = t;
          P.audio.heartbeat(0.6 + progress * 0.6);
          P.vibrate([22, 90, 16]);
          const c = centerOf(heart);
          P.fx.hearts(c.x + rand(-30, 30), c.y - 10, 2 + Math.round(progress * 3));
        }
        if (progress >= 1) { raf = 0; complete(); return; }
        if (progress <= 0 && !holding) { raf = 0; return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    const press = () => {
      if (done) return;
      holding = true;
      heart.classList.add('is-holding');
      run();
    };
    const release = () => {
      holding = false;
      heart.classList.remove('is-holding');
    };
    heart.addEventListener('pointerdown', (e) => {
      try { heart.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      press();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => heart.addEventListener(t, release));
    heart.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(); }
    });
    heart.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') release(); });
    heart.addEventListener('contextmenu', (e) => e.preventDefault());

    function complete() {
      done = true;
      release();
      const c = centerOf(heart);
      P.fx.heartBurst(c.x, c.y, 60);
      P.audio.boom(1.3, 0);
      P.audio.chime();
      P.vibrate([40, 60, 40, 60, 120]);
      heart.classList.add('is-burst');
      tl.after(700, () => {
        holdEl.hidden = true;
        finale.hidden = false;
        replay(finale, 'is-in');
        grandFinale();
      });
    }

    function grandFinale() {
      const { w, h: hh } = P.screen;
      P.fireworks.launch({ x: w * 0.5, y: hh * 0.25, shape: 'heart', size: 1.25 });
      tl.after(350, () => P.fireworks.launch({ x: w * 0.18, y: hh * 0.3, shape: 'flower' }));
      tl.after(650, () => P.fireworks.launch({ x: w * 0.82, y: hh * 0.3, shape: 'butterfly' }));
      tl.after(1100, () => P.fx.rain(90));
      // The words go up once the first shells have faded, and nothing else bursts over them.
      tl.after(2400, () => P.fireworks.word(P.fill(C.skyWords.finale), hh * 0.2, 210));
      tl.after(8200, () => P.fireworks.volley(8));
      tl.after(10500, () => P.fireworks.show(true));
    }

    $('#fireAgainBtn').addEventListener('click', () => P.fireworks.volley(8));
    $('#letterAgainBtn').addEventListener('click', () => {
      S.khat.showFinished();
      P.go('khat');
    });
    $('#replayBtn').addEventListener('click', () => P.replayAll());

    return {
      canFire: () => done,
      enter() {
        P.music('play');
        if (done && !finale.hidden) P.fireworks.show(true);
      },
      leave() {
        tl.clear();
        release();
        P.fireworks.show(false);
      },
      reset() {
        tl.clear();
        done = false;
        holding = false;
        cancelAnimationFrame(raf);
        raf = 0;
        setProgress(0);
        heart.classList.remove('is-holding', 'is-burst');
        holdEl.hidden = false;
        finale.hidden = true;
      },
    };
  })();

  P.scenes = S;
})();
