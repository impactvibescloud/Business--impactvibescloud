import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CButton,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
  CFormCheck,
  CFormInput,
  CSpinner
} from '@coreui/react'
import jsPDF from 'jspdf'
import axiosInstance from '../../config/axiosConfig'
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

    axiosInstance
      .get('/v1/user/details')
      .then((res) => {
        setUser(res.data.user)
        setBusinessId(res.data.user.businessId)
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

  useEffect(() => {
    if (user?.businessId) {
      fetchPaymentRequests()
    }
  }, [user?.businessId])

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
      const { data } = await axiosInstance.get(`/billing/business/${currentBusinessId}`)
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

  const fetchPlanDetails = async (invoiceId) => {
    if (!invoiceId) return
    
    setLoadingInvoiceData(true)
    try {
      const { data } = await axiosInstance.get(`/invoices/${invoiceId}`, {
        headers: {
          'Expires': '0',
          'Cache-Control': 'no-cache,no-store',
          'Pragma': 'no-cache'
        }
      })
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

  const handleReject = async (id) => {
    if (!id) return
    
    try {
      await axiosInstance.put(`/billing/${id}`, {
        status: "rejected",
        paymentStatus: "unpaid"
      })
      
      // Update the local state to reflect the change
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === id 
            ? { ...req, status: 'rejected', paymentStatus: 'unpaid' } 
            : req
        )
      )
      
    } catch (err) {
      console.error('Error rejecting payment:', err)
      alert('Failed to reject payment request. Please try again.')
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
      const { data } = await axiosInstance.put(`/billing/${selectedRequest._id}`, {
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

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CBadge color="success">Approved</CBadge>
      case 'rejected':
        return <CBadge color="danger">Rejected</CBadge>
      case 'pending':
        return <CBadge color="warning">Pending</CBadge>
      default:
        return <CBadge color="info">{status}</CBadge>
    }
  }

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
  }

  const handleUpiIdChange = (e) => {
    setUpiId(e.target.value)
  }

  return (
    <div className="payment-requests-container">
      <div className="payment-requests-header d-flex justify-content-between align-items-center mb-4">
        <h2>Payment Requests</h2>
      </div>

      {/* Pending Payment Requests Section */}
      <div className="pending-requests-section mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="section-title mb-0">Pending Payment Requests</h3>
          <CButton 
            color="primary" 
            size="sm"
            onClick={() => {
              setError(null)
              fetchPaymentRequests()
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </CButton>
        </div>
        
        {loading ? (
          <div className="loading-spinner d-flex align-items-center justify-content-center py-5">
            <div className="text-center">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Loading payment requests...</p>
            </div>
          </div>
        ) : error ? (
          <CCard className="mb-4 border-danger">
            <CCardBody>
              <div className="error-message">
                <h5 className="text-danger">Error Loading Payment Requests</h5>
                <p>{error}</p>
                <CButton 
                  color="primary" 
                  size="sm" 
                  onClick={() => {
                    setError(null)
                    fetchPaymentRequests()
                  }}
                >
                  Try Again
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        ) : (
          <div className="payment-notifications">
            {paymentRequests.length > 0 ? (
              paymentRequests.map((request) => (
                <CCard 
                  key={request.id || request._id} 
                  className="notification-card mb-3 border-start border-4 border-primary shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCardClick(request)}
                >
                  <CCardBody>
                    <div className="row align-items-center">
                      <div className="col">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <div className="notification-icon me-3">
                              <i className="bi bi-bell-fill text-primary" style={{ fontSize: '24px' }}></i>
                            </div>
                            <div>
                              <h5 className="mb-0">{request.planName || 'New Payment Request'}</h5>
                              <small className="text-muted">
                                {request.requestedAt ? new Date(request.requestedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true
                                }) : currentDate}
                              </small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        <p className="mb-3">{request.template || request.details || request.description}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted me-3">Payment Status:</span>
                            <span className={`badge bg-${(request.paymentStatus === 'paid' ? 'success' : 'warning')}-subtle text-${request.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                              {request.paymentStatus || 'Pending'}
                            </span>
                          </div>
                          {(request.status === 'Pending' || request.status === 'pending') && (
                            <div className="action-buttons">
                              <CButton 
                                color="success" 
                                size="sm" 
                                variant="outline"
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAccept(request)
                                }}
                              >
                                <i className="bi bi-check-lg me-1"></i>
                                Accept
                              </CButton>
                              <CButton 
                                color="danger" 
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReject(request.id || request._id)
                                }}
                              >
                                <i className="bi bi-x-lg me-1"></i>
                                Reject
                              </CButton>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              ))
            ) : (
              <CCard className="text-center py-5">
                <CCardBody>
                  <div className="empty-state">
                    <div className="empty-icon mb-3">
                      <i className="bi bi-inbox text-muted" style={{ fontSize: '48px' }}></i>
                    </div>
                    <h4>No Payment Requests</h4>
                    <p className="text-muted">Your payment requests inbox is empty.</p>
                  </div>
                </CCardBody>
              </CCard>
            )}
          </div>
        )}
      </div>

      {/* New Payment Request Modal */}
      <CModal 
        visible={showNewRequestModal} 
        onClose={() => setShowNewRequestModal(false)}
        className="payment-request-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Create New Payment Request</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {/* Form fields would go here */}
          <p>Payment request creation form will be implemented here.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowNewRequestModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSubmitRequest}>
            Create Request
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Payment Modal */}
      <CModal 
        visible={showPaymentModal} 
        onClose={() => !processingPayment && !paymentSuccess && setShowPaymentModal(false)}
        className="payment-modal"
        backdrop="static"
        size="lg"
      >
        <CModalHeader closeButton={!processingPayment && !paymentSuccess}>
          <CModalTitle>Complete Payment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {paymentSuccess ? (
            <div className="text-center py-3">
              <div className="payment-success-icon mb-3">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '48px' }}></i>
              </div>
              <h5 className="mb-3">Payment Successful!</h5>
              <p className="mb-0">Your payment has been processed successfully.</p>
            </div>
          ) : loadingInvoiceData ? (
            <div className="text-center py-3">
              <CSpinner color="primary" />
              <p className="mt-3 mb-0">Loading invoice details...</p>
            </div>
          ) : (
            <>
              <div className="invoice-content mb-4">
                {/* Invoice Header */}
                <div className="invoice-header mb-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Invoice #{invoiceData?.invoiceNumber}</h5>
                      <p className="text-muted mb-0">
                        Generated on: {new Date(invoiceData?.invoiceDate).toLocaleDateString()}
                      </p>
                      {invoiceData?.dueDate && (
                        <p className="text-danger mb-0">
                          Due by: {new Date(invoiceData.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-end">
                      <span className={`badge bg-${invoiceData?.status === 'paid' ? 'success' : 'warning'}`}>
                        {invoiceData?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="customer-info mb-4">
                  <h6 className="text-primary mb-3">Customer Details</h6>
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="mb-2">{invoiceData?.customer?.name}</h6>
                      <p className="mb-1">{invoiceData?.customer?.email}</p>
                      <p className="mb-1">{invoiceData?.customer?.phone}</p>
                      <p className="mb-0">{invoiceData?.customer?.address}</p>
                    </div>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="billing-details mb-4">
                  <h6 className="text-primary mb-3">Billing Period & Usage</h6>
                  <div className="card">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Start Date:</span>
                            <span>{new Date(invoiceData?.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">End Date:</span>
                            <span>{new Date(invoiceData?.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Billing Days:</span>
                            <span>{invoiceData?.billingDetails?.billingDaysCount} / {invoiceData?.billingDetails?.totalDaysInMonth} days</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Daily Rate:</span>
                            <span>₹{invoiceData?.billingDetails?.dailyRate.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Channels Added:</span>
                            <span>{invoiceData?.billingDetails?.channelsAdded}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Total Users/Channels:</span>
                            <span>{invoiceData?.billingDetails?.usersOrChannelsCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="plan-details mb-4">
                  <h6 className="text-primary mb-3">Plan Information</h6>
                  <div className="card">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Plan Name:</span>
                            <span className="fw-bold">{invoiceData?.plan?.planName}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Plan ID:</span>
                            <span>{invoiceData?.plan?.planId}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Base Price:</span>
                            <span>₹{invoiceData?.pricing?.planBasePrice.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Discount:</span>
                            <span className="text-success">{invoiceData?.pricing?.discountPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="cost-breakdown mb-4">
                  <h6 className="text-primary mb-3">Cost Breakdown</h6>
                  <div className="card">
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Base Price:</span>
                          <span>₹{invoiceData?.pricing?.planBasePrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Price After Discount:</span>
                          <span>₹{invoiceData?.pricing?.priceAfterDiscount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Subtotal Before Tax:</span>
                          <span>₹{invoiceData?.pricing?.subtotalBeforeTax.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Tax Amount:</span>
                          <span>₹{invoiceData?.pricing?.taxAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Final Total Amount:</span>
                        <span>₹{invoiceData?.pricing?.finalTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <span className="text-muted">Amount Paid:</span>
                        <span className="text-success">₹{invoiceData?.pricing?.amountPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <span className="text-muted">Outstanding Balance:</span>
                        <span className="text-danger">₹{invoiceData?.pricing?.outstandingBalance.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="payment-info mb-4">
                  <h6 className="text-primary mb-3">Payment Information</h6>
                  <div className="card">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Payment Mode:</span>
                            <span>{invoiceData?.paymentMode}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Payment Type:</span>
                            <span>{invoiceData?.paymentType}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Upgrade Type:</span>
                            <span>{invoiceData?.upgradeType}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Order ID:</span>
                            <span>{invoiceData?.orderId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="payment-method-section">
                <h6 className="mb-3">Select Payment Method</h6>
                
                <div className="payment-method-options">
                  <div className="payment-method-option mb-2">
                    <CFormCheck 
                      type="radio"
                      name="paymentMethod"
                      id="upi"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => handlePaymentMethodChange('UPI')}
                      label="UPI"
                    />
                  </div>
                  
                  <div className="payment-method-option mb-2">
                    <CFormCheck 
                      type="radio"
                      name="paymentMethod"
                      id="card"
                      value="Credit/Debit Card"
                      checked={paymentMethod === 'Credit/Debit Card'}
                      onChange={() => handlePaymentMethodChange('Credit/Debit Card')}
                      label="Credit/Debit Card"
                    />
                  </div>
                  
                  <div className="payment-method-option mb-3">
                    <CFormCheck 
                      type="radio"
                      name="paymentMethod"
                      id="netbanking"
                      value="Net Banking"
                      checked={paymentMethod === 'Net Banking'}
                      onChange={() => handlePaymentMethodChange('Net Banking')}
                      label="Net Banking"
                    />
                  </div>
                </div>
                
                {paymentMethod === 'UPI' && (
                  <div className="upi-section mt-3">
                    <label htmlFor="upiId" className="form-label mb-2">UPI ID</label>
                    <CFormInput
                      type="text"
                      id="upiId"
                      placeholder="Enter UPI ID (e.g., username@upi)"
                      value={upiId}
                      onChange={handleUpiIdChange}
                      disabled={processingPayment}
                    />
                  </div>
                )}
                
                {paymentMethod === 'Credit/Debit Card' && (
                  <div className="card-section mt-3">
                    <div className="mb-3">
                      <label htmlFor="cardNumber" className="form-label mb-2">Card Number</label>
                      <CFormInput
                        type="text"
                        id="cardNumber"
                        placeholder="Enter card number"
                        disabled={processingPayment}
                      />
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label htmlFor="expiryDate" className="form-label mb-2">Expiry Date</label>
                        <CFormInput
                          type="text"
                          id="expiryDate"
                          placeholder="MM/YY"
                          disabled={processingPayment}
                        />
                      </div>
                      <div className="col-6">
                        <label htmlFor="cvv" className="form-label mb-2">CVV</label>
                        <CFormInput
                          type="text"
                          id="cvv"
                          placeholder="CVV"
                          disabled={processingPayment}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="nameOnCard" className="form-label mb-2">Name on Card</label>
                      <CFormInput
                        type="text"
                        id="nameOnCard"
                        placeholder="Enter name on card"
                        disabled={processingPayment}
                      />
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'Net Banking' && (
                  <div className="netbanking-section mt-3">
                    <label htmlFor="bankSelection" className="form-label mb-2">Select Bank</label>
                    <select className="form-select" id="bankSelection" disabled={processingPayment}>
                      <option value="">Select your bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        {!paymentSuccess && (
          <CModalFooter>
            <CButton 
              color="secondary" 
              onClick={() => setShowPaymentModal(false)}
              disabled={processingPayment}
            >
              Cancel
            </CButton>
            <CButton 
              color="primary" 
              onClick={processPayment}
              disabled={processingPayment || loadingInvoiceData}
            >
              {processingPayment ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                'Pay'
              )}
            </CButton>
          </CModalFooter>
        )}
      </CModal>

      {/* Invoice Details Modal */}
      <CModal 
        visible={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)}
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Invoice Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingInvoiceDetails ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading invoice details...</p>
            </div>
          ) : invoiceDetails ? (
            <div className="invoice-details">
              {/* Invoice Header */}
              <div className="invoice-header mb-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">Invoice #{invoiceDetails.invoiceNumber || invoiceDetails.id || selectedInvoice?._id}</h5>
                    <p className="text-muted mb-0">
                      Generated: {new Date(invoiceDetails.invoiceDate || invoiceDetails.date || selectedInvoice?.requestedAt).toLocaleDateString()}
                    </p>
                    {invoiceDetails.endDate && (
                      <p className="text-muted mb-0">
                        Valid Until: {new Date(invoiceDetails.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    {getStatusBadge(invoiceDetails.status || selectedInvoice?.status)}
                    <div className="mt-2">
                      <span className={`badge bg-${invoiceDetails.paymentStatus === 'paid' ? 'success' : 'warning'}-subtle text-${invoiceDetails.paymentStatus === 'paid' ? 'success' : 'warning'} ms-2`}>
                        {invoiceDetails.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Plan Details Section */}
              <div className="plan-details-section mb-4">
                <h6 className="text-primary mb-3">Plan Details</h6>
                <div className="card">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Plan Name:</span>
                          <span className="fw-semibold">{invoiceDetails.planDetails?.planName || invoiceDetails.planName}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Plan ID:</span>
                          <span>{invoiceDetails.planDetails?.planId || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Duration:</span>
                          <span>{invoiceDetails.planDetails?.duration || 30} days</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Grace Period:</span>
                          <span>{invoiceDetails.planDetails?.gracePeriod || 0} days</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Plan Type:</span>
                          <span>{invoiceDetails.planDetails?.type || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            
              {/* Financial Details Section */}
              <div className="financial-details-section mb-4">
                <h6 className="text-primary mb-3">Financial Details</h6>
                <div className="card">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted">Base Price:</td>
                            <td className="text-end">₹{invoiceDetails.financialDetails?.basePrice.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Discount ({invoiceDetails.financialDetails?.discountPercentage || 0}%):</td>
                            <td className="text-end text-success">-₹{invoiceDetails.financialDetails?.discountAmount.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Price After Discount:</td>
                            <td className="text-end">₹{invoiceDetails.financialDetails?.priceAfterDiscount.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">GST ({invoiceDetails.financialDetails?.taxPercentage || 18}%):</td>
                            <td className="text-end">₹{invoiceDetails.financialDetails?.taxAmount.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr className="border-top">
                            <td className="fw-bold">Final Total Amount:</td>
                            <td className="text-end fw-bold">₹{invoiceDetails.financialDetails?.finalTotalAmount.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Amount Paid:</td>
                            <td className="text-end text-success">₹{invoiceDetails.financialDetails?.amountPaid.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Outstanding Balance:</td>
                            <td className="text-end text-danger">₹{invoiceDetails.financialDetails?.outstandingBalance.toLocaleString('en-IN') || '0'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="payment-info-section mb-4">
                <h6 className="text-primary mb-3">Payment Information</h6>
                <div className="card">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Payment Mode:</span>
                          <span>{invoiceDetails.paymentMode || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Payment Type:</span>
                          <span>{invoiceDetails.paymentType || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Order ID:</span>
                          <span>{invoiceDetails.orderId || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Business ID:</span>
                          <span>{invoiceDetails.businessId || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Upgrade Type:</span>
                          <span>{invoiceDetails.upgradeType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="invoice-items mb-4">
                <h6 className="text-primary mb-3">Invoice Items</h6>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="bg-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoiceDetails.items || [{
                        name: invoiceDetails.planName || requestPlanNames[selectedInvoice?._id] || 'Subscription Plan',
                        quantity: 1,
                        price: invoiceDetails.amount || 0,
                        total: invoiceDetails.totalAmount || invoiceDetails.amount || 0
                      }]).map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td className="text-end">{item.quantity}</td>
                          <td className="text-end">₹{item.price.toLocaleString('en-IN')}</td>
                          <td className="text-end">₹{item.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="invoice-summary">
                <h6 className="text-primary mb-3">Invoice Summary</h6>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>₹{(invoiceDetails.subTotal || invoiceDetails.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax:</span>
                      <span>₹{(invoiceDetails.tax || invoiceDetails.gst || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total Amount:</span>
                      <span>₹{(invoiceDetails.total || invoiceDetails.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(invoiceDetails.balance || invoiceDetails.remainingAmount) > 0 && (
                      <div className="d-flex justify-content-between text-danger mt-2">
                        <span>Balance Due:</span>
                        <span>₹{(invoiceDetails.balance || invoiceDetails.remainingAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(invoiceDetails.description || invoiceDetails.details || selectedInvoice?.template || selectedInvoice?.details) && (
                <div className="additional-info mt-4">
                  <h6 className="text-primary mb-3">Additional Information</h6>
                  <div className="card">
                    <div className="card-body">
                      <p className="mb-0">
                        {invoiceDetails.description || invoiceDetails.details || selectedInvoice?.template || selectedInvoice?.details}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No invoice details available</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="primary" 
            variant="outline"
            onClick={handleDownloadInvoice}
            className="me-2"
          >
            Download PDF
          </CButton>
          <CButton color="secondary" onClick={() => setShowInvoiceModal(false)}>
            Close
          </CButton>
          {selectedInvoice && (selectedInvoice.status === 'Pending' || selectedInvoice.status === 'pending') && (
            <CButton 
              color="success" 
              onClick={() => {
                setShowInvoiceModal(false)
                handleAccept(selectedInvoice)
              }}
            >
              Accept & Pay
            </CButton>
          )}
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default PaymentRequests
