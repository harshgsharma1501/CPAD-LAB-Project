import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiKey } from 'react-icons/hi';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [filter, setFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [allocForm, setAllocForm] = useState({ student_id: '', room_id: '' });
  const [students, setStudents] = useState([]);
  const [showAlloc, setShowAlloc] = useState(false);

  const load = () => {
    api.get('/rooms').then(r => setRooms(r.data));
    api.get('/rooms/hostels').then(r => setHostels(r.data));
  };
  useEffect(() => { load(); api.get('/students').then(r => setStudents(r.data)); }, []);

  const uniqueFloors = [...new Set(rooms.filter(r => filter ? r.hostel_id === +filter : true).map(r => r.floor))].sort((a, b) => a - b);
  
  const filtered = rooms.filter(r => 
    (filter ? r.hostel_id === +filter : true) &&
    (floorFilter !== '' ? r.floor === +floorFilter : true)
  );

  const grouped = {};
  filtered.forEach(r => {
    const key = `${r.hostel_name} - Floor ${r.floor}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const handleAllocate = async () => {
    try {
      await api.post('/rooms/allocate', { ...allocForm, academic_year: '2025-26' });
      setShowAlloc(false); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Room Allocation</div><div className="page-subtitle">{rooms.length} rooms across {hostels.length} hostels</div></div>
        <button className="btn btn-primary" onClick={() => setShowAlloc(true)}><HiKey /> Allocate Room</button>
      </div>
      <div className="filters">
        <select className="filter-input" value={filter} onChange={e => { setFilter(e.target.value); setFloorFilter(''); }}>
          <option value="">All Hostels</option>
          {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select className="filter-input" value={floorFilter} onChange={e => setFloorFilter(e.target.value)}>
          <option value="">All Floors</option>
          {uniqueFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto', fontSize: 12 }}>
          <span className="badge badge-success">Available</span>
          <span className="badge badge-warning">Partial</span>
          <span className="badge badge-danger">Occupied</span>
          <span className="badge badge-muted">Maintenance</span>
        </div>
      </div>

      {Object.entries(grouped).map(([key, rms]) => (
        <div key={key} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{key}</h3>
          <div className="room-grid">
            {rms.map(r => (
              <div key={r.id} className={`room-cell ${r.status.toLowerCase()}`} onClick={() => setSelected(r)}>
                <div className="room-number">{r.room_number}</div>
                <div className="room-type">{r.type}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.current_occupants}/{r.capacity}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Room {selected.room_number}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Hostel:</span> {selected.hostel_name}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> {selected.type}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Floor:</span> {selected.floor}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Capacity:</span> {selected.capacity}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Occupants:</span> {selected.current_occupants}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge badge-${selected.status === 'Available' ? 'success' : selected.status === 'Occupied' ? 'danger' : selected.status === 'Partial' ? 'warning' : 'muted'}`}>{selected.status}</span></div>
            </div>
          </div>
        </div>
      )}

      {showAlloc && (
        <div className="modal-overlay" onClick={() => setShowAlloc(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Allocate Room</h2><button className="modal-close" onClick={() => setShowAlloc(false)}>×</button></div>
            <div className="form-group"><label className="form-label">Student</label>
              <select className="form-select" value={allocForm.student_id} onChange={e => setAllocForm({ ...allocForm, student_id: +e.target.value })}>
                <option value="">Select student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.reg_no})</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Room</label>
              <select className="form-select" value={allocForm.room_id} onChange={e => setAllocForm({ ...allocForm, room_id: +e.target.value })}>
                <option value="">Select room</option>
                {rooms.filter(r => r.status !== 'Occupied' && r.status !== 'Maintenance').map(r => <option key={r.id} value={r.id}>{r.hostel_name} - {r.room_number} ({r.type}, {r.current_occupants}/{r.capacity})</option>)}
              </select></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowAlloc(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAllocate}>Allocate</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
