// import React, { useState, useEffect } from 'react';
// import {
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CRow,
//   CCol,
//   CForm,
//   CFormInput,
//   CFormSelect,
//   CFormTextarea,
//   CButton,
//   CTable,
//   CTableHead,
//   CTableBody,
//   CTableRow,
//   CTableHeaderCell,
//   CTableDataCell,
//   CBadge,
//   CSpinner,
//   CAlert,
//   CModal,
//   CModalHeader,
//   CModalBody,
//   CModalFooter,
//   CModalTitle,
//   CNav,
//   CNavItem,
//   CNavLink,
//   CTabContent,
//   CTabPane,
//   CInputGroup,
//   CInputGroupText,
// } from '@coreui/react';
// import axiosInstance from '../../config/axiosConfig';

// const TicketDashboard = () => {
//   // States for form
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     priority: 'medium',
//     department: 'technical'
//   });
  
//   // States for tickets list
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showModal, setShowModal] = useState(false);
//   const [selectedTicket, setSelectedTicket] = useState(null);
  
//   // Tab state
//   const [activeTab, setActiveTab] = useState('list');
  
//   // Search and filter states
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   // Fetch tickets on component mount
//   useEffect(() => {
//     fetchTickets();
//   }, []);

//   const fetchTickets = async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get('/api/tickets');
//       setTickets(response.data);
//     } catch (error) {
//       setError('Failed to fetch tickets');
//       console.error('Error fetching tickets:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       await axiosInstance.post('/api/tickets', formData);
//       // Clear form
//       setFormData({
//         title: '',
//         description: '',
//         priority: 'medium',
//         department: 'technical'
//       });
//       // Refresh tickets list and switch to list view
//       await fetchTickets();
//       setActiveTab('list');
//     } catch (error) {
//       setError('Failed to create ticket');
//       console.error('Error creating ticket:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewTicket = (ticket) => {
//     setSelectedTicket(ticket);
//     setShowModal(true);
//   };

//   const getPriorityBadge = (priority) => {
//     const colors = {
//       low: 'info',
//       medium: 'warning',
//       high: 'danger'
//     };
//     return (
//       <CBadge color={colors[priority] || 'secondary'}>
//         {priority.toUpperCase()}
//       </CBadge>
//     );
//   };

//   const getFilteredTickets = () => {
//     let filtered = [...tickets];
    
//     if (filterStatus !== 'all') {
//       filtered = filtered.filter(ticket => ticket.status === filterStatus);
//     }
    
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(ticket => 
//         ticket.title.toLowerCase().includes(query) ||
//         ticket.description.toLowerCase().includes(query) ||
//         ticket.id.toString().includes(query)
//       );
//     }
    
//     return filtered;
//   };

//   return (
//     <CCard className="mb-4">
//       <CCardHeader>
//         <CNav variant="tabs" role="tablist">
//           <CNavItem>
//             <CNavLink
//               active={activeTab === 'list'}
//               onClick={() => setActiveTab('list')}
//               role="tab"
//             >
//               View Tickets
//             </CNavLink>
//           </CNavItem>
//           <CNavItem>
//             <CNavLink
//               active={activeTab === 'create'}
//               onClick={() => setActiveTab('create')}
//               role="tab"
//             >
//               Create Ticket
//             </CNavLink>
//           </CNavItem>
//         </CNav>
//       </CCardHeader>
//       <CCardBody>
//         <CTabContent>
//           {/* Create Ticket Tab */}
//           <CTabPane role="tabpanel" visible={activeTab === 'create'}>
//             <CRow>
//               <CCol md={8} className="mx-auto">
//                 {error && (
//                   <CAlert color="danger" dismissible>
//                     {error}
//                   </CAlert>
//                 )}
//                 <CForm onSubmit={handleSubmit}>
//                   <div className="mb-3">
//                     <CFormInput
//                       type="text"
//                       id="title"
//                       name="title"
//                       label="Title"
//                       value={formData.title}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
                  
//                   <div className="mb-3">
//                     <CFormTextarea
//                       id="description"
//                       name="description"
//                       label="Description"
//                       rows={4}
//                       value={formData.description}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
                  
//                   <div className="mb-3">
//                     <CFormSelect
//                       id="priority"
//                       name="priority"
//                       label="Priority"
//                       value={formData.priority}
//                       onChange={handleInputChange}
//                       options={[
//                         { label: 'Low', value: 'low' },
//                         { label: 'Medium', value: 'medium' },
//                         { label: 'High', value: 'high' }
//                       ]}
//                     />
//                   </div>
                  
//                   <div className="mb-3">
//                     <CFormSelect
//                       id="department"
//                       name="department"
//                       label="Department"
//                       value={formData.department}
//                       onChange={handleInputChange}
//                       options={[
//                         { label: 'Technical Support', value: 'technical' },
//                         { label: 'Billing Support', value: 'billing' },
//                         { label: 'General Inquiry', value: 'general' }
//                       ]}
//                     />
//                   </div>
                  
//                   <div className="text-center">
//                     <CButton type="submit" color="primary" disabled={loading}>
//                       {loading ? (
//                         <>
//                           <CSpinner size="sm" className="me-2" />
//                           Creating...
//                         </>
//                       ) : (
//                         'Create Ticket'
//                       )}
//                     </CButton>
//                   </div>
//                 </CForm>
//               </CCol>
//             </CRow>
//           </CTabPane>

//           {/* View Tickets Tab */}
//           <CTabPane role="tabpanel" visible={activeTab === 'list'}>
//             <CRow className="mb-4">
//               <CCol md={6}>
//                 <CInputGroup>
//                   <CInputGroupText>Search</CInputGroupText>
//                   <CFormInput
//                     placeholder="Search tickets..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </CInputGroup>
//               </CCol>
//               <CCol md={6} className="d-flex justify-content-end gap-2">
//                 <CButton
//                   color={filterStatus === 'all' ? 'primary' : 'secondary'}
//                   onClick={() => setFilterStatus('all')}
//                 >
//                   All
//                 </CButton>
//                 <CButton
//                   color={filterStatus === 'open' ? 'primary' : 'secondary'}
//                   onClick={() => setFilterStatus('open')}
//                 >
//                   Open
//                 </CButton>
//                 <CButton
//                   color={filterStatus === 'closed' ? 'primary' : 'secondary'}
//                   onClick={() => setFilterStatus('closed')}
//                 >
//                   Closed
//                 </CButton>
//               </CCol>
//             </CRow>

//             {loading && !tickets.length ? (
//               <div className="text-center p-3">
//                 <CSpinner />
//               </div>
//             ) : getFilteredTickets().length === 0 ? (
//               <CAlert color="info">
//                 No tickets found
//               </CAlert>
//             ) : (
//               <CTable hover responsive>
//                 <CTableHead>
//                   <CTableRow>
//                     <CTableHeaderCell>ID</CTableHeaderCell>
//                     <CTableHeaderCell>Title</CTableHeaderCell>
//                     <CTableHeaderCell>Department</CTableHeaderCell>
//                     <CTableHeaderCell>Priority</CTableHeaderCell>
//                     <CTableHeaderCell>Status</CTableHeaderCell>
//                     <CTableHeaderCell>Actions</CTableHeaderCell>
//                   </CTableRow>
//                 </CTableHead>
//                 <CTableBody>
//                   {getFilteredTickets().map((ticket) => (
//                     <CTableRow key={ticket.id}>
//                       <CTableDataCell>#{ticket.id}</CTableDataCell>
//                       <CTableDataCell>{ticket.title}</CTableDataCell>
//                       <CTableDataCell>{ticket.department}</CTableDataCell>
//                       <CTableDataCell>
//                         {getPriorityBadge(ticket.priority)}
//                       </CTableDataCell>
//                       <CTableDataCell>
//                         <CBadge color={ticket.status === 'open' ? 'success' : 'secondary'}>
//                           {ticket.status.toUpperCase()}
//                         </CBadge>
//                       </CTableDataCell>
//                       <CTableDataCell>
//                         <CButton
//                           color="info"
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleViewTicket(ticket)}
//                         >
//                           View
//                         </CButton>
//                       </CTableDataCell>
//                     </CTableRow>
//                   ))}
//                 </CTableBody>
//               </CTable>
//             )}
//           </CTabPane>
//         </CTabContent>
//       </CCardBody>

//       {/* Ticket Details Modal */}
//       <CModal visible={showModal} onClose={() => setShowModal(false)}>
//         <CModalHeader>
//           <CModalTitle>
//             Ticket Details #{selectedTicket?.id}
//           </CModalTitle>
//         </CModalHeader>
//         <CModalBody>
//           {selectedTicket && (
//             <>
//               <h5>{selectedTicket.title}</h5>
//               <p className="text-muted mb-3">
//                 Created on {new Date(selectedTicket.createdAt).toLocaleDateString()}
//               </p>
//               <div className="mb-3">
//                 <strong>Description:</strong>
//                 <p>{selectedTicket.description}</p>
//               </div>
//               <div className="mb-3">
//                 <strong>Priority: </strong>
//                 {getPriorityBadge(selectedTicket.priority)}
//               </div>
//               <div className="mb-3">
//                 <strong>Department: </strong>
//                 {selectedTicket.department}
//               </div>
//               <div className="mb-3">
//                 <strong>Status: </strong>
//                 <CBadge color={selectedTicket.status === 'open' ? 'success' : 'secondary'}>
//                   {selectedTicket.status.toUpperCase()}
//                 </CBadge>
//               </div>
//             </>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => setShowModal(false)}>
//             Close
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     </CCard>
//   );
// };

// export default TicketDashboard;
