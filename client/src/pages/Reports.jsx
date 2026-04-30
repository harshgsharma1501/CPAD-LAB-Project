import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Reports() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/reports').then(r => setStats(r.data)); }, []);
  if (!stats) return <div className="loading"><div className="spinner"></div></div>;

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9aa0b0', padding: 16, usePointStyle: true } } } };
  const barOpts = { ...chartOpts, scales: { x: { ticks: { color: '#9aa0b0' }, grid: { display: false } }, y: { ticks: { color: '#9aa0b0' }, grid: { color: '#2a2d3e' } } } };

  return (
    <div className="fade-in">
      <div className="page-header"><div><div className="page-title">Reports & Analytics</div><div className="page-subtitle">Comprehensive data analysis</div></div></div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card"><div className="card-header"><span className="card-title">Fee Collection by Status</span></div>
          <div className="chart-container"><Doughnut data={{ labels: stats.fee_by_status?.map(f => f.status), datasets: [{ data: stats.fee_by_status?.map(f => f.total), backgroundColor: ['#00b894', '#fdcb6e', '#e17055', '#74b9ff'], borderWidth: 0 }] }} options={chartOpts} /></div></div>
        <div className="card"><div className="card-header"><span className="card-title">Students by Department</span></div>
          <div className="chart-container"><Doughnut data={{ labels: stats.students_by_dept?.map(d => d.department), datasets: [{ data: stats.students_by_dept?.map(d => d.count), backgroundColor: ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055'], borderWidth: 0 }] }} options={chartOpts} /></div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><span className="card-title">Maintenance by Category</span></div>
          <div className="chart-container"><Bar data={{ labels: stats.maintenance_by_category?.map(m => m.category), datasets: [{ label: 'Requests', data: stats.maintenance_by_category?.map(m => m.count), backgroundColor: '#6c5ce7', borderRadius: 6 }] }} options={barOpts} /></div></div>
        <div className="card"><div className="card-header"><span className="card-title">Students by Year</span></div>
          <div className="chart-container"><Bar data={{ labels: stats.students_by_year?.map(y => `Year ${y.year}`), datasets: [{ label: 'Students', data: stats.students_by_year?.map(y => y.count), backgroundColor: '#00b894', borderRadius: 6 }] }} options={barOpts} /></div></div>
      </div>
    </div>
  );
}
