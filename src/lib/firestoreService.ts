import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { ConversationStarter, Scrut, User } from '@/types';
import {
  createConversationOnCloudflare,
  createScrutOnCloudflare,
  toggleResonateOnCloudflare,
  fetchStreamFromCloudflare,
  submitReportToCloudflare,
} from '@/lib/cloudflareService';

export async function createFirestoreConversation(input: {
  userId: string;
  user: User;
  body: string;
  topic: string;
  type?: 'question' | 'statement' | 'open';
  isPlatform?: boolean;
}): Promise<ConversationStarter> {
  // Try Cloudflare D1 first when available
  try {
    const cfConv = await createConversationOnCloudflare(input);
    if (cfConv) {
      // Sync to firestore in background
      setDoc(doc(db, 'conversations', cfConv.id), cfConv).catch(() => {});
      return cfConv;
    }
  } catch {
    // Continue to Firestore
  }

  const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();
  const convData = {
    id: convId,
    user_id: input.userId,
    body: input.body.trim(),
    topic: input.topic,
    type: input.type || 'question',
    is_platform: Boolean(input.isPlatform),
    scrut_count: 0,
    country_count: 1,
    circulation_score: 0,
    created_at: now,
  };

  try {
    await setDoc(doc(db, 'conversations', convId), convData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `conversations/${convId}`);
  }

  return {
    ...convData,
    user: input.user,
  };
}

export async function fetchFirestoreConversations(options?: { type?: string; isPlatform?: boolean } | string): Promise<ConversationStarter[]> {
  try {
    const collRef = collection(db, 'conversations');
    const filterType = typeof options === 'string' ? options : options?.type;
    const isPlatform = typeof options === 'object' ? options?.isPlatform : undefined;

    const snap = await getDocs(query(collRef, orderBy('created_at', 'desc'), limit(60)));
    return snap.docs
      .map((d) => {
        const data = d.data() as ConversationStarter;
        return {
          ...data,
          id: d.id,
          user: data.user || { id: data.user_id, display_name: 'Scruttin', avatar_url: '', country: 'Global' },
        };
      })
      .filter((c) => {
        if (filterType && c.type !== filterType) return false;
        if (isPlatform !== undefined && Boolean(c.is_platform) !== isPlatform) return false;
        return true;
      });
  } catch (error) {
    console.warn('Could not query Firestore conversations:', error);
    return [];
  }
}

export async function createFirestoreScrut(input: {
  userId: string;
  user: User;
  conversationId?: string | null;
  type: 'voice' | 'text' | 'voice_text';
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  position?: 'agree' | 'unsure' | 'disagree' | null;
}): Promise<Scrut> {
  // Try Cloudflare D1 first when available
  try {
    const cfScrut = await createScrutOnCloudflare(input);
    if (cfScrut) {
      setDoc(doc(db, 'scruts', cfScrut.id), cfScrut).catch(() => {});
      return cfScrut;
    }
  } catch {
    // Continue to Firestore
  }

  const scrutId = 'scrut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();
  const data = {
    id: scrutId,
    user_id: input.userId,
    conversation_id: input.conversationId || null,
    type: input.type,
    text: input.text?.trim() || '',
    audio_url: input.audioUrl || '',
    audio_duration: input.audioDuration || 0,
    position: input.position || null,
    resonate_count: 0,
    is_reported: false,
    created_at: now,
  };

  try {
    await setDoc(doc(db, 'scruts', scrutId), data);
    if (input.conversationId) {
      // update conversation count if exists
      const convRef = doc(db, 'conversations', input.conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        await updateDoc(convRef, {
          scrut_count: increment(1),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `scruts/${scrutId}`);
  }

  return {
    ...data,
    user: input.user,
  };
}

export async function toggleFirestoreResonate(scrutId: string, userId: string, currentlyResonated: boolean): Promise<boolean> {
  // Try Cloudflare D1 first when available
  try {
    const cfResult = await toggleResonateOnCloudflare(scrutId, userId, currentlyResonated);
    if (cfResult !== null) {
      return cfResult;
    }
  } catch {
    // Continue to Firestore
  }

  const resId = `${userId}_${scrutId}`;
  const resRef = doc(db, 'resonates', resId);
  const scrutRef = doc(db, 'scruts', scrutId);

  try {
    if (currentlyResonated) {
      await deleteDoc(resRef);
      await updateDoc(scrutRef, { resonate_count: increment(-1) });
      return false;
    } else {
      await setDoc(resRef, {
        id: resId,
        user_id: userId,
        scrut_id: scrutId,
        created_at: new Date().toISOString(),
      });
      await updateDoc(scrutRef, { resonate_count: increment(1) });
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, currentlyResonated ? OperationType.DELETE : OperationType.CREATE, `resonates/${resId}`);
  }
}

export async function fetchFirestoreStream(): Promise<{ conversations: ConversationStarter[]; scruts: Scrut[] }> {
  // Try Cloudflare D1 first when available
  try {
    const cfStream = await fetchStreamFromCloudflare();
    if (cfStream && cfStream.conversations && cfStream.conversations.length > 0) {
      return cfStream;
    }
  } catch {
    // Fallback to Firestore
  }

  try {
    const convSnap = await getDocs(
      query(collection(db, 'conversations'), orderBy('created_at', 'desc'), limit(40))
    );
    const conversations: ConversationStarter[] = convSnap.docs.map((d) => {
      const data = d.data() as ConversationStarter;
      return {
        ...data,
        id: d.id,
        user: data.user || { id: data.user_id, display_name: 'Scruttin', avatar_url: '', country: 'Global' },
      };
    });

    const scrutSnap = await getDocs(
      query(collection(db, 'scruts'), orderBy('created_at', 'asc'), limit(200))
    );
    const scruts: Scrut[] = scrutSnap.docs
      .map((d) => {
        const data = d.data();
        if (data.is_reported) return null;
        return {
          id: d.id,
          conversation_id: data.conversation_id || null,
          user_id: data.user_id,
          user: data.user || { id: data.user_id, display_name: 'Anonymous', avatar_url: '', country: 'Global' },
          type: data.type || 'text',
          text: data.text,
          audio_url: data.audio_url,
          audio_duration: data.audio_duration,
          position: data.position || null,
          resonate_count: data.resonate_count || 0,
          resonated_by_me: false,
          attachment_url: data.attachment_url,
          created_at: data.created_at || new Date().toISOString(),
        } as Scrut;
      })
      .filter((s): s is Scrut => s !== null);

    return { conversations, scruts };
  } catch (error) {
    console.warn('Error fetching firestore stream:', error);
    return { conversations: [], scruts: [] };
  }
}

export async function fetchFirestoreTopics(): Promise<string[]> {
  try {
    const snap = await getDocs(query(collection(db, 'topics'), orderBy('sort_order', 'asc'), limit(30)));
    if (!snap.empty) {
      return snap.docs.map(d => d.data().label as string).filter(Boolean);
    }
  } catch {
    // fallback
  }
  return ['Life', 'Relationships', 'Work', 'Money', 'Technology', 'Culture', 'Family', 'Society', 'Fun'];
}

export async function fetchFirestoreActiveAdCampaigns(): Promise<Record<string, unknown>[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'ad_campaigns'), where('status', '==', 'active'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Failed to load ad campaigns from Firestore:', error);
    return [];
  }
}

export async function recordFirestoreAdEvent(campaignId: string, sessionId: string, eventType: string, valueNum?: number, metadata?: Record<string, unknown>) {
  try {
    await addDoc(collection(db, 'ad_events'), {
      campaign_id: campaignId,
      session_id: sessionId,
      event_type: eventType,
      value_num: valueNum ?? null,
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to log ad event:', e);
  }
}

export async function fetchFirestoreMusicTracks(): Promise<{ id: string; title: string; artist?: string; url: string }[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'music_tracks'), where('is_active', '!=', false))
    );
    return snap.docs.map(d => ({
      id: d.id,
      title: d.data().title || 'Ambient Track',
      artist: d.data().artist || 'Scruttin',
      url: d.data().url,
    }));
  } catch {
    return [];
  }
}

export async function fetchFirestoreUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const snap = await getDoc(doc(db, 'user_preferences', userId));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function fetchFirestoreConversation(id: string): Promise<ConversationStarter | null> {
  try {
    const snap = await getDoc(doc(db, 'conversations', id));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        user_id: data.user_id,
        user: data.user || { id: data.user_id, display_name: 'Scruttin', avatar_url: '', country: 'Global' },
        type: data.type || 'question',
        body: data.body || '',
        topic: data.topic || '',
        created_at: data.created_at || new Date().toISOString(),
        scrut_count: data.scrut_count || 0,
        country_count: data.country_count || 1,
        is_platform: Boolean(data.is_platform),
        circulation_score: data.circulation_score || 0,
      };
    }
  } catch (error) {
    console.warn('Error fetching conversation:', error);
  }
  return null;
}

export async function fetchFirestoreScrutsForConversation(convId: string, currentUserId?: string): Promise<Scrut[]> {
  try {
    const q = query(
      collection(db, 'scruts'),
      where('conversation_id', '==', convId),
      orderBy('created_at', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const scruts: Scrut[] = [];

    // Collect resonated IDs if user logged in
    let resonatedMap = new Set<string>();
    if (currentUserId && !snap.empty) {
      try {
        const resSnap = await getDocs(
          query(collection(db, 'resonates'), where('user_id', '==', currentUserId), limit(100))
        );
        resonatedMap = new Set(resSnap.docs.map(d => d.data().scrut_id));
      } catch {
        // ignore
      }
    }

    snap.forEach((d) => {
      const data = d.data();
      if (data.is_reported) return;
      scruts.push({
        id: d.id,
        conversation_id: data.conversation_id,
        user_id: data.user_id,
        user: data.user || { id: data.user_id, display_name: 'Anonymous', avatar_url: '', country: 'Global' },
        type: data.type || 'text',
        text: data.text,
        audio_url: data.audio_url,
        audio_duration: data.audio_duration,
        position: data.position || null,
        resonate_count: data.resonate_count || 0,
        resonated_by_me: resonatedMap.has(d.id),
        attachment_url: data.attachment_url,
        created_at: data.created_at || new Date().toISOString(),
      });
    });

    return scruts;
  } catch (error) {
    console.warn('Error fetching scruts for conversation:', error);
    return [];
  }
}

export async function fetchFirestoreOpenScruts(currentUserId?: string): Promise<Scrut[]> {
  try {
    const q = query(
      collection(db, 'scruts'),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const scruts: Scrut[] = [];

    let resonatedMap = new Set<string>();
    if (currentUserId && !snap.empty) {
      try {
        const resSnap = await getDocs(
          query(collection(db, 'resonates'), where('user_id', '==', currentUserId), limit(100))
        );
        resonatedMap = new Set(resSnap.docs.map(d => d.data().scrut_id));
      } catch {
        // ignore
      }
    }

    snap.forEach((d) => {
      const data = d.data();
      if (data.is_reported) return;
      if (data.conversation_id) return; // Open scruts are standalone
      scruts.push({
        id: d.id,
        conversation_id: null,
        user_id: data.user_id,
        user: data.user || { id: data.user_id, display_name: 'Anonymous', avatar_url: '', country: 'Global' },
        type: data.type || 'text',
        text: data.text,
        audio_url: data.audio_url,
        audio_duration: data.audio_duration,
        position: null,
        resonate_count: data.resonate_count || 0,
        resonated_by_me: resonatedMap.has(d.id),
        attachment_url: data.attachment_url,
        created_at: data.created_at || new Date().toISOString(),
      });
    });

    return scruts;
  } catch (error) {
    console.warn('Error fetching open scruts:', error);
    return [];
  }
}

export async function fetchFirestoreUserStats(userId: string): Promise<{ scruts_given: number; conversations_asked: number }> {
  try {
    const [scrutSnap, convSnap] = await Promise.all([
      getDocs(query(collection(db, 'scruts'), where('user_id', '==', userId), limit(200))),
      getDocs(query(collection(db, 'conversations'), where('user_id', '==', userId), limit(200))),
    ]);
    return {
      scruts_given: scrutSnap.size,
      conversations_asked: convSnap.size,
    };
  } catch {
    return { scruts_given: 0, conversations_asked: 0 };
  }
}

export async function fetchFirestoreUserScruts(userId: string): Promise<Scrut[]> {
  try {
    const q = query(
      collection(db, 'scruts'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        conversation_id: data.conversation_id || null,
        user_id: data.user_id,
        user: data.user || { id: userId, display_name: 'Me', avatar_url: '', country: '' },
        type: data.type || 'text',
        text: data.text,
        audio_url: data.audio_url,
        audio_duration: data.audio_duration,
        position: data.position || null,
        resonate_count: data.resonate_count || 0,
        resonated_by_me: false,
        created_at: data.created_at || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function submitFirestoreReport(scrutId: string, userId: string, reason: string): Promise<void> {
  // Try Cloudflare D1 first
  try {
    const cfOk = await submitReportToCloudflare(scrutId, userId, reason);
    if (cfOk) return;
  } catch {
    // Continue to Firestore
  }

  const repId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  try {
    await setDoc(doc(db, 'reports', repId), {
      id: repId,
      scrut_id: scrutId,
      user_id: userId,
      reason: reason.trim(),
      reviewed: false,
      actioned: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${repId}`);
  }
}
