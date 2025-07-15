import React, { useState, useEffect } from 'react'
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
import { API_CONFIG, API_HEADERS, ENDPOINTS, apiCall } from '../../config/api'
import './payment-requests.css'

function PaymentRequests() {
  const [paymentRequests, setPaymentRequests] = useState([])
  const [requestPlanNames, setRequestPlanNames] = useState({}) // Store plan names for each request
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }))
  
  // Payment processing states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [planDetails, setPlanDetails] = useState(null)
  const [loadingPlanDetails, setLoadingPlanDetails] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [upiId, setUpiId] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Reject confirmation states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState(null)
  const [processingReject, setProcessingReject] = useState(false)
  const [rejectSuccess, setRejectSuccess] = useState(false)
  
  // Invoice details modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState(null)
  const [invoiceDetails, setInvoiceDetails] = useState(null)
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false)

  useEffect(() => {
    fetchPaymentRequests()
  }, [])

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true)
      const data = await apiCall(ENDPOINTS.BILLING_BUSINESS('684fe39da8254e8906e99aad'))
      console.log('Payment requests data:', data)
      console.log('Payment requests data type:', typeof data)
      console.log('Payment requests data keys:', data ? Object.keys(data) : 'no data')
      
      // Prioritize data.data as per the API structure shown
      let paymentRequestsData = []
      
      if (data && data.success && Array.isArray(data.data)) {
        // This is the expected format from the API
        paymentRequestsData = data.data
        console.log('Using data.data array, length:', paymentRequestsData.length)
      } else if (Array.isArray(data)) {
        paymentRequestsData = data
        console.log('Using direct array, length:', paymentRequestsData.length)
      } else if (typeof data === 'object') {
        // Fallback to checking other common patterns
        if (Array.isArray(data.requests)) {
          paymentRequestsData = data.requests
          console.log('Using data.requests array, length:', paymentRequestsData.length)
        } else if (Array.isArray(data.paymentRequests)) {
          paymentRequestsData = data.paymentRequests
          console.log('Using data.paymentRequests array, length:', paymentRequestsData.length)
        } else if (Array.isArray(data.results)) {
          paymentRequestsData = data.results
          console.log('Using data.results array, length:', paymentRequestsData.length)
        }
      }
      
      console.log('Final paymentRequestsData:', paymentRequestsData)
      console.log('Final paymentRequestsData length:', paymentRequestsData.length)
      console.log('Setting paymentRequests with data:', paymentRequestsData)
      
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
      
      console.log('Processed paymentRequestsData:', processedData)
      setPaymentRequests(processedData)
      console.log('PaymentRequests state updated with:', processedData.length, 'items')
      
      // Fetch plan names for all requests
      await fetchPlanNamesForRequests(processedData)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching payment requests:', err)
      setError(err.message || 'Failed to fetch payment requests')
      setLoading(false)
    }
  }

  const fetchPlanNamesForRequests = async (requests) => {
    const planNamesMap = {}
    
    // Fetch plan names for each request concurrently
    const planNamePromises = requests.map(async (request) => {
      const invoiceId = request.invoiceId || request._id
      if (invoiceId) {
        try {
          const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
          console.log(`Plan name data for request ${request._id}:`, data)
          const responseData = data.data || data
          console.log(`Response data for request ${request._id}:`, responseData)
          console.log(`Plan ID object:`, responseData.planId)
          console.log(`Plan name from planId:`, responseData.planId?.planName)
          console.log(`Direct plan name:`, responseData.planName)
          
          // Try multiple paths to get the plan name
          let planName = null
          if (responseData.planId && typeof responseData.planId === 'object') {
            planName = responseData.planId.planName
          } else if (responseData.planName) {
            planName = responseData.planName
          } else if (responseData.plan && responseData.plan.planName) {
            planName = responseData.plan.planName
          } else if (responseData.planDetails && responseData.planDetails.planName) {
            planName = responseData.planDetails.planName
          }
          
          console.log(`Final plan name for request ${request._id}:`, planName)
          planNamesMap[request._id] = planName || 'Premium Plan'
        } catch (err) {
          console.error(`Error fetching plan name for request ${request._id}:`, err)
          planNamesMap[request._id] = 'Premium Plan'
        }
      } else {
        planNamesMap[request._id] = 'Premium Plan'
      }
    })
    
    await Promise.all(planNamePromises)
    console.log('Final plan names map:', planNamesMap)
    setRequestPlanNames(planNamesMap)
  }

  const fetchPlanDetails = async (invoiceId) => {
    if (!invoiceId) return
    
    setLoadingPlanDetails(true)
    try {
      const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
      console.log('Invoice details full response:', data)
      console.log('Invoice data structure:', data.data || data)
      
      // Extract all fields from the invoice API response - data structure access
      const responseData = data.data || data; // Handle both direct data and wrapped response
      
      console.log('Plan ID object:', responseData.planId)
      console.log('Plan Name from planId:', responseData.planId?.planName)
      
      setPlanDetails({
        planName: responseData.planId?.planName || responseData.planName || 'Subscription Plan',
        rental: responseData.planId?.rental || responseData.rental || responseData.amount || 0,
        discountPercent: responseData.planId?.discountPercent || responseData.discountPercent || 0,
        displayDiscount: responseData.planId?.displayDiscount || responseData.displayDiscount || 0,
        totalAfterDiscount: responseData.planId?.totalAfterDiscount || responseData.totalAfterDiscount || 0,
        duration: responseData.planId?.duration || responseData.duration || 30,
        gracePeriod: responseData.planId?.gracePeriod || responseData.gracePeriod || 0,
        paymentMode: responseData.paymentMode || 'Monthly',
        totalAmount: responseData.totalAmount || 0,
        gst: responseData.gst || 0,
        balance: responseData.balance || 0
      })
    } catch (err) {
      console.error('Error fetching plan details:', err)
      setPlanDetails({ 
        planName: 'Subscription Plan', 
        rental: 0, 
        discountPercent: 0,
        displayDiscount: 0,
        totalAfterDiscount: 0,
        duration: 30,
        gracePeriod: 0,
        paymentMode: 'Monthly',
        totalAmount: 0, 
        balance: 0, 
        gst: 0 
      })
    } finally {
      setLoadingPlanDetails(false)
    }
  }

  const handleAccept = async (request) => {
    if (!request || !request._id) return
    
    setSelectedRequest(request)
    await fetchPlanDetails(request.invoiceId || request._id)
    setShowPaymentModal(true)
  }

  const handleReject = (request) => {
    if (!request) return
    
    setRejectingRequest(request)
    setShowRejectModal(true)
  }
  
  const confirmReject = async () => {
    if (!rejectingRequest || !rejectingRequest._id) return
    
    setProcessingReject(true)
    try {
      console.log('Rejecting payment request:', rejectingRequest._id)
      
      const response = await apiCall(`/api/billing/${rejectingRequest._id}`, 'PUT', {
        status: "rejected",
        paymentStatus: "unpaid"
      })
      
      console.log('Reject response:', response)
      
      // Update the local state to reflect the change
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === rejectingRequest._id 
            ? { ...req, status: 'rejected', paymentStatus: 'unpaid' } 
            : req
        )
      )
      
      // Show success feedback
      setRejectSuccess(true)
      setShowRejectModal(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setRejectSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error('Error rejecting payment:', err)
      alert('Failed to reject payment request. Please try again.')
    } finally {
      setProcessingReject(false)
      setRejectingRequest(null)
    }
  }
  
  const handleCardClick = async (request) => {
    if (!request) return
    
    setSelectedInvoiceRequest(request)
    setShowInvoiceModal(true)
    
    // Fetch detailed invoice information
    await fetchInvoiceDetails(request.invoiceId || request._id)
  }
  
  const fetchInvoiceDetails = async (invoiceId) => {
    if (!invoiceId) return
    
    setLoadingInvoiceDetails(true)
    try {
      const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
      console.log('Invoice details for modal:', data)
      
      const responseData = data.data || data
      
      setInvoiceDetails({
        invoiceId: responseData._id || invoiceId,
        planName: responseData.planId?.planName || responseData.planName || 'Subscription Plan',
        businessId: responseData.businessId || 'N/A',
        planId: responseData.planId?._id || responseData.planId || 'N/A',
        rental: responseData.planId?.rental || responseData.rental || responseData.amount || 0,
        discountPercent: responseData.planId?.discountPercent || responseData.discountPercent || 0,
        displayDiscount: responseData.planId?.displayDiscount || responseData.displayDiscount || 0,
        totalAfterDiscount: responseData.planId?.totalAfterDiscount || responseData.totalAfterDiscount || 0,
        duration: responseData.planId?.duration || responseData.duration || 30,
        gracePeriod: responseData.planId?.gracePeriod || responseData.gracePeriod || 0,
        paymentMode: responseData.paymentMode || 'Monthly',
        totalAmount: responseData.totalAmount || 0,
        gst: responseData.gst || 0,
        balance: responseData.balance || 0,
        status: selectedInvoiceRequest?.status || responseData.status || 'pending',
        paymentStatus: selectedInvoiceRequest?.status === 'rejected' ? 'failed' : 
                      selectedInvoiceRequest?.status === 'approved' ? 'paid' : 
                      selectedInvoiceRequest?.paymentStatus || responseData.paymentStatus || 'unpaid',
        requestedAt: responseData.requestedAt || responseData.createdAt || new Date().toISOString(),
        template: responseData.template || 'No description available'
      })
    } catch (err) {
      console.error('Error fetching invoice details:', err)
      setInvoiceDetails({
        invoiceId: invoiceId,
        planName: 'Subscription Plan',
        businessId: 'N/A',
        planId: 'N/A',
        rental: 0,
        discountPercent: 0,
        displayDiscount: 0,
        totalAfterDiscount: 0,
        duration: 30,
        gracePeriod: 0,
        paymentMode: 'Monthly',
        totalAmount: 0,
        gst: 0,
        balance: 0,
        status: selectedInvoiceRequest?.status || 'pending',
        paymentStatus: selectedInvoiceRequest?.status === 'rejected' ? 'failed' : 
                      selectedInvoiceRequest?.status === 'approved' ? 'paid' : 'unpaid',
        requestedAt: selectedInvoiceRequest?.requestedAt || new Date().toISOString(),
        template: selectedInvoiceRequest?.template || 'No description available'
      })
    } finally {
      setLoadingInvoiceDetails(false)
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
      const data = await apiCall(ENDPOINTS.BILLING_UPDATE(selectedRequest._id), {
        method: 'PUT',
        body: JSON.stringify({
          status: "approved",
          paymentStatus: "paid",
          template: selectedRequest.template || `An order request generated for plan ${planDetails?.planName || 'Subscription Plan'}, Business ID: ${selectedRequest.businessId || '123'}, Plan ID: ${selectedRequest.planId || '456'}, Status: approved, Payment Status: paid`
        })
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
      <style jsx>{`
        .payment-request-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .payment-request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 0.25rem;
          display: block;
        }
        .info-value {
          font-size: 0.9rem;
          font-weight: 500;
          color: #212529;
        }
        .section-title {
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 0.5rem;
        }
        .info-group {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 0.375rem;
          border-left: 3px solid #007bff;
        }
        .balance-section .info-group {
          border-left-color: #dc3545;
          background: #fff5f5;
        }
      `}</style>
      <div className="payment-requests-header d-flex justify-content-between align-items-center mb-4">
        <h2>Payment Requests</h2>
      </div>

      {/* Success Messages */}
      {rejectSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> Payment request has been rejected successfully.
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setRejectSuccess(false)}></button>
        </div>
      )}

      {paymentSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> Payment has been processed successfully.
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setPaymentSuccess(false)}></button>
        </div>
      )}

      {/* Pending Payment Requests Section */}
      <div className="pending-requests-section mb-4">
        <h3 className="section-title">Pending Payment Requests</h3>
        
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
          <CRow className="payment-request-cards">
            {(() => {
              console.log('Rendering PaymentRequests - paymentRequests:', paymentRequests)
              console.log('Rendering PaymentRequests - paymentRequests.length:', paymentRequests.length)
              console.log('Rendering PaymentRequests - loading:', loading)
              console.log('Rendering PaymentRequests - error:', error)
              return null
            })()}
            {paymentRequests.length > 0 ? (
              paymentRequests.map((request) => {
                console.log('Rendering payment request:', request)
                return (
                  <CCol xs={12} sm={6} md={4} xl={3} key={request.id || request._id} className="mb-4">
                    <CCard 
                      className="h-100 payment-request-card" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCardClick(request)}
                    >
                      <CCardBody>
                        <div className="mb-2 d-flex justify-content-between">
                          <div className="request-date">{request.date || (request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          }) : currentDate)}</div>
                          {getStatusBadge(request.status)}
                        </div>
                        <h4 className="request-plan">
                          {requestPlanNames[request._id] || request.planName || 'Loading...'}
                        </h4>
                        <p className="request-details">{request.template || request.details || request.description}</p>
                        <div className="payment-status mb-3">
                          Payment Status: <span className={`status-${(request.paymentStatus || 'pending').toLowerCase()}`}>{request.paymentStatus || 'Pending'}</span>
                        </div>
                        
                        {(request.status === 'Pending' || request.status === 'pending') && (
                          <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <CButton 
                              color="success" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleAccept(request)}
                            >
                              Accept
                            </CButton>
                            <CButton 
                              color="danger" 
                              size="sm"
                              onClick={() => handleReject(request)}
                            >
                              Reject
                            </CButton>
                          </div>
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })
            ) : (
              <CCol xs={12}>
                <CCard className="text-center py-5">
                  <CCardBody>
                    <div className="empty-state">
                      <div className="empty-icon mb-3">
                        <i className="bi bi-file-earmark-text" style={{ fontSize: '48px', opacity: '0.5' }}></i>
                      </div>
                      <h4>No Payment Requests Found</h4>
                      <p className="text-muted">There are no payment requests available at this time.</p>
                      <CButton 
                        color="primary" 
                        onClick={() => {
                          setError(null)
                          fetchPaymentRequests()
                        }}
                      >
                        Refresh
                      </CButton>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            )}
          </CRow>
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
        size="md"
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
          ) : loadingPlanDetails ? (
            <div className="text-center py-3">
              <CSpinner color="primary" />
              <p className="mt-3 mb-0">Loading plan details...</p>
            </div>
          ) : (
            <>
              <div className="plan-details mb-4">
                <h5>{planDetails?.planName || selectedRequest?.planName || 'Subscription Plan'}</h5>
                
                <div className="plan-info">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Rental:</span>
                        <span className="fw-bold">₹{(planDetails?.rental || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Discount:</span>
                        <span className="fw-bold text-success">{planDetails?.discountPercent || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Discount Amount:</span>
                        <span className="fw-bold text-success">₹{(planDetails?.displayDiscount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">After Discount:</span>
                        <span className="fw-bold">₹{(planDetails?.totalAfterDiscount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Duration:</span>
                        <span className="fw-bold">{planDetails?.duration || 0} days</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Grace Period:</span>
                        <span className="fw-bold">{planDetails?.gracePeriod || 0} days</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Payment Mode:</span>
                        <span className="fw-bold">{planDetails?.paymentMode || 'Monthly'}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">GST Amount:</span>
                        <span className="fw-bold">₹{(planDetails?.gst || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fw-bold me-3">Total Balance:</span>
                        <span className="fw-bold text-danger">₹{(planDetails?.balance || 0).toLocaleString('en-IN')}</span>
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
              disabled={processingPayment || loadingPlanDetails}
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

      {/* Reject Confirmation Modal */}
      <CModal 
        visible={showRejectModal} 
        onClose={() => {
          setShowRejectModal(false)
          setRejectingRequest(null)
        }}
        alignment="center"
        size="md"
      >
        <CModalHeader>
          <CModalTitle>Confirm Rejection</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center">
            <div className="mb-3">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
            </div>
            <h5>Are you sure you want to reject this payment request?</h5>
            {rejectingRequest && (
              <div className="mt-3">
                <p className="text-muted">
                  <strong>Plan:</strong> {rejectingRequest.planName || 'Subscription Plan'}<br/>
                  <strong>Amount:</strong> ₹{rejectingRequest.amount || 'N/A'}<br/>
                  <strong>Date:</strong> {rejectingRequest.date || (rejectingRequest.requestedAt ? new Date(rejectingRequest.requestedAt).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: 'numeric' 
                  }) : 'N/A')}
                </p>
              </div>
            )}
            <p className="text-muted">This action cannot be undone. The payment request will be marked as rejected.</p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => {
              setShowRejectModal(false)
              setRejectingRequest(null)
            }}
            disabled={processingReject}
          >
            Cancel
          </CButton>
          <CButton 
            color="danger" 
            onClick={confirmReject}
            disabled={processingReject}
          >
            {processingReject ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Rejecting...
              </>
            ) : (
              'Yes, Reject'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Invoice Details Modal */}
      <CModal 
        visible={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Invoice Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingInvoiceDetails ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-3 mb-0">Loading invoice details...</p>
            </div>
          ) : invoiceDetails ? (
            <div className="invoice-details">
              {/* Status and Basic Info */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="info-group mb-3">
                    <label className="info-label">Status</label>
                    <div>{getStatusBadge(invoiceDetails.status)}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-group mb-3">
                    <label className="info-label">Payment Status</label>
                    <div>
                      <CBadge color={
                        invoiceDetails.paymentStatus === 'paid' ? 'success' : 
                        invoiceDetails.paymentStatus === 'failed' ? 'danger' :
                        invoiceDetails.paymentStatus === 'unpaid' ? 'warning' : 
                        'info'
                      }>
                        {invoiceDetails.status === 'approved' ? 'paid' : 
                         invoiceDetails.status === 'rejected' ? 'failed' : 
                         invoiceDetails.paymentStatus || 'unpaid'}
                      </CBadge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="plan-info-section mb-4">
                <h5 className="section-title mb-3">Plan Information</h5>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="info-group">
                      <label className="info-label">Plan Name</label>
                      <div className="info-value">{invoiceDetails.planName}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="financial-details-section mb-4">
                <h5 className="section-title mb-3">Financial Details</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">Rental Amount</label>
                      <div className="info-value">₹{invoiceDetails.rental.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">Discount Percentage</label>
                      <div className="info-value text-success">{invoiceDetails.discountPercent}%</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">Discount Amount</label>
                      <div className="info-value text-success">₹{invoiceDetails.displayDiscount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">After Discount</label>
                      <div className="info-value">₹{invoiceDetails.totalAfterDiscount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">GST Amount</label>
                      <div className="info-value">₹{invoiceDetails.gst.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">Total Amount</label>
                      <div className="info-value fw-bold">₹{invoiceDetails.totalAmount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
                <div className="balance-section">
                  <div className="info-group">
                    <label className="info-label">Outstanding Balance</label>
                    <div className="info-value text-danger fw-bold fs-5">₹{invoiceDetails.balance.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="subscription-details-section mb-4">
                <h5 className="section-title mb-3">Subscription Details</h5>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="info-group">
                      <label className="info-label">Duration</label>
                      <div className="info-value">{invoiceDetails.duration} days</div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="info-group">
                      <label className="info-label">Grace Period</label>
                      <div className="info-value">{invoiceDetails.gracePeriod} days</div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="info-group">
                      <label className="info-label">Payment Mode</label>
                      <div className="info-value">{invoiceDetails.paymentMode}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="request-info-section mb-4">
                <h5 className="section-title mb-3">Request Information</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="info-group">
                      <label className="info-label">Requested Date</label>
                      <div className="info-value">
                        {new Date(invoiceDetails.requestedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="info-group">
                  <label className="info-label">Description</label>
                  <div className="info-value">{invoiceDetails.template}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No invoice details available</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => setShowInvoiceModal(false)}
          >
            Close
          </CButton>
          {selectedInvoiceRequest && (selectedInvoiceRequest.status === 'pending' || selectedInvoiceRequest.status === 'Pending') && (
            <>
              <CButton 
                color="success" 
                onClick={() => {
                  setShowInvoiceModal(false)
                  handleAccept(selectedInvoiceRequest)
                }}
                className="me-2"
              >
                Accept Payment
              </CButton>
              <CButton 
                color="danger" 
                onClick={() => {
                  setShowInvoiceModal(false)
                  handleReject(selectedInvoiceRequest)
                }}
              >
                Reject Payment
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default PaymentRequests
