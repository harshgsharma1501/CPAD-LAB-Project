const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const notifs = queryAll('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  const unread = queryOne('SELECT COUNT(*) as val FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0', [req.user.id]).val;
  res.json({ notifications: notifs, unread_count: unread });
});

router.put('/:id/read', (req, res) => {
  run('UPDATE notifications SET is_read = 1 WHERE id = ?', [+req.params.id]);
  res.json({ message: 'Read' });
});

router.put('/read-all', (req, res) => {
  run('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL', [req.user.id]);
  res.json({ message: 'All read' });
});

router.post('/', (req, res) => {
  const { user_id, title, message, type } = req.body;
  const r = run('INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)', [user_id||null, title, message, type||'Announcement']);
  res.status(201).json({ id: r.lastInsertRowid });
});

module.exports = router;
