import cron from 'node-cron';
import { db } from './db.js';
import { fetchMetrics, fetchRecentPosts } from './adapters/index.js';

async function collectAll() {
  const accounts = db.prepare('SELECT * FROM accounts').all();
  for (const account of accounts) {
    try {
      const { data: metrics } = await fetchMetrics(account);
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
      console.log(`[scheduler] raccolti dati per ${account.platform}:${account.handle}`);
    } catch (err) {
      console.error(`[scheduler] errore per ${account.platform}:${account.handle}:`, err.message);
    }
  }
}

export function startScheduler() {
  const minutes = Number(process.env.POLL_INTERVAL_MINUTES ?? 60);
  const cronExpr = `*/${Math.max(1, Math.min(minutes, 59))} * * * *`;
  console.log(`[scheduler] raccolta automatica ogni ${minutes} minuti`);
  cron.schedule(cronExpr, collectAll);
}

export { collectAll };
