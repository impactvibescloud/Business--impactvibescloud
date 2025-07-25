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
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFilter, cilPencil, cilTrash } from '@coreui/icons'
import './Templates.css'

function Templates() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Templates')
  const [templateForm, setTemplateForm] = useState({
    name: '',
    message: ''
  })
  
  // Sample template data
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Welcome Message', category: 'Greeting', lastModified: '2025-06-20', status: 'Active', message: 'Hello {{name}}, welcome to our service! We are glad to have you onboard.' },
    { id: 2, name: 'Follow-up Email', category: 'Email', lastModified: '2025-06-18', status: 'Active', message: 'Hi {{name}}, just following up on our recent conversation about {{topic}}.' },
    { id: 3, name: 'Support Ticket Response', category: 'Support', lastModified: '2025-06-15', status: 'Inactive', message: 'Thank you for contacting support. Your ticket #{{ticketId}} has been received.' },
    { id: 4, name: 'Appointment Reminder', category: 'Notification', lastModified: '2025-06-12', status: 'Active', message: 'This is a reminder about your upcoming appointment on {{date}} at {{time}}.' },
    { id: 5, name: 'Survey Request', category: 'Feedback', lastModified: '2025-06-10', status: 'Active', message: 'We value your feedback! Please take a moment to complete our short survey.' }
  ])
  
  // Filter templates by search term and status filter
  const filteredTemplates = templates.filter(template => {
    // Apply search filter
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply status filter
    let matchesFilter = true
    if (activeFilter === 'Active') {
      matchesFilter = template.status === 'Active'
    } else if (activeFilter === 'Inactive') {
      matchesFilter = template.status === 'Inactive'
    }
    
    return matchesSearch && matchesFilter
  })
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTemplates = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage)
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }
  
  const openNewTemplateModal = () => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', message: '' })
    setFormError('')
    setSuccessMessage('')
    setShowNewTemplateModal(true)
  }
  
  const openEditTemplateModal = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      message: template.message
    })
    setFormError('')
    setSuccessMessage('')
    setShowNewTemplateModal(true)
  }
  
  const closeTemplateModal = () => {
    setShowNewTemplateModal(false)
    setEditingTemplate(null)
    setTemplateForm({ name: '', message: '' })
    setFormError('')
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTemplateForm(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      setFormError('Template name is required')
      return
    }
    
    if (!templateForm.message.trim()) {
      setFormError('Template message is required')
      return
    }
    
    setIsSubmitting(true)
    setFormError('')
    
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingTemplate) {
        // Update existing template
        setTemplates(prevTemplates => 
          prevTemplates.map(template => 
            template.id === editingTemplate.id ? 
            { 
              ...template, 
              name: templateForm.name, 
              message: templateForm.message,
              lastModified: new Date().toISOString().split('T')[0]
            } : 
            template
          )
        )
        setSuccessMessage('Template updated successfully!')
      } else {
        // Create new template
        const newTemplate = {
          id: Date.now(),
          name: templateForm.name,
          message: templateForm.message,
          category: 'General',
          lastModified: new Date().toISOString().split('T')[0],
          status: 'Active'
        }
        
        setTemplates(prevTemplates => [...prevTemplates, newTemplate])
        setSuccessMessage('Template created successfully!')
      }
      
      // Close modal after showing success message briefly
      setTimeout(() => {
        closeTemplateModal()
      }, 1500)
    } catch (error) {
      console.error('Error saving template:', error)
      setFormError('Failed to save template. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const confirmDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }
  
  const cancelDelete = () => {
    setDeleteId(null)
    setShowDeleteModal(false)
    setDeleteSuccessMessage('')
  }
  
  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    setDeleteSuccessMessage('')
    
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Find the template name for better user feedback
      const templateToDelete = templates.find(template => template.id === deleteId)
      const templateName = templateToDelete ? templateToDelete.name : 'Template'
      
      // Remove template from state
      setTemplates(prevTemplates => 
        prevTemplates.filter(template => template.id !== deleteId)
      )
      
      setDeleteSuccessMessage(`"${templateName}" has been deleted successfully!`)
      
      // Close modal after brief delay
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteSuccessMessage('')
      }, 2000)
    } catch (error) {
      console.error('Error deleting template:', error)
      setFormError('Failed to delete template. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1) // Reset to first page when filter changes
  }
  
  return (
    <div className="contact-list-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Message Templates</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton
                color="primary"
                className="add-contact-btn"
                onClick={openNewTemplateModal}
              >
                <CIcon icon={cilPlus} className="me-2" />
                New Template
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={4}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={4}>
              <CDropdown>
                <CDropdownToggle color="primary" variant="outline">
                  <CIcon icon={cilFilter} className="me-2" />
                  {activeFilter}
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('All Templates')} 
                    active={activeFilter === 'All Templates'}
                  >
                    All Templates
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Active')} 
                    active={activeFilter === 'Active'}
                  >
                    Active
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Inactive')} 
                    active={activeFilter === 'Inactive'}
                  >
                    Inactive
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>
          
          <CTable hover responsive className="contact-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>TEMPLATE NAME</CTableHeaderCell>
                <CTableHeaderCell>CATEGORY</CTableHeaderCell>
                <CTableHeaderCell>LAST MODIFIED</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
                <CTableHeaderCell>ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {currentTemplates.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No templates found</h4>
                      <p>No message templates match your current search or filter criteria.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentTemplates.map((template, index) => (
                  <CTableRow key={template.id}>
                    <CTableDataCell>
                      <div className="contact-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-name">{template.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{template.category}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{template.lastModified}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`status-badge ${template.status.toLowerCase()}`}>
                        {template.status}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="template-actions">
                        <CButton 
                          color="primary" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditTemplateModal(template)}
                          title="Edit Template"
                          className="me-2"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton 
                          color="danger" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => confirmDelete(template.id)}
                          title="Delete Template"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
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
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </CPaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <CPaginationItem 
                  key={i} 
                  active={i + 1 === currentPage}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </CPaginationItem>
            </CPagination>
          )}
        </CCardBody>
      </CCard>

      {/* New/Edit Template Modal */}
      <CModal 
        visible={showNewTemplateModal} 
        onClose={closeTemplateModal}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>{editingTemplate ? 'Edit template' : 'New template'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formError && (
            <CAlert color="danger" className="mb-3">
              {formError}
            </CAlert>
          )}
          
          {successMessage && (
            <CAlert color="success" className="mb-3">
              {successMessage}
            </CAlert>
          )}
          
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="templateName" className="required-field">Template name</CFormLabel>
              <CFormInput
                id="templateName"
                name="name"
                value={templateForm.name}
                onChange={handleInputChange}
                placeholder="Enter template name"
              />
            </div>
            
            <div className="mb-3">
              <CFormLabel htmlFor="message" className="required-field">Message</CFormLabel>
              <CFormTextarea
                id="message"
                name="message"
                value={templateForm.message}
                onChange={handleInputChange}
                rows={6}
                placeholder="Enter message or type '@' to insert variables"
              />
              <div className="insert-variable-container">
                <CButton 
                  color="link" 
                  size="sm" 
                  className="insert-variable-btn"
                >
                  Insert Variable
                </CButton>
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeTemplateModal} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveTemplate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <CSpinner size="sm" className="me-1" />
                {editingTemplate ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              editingTemplate ? 'Save Changes' : 'Create'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Delete Confirmation Modal */}
      <CModal 
        visible={showDeleteModal} 
        onClose={cancelDelete}
        size="sm"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Delete Template</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteSuccessMessage && (
            <CAlert color="success">
              {deleteSuccessMessage}
            </CAlert>
          )}
          {!deleteSuccessMessage && (
            <>
              <p>Are you sure you want to delete this template?</p>
              <p className="text-danger fw-bold">This action cannot be undone.</p>
              {deleteId && (
                <p className="mt-3 mb-0 fw-bold">
                  Template: {templates.find(t => t.id === deleteId)?.name}
                </p>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          {!deleteSuccessMessage && (
            <>
              <CButton color="secondary" onClick={cancelDelete} disabled={isDeleting}>
                Cancel
              </CButton>
              <CButton color="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <CSpinner size="sm" className="me-1" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Templates
