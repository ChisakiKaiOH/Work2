import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// SHIE_DATA_DIR viene impostata dal wrapper Electron per scrivere il DB nella
// cartella dati utente del sistema operativo invece che dentro l'app installata
// (spesso in sola lettura). In esecuzione standalone (npm start) si usa backend/data.
const dataDir = process.env.SHIE_DATA_DIR ?? path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'shie-hassaikai.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(platform, handle)
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    followers INTEGER,
    following INTEGER,
    posts_count INTEGER,
    engagement_rate REAL,
    captured_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    external_id TEXT,
    content TEXT,
    url TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    published_at TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(account_id, external_id)
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_account ON snapshots(account_id, captured_at);
  CREATE INDEX IF NOT EXISTS idx_posts_account ON posts(account_id, published_at);
`);
