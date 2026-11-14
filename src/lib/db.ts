import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Database file path configured via env or default
const dbPath = process.env.DATABASE_PATH || 'creatordesk.db';
const resolvedDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

// Ensure directory exists
const dir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Global database instance to avoid multiple file locks in development hot-reload
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(resolvedDbPath);
    // Enable WAL mode and foreign keys for high performance and integrity
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

export function initSchema(db: DatabaseSync) {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'creator', -- 'admin' or 'creator'
      bio TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'suspended'
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Content Ideas table
    CREATE TABLE IF NOT EXISTS content_ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New Idea', -- 'New Idea', 'Planned', 'In Production', 'Completed'
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Content Plans table (Planner & Calendar)
    CREATE TABLE IF NOT EXISTS content_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      platform TEXT NOT NULL,
      category TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'Planned', -- 'Planned', 'In Production', 'Ready', 'Published'
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Contents table
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      platform TEXT NOT NULL,
      category TEXT NOT NULL,
      content_url TEXT,
      published_at DATETIME,
      status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'In Production', 'Scheduled', 'Published'
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Content Analytics table
    CREATE TABLE IF NOT EXISTS content_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      shares INTEGER NOT NULL DEFAULT 0,
      followers_count INTEGER NOT NULL DEFAULT 0,
      recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Login rate limiting table (security)
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL UNIQUE, -- IP or email
      attempts INTEGER NOT NULL DEFAULT 1,
      last_attempt_at INTEGER NOT NULL -- timestamp in ms
    );

    -- Audit Logs (system activity for admin)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Indexes for high-performance and strict ownership queries
    CREATE INDEX IF NOT EXISTS idx_ideas_user ON content_ideas(user_id);
    CREATE INDEX IF NOT EXISTS idx_plans_user ON content_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_plans_scheduled ON content_plans(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_contents_user ON contents(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_content ON content_analytics(content_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_user ON content_analytics(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);
}

// Auto-run schema on import
try {
  getDb();
} catch (e) {
  // Ignored if runtime does not support top-level DB initialization yet
}
