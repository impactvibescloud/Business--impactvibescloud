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
  CFormSelect,
  CSpinner,
  CAlert,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilPencil, cilTrash, cilX } from '@coreui/icons'
import { apiCall } from '../../config/api'
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
  const [newList, setNewList] = useState({
    name: ''
  })
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' })
  const [validationError, setValidationError] = useState('')
  const [contactLists, setContactLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactsLoading, setContactsLoading] = useState(false)
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
        const response = await apiCall('/api/contact-list', 'GET')
        
        if (!response) {
          throw new Error('No data received from API')
        }
        
        const data = response
        
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

  // Fetch all contacts for the dropdown
  useEffect(() => {
    const fetchContacts = async () => {
      setContactsLoading(true)
      
      try {
        const response = await fetch(CONTACTS_API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error fetching contacts: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data && data.success && Array.isArray(data.data)) {
          setContacts(data.data.map(contact => ({
            id: contact._id || contact.id,
            name: contact.fullName || contact.name || 'Unnamed Contact',
            phone: contact.phone || '',
            email: contact.email || '',
            company: contact.company || ''
          })))
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err)
      } finally {
        setContactsLoading(false)
      }
    }
    
    if (showNewListModal && !editingList) {
      fetchContacts()
    }
  }, [showNewListModal])

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
    setNewList({ name: '' })
    setSelectedContact('')
    setSelectedContacts([])
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



  const handleCreateList = async () => {
    // Validate form
    if (!newList.name.trim()) {
      setValidationError('List name is required.')
      return
    }
    
    if (selectedContacts.length === 0) {
      setValidationError('Please select at least one contact for the list.')
      return
    }
    
    setValidationError('')
    setIsCreating(true)
    
    try {
      if (editingList) {
        // Use hardcoded business and branch IDs
        const businessId = '684fe39ca8254e8906e99aab'
        const branchId = '684fe39ca8254e8906e99aab'
        
        // Extract contact IDs for the API request
        const contactIds = selectedContacts.map(contact => contact.id)
        
        // Update existing list via API
        const response = await fetch(`${API_URL}/${editingList.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newList.name,
            businessId,
            branchId,
            contacts: contactIds
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
                    contacts: contactIds.length,
                    lastUpdated: new Date().toISOString().split('T')[0]
                  } 
                : list
            )
          )
          
          setSuccessAlert({
            show: true, 
            message: `Contact list "${newList.name}" has been updated successfully with ${contactIds.length} contacts.`
          })
          refreshData()
        }
      } else {
        // Create new list via API
        // Use hardcoded business and branch IDs
        const businessId = '684fe39ca8254e8906e99aab'
        const branchId = '684fe39ca8254e8906e99aab'
        
        // Extract contact IDs for the API request
        const contactIds = selectedContacts.map(contact => contact.id)
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newList.name,
            businessId,
            branchId,
            contacts: contactIds
          })
        })
        
        if (!response.ok) {
          throw new Error(`Error creating contact list: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Add the new list to local state
        if (data && data.success && data.data) {
          const newListData = data.data
          const newContactList = {
            id: newListData._id || newListData.id,
            name: newListData.name,
            contacts: contactIds.length,
            lastUpdated: newListData.updatedAt || newListData.createdAt || new Date().toISOString().split('T')[0],
            status: newListData.status || 'Active',
            businessName: newListData.businessName || 'Business'
          }
          
          setContactLists(prevLists => [...prevLists, newContactList])
          setSuccessAlert({
            show: true, 
            message: `New contact list "${newListData.name}" has been created successfully with ${contactIds.length} contacts.`
          })
          refreshData()
        }
      }
    } catch (error) {
      console.error('Error saving contact list:', error)
      setValidationError(`Failed to ${editingList ? 'update' : 'create'} contact list: ${error.message}`)
      return
    } finally {
      setIsCreating(false)
    }
    
    handleCloseModal()
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setSuccessAlert({ show: false, message: '' })
    }, 5000)
  }

  const handleEdit = async (list) => {
    setEditingList(list)
    setNewList({
      name: list.name
    })
    
    // Load contacts for this list
    setContactsLoading(true)
    
    try {
      // First fetch all contacts
      const contactsResponse = await fetch(CONTACTS_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!contactsResponse.ok) {
        throw new Error(`Error fetching contacts: ${contactsResponse.status}`)
      }
      
      const contactsData = await contactsResponse.json()
      
      if (contactsData && contactsData.success && Array.isArray(contactsData.data)) {
        const allContacts = contactsData.data.map(contact => ({
          id: contact._id || contact.id,
          name: contact.fullName || contact.name || 'Unnamed Contact',
          phone: contact.phone || '',
          email: contact.email || '',
          company: contact.company || ''
        }))
        
        setContacts(allContacts)
        
        // Now fetch the specific list to get its contacts
        const listResponse = await fetch(`${API_URL}/${list.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (listResponse.ok) {
          const listData = await listResponse.json()
          
          if (listData && listData.success && listData.data && Array.isArray(listData.data.contacts)) {
            // Find the contacts that are in this list
            const listContactIds = listData.data.contacts.map(c => 
              typeof c === 'object' ? c._id || c.id : c
            )
            
            const selectedListContacts = allContacts.filter(contact => 
              listContactIds.includes(contact.id)
            )
            
            setSelectedContacts(selectedListContacts)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch list contacts:', err)
    } finally {
      setContactsLoading(false)
    }
    
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

  const handleContactChange = (e) => {
    setSelectedContact(e.target.value)
  }
  
  const addContactToList = () => {
    if (!selectedContact) return
    
    const contactToAdd = contacts.find(contact => contact.id === selectedContact)
    
    if (contactToAdd && !selectedContacts.some(c => c.id === contactToAdd.id)) {
      setSelectedContacts([...selectedContacts, contactToAdd])
      setSelectedContact('')
    }
  }
  
  const removeContactFromList = (contactId) => {
    setSelectedContacts(selectedContacts.filter(contact => contact.id !== contactId))
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
            <div className="mb-4">
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
            
            <div className="mb-4">
              <CRow className="align-items-end">
                <CCol md={9}>
                  <CFormLabel htmlFor="contactSelect">Add Contacts</CFormLabel>
                  <CFormSelect
                    id="contactSelect"
                    value={selectedContact}
                    onChange={handleContactChange}
                    disabled={contactsLoading}
                  >
                    <option value="">Select a contact to add</option>
                    {contacts
                      .filter(contact => !selectedContacts.some(sc => sc.id === contact.id))
                      .map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} - {contact.phone} {contact.email ? `(${contact.email})` : ''}
                        </option>
                      ))
                    }
                  </CFormSelect>
                  {contactsLoading && (
                    <div className="mt-2">
                      <CSpinner size="sm" className="me-2" />
                      Loading contacts...
                    </div>
                  )}
                </CCol>
                <CCol md={3}>
                  <CButton color="primary" className="w-100" onClick={addContactToList} disabled={!selectedContact}>
                    <CIcon icon={cilPlus} className="me-2" />
                    Add
                  </CButton>
                </CCol>
              </CRow>
            </div>
            
            {selectedContacts.length > 0 && (
              <div className="mb-4">
                <h5>Selected Contacts ({selectedContacts.length})</h5>
                <div className="selected-contacts-container">
                  {selectedContacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className="selected-contact d-flex justify-content-between align-items-center p-2 mb-2 border rounded"
                    >
                      <div>
                        <div className="fw-bold">{contact.name}</div>
                        <div className="small text-muted">
                          {contact.phone}
                          {contact.email && ` | ${contact.email}`}
                          {contact.company && ` | ${contact.company}`}
                        </div>
                      </div>
                      <CButton 
                        color="danger" 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContactFromList(contact.id)}
                      >
                        <CIcon icon={cilX} size="sm" />
                      </CButton>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreateList} disabled={isCreating}>
            {isCreating ? <CSpinner size="sm" className="me-2" /> : null}
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
