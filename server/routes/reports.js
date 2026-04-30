const express = require('express');
const { queryAll, queryOne } = require('../db/helpers');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const s = {
    total_students: queryOne('SELECT COUNT(*) as val FROM students').val,
    total_rooms: queryOne('SELECT COUNT(*) as val FROM rooms').val,
    active_allocations: queryOne(`SELECT COUNT(*) as val FROM room_allocations WHERE status='Active'`).val,
    fee_collected: queryOne(`SELECT COALESCE(SUM(amount),0) as val FROM fee_payments WHERE status='Paid'`).val,
    fee_pending: queryOne(`SELECT COALESCE(SUM(amount),0) as val FROM fee_payments WHERE status IN ('Pending','Overdue')`).val,
    pending_maintenance: queryOne(`SELECT COUNT(*) as val FROM maintenance_requests WHERE status IN ('Submitted','In Progress')`).val,
    disciplinary_open: queryOne(`SELECT COUNT(*) as val FROM disciplinary_records WHERE status IN ('Open','Under Review')`).val,
    fee_by_status: queryAll('SELECT status,COUNT(*) as count,COALESCE(SUM(amount),0) as total FROM fee_payments GROUP BY status'),
    maintenance_by_category: queryAll('SELECT category,COUNT(*) as count FROM maintenance_requests GROUP BY category'),
    maintenance_by_status: queryAll('SELECT status,COUNT(*) as count FROM maintenance_requests GROUP BY status'),
    students_by_dept: queryAll('SELECT department,COUNT(*) as count FROM students GROUP BY department'),
    students_by_year: queryAll('SELECT year,COUNT(*) as count FROM students GROUP BY year ORDER BY year'),
    recent_payments: queryAll(`SELECT fp.*,u.name as student_name,ft.name as fee_name FROM fee_payments fp JOIN students s ON fp.student_id=s.id JOIN users u ON s.user_id=u.id JOIN fee_types ft ON fp.fee_type_id=ft.id ORDER BY fp.created_at DESC LIMIT 5`),
    recent_maintenance: queryAll(`SELECT mr.*,u.name as student_name FROM maintenance_requests mr JOIN students s ON mr.student_id=s.id JOIN users u ON s.user_id=u.id ORDER BY mr.submitted_at DESC LIMIT 5`)
  };
  const totalCap = queryOne('SELECT COALESCE(SUM(capacity),0) as val FROM rooms').val;
  s.total_capacity = totalCap;
  s.occupancy_percent = totalCap ? Math.round((s.active_allocations/totalCap)*100) : 0;
  s.vacancy = totalCap - s.active_allocations;
  res.json(s);
});

module.exports = router;
