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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFilter, cilOptions, cilPhone, cilEnvelopeClosed, cilUser } from '@coreui/icons'
import './ContactList.css'

const API_URL = 'https://api-impactvibescloud.onrender.com/api/contact-list'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZlMzljYTgyNTRlODkwNmU5OWFhYiIsImlhdCI6MTc1MjAzNDkzOX0.aUE1egzY77uQWHOK1q5PTpkglJ_DE2CVUFutHAaaWMU'

const ContactList = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  useEffect(() => {
    const fetchContacts = async () => {
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
          throw new Error(`Error fetching contacts: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.success && Array.isArray(data.data)) {
          setContacts(data.data)
        } else {
          throw new Error('Received invalid data format from API')
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
  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || ''
    const email = contact.email || ''
    const phone = contact.phone || ''
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="contact-list-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Contact Lists</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-contact-btn">
                <CIcon icon={cilPlus} className="me-2" />
                Add Contact
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
            <CCol md={6} className="d-flex justify-content-end">
              <CDropdown className="me-2">
                <CDropdownToggle color="light">
                  <CIcon icon={cilFilter} className="me-2" />
                  Filter
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem>All Contacts</CDropdownItem>
                  <CDropdownItem>Customers</CDropdownItem>
                  <CDropdownItem>Sales Leads</CDropdownItem>
                  <CDropdownItem>Support</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
              <CDropdown>
                <CDropdownToggle color="light">
                  <CIcon icon={cilOptions} className="me-2" />
                  Actions
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem>Import Contacts</CDropdownItem>
                  <CDropdownItem>Export Contacts</CDropdownItem>
                  <CDropdownItem>Bulk Delete</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center p-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading contacts...</p>
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : (
            <CTable hover responsive className="contact-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>CONTACT</CTableHeaderCell>
                  <CTableHeaderCell>PHONE</CTableHeaderCell>
                  <CTableHeaderCell>EMAIL</CTableHeaderCell>
                  <CTableHeaderCell>TAGS</CTableHeaderCell>
                  <CTableHeaderCell>CREATED</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">ACTIONS</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {currentContacts.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="6" className="text-center py-5">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <CIcon icon={cilUser} size="xl" />
                        </div>
                        <h4>No contacts found</h4>
                        <p>Try adjusting your search or filter to find what you're looking for.</p>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentContacts.map(contact => (
                    <CTableRow key={contact._id || contact.id}>
                      <CTableDataCell>
                        <div className="contact-name">{contact.name || 'Unknown'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="contact-phone">
                          <CIcon icon={cilPhone} className="me-2 text-muted" />
                          {contact.phone || 'N/A'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="contact-email">
                          <CIcon icon={cilEnvelopeClosed} className="me-2 text-muted" />
                          {contact.email || 'N/A'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="contact-tags">
                          {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                            contact.tags.map((tag, index) => (
                              <span key={index} className={`tag tag-${tag.toLowerCase().replace(' ', '-')}`}>
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="tag tag-none">No Tags</span>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="contact-date">
                          {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton color="light" size="sm" className="action-btn edit-btn me-2">
                          Edit
                        </CButton>
                        <CButton color="light" size="sm" className="action-btn delete-btn">
                          Delete
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}

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
    </div>
  )
}

export default ContactList
