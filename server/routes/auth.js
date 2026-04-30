const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../db/helpers');
const { authenticate, SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = queryOne('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET, { expiresIn: '24h' });
  let student = null;
  if (user.role === 'student') student = queryOne('SELECT * FROM students WHERE user_id = ?', [user.id]);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, student } });
});

router.get('/me', authenticate, (req, res) => {
  const user = queryOne('SELECT id, name, email, role, avatar_url, is_active, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  let student = null;
  if (user.role === 'student') student = queryOne('SELECT * FROM students WHERE user_id = ?', [user.id]);
  res.json({ ...user, student });
});

module.exports = router;
