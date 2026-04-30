import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiPlus, HiCurrencyRupee } from 'react-icons/hi';

export default function Fees() {
  const [payments, setPayments] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [summary, setSummary] = useState({});

  const load = () => {
    api.get('/fees' + (statusFilter ? `?status=${statusFilter}` : '')).then(r => setPayments(r.data));
    api.get('/fees/summary').then(r => setSummary(r.data));
  };
  useEffect(() => { load(); api.get('/fees/types').then(r => setFeeTypes(r.data)); api.get('/students').then(r => setStudents(r.data)); }, []);
  useEffect(() => { load(); }, [statusFilter]);

  const handleSave = async () => {
    try {
      await api.post('/fees', { ...form, status: 'Paid', paid_date: new Date().toISOString().split('T')[0], txn_ref: 'TXN-' + Date.now() });
      setShowAdd(false); setForm({}); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Fee Payment & Tracking</div><div className="page-subtitle">Manage hostel fee collections</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><HiPlus /> Record Payment</button>
      </div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card"><div className="kpi-icon green"><HiCurrencyRupee /></div><div><div className="kpi-value">₹{(summary.total_collected || 0).toLocaleString()}</div><div className="kpi-label">Total Collected</div></div></div>
        <div className="kpi-card"><div className="kpi-icon orange"><HiCurrencyRupee /></div><div><div className="kpi-value">₹{(summary.total_pending || 0).toLocaleString()}</div><div className="kpi-label">Pending / Overdue</div></div></div>
        <div className="kpi-card"><div className="kpi-icon blue"><HiCurrencyRupee /></div><div><div className="kpi-value">{summary.total_overdue || 0}</div><div className="kpi-label">Overdue Invoices</div></div></div>
      </div>
      <div className="filters">
        {['', 'Paid', 'Pending', 'Overdue'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter(s)}>{s || 'All'}</button>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap"><table><thead><tr><th>Student</th><th>Reg No</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id}>
              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.student_name}</td>
              <td>{p.reg_no}</td><td>{p.fee_name}</td><td>₹{p.amount?.toLocaleString()}</td>
              <td>{p.due_date || '—'}</td><td>{p.paid_date || '—'}</td><td>{p.method || '—'}</td>
              <td><span className={`badge badge-${p.status === 'Paid' ? 'success' : p.status === 'Overdue' ? 'danger' : 'warning'}`}>{p.status}</span></td>
            </tr>
          ))}</tbody></table></div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Record Payment</h2><button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
            <div className="form-group"><label className="form-label">Student</label>
              <select className="form-select" value={form.student_id || ''} onChange={e => setForm({ ...form, student_id: +e.target.value })}>
                <option value="">Select</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.reg_no})</option>)}
              </select></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fee Type</label>
                <select className="form-select" value={form.fee_type_id || ''} onChange={e => { const ft = feeTypes.find(f => f.id === +e.target.value); setForm({ ...form, fee_type_id: +e.target.value, amount: ft?.amount || '' }); }}>
                  <option value="">Select</option>{feeTypes.map(f => <option key={f.id} value={f.id}>{f.name} (₹{f.amount})</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: +e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Method</label>
                <select className="form-select" value={form.method || ''} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="">Select</option><option>UPI</option><option>Online</option><option>Cash</option><option>Cheque</option><option>Bank Transfer</option>
                </select></div>
              <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Record Payment</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
