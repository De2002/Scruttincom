-- =============================================================================
-- Cloudflare D1 Database Schema for Scruttin
-- Run locally or deploy:
--   npx wrangler d1 execute scruttin-d1 --file=./schema.sql
-- =============================================================================

-- Enable Foreign Keys
PRAGMA foreign_keys = ON;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                       -- Firebase User UID
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT DEFAULT '',
  country TEXT DEFAULT 'Global',
  city TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  instagram TEXT,
  tip_link TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  onboarded INTEGER NOT NULL DEFAULT 0,
  date_of_birth TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'question' CHECK (type IN ('question', 'statement', 'open')),
  body TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'Life',
  scrut_count INTEGER NOT NULL DEFAULT 0,
  country_count INTEGER NOT NULL DEFAULT 1,
  circulation_score REAL NOT NULL DEFAULT 0,
  is_platform INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. SCRUTS (Voice and Text thoughts)
CREATE TABLE IF NOT EXISTS scruts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('voice', 'text', 'voice_text')),
  text TEXT,
  audio_url TEXT,
  audio_duration REAL DEFAULT 0,
  position TEXT CHECK (position IN ('agree', 'unsure', 'disagree', NULL)),
  resonate_count INTEGER NOT NULL DEFAULT 0,
  attachment_url TEXT,
  is_reported INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. RESONATES
CREATE TABLE IF NOT EXISTS resonates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scrut_id TEXT NOT NULL REFERENCES scruts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, scrut_id)
);

-- 5. REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  scrut_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  reviewed INTEGER NOT NULL DEFAULT 0,
  actioned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ambient TEXT DEFAULT 'minimal',
  reduced_motion INTEGER DEFAULT 0,
  music_enabled INTEGER DEFAULT 1,
  music_volume REAL DEFAULT 0.4,
  voice_volume REAL DEFAULT 1.0,
  selected_track_id TEXT,
  typing_sound TEXT,
  font_family TEXT DEFAULT 'inter',
  text_size TEXT DEFAULT 'normal',
  typing_speed TEXT DEFAULT 'normal',
  personal_bg_url TEXT,
  personal_music_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. AD CAMPAIGNS
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  ad_type TEXT NOT NULL DEFAULT 'ambient' CHECK (ad_type IN ('ambient', 'sponsored_scrut', 'banner')),
  ambient_clip_url TEXT,
  audio_clip_url TEXT,
  brand_name TEXT,
  tagline TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  banner_url TEXT,
  headline TEXT,
  body_text TEXT,
  daily_budget REAL DEFAULT 0,
  impressions_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. AD EVENTS
CREATE TABLE IF NOT EXISTS ad_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  value_num REAL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. TOPICS
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 10. MUSIC TRACKS
CREATE TABLE IF NOT EXISTS music_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Scruttin Ambient',
  url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. ATMOSPHERE CLIPS
CREATE TABLE IF NOT EXISTS atmosphere_clips (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '✨',
  url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. TYPING SOUNDS
CREATE TABLE IF NOT EXISTS typing_sounds (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_scruts_conv ON scruts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_scruts_user ON scruts(user_id);
CREATE INDEX IF NOT EXISTS idx_scruts_created ON scruts(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_resonates_scrut ON resonates(scrut_id);
CREATE INDEX IF NOT EXISTS idx_resonates_user ON resonates(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);

-- SEED DATA: Topics
INSERT OR IGNORE INTO topics (id, label, sort_order) VALUES
  ('top_1', 'Life', 1),
  ('top_2', 'Relationships', 2),
  ('top_3', 'Work', 3),
  ('top_4', 'Money', 4),
  ('top_5', 'Technology', 5),
  ('top_6', 'Culture', 6),
  ('top_7', 'Family', 7),
  ('top_8', 'Society', 8),
  ('top_9', 'Philosophy', 9);

-- SEED DATA: Platform admin user
INSERT OR IGNORE INTO users (id, email, display_name, avatar_url, country, is_admin, onboarded) VALUES
  ('platform_admin', 'mderrickm00@gmail.com', 'Scruttin', '', 'Global', 1, 1);
