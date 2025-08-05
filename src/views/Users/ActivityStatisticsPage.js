import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CProgress,
  CProgressBar
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilReload } from '@coreui/icons';
import { useUserActivity } from '../../context/UserActivityContext';
import { UserStatusBadge } from '../../components/UserActivityStatus';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { isAutheticated } from '../../auth.js';

// Import Chart.js components
import { 
  CChartBar, 
  CChartDoughnut,
  CChartLine
} from '@coreui/react-chartjs';

const ActivityStatisticsPage = () => {
  const { fetchActivityStatistics, loading, error } = useUserActivity();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [statistics, setStatistics] = useState(null);
  const token = isAutheticated();

  // Colors for charts
  const statusColors = {
    online: '#2eb85c',    // Green
    busy: '#e55353',      // Red
    away: '#f9b115',      // Yellow
    lunch: '#3399ff',     // Blue
    break: '#d4d7dd',     // Gray
    meeting: '#6f42c1',   // Purple
    offline: '#636f83'    // Dark Gray
  };

  // Status labels mapping
  const statusLabels = {
    online: 'Online',
    busy: 'Busy',
    away: 'Away',
    lunch: 'Lunch',
    break: 'Break',
    meeting: 'Meeting',
    offline: 'Offline'
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/v1/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
    
    // Initial statistics fetch
    handleFetchStatistics();
  }, []);

  // Fetch statistics based on filters
  const handleFetchStatistics = async () => {
    try {
      const statsData = await fetchActivityStatistics(startDate, endDate, selectedUser);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  // Handle user selection change
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Generate labels and datasets for status distribution chart
  const generateStatusDistributionData = () => {
    if (!statistics || !statistics.statusDistribution) return { labels: [], datasets: [] };
    
    const labels = Object.keys(statistics.statusDistribution).map(status => statusLabels[status] || status);
    const data = Object.keys(statistics.statusDistribution).map(status => statistics.statusDistribution[status]);
    const backgroundColor = Object.keys(statistics.statusDistribution).map(status => statusColors[status] || '#636f83');
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          hoverBackgroundColor: backgroundColor.map(color => adjustBrightness(color, -20))
        }
      ]
    };
  };

  // Generate labels and datasets for daily activity chart
  const generateDailyActivityData = () => {
    if (!statistics || !statistics.dailyActivity) return { labels: [], datasets: [] };
    
    const dates = Object.keys(statistics.dailyActivity);
    const statusTypes = Object.keys(statusColors);
    
    const datasets = statusTypes.map(status => ({
      label: statusLabels[status] || status,
      backgroundColor: hexToRgba(statusColors[status] || '#636f83', 0.2),
      borderColor: statusColors[status] || '#636f83',
      pointBackgroundColor: statusColors[status] || '#636f83',
      pointHoverBackgroundColor: '#fff',
      borderWidth: 2,
      data: dates.map(date => 
        (statistics.dailyActivity[date][status] || 0) / 60 // Convert minutes to hours
      )
    }));
    
    return {
      labels: dates.map(date => formatDate(date)),
      datasets
    };
  };

  // Generate labels and datasets for productivity chart
  const generateProductivityData = () => {
    if (!statistics || !statistics.productivityScore) return { labels: [], datasets: [] };
    
    const dates = Object.keys(statistics.productivityScore);
    
    return {
      labels: dates.map(date => formatDate(date)),
      datasets: [
        {
          label: 'Productivity Score (%)',
          backgroundColor: hexToRgba('#3399ff', 0.2),
          borderColor: '#3399ff',
          pointBackgroundColor: '#3399ff',
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dates.map(date => statistics.productivityScore[date])
        }
      ]
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to adjust color brightness
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    return `#${(
      0x1000000 +
      (Math.min(Math.max(r, 0), 255)) * 0x10000 +
      (Math.min(Math.max(g, 0), 255)) * 0x100 +
      (Math.min(Math.max(b, 0), 255))
    ).toString(16).slice(1)}`;
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Format time for display (convert minutes to hours and minutes)
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  return (
    <div className="activity-statistics-page">
      <CCard className="mb-4">
        <CCardHeader>
          <h5>Activity Statistics</h5>
          <p className="text-medium-emphasis small">
            View productivity and status distribution statistics
          </p>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CForm className="mb-4">
            <CRow>
              <CCol md={3}>
                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <div className="date-picker-container">
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilCalendar} />
                      </CInputGroupText>
                      <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={endDate}
                        dateFormat="MMMM d, yyyy"
                        className="form-control"
                      />
                    </CInputGroup>
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <div className="date-picker-container">
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilCalendar} />
                      </CInputGroupText>
                      <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="MMMM d, yyyy"
                        className="form-control"
                      />
                    </CInputGroup>
                  </div>
                </div>
              </CCol>
              <CCol md={4}>
                <CFormSelect 
                  label="User"
                  value={selectedUser}
                  onChange={handleUserChange}
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <CButton 
                  color="primary" 
                  className="px-4 w-100"
                  onClick={handleFetchStatistics}
                  disabled={loading}
                >
                  {loading ? (
                    <CSpinner size="sm" />
                  ) : (
                    <>
                      <CIcon icon={cilReload} className="me-2" />
                      Apply
                    </>
                  )}
                </CButton>
              </CCol>
            </CRow>
          </CForm>
          
          {/* Error alert */}
          {error && (
            <CAlert color="danger" className="mb-4">
              {error}
            </CAlert>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="text-center my-5">
              <CSpinner color="primary" />
            </div>
          )}
          
          {/* Statistics summary */}
          {!loading && statistics && (
            <>
              {/* Summary cards */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <CCard className="mb-3">
                    <CCardBody className="text-center">
                      <div className="h4 mb-0">{statistics.totalStatusChanges}</div>
                      <div className="small text-medium-emphasis">Status Changes</div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="mb-3">
                    <CCardBody className="text-center">
                      <div className="h4 mb-0">
                        {statistics.averageProductivity ? `${statistics.averageProductivity}%` : 'N/A'}
                      </div>
                      <div className="small text-medium-emphasis">Avg. Productivity</div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="mb-3">
                    <CCardBody className="text-center">
                      <div className="h4 mb-0">
                        {formatTime(statistics.totalActiveTime || 0)}
                      </div>
                      <div className="small text-medium-emphasis">Total Active Time</div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="mb-3">
                    <CCardBody className="text-center">
                      <div className="h4 mb-0">
                        {statistics.mostCommonStatus ? 
                          statusLabels[statistics.mostCommonStatus] || statistics.mostCommonStatus 
                          : 'N/A'}
                      </div>
                      <div className="small text-medium-emphasis">Most Common Status</div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
              
              {/* Status Distribution Chart */}
              <CRow className="mb-4">
                <CCol md={6}>
                  <CCard className="h-100">
                    <CCardHeader>Status Distribution</CCardHeader>
                    <CCardBody>
                      <CChartDoughnut
                        data={generateStatusDistributionData()}
                        options={{
                          aspectRatio: 2,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || '';
                                  const value = context.raw || 0;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = Math.round((value / total) * 100);
                                  return `${label}: ${formatTime(value)} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard className="h-100">
                    <CCardHeader>Time in Each Status</CCardHeader>
                    <CCardBody>
                      {Object.keys(statistics.statusDistribution || {}).map(status => {
                        const minutes = statistics.statusDistribution[status] || 0;
                        const totalMinutes = Object.values(statistics.statusDistribution || {}).reduce((sum, val) => sum + val, 0);
                        const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
                        
                        return (
                          <div key={status} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <div>
                                <UserStatusBadge status={status} />
                              </div>
                              <div>
                                <strong>{formatTime(minutes)}</strong>
                              </div>
                            </div>
                            <CProgress height={10}>
                              <CProgressBar 
                                value={percentage} 
                                color={getStatusColor(status)}
                              />
                            </CProgress>
                          </div>
                        );
                      })}
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
              
              {/* Daily Activity Chart */}
              <CRow className="mb-4">
                <CCol>
                  <CCard>
                    <CCardHeader>Daily Status Duration (Hours)</CCardHeader>
                    <CCardBody>
                      <CChartLine
                        data={generateDailyActivityData()}
                        options={{
                          aspectRatio: 3,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  return `${label}: ${value.toFixed(1)} hours`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                drawOnChartArea: false
                              }
                            },
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Hours'
                              }
                            }
                          },
                          elements: {
                            line: {
                              tension: 0.4
                            },
                            point: {
                              radius: 0,
                              hitRadius: 10,
                              hoverRadius: 4
                            }
                          }
                        }}
                      />
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
              
              {/* Productivity Chart */}
              <CRow>
                <CCol>
                  <CCard>
                    <CCardHeader>Daily Productivity Score</CCardHeader>
                    <CCardBody>
                      <CChartBar
                        data={generateProductivityData()}
                        options={{
                          aspectRatio: 3,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  return `${label}: ${value.toFixed(1)}%`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                drawOnChartArea: false
                              }
                            },
                            y: {
                              beginAtZero: true,
                              max: 100,
                              title: {
                                display: true,
                                text: 'Productivity Score (%)'
                              }
                            }
                          }
                        }}
                      />
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  const colors = {
    online: 'success',
    busy: 'danger',
    away: 'warning',
    lunch: 'info',
    break: 'secondary',
    meeting: 'primary',
    offline: 'dark'
  };
  
  return colors[status] || 'secondary';
};

export default ActivityStatisticsPage;
