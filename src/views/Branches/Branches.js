import React, { useState, useEffect } from "react";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CAlert,
  CInputGroup,
  CPagination,
  CPaginationItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch } from '@coreui/icons'
import axios from "axios";
import Swal from "sweetalert2";
import './Branches.css'
import { API_CONFIG } from '../../config/api';

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
  const [timeCondition, setTimeCondition] = useState("");
  const [stickyAgents, setStickyAgents] = useState(false);
  const [managerName, setManagerName] = useState("");
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
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [callDetails, setCallDetails] = useState({});
  const [loadingCallDetails, setLoadingCallDetails] = useState({});
  const token = isAuthenticated();

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/v1/user/details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err);
      });
  }, [token]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `/api/departments/business/${user.businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Departments API Response:', response.data);
      // Make sure we're accessing departments from the correct path and they're properly formatted
      const departmentsData = response.data.departments || response.data.data || [];
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
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5040' 
        : 'https://api-impactvibescloud.onrender.com';

      const response = await axios.get(
        `${baseUrl}/api/branch/${user.businessId}/branches`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      // Get the branches array from the response
      const branchesData = response.data.data || [];
      
      // Map the data to match our component's expected structure
      const formattedBranches = branchesData.map(branch => ({
        ...branch,
        manager: {
          name: branch.user?.name || '',
          email: branch.user?.email || '',
          userId: branch.user?._id || ''
        },
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
      const response = await axios.get(
        `http://localhost:5040/api/numbers/assigned-to/${user.businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      // The API returns an array of objects with number and _id
      const didNumbers = response.data.data || [];
      setDidNumbers(
        didNumbers.map((did) => ({ id: did._id, number: did.number }))
      );
    } catch (error) {
      console.error("Error fetching DID numbers:", error);
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
        businessId: user.businessId,
        didNumbers: didNumberValue ? [didNumberValue] : [], // Use number, not id
        stickyBranch: stickyAgents, // Renamed from stickyAgents to stickyBranch
        timeGroup,
        timeCondition
      };
      if (department) {
        requestBody.department = department;
      }

      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5040' 
        : 'https://api-impactvibescloud.onrender.com';

      // Create the branch first
      const res = await axios.post(
        `${baseUrl}/api/branch/create/new`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Assign DID to branch if selectedDid is present
      if (selectedDid && res.data && (res.data.branch?._id || res.data.data?._id)) {
        const branchId = res.data.branch?._id || res.data.data?._id;
        const didId = selectedDid;
        const apiDomain = baseUrl.replace(/\/$/, '');
        try {
          await axios.put(
            `${apiDomain}/api/numbers/${didId}`,
            { assigned_to_branch: branchId },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            }
          );
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
    setManagerName(branch.user?.name || branch.manager?.name || "");
    setManagerEmail(branch.user?.email || branch.manager?.email || "");
    setDepartment(branch.department?._id || "");
    setTimeGroup(branch.timeGroup || "");
    setTimeCondition(branch.timeCondition || "");
    setStickyAgents(branch.stickyBranch || false);
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
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5040' 
        : 'https://api-impactvibescloud.onrender.com';

      // Update the branch first
      const res = await axios.patch(
        `${baseUrl}/api/branch/edit/${selectedBranch._id}`,
        {
          branchName,
          userEmail: managerEmail,
          userName: managerName,
          businessId: user.businessId,
          didNumbers: didNumberValue ? [didNumberValue] : [],
          stickyBranch: stickyAgents,
          timeGroup,
          timeCondition,
          ...(department ? { department } : {})
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Assign DID to branch if selectedDid is present
      if (selectedDid && (selectedBranch._id || (res.data && (res.data.branch?._id || res.data.data?._id)))) {
        const branchId = selectedBranch._id || res.data.branch?._id || res.data.data?._id;
        const didId = selectedDid;
        const apiDomain = baseUrl.replace(/\/$/, '');
        try {
          await axios.put(
            `${apiDomain}/api/numbers/${didId}`,
            { assigned_to_branch: branchId },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            }
          );
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
    setTimeCondition("");
    setStickyAgents(false); // This will be sent as stickyBranch
    setManagerName("");
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
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5040' 
        : 'https://api-impactvibescloud.onrender.com';
        
      const apiUrl = `${baseUrl}/api/call-uses/user/${userId}`;
      console.log('API URL being called:', apiUrl);
      
      // Using the API endpoint with full URL as shown in the curl command
      const response = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache,no-store'
          },
        }
      );
      
      console.log('Call details response:', response.data);
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      
      // Check if we need to access data through a nested property
      let callDetailsData = {};
      
      if (response.data && response.data.callUses && response.data.callUses.length > 0) {
        // Extract the first call use object from the array
        callDetailsData = response.data.callUses[0];
        console.log('Found call data in callUses array:', callDetailsData);
      } else if (response.data && response.data.data) {
        callDetailsData = response.data.data;
        console.log('Using nested data property');
      } else {
        callDetailsData = response.data;
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
    <div className="branches-container">
      {successAlert.show && (
        <CAlert color="success" dismissible onClose={() => setSuccessAlert({ show: false, message: '' })}>
          {successAlert.message}
        </CAlert>
      )}
      
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="branches-title">Agents</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton color="primary" className="add-agent-btn" onClick={handleAddBranch}>
                <CIcon icon={cilPlus} className="me-2" />
                Add Agent
              </CButton>
            </CCol>
          </CRow>
          
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>

          <CTable hover responsive className="branches-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>AGENT NAME</CTableHeaderCell>
                <CTableHeaderCell>EMAIL ADDRESS</CTableHeaderCell>
                <CTableHeaderCell>DEPARTMENT</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
                <CTableHeaderCell>CALL STATUS</CTableHeaderCell>
                <CTableHeaderCell className="text-center">ACTIONS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="8" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading agents...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : currentBranches.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="8" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilPlus} size="xl" />
                      </div>
                      <h4>No agents found</h4>
                      <p>Create your first agent to get started.</p>
                      <CButton color="primary" className="mt-3" onClick={handleAddBranch}>
                        Add Agent
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentBranches.map((branch, index) => (
                  <React.Fragment key={branch._id}>
                    <CTableRow 
                      onClick={() => handleAgentRowClick(branch)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CTableDataCell>
                        <div className="agent-number">{indexOfFirstItem + index + 1}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="agent-name">{branch.branchName}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="manager-email">{branch.manager?.email || "-"}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="department-name">
                          {branch.department 
                            ? (typeof branch.department === 'object' 
                               ? (branch.department.name || "No Name") 
                               : String(branch.department))
                            : "Not Assigned"}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge 
                          color={branch.isSuspended ? "warning" : "success"}
                          className="status-badge"
                        >
                          {branch.isSuspended ? "Suspended" : "Active"}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge 
                          color="info"
                          className="call-status-badge"
                        >
                          Available
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton 
                          color="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBranch(branch);
                          }}
                          className="me-2"
                          size="sm"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton 
                          color={branch.isSuspended ? "success" : "warning"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuspendBranch(branch.id);
                          }}
                          className="me-2"
                          size="sm"
                        >
                          {branch.isSuspended ? "Activate" : "Suspend"}
                        </CButton>
                        <CButton 
                          color="info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetPassword(branch.manager.email);
                          }}
                          size="sm"
                        >
                          Reset
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                    {/* Expanded Details Row */}
                    {expandedAgent === branch._id && (
                      <CTableRow>
                        <CTableDataCell colSpan="8" style={{ padding: 0, backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '20px' }}>
                            <CRow className="mb-4">
                              <CCol>
                                <h5 className="mb-3">Agent Details - {branch.branchName}</h5>
                              </CCol>
                            </CRow>
                            
                            {/* Call Details Section */}
                            <CRow className="mb-4">
                              <CCol>
                                <h6 className="mb-3">Call Details</h6>
                                {(() => {
                                  // Get the user ID for state management consistency
                                  const userId = branch.manager?.userId || branch.userId || branch.managerId || branch._id;
                                  return loadingCallDetails[userId] ? (
                                    <div className="text-center py-4">
                                      <CSpinner color="primary" />
                                      <div className="mt-2">Loading call details...</div>
                                    </div>
                                  ) : (
                                    <CRow>
                                      <CCol md={3}>
                                        <div className="text-center p-3 border rounded bg-white">
                                          <h4 className="text-primary mb-1">
                                            {callDetails[userId]?.outboundCalls || 0}
                                          </h4>
                                          <small className="text-muted">Outbound Calls</small>
                                        </div>
                                      </CCol>
                                      <CCol md={3}>
                                        <div className="text-center p-3 border rounded bg-white">
                                          <h4 className="text-success mb-1">
                                            {callDetails[userId]?.inboundCalls || 0}
                                          </h4>
                                          <small className="text-muted">Inbound Calls</small>
                                        </div>
                                      </CCol>
                                      <CCol md={3}>
                                        <div className="text-center p-3 border rounded bg-white">
                                          <h4 className="text-warning mb-1">
                                            {callDetails[userId]?.missedCalls || 0}
                                          </h4>
                                          <small className="text-muted">Missed Calls</small>
                                        </div>
                                      </CCol>
                                      <CCol md={3}>
                                        <div className="text-center p-3 border rounded bg-white">
                                          <h4 className="text-danger mb-1">
                                            {callDetails[userId]?.hangCalls || 0}
                                          </h4>
                                          <small className="text-muted">Hang Calls</small>
                                        </div>
                                      </CCol>
                                    </CRow>
                                  );
                                })()}
                              </CCol>
                            </CRow>

                            {/* Working Hours Section */}
                            <CRow className="mb-4">
                              <CCol>
                                <h6 className="mb-3">Working Hours</h6>
                                <div className="p-3 border rounded bg-white">
                                  <CRow>
                                    <CCol md={6}>
                                      <div className="mb-2">
                                        <strong>Start Time:</strong> 9:00 AM
                                      </div>
                                      <div className="mb-2">
                                        <strong>End Time:</strong> 6:00 PM
                                      </div>
                                    </CCol>
                                    <CCol md={6}>
                                      <div className="mb-2">
                                        <strong>Break Time:</strong> 1:00 PM - 2:00 PM
                                      </div>
                                      <div className="mb-2">
                                        <strong>Total Hours:</strong> 8 hours
                                      </div>
                                    </CCol>
                                  </CRow>
                                </div>
                              </CCol>
                            </CRow>

                            {/* Active Hours Section */}
                            <CRow>
                              <CCol>
                                <h6 className="mb-3">Active Hours (Today)</h6>
                                <div className="p-3 border rounded bg-white">
                                  <CRow>
                                    <CCol md={4}>
                                      <div className="mb-2">
                                        <strong>Login Time:</strong> 9:15 AM
                                      </div>
                                      <div className="mb-2">
                                        <strong>Total Active Time:</strong> 6h 45m
                                      </div>
                                    </CCol>
                                    <CCol md={4}>
                                      <div className="mb-2">
                                        <strong>Break Duration:</strong> 1h 15m
                                      </div>
                                      <div className="mb-2">
                                        <strong>Idle Time:</strong> 30m
                                      </div>
                                    </CCol>
                                    <CCol md={4}>
                                      <div className="mb-2">
                                        <strong>Current Status:</strong> 
                                        <CBadge color="success" className="ms-2">Online</CBadge>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Last Activity:</strong> 2 minutes ago
                                      </div>
                                    </CCol>
                                  </CRow>
                                </div>
                              </CCol>
                            </CRow>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </React.Fragment>
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

      {/* Add Agent Modal */}
      <CModal visible={openAddBranch} onClose={handleCloseAddBranch} size="lg">
        <CModalHeader>
          <CModalTitle>Add New Agent</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="agentName">Agent Name</CFormLabel>
              <CFormInput
                type="text"
                id="agentName"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Enter agent name"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="agentPhone">Agent Phone Number</CFormLabel>
              <CFormInput
                type="text"
                id="agentPhone"
                value={agentPhone}
                onChange={e => setAgentPhone(e.target.value)}
                placeholder="Enter agent phone number"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="managerEmail">Email Address</CFormLabel>
              <CFormInput
                type="email"
                id="managerEmail"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="department">Department</CFormLabel>
              <CFormSelect
                id="department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.length === 0 ? (
                  <option value="" disabled>Loading departments...</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept._id} value={dept._id || dept.id}>
                      {typeof dept === 'object' ? (dept.name || 'Unnamed Department') : String(dept)}
                    </option>
                  ))
                )}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="timeGroup">Time Group</CFormLabel>
              <CFormSelect
                id="timeGroup"
                value={timeGroup}
                onChange={e => setTimeGroup(e.target.value)}
                required
              >
                <option value="">Select Shifts</option>
                <option value="morning">Morning Shift (8 AM - 4 PM)</option>
                <option value="afternoon">Afternoon Shift (12 PM - 8 PM)</option>
                <option value="evening">Evening Shift (4 PM - 12 AM)</option>
                <option value="night">Night Shift (10 PM - 6 AM)</option>
                <option value="24hours">24 Hours</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="timeCondition">Time Condition</CFormLabel>
              <CFormInput
                type="text"
                id="timeCondition"
                value={timeCondition}
                onChange={e => setTimeCondition(e.target.value)}
                placeholder="Enter time condition"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="stickyAgents">Sticky Agents</CFormLabel>
              <CFormSelect
                id="stickyAgents"
                value={stickyAgents}
                onChange={e => setStickyAgents(e.target.value === 'true')}
                required
              >
                <option value="">Select Option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="assignDid">Assign DID</CFormLabel>
              <CFormSelect
                id="assignDid"
                value={selectedDid}
                onChange={(e) => setSelectedDid(e.target.value)}
                required
              >
                <option value="">Select DID Number</option>
                {getAvailableDidNumbers().map((did) => (
                  <option key={did.id} value={did.id}>
                    {did.number}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseAddBranch}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveBranch}>
            Save Agent
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Agent Modal */}
      <CModal visible={openEditBranch} onClose={handleCloseEditBranch} size="lg">
        <CModalHeader>
          <CModalTitle>Edit Agent</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="editAgentName">Agent Name</CFormLabel>
              <CFormInput
                type="text"
                id="editAgentName"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Enter agent name"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editAgentName2">Agent Name</CFormLabel>
              <CFormInput
                type="text"
                id="editAgentName2"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Enter agent name"
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editManagerEmail">Email Address</CFormLabel>
              <CFormInput
                type="email"
                id="editManagerEmail"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editDepartment">Department</CFormLabel>
              <CFormSelect
                id="editDepartment"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id || dept.id}>
                    {typeof dept === 'object' ? (dept.name || 'Unnamed Department') : String(dept)}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editTimeGroup">Time Group</CFormLabel>
              <CFormSelect
                id="editTimeGroup"
                value={timeGroup}
                onChange={e => setTimeGroup(e.target.value)}
                required
              >
                <option value="">Select Shifts</option>
                <option value="morning">Morning Shift (8 AM - 4 PM)</option>
                <option value="afternoon">Afternoon Shift (12 PM - 8 PM)</option>
                <option value="evening">Evening Shift (4 PM - 12 AM)</option>
                <option value="night">Night Shift (10 PM - 6 AM)</option>
                <option value="24hours">24 Hours</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editTimeCondition">Time Condition</CFormLabel>
              <CFormInput
                type="text"
                id="editTimeCondition"
                value={timeCondition}
                onChange={e => setTimeCondition(e.target.value)}
                placeholder="Enter time condition"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editStickyAgents">Sticky Agents</CFormLabel>
              <CFormSelect
                id="editStickyAgents"
                value={stickyAgents}
                onChange={e => setStickyAgents(e.target.value === 'true')}
                required
              >
                <option value="">Select Option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="editAssignDid">Assign DID</CFormLabel>
              <CFormSelect
                id="editAssignDid"
                value={selectedDid}
                onChange={(e) => setSelectedDid(e.target.value)}
              >
                <option value="">Select DID Number</option>
                {getAvailableDidNumbers(selectedBranch?._id).map((did) => (
                  <option key={did.id} value={did.id}>
                    {did.number}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseEditBranch}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleUpdateBranch}>
            Update Agent
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default Branches;
