const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'hostel.db');
let db = null;
let dbReady = null;

function initDb() {
  if (dbReady) return dbReady;

  dbReady = Promise.resolve().then(() => {
    const dbExists = fs.existsSync(DB_PATH);
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    if (dbExists) {
      console.log('🗄️  Database loaded from file:', DB_PATH);
    } else {
      console.log('🗄️  Creating new database at:', DB_PATH);
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema);
      console.log('✅ Schema created');
      const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      db.exec(seed);
      console.log('✅ Seed data loaded');
    }
    return db;
  });

  return dbReady;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function saveDb() {
  // better-sqlite3 writes directly to the disk file synchronously.
}

module.exports = { initDb, getDb, saveDb, DB_PATH };
