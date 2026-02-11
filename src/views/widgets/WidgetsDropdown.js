import React, { useState } from "react";
import {
  CRow,
  CCol,
  CWidgetStatsA,
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CInputGroup,
  CFormInput,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge
} from "@coreui/react";
import CIcon from '@coreui/icons-react';
import { cilPhone, cilCheckCircle, cilArrowRight, cilMinus, cilX, cilPeople, cilCalendar, cilCloudDownload, cilChart } from '@coreui/icons';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

function WidgetsDropdown({ agents, agentStatuses, callStats, breakTimeAgentDetails = [], totalBreakTime = 0 }) {
  const [timeFilter, setTimeFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Use real agent status data or fallback to calculated values
  const getAgentStatusData = () => {
    if (agentStatuses && (agentStatuses.active || agentStatuses.deactive || agentStatuses.break)) {
      return {
        active: agentStatuses.active,
        deactive: agentStatuses.deactive,
        break: agentStatuses.break,
        total: agentStatuses.active + agentStatuses.deactive + agentStatuses.break
      };
    }
    
    // Fallback calculation if no real data available
    const totalAgents = agents || 0;
    const activeAgents = Math.floor(totalAgents * 0.6);
    const deactiveAgents = Math.floor(totalAgents * 0.25);
    const breakAgents = totalAgents - activeAgents - deactiveAgents;
    
    return {
      active: activeAgents,
      deactive: deactiveAgents,
      break: breakAgents,
      total: totalAgents
    };
  };

  const agentStatus = getAgentStatusData();

  // Use real call stats from props or use sample data based on filters
  const getCallData = () => {
    // If real call stats data is provided, use it
    if (callStats && callStats.totalCalls !== undefined) {
      return callStats;
    }
    
    // Fallback to sample data if no real data available
    switch (timeFilter) {
      case 'today':
        return {
          totalCalls: 850,
          liveCalls: 12,
          outboundCalls: 420,
          inboundCalls: 380,
          missedCalls: 32,
          rejectedCalls: 18,
          callsPerDay: 850
        };
      case '7days':
        return {
          totalCalls: 5250,
          liveCalls: 8,
          outboundCalls: 2800,
          inboundCalls: 2200,
          missedCalls: 180,
          rejectedCalls: 70,
          callsPerDay: 750
        };
      case 'month':
        return {
          totalCalls: 18500,
          liveCalls: 15,
          outboundCalls: 9800,
          inboundCalls: 8200,
          missedCalls: 420,
          rejectedCalls: 280,
          callsPerDay: 617
        };
      case 'custom':
        return {
          totalCalls: 1200,
          liveCalls: 5,
          outboundCalls: 650,
          inboundCalls: 520,
          missedCalls: 45,
          rejectedCalls: 25,
          callsPerDay: 400
        };
      default:
        return {
          totalCalls: 850,
          liveCalls: 12,
          outboundCalls: 420,
          inboundCalls: 380,
          missedCalls: 32,
          rejectedCalls: 18,
          callsPerDay: 850
        };
    }
  };

  const callData = getCallData();

  // Download CDR function
  const downloadCDR = (format) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const timeFilterText = timeFilter === 'today' ? 'Current Day' : 
                          timeFilter === '7days' ? '7 Days' : 
                          timeFilter === 'month' ? 'Month' : 'Custom Range';
    
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
      ['Calls per Day', callData.callsPerDay, '-']
    ];

    if (format === 'csv') {
      const csvContent = reportData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `call_statistics_${currentDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      // For Excel format, we'll create a simple tab-separated values file
      const xlsxContent = reportData.map(row => row.join('\t')).join('\n');
      const blob = new Blob([xlsxContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `call_statistics_${currentDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const pieChartData = {
    labels: ['Outbound Calls', 'Inbound Calls', 'Missed Calls'],
    datasets: [
      {
        data: [
          Math.max(callData.outboundCalls, 0), 
          Math.max(callData.inboundCalls, 0), 
          Math.max(callData.missedCalls, 0)
        ],
        backgroundColor: [
          '#f9b115', // Outbound Calls - Orange
          '#39f',    // Inbound Calls - Blue
          '#e55353'  // Missed Calls - Red
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          usePointStyle: true,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
  return (
    <>
      {/* Stats List on Left, Charts on Right */}
      <CRow className="mb-4">
        <CCol lg={3}>
          <CCard style={{ borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: 'none' }} className="h-100">
            <CCardBody className="p-3">
              {/* Agent Statistics Section */}
              <div className="mb-3">
                <h6 className="mb-2 fw-semibold" style={{ fontSize: '0.85rem', color: '#495057' }}>
                  <CIcon icon={cilPeople} className="me-2" style={{ color: '#6c757d' }} />Agent Statistics
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#495057', fontSize: '0.85rem' }}>Total</span>
                    <span style={{ color: '#212529', fontSize: '0.9rem', fontWeight: '600' }}>{agents || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#28a745', fontSize: '0.85rem' }}>Active</span>
                    <span style={{ color: '#28a745', fontSize: '0.9rem', fontWeight: '600' }}>{agentStatus.active}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>Inactive</span>
                    <span style={{ color: '#dc3545', fontSize: '0.9rem', fontWeight: '600' }}>{agentStatus.deactive}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1">
                    <span style={{ color: '#ffc107', fontSize: '0.85rem' }}>Break</span>
                    <span style={{ color: '#e0a800', fontSize: '0.9rem', fontWeight: '600' }}>{agentStatus.break}</span>
                  </div>
                </div>
              </div>
              
              {/* Call Statistics Section */}
              <div>
                <h6 className="mb-2 fw-semibold" style={{ fontSize: '0.85rem', color: '#495057' }}>
                  <CIcon icon={cilPhone} className="me-2" style={{ color: '#6c757d' }} />Call Statistics
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#495057', fontSize: '0.85rem' }}>Total</span>
                    <span style={{ color: '#212529', fontSize: '0.9rem', fontWeight: '600' }}>{callData.totalCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#fd7e14', fontSize: '0.85rem' }}>Outbound</span>
                    <span style={{ color: '#fd7e14', fontSize: '0.9rem', fontWeight: '600' }}>{callData.outboundCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#28a745', fontSize: '0.85rem' }}>Inbound</span>
                    <span style={{ color: '#28a745', fontSize: '0.9rem', fontWeight: '600' }}>{callData.inboundCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ borderColor: '#f1f3f4' }}>
                    <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>Missed</span>
                    <span style={{ color: '#dc3545', fontSize: '0.9rem', fontWeight: '600' }}>{callData.missedCalls}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-1">
                    <span style={{ color: '#495057', fontSize: '0.85rem' }}>Per Day</span>
                    <span style={{ color: '#212529', fontSize: '0.9rem', fontWeight: '600' }}>{callData.callsPerDay}</span>
                  </div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={9}>
          <CCard style={{ borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: 'none' }} className="h-100">
            <CCardHeader style={{ backgroundColor: '#fff', borderBottom: '1px solid #e9ecef', borderRadius: '12px 12px 0 0' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {/* Time filter removed - charts show current data */}
                </div>
                <div className="d-flex gap-2">
                  <CButton 
                    color="outline-primary" 
                    size="sm"
                    onClick={() => downloadCDR('csv')}
                    title="Download as CSV"
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    CSV
                  </CButton>
                  <CButton 
                    color="outline-success" 
                    size="sm"
                    onClick={() => downloadCDR('xlsx')}
                    title="Download as Excel"
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Excel
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Charts Section - Bar Chart (Left) and Line Chart (Right) */}
              <CRow>
                {/* Bar Chart - Call Statistics */}
                <CCol lg={6}>
                  <div className="mb-3">
                    <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600', fontSize: '0.9rem' }}>Call Statistics</h6>
                    <div style={{ height: '280px' }}>
                      <Bar 
                        data={{
                          labels: ['Total', 'Outbound', 'Inbound', 'Missed'],
                          datasets: [{
                            label: 'Calls',
                            data: [callData.totalCalls, callData.outboundCalls, callData.inboundCalls, callData.missedCalls],
                            backgroundColor: ['#4A9AF8', '#4A9AF8', '#4A9AF8', '#4A9AF8'],
                            borderRadius: 4,
                            barThickness: 40
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: '#343a40',
                              padding: 10,
                              cornerRadius: 4,
                              callbacks: {
                                label: function(context) {
                                  return `${context.parsed.y} calls`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: '#e9ecef'
                              },
                              ticks: {
                                color: '#6c757d'
                              }
                            },
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                color: '#495057'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </CCol>

                {/* Line Chart - Call Trend */}
                <CCol lg={6}>
                  <div className="mb-3">
                    <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600', fontSize: '0.9rem' }}>Call Trend (Todays)</h6>
                    <div style={{ height: '280px' }}>
                      <Line
                          data={{
                            labels: (callData && callData.trend && Array.isArray(callData.trend.labels) && callData.trend.labels.length > 0) ? callData.trend.labels : ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
                            datasets: [
                              {
                                label: 'Outbound',
                                data: (callData && callData.trend && Array.isArray(callData.trend.outbound)) ? callData.trend.outbound : [5, 12, 18, 15, 22, 19, 14, 8],
                                borderColor: '#4A9AF8',
                                backgroundColor: 'transparent',
                                tension: 0.3,
                                fill: false,
                                pointRadius: 3,
                                pointBackgroundColor: '#4A9AF8',
                                borderWidth: 2
                              },
                              {
                                label: 'Inbound',
                                data: (callData && callData.trend && Array.isArray(callData.trend.inbound)) ? callData.trend.inbound : [3, 8, 12, 10, 15, 13, 9, 5],
                                borderColor: '#8ED081',
                                backgroundColor: 'transparent',
                                tension: 0.3,
                                fill: false,
                                pointRadius: 3,
                                pointBackgroundColor: '#8ED081',
                                borderWidth: 2
                              },
                              {
                                label: 'Missed',
                                data: (callData && callData.trend && Array.isArray(callData.trend.missed)) ? callData.trend.missed : [2, 4, 6, 5, 8, 7, 4, 3],
                                borderColor: '#3399ff',
                                backgroundColor: 'transparent',
                                tension: 0.3,
                                fill: false,
                                pointRadius: 3,
                                pointBackgroundColor: '#3399ff',
                                borderWidth: 2,
                                borderDash: [5, 5]
                              }
                            ]
                          }}
                          options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 15,
                                color: '#495057',
                                font: {
                                  size: 11
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: '#343a40',
                              padding: 10,
                              cornerRadius: 4
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: '#e9ecef'
                              },
                              ticks: {
                                color: '#6c757d'
                              }
                            },
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                color: '#495057'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Break Time Agents Section - Only show if there are agents on break */}
      {agentStatus.break > 0 && (
        <CRow className="mb-4">
          <CCol lg={12}>
            <CCard style={{ borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: 'none' }}>
              <CCardHeader style={{ backgroundColor: '#fff', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #e9ecef' }}>
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

export default WidgetsDropdown


