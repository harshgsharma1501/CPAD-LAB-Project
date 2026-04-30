import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiHome, HiUsers, HiKey, HiCurrencyRupee, HiChartBar, HiViewGrid, HiShieldExclamation, HiBell, HiCog } from 'react-icons/hi';

const allLinks = [
  { section: 'Main', items: [
    { to: '/', icon: HiHome, label: 'Dashboard', roles: null },
  ]},
  { section: 'Management', items: [
    { to: '/students', icon: HiUsers, label: 'Students', roles: ['admin','warden','sysadmin'] },
    { to: '/rooms', icon: HiKey, label: 'Room Allocation', roles: ['admin','warden','sysadmin'] },
    { to: '/fees', icon: HiCurrencyRupee, label: 'Fee Payment', roles: ['admin','accounts','sysadmin'] },
    { to: '/maintenance', icon: HiCog, label: 'Maintenance', roles: null },
  ]},
  { section: 'Monitoring', items: [
    { to: '/occupancy', icon: HiViewGrid, label: 'Occupancy', roles: ['admin','warden','sysadmin'] },
    { to: '/disciplinary', icon: HiShieldExclamation, label: 'Disciplinary', roles: ['admin','warden','sysadmin'] },
    { to: '/reports', icon: HiChartBar, label: 'Reports', roles: ['admin','warden','sysadmin','accounts'] },
  ]},
  { section: 'System', items: [
    { to: '/notifications', icon: HiBell, label: 'Notifications', roles: null },
    { to: '/admin', icon: HiCog, label: 'Admin Config', roles: ['admin','sysadmin'] },
  ]},
];

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();
  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-brand">
        <div className="logo">H</div>
        {isOpen && (
          <div>
            <h2>Smart Hostel</h2>
            <span>Management System</span>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {allLinks.map(section => {
          const visible = section.items.filter(l => !l.roles || l.roles.includes(user?.role));
          if (!visible.length) return null;
          return (
            <div className="nav-section" key={section.section}>
              {isOpen && <div className="nav-section-title">{section.section}</div>}
              {visible.map(link => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  end={link.to === '/'} 
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  title={!isOpen ? link.label : ''}
                >
                  <link.icon /> 
                  {isOpen && <span>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
