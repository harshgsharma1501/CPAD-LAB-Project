import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiCog, HiSave } from 'react-icons/hi';

export default function AdminConfig() {
  const [configs, setConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('settings');
  const [edited, setEdited] = useState({});

  useEffect(() => {
    api.get('/config').then(r => setConfigs(r.data));
    api.get('/config/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const grouped = {};
  configs.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });

  const saveConfig = async (key) => {
    await api.put(`/config/${key}`, { value: edited[key] });
    setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
    api.get('/config').then(r => setConfigs(r.data));
  };

  const toggleUser = async (id) => {
    await api.put(`/config/users/${id}/toggle`);
    api.get('/config/users').then(r => setUsers(r.data));
  };

  return (
    <div className="fade-in">
      <div className="page-header"><div><div className="page-title">Admin Configuration</div><div className="page-subtitle">System settings & user management</div></div></div>
      <div className="filters" style={{ marginBottom: 24 }}>
        <button className={`btn btn-sm ${tab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('settings')}><HiCog /> Settings</button>
        <button className={`btn btn-sm ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'settings' && Object.entries(grouped).map(([cat, items]) => (
        <div className="card" key={cat} style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">{cat}</span></div>
          {items.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label || c.key}</div>
                {c.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.description}</div>}
              </div>
              <input className="form-input" style={{ width: 200 }} value={edited[c.key] !== undefined ? edited[c.key] : c.value}
                onChange={e => setEdited({ ...edited, [c.key]: e.target.value })} />
              {edited[c.key] !== undefined && <button className="btn btn-primary btn-sm" onClick={() => saveConfig(c.key)}><HiSave /></button>}
            </div>
          ))}
        </div>
      ))}

      {tab === 'users' && (
        <div className="card">
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-purple">{u.role}</span></td>
                <td><span className={`badge badge-${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                <td><button className="btn btn-outline btn-sm" onClick={() => toggleUser(u.id)}>{u.is_active ? 'Disable' : 'Enable'}</button></td>
              </tr>
            ))}</tbody></table></div>
        </div>
      )}
    </div>
  );
}
