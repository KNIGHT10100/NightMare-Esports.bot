/* audio.js · every sound is synthesised live with the Web Audio API, so the page needs no audio files.
 *
 *  master ─ limiter ─ speakers
 *    ├─ musicBus ─┬─ ambientBus  (original music-box lullaby, loops)      ─┐
 *    │            ├─ partyBus    (Happy Birthday, synced to the lyrics)   ─┼─ reverb
 *    │            └─ songBus     (optional song file, no reverb)           │
 *    └─ sfxBus    (fireworks, pops, chimes, scratch, heartbeat)           ─┘
 */
(function () {
  'use strict';

  const P = window.Phool;
  const { rand, clamp } = P;
  const A = { ready: false };

  let ctx = null;
  let master, musicBus, ambientBus, partyBus, songBus, sfxBus, reverbIn, noiseBuf;
  let lastBoom = 0;
  let lastCrackle = 0;

  const SEMITONE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  /** 'A4' -> 440 (equal temperament, MIDI 69 = A4). */
  function hz(note) {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
    const midi = (parseInt(m[2], 10) + 1) * 12 + SEMITONE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  const live = () => !!ctx && ctx.state === 'running' && !P.state.muted;

  function gainNode(value, to) {
    const g = ctx.createGain();
    g.gain.value = value;
    if (to) g.connect(to);
    return g;
  }

  function fade(node, value, seconds) {
    const now = ctx.currentTime;
    const g = node.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(value, now + seconds);
  }

  function makeNoise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Stereo impulse response: decaying noise gives a soft "room" to the music box. */
  function makeImpulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function out(node, bus, pan) {
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      node.connect(p);
      p.connect(bus);
    } else {
      node.connect(bus);
    }
  }

  /** Must run inside a tap: creates the audio graph and unlocks playback on iOS and Android. */
  A.unlock = function () {
    if (ctx) {
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    // Play through the media channel (Safari 16.4+), like tapping play on a video.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) {
      try { ctx = new AC(); } catch (e2) { return false; }
    }

    master = gainNode(P.state.muted ? 0 : 1);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 10;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.3;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(2.6, 2.4);
    reverbIn = gainNode(1);
    reverbIn.connect(convolver);
    convolver.connect(gainNode(0.9, master));

    musicBus = gainNode(0.85, master);
    ambientBus = gainNode(0, musicBus);
    ambientBus.connect(gainNode(0.5, reverbIn));
    partyBus = gainNode(1, musicBus);
    partyBus.connect(gainNode(0.38, reverbIn));
    songBus = gainNode(0, musicBus);
    sfxBus = gainNode(0.8, master);
    sfxBus.connect(gainNode(0.18, reverbIn));

    noiseBuf = makeNoise(2);

    const blip = ctx.createBufferSource();
    blip.buffer = ctx.createBuffer(1, 1, 22050);
    blip.connect(ctx.destination);
    blip.start(0);
    if (ctx.state !== 'running') ctx.resume().catch(() => {});

    A.ready = true;
    wireSong();
    return true;
  };

  A.setMuted = function (muted) {
    P.state.muted = muted;
    if (ctx) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(muted ? 0 : 1, t, 0.08);
      if (!muted && ctx.state !== 'running') ctx.resume().catch(() => {});
    }
    if (song.el && !song.routed) song.el.muted = muted;
  };

  // ── Music-box voice: a sine with slightly stretched partials that decay faster than the fundamental.
  const BELL = [[1, 1, 1], [2, 0.34, 0.55], [3, 0.13, 0.33], [4.16, 0.06, 0.2]];
  function bell(freq, t, opt) {
    const o = opt || {};
    const vel = o.vel == null ? 0.2 : o.vel;
    const dur = o.dur || 1.8;
    const voice = gainNode(vel);
    for (let i = 0; i < BELL.length; i++) {
      const ratio = BELL[i][0];
      if (freq * ratio > 12000) continue;
      const amp = BELL[i][1];
      const len = dur * BELL[i][2];
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * ratio;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(amp, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(env);
      env.connect(voice);
      osc.start(t);
      osc.stop(t + len + 0.05);
    }
    out(voice, o.bus || musicBus, o.pan);
  }

  /** A warm, slow sine for bass notes under the arpeggios. */
  function pad(freq, t, vel, dur, bus) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + 0.04);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    out(env, bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ── Happy Birthday (public domain), 3/4, with a held note on the name.
  const HB = [
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
  ];
  const HB_LINE_STARTS = [0, 6, 12, 19];
  const HB_CHORDS = {
    2: ['C3', 'G3', 'E4'], 5: ['G2', 'D3', 'B3'], 8: ['G2', 'D3', 'F4'], 11: ['C3', 'G3', 'E4'],
    14: ['C3', 'G3', 'E4'], 17: ['F2', 'C3', 'A3'], 21: ['C3', 'G3', 'E4'], 23: ['G2', 'D3', 'B3'], 24: ['C3', 'G3', 'E4'],
  };
  let birthdayVoice = null;

  /** Schedules the song; returns line start offsets (ms) so the lyrics can follow along. */
  A.playBirthday = function () {
    if (!ctx) return null;
    A.stopBirthday();
    birthdayVoice = gainNode(1, partyBus);
    const beat = 60 / 104;
    const now = ctx.currentTime;
    let t = now + 0.4;
    const lines = [];
    HB.forEach((n, i) => {
      if (HB_LINE_STARTS.indexOf(i) !== -1) lines.push((t - now) * 1000);
      const f = hz(n[0]);
      bell(f, t, { vel: 0.3, dur: Math.max(1.3, n[1] * beat * 2.4), bus: birthdayVoice });
      bell(f / 2, t, { vel: 0.07, dur: 1.4, bus: birthdayVoice });
      const chord = HB_CHORDS[i];
      if (chord) chord.forEach((c, k) => bell(hz(c), t + k * 0.035, { vel: 0.1, dur: 2.4, bus: birthdayVoice }));
      t += n[1] * beat;
    });
    return { lines, total: (t - now) * 1000 };
  };

  A.stopBirthday = function () {
    if (!birthdayVoice) return;
    const g = birthdayVoice;
    birthdayVoice = null;
    fade(g, 0, 0.5);
    setTimeout(() => g.disconnect(), 700);
  };

  // ── Ambient lullaby: an original 8-bar progression in F major, arpeggiated like a music box.
  const PROG = [
    { bass: 'F3', arp: ['F4', 'A4', 'C5', 'F5', 'A5'] },
    { bass: 'E3', arp: ['E4', 'G4', 'C5', 'E5', 'G5'] },
    { bass: 'D3', arp: ['D4', 'F4', 'A4', 'D5', 'F5'] },
    { bass: 'Bb2', arp: ['D4', 'F4', 'Bb4', 'D5', 'F5'] },
    { bass: 'A2', arp: ['F4', 'A4', 'C5', 'F5', 'A5'] },
    { bass: 'G2', arp: ['F4', 'G4', 'Bb4', 'D5', 'F5'] },
    { bass: 'C3', arp: ['F4', 'G4', 'C5', 'F5', 'G5'] },
    { bass: 'C3', arp: ['E4', 'G4', 'Bb4', 'C5', 'E5'] },
  ];
  const ARP = [0, 1, 2, 3, 4, 3, 2, 1];
  // [bar, eighth, note, length in eighths]
  const MELODY = [
    [0, 0, 'A5', 4], [0, 4, 'G5', 2], [0, 6, 'F5', 2],
    [1, 0, 'E5', 4], [1, 4, 'G5', 4],
    [2, 0, 'F5', 2], [2, 2, 'E5', 2], [2, 4, 'D5', 2], [2, 6, 'A5', 2],
    [3, 0, 'F5', 6],
    [4, 0, 'C6', 4], [4, 4, 'Bb5', 2], [4, 6, 'A5', 2],
    [5, 0, 'G5', 4], [5, 4, 'Bb5', 2], [5, 6, 'D6', 2],
    [6, 0, 'C6', 4], [6, 4, 'A5', 2], [6, 6, 'G5', 2],
    [7, 0, 'E5', 4], [7, 4, 'G5', 2], [7, 6, 'Bb5', 2],
  ];
  const TWINKLE = ['C6', 'D6', 'F6', 'G6', 'A6', 'C7'];
  const EIGHTH = 60 / 76 / 2;
  const amb = { on: false, timer: 0, stopTimer: 0, step: 0, next: 0 };

  function scheduleAmbient(step, t) {
    const bar = Math.floor(step / 8) % 8;
    const pos = step % 8;
    const pass = Math.floor(step / 64); // which time round the 8 bars we are
    const chord = PROG[bar];
    if (pos === 0) pad(hz(chord.bass), t, 0.07, EIGHTH * 8.5, ambientBus);
    bell(hz(chord.arp[ARP[pos]]), t + rand(0, 0.012), { vel: (pos === 0 ? 0.13 : 0.085) * rand(0.85, 1.1), dur: 1.9, bus: ambientBus, pan: rand(-0.25, 0.25) });
    if (pass % 2 === 1) {
      MELODY.forEach((m) => {
        if (m[0] === bar && m[1] === pos) bell(hz(m[2]), t, { vel: 0.16, dur: EIGHTH * m[3] * 1.8 + 0.6, bus: ambientBus });
      });
    }
    if (pos === 5 && Math.random() < 0.18) bell(hz(TWINKLE[Math.floor(Math.random() * TWINKLE.length)]), t, { vel: 0.05, dur: 2.2, bus: ambientBus, pan: rand(-0.6, 0.6) });
  }

  function ambientTick() {
    if (!ctx) return;
    while (amb.next < ctx.currentTime + 0.3) {
      scheduleAmbient(amb.step, amb.next);
      amb.next += EIGHTH;
      amb.step++;
    }
  }

  A.ambient = function (on) {
    if (!ctx) return;
    if (on) {
      if (amb.on || A.songActive()) return;
      amb.on = true;
      clearTimeout(amb.stopTimer);
      if (!amb.timer) {
        amb.step = 0;
        amb.next = ctx.currentTime + 0.15;
        amb.timer = setInterval(ambientTick, 80);
      }
      fade(ambientBus, 1, 2.5);
    } else {
      if (!amb.on) return;
      amb.on = false;
      fade(ambientBus, 0, 1.2);
      clearTimeout(amb.stopTimer);
      amb.stopTimer = setTimeout(() => {
        clearInterval(amb.timer);
        amb.timer = 0;
      }, 1400);
    }
  };

  // ── Her song (config.songFile). It starts with her first tap, steps aside while the music box
  //    sings Happy Birthday, and hands over to the music box when it ends. No file = music box only.
  const song = { el: null, routed: false, wanted: false, failed: false, ended: false, retry: false, resumeOnShow: false, pauseTimer: 0 };
  const SONG_LEVEL = 0.85;

  A.initSong = function (src) {
    if (!src) return;
    const el = new Audio();
    el.setAttribute('playsinline', '');
    // Buffer while she reads the first screen, so the song begins the instant she taps.
    el.preload = 'auto';
    el.addEventListener('error', () => {
      song.failed = true;
      if (song.wanted) A.ambient(true);
    });
    el.addEventListener('ended', () => {
      song.ended = true;
      if (song.wanted) A.ambient(true);
    });
    el.src = src;
    song.el = el;
  };

  /** Route the song through Web Audio so it fades smoothly (needs the audio context from the first tap). */
  function wireSong() {
    const el = song.el;
    if (!el || song.routed) return;
    // file:// pages treat media as cross-origin, which Web Audio would silence, so those play directly.
    if (/^https?:$/.test(location.protocol) && ctx.createMediaElementSource) {
      try {
        ctx.createMediaElementSource(el).connect(songBus);
        song.routed = true;
      } catch (e) { song.routed = false; }
    }
  }

  /** True while the song is (or should be) the background music. */
  A.songActive = () => !!song.el && song.wanted && !song.failed && !song.ended;
  A.ambientPlaying = () => amb.on;
  A.songPlaying = () => !!song.el && !song.el.paused;

  /** Plays or resumes the song with a fade-in. Returns false when there is no song to play. */
  A.startSong = function () {
    const el = song.el;
    if (!el || song.failed || song.ended || !ctx) return false;
    song.wanted = true;
    clearTimeout(song.pauseTimer);
    A.ambient(false);
    if (song.routed) {
      const now = ctx.currentTime;
      songBus.gain.cancelScheduledValues(now);
      songBus.gain.setValueAtTime(el.paused ? 0 : songBus.gain.value, now);
      songBus.gain.linearRampToValueAtTime(SONG_LEVEL, now + (el.currentTime > 1 ? 1.6 : 2.5));
    } else {
      el.muted = P.state.muted;
    }
    if (el.paused) {
      const p = el.play();
      if (p && p.catch) {
        p.catch((err) => {
          // Blocked until a real tap: try again on the next one. Anything else: fall back to the music box.
          if (err && err.name === 'NotAllowedError') { song.retry = true; return; }
          song.failed = true;
          if (song.wanted) A.ambient(true);
        });
      }
    }
    return true;
  };

  /** Fades the song out and pauses it where it is, e.g. while Happy Birthday is sung. */
  A.quietSong = function () {
    const el = song.el;
    song.wanted = false;
    if (!el || el.paused) return;
    if (song.routed) {
      fade(songBus, 0, 0.9);
      clearTimeout(song.pauseTimer);
      song.pauseTimer = setTimeout(() => { if (!song.wanted) el.pause(); }, 950);
    } else {
      el.pause();
    }
  };

  /** Called on every tap: finishes a start that the browser blocked earlier. */
  A.retrySong = function () {
    if (song.retry && song.wanted) {
      song.retry = false;
      A.startSong();
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      ctx.suspend().catch(() => {});
      if (song.el && !song.el.paused) { song.el.pause(); song.resumeOnShow = true; }
    } else {
      ctx.resume().catch(() => {});
      if (song.resumeOnShow && song.el) {
        song.resumeOnShow = false;
        if (song.wanted && !song.ended) song.el.play().catch(() => { song.retry = true; });
      }
    }
  });

  // ── Sound effects ────────────────────────────────────────────────────────────
  function noise() {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    return s;
  }

  /** Rocket climbing: a rising hiss plus a faint whistle. */
  A.launch = function (pan) {
    if (!live()) return;
    const t = ctx.currentTime;
    const src = noise();
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(450, t);
    bp.frequency.exponentialRampToValueAtTime(3000, t + 1.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    src.connect(bp);
    bp.connect(g);
    out(g, sfxBus, pan);
    src.start(t, rand(0, 1));
    src.stop(t + 1.2);

    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(rand(850, 1100), t);
    whistle.frequency.exponentialRampToValueAtTime(rand(1900, 2500), t + 1);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.exponentialRampToValueAtTime(0.014, t + 0.12);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
    whistle.connect(wg);
    out(wg, sfxBus, pan);
    whistle.start(t);
    whistle.stop(t + 1.1);
  };

  /** Shell bursting: a low thump plus a filtered roar. */
  A.boom = function (size, pan) {
    if (!live()) return;
    const t = ctx.currentTime;
    if (t - lastBoom < 0.05) return;
    lastBoom = t;
    const s = clamp(size || 1, 0.4, 1.6);
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(115, t);
    thump.frequency.exponentialRampToValueAtTime(38, t + 0.45);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.5 * s, t + 0.012);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    thump.connect(tg);
    out(tg, sfxBus, (pan || 0) * 0.5);
    thump.start(t);
    thump.stop(t + 1.05);

    const roar = noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(240, t + 1.2);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, t);
    rg.gain.exponentialRampToValueAtTime(0.42 * s, t + 0.01);
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    roar.connect(lp);
    lp.connect(rg);
    out(rg, sfxBus, pan);
    roar.start(t, rand(0, 0.3));
    roar.stop(t + 1.7);
  };

  /** Glitter crackle: many tiny clicks of noise scattered over half a second. */
  A.crackle = function (pan, count) {
    if (!live()) return;
    const t0 = ctx.currentTime;
    if (t0 - lastCrackle < 0.12) return;
    lastCrackle = t0;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;
    const g = gainNode(0.2);
    hp.connect(g);
    out(g, sfxBus, pan);
    const n = count || 16;
    for (let i = 0; i < n; i++) {
      const s = noise();
      const sg = gainNode(rand(0.3, 1), hp);
      s.connect(sg);
      s.start(t0 + rand(0, 0.55), rand(0, 1.9), rand(0.004, 0.012));
    }
  };

  A.pop = function () {
    if (!live()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    out(g, sfxBus);
    o.start(t);
    o.stop(t + 0.2);
  };

  /** A little three-note sparkle for reveals. */
  A.chime = function (root) {
    if (!live()) return;
    const t = ctx.currentTime;
    const notes = root === 'low' ? ['F5', 'A5', 'C6'] : ['C6', 'E6', 'G6', 'C7'];
    notes.forEach((n, i) => bell(hz(n), t + i * 0.075, { vel: 0.13, dur: 1.6, bus: sfxBus, pan: (i - 1.5) * 0.25 }));
  };

  A.tick = function (high) {
    if (!live()) return;
    bell(hz(high ? 'C6' : 'G5'), ctx.currentTime, { vel: 0.22, dur: 1.2, bus: sfxBus });
  };

  A.whoosh = function () {
    if (!live()) return;
    const t = ctx.currentTime;
    const s = noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
    bp.frequency.exponentialRampToValueAtTime(500, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    s.connect(bp);
    bp.connect(g);
    out(g, sfxBus);
    s.start(t, rand(0, 1));
    s.stop(t + 0.8);
  };

  /** Candle blown out. */
  A.puff = function () {
    if (!live()) return;
    const t = ctx.currentTime;
    const s = noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    s.connect(lp);
    lp.connect(g);
    out(g, sfxBus, rand(-0.3, 0.3));
    s.start(t, rand(0, 1.5));
    s.stop(t + 0.45);
  };

  /** Paper unfolding: three soft rustles. */
  A.rustle = function () {
    if (!live()) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = t0 + i * 0.13 + rand(0, 0.04);
      const s = noise();
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = rand(2500, 4200);
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      s.connect(bp);
      bp.connect(g);
      out(g, sfxBus);
      s.start(t, rand(0, 1.5));
      s.stop(t + 0.2);
    }
  };

  /** Lub-dub. */
  A.heartbeat = function (strength) {
    if (!live()) return;
    const t0 = ctx.currentTime;
    [0, 0.2].forEach((dt, i) => {
      const t = t0 + dt;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(i ? 58 : 66, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((i ? 0.32 : 0.45) * (strength || 1), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(g);
      out(g, sfxBus);
      o.start(t);
      o.stop(t + 0.26);
    });
  };

  // Continuous scratch noise that follows finger speed while a card is being scratched.
  let scratchVoice = null;
  A.scratch = function (intensity) {
    if (!live()) return;
    const t = ctx.currentTime;
    if (!scratchVoice) {
      const s = noise();
      s.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2300;
      bp.Q.value = 0.9;
      const g = gainNode(0);
      s.connect(bp);
      bp.connect(g);
      g.connect(sfxBus);
      s.start();
      scratchVoice = { s, g };
    }
    const g = scratchVoice.g.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.1 * clamp(intensity, 0, 1), t, 0.02);
    g.setTargetAtTime(0, t + 0.09, 0.05);
  };
  A.scratchEnd = function () {
    if (!scratchVoice || !ctx) return;
    const v = scratchVoice;
    scratchVoice = null;
    v.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    v.s.stop(ctx.currentTime + 0.3);
  };

  // ── Breath detector for blowing out candles (optional; needs a microphone).
  //    Building on the "candlelight" card's approach: a blow is loud relative to the room,
  //    bass-heavy or broadband, noise-like (flat spectrum, no tonal peaks), and it lasts a moment,
  //    so talking, singing, music, claps and coughs don't count. Nothing is recorded or sent anywhere.
  A.canListen = function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) return false;
    const fp = document.featurePolicy || document.permissionsPolicy;
    if (fp && fp.allowsFeature && !fp.allowsFeature('microphone')) return false;
    return true;
  };

  A.listenForBreath = async function (onFrame) {
    A.unlock();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    // 4096 points ≈ 11.7 Hz bins: fine enough to resolve the harmonics of even a low voice.
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.2;
    source.connect(analyser); // analysed only, never played back
    const time = new Float32Array(analyser.fftSize);
    const freq = new Float32Array(analyser.frequencyBinCount);
    const binHz = ctx.sampleRate / analyser.fftSize;
    // Tonal peaks: bins standing > 8× above the geometric mean of their ±10 neighbours, 150 Hz–4 kHz.
    // Noise (breath) almost never does; voices, instruments and music do all the time, and the
    // measure ignores the overall slope of the spectrum.
    const PEAK_REACH = 10;
    const peakLo = Math.ceil(150 / binHz);
    const peakHi = Math.min(freq.length - PEAK_REACH - 1, Math.floor(4000 / binHz));
    const logPow = new Float64Array(freq.length);
    const prefix = new Float64Array(freq.length + 1);
    const LN8 = Math.log(8);
    const calibration = [];
    const started = Date.now();
    let floor = null;
    let breathMs = 0; // how long the sound has stayed breath-like
    let flatAvg = 0; // low-band flatness, smoothed over ~150 ms
    let tonalAvg = 0; // share of tonal peaks, smoothed over ~150 ms
    let lastT = 0;
    let raf = 0;
    let stopped = false;

    function step(now) {
      if (stopped) return;
      const dt = lastT ? Math.min(now - lastT, 100) : 16.7;
      lastT = now;
      analyser.getFloatTimeDomainData(time);
      analyser.getFloatFrequencyData(freq);
      let sq = 0;
      for (let i = 0; i < time.length; i++) sq += time[i] * time[i];
      const rms = Math.sqrt(sq / time.length);

      let low = 0;
      let total = 0;
      let band = 0;
      let logBand = 0;
      let n = 0;
      let lowBand = 0;
      let logLow = 0;
      let nLow = 0;
      for (let i = 1; i < freq.length; i++) {
        const f = i * binHz;
        if (f > 6000) break;
        const power = Math.pow(10, freq[i] / 10); // dB -> linear power
        total += power;
        if (f < 500) low += power;
        if (f >= 150) { band += power; logBand += Math.log(power + 1e-20); n++; }
        if (f >= 80 && f <= 1100) { lowBand += power; logLow += Math.log(power + 1e-20); nLow++; }
      }
      // Spectral flatness = geometric mean / arithmetic mean of power (1 = pure noise, ~0 = pure tone).
      // Measured across the whole band and again in 80–1100 Hz, where breath is smooth noise but
      // voices, singing and the page's own music box show sharp harmonic peaks.
      const flatness = n && band > 0 ? Math.exp(logBand / n) / (band / n) : 0;
      const flatLow = nLow && lowBand > 0 ? Math.exp(logLow / nLow) / (lowBand / nLow) : 0;
      const lowShare = total > 0 ? low / total : 0;

      for (let i = 0; i < freq.length; i++) {
        logPow[i] = (freq[i] < -160 ? -160 : freq[i]) * (Math.LN10 / 10); // ln(power), silence clamped
        prefix[i + 1] = prefix[i] + logPow[i];
      }
      let peaks = 0;
      for (let i = peakLo; i <= peakHi; i++) {
        const neighbours = (prefix[i + PEAK_REACH + 1] - prefix[i - PEAK_REACH] - logPow[i]) / (2 * PEAK_REACH);
        if (logPow[i] - neighbours > LN8) peaks++;
      }
      const tonal = peakHi > peakLo ? peaks / (peakHi - peakLo + 1) : 0;

      if (floor === null) {
        calibration.push(rms);
        if (Date.now() - started > 700) {
          calibration.sort((a, b) => a - b);
          floor = Math.max(calibration[Math.floor(calibration.length / 2)] || 0, 0.003);
        }
      }
      const loud = floor !== null && rms > Math.max(floor * 3.2, 0.02);
      // Judge smoothed values, not single frames: loud music can look noise-like for a moment
      // (a drum fill), but it keeps showing tonal peaks, while breath stays smooth noise.
      // Measured on test audio: breath ≈ 0.007 tonal, a song's loud climax ≈ 0.075, voices ≈ 0.13.
      const k = Math.min(1, dt / 150);
      flatAvg += (flatLow - flatAvg) * k;
      tonalAvg += (tonal - tonalAvg) * k;
      const breathy = tonalAvg < 0.035 && flatAvg > 0.22 && (lowShare > 0.35 || flatness > 0.25);
      // A real blow lasts well over 200 ms; sibilants in speech, claps and coughs don't.
      breathMs = loud && breathy ? breathMs + dt : Math.max(0, breathMs - dt * 2);
      const level = floor === null ? 0 : clamp((rms - floor * 1.5) / 0.15, 0, 1);
      onFrame({ level, blowing: breathMs >= 220, rms, flatness, flatLow, flatAvg, lowShare, tonal, tonalAvg });
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);

    return function stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((track) => track.stop());
      source.disconnect();
    };
  };

  P.audio = A;
})();
