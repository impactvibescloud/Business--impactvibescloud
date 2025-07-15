import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CInputGroup,
  CFormInput,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CBadge,
  CAlert,
  CSpinner,
  CTooltip
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPhone, cilTrash } from '@coreui/icons'
import { apiCall } from '../../config/api'
import { isAutheticated } from '../../auth'
import './VirtualNumbers.css'

function VirtualNumbers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Numbers')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [assignedNumbers, setAssignedNumbers] = useState([])
  const [releasingNumber, setReleasingNumber] = useState(null)
  const token = isAutheticated()
  
  // Fetch assigned numbers
  useEffect(() => {
    const fetchAssignedNumbers = async (retryCount = 0) => {
      if (!token) {
        setError("Authentication token not found. Please log in again.")
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Fetching virtual numbers from proxy API')
        
        const response = await apiCall('/api/numbers', 'GET')
        
        if (!response) {
          throw new Error('No data received from API')
        }
        
        console.log('Virtual numbers fetched:', response)
        console.log('Response data type:', typeof response)
        
        // Detailed inspection of response
        if (typeof response.data === 'object') {
          console.log('Response data keys:', Object.keys(response.data))
        }
        
        // Ensure response is an array
        let numbersArray = []
        
        if (Array.isArray(response)) {
          console.log('Response is already an array')
          numbersArray = response.filter(num => num.status === 'assigned')
        } else if (typeof response === 'object') {
          // Check for common API response patterns
          if (Array.isArray(response.data)) {
            console.log('Using response.data array')
            numbersArray = response.data.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.numbers)) {
            console.log('Using response.numbers array')
            numbersArray = response.numbers.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.results)) {
            console.log('Using response.results array')
            numbersArray = response.results.filter(num => num.status === 'assigned')
          } else if (Array.isArray(response.items)) {
            console.log('Using response.items array')
            numbersArray = response.items.filter(num => num.status === 'assigned')
          } else {
            console.log('No array found in response, creating empty array')
          }
        } else {
          console.log('Response data is not an object or array')
        }
        
        console.log('Final numbers array:', numbersArray)
        
        // Verify if we got valid data
        if (numbersArray.length === 0 && typeof response === 'object' && !Array.isArray(response)) {
          // If response isn't an array and we couldn't extract an array,
          // try to create an array from response as a fallback
          console.log('Attempting to create array from object data')
          
          // Check if response itself could be a single number object
          if (response.number || response._id || response.extension) {
            console.log('Treating response as a single item')
            numbersArray = [response]
          } else {
            // Last resort: try to extract objects from response that look like number records
            const possibleNumbers = Object.values(response)
              .filter(item => 
                item && typeof item === 'object' && 
                (item.number || item.extension || item._id || item.status)
              )
            
            if (possibleNumbers.length > 0) {
              console.log('Created array from object values:', possibleNumbers)
              numbersArray = possibleNumbers
            }
          }
        }
        
        setAssignedNumbers(numbersArray)
      } catch (err) {
        console.error('Error fetching virtual numbers:', err)
        
        let errorMessage = 'Unknown error occurred';
        
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown server error'}`;
          console.error('Error response:', err.response.status, err.response.data);
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server. Please check your network connection.';
          console.error('Error request:', err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = err.message || 'Failed to make request';
          console.error('Error message:', err.message);
        }
        
        // Implement retry logic (max 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying API call (attempt ${retryCount + 1})...`)
          setTimeout(() => fetchAssignedNumbers(retryCount + 1), 1500) // Slightly longer delay between retries
          return
        }
        
        setError(`Error fetching assigned numbers: ${errorMessage}`)
        setAssignedNumbers([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAssignedNumbers(0)
  }, [token])
  
  // Filter assigned numbers by search term and active filter
  const filteredAssignedNumbers = Array.isArray(assignedNumbers) ? assignedNumbers.filter(num => {
    if (!num) return false
    
    // Filter by search term
    if (searchTerm.trim()) {
      const matchesSearch = 
        (num.number && num.number.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (num.extension && num.extension.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (num.city && num.city.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(num.tag) && num.tag.some(tag => 
          tag && tag.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ))
      
      if (!matchesSearch) return false
    }
    
    // Filter by number type if not "All Numbers"
    if (activeFilter !== 'All Numbers') {
      // Check if tag includes the selected filter
      const filterLower = activeFilter.toLowerCase()
      return Array.isArray(num.tag) && num.tag.some(tag => 
        tag && tag.toString().toLowerCase() === filterLower
      )
    }
    
    return true
  }) : []
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }
  
  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter)
  }
  
  // Release number function
  const releaseNumber = async (numberId) => {
    if (!token) {
      setError("Authentication token not found. Please log in again.")
      return
    }
    
    if (!numberId) {
      setError("Number ID is required to release a number")
      return
    }
    
    // Set the number being released to show spinner
    setReleasingNumber(numberId)
    setError(null)
    
    try {
      console.log('Releasing number via proxy API')
      
      const response = await apiCall(`/api/numbers/${numberId}`, 'PUT', { status: 'available' })
      
      console.log('Number released response:', response.data)
      
      // Update the UI by removing the released number from the list
      setAssignedNumbers(prevNumbers => 
        prevNumbers.filter(num => num._id !== numberId)
      )
      
      // Show success message
      setSuccessMessage(`Virtual number has been successfully released.`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Error releasing number:', err)
      
      let errorMessage = 'Unknown error occurred';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown server error'}`;
        console.error('Error response:', err.response.status, err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please check your network connection.';
        console.error('Error request:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || 'Failed to make request';
        console.error('Error message:', err.message);
      }
      
      setError(`Failed to release number: ${errorMessage}`)
    } finally {
      setReleasingNumber(null)
    }
  }
  
  return (
    <div className="virtual-numbers-container">
      <div className="virtual-numbers-header">
        <h1>Virtual Numbers</h1>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <CAlert color="success" className="mb-4" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </CAlert>
      )}
      
      <CCard className="mb-4">
        <CCardBody>
          <div className="numbers-filter-section">
            <div className="search-container">
              <CInputGroup>
                <CFormInput
                  placeholder="Search numbers..."
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
                  <CDropdownItem onClick={() => handleFilterSelect('All Numbers')}>All Numbers</CDropdownItem>
                  <CDropdownItem onClick={() => handleFilterSelect('Toll-Free')}>Toll-Free</CDropdownItem>
                  <CDropdownItem onClick={() => handleFilterSelect('Local')}>Local</CDropdownItem>
                  <CDropdownItem onClick={() => handleFilterSelect('International')}>International</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
          
          {isLoading && (
            <div className="text-center my-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading assigned numbers...</p>
            </div>
          )}
          
          {error && (
            <CAlert color="danger" className="my-3">
              {error}
            </CAlert>
          )}
          
          {/* API Assigned Numbers Section */}
          {filteredAssignedNumbers.length > 0 && (
            <>
              <h4 className="mb-3 mt-4">Virtual Numbers</h4>
              <CTable striped responsive className="mb-5 virtual-numbers-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>NUMBER</CTableHeaderCell>
                    <CTableHeaderCell>LOCATION</CTableHeaderCell>
                    <CTableHeaderCell>TYPE</CTableHeaderCell>
                    <CTableHeaderCell>TAGS</CTableHeaderCell>
                    <CTableHeaderCell>ACTION</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredAssignedNumbers.map((num) => (
                    <CTableRow key={num._id || `num-${num.number}`}>
                      <CTableDataCell>
                        <div className="number-cell">
                          <CIcon icon={cilPhone} className="phone-icon" />
                          {num.number || '-'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{num.city || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="primary">
                          {num.type || (Array.isArray(num.tag) && num.tag.length > 0 ? num.tag[0] : 'Standard')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {Array.isArray(num.tag) && num.tag.length > 0 ? (
                          num.tag.map((tag, index) => (
                            <CBadge key={index} color="info" className="me-1">
                              {tag}
                            </CBadge>
                          ))
                        ) : (
                          <span className="text-muted">No tags</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CTooltip content="Release this number">
                          <CButton 
                            color="danger"
                            size="sm"
                            variant="outline" 
                            onClick={() => releaseNumber(num._id)}
                            disabled={releasingNumber === num._id}
                          >
                            {releasingNumber === num._id ? (
                              <CSpinner size="sm" />
                            ) : (
                              <>
                                <CIcon icon={cilTrash} className="me-1" />
                                Release
                              </>
                            )}
                          </CButton>
                        </CTooltip>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
          )}
          
          {/* Show message when no assigned numbers exist */}
          {!assignedNumbers.length && !isLoading && !error && (
            <div className="text-center my-5">
              <CIcon icon={cilPhone} style={{ width: '48px', height: '48px', opacity: 0.5 }} className="mb-3" />
              <h5>No virtual numbers found</h5>
              <p className="text-muted mb-4">No virtual numbers are currently assigned to your account.</p>
            </div>
          )}
          
          {/* Show message when search returns no results but we have numbers */}
          {assignedNumbers.length > 0 && filteredAssignedNumbers.length === 0 && !isLoading && (
            <div className="text-center my-5">
              <p>No virtual numbers match your search criteria</p>
              <CButton color="light" onClick={() => setSearchTerm('')}>
                Clear Search
              </CButton>
            </div>
          )}
        
        </CCardBody>
      </CCard>
    </div>
  )
}

export default VirtualNumbers
