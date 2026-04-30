import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiBell, HiSun, HiMoon, HiLogout, HiMenuAlt2 } from 'react-icons/hi';
import api from '../utils/api';

export default function Header({ title, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notifs, setNotifs] = useState({ notifications: [], unread_count: 0 });
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifs(prev => ({
      ...prev,
      unread_count: Math.max(0, prev.unread_count - 1),
      notifications: prev.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n)
    }));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-icon-btn" onClick={toggleSidebar} style={{ border: 'none', background: 'transparent' }}>
          <HiMenuAlt2 size={22} />
        </button>
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
          {theme === 'dark' ? <HiSun size={18} /> : <HiMoon size={18} />}
        </button>
        <div style={{ position: 'relative' }} ref={ref}>
          <button className="header-icon-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <HiBell size={18} />
            {notifs.unread_count > 0 && <span className="notif-badge">{notifs.unread_count}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                <button className="btn btn-sm btn-outline" onClick={() => { api.put('/notifications/read-all'); setNotifs(p => ({ ...p, unread_count: 0, notifications: p.notifications.map(n => ({ ...n, is_read: 1 })) })); }}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifs.notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                ) : notifs.notifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`} onClick={() => markRead(n.id)}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{n.type} • {n.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="user-menu" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{user?.name?.[0]}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <HiLogout size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </header>
  );
}
