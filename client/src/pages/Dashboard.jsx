import { useState, useEffect } from 'react';
import api from '../utils/api';
import { HiUsers, HiKey, HiCurrencyRupee, HiCog, HiViewGrid, HiShieldExclamation } from 'react-icons/hi';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9aa0b0', padding: 16, usePointStyle: true } } } };

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/reports').then(r => setStats(r.data)).catch(console.error);
  }, []);

  if (!stats) return <div className="loading"><div className="spinner"></div></div>;

  const kpis = [
    { label: 'Total Students', value: stats.total_students, icon: HiUsers, color: 'purple' },
    { label: 'Occupancy Rate', value: stats.occupancy_percent + '%', icon: HiViewGrid, color: 'green' },
    { label: 'Fee Collected', value: '₹' + (stats.fee_collected / 1000).toFixed(0) + 'K', icon: HiCurrencyRupee, color: 'blue' },
    { label: 'Pending Fees', value: '₹' + (stats.fee_pending / 1000).toFixed(0) + 'K', icon: HiCurrencyRupee, color: 'orange' },
    { label: 'Open Maintenance', value: stats.pending_maintenance, icon: HiCog, color: 'yellow' },
    { label: 'Disciplinary Cases', value: stats.disciplinary_open, icon: HiShieldExclamation, color: 'orange' },
  ];

  const feeChartData = {
    labels: stats.fee_by_status?.map(f => f.status) || [],
    datasets: [{ data: stats.fee_by_status?.map(f => f.total) || [], backgroundColor: ['#00b894', '#fdcb6e', '#e17055', '#74b9ff'], borderWidth: 0 }]
  };

  const maintChartData = {
    labels: stats.maintenance_by_category?.map(m => m.category) || [],
    datasets: [{ label: 'Requests', data: stats.maintenance_by_category?.map(m => m.count) || [], backgroundColor: '#6c5ce7', borderRadius: 6, barThickness: 28 }]
  };

  const deptChartData = {
    labels: stats.students_by_dept?.map(d => d.department) || [],
    datasets: [{ data: stats.students_by_dept?.map(d => d.count) || [], backgroundColor: ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff'], borderWidth: 0 }]
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-subtitle">Overview of hostel operations</div></div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className={`kpi-icon ${k.color}`}><k.icon /></div>
            <div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Fee Collection Status</span></div>
          <div className="chart-container"><Doughnut data={feeChartData} options={chartOpts} /></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Maintenance by Category</span></div>
          <div className="chart-container"><Bar data={maintChartData} options={{ ...chartOpts, scales: { x: { ticks: { color: '#9aa0b0' }, grid: { display: false } }, y: { ticks: { color: '#9aa0b0' }, grid: { color: '#2a2d3e' } } } }} /></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Students by Department</span></div>
          <div className="chart-container"><Doughnut data={deptChartData} options={chartOpts} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Payments</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>Student</th><th>Fee</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {stats.recent_payments?.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.student_name}</td>
                    <td>{p.fee_name}</td>
                    <td>₹{p.amount?.toLocaleString()}</td>
                    <td><span className={`badge badge-${p.status === 'Paid' ? 'success' : p.status === 'Overdue' ? 'danger' : 'warning'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Maintenance</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>Student</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {stats.recent_maintenance?.map(m => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.student_name}</td>
                    <td>{m.category}</td>
                    <td><span className={`badge badge-${m.priority === 'Urgent' ? 'danger' : m.priority === 'High' ? 'warning' : 'info'}`}>{m.priority}</span></td>
                    <td><span className={`badge badge-${m.status === 'Resolved' || m.status === 'Closed' ? 'success' : m.status === 'In Progress' ? 'info' : 'warning'}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
