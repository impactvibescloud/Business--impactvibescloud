import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CInputGroup,
  CFormInput,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CFormSelect,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart, cilCloudDownload, cilSearch } from '@coreui/icons'
import { apiCall } from '../../config/api'
import './ReportsAnalytics.css'

const ReportsAnalytics = () => {
  // API Configuration for business contact person data logs
  const API_CONFIG = {
    businessContactPersonId: '684fe39ca8254e8906e99aab',
    authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('data-access-logs')
  const [dateRange, setDateRange] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [reportData, setReportData] = useState([])
  const [availableResources, setAvailableResources] = useState([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [businessInfo, setBusinessInfo] = useState({ name: '', totalBranches: 0 })

  // Mock data for demonstration
  const mockCallLogsData = [
    {
      id: 1,
      caller: '+91 9876543210',
      receiver: '+91 8765432109',
      duration: '00:02:45',
      timestamp: '2025-07-22 10:30:00',
      status: 'Completed',
      type: 'Outbound'
    },
    {
      id: 2,
      caller: '+91 7654321098',
      receiver: '+91 6543210987',
      duration: '00:01:23',
      timestamp: '2025-07-22 11:15:00',
      status: 'Missed',
      type: 'Inbound'
    },
    {
      id: 3,
      caller: '+91 5432109876',
      receiver: '+91 4321098765',
      duration: '00:05:12',
      timestamp: '2025-07-22 12:45:00',
      status: 'Completed',
      type: 'Outbound'
    }
  ]

  const mockAgentData = [
    {
      id: 1,
      name: 'John Doe',
      totalCalls: 25,
      completedCalls: 20,
      missedCalls: 5,
      avgDuration: '00:03:45',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      totalCalls: 30,
      completedCalls: 28,
      missedCalls: 2,
      avgDuration: '00:04:12',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Bob Wilson',
      totalCalls: 18,
      completedCalls: 15,
      missedCalls: 3,
      avgDuration: '00:02:58',
      status: 'Break'
    }
  ]

  useEffect(() => {
    fetchReportData()
    // Reset filters when report type changes
    if (reportType !== 'data-access-logs') {
      setResourceFilter('all')
      setRoleFilter('all')
    }
  }, [reportType, dateRange, startDate, endDate, currentPage, itemsPerPage])

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (reportType === 'data-access-logs') {
        // Fetch business data logs with pagination
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          sortBy: 'createdAt',
          order: 'desc',
          ...(dateRange !== 'all' && dateRange !== 'custom' && { dateRange }),
          ...(dateRange === 'custom' && startDate && endDate && { dateFrom: startDate, dateTo: endDate }),
          ...(resourceFilter !== 'all' && { resource: resourceFilter }),
          ...(roleFilter !== 'all' && { role: roleFilter }),
          ...(searchTerm && { search: searchTerm })
        })
        const response = await apiCall(
          `api/data-access-logs/business-logs?${params.toString()}`,
          'GET',
          null,
          {
            'Authorization': API_CONFIG.authToken,
            'Content-Type': 'application/json'
          }
        ).catch(err => {
          console.error('Business contact person data logs API call failed:', err)
          // If the specific API fails, show a more descriptive error
          if (err.response && err.response.status === 401) {
            throw new Error('Authentication failed. Please check the authorization token.')
          } else if (err.response && err.response.status === 404) {
            throw new Error('Business contact person not found or no data available.')
          } else {
            throw new Error('Failed to fetch business contact person data logs.')
          }
        })
        
        if (response?.data?.logs && Array.isArray(response.data.logs)) {
          const dataArray = response.data.logs
          
          // Update total pages from API response
          const totalApiRecords = response.data.pagination?.total || 0
          const totalApiPages = response.data.pagination?.pages || 1
          setTotalRecords(totalApiRecords)
          setApiTotalPages(totalApiPages)
          const processedData = dataArray.map((log) => {
            return {
              id: String(log._id),
              userId: log.user?.email || 'N/A',
              userRole: log.user?.role || 'N/A',
              accessType: log.action,
              resourceAccessed: log.resource,
              timestamp: (() => {
                try {
                  const dateStr = log.createdAt;
                  if (!dateStr) return 'N/A';
                  const date = new Date(dateStr);
                  if (isNaN(date.getTime())) return 'N/A';
                  return date.toLocaleString();
                } catch (e) {
                  return 'N/A';
                }
              })(),
              ipAddress: log.ipAddress,
              status: 'Success'
            }
          })
          
          // Update business info
          if (response.data.businessName || response.data.totalBranches) {
            setBusinessInfo({
              name: response.data.businessName || '',
              totalBranches: response.data.totalBranches || 0
            })
          }
          
          setReportData(processedData)
          
          // Extract unique resources for filter dropdown
          const uniqueResources = [...new Set(processedData.map(item => item.resourceAccessed))]
            .filter(resource => resource !== 'N/A')
            .sort()
          setAvailableResources(uniqueResources)
        } else {
          setReportData([])
          setAvailableResources([])
        }
      } else if (reportType === 'call-logs') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setReportData(mockCallLogsData)
      } else if (reportType === 'agent-performance') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setReportData(mockAgentData)
      } else {
        setReportData([])
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError(err.message || 'Failed to fetch report data. Please try again later.')
      setReportData([])
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 100)
    }
  }

  const handleDownloadReport = () => {
    let csvContent = ''
    let headers = []
    
    if (reportType === 'data-access-logs') {
      headers = ['ID', 'User Email', 'Action', 'Resource', 'Timestamp', 'IP Address']
      csvContent = headers.join(',') + '\n'
      reportData.forEach(row => {
        csvContent += `"${row.id}","${row.userId}","${row.accessType}","${row.resourceAccessed}","${row.timestamp}","${row.ipAddress}"\n`
      })
    } else if (reportType === 'call-logs') {
      headers = ['ID', 'Caller', 'Receiver', 'Duration', 'Timestamp', 'Status', 'Type']
      csvContent = headers.join(',') + '\n'
      reportData.forEach(row => {
        csvContent += `${row.id},"${row.caller}","${row.receiver}","${row.duration}","${row.timestamp}","${row.status}","${row.type}"\n`
      })
    } else if (reportType === 'agent-performance') {
      headers = ['ID', 'Name', 'Total Calls', 'Completed Calls', 'Missed Calls', 'Avg Duration', 'Status']
      csvContent = headers.join(',') + '\n'
      reportData.forEach(row => {
        csvContent += `${row.id},"${row.name}",${row.totalCalls},${row.completedCalls},${row.missedCalls},"${row.avgDuration}","${row.status}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const filteredData = reportType === 'data-access-logs' ? reportData : reportData.filter(item => {
    if (reportType === 'call-logs') {
      const caller = String(item.caller || '').toLowerCase()
      const receiver = String(item.receiver || '').toLowerCase()
      const status = String(item.status || '').toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      
      return caller.includes(searchLower) ||
             receiver.includes(searchLower) ||
             status.includes(searchLower)
    } else if (reportType === 'agent-performance') {
      const name = String(item.name || '').toLowerCase()
      const status = String(item.status || '').toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      
      return name.includes(searchLower) ||
             status.includes(searchLower)
    }
    return true
  })

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, resourceFilter, roleFilter])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  let currentItems, totalPages
  if (reportType === 'data-access-logs') {
    // Server-side pagination
    currentItems = reportData
    totalPages = apiTotalPages
  } else {
    // Client-side pagination
    currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
    totalPages = Math.ceil(filteredData.length / itemsPerPage)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const getStatusBadge = (status) => {
    let color = 'info'
    if (status === 'Completed' || status === 'Active') color = 'success'
    else if (status === 'Missed') color = 'danger'
    else if (status === 'Break') color = 'warning'
    
    return <CBadge color={color}>{status}</CBadge>
  }

  const renderTableHeaders = () => {
    if (reportType === 'data-access-logs') {
      return (
        <CTableRow>
          <CTableHeaderCell>S.NO</CTableHeaderCell>
          <CTableHeaderCell>USER EMAIL</CTableHeaderCell>
          <CTableHeaderCell>ACTION</CTableHeaderCell>
          <CTableHeaderCell>RESOURCE</CTableHeaderCell>
          <CTableHeaderCell>TIMESTAMP</CTableHeaderCell>
          <CTableHeaderCell>IP ADDRESS</CTableHeaderCell>
        </CTableRow>
      )
    } else if (reportType === 'call-logs') {
      return (
        <CTableRow>
          <CTableHeaderCell>S.NO</CTableHeaderCell>
          <CTableHeaderCell>CALLER</CTableHeaderCell>
          <CTableHeaderCell>RECEIVER</CTableHeaderCell>
          <CTableHeaderCell>DURATION</CTableHeaderCell>
          <CTableHeaderCell>STATUS</CTableHeaderCell>
          <CTableHeaderCell>TYPE</CTableHeaderCell>
        </CTableRow>
      )
    } else if (reportType === 'agent-performance') {
      return (
        <CTableRow>
          <CTableHeaderCell>S.NO</CTableHeaderCell>
          <CTableHeaderCell>AGENT NAME</CTableHeaderCell>
          <CTableHeaderCell>TOTAL CALLS</CTableHeaderCell>
          <CTableHeaderCell>COMPLETED</CTableHeaderCell>
          <CTableHeaderCell>STATUS</CTableHeaderCell>
        </CTableRow>
      )
    }
  }

  const renderTableRows = () => {
    return currentItems.map((item, index) => (
      <CTableRow key={item.id}>
        <CTableDataCell>
          <div className="contact-number">{indexOfFirstItem + index + 1}</div>
        </CTableDataCell>
        {reportType === 'data-access-logs' ? (
          <>
            <CTableDataCell>
              <div className="contact-name">{String(item.userId || 'N/A')}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{String(item.accessType || 'N/A')}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{String(item.resourceAccessed || 'N/A')}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.timestamp}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{String(item.ipAddress || 'N/A')}</div>
            </CTableDataCell>
          </>
        ) : reportType === 'call-logs' ? (
          <>
            <CTableDataCell>
              <div className="contact-name">{item.caller}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.receiver}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.duration}</div>
            </CTableDataCell>
            <CTableDataCell>{getStatusBadge(item.status)}</CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.type}</div>
            </CTableDataCell>
          </>
        ) : (
          <>
            <CTableDataCell>
              <div className="contact-name">{item.name}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.totalCalls}</div>
            </CTableDataCell>
            <CTableDataCell>
              <div className="contact-phone">{item.completedCalls}</div>
            </CTableDataCell>
            <CTableDataCell>{getStatusBadge(item.status)}</CTableDataCell>
          </>
        )}
      </CTableRow>
    ))
  }

  return (
    <div className="contact-list-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Reports & Analytics</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton
                color="primary"
                className="add-contact-btn"
                onClick={handleDownloadReport}
                disabled={loading || filteredData.length === 0}
              >
                <CIcon icon={cilCloudDownload} className="me-2" />
                Export Report
              </CButton>
            </CCol>
          </CRow>
          
          {/* Filters Section */}
          <CRow className="mb-4">
            {/* <CCol md={2}>
              <CFormSelect
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="data-access-logs">Business Data Logs</option>
                <option value="call-logs">Call Logs Report</option>
                <option value="agent-performance">Agent Performance Report</option>
                <option value="campaign-analytics">Campaign Analytics</option>
                <option value="contact-analytics">Contact Analytics</option>
              </CFormSelect>
            </CCol> */}
            <CCol md={2}>
              <CFormSelect
                value={dateRange}
                onChange={(e) => {
                  const val = e.target.value
                  setDateRange(val)
                  if (val !== 'custom') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </CFormSelect>
            </CCol>
            {dateRange === 'custom' && (
              <>
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Start date"
                  />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="End date"
                  />
                </CCol>
              </>
            )}
            {reportType === 'data-access-logs' && (
              <>
                <CCol md={2}>
                  <CFormSelect
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                  >
                    <option value="all">All Resources</option>
                    {availableResources.map((resource, index) => (
                      <option key={index} value={resource}>
                        {resource}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="business">Business</option>
                    <option value="agent(branch_manager)">Agent (Branch Manager)</option>
                  </CFormSelect>
                </CCol>
              </>
            )}
            <CCol md={reportType === 'data-access-logs' ? 6 : 10}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>

          {/* Active Filters Display */}
          {reportType === 'data-access-logs' && (resourceFilter !== 'all' || roleFilter !== 'all') && (
            <CRow className="mb-3">
              <CCol>
                <div className="d-flex align-items-center">
                  <small className="text-muted me-2">Active filters:</small>
                  {resourceFilter !== 'all' && (
                    <CBadge color="info" className="me-2">
                      Resource: {resourceFilter}
                      <CButton
                        size="sm"
                        color="info"
                        variant="ghost"
                        className="ms-1 p-0"
                        style={{ fontSize: '10px', lineHeight: '1' }}
                        onClick={() => setResourceFilter('all')}
                      >
                        ×
                      </CButton>
                    </CBadge>
                  )}
                  {roleFilter !== 'all' && (
                    <CBadge color="info" className="me-2">
                      Role: {roleFilter}
                      <CButton
                        size="sm"
                        color="info"
                        variant="ghost"
                        className="ms-1 p-0"
                        style={{ fontSize: '10px', lineHeight: '1' }}
                        onClick={() => setRoleFilter('all')}
                      >
                        ×
                      </CButton>
                    </CBadge>
                  )}
                </div>
              </CCol>
            </CRow>
          )}

          {/* Error Message */}
          {error && (
            <CAlert color="danger" className="mb-4">
              {error}
            </CAlert>
          )}

          <CTable hover responsive className="contact-table">
            <CTableHead>
              {renderTableHeaders()}
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading report data...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentItems.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilChart} size="xl" />
                      </div>
                      <h4>No Data Available</h4>
                      <p>No report data found for the selected criteria.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                renderTableRows()
              )}
            </CTableBody>
          </CTable>

          {reportType === 'data-access-logs' && (
            <CRow className="mt-4">
              <CCol className="d-flex justify-content-between align-items-center">
                <div className="pagination-info">
                  {businessInfo.name && (
                    <span className="me-3">
                      <strong>Business:</strong> {businessInfo.name} 
                      {businessInfo.totalBranches > 0 && ` (${businessInfo.totalBranches} branches)`}
                    </span>
                  )}
                  <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} entries
                  </span>
                </div>
                <CPagination 
                  aria-label="Page navigation example"
                  className="mb-0"
                >
                  <CPaginationItem 
                    disabled={currentPage === 1} 
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </CPaginationItem>
                  <CPaginationItem active>
                    {currentPage} of {apiTotalPages}
                  </CPaginationItem>
                  <CPaginationItem 
                    disabled={currentPage === apiTotalPages} 
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </CPaginationItem>
                </CPagination>
              </CCol>
            </CRow>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default ReportsAnalytics
