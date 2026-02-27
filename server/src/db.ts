import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let Database;
try {
  const mod = require('better-sqlite3');
  Database = typeof mod === 'function' ? mod : mod.default;
  if (!Database && mod && typeof mod.default === 'function') {
    Database = mod.default;
  }
} catch (err) {
  console.error('Failed to require better-sqlite3:', err);
}

const isNetlify = !!process.env.NETLIFY;
const baseDir = process.env.LAMBDA_TASK_ROOT || process.cwd();
const bundledDbPath = path.resolve(baseDir, 'data.db');
const writableDbPath = isNetlify ? path.join('/tmp', 'data.db') : bundledDbPath;

if (isNetlify && !fs.existsSync(writableDbPath)) {
  console.log('Netlify environment detected. Preparing writable DB...');
  if (fs.existsSync(bundledDbPath)) {
    try {
      fs.copyFileSync(bundledDbPath, writableDbPath);
      console.log('Copied bundled DB to /tmp');
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  } else {
    console.log('Bundled DB not found at primary path, checking alt...');
    const altPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data.db');
    if (fs.existsSync(altPath)) {
      try {
        fs.copyFileSync(altPath, writableDbPath);
        console.log('Copied bundled DB from alt path to /tmp');
      } catch (err) {
        console.error('Failed to copy database from alt path to /tmp:', err);
      }
    } else {
      console.error('Could not find bundled data.db anywhere!');
    }
  }
}

let db: any;
try {
  if (!Database) throw new Error('better-sqlite3 constructor not found');
  db = new Database(writableDbPath);
  console.log('Database initialized successfully at:', writableDbPath);
} catch (err) {
  console.error('Failed to initialize database:', err);
  // Create a mock DB object to prevent immediate crashes
  db = {
    prepare: () => ({
      get: () => null,
      run: () => ({ lastInsertRowid: 0, changes: 0 }),
      all: () => []
    }),
    exec: () => ({})
  };
}

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
