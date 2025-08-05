import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormSelect,
  CFormInput,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilFilter, cilReload } from '@coreui/icons';
import { useUserActivity } from '../../context/UserActivityContext';
import { 
  UserWithStatus,
  formatLastActivity
} from '../../components/UserActivityStatus';
import axios from 'axios';
import { isAutheticated } from '../../auth.js';

const TeamStatusPage = () => {
  const { teamStatuses, fetchTeamStatuses, loading, error } = useUserActivity();
  const [businesses, setBusinesses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const token = isAutheticated();

  // Fetch businesses on component mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await axios.get('/api/businesses', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setBusinesses(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    };
    
    fetchBusinesses();
    
    // Initial team statuses fetch
    fetchTeamStatuses();
    
    // Set up polling to refresh team statuses every 60 seconds
    const intervalId = setInterval(() => {
      fetchTeamStatuses(selectedBusiness, selectedBranch);
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [fetchTeamStatuses]);

  // Fetch branches when a business is selected
  useEffect(() => {
    if (!selectedBusiness) {
      setBranches([]);
      return;
    }
    
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`/api/branch/${selectedBusiness}/branches`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setBranches(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    
    fetchBranches();
  }, [selectedBusiness, token]);

  // Filter and sort team statuses
  useEffect(() => {
    let filtered = [...teamStatuses];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search) || 
        user.email?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search)
      );
    }
    
    // Sort the results
    filtered.sort((a, b) => {
      let fieldA, fieldB;
      
      switch (sortField) {
        case 'name':
          fieldA = a.name || '';
          fieldB = b.name || '';
          break;
        case 'status':
          fieldA = a.status || '';
          fieldB = b.status || '';
          break;
        case 'lastActivity':
          fieldA = new Date(a.lastActivity || 0).getTime();
          fieldB = new Date(b.lastActivity || 0).getTime();
          break;
        default:
          fieldA = a.name || '';
          fieldB = b.name || '';
      }
      
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    
    setFilteredStatuses(filtered);
  }, [teamStatuses, searchTerm, sortField, sortDirection]);

  // Handle business selection change
  const handleBusinessChange = (e) => {
    const businessId = e.target.value;
    setSelectedBusiness(businessId);
    setSelectedBranch('');
    fetchTeamStatuses(businessId, '');
  };

  // Handle branch selection change
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
    fetchTeamStatuses(selectedBusiness, branchId);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    fetchTeamStatuses(selectedBusiness, selectedBranch);
  };

  return (
    <div className="team-status-page">
      <CCard className="mb-4">
        <CCardHeader>
          <h5>Team Status</h5>
          <p className="text-medium-emphasis small">
            View real-time status of all team members
          </p>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CForm className="mb-4">
            <CRow>
              <CCol md={3}>
                <CFormSelect 
                  label="Business"
                  value={selectedBusiness}
                  onChange={handleBusinessChange}
                >
                  <option value="">All Businesses</option>
                  {businesses.map(business => (
                    <option key={business._id} value={business._id}>
                      {business.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  label="Branch"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  disabled={!selectedBusiness}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <div className="mb-3">
                  <label className="form-label">Search</label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by name, email, or role"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </div>
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <CButton 
                  color="primary" 
                  className="px-4 w-100"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <CSpinner size="sm" />
                  ) : (
                    <>
                      <CIcon icon={cilReload} className="me-2" />
                      Refresh
                    </>
                  )}
                </CButton>
              </CCol>
            </CRow>
          </CForm>
          
          {/* Error alert */}
          {error && (
            <CAlert color="danger" className="mb-4">
              {error}
            </CAlert>
          )}
          
          {/* Results count */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="fw-bold">{filteredStatuses.length}</span> team members
            </div>
            <div className="text-muted small">
              Auto-refresh every 60 seconds
            </div>
          </div>
          
          {/* Team status table */}
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell 
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortField === 'status' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </CTableHeaderCell>
                <CTableHeaderCell 
                  className="cursor-pointer"
                  onClick={() => handleSort('lastActivity')}
                >
                  Last Activity
                  {sortField === 'lastActivity' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </CTableHeaderCell>
                <CTableHeaderCell>Business</CTableHeaderCell>
                <CTableHeaderCell>Branch</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading && filteredStatuses.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4">
                    <CSpinner />
                  </CTableDataCell>
                </CTableRow>
              ) : filteredStatuses.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4">
                    No team members found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredStatuses.map(user => (
                  <CTableRow key={user._id}>
                    <CTableDataCell>
                      <UserWithStatus 
                        username={user.name} 
                        status={user.status} 
                        lastActivity={user.lastActivity}
                        showLastSeen={true}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.role?.replace(/_/g, ' ')}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatLastActivity(user.lastActivity, false)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.business?.name || '-'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.branch?.name || '-'}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default TeamStatusPage;
