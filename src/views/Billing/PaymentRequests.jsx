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
  
  // Invoice details modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
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
      
      setPaymentRequests(processedData)
      
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
          console.log(`Fetching plan name for invoice ID: ${invoiceId}`)
          const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
          console.log(`Plan name API response for ${invoiceId}:`, data)
          
          const responseData = data.data || data
          
          // Try multiple ways to extract plan name from the API response
          let planName = 'Subscription Plan' // default fallback
          
          if (responseData.planId?.planName) {
            planName = responseData.planId.planName
          } else if (responseData.planName) {
            planName = responseData.planName
          } else if (responseData.plan?.name) {
            planName = responseData.plan.name
          } else if (responseData.plan?.planName) {
            planName = responseData.plan.planName
          }
          
          console.log(`Extracted plan name for ${invoiceId}: ${planName}`)
          planNamesMap[request._id] = planName
        } catch (err) {
          console.error(`Error fetching plan name for request ${request._id}:`, err)
          planNamesMap[request._id] = 'Subscription Plan'
        }
      } else {
        planNamesMap[request._id] = 'Subscription Plan'
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

  const handleCardClick = async (request) => {
    if (!request || !request._id) return
    
    try {
      setLoadingInvoiceDetails(true)
      setSelectedInvoice(request)
      
      const invoiceId = request.invoiceId || request._id
      const data = await apiCall(ENDPOINTS.INVOICES(invoiceId))
      
      console.log('Invoice details response:', data)
      
      const invoiceInfo = data.data || data
      setInvoiceDetails(invoiceInfo)
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      // Show basic details if API fails
      setInvoiceDetails({
        id: request._id,
        planName: requestPlanNames[request._id] || request.planName || 'Plan Details',
        status: request.status,
        paymentStatus: request.paymentStatus,
        date: request.date || request.requestedAt,
        details: request.template || request.details || request.description,
        amount: request.amount || 0
      })
      setShowInvoiceModal(true)
    } finally {
      setLoadingInvoiceDetails(false)
    }
  }

  const handleReject = async (id) => {
    if (!id) return
    
    try {
      await apiCall(
        ENDPOINTS.BILLING_UPDATE(id), 
        'PUT',
        {
          status: "rejected",
          paymentStatus: "unpaid"
        }
      )
      
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
      const data = await apiCall(
        ENDPOINTS.BILLING_UPDATE(selectedRequest._id), 
        'PUT',
        {
          status: "approved",
          paymentStatus: "paid",
          template: selectedRequest.template || `An order request generated for plan ${planDetails?.planName || 'Subscription Plan'}, Business ID: ${selectedRequest.businessId || '123'}, Plan ID: ${selectedRequest.planId || '456'}, Status: approved, Payment Status: paid`
        }
      )
      
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
            {paymentRequests.length > 0 ? (
              paymentRequests.map((request) => (
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
                        <div className="action-buttons">
                          <CButton 
                            color="success" 
                            size="sm" 
                            className="me-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAccept(request)
                            }}
                          >
                            Accept
                          </CButton>
                          <CButton 
                            color="danger" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(request.id || request._id)
                            }}
                          >
                            Reject
                          </CButton>
                        </div>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              ))
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
          ) : loadingPlanDetails ? (
            <div className="text-center py-3">
              <CSpinner color="primary" />
              <p className="mt-3 mb-0">Loading plan details...</p>
            </div>
          ) : (
            <>
              <div className="plan-details mb-4">
                <h5>{planDetails?.planName || selectedRequest?.planName || 'Subscription Plan'}</h5>
                
                {/* Plan Details Section */}
                <div className="plan-info mb-4">
                  <h6 className="text-primary mb-3">Plan Details</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Rental:</span>
                        <span className="fw-bold">₹{(planDetails?.rental || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Discount Percent:</span>
                        <span className="fw-bold text-success">{planDetails?.discountPercent || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Display Discount:</span>
                        <span className="fw-bold text-success">₹{(planDetails?.displayDiscount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Total After Discount:</span>
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
                </div>
                
                {/* Invoice Details Section */}
                <div className="invoice-details mb-4">
                  <h6 className="text-primary mb-3">Invoice Details</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Total Amount:</span>
                        <span className="fw-bold">₹{(planDetails?.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">GST:</span>
                        <span className="fw-bold">₹{(planDetails?.gst || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Balance:</span>
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
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Invoice ID:</strong> {invoiceDetails.id || selectedInvoice?._id}
                </div>
                <div className="col-md-6">
                  <strong>Date:</strong> {invoiceDetails.date || (selectedInvoice?.requestedAt ? new Date(selectedInvoice.requestedAt).toLocaleDateString() : 'N/A')}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Plan Name:</strong> {invoiceDetails.planName || requestPlanNames[selectedInvoice?._id] || 'N/A'}
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong> {getStatusBadge(invoiceDetails.status || selectedInvoice?.status)}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Payment Status:</strong> 
                  <span className={`ms-2 status-${(invoiceDetails.paymentStatus || selectedInvoice?.paymentStatus || 'pending').toLowerCase()}`}>
                    {invoiceDetails.paymentStatus || selectedInvoice?.paymentStatus || 'Pending'}
                  </span>
                </div>
                <div className="col-md-6">
                  <strong>Amount:</strong> ₹{invoiceDetails.amount || invoiceDetails.totalAmount || selectedInvoice?.amount || 0}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>GST:</strong> ₹{invoiceDetails.gst || invoiceDetails.tax || selectedInvoice?.gst || 0}
                </div>
                <div className="col-md-6">
                  <strong>Balance:</strong> ₹{invoiceDetails.balance || invoiceDetails.remainingAmount || selectedInvoice?.balance || 0}
                </div>
              </div>
              {(invoiceDetails.details || selectedInvoice?.template || selectedInvoice?.details) && (
                <div className="row mb-3">
                  <div className="col-12">
                    <strong>Description:</strong>
                    <p className="mt-1">{invoiceDetails.details || selectedInvoice?.template || selectedInvoice?.details}</p>
                  </div>
                </div>
              )}
              {invoiceDetails.rental && (
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Rental:</strong> ₹{invoiceDetails.rental}
                  </div>
                  <div className="col-md-6">
                    <strong>GST:</strong> ₹{invoiceDetails.gst || 0}
                  </div>
                </div>
              )}
              {invoiceDetails.discountPercent && (
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Discount:</strong> {invoiceDetails.discountPercent}%
                  </div>
                  <div className="col-md-6">
                    <strong>Total After Discount:</strong> ₹{invoiceDetails.totalAfterDiscount || 0}
                  </div>
                </div>
              )}
              {invoiceDetails.duration && (
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Duration:</strong> {invoiceDetails.duration} days
                  </div>
                  <div className="col-md-6">
                    <strong>Payment Mode:</strong> {invoiceDetails.paymentMode || 'Monthly'}
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
