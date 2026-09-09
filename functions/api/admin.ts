import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');

  try {
    if (resource === 'stats') {
      const [u, s, c, r] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM scruts').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM conversations').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM reports WHERE reviewed = 0').first<{ count: number }>(),
      ]);
      return jsonResponse({
        users: u?.count || 0,
        scruts: s?.count || 0,
        conversations: c?.count || 0,
        reports: r?.count || 0,
      });
    }

    if (resource === 'reports') {
      const res = await env.DB.prepare(`
        SELECT r.*, u.display_name as reporter_name, s.text as scrut_text, s.type as scrut_type
        FROM reports r
        LEFT JOIN users u ON r.reporter_id = u.id
        LEFT JOIN scruts s ON r.scrut_id = s.id
        ORDER BY r.created_at DESC
        LIMIT 100
      `).all();
      return jsonResponse(res.results.map((row: Record<string, unknown>) => ({
        id: row.id,
        scrut_id: row.scrut_id,
        reason: row.reason,
        reviewed: Boolean(row.reviewed),
        actioned: Boolean(row.actioned),
        created_at: row.created_at,
        reporter: { display_name: row.reporter_name || 'Anonymous' },
        scrut: { text: row.scrut_text, type: row.scrut_type || 'text' },
      })));
    }

    if (resource === 'users') {
      const res = await env.DB.prepare('SELECT id, display_name, email, country, is_admin FROM users ORDER BY created_at DESC LIMIT 200').all();
      return jsonResponse(res.results.map((u: Record<string, unknown>) => ({
        ...u,
        is_admin: Boolean(u.is_admin),
      })));
    }

    if (resource === 'campaigns') {
      const res = await env.DB.prepare('SELECT * FROM ad_campaigns ORDER BY created_at DESC').all();
      return jsonResponse(res.results);
    }

    return jsonResponse({ error: 'Unknown admin resource' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Admin fetch failed', details: msg }, { status: 500 });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;

    if (action === 'toggle_admin') {
      const { userId, isAdmin } = body;
      await env.DB.prepare('UPDATE users SET is_admin = ? WHERE id = ?').bind(isAdmin ? 1 : 0, userId).run();
      return jsonResponse({ success: true, userId, isAdmin });
    }

    if (action === 'action_report') {
      const { reportId, scrutId, hide } = body;
      if (hide && scrutId) {
        await env.DB.prepare('UPDATE scruts SET is_reported = 1 WHERE id = ?').bind(scrutId).run();
      }
      await env.DB.prepare('UPDATE reports SET reviewed = 1, actioned = ? WHERE id = ?').bind(hide ? 1 : 0, reportId).run();
      return jsonResponse({ success: true, reportId });
    }

    if (action === 'create_campaign') {
      const id = 'ad_' + Date.now();
      await env.DB.prepare(`
        INSERT INTO ad_campaigns (id, advertiser_name, advertiser_logo_url, format, status, headline, body, destination_url, target_topics, start_at, end_at, min_scruts_between_ads, created_at)
        VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.advertiser_name,
        body.advertiser_logo_url || null,
        body.format || 'sponsored_scrut',
        body.headline || null,
        body.body || null,
        body.destination_url || null,
        JSON.stringify(body.target_topics || []),
        body.start_at || null,
        body.end_at || null,
        Number(body.min_scruts_between_ads) || 5,
        new Date().toISOString()
      ).run();
      return jsonResponse({ success: true, id });
    }

    if (action === 'update_campaign_status') {
      await env.DB.prepare('UPDATE ad_campaigns SET status = ? WHERE id = ?').bind(body.status, body.id).run();
      return jsonResponse({ success: true, id: body.id });
    }

    if (action === 'create_topic') {
      const id = 'top_' + Date.now();
      await env.DB.prepare('INSERT INTO topics (id, label, color, sort_order) VALUES (?, ?, ?, ?)').bind(id, body.label, body.color || 'text-violet-400', body.sort_order || 99).run();
      return jsonResponse({ success: true, id });
    }

    if (action === 'delete_topic') {
      await env.DB.prepare('DELETE FROM topics WHERE id = ?').bind(body.id).run();
      return jsonResponse({ success: true, id: body.id });
    }

    if (action === 'create_music') {
      const id = 'mus_' + Date.now();
      await env.DB.prepare('INSERT INTO music_tracks (id, title, artist, url, is_active) VALUES (?, ?, ?, ?, 1)').bind(id, body.title, body.artist || null, body.url).run();
      return jsonResponse({ success: true, id });
    }

    if (action === 'delete_music') {
      await env.DB.prepare('UPDATE music_tracks SET is_active = 0 WHERE id = ?').bind(body.id).run();
      return jsonResponse({ success: true, id: body.id });
    }

    if (action === 'create_atmosphere') {
      const id = 'atm_' + Date.now();
      await env.DB.prepare('INSERT INTO atmosphere_clips (id, label, emoji, video_url, overlay_color, overlay_opacity, accent_color, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)')
        .bind(id, body.label, body.emoji || '🎬', body.video_url, body.overlay_color || '10, 10, 20', body.overlay_opacity || 0.65, body.accent_color || '#ffffff').run();
      return jsonResponse({ success: true, id });
    }

    if (action === 'delete_atmosphere') {
      await env.DB.prepare('UPDATE atmosphere_clips SET is_active = 0 WHERE id = ?').bind(body.id).run();
      return jsonResponse({ success: true, id: body.id });
    }

    if (action === 'create_typing_sound') {
      const id = 'ts_' + Date.now();
      await env.DB.prepare('INSERT INTO typing_sounds (id, title, url, is_default, is_active) VALUES (?, ?, ?, ?, 1)').bind(id, body.title, body.url, body.is_default ? 1 : 0).run();
      return jsonResponse({ success: true, id });
    }

    if (action === 'delete_typing_sound') {
      await env.DB.prepare('UPDATE typing_sounds SET is_active = 0 WHERE id = ?').bind(body.id).run();
      return jsonResponse({ success: true, id: body.id });
    }

    return jsonResponse({ error: 'Unknown admin action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Admin action failed', details: msg }, { status: 500 });
  }
};
