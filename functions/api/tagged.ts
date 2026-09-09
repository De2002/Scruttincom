import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  const currentUserId = url.searchParams.get('current_user_id');

  try {
    if (action === 'feed') {
      const postsRes = await env.DB.prepare(`
        SELECT 
          p.id, p.user_id, p.text, p.image_url, p.gif_url, 
          p.sticker_json, p.poll_json, p.location_tag, p.mood_tag,
          p.likes_count, p.reposts_count, p.replies_count, p.created_at,
          u.display_name as user_display_name,
          u.avatar_url as user_avatar_url,
          u.country as user_country
        FROM tagged_posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `).all();

      const posts = (postsRes.results || []).map((row: Record<string, unknown>) => {
        let sticker = undefined;
        let poll = undefined;
        try {
          if (row.sticker_json) sticker = JSON.parse(row.sticker_json as string);
        } catch {
          // ignore invalid json
        }
        try {
          if (row.poll_json) poll = JSON.parse(row.poll_json as string);
        } catch {
          // ignore invalid json
        }

        return {
          id: row.id,
          user: {
            id: row.user_id,
            display_name: row.user_display_name || 'Anonymous',
            avatar_url: row.user_avatar_url || '',
            country: row.user_country || 'Global',
          },
          text: row.text,
          image_url: row.image_url || undefined,
          gif_url: row.gif_url || undefined,
          sticker,
          poll,
          location_tag: row.location_tag || undefined,
          mood_tag: row.mood_tag || undefined,
          like_count: Number(row.likes_count) || 0,
          retag_count: Number(row.reposts_count) || 0,
          reply_count: Number(row.replies_count) || 0,
          created_at: row.created_at,
        };
      });

      // Also get user's interactions if currentUserId is provided
      let userTags: string[] = [];
      let likedIds: string[] = [];
      let repostedIds: string[] = [];
      let bookmarkedIds: string[] = [];
      const pollVotes: Record<string, string> = {};
      let taggersCount = 0;

      if (currentUserId) {
        const [tagsRes, likesRes, repostsRes, bookmarksRes, votesRes, taggersRes] = await Promise.all([
          env.DB.prepare('SELECT tagged_user_id FROM user_tags WHERE tagger_id = ?').bind(currentUserId).all(),
          env.DB.prepare('SELECT post_id FROM tagged_likes WHERE user_id = ?').bind(currentUserId).all(),
          env.DB.prepare('SELECT post_id FROM tagged_reposts WHERE user_id = ?').bind(currentUserId).all(),
          env.DB.prepare('SELECT post_id FROM tagged_bookmarks WHERE user_id = ?').bind(currentUserId).all(),
          env.DB.prepare('SELECT post_id, option_id FROM tagged_poll_votes WHERE user_id = ?').bind(currentUserId).all(),
          env.DB.prepare('SELECT COUNT(*) as count FROM user_tags WHERE tagged_user_id = ?').bind(currentUserId).first(),
        ]);

        userTags = (tagsRes.results || []).map((r: Record<string, unknown>) => r.tagged_user_id as string);
        likedIds = (likesRes.results || []).map((r: Record<string, unknown>) => r.post_id as string);
        repostedIds = (repostsRes.results || []).map((r: Record<string, unknown>) => r.post_id as string);
        bookmarkedIds = (bookmarksRes.results || []).map((r: Record<string, unknown>) => r.post_id as string);
        (votesRes.results || []).forEach((r: Record<string, unknown>) => {
          pollVotes[r.post_id as string] = r.option_id as string;
        });
        taggersCount = Number((taggersRes as Record<string, unknown>)?.count) || 0;
      }

      return jsonResponse({
        posts,
        userTags,
        likedIds,
        repostedIds,
        bookmarkedIds,
        pollVotes,
        taggersCount,
      });
    }

    return jsonResponse({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to fetch tagged data', details: msg }, { status: 500 });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'Cloudflare D1 DB binding is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const type = body.type as string; // 'post' | 'reply' | 'tag' | 'like' | 'repost' | 'bookmark' | 'vote'

    if (type === 'post') {
      const postId = (body.id as string) || 'tag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userId = body.userId as string;
      const text = body.text as string;
      const imageUrl = (body.image_url as string) || null;
      const gifUrl = (body.gif_url as string) || null;
      const stickerJson = body.sticker ? JSON.stringify(body.sticker) : null;
      const pollJson = body.poll ? JSON.stringify(body.poll) : null;
      const locationTag = (body.location_tag as string) || null;
      const moodTag = (body.mood_tag as string) || null;
      const now = new Date().toISOString();

      if (!userId || !text) {
        return jsonResponse({ error: 'Missing userId or text' }, { status: 400 });
      }

      // Ensure user exists
      if (body.user) {
        const u = body.user as Record<string, unknown>;
        await env.DB.prepare(`
          INSERT OR IGNORE INTO users (id, display_name, avatar_url, country)
          VALUES (?, ?, ?, ?)
        `).bind(userId, u.display_name || 'User', u.avatar_url || '', u.country || 'Global').run();
      }

      await env.DB.prepare(`
        INSERT INTO tagged_posts (id, user_id, text, image_url, gif_url, sticker_json, poll_json, location_tag, mood_tag, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(postId, userId, text.trim(), imageUrl, gifUrl, stickerJson, pollJson, locationTag, moodTag, now).run();

      return jsonResponse({
        id: postId,
        user_id: userId,
        text: text.trim(),
        image_url: imageUrl || undefined,
        gif_url: gifUrl || undefined,
        sticker: body.sticker,
        poll: body.poll,
        location_tag: locationTag || undefined,
        mood_tag: moodTag || undefined,
        like_count: 0,
        retag_count: 0,
        reply_count: 0,
        created_at: now,
        user: body.user || { id: userId, display_name: 'User', avatar_url: '', country: 'Global' },
      }, { status: 201 });
    }

    if (type === 'tag') {
      const taggerId = body.taggerId as string;
      const taggedUserId = body.taggedUserId as string;
      if (!taggerId || !taggedUserId) {
        return jsonResponse({ error: 'Missing taggerId or taggedUserId' }, { status: 400 });
      }

      const existing = await env.DB.prepare(`
        SELECT id FROM user_tags WHERE tagger_id = ? AND tagged_user_id = ?
      `).bind(taggerId, taggedUserId).first();

      let tagged = false;
      if (existing) {
        await env.DB.prepare('DELETE FROM user_tags WHERE tagger_id = ? AND tagged_user_id = ?').bind(taggerId, taggedUserId).run();
        tagged = false;
      } else {
        const id = 'ut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare('INSERT INTO user_tags (id, tagger_id, tagged_user_id) VALUES (?, ?, ?)').bind(id, taggerId, taggedUserId).run();
        tagged = true;
      }

      return jsonResponse({ success: true, tagged, taggedUserId });
    }

    if (type === 'like') {
      const userId = body.userId as string;
      const postId = body.postId as string;
      const existing = await env.DB.prepare('SELECT id FROM tagged_likes WHERE user_id = ? AND post_id = ?').bind(userId, postId).first();

      let liked = false;
      if (existing) {
        await env.DB.prepare('DELETE FROM tagged_likes WHERE user_id = ? AND post_id = ?').bind(userId, postId).run();
        await env.DB.prepare('UPDATE tagged_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(postId).run();
        liked = false;
      } else {
        const id = 'tl_' + Date.now();
        await env.DB.prepare('INSERT INTO tagged_likes (id, user_id, post_id) VALUES (?, ?, ?)').bind(id, userId, postId).run();
        await env.DB.prepare('UPDATE tagged_posts SET likes_count = likes_count + 1 WHERE id = ?').bind(postId).run();
        liked = true;
      }
      return jsonResponse({ success: true, liked, postId });
    }

    if (type === 'repost') {
      const userId = body.userId as string;
      const postId = body.postId as string;
      const existing = await env.DB.prepare('SELECT id FROM tagged_reposts WHERE user_id = ? AND post_id = ?').bind(userId, postId).first();

      let reposted = false;
      if (existing) {
        await env.DB.prepare('DELETE FROM tagged_reposts WHERE user_id = ? AND post_id = ?').bind(userId, postId).run();
        await env.DB.prepare('UPDATE tagged_posts SET reposts_count = MAX(0, reposts_count - 1) WHERE id = ?').bind(postId).run();
        reposted = false;
      } else {
        const id = 'tr_' + Date.now();
        await env.DB.prepare('INSERT INTO tagged_reposts (id, user_id, post_id) VALUES (?, ?, ?)').bind(id, userId, postId).run();
        await env.DB.prepare('UPDATE tagged_posts SET reposts_count = reposts_count + 1 WHERE id = ?').bind(postId).run();
        reposted = true;
      }
      return jsonResponse({ success: true, reposted, postId });
    }

    if (type === 'bookmark') {
      const userId = body.userId as string;
      const postId = body.postId as string;
      const existing = await env.DB.prepare('SELECT id FROM tagged_bookmarks WHERE user_id = ? AND post_id = ?').bind(userId, postId).first();

      let bookmarked = false;
      if (existing) {
        await env.DB.prepare('DELETE FROM tagged_bookmarks WHERE user_id = ? AND post_id = ?').bind(userId, postId).run();
        bookmarked = false;
      } else {
        const id = 'tb_' + Date.now();
        await env.DB.prepare('INSERT INTO tagged_bookmarks (id, user_id, post_id) VALUES (?, ?, ?)').bind(id, userId, postId).run();
        bookmarked = true;
      }
      return jsonResponse({ success: true, bookmarked, postId });
    }

    if (type === 'vote') {
      const userId = body.userId as string;
      const postId = body.postId as string;
      const optionId = body.optionId as string;
      const id = 'pv_' + Date.now();
      await env.DB.prepare(`
        INSERT INTO tagged_poll_votes (id, user_id, post_id, option_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, post_id) DO UPDATE SET option_id = excluded.option_id
      `).bind(id, userId, postId, optionId).run();

      return jsonResponse({ success: true, optionId, postId });
    }

    if (type === 'reply') {
      const replyId = 'reply_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const postId = body.postId as string;
      const userId = body.userId as string;
      const text = body.text as string;
      const stickerJson = body.sticker ? JSON.stringify(body.sticker) : null;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO tagged_replies (id, post_id, user_id, text, sticker_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(replyId, postId, userId, text, stickerJson, now).run();

      await env.DB.prepare(`
        UPDATE tagged_posts SET replies_count = replies_count + 1 WHERE id = ?
      `).bind(postId).run();

      return jsonResponse({
        id: replyId,
        post_id: postId,
        user_id: userId,
        text,
        sticker: body.sticker,
        created_at: now,
      }, { status: 201 });
    }

    return jsonResponse({ error: 'Unknown request type' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to process tagged action', details: msg }, { status: 500 });
  }
};
