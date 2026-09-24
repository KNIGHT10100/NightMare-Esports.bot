/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything personal lives here. Edit the words, keep the punctuation.
 *  Text between ==double equals== is written with a highlighter in the letter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.PHOOL_CONFIG = {
  name: 'Nabi',          // her name
  nickname: 'Phool',     // her nickname (फूल, "flower")
  from: '',              // your name for the letter signature (leave '' for just a heart)

  // Fireworks that write in the sky. Keep each one short (it has to fit a phone screen).
  skyWords: { celebrate: 'PHOOL', finale: 'I LOVE YOU' },

  photos: [
    {
      src: 'assets/photos/us-adventure.jpg',
      alt: 'The two of us in sunglasses, taking a selfie in front of a rock wall',
      caption: 'partners in crime',
      note: 'Two pairs of sunglasses, one big adventure, and my favourite person right behind me. Every trip is better with you.',
      tape: 'mint', stickers: [['sparkle', 'tr'], ['heart', 'bl']],
    },
    {
      src: 'assets/photos/phool-blossom.jpg',
      alt: 'Her in a navy blue kurta, next to pink blossoms',
      caption: 'the prettiest phool',
      note: 'Pink blossoms on one side and you on the other. The flowers never stood a chance.',
      tape: 'pink', stickers: [['flower', 'tl'], ['butterfly', 'br']],
    },
    {
      src: 'assets/photos/phool-monochrome.jpg',
      alt: 'A black and white photo of her smiling and looking down',
      caption: 'timeless',
      note: 'Even in black and white, you are the most colourful thing in my life.',
      tape: 'lilac', stickers: [['star', 'tr'], ['heart', 'bl']],
    },
    {
      src: 'assets/photos/phool-sunshine.jpg',
      alt: 'Her in a mustard yellow kurta, resting her chin on her hands and smiling',
      caption: 'my sunshine',
      note: 'This smile is my favourite place in the whole world.',
      tape: 'gold', stickers: [['sun', 'tr'], ['flower', 'bl']],
    },
    {
      src: 'assets/photos/us-ropeway.jpg', wide: true,
      alt: 'The two of us on a ropeway ride above green trees',
      caption: 'up in the clouds',
      note: 'High above the trees, the view was beautiful, and I was only looking at you.',
      tape: 'pink', stickers: [['cloud', 'tr'], ['bow', 'bl']],
    },
  ],

  song: {
    // The Happy Birthday verse sings this name ("happy birthday dear Na-bi").
    lyrics: ['Happy birthday to you', 'Happy birthday to you', 'Happy birthday dear {name}', 'Happy birthday to you'],
  },

  // Lanterns that float up after the candles are blown out: all the sweet things.
  wishes: [
    'every dream comes true',
    'a smile that never fades',
    'chocolate, always',
    'calm days and good health',
    'adventures with me',
    'success in everything',
    'a love that keeps growing',
  ],

  letter: {
    greeting: 'My dearest {nickname},',
    paragraphs: [
      'Happy Birthday, my {name}. Today the world got its most beautiful flower, and I got the most special person I have ever had in my life.',
      'I wanted to write you a little khat, the old-fashioned way, because some feelings deserve more than a text message.',
      'You make me special. I still don\'t know how you do it, but with you, ordinary days turn into my favourite memories and even my silliest moments feel like they matter.',
      'On your birthday, I wish that everything you want comes true. Every dream you hold close, every wish you whisper, every little hope in your heart. I wish you all the sweet things: soft mornings, loud laughter, chocolate that never runs out, and a smile that never has a reason to leave your face.',
      'And please remember this, today and always: ==I will be there for you.== On your brightest days and your cloudiest ones, when you want to talk for hours and when you only need someone to hold your hand in silence, I am right here.',
      '==I love you like the way the body loves the soul.== One simply cannot live without the other.',
      'Keep blooming, my {nickname}. The whole world is lucky you are in it, and I am the luckiest of all.',
    ],
    closing: 'Forever yours,',
  },

  // Scratch cards. Icons: heart, flower, butterfly, sparkle, star, sun, cloud, bow.
  surprises: [
    { icon: 'heart', title: 'Hug coupon', text: 'One unlimited, no-questions-asked hug. Valid forever.' },
    { icon: 'star', title: 'Date night', text: 'Your favourite food, your favourite place. My treat, always.' },
    { icon: 'flower', title: 'A promise', text: 'To make you smile, even on the cloudy days.' },
    { icon: 'butterfly', title: 'A confession', text: 'You still give me butterflies. Every single day.' },
  ],

  question: {
    ask: 'Will you be mine forever, {nickname}?',
    yes: 'Yes',
    no: 'No',
    pleads: ['Are you sure?', 'Think again, {nickname}…', 'That button looks broken. Try the other one?', 'I will cry, okay?', 'Pleeease?', 'Fine. You don\'t get a choice anymore.'],
    yay: 'Yayyy! I knew it.',
  },

  finale: {
    title: 'I\'ll be there for you',
    line: 'through every sunrise, every storm, every single day',
    quote: 'I love you like the body loves the soul.',
    wish: 'Happy Birthday, my {nickname}.',
  },

  // Easter eggs: catch a butterfly, or tap the moon three times.
  secrets: [
    'If I had a flower for every time I thought of you, I could walk through my garden forever.',
    'I smile at my phone like an idiot every time your name pops up.',
    'Your laugh is my favourite sound in the whole world.',
    'You are the reason I believe in butterflies.',
  ],
  moonSecret: 'The moon asked me to tell you something: it is jealous. You shine brighter.',

  // Optional: drop your song at this path (e.g. an .mp3) and it plays from the photos onwards.
  // Leave the file out and the built-in music box plays instead.
  songFile: 'assets/audio/song.mp3',
};
