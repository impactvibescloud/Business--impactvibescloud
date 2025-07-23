import React, { useState, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CFormSelect,
  CInputGroup,
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
  CFormTextarea,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilTrash, cilCloudUpload } from '@coreui/icons'
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
  const [audioFile, setAudioFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')
  const [keypressYes, setKeypressYes] = useState(false)
  const [keypressNo, setKeypressNo] = useState(true)
  const [formError, setFormError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)
  
  const fileInputRef = useRef(null)

  // Sample data for demonstration
  const [surveys, setSurveys] = useState([
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
  ])

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
    setAudioFile(null)
    setAudioFileName('')
    setKeypressYes(false)
    setKeypressNo(true)
    setFormError('')
  }
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      setFormError('Please upload an audio file')
      return
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size should not exceed 10MB')
      return
    }
    
    setAudioFile(file)
    setAudioFileName(file.name)
    setFormError('')
  }
  
  const handleBrowseClick = () => {
    fileInputRef.current.click()
  }
  
  const handleRemoveAudio = () => {
    setAudioFile(null)
    setAudioFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleSaveSurvey = () => {
    // Validate form
    if (!campaignName.trim()) {
      setFormError('Campaign name is required')
      return
    }
    
    if (!questionTitle.trim()) {
      setFormError('Question title is required')
      return
    }
    
    // Create new survey object
    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0]
    
    const newSurvey = {
      id: surveys.length + 1,
      name: campaignName,
      createdOn: formattedDate,
      responses: 0,
      status: 'Draft',
      completionRate: 0,
      keypressYes,
      keypressNo,
      audioFile: audioFileName
    }
    
    // Add the new survey to the list
    setSurveys([...surveys, newSurvey])
    
    // Show success message briefly
    setCreateSuccess(true)
    setTimeout(() => setCreateSuccess(false), 3000)
    
    // Close the modal after saving
    handleCloseModal()
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
    <div className="contact-list-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Survey Campaigns</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton 
                color="primary"
                className="add-contact-btn"
                onClick={handleCreateSurvey}
              >
                <CIcon icon={cilPlus} className="me-2" />
                New Survey
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={4}>
              <CInputGroup>
                <CFormInput
                  type="text"
                  placeholder="Search surveys..."
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
                <option value="Draft">Draft</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CTable hover responsive className="contact-table">
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
              {filteredSurveys.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No surveys found</h4>
                      <p>Create your first survey campaign to get started.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredSurveys.map((survey, index) => (
                  <CTableRow key={survey.id}>
                    <CTableDataCell>
                      <div className="contact-number">{index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-name">{survey.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{survey.createdOn}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{survey.responses.toLocaleString()}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{survey.completionRate}%</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge 
                        color={survey.status === 'Active' ? 'success' : 
                               survey.status === 'Draft' ? 'secondary' : 'warning'}
                      >
                        {survey.status}
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

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
          {formError && <CAlert color="danger" className="mb-3">{formError}</CAlert>}
          {createSuccess && <CAlert color="success" className="mb-3">Survey created successfully!</CAlert>}
          
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
                required
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
                <button type="button" className="btn btn-link add-question-btn p-0">
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
                      checked={keypressYes}
                      onChange={(e) => {
                        setKeypressYes(e.target.checked)
                        if (e.target.checked) setKeypressNo(false)
                      }}
                    />
                    <CFormLabel htmlFor="optionYes" className="ms-2 mb-0">Yes</CFormLabel>
                  </div>
                  <div className="option-item d-flex align-items-center">
                    <CFormCheck 
                      id="optionNo"
                      checked={keypressNo}
                      onChange={(e) => {
                        setKeypressNo(e.target.checked)
                        if (e.target.checked) setKeypressYes(false)
                      }}
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
                  required
                />
              </div>

              {/* Question recording */}
              <div className="mb-3">
                <CFormLabel>Question recording</CFormLabel>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                
                {!audioFile ? (
                  <div 
                    className="recording-placeholder border d-flex align-items-center justify-content-center p-3 cursor-pointer" 
                    style={{height: '60px', borderStyle: 'dashed', borderRadius: '4px', cursor: 'pointer'}}
                    onClick={handleBrowseClick}
                  >
                    <div className="text-center">
                      <CIcon icon={cilCloudUpload} size="lg" className="me-2" />
                      <span>Upload audio</span>
                    </div>
                  </div>
                ) : (
                  <div className="audio-file-selected border p-3" style={{borderRadius: '4px', position: 'relative'}}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Selected file:</strong> {audioFileName}
                      </div>
                      <CButton 
                        color="danger" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRemoveAudio}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  </div>
                )}
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
            color="primary"
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
