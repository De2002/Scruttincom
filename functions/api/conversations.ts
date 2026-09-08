import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');
  const userId = url.searchParams.get('user_id');

  try {
    if (id) {
      const row = await env.DB.prepare(`
        SELECT 
          c.id, c.user_id, c.type, c.body, c.topic, c.scrut_count, 
          c.country_count, c.circulation_score, c.is_platform, c.created_at,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url,
          u.country as user_country
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).bind(id).first();

      if (!row) {
        return jsonResponse({ error: 'Conversation not found' }, { status: 404 });
      }

      return jsonResponse({
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
      });
    }

    let query = `
      SELECT 
        c.id, c.user_id, c.type, c.body, c.topic, c.scrut_count, 
        c.country_count, c.circulation_score, c.is_platform, c.created_at,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar_url,
        u.country as user_country
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type) {
      conditions.push(`c.type = ?`);
      params.push(type);
    }
    if (userId) {
      conditions.push(`c.user_id = ?`);
      params.push(userId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY c.created_at DESC LIMIT 60`;

    const res = await env.DB.prepare(query).bind(...params).all();
    const conversations = (res.results || []).map((row: Record<string, unknown>) => ({
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

    return jsonResponse(conversations);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Query failed', details: msg }, { status: 500 });
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
      body: string;
      topic: string;
      type?: 'question' | 'statement' | 'open';
      isPlatform?: boolean;
    };

    if (!body.userId || !body.body) {
      return jsonResponse({ error: 'Missing required fields: userId, body' }, { status: 400 });
    }

    const convId = body.id || 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const type = body.type || 'question';
    const topic = body.topic || 'Life';
    const isPlatform = body.isPlatform ? 1 : 0;

    // Ensure user exists in users table
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

    await env.DB.prepare(`
      INSERT INTO conversations (id, user_id, type, body, topic, scrut_count, country_count, circulation_score, is_platform, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, 0, ?, ?)
    `).bind(convId, body.userId, type, body.body.trim(), topic, isPlatform, now).run();

    const created = {
      id: convId,
      user_id: body.userId,
      type,
      body: body.body.trim(),
      topic,
      scrut_count: 0,
      country_count: 1,
      circulation_score: 0,
      is_platform: Boolean(body.isPlatform),
      created_at: now,
      user: body.user || { id: body.userId, display_name: 'User', avatar_url: '', country: 'Global' },
    };

    return jsonResponse(created, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to create conversation', details: msg }, { status: 500 });
  }
};
