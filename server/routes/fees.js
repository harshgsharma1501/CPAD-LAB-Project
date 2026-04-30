const express = require('express');
const { queryAll, queryOne, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/types', (req, res) => res.json(queryAll('SELECT * FROM fee_types WHERE is_active = 1')));

router.get('/summary', (req, res) => {
  res.json({
    total_collected: queryOne(`SELECT COALESCE(SUM(amount),0) as val FROM fee_payments WHERE status='Paid'`).val,
    total_pending: queryOne(`SELECT COALESCE(SUM(amount),0) as val FROM fee_payments WHERE status IN ('Pending','Overdue')`).val,
    total_overdue: queryOne(`SELECT COUNT(*) as val FROM fee_payments WHERE status='Overdue'`).val,
    by_method: queryAll(`SELECT method, COUNT(*) as count, SUM(amount) as total FROM fee_payments WHERE status='Paid' AND method IS NOT NULL GROUP BY method`)
  });
});

router.get('/', (req, res) => {
  let q = `SELECT fp.*, ft.name as fee_name, ft.frequency, s.reg_no, u.name as student_name
    FROM fee_payments fp JOIN fee_types ft ON fp.fee_type_id = ft.id
    JOIN students s ON fp.student_id = s.id JOIN users u ON s.user_id = u.id`;
  const conds = [], p = [];
  if (req.query.status) { conds.push('fp.status = ?'); p.push(req.query.status); }
  if (req.query.student_id) { conds.push('fp.student_id = ?'); p.push(+req.query.student_id); }
  if (conds.length) q += ' WHERE ' + conds.join(' AND ');
  q += ' ORDER BY fp.created_at DESC';
  res.json(queryAll(q, p));
});

router.post('/', authorize('admin', 'accounts', 'sysadmin'), (req, res) => {
  const { student_id, fee_type_id, amount, due_date, paid_date, method, status, txn_ref, remarks } = req.body;
  try {
    const receipt = 'RCP-' + Date.now();
    const r = run(`INSERT INTO fee_payments (student_id,fee_type_id,amount,due_date,paid_date,method,status,txn_ref,receipt_no,remarks) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [student_id, fee_type_id, amount, due_date, paid_date, method, status || 'Paid', txn_ref, receipt, remarks]);
    res.status(201).json({ id: r.lastInsertRowid, receipt_no: receipt });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', authorize('admin', 'accounts', 'sysadmin'), (req, res) => {
  const { status, paid_date, method, txn_ref } = req.body;
  run('UPDATE fee_payments SET status=COALESCE(?,status),paid_date=COALESCE(?,paid_date),method=COALESCE(?,method),txn_ref=COALESCE(?,txn_ref) WHERE id=?',
    [status, paid_date, method, txn_ref, +req.params.id]);
  res.json({ message: 'Updated' });
});

module.exports = router;
