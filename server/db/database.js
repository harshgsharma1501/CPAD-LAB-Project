const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'hostel.db');
let db = null;
let dbReady = null;

function initDb() {
  if (dbReady) return dbReady;
  dbReady = initSqlJs().then(SQL => {
    let data = null;
    if (fs.existsSync(DB_PATH)) {
      data = fs.readFileSync(DB_PATH);
      db = new SQL.Database(data);
      console.log('🗄️  Database loaded from file');
    } else {
      db = new SQL.Database();
      console.log('🗄️  Creating new database...');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.run(schema);
      console.log('✅ Schema created');
      const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      db.run(seed);
      console.log('✅ Seed data loaded');
      saveDb();
    }
    return db;
  });
  return dbReady;
}

function getDb() {
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Auto-save every 30 seconds
setInterval(() => { if (db) saveDb(); }, 30000);

// Save on process exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });

module.exports = { initDb, getDb, saveDb };
