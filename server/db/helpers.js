const { getDb, saveDb } = require('../db/database');

// Convert sql.js result to array of objects
function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params.map(p => p === undefined ? null : p));
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params.map(p => p === undefined ? null : p));
  stmt.step();
  stmt.free();
  saveDb();
  const info = db.exec("SELECT last_insert_rowid() as id, changes() as changes");
  const lastId = info[0]?.values[0]?.[0] || 0;
  const changes = info[0]?.values[0]?.[1] || 0;
  return { lastInsertRowid: lastId, changes };
}

module.exports = { queryAll, queryOne, run };
