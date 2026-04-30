import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiPlus } from 'react-icons/hi';

const cats = ['Noise', 'Property Damage', 'Unauthorized Guest', 'Curfew Violation', 'Substance Abuse', 'Ragging', 'Other'];
const sevs = ['Minor', 'Moderate', 'Major', 'Critical'];
const actions = ['Warning', 'Fine', 'Suspension', 'Expulsion', 'Counseling', 'Community Service'];

export default function Disciplinary() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});

  const load = () => api.get('/disciplinary').then(r => setRecords(r.data));
  useEffect(() => { load(); api.get('/students').then(r => setStudents(r.data)); }, []);

  const handleSave = async () => {
    try { await api.post('/disciplinary', form); setShowAdd(false); setForm({}); load(); }
    catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Disciplinary Records</div><div className="page-subtitle">{records.length} records</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><HiPlus /> Log Incident</button>
      </div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Student</th><th>Reg No</th><th>Category</th><th>Severity</th><th>Action</th><th>Fine</th><th>Status</th><th>Reported By</th></tr></thead>
        <tbody>{records.map(r => (
          <tr key={r.id}>
            <td>{r.incident_date}</td>
            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.student_name}</td>
            <td>{r.reg_no}</td><td>{r.category}</td>
            <td><span className={`badge badge-${r.severity === 'Critical' ? 'danger' : r.severity === 'Major' ? 'warning' : 'info'}`}>{r.severity}</span></td>
            <td>{r.action_taken || '—'}</td><td>{r.fine_amount ? `₹${r.fine_amount}` : '—'}</td>
            <td><span className={`badge badge-${r.status === 'Closed' ? 'success' : r.status === 'Action Taken' ? 'info' : 'warning'}`}>{r.status}</span></td>
            <td>{r.reported_by_name}</td>
          </tr>
        ))}</tbody></table></div></div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Log Incident</h2><button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Student</label><select className="form-select" value={form.student_id || ''} onChange={e => setForm({ ...form, student_id: +e.target.value })}><option value="">Select</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.incident_date || ''} onChange={e => setForm({ ...form, incident_date: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select</option>{cats.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Severity</label><select className="form-select" value={form.severity || ''} onChange={e => setForm({ ...form, severity: e.target.value })}><option value="">Select</option>{sevs.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Action</label><select className="form-select" value={form.action_taken || ''} onChange={e => setForm({ ...form, action_taken: e.target.value })}><option value="">Select</option>{actions.map(a => <option key={a}>{a}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Fine Amount</label><input className="form-input" type="number" value={form.fine_amount || ''} onChange={e => setForm({ ...form, fine_amount: +e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
