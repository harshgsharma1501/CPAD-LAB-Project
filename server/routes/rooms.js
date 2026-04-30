const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/hostels', (req, res) => {
  res.json(queryAll('SELECT h.*, u.name as warden_name FROM hostels h LEFT JOIN users u ON h.warden_id = u.id'));
});

router.get('/', (req, res) => {
  let q = `SELECT r.*, h.name as hostel_name,
    (SELECT COUNT(*) FROM room_allocations ra WHERE ra.room_id = r.id AND ra.status = 'Active') as current_occupants
    FROM rooms r JOIN hostels h ON r.hostel_id = h.id`;
  const p = [];
  if (req.query.hostel_id) { q += ' WHERE r.hostel_id = ?'; p.push(+req.query.hostel_id); }
  q += ' ORDER BY h.name, r.floor, r.room_number';
  res.json(queryAll(q, p));
});

router.get('/:id', (req, res) => {
  const room = queryOne('SELECT r.*, h.name as hostel_name FROM rooms r JOIN hostels h ON r.hostel_id = h.id WHERE r.id = ?', [+req.params.id]);
  if (!room) return res.status(404).json({ error: 'Not found' });
  const occupants = queryAll(`SELECT s.*, u.name FROM room_allocations ra JOIN students s ON ra.student_id = s.id JOIN users u ON s.user_id = u.id WHERE ra.room_id = ? AND ra.status = 'Active'`, [+req.params.id]);
  res.json({ ...room, occupants });
});

router.post('/allocate', authorize('admin', 'warden', 'sysadmin'), (req, res) => {
  const { student_id, room_id, academic_year } = req.body;
  try {
    const room = queryOne('SELECT * FROM rooms WHERE id = ?', [room_id]);
    const cnt = queryOne(`SELECT COUNT(*) as cnt FROM room_allocations WHERE room_id = ? AND status = 'Active'`, [room_id]).cnt;
    if (cnt >= room.capacity) return res.status(400).json({ error: 'Room full' });
    run(`UPDATE room_allocations SET status = 'Transferred', vacate_date = date('now') WHERE student_id = ? AND status = 'Active'`, [student_id]);
    run('INSERT INTO room_allocations (student_id, room_id, academic_year) VALUES (?, ?, ?)', [student_id, room_id, academic_year || '2025-26']);
    const st = (cnt + 1) >= room.capacity ? 'Occupied' : 'Partial';
    run('UPDATE rooms SET status = ? WHERE id = ?', [st, room_id]);
    res.status(201).json({ message: 'Allocated' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', authorize('admin', 'warden', 'sysadmin'), (req, res) => {
  const { status } = req.body;
  if (status) run('UPDATE rooms SET status = ? WHERE id = ?', [status, +req.params.id]);
  res.json({ message: 'Updated' });
});

module.exports = router;
