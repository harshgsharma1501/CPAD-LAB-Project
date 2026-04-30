const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  let q = `SELECT mr.*, s.reg_no, u.name as student_name, r.room_number, h.name as hostel_name
    FROM maintenance_requests mr JOIN students s ON mr.student_id = s.id JOIN users u ON s.user_id = u.id
    JOIN rooms r ON mr.room_id = r.id JOIN hostels h ON r.hostel_id = h.id`;
  const p = [];
  if (req.query.status) { q += ' WHERE mr.status = ?'; p.push(req.query.status); }
  if (req.user.role === 'student') {
    const st = queryOne('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    q += (p.length ? ' AND' : ' WHERE') + ' mr.student_id = ?';
    p.push(st?.id);
  }
  q += ' ORDER BY mr.submitted_at DESC';
  res.json(queryAll(q, p));
});

router.post('/', (req, res) => {
  const { student_id, room_id, category, description, priority } = req.body;
  try {
    const r = run('INSERT INTO maintenance_requests (student_id,room_id,category,description,priority) VALUES (?,?,?,?,?)',
      [student_id, room_id, category, description, priority || 'Medium']);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Submitted' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', authorize('admin', 'warden', 'sysadmin'), (req, res) => {
  const { status, assigned_to, resolution_note } = req.body;
  let extra = '';
  if (status === 'Resolved') extra = ", resolved_at = datetime('now')";
  if (status === 'Closed') extra = ", closed_at = datetime('now')";
  run(`UPDATE maintenance_requests SET status=COALESCE(?,status),assigned_to=COALESCE(?,assigned_to),resolution_note=COALESCE(?,resolution_note)${extra} WHERE id=?`,
    [status, assigned_to, resolution_note, +req.params.id]);
  res.json({ message: 'Updated' });
});

module.exports = router;
