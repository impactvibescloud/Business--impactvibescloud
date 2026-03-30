import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Grid,
  Collapse,
  Pagination,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BusinessIcon from '@mui/icons-material/Business'
import axios from 'axios'
import { apiCall, ENDPOINTS, API_CONFIG, getBaseURL } from '../../config/api'
import { errorLog } from '../../utils/logger'
import './Department.css'
import '../Leads/CallLogsWebpage.css'
import { useAuth } from '../../context/authContext'

// Helper function to get API URL
const getApiUrl = () => {
  return process.env.NODE_ENV === 'development' ? 
    API_CONFIG.DEV_URL : 
    API_CONFIG.PROD_URL;
}

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
  const [selectedMemberIds, setSelectedMemberIds] = useState([]) // For multi-select UI
  const [selectedDepartmentHeadBranchId, setSelectedDepartmentHeadBranchId] = useState('') // For department head dropdown UI
  const [formData, setFormData] = useState({
    businessId: '',
    name: '',
    description: '',
    status: 'active', // Changed from 'Active' to 'active' to match API
    departmentHead: '', // User ID of department head
    didNumber: '', // didNumber of department head
    members: [] // Array of member objects {userId, phone, role}
  })

  // Get current businessId from Auth context or localStorage and initialize
  const { businessId: authBusinessId } = useAuth();

  useEffect(() => {
    const initBusiness = async () => {
      const id = authBusinessId || localStorage.getItem('businessId') || '';
      if (id) {
        setCurrentBusinessId(id);
        setFormData(prev => ({ ...prev, businessId: id }));
        try {
          await fetchBusinessDetails(id);
        } catch (e) {
          errorLog('Error fetching business details during init:', e);
        }
        try {
          await fetchAvailableAgents(id);
        } catch (e) {
          errorLog('Error fetching agents during init:', e);
        }
      } else {
        // No businessId available from context or localStorage; show a neutral state
        setBusinessName('Business not found');
        console.warn('No businessId available from Auth context or localStorage');
      }
    }
    initBusiness()
  }, [authBusinessId])

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
      // Use the correct API URL for branches (production or development)
      // Fetch branches using centralized apiCall (handles baseURL and headers)
  const branchResponse = await apiCall(`/branch/${businessId}/branches`, 'GET');
      let branchData = [];
      if (Array.isArray(branchResponse)) {
        branchData = branchResponse;
      } else if (branchResponse?.data && Array.isArray(branchResponse.data)) {
        branchData = branchResponse.data;
      } else if (branchResponse?.data?.data && Array.isArray(branchResponse.data.data)) {
        branchData = branchResponse.data.data;
      } else if (branchResponse?.branches && Array.isArray(branchResponse.branches)) {
        branchData = branchResponse.branches;
      }
      if (!branchData || branchData.length === 0) {
        branchData = [];
        console.log('No branch data found, using empty array');
      }
      if (branchData.length > 0) {
        branchData = branchData.map(branch => ({
          _id: branch._id || branch.id || `branch-${Math.random().toString(36).substring(2, 9)}`,
          id: branch.id || branch._id || `branch-${Math.random().toString(36).substring(2, 9)}`,
          branchName: branch.branchName || branch.name || 'Unnamed Branch',
          name: branch.name || branch.branchName || 'Unnamed Branch',
          // didNumbers is an array, so we take the first one or empty string
          didNumber: (branch.didNumbers && branch.didNumbers.length > 0) ? branch.didNumbers[0] : (branch.didNumber || branch.did || ''),
          userId: branch.user?._id || branch.user?.id || branch.userId || '',
          phone: branch.user?.phone || branch.phone || '',
          role: 'branch' // Default role for branch members
        }));
        console.log('Processed branch data with user info:', branchData);
      }
      setAvailableBranches(branchData);

      try {
        // Fetch users/agents using apiCall and query param for businessId
  const agentResponse = await apiCall(`/users?businessId=${encodeURIComponent(businessId)}`, 'GET');
        console.log('Agent Response:', agentResponse);
        // Handle different response formats
        let agentData = [];
        if (Array.isArray(agentResponse)) {
          agentData = agentResponse;
        } else if (agentResponse?.data && Array.isArray(agentResponse.data)) {
          agentData = agentResponse.data;
        } else if (agentResponse?.data?.data && Array.isArray(agentResponse.data.data)) {
          agentData = agentResponse.data.data;
        } else if (agentResponse && typeof agentResponse === 'object') {
          agentData = [agentResponse];
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
      
      const baseUrl = getApiUrl();
      console.log(`Making direct axios call to: ${baseUrl}/api/departments/business/${currentBusinessId}`);
      const response = await axios.default.get(`${baseUrl}/api/departments/business/${currentBusinessId}`, {
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
        const baseUrl = getApiUrl();
        await axios.default.head(baseUrl, { timeout: 2000 });
        console.log('Backend server is reachable');
      } catch (connError) {
        console.error('Backend server unreachable:', connError.message);
        console.log(`Please ensure your backend server is running at ${baseUrl}`);
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
    setSelectedMemberIds([])
    setSelectedDepartmentHeadBranchId('')
    setFormData({
      businessId: currentBusinessId || '',
      name: '',
      description: '',
      status: 'active', // Default to active for new departments
      departmentHead: '',
      didNumber: '',
      members: []
    })
    setShowDepartmentModal(true)
  }

  const handleCloseModal = () => {
    setShowDepartmentModal(false)
    setValidationError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // If department head is being changed, also capture the didNumber and userId
    if (name === 'departmentHead') {
      const selectedBranch = availableBranches.find(
        branch => (branch._id === value || branch.id === value)
      )
      console.log('Selected branch for department head:', selectedBranch)
      console.log('Branch userId:', selectedBranch?.userId)
      console.log('Branch didNumber:', selectedBranch?.didNumber)
      
      setSelectedDepartmentHeadBranchId(value) // Store branch ID for dropdown
      setFormData(prev => ({
        ...prev,
        [name]: selectedBranch?.userId || value, // Store userId, NOT branch ID
        didNumber: selectedBranch?.didNumber || ''
      }))
    } else {
      // If the user is editing the department "name", prevent spaces
      // and convert them automatically to underscores. Allow '-' and '_'.
      if (name === 'name') {
        const normalized = (value || '').replace(/\s+/g, '_')
        setFormData(prev => ({
          ...prev,
          [name]: normalized
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    }
  }

  // Handle multiple members selection (MUI Select returns array of selected values)
  const handleMembersChange = (e) => {
    const values = Array.isArray(e.target.value) ? e.target.value : []
    const selectedMembers = []
    const selectedIds = []
    values.forEach(branchId => {
      selectedIds.push(branchId)
      const branch = availableBranches.find(b => (b._id === branchId || b.id === branchId))
      if (branch) {
        selectedMembers.push({
          userId: branch.userId || branch._id || branch.id,
          phone: branch.phone || branch.didNumber || '',
          didNumber: branch.didNumber || branch.did || '',
          role: branch.role || 'branch'
        })
      }
    })
    console.log('Selected members:', selectedMembers)
    setSelectedMemberIds(selectedIds)
    setFormData(prev => ({
      ...prev,
      members: selectedMembers
    }))
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    
    // Extract userId from departmentHead (can be object or string)
    const departmentHeadUserId = typeof department.departmentHead === 'object' 
      ? (department.departmentHead?._id || department.departmentHead?.id)
      : department.departmentHead
    
    console.log('Editing department:', department)
    console.log('Department head object:', department.departmentHead)
    console.log('Extracted department head userId:', departmentHeadUserId)
    
    // Find the branch that matches the departmentHead userId
    const departmentHeadBranch = availableBranches.find(b => 
      b.userId === departmentHeadUserId
    )
    
    console.log('Available branches:', availableBranches)
    console.log('Matched branch for dropdown:', departmentHeadBranch)
    
    // Set the branch ID for the dropdown
    const departmentHeadBranchId = departmentHeadBranch ? (departmentHeadBranch._id || departmentHeadBranch.id) : ''
    setSelectedDepartmentHeadBranchId(departmentHeadBranchId)
    
    // Extract member IDs for the multi-select UI
    const memberIds = []
    if (department.members && Array.isArray(department.members)) {
      department.members.forEach(member => {
        // Try to match member userId with branch IDs
        const matchingBranch = availableBranches.find(b => 
          b.userId === member.userId || b._id === member.userId || b.id === member.userId
        )
        if (matchingBranch) {
          memberIds.push(matchingBranch._id || matchingBranch.id)
        }
      })
    }
    
    setSelectedMemberIds(memberIds)
    // Normalize members to ensure didNumber is included where possible
    const normalizedMembers = (department.members && Array.isArray(department.members)) ? department.members.map(m => {
      const matchingBranch = availableBranches.find(b => b.userId === m.userId || b._id === m.userId || b.id === m.userId)
      return {
        userId: m.userId || m.user || m._id || '',
        phone: m.phone || (matchingBranch && (matchingBranch.phone || matchingBranch.didNumber)) || '',
        didNumber: m.didNumber || (matchingBranch && (matchingBranch.didNumber || matchingBranch.did)) || '',
        role: m.role || 'branch',
        _id: m._id || m.id || undefined
      }
    }) : []

    setFormData({
      businessId: department.businessId || currentBusinessId || '',
      name: department.name,
      description: department.description,
      status: department.status || 'active',
      // Keep the userId in formData for API
      departmentHead: departmentHeadUserId || '',
      didNumber: department.didNumber || '',
      members: normalizedMembers
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
      
      const baseUrl = getApiUrl();
      console.log(`Making DELETE request to: ${baseUrl}/api/departments/${deleteId}`);
      
      const response = await axios.default.delete(
        `${baseUrl}/api/departments/${deleteId}`, 
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
      
      // Normalize department name (convert spaces to underscores) to enforce no-space rule
      const normalizedName = (formData.name || '').replace(/\s+/g, '_')
      // Ensure formData reflects normalized name (keeps UI in sync)
      if (normalizedName !== formData.name) {
        setFormData(prev => ({ ...prev, name: normalizedName }))
      }

      // Prepare department data and ensure each member has didNumber
      const normalizedMembers = (formData.members && Array.isArray(formData.members)) ? formData.members.map(m => {
        const matchingBranch = availableBranches.find(b => b.userId === m.userId || b._id === m.userId || b.id === m.userId)
        return {
          userId: m.userId || m._id || m.id || '',
          phone: m.phone || (matchingBranch && (matchingBranch.phone || matchingBranch.didNumber)) || '',
          didNumber: m.didNumber || (matchingBranch && (matchingBranch.didNumber || matchingBranch.did)) || '',
          role: m.role || 'branch'
        }
      }) : []

      const departmentData = {
        businessId: formData.businessId,
        name: normalizedName,
        description: formData.description,
        status: formData.status,
        departmentHead: formData.departmentHead,
        didNumber: formData.didNumber,
        members: normalizedMembers // Array of {userId, phone, didNumber, role}
      };
      
      console.log('Department data being sent:', JSON.stringify(departmentData, null, 2));
      
      let response;
      
      if (editingDepartment) {
        // Update existing department
        console.log('Updating department with data:', departmentData);
        
        const departmentId = editingDepartment.id || editingDepartment._id;
        const baseUrl = getApiUrl();
        console.log(`Making PUT request to: ${baseUrl}/api/departments/${departmentId}`);
        
        // Format matching the curl command exactly
        response = await axios.default.put(
          `${baseUrl}/api/departments/${departmentId}`,
          {
            name: normalizedName,
            description: formData.description,
            status: formData.status,
            departmentHead: formData.departmentHead,
            didNumber: formData.didNumber,
            members: departmentData.members
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
        const baseUrl = getApiUrl();
        console.log(`Making POST request to: ${baseUrl}/api/departments`);
        
        response = await axios.default.post(
          `${baseUrl}/api/departments`,
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
    const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
    return <Chip label={displayStatus} color={normalizedStatus === 'active' ? 'success' : 'default'} size="small" />
  }

  // Helper function to get department head name from branches
  const getDepartmentHeadName = (department) => {
    if (!department.departmentHead) return 'Not assigned'
    
    const departmentHeadUserId = typeof department.departmentHead === 'object' 
      ? (department.departmentHead._id || department.departmentHead.id)
      : department.departmentHead
    
    const branch = availableBranches.find(b => b.userId === departmentHeadUserId)
    return branch ? (branch.branchName || branch.name) : (department.departmentHead.email || 'Unknown')
  }

  // Helper function to get department head's DID number
  const getDepartmentHeadDidNumber = (department) => {
    if (!department.departmentHead) return 'Not assigned'
    
    // First check if didNumber is directly on the department
    if (department.didNumber) return department.didNumber
    
    // Otherwise, find it from the branches
    const departmentHeadUserId = typeof department.departmentHead === 'object' 
      ? (department.departmentHead._id || department.departmentHead.id)
      : department.departmentHead
    
    const branch = availableBranches.find(b => b.userId === departmentHeadUserId)
    return branch?.didNumber || 'Not assigned'
  }

  return (
    <Box className="contact-list-container page-container" sx={{ p: 2 }}>
      {successAlert.show && (
        <Alert severity="success" onClose={() => setSuccessAlert({ show: false, message: '' })} sx={{ mb: 2 }}>{successAlert.message}</Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: '70%' }}>
              <TextField
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                size="small"
                fullWidth
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>) }}
              />
            </Box>
            <Box>
              <Button size="small" variant="outlined" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>Prev</Button>
              <Typography component="span" sx={{ mx: 1 }}>Page {currentPage}</Typography>
              <Button size="small" variant="outlined" onClick={() => setCurrentPage((p) => p + 1)} disabled={loading}>Next</Button>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewDepartment} sx={{ ml: 1, bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>New Department</Button>
            </Box>
          </Box>

          <TableContainer component={Paper} className="calllogs-table-container">
            <Table size="small" className="compact-table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.NO</TableCell>
                  <TableCell>DEPARTMENT NAME</TableCell>
                  <TableCell>DESCRIPTION</TableCell>
                  <TableCell>DEPARTMENT HEAD</TableCell>
                  <TableCell>DID NUMBER</TableCell>
                  <TableCell>MEMBERS</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <div className="mt-3">Loading departments...</div>
                    </TableCell>
                  </TableRow>
                ) : currentDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><BusinessIcon sx={{ fontSize: 40 }} /></div>
                        <Typography variant="h6">No departments found</Typography>
                        <Typography variant="body2">Create your first department to get started.</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={handleNewDepartment}>Create Department</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDepartments.map((department, index) => (
                    <TableRow key={department.id || department._id} hover>
                      <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.description || 'No description'}</TableCell>
                      <TableCell>{getDepartmentHeadName(department)}</TableCell>
                      <TableCell>{getDepartmentHeadDidNumber(department)}</TableCell>
                      <TableCell><Chip label={`${department.members && Array.isArray(department.members) ? department.members.length : 0} Members`} size="small" /></TableCell>
                      <TableCell>{getStatusBadge(department.status)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(department)}><EditIcon fontSize="small"/></IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfirm(department.id || department._id)}><DeleteIcon fontSize="small"/></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={currentPage} onChange={(e, page) => handlePageChange(page)} color="primary" />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Department Dialog */}
      <Dialog open={showDepartmentModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        <DialogContent dividers>
          {validationError && <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>}
          <Box component="form" sx={{ display: 'grid', gap: 2 }}>
            <TextField name="name" label="Department Name" value={formData.name} onChange={handleInputChange} fullWidth />
            <TextField name="description" label="Description" value={formData.description} onChange={handleInputChange} fullWidth />
            <TextField label="Business" value={businessName} disabled fullWidth />
            <FormControl fullWidth>
              <InputLabel id="department-head-label">Department Head</InputLabel>
              <Select labelId="department-head-label" name="departmentHead" value={selectedDepartmentHeadBranchId || ''} label="Department Head" onChange={handleInputChange}>
                <MenuItem value=""><em>Select Department Head</em></MenuItem>
                {availableBranches.map(branch => (
                  <MenuItem key={branch._id || branch.id} value={branch._id || branch.id}>{branch.branchName || branch.name}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary">Select the branch that will head this department</Typography>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="members-label">Department Members</InputLabel>
              <Select labelId="members-label" multiple value={selectedMemberIds} onChange={handleMembersChange} renderValue={(selected) => `${selected.length} selected`}>
                {availableBranches.map(branch => (
                  <MenuItem key={branch._id || branch.id} value={branch._id || branch.id}>{branch.branchName || branch.name}{branch.didNumber ? ` (${branch.didNumber})` : ''}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary">Hold Ctrl (Cmd on Mac) to select multiple members</Typography>
            </FormControl>

            {editingDepartment && (
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select labelId="status-label" name="status" value={formData.status} label="Status" onChange={handleInputChange}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDepartment} sx={{ bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>{editingDepartment ? 'Update' : 'Save'} Department</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          {deleteSuccess ? <Alert severity="success">Department deleted successfully!</Alert> : <Typography>Are you sure you want to delete this department? This action cannot be undone.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={isDeleting || deleteSuccess}>{isDeleting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Department
