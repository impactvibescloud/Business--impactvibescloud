import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CSpinner,
  CInputGroup,
  CPagination,
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch } from '@coreui/icons'
import './SurveyCampaigns.css'

function SurveyCampaigns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)

  // Sample data for demonstration
  const surveys = [
    {
      id: 1,
      name: 'Customer Satisfaction Survey',
      createdOn: '2023-10-05',
      responses: 325,
      status: 'Active',
      completionRate: 68,
    },
    {
      id: 2,
      name: 'Product Feedback',
      createdOn: '2023-09-18',
      responses: 152,
      status: 'Draft',
      completionRate: 0,
    },
    {
      id: 3,
      name: 'Website User Experience',
      createdOn: '2023-11-01',
      responses: 472,
      status: 'Active',
      completionRate: 74,
    },
  ]

  // Filter surveys based on search term and status
  const filteredSurveys = surveys
    .filter(survey => 
      survey.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(survey => 
      statusFilter === 'All Status' || survey.status === statusFilter
    )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSurveys = filteredSurveys.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage)

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
      'Draft': 'status-badge status-draft'
    }
    
    return (
      <span className={badgeClasses[status] || 'status-badge'}>
        {status}
      </span>
    )
  }

  return (
    <div className="survey-campaigns-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="survey-campaigns-title">Survey Campaigns</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-survey-btn">
                <CIcon icon={cilPlus} className="me-2" />
                New Survey
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CButton
                color="link"
                onClick={handleClearFilters}
                className="clear-filters-btn"
              >
                Clear filters
              </CButton>
            </CCol>
          </CRow>

          <CTable hover responsive className="surveys-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>SURVEY NAME</CTableHeaderCell>
                <CTableHeaderCell>CREATED ON</CTableHeaderCell>
                <CTableHeaderCell>RESPONSES</CTableHeaderCell>
                <CTableHeaderCell>COMPLETION RATE</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading surveys...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentSurveys.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No surveys found</h4>
                      <p>Create your first survey campaign to get started.</p>
                      <CButton color="primary" className="mt-3">
                        <CIcon icon={cilPlus} className="me-2" />
                        New Survey
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentSurveys.map((survey, index) => (
                  <CTableRow key={survey.id}>
                    <CTableDataCell>
                      <div className="survey-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="survey-name">{survey.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="survey-date">{survey.createdOn}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="survey-responses">{survey.responses.toLocaleString()}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="completion-rate-wrapper">
                        <div className="completion-rate-bar">
                          <div 
                            className="completion-rate-progress" 
                            style={{ width: `${survey.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="completion-rate-text">{survey.completionRate}%</span>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge 
                        color={survey.status === 'Active' ? 'success' : 
                               survey.status === 'Draft' ? 'warning' : 'secondary'}
                        className="status-badge"
                      >
                        {survey.status}
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

export default SurveyCampaigns
