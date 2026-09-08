import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as {
      scrutId: string;
      userId: string;
      currentlyResonated: boolean;
    };

    if (!body.scrutId || !body.userId) {
      return jsonResponse({ error: 'Missing scrutId or userId' }, { status: 400 });
    }

    const resId = `${body.userId}_${body.scrutId}`;

    if (body.currentlyResonated) {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM resonates WHERE user_id = ? AND scrut_id = ?').bind(body.userId, body.scrutId),
        env.DB.prepare('UPDATE scruts SET resonate_count = MAX(0, resonate_count - 1) WHERE id = ?').bind(body.scrutId),
      ]);
      return jsonResponse({ resonated: false });
    } else {
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO resonates (id, user_id, scrut_id, created_at) VALUES (?, ?, ?, ?)').bind(resId, body.userId, body.scrutId, now),
        env.DB.prepare('UPDATE scruts SET resonate_count = resonate_count + 1 WHERE id = ?').bind(body.scrutId),
      ]);
      return jsonResponse({ resonated: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to toggle resonate in D1', details: msg }, { status: 500 });
  }
};
