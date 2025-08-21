import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import axiosInstance from '../../config/axiosConfig';
import { useAuth } from '../../context/authContext';
import { statusMap, reverseStatusMap, PAGE_SIZE } from './types';
// Scrollbar and other styles
import './scrollbar.css';
// Import the modern chat CSS
import './modern-chat.css';

const NewTicketComponent = () => {
  const { businessId, userId } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("High");
  const [category, setCategory] = useState("Technical");
  const [submitting, setSubmitting] = useState(false);

  // Function to create a new ticket
  const createTicket = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      const ticketData = {
        subject,
        description,
        priority,
        category,
        businessId,
        createdBy: userId
      };

      const response = await axiosInstance.post('/tickets', ticketData);

      if (response.data) {
        // Reset form
        setSubject("");
        setDescription("");
        setPriority("High");
        setCategory("Technical");
        setShowForm(false);

        // Refresh ticket list
        await fetchTickets();
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  // List state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Messages state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState("in_progress");

  // Filter and sort tickets
  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      // Filter by status
      if (filterStatus !== 'all' && ticket.status !== filterStatus) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.category.toLowerCase().includes(searchLower) ||
          ticket.status.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Function to fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/tickets');
      const { tickets: ticketData } = response.data;
      const formattedTickets = ticketData.map((t) => ({
        id: t._id,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        category: t.category,
        status: statusMap[t.status] || "Open",
        createdBy: t.createdBy,
        businessId: t.businessId,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
        assignedTo: t.assignedTo,
        lastMessage: t.lastMessage,
        updatedAt: t.updatedAt
      }));
      setTickets(formattedTickets);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets on component mount
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Function to send a new message
  const sendMessage = async (ticketId, message) => {
    try {
      setSendingMessage(true);
      await axiosInstance.post(`/tickets/${ticketId}/messages`, {
        message,
        statusUpdate: messageStatus
      });

      // Update ticket status in the table
      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? { ...t, status: statusMap[messageStatus] }
            : t
        )
      );

      // Refresh messages after sending
      await fetchTicketMessages(ticketId);
      setNewMessage(""); // Clear the input
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Fetch ticket messages
  const fetchTicketMessages = async (ticketId) => {
    try {
      const response = await axiosInstance.get(`/tickets/${ticketId}/messages`);
      if (response.data?.success) {
        setTicketMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch ticket messages:', err);
    }
  };

  // Update ticket status
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setLoading(true);
      // Prepare payload
      const payload = {
        status: reverseStatusMap[newStatus],
        ...(newStatus === "Resolved" ? { resolvedAt: new Date().toISOString() } : {})
      };

      await axiosInstance.put(`/api/tickets/${ticketId}`, payload);

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? {
              ...t,
              status: newStatus,
              resolvedAt: newStatus === "Resolved"
                ? new Date().toISOString().slice(0, 16).replace("T", " ")
                : t.resolvedAt
            }
            : t
        )
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'danger'
    };
    return (
      <CBadge color={colors[priority?.toLowerCase()] || 'secondary'}>
        {priority?.toUpperCase() || 'N/A'}
      </CBadge>
    );
  };

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const paginatedTickets = tickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="max-w-full overflow-x-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Ticketing System
          </h2>
          <CButton color="primary" onClick={() => setShowForm(true)}>Create Ticket</CButton>
        </div>

        {error && <CAlert color="danger" dismissible>{error}</CAlert>}

        {/* Create Ticket Modal */}
        <CModal visible={showForm} onClose={() => setShowForm(false)}>
          <CModalHeader closeButton>
            <CModalTitle>Create New Ticket</CModalTitle>
          </CModalHeader>
          <CForm onSubmit={createTicket}>
            <CModalBody>
              {formError && <CAlert color="danger">{formError}</CAlert>}

              <div className="mb-3">
                <CFormInput
                  type="text"
                  id="subject"
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <CFormTextarea
                  id="description"
                  label="Description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <CFormSelect
                  id="priority"
                  label="Priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  options={[
                    { label: 'High', value: 'High' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'Low', value: 'Low' },
                  ]}
                />
              </div>

              <div className="mb-3">
                <CFormSelect
                  id="category"
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { label: 'Technical', value: 'Technical' },
                    { label: 'Billing', value: 'Billing' },
                    { label: 'Feature Request', value: 'Feature Request' },
                    { label: 'Other', value: 'Other' },
                  ]}
                />
              </div>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </CButton>
              <CButton color="primary" type="submit" disabled={submitting}>
                {submitting ? <CSpinner size="sm" /> : 'Create Ticket'}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <CInputGroup>
                <CInputGroupText>
                  <i className="fas fa-search text-gray-400"></i>
                </CInputGroupText>
                <CFormInput
                  type="text"
                  id="searchQuery"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </CInputGroup>
            </div>
            <div style={{ width: '180px' }}>
              <CFormSelect
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { label: 'All Tickets', value: 'all' },
                  { label: 'Open', value: 'Open' },
                  { label: 'In Progress', value: 'In Progress' },
                  { label: 'Resolved', value: 'Resolved' },
                  { label: 'Closed', value: 'Closed' },
                ]}
              />
            </div>
            {(searchQuery || filterStatus !== 'all') && (
              <CButton 
                color="secondary" 
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                Clear
              </CButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <CTable hover responsive striped>
            <CTableHead>
              <CTableRow className="bg-light">
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">#</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Subject</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Priority</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Category</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Created</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Resolved</CTableHeaderCell>
                <CTableHeaderCell className="px-4 py-3 text-xs font-semibold text-gray-600">Messages</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <td colSpan={7} className="text-center py-8">
                    <CSpinner className="mx-auto" />
                  </td>
                </CTableRow>
              ) : getFilteredTickets().length === 0 ? (
                <CTableRow>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No tickets logged.
                  </td>
                </CTableRow>
              ) : (
                paginatedTickets.map((ticket, idx) => (
                  <CTableRow key={ticket.id} className="hover:bg-gray-50">
                    <CTableDataCell className="px-4 py-3">{(currentPage - 1) * PAGE_SIZE + idx + 1}</CTableDataCell>
                    <CTableDataCell className="px-4 py-3 font-medium">{ticket.subject}</CTableDataCell>
                    <CTableDataCell className="px-4 py-3">{getPriorityBadge(ticket.priority)}</CTableDataCell>
                    <CTableDataCell className="px-4 py-3">{ticket.category || 'N/A'}</CTableDataCell>
                    <CTableDataCell className="px-4 py-3 text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </CTableDataCell>
                    <CTableDataCell className="px-4 py-3 text-xs text-gray-500">
                      {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "-"}
                    </CTableDataCell>
                    <CTableDataCell className="px-4 py-3 text-center">
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        className="min-w-[100px]"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          fetchTicketMessages(ticket.id);
                        }}
                      >
                        View Messages
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2">
          <CButton
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Prev
          </CButton>
          <span className="py-2 px-3">{`Page ${currentPage} of ${totalPages}`}</span>
          <CButton
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </CButton>
        </div>

        {/* Messages Modal */}
        {selectedTicket && (
          <CModal
            visible={true}
            onClose={() => {
              setSelectedTicket(null);
              setTicketMessages([]);
            }}
            size="md" // Changed from 'lg' to 'md'
            className="modern-chat-modal"
          >
            <CModalHeader className="chat-header">
              <CModalTitle className="chat-modal-title">
                <div className="ticket-subject">{selectedTicket?.subject}</div>
                <div className="ticket-id">Ticket #{selectedTicket?.ticketNo || selectedTicket?.id?.slice(-6)}</div>
              </CModalTitle>
            </CModalHeader>
            <CModalBody className="p-0">
              <div className="chat-body">
                {ticketMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <div className="text-4xl text-gray-300 mb-3">💬</div>
                      <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="messages-container">
                    {ticketMessages.map((msg) => {
                      const isCurrentUser = msg.sender._id === "684fe39ca8254e8906e99aab";
                      return (
                        <div key={msg._id} className={`chat-message ${isCurrentUser ? 'sent' : 'received'}`}>
                          <div className={`flex items-start ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`chat-avatar ${isCurrentUser ? 'sent' : 'received'}`}>
                              {msg.sender.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-message-content">
                              <span className="chat-sender-name">{msg.sender.name}</span>
                              <div className={`chat-message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
                                <p>{msg.message}</p>
                                {msg.statusUpdate && (
                                  <div className="status-update">
                                    {msg.statusUpdate === 'resolved' ? (
                                      <span>✓ Resolved</span>
                                    ) : (
                                      <span>↻ In Progress</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="chat-time">
                                {new Date(msg.createdAt).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CModalBody>
            <CModalFooter className="chat-footer p-2">
              <CInputGroup>
                <CFormTextarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="chat-input"
                />
                <CButton
                  color="primary"
                  className="chat-send-button"
                  onClick={() => selectedTicket && sendMessage(selectedTicket, newMessage)}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <CSpinner size="sm" component="span" aria-hidden="true" className="text-white" />
                  ) : (
                    'Send'
                  )}
                </CButton>
              </CInputGroup>
            </CModalFooter>
          </CModal>
        )}
      </div>
    </>
  );
}

export default NewTicketComponent;