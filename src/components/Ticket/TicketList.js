import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CSpinner,
} from '@coreui/react';
import axiosInstance from '../../config/axiosConfig';
import './Ticket.scss';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    try {
      const { data } = await axiosInstance.get('/tickets');
      // Ensure we're setting an array, even if the API returns null or undefined
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tickets');
      setTickets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'danger',
      critical: 'dark'
    };
    return colors[priority] || 'secondary';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      open: 'success',
      'in-progress': 'warning',
      resolved: 'info',
      closed: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <CCard className="ticket-list">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h3>Support Tickets</h3>
          <CButton color="primary" onClick={() => fetchTickets()}>
            Refresh
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell scope="col">#</CTableHeaderCell>
              <CTableHeaderCell scope="col">Title</CTableHeaderCell>
              <CTableHeaderCell scope="col">Type</CTableHeaderCell>
              <CTableHeaderCell scope="col">Priority</CTableHeaderCell>
              <CTableHeaderCell scope="col">Status</CTableHeaderCell>
              <CTableHeaderCell scope="col">Created</CTableHeaderCell>
              <CTableHeaderCell scope="col">Updated</CTableHeaderCell>
              <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {Array.isArray(tickets) && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <CTableRow key={ticket.id}>
                  <CTableHeaderCell scope="row">{ticket.id}</CTableHeaderCell>
                  <CTableDataCell>{ticket.title}</CTableDataCell>
                  <CTableDataCell>{ticket.type}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getPriorityBadgeColor(ticket.priority)}>
                      {ticket.priority}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getStatusBadgeColor(ticket.status)}>
                      {ticket.status}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{formatDate(ticket.createdAt)}</CTableDataCell>
                  <CTableDataCell>{formatDate(ticket.updatedAt)}</CTableDataCell>
                  <CTableDataCell>
                    <CButton 
                      color="info" 
                      size="sm" 
                      className="me-2"
                      onClick={() => {/* TODO: Implement view details */}}
                    >
                      View
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            ) : (
              <CTableRow>
                <CTableDataCell colSpan="8" className="text-center">
                  No tickets found
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  );
};

export default TicketList;
