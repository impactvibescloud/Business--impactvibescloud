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
  CFormCheck,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFilter, cilPhone, cilPencil, cilTrash } from '@coreui/icons'
import './VirtualNumbers.css'

function VirtualNumbers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All Numbers')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [numberToDelete, setNumberToDelete] = useState(null)
  const [editingNumber, setEditingNumber] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const [newNumber, setNewNumber] = useState({
    name: '',
    number: '',
    location: '',
    type: 'Local',
    forwardCalls: false,
    recordCalls: false,
    startTime: '00:00',
    endTime: '00:00',
    workingDays: []
  })
  
  // Sample virtual numbers data
  const [virtualNumbers, setVirtualNumbers] = useState([
    { id: 1, name: 'Main Office', number: '+91 98765 43210', location: 'Mumbai', calls: 124, type: 'Toll-Free', forwardCalls: true, recordCalls: true, startTime: '09:00', endTime: '18:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    { id: 2, name: 'Customer Support', number: '+91 98765 43211', location: 'Delhi', calls: 87, type: 'Local', forwardCalls: false, recordCalls: true, startTime: '09:00', endTime: '20:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    { id: 3, name: 'Sales Team', number: '+91 98765 43212', location: 'Bangalore', calls: 56, type: 'Local', forwardCalls: true, recordCalls: false, startTime: '08:00', endTime: '17:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    { id: 4, name: 'Marketing', number: '+91 98765 43213', location: 'Chennai', calls: 32, type: 'Toll-Free', forwardCalls: false, recordCalls: false, startTime: '10:00', endTime: '19:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    { id: 5, name: 'Technical Support', number: '+91 98765 43214', location: 'Hyderabad', calls: 45, type: 'Local', forwardCalls: true, recordCalls: true, startTime: '00:00', endTime: '23:59', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  ])
  
  // Filter numbers by search term and filter dropdown
  const filteredNumbers = virtualNumbers.filter(vn => {
    const matchesSearch = vn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vn.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vn.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeFilter === 'All Numbers') {
      return matchesSearch
    } else {
      return matchesSearch && vn.type === activeFilter
    }
  })
  
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
  
  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }
  
  // Handle opening the add number modal
  const handleOpenAddModal = () => {
    setNewNumber({
      name: '',
      number: '',
      location: '',
      type: 'Local',
      forwardCalls: false,
      recordCalls: false,
      startTime: '00:00',
      endTime: '00:00',
      workingDays: []
    })
    setShowAddModal(true)
  }
  
  // Handle closing the add number modal
  const handleCloseAddModal = () => {
    setShowAddModal(false)
  }
  
  // Handle input change for new/edit number
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      if (name === 'forwardCalls' || name === 'recordCalls') {
        setNewNumber(prev => ({
          ...prev,
          [name]: checked
        }))
      } else {
        // Handle working days checkboxes
        const day = e.target.id.replace('day-', '')
        setNewNumber(prev => {
          if (checked) {
            return {
              ...prev,
              workingDays: [...prev.workingDays, day]
            }
          } else {
            return {
              ...prev,
              workingDays: prev.workingDays.filter(d => d !== day)
            }
          }
        })
      }
    } else {
      setNewNumber(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  
  // Handle adding a new virtual number
  const handleAddNumber = () => {
    if (!newNumber.name || !newNumber.number) {
      return // Simple validation
    }
    
    const newVirtualNumber = {
      id: editingNumber ? editingNumber.id : Math.max(...virtualNumbers.map(vn => vn.id)) + 1,
      name: newNumber.name,
      number: newNumber.number,
      location: newNumber.location,
      calls: editingNumber ? editingNumber.calls : 0,
      type: newNumber.type,
      forwardCalls: newNumber.forwardCalls,
      recordCalls: newNumber.recordCalls,
      startTime: newNumber.startTime,
      endTime: newNumber.endTime,
      workingDays: [...newNumber.workingDays]
    }
    
    if (editingNumber) {
      // Update existing number
      setVirtualNumbers(
        virtualNumbers.map(vn => vn.id === editingNumber.id ? newVirtualNumber : vn)
      )
      setSuccessMessage(`Virtual number "${newNumber.name}" has been updated successfully.`)
    } else {
      // Add new number
      setVirtualNumbers([...virtualNumbers, newVirtualNumber])
      setSuccessMessage(`Virtual number "${newNumber.name}" has been added successfully.`)
    }
    
    // Close the modal
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingNumber(null)
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }
  
  // Handle edit number
  const handleEditNumber = (number) => {
    setEditingNumber(number)
    setNewNumber({
      name: number.name,
      number: number.number,
      location: number.location,
      type: number.type,
      forwardCalls: number.forwardCalls,
      recordCalls: number.recordCalls,
      startTime: number.startTime,
      endTime: number.endTime,
      workingDays: [...number.workingDays]
    })
    setShowEditModal(true)
  }
  
  // Handle closing the edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingNumber(null)
  }
  
  // Handle delete confirmation
  const handleDeleteConfirm = (number) => {
    setNumberToDelete(number)
    setShowDeleteModal(true)
  }
  
  // Handle delete number
  const handleDeleteNumber = () => {
    if (!numberToDelete) return
    
    setVirtualNumbers(virtualNumbers.filter(vn => vn.id !== numberToDelete.id))
    setSuccessMessage(`Virtual number "${numberToDelete.name}" has been deleted successfully.`)
    
    // Close the modal
    setShowDeleteModal(false)
    setNumberToDelete(null)
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }
  
  return (
    <div className="virtual-numbers-container">
      <div className="virtual-numbers-header">
        <h1>Virtual Numbers</h1>
        <CButton color="primary" className="add-number-btn" onClick={handleOpenAddModal}>
          <CIcon icon={cilPlus} /> Add Virtual Number
        </CButton>
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
              {currentNumbers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4">
                    No virtual numbers found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentNumbers.map(vn => (
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
                      <CBadge color={vn.type === 'Toll-Free' ? 'success' : vn.type === 'International' ? 'warning' : 'info'}>
                        {vn.type}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="number-actions">
                        <CButton color="primary" variant="ghost" size="sm" onClick={() => handleEditNumber(vn)} title="Edit number">
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDeleteConfirm(vn)} title="Delete number">
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
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
      
      {/* Add/Edit Virtual Number Modal */}
      <CModal 
        visible={showAddModal || showEditModal} 
        onClose={showEditModal ? handleCloseEditModal : handleCloseAddModal}
        alignment="center"
        size="lg"
        className="add-virtual-number-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>{showEditModal ? 'Edit Virtual Number' : 'Add Virtual Number'}</CModalTitle>
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
                    name="forwardCalls"
                    label="Forward calls to team members"
                    checked={newNumber.forwardCalls}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="d-flex align-items-center">
                  <CFormCheck 
                    id="recordCalls"
                    name="recordCalls"
                    label="Record calls"
                    checked={newNumber.recordCalls}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Call Hours */}
            <div className="mb-3">
              <CFormLabel>Call Hours</CFormLabel>
              <div className="d-flex gap-3">
                <CFormSelect 
                  name="startTime" 
                  className="call-hours-select" 
                  value={newNumber.startTime}
                  onChange={handleInputChange}
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0')
                    return (
                      <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                    )
                  })}
                </CFormSelect>
                <span className="align-self-center">to</span>
                <CFormSelect 
                  name="endTime" 
                  className="call-hours-select"
                  value={newNumber.endTime}
                  onChange={handleInputChange}
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0')
                    return (
                      <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                    )
                  })}
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
                      checked={newNumber.workingDays.includes(day)}
                      onChange={handleInputChange}
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
            onClick={showEditModal ? handleCloseEditModal : handleCloseAddModal}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary"
            onClick={handleAddNumber}
            disabled={!newNumber.name || !newNumber.number}
          >
            {showEditModal ? 'Save Changes' : 'Add Number'}
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Delete Confirmation Modal */}
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        alignment="center"
        size="sm"
      >
        <CModalHeader closeButton>
          <CModalTitle className="text-danger">Delete Virtual Number</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {numberToDelete && (
            <p>
              Are you sure you want to delete the virtual number "{numberToDelete.name}"? This action cannot be undone.
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="light" 
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </CButton>
          <CButton 
            color="danger" 
            onClick={handleDeleteNumber}
          >
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default VirtualNumbers
