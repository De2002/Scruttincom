import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversation_id');
  const isOpen = url.searchParams.get('open') === 'true';
  const userId = url.searchParams.get('user_id');
  const currentUserId = url.searchParams.get('current_user_id');

  try {
    let query = `
      SELECT 
        s.id, s.conversation_id, s.user_id, s.type, s.text, 
        s.audio_url, s.audio_duration, s.position, s.resonate_count,
        s.attachment_url, s.created_at,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar_url,
        u.country as user_country
      FROM scruts s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.is_reported = 0
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (conversationId) {
      conditions.push(`s.conversation_id = ?`);
      params.push(conversationId);
    } else if (isOpen) {
      conditions.push(`(s.conversation_id IS NULL OR s.conversation_id = '')`);
    }

    if (userId) {
      conditions.push(`s.user_id = ?`);
      params.push(userId);
    }

    if (conditions.length > 0) {
      query += ` AND ` + conditions.join(' AND ');
    }

    query += ` ORDER BY s.created_at ${isOpen || userId ? 'DESC' : 'ASC'} LIMIT 100`;

    const res = await env.DB.prepare(query).bind(...params).all();

    // Check resonated by current user
    const resonatedSet = new Set<string>();
    if (currentUserId && res.results.length > 0) {
      try {
        const userResonates = await env.DB.prepare(`
          SELECT scrut_id FROM resonates WHERE user_id = ?
        `).bind(currentUserId).all();
        (userResonates.results || []).forEach((r: Record<string, unknown>) => {
          resonatedSet.add(r.scrut_id as string);
        });
      } catch {
        // ignore
      }
    }

    const scruts = (res.results || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      conversation_id: row.conversation_id || null,
      user_id: row.user_id,
      type: row.type || 'text',
      text: row.text,
      audio_url: row.audio_url,
      audio_duration: Number(row.audio_duration) || 0,
      position: row.position || null,
      resonate_count: Number(row.resonate_count) || 0,
      resonated_by_me: resonatedSet.has(row.id as string),
      attachment_url: row.attachment_url,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        display_name: row.user_display_name || 'Anonymous',
        avatar_url: row.user_avatar_url || '',
        country: row.user_country || 'Global',
      },
    }));

    return jsonResponse(scruts);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch scruts', details: msg }, { status: 500 });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as {
      id?: string;
      userId: string;
      user?: { id?: string; display_name?: string; avatar_url?: string; country?: string };
      conversationId?: string | null;
      type: 'voice' | 'text' | 'voice_text';
      text?: string;
      audioUrl?: string;
      audioDuration?: number;
      position?: 'agree' | 'unsure' | 'disagree' | null;
      attachmentUrl?: string;
    };

    if (!body.userId) {
      return jsonResponse({ error: 'Missing userId' }, { status: 400 });
    }

    const scrutId = body.id || 'scrut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const convId = body.conversationId || null;

    // Ensure user exists
    if (body.user) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO users (id, display_name, avatar_url, country)
        VALUES (?, ?, ?, ?)
      `).bind(
        body.userId,
        body.user.display_name || 'User',
        body.user.avatar_url || '',
        body.user.country || 'Global'
      ).run();
    }

    // Insert scrut
    await env.DB.prepare(`
      INSERT INTO scruts (id, user_id, conversation_id, type, text, audio_url, audio_duration, position, resonate_count, attachment_url, is_reported, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)
    `).bind(
      scrutId,
      body.userId,
      convId,
      body.type || 'text',
      body.text?.trim() || null,
      body.audioUrl || null,
      body.audioDuration || 0,
      body.position || null,
      body.attachmentUrl || null,
      now
    ).run();

    // Increment conversation count if belongs to a conversation
    if (convId) {
      await env.DB.prepare(`
        UPDATE conversations 
        SET scrut_count = scrut_count + 1 
        WHERE id = ?
      `).bind(convId).run();
    }

    const created = {
      id: scrutId,
      conversation_id: convId,
      user_id: body.userId,
      type: body.type || 'text',
      text: body.text?.trim() || '',
      audio_url: body.audioUrl || '',
      audio_duration: body.audioDuration || 0,
      position: body.position || null,
      resonate_count: 0,
      resonated_by_me: false,
      attachment_url: body.attachmentUrl,
      created_at: now,
      user: body.user || { id: body.userId, display_name: 'Anonymous', avatar_url: '', country: 'Global' },
    };

    return jsonResponse(created, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to create scrut', details: msg }, { status: 500 });
  }
};
