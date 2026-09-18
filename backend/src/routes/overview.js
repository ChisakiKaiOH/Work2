import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts').all();
  const totals = { accounts: accounts.length, followers: 0, byPlatform: {} };

  const latestByAccount = db
    .prepare(
      `SELECT s.account_id, s.followers, s.engagement_rate
       FROM snapshots s
       INNER JOIN (
         SELECT account_id, MAX(captured_at) AS max_date
         FROM snapshots GROUP BY account_id
       ) latest ON s.account_id = latest.account_id AND s.captured_at = latest.max_date`
    )
    .all();

  const byAccount = Object.fromEntries(latestByAccount.map((r) => [r.account_id, r]));

  for (const account of accounts) {
    const snap = byAccount[account.id];
    const followers = snap?.followers ?? 0;
    totals.followers += followers;
    totals.byPlatform[account.platform] = (totals.byPlatform[account.platform] ?? 0) + followers;
  }

  res.json(totals);
});
