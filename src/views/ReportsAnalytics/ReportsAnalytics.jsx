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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('data-access-logs')
  const [dateRange, setDateRange] = useState('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [reportData, setReportData] = useState([])

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
  }, [reportType, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (reportType === 'data-access-logs') {
        const response = await apiCall('api/data-access-logs', 'GET').catch(err => {
          console.error('API call failed:', err)
          throw err
        })
        
        let dataArray = null
        
        if (response && response.data && Array.isArray(response.data)) {
          dataArray = response.data
        } else if (response && Array.isArray(response)) {
          dataArray = response
        } else if (response && response.logs && Array.isArray(response.logs)) {
          dataArray = response.logs
        } else if (response && response.result && Array.isArray(response.result)) {
          dataArray = response.result
        } else if (response && typeof response === 'object') {
          const arrayProp = Object.entries(response).find(([_, val]) => Array.isArray(val))
          if (arrayProp) {
            dataArray = arrayProp[1]
          }
        }
        
        if (dataArray && dataArray.length > 0) {
          setReportData(dataArray.map((log, index) => {
            const userEmail = (log.user && log.user.email) || log.userEmail || log.user_email || log.email || 'N/A'
            return {
              id: String(log._id || log.id || `log-${index}-${Date.now()}`),
              userId: String(userEmail),
              accessType: String(log.action || log.accessType || log.access_type || log.type || 'N/A'),
              resourceAccessed: String(log.resource || log.resourceAccessed || log.resource_accessed || 'N/A'),
              timestamp: String(log.createdAt || log.timestamp || log.created_at || log.date || new Date().toISOString()),
              ipAddress: String(log.ipAddress || log.ip_address || log.ip || 'N/A'),
              status: String(log.status || 'Success')
            }
          }))
        } else {
          setReportData([])
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
      setError('Failed to fetch report data. Please try again later.')
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

  const filteredData = reportData.filter(item => {
    if (reportType === 'data-access-logs') {
      const userId = String(item.userId || '').toLowerCase()
      const accessType = String(item.accessType || '').toLowerCase()
      const resourceAccessed = String(item.resourceAccessed || '').toLowerCase()
      const status = String(item.status || '').toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      
      return userId.includes(searchLower) ||
             accessType.includes(searchLower) ||
             resourceAccessed.includes(searchLower) ||
             status.includes(searchLower)
    } else if (reportType === 'call-logs') {
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

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
              <div className="contact-phone">{new Date(item.timestamp).toLocaleString()}</div>
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
            <CCol md={3}>
              <CFormSelect
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="data-access-logs">Data Access Logs</option>
                <option value="call-logs">Call Logs Report</option>
                <option value="agent-performance">Agent Performance Report</option>
                <option value="campaign-analytics">Campaign Analytics</option>
                <option value="contact-analytics">Contact Analytics</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
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

          {totalPages > 1 && (
            <CRow className="mt-4">
              <CCol className="d-flex justify-content-between align-items-center">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
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
                    {currentPage} of {totalPages}
                  </CPaginationItem>
                  <CPaginationItem 
                    disabled={currentPage === totalPages} 
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
