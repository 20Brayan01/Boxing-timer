import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const isNetlify = !!process.env.NETLIFY;
const bundledDbPath = path.join(process.cwd(), 'data.db');
const writableDbPath = isNetlify ? path.join('/tmp', 'data.db') : bundledDbPath;

// On Netlify, copy the bundled DB to /tmp so it's writable
if (isNetlify && fs.existsSync(bundledDbPath) && !fs.existsSync(writableDbPath)) {
  try {
    fs.copyFileSync(bundledDbPath, writableDbPath);
    console.log('Copied database to /tmp for write access');
  } catch (err) {
    console.error('Failed to copy database to /tmp:', err);
  }
}

const db = new Database(writableDbPath);
export const activeDbPath = writableDbPath;

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    subscription_end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rounds INTEGER,
    fight_time INTEGER,
    rest_time INTEGER,
    category TEXT,
    difficulty TEXT,
    completions INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    is_premium BOOLEAN DEFAULT 0,
    gif_url TEXT,
    instructions TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration_months INTEGER NOT NULL,
    features TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    plan_id TEXT,
    status TEXT,
    stripe_session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
