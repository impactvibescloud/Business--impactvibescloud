import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CFormInput,
  CFormSelect,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPlus } from '@coreui/icons'
import './AutodialCampaigns.css'

function AutodialCampaigns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Campaign status')

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
      statusFilter === 'Campaign status' || campaign.status === statusFilter
    )

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('Campaign status')
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
    <div className="autodial-campaigns-container">
      <CRow>
        <CCol xs={12}>
          <div className="autodial-campaigns-header">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="autodial-campaigns-title">Autodial campaigns</h1>
            </div>
          </div>
          
          <div className="autodial-campaigns-controls">
            <CRow className="mb-4 align-items-center">
              <CCol md={4}>
                <div className="search-input-container">
                  <CIcon icon={cilSearch} className="search-icon" />
                  <CFormInput
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="Campaign status">Campaign status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Paused">Paused</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CButton
                  color="link"
                  onClick={handleClearFilters}
                  className="clear-filters-btn"
                >
                  Clear filters
                </CButton>
              </CCol>
            </CRow>
          </div>

          <CCard className="campaigns-table-card">
            <CCardBody className="p-0">
              <div className="campaigns-table-container">
                <CTable hover className="mb-0">
                  <CTableHead className="table-header">
                    <CTableRow>
                      <CTableHeaderCell className="table-header-cell">
                        CAMPAIGN
                      </CTableHeaderCell>
                      <CTableHeaderCell className="table-header-cell-center">
                        CREATED ON
                      </CTableHeaderCell>
                      <CTableHeaderCell className="table-header-cell-center">
                        CONTACTS
                      </CTableHeaderCell>
                      <CTableHeaderCell className="table-header-cell-center">
                        REACHED
                      </CTableHeaderCell>
                      <CTableHeaderCell className="table-header-cell-center">
                        STATUS
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map((campaign) => (
                        <CTableRow key={campaign.id} className="table-row">
                          <CTableDataCell className="table-cell">
                            <span className="campaign-name">{campaign.name}</span>
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {campaign.createdOn}
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {campaign.contacts.toLocaleString()}
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {campaign.reached.toLocaleString()} ({Math.round((campaign.reached / campaign.contacts) * 100)}%)
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {renderStatusBadge(campaign.status)}
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan="5" className="empty-state">
                          <div className="empty-content">
                            <div className="empty-icon">
                              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <path 
                                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                  stroke="#9CA3AF" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <h3 className="empty-title">No data</h3>
                            <p className="empty-subtitle">No records found for selection.</p>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              <div className="pagination-container">
                <CRow className="align-items-center">
                  <CCol md={6}>
                    <div className="rows-per-page">
                      <span className="pagination-info">
                        Rows per page:
                      </span>
                      <CFormSelect
                        size="sm"
                        style={{ width: 'auto' }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  <CCol md={6} className="text-end">
                    <span className="pagination-info">
                      {filteredCampaigns.length > 0 
                        ? `1-${filteredCampaigns.length} of ${filteredCampaigns.length}`
                        : '0-0 of 0'
                      }
                    </span>
                  </CCol>
                </CRow>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default AutodialCampaigns
