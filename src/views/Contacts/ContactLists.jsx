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
  
  // Sample data for contact lists
  const [contactLists, setContactLists] = useState([
    {
      id: 1,
      name: 'Sales Prospects',
      contacts: 245,
      lastUpdated: '2023-06-15',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Marketing Campaign Q2',
      contacts: 187,
      lastUpdated: '2023-06-10',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Support Clients',
      contacts: 103,
      lastUpdated: '2023-05-28',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Newsletter Subscribers',
      contacts: 521,
      lastUpdated: '2023-05-15',
      status: 'Active'
    },
    {
      id: 5,
      name: 'Event Attendees',
      contacts: 98,
      lastUpdated: '2023-04-30',
      status: 'Inactive'
    }
  ])

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

  const handleCreateList = () => {
    // Here you would typically send the data to your backend
    console.log('Creating new list:', newList)
    if (selectedFile) {
      console.log('With file:', selectedFile.name)
    }
    handleCloseModal()
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
      // Here you would typically send a delete request to your backend
      // Example API call:
      // await api.delete(`/contact-lists/${deleteId}`)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update state to remove the deleted list
      setContactLists(prevLists => prevLists.filter(list => list.id !== deleteId))
      setDeleteSuccess(true)
      
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
                <CTableHeaderCell>LIST NAME</CTableHeaderCell>
                <CTableHeaderCell>CONTACTS</CTableHeaderCell>
                <CTableHeaderCell>LAST UPDATED</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
                <CTableHeaderCell className="text-center">ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {currentLists.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
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
                currentLists.map(list => (
                  <CTableRow key={list.id}>
                    <CTableDataCell>
                      <div className="list-name">{list.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="list-contacts">{list.contacts}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="list-date">{list.lastUpdated}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`list-status status-${list.status.toLowerCase()}`}>
                        {list.status}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="action-btn edit-btn me-2"
                        onClick={() => handleEdit(list)}
                      >
                        <CIcon icon={cilPencil} size="sm" className="me-1" />
                        Edit
                      </CButton>
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteConfirm(list.id)}
                      >
                        <CIcon icon={cilTrash} size="sm" className="me-1" />
                        Delete
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>

          {totalPages > 1 && (
            <CPagination align="end" className="mt-4">
              <CPaginationItem 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </CPaginationItem>
              
              {[...Array(totalPages)].map((_, index) => (
                <CPaginationItem
                  key={index}
                  active={currentPage === index + 1}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
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
        </CCardBody>
      </CCard>

      {/* New List Modal */}
      <CModal visible={showNewListModal} onClose={handleCloseModal} size="lg">
        <CModalHeader>
          <CModalTitle>{editingList ? 'Edit Contact List' : 'New Contact List'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
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
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="listDescription">Description (optional)</CFormLabel>
              <CFormTextarea
                id="listDescription"
                name="description"
                value={newList.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            {!editingList && (
              <div className="mb-3">
                <CFormLabel htmlFor="fileUpload">Upload Contacts (CSV or Excel)</CFormLabel>
                <div className="file-upload-container">
                  <CFormInput
                    type="file"
                    id="fileUpload"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                  />
                  <div className="file-upload-help">
                    <small className="text-muted">
                      Supported formats: CSV, Excel. 
                      {selectedFile && (
                        <span className="ms-2">Selected: {selectedFile.name}</span>
                      )}
                    </small>
                  </div>
                </div>
              </div>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateList}>
            {editingList ? 'Save Changes' : 'Create List'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={handleDeleteCancel} size="sm">
        <CModalHeader>
          <CModalTitle>Delete Contact List</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteSuccess ? (
            <CAlert color="success">
              Contact list deleted successfully!
            </CAlert>
          ) : (
            <>
              {deleteError && (
                <CAlert color="danger" className="mb-3">
                  {deleteError}
                </CAlert>
              )}
              <p>Are you sure you want to delete this contact list? This action cannot be undone.</p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          {!deleteSuccess && (
            <>
              <CButton color="secondary" onClick={handleDeleteCancel} disabled={isDeleting}>
                Cancel
              </CButton>
              <CButton color="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <CSpinner size="sm" className="me-1" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ContactLists
