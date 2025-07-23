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
  CFormSelect,
  CSpinner,
  CAlert,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilPencil, cilTrash, cilBuilding } from '@coreui/icons'
import './Department.css'

function Department() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' })
  const [validationError, setValidationError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    employees: 0,
    status: 'Active'
  })

  // Mock department data
  const mockDepartments = [
    {
      id: 1,
      name: 'Human Resources',
      description: 'Managing employee relations and policies',
      manager: 'Sarah Johnson',
      employees: 15,
      status: 'Active',
      createdDate: '2024-01-15'
    },
    {
      id: 2,
      name: 'Information Technology',
      description: 'Technology infrastructure and support',
      manager: 'Mike Chen',
      employees: 22,
      status: 'Active',
      createdDate: '2024-02-01'
    },
    {
      id: 3,
      name: 'Sales & Marketing',
      description: 'Revenue generation and brand promotion',
      manager: 'Emma Davis',
      employees: 18,
      status: 'Active',
      createdDate: '2024-01-20'
    },
    {
      id: 4,
      name: 'Finance & Accounting',
      description: 'Financial planning and accounting operations',
      manager: 'Robert Smith',
      employees: 12,
      status: 'Active',
      createdDate: '2024-01-10'
    },
    {
      id: 5,
      name: 'Customer Support',
      description: 'Customer service and technical support',
      manager: 'Lisa Wilson',
      employees: 25,
      status: 'Inactive',
      createdDate: '2024-03-01'
    }
  ]

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDepartments(mockDepartments)
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewDepartment = () => {
    setEditingDepartment(null)
    setFormData({
      name: '',
      description: '',
      manager: '',
      employees: 0,
      status: 'Active'
    })
    setShowDepartmentModal(true)
  }

  const handleCloseModal = () => {
    setShowDepartmentModal(false)
    setValidationError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'employees' ? parseInt(value) || 0 : value
    }))
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description,
      manager: department.manager,
      employees: department.employees,
      status: department.status
    })
    setShowDepartmentModal(true)
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDepartments(departments.filter(dept => dept.id !== deleteId))
      setDeleteSuccess(true)
      
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteSuccess(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error deleting department:', error)
      setDeleteError('An error occurred while deleting the department. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveDepartment = () => {
    if (!formData.name.trim()) {
      setValidationError('Department name is required')
      return
    }

    try {
      if (editingDepartment) {
        setDepartments(departments.map(dept => 
          dept.id === editingDepartment.id 
            ? { ...dept, ...formData }
            : dept
        ))
        setSuccessAlert({
          show: true, 
          message: `Department "${formData.name}" has been updated successfully.`
        })
      } else {
        const newDepartment = {
          id: departments.length + 1,
          ...formData,
          createdDate: new Date().toISOString().split('T')[0]
        }
        setDepartments([...departments, newDepartment])
        setSuccessAlert({
          show: true, 
          message: `New department "${formData.name}" has been created successfully.`
        })
      }
      
      handleCloseModal()
      
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' })
      }, 5000)
    } catch (err) {
      console.error('Error saving department:', err)
      setValidationError(`Failed to save department: ${err.message}`)
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDepartments = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const getStatusBadge = (status) => {
    const color = status === 'Active' ? 'success' : 'secondary'
    return <CBadge color={color}>{status}</CBadge>
  }

  return (
    <div className="contact-list-container">
      {successAlert.show && (
        <CAlert color="success" dismissible onClose={() => setSuccessAlert({ show: false, message: '' })}>
          {successAlert.message}
        </CAlert>
      )}
      
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="contact-list-title">Department Management</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-contact-btn" onClick={handleNewDepartment}>
                <CIcon icon={cilPlus} className="me-2" />
                New Department
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search departments..."
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
                <CTableHeaderCell>DEPARTMENT NAME</CTableHeaderCell>
                <CTableHeaderCell>MANAGER</CTableHeaderCell>
                <CTableHeaderCell>EMPLOYEES</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
                <CTableHeaderCell>ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading departments...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentDepartments.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilBuilding} size="xl" />
                      </div>
                      <h4>No departments found</h4>
                      <p>Create your first department to get started.</p>
                      <CButton color="primary" className="mt-3" onClick={handleNewDepartment}>
                        Create Department
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentDepartments.map((department, index) => (
                  <CTableRow key={department.id}>
                    <CTableDataCell>
                      <div className="contact-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-name">{department.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{department.manager}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{department.employees}</div>
                    </CTableDataCell>
                    <CTableDataCell>{getStatusBadge(department.status)}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(department)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfirm(department.id)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
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

      {/* Add/Edit Department Modal */}
      <CModal visible={showDepartmentModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {validationError && (
            <CAlert color="danger" className="mb-3">
              {validationError}
            </CAlert>
          )}
          <CForm>
            <div className="mb-3">
              <CFormLabel>Department Name</CFormLabel>
              <CFormInput
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter department name"
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Description</CFormLabel>
              <CFormInput
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter department description"
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Manager</CFormLabel>
              <CFormInput
                name="manager"
                value={formData.manager}
                onChange={handleInputChange}
                placeholder="Enter manager name"
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Number of Employees</CFormLabel>
              <CFormInput
                type="number"
                name="employees"
                value={formData.employees}
                onChange={handleInputChange}
                placeholder="Enter number of employees"
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Status</CFormLabel>
              <CFormSelect
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </CFormSelect>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveDepartment}>
            {editingDepartment ? 'Update' : 'Save'} Department
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={handleDeleteCancel}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteError && (
            <CAlert color="danger" className="mb-3">
              {deleteError}
            </CAlert>
          )}
          {deleteSuccess ? (
            <CAlert color="success" className="mb-3">
              Department deleted successfully!
            </CAlert>
          ) : (
            <p>Are you sure you want to delete this department? This action cannot be undone.</p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </CButton>
          <CButton 
            color="danger" 
            onClick={handleDelete} 
            disabled={isDeleting || deleteSuccess}
          >
            {isDeleting ? <CSpinner size="sm" className="me-2" /> : null}
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Department
