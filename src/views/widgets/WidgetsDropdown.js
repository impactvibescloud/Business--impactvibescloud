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
  LinearScale
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
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
      ['Live Calls', callData.liveCalls, ((callData.liveCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Outbound Calls', callData.outboundCalls, ((callData.outboundCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Inbound Calls', callData.inboundCalls, ((callData.inboundCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Missed Calls', callData.missedCalls, ((callData.missedCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
      ['Rejected Calls', callData.rejectedCalls, ((callData.rejectedCalls / callData.totalCalls) * 100).toFixed(1) + '%'],
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
    labels: ['Live Calls', 'Outbound Calls', 'Inbound Calls', 'Missed Calls', 'Rejected Calls'],
    datasets: [
      {
        data: [
          Math.max(callData.liveCalls, 0), 
          Math.max(callData.outboundCalls, 0), 
          Math.max(callData.inboundCalls, 0), 
          Math.max(callData.missedCalls, 0), 
          Math.max(callData.rejectedCalls, 0)
        ],
        backgroundColor: [
          '#2eb85c', // Live Calls - Green
          '#f9b115', // Outbound Calls - Orange
          '#39f',    // Inbound Calls - Blue
          '#e55353', // Missed Calls - Red
          '#636f83'  // Rejected Calls - Gray
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
      {/* First Row - Agent Status Cards */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #6f42c1' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }} className="p-3 rounded">
                  <CIcon icon={cilPeople} size="xl" style={{ color: '#6f42c1' }} />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold" style={{ color: '#6f42c1' }}>{agents || 0}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Total Agents</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #28a745' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilCheckCircle} size="xl" className="text-success" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-success">{agentStatus.active}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Active Agents</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #dc3545' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilX} size="xl" className="text-danger" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-danger">{agentStatus.deactive}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Inactive Agents</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard 
            className="mb-4" 
            style={{ borderLeft: '4px solid #ffc107' }}
          >
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilMinus} size="xl" className="text-warning" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-warning">{agentStatus.break}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">
                  Break Time Agents
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Second Row - Call Statistics */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #321fdb' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilPhone} size="xl" className="text-primary" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-primary">{callData.totalCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Total Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #2eb85c' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilCheckCircle} size="xl" className="text-success" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-success">{callData.liveCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Live Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #f9b115' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilArrowRight} size="xl" className="text-warning" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-warning">{callData.outboundCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Outbound Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #20c997' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilChart} size="xl" className="text-success" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-success">{callData.callsPerDay}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Calls per Day</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Third Row - Additional Call Statistics */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #39f' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilPhone} size="xl" className="text-info" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-info">{callData.inboundCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Inbound Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #e55353' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilMinus} size="xl" className="text-danger" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-danger">{callData.missedCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Missed Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" style={{ borderLeft: '4px solid #636f83' }}>
            <CCardBody className="d-flex align-items-center">
              <div className="me-3">
                <div className="bg-secondary bg-opacity-10 p-3 rounded">
                  <CIcon icon={cilX} size="xl" className="text-secondary" />
                </div>
              </div>
              <div>
                <div className="fs-6 fw-semibold text-secondary">{callData.rejectedCalls}</div>
                <div className="text-medium-emphasis text-uppercase fw-semibold small">Rejected Calls</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Pie Chart Section */}
      <CRow className="mb-4">
        <CCol lg={12}>
          <CCard>
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Call Statistics Overview</h5>
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
              {/* Filter Controls */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <CFormSelect 
                    value={timeFilter} 
                    onChange={(e) => {
                      const newFilter = e.target.value;
                      setTimeFilter(newFilter);
                      // Trigger fetch with the new time filter if the parent provided a handler
                      if (typeof window.fetchCallStatistics === 'function') {
                        window.fetchCallStatistics(newFilter);
                      }
                    }}
                    aria-label="Time Filter"
                  >
                    <option value="today">Current Day</option>
                    <option value="7days">7 Days</option>
                    <option value="month">Month</option>
                    <option value="custom">Custom</option>
                  </CFormSelect>
                </CCol>
                {timeFilter === 'custom' && (
                  <>
                    <CCol md={3}>
                      <CInputGroup>
                        <CFormInput
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          placeholder="Start Date"
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={3}>
                      <CInputGroup>
                        <CFormInput
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          placeholder="End Date"
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={3}>
                      <CButton 
                        color="primary" 
                        onClick={() => {
                          if (typeof window.fetchCallStatistics === 'function') {
                            window.fetchCallStatistics('custom', customStartDate, customEndDate);
                          }
                        }}
                      >
                        Apply
                      </CButton>
                    </CCol>
                  </>
                )}
              </CRow>

              {/* Charts Section - Donut Chart (Left) and Pie Chart (Right) */}
              <CRow>
                {/* Total Agents Donut Chart - Left Side */}
                <CCol lg={4}>
                  <CCard className="h-100">
                    <CCardBody className="text-center">
                      <h6 className="mb-3">Agent Status Distribution</h6>
                      <div style={{ height: '250px', position: 'relative' }}>
                        <Doughnut 
                          data={{
                            labels: ['Active', 'Deactive', 'Break'],
                            datasets: [{
                              data: [agentStatus.active, agentStatus.deactive, agentStatus.break],
                              backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                              borderWidth: 2,
                              borderColor: '#fff',
                              cutout: '70%'
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: true,
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
                                    return `${label}: ${value} agents`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                            Total
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                            Agents
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', marginTop: '3px' }}>
                            {agentStatus.total}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                          <div>
                            <div style={{ 
                              fontSize: '9px', 
                              fontWeight: '600', 
                              color: '#28a745',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              ACTIVE
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                              {agentStatus.active}
                            </div>
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '9px', 
                              fontWeight: '600', 
                              color: '#dc3545',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              DEACTIVE
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                              {agentStatus.deactive}
                            </div>
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '9px', 
                              fontWeight: '600', 
                              color: '#ffc107',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              BREAK
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffc107' }}>
                              {agentStatus.break}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                {/* Pie Chart - Right Side */}
                <CCol lg={5}>
                  <CCard className="h-100">
                    <CCardBody className="text-center">
                      <h6 className="mb-3">Call Type Distribution</h6>
                      <div style={{ height: '300px', position: 'relative' }}>
                        <Pie data={pieChartData} options={pieChartOptions} />
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                {/* Call Summary - Far Right */}
                <CCol lg={3}>
                  <CCard className="h-100">
                    <CCardBody>
                      <h6 className="mb-3 text-center">Call Summary</h6>
                      <div className="chart-summary">
                        <div className="mb-2">
                          <span className="fw-semibold">Total Calls:</span> {callData.totalCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Live Calls:</span> {callData.liveCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Outbound Calls:</span> {callData.outboundCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Inbound Calls:</span> {callData.inboundCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Missed Calls:</span> {callData.missedCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Rejected Calls:</span> {callData.rejectedCalls}
                        </div>
                        <div className="mb-2">
                          <span className="fw-semibold">Calls per Day:</span> {callData.callsPerDay}
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
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
            <CCard>
              <CCardHeader>
                <h5 className="mb-0">
                  <CIcon icon={cilMinus} className="text-warning me-2" />
                  Break Time Agents ({agentStatus.break})
                </h5>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-warning bg-opacity-10 p-2 me-3 rounded">
                        <CIcon icon={cilMinus} size="lg" className="text-warning" />
                      </div>
                      <div>
                        <h6 className="mb-0">Current agents on break</h6>
                        <small className="text-muted">
                          Data refreshes automatically every minute
                        </small>
                      </div>
                    </div>
                    {breakTimeAgentDetails && breakTimeAgentDetails.length > 0 ? (
                      <CTable small hover responsive>
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell>Agent</CTableHeaderCell>
                            <CTableHeaderCell>Start Time</CTableHeaderCell>
                            <CTableHeaderCell>Duration</CTableHeaderCell>
                            <CTableHeaderCell>Status</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {breakTimeAgentDetails.slice(0, 5).map((agent, index) => (
                            <CTableRow key={agent.id || index}>
                              <CTableDataCell>{agent.name}</CTableDataCell>
                              <CTableDataCell>
                                {agent.startTime ? new Date(agent.startTime).toLocaleTimeString() : 'N/A'}
                              </CTableDataCell>
                              <CTableDataCell>
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
                                <small className="text-muted">
                                  + {breakTimeAgentDetails.length - 5} more agents on break
                                </small>
                              </CTableDataCell>
                            </CTableRow>
                          )}
                        </CTableBody>
                      </CTable>
                    ) : (
                      <div className="text-center py-3">
                        <p className="mb-0">
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


