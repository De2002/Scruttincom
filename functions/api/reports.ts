import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as {
      scrut_id: string;
      reporter_id: string;
      reason: string;
    };

    if (!body.scrut_id || !body.reason) {
      return jsonResponse({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO reports (id, scrut_id, reporter_id, reason, reviewed, actioned, created_at)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `).bind(id, body.scrut_id, body.reporter_id || 'anonymous', body.reason.trim(), now).run();

    return jsonResponse({ success: true, id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to record report', details: msg }, { status: 500 });
  }
};
