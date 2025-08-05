import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormSelect,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CInputGroup,
  CInputGroupText,
  CFormInput
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilCalendar, cilUser } from '@coreui/icons';
import { useUserActivity } from '../../context/UserActivityContext';
import { UserStatusBadge } from '../../components/UserActivityStatus';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { isAutheticated } from '../../auth.js';

const ActivityHistoryPage = () => {
  const { activityHistory, fetchActivityHistory, loading, error } = useUserActivity();
  const [startDate, setStartDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState(new Date(new Date().setHours(23, 59, 59, 999)));
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  const token = isAutheticated();

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/v1/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
    
    // Initial activity history fetch
    fetchActivityHistory(startDate, endDate, 1, itemsPerPage, selectedUser);
  }, [fetchActivityHistory]);

  // Update total pages when history changes
  useEffect(() => {
    if (activityHistory && activityHistory.pagination) {
      setTotalPages(Math.ceil(activityHistory.pagination.totalItems / itemsPerPage));
    }
  }, [activityHistory]);

  // Handle date range changes
  const handleDateChange = () => {
    setCurrentPage(1);
    fetchActivityHistory(startDate, endDate, 1, itemsPerPage, selectedUser, searchTerm);
  };

  // Handle user selection change
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    setCurrentPage(1);
    fetchActivityHistory(startDate, endDate, 1, itemsPerPage, userId, searchTerm);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchActivityHistory(startDate, endDate, 1, itemsPerPage, selectedUser, searchTerm);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchActivityHistory(startDate, endDate, page, itemsPerPage, selectedUser, searchTerm);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="activity-history-page">
      <CCard className="mb-4">
        <CCardHeader>
          <h5>Activity History</h5>
          <p className="text-medium-emphasis small">
            View status change history for all team members
          </p>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CForm className="mb-4">
            <CRow>
              <CCol md={3}>
                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <div className="date-picker-container">
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilCalendar} />
                      </CInputGroupText>
                      <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={endDate}
                        dateFormat="MMMM d, yyyy"
                        className="form-control"
                      />
                    </CInputGroup>
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <div className="date-picker-container">
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilCalendar} />
                      </CInputGroupText>
                      <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="MMMM d, yyyy"
                        className="form-control"
                      />
                    </CInputGroup>
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <CFormSelect 
                  label="User"
                  value={selectedUser}
                  onChange={handleUserChange}
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <div className="mb-3">
                  <label className="form-label">Search</label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by user or status"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol className="d-flex justify-content-end">
                <CButton 
                  color="primary" 
                  className="px-4"
                  onClick={handleDateChange}
                  disabled={loading}
                >
                  {loading ? <CSpinner size="sm" /> : 'Apply Filters'}
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
          {activityHistory && activityHistory.pagination && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="fw-bold">{activityHistory.pagination.totalItems}</span> status changes
              </div>
              <div className="text-muted small">
                Showing page {currentPage} of {totalPages}
              </div>
            </div>
          )}
          
          {/* Activity history table */}
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>User</CTableHeaderCell>
                <CTableHeaderCell>Previous Status</CTableHeaderCell>
                <CTableHeaderCell>New Status</CTableHeaderCell>
                <CTableHeaderCell>Duration</CTableHeaderCell>
                <CTableHeaderCell>Changed At</CTableHeaderCell>
                <CTableHeaderCell>Note</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4">
                    <CSpinner />
                  </CTableDataCell>
                </CTableRow>
              ) : activityHistory?.data?.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4">
                    No activity history found for the selected filters
                  </CTableDataCell>
                </CTableRow>
              ) : (
                activityHistory?.data?.map(activity => (
                  <CTableRow key={activity._id}>
                    <CTableDataCell>
                      <div className="d-flex align-items-center">
                        <CIcon icon={cilUser} className="me-2" />
                        {activity.user?.name || 'Unknown User'}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      {activity.previousStatus ? (
                        <UserStatusBadge status={activity.previousStatus} />
                      ) : (
                        'None'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <UserStatusBadge status={activity.newStatus} />
                    </CTableDataCell>
                    <CTableDataCell>
                      {activity.duration ? (
                        formatDuration(activity.duration)
                      ) : (
                        '-'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatDate(activity.createdAt)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {activity.note || '-'}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <CPagination align="end" className="mt-3">
              <CPaginationItem 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
              >
                First
              </CPaginationItem>
              <CPaginationItem 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </CPaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <CPaginationItem 
                    key={i} 
                    active={pageNum === currentPage}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </CPaginationItem>
                );
              })}
              
              <CPaginationItem 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </CPaginationItem>
              <CPaginationItem 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                Last
              </CPaginationItem>
            </CPagination>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

// Helper function to format duration
const formatDuration = (durationInSeconds) => {
  if (!durationInSeconds) return '-';
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default ActivityHistoryPage;
