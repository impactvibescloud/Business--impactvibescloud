import React, { useState } from "react";
import '../dashboard/dashboard.css';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from "@coreui/react";
import CIcon from '@coreui/icons-react';
import { cilPhone, cilMinus, cilPeople, cilChart } from '@coreui/icons';
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
);

function WidgetsDropdown({ agents, agentStatuses, callStats, breakTimeAgentDetails = [], totalBreakTime = 0 }) {
  const [timeFilter] = useState('today');

  const getAgentStatusData = () => {
    if (agentStatuses && (agentStatuses.active || agentStatuses.deactive || agentStatuses.break)) {
      return {
        active: agentStatuses.active,
        deactive: agentStatuses.deactive,
        break: agentStatuses.break,
        total: agentStatuses.active + agentStatuses.deactive + agentStatuses.break,
      };
    }
    // If caller didn't pass agent counts, use sample values (Total 9, Active 9, Inactive 0, Break 0)
    if (agents === undefined || agents === null) {
      return { active: 9, deactive: 0, break: 0, total: 9 };
    }

    const totalAgents = agents || 0;
    const activeAgents = Math.floor(totalAgents * 0.6);
    const deactiveAgents = Math.floor(totalAgents * 0.25);
    const breakAgents = totalAgents - activeAgents - deactiveAgents;

    return {
      active: activeAgents,
      deactive: deactiveAgents,
      break: breakAgents,
      total: totalAgents,
    };
  };

  const agentStatus = getAgentStatusData();

  const getCallData = () => {
    if (callStats && callStats.totalCalls !== undefined) return callStats;
    switch (timeFilter) {
      case 'today':
        return { totalCalls: 850, liveCalls: 12, outboundCalls: 420, inboundCalls: 380, missedCalls: 32, rejectedCalls: 18, callsPerDay: 850 };
      case '7days':
        return { totalCalls: 5250, liveCalls: 8, outboundCalls: 2800, inboundCalls: 2200, missedCalls: 180, rejectedCalls: 70, callsPerDay: 750 };
      case 'month':
        return { totalCalls: 18500, liveCalls: 15, outboundCalls: 9800, inboundCalls: 8200, missedCalls: 420, rejectedCalls: 280, callsPerDay: 617 };
      case 'custom':
        return { totalCalls: 1200, liveCalls: 5, outboundCalls: 650, inboundCalls: 520, missedCalls: 45, rejectedCalls: 25, callsPerDay: 400 };
      default:
        return { totalCalls: 850, liveCalls: 12, outboundCalls: 420, inboundCalls: 380, missedCalls: 32, rejectedCalls: 18, callsPerDay: 850 };
    }
  };

  const callData = getCallData();

  const downloadCDR = (format) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const timeFilterText = timeFilter === 'today' ? 'Current Day' : timeFilter === '7days' ? '7 Days' : timeFilter === 'month' ? 'Month' : 'Custom Range';
    const reportData = [
      ['Call Statistics Report'],
      ['Generated on:', new Date().toLocaleString()],
      ['Period:', timeFilterText],
      [''],
      ['Call Type', 'Count', 'Percentage'],
      ['Total Calls', callData.totalCalls, '100%'],
      ['Outbound Calls', callData.outboundCalls, ((callData.outboundCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Inbound Calls', callData.inboundCalls, ((callData.inboundCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Missed Calls', callData.missedCalls, ((callData.missedCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Calls per Day', callData.callsPerDay, '-'],
    ];

    if (format === 'csv') {
      const csvContent = reportData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `call_statistics_${currentDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      const xlsxContent = reportData.map(row => row.join('\t')).join('\n');
      const blob = new Blob([xlsxContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `call_statistics_${currentDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <CRow className="mb-4">
        <CCol lg={4} md={4} sm={12} className="mb-3">
          <CCard className="soft-card h-100" style={{ aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', backgroundColor: '#FBFCFE', border: '1px solid #E6E9F0', borderRadius: 12 }}>
            <CCardHeader className="soft-card-header p-2" style={{ background: 'transparent', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' }}><CIcon icon={cilPeople} className="me-2" style={{ color: '#9CA3AF' }} />Agent Statistics</span>
            </CCardHeader>
            <CCardBody style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%' }}>
                <div className="d-flex flex-column" style={{ gap: 12 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Total</span>
                    <span style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{agents || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Active</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{agentStatus.active}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Inactive</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{agentStatus.deactive}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Break</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{agentStatus.break}</span>
                  </div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} md={4} sm={12} className="mb-3">
          <CCard className="soft-card h-100" style={{ aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', backgroundColor: '#FBFCFE', border: '1px solid #E6E9F0', borderRadius: 12 }}>
            <CCardHeader className="soft-card-header p-2" style={{ background: 'transparent', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' }}><CIcon icon={cilPhone} className="me-2" style={{ color: '#9CA3AF' }} />Call Statistics</span>
            </CCardHeader>
            <CCardBody style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%' }}>
                <div className="d-flex flex-column" style={{ gap: 12 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Total</span>
                    <span style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{callData.totalCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Outbound</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{callData.outboundCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Inbound</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{callData.inboundCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#0f172a', fontSize: '0.95rem' }}>Missed</span>
                    <span style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>{callData.missedCalls}</span>
                  </div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} md={4} sm={12} className="mb-3">
          <CCard className="soft-card h-100" style={{ aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', backgroundColor: '#FBFCFE', border: '1px solid #E6E9F0', borderRadius: 12 }}>
            <CCardHeader className="soft-card-header p-2" style={{ background: 'transparent', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.95rem' }}><CIcon icon={cilChart} className="me-2" style={{ color: '#9CA3AF' }} />Call Statistics</span>
            </CCardHeader>
            <CCardBody style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%' }}>
                  <Bar
                    data={{
                      labels: ['Total', 'Outbound', 'Inbound', 'Missed'],
                      datasets: [{
                        label: 'Calls',
                        data: [callData.totalCalls, callData.outboundCalls, callData.inboundCalls, callData.missedCalls],
                        backgroundColor: ['#E9EEF6', '#E9EEF6', '#E9EEF6', '#E9EEF6'],
                        borderColor: '#D1D9E6',
                        borderWidth: 0,
                        borderRadius: 6,
                        barThickness: 16
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15,23,42,0.9)',
                          padding: 8,
                          cornerRadius: 6,
                          callbacks: {
                            label: function(context) { return `${context.parsed.y} calls`; }
                          }
                        }
                      },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.04)' }, ticks: { color: '#6b7280' } },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
                      }
                    }}
                  />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Break Time Agents Section - Only show if there are agents on break */}
      {agentStatus.break > 0 && (
        <CRow className="mb-4">
          <CCol lg={12}>
            <CCard style={{ borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: 'none' }}>
              <CCardHeader className="soft-card-header">
                  <h6 className="mb-0" style={{ color: '#495057', fontWeight: '600' }}>
                    <CIcon icon={cilMinus} className="me-2" style={{ color: '#ffc107' }} />
                    Break Time Agents ({agentStatus.break})
                  </h6>
                </CCardHeader>
                <CCardBody>
                <CRow>
                  <CCol>
                    <div className="d-flex align-items-center mb-3">
                      <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '8px' }} className="me-3">
                        <CIcon icon={cilMinus} style={{ color: '#ffc107' }} />
                      </div>
                      <div>
                        <h6 className="mb-0" style={{ color: '#333', fontWeight: '600' }}>Current agents on break</h6>
                        <small style={{ color: '#6c757d' }}>
                          Data refreshes automatically every minute
                        </small>
                      </div>
                    </div>
                    {breakTimeAgentDetails && breakTimeAgentDetails.length > 0 ? (
                      <CTable small hover responsive>
                        <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                          <CTableRow>
                            <CTableHeaderCell style={{ fontWeight: '600', color: '#495057' }}>Agent</CTableHeaderCell>
                            <CTableHeaderCell style={{ fontWeight: '600', color: '#495057' }}>Start Time</CTableHeaderCell>
                            <CTableHeaderCell style={{ fontWeight: '600', color: '#495057' }}>Duration</CTableHeaderCell>
                            <CTableHeaderCell style={{ fontWeight: '600', color: '#495057' }}>Status</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {breakTimeAgentDetails.slice(0, 5).map((agent, index) => (
                            <CTableRow key={agent.id || index}>
                              <CTableDataCell style={{ color: '#212529' }}>{agent.name}</CTableDataCell>
                              <CTableDataCell style={{ color: '#495057' }}>
                                {agent.startTime ? new Date(agent.startTime).toLocaleTimeString() : 'N/A'}
                              </CTableDataCell>
                              <CTableDataCell style={{ color: '#495057' }}>
                                {agent.duration !== undefined ? `${agent.duration} min` : 'N/A'}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color="warning">On Break</CBadge>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                          {breakTimeAgentDetails.length > 5 && (
                            <CTableRow>
                              <CTableDataCell colSpan={4} className="text-center">
                                <small style={{ color: '#6c757d' }}>
                                  + {breakTimeAgentDetails.length - 5} more agents on break
                                </small>
                              </CTableDataCell>
                            </CTableRow>
                          )}
                        </CTableBody>
                      </CTable>
                    ) : (
                      <div className="text-center py-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <p className="mb-0" style={{ color: '#495057' }}>
                          {agentStatus.break} agent(s) currently on break
                        </p>
                      </div>
                    )}
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  );
}

export default WidgetsDropdown;