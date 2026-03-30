import React, { useState, useEffect, useRef } from 'react'
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
  LinearProgress,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import axios from 'axios'
import { apiCall, getBaseURL } from '../../config/api'
import Swal from 'sweetalert2'
import '../Leads/CallLogsWebpage.css'
import { API_CONFIG } from '../../config/api'

const isAuthenticated = () => localStorage.getItem("authToken");

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openAddBranch, setOpenAddBranch] = useState(false);
  const [openEditBranch, setOpenEditBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [timeGroup, setTimeGroup] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Default start/end times for known time groups
  // Default start/end times for known time groups (user-defined presets):
  // Morning Shift — 9 AM → 12 PM
  // Afternoon Shift — 12 PM → 6 PM
  // Full Shift — 9 AM → 6 PM
  // Night Shift — 6 PM → 12 AM
  // Custom Shift — no defaults (user-entered)
  const TIME_GROUP_DEFAULTS = {
    morning: { startTime: '09:00', endTime: '12:00' },
    afternoon: { startTime: '12:00', endTime: '18:00' },
    full: { startTime: '09:00', endTime: '18:00' },
    night: { startTime: '18:00', endTime: '00:00' },
  };

  const handleTimeGroupChange = (value) => {
    setTimeGroup(value);
    // If there are known defaults for this group, overwrite start/end with correct defaults
    const defaults = TIME_GROUP_DEFAULTS[value];
    if (defaults) {
      setStartTime(defaults.startTime);
      setEndTime(defaults.endTime);
    } else {
      // clear times when no group selected
      setStartTime("");
      setEndTime("");
    }
  };
  const [managerEmail, setManagerEmail] = useState("");
  const [branchStatus, setBranchStatus] = useState("Active");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [user, setUser] = useState({});
  const [didNumbers, setDidNumbers] = useState([]);
  // For dropdowns: only show DIDs not assigned to any branch, or the one assigned to the current agent (for edit)
  const getAvailableDidNumbers = (currentBranchId = null) => {
    // Find all assigned DIDs from all branches (except the current branch if editing)
    const assignedDidNumbers = new Set();
    branches.forEach(branch => {
      // Exclude current branch if editing
      if (!currentBranchId || branch._id !== currentBranchId) {
        if (Array.isArray(branch.didNumbers)) {
          branch.didNumbers.forEach(num => assignedDidNumbers.add(num));
        } else if (branch.didNumber) {
          assignedDidNumbers.add(branch.didNumber);
        }
      }
    });
    // Only return DIDs not assigned, or the one assigned to the current branch (for edit)
    return didNumbers.filter(did => {
      // If editing, allow the currently assigned DID
      if (currentBranchId) {
        const currentBranch = branches.find(b => b._id === currentBranchId);
        const currentAssigned = currentBranch && (Array.isArray(currentBranch.didNumbers) ? currentBranch.didNumbers[0] : currentBranch.didNumber);
        if (did.id === selectedDid || did.number === currentAssigned) return true;
      }
      // Otherwise, only show if not assigned
      return !assignedDidNumbers.has(did.number);
    });
  };
  const [selectedDid, setSelectedDid] = useState("");
  const [departments, setDepartments] = useState([]);
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' });
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const [uploadResultMessage, setUploadResultMessage] = useState('')
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [callDetails, setCallDetails] = useState({});
  const [loadingCallDetails, setLoadingCallDetails] = useState({});
  const token = isAuthenticated();

  useEffect(() => {
    if (!token) return;
  apiCall('/v1/user/details', 'GET')
      .then((res) => {
        // apiCall returns response.data from axios, which should contain user
        setUser(res.user || res.data?.user || res.user?.user || res.user?.data || res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err);
      });
  }, [token]);

  const fetchDepartments = async () => {
    try {
  const response = await apiCall(`/departments/business/${user.businessId}`, 'GET');
      console.log('Departments API Response:', response);
      const departmentsData = response.departments || response.data || response.data?.departments || [];
      const processedDepartments = departmentsData.map(dept => {
        if (typeof dept === 'object') {
          return {
            _id: dept._id || dept.id,
            name: dept.name || 'Unnamed Department',
            status: dept.status
          };
        }
        return { _id: dept, name: String(dept) };
      });
      console.log('Processed Departments:', processedDepartments);
      setDepartments(processedDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    if (user?.businessId) {
      fetchBranches();
      fetchDidNumbers();
      fetchDepartments();
    }
  }, [user?.businessId]); // Changed dependency to specifically watch businessId changes

  const fetchBranches = async () => {
    try {
  const response = await apiCall(`/branch/${user.businessId}/branches`, 'GET');
      const branchesData = response.data || response.branches || [];
      
      // Map the data to match our component's expected structure
      const formattedBranches = branchesData.map(branch => ({
        ...branch,
        manager: {
          name: branch.user?.name || '',
          email: branch.user?.email || '',
          userId: branch.user?._id || ''
        },
        // Normalize department object to ensure UI can always read .name
        department: (function() {
          const d = branch.department || branch.deparment || branch.dept;
          if (!d) return null;
          if (typeof d === 'object') {
            return {
              _id: d._id || d.id || d.departmentId || null,
              name: d.name || d.departmentName || d.label || ''
            };
          }
          // If department is a primitive (string id or name), attempt to treat it as name
          return { _id: String(d), name: String(d) };
        })(),
        id: branch._id,
        didNumber: branch.didNumbers?.[0] || '',
      }));

      setBranches(formattedBranches);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setLoading(false);
      // Show error message to user
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to fetch agents',
      });
    }
  };

  // Fetch assigned DID numbers for the dropdown
  const fetchDidNumbers = async () => {
    try {
      // Use the provided API for assigned numbers
  const response = await apiCall(`/numbers/assigned-to/${user.businessId}`, 'GET');
      const didNumbers = response.data || response.numbers || response || [];
      setDidNumbers(
        didNumbers.map((did) => ({ id: did._id, number: did.number }))
      );
    } catch (error) {
      console.error("Error fetching DID numbers:", error);
    }
  };

  // Helper: fetch extension for a DID number using the numbers service
  const fetchDidExtension = async (didNumber) => {
    if (!didNumber) return null;
    try {
      const res = await apiCall(`/api/v1/numbers/business/by-number/${encodeURIComponent(didNumber)}`, 'GET');
      const ext = res?.data?.extension ?? res?.data?.sip_endpoint ?? res?.data?.extensionNumber ?? res?.data?.ext ?? null;
      return ext ?? null;
    } catch (err) {
      console.warn('Failed to fetch DID extension for', didNumber, err);
      return null;
    }
  };

  const handleAddBranch = () => {
    setOpenAddBranch(true);
  };

  const handleCloseAddBranch = () => {
    setOpenAddBranch(false);
    resetForm();
  };

  const handleSaveBranch = async () => {
    try {
      // Find the DID number value from the selectedDid (which may be an id)
      let didNumberValue = selectedDid;
      const foundDid = didNumbers.find((did) => did.id === selectedDid);
      if (foundDid) {
        didNumberValue = foundDid.number;
      }
      // Construct the request body according to the API specification
      const requestBody = {
        branchName,
        branchEmail: managerEmail,
        phone: agentPhone, // Include phone field
        businessId: user.businessId,
        didNumbers: didNumberValue ? [didNumberValue] : [], // Use number, not id
        timeGroup: timeGroup
      };
      // Fetch DID extension and include it in payload if available
      if (didNumberValue) {
        const extension = await fetchDidExtension(didNumberValue);
        if (extension) {
          requestBody.extension = String(extension);
        }
      }
      // Only include start/end times if they have values
      if (startTime && startTime.trim() !== '') requestBody.startTime = startTime;
      if (endTime && endTime.trim() !== '') requestBody.endTime = endTime;
      if (department) {
        requestBody.department = department;
      }

      // Create the branch first using apiCall
  const res = await apiCall('/branch/create/new', 'POST', requestBody);

      // Assign DID to branch if selectedDid is present
      if (selectedDid && res.data && (res.data.branch?._id || res.data.data?._id)) {
        const branchId = res.data.branch?._id || res.data.data?._id;
        const didId = selectedDid;
        try {
          await apiCall(`/numbers/${didId}`, 'PUT', { assigned_to_branch: branchId });
        } catch (err) {
          console.error('Error assigning DID to branch:', err);
        }
      }

      fetchBranches();
      handleCloseAddBranch();
      setSuccessAlert({
        show: true,
        message: `Agent "${branchName}" added successfully!`
      });
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' });
      }, 5000);
    } catch (error) {
      console.error("Error adding branch:", error);
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch => 
    branch.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.manager?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.manager?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBranches = filteredBranches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setBranchName(branch.branchName || "");
    setManagerEmail(branch.user?.email || branch.manager?.email || "");
    setDepartment(branch.department?._id || "");
    // branch.timeGroup may be a string (legacy) or an object { timeGroup, startTime, endTime }
    const tg = branch.timeGroup;
    if (tg && typeof tg === 'object') {
      setTimeGroup(tg.timeGroup || "");
      setStartTime(tg.startTime || "");
      setEndTime(tg.endTime || "");
    } else {
      // If legacy string, set timeGroup and populate defaults if available
      setTimeGroup(tg || "");
      if (tg && typeof tg === 'string' && TIME_GROUP_DEFAULTS[tg]) {
        const d = TIME_GROUP_DEFAULTS[tg];
        setStartTime(d.startTime || "");
        setEndTime(d.endTime || "");
      } else {
        setStartTime("");
        setEndTime("");
      }
    }
    
    setBranchStatus(branch.isSuspended ? "Suspended" : "Active");
    // Find the DID id from didNumbers list that matches the assigned number
    let assignedDidId = "";
    if (Array.isArray(branch.didNumbers) && branch.didNumbers.length > 0) {
      const assignedNumber = branch.didNumbers[0];
      const foundDid = didNumbers.find(did => did.number === assignedNumber);
      assignedDidId = foundDid ? foundDid.id : "";
    } else if (branch.didNumber) {
      const foundDid = didNumbers.find(did => did.number === branch.didNumber);
      assignedDidId = foundDid ? foundDid.id : "";
    }
    setSelectedDid(assignedDidId);
    setOpenEditBranch(true);
  };

  const handleCloseEditBranch = () => {
    setOpenEditBranch(false);
    setSelectedBranch(null);
    resetForm();
  };

  const handleUpdateBranch = async () => {
    try {
      // Find the DID number value from the selectedDid (which may be an id)
      let didNumberValue = selectedDid;
      const foundDid = didNumbers.find((did) => did.id === selectedDid);
      if (foundDid) {
        didNumberValue = foundDid.number;
      }
  // Build payload and include start/end only when provided
  const updatePayload = {
        branchName,
        userEmail: managerEmail,
        businessId: user.businessId,
        didNumbers: didNumberValue ? [didNumberValue] : [],
        timeGroup: timeGroup,
        ...(department ? { department } : {})
      };
  // Fetch DID extension and include it in payload if available
  if (didNumberValue) {
    const extension = await fetchDidExtension(didNumberValue);
    if (extension) updatePayload.extension = String(extension);
  }
  if (startTime && startTime.trim() !== '') updatePayload.startTime = startTime;
  if (endTime && endTime.trim() !== '') updatePayload.endTime = endTime;
  const res = await apiCall(`/branch/edit/${selectedBranch._id}`, 'PATCH', updatePayload);

      // Assign DID to branch if selectedDid is present
      if (selectedDid && (selectedBranch._id || (res.data && (res.data.branch?._id || res.data.data?._id)))) {
        const branchId = selectedBranch._id || res.data.branch?._id || res.data.data?._id;
        const didId = selectedDid;
        try {
          await apiCall(`/numbers/${didId}`, 'PUT', { assigned_to_branch: branchId });
        } catch (err) {
          console.error('Error assigning DID to branch:', err);
        }
      }

      fetchBranches();
      handleCloseEditBranch();
      setSuccessAlert({
        show: true,
        message: `Agent "${branchName}" updated successfully!`
      });
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' });
      }, 5000);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setBranchName("");
    setAgentPhone("");
    setDepartment("");
    setTimeGroup("");
    setStartTime("");
    setEndTime("");
    setManagerEmail("");
    setBranchStatus("Active");
    setSelectedDid(""); // Reset DID selection
  };

  const handleSuspendBranch = async (branchId) => {
    try {
      await axios.patch(
        `/api/branch/${branchId}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchBranches(); // Refresh the list
      Swal.fire({
        icon: "success",
        title: "Agent status updated successfully",
      });
    } catch (error) {
      console.error("Error suspending branch:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
      });
    }
  };


  const handleDeleteBranch = (branchId) => {
    console.log("Delete branch:", branchId);
  };

  const handleResetPassword = async (email) => {
    try {
      Swal.fire({
        title: 'Are you sure?',
        text: "This will reset the manager's password. They will receive an email with instructions.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.post(
            `/api/v1/user/password/forgot`,
            {
              email
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          Swal.fire({
            icon: 'success',
            title: 'Password Reset',
            text: 'Password has been reset successfully. An email has been sent to the manager.',
          });
        }
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Something went wrong',
      });
    }
  };

  // Bulk upload handlers
  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    // Reset input so same file can be selected again if needed
    e.target.value = ''
    await uploadBranchesFile(file)
  }

  const uploadBranchesFile = async (file) => {
    if (!user?.businessId) {
      Swal.fire({ icon: 'error', title: 'Missing Business', text: 'Business ID not found. Please login again.' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessId', user.businessId)

    setUploading(true)
    setUploadProgress(0)
    setUploadResultMessage('')

    try {
      const url = `${getBaseURL()}/api/branch/upload`
      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        }
      })

      console.log('Bulk upload response:', res.data)
      setUploadResultMessage(res.data?.message || 'Upload successful')
      Swal.fire({ icon: 'success', title: 'Upload Complete', text: res.data?.message || 'Branches uploaded successfully.' })
      fetchBranches()
    } catch (err) {
      console.error('Bulk upload error:', err)
      const message = err?.response?.data?.message || err.message || 'Upload failed'
      setUploadResultMessage(message)
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: message })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const fetchCallDetails = async (branch) => {
    // Extract user ID from the branch - prioritize manager's userId
    const userId = branch.manager?.userId || branch.userId || branch.managerId || branch._id;
    
    try {
      // Set loading state for this user
      setLoadingCallDetails(prevState => ({
        ...prevState,
        [userId]: true
      }));
      
      console.log('Using userId for state management:', userId);
      
      console.log('Branch data:', branch);
      console.log('Looking for user ID in branch:', {
        'manager?.userId': branch.manager?.userId,
        'branch.userId': branch.userId,
        'branch.managerId': branch.managerId,
        'fallback to branch._id': branch._id,
        'selected userId': userId
      });
      
      if (!userId) {
        console.error("No user ID found for this branch:", branch);
        setLoadingCallDetails(prevState => ({
          ...prevState,
          [userId]: false
        }));
        return;
      }
      
      console.log(`Fetching call details for user ID: ${userId}`);
      
      // Construct URL using configuration from API_CONFIG
  const response = await apiCall(`/call-uses/user/${userId}`, 'GET');
      console.log('API URL being called: /api/call-uses/user/' + userId);
      
      // apiCall returns normalized response data
      
      console.log('Call details response:', response.data);
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      
      // Check if we need to access data through a nested property
      let callDetailsData = {};
      
      if (response && response.callUses && response.callUses.length > 0) {
        callDetailsData = response.callUses[0];
        console.log('Found call data in callUses array:', callDetailsData);
      } else if (response && response.data) {
        callDetailsData = response.data;
        console.log('Using nested data property');
      } else {
        callDetailsData = response;
        console.log('Using response data directly');
      }
      
      // Store the call details in state
      setCallDetails(prevDetails => ({
        ...prevDetails,
        [userId]: callDetailsData
      }));
    } catch (error) {
      console.error("Error fetching call details:", error);
      console.error("Error details:", error.response ? error.response.data : 'No response data');
    } finally {
      // Set loading state to false
      setLoadingCallDetails(prevState => ({
        ...prevState,
        [userId]: false
      }));
    }
  };

  const handleAgentRowClick = (branch) => {
    const newExpandedId = expandedAgent === branch._id ? null : branch._id;
    setExpandedAgent(newExpandedId);
    
    // If expanding and we don't have call details yet, fetch them
    if (newExpandedId) {
      // Get the user ID for state management consistency
      const userId = branch.manager?.userId || branch.userId || branch.managerId || branch._id;
      if (!callDetails[userId]) {
        fetchCallDetails(branch);
      }
    }
  };

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <div className="branches-container">
        {successAlert.show && (
          <Alert severity="success" onClose={() => setSuccessAlert({ show: false, message: '' })} sx={{ mb: 2 }}>
            {successAlert.message}
          </Alert>
        )}

        <Card className="mb-4" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Agents</Typography>
                <Typography variant="body2" color="text.secondary">Create and manage agents</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  size="small"
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button variant="outlined" size="small" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>Prev</Button>
                <Typography variant="body2" sx={{ mx: 1 }}>Page {currentPage}</Typography>
                <Button variant="outlined" size="small" onClick={() => setCurrentPage((p) => p + 1)} disabled={loading}>Next</Button>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddBranch} sx={{ ml: 1, bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>
                  Add Agent
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} className="calllogs-table-container">
              <Table size="small" className="compact-table" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>S.NO</TableCell>
                    <TableCell>AGENT NAME</TableCell>
                    <TableCell>EMAIL ADDRESS</TableCell>
                    <TableCell>DEPARTMENT</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>ASSIGNED NUMBER</TableCell>
                    <TableCell align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                        <div className="mt-3">Loading agents...</div>
                      </TableCell>
                    </TableRow>
                  ) : currentBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <AddIcon style={{ fontSize: 40 }} />
                          </div>
                          <h4>No agents found</h4>
                          <p>Create your first agent to get started.</p>
                          <Button variant="contained" color="primary" onClick={handleAddBranch} sx={{ mt: 2 }}>
                            Add Agent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentBranches.map((branch, index) => (
                      <React.Fragment key={branch._id}>
                        <TableRow hover onClick={() => handleAgentRowClick(branch)} sx={{ cursor: 'pointer' }}>
                          <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                          <TableCell>{branch.branchName}</TableCell>
                          <TableCell>{branch.manager?.email || '-'}</TableCell>
                          <TableCell>{branch.department ? (typeof branch.department === 'object' ? (branch.department.name || 'No Name') : String(branch.department)) : 'Not Assigned'}</TableCell>
                          <TableCell>
                            <Chip label={branch.isSuspended ? 'Suspended' : 'Active'} color={branch.isSuspended ? 'warning' : 'success'} size="small" />
                          </TableCell>
                          <TableCell>{Array.isArray(branch.didNumbers) && branch.didNumbers.length > 0 ? branch.didNumbers[0] : 'Not Assigned'}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditBranch(branch); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <Button size="small" variant="outlined" color={branch.isSuspended ? 'success' : 'warning'} onClick={(e) => { e.stopPropagation(); handleSuspendBranch(branch.id); }} sx={{ mx: 1 }}>
                              {branch.isSuspended ? 'Activate' : 'Suspend'}
                            </Button>
                            <Button size="small" variant="outlined" color="info" onClick={(e) => { e.stopPropagation(); handleResetPassword(branch.manager?.email); }}>
                              Reset
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={expandedAgent === branch._id} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2, backgroundColor: '#f8f9fa', p: 2, borderRadius: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle1">Agent Details - {branch.branchName}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2">Call Details</Typography>
                                    {(() => {
                                      const userId = branch.manager?.userId || branch.userId || branch.managerId || branch._id;
                                      return loadingCallDetails[userId] ? (
                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                          <CircularProgress size={24} />
                                          <Typography variant="body2">Loading call details...</Typography>
                                        </Box>
                                      ) : (
                                        <Grid container spacing={2}>
                                          <Grid item xs={6} sm={3}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                              <Typography variant="h6" color="primary">{callDetails[userId]?.outboundCalls || 0}</Typography>
                                              <Typography variant="caption" color="text.secondary">Outbound Calls</Typography>
                                            </Paper>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                              <Typography variant="h6" color="success.main">{callDetails[userId]?.inboundCalls || 0}</Typography>
                                              <Typography variant="caption" color="text.secondary">Inbound Calls</Typography>
                                            </Paper>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                              <Typography variant="h6" color="warning.main">{callDetails[userId]?.missedCalls || 0}</Typography>
                                              <Typography variant="caption" color="text.secondary">Missed Calls</Typography>
                                            </Paper>
                                          </Grid>
                                          <Grid item xs={6} sm={3}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                              <Typography variant="h6" color="error.main">{callDetails[userId]?.hangCalls || 0}</Typography>
                                              <Typography variant="caption" color="text.secondary">Hang Calls</Typography>
                                            </Paper>
                                          </Grid>
                                        </Grid>
                                      );
                                    })()}
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Working Hours</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                      <Grid container>
                                        <Grid item xs={12} sm={6}>
                                          <Typography><strong>Start Time:</strong> 9:00 AM</Typography>
                                          <Typography><strong>End Time:</strong> 6:00 PM</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                          <Typography><strong>Break Time:</strong> 1:00 PM - 2:00 PM</Typography>
                                          <Typography><strong>Total Hours:</strong> 8 hours</Typography>
                                        </Grid>
                                      </Grid>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Active Hours (Today)</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                          <Typography><strong>Login Time:</strong> 9:15 AM</Typography>
                                          <Typography><strong>Total Active Time:</strong> 6h 45m</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                          <Typography><strong>Break Duration:</strong> 1h 15m</Typography>
                                          <Typography><strong>Idle Time:</strong> 30m</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                          <Typography><strong>Current Status:</strong> <Chip label="Online" color="success" sx={{ ml: 1 }} /></Typography>
                                          <Typography variant="body2"><strong>Last Activity:</strong> 2 minutes ago</Typography>
                                        </Grid>
                                      </Grid>
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
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

        {/* Add Agent Dialog */}
        <Dialog open={openAddBranch} onClose={handleCloseAddBranch} maxWidth="md" fullWidth>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Agent Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} fullWidth />
              <TextField label="Agent Phone Number" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} fullWidth />
              <TextField label="Email Address" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} fullWidth />
              <FormControl fullWidth>
                <InputLabel id="department-label">Department</InputLabel>
                <Select labelId="department-label" id="department" value={department} label="Department" onChange={e => setDepartment(e.target.value)}>
                  {departments.length === 0 ? <MenuItem value=""><em>Loading departments...</em></MenuItem> : departments.map(dept => (
                    <MenuItem key={dept._id} value={dept._id || dept.id}>{typeof dept === 'object' ? (dept.name || 'Unnamed Department') : String(dept)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="timegroup-label">Shift</InputLabel>
                <Select labelId="timegroup-label" id="timeGroup" value={timeGroup} label="Shift" onChange={e => handleTimeGroupChange(e.target.value)}>
                  <MenuItem value=""><em>Select Shift</em></MenuItem>
                  <MenuItem value="morning">Morning Shift (9 AM - 12 PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon Shift (12 PM - 6 PM)</MenuItem>
                  <MenuItem value="full">Full Shift (9 AM - 6 PM)</MenuItem>
                  <MenuItem value="night">Night Shift (6 PM - 12 AM)</MenuItem>
                  <MenuItem value="custom">Custom Shift</MenuItem>
                </Select>
              </FormControl>
              {/* Start / End time — editable when Custom is selected, read-only for presets */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={timeGroup !== 'custom'}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={timeGroup !== 'custom'}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel id="assignDid-label">Assign DID</InputLabel>
                <Select labelId="assignDid-label" id="assignDid" value={selectedDid} label="Assign DID" onChange={e => setSelectedDid(e.target.value)}>
                  {getAvailableDidNumbers().map(did => <MenuItem key={did.id} value={did.id}>{did.number}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddBranch}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveBranch} sx={{ bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>Save Agent</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Agent Dialog */}
        <Dialog open={openEditBranch} onClose={handleCloseEditBranch} maxWidth="md" fullWidth>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Agent Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} fullWidth />
              <TextField label="Email Address" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} fullWidth />
              <FormControl fullWidth>
                <InputLabel id="edit-department-label">Department</InputLabel>
                <Select labelId="edit-department-label" id="editDepartment" value={department} label="Department" onChange={e => setDepartment(e.target.value)}>
                  {departments.map(dept => <MenuItem key={dept._id} value={dept._id || dept.id}>{typeof dept === 'object' ? (dept.name || 'Unnamed Department') : String(dept)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="edit-timegroup-label">Shift</InputLabel>
                <Select labelId="edit-timegroup-label" id="editTimeGroup" value={timeGroup} label="Shift" onChange={e => handleTimeGroupChange(e.target.value)}>
                  <MenuItem value=""><em>Select Shift</em></MenuItem>
                  <MenuItem value="morning">Morning Shift (9 AM - 12 PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon Shift (12 PM - 6 PM)</MenuItem>
                  <MenuItem value="full">Full Shift (9 AM - 6 PM)</MenuItem>
                  <MenuItem value="night">Night Shift (6 PM - 12 AM)</MenuItem>
                  <MenuItem value="custom">Custom Shift</MenuItem>
                </Select>
              </FormControl>
              {/* Start / End time — editable when Custom is selected, read-only for presets */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={timeGroup !== 'custom'}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={timeGroup !== 'custom'}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel id="edit-assignDid-label">Assign DID</InputLabel>
                <Select labelId="edit-assignDid-label" id="editAssignDid" value={selectedDid} label="Assign DID" onChange={e => setSelectedDid(e.target.value)}>
                  {getAvailableDidNumbers(selectedBranch?._id).map(did => <MenuItem key={did.id} value={did.id}>{did.number}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditBranch}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateBranch} sx={{ bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>Update Agent</Button>
          </DialogActions>
        </Dialog>
      </div>
    </Box>
  );
};

export default Branches;
