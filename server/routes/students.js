const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(queryAll(`SELECT s.*, u.name, u.email, u.is_active, r.room_number, h.name as hostel_name
    FROM students s JOIN users u ON s.user_id = u.id
    LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.status = 'Active'
    LEFT JOIN rooms r ON ra.room_id = r.id LEFT JOIN hostels h ON r.hostel_id = h.id ORDER BY s.reg_no`));
});

router.get('/:id', (req, res) => {
  const s = queryOne(`SELECT s.*, u.name, u.email, u.is_active, r.room_number, r.id as room_id, h.name as hostel_name
    FROM students s JOIN users u ON s.user_id = u.id
    LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.status = 'Active'
    LEFT JOIN rooms r ON ra.room_id = r.id LEFT JOIN hostels h ON r.hostel_id = h.id WHERE s.id = ?`, [+req.params.id]);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

router.post('/', authorize('admin', 'sysadmin', 'warden'), (req, res) => {
  const { name, email, reg_no, department, year, phone, dob, gender, guardian_name, guardian_phone, address } = req.body;
  try {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('hostel123', 10);
    const u = run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'student']);
    const s = run(`INSERT INTO students (user_id,reg_no,department,year,phone,dob,gender,guardian_name,guardian_phone,address,admission_date) VALUES (?,?,?,?,?,?,?,?,?,?,date('now'))`,
      [u.lastInsertRowid, reg_no, department, year, phone, dob, gender, guardian_name, guardian_phone, address]);
    res.status(201).json({ id: s.lastInsertRowid, message: 'Student created' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', authorize('admin', 'sysadmin', 'warden'), (req, res) => {
  const { name, department, year, phone, guardian_name, guardian_phone, address } = req.body;
  const s = queryOne('SELECT * FROM students WHERE id = ?', [+req.params.id]);
  if (!s) return res.status(404).json({ error: 'Not found' });
  run('UPDATE users SET name = ? WHERE id = ?', [name, s.user_id]);
  run('UPDATE students SET department=?,year=?,phone=?,guardian_name=?,guardian_phone=?,address=? WHERE id=?',
    [department, year, phone, guardian_name, guardian_phone, address, +req.params.id]);
  res.json({ message: 'Updated' });
});

module.exports = router;
