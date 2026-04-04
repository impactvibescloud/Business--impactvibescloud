import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Typography,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import { apiCall, ENDPOINTS, getBaseURL, getHeaders } from '../../config/api';
import { useAuth } from '../../context/authContext';
import { statusMap, reverseStatusMap, PAGE_SIZE } from './types';
// Import the modern chat CSS
import './modern-chat.css';

const NewTicketComponent = () => {
  // State for user and business details
  const [businessId, setBusinessId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Fetch user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error("Authentication token not found");
        }

        console.log('Fetching user details...');
        const response = await apiCall(ENDPOINTS.USER_DETAILS);
        console.log('User details response:', response);

        // Normalize user object from different possible API shapes
        const userObj = response?.user ?? response?.data?.user ?? response?.data ?? null;

        if (userObj) {
          setUserDetails(userObj);

          // businessId may be present as user.businessId or user.business._id or user.businessId
          const resolvedBusinessId = userObj.businessId ?? userObj.business?._id ?? userObj.business?.id ?? null;
          if (resolvedBusinessId) {
            console.log('Setting business ID:', resolvedBusinessId);
            setBusinessId(resolvedBusinessId);
          } else {
            console.warn('Business ID not found in user object', userObj);
          }

          const resolvedUserId = userObj._id ?? userObj.id ?? null;
          if (resolvedUserId) {
            console.log('Setting user ID:', resolvedUserId);
            setUserId(resolvedUserId);
          }
        } else {
          console.error('User object not found in response:', response);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setFormError('Failed to load user details. Please refresh the page.');
      }
    };

    fetchUserDetails();
  }, []);
  const [priority, setPriority] = useState("High");
  const [category, setCategory] = useState("Technical");
  const [submitting, setSubmitting] = useState(false);

  // Function to create a new ticket
  const createTicket = async (e) => {
    e.preventDefault();
    console.log('Create ticket function called');
    
    try {
      setSubmitting(true);
      setFormError(null);

      // Check form data
      console.log('Form Data:', {
        subject,
        description,
        priority,
        category
      });

      // Check auth token
      const token = localStorage.getItem('authToken');
      console.log('Auth Token exists:', !!token);

      // Log user details for debugging
      console.log('User Details State:', {
        userDetails,
        businessId,
        userId
      });

      if (!subject || !description) {
        throw new Error("Subject and description are required");
      }

      if (!businessId) {
        console.error('Business ID missing during ticket creation. Current state:', {
          userDetails,
          businessId,
          userId
        });
        throw new Error("Business information not available");
      }

      if (!userId) {
        console.error('User ID missing during ticket creation. Current state:', {
          userDetails,
          businessId,
          userId
        });
        throw new Error("User information not available");
      }

      const ticketData = {
        subject,
        description,
        priority,
        category,
        businessId,
        createdBy: userId
      };

      // Log the request data
      console.log('Creating ticket with data:', ticketData);

      try {
        // Log the full request URL and headers
        console.log('Making API request to:', `${getBaseURL()}/api/tickets`);
        console.log('Request headers:', getHeaders());
        
        const response = await apiCall(ENDPOINTS.TICKETS, 'POST', ticketData);
        // Log the successful response
        console.log('Ticket creation response:', response);

        if (response) {
          // Reset form
          setSubject("");
          setDescription("");
          setPriority("High");
          setCategory("Technical");
          setShowForm(false);

          // Refresh ticket list
          await fetchTickets();
        }
      } catch (apiError) {
        // Log detailed API error
        console.error('API Error:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers
        });
        throw apiError;
      }
    } catch (err) {
      console.error('Error Details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
          data: err.config?.data
        }
      });

      // Set appropriate error message
      if (!userDetails) {
        setFormError("User details not loaded. Please refresh the page.");
      } else if (!userDetails.business?._id) {
        setFormError("Business information not available. Please refresh the page.");
      } else if (err.response?.status === 401) {
        setFormError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 400) {
        setFormError(err.response.data.message || "Invalid ticket data.");
      } else {
        setFormError(err.response?.data?.message || "Failed to create ticket. Please try again.");
      }
    } finally {
      setSubmitting(false);
      console.log('Create ticket operation completed');
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
      if (filterStatus !== 'all' && String(ticket.status || '') !== String(filterStatus || '')) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          String(ticket.subject || '').toLowerCase().includes(searchLower) ||
          String(ticket.description || '').toLowerCase().includes(searchLower) ||
          String(ticket.category || '').toLowerCase().includes(searchLower) ||
          String(ticket.status || '').toLowerCase().includes(searchLower)
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
      const ticketData = await apiCall(ENDPOINTS.TICKETS);
      const formattedTickets = ticketData.tickets.map((t) => {
        // Normalize status: handle variants like "inProgress", "in progress", etc.
        const rawStatus = (t.status || '').toString();
        const normalizedKey = rawStatus
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/-/g, '_');
        const displayStatus = statusMap[normalizedKey] || statusMap[rawStatus] || 'Open';

        return {
          id: t._id,
          subject: t.subject,
          description: t.description,
          priority: t.priority,
          category: t.category,
          status: displayStatus,
          createdBy: t.createdBy,
          businessId: t.businessId,
          createdAt: t.createdAt,
          resolvedAt: t.resolvedAt,
          assignedTo: t.assignedTo,
          lastMessage: t.lastMessage,
          updatedAt: t.updatedAt
        };
      });
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
      await apiCall(ENDPOINTS.TICKET_MESSAGES(ticketId), 'POST', {
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
      const response = await apiCall(ENDPOINTS.TICKET_MESSAGES(ticketId));
      if (response?.success) {
        setTicketMessages(response.messages);
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

      await apiCall(ENDPOINTS.TICKET_UPDATE(ticketId), 'PUT', payload);

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
      high: 'error'
    };
    const colorMap = {
      low: '#2196F3',
      medium: '#FF9800',
      high: '#F44336'
    };
    return (
      <Chip
        label={priority?.toUpperCase() || 'N/A'}
        size="small"
        sx={{
          backgroundColor: colorMap[priority?.toLowerCase()] || '#9C27B0',
          color: 'white',
          fontWeight: 600
        }}
      />
    );
  };

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const paginatedTickets = tickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Box sx={{ p: 1.5, maxWidth: '100%', overflow: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Ticketing System
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: '#6366f1', color: 'white', fontSize: '1rem' }}>
          Create New Ticket
        </DialogTitle>
        <Box component="form" onSubmit={createTicket}>
          <DialogContent sx={{ pt: 2, pb: 1.5 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                {formError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Subject"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              size="small"
              margin="dense"
              sx={{ mb: 1 }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Description"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              margin="dense"
              multiline
              rows={2}
              variant="outlined"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              select
              label="Priority"
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              margin="dense"
              size="small"
              variant="outlined"
              sx={{ mb: 1 }}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>

            <TextField
              fullWidth
              select
              label="Category"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              margin="dense"
              size="small"
              variant="outlined"
            >
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Billing">Billing</MenuItem>
              <MenuItem value="Feature Request">Feature Request</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowForm(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: '#6366f1',
                '&:hover': { backgroundColor: '#4f46e5' }
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
              ) : (
                'Create Ticket'
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 1.5, mb: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: '200px' }}>
            <TextField
              fullWidth
              placeholder="Search tickets..."
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <Box sx={{ minWidth: '140px' }}>
            <TextField
              fullWidth
              select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              variant="outlined"
              size="small"
            >
              <MenuItem value="all">All Tickets</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </TextField>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowForm(true)}
            sx={{
              backgroundColor: '#6366f1',
              color: 'white',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#4f46e5' },
              whiteSpace: 'nowrap'
            }}
          >
            Create Ticket
          </Button>
          {(searchQuery || filterStatus !== 'all') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Tickets Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F3F4F6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  #
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Subject
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Resolved
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.875rem', py: 1 }}>
                  Messages
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : getFilteredTickets().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 2, color: '#9CA3AF', fontSize: '0.875rem' }}>
                    No tickets logged.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTickets.map((ticket, idx) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#F9FAFB'
                      }
                    }}
                  >
                    <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontWeight: 500, fontSize: '0.875rem' }}>
                      {ticket.subject}
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      {getPriorityBadge(ticket.priority)}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>
                      {ticket.category || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.75rem', color: '#6B7280' }}>
                      {new Date(ticket.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.75rem', color: '#6B7280' }}>
                      {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.75 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          fetchTicketMessages(ticket.id);
                        }}
                        sx={{
                          textTransform: 'none',
                          minWidth: '100px',
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          '&:hover': {
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(99, 102, 241, 0.04)'
                          }
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1.5 }}>
        <Button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          variant="outlined"
          size="small"
        >
          Previous
        </Button>
        <Typography variant="caption" sx={{ px: 1.5, fontWeight: 500, fontSize: '0.8rem' }}>
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          variant="outlined"
          size="small"
        >
          Next
        </Button>
      </Box>

      {/* Messages Dialog */}
      <Dialog
        open={Boolean(selectedTicket)}
        onClose={() => {
          setSelectedTicket(null);
          setTicketMessages([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: '#6366f1', color: 'white', pb: 0.75 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {selectedTicket?.subject}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
              Ticket #{selectedTicket?.ticketNo || selectedTicket?.id?.slice(-6)}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: 300, display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
          {ticketMessages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ mb: 0.5 }}>
                  💬
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              {ticketMessages.map((msg) => {
                const currentBusinessId = businessId || userDetails?.businessId || userDetails?.business?._id;
                const currentUserId = userId || userDetails?._id;
                const senderBusinessId = msg.sender?.businessId || msg.sender?.business?._id || null;

                const userEmail = userDetails?.email || '';
                const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
                const senderEmail = msg.sender?.email || '';
                const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1] : '';

                const isFromBusiness =
                  (senderBusinessId && currentBusinessId && String(senderBusinessId) === String(currentBusinessId)) ||
                  (msg.sender && currentUserId && String(msg.sender._id) === String(currentUserId)) ||
                  (userDomain && senderDomain && userDomain === senderDomain);

                return (
                  <Box
                    key={msg._id}
                    sx={{
                      display: 'flex',
                      flexDirection: isFromBusiness ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isFromBusiness ? '#6366f1' : '#E5E7EB',
                        color: isFromBusiness ? 'white' : '#4B5563',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {msg.sender.name ? msg.sender.name.charAt(0).toUpperCase() : '?'}
                    </Box>
                    <Box sx={{ flex: 1, maxWidth: '70%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#4B5563' }}>
                        {msg.sender.name}
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: isFromBusiness ? '#6366f1' : '#FFFFFF',
                          color: isFromBusiness ? 'white' : '#1F2937',
                          borderRadius: isFromBusiness ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                          p: 1,
                          mt: 0.25,
                          wordWrap: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          border: isFromBusiness ? 'none' : '1px solid #E5E7EB'
                        }}
                      >
                        <Typography variant="caption" sx={{ mb: msg.statusUpdate ? 0.5 : 0 }}>
                          {msg.message}
                        </Typography>
                        {msg.statusUpdate && (
                          <Box
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              opacity: 0.8,
                              pt: 0.5,
                              borderTop: isFromBusiness ? '1px solid rgba(255,255,255,0.3)' : '1px solid #E5E7EB'
                            }}
                          >
                            {msg.statusUpdate === 'resolved' ? '✓ Resolved' : '↻ In Progress'}
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: '#9CA3AF', fontSize: '0.75rem' }}
                      >
                        {new Date(msg.createdAt).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 1.5, backgroundColor: 'white', gap: 0.5 }}>
          <TextField
            fullWidth
            multiline
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{ mr: 0.5 }}
          />
          <Button
            variant="contained"
            endIcon={sendingMessage ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={() => selectedTicket && sendMessage(selectedTicket.id || selectedTicket._id, newMessage)}
            disabled={!newMessage.trim() || sendingMessage}
            sx={{
              backgroundColor: '#6366f1',
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NewTicketComponent;