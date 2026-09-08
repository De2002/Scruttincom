/**
 * Cloudflare D1 and R2 Client Service for Scruttin
 * Automatically connects to Cloudflare Pages Functions (/api/*) when deployed on Cloudflare,
 * with graceful fallback to local preview capabilities.
 */

import { ConversationStarter, Scrut, User } from '@/types';

const API_BASE = '/api';

/**
 * Upload audio recordings (voice ruts), background images, or music to Cloudflare R2
 */
export async function uploadMediaToCloudflareR2(
  fileOrBlob: Blob | File,
  filename?: string
): Promise<{ url: string; key?: string }> {
  try {
    const formData = new FormData();
    const actualName = filename || (fileOrBlob instanceof File ? fileOrBlob.name : `audio_${Date.now()}.webm`);
    formData.append('file', fileOrBlob, actualName);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json() as { success: boolean; url: string; key: string };
      if (data.url) {
        return { url: data.url, key: data.key };
      }
    }
  } catch (err) {
    console.warn('Cloudflare R2 upload fallback (running in local preview or before Cloudflare setup):', err);
  }

  // Graceful fallback for local preview: Convert to data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string });
    reader.onerror = () => resolve({ url: '' });
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Fetch Stream from Cloudflare D1
 */
export async function fetchStreamFromCloudflare(): Promise<{
  conversations: ConversationStarter[];
  scruts: Scrut[];
} | null> {
  try {
    const res = await fetch(`${API_BASE}/stream`);
    if (res.ok) {
      const data = await res.json() as { conversations: ConversationStarter[]; scruts: Scrut[] };
      return data;
    }
  } catch {
    // Return null to trigger fallback
  }
  return null;
}

/**
 * Create Conversation in Cloudflare D1
 */
export async function createConversationOnCloudflare(input: {
  userId: string;
  user: User;
  body: string;
  topic: string;
  type?: 'question' | 'statement' | 'open';
  isPlatform?: boolean;
}): Promise<ConversationStarter | null> {
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      return (await res.json()) as ConversationStarter;
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Create Scrut (Voice / Text) in Cloudflare D1
 */
export async function createScrutOnCloudflare(input: {
  userId: string;
  user: User;
  conversationId?: string | null;
  type: 'voice' | 'text' | 'voice_text';
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  position?: 'agree' | 'unsure' | 'disagree' | null;
  attachmentUrl?: string;
}): Promise<Scrut | null> {
  try {
    const res = await fetch(`${API_BASE}/scruts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      return (await res.json()) as Scrut;
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Toggle Resonate in Cloudflare D1
 */
export async function toggleResonateOnCloudflare(
  scrutId: string,
  userId: string,
  currentlyResonated: boolean
): Promise<boolean | null> {
  try {
    const res = await fetch(`${API_BASE}/resonates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrutId, userId, currentlyResonated }),
    });
    if (res.ok) {
      const data = await res.json() as { resonated: boolean };
      return data.resonated;
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Sync or update user profile to Cloudflare D1
 */
export async function syncUserProfileToCloudflare(user: Partial<User> & { id: string; email?: string }): Promise<void> {
  try {
    await fetch(`${API_BASE}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch {
    // ignore
  }
}

/**
 * Save user preferences to Cloudflare D1
 */
export async function syncPreferencesToCloudflare(userId: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...patch }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Submit user report to Cloudflare D1
 */
export async function submitReportToCloudflare(scrutId: string, reporterId: string, reason: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrut_id: scrutId, reporter_id: reporterId, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
