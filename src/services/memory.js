import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'memory.db');

let db;
let stmts;
let deliverTells;

export function initMemory() {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS seen (
      nick TEXT PRIMARY KEY COLLATE NOCASE,
      channel TEXT,
      message TEXT,
      time TEXT
    );

    CREATE TABLE IF NOT EXISTS tells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL COLLATE NOCASE,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      time TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tells_target ON tells(target COLLATE NOCASE);
  `);

  stmts = {
    updateSeen: db.prepare('INSERT OR REPLACE INTO seen (nick, channel, message, time) VALUES (?, ?, ?, ?)'),
    getSeen: db.prepare('SELECT * FROM seen WHERE nick = ?'),
    addTell: db.prepare('INSERT INTO tells (target, sender, message) VALUES (?, ?, ?)'),
    getTells: db.prepare('SELECT * FROM tells WHERE target = ?'),
    deleteTells: db.prepare('DELETE FROM tells WHERE target = ?'),
  };

  deliverTells = db.transaction((target) => {
    const rows = stmts.getTells.all(target);
    if (rows.length > 0) {
      stmts.deleteTells.run(target);
    }
    return rows;
  });

  // Purge seen entries older than 90 days (daily)
  stmts.purgeSeen = db.prepare(`DELETE FROM seen WHERE time < datetime('now', '-90 days')`);
  stmts.purgeSeen.run();
  setInterval(() => stmts.purgeSeen.run(), 86_400_000).unref();
}

// --- Seen (persistent) ---

export function updateSeen(nick, channel, message) {
  stmts.updateSeen.run(nick.toLowerCase(), channel, message.slice(0, 200), new Date().toISOString());
}

export function getSeen(nick) {
  return stmts.getSeen.get(nick.toLowerCase());
}

// --- Tell (persistent) ---

export function addTell(target, sender, message) {
  stmts.addTell.run(target.toLowerCase(), sender, message.slice(0, 500));
}

export function getPendingTells(nick) {
  return deliverTells(nick.toLowerCase());
}

// --- Cleanup ---

export function closeMemory() {
  if (db?.open) db.close();
}
