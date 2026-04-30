import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiPlus, HiSearch, HiPencil } from 'react-icons/hi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/students').then(r => setStudents(r.data));
  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.reg_no || '').includes(search)
  );

  const handleSave = async () => {
    try {
      if (modal === 'edit') await api.put(`/students/${form.id}`, form);
      else await api.post('/students', form);
      setModal(null); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Students</div><div className="page-subtitle">{students.length} registered students</div></div>
        <button className="btn btn-primary" onClick={() => { setForm({}); setModal('add'); }}><HiPlus /> Add Student</button>
      </div>
      <div className="filters">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <HiSearch style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input className="filter-input" style={{ width: '100%', paddingLeft: 36 }} placeholder="Search by name or reg no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table><thead><tr><th>Reg No</th><th>Name</th><th>Dept</th><th>Year</th><th>Room</th><th>Hostel</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{s.reg_no}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.year}</td>
                  <td>{s.room_number || <span className="badge badge-muted">Unassigned</span>}</td>
                  <td>{s.hostel_name || '—'}</td>
                  <td>{s.phone}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => { setForm(s); setModal('edit'); }}><HiPencil /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'edit' ? 'Edit' : 'Add'} Student</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Reg No</label><input className="form-input" value={form.reg_no || ''} onChange={e => setForm({ ...form, reg_no: e.target.value })} disabled={modal === 'edit'} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} disabled={modal === 'edit'} /></div>
              <div className="form-group"><label className="form-label">Department</label>
                <select className="form-select" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select</option><option>Computer Science</option><option>Electronics</option><option>Mechanical</option><option>Civil</option><option>Electrical</option>
                </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" min="1" max="5" value={form.year || ''} onChange={e => setForm({ ...form, year: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={form.guardian_name || ''} onChange={e => setForm({ ...form, guardian_name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={form.guardian_phone || ''} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
