/**
 * Cloudflare D1 Service for Scruttin
 * Direct interface to Cloudflare D1 Database for:
 * - Questions (conversations: type = 'question')
 * - Voice and text ruts (scruts)
 * - Statements (conversations: type = 'statement')
 * - Tags (user tags, tagged feed, interactions, poll votes)
 * - User profiles and preferences
 * - Resonates, reports, media uploads, and meta resources
 */

import type { ConversationStarter, Scrut, User } from '@/types';
import type { TaggedPostItem, TaggedReply, TaggedSticker, TaggedPoll } from '@/constants/taggedData';
import { auth } from '@/lib/firebase';

const API_BASE = '/api';

/** Every API request carries the current Firebase ID token. */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[Cloudflare D1 API] Request to ${endpoint} failed:`, err);
    return null;
  }
}

// ==========================================
// 1. STREAM & QUESTIONS & STATEMENTS
// ==========================================

export async function fetchD1Stream(): Promise<{
  conversations: ConversationStarter[];
  scruts: Scrut[];
}> {
  const data = await apiFetch<{ conversations: ConversationStarter[]; scruts: Scrut[] }>('/stream');
  if (data && data.conversations && data.conversations.length > 0) {
    return data;
  }
  // Fallback if D1 is initializing
  return {
    conversations: [] as ConversationStarter[],
    scruts: [] as Scrut[],
  };
}

export async function fetchD1Conversations(params?: {
  type?: 'question' | 'statement' | 'open';
  userId?: string;
  isPlatform?: boolean;
} | 'question' | 'statement' | 'open'): Promise<ConversationStarter[]> {
  const p = typeof params === 'string' ? { type: params } : params;
  const q = new URLSearchParams();
  if (p?.type) q.set('type', p.type);
  if (p?.userId) q.set('user_id', p.userId);

  const data = await apiFetch<ConversationStarter[]>(`/conversations?${q.toString()}`);
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  // Fallback filter
  if (p?.type) {
    return ([] as ConversationStarter[]).filter((c) => c.type === p.type);
  }
  return [] as ConversationStarter[];
}

export async function fetchD1Conversation(id: string): Promise<ConversationStarter | null> {
  const data = await apiFetch<ConversationStarter>(`/conversations?id=${id}`);
  if (data && data.id) {
    return data;
  }
  return ([] as ConversationStarter[]).find((c) => c.id === id) || null;
}

export async function createD1Conversation(input: {
  userId: string;
  user: User;
  body: string;
  topic: string;
  type?: 'question' | 'statement' | 'open';
  isPlatform?: boolean;
}): Promise<ConversationStarter> {
  const res = await apiFetch<ConversationStarter>('/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (res && res.id) {
    return res;
  }

  // Local optimistic fallback
  const fallback: ConversationStarter = {
    id: 'conv_' + Date.now(),
    user_id: input.userId,
    user: input.user,
    type: input.type || 'question',
    body: input.body.trim(),
    topic: input.topic,
    scrut_count: 0,
    country_count: 1,
    circulation_score: 0,
    is_platform: Boolean(input.isPlatform),
    created_at: new Date().toISOString(),
  };
  return fallback;
}

// ==========================================
// 2. SCRUTS (VOICE RUTS & TEXT RESPONSES)
// ==========================================

export async function fetchD1ScrutsForConversation(
  conversationId: string,
  currentUserId?: string
): Promise<Scrut[]> {
  const q = new URLSearchParams({ conversation_id: conversationId });
  if (currentUserId) q.set('current_user_id', currentUserId);

  const data = await apiFetch<Scrut[]>(`/scruts?${q.toString()}`);
  if (data && Array.isArray(data)) {
    return data;
  }
  return ([] as Scrut[]).filter((s) => s.conversation_id === conversationId);
}

export async function fetchD1OpenScruts(currentUserId?: string): Promise<Scrut[]> {
  const q = new URLSearchParams({ open: 'true' });
  if (currentUserId) q.set('current_user_id', currentUserId);

  const data = await apiFetch<Scrut[]>(`/scruts?${q.toString()}`);
  if (data && Array.isArray(data)) {
    return data;
  }
  return ([] as Scrut[]).filter((s) => !s.conversation_id);
}

export async function fetchD1UserScruts(userId: string, currentUserId?: string): Promise<Scrut[]> {
  const q = new URLSearchParams({ user_id: userId });
  if (currentUserId) q.set('current_user_id', currentUserId);

  const data = await apiFetch<Scrut[]>(`/scruts?${q.toString()}`);
  if (data && Array.isArray(data)) {
    return data;
  }
  return ([] as Scrut[]).filter((s) => s.user_id === userId);
}

export async function createD1Scrut(input: {
  userId: string;
  user: User;
  conversationId?: string | null;
  type: 'voice' | 'text' | 'voice_text';
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  position?: 'agree' | 'unsure' | 'disagree' | null;
  attachmentUrl?: string;
}): Promise<Scrut> {
  const res = await apiFetch<Scrut>('/scruts', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (res && res.id) {
    return res;
  }

  // Optimistic fallback
  const fallback: Scrut = {
    id: 'scrut_' + Date.now(),
    conversation_id: input.conversationId || null,
    user_id: input.userId,
    user: input.user,
    type: input.type,
    text: input.text,
    audio_url: input.audioUrl,
    audio_duration: input.audioDuration,
    position: input.position || null,
    resonate_count: 0,
    resonated_by_me: false,
    attachment_url: input.attachmentUrl,
    created_at: new Date().toISOString(),
  };
  return fallback;
}

export async function toggleD1Resonate(
  scrutId: string,
  userId: string,
  currentlyResonated: boolean
): Promise<boolean> {
  const res = await apiFetch<{ resonated: boolean }>('/resonates', {
    method: 'POST',
    body: JSON.stringify({ scrutId, userId, currentlyResonated }),
  });

  if (res && typeof res.resonated === 'boolean') {
    return res.resonated;
  }
  return !currentlyResonated;
}

// ==========================================
// 3. USER PROFILES & PREFERENCES
// ==========================================

export async function fetchD1UserProfile(userId: string): Promise<Record<string, unknown> | null> {
  return await apiFetch<Record<string, unknown>>(`/user?id=${userId}`);
}

export async function syncD1UserProfile(
  user: Partial<User> & { id: string; email?: string }
): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>('/user', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return Boolean(res?.success);
}

export async function fetchD1UserStats(userId: string): Promise<{
  scruts_given: number;
  conversations_asked: number;
  taggers_count: number;
}> {
  const data = await apiFetch<{
    scruts_given: number;
    conversations_asked: number;
    taggers_count?: number;
  }>(`/user?id=${userId}`);

  if (data) {
    return {
      scruts_given: Number(data.scruts_given) || 0,
      conversations_asked: Number(data.conversations_asked) || 0,
      taggers_count: Number(data.taggers_count) || 0,
    };
  }

  const userScruts = ([] as Scrut[]).filter((s) => s.user_id === userId);
  const userConvs = ([] as ConversationStarter[]).filter((c) => c.user_id === userId);
  return {
    scruts_given: userScruts.length,
    conversations_asked: userConvs.length,
    taggers_count: 14,
  };
}

export async function fetchD1UserPreferences(userId: string): Promise<Record<string, unknown> | null> {
  return await apiFetch<Record<string, unknown>>(`/preferences?user_id=${userId}`);
}

export async function saveD1UserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>('/preferences', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, ...preferences }),
  });
  return Boolean(res);
}

// ==========================================
// 4. TAGS & TAGGED FEED
// ==========================================

export interface D1TaggedData {
  posts: TaggedPostItem[];
  userTags: string[];
  likedIds: string[];
  repostedIds: string[];
  bookmarkedIds: string[];
  pollVotes: Record<string, string>;
  taggersCount: number;
}

export async function fetchD1TaggedData(currentUserId?: string): Promise<D1TaggedData> {
  const q = new URLSearchParams({ action: 'feed' });
  if (currentUserId) q.set('current_user_id', currentUserId);

  const data = await apiFetch<D1TaggedData>(`/tagged?${q.toString()}`);
  if (data && Array.isArray(data.posts) && data.posts.length > 0) {
    return data;
  }

  return {
    posts: [] as TaggedPostItem[],
    userTags: ['u5', 'u1', 'u4', 'u2'],
    likedIds: [],
    repostedIds: [],
    bookmarkedIds: [],
    pollVotes: {},
    taggersCount: 14,
  };
}

export async function createD1TaggedPost(payload: {
  userId: string;
  user: User;
  text: string;
  image_url?: string;
  gif_url?: string;
  sticker?: TaggedSticker;
  poll?: TaggedPoll;
  location_tag?: string;
  mood_tag?: string;
}): Promise<TaggedPostItem> {
  const res = await apiFetch<TaggedPostItem>('/tagged', {
    method: 'POST',
    body: JSON.stringify({
      type: 'post',
      ...payload,
    }),
  });

  if (res && res.id) {
    return res;
  }

  const fallback: TaggedPostItem = {
    id: 'tag_' + Date.now(),
    user: payload.user,
    text: payload.text.trim(),
    image_url: payload.image_url,
    gif_url: payload.gif_url,
    sticker: payload.sticker,
    poll: payload.poll,
    location_tag: payload.location_tag,
    mood_tag: payload.mood_tag,
    like_count: 0,
    retag_count: 0,
    reply_count: 0,
    created_at: new Date().toISOString(),
  };
  return fallback;
}

export async function createD1TaggedReply(
  postId: string,
  userId: string,
  text: string,
  sticker?: TaggedSticker
): Promise<TaggedReply | null> {
  const res = await apiFetch<TaggedReply>('/tagged', {
    method: 'POST',
    body: JSON.stringify({
      type: 'reply',
      postId,
      userId,
      text,
      sticker,
    }),
  });
  return res;
}

export async function toggleD1UserTag(
  taggerId: string,
  taggedUserId: string
): Promise<boolean> {
  const res = await apiFetch<{ tagged: boolean }>('/tagged', {
    method: 'POST',
    body: JSON.stringify({
      type: 'tag',
      taggerId,
      taggedUserId,
    }),
  });
  return res ? Boolean(res.tagged) : true;
}

export async function toggleD1PostInteraction(
  action: 'like' | 'repost' | 'bookmark',
  postId: string,
  userId: string
): Promise<boolean> {
  const res = await apiFetch<Record<string, unknown>>('/tagged', {
    method: 'POST',
    body: JSON.stringify({
      type: action,
      postId,
      userId,
    }),
  });
  if (res && typeof res[action === 'like' ? 'liked' : action === 'repost' ? 'reposted' : 'bookmarked'] === 'boolean') {
    return Boolean(res[action === 'like' ? 'liked' : action === 'repost' ? 'reposted' : 'bookmarked']);
  }
  return true;
}

export async function voteD1Poll(
  postId: string,
  userId: string,
  optionId: string
): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>('/tagged', {
    method: 'POST',
    body: JSON.stringify({
      type: 'vote',
      postId,
      userId,
      optionId,
    }),
  });
  return Boolean(res?.success);
}

// ==========================================
// 5. META, MEDIA & REPORTS
// ==========================================

export async function fetchD1Topics(): Promise<{ id: string; label: string }[]> {
  const data = await apiFetch<{ id: string; label: string }[]>('/meta?resource=topics');
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  return [
    { id: 'top_1', label: 'Life' },
    { id: 'top_2', label: 'Relationships' },
    { id: 'top_3', label: 'Work' },
    { id: 'top_4', label: 'Money' },
    { id: 'top_5', label: 'Technology' },
    { id: 'top_6', label: 'Culture' },
    { id: 'top_7', label: 'Family' },
    { id: 'top_8', label: 'Society' },
    { id: 'top_9', label: 'Philosophy' },
  ];
}

export async function fetchD1MusicTracks(): Promise<{
  id: string;
  title: string;
  artist?: string;
  url: string;
}[]> {
  const data = await apiFetch<{ id: string; title: string; artist?: string; url: string }[]>('/meta?resource=music');
  if (data && Array.isArray(data) && data.length > 0) {
    return data;
  }
  return [
    {
      id: 'trk_1',
      title: 'Nocturne in C-Sharp',
      artist: 'Scruttin Ambient',
      url: 'https://cdn.freesound.org/previews/560/560446_11861866-lq.mp3',
    },
    {
      id: 'trk_2',
      title: 'Midnight Rain Pulse',
      artist: 'Scruttin Ambient',
      url: 'https://cdn.freesound.org/previews/682/682498_11861866-lq.mp3',
    },
  ];
}

export async function fetchD1AtmosphereClips(): Promise<{
  id: string;
  label: string;
  emoji?: string;
  url?: string;
}[]> {
  const data = await apiFetch<{ id: string; label: string; emoji?: string; url?: string }[]>('/meta?resource=atmospheres');
  return data || [];
}

export async function fetchD1TypingSounds(): Promise<{
  id: string;
  title: string;
  url: string;
}[]> {
  const data = await apiFetch<{ id: string; title: string; url: string }[]>('/meta?resource=typing_sounds');
  return data || [];
}

export async function fetchD1ActiveAdCampaigns(): Promise<unknown[]> {
  const data = await apiFetch<unknown[]>('/meta?resource=ads');
  return data || [];
}

export async function recordD1AdEvent(
  campaignId: string,
  sessionId: string,
  eventType: string,
  valueNum?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await apiFetch('/meta', {
    method: 'POST',
    body: JSON.stringify({
      resource: 'ad_event',
      campaign_id: campaignId,
      session_id: sessionId,
      event_type: eventType,
      value_num: valueNum,
      metadata,
    }),
  });
}

export async function submitD1Report(
  scrutId: string,
  reporterId: string,
  reason: string
): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>('/reports', {
    method: 'POST',
    body: JSON.stringify({ scrut_id: scrutId, reporter_id: reporterId, reason }),
  });
  return Boolean(res);
}

export async function uploadD1Media(
  fileOrBlob: Blob | File,
  filename?: string
): Promise<{ url: string; key?: string }> {
  try {
    const formData = new FormData();
    const actualName = filename || (fileOrBlob instanceof File ? fileOrBlob.name : `audio_${Date.now()}.webm`);
    formData.append('file', fileOrBlob, actualName);

    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.ok) {
      const data = (await res.json()) as { success: boolean; url: string; key: string };
      if (data.url) {
        return { url: data.url, key: data.key };
      }
    }
  } catch (err) {
    console.error('[Cloudflare R2] Upload failed:', err);
  }
  throw new Error('Media upload failed. Please try again.');
}

export const uploadMediaToCloudflareR2 = uploadD1Media;

// ==========================================
// 6. ADMIN OPERATIONS (D1)
// ==========================================

export async function fetchD1AdminStats(): Promise<{ users: number; scruts: number; conversations: number; reports: number }> {
  const res = await apiFetch<{ users: number; scruts: number; conversations: number; reports: number }>('/admin?resource=stats');
  return res || { users: 0, scruts: 0, conversations: 0, reports: 0 };
}

export async function fetchD1AdminReports(): Promise<Record<string, unknown>[]> {
  const res = await apiFetch<Record<string, unknown>[]>('/admin?resource=reports');
  return res || [];
}

export async function actionD1AdminReport(reportId: string, hide: boolean, scrutId?: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'action_report', reportId, hide, scrutId }),
  });
  return Boolean(res);
}

export async function fetchD1AdminUsers(): Promise<{ id: string; display_name: string | null; email: string; country: string | null; is_admin: boolean }[]> {
  const res = await apiFetch<{ id: string; display_name: string | null; email: string; country: string | null; is_admin: boolean }[]>('/admin?resource=users');
  return res || [];
}

export async function toggleD1AdminRole(userId: string, isAdmin: boolean): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'toggle_admin', userId, isAdmin }),
  });
  return Boolean(res);
}

export async function fetchD1AdminCampaigns(): Promise<AdCampaign[]> {
  const res = await apiFetch<AdCampaign[]>('/admin?resource=campaigns');
  return res || [];
}

export async function createD1AdminCampaign(data: Record<string, unknown>): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_campaign', ...data }),
  });
  return Boolean(res);
}

export async function updateD1AdminCampaignStatus(id: string, status: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'update_campaign_status', id, status }),
  });
  return Boolean(res);
}

export async function createD1Topic(label: string, color: string, sort_order?: number): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_topic', label, color, sort_order }),
  });
  return Boolean(res);
}

export async function deleteD1Topic(id: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_topic', id }),
  });
  return Boolean(res);
}

export async function createD1MusicTrack(title: string, artist: string, url: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_music', title, artist, url }),
  });
  return Boolean(res);
}

export async function deleteD1MusicTrack(id: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_music', id }),
  });
  return Boolean(res);
}

export async function createD1Atmosphere(data: Record<string, unknown>): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_atmosphere', ...data }),
  });
  return Boolean(res);
}

export async function deleteD1Atmosphere(id: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_atmosphere', id }),
  });
  return Boolean(res);
}

export async function createD1TypingSound(title: string, url: string, is_default: boolean): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_typing_sound', title, url, is_default }),
  });
  return Boolean(res);
}

export async function deleteD1TypingSound(id: string): Promise<boolean> {
  const res = await apiFetch('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_typing_sound', id }),
  });
  return Boolean(res);
}

// ==========================================
// 7. BACKWARD COMPATIBILITY ALIASES
// ==========================================
export const fetchFirestoreStream = fetchD1Stream;
export const fetchFirestoreConversations = fetchD1Conversations;
export const fetchFirestoreConversation = fetchD1Conversation;
export const createFirestoreConversation = createD1Conversation;
export const fetchFirestoreScrutsForConversation = fetchD1ScrutsForConversation;
export const fetchFirestoreOpenScruts = fetchD1OpenScruts;
export const fetchFirestoreUserScruts = fetchD1UserScruts;
export const createFirestoreScrut = createD1Scrut;
export const toggleFirestoreResonate = toggleD1Resonate;
export const fetchFirestoreUserStats = fetchD1UserStats;
export const fetchFirestoreUserPreferences = fetchD1UserPreferences;
export const saveFirestoreUserPreferences = saveD1UserPreferences;
export const fetchFirestoreTopics = fetchD1Topics;
export const fetchFirestoreMusicTracks = fetchD1MusicTracks;
export const fetchFirestoreActiveAdCampaigns = fetchD1ActiveAdCampaigns;
export const recordFirestoreAdEvent = recordD1AdEvent;
