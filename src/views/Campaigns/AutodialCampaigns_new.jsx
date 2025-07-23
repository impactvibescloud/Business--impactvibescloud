import React, { useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CFormInput,
  CFormSelect,
  CBadge,
  CSpinner,
  CAlert,
  CInputGroup,
  CPagination,
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPlus } from '@coreui/icons'
import './AutodialCampaigns.css'

function AutodialCampaigns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)

  // Sample data for demonstration
  const campaigns = [
    {
      id: 1,
      name: 'Q4 Customer Outreach',
      createdOn: '2023-09-15',
      contacts: 1250,
      reached: 943,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Product Feedback Survey',
      createdOn: '2023-08-22',
      contacts: 850,
      reached: 712,
      status: 'Paused',
    },
    {
      id: 3,
      name: 'New Release Announcement',
      createdOn: '2023-07-10',
      contacts: 2100,
      reached: 1877,
      status: 'Active',
    },
  ]

  // Filter campaigns based on search term and status
  const filteredCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(campaign => 
      statusFilter === 'All Status' || campaign.status === statusFilter
    )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('All Status')
    setCurrentPage(1)
  }

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status) => {
    const badgeClasses = {
      'Active': 'status-badge status-active',
      'Inactive': 'status-badge status-inactive',
      'Paused': 'status-badge status-paused'
    }
    
    return (
      <span className={badgeClasses[status] || 'status-badge'}>
        {status}
      </span>
    )
  }

  return (
    <div className="contact-list-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Autodial Campaigns</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-contact-btn">
                <CIcon icon={cilPlus} className="me-2" />
                New Campaign
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={4}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Paused">Paused</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CTable hover responsive className="contact-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>CAMPAIGN NAME</CTableHeaderCell>
                <CTableHeaderCell>CREATED ON</CTableHeaderCell>
                <CTableHeaderCell>CONTACTS</CTableHeaderCell>
                <CTableHeaderCell>REACHED</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading campaigns...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentCampaigns.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No campaigns found</h4>
                      <p>Create your first autodial campaign to get started.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentCampaigns.map((campaign, index) => (
                  <CTableRow key={campaign.id}>
                    <CTableDataCell>
                      <div className="contact-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-name">{campaign.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{campaign.createdOn}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{campaign.contacts.toLocaleString()}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">
                        {campaign.reached.toLocaleString()} ({Math.round((campaign.reached / campaign.contacts) * 100)}%)
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge 
                        color={campaign.status === 'Active' ? 'success' : 
                               campaign.status === 'Paused' ? 'warning' : 'secondary'}
                        className="status-badge"
                      >
                        {campaign.status}
                      </CBadge>
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
    </div>
  )
}

export default AutodialCampaigns
