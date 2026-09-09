import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

let db: DatabaseSync | null = null;

export function getD1Database(): DatabaseSync {
  if (db) return db;

  // Use a local sqlite file in .data or memory
  const dataDir = path.resolve(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'scruttin-d1.sqlite');
  db = new DatabaseSync(dbPath);

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Read schema.sql
  const schemaPath = path.resolve(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Seed default data if empty
  seedD1Database(db);

  return db;
}

function seedD1Database(database: DatabaseSync) {
  try {
    const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0 || userCount.count <= 1) {
      // Seed initial users
      const insertUser = database.prepare(`
        INSERT OR IGNORE INTO users (id, email, display_name, avatar_url, country, city, bio, is_admin, onboarded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      const sampleUsers = [
        ['u1', 'amina@scruttin.com', 'Amina Kalu', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face', 'Nigeria', 'Lagos', 'Writer, observer of small things.', 0],
        ['u2', 'daniel@scruttin.com', 'Daniel Rocha', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face', 'Brazil', 'São Paulo', 'Product designer.', 0],
        ['u3', 'sarah@scruttin.com', 'Sarah Mitchell', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', 'UK', 'Manchester', 'Teacher. Asking questions for a living.', 0],
        ['u4', 'joel@scruttin.com', 'Joel Tetteh', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', 'Ghana', 'Accra', 'Musician and sound engineer.', 0],
        ['u5', 'yuki@scruttin.com', 'Yuki Hayashi', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face', 'Japan', 'Tokyo', 'Researcher studying digital spaces.', 0],
      ];

      for (const u of sampleUsers) {
        insertUser.run(...u);
      }

      // Seed initial conversations (Questions and Statements)
      const insertConv = database.prepare(`
        INSERT OR IGNORE INTO conversations (id, user_id, type, body, topic, scrut_count, country_count, circulation_score, is_platform)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertConv.run('c1', 'u5', 'question', "What's something you stopped caring about as you got older?", 'Life', 2847, 41, 0.92, 1);
      insertConv.run('c2', 'u3', 'statement', 'Social media has made friendships shallower.', 'Society', 1420, 28, 0.78, 0);
      insertConv.run('c3', 'u4', 'question', 'What was the exact moment you realized you were on your own?', 'Life', 3890, 52, 0.95, 1);
      insertConv.run('c4', 'u2', 'statement', 'True ambition is quiet.', 'Work', 890, 19, 0.65, 0);
      insertConv.run('c5', 'u1', 'question', 'What is one piece of advice you got that you actively ignored?', 'Relationships', 1120, 23, 0.71, 0);

      // Seed initial scruts (voice and text)
      const insertScrut = database.prepare(`
        INSERT OR IGNORE INTO scruts (id, user_id, conversation_id, type, text, audio_url, audio_duration, position, resonate_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertScrut.run('s1', 'u1', 'c1', 'text', 'People’s opinions of how quickly I should be hitting milestones. Life has its own clock.', null, 0, null, 142);
      insertScrut.run('s2', 'u2', 'c1', 'voice', 'Approval from people whose lives I would never want to live.', 'https://cdn.freesound.org/previews/381/381382_7037-lq.mp3', 14, null, 289);
      insertScrut.run('s3', 'u3', 'c2', 'text', 'Disagree. It exposed which friendships were based on geography rather than mutual care.', null, 0, 'disagree', 88);
      insertScrut.run('s4', 'u4', 'c2', 'voice_text', 'Agree. We mistake viewing someone’s highlights for being in their life.', 'https://cdn.freesound.org/previews/560/560446_11861866-lq.mp3', 18, 'agree', 215);

      // Seed initial tagged posts
      const insertTagPost = database.prepare(`
        INSERT OR IGNORE INTO tagged_posts (id, user_id, text, location_tag, mood_tag, likes_count, reposts_count, replies_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertTagPost.run('tag_1', 'u5', 'Quiet rainy morning in Shibuya. Coffee, headphones, and zero notifications until noon.', 'Tokyo, Japan', 'Focused', 28, 5, 3);
      insertTagPost.run('tag_2', 'u1', 'Finished the second draft today. It finally sounds like me.', 'Lagos, Nigeria', 'Relieved', 42, 9, 7);
      insertTagPost.run('tag_3', 'u4', 'Studio session went until 4 AM. Caught a melody that won’t leave my head.', 'Accra, Ghana', 'Inspired', 35, 12, 4);

      // Seed initial user tags
      const insertTag = database.prepare('INSERT OR IGNORE INTO user_tags (id, tagger_id, tagged_user_id) VALUES (?, ?, ?)');
      insertTag.run('ut1', 'platform_admin', 'u1');
      insertTag.run('ut2', 'platform_admin', 'u2');
      insertTag.run('ut3', 'platform_admin', 'u4');
      insertTag.run('ut4', 'platform_admin', 'u5');
    }
  } catch (err) {
    console.warn('[D1 Seed Error]:', err);
  }
}

/** Helper to parse JSON body from incoming HTTP request */
async function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

/** Handle `/api/*` requests in Vite dev mode */
export async function handleD1ApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlString = req.url || '';
  if (!urlString.startsWith('/api')) {
    return false;
  }

  const database = getD1Database();
  const parsedUrl = new URL(urlString, 'http://localhost:3000');
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || 'GET';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  try {
    // 1. GET /api/stream
    if (pathname === '/api/stream' && method === 'GET') {
      const convRows = database.prepare(`
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
      `).all() as Record<string, unknown>[];

      const scrutRows = database.prepare(`
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
      `).all() as Record<string, unknown>[];

      const conversations = convRows.map((row) => ({
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

      const scruts = scrutRows.map((row) => ({
        id: row.id,
        conversation_id: row.conversation_id || null,
        user_id: row.user_id,
        type: row.type,
        text: row.text,
        audio_url: row.audio_url,
        audio_duration: row.audio_duration,
        position: row.position || null,
        resonate_count: Number(row.resonate_count) || 0,
        attachment_url: row.attachment_url,
        created_at: row.created_at,
        user: {
          id: row.user_id,
          display_name: row.user_display_name || 'Anonymous',
          avatar_url: row.user_avatar_url || '',
          country: row.user_country || 'Global',
        },
      }));

      res.end(JSON.stringify({ conversations, scruts }));
      return true;
    }

    // 2. /api/conversations
    if (pathname === '/api/conversations') {
      if (method === 'GET') {
        const id = parsedUrl.searchParams.get('id');
        const type = parsedUrl.searchParams.get('type');
        const userId = parsedUrl.searchParams.get('user_id');

        if (id) {
          const row = database.prepare(`
            SELECT 
              c.id, c.user_id, c.type, c.body, c.topic, c.scrut_count, 
              c.country_count, c.circulation_score, c.is_platform, c.created_at,
              u.display_name as user_display_name,
              u.avatar_url as user_avatar_url,
              u.country as user_country
            FROM conversations c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
          `).get(id) as Record<string, unknown> | undefined;

          if (!row) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Conversation not found' }));
            return true;
          }

          res.end(JSON.stringify({
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
          return true;
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
          conditions.push('c.type = ?');
          params.push(type);
        }
        if (userId) {
          conditions.push('c.user_id = ?');
          params.push(userId);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY c.created_at DESC LIMIT 100';

        const rows = database.prepare(query).all(...params) as Record<string, unknown>[];
        const list = rows.map((row) => ({
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

        res.end(JSON.stringify(list));
        return true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const convId = (body.id as string) || 'conv_' + Date.now();
        const userId = (body.userId as string) || 'anon';
        const type = (body.type as string) || 'question';
        const topic = (body.topic as string) || 'Life';
        const convBody = (body.body as string) || '';
        const isPlatform = body.isPlatform ? 1 : 0;
        const now = new Date().toISOString();

        if (body.user) {
          const u = body.user as Record<string, unknown>;
          database.prepare(`
            INSERT OR IGNORE INTO users (id, display_name, avatar_url, country)
            VALUES (?, ?, ?, ?)
          `).run(userId, (u.display_name as string) || 'User', (u.avatar_url as string) || '', (u.country as string) || 'Global');
        }

        database.prepare(`
          INSERT INTO conversations (id, user_id, type, body, topic, scrut_count, country_count, circulation_score, is_platform, created_at)
          VALUES (?, ?, ?, ?, ?, 0, 1, 0, ?, ?)
        `).run(convId, userId, type, convBody.trim(), topic, isPlatform, now);

        res.statusCode = 201;
        res.end(JSON.stringify({
          id: convId,
          user_id: userId,
          type,
          body: convBody.trim(),
          topic,
          scrut_count: 0,
          country_count: 1,
          circulation_score: 0,
          is_platform: Boolean(body.isPlatform),
          created_at: now,
          user: body.user || { id: userId, display_name: 'User', avatar_url: '', country: 'Global' },
        }));
        return true;
      }
    }

    // 3. /api/scruts
    if (pathname === '/api/scruts') {
      if (method === 'GET') {
        const conversationId = parsedUrl.searchParams.get('conversation_id');
        const isOpen = parsedUrl.searchParams.get('open') === 'true';
        const userId = parsedUrl.searchParams.get('user_id');
        const currentUserId = parsedUrl.searchParams.get('current_user_id');

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
          conditions.push('s.conversation_id = ?');
          params.push(conversationId);
        } else if (isOpen) {
          conditions.push("(s.conversation_id IS NULL OR s.conversation_id = '')");
        }

        if (userId) {
          conditions.push('s.user_id = ?');
          params.push(userId);
        }

        if (conditions.length > 0) {
          query += ' AND ' + conditions.join(' AND ');
        }
        query += ` ORDER BY s.created_at ${isOpen || userId ? 'DESC' : 'ASC'} LIMIT 100`;

        const rows = database.prepare(query).all(...params) as Record<string, unknown>[];

        const resonatedSet = new Set<string>();
        if (currentUserId && rows.length > 0) {
          try {
            const userRes = database.prepare('SELECT scrut_id FROM resonates WHERE user_id = ?').all(currentUserId) as Record<string, unknown>[];
            userRes.forEach((r) => resonatedSet.add(r.scrut_id as string));
          } catch {
            // ignore resonance lookup error
          }
        }

        const scruts = rows.map((r) => ({
          id: r.id,
          conversation_id: r.conversation_id || null,
          user_id: r.user_id,
          type: r.type,
          text: r.text,
          audio_url: r.audio_url,
          audio_duration: r.audio_duration,
          position: r.position || null,
          resonate_count: Number(r.resonate_count) || 0,
          resonated_by_me: resonatedSet.has(r.id as string),
          attachment_url: r.attachment_url,
          created_at: r.created_at,
          user: {
            id: r.user_id,
            display_name: r.user_display_name || 'Anonymous',
            avatar_url: r.user_avatar_url || '',
            country: r.user_country || 'Global',
          },
        }));

        res.end(JSON.stringify(scruts));
        return true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const scrutId = (body.id as string) || 'scrut_' + Date.now();
        const userId = (body.userId as string) || 'anon';
        const convId = (body.conversationId as string) || null;
        const type = (body.type as string) || 'text';
        const text = (body.text as string) || null;
        const audioUrl = (body.audioUrl as string) || null;
        const audioDuration = Number(body.audioDuration) || 0;
        const position = (body.position as string) || null;
        const attachmentUrl = (body.attachmentUrl as string) || null;
        const now = new Date().toISOString();

        if (body.user) {
          const u = body.user as Record<string, unknown>;
          database.prepare(`
            INSERT OR IGNORE INTO users (id, display_name, avatar_url, country)
            VALUES (?, ?, ?, ?)
          `).run(userId, (u.display_name as string) || 'User', (u.avatar_url as string) || '', (u.country as string) || 'Global');
        }

        database.prepare(`
          INSERT INTO scruts (id, user_id, conversation_id, type, text, audio_url, audio_duration, position, resonate_count, attachment_url, is_reported, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)
        `).run(scrutId, userId, convId, type, text, audioUrl, audioDuration, position, attachmentUrl, now);

        if (convId) {
          database.prepare('UPDATE conversations SET scrut_count = scrut_count + 1 WHERE id = ?').run(convId);
        }

        res.statusCode = 201;
        res.end(JSON.stringify({
          id: scrutId,
          conversation_id: convId,
          user_id: userId,
          type,
          text,
          audio_url: audioUrl,
          audio_duration: audioDuration,
          position,
          resonate_count: 0,
          resonated_by_me: false,
          attachment_url: attachmentUrl,
          created_at: now,
          user: body.user || { id: userId, display_name: 'User', avatar_url: '', country: 'Global' },
        }));
        return true;
      }
    }

    // 4. /api/resonates
    if (pathname === '/api/resonates' && method === 'POST') {
      const body = await parseBody(req);
      const scrutId = body.scrutId as string;
      const userId = body.userId as string;

      const existing = database.prepare('SELECT id FROM resonates WHERE user_id = ? AND scrut_id = ?').get(userId, scrutId);
      let resonated = false;

      if (existing) {
        database.prepare('DELETE FROM resonates WHERE user_id = ? AND scrut_id = ?').run(userId, scrutId);
        database.prepare('UPDATE scruts SET resonate_count = MAX(0, resonate_count - 1) WHERE id = ?').run(scrutId);
        resonated = false;
      } else {
        const id = 'res_' + Date.now();
        database.prepare('INSERT INTO resonates (id, user_id, scrut_id) VALUES (?, ?, ?)').run(id, userId, scrutId);
        database.prepare('UPDATE scruts SET resonate_count = resonate_count + 1 WHERE id = ?').run(scrutId);
        resonated = true;
      }

      res.end(JSON.stringify({ success: true, resonated, scrutId }));
      return true;
    }

    // 5. /api/user
    if (pathname === '/api/user') {
      if (method === 'GET') {
        const id = parsedUrl.searchParams.get('id');
        if (!id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing id' }));
          return true;
        }

        const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
        if (!user) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'User not found' }));
          return true;
        }

        const scrutCountRes = database.prepare('SELECT COUNT(*) as count FROM scruts WHERE user_id = ?').get(id) as { count: number };
        const convCountRes = database.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(id) as { count: number };
        const taggersCountRes = database.prepare('SELECT COUNT(*) as count FROM user_tags WHERE tagged_user_id = ?').get(id) as { count: number };

        res.end(JSON.stringify({
          ...user,
          scruts_given: scrutCountRes?.count || 0,
          conversations_asked: convCountCount(convCountRes),
          taggers_count: taggersCountRes?.count || 0,
        }));
        return true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const id = body.id as string;
        if (!id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing id' }));
          return true;
        }

        database.prepare(`
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
        `).run(
          id,
          (body.email as string) || '',
          (body.display_name as string) || 'User',
          (body.avatar_url as string) || '',
          (body.country as string) || 'Global',
          (body.city as string) || null,
          (body.bio as string) || null,
          (body.website as string) || null,
          (body.twitter as string) || null,
          (body.instagram as string) || null,
          (body.tip_link as string) || null,
          body.is_admin ? 1 : 0,
          body.onboarded ? 1 : 0,
          (body.date_of_birth as string) || null
        );

        res.end(JSON.stringify({ success: true, id }));
        return true;
      }
    }

    // 6. /api/preferences
    if (pathname === '/api/preferences') {
      if (method === 'GET') {
        const userId = parsedUrl.searchParams.get('user_id');
        if (!userId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing user_id' }));
          return true;
        }

        const row = database.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
        res.end(JSON.stringify(row || null));
        return true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const userId = body.user_id as string;
        if (!userId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing user_id' }));
          return true;
        }

        database.prepare(`
          INSERT INTO user_preferences (
            user_id, ambient, reduced_motion, music_enabled, music_volume, 
            voice_volume, selected_track_id, typing_sound, font_family, text_size, 
            typing_speed, personal_bg_url, personal_music_url, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
            updated_at = datetime('now')
        `).run(
          userId,
          (body.ambient as string) || 'minimal',
          body.reduced_motion ? 1 : 0,
          body.music_enabled === false ? 0 : 1,
          Number(body.music_volume) || 0.4,
          Number(body.voice_volume) || 1.0,
          (body.selected_track_id as string) || null,
          (body.typing_sound as string) || null,
          (body.font_family as string) || 'inter',
          (body.text_size as string) || 'normal',
          (body.typing_speed as string) || 'normal',
          (body.personal_bg_url as string) || null,
          (body.personal_music_url as string) || null
        );

        res.end(JSON.stringify({ success: true, userId }));
        return true;
      }
    }

    // 7. /api/tagged
    if (pathname === '/api/tagged') {
      if (method === 'GET') {
        const currentUserId = parsedUrl.searchParams.get('current_user_id');

        const postRows = database.prepare(`
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
        `).all() as Record<string, unknown>[];

        const posts = postRows.map((row) => {
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

        let userTags: string[] = [];
        let likedIds: string[] = [];
        let repostedIds: string[] = [];
        let bookmarkedIds: string[] = [];
        const pollVotes: Record<string, string> = {};
        let taggersCount = 0;

        if (currentUserId) {
          const tagsRows = database.prepare('SELECT tagged_user_id FROM user_tags WHERE tagger_id = ?').all(currentUserId) as Record<string, unknown>[];
          const likesRows = database.prepare('SELECT post_id FROM tagged_likes WHERE user_id = ?').all(currentUserId) as Record<string, unknown>[];
          const repostsRows = database.prepare('SELECT post_id FROM tagged_reposts WHERE user_id = ?').all(currentUserId) as Record<string, unknown>[];
          const bookmarksRows = database.prepare('SELECT post_id FROM tagged_bookmarks WHERE user_id = ?').all(currentUserId) as Record<string, unknown>[];
          const votesRows = database.prepare('SELECT post_id, option_id FROM tagged_poll_votes WHERE user_id = ?').all(currentUserId) as Record<string, unknown>[];
          const taggersRes = database.prepare('SELECT COUNT(*) as count FROM user_tags WHERE tagged_user_id = ?').get(currentUserId) as { count: number };

          userTags = tagsRows.map((r) => r.tagged_user_id as string);
          likedIds = likesRows.map((r) => r.post_id as string);
          repostedIds = repostsRows.map((r) => r.post_id as string);
          bookmarkedIds = bookmarksRows.map((r) => r.post_id as string);
          votesRows.forEach((r) => {
            pollVotes[r.post_id as string] = r.option_id as string;
          });
          taggersCount = taggersRes?.count || 0;
        }

        res.end(JSON.stringify({
          posts,
          userTags,
          likedIds,
          repostedIds,
          bookmarkedIds,
          pollVotes,
          taggersCount,
        }));
        return true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const actionType = body.type as string;

        if (actionType === 'post') {
          const postId = (body.id as string) || 'tag_' + Date.now();
          const userId = body.userId as string;
          const text = body.text as string;
          const imageUrl = (body.image_url as string) || null;
          const gifUrl = (body.gif_url as string) || null;
          const stickerJson = body.sticker ? JSON.stringify(body.sticker) : null;
          const pollJson = body.poll ? JSON.stringify(body.poll) : null;
          const locationTag = (body.location_tag as string) || null;
          const moodTag = (body.mood_tag as string) || null;
          const now = new Date().toISOString();

          if (body.user) {
            const u = body.user as Record<string, unknown>;
            database.prepare(`
              INSERT OR IGNORE INTO users (id, display_name, avatar_url, country)
              VALUES (?, ?, ?, ?)
            `).run(userId, (u.display_name as string) || 'User', (u.avatar_url as string) || '', (u.country as string) || 'Global');
          }

          database.prepare(`
            INSERT INTO tagged_posts (id, user_id, text, image_url, gif_url, sticker_json, poll_json, location_tag, mood_tag, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(postId, userId, text.trim(), imageUrl, gifUrl, stickerJson, pollJson, locationTag, moodTag, now);

          res.statusCode = 201;
          res.end(JSON.stringify({
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
          }));
          return true;
        }

        if (actionType === 'tag') {
          const taggerId = body.taggerId as string;
          const taggedUserId = body.taggedUserId as string;

          const existing = database.prepare('SELECT id FROM user_tags WHERE tagger_id = ? AND tagged_user_id = ?').get(taggerId, taggedUserId);
          let tagged = false;

          if (existing) {
            database.prepare('DELETE FROM user_tags WHERE tagger_id = ? AND tagged_user_id = ?').run(taggerId, taggedUserId);
            tagged = false;
          } else {
            const id = 'ut_' + Date.now();
            database.prepare('INSERT INTO user_tags (id, tagger_id, tagged_user_id) VALUES (?, ?, ?)').run(id, taggerId, taggedUserId);
            tagged = true;
          }

          res.end(JSON.stringify({ success: true, tagged, taggedUserId }));
          return true;
        }

        if (actionType === 'like') {
          const userId = body.userId as string;
          const postId = body.postId as string;
          const existing = database.prepare('SELECT id FROM tagged_likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
          let liked = false;

          if (existing) {
            database.prepare('DELETE FROM tagged_likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
            database.prepare('UPDATE tagged_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
            liked = false;
          } else {
            database.prepare('INSERT INTO tagged_likes (id, user_id, post_id) VALUES (?, ?, ?)').run('tl_' + Date.now(), userId, postId);
            database.prepare('UPDATE tagged_posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
            liked = true;
          }
          res.end(JSON.stringify({ success: true, liked, postId }));
          return true;
        }

        if (actionType === 'repost') {
          const userId = body.userId as string;
          const postId = body.postId as string;
          const existing = database.prepare('SELECT id FROM tagged_reposts WHERE user_id = ? AND post_id = ?').get(userId, postId);
          let reposted = false;

          if (existing) {
            database.prepare('DELETE FROM tagged_reposts WHERE user_id = ? AND post_id = ?').run(userId, postId);
            database.prepare('UPDATE tagged_posts SET reposts_count = MAX(0, reposts_count - 1) WHERE id = ?').run(postId);
            reposted = false;
          } else {
            database.prepare('INSERT INTO tagged_reposts (id, user_id, post_id) VALUES (?, ?, ?)').run('tr_' + Date.now(), userId, postId);
            database.prepare('UPDATE tagged_posts SET reposts_count = reposts_count + 1 WHERE id = ?').run(postId);
            reposted = true;
          }
          res.end(JSON.stringify({ success: true, reposted, postId }));
          return true;
        }

        if (actionType === 'bookmark') {
          const userId = body.userId as string;
          const postId = body.postId as string;
          const existing = database.prepare('SELECT id FROM tagged_bookmarks WHERE user_id = ? AND post_id = ?').get(userId, postId);
          let bookmarked = false;

          if (existing) {
            database.prepare('DELETE FROM tagged_bookmarks WHERE user_id = ? AND post_id = ?').run(userId, postId);
            bookmarked = false;
          } else {
            database.prepare('INSERT INTO tagged_bookmarks (id, user_id, post_id) VALUES (?, ?, ?)').run('tb_' + Date.now(), userId, postId);
            bookmarked = true;
          }
          res.end(JSON.stringify({ success: true, bookmarked, postId }));
          return true;
        }

        if (actionType === 'vote') {
          const userId = body.userId as string;
          const postId = body.postId as string;
          const optionId = body.optionId as string;
          database.prepare(`
            INSERT INTO tagged_poll_votes (id, user_id, post_id, option_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, post_id) DO UPDATE SET option_id = excluded.option_id
          `).run('pv_' + Date.now(), userId, postId, optionId);

          res.end(JSON.stringify({ success: true, optionId, postId }));
          return true;
        }
      }
    }

    // 8. /api/meta
    if (pathname === '/api/meta') {
      const resource = parsedUrl.searchParams.get('resource');
      if (resource === 'topics') {
        const rows = database.prepare('SELECT * FROM topics ORDER BY sort_order ASC').all();
        res.end(JSON.stringify(rows));
        return true;
      }
      if (resource === 'music') {
        const rows = database.prepare('SELECT * FROM music_tracks WHERE is_active = 1 ORDER BY created_at DESC').all();
        res.end(JSON.stringify(rows));
        return true;
      }
      if (resource === 'atmospheres') {
        const rows = database.prepare('SELECT * FROM atmosphere_clips WHERE is_active = 1 ORDER BY created_at DESC').all();
        res.end(JSON.stringify(rows));
        return true;
      }
      if (resource === 'typing_sounds') {
        const rows = database.prepare('SELECT * FROM typing_sounds WHERE is_active = 1 ORDER BY is_default DESC, created_at DESC').all();
        res.end(JSON.stringify(rows));
        return true;
      }
      if (resource === 'ads') {
        const rows = database.prepare('SELECT * FROM ad_campaigns WHERE status = "active"').all();
        res.end(JSON.stringify(rows));
        return true;
      }
    }

    // 9. /api/reports
    if (pathname === '/api/reports' && method === 'POST') {
      const body = await parseBody(req);
      const id = 'rep_' + Date.now();
      database.prepare(`
        INSERT INTO reports (id, scrut_id, reporter_id, reason)
        VALUES (?, ?, ?, ?)
      `).run(id, (body.scrut_id as string) || '', (body.reporter_id as string) || '', (body.reason as string) || '');
      res.end(JSON.stringify({ success: true, id }));
      return true;
    }

    // 10. /api/admin
    if (pathname === '/api/admin') {
      if (method === 'GET') {
        const resource = parsedUrl.searchParams.get('resource');

        if (resource === 'stats') {
          const u = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
          const s = database.prepare('SELECT COUNT(*) as count FROM scruts').get() as { count: number };
          const c = database.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number };
          const r = database.prepare('SELECT COUNT(*) as count FROM reports WHERE reviewed = 0').get() as { count: number };

          res.end(JSON.stringify({
            users: u?.count || 0,
            scruts: s?.count || 0,
            conversations: c?.count || 0,
            reports: r?.count || 0,
          }));
          return true;
        }

        if (resource === 'reports') {
          const rows = database.prepare(`
            SELECT r.*, u.display_name as reporter_name, s.text as scrut_text, s.type as scrut_type
            FROM reports r
            LEFT JOIN users u ON r.reporter_id = u.id
            LEFT JOIN scruts s ON r.scrut_id = s.id
            ORDER BY r.created_at DESC
            LIMIT 100
          `).all() as Record<string, unknown>[];

          const mapped = rows.map((row) => ({
            id: row.id as string,
            scrut_id: (row.scrut_id as string) || undefined,
            reason: (row.reason as string) || '',
            reviewed: Boolean(row.reviewed),
            actioned: Boolean(row.actioned),
            created_at: (row.created_at as string) || '',
            reporter: { display_name: (row.reporter_name as string) || 'Anonymous' },
            scrut: { text: (row.scrut_text as string) || null, type: (row.scrut_type as string) || 'text' },
          }));

          res.end(JSON.stringify(mapped));
          return true;
        }

        if (resource === 'users') {
          const rows = database.prepare('SELECT id, display_name, email, country, is_admin FROM users ORDER BY created_at DESC LIMIT 200').all() as Record<string, unknown>[];
          res.end(JSON.stringify(rows.map((u) => ({ ...u, is_admin: Boolean(u.is_admin) }))));
          return true;
        }

        if (resource === 'campaigns') {
          const rows = database.prepare('SELECT * FROM ad_campaigns ORDER BY created_at DESC').all();
          res.end(JSON.stringify(rows));
          return true;
        }
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const action = body.action as string;

        if (action === 'toggle_admin') {
          database.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(body.isAdmin ? 1 : 0, body.userId);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'action_report') {
          if (body.hide && body.scrutId) {
            database.prepare('UPDATE scruts SET is_reported = 1 WHERE id = ?').run(body.scrutId);
          }
          database.prepare('UPDATE reports SET reviewed = 1, actioned = ? WHERE id = ?').run(body.hide ? 1 : 0, body.reportId);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'create_campaign') {
          const id = 'ad_' + Date.now();
          database.prepare(`
            INSERT INTO ad_campaigns (id, advertiser_name, advertiser_logo_url, format, status, headline, body, destination_url, target_topics, start_at, end_at, min_scruts_between_ads, created_at)
            VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
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
            Number(body.min_scruts_between_ads) || 5
          );
          res.end(JSON.stringify({ success: true, id }));
          return true;
        }

        if (action === 'update_campaign_status') {
          database.prepare('UPDATE ad_campaigns SET status = ? WHERE id = ?').run(body.status, body.id);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'create_topic') {
          const id = 'top_' + Date.now();
          database.prepare('INSERT INTO topics (id, label, color, sort_order) VALUES (?, ?, ?, ?)').run(id, body.label, body.color || 'text-violet-400', body.sort_order || 99);
          res.end(JSON.stringify({ success: true, id }));
          return true;
        }

        if (action === 'delete_topic') {
          database.prepare('DELETE FROM topics WHERE id = ?').run(body.id);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'create_music') {
          const id = 'mus_' + Date.now();
          database.prepare('INSERT INTO music_tracks (id, title, artist, url, is_active) VALUES (?, ?, ?, ?, 1)').run(id, body.title, body.artist || null, body.url);
          res.end(JSON.stringify({ success: true, id }));
          return true;
        }

        if (action === 'delete_music') {
          database.prepare('UPDATE music_tracks SET is_active = 0 WHERE id = ?').run(body.id);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'create_atmosphere') {
          const id = 'atm_' + Date.now();
          database.prepare('INSERT INTO atmosphere_clips (id, label, emoji, video_url, overlay_color, overlay_opacity, accent_color, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)')
            .run(id, body.label, body.emoji || '🎬', body.video_url, body.overlay_color || '10, 10, 20', body.overlay_opacity || 0.65, body.accent_color || '#ffffff');
          res.end(JSON.stringify({ success: true, id }));
          return true;
        }

        if (action === 'delete_atmosphere') {
          database.prepare('UPDATE atmosphere_clips SET is_active = 0 WHERE id = ?').run(body.id);
          res.end(JSON.stringify({ success: true }));
          return true;
        }

        if (action === 'create_typing_sound') {
          const id = 'ts_' + Date.now();
          database.prepare('INSERT INTO typing_sounds (id, title, url, is_default, is_active) VALUES (?, ?, ?, ?, 1)').run(id, body.title, body.url, body.is_default ? 1 : 0);
          res.end(JSON.stringify({ success: true, id }));
          return true;
        }

        if (action === 'delete_typing_sound') {
          database.prepare('UPDATE typing_sounds SET is_active = 0 WHERE id = ?').run(body.id);
          res.end(JSON.stringify({ success: true }));
          return true;
        }
      }
    }

    // Default 404 for unknown api
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal D1 Server Error', details: msg }));
    return true;
  }
}

function convCountCount(row?: { count: number }): number {
  return row?.count || 0;
}
