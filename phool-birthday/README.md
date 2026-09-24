# Happy Birthday, Phool 🌸

A birthday surprise for Nabi, made to be opened on a phone. It is one page that plays like a small
story: a gift, fireworks, a cake, your photos, a handwritten letter and a few secrets, all under a
night sky full of falling petals.

No app to install and no dependencies: plain HTML, CSS and JavaScript.

## The story, scene by scene

0. **The countdown (only before her birthday).** Opened before midnight of 25 September on her
   phone, the page shows a clock counting down to 12:00. At midnight the sky fills with fireworks,
   "It's your birthday!" appears and the surprise opens by itself. Add `#preview` to the end of the
   link to skip the countdown and check everything early. The date lives in `config.js` (`birthday`).
1. **The gift.** A pink box with a tag that says "For Nabi". She taps it: it shakes, the lid flies off,
   light rays and confetti burst out. Her very first tap, on the gift or anywhere else, starts your
   song (phones never allow sound before a tap, so this is the earliest moment possible).
2. **Countdown and fireworks.** 3, 2, 1, and a rocket climbs from the bottom of the screen and writes
   **PHOOL** in sparks, framed by a heart and a flower. "Happy Birthday" writes itself in gold.
   Every tap on the sky launches another firework; *Fire again* launches a whole volley.
3. **Make a wish.** A music box plays Happy Birthday while the lyrics light up line by line
   ("happy birthday dear Na-bi"). She taps the flames to blow them out, or blows into the phone for
   real. Then *"I wish everything you want comes true"* appears and lanterns float up, each carrying
   a wish.
4. **Our little moments.** Your five photos as polaroids with washi tape and stickers. She swipes
   through them and taps one to flip it over and read the note on the back.
5. **A little khat.** An envelope with a wax seal. She taps the seal, the letter slides out and
   writes itself in handwriting, the pen moving across the page and the ink drying from light to dark.
   It is dated on her birthday. "I will be there for you" and "I love you like the way the body
   loves the soul" get highlighted.
6. **Sweet surprises.** Four scratch cards: a hug coupon, a date night, a promise and a confession.
7. **One tiny question.** *"Will you be mine forever, Phool?"* The *No* button runs away and shrinks,
   *Yes* keeps growing, and after a few tries *No* gives up and turns into another *Yes*.
8. **Forever.** She presses and holds a heart until it fills, it bursts into the grand finale with
   **I LOVE YOU** in the sky, and the last words: *I'll be there for you. I love you like the body
   loves the soul. Happy Birthday, my Phool.* One button fires more fireworks, one reopens the
   letter and one replays everything.

### Hidden surprises

- **Butterflies** (*nabi* means butterfly in Korean) drift across the screen now and then.
  Catching one reveals a secret line.
- **The moon** in the corner gives up a secret after three taps, with a shower of shooting stars.
- Little hearts float up wherever she taps.
- On Android the phone gives small vibrations for the fireworks, candles and the heartbeat.

## Make it yours

Everything personal lives in [`assets/js/config.js`](assets/js/config.js): her name and nickname,
your name for the signature, the letter, photo captions and notes, the scratch cards, the lantern
wishes, the question and the finale. Wrap words in `==double equals==` to highlight them in the
letter. `{name}` and `{nickname}` are filled in automatically.

### Photos

Put your photos in [`assets/photos/`](assets/photos/) with the file names listed there. They are
cropped to fit their polaroid automatically; mark a landscape photo with `wide: true`.

### Your song

Save it as `assets/audio/song.mp3`. It loads while she looks at the first screen and starts with her
first tap. At the cake it fades out while the music box sings Happy Birthday, then carries on from the
same spot through the photos, the letter and the finale. If it ends before she does, the music box
takes over. Without the file, the music box plays from the first tap instead.

**Why the photos and the song are not in git:** this repository is public, so anything committed
here can be seen by anyone. Personal photos stay private that way, and a commercial song must not be
redistributed. [`.gitignore`](.gitignore) keeps both out automatically. Add them only where you host
the page for her.

## Try it on your phone

Serve the folder from your computer and open it on your phone over the same Wi‑Fi:

```bash
cd phool-birthday
npx serve .          # or: python3 -m http.server 8000
```

Then open `http://<your-computer's-IP>:3000` (or `:8000`) on the phone. The optional
"blow into the mic" feature needs an `https://` address, which every host below gives you.

## Share it with her

- **Netlify Drop (easiest, about a minute):** go to <https://app.netlify.com/drop> and drag the whole
  `phool-birthday` folder, with your photos and song inside, onto the page. You get a random,
  unlisted link to send her. Anyone who has the link can open it, and the page asks search engines
  not to index it.
- **One single file:** run `node tools/build.mjs` to get `dist/phool-birthday.html` with everything
  embedded (about 1.3 MB with photos; add `--no-song` to leave the song out). Host that one file
  anywhere, or open it directly on a computer or Android phone.
- **GitHub Pages:** works too, but because this repository is public, anything you publish there
  would be public, photos included.

Tip: on her phone, *Add to Home Screen* installs it with its own flower icon and opens it full screen.

## How it works

| File | What it does |
| --- | --- |
| `index.html` | The eight scenes and the sticker artwork (inline SVG). |
| `assets/css/app.css` | The whole look: night-sky palette, handwriting type, gift, cake, polaroids, envelope. |
| `assets/js/config.js` | All personal words and photos. |
| `assets/js/core.js` | One shared animation loop, cancellable scene timers, haptics, wake lock, toast. |
| `assets/js/fireworks.js` | Rockets and shells: peony, ring, heart, flower, butterfly, willow, crackle, and words made of sparks. |
| `assets/js/audio.js` | Every sound synthesised live with the Web Audio API: music box, lullaby, Happy Birthday, fireworks, the breath detector. |
| `assets/js/sky.js` | Stars, shooting stars, falling petals, the moon and the butterflies. |
| `assets/js/fx.js` | Confetti, floating hearts and sparkles. |
| `assets/js/scenes.js` | One controller per scene. |
| `assets/js/main.js` | Scene manager, progress hearts, sound toggle, back button. |

Some details:

- **Fireworks** draw every spark as a short streak with a soft halo and a bright core, grouped by
  colour so a frame with a thousand sparks costs about fifty draw calls. The sky picks up the colour
  of each burst, and shells get smaller automatically if a phone starts to drop frames. The heart,
  the five-petal flower and the butterfly are real curves:
  x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t for the heart, a rose curve
  r = |cos(5θ/2)| for the phool, and Temple Fay's butterfly curve for the nabi.
- **Blowing out the candles** only reacts to breath. The microphone signal must be loud compared with
  the room (measured in the first moment), bass-heavy or broadband, and noise-like: a flat spectrum
  with almost no tonal peaks (bins standing 8× above their neighbours, at 11.7 Hz resolution,
  smoothed over 150 ms). It must also last longer than 220 ms. While the microphone listens, the song
  pauses so the phone doesn't hear its own speaker. In testing, soft, normal and heavy breaths blew
  the candles out, while singing, speech, the page's own music box, claps and two excerpts of the
  song itself (the quiet opening and the loud climax) did not. Nothing is recorded; the microphone
  switches off as soon as the candles are out. Tapping the flames always works too.
- **The letter** writes one character at a time with natural pauses at commas and full stops.
  The page follows the pen unless she scrolls herself, and the screen stays awake while she reads.
- **Kind to everyone:** it respects *reduced motion*, works with a keyboard (arrow keys for the photos,
  Enter for the cards, hold Space for the heart), remembers the mute button, and Android's back
  button steps back through the scenes. On a phone turned sideways it asks to be held upright.

Tested with a headless Chromium on phone screens (390 × 844 and 375 × 667), in landscape and on
desktop, including reduced motion, missing photos and keyboard-only use.

## Inspiration

Researched before building: the most-loved open-source birthday pages on GitHub
([faahim/happy-birthday](https://github.com/faahim/happy-birthday),
[HappyBirthdayGF](https://github.com/nikitayadav19/HappyBirthdayGF)), the envelope-and-candles card
[candlelight](https://github.com/0x000NULL/candlelight) (its idea of treating tapping as a real way
to blow out candles, not a fallback), Caleb Miller's canvas firework simulator, the viral runaway
*No* button, and the "reasons I love you" jar.
