const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(queryAll(`SELECT dr.*, s.reg_no, u.name as student_name, u2.name as reported_by_name
    FROM disciplinary_records dr JOIN students s ON dr.student_id = s.id
    JOIN users u ON s.user_id = u.id LEFT JOIN users u2 ON dr.reported_by = u2.id
    ORDER BY dr.incident_date DESC`));
});

router.post('/', authorize('admin', 'warden', 'sysadmin'), (req, res) => {
  const { student_id, incident_date, category, description, severity, action_taken, fine_amount } = req.body;
  try {
    const r = run(`INSERT INTO disciplinary_records (student_id,incident_date,category,description,severity,action_taken,fine_amount,reported_by) VALUES (?,?,?,?,?,?,?,?)`,
      [student_id, incident_date, category, description, severity, action_taken, fine_amount||0, req.user.id]);
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', authorize('admin', 'warden', 'sysadmin'), (req, res) => {
  const { status, action_taken, fine_amount } = req.body;
  run('UPDATE disciplinary_records SET status=COALESCE(?,status),action_taken=COALESCE(?,action_taken),fine_amount=COALESCE(?,fine_amount) WHERE id=?',
    [status, action_taken, fine_amount, +req.params.id]);
  res.json({ message: 'Updated' });
});

module.exports = router;
