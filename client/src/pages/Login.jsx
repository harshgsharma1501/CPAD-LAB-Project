import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiLockClosed } from 'react-icons/hi';

const demos = [
  { label: 'Admin', email: 'admin@hostel.edu' },
  { label: 'Warden', email: 'warden@hostel.edu' },
  { label: 'Accounts', email: 'accounts@hostel.edu' },
  { label: 'Student', email: 'student@hostel.edu' },
  { label: 'SysAdmin', email: 'sysadmin@hostel.edu' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const quickLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'demo1234');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card slide-in">
        <div className="login-logo"><HiLockClosed /></div>
        <h1>Smart Hostel MIS</h1>
        <p className="subtitle">Management Information System</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.edu" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="demo-accounts">
          <h3>Quick Demo Login</h3>
          {demos.map(d => (
            <button key={d.email} className="demo-btn" onClick={() => quickLogin(d.email)} disabled={loading}>
              <strong>{d.label}</strong> — {d.email}
            </button>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Password for all: demo1234</p>
        </div>
      </div>
    </div>
  );
}
