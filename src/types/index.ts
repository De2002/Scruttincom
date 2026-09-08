export type ScrutType = 'voice' | 'text' | 'voice_text';
export type ConversationType = 'question' | 'statement' | 'open';
export type StatementPosition = 'agree' | 'unsure' | 'disagree' | null;

export interface User {
  id: string;
  display_name: string;
  avatar_url: string;
  country: string;
  city?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  tip_link?: string; // Buy Me a Coffee, PayPal, Ko-fi, or custom support URL
}

export interface ConversationStarter {
  id: string;
  user_id: string;
  user: User;
  type: ConversationType;
  body: string;
  topic: string;
  created_at: string;
  scrut_count: number;
  country_count: number;
  is_platform: boolean;
  circulation_score: number;
}

export interface Scrut {
  id: string;
  user: User;
  conversation_id: string | null;
  type: ScrutType;
  audio_url?: string;
  audio_duration?: number;
  text?: string;
  position?: StatementPosition;
  created_at: string;
  resonate_count?: number;
  resonated_by_me?: boolean;
  attachment_url?: string;
}

export type AmbientEnvironment =
  | 'off'
  | 'ocean'
  | 'forest'
  | 'rain'
  | 'night'
  | 'clouds'
  | 'fireplace'
  | 'city'
  | 'minimal'
  | string; // allow custom atmosphere IDs

export interface UserPreferences {
  ambient: AmbientEnvironment;
  reducedMotion: boolean;
  musicEnabled: boolean;
  musicVolume: number;
}
