const express = require('express');
const { queryAll, queryOne } = require('../db/helpers');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const hostels = queryAll('SELECT h.*, u.name as warden_name FROM hostels h LEFT JOIN users u ON h.warden_id = u.id');
  const result = hostels.map(hostel => {
    const rooms = queryAll('SELECT * FROM rooms WHERE hostel_id = ?', [hostel.id]);
    const totalCap = rooms.reduce((s, r) => s + r.capacity, 0);
    const active = queryOne(`SELECT COUNT(*) as cnt FROM room_allocations ra JOIN rooms r ON ra.room_id = r.id WHERE r.hostel_id = ? AND ra.status = 'Active'`, [hostel.id]).cnt;
    const floors = {};
    rooms.forEach(r => {
      if (!floors[r.floor]) floors[r.floor] = { total: 0, capacity: 0, occupied: 0 };
      floors[r.floor].total++; floors[r.floor].capacity += r.capacity;
    });
    queryAll(`SELECT r.floor, COUNT(*) as cnt FROM room_allocations ra JOIN rooms r ON ra.room_id = r.id WHERE r.hostel_id = ? AND ra.status = 'Active' GROUP BY r.floor`, [hostel.id])
      .forEach(fa => { if (floors[fa.floor]) floors[fa.floor].occupied = fa.cnt; });
    const byStatus = queryAll('SELECT status, COUNT(*) as count FROM rooms WHERE hostel_id = ? GROUP BY status', [hostel.id]);
    return { ...hostel, total_rooms: rooms.length, total_capacity: totalCap, current_occupancy: active,
      occupancy_percent: totalCap ? Math.round((active / totalCap) * 100) : 0, floors, room_status: byStatus };
  });
  const overall = { total_capacity: result.reduce((s,h)=>s+h.total_capacity,0), total_occupied: result.reduce((s,h)=>s+h.current_occupancy,0), total_rooms: result.reduce((s,h)=>s+h.total_rooms,0) };
  overall.occupancy_percent = overall.total_capacity ? Math.round((overall.total_occupied/overall.total_capacity)*100) : 0;
  overall.vacancy = overall.total_capacity - overall.total_occupied;
  res.json({ overall, hostels: result });
});

module.exports = router;
