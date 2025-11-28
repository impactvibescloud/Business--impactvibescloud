import React, { useEffect, useState } from 'react';
import { apiCall } from '../config/api';
import { CCard, CCardBody, CSpinner, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CFormSelect } from '@coreui/react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const AgentPerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [user, setUser] = useState({});
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (!token) return;
    apiCall('/v1/user/details', 'GET')
      .then((res) => {
        setUser(res.user || res.data?.user || res.user?.user || res.user?.data || res.data || {});
      })
      .catch(() => setUser({}));
  }, [token]);

  useEffect(() => {
    if (!user?.businessId) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const res = await apiCall(`/performance/agents?businessId=${user.businessId}&period=${period}`, 'GET');
        const performanceData = res.data || res.agents || res || [];
        setData(performanceData);
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId, period, token]);

  // Chart data
  const barData = {
    labels: data.map(a => a.agentName),
    datasets: [
      {
        label: 'Handled Calls',
        data: data.map(a => a.handledCalls),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Logged Hours',
        data: data.map(a => a.loggedHours),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      }
    ]
  };

  const pieData = {
    labels: data.map(a => a.agentName),
    datasets: [
      {
        label: 'Handled Calls',
        data: data.map(a => a.handledCalls),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384', '#36A2EB'
        ],
      }
    ]
  };

  return (
    <div className="agent-performance-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Agent Performance ({period.charAt(0).toUpperCase() + period.slice(1)})</h2>
        <div style={{ width: 180 }}>
          <CFormSelect size="sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </CFormSelect>
        </div>
      </div>
      <CCard className="mb-4">
        <CCardBody>
          {loading ? <CSpinner color="primary" /> : (
            <>
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              </div>
              <div style={{ maxWidth: 400, margin: '40px auto' }}>
                <Pie data={pieData} options={{ responsive: true }} />
              </div>
              <CTable hover responsive className="mt-4">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Agent Name</CTableHeaderCell>
                    <CTableHeaderCell>Branch Name</CTableHeaderCell>
                    <CTableHeaderCell>Handled Calls</CTableHeaderCell>
                    <CTableHeaderCell>Logged Hours</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data.map(agent => (
                    <CTableRow key={agent.agentId}>
                      <CTableDataCell>{agent.agentName}</CTableDataCell>
                      <CTableDataCell>{agent.branchName}</CTableDataCell>
                      <CTableDataCell>{agent.handledCalls}</CTableDataCell>
                      <CTableDataCell>{agent.loggedHours}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default AgentPerformance;
