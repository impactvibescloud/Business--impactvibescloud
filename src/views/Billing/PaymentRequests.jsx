import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Radio,
  CircularProgress,
  Typography,
  Alert,
  Select,
  MenuItem,
  Checkbox
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import NotificationsIcon from '@mui/icons-material/Notifications'
import InboxIcon from '@mui/icons-material/Inbox'
import DownloadIcon from '@mui/icons-material/Download'
import jsPDF from 'jspdf'
import { apiCall, ENDPOINTS } from '../../config/api'
import './payment-requests.css'

function PaymentRequests() {
  const [user, setUser] = useState({})
  const [businessId, setBusinessId] = useState(null)
  const [paymentRequests, setPaymentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)

  const token = localStorage.getItem('authToken')

  useEffect(() => {
    if (!token) {
      setError('Authentication token not found. Please login again.')
      return
    }

    apiCall(ENDPOINTS.USER_DETAILS)
      .then((res) => {
        setUser(res.user)
        setBusinessId(res.user.businessId)
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err)
        setError('Could not fetch business details. Please try logging in again.')
      })
  }, [token])
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }))
  
  // Payment processing states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [invoiceData, setInvoiceData] = useState(null)
  const [loadingInvoiceData, setLoadingInvoiceData] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [upiId, setUpiId] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Invoice details modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetails, setInvoiceDetails] = useState(null)
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false)
  
  // Dispute states
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [creatingDispute, setCreatingDispute] = useState(false)
  const [disputeError, setDisputeError] = useState(null)

  useEffect(() => {
    if (user?.businessId) {
      fetchPaymentRequests()
    }
  }, [user?.businessId])

  // Function to handle dispute creation
  const handleCreateDispute = async () => {
    if (!selectedInvoice || !disputeReason.trim()) {
      setDisputeError('Please provide a reason for the dispute')
      return
    }

    try {
      setCreatingDispute(true)
      setDisputeError(null)

      const response = await apiCall(ENDPOINTS.DISPUTES, 'POST', {
        invoiceId: selectedInvoice._id,
        businessId: user.businessId,
        reason: disputeReason
      })

      if (response.success) {
        // Close the dispute modal
        setShowDisputeModal(false)
        // Reset the form
        setDisputeReason('')
        // Refresh the payment requests to show updated status
        fetchPaymentRequests()
        // Show success message (you can implement a toast notification here)
        alert('Dispute created successfully')
      }
    } catch (error) {
      console.error('Error creating dispute:', error)
      setDisputeError(error.response?.data?.message || 'Failed to create dispute. Please try again.')
    } finally {
      setCreatingDispute(false)
    }
  }

  const fetchPaymentRequests = async () => {
    try {
      // Get the current user's businessId
      const currentBusinessId = user?.businessId
      if (!currentBusinessId) {
        setError('Business ID not found. Please check your authentication.')
        setLoading(false)
        return
      }

      setLoading(true)
      // Use the current user's businessId for the API call
      const data = await apiCall(ENDPOINTS.BILLING_BUSINESS(currentBusinessId))
      console.log('Payment requests data:', data)
      
      // Prioritize data.data as per the API structure shown
      let paymentRequestsData = []
      
      if (data && data.success && Array.isArray(data.data)) {
        // This is the expected format from the API
        paymentRequestsData = data.data
      } else if (Array.isArray(data)) {
        paymentRequestsData = data
      } else if (typeof data === 'object') {
        // Fallback to checking other common patterns
        if (Array.isArray(data.requests)) {
          paymentRequestsData = data.requests
        } else if (Array.isArray(data.paymentRequests)) {
          paymentRequestsData = data.paymentRequests
        } else if (Array.isArray(data.results)) {
          paymentRequestsData = data.results
        }
      }
      
      // Process data to ensure template is properly parsed
      const processedData = paymentRequestsData.map(request => {
        if (request.template) {
          // Extract plan name if not already available
          if (!request.planName && request.template.includes('plan')) {
            const planMatch = request.template.match(/plan\s+([^,]+)/i);
            if (planMatch && planMatch[1]) {
              request.planName = planMatch[1].trim();
            }
          }
        }
        return request;
      });
      
      // Set the processed payment requests directly
      setPaymentRequests(processedData.map(request => ({
        ...request,
        planName: request.planId?.planName || request.planName || 'Subscription Plan'
      })))
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching payment requests:', err)
      setError(err.message || 'Failed to fetch payment requests')
      setLoading(false)
    }
  }

  // Function to open dispute modal
  const handleOpenDisputeModal = (invoice) => {
    setSelectedInvoice(invoice)
    setShowDisputeModal(true)
    setDisputeError(null)
    setDisputeReason('')
  }

  const fetchPlanDetails = async (invoiceId) => {
    if (!invoiceId) return
    
    setLoadingInvoiceData(true)
    try {
      const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
      console.log('Invoice details full response:', data)
      
      // Extract all fields from the invoice API response
      const responseData = data.data || data
      
      setInvoiceData({
        invoiceNumber: responseData._id,
        invoiceDate: responseData.createdAt,
        startDate: responseData.startDate,
        endDate: responseData.endDate,
        status: responseData.status,
        orderId: responseData.orderId,
        businessId: responseData.businessId,
        paymentMode: responseData.paymentMode,
        paymentType: responseData.paymentType,
        upgradeType: responseData.upgradeType,
        billingDetails: {
          channelsAdded: responseData.channelsAdded || 1,
          usersOrChannelsCount: responseData.usersOrChannelsCount || 1,
          totalDaysInMonth: responseData.totalDaysInMonth || 31,
          billingDaysCount: responseData.billingDaysCount || 31,
          dailyRate: responseData.dailyRate || 0
        },
        pricing: {
          planBasePrice: responseData.planBasePrice || 0,
          discountPercentage: responseData.discountPercentage || 0,
          priceAfterDiscount: responseData.priceAfterDiscount || 0,
          subtotalBeforeTax: responseData.subtotalBeforeTax || 0,
          taxAmount: responseData.taxAmount || 0,
          finalTotalAmount: responseData.finalTotalAmount || 0,
          amountPaid: responseData.amountPaid || 0,
          outstandingBalance: responseData.outstandingBalance || 0
        },
        plan: {
          ...responseData.planId,
          planName: responseData.planId?.planName || 'Subscription Plan',
          planId: responseData.planId?.planId || '',
          rental: responseData.planId?.rental || 0,
          discountPercent: responseData.planId?.discountPercent || 0,
          displayDiscount: responseData.planId?.displayDiscount || 0,
          totalAfterDiscount: responseData.planId?.totalAfterDiscount || 0,
          duration: responseData.planId?.duration || 30,
          gracePeriod: responseData.planId?.gracePeriod || 0
        }
      })
    } catch (err) {
      console.error('Error fetching plan details:', err)
      setInvoiceData({
        invoiceNumber: '',
        invoiceDate: new Date(),
        status: 'pending',
        paymentStatus: 'unpaid',
        amount: 0,
        tax: 0,
        subTotal: 0,
        total: 0,
        balance: 0,
        description: '',
        customer: {
          name: '',
          email: '',
          phone: '',
          address: ''
        },
        items: [{
          name: 'Subscription Plan',
          quantity: 1,
          price: 0,
          total: 0
        }]
      })
    } finally {
      setLoadingInvoiceData(false)
    }
  }

  const handleAccept = async (request) => {
    if (!request || !request._id) return
    
    setSelectedRequest(request)
    await fetchPlanDetails(request.invoiceId || request._id)
    setShowPaymentModal(true)
  }

  const handleCardClick = async (request) => {
    if (!request || !request._id) return;
    
    try {
      setLoadingInvoiceDetails(true);
      setSelectedInvoice(request);
      
      const invoiceId = request.invoiceId || request._id;
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Add debug logging
      const apiUrl = `${getBaseURL()}/invoices/${invoiceId}`;
      console.log('Fetching invoice details:', {
        invoiceId,
        endpoint: apiUrl
      });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...getHeaders(),
          'Cache-Control': 'no-cache,no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice details. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Invoice details response:', data);
      
      if (data.success && data.data) {
        const invoiceInfo = data.data;
        const transformedInvoiceDetails = {
          // Basic Invoice Information
          invoiceNumber: invoiceInfo._id,
          id: invoiceInfo._id,
          invoiceDate: invoiceInfo.createdAt,
          date: invoiceInfo.createdAt,
          startDate: invoiceInfo.startDate,
          endDate: invoiceInfo.endDate,
          status: invoiceInfo.status,
          businessId: invoiceInfo.businessId,
          orderId: invoiceInfo.orderId,
          
          // Payment Related Information
          paymentMode: invoiceInfo.paymentMode,
          paymentType: invoiceInfo.paymentType,
          upgradeType: invoiceInfo.upgradeType,
          paymentStatus: invoiceInfo.paymentStatus || 'pending',
          
          // Plan Information
          planName: invoiceInfo.planId?.planName || 'Subscription Plan',
          planDetails: {
            planId: invoiceInfo.planId?._id,
            planName: invoiceInfo.planId?.planName,
            duration: invoiceInfo.planId?.duration || 30,
            gracePeriod: invoiceInfo.planId?.gracePeriod || 0,
            features: invoiceInfo.planId?.features || [],
            type: invoiceInfo.planId?.type
          },
          
          // Financial Details
          financialDetails: {
            basePrice: invoiceInfo.planBasePrice || 0,
            discountPercentage: invoiceInfo.discountPercentage || 0,
            discountAmount: invoiceInfo.discountAmount || 0,
            priceAfterDiscount: invoiceInfo.priceAfterDiscount || 0,
            subtotalBeforeTax: invoiceInfo.subtotalBeforeTax || 0,
            taxPercentage: invoiceInfo.taxPercentage || 18,
            taxAmount: invoiceInfo.taxAmount || 0,
            finalTotalAmount: invoiceInfo.finalTotalAmount || 0,
            amountPaid: invoiceInfo.amountPaid || 0,
            outstandingBalance: invoiceInfo.outstandingBalance || 0
          },
          
          // Summary Amounts
          amount: invoiceInfo.finalTotalAmount || 0,
          subTotal: invoiceInfo.subtotalBeforeTax || 0,
          tax: invoiceInfo.taxAmount || 0,
          totalAmount: invoiceInfo.finalTotalAmount || 0,
          gst: invoiceInfo.taxAmount || 0,
          balance: invoiceInfo.outstandingBalance || 0,
          description: invoiceInfo.disputeNotes || request.template || request.description || ''
        };
        setInvoiceDetails(transformedInvoiceDetails);
      }
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setInvoiceDetails(null);
    } finally {
      setLoadingInvoiceDetails(false);
    }
  }

  const handleDownloadInvoice = () => {
    if (!invoiceDetails && !selectedInvoice) return

    // Create invoice data structure
    const invoice = invoiceDetails || selectedInvoice
    const invoiceData = {
      id: invoice.id || invoice._id || 'N/A',
      date: invoice.date || (invoice.requestedAt ? new Date(invoice.requestedAt).toLocaleDateString() : new Date().toLocaleDateString()),
      planName: invoice.planName || 'N/A',
      status: invoice.status || 'N/A',
      paymentStatus: invoice.paymentStatus || 'pending',
      amount: invoice.amount || invoice.totalAmount || 0,
      gst: invoice.gst || invoice.tax || 0,
      balance: invoice.balance || invoice.remainingAmount || 0,
      description: invoice.details || invoice.template || invoice.description || 'Credit Note Invoice Upgrade Request'
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica', 'normal')
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('INVOICE DETAILS', 105, 30, { align: 'center' })
    
    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 40, 190, 40)
    
    // Invoice details
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    
    let yPosition = 60
    const lineHeight = 15
    
    // Invoice ID
    doc.setFont('helvetica', 'bold')
    doc.text('Invoice ID:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.id, 70, yPosition)
    
    yPosition += lineHeight
    
    // Date
    doc.setFont('helvetica', 'bold')
    doc.text('Date:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.date, 70, yPosition)
    
    yPosition += lineHeight
    
    // Plan Name
    doc.setFont('helvetica', 'bold')
    doc.text('Plan Name:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.planName, 70, yPosition)
    
    yPosition += lineHeight
    
    // Status
    doc.setFont('helvetica', 'bold')
    doc.text('Status:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.status, 70, yPosition)
    
    yPosition += lineHeight
    
    // Payment Status
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Status:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceData.paymentStatus, 70, yPosition)
    
    yPosition += lineHeight
    
    // Amount
    doc.setFont('helvetica', 'bold')
    doc.text('Amount:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`₹${invoiceData.amount}`, 70, yPosition)
    
    yPosition += lineHeight
    
    // GST
    doc.setFont('helvetica', 'bold')
    doc.text('GST:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`₹${invoiceData.gst}`, 70, yPosition)
    
    yPosition += lineHeight
    
    // Balance
    doc.setFont('helvetica', 'bold')
    doc.text('Balance:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`₹${invoiceData.balance}`, 70, yPosition)
    
    yPosition += lineHeight * 2
    
    // Description
    doc.setFont('helvetica', 'bold')
    doc.text('Description:', 20, yPosition)
    yPosition += lineHeight
    
    doc.setFont('helvetica', 'normal')
    const splitDescription = doc.splitTextToSize(invoiceData.description, 170)
    doc.text(splitDescription, 20, yPosition)
    
    yPosition += splitDescription.length * 6 + lineHeight
    
    // Footer line
    doc.setLineWidth(0.5)
    doc.line(20, yPosition, 190, yPosition)
    
    yPosition += lineHeight
    
    // Generated timestamp
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition)
    
    // Download PDF
    doc.save(`Invoice_${invoiceData.id}_${new Date().toISOString().split('T')[0]}.pdf`)
  }
  // Rejection modal states and helpers
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const generateRejectionCode = () => `RJ-${Date.now().toString(36).toUpperCase().slice(-8)}`

  const openRejectModal = (request) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const submitReject = async () => {
    const request = selectedRequest
    if (!request) return

    const id = request.id || request._id
    if (!id) return

    setRejecting(true)
    try {
      const rejectionCode = generateRejectionCode()
      const rejectedAt = new Date().toISOString()

      await apiCall(ENDPOINTS.BILLING_UPDATE(id), 'PUT', {
        status: 'rejected',
        paymentStatus: 'unpaid',
        rejectionReason: rejectionReason || 'Not provided',
        rejectionCode,
        rejectedAt
      })

      // Update the local state to reflect the change
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          (req._id === id || req.id === id)
            ? { ...req, status: 'rejected', paymentStatus: 'unpaid', rejectionReason: rejectionReason || 'Not provided', rejectionCode, rejectedAt }
            : req
        )
      )

      setShowRejectModal(false)
    } catch (err) {
      console.error('Error rejecting payment:', err)
      alert('Failed to reject payment request. Please try again.')
    } finally {
      setRejecting(false)
    }
  }
  
  const processPayment = async () => {
    if (!selectedRequest || !selectedRequest._id) {
      alert('No payment request selected')
      return
    }
    
    if (paymentMethod === 'UPI' && !upiId) {
      alert('Please enter a valid UPI ID')
      return
    }
    
    setProcessingPayment(true)
    try {
      // Update the payment request status using the provided API
      const data = await apiCall(ENDPOINTS.BILLING_UPDATE(selectedRequest._id), 'PUT', {
        status: "approved",
        paymentStatus: "paid",
        template: selectedRequest.template || `An order request generated for plan ${invoiceData?.items?.[0]?.name || 'Subscription Plan'}, Business ID: ${selectedRequest.businessId || '123'}, Plan ID: ${selectedRequest.planId || '456'}, Status: approved, Payment Status: paid`
      })
      
      console.log('Payment processed:', data)
      
      // Update the local state to reflect the change
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id 
            ? { ...req, status: 'approved', paymentStatus: 'paid' } 
            : req
        )
      )
      
      setPaymentSuccess(true)
      
      // Close modal after showing success for a moment
      setTimeout(() => {
        setShowPaymentModal(false)
        setPaymentSuccess(false)
        setSelectedRequest(null)
        setPaymentMethod('UPI')
        setUpiId('')
        setPlanDetails(null)
        setProcessingPayment(false)
      }, 2000)
      
    } catch (err) {
      console.error('Error processing payment:', err)
      setProcessingPayment(false)
      alert('Failed to process payment. Please try again.')
    }
  }

  const handleCreateRequest = () => {
    setShowNewRequestModal(true)
  }

  const handleSubmitRequest = () => {
    // Implementation for submitting a new payment request
    setShowNewRequestModal(false)
  }

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
  }

  const handleUpiIdChange = (e) => {
    setUpiId(e.target.value)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'approved': { color: 'success', label: 'Approved' },
      'rejected': { color: 'error', label: 'Rejected' },
      'pending': { color: 'warning', label: 'Pending' }
    }
    const config = statusMap[status?.toLowerCase()] || { color: 'default', label: status }
    return <Chip label={config.label} color={config.color} variant="outlined" size="small" />
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Payment Requests</Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage and process payment requests</Typography>
      </Box>

      {/* Pending Payment Requests Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Pending Payment Requests</Typography>
          <Button 
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setError(null)
              fetchPaymentRequests()
            }}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading payment requests...</Typography>
            </Box>
          </Box>
        ) : error ? (
          <Card sx={{ mb: 2, border: '1px solid #fee2e2', bgcolor: '#fef2f2' }}>
            <CardContent>
              <Typography sx={{ color: '#991b1b', fontWeight: 'bold', mb: 1 }}>Error Loading Payment Requests</Typography>
              <Typography sx={{ color: '#7c2d12', mb: 2 }}>{error}</Typography>
              <Button 
                variant="contained"
                size="small"
                onClick={() => {
                  setError(null)
                  fetchPaymentRequests()
                }}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {paymentRequests.length > 0 ? (
              paymentRequests.map((request) => (
                <Card 
                  key={request.id || request._id}
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #6366f1',
                    '&:hover': { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
                  }}
                  onClick={() => handleCardClick(request)}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                            <NotificationsIcon sx={{ fontSize: '24px', color: '#6366f1' }} />
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {request.planName || 'New Payment Request'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {request.requestedAt ? new Date(request.requestedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true
                                }) : currentDate}
                              </Typography>
                            </Box>
                          </Box>
                          {getStatusBadge(request.status)}
                        </Box>
                        <Typography variant="body2" sx={{ my: 1.5, color: '#374151' }}>
                          {request.template || request.details || request.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>Payment Status:</Typography>
                            <Chip 
                              label={request.paymentStatus || 'Pending'} 
                              size="small"
                              color={request.paymentStatus === 'paid' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                          {(request.status === 'Pending' || request.status === 'pending') && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                variant="outlined"
                                color="success"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAccept(request)
                                }}
                              >
                                Accept
                              </Button>
                              <Button 
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openRejectModal(request)
                                }}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                          {request.status !== 'disputed' && (
                            <Button 
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenDisputeModal(request)
                              }}
                            >
                              Dispute
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card sx={{ textAlign: 'center', py: 5, border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <InboxIcon sx={{ fontSize: '48px', color: '#9ca3af', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No Payment Requests</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>Your payment requests inbox is empty.</Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Box>

      {/* New Payment Request Modal */}
      <Dialog 
        open={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
      >
        <DialogTitle>Create New Payment Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>Payment request creation form will be implemented here.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewRequestModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest}>Create Request</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Payment Modal */}
      <Dialog
        open={showRejectModal}
        onClose={() => !rejecting && setShowRejectModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Payment Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, mt: 1 }}>
            You are rejecting payment request <strong>{selectedRequest?._id || selectedRequest?.id}</strong>
            {selectedRequest?.planName ? ` for ${selectedRequest.planName}` : ''}.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            placeholder="Enter reason for rejection (required)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={rejecting}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectModal(false)} disabled={rejecting}>Cancel</Button>
          <Button 
            variant="contained"
            color="error"
            onClick={submitReject}
            disabled={rejecting || !rejectionReason.trim()}
          >
            {rejecting ? 'Rejecting...' : 'Reject Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog 
        open={showPaymentModal}
        onClose={() => !processingPayment && !paymentSuccess && setShowPaymentModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {paymentSuccess ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: '48px', color: '#10b981', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Payment Successful!</Typography>
              <Typography>Your payment has been processed successfully.</Typography>
            </Box>
          ) : loadingInvoiceData ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading invoice details...</Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Invoice Header */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Invoice #{invoiceData?.invoiceNumber}</Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Generated on: {new Date(invoiceData?.invoiceDate).toLocaleDateString()}</Typography>
                  </Box>
                  <Chip label={invoiceData?.status} color={invoiceData?.status === 'paid' ? 'success' : 'warning'} />
                </Box>
              </Box>

              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" variant="caption">Total Amount</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>₹{invoiceData?.pricing?.finalTotalAmount.toLocaleString('en-IN')}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" variant="caption">Outstanding Balance</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#dc2626', mt: 1 }}>₹{invoiceData?.pricing?.outstandingBalance.toLocaleString('en-IN')}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Payment Method Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Select Payment Method</Typography>
                <FormControl fullWidth>
                  <RadioGroup value={paymentMethod} onChange={(e) => handlePaymentMethodChange(e.target.value)}>
                    <FormControlLabel value="UPI" control={<Radio />} label="UPI" />
                    <FormControlLabel value="Credit/Debit Card" control={<Radio />} label="Credit/Debit Card" />
                    <FormControlLabel value="Net Banking" control={<Radio />} label="Net Banking" />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Payment Method Specific Fields */}
              {paymentMethod === 'UPI' && (
                <TextField fullWidth label="UPI ID" placeholder="Enter UPI ID (e.g., username@upi)" value={upiId} onChange={handleUpiIdChange} disabled={processingPayment} variant="outlined" sx={{ mb: 2 }} />
              )}

              {paymentMethod === 'Credit/Debit Card' && (
                <Box sx={{ mb: 2 }}>
                  <TextField fullWidth label="Card Number" placeholder="Enter card number" disabled={processingPayment} variant="outlined" sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Expiry Date" placeholder="MM/YY" disabled={processingPayment} variant="outlined" />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="CVV" placeholder="CVV" disabled={processingPayment} variant="outlined" type="password" />
                    </Grid>
                  </Grid>
                  <TextField fullWidth label="Name on Card" placeholder="Enter name on card" disabled={processingPayment} variant="outlined" sx={{ mt: 2 }} />
                </Box>
              )}

              {paymentMethod === 'Net Banking' && (
                <Select fullWidth disabled={processingPayment} variant="outlined" sx={{ mb: 2 }}>
                  <MenuItem value="">Select your bank</MenuItem>
                  <MenuItem value="sbi">State Bank of India</MenuItem>
                  <MenuItem value="hdfc">HDFC Bank</MenuItem>
                  <MenuItem value="icici">ICICI Bank</MenuItem>
                  <MenuItem value="axis">Axis Bank</MenuItem>
                  <MenuItem value="kotak">Kotak Mahindra Bank</MenuItem>
                </Select>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pt: 2 }}>
          <Button onClick={() => setShowPaymentModal(false)} disabled={processingPayment || paymentSuccess}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={processPayment}
            disabled={processingPayment}
          >
            {processingPayment ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Details Modal */}
      <Dialog
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogContent>
          {loadingInvoiceDetails ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading invoice details...</Typography>
            </Box>
          ) : invoiceDetails ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: '4px' }}>
                <Typography variant="subtitle2">Invoice Number: <strong>{invoiceDetails.invoiceNumber}</strong></Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>Date: {new Date(invoiceDetails.invoiceDate).toLocaleDateString()}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Plan Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt:  0.5 }}>{invoiceDetails.planName}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Total Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>₹{invoiceDetails.amount}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Tax/GST</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>₹{invoiceDetails.gst}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Outstanding Balance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626', mt: 0.5 }}>₹{invoiceDetails.balance}</Typography>
                  </Card>
                </Grid>
              </Grid>

              {invoiceDetails.description && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Description</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{invoiceDetails.description}</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">No invoice details available</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvoiceModal(false)}>Close</Button>
          {invoiceDetails && (
            <>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadInvoice}>Download</Button>
              <Button 
                variant="contained"
                onClick={() => {
                  handleAccept(selectedInvoice)
                }}
              >
                Accept & Pay
              </Button>
              <Button 
                color="error"
                variant="outlined"
                onClick={() => {
                  setShowInvoiceModal(false)
                  handleOpenDisputeModal(selectedInvoice)
                }}
              >
                Dispute Invoice
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog
        open={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dispute Invoice</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#f3f4f6', borderRadius: '4px', mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>Invoice Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedInvoice._id}</Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Dispute"
                placeholder="Please provide detailed reason for the dispute..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                disabled={creatingDispute}
                variant="outlined"
              />
              {disputeError && <Alert severity="error" sx={{ mt: 2 }}>{disputeError}</Alert>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisputeModal(false)} disabled={creatingDispute}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDispute}
            disabled={creatingDispute || !disputeReason.trim()}
          >
            {creatingDispute ? 'Creating Dispute...' : 'Submit Dispute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaymentRequests
