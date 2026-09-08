import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return jsonResponse({ error: 'user_id parameter is required' }, { status: 400 });
  }

  try {
    const prefs = await env.DB.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(userId).first();
    return jsonResponse(prefs || null);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch preferences', details: msg }, { status: 500 });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = body.user_id as string;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const ambient = (body.ambient as string) || 'minimal';
    const reducedMotion = body.reduced_motion ? 1 : 0;
    const musicEnabled = body.music_enabled === false ? 0 : 1;
    const musicVolume = Number(body.music_volume) || 0.4;
    const voiceVolume = Number(body.voice_volume) || 1.0;
    const selectedTrackId = (body.selected_track_id as string) || null;
    const typingSound = (body.typing_sound as string) || null;
    const fontFamily = (body.font_family as string) || 'inter';
    const textSize = (body.text_size as string) || 'normal';
    const typingSpeed = (body.typing_speed as string) || 'normal';
    const personalBgUrl = (body.personal_bg_url as string) || null;
    const personalMusicUrl = (body.personal_music_url as string) || null;

    await env.DB.prepare(`
      INSERT INTO user_preferences (
        user_id, ambient, reduced_motion, music_enabled, music_volume, 
        voice_volume, selected_track_id, typing_sound, font_family, text_size, 
        typing_speed, personal_bg_url, personal_music_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        ambient = coalesce(excluded.ambient, user_preferences.ambient),
        reduced_motion = coalesce(excluded.reduced_motion, user_preferences.reduced_motion),
        music_enabled = coalesce(excluded.music_enabled, user_preferences.music_enabled),
        music_volume = coalesce(excluded.music_volume, user_preferences.music_volume),
        voice_volume = coalesce(excluded.voice_volume, user_preferences.voice_volume),
        selected_track_id = coalesce(excluded.selected_track_id, user_preferences.selected_track_id),
        typing_sound = coalesce(excluded.typing_sound, user_preferences.typing_sound),
        font_family = coalesce(excluded.font_family, user_preferences.font_family),
        text_size = coalesce(excluded.text_size, user_preferences.text_size),
        typing_speed = coalesce(excluded.typing_speed, user_preferences.typing_speed),
        personal_bg_url = coalesce(excluded.personal_bg_url, user_preferences.personal_bg_url),
        personal_music_url = coalesce(excluded.personal_music_url, user_preferences.personal_music_url),
        updated_at = excluded.updated_at
    `).bind(
      userId, ambient, reducedMotion, musicEnabled, musicVolume,
      voiceVolume, selectedTrackId, typingSound, fontFamily, textSize,
      typingSpeed, personalBgUrl, personalMusicUrl, now
    ).run();

    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to update preferences', details: msg }, { status: 500 });
  }
};
