export interface ReactionGif {
  id: string;
  title: string;
  category: 'Reactions' | 'Humor' | 'Mood' | 'Vibe' | 'Aesthetic';
  tags: string[];
  url: string;
  previewUrl?: string;
}

export const REACTION_GIF_CATEGORIES = [
  'All',
  'Reactions',
  'Humor',
  'Mood',
  'Vibe',
  'Aesthetic',
] as const;

export const REACTION_GIFS: ReactionGif[] = [
  // ── Reactions ──
  {
    id: 'rg-mindblown',
    title: 'Mind Blown Spark',
    category: 'Reactions',
    tags: ['mind blown', 'shock', 'wow', 'universe', 'brain', 'spark', 'crazy'],
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
  {
    id: 'rg-nod',
    title: 'Nod of Approval',
    category: 'Reactions',
    tags: ['nod', 'yes', 'agree', 'respect', 'approval', 'yep', 'facts'],
    url: 'https://media.giphy.com/media/gVown0HP81Am4/giphy.gif',
  },
  {
    id: 'rg-applause',
    title: 'Standing Ovation Applause',
    category: 'Reactions',
    tags: ['clap', 'applause', 'bravo', 'congrats', 'cheers', 'respect'],
    url: 'https://media.giphy.com/media/nbvFVPiEiJH6Q/giphy.gif',
  },
  {
    id: 'rg-thinking',
    title: 'Big Brain Thinking',
    category: 'Reactions',
    tags: ['thinking', 'smart', 'brain', 'ponder', 'idea', 'hmmm', 'clever'],
    url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
  },
  {
    id: 'rg-popcorn',
    title: 'Watching the Drama',
    category: 'Reactions',
    tags: ['popcorn', 'drama', 'watching', 'interesting', 'spicy', 'listen'],
    url: 'https://media.giphy.com/media/hVTouq08miyGT52UKQ/giphy.gif',
  },
  {
    id: 'rg-laugh',
    title: 'Uncontrollable Laughter',
    category: 'Reactions',
    tags: ['laugh', 'lol', 'haha', 'lmao', 'funny', 'joke', 'dead'],
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
  },
  {
    id: 'rg-micdrop',
    title: 'Mic Drop Truth',
    category: 'Reactions',
    tags: ['mic drop', 'done', 'facts', 'boom', 'truth', 'statement'],
    url: 'https://media.giphy.com/media/3o7qDSOvfaCO9b3MlO/giphy.gif',
  },
  {
    id: 'rg-facepalm',
    title: 'Epic Facepalm',
    category: 'Reactions',
    tags: ['facepalm', 'smh', 'disappointed', 'sigh', 'why', 'no'],
    url: 'https://media.giphy.com/media/3og0INyCmHlNylks9n/giphy.gif',
  },
  {
    id: 'rg-shrug',
    title: 'Honest Shrug',
    category: 'Reactions',
    tags: ['shrug', 'idk', 'unsure', 'maybe', 'who knows', 'whatever'],
    url: 'https://media.giphy.com/media/jPAdK8Nfzzwt2/giphy.gif',
  },
  {
    id: 'rg-cheers',
    title: 'Cheers Toast',
    category: 'Reactions',
    tags: ['cheers', 'toast', 'celebrate', 'drink', 'salute', 'agree'],
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
  },

  // ── Humor ──
  {
    id: 'rg-fire',
    title: 'This Is Fine / Lit',
    category: 'Humor',
    tags: ['fire', 'flames', 'lit', 'wild', 'hot take', 'chaos'],
    url: 'https://media.giphy.com/media/nrXif9YExO9EI/giphy.gif',
  },
  {
    id: 'rg-dancing',
    title: 'Groove Dance',
    category: 'Humor',
    tags: ['dance', 'groove', 'happy', 'fun', 'party', 'vibe'],
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
  },
  {
    id: 'rg-confused',
    title: 'Looking Around Confused',
    category: 'Humor',
    tags: ['confused', 'where', 'lost', 'what', 'pulp fiction', 'empty'],
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
  },
  {
    id: 'rg-laugh-tear',
    title: 'Crying Laughing',
    category: 'Humor',
    tags: ['laughing', 'crying', 'tears', 'humor', 'wheezing', 'dying'],
    url: 'https://media.giphy.com/media/l1ug3xGEN1oZBT7qw/giphy.gif',
  },

  // ── Mood & Vibe ──
  {
    id: 'rg-coffee',
    title: 'Cozy Morning Coffee',
    category: 'Mood',
    tags: ['coffee', 'cozy', 'warm', 'morning', 'cafe', 'relax', 'steam'],
    url: 'https://media.giphy.com/media/h4Z6RfuQycdqVC4GS9/giphy.gif',
  },
  {
    id: 'rg-rain',
    title: 'Lo-Fi Rain on Glass',
    category: 'Mood',
    tags: ['rain', 'lofi', 'window', 'cozy', 'chill', 'calm', 'peaceful'],
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'rg-vinyl',
    title: 'Spinning Vinyl Record',
    category: 'Vibe',
    tags: ['vinyl', 'music', 'sound', 'record', 'audio', 'aesthetic', 'vibe'],
    url: 'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
  },
  {
    id: 'rg-tokyo',
    title: 'Tokyo Neon Rain',
    category: 'Vibe',
    tags: ['tokyo', 'neon', 'city', 'night', 'cyberpunk', 'lights', 'street'],
    url: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif',
  },
  {
    id: 'rg-highway',
    title: 'Midnight City Highway',
    category: 'Vibe',
    tags: ['night', 'drive', 'highway', 'city', 'speed', 'ambient', 'dark'],
    url: 'https://media.giphy.com/media/10hzvF9FTeJaLK/giphy.gif',
  },

  // ── Aesthetic ──
  {
    id: 'rg-typewriter',
    title: 'Classic Typewriter Keys',
    category: 'Aesthetic',
    tags: ['typewriter', 'writing', 'words', 'poem', 'vintage', 'story'],
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
  },
  {
    id: 'rg-tvstatic',
    title: 'Retro Analog TV Glitch',
    category: 'Aesthetic',
    tags: ['retro', 'tv', 'static', 'analog', 'glitch', 'synth', 'art'],
    url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
  },
];
