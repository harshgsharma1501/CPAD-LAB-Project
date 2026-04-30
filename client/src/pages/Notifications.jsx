import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiBell } from 'react-icons/hi';

export default function Notifications() {
  const [data, setData] = useState({ notifications: [], unread_count: 0 });
  const load = () => api.get('/notifications').then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const typeIcon = { 'Fee Due': '💰', 'Maintenance': '🔧', 'Announcement': '📢', 'Alert': '⚠️', 'System': '⚙️', 'Welcome': '👋' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Notifications</div><div className="page-subtitle">{data.unread_count} unread</div></div>
        <button className="btn btn-outline" onClick={() => { api.put('/notifications/read-all'); load(); }}>Mark All Read</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {data.notifications.length === 0 ? (
          <div className="empty-state"><HiBell size={48} /><p>No notifications</p></div>
        ) : data.notifications.map(n => (
          <div key={n.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start', background: !n.is_read ? 'var(--accent-light)' : 'transparent', cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => !n.is_read && markRead(n.id)}>
            <span style={{ fontSize: 24, minWidth: 32 }}>{typeIcon[n.type] || '📌'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', gap: 12 }}>
                <span className={`badge badge-${n.type === 'Alert' ? 'danger' : n.type === 'Fee Due' ? 'warning' : 'info'}`} style={{ fontSize: 10 }}>{n.type}</span>
                <span>{n.created_at}</span>
              </div>
            </div>
            {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 6 }}></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
