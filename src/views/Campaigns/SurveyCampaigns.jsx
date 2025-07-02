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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormCheck,
  CFormTextarea
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch } from '@coreui/icons'
import './SurveyCampaigns.css'

function SurveyCampaigns() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [introText, setIntroText] = useState('')
  const [questionTitle, setQuestionTitle] = useState('')
  const [thankYouMessage, setThankYouMessage] = useState('')
  const [responseTime, setResponseTime] = useState('5 secs')
  const [questionType, setQuestionType] = useState('Yes/No')

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

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('All Status')
  }
  
  const handleCreateSurvey = () => {
    setShowCreateSurveyModal(true)
  }
  
  const handleCloseModal = () => {
    setShowCreateSurveyModal(false)
    setCampaignName('')
    setIntroText('')
    setQuestionTitle('')
    setThankYouMessage('')
    setResponseTime('5 secs')
    setQuestionType('Yes/No')
  }
  
  const handleSaveSurvey = () => {
    // Here you would typically save the survey data to your backend
    console.log('Saving survey:', { 
      campaignName, 
      introText, 
      questionTitle, 
      thankYouMessage,
      responseTime,
      questionType 
    })
    
    // Close the modal after saving
    handleCloseModal()
    
    // Optionally add the new survey to the list
    // setResults([...results, newSurvey])
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
      <CRow>
        <CCol xs={12}>
          <div className="survey-campaigns-header">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="survey-campaigns-title">Survey Campaigns</h1>
              <CButton 
                className="new-survey-btn d-flex align-items-center"
                onClick={handleCreateSurvey}
              >
                <CIcon icon={cilPlus} className="me-2" />
                New Survey
              </CButton>
            </div>
          </div>
          
          <div className="survey-campaigns-controls">
            <CRow className="mb-4 align-items-center">
              <CCol md={4}>
                <div className="search-input-container">
                  <CIcon 
                    icon={cilSearch} 
                    className="search-icon"
                  />
                  <CFormInput
                    type="text"
                    placeholder="Search surveys..."
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
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CButton
                  color="link"
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </CButton>
              </CCol>
            </CRow>
          </div>

          <CCard className="survey-content-card">
            <CCardBody className="p-0">
              {filteredSurveys.length > 0 ? (
                <div className="surveys-table-container">
                  <CTable hover className="mb-0">
                    <CTableHead className="table-header">
                      <CTableRow>
                        <CTableHeaderCell className="table-header-cell">
                          SURVEY
                        </CTableHeaderCell>
                        <CTableHeaderCell className="table-header-cell-center">
                          CREATED ON
                        </CTableHeaderCell>
                        <CTableHeaderCell className="table-header-cell-center">
                          RESPONSES
                        </CTableHeaderCell>
                        <CTableHeaderCell className="table-header-cell-center">
                          COMPLETION RATE
                        </CTableHeaderCell>
                        <CTableHeaderCell className="table-header-cell-center">
                          STATUS
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredSurveys.map((survey) => (
                        <CTableRow key={survey.id} className="table-row">
                          <CTableDataCell className="table-cell">
                            <span className="survey-name">{survey.name}</span>
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {survey.createdOn}
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
                            {survey.responses.toLocaleString()}
                          </CTableDataCell>
                          <CTableDataCell className="table-cell text-center">
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
                          <CTableDataCell className="table-cell text-center">
                            {renderStatusBadge(survey.status)}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

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
                          {`1-${filteredSurveys.length} of ${filteredSurveys.length}`}
                        </span>
                      </CCol>
                    </CRow>
                  </div>
                </div>
              ) : (
                <div className="survey-empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V10L12 5" 
                          stroke="#9CA3AF" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="empty-title">No surveys yet</h3>
                    <p className="empty-subtitle">Get started by creating your first survey campaign</p>
                    <CButton 
                      className="create-survey-btn mt-3"
                      onClick={handleCreateSurvey}
                    >
                      <CIcon icon={cilPlus} className="me-2" />
                      Create Survey
                    </CButton>
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Create Survey Modal */}
      <CModal 
        visible={showCreateSurveyModal} 
        onClose={handleCloseModal}
        alignment="center"
        size="lg"
        className="create-survey-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Create survey</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            {/* Campaign name */}
            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <CFormLabel>Campaign name</CFormLabel>
                <div className="response-time-selector">
                  <span className="me-2">Max response time per question</span>
                  <CFormSelect 
                    value={responseTime}
                    onChange={(e) => setResponseTime(e.target.value)}
                    size="sm"
                    style={{ width: '100px', display: 'inline-block' }}
                  >
                    <option value="5 secs">5 secs</option>
                    <option value="10 secs">10 secs</option>
                    <option value="15 secs">15 secs</option>
                    <option value="20 secs">20 secs</option>
                    <option value="30 secs">30 secs</option>
                  </CFormSelect>
                </div>
              </div>
              <CFormInput
                type="text"
                id="campaignName"
                placeholder="Enter campaign name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            {/* Introduction */}
            <div className="mb-3">
              <CFormLabel>Introduction</CFormLabel>
              <CFormInput
                type="text"
                id="introText"
                placeholder="Enter introduction text"
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
              />
            </div>

            {/* Question section */}
            <div className="question-section mb-3">
              <div className="question-header d-flex align-items-center justify-content-between">
                <div>QUESTION - 1</div>
                <button className="btn btn-link add-question-btn p-0">
                  <CIcon icon={cilPlus} size="sm" className="me-1" />
                </button>
              </div>
              
              {/* Question type */}
              <div className="mb-3">
                <CFormLabel>Question type</CFormLabel>
                <CFormSelect 
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                >
                  <option value="Yes/No">Yes/No</option>
                  <option value="Multiple Choice">Multiple Choice</option>
                  <option value="Rating">Rating</option>
                  <option value="Text">Text</option>
                </CFormSelect>
              </div>

              {/* Yes/No options */}
              {questionType === 'Yes/No' && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Keypress</span>
                  </div>
                  <div className="option-item d-flex align-items-center mb-2">
                    <CFormCheck 
                      id="optionYes"
                      defaultChecked
                    />
                    <CFormLabel htmlFor="optionYes" className="ms-2 mb-0">Yes</CFormLabel>
                  </div>
                  <div className="option-item d-flex align-items-center">
                    <CFormCheck 
                      id="optionNo"
                      defaultChecked
                    />
                    <CFormLabel htmlFor="optionNo" className="ms-2 mb-0">No</CFormLabel>
                  </div>
                </div>
              )}

              {/* Question title */}
              <div className="mb-3">
                <CFormLabel>Question title</CFormLabel>
                <CFormInput
                  type="text"
                  id="questionTitle"
                  placeholder="Enter question title"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                />
              </div>

              {/* Question recording */}
              <div className="mb-3">
                <CFormLabel>Question recording</CFormLabel>
                <div className="recording-placeholder border d-flex align-items-center justify-content-center p-3" style={{height: '60px', borderStyle: 'dashed', borderRadius: '4px'}}>
                  <div className="text-center">
                    <CIcon icon={cilPlus} size="sm" className="me-1" />
                    <span>Upload audio</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thank you message */}
            <div className="mb-3">
              <CFormLabel>Thank you</CFormLabel>
              <CFormInput
                type="text"
                id="thankYouMessage"
                placeholder="Enter thank you message"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <CButton 
            color="light"
            onClick={handleCloseModal}
          >
            Cancel
          </CButton>
          <CButton 
            color="success"
            onClick={handleSaveSurvey}
          >
            Create
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default SurveyCampaigns
