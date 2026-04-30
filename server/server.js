const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/occupancy', require('./routes/occupancy'));
app.use('/api/disciplinary', require('./routes/disciplinary'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/config', require('./routes/config'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏨 Smart Hostel MIS API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  });
}).catch(err => {
  console.error('Failed to init database:', err);
  process.exit(1);
});
