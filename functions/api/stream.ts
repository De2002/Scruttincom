import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const convPromise = env.DB.prepare(`
      SELECT 
        c.id, c.user_id, c.type, c.body, c.topic, c.scrut_count, 
        c.country_count, c.circulation_score, c.is_platform, c.created_at,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar_url,
        u.country as user_country
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 60
    `).all();

    const scrutsPromise = env.DB.prepare(`
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
      ORDER BY s.created_at ASC
      LIMIT 300
    `).all();

    const [convRes, scrutsRes] = await Promise.all([convPromise, scrutsPromise]);

    const conversations = (convRes.results || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      body: row.body,
      topic: row.topic,
      scrut_count: Number(row.scrut_count) || 0,
      country_count: Number(row.country_count) || 1,
      circulation_score: Number(row.circulation_score) || 0,
      is_platform: Boolean(row.is_platform),
      created_at: row.created_at,
      user: {
        id: row.user_id,
        display_name: row.user_display_name || 'Scruttin',
        avatar_url: row.user_avatar_url || '',
        country: row.user_country || 'Global',
      },
    }));

    const scruts = (scrutsRes.results || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      conversation_id: row.conversation_id || null,
      user_id: row.user_id,
      type: row.type || 'text',
      text: row.text,
      audio_url: row.audio_url,
      audio_duration: Number(row.audio_duration) || 0,
      position: row.position || null,
      resonate_count: Number(row.resonate_count) || 0,
      resonated_by_me: false,
      attachment_url: row.attachment_url,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        display_name: row.user_display_name || 'Anonymous',
        avatar_url: row.user_avatar_url || '',
        country: row.user_country || 'Global',
      },
    }));

    return jsonResponse({
      conversations,
      scruts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch stream from D1', details: msg }, { status: 500 });
  }
};
