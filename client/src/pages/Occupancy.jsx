import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiViewGrid } from 'react-icons/hi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Occupancy() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/occupancy').then(r => setData(r.data)); }, []);
  if (!data) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header"><div><div className="page-title">Real-Time Occupancy Dashboard</div><div className="page-subtitle">Live hostel occupancy data</div></div></div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card"><div className="kpi-icon purple"><HiViewGrid /></div><div><div className="kpi-value">{data.overall.total_rooms}</div><div className="kpi-label">Total Rooms</div></div></div>
        <div className="kpi-card"><div className="kpi-icon blue"><HiViewGrid /></div><div><div className="kpi-value">{data.overall.total_capacity}</div><div className="kpi-label">Total Capacity</div></div></div>
        <div className="kpi-card"><div className="kpi-icon green"><HiViewGrid /></div><div><div className="kpi-value">{data.overall.occupancy_percent}%</div><div className="kpi-label">Occupancy Rate</div></div></div>
        <div className="kpi-card"><div className="kpi-icon orange"><HiViewGrid /></div><div><div className="kpi-value">{data.overall.vacancy}</div><div className="kpi-label">Vacant Beds</div></div></div>
      </div>
      <div className="grid-2">
        {data.hostels.map(h => (
          <div className="card" key={h.id}>
            <div className="card-header">
              <span className="card-title">{h.name}</span>
              <span className="badge badge-purple">{h.type}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 160, height: 160 }}>
                <Doughnut data={{
                  labels: ['Occupied', 'Vacant'],
                  datasets: [{ data: [h.current_occupancy, h.total_capacity - h.current_occupancy], backgroundColor: ['#6c5ce7', '#2a2d3e'], borderWidth: 0 }]
                }} options={{ responsive: true, maintainAspectRatio: true, cutout: '70%', plugins: { legend: { display: false } } }} />
              </div>
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>Warden:</span> {h.warden_name || 'N/A'}</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>Rooms:</span> {h.total_rooms}</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>Capacity:</span> {h.total_capacity}</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>Occupied:</span> {h.current_occupancy}</div>
                <div style={{ marginBottom: 12 }}><span style={{ color: 'var(--text-muted)' }}>Rate:</span> <strong style={{ color: h.occupancy_percent > 80 ? 'var(--danger)' : 'var(--success)' }}>{h.occupancy_percent}%</strong></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {h.room_status?.map(rs => <span key={rs.status} className={`badge badge-${rs.status === 'Available' ? 'success' : rs.status === 'Occupied' ? 'danger' : rs.status === 'Partial' ? 'warning' : 'muted'}`}>{rs.status}: {rs.count}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
