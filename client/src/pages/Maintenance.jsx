import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiPlus } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const categories = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'Internet', 'AC/Fan', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = ['Submitted', 'In Progress', 'Resolved', 'Closed', 'Rejected'];

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get('/maintenance' + (filter ? `?status=${filter}` : '')).then(r => setRequests(r.data));
  useEffect(() => { load(); }, [filter]);

  const handleSubmit = async () => {
    try {
      await api.post('/maintenance', form);
      setShowAdd(false); setForm({}); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/maintenance/${showUpdate.id}`, form);
      setShowUpdate(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Maintenance Requests</div><div className="page-subtitle">{requests.length} requests</div></div>
        {user?.role === 'student' && <button className="btn btn-primary" onClick={() => { setForm({ student_id: user.student?.id, room_id: user.student?.room_id }); setShowAdd(true); }}><HiPlus /> New Request</button>}
      </div>
      <div className="filters">
        {['', ...statuses].map(s => <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>{s || 'All'}</button>)}
      </div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>ID</th><th>Student</th><th>Room</th><th>Category</th><th>Description</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Date</th>{user?.role !== 'student' && <th>Action</th>}</tr></thead>
        <tbody>{requests.map(r => (
          <tr key={r.id}>
            <td>#{r.id}</td>
            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.student_name}</td>
            <td>{r.room_number}</td><td>{r.category}</td>
            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
            <td><span className={`badge badge-${r.priority === 'Urgent' ? 'danger' : r.priority === 'High' ? 'warning' : 'info'}`}>{r.priority}</span></td>
            <td><span className={`badge badge-${r.status === 'Resolved' || r.status === 'Closed' ? 'success' : r.status === 'In Progress' ? 'info' : r.status === 'Rejected' ? 'danger' : 'warning'}`}>{r.status}</span></td>
            <td>{r.assigned_to || '—'}</td><td style={{ fontSize: 12 }}>{r.submitted_at?.split(' ')[0]}</td>
            {user?.role !== 'student' && <td><button className="btn btn-outline btn-sm" onClick={() => { setShowUpdate(r); setForm({ status: r.status, assigned_to: r.assigned_to || '' }); }}>Update</button></td>}
          </tr>
        ))}</tbody></table></div></div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">New Maintenance Request</h2><button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>{priorities.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." /></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>Submit</button></div>
          </div>
        </div>
      )}

      {showUpdate && (
        <div className="modal-overlay" onClick={() => setShowUpdate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Update Request #{showUpdate.id}</h2><button className="modal-close" onClick={() => setShowUpdate(null)}>×</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Assign To</label><input className="form-input" value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Resolution Note</label><textarea className="form-input" rows={2} value={form.resolution_note || ''} onChange={e => setForm({ ...form, resolution_note: e.target.value })} /></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowUpdate(null)}>Cancel</button><button className="btn btn-primary" onClick={handleUpdate}>Update</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
