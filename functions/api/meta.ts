import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get('resource'); // 'topics' | 'music' | 'atmospheres' | 'typing_sounds' | 'ads'

  try {
    if (resource === 'topics') {
      const res = await env.DB.prepare('SELECT * FROM topics ORDER BY sort_order ASC').all();
      return jsonResponse(res.results);
    }

    if (resource === 'music') {
      const res = await env.DB.prepare('SELECT * FROM music_tracks WHERE is_active = 1 ORDER BY created_at DESC').all();
      return jsonResponse(res.results);
    }

    if (resource === 'atmospheres') {
      const res = await env.DB.prepare('SELECT * FROM atmosphere_clips WHERE is_active = 1 ORDER BY created_at DESC').all();
      return jsonResponse(res.results);
    }

    if (resource === 'typing_sounds') {
      const res = await env.DB.prepare('SELECT * FROM typing_sounds WHERE is_active = 1 ORDER BY is_default DESC, created_at DESC').all();
      return jsonResponse(res.results);
    }

    if (resource === 'ads') {
      const res = await env.DB.prepare('SELECT * FROM ad_campaigns WHERE status = "active"').all();
      return jsonResponse(res.results);
    }

    return jsonResponse({ error: 'Unknown resource type' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch meta resources', details: msg }, { status: 500 });
  }
};
