import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH ?? join(__dir, 'flashreader.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS progress (
    book_id TEXT PRIMARY KEY,
    chapter_index INTEGER NOT NULL DEFAULT 0,
    word_index INTEGER NOT NULL DEFAULT 0,
    last_read INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recaps (
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    recap TEXT NOT NULL,
    quiz TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (book_id, chapter_id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    word_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    words INTEGER NOT NULL DEFAULT 0
  );
`)

// Books
export const bookQueries = {
  list: db.prepare('SELECT id, title, author FROM books ORDER BY created_at DESC'),
  get: db.prepare('SELECT data FROM books WHERE id = ?'),
  upsert: db.prepare('INSERT OR REPLACE INTO books (id, title, author, data) VALUES (?, ?, ?, ?)'),
  del: db.prepare('DELETE FROM books WHERE id = ?'),
}

// Progress
export const progressQueries = {
  get: db.prepare('SELECT chapter_index, word_index, last_read FROM progress WHERE book_id = ?'),
  upsert: db.prepare('INSERT OR REPLACE INTO progress (book_id, chapter_index, word_index, last_read) VALUES (?, ?, ?, ?)'),
  del: db.prepare('DELETE FROM progress WHERE book_id = ?'),
}

// Recaps
export const recapQueries = {
  get: db.prepare('SELECT recap, quiz FROM recaps WHERE book_id = ? AND chapter_id = ?'),
  upsert: db.prepare('INSERT OR REPLACE INTO recaps (book_id, chapter_id, recap, quiz) VALUES (?, ?, ?, ?)'),
}

// Notes
export const noteQueries = {
  list: db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at ASC'),
  insert: db.prepare('INSERT INTO notes (id, book_id, chapter_id, chapter_title, word_index, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  del: db.prepare('DELETE FROM notes WHERE id = ?'),
}

// Daily stats
export const statsQueries = {
  all: db.prepare('SELECT date, words FROM daily_stats ORDER BY date ASC'),
  get: db.prepare('SELECT words FROM daily_stats WHERE date = ?'),
  upsert: db.prepare('INSERT INTO daily_stats (date, words) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET words = words + excluded.words'),
}

export default db
