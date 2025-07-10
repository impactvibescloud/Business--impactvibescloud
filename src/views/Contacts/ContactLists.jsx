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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormTextarea,
  CSpinner,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilPencil, cilTrash } from '@coreui/icons'
import './ContactList.css'

const API_URL = 'https://api-impactvibescloud.onrender.com/api/contact-list'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZlMzljYTgyNTRlODkwNmU5OWFhYiIsImlhdCI6MTc1MjAzNDkzOX0.aUE1egzY77uQWHOK1q5PTpkglJ_DE2CVUFutHAaaWMU'

const ContactLists = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newList, setNewList] = useState({
    name: '',
    description: ''
  })
  const [editingList, setEditingList] = useState(null)
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' })
  const [validationError, setValidationError] = useState('')
  const [contactLists, setContactLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0)
  
  const refreshData = () => {
    setDataRefreshCounter(prev => prev + 1)
  }
  
  useEffect(() => {
    const fetchContactLists = async () => {
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
          throw new Error(`Error fetching contact lists: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.success && Array.isArray(data.data)) {
          setContactLists(data.data.map(list => ({
            id: list._id || list.id,
            name: list.name || 'Unnamed List',
            contacts: Array.isArray(list.contacts) ? list.contacts.length : 0,
            lastUpdated: list.lastUpdated || list.updatedAt || list.createdAt || new Date().toISOString().split('T')[0],
            status: list.status || 'Active',
            businessName: list.businessName || 'Business'
          })))
        } else {
          throw new Error('Received invalid data format from API')
        }
      } catch (err) {
        console.error('Failed to fetch contact lists:', err)
        setError('Failed to fetch contact lists. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContactLists()
  }, [dataRefreshCounter])

  // Filter contact lists based on search term
  const filteredLists = contactLists.filter(list => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentLists = filteredLists.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLists.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleNewList = () => {
    setShowNewListModal(true)
  }

  const handleCloseModal = () => {
    setShowNewListModal(false)
    setNewList({ name: '', description: '' })
    setSelectedFile(null)
    setEditingList(null)
    setValidationError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewList(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleCreateList = async () => {
    // Validate form
    if (!newList.name.trim()) {
      setValidationError('List name is required.')
      return
    }
    
    setValidationError('')
    
    // Prepare form data if there's a file to upload
    let formData = null
    if (selectedFile) {
      formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', newList.name)
      formData.append('description', newList.description)
    }
    
    try {
      if (editingList) {
        // Update existing list via API
        const response = await fetch(`${API_URL}/${editingList.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': formData ? undefined : 'application/json',
          },
          body: formData ? formData : JSON.stringify({
            name: newList.name,
            description: newList.description
          })
        })
        
        if (!response.ok) {
          throw new Error(`Error updating contact list: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Update local state with the response data
        if (data && data.success) {
          setContactLists(prevLists => 
            prevLists.map(list => 
              list.id === editingList.id 
                ? { 
                    ...list, 
                    name: newList.name, 
                    lastUpdated: new Date().toISOString().split('T')[0]
                  } 
                : list
            )
          )
          
          setSuccessAlert({
            show: true, 
            message: `Contact list "${newList.name}" has been updated successfully.`
          })
          refreshData()
        }
      } else {
        // Create new list via API
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': formData ? undefined : 'application/json',
          },
          body: formData ? formData : JSON.stringify({
            name: newList.name,
            description: newList.description
          })
        })
        
        if (!response.ok) {
          throw new Error(`Error creating contact list: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Add the new list to local state
        if (data && data.success && data.data) {
          const newList = data.data
          const newContactList = {
            id: newList._id,
            name: newList.name,
            contacts: Array.isArray(newList.contacts) ? newList.contacts.length : 0,
            lastUpdated: newList.updatedAt || newList.createdAt || new Date().toISOString().split('T')[0],
            status: newList.status || 'Active'
          }
          
          setContactLists(prevLists => [...prevLists, newContactList])
          setSuccessAlert({
            show: true, 
            message: `New contact list "${newList.name}" has been created successfully.`
          })
          refreshData()
        }
      }
    } catch (error) {
      console.error('Error saving contact list:', error)
      setValidationError(`Failed to ${editingList ? 'update' : 'create'} contact list: ${error.message}`)
      return
    }
    
    handleCloseModal()
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setSuccessAlert({ show: false, message: '' })
    }, 5000)
  }

  const handleEdit = (list) => {
    setEditingList(list)
    setNewList({
      name: list.name,
      description: '' // Assuming description is not shown in the table
    })
    setShowNewListModal(true)
  }

  const handleDeleteConfirm = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
    setDeleteError('')
    setDeleteSuccess(false)
  }
  
  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setDeleteId(null)
  }
  
  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    setDeleteError('')
    
    try {
      // Send delete request to the API
      const response = await fetch(`${API_URL}/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error deleting contact list: ${response.status}`)
      }
      
      // Update state to remove the deleted list
      setContactLists(prevLists => prevLists.filter(list => list.id !== deleteId))
      setDeleteSuccess(true)
      refreshData()
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteSuccess(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error deleting contact list:', error)
      setDeleteError('An error occurred while deleting the contact list. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="contact-lists-container">
      {successAlert.show && (
        <CAlert color="success" dismissible onClose={() => setSuccessAlert({ show: false, message: '' })}>
          {successAlert.message}
        </CAlert>
      )}
      
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Contact Lists</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-contact-btn" onClick={handleNewList}>
                <CIcon icon={cilPlus} className="me-2" />
                New List
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>

          <CTable hover responsive className="contact-list-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>BUSINESS NAME</CTableHeaderCell>
                <CTableHeaderCell>NO OF CONTACTS</CTableHeaderCell>
                <CTableHeaderCell className="text-center">ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="4" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading contact lists...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : error ? (
                <CTableRow>
                  <CTableDataCell colSpan="4" className="text-center py-5">
                    <CAlert color="danger" className="mb-0">
                      {error}
                    </CAlert>
                  </CTableDataCell>
                </CTableRow>
              ) : currentLists.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="4" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No contact lists found</h4>
                      <p>Create your first contact list to get started.</p>
                      <CButton color="primary" className="mt-3" onClick={handleNewList}>
                        Create Contact List
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentLists.map((list, index) => (
                  <CTableRow key={list.id}>
                    <CTableDataCell>
                      <div className="list-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="list-name">{list.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="list-contacts">{list.contacts}</div>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton 
                        color="light"
                        onClick={() => handleEdit(list)}
                        className="me-2"
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton 
                        color="danger"
                        onClick={() => handleDeleteConfirm(list.id)}
                        disabled={isDeleting && deleteId === list.id}
                      >
                        {isDeleting && deleteId === list.id ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} />}
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>

          <CPagination 
            aria-label="Page navigation example"
            className="justify-content-center"
            style={{ display: totalPages > 1 ? 'flex' : 'none' }}
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
        </CCardBody>
      </CCard>

      {/* New List Modal */}
      <CModal visible={showNewListModal} onClose={handleCloseModal} size="lg">
        <CModalHeader>
          <CModalTitle>{editingList ? 'Edit Contact List' : 'New Contact List'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {validationError && (
            <CAlert color="danger" dismissible onClose={() => setValidationError('')}>
              {validationError}
            </CAlert>
          )}
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="listName">List Name</CFormLabel>
              <CFormInput
                type="text"
                id="listName"
                name="name"
                value={newList.name}
                onChange={handleInputChange}
                placeholder="Enter list name"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="listDescription">Description</CFormLabel>
              <CFormTextarea
                id="listDescription"
                name="description"
                value={newList.description}
                onChange={handleInputChange}
                placeholder="Enter list description"
                rows={3}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="fileUpload">Upload Contacts File</CFormLabel>
              <CFormInput
                id="fileUpload"
                type="file"
                onChange={handleFileChange}
                accept=".csv, .xlsx, .xls"
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateList}>
            {editingList ? 'Update' : 'Create'} List
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal 
        visible={showDeleteModal} 
        onClose={handleDeleteCancel}
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteError && <CAlert color="danger">{deleteError}</CAlert>}
          {deleteSuccess && <CAlert color="success">Contact list has been deleted successfully.</CAlert>}
          <p>Are you sure you want to delete this contact list?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeleteCancel}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <CSpinner size="sm" /> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ContactLists
