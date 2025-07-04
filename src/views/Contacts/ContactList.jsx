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
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFilter, cilOptions, cilPhone, cilEnvelopeClosed, cilUser } from '@coreui/icons'
import './ContactList.css'

const ContactList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Sample data for contacts
  const contacts = [
    {
      id: 1,
      name: 'John Smith',
      phone: '+1 (555) 123-4567',
      email: 'john.smith@example.com',
      tags: ['Customer', 'Sales Lead'],
      createdAt: '2023-05-15'
    },
    {
      id: 2,
      name: 'Emily Johnson',
      phone: '+1 (555) 234-5678',
      email: 'emily.johnson@example.com',
      tags: ['Customer'],
      createdAt: '2023-05-10'
    },
    {
      id: 3,
      name: 'Michael Davis',
      phone: '+1 (555) 345-6789',
      email: 'michael.davis@example.com',
      tags: ['Sales Lead'],
      createdAt: '2023-05-05'
    },
    {
      id: 4,
      name: 'Jessica Wilson',
      phone: '+1 (555) 456-7890',
      email: 'jessica.wilson@example.com',
      tags: ['Customer', 'Support'],
      createdAt: '2023-04-28'
    },
    {
      id: 5,
      name: 'Robert Miller',
      phone: '+1 (555) 567-8901',
      email: 'robert.miller@example.com',
      tags: ['Support'],
      createdAt: '2023-04-20'
    }
  ]

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                  <CTableRow key={contact.id}>
                    <CTableDataCell>
                      <div className="contact-name">{contact.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">
                        <CIcon icon={cilPhone} className="me-2 text-muted" />
                        {contact.phone}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-email">
                        <CIcon icon={cilEnvelopeClosed} className="me-2 text-muted" />
                        {contact.email}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-tags">
                        {contact.tags.map((tag, index) => (
                          <span key={index} className={`tag tag-${tag.toLowerCase().replace(' ', '-')}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-date">{contact.createdAt}</div>
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
