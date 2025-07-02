import React, { useState } from 'react'
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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFilter, cilOptions, cilPhone, cilPencil, cilTrash } from '@coreui/icons'
import './VirtualNumbers.css'

function VirtualNumbers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNumber, setNewNumber] = useState({
    name: '',
    number: '',
    location: '',
    type: 'Local'
  })
  
  // Sample virtual numbers data
  const virtualNumbers = [
    { id: 1, name: 'Main Office', number: '+91 98765 43210', location: 'Mumbai', calls: 124, type: 'Toll-Free' },
    { id: 2, name: 'Customer Support', number: '+91 98765 43211', location: 'Delhi', calls: 87, type: 'Local' },
    { id: 3, name: 'Sales Team', number: '+91 98765 43212', location: 'Bangalore', calls: 56, type: 'Local' },
    { id: 4, name: 'Marketing', number: '+91 98765 43213', location: 'Chennai', calls: 32, type: 'Toll-Free' },
    { id: 5, name: 'Technical Support', number: '+91 98765 43214', location: 'Hyderabad', calls: 45, type: 'Local' },
  ]
  
  // Filter numbers by search term
  const filteredNumbers = virtualNumbers.filter(vn => 
    vn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vn.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vn.location.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentNumbers = filteredNumbers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage)
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }
  
  // Handle opening the add number modal
  const handleOpenAddModal = () => {
    setShowAddModal(true)
  }
  
  // Handle closing the add number modal
  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setNewNumber({
      name: '',
      number: '',
      location: '',
      type: 'Local'
    })
  }
  
  // Handle input change for new number
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewNumber(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle adding a new virtual number
  const handleAddNumber = () => {
    // Here you would typically make an API call to save the number
    // For now we'll just add it to the local state
    const newVirtualNumber = {
      id: virtualNumbers.length + 1,
      name: newNumber.name,
      number: newNumber.number,
      location: newNumber.location,
      calls: 0,
      type: newNumber.type
    }
    
    // Close the modal
    handleCloseAddModal()
    
    // In a real app, you would update state after API call success
    // setVirtualNumbers([...virtualNumbers, newVirtualNumber])
    console.log("Adding new number:", newVirtualNumber)
  }
  
  return (
    <div className="virtual-numbers-container">
      <div className="virtual-numbers-header">
        <h1>Virtual Numbers</h1>
        <CButton color="primary" className="add-number-btn" onClick={handleOpenAddModal}>
          <CIcon icon={cilPlus} /> Add New Number
        </CButton>
      </div>
      
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
                  <CIcon icon={cilFilter} /> Filter
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem>All Numbers</CDropdownItem>
                  <CDropdownItem>Toll-Free</CDropdownItem>
                  <CDropdownItem>Local</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
          
          <CTable striped responsive className="virtual-numbers-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>NUMBER NAME</CTableHeaderCell>
                <CTableHeaderCell>VIRTUAL NUMBER</CTableHeaderCell>
                <CTableHeaderCell>LOCATION</CTableHeaderCell>
                <CTableHeaderCell>CALLS</CTableHeaderCell>
                <CTableHeaderCell>TYPE</CTableHeaderCell>
                <CTableHeaderCell>ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {currentNumbers.map(vn => (
                <CTableRow key={vn.id}>
                  <CTableDataCell>{vn.name}</CTableDataCell>
                  <CTableDataCell>
                    <div className="number-cell">
                      <CIcon icon={cilPhone} className="phone-icon" />
                      {vn.number}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>{vn.location}</CTableDataCell>
                  <CTableDataCell>{vn.calls}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={vn.type === 'Toll-Free' ? 'success' : 'info'}>
                      {vn.type}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="number-actions">
                      <CButton color="primary" variant="ghost" size="sm">
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton color="danger" variant="ghost" size="sm">
                        <CIcon icon={cilTrash} />
                      </CButton>
                      <CDropdown variant="btn-group">
                        <CDropdownToggle color="secondary" variant="ghost" size="sm">
                          <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem>View Details</CDropdownItem>
                          <CDropdownItem>Call History</CDropdownItem>
                          <CDropdownItem>Analytics</CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
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
        </CCardBody>
      </CCard>
      
      {/* Add Virtual Number Modal */}
      <CModal 
        visible={showAddModal} 
        onClose={handleCloseAddModal}
        alignment="center"
        size="lg"
        className="add-virtual-number-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Add Virtual Number</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            {/* Name */}
            <div className="mb-3">
              <CFormLabel htmlFor="numberName">Number Name</CFormLabel>
              <CFormInput
                type="text"
                id="numberName"
                name="name"
                placeholder="e.g. Sales Line, Support Desk"
                value={newNumber.name}
                onChange={handleInputChange}
              />
            </div>

            {/* Number */}
            <div className="mb-3">
              <CFormLabel htmlFor="virtualNumber">Phone Number</CFormLabel>
              <CFormInput
                type="tel"
                id="virtualNumber"
                name="number"
                placeholder="Enter phone number"
                value={newNumber.number}
                onChange={handleInputChange}
              />
            </div>

            {/* Location */}
            <div className="mb-3">
              <CFormLabel htmlFor="location">Location</CFormLabel>
              <CFormInput
                type="text"
                id="location"
                name="location"
                placeholder="e.g. Mumbai, Delhi, etc."
                value={newNumber.location}
                onChange={handleInputChange}
              />
            </div>

            {/* Number Type */}
            <div className="mb-3">
              <CFormLabel htmlFor="numberType">Number Type</CFormLabel>
              <CFormSelect
                id="numberType"
                name="type"
                value={newNumber.type}
                onChange={handleInputChange}
              >
                <option value="Local">Local</option>
                <option value="Toll-Free">Toll-Free</option>
                <option value="International">International</option>
              </CFormSelect>
            </div>

            {/* Call Forwarding Settings */}
            <div className="mb-3">
              <CFormLabel>Call Forwarding</CFormLabel>
              <div className="call-forwarding-settings border rounded p-3">
                <div className="d-flex align-items-center mb-2">
                  <CFormCheck 
                    id="forwardCalls"
                    label="Forward calls to team members"
                  />
                </div>
                <div className="d-flex align-items-center">
                  <CFormCheck 
                    id="recordCalls"
                    label="Record calls"
                  />
                </div>
              </div>
            </div>

            {/* Call Hours */}
            <div className="mb-3">
              <CFormLabel>Call Hours</CFormLabel>
              <div className="d-flex gap-3">
                <CFormSelect name="startTime" className="call-hours-select" defaultValue="09:00">
                  <option value="00:00">00:00</option>
                  <option value="01:00">01:00</option>
                  <option value="02:00">02:00</option>
                  <option value="03:00">03:00</option>
                  <option value="04:00">04:00</option>
                  <option value="05:00">05:00</option>
                  <option value="06:00">06:00</option>
                  <option value="07:00">07:00</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="22:00">22:00</option>
                  <option value="23:00">23:00</option>
                </CFormSelect>
                <span className="align-self-center">to</span>
                <CFormSelect name="endTime" className="call-hours-select" defaultValue="18:00">
                  <option value="00:00">00:00</option>
                  <option value="01:00">01:00</option>
                  <option value="02:00">02:00</option>
                  <option value="03:00">03:00</option>
                  <option value="04:00">04:00</option>
                  <option value="05:00">05:00</option>
                  <option value="06:00">06:00</option>
                  <option value="07:00">07:00</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="22:00">22:00</option>
                  <option value="23:00">23:00</option>
                </CFormSelect>
              </div>
            </div>

            {/* Working Days */}
            <div className="mb-3">
              <CFormLabel>Working Days</CFormLabel>
              <div className="working-days-container d-flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="working-day-item">
                    <CFormCheck 
                      id={`day-${day}`}
                      label={day}
                      defaultChecked={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)}
                    />
                  </div>
                ))}
              </div>
            </div>

          </CForm>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <CButton 
            color="light"
            onClick={handleCloseAddModal}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary"
            onClick={handleAddNumber}
          >
            Add Number
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default VirtualNumbers
