const { getDb } = require('../db/database');

function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const cleanParams = params.map(p => (p === undefined ? null : p));
  return stmt.all(...cleanParams);
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const cleanParams = params.map(p => (p === undefined ? null : p));
  return stmt.get(...cleanParams) || null;
}

function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const cleanParams = params.map(p => (p === undefined ? null : p));
  const info = stmt.run(...cleanParams);
  return {
    lastInsertRowid: Number(info.lastInsertRowid),
    changes: info.changes,
  };
}

module.exports = { queryAll, queryOne, run };
