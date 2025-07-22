import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CFormSelect,
  CInputGroup,
  CFormInput,
  CPagination,
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart, cilCloudDownload, cilSearch } from '@coreui/icons'
import './ReportsAnalytics.css'

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportType, setReportType] = useState('call-logs')
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
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (reportType === 'call-logs') {
        setReportData(mockCallLogsData)
      } else if (reportType === 'agent-performance') {
        setReportData(mockAgentData)
      } else {
        setReportData([])
      }
    } catch (err) {
      setError('Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    // Create CSV content
    let csvContent = ''
    let headers = []
    
    if (reportType === 'call-logs') {
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

    // Download CSV file
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
    if (reportType === 'call-logs') {
      return item.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.status.toLowerCase().includes(searchTerm.toLowerCase())
    } else if (reportType === 'agent-performance') {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.status.toLowerCase().includes(searchTerm.toLowerCase())
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

  const renderTableHeaders = () => {
    if (reportType === 'call-logs') {
      return (
        <CTableRow>
          <CTableHeaderCell>S.NO</CTableHeaderCell>
          <CTableHeaderCell>CALLER</CTableHeaderCell>
          <CTableHeaderCell>RECEIVER</CTableHeaderCell>
          <CTableHeaderCell>DURATION</CTableHeaderCell>
          <CTableHeaderCell>TIMESTAMP</CTableHeaderCell>
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
          <CTableHeaderCell>MISSED</CTableHeaderCell>
          <CTableHeaderCell>AVG DURATION</CTableHeaderCell>
          <CTableHeaderCell>STATUS</CTableHeaderCell>
        </CTableRow>
      )
    }
  }

  const renderTableRows = () => {
    return currentItems.map((item, index) => (
      <CTableRow key={item.id}>
        <CTableDataCell>{indexOfFirstItem + index + 1}</CTableDataCell>
        {reportType === 'call-logs' ? (
          <>
            <CTableDataCell>{item.caller}</CTableDataCell>
            <CTableDataCell>{item.receiver}</CTableDataCell>
            <CTableDataCell>{item.duration}</CTableDataCell>
            <CTableDataCell>{item.timestamp}</CTableDataCell>
            <CTableDataCell>
              <span className={`status-badge status-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </CTableDataCell>
            <CTableDataCell>{item.type}</CTableDataCell>
          </>
        ) : (
          <>
            <CTableDataCell>{item.name}</CTableDataCell>
            <CTableDataCell>{item.totalCalls}</CTableDataCell>
            <CTableDataCell>{item.completedCalls}</CTableDataCell>
            <CTableDataCell>{item.missedCalls}</CTableDataCell>
            <CTableDataCell>{item.avgDuration}</CTableDataCell>
            <CTableDataCell>
              <span className={`status-badge status-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </CTableDataCell>
          </>
        )}
      </CTableRow>
    ))
  }

  return (
    <div className="reports-analytics-container">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h2 className="mb-0">
                <CIcon icon={cilChart} className="me-2" />
                Reports & Analytics
              </h2>
            </CCardHeader>
            <CCardBody>
              {/* Filters Section */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <label className="form-label">Report Type</label>
                  <CFormSelect
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="call-logs">Call Logs Report</option>
                    <option value="agent-performance">Agent Performance Report</option>
                    <option value="campaign-analytics">Campaign Analytics</option>
                    <option value="contact-analytics">Contact Analytics</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <label className="form-label">Date Range</label>
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
                <CCol md={4}>
                  <label className="form-label">Search</label>
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
                <CCol md={2}>
                  <label className="form-label">&nbsp;</label>
                  <div>
                    <CButton
                      color="success"
                      onClick={handleDownloadReport}
                      disabled={loading || filteredData.length === 0}
                      className="w-100"
                    >
                      <CIcon icon={cilCloudDownload} className="me-1" />
                      Export
                    </CButton>
                  </div>
                </CCol>
              </CRow>

              {/* Error Message */}
              {error && (
                <CAlert color="danger" className="mb-4">
                  {error}
                </CAlert>
              )}

              {/* Reports Table */}
              <div className="reports-table-container">
                {loading ? (
                  <div className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading report data...</div>
                  </div>
                ) : (
                  <>
                    <CTable hover responsive className="reports-table">
                      <CTableHead>
                        {renderTableHeaders()}
                      </CTableHead>
                      <CTableBody>
                        {currentItems.length === 0 ? (
                          <CTableRow>
                            <CTableDataCell colSpan="7" className="text-center py-5">
                              <div className="empty-state">
                                <CIcon icon={cilChart} size="xl" className="text-muted mb-3" />
                                <h4>No Data Available</h4>
                                <p className="text-muted">No report data found for the selected criteria.</p>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ) : (
                          renderTableRows()
                        )}
                      </CTableBody>
                    </CTable>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <CPagination 
                        aria-label="Reports pagination"
                        className="justify-content-center mt-4"
                      >
                        <CPaginationItem 
                          disabled={currentPage === 1} 
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </CPaginationItem>
                        {[...Array(totalPages)].map((_, i) => (
                          <CPaginationItem 
                            key={i} 
                            active={i + 1 === currentPage} 
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </CPaginationItem>
                        ))}
                        <CPaginationItem 
                          disabled={currentPage === totalPages} 
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </CPaginationItem>
                      </CPagination>
                    )}
                  </>
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default ReportsAnalytics
