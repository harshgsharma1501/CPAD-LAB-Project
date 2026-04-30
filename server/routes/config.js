const express = require('express');
const { queryAll, run } = require('../db/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => res.json(queryAll('SELECT * FROM admin_config ORDER BY category, key')));

router.put('/:key', authorize('admin', 'sysadmin'), (req, res) => {
  run('UPDATE admin_config SET value=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE key=?', [req.body.value, req.user.id, req.params.key]);
  res.json({ message: 'Updated' });
});

router.get('/users', authorize('admin', 'sysadmin'), (req, res) => {
  res.json(queryAll('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY role,name'));
});

router.put('/users/:id/toggle', authorize('sysadmin'), (req, res) => {
  run('UPDATE users SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END WHERE id=?', [+req.params.id]);
  res.json({ message: 'Toggled' });
});

router.get('/audit', authorize('admin', 'sysadmin'), (req, res) => {
  res.json(queryAll('SELECT al.*,u.name as user_name FROM audit_log al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT 100'));
});

module.exports = router;
