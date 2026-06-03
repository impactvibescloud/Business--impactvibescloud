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
import DeleteIcon from '@mui/icons-material/Delete'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import LockResetIcon from '@mui/icons-material/LockReset'
import SearchIcon from '@mui/icons-material/Search'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
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
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [selectedAgentForPassword, setSelectedAgentForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  // departmentIds — a branch/agent can belong to multiple departments now.
  // The first id in this array is also written to the legacy `department`
  // field on the API for backward compat.
  const [departmentIds, setDepartmentIds] = useState([]);
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
    // Allow all DIDs to be selectable so the same DID can be assigned to multiple branches/agents.
    // Previously we filtered out DIDs already assigned to other branches; remove that restriction.
    return didNumbers || [];
  };
  // Multiple DIDs can be assigned to a single branch/agent. selectedDids is
  // an array of DID inventory ids; the form serializes them to:
  //   - branch.didNumbers (array of phone numbers)
  //   - one POST /numbers/:id/assign per DID
  const [selectedDids, setSelectedDids] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [successAlert, setSuccessAlert] = useState({ show: false, message: '' });
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const [uploadResultMessage, setUploadResultMessage] = useState('')
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [callDetails, setCallDetails] = useState({});
  const [loadingCallDetails, setLoadingCallDetails] = useState({});
  const [agentStatusMap, setAgentStatusMap] = useState({});
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
      // Return the fresh list so a caller awaiting fetchDepartments can
      // use it immediately, without waiting for React to re-render the
      // state. (Without this, fetchBranches called right after closes
      // over the OLD empty `departments` array and resolves every dept
      // name to '', so every row renders "Not Assigned".)
      return processedDepartments;
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  };

  useEffect(() => {
    if (user?.businessId) {
      // Load departments BEFORE branches so the agent table's department
      // column can resolve names. Pass the fresh list straight into
      // fetchBranches — relying on state would still see an empty array
      // here because React hasn't re-rendered yet.
      (async () => {
        const freshDepts = await fetchDepartments();
        await fetchBranches(freshDepts);
      })();
      fetchDidNumbers();
      fetchAgentStatus();
    }
  }, [user?.businessId]); // Changed dependency to specifically watch businessId changes

  // If departments load AFTER branches (e.g., on slow network) and some
  // rows came back without a resolved name, refetch using the now-loaded
  // department list so the column populates.
  useEffect(() => {
    if (departments && departments.length && branches && branches.length) {
      const needsRefresh = branches.some(
        (b) =>
          (!b.departmentNames || b.departmentNames.length === 0) &&
          (b.departmentIds?.length || b.department)
      );
      if (needsRefresh) fetchBranches(departments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  const fetchAgentStatus = async () => {
    try {
      const response = await apiCall('/api/business/agents/status', 'GET');
      const statusData = response.data?.agents || [];
      
      // Create a map of agentId/branchId -> status
      const statusMap = {};
      statusData.forEach(agent => {
        if (agent.branchId) {
          statusMap[agent.branchId] = agent.status; // online, offline, break, lunch
        }
        if (agent.id) {
          statusMap[agent.id] = agent.status;
        }
      });
      
      setAgentStatusMap(statusMap);
    } catch (error) {
      console.error("Error fetching agent status:", error);
    }
  };

  const fetchBranches = async (deptListOverride) => {
    try {
  const response = await apiCall(`/branch/${user.businessId}/branches`, 'GET');
      const branchesData = response.data || response.branches || [];

      // Build a name lookup from the freshest department list we have.
      // Callers can pass an override (the immediate return value from
      // fetchDepartments) to avoid the React state-closure problem where
      // `departments` is still empty right after `await fetchDepartments()`.
      const deptSource =
        Array.isArray(deptListOverride) && deptListOverride.length
          ? deptListOverride
          : departments;
      const deptNameById = new Map();
      try {
        (deptSource || []).forEach((dept) => {
          if (dept && dept._id) deptNameById.set(String(dept._id), dept.name || '');
        });
      } catch (e) { /* ignore */ }

      const resolveDeptName = (d) => {
        if (!d) return '';
        if (typeof d === 'object') {
          return (
            d.name ||
            d.departmentName ||
            d.label ||
            deptNameById.get(String(d._id || d.id || d.departmentId)) ||
            ''
          );
        }
        // Primitive (ObjectId string): look it up
        return deptNameById.get(String(d)) || '';
      };

      // Extract a usable ObjectId (string) from whatever shape the API returns.
      const extractId = (d) => {
        if (!d) return null;
        if (typeof d === 'object') return String(d._id || d.id || d.departmentId || '');
        return String(d);
      };

      // Map the data to match our component's expected structure
      const formattedBranches = branchesData.map(branch => {
        // Prefer the new multi-department field; fall back to legacy single.
        const rawDeptList =
          (Array.isArray(branch.departmentIds) && branch.departmentIds.length
            ? branch.departmentIds
            : null) ||
          (branch.department ? [branch.department] : null);

        const deptNames = (rawDeptList || [])
          .map(resolveDeptName)
          .filter(Boolean);

        // ALWAYS preserve the real ObjectId(s) — the edit form reads
        // `branch.department._id` and `branch.departmentIds` to hydrate
        // the dept multi-select. Setting `_id: null` here (as the
        // previous version did) caused the edit hydration to fall
        // through to stringifying the whole object, producing
        // "[object Object]" which the server then failed to cast to
        // ObjectId on save ("Branch validation failed: departmentIds.0:
        // Cast to [ObjectId] failed").
        const deptIdList = (rawDeptList || []).map(extractId).filter(Boolean);

        // Display object — combined name + first real ObjectId.
        const primaryDept = deptNames.length
          ? { _id: deptIdList[0] || null, name: deptNames.join(', ') }
          : null;

        return {
          ...branch,
          manager: {
            name: branch.user?.name || '',
            email: branch.user?.email || '',
            phone: branch.user?.phone || branch.phone || '',
            userId: branch.user?._id || ''
          },
          business: branch.business ? {
            _id: branch.business._id,
            name: branch.business.businessName || branch.business.name || 'Not assigned'
          } : { name: 'Not assigned' },
          department: primaryDept,
          // Replace the raw API value with clean string IDs so the edit
          // form's multi-select always sees real ObjectId strings.
          departmentIds: deptIdList,
          departmentNames: deptNames,
          id: branch._id,
          didNumber: branch.assignedNumbers?.[0]?.number || branch.didNumbers?.[0] || '',
        };
      });

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
      // Translate the array of selected DID-inventory ids into actual phone
      // numbers (which is what the branch document stores in `didNumbers`).
      const selectedDidObjs = selectedDids
        .map((id) => didNumbers.find((d) => d.id === id))
        .filter(Boolean);
      const didNumberValues = selectedDidObjs.map((d) => d.number);

      const requestBody = {
        branchName,
        branchEmail: managerEmail,
        phone: agentPhone,
        businessId: user.businessId,
        didNumbers: didNumberValues,
        timeGroup: timeGroup,
      };
      // Resolve an extension for the FIRST chosen DID — this is what the
      // branch's primary PJSIP endpoint registers as. Subsequent DIDs share
      // the same extension via NumberAssignment rows.
      let extension = null;
      if (didNumberValues[0]) {
        extension = await fetchDidExtension(didNumberValues[0]);
        if (extension) requestBody.extension = String(extension);
      }
      if (startTime && startTime.trim() !== '') requestBody.startTime = startTime;
      if (endTime && endTime.trim() !== '') requestBody.endTime = endTime;
      if (departmentIds.length > 0) {
        requestBody.departmentIds = departmentIds;
        requestBody.department = departmentIds[0]; // legacy single-value mirror
      }

      const res = await apiCall('/branch/create/new', 'POST', requestBody);

      // Create one NumberAssignment per selected DID. They all bind to the
      // same extension so the agent receives inbound calls on every DID.
      // Assignments are handled server-side during branch creation now;
      // no per-DID POST loop is necessary. Server will create NumberAssignment
      // rows and trigger telephony sync asynchronously.

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
    // Hydrate department selection from departmentIds[] (preferred) or the
    // legacy single `department` field, normalizing to an array of ids.
    const deptIds = Array.isArray(branch.departmentIds) && branch.departmentIds.length
      ? branch.departmentIds.map((d) => (d && d._id) || d).filter(Boolean).map(String)
      : branch.department?._id
        ? [String(branch.department._id)]
        : branch.department
          ? [String(branch.department)]
          : [];
    setDepartmentIds(deptIds);
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
    // Hydrate selectedDids[] from every assigned-number-like field on the
    // branch. We prefer `assignedNumbers` (full assignment objects) since
    // those carry the DID inventory id; otherwise fall back to `didNumbers`
    // (raw phone strings) and look the id up in our cached list.
    const assignedNumberVals = (() => {
      if (Array.isArray(branch.assignedNumbers) && branch.assignedNumbers.length) {
        return branch.assignedNumbers.map((a) => (a && (a.number || a)) || null).filter(Boolean);
      }
      if (Array.isArray(branch.didNumbers) && branch.didNumbers.length) {
        return branch.didNumbers;
      }
      if (branch.didNumber) return [branch.didNumber];
      return [];
    })();

    const ids = assignedNumberVals
      .map((val) => {
        const found = didNumbers.find(
          (d) => d.number === val || d.id === val || String(d._id) === String(val),
        );
        return found ? found.id : null;
      })
      .filter(Boolean);
    setSelectedDids(Array.from(new Set(ids)));
    setOpenEditBranch(true);
  };

  const handleCloseEditBranch = () => {
    setOpenEditBranch(false);
    setSelectedBranch(null);
    resetForm();
  };

  const handleUpdateBranch = async () => {
    try {
      const selectedDidObjs = selectedDids
        .map((id) => didNumbers.find((d) => d.id === id))
        .filter(Boolean);
      const didNumberValues = selectedDidObjs.map((d) => d.number);

      const updatePayload = {
        branchName,
        userEmail: managerEmail,
        businessId: user.businessId,
        didNumbers: didNumberValues,
        timeGroup: timeGroup,
        ...(departmentIds.length
          ? { departmentIds, department: departmentIds[0] }
          : {}),
      };
      let extension = null;
      if (didNumberValues[0]) {
        extension = await fetchDidExtension(didNumberValues[0]);
        if (extension) updatePayload.extension = String(extension);
      }
      if (startTime && startTime.trim() !== '') updatePayload.startTime = startTime;
      if (endTime && endTime.trim() !== '') updatePayload.endTime = endTime;
      const res = await apiCall(`/branch/edit/${selectedBranch._id}`, 'PATCH', updatePayload);

      // The server will create/cleanup `NumberAssignment` rows for the
      // branch update. Avoid sending one POST per DID to reduce races and
      // latency; telephony sync is triggered asynchronously server-side.
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
    setDepartmentIds([]);
    setTimeGroup("");
    setStartTime("");
    setEndTime("");
    setManagerEmail("");
    setBranchStatus("Active");
    setSelectedDids([]);
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


  const handleDeleteBranch = async (branch) => {
    const branchId = branch?._id || branch?.id;
    if (!branchId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Agent ID not found.' });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete agent "${branch.branchName}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiCall(`/branch/delete/${branchId}`, 'DELETE');
      fetchBranches();
      setSuccessAlert({
        show: true,
        message: `Agent "${branch.branchName}" deleted successfully!`,
      });
      setTimeout(() => {
        setSuccessAlert({ show: false, message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error deleting branch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to delete agent.',
      });
    }
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

  const handleOpenChangePassword = (agent) => {
    setSelectedAgentForPassword(agent);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setOpenChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setOpenChangePassword(false);
    setSelectedAgentForPassword(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter both password fields.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match. Please try again.',
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (!selectedAgentForPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Agent not found.',
      });
      return;
    }

    // Get the user ID (branch-related user, not branch ID)
    const userId = selectedAgentForPassword.user?._id || selectedAgentForPassword.manager?.userId;
    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User ID not found for this agent.',
      });
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${getBaseURL()}/api/business/agent/change-password`,
        {
          agentId: userId,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Password Changed',
        text: `Password for agent "${selectedAgentForPassword.branchName}" has been changed successfully.`,
      });
      handleCloseChangePassword();
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to change password. Please try again.',
      });
    } finally {
      setPasswordChangeLoading(false);
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
            <Box sx={{ mb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Agents</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>Create and manage agents</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200, maxWidth: '70%' }}>
                <TextField
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  size="small"
                  fullWidth
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box>
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
                    <TableCell>DEPARTMENT</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>EMAIL</TableCell>
                    <TableCell align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                        <div className="mt-3">Loading agents...</div>
                      </TableCell>
                    </TableRow>
                  ) : currentBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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
                          <TableCell>{branch.department ? (typeof branch.department === 'object' ? (branch.department.name || 'No Name') : String(branch.department)) : 'Not Assigned'}</TableCell>
                          <TableCell>
                            <Chip label={branch.isSuspended ? 'Suspended' : 'Active'} color={branch.isSuspended ? 'warning' : 'success'} size="small" />
                          </TableCell>
                          <TableCell>{branch.manager?.email || '-'}</TableCell>
                          <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditBranch(branch); }} title="Edit Agent">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color={branch.isSuspended ? 'success' : 'warning'} onClick={(e) => { e.stopPropagation(); handleSuspendBranch(branch.id); }} title={branch.isSuspended ? 'Activate Agent' : 'Suspend Agent'}>
                                {branch.isSuspended ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                              </IconButton>
                              <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); handleResetPassword(branch.manager?.email); }} title="Reset Password (Email)">
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenChangePassword(branch); }} title="Change Password">
                                <LockIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch); }} title="Delete Agent">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={expandedAgent === branch._id} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2, backgroundColor: '#f8f9fa', p: 2, borderRadius: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle1">Agent Details - {branch.branchName}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={4}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Current Status</Typography>
                                          {(() => {
                                            const status = agentStatusMap[branch._id] || 'offline';
                                            const statusColors = {
                                              'online': 'success',
                                              'offline': 'default',
                                              'break': 'warning',
                                              'lunch': 'info'
                                            };
                                            return <Chip label={status.toUpperCase()} color={statusColors[status] || 'default'} variant="outlined" size="small" />;
                                          })()}
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Last Activity</Typography>
                                          <Typography variant="body2">{branch.updatedAt ? new Date(branch.updatedAt).toLocaleString() : 'N/A'}</Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Email</Typography>
                                          <Typography variant="body2" sx={{ color: '#2563eb', cursor: 'pointer' }}>{branch.manager?.email || '-'}</Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Phone</Typography>
                                          <Chip label={branch.manager?.phone || 'Not assigned'} variant="outlined" size="small" />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Business</Typography>
                                          <Chip label={branch.business?.name || 'Not assigned'} variant="outlined" size="small" />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Department</Typography>
                                          <Chip label={branch.department ? (typeof branch.department === 'object' ? branch.department.name : branch.department) : 'Not Assigned'} variant="outlined" size="small" />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Shift</Typography>
                                          <Chip label={branch.defaultShiftStart && branch.defaultShiftEnd ? `${branch.defaultShiftStart.slice(0, 2)}:${branch.defaultShiftStart.slice(2)} - ${branch.defaultShiftEnd.slice(0, 2)}:${branch.defaultShiftEnd.slice(2)}` : 'Not set'} variant="outlined" size="small" />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>DIDs</Typography>
                                          <Chip label={Array.isArray(branch.didNumbers) && branch.didNumbers.length > 0 ? branch.didNumbers.join(', ') : 'Not assigned'} variant="outlined" size="small" />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={4}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Created</Typography>
                                          <Typography variant="body2">{branch.createdAt ? new Date(branch.createdAt).toLocaleString() : 'N/A'}</Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Box>
                                          <Typography variant="body2" sx={{ color: '#6b7280' }}>Updated</Typography>
                                          <Typography variant="body2">{branch.updatedAt ? new Date(branch.updatedAt).toLocaleString() : 'N/A'}</Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
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
                <InputLabel id="department-label">Departments</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  multiple
                  value={departmentIds}
                  label="Departments"
                  onChange={(e) => {
                    const v = e.target.value;
                    setDepartmentIds(typeof v === 'string' ? v.split(',') : v);
                  }}
                  renderValue={(selected) =>
                    departments
                      .filter((d) => selected.includes(d._id))
                      .map((d) => d.name || 'Unnamed')
                      .join(', ')
                  }
                >
                  {departments.length === 0
                    ? <MenuItem disabled value=""><em>Loading departments...</em></MenuItem>
                    : departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                          {dept.name || 'Unnamed Department'}
                        </MenuItem>
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
                <InputLabel id="assignDid-label">Assign DIDs</InputLabel>
                <Select
                  labelId="assignDid-label"
                  id="assignDid"
                  multiple
                  value={selectedDids}
                  label="Assign DIDs"
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedDids(typeof v === 'string' ? v.split(',') : v);
                  }}
                  renderValue={(selected) =>
                    didNumbers
                      .filter((d) => selected.includes(d.id))
                      .map((d) => d.number)
                      .join(', ')
                  }
                >
                  {getAvailableDidNumbers().map((did) => (
                    <MenuItem key={did.id} value={did.id}>{did.number}</MenuItem>
                  ))}
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
                <InputLabel id="edit-department-label">Departments</InputLabel>
                <Select
                  labelId="edit-department-label"
                  id="editDepartment"
                  multiple
                  value={departmentIds}
                  label="Departments"
                  onChange={(e) => {
                    const v = e.target.value;
                    setDepartmentIds(typeof v === 'string' ? v.split(',') : v);
                  }}
                  renderValue={(selected) =>
                    departments
                      .filter((d) => selected.includes(d._id))
                      .map((d) => d.name || 'Unnamed')
                      .join(', ')
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name || 'Unnamed Department'}
                    </MenuItem>
                  ))}
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
                <InputLabel id="edit-assignDid-label">Assign DIDs</InputLabel>
                <Select
                  labelId="edit-assignDid-label"
                  id="editAssignDid"
                  multiple
                  value={selectedDids}
                  label="Assign DIDs"
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedDids(typeof v === 'string' ? v.split(',') : v);
                  }}
                  renderValue={(selected) =>
                    didNumbers
                      .filter((d) => selected.includes(d.id))
                      .map((d) => d.number)
                      .join(', ')
                  }
                >
                  {getAvailableDidNumbers(selectedBranch?._id).map((did) => (
                    <MenuItem key={did.id} value={did.id}>{did.number}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditBranch}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateBranch} sx={{ bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}>Update Agent</Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog 
          open={openChangePassword} 
          onClose={handleCloseChangePassword} 
          maxWidth="sm" 
          fullWidth
          disableEscapeKeyDown={false}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon />
            Change Agent Password
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              {selectedAgentForPassword && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Changing password for: <strong>{selectedAgentForPassword.branchName}</strong> ({selectedAgentForPassword.manager?.email})
                </Typography>
              )}
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                placeholder="Enter new password (min 6 characters)"
                autoFocus
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                placeholder="Re-enter password to confirm"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                • Password must be at least 6 characters long<br />
                • Use a mix of uppercase, lowercase, numbers, and symbols for security
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseChangePassword} disabled={passwordChangeLoading}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleChangePassword}
              disabled={passwordChangeLoading}
              sx={{ bgcolor: 'var(--primary-600)', '&:hover': { bgcolor: 'var(--primary-500)' } }}
            >
              {passwordChangeLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              {passwordChangeLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Box>
  );
};

export default Branches;
