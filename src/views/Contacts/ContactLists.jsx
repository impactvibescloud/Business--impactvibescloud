import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CAlert,
  CInputGroup,
  CPagination,
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilUser, cilEnvelopeClosed, cilSearch, cilX } from '@coreui/icons'
import { apiCall } from '../../config/api'
import { ENDPOINTS } from '../../config/api'
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
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedContacts, setUploadedContacts] = useState([])
  const [fileError, setFileError] = useState('')
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
        // Using the business-specific endpoint with pagination
        const businessId = '684fe39da8254e8906e99aad' // Business ID from the API endpoint
        const url = `/contact-list/business/${businessId}?page=${currentPage}&limit=${itemsPerPage}&sortBy=createdAt&order=desc`
        console.log('Fetching contact lists with URL:', url)
        
        // Get the token from localStorage
        const token = localStorage.getItem('authToken') // Changed to match getAuthToken() in api.js
        console.log('Using auth token:', token ? 'Token exists' : 'No token found')
        
        const response = await apiCall(url, 'GET', null, {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            sortBy: 'createdAt',
            order: 'desc'
          }
        })
        console.log('API Response:', response)
        
        if (!response) {
          throw new Error('No response received from API')
        }
        
        let data = response.data || response
        
        // Handle different API response formats
        let listData = []
        if (data && data.success && Array.isArray(data.data)) {
          listData = data.data
        } else if (data && Array.isArray(data.data)) {
          listData = data.data
        } else if (Array.isArray(data)) {
          listData = data
        } else if (data && data.success === false) {
          throw new Error(data.message || 'API returned error')
        } else {
          console.log('Unexpected API response format:', data)
          listData = []
        }
        
        setContactLists(listData.map(list => ({
          id: list._id || list.id,
          name: list.name || 'Unnamed List',
          contacts: Array.isArray(list.contacts) ? list.contacts.length : 0,
          lastUpdated: list.lastUpdated || list.updatedAt || list.createdAt || new Date().toISOString().split('T')[0],
          status: list.status || 'Active',
          businessName: list.businessName || 'Business'
        })))
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
        const data = await apiCall(ENDPOINTS.CONTACTS)
        
        // Handle different response formats
        let contactsData = []
        
        if (data && data.success && Array.isArray(data.data)) {
          contactsData = data.data
        } else if (Array.isArray(data)) {
          contactsData = data
        } else if (data && Array.isArray(data.contacts)) {
          contactsData = data.contacts
        } else if (data && Array.isArray(data.result)) {
          contactsData = data.result
        }
        
        const formattedContacts = contactsData.map(contact => ({
          id: contact._id || contact.id || `contact-${Date.now()}-${Math.random()}`,
          name: contact.fullName || contact.name || contact.firstName || 'Unnamed Contact',
          phone: contact.phone || contact.phoneNumber || '',
          email: contact.email || '',
          company: contact.company || contact.organization || ''
        }))
        
        setContacts(formattedContacts)
        
        // If no contacts from API, provide helpful mock data for testing
        if (formattedContacts.length === 0) {
          const mockContacts = [
            {
              id: 'mock-contact-1',
              name: 'John Doe',
              phone: '+1234567890',
              email: 'john.doe@example.com',
              company: 'Example Corp'
            },
            {
              id: 'mock-contact-2',
              name: 'Jane Smith',
              phone: '+0987654321',
              email: 'jane.smith@example.com',
              company: 'Tech Solutions'
            },
            {
              id: 'mock-contact-3',
              name: 'Bob Wilson',
              phone: '+1122334455',
              email: 'bob.wilson@example.com',
              company: 'Business Inc'
            }
          ]
          
          setContacts(mockContacts)
        }
        
      } catch (err) {
        console.error('Failed to fetch contacts:', err)
        
        // Provide fallback mock data for development
        const mockContacts = [
          {
            id: 'mock-contact-1',
            name: 'John Doe',
            phone: '+1234567890',
            email: 'john.doe@example.com',
            company: 'Example Corp'
          },
          {
            id: 'mock-contact-2',
            name: 'Jane Smith',
            phone: '+0987654321',
            email: 'jane.smith@example.com',
            company: 'Tech Solutions'
          },
          {
            id: 'mock-contact-3',
            name: 'Bob Wilson',
            phone: '+1122334455',
            email: 'bob.wilson@example.com',
            company: 'Business Inc'
          }
        ]
        
        setContacts(mockContacts)
      } finally {
        setContactsLoading(false)
      }
    }
    
    if (showNewListModal && !editingList) {
      fetchContacts()
    }
  }, [showNewListModal, editingList])

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
    setUploadedFile(null)
    setUploadedContacts([])
    setFileError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewList(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Reset previous errors and uploads
    setFileError('')
    setUploadedContacts([])

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv', // .csv
      'application/vnd.ms-excel' // .xls (additional support)
    ]
    
    const fileExtension = file.name.toLowerCase().split('.').pop()
    if (!['xlsx', 'csv', 'xls'].includes(fileExtension)) {
      setFileError('Please upload only .xlsx or .csv files')
      return
    }

    setUploadedFile(file)
    processUploadedFile(file)
  }

  const processUploadedFile = (file) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target.result
        let contacts = []
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Process CSV file
          const lines = data.split('\n')
          
          // Skip header row if it exists
          const startIndex = lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('phone')) ? 1 : 0
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line) {
              const columns = line.split(',').map(col => col.trim().replace(/["']/g, ''))
              if (columns.length >= 2 && columns[0] && columns[1]) {
                contacts.push({
                  id: `upload-${Date.now()}-${i}`,
                  name: columns[0] || `Contact ${i + 1}`,
                  phone: columns[1] || '',
                  email: columns[2] || '',
                  company: columns[3] || ''
                })
              }
            }
          }
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          // Process Excel file
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Skip header row if it exists
          const startIndex = jsonData[0] && (
            String(jsonData[0][0]).toLowerCase().includes('name') || 
            String(jsonData[0][1]).toLowerCase().includes('phone')
          ) ? 1 : 0
          
          for (let i = startIndex; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (row && row.length >= 2 && row[0] && row[1]) {
              contacts.push({
                id: `upload-${Date.now()}-${i}`,
                name: String(row[0] || `Contact ${i + 1}`),
                phone: String(row[1] || ''),
                email: String(row[2] || ''),
                company: String(row[3] || '')
              })
            }
          }
        }
        
        setUploadedContacts(contacts)
        if (contacts.length === 0) {
          setFileError('No valid contacts found in the file. Please ensure your file has Name and Phone columns.')
        }
      } catch (error) {
        setFileError('Error processing file. Please check the file format and try again.')
        console.error('File processing error:', error)
      }
    }
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }



  const handleCreateList = async () => {
    // Validate form
    if (!newList.name.trim()) {
      setValidationError('List name is required.')
      return
    }
    
    if (uploadedContacts.length === 0) {
      setValidationError('Please upload a file with contacts for the list.')
      return
    }
    
    setValidationError('')
    setIsCreating(true)
    
    try {
      if (editingList) {
        // Use hardcoded business and branch IDs
        const businessId = '684fe39ca8254e8906e99aab'
        const branchId = '684fe39ca8254e8906e99aab'
        
        // For uploaded contacts, we need to create them first or use their IDs
        const contactIds = uploadedContacts.map(contact => contact.id)
        
        // Update existing list via API
        const response = await apiCall(`/contact-list/${editingList.id}`, 'PUT', {
          name: newList.name,
          businessId,
          branchId,
          contacts: contactIds
        })
        
        if (!response || !response.success) {
          throw new Error('Error updating contact list')
        }
        
        const data = response
        
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
        
        // For uploaded contacts, we need to create them first or use their IDs
        const contactIds = uploadedContacts.map(contact => contact.id)
        
        const response = await apiCall('/contact-list', 'POST', {
          name: newList.name,
          businessId,
          branchId,
          contacts: contactIds
        })
        
        if (!response || !response.success) {
          throw new Error('Error creating contact list')
        }
        
        const data = response
        
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
      const contactsData = await apiCall(ENDPOINTS.CONTACTS)
      
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
        const listData = await apiCall(`/contact-list/${list.id}`)
        
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
      const response = await apiCall(`/contact-list/${deleteId}`, 'DELETE')
      
      if (!response || !response.success) {
        throw new Error('Error deleting contact list')
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
      const newSelectedContacts = [...selectedContacts, contactToAdd]
      setSelectedContacts(newSelectedContacts)
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
                  placeholder="Search contact lists..."
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
                <CTableHeaderCell>CONTACT LIST NAME</CTableHeaderCell>
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

      {/* New Contact List Modal */}
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
              <CFormLabel htmlFor="fileUpload">Upload Contacts File</CFormLabel>
              <CFormInput
                type="file"
                id="fileUpload"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                className="mb-2"
              />
              <div className="text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Please upload a .xlsx or .csv file containing contact information (Name, Phone, Email, Company)
              </div>
              {fileError && (
                <CAlert color="danger" className="mt-2 mb-0">
                  {fileError}
                </CAlert>
              )}
              {uploadedFile && !fileError && (
                <div className="mt-2">
                  <CBadge color="success" className="me-2">
                    <i className="bi bi-check-circle me-1"></i>
                    File uploaded: {uploadedFile.name}
                  </CBadge>
                  <span className="text-muted small">
                    ({uploadedContacts.length} contacts found)
                  </span>
                </div>
              )}
            </div>
            
            {uploadedContacts.length > 0 && (
              <div className="mb-4">
                <h5>Uploaded Contacts ({uploadedContacts.length})</h5>
                <div className="uploaded-contacts-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {uploadedContacts.slice(0, 5).map(contact => (
                    <div 
                      key={contact.id} 
                      className="uploaded-contact d-flex justify-content-between align-items-center p-2 mb-2 border rounded bg-light"
                    >
                      <div>
                        <div className="fw-bold">{contact.name}</div>
                        <div className="small text-muted">
                          {contact.phone}
                          {contact.email && ` | ${contact.email}`}
                          {contact.company && ` | ${contact.company}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {uploadedContacts.length > 5 && (
                    <div className="text-center text-muted small">
                      ... and {uploadedContacts.length - 5} more contacts
                    </div>
                  )}
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
