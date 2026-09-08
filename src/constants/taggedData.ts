import { MOCK_USERS } from './mockData';
import type { User } from '@/types';

export interface TaggedSticker {
  id: string;
  emoji: string;
  label: string;
  bg: string;
  color: string;
}

export interface TaggedGif {
  id: string;
  title: string;
  category: 'Aesthetic' | 'Vibe' | 'Mood' | 'Art' | 'Night' | 'Reactions';
  url: string;
}

export interface TaggedReply {
  id: string;
  user: User;
  text: string;
  image_url?: string;
  gif_url?: string;
  sticker?: TaggedSticker;
  created_at: string;
  likes: number;
}

export interface TaggedPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface TaggedPoll {
  id: string;
  question?: string;
  options: TaggedPollOption[];
  total_votes: number;
  duration_days?: number;
  ends_at: string;
  user_voted_option_id?: string;
}

export interface TaggedPostItem {
  id: string;
  user: User;
  text: string;
  image_url?: string;
  gif_url?: string;
  sticker?: TaggedSticker;
  poll?: TaggedPoll;
  created_at: string;
  like_count: number;
  retag_count: number;
  reply_count: number;
  location_tag?: string;
  mood_tag?: string;
  replies?: TaggedReply[];
}

export const STICKER_PACK: TaggedSticker[] = [
  { id: 'st1', emoji: '🪐', label: 'In My Element', bg: 'bg-indigo-500/15 border-indigo-500/30', color: 'text-indigo-300' },
  { id: 'st2', emoji: '☕', label: 'Slow Morning', bg: 'bg-amber-500/15 border-amber-500/30', color: 'text-amber-300' },
  { id: 'st3', emoji: '🌙', label: 'Night Owl Mode', bg: 'bg-purple-500/15 border-purple-500/30', color: 'text-purple-300' },
  { id: 'st4', emoji: '🎞️', label: 'Film Snapshot', bg: 'bg-orange-500/15 border-orange-500/30', color: 'text-orange-300' },
  { id: 'st5', emoji: '🎧', label: 'On Repeat', bg: 'bg-cyan-500/15 border-cyan-500/30', color: 'text-cyan-300' },
  { id: 'st6', emoji: '⚡', label: 'Unfiltered', bg: 'bg-yellow-500/15 border-yellow-500/30', color: 'text-yellow-300' },
  { id: 'st7', emoji: '🌿', label: 'Touch Grass', bg: 'bg-emerald-500/15 border-emerald-500/30', color: 'text-emerald-300' },
  { id: 'st8', emoji: '🌊', label: 'Drifting', bg: 'bg-blue-500/15 border-blue-500/30', color: 'text-blue-300' },
  { id: 'st9', emoji: '🎨', label: 'Work In Progress', bg: 'bg-pink-500/15 border-pink-500/30', color: 'text-pink-300' },
  { id: 'st10', emoji: '✨', label: 'Pure Magic', bg: 'bg-violet-500/15 border-violet-500/30', color: 'text-violet-300' },
  { id: 'st11', emoji: '💭', label: 'Brain Wander', bg: 'bg-teal-500/15 border-teal-500/30', color: 'text-teal-300' },
  { id: 'st12', emoji: '🕯️', label: 'Quiet Hour', bg: 'bg-rose-500/15 border-rose-500/30', color: 'text-rose-300' },
];

export const CURATED_GIFS: TaggedGif[] = [
  {
    id: 'g1',
    title: 'Tokyo Neon Rain',
    category: 'Aesthetic',
    url: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif',
  },
  {
    id: 'g2',
    title: 'Vinyl Turntable Spinning',
    category: 'Vibe',
    url: 'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
  },
  {
    id: 'g3',
    title: 'Cozy Coffee Pour',
    category: 'Mood',
    url: 'https://media.giphy.com/media/h4Z6RfuQycdqVC4GS9/giphy.gif',
  },
  {
    id: 'g4',
    title: 'Analog TV Static Art',
    category: 'Art',
    url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
  },
  {
    id: 'g5',
    title: 'Midnight City Highway',
    category: 'Night',
    url: 'https://media.giphy.com/media/10hzvF9FTeJaLK/giphy.gif',
  },
  {
    id: 'g6',
    title: 'Typing on Classic Typewriter',
    category: 'Aesthetic',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
  },
  {
    id: 'g7',
    title: 'Lo-Fi Rain on Window',
    category: 'Mood',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'g8',
    title: 'Nod of Approval',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/gVown0HP81Am4/giphy.gif',
  },
  {
    id: 'g9',
    title: 'Mind Blown Spark',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
];

export const PHOTO_PRESETS = [
  {
    name: 'Tokyo Night Walk',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&q=80&auto=format&fit=crop',
    tag: 'Tokyo',
  },
  {
    name: 'Film Camera Studio',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000&q=80&auto=format&fit=crop',
    tag: 'Film',
  },
  {
    name: 'Morning Espresso & Notebook',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&q=80&auto=format&fit=crop',
    tag: 'Studio',
  },
  {
    name: 'Vinyl Corner',
    url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1000&q=80&auto=format&fit=crop',
    tag: 'Music',
  },
  {
    name: 'Modern Architecture Shadow',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80&auto=format&fit=crop',
    tag: 'Milan',
  },
  {
    name: 'Ocean Fog Dawn',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80&auto=format&fit=crop',
    tag: 'Coast',
  },
];

export const INITIAL_TAGGED_POSTS: TaggedPostItem[] = [
  {
    id: 'tp-1',
    user: MOCK_USERS[4], // Yuki Hayashi (Tokyo)
    text: '2:40 AM in Shimokitazawa. Found an old jazz kissa that still plays original 1968 Blue Note pressings on tube amps. The owner didn’t say a word, just slid a hot black tea across the mahogany counter. Sometimes silence is the highest form of hospitality.',
    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[2], // Night Owl Mode
    location_tag: 'Tokyo, Japan',
    mood_tag: '#AfterHours',
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    like_count: 84,
    retag_count: 19,
    reply_count: 7,
    replies: [
      {
        id: 'rep-1-1',
        user: MOCK_USERS[3], // Joel
        text: 'Those tube preamps add a warmth you can never recreate digitally. Enjoy that sound!',
        created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        likes: 12,
      },
      {
        id: 'rep-1-2',
        user: MOCK_USERS[0], // Amina
        text: 'Writing this down for the next time I visit Japan. Pure atmosphere.',
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        likes: 6,
      },
    ],
  },
  {
    id: 'tp-poll-1',
    user: MOCK_USERS[4], // Yuki Hayashi (Tokyo)
    text: 'Quick community check for our late-night circle: When listening to music in total darkness, what is your preferred format?',
    sticker: STICKER_PACK[4], // On Repeat
    location_tag: 'Tokyo, Japan',
    mood_tag: '#AudioCommunity',
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    like_count: 118,
    retag_count: 27,
    reply_count: 14,
    poll: {
      id: 'poll-tp-1',
      question: 'Preferred late-night listening format?',
      options: [
        { id: 'opt-1', text: 'Vinyl on tube amplifier 🎷', votes: 58 },
        { id: 'opt-2', text: 'Analog cassette tape 📼', votes: 24 },
        { id: 'opt-3', text: 'High-res lossless streaming (FLAC) 🎧', votes: 31 },
        { id: 'opt-4', text: 'FM Radio broadcast static 📻', votes: 11 },
      ],
      total_votes: 124,
      duration_days: 3,
      ends_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    },
  },
  {
    id: 'tp-2',
    user: MOCK_USERS[0], // Amina Kalu (Lagos)
    text: 'My other side when I am not writing heavy essays: making spicy jollof on a rainy Sunday afternoon while blasting King Sunny Ade records so loud the balcony plants vibrate. We need more days where nothing is required of us.',
    sticker: STICKER_PACK[1], // Slow Morning
    gif_url: 'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
    location_tag: 'Lagos, Nigeria',
    mood_tag: '#SundayRituals',
    created_at: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    like_count: 142,
    retag_count: 38,
    reply_count: 12,
  },
  {
    id: 'tp-3',
    user: MOCK_USERS[3], // Joel Tetteh (Accra)
    text: 'Studio diary: spent 6 hours tracking a single bass groove until the tape machine gave up. There is a sweet spot where physical fatigue turns into musical honesty. Raw take, no autotune, pure soul.',
    image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[4], // On Repeat
    location_tag: 'Accra, Ghana',
    mood_tag: '#StudioLife',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    like_count: 96,
    retag_count: 22,
    reply_count: 5,
  },
  {
    id: 'tp-4',
    user: MOCK_USERS[5], // Marco Vitale (Milan)
    text: 'Morning walk through Brera. The way morning light hits 18th-century stucco when the street is completely empty before the mopeds arrive is something I will never take for granted. Here is a little glimpse into my everyday walk.',
    image_url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[3], // Film Snapshot
    location_tag: 'Milan, Italy',
    mood_tag: '#Architecture',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    like_count: 110,
    retag_count: 29,
    reply_count: 9,
  },
  {
    id: 'tp-5',
    user: MOCK_USERS[1], // Daniel Rocha (São Paulo)
    text: 'Took my sketchbook to the rooftop garden above Avenida Paulista. People think designers only live in Figma, but nothing beats 2B graphite on rough cotton paper while the city hums 20 floors below.',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[8], // Work In Progress
    location_tag: 'São Paulo, Brazil',
    mood_tag: '#Sketchbook',
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    like_count: 73,
    retag_count: 14,
    reply_count: 4,
  },
  {
    id: 'tp-6',
    user: MOCK_USERS[6], // Priya Sharma (Mumbai)
    text: 'Monsoon season has officially begun in Bandra. Chai in clay cups, wet asphalt smelling like petrichor, and old Bollywood movie posters peeling on brick walls. This is the city at its most poetic.',
    gif_url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    sticker: STICKER_PACK[7], // Drifting
    location_tag: 'Mumbai, India',
    mood_tag: '#MonsoonDiaries',
    created_at: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
    like_count: 165,
    retag_count: 44,
    reply_count: 18,
  },
  {
    id: 'tp-7',
    user: MOCK_USERS[9], // Lena Weber (Berlin)
    text: 'Unpopular opinion: the best cafes are the ones with creaky wooden floors, mismatching thrifted mugs, and zero techno music in the background. Just quiet whispers and the smell of cardamom buns.',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[11], // Quiet Hour
    location_tag: 'Berlin, Germany',
    mood_tag: '#SlowLife',
    created_at: new Date(Date.now() - 1000 * 60 * 800).toISOString(),
    like_count: 128,
    retag_count: 31,
    reply_count: 11,
    poll: {
      id: 'poll-tp-7',
      question: 'Essential companion for slow morning work?',
      options: [
        { id: 'opt-7-1', text: 'Double Cortado / Flat White ☕', votes: 64 },
        { id: 'opt-7-2', text: 'Ceremonial Matcha 🍵', votes: 32 },
        { id: 'opt-7-3', text: 'Cardamom & Cinnamon Tea 🫖', votes: 22 },
      ],
      total_votes: 118,
      duration_days: 1,
      ends_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    },
  },
  {
    id: 'tp-8',
    user: MOCK_USERS[2], // Sarah Mitchell (Manchester)
    text: 'Tagging along on my weekend crate-digging expedition across Northern Quarter. Found an unreleased 90s ambient cassette that feels like looking at old family photos from a life you never lived.',
    image_url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1000&q=80&auto=format&fit=crop',
    sticker: STICKER_PACK[0], // In My Element
    location_tag: 'Manchester, UK',
    mood_tag: '#CrateDigging',
    created_at: new Date(Date.now() - 1000 * 60 * 1100).toISOString(),
    like_count: 92,
    retag_count: 20,
    reply_count: 6,
  },
];
