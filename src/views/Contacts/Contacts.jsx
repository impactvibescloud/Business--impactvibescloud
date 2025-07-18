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
  CAlert,
  CBadge,
  CCardHeader,
  CCardTitle
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilPencil, cilTrash, cilUser, cilPhone, cilEnvelopeClosed, cilBriefcase, cilNotes, cilArrowLeft } from '@coreui/icons'
import { apiCall } from '../../config/api'
import './ContactList.css'

function Contacts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: '',
    tags: [],
    businessId: '684fe39ca8254e8906e99aab', // Default business ID
    branchId: '684fe3bca8254e8906e99aae'    // Default branch ID
  })
  const [editingContact, setEditingContact] = useState(null)
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' })
  const [validationError, setValidationError] = useState('')
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [isListView, setIsListView] = useState(true)

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await apiCall('/api/contacts', 'GET')
        
        if (!response || !response.data) {
          throw new Error(`API error: No data received`)
        }
        
        const data = response.data
        console.log('API Response:', data)
        
        // Check different possible response formats with detailed logging
        let contactsArray = null;
        
        if (Array.isArray(data)) {
          console.log('Response is a direct array');
          contactsArray = data;
        } else if (data.contacts && Array.isArray(data.contacts)) {
          console.log('Found data.contacts array');
          contactsArray = data.contacts;
        } else if (data.data && Array.isArray(data.data)) {
          console.log('Found data.data array');
          contactsArray = data.data;
        } else if (data.result && Array.isArray(data.result)) {
          console.log('Found data.result array');
          contactsArray = data.result;
        } else if (data.items && Array.isArray(data.items)) {
          console.log('Found data.items array');
          contactsArray = data.items;
        } else if (typeof data === 'object' && Object.values(data).some(val => Array.isArray(val))) {
          // Try to find any array property in the response
          const arrayProp = Object.entries(data).find(([_, val]) => Array.isArray(val));
          if (arrayProp) {
            console.log(`Found array in property: ${arrayProp[0]}`);
            contactsArray = arrayProp[1];
          }
        }
        
        if (contactsArray) {
          console.log(`Processing ${contactsArray.length} contacts`);
          setContacts(contactsArray.map(contact => {
            console.log('Contact item:', contact);
            return {
              id: contact._id || contact.id || '',
              name: contact.name || '',
              phone: contact.phone || '',
              email: contact.email || '',
              company: contact.company || '',
              notes: contact.notes || '',
              tags: Array.isArray(contact.tags) ? contact.tags : 
                    typeof contact.tags === 'string' ? contact.tags.split(',').map(tag => tag.trim()) : []
            };
          }))
        } else {
          console.error('Unexpected API response format:', data);
          // Try to extract useful information if available
          if (typeof data === 'object') {
            const keys = Object.keys(data);
            console.log('Response keys:', keys);
            if (keys.includes('error') || keys.includes('message')) {
              throw new Error(`API error: ${data.error || data.message || 'Unknown error'}`);
            }
          }
          throw new Error('Invalid data format received from API - could not find contacts array');
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err)
        setError('Failed to fetch contacts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContacts()
  }, [])

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleNewContact = () => {
    setEditingContact(null)
    setContactForm({
      name: '',
      phone: '',
      email: '',
      company: '',
      notes: '',
      tags: [],
      businessId: '684fe39ca8254e8906e99aab', // Default business ID
      branchId: '684fe3bca8254e8906e99aae'    // Default branch ID
    })
    setShowContactModal(true)
  }

  const handleCloseModal = () => {
    setShowContactModal(false)
    setValidationError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'tags') {
      setContactForm(prev => ({
        ...prev,
        [name]: value.trim() ? value.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      }))
    } else {
      setContactForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSaveContact = async () => {
    // Validate form
    if (!contactForm.name.trim()) {
      setValidationError('Contact name is required.')
      return
    }
    
    if (!contactForm.phone.trim()) {
      setValidationError('Phone number is required.')
      return
    }
    
    setValidationError('')
    
    try {
      if (editingContact) {
        // Update existing contact via API
        console.log('Updating contact:', contactForm);
        
        const formattedUpdateContact = {
          ...contactForm,
          businessId: contactForm.businessId || '684fe39ca8254e8906e99aab',
          branchId: contactForm.branchId || '684fe3bca8254e8906e99aae',
          tags: Array.isArray(contactForm.tags) ? contactForm.tags : 
               typeof contactForm.tags === 'string' ? contactForm.tags.split(',').map(tag => tag.trim()) : []
        };
        
        console.log('Formatted contact for update API:', formattedUpdateContact);
        
        const response = await apiCall(`/api/contacts/${editingContact.id}`, 'PUT', formattedUpdateContact)
        
        if (!response || !response.success) {
          console.error('API Update Error Response:', response);
          throw new Error('Failed to update contact')
        }
        
        const data = response;
        
        console.log('Update response:', data);
        
        // Update local state
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === editingContact.id 
              ? { 
                  ...contactForm, 
                  id: contact.id,
                  businessId: formattedUpdateContact.businessId,
                  branchId: formattedUpdateContact.branchId,
                  tags: formattedUpdateContact.tags
                } 
              : contact
          )
        )
        
        setSuccessAlert({
          show: true, 
          message: `Contact "${contactForm.name}" has been updated successfully.`
        })
      } else {
        // Create new contact via API
        console.log('Creating new contact:', contactForm);
        
        const formattedContact = {
          ...contactForm,
          businessId: contactForm.businessId || '684fe39ca8254e8906e99aab', // Ensure businessId is included
          branchId: contactForm.branchId || '684fe3bca8254e8906e99aae',     // Ensure branchId is included
          tags: Array.isArray(contactForm.tags) ? contactForm.tags : 
                typeof contactForm.tags === 'string' ? contactForm.tags.split(',').map(tag => tag.trim()) : []
        };
        
        console.log('Formatted contact for API:', formattedContact);
        
        const response = await apiCall('/api/contacts', 'POST', formattedContact)
        
        if (!response || !response.success) {
          console.error('API Create Error Response:', response);
          throw new Error('Failed to create contact')
        }
        
        const data = response;
        
        console.log('Create response data:', data);
        
        let newContactId;
        if (data.contact && (data.contact._id || data.contact.id)) {
          newContactId = data.contact._id || data.contact.id;
        } else if (data._id || data.id) {
          newContactId = data._id || data.id;
        } else if (data.data && (data.data._id || data.data.id)) {
          newContactId = data.data._id || data.data.id;
        } else {
          console.warn('Could not find ID in response, using timestamp');
          newContactId = Date.now().toString();
        }
        
        const newContact = {
          id: newContactId,
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email,
          company: contactForm.company,
          notes: contactForm.notes,
          tags: formattedContact.tags,
          businessId: formattedContact.businessId,
          branchId: formattedContact.branchId
        }
        
        // Update local state
        setContacts(prevContacts => [...prevContacts, newContact])
        
        setSuccessAlert({
          show: true, 
          message: `New contact "${contactForm.name}" has been created successfully.`
        })
      }
      
      handleCloseModal()
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' })
      }, 5000)
    } catch (err) {
      console.error('Error saving contact:', err)
      setValidationError(`Failed to save contact: ${err.message}`)
    }
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      notes: contact.notes || '',
      tags: contact.tags || [],
      businessId: contact.businessId || '684fe39ca8254e8906e99aab',
      branchId: contact.branchId || '684fe3bca8254e8906e99aae'
    })
    setShowContactModal(true)
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
  
  const handleViewContact = (contact) => {
    setSelectedContact(contact)
    setIsListView(false)
  }
  
  const handleBackToList = () => {
    setSelectedContact(null)
    setIsListView(true)
  }
  
  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    setDeleteError('')
    
    try {
      // Delete contact via API
      console.log(`Deleting contact with ID: ${deleteId}`);
      
      const response = await apiCall(`/api/contacts/${deleteId}`, 'DELETE')
      
      if (!response || !response.success) {
        console.error('API Delete Error Response:', response);
        throw new Error('Failed to delete contact')
      }
      
      console.log('Delete response:', response);
      
      // Update state to remove the deleted contact
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== deleteId))
      setDeleteSuccess(true)
      
      // If we're viewing a contact that was just deleted, go back to the list view
      if (selectedContact && selectedContact.id === deleteId) {
        setSelectedContact(null)
        setIsListView(true)
      }
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteSuccess(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error deleting contact:', error)
      setDeleteError('An error occurred while deleting the contact. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="contact-list-container">
      {successAlert.show && (
        <CAlert color="success" dismissible onClose={() => setSuccessAlert({ show: false, message: '' })}>
          {successAlert.message}
        </CAlert>
      )}
      
      {isListView ? (
        <CCard className="mb-4">
          <CCardBody>
            <CRow className="mb-4 align-items-center">
              <CCol md={6}>
                <h1 className="contact-list-title">Contacts</h1>
              </CCol>
              <CCol md={6} className="d-flex justify-content-end">
                <CButton color="primary" className="add-contact-btn" onClick={handleNewContact}>
                  <CIcon icon={cilPlus} className="me-2" />
                  New Contact
                </CButton>
              </CCol>
            </CRow>
            
            <CRow className="mb-4">
              <CCol md={6}>
                <CInputGroup>
                  <CFormInput
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <CButton type="button" color="primary" variant="outline">
                    <CIcon icon={cilSearch} />
                  </CButton>
                </CInputGroup>
              </CCol>
            </CRow>

          <CTable hover responsive className="contact-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>NAME</CTableHeaderCell>
                <CTableHeaderCell>PHONE</CTableHeaderCell>
                <CTableHeaderCell>TAGS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="4" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading contacts...</div>
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
              ) : currentContacts.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="4" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No contacts found</h4>
                      <p>Create your first contact to get started.</p>
                      <CButton color="primary" className="mt-3" onClick={handleNewContact}>
                        Create Contact
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentContacts.map((contact, index) => (
                  <CTableRow key={contact.id}>
                    <CTableDataCell>
                      <div className="contact-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div 
                        className="contact-name" 
                        onClick={() => handleViewContact(contact)}
                        style={{ cursor: 'pointer', color: '#5a46eb' }}
                      >
                        {contact.name}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{contact.phone}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-1 flex-wrap">
                        {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                          contact.tags.map((tag, i) => (
                            <CBadge key={i} color="info" className="text-capitalize" style={{fontSize: '0.75rem'}}>
                              {tag}
                            </CBadge>
                          ))
                        ) : (
                          <span className="text-muted fst-italic">No tags</span>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
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
        </CCardBody>
      </CCard>
      ) : selectedContact ? (
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <CButton color="link" className="px-0 me-3" onClick={handleBackToList}>
                  <CIcon icon={cilArrowLeft} className="me-1" />
                  Back to Contacts
                </CButton>
              </CCol>
            </CRow>
          </CCardHeader>
          <CCardBody>
            {selectedContact && (
              <>
                <CRow className="mb-4">
                  <CCol md={12}>
                    <h1 className="contact-detail-name">{selectedContact.name}</h1>
                    <CBadge color="info" className="mt-2">{selectedContact.company}</CBadge>
                  </CCol>
                </CRow>
                
                <CRow className="mb-3">
                  <CCol md={6}>
                    <div className="contact-detail-item">
                      <CIcon icon={cilPhone} className="me-2" />
                      <strong>Phone:</strong> {selectedContact.phone}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="contact-detail-item">
                      <CIcon icon={cilEnvelopeClosed} className="me-2" />
                      <strong>Email:</strong> {selectedContact.email || 'N/A'}
                    </div>
                  </CCol>
                </CRow>
                
                <CRow className="mb-3">
                  <CCol md={6}>
                    <div className="contact-detail-item">
                      <CIcon icon={cilBriefcase} className="me-2" />
                      <strong>Company:</strong> {selectedContact.company || 'N/A'}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="contact-detail-item">
                      <strong>Tags:</strong>
                      <div className="d-flex gap-1 flex-wrap ms-2">
                        {selectedContact.tags && selectedContact.tags.length > 0 ? (
                          selectedContact.tags.map((tag, i) => (
                            <CBadge key={i} color="info" className="text-capitalize" style={{fontSize: '0.75rem'}}>
                              {tag}
                            </CBadge>
                          ))
                        ) : (
                          <span className="text-muted fst-italic">No tags</span>
                        )}
                      </div>
                    </div>
                  </CCol>
                </CRow>
                
                <CRow className="mb-5">
                  <CCol md={12}>
                    <div className="contact-detail-notes">
                      <CIcon icon={cilNotes} className="me-2" />
                      <strong>Notes:</strong>
                      <div className="mt-2 p-3 bg-light rounded">
                        {selectedContact.notes || 'No notes available for this contact.'}
                      </div>
                    </div>
                  </CCol>
                </CRow>
                
                <CRow>
                  <CCol className="d-flex gap-2">
                    <CButton 
                      color="light"
                      onClick={() => handleEdit(selectedContact)}
                    >
                      <CIcon icon={cilPencil} className="me-2" />
                      Edit Contact
                    </CButton>
                    <CButton 
                      color="danger"
                      onClick={() => handleDeleteConfirm(selectedContact.id)}
                    >
                      <CIcon icon={cilTrash} className="me-2" />
                      Delete Contact
                    </CButton>
                  </CCol>
                </CRow>
              </>
            )}
          </CCardBody>
        </CCard>
      ) : null}

      {/* Contact Modal */}
      <CModal visible={showContactModal} onClose={handleCloseModal} size="lg">
        <CModalHeader>
          <CModalTitle>{editingContact ? 'Edit Contact' : 'New Contact'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {validationError && (
            <CAlert color="danger" dismissible onClose={() => setValidationError('')}>
              {validationError}
            </CAlert>
          )}
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="contactName">Name</CFormLabel>
              <CFormInput
                type="text"
                id="contactName"
                name="name"
                value={contactForm.name}
                onChange={handleInputChange}
                placeholder="Enter contact name"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="contactPhone">Phone Number</CFormLabel>
              <CFormInput
                type="tel"
                id="contactPhone"
                name="phone"
                value={contactForm.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="contactEmail">Email</CFormLabel>
              <CFormInput
                type="email"
                id="contactEmail"
                name="email"
                value={contactForm.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="contactCompany">Company</CFormLabel>
              <CFormInput
                type="text"
                id="contactCompany"
                name="company"
                value={contactForm.company}
                onChange={handleInputChange}
                placeholder="Enter company name"
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="contactNotes">Notes</CFormLabel>
              <CFormTextarea
                id="contactNotes"
                name="notes"
                value={contactForm.notes}
                onChange={handleInputChange}
                placeholder="Add notes about this contact"
                rows={3}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="contactTags">Tags</CFormLabel>
              <CFormInput
                type="text"
                id="contactTags"
                placeholder="Enter comma-separated tags (e.g., lead, sales, priority)"
                value={Array.isArray(contactForm.tags) ? contactForm.tags.join(', ') : ''}
                onChange={(e) => {
                  const tagsString = e.target.value;
                  const tagsArray = tagsString.split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '');
                  setContactForm(prev => ({...prev, tags: tagsArray}));
                }}
              />
              {Array.isArray(contactForm.tags) && contactForm.tags.length > 0 && (
                <div className="mt-2 d-flex gap-1 flex-wrap">
                  {contactForm.tags.map((tag, i) => (
                    <CBadge key={i} color="info" className="text-capitalize" style={{fontSize: '0.75rem'}}>
                      {tag}
                    </CBadge>
                  ))}
                </div>
              )}
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveContact}>
            {editingContact ? 'Update' : 'Create'} Contact
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal 
        visible={showDeleteModal} 
        onClose={handleDeleteCancel}
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteError && <CAlert color="danger">{deleteError}</CAlert>}
          {deleteSuccess && <CAlert color="success">Contact has been deleted successfully.</CAlert>}
          <p>Are you sure you want to delete this contact?</p>
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

export default Contacts
