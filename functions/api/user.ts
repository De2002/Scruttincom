import { Env, jsonResponse, corsResponse } from '../types';
import { requireFirebaseUser, authError } from '../lib/firebaseVerify';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  let authUser: { uid: string; email: string };
  try { authUser = await requireFirebaseUser(request, env); } catch (error) { return authError(error); }
  const url = new URL(request.url);
  const requestedId = url.searchParams.get('id');
  const id = requestedId || authUser.uid;
  if (requestedId && requestedId !== authUser.uid) return jsonResponse({ error: 'Forbidden' }, { status: 403 });

  if (!id) {
    return jsonResponse({ error: 'User ID missing' }, { status: 400 });
  }

  try {
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    if (!user) {
      return jsonResponse({ error: 'User not found' }, { status: 404 });
    }

    const [scrutCountRes, convCountRes, taggersCountRes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM scruts WHERE user_id = ?').bind(id).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').bind(id).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM user_tags WHERE tagged_user_id = ?').bind(id).first(),
    ]);

    const scruts_given = Number((scrutCountRes as Record<string, unknown>)?.count) || 0;
    const conversations_asked = Number((convCountRes as Record<string, unknown>)?.count) || 0;
    const taggers_count = Number((taggersCountRes as Record<string, unknown>)?.count) || 0;

    return jsonResponse({
      ...user,
      scruts_given,
      conversations_asked,
      taggers_count,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch user', details: msg }, { status: 500 });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const authUser = await requireFirebaseUser(request, env);
    const body = await request.json() as Record<string, unknown>;
    const id = authUser.uid;

    if (!id) {
      return jsonResponse({ error: 'User ID missing' }, { status: 400 });
    }

    const email = (body.email as string) || '';
    const displayName = (body.display_name as string) || 'User';
    const avatarUrl = (body.avatar_url as string) || '';
    const country = (body.country as string) || 'Global';
    const city = (body.city as string) || null;
    const bio = (body.bio as string) || null;
    const website = (body.website as string) || null;
    const twitter = (body.twitter as string) || null;
    const instagram = (body.instagram as string) || null;
    const tipLink = (body.tip_link as string) || null;
    const isAdmin = body.is_admin ? 1 : 0;
    const onboarded = body.onboarded ? 1 : 0;
    const dateOfBirth = (body.date_of_birth as string) || null;

    await env.DB.prepare(`
      INSERT INTO users (id, email, display_name, avatar_url, country, city, bio, website, twitter, instagram, tip_link, is_admin, onboarded, date_of_birth)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = coalesce(excluded.display_name, users.display_name),
        avatar_url = coalesce(excluded.avatar_url, users.avatar_url),
        country = coalesce(excluded.country, users.country),
        city = coalesce(excluded.city, users.city),
        bio = coalesce(excluded.bio, users.bio),
        website = coalesce(excluded.website, users.website),
        twitter = coalesce(excluded.twitter, users.twitter),
        instagram = coalesce(excluded.instagram, users.instagram),
        tip_link = coalesce(excluded.tip_link, users.tip_link),
        onboarded = coalesce(excluded.onboarded, users.onboarded),
        date_of_birth = coalesce(excluded.date_of_birth, users.date_of_birth)
    `).bind(
      id, email, displayName, avatarUrl, country, city, bio, website, twitter, instagram, tipLink, isAdmin, onboarded, dateOfBirth
    ).run();

    return jsonResponse({ success: true, id });
  } catch (err: unknown) {
    if (err instanceof Response) return authError(err);
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to save user', details: msg }, { status: 500 });
  }
};
