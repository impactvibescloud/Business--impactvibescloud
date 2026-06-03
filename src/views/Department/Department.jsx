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
  FormControlLabel,
  Checkbox,
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
import VisibilityIcon from '@mui/icons-material/Visibility'
import BusinessIcon from '@mui/icons-material/Business'
import axios from 'axios'
import Swal from 'sweetalert2'
import SyncIcon from '@mui/icons-material/Sync'
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
  const [didNumbers, setDidNumbers] = useState([])
  const [syncingMap, setSyncingMap] = useState({})
  const [selectedMemberIds, setSelectedMemberIds] = useState([]) // For multi-select UI
  const [selectedDepartmentHeadBranchId, setSelectedDepartmentHeadBranchId] = useState('') // For department head dropdown UI
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewDepartment, setViewDepartment] = useState(null)
  const [formData, setFormData] = useState({
    businessId: '',
    name: '',
    description: '',
    status: 'active', // Changed from 'Active' to 'active' to match API
    departmentHead: '', // User ID of department head
    didNumber: '', // legacy single DID — mirrored from didNumbers[0]
    didNumbers: [], // multiple DIDs assignable to this department
    members: [], // Array of member objects {userId, phone, role}
    default: false // Boolean flag for default department
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
        branchData = branchData.map(branch => {
          const _id = branch._id || branch.id || `branch-${Math.random().toString(36).substring(2, 9)}`
          const id = branch.id || branch._id || `branch-${Math.random().toString(36).substring(2, 9)}`
          const branchName = branch.branchName || branch.name || 'Unnamed Branch'
          const name = branch.name || branch.branchName || 'Unnamed Branch'
          const didNumber = (branch.didNumbers && branch.didNumbers.length > 0) ? branch.didNumbers[0] : (branch.didNumber || branch.did || '')
          const userId = branch.user?._id || branch.user?.id || branch.userId || ''
          const phone = branch.user?.phone || branch.phone || ''
          return {
            ...branch,
            _id,
            id,
            branchName,
            name,
            didNumber,
            userId,
            phone,
            role: 'branch'
          }
        });
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
      fetchDidNumbers()
    }
  }, [currentBusinessId])

  const fetchDidNumbers = async () => {
    try {
      if (!currentBusinessId) return
      const res = await apiCall(`/numbers/assigned-to/${currentBusinessId}`, 'GET')
      const list = res?.data || res?.numbers || res || []
      const mapped = (Array.isArray(list) ? list : []).map(d => ({ id: d._id || d.id, number: d.number }))
      setDidNumbers(mapped)
    } catch (err) {
      console.error('Error fetching DID numbers:', err)
      setDidNumbers([])
    }
  }

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
      status: 'active',
      departmentHead: '',
      didNumber: '',
      didNumbers: [],
      members: [],
      default: false
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
        // userId MUST be the linked User._id, not the Branch._id —
        // otherwise the Agents page reverse lookup (members.userId →
        // User._id) can't match and the row shows "Not Assigned".
        const userId = branch.userId || branch.user?._id || branch.user?.id || ''
        if (!userId) {
          console.warn('[Department] Skipping member — no linked user for branch', branchId)
          return
        }
        selectedMembers.push({
          userId,
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
    // Normalize members to ensure didNumber is included where possible.
    // CRITICAL: when the stored userId is actually a Branch._id (legacy
    // bad data from an earlier bug), upgrade it to the real User._id
    // from the matching branch so the Agents page can resolve the
    // membership going forward.
    const normalizedMembers = (department.members && Array.isArray(department.members)) ? department.members.map(m => {
      const matchingBranch = availableBranches.find(b => b.userId === m.userId || b._id === m.userId || b.id === m.userId)
      // Prefer the live User._id from the matching branch over whatever
      // (possibly stale) value is stored on the member.
      const userId = (matchingBranch && matchingBranch.userId) || m.userId || m.user || m._id || ''
      return {
        userId,
        phone: m.phone || (matchingBranch && (matchingBranch.phone || matchingBranch.didNumber)) || '',
        didNumber: m.didNumber || (matchingBranch && (matchingBranch.didNumber || matchingBranch.did)) || '',
        role: m.role || 'branch',
        _id: m._id || m.id || undefined
      }
    }) : []

    // Hydrate didNumbers[] from the department doc. Prefer didNumbers (new),
    // fall back to didNumber (legacy single).
    const incomingDids = Array.isArray(department.didNumbers) && department.didNumbers.length
      ? department.didNumbers
      : (department.didNumber ? [department.didNumber] : []);
    const didList = Array.from(new Set(incomingDids.map(String).filter(Boolean)));

    setFormData({
      businessId: department.businessId || currentBusinessId || '',
      name: department.name,
      description: department.description,
      status: department.status || 'active',
      departmentHead: departmentHeadUserId || '',
      didNumber: didList[0] || '',
      didNumbers: didList,
      members: normalizedMembers,
      default: department.default || false,
    })
    setShowDepartmentModal(true)
  }

  const handleViewDepartment = (department) => {
    setViewDepartment(department)
    setShowViewDialog(true)
  }

  const handleCloseViewDialog = () => {
    setShowViewDialog(false)
    setViewDepartment(null)
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
      // Surface the real server message — the generic message was hiding
      // backend failures (audit-log save error, missing perms, etc.) and
      // making this impossible to diagnose.
      const serverMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        ''
      const statusCode = error?.response?.status
      setDeleteError(
        serverMsg
          ? `${serverMsg}${statusCode ? ` (HTTP ${statusCode})` : ''}`
          : 'An error occurred while deleting the department. Please try again.'
      )
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

      // Prepare department data and ensure each member has didNumber.
      // Always prefer the matchingBranch.userId (the real User._id) over
      // whatever was previously stored — this self-heals any old members
      // whose userId was mistakenly saved as a Branch._id.
      const normalizedMembers = (formData.members && Array.isArray(formData.members)) ? formData.members.map(m => {
        const matchingBranch = availableBranches.find(b => b.userId === m.userId || b._id === m.userId || b.id === m.userId)
        const resolvedUserId = (matchingBranch && matchingBranch.userId) || m.userId || m._id || m.id || ''
        return {
          userId: resolvedUserId,
          phone: m.phone || (matchingBranch && (matchingBranch.phone || matchingBranch.didNumber)) || '',
          didNumber: m.didNumber || (matchingBranch && (matchingBranch.didNumber || matchingBranch.did)) || '',
          role: m.role || 'branch'
        }
      }).filter(m => m.userId) : []

      // Build the canonical didNumbers[] from the multi-select value, falling
      // back to the legacy singular `didNumber` if the form pre-dates the
      // multi field. The first entry is mirrored to didNumber for legacy.
      const didList = (Array.isArray(formData.didNumbers) && formData.didNumbers.length
        ? formData.didNumbers
        : (formData.didNumber ? [formData.didNumber] : [])
      ).map(String).filter(Boolean);
      const dedupedDids = Array.from(new Set(didList));

      const departmentData = {
        businessId: formData.businessId,
        name: normalizedName,
        description: formData.description,
        status: formData.status,
        departmentHead: formData.departmentHead,
        didNumber: dedupedDids[0] || '',
        didNumbers: dedupedDids,
        members: normalizedMembers,
        default: formData.default,
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
            didNumber: departmentData.didNumber,
            didNumbers: departmentData.didNumbers,
            members: departmentData.members,
            default: formData.default,
          },
          // Override the global 10s axios timeout — department updates
          // can take longer than that when Asterisk sync runs inline.
          { headers, timeout: 60000 }
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
          // Override the global 10s axios timeout for the same reason as
          // the PUT path above.
          { headers, timeout: 60000 }
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

  const syncDepartmentDid = async (department) => {
    // mark syncing
    setSyncingMap(prev => ({ ...prev, [department._id || department.id]: true }))
    if (!department?.didNumber) {
      Swal.fire('No DID assigned', 'Please assign a DID to this department first.', 'warning')
      setSyncingMap(prev => ({ ...prev, [department._id || department.id]: false }))
      return
    }

    try {
      if (!didNumbers || didNumbers.length === 0) await fetchDidNumbers()
      const didObj = (didNumbers || []).find(d => String(d.number) === String(department.didNumber) || String(d.id) === String(department.didNumber) || String(d._id) === String(department.didNumber))
      if (!didObj) {
        Swal.fire('DID not found', 'Department DID is not available in your DID list.', 'error')
        return
      }
      const didId = didObj.id || didObj._id

      const branchTargets = []
      const addBranchTarget = (branch) => {
        if (branch && branch._id && !branchTargets.some((b) => String(b._id) === String(branch._id))) {
          branchTargets.push(branch)
        }
      }
      if (Array.isArray(department.members) && department.members.length) {
        department.members.forEach(m => {
          const memberUserId = m.userId || m.user || m._id || m.id
          const branch = availableBranches.find(b => String(b.userId) === String(memberUserId) || String(b._id) === String(memberUserId) || String(b.id) === String(memberUserId) || String(b.didNumber) === String(m.didNumber))
          addBranchTarget(branch)
        })
      }

      // Also include department head's branch if present
      const departmentHeadUserId = typeof department.departmentHead === 'object' ? (department.departmentHead._id || department.departmentHead.id) : department.departmentHead
      const headBranch = availableBranches.find(b => String(b.userId) === String(departmentHeadUserId))
      addBranchTarget(headBranch)

      if (branchTargets.length === 0) {
        Swal.fire('No agents found', 'Could not identify any agents to assign the DID to.', 'info')
        return
      }

      const confirm = await Swal.fire({ title: 'Sync DID', html: `Assign DID <b>${department.didNumber}</b> to <b>${branchTargets.length}</b> agents?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, sync' })
      if (!confirm.isConfirmed) return

      const departmentDid = String(department.didNumber).trim()
      const resolveBranchExtension = async (branch) => {
        const assigned = Array.isArray(branch.assignedNumbers) ? branch.assignedNumbers : []
        const assignedExt = assigned.find(n => n?.extensionNumber)?.extensionNumber
        if (assignedExt) return String(assignedExt)

        const direct = branch.extension || branch.extensionNumber || branch.sip_endpoint || branch.ext
        if (direct) return String(direct)

        const branchDids = Array.isArray(branch.didNumbers)
          ? branch.didNumbers
          : (branch.didNumber ? [branch.didNumber] : [])
        const candidates = [
          ...branchDids.filter(d => String(d) !== departmentDid),
          ...branchDids.filter(d => String(d) === departmentDid),
        ]

        for (const did of candidates) {
          try {
            const res = await apiCall(`/api/v1/numbers/business/by-number/${encodeURIComponent(did)}`, 'GET')
            const data = res?.data || res
            const ext = data?.extension_number || data?.extension || data?.sip_endpoint || data?.extensionNumber || data?.ext
            if (ext) return String(ext)
          } catch (err) {
            console.warn('Failed to resolve extension for branch DID', did, err)
          }
        }
        return null
      }

      // Append the department DID to each branch and create a per-agent
      // NumberAssignment for that branch's own SIP extension. The shared DID
      // must not replace the agent's primary DID, because the dialer uses the
      // primary DID/extension to register SIP.
      const failed = []

      for (const branch of branchTargets) {
        const branchId = branch._id
        try {
          const existingDids = Array.isArray(branch.didNumbers)
            ? branch.didNumbers.map(d => String(d).trim()).filter(Boolean)
            : (branch.didNumber ? [String(branch.didNumber).trim()] : [])
          const nextDids = existingDids.includes(departmentDid)
            ? existingDids
            : [...existingDids, departmentDid]
          const extension = await resolveBranchExtension(branch)

          await apiCall(`/branch/edit/${branchId}`, 'PATCH', {
            didNumbers: nextDids,
            ...(extension ? { extension } : {}),
          })

          if (extension) {
            await apiCall(`/numbers/${didId}/assign`, 'POST', {
              extensionNumber: extension,
              assignedToBranch: branchId,
              assignedToBusiness: currentBusinessId,
            })
          } else {
            console.warn('Could not resolve branch extension for department DID sync', branchId)
          }
        } catch (err) {
          console.warn('Failed to update branch DID', branchId, err)
          failed.push(branchId)
        }
      }

      // refresh branches and DID lists so UI reflects changes
      try {
        await fetchAvailableAgents(currentBusinessId)
        await fetchDepartments()
        await fetchDidNumbers()
      } catch (e) {
        console.warn('Failed to refresh data after sync', e)
      }

      if (failed.length === 0) Swal.fire('Synced', 'All agents updated successfully', 'success')
      else Swal.fire('Partial sync', `${branchTargets.length - failed.length} succeeded, ${failed.length} failed`, 'warning')

      setSyncingMap(prev => ({ ...prev, [department._id || department.id]: false }))

    } catch (err) {
      console.error('syncDepartmentDid error', err)
      Swal.fire('Error', 'Sync failed: ' + (err.message || 'Unknown error'), 'error')
      setSyncingMap(prev => ({ ...prev, [department._id || department.id]: false }))
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
          <Box sx={{ mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Departments
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Create and manage departments
              </Typography>
            </Box>
          </Box>

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
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewDepartment} sx={{ ml: 1, bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>New Department</Button>
              </Box>
            </Box>

          <TableContainer component={Paper} className="calllogs-table-container">
            <Table size="small" className="compact-table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>S.NO</TableCell>
                  <TableCell>DEPARTMENT NAME</TableCell>
                  <TableCell>HEAD</TableCell>
                  <TableCell>DID NUMBER</TableCell>
                  <TableCell>MEMBERS</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>DEFAULT</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
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
                      <TableCell>{getDepartmentHeadName(department)}</TableCell>
                      <TableCell>{getDepartmentHeadDidNumber(department)}</TableCell>
                      <TableCell><Chip label={`${department.members && Array.isArray(department.members) ? department.members.length : 0} Members`} size="small" /></TableCell>
                      <TableCell>{getStatusBadge(department.status)}</TableCell>
                      <TableCell>{department.default ? <Chip label="Default" size="small" color="primary" variant="filled" /> : '-'}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                          {syncingMap[department._id || department.id] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); syncDepartmentDid(department); }} title="Sync DID"><SyncIcon fontSize="small" /></IconButton>
                          )}
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleViewDepartment(department); }} title="View Department"><VisibilityIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(department); }} title="Edit Department"><EditIcon fontSize="small"/></IconButton>
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(department.id || department._id); }} title="Delete Department"><DeleteIcon fontSize="small"/></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination count={totalPages} page={currentPage} onChange={(e, page) => handlePageChange(page)} color="primary" />
                </Box>
              )}
            </TableContainer>
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
              <InputLabel id="department-head-label">Head</InputLabel>
              <Select labelId="department-head-label" name="departmentHead" value={selectedDepartmentHeadBranchId || ''} label="Head" onChange={handleInputChange}>
                <MenuItem value=""><em>Select Head</em></MenuItem>
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

            <FormControl fullWidth>
              <InputLabel id="department-did-label">Department DIDs</InputLabel>
              <Select
                labelId="department-did-label"
                multiple
                value={Array.isArray(formData.didNumbers) ? formData.didNumbers : []}
                label="Department DIDs"
                onChange={(e) => {
                  const v = e.target.value;
                  const arr = (typeof v === 'string' ? v.split(',') : v).filter(Boolean);
                  setFormData((prev) => ({
                    ...prev,
                    didNumbers: arr,
                    didNumber: arr[0] || '',
                  }));
                }}
                renderValue={(selected) => selected.join(', ')}
              >
                {didNumbers.map((d) => (
                  <MenuItem key={d.id || d.number} value={d.number}>{d.number}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary">
                Assign one or more DIDs to this department. Inbound calls to any of these reach the same routing logic.
              </Typography>
            </FormControl>

            <FormControlLabel
              control={<Checkbox name="default" checked={formData.default} onChange={(e) => setFormData({ ...formData, default: e.target.checked })} />}
              label="Set as Default Department"
            />

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
      {/* View Department Dialog */}
      <Dialog open={showViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>Department Details</DialogTitle>
        <DialogContent dividers>
          {viewDepartment ? (
            <Box sx={{ p: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{viewDepartment.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Head</Typography>
                  <Typography variant="body1">{getDepartmentHeadName(viewDepartment)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">DIDs</Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(Array.isArray(viewDepartment.didNumbers) && viewDepartment.didNumbers.length > 0) ? viewDepartment.didNumbers.map(d => (
                      <Chip key={d} label={d} size="small" />
                    )) : (
                      <Chip label={getDepartmentHeadDidNumber(viewDepartment)} size="small" />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Members</Typography>
                  <Box sx={{ mt: 0.5, border: '1px solid #e0e0e0', borderRadius: 1, p: 1, maxHeight: 120, overflowY: 'auto', minHeight: 40 }}>
                    {viewDepartment.members && Array.isArray(viewDepartment.members) && viewDepartment.members.length > 0 ? (
                      viewDepartment.members.map((m, i) => {
                        const name = m?.name || m?.fullName || m?.displayName || m?.user?.name || (() => {
                          const found = availableBranches.find(b => String(b.userId) === String(m.userId) || String(b._id) === String(m.userId) || String(b.id) === String(m.userId));
                          return found ? (found.branchName || found.name) : (m?.userId || m?.phone || 'Unknown');
                        })()
                        return (
                          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>{name}</Typography>
                        )
                      })
                    ) : (
                      <Typography variant="body2">0 members</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{viewDepartment.description || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusBadge(viewDepartment.status)}</Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Default</Typography>
                  <Typography variant="body1">{viewDepartment.default ? 'Yes' : 'No'}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Department
