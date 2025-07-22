import React, { useState, useEffect } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CInputGroup,
  CFormInput,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CAlert,
  CBadge,
  CCollapse
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilTrash, 
  cilSearch, 
  cilFilter, 
  cilCloudDownload,
  cilChevronTop,
  cilChevronBottom,
  cilMediaPlay,
  cilCloudDownload as cilDownload
} from '@coreui/icons'
import './CallLogs.css'
import { ENDPOINTS, apiCall } from '../../config/api'

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [activeFilter, setActiveFilter] = useState('All Calls')
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => {
    const fetchCallLogs = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await apiCall(ENDPOINTS.CALL_LOGS)
        
        if (data && data.success && Array.isArray(data.data)) {
          setCallLogs(data.data)
        } else if (Array.isArray(data)) {
          setCallLogs(data)
        } else {
          // Handle fallback case
          setCallLogs([])
        }
      } catch (err) {
        console.error('Failed to fetch call logs:', err)
        setError('Failed to fetch call logs. Please try again later.')
        setCallLogs([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    
    fetchCallLogs()
  }, [])

  // Format the call status from API data
  const formatCallStatus = (status) => {
    if (!status) return 'Unknown'
    
    // Format the status properly
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    return formattedStatus
  }
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (err) {
      return dateString
    }
  }

  // Filter call logs by search term and status filter
  const filteredCallLogs = callLogs.filter(log => {
    // Safely access properties
    const contact = String(log.contact || '')
    const callType = String(log.callType || '')
    const callDate = log.callDate || log.createdAt || ''
    const status = String(log.status || '')
    
    // Convert to lowercase for case-insensitive search
    const searchLower = searchTerm.toLowerCase()
    
    // Apply search filter
    const matchesSearch = 
      contact.toLowerCase().includes(searchLower) ||
      callType.toLowerCase().includes(searchLower) ||
      new Date(callDate).toLocaleDateString().toLowerCase().includes(searchLower) ||
      status.toLowerCase().includes(searchLower)
    
    // Apply status filter
    let matchesFilter = true
    if (activeFilter !== 'All Calls') {
      if (activeFilter === 'Success') {
        matchesFilter = status.toLowerCase() === 'success'
      } else if (activeFilter === 'Failed') {
        matchesFilter = status.toLowerCase().includes('fail') || status.toLowerCase().includes('error')
      } else if (activeFilter === 'Outgoing') {
        matchesFilter = callType.toLowerCase() === 'outgoing'
      } else if (activeFilter === 'Incoming') {
        matchesFilter = callType.toLowerCase() === 'incoming'
      }
    }
    
    return matchesSearch && matchesFilter
  })
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCallLogs = filteredCallLogs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCallLogs.length / itemsPerPage)
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleRowClick = (logId) => {
    setExpandedRow(expandedRow === logId ? null : logId)
  }

  const handlePlayRecording = (recordingUrl) => {
    if (recordingUrl) {
      // Create an audio element and play the recording
      const audio = new Audio(recordingUrl)
      audio.play().catch(err => {
        console.error('Error playing audio:', err)
        alert('Unable to play recording')
      })
    } else {
      alert('No recording available for this call')
    }
  }

  const handleDownloadRecording = (recordingUrl, fileName) => {
    if (recordingUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = recordingUrl
      link.download = fileName || 'call-recording.mp3'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('No recording available for download')
    }
  }

  const formatDuration = (duration) => {
    if (!duration) return '00:00'
    
    const seconds = parseInt(duration)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="call-logs-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="call-logs-title">Call Logs</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CDropdown>
                <CDropdownToggle color="primary" variant="outline" className="filter-btn">
                  <CIcon icon={cilFilter} className="me-2" />
                  {activeFilter}
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('All Calls')} 
                    active={activeFilter === 'All Calls'}
                  >
                    All Calls {activeFilter === 'All Calls' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Success')} 
                    active={activeFilter === 'Success'}
                  >
                    Success {activeFilter === 'Success' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Outgoing')} 
                    active={activeFilter === 'Outgoing'}
                  >
                    Outgoing {activeFilter === 'Outgoing' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Incoming')} 
                    active={activeFilter === 'Incoming'}
                  >
                    Incoming {activeFilter === 'Incoming' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Failed')} 
                    active={activeFilter === 'Failed'}
                  >
                    Failed {activeFilter === 'Failed' && '✓'}
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search call logs..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>

          <CTable hover responsive className="call-logs-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>CONTACT</CTableHeaderCell>
                <CTableHeaderCell>CALL TYPE</CTableHeaderCell>
                <CTableHeaderCell>CALL DATE</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading call logs...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : error ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
                    <CAlert color="danger" className="mb-0">
                      {error}
                    </CAlert>
                  </CTableDataCell>
                </CTableRow>
              ) : currentCallLogs.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilSearch} size="xl" />
                      </div>
                      <h4>No call logs found</h4>
                      <p>There are no call logs available matching your search criteria.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentCallLogs.map((log, index) => {
                  const contact = log.contact || 'Unknown'
                  const callType = log.callType || 'Unknown'
                  const callDate = formatDate(log.callDate || log.createdAt)
                  const status = formatCallStatus(log.status)
                  const isExpanded = expandedRow === log._id
                  
                  return (
                    <React.Fragment key={log._id}>
                      <CTableRow 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(log._id)}
                        className={isExpanded ? 'table-row-expanded' : ''}
                      >
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <span className="log-number me-2">{indexOfFirstItem + index + 1}</span>
                            <CIcon 
                              icon={isExpanded ? cilChevronTop : cilChevronBottom} 
                              size="sm" 
                              className="text-muted"
                            />
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="log-contact">{contact}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="log-type text-capitalize">{callType}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="log-date">{callDate}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge 
                            color={status.toLowerCase() === 'success' ? 'success' : 
                                   status.toLowerCase().includes('fail') ? 'danger' : 
                                   status.toLowerCase() === 'missed' ? 'warning' : 'secondary'}
                            className="status-badge"
                          >
                            {status}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                      
                      {/* Expanded Row Details */}
                      <CTableRow>
                        <CTableDataCell colSpan="5" className="p-0">
                          <CCollapse visible={isExpanded}>
                            <div className="call-details-container p-4 bg-light border-top">
                              <CRow>
                                <CCol md={6}>
                                  <div className="call-detail-item mb-3">
                                    <strong>Call Initiated By:</strong>
                                    <span className="ms-2">{log.initiatedBy || log.caller || 'Unknown'}</span>
                                  </div>
                                  <div className="call-detail-item mb-3">
                                    <strong>Call Received By:</strong>
                                    <span className="ms-2">{log.receivedBy || log.receiver || 'Unknown'}</span>
                                  </div>
                                  <div className="call-detail-item mb-3">
                                    <strong>Call Rejected By:</strong>
                                    <span className="ms-2">{log.rejectedBy || 'N/A'}</span>
                                  </div>
                                </CCol>
                                <CCol md={6}>
                                  <div className="call-detail-item mb-3">
                                    <strong>Hang Up By:</strong>
                                    <span className="ms-2">{log.hangUpBy || log.endedBy || 'Unknown'}</span>
                                  </div>
                                  <div className="call-detail-item mb-3">
                                    <strong>Call Duration:</strong>
                                    <span className="ms-2">{formatDuration(log.duration || log.callDuration)}</span>
                                  </div>
                                  <div className="call-detail-item mb-3">
                                    <strong>Call Recording:</strong>
                                    <div className="ms-2 d-flex gap-2">
                                      {log.recordingUrl || log.recording ? (
                                        <>
                                          <CButton 
                                            size="sm" 
                                            color="primary" 
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handlePlayRecording(log.recordingUrl || log.recording)
                                            }}
                                          >
                                            <CIcon icon={cilMediaPlay} className="me-1" />
                                            Play
                                          </CButton>
                                          <CButton 
                                            size="sm" 
                                            color="success" 
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDownloadRecording(
                                                log.recordingUrl || log.recording, 
                                                `call-recording-${log._id}.mp3`
                                              )
                                            }}
                                          >
                                            <CIcon icon={cilCloudDownload} className="me-1" />
                                            Download
                                          </CButton>
                                        </>
                                      ) : (
                                        <span className="text-muted">No recording available</span>
                                      )}
                                    </div>
                                  </div>
                                </CCol>
                              </CRow>
                            </div>
                          </CCollapse>
                        </CTableDataCell>
                      </CTableRow>
                    </React.Fragment>
                  )
                })
              )}
            </CTableBody>
          </CTable>

          {totalPages > 1 && (
            <CPagination 
              aria-label="Page navigation example"
              className="justify-content-center mt-4"
            >
              <CPaginationItem 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </CPaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <CPaginationItem 
                  key={i} 
                  active={i + 1 === currentPage} 
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </CPaginationItem>
            </CPagination>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default CallLogs