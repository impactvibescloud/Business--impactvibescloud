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
import { apiCall, ENDPOINTS } from '../../config/api'
import { errorLog } from '../../utils/logger'
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
  const [currentBusinessId, setCurrentBusinessId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [availableAgents, setAvailableAgents] = useState([])
  const [availableBranches, setAvailableBranches] = useState([])
  const [formData, setFormData] = useState({
    businessId: '',
    name: '',
    description: '',
    status: 'active', // Changed from 'Active' to 'active' to match API
    departmentHead: '' // User ID of department head
  })

  // Get current user's business ID and fetch business details
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const response = await apiCall('/api/v1/user/details', 'GET')
          if (response?.user?.businessId) {
            setCurrentBusinessId(response.user.businessId)
            setFormData(prev => ({
              ...prev,
              businessId: response.user.businessId
            }))
            
            // Fetch business details to get business name
            await fetchBusinessDetails(response.user.businessId)
            // Fetch available agents/branches
            await fetchAvailableAgents(response.user.businessId)
          } else {
            // If user details don't have businessId, try to get it from localStorage
            const storedBusinessId = localStorage.getItem('businessId')
            if (storedBusinessId) {
              setCurrentBusinessId(storedBusinessId)
              setFormData(prev => ({
                ...prev,
                businessId: storedBusinessId
              }))
              await fetchBusinessDetails(storedBusinessId)
              await fetchAvailableAgents(storedBusinessId)
            } else {
              // Use fallback ID if nothing else works
              const fallbackId = '64f7b1234567890abcdef123'
              setCurrentBusinessId(fallbackId)
              setFormData(prev => ({
                ...prev,
                businessId: fallbackId
              }))
              await fetchBusinessDetails(fallbackId)
              await fetchAvailableAgents(fallbackId)
            }
          }
        }
      } catch (error) {
        errorLog('Error fetching user details:', error)
        // Fallback to default businessId
        const fallbackId = '64f7b1234567890abcdef123'
        setCurrentBusinessId(fallbackId)
        setBusinessName('My Business')
        setFormData(prev => ({
          ...prev,
          businessId: fallbackId
        }))
        await fetchAvailableAgents(fallbackId)
      }
    }
    getCurrentUser()
  }, [])

  const fetchBusinessDetails = async (businessId) => {
    try {
      // Using the business details endpoint from ENDPOINTS constant
      const response = await apiCall(ENDPOINTS.BUSINESS_DETAILS(businessId), 'GET')
      console.log('Business Details Response:', response)
      
      // Try to find the business name in all common API response formats
      if (response?.data?.name) {
        setBusinessName(response.data.name)
      } else if (response?.name) {
        setBusinessName(response.name)
      } else if (response?.businessName) {
        setBusinessName(response.businessName)
      } else if (response?.data?.businessName) {
        setBusinessName(response.data.businessName)
      } else if (response?.business?.name) {
        setBusinessName(response.business.name)
      } else if (response?.data?.business?.name) {
        setBusinessName(response.data.business.name)
      } else {
        // Try to find business name in localStorage as a last resort
        const storedBusinessName = localStorage.getItem('businessName')
        if (storedBusinessName) {
          setBusinessName(storedBusinessName)
        } else {
          // If all attempts fail, use a suitable default
          setBusinessName('Impact Vibes Cloud')
        }
      }
    } catch (error) {
      errorLog('Error fetching business details:', error)
      // Get business name from localStorage as fallback, or use a default
      const storedBusinessName = localStorage.getItem('businessName')
      setBusinessName(storedBusinessName || 'Impact Vibes Cloud')
    }
  }

  const fetchAvailableAgents = async (businessId) => {
    try {
      // Fetch branches using the API endpoint that other components are using
      const branchResponse = await apiCall(`/api/branch/${businessId}/branches`, 'GET')
      console.log('Branch Response:', branchResponse)
      
      // Handle different response formats
      let branchData = []
      if (branchResponse?.data?.data) {
        branchData = branchResponse.data.data
      } else if (branchResponse?.data) {
        branchData = branchResponse.data
      } else if (Array.isArray(branchResponse)) {
        branchData = branchResponse
      }
      
      // If no branches found, set as empty array instead of mock data
      if (!branchData || branchData.length === 0) {
        branchData = [];
        console.log('No branch data found, using empty array');
      }
      
      // Only map branch data if there's something to map
      if (branchData.length > 0) {
        // Ensure all branch records have required fields
        branchData = branchData.map(branch => ({
          _id: branch._id || branch.id || `branch-${Math.random().toString(36).substring(2, 9)}`,
          id: branch.id || branch._id || `branch-${Math.random().toString(36).substring(2, 9)}`,
          branchName: branch.branchName || branch.name || 'Unnamed Branch',
          name: branch.name || branch.branchName || 'Unnamed Branch'
        }));
      }
      
      setAvailableBranches(branchData)

      try {
        // Fetch users/agents with the correct endpoint
        // Using direct axios call to avoid potential issues with the apiCall utility
        const axios = await import('axios');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        // Use the same API endpoint as departments but for users
        const agentResponse = await axios.default.get(
          `http://localhost:5040/api/users`,
          {
            headers: {
              'Accept': '*/*',
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            params: {
              businessId: businessId
            }
          }
        );
        
        console.log('Agent Response:', agentResponse.data);
        
        // Handle different response formats
        let agentData = [];
        if (agentResponse.data?.data) {
          agentData = agentResponse.data.data;
        } else if (Array.isArray(agentResponse.data)) {
          agentData = agentResponse.data;
        } else if (typeof agentResponse.data === 'object' && agentResponse.data !== null) {
          // If it's a single object
          agentData = [agentResponse.data];
        }
        
        // If still no agents found, use empty array
        if (!agentData || agentData.length === 0) {
          console.log("No agent data found, using empty array");
          agentData = [];
        } else {
          // Process the agent data only if we have any
          agentData = agentData.map(agent => ({
            id: agent.id || agent._id || `agent-${Math.random().toString(36).substring(2, 9)}`,
            _id: agent._id || agent.id || `agent-${Math.random().toString(36).substring(2, 9)}`,
            name: agent.name || agent.fullName || 'Unknown Agent',
            email: agent.email || 'no-email@example.com'
          }));
        }
        
        setAvailableAgents(agentData);
      } catch (agentError) {
        console.error('Error fetching agents:', agentError);
        // Use empty array instead of mock data
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error in fetchAvailableAgents:', error);
      errorLog('Error fetching agents/branches:', error);
      
      // Set empty arrays instead of mock data
      setAvailableAgents([]);
      setAvailableBranches([]);
    }
  }

  // Mock department data (fallback)
  const mockDepartments = [
    {
      id: 1,
      businessId: '64f7b1234567890abcdef123',
      name: 'Human Resources',
      description: 'Managing employee relations and policies',
      agents: ['64f7b1234567890abcdef124', '64f7b1234567890abcdef125'],
      departmentHead: '64f7b1234567890abcdef124',
      status: 'active',
      createdDate: '2024-01-15'
    },
    {
      id: 2,
      businessId: '64f7b1234567890abcdef123',
      name: 'Information Technology',
      description: 'Technology infrastructure and support',
      agents: ['64f7b1234567890abcdef126', '64f7b1234567890abcdef127'],
      departmentHead: '64f7b1234567890abcdef126',
      status: 'active',
      createdDate: '2024-02-01'
    },
    {
      id: 3,
      businessId: '64f7b1234567890abcdef123',
      name: 'Sales & Marketing',
      description: 'Revenue generation and brand promotion',
      agents: ['64f7b1234567890abcdef128', '64f7b1234567890abcdef129'],
      departmentHead: '64f7b1234567890abcdef128',
      status: 'active',
      createdDate: '2024-01-20'
    },
    {
      id: 4,
      businessId: '64f7b1234567890abcdef123',
      name: 'Finance & Accounting',
      description: 'Financial planning and accounting operations',
      agents: ['64f7b1234567890abcdef130'],
      departmentHead: '64f7b1234567890abcdef130',
      status: 'active',
      createdDate: '2024-01-10'
    },
    {
      id: 5,
      businessId: '64f7b1234567890abcdef123',
      name: 'Customer Support',
      description: 'Customer service and technical support',
      agents: ['64f7b1234567890abcdef131', '64f7b1234567890abcdef132'],
      departmentHead: '64f7b1234567890abcdef131',
      status: 'inactive',
      createdDate: '2024-03-01'
    }
  ]

  useEffect(() => {
    if (currentBusinessId) {
      fetchDepartments()
    }
  }, [currentBusinessId])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      console.log('Using token:', token ? 'Token exists' : 'No token found')
      
      if (!currentBusinessId) {
        console.log('No business ID available yet');
        return;
      }
      
      // Use direct axios call instead of going through the apiCall utility
      const axios = await import('axios');
      
      console.log(`Making direct axios call to: http://localhost:5040/api/departments/business/${currentBusinessId}`);
      const response = await axios.default.get(`http://localhost:5040/api/departments/business/${currentBusinessId}`, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Direct axios response:', response);
      
      // Handle the axios response (data is in response.data)
      let departmentData = []; // Initialize as empty array, NOT mock data
      
      if (response.data) {
        console.log('Got data from direct axios call:', response.data);
        
        if (Array.isArray(response.data)) {
          departmentData = response.data;
          console.log('Using array response from axios');
        } else if (response.data.data && Array.isArray(response.data.data)) {
          departmentData = response.data.data;
          console.log('Using nested data array from axios');
        } else if (response.data.departments && Array.isArray(response.data.departments)) {
          departmentData = response.data.departments;
          console.log('Using departments array from axios');
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Last resort - try to use the object itself if it looks like a department
          if (response.data.name) {
            departmentData = [response.data];
            console.log('Using single department object from axios');
          } else {
            console.log('Could not parse department data from axios response, using empty array');
          }
        } else {
          console.log('Unexpected axios response format, using empty array');
        }
      } else {
        console.log('No data in axios response, using empty array');
      }
      
      console.log('Final departments data to be used:', departmentData);
      setDepartments(departmentData);
    } catch (error) {
      console.error('Error details when fetching departments:', error);
      
      // Log axios-specific error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server responded with error status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server. Is the server running?');
        console.error('Request details:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      // Additional connection troubleshooting
      console.log('Checking if backend is reachable...');
      try {
        // Attempt a simple connection test
        const axios = await import('axios');
        await axios.default.head('http://localhost:5040', { timeout: 2000 });
        console.log('Backend server is reachable');
      } catch (connError) {
        console.error('Backend server unreachable:', connError.message);
        console.log('Please ensure your backend server is running at http://localhost:5040');
      }
      
      errorLog('Error fetching departments:', error);
      // Use empty array instead of mock data
      console.log('Error occurred, using empty departments array');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }

  const handleNewDepartment = () => {
    setEditingDepartment(null)
    setFormData({
      businessId: currentBusinessId || '64f7b1234567890abcdef123',
      name: '',
      description: '',
      status: 'active', // Default to active for new departments
      departmentHead: ''
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
      [name]: value
    }))
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    setFormData({
      businessId: department.businessId || currentBusinessId || '64f7b1234567890abcdef123',
      name: department.name,
      description: department.description,
      status: department.status || 'active',
      departmentHead: department.departmentHead || ''
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
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      const axios = await import('axios');
      
      console.log(`Making DELETE request to: http://localhost:5040/api/departments/${deleteId}`);
      
      const response = await axios.default.delete(
        `http://localhost:5040/api/departments/${deleteId}`, 
        {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      console.log('Delete response:', response);
      
      // Update the departments list by filtering out the deleted department
      setDepartments(departments.filter(dept => (dept.id !== deleteId && dept._id !== deleteId)))
      setDeleteSuccess(true)
      
      // Refresh the departments list to ensure it's up-to-date
      setTimeout(() => {
        fetchDepartments();
      }, 1000);
      
      setTimeout(() => {
        setShowDeleteModal(false)
        setDeleteId(null)
        setDeleteSuccess(false)
      }, 1500)
      
    } catch (error) {
      errorLog('Error deleting department:', error)
      setDeleteError('An error occurred while deleting the department. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveDepartment = async () => {
    if (!formData.name.trim()) {
      setValidationError('Department name is required')
      return
    }

    try {
      // Import axios directly
      const axios = await import('axios');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Common headers for all requests
      const headers = {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Prepare department data
      const departmentData = {
        businessId: formData.businessId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        departmentHead: formData.departmentHead
      };
      
      let response;
      
      if (editingDepartment) {
        // Update existing department
        console.log('Updating department with data:', departmentData);
        
        const departmentId = editingDepartment.id || editingDepartment._id;
        console.log(`Making PUT request to: http://localhost:5040/api/departments/${departmentId}`);
        
        // Format matching the curl command exactly
        response = await axios.default.put(
          `http://localhost:5040/api/departments/${departmentId}`,
          {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            departmentHead: formData.departmentHead
          },
          { headers }
        );
        
        console.log('Update response:', response);
        
        if (response.status === 200 || response.status === 204) {
          setDepartments(departments.map(dept => 
            (dept.id === departmentId || dept._id === departmentId)
              ? { ...dept, ...formData }
              : dept
          ));
          setSuccessAlert({
            show: true, 
            message: `Department "${formData.name}" has been updated successfully.`
          });
        }
      } else {
        // Create new department
        console.log('Creating department with data:', departmentData);
        console.log('Making POST request to: http://localhost:5040/api/departments');
        
        response = await axios.default.post(
          'http://localhost:5040/api/departments',
          departmentData,
          { headers }
        );
        
        console.log('Create response:', response);
        
        if (response.status === 200 || response.status === 201) {
          // Get the ID from the response
          const newId = response.data._id || response.data.id || Date.now();
          
          const newDepartment = {
            id: newId,
            _id: newId,
            ...departmentData,
            createdDate: new Date().toISOString().split('T')[0]
          };
          
          setDepartments([...departments, newDepartment]);
          setSuccessAlert({
            show: true, 
            message: `New department "${formData.name}" has been created successfully.`
          });
        }
      }
      
      handleCloseModal()
      
      // Refresh departments list from server
      fetchDepartments();
      
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' })
      }, 5000)
    } catch (err) {
      console.error('Error when saving department:', err);
      
      // Detailed error logging
      if (err.response) {
        console.error('Server response error:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('No response from server:', err.request);
      } else {
        console.error('Request setup error:', err.message);
      }
      
      errorLog('Error saving department:', err)
      setValidationError(`Failed to save department: ${err.message || 'Unknown error'}`)
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    dept.status.toLowerCase().includes(searchTerm.toLowerCase())
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
    const normalizedStatus = status?.toLowerCase() || 'inactive'
    const color = normalizedStatus === 'active' ? 'success' : 'secondary'
    const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
    return <CBadge color={color}>{displayStatus}</CBadge>
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
                <CTableHeaderCell>DESCRIPTION</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
                <CTableHeaderCell>ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading departments...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentDepartments.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center py-5">
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
                  <CTableRow key={department.id || department._id}>
                    <CTableDataCell>
                      <div className="contact-number">{indexOfFirstItem + index + 1}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-name">{department.name}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="contact-phone">{department.description || 'No description'}</div>
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
                        onClick={() => handleDeleteConfirm(department.id || department._id)}
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
              <CFormLabel>Business</CFormLabel>
              <CFormInput
                value={businessName}
                placeholder="Business name"
                disabled
              />
              <small className="text-muted">This is automatically set based on your current business</small>
            </div>
            <div className="mb-3">
              <CFormLabel>Department Head</CFormLabel>
              {availableBranches.length > 0 ? (
                <CFormSelect
                  name="departmentHead"
                  value={formData.departmentHead}
                  onChange={handleInputChange}
                >
                  <option value="">Select Department Head</option>
                  {availableBranches.map(branch => (
                    <option key={branch._id || branch.id} value={branch._id || branch.id}>
                      {branch.branchName || branch.name}
                    </option>
                  ))}
                </CFormSelect>
              ) : (
                <CFormInput value="Loading branches..." disabled />
              )}
              <small className="text-muted">Select the branch that will head this department</small>
            </div>
            {editingDepartment && (
              <div className="mb-3">
                <CFormLabel>Status</CFormLabel>
                <CFormSelect
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </CFormSelect>
              </div>
            )}
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
