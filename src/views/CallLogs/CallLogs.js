import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
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
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter } from '@coreui/icons'
import './CallLogs.css'

const API_URL = 'https://api-impactvibescloud.onrender.com/api/call-logs'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [activeFilter, setActiveFilter] = useState('All Calls')

  useEffect(() => {
    const fetchCallLogs = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error fetching call logs: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.success && Array.isArray(data.data)) {
          setCallLogs(data.data)
        } else {
          throw new Error('Received invalid data format from API')
        }
      } catch (err) {
        console.error('Failed to fetch call logs:', err)
        setError('Failed to fetch call logs. Please try again later.')
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
    if (activeFilter === 'Success') {
      matchesFilter = status.toLowerCase() === 'success'
    } else if (activeFilter === 'Failed') {
      matchesFilter = status.toLowerCase().includes('fail') || status.toLowerCase().includes('error')
    } else if (activeFilter === 'Outgoing') {
      matchesFilter = callType.toLowerCase() === 'outgoing'
    } else if (activeFilter === 'Incoming') {
      matchesFilter = callType.toLowerCase() === 'incoming'
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

  return (
    <div className="call-logs-container">
      <div className="call-logs-header">
        <h1>Call Logs</h1>
      </div>
      
      <CCard className="mb-4">
        <CCardBody>
          <div className="call-logs-filter-section">
            <div className="search-container">
              <CInputGroup>
                <CFormInput
                  placeholder="Search call logs..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <CButton color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </div>
            
            <div className="filter-container">
              <CDropdown>
                <CDropdownToggle color="primary" variant="outline">
                  <CIcon icon={cilFilter} /> {activeFilter}
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
            </div>
          </div>
          
          {loading ? (
            <div className="text-center p-4">
              <CSpinner color="primary" />
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : filteredCallLogs.length === 0 ? (
            <div className="empty-state">
              <h4>No call logs found</h4>
              <p>There are no call logs available matching your search criteria.</p>
            </div>
          ) : (
            <>
              <CTable striped responsive className="call-logs-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>CONTACT</CTableHeaderCell>
                    <CTableHeaderCell>CALL TYPE</CTableHeaderCell>
                    <CTableHeaderCell>CALL DATE</CTableHeaderCell>
                    <CTableHeaderCell>STATUS</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {currentCallLogs.map(log => {
                    const contact = log.contact || 'Unknown'
                    const callType = log.callType || 'Unknown'
                    const callDate = formatDate(log.callDate || log.createdAt)
                    const status = formatCallStatus(log.status)
                    
                    return (
                      <CTableRow key={log._id}>
                        <CTableDataCell>{contact}</CTableDataCell>
                        <CTableDataCell className="text-capitalize">{callType}</CTableDataCell>
                        <CTableDataCell>{callDate}</CTableDataCell>
                        <CTableDataCell>
                          <span className={`status-badge ${status.toLowerCase()}`}>
                            {status}
                          </span>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
              
              {totalPages > 1 && (
                <CPagination aria-label="Page navigation" className="pagination-container">
                  <CPaginationItem 
                    aria-label="Previous" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <span aria-hidden="true">&laquo;</span>
                  </CPaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <CPaginationItem 
                      key={page} 
                      active={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </CPaginationItem>
                  ))}
                  
                  <CPaginationItem 
                    aria-label="Next" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <span aria-hidden="true">&raquo;</span>
                  </CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default CallLogs