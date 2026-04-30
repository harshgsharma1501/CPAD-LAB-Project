import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import Fees from './pages/Fees';
import Maintenance from './pages/Maintenance';
import Occupancy from './pages/Occupancy';
import Disciplinary from './pages/Disciplinary';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import AdminConfig from './pages/AdminConfig';

const titles = {
  '/': 'Dashboard', '/students': 'Students', '/rooms': 'Room Allocation',
  '/fees': 'Fee Payment', '/maintenance': 'Maintenance', '/occupancy': 'Occupancy',
  '/disciplinary': 'Disciplinary', '/reports': 'Reports', '/notifications': 'Notifications',
  '/admin': 'Admin Config'
};

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Smart Hostel MIS';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <div className={`app-layout ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar isOpen={isSidebarOpen} />
      <div className="main-content">
        <Header title={title} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/occupancy" element={<Occupancy />} />
            <Route path="/disciplinary" element={<Disciplinary />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<AdminConfig />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
