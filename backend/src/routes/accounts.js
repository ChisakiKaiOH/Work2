import { Router } from 'express';
import { db } from '../db.js';
import { PLATFORMS, isPlatformLive, fetchMetrics, fetchRecentPosts } from '../adapters/index.js';

export const router = Router();

function collectAccount(account) {
  const latestSnapshot = db
    .prepare(
      `SELECT followers, following, posts_count, engagement_rate, captured_at
       FROM snapshots WHERE account_id = ? ORDER BY captured_at DESC LIMIT 1`
    )
    .get(account.id);
  return {
    ...account,
    is_live: isPlatformLive(account.platform),
    latest: latestSnapshot ?? null,
  };
}

router.get('/platforms', (req, res) => {
  res.json(PLATFORMS.map((p) => ({ platform: p, live: isPlatformLive(p) })));
});

router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
  res.json(accounts.map(collectAccount));
});

router.post('/', (req, res) => {
  const { platform, handle, display_name } = req.body ?? {};
  if (!platform || !handle) {
    return res.status(400).json({ error: 'platform e handle sono obbligatori' });
  }
  if (!PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: `Piattaforma non supportata: ${platform}` });
  }
  try {
    const info = db
      .prepare('INSERT INTO accounts (platform, handle, display_name) VALUES (?, ?, ?)')
      .run(platform, handle.trim(), display_name?.trim() || null);
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(collectAccount(account));
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Account gia\' monitorato' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.get('/:id/snapshots', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM snapshots WHERE account_id = ? ORDER BY captured_at ASC')
    .all(req.params.id);
  res.json(rows);
});

router.get('/:id/posts', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM posts WHERE account_id = ? ORDER BY published_at DESC LIMIT 20')
    .all(req.params.id);
  res.json(rows);
});

router.post('/:id/refresh', async (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account non trovato' });

  const { data: metrics, source } = await fetchMetrics(account);
  db.prepare(
    `INSERT INTO snapshots (account_id, followers, following, posts_count, engagement_rate)
     VALUES (?, ?, ?, ?, ?)`
  ).run(account.id, metrics.followers, metrics.following, metrics.posts_count, metrics.engagement_rate);

  const { data: posts } = await fetchRecentPosts(account);
  const insertPost = db.prepare(
    `INSERT INTO posts (account_id, external_id, content, url, likes, comments, shares, published_at)
     VALUES (@account_id, @external_id, @content, @url, @likes, @comments, @shares, @published_at)
     ON CONFLICT(account_id, external_id) DO UPDATE SET
       likes=excluded.likes, comments=excluded.comments, shares=excluded.shares`
  );
  for (const post of posts ?? []) {
    insertPost.run({ account_id: account.id, ...post });
  }

  res.json({ ...collectAccount(account), source });
});
