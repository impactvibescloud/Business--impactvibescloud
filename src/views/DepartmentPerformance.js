import React, { useEffect, useState } from 'react';
import { apiCall } from '../config/api';
import {
  CCard,
  CCardBody,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormSelect,
} from '@coreui/react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const DepartmentPerformance = () => {
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
        const res = await apiCall(`/performance/departments?businessId=${user.businessId}&period=${period}`, 'GET');
        const departments = Array.isArray(res) ? res : (res.data || res.departments || []);
        setData(departments);
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId, period, token]);

  const barData = {
    labels: data.map((d) => d.departmentName || d.name || d.departmentId),
    datasets: [
      {
        label: 'Handled Calls',
        data: data.map((d) => d.handledCalls || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Logged Hours',
        data: data.map((d) => d.loggedHours || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const pieData = {
    labels: data.map((d) => d.departmentName || d.name || d.departmentId),
    datasets: [
      {
        label: 'Handled Calls',
        data: data.map((d) => d.handledCalls || 0),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#C9CBCF',
        ],
      },
    ],
  };

  return (
    <div className="department-performance-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Department Performance ({period.charAt(0).toUpperCase() + period.slice(1)})</h2>
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
          {loading ? (
            <CSpinner color="primary" />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 520px', maxWidth: 520, minWidth: 300, height: 320 }}>
                  <div style={{ height: '100%' }}>
                    <Bar
                      data={barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: { y: { beginAtZero: true } },
                      }}
                    />
                  </div>
                </div>

                <div style={{ flex: '0 1 260px', maxWidth: 260, minWidth: 200, height: 320 }}>
                  <div style={{ height: '100%' }}>
                    <Pie
                      data={pieData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>

              <CTable hover responsive className="mt-4">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Department Name</CTableHeaderCell>
                    <CTableHeaderCell>Members</CTableHeaderCell>
                    <CTableHeaderCell>Handled Calls</CTableHeaderCell>
                    <CTableHeaderCell>Logged Hours</CTableHeaderCell>
                    <CTableHeaderCell>Presence %</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data.map((dept) => (
                    <CTableRow key={dept.departmentId || dept._id || dept.departmentName}>
                      <CTableDataCell>{dept.departmentName}</CTableDataCell>
                      <CTableDataCell>{dept.membersCount ?? '-'}</CTableDataCell>
                      <CTableDataCell>{dept.handledCalls ?? 0}</CTableDataCell>
                      <CTableDataCell>{dept.loggedHours ?? 0}</CTableDataCell>
                      <CTableDataCell>{dept.presencePercent ?? '-'}</CTableDataCell>
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

export default DepartmentPerformance;
