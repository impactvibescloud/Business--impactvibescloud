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
import './payment-requests.css'

function PaymentRequests() {
  const [paymentRequests, setPaymentRequests] = useState([])
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

  useEffect(() => {
    fetchPaymentRequests()
  }, [])

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://api-impactvibescloud.onrender.com/api/billing/business/684fe39da8254e8906e99aad', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', response.status, errorText)
        throw new Error(`Failed to fetch payment requests: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
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
      setLoading(false)
    } catch (err) {
      console.error('Error fetching payment requests:', err)
      setError(err.message || 'Failed to fetch payment requests')
      setLoading(false)
    }
  }

  const fetchPlanDetails = async (planId) => {
    if (!planId) return
    
    setLoadingPlanDetails(true)
    try {
      const response = await fetch(`https://api-impactvibescloud.onrender.com/api/plans/${planId}`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTM2ODk3M30.Je1vRey76ElXFx-FSH2oEdto8xM_Lqti0090gp-zRmA'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plan details: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Plan details:', data)
      if (data.success && data.data) {
        setPlanDetails(data.data)
      } else {
        setPlanDetails(data)
      }
    } catch (err) {
      console.error('Error fetching plan details:', err)
      setPlanDetails({ planName: 'Subscription Plan', rental: 0 })
    } finally {
      setLoadingPlanDetails(false)
    }
  }

  const handleAccept = async (request) => {
    if (!request || !request._id) return
    
    setSelectedRequest(request)
    await fetchPlanDetails(request.planId || '685151bbcc646630b0126f6c') // Use default plan ID if not provided
    setShowPaymentModal(true)
  }

  const handleReject = async (id) => {
    if (!id) return
    
    try {
      const response = await fetch(`https://api-impactvibescloud.onrender.com/api/billing/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'
        },
        body: JSON.stringify({
          status: "rejected",
          paymentStatus: "unpaid"
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to reject payment: ${response.status} ${response.statusText}`)
      }
      
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
      const response = await fetch(`https://api-impactvibescloud.onrender.com/api/billing/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'
        },
        body: JSON.stringify({
          status: "approved",
          paymentStatus: "paid",
          template: selectedRequest.template || `An order request generated for plan ${planDetails?.planName || 'Subscription Plan'}, Business ID: ${selectedRequest.businessId || '123'}, Plan ID: ${selectedRequest.planId || '456'}, Status: approved, Payment Status: paid`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to process payment: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
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
        <CButton 
          color="primary" 
          className="new-request-btn"
          onClick={handleCreateRequest}
        >
          New Payment Request
        </CButton>
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
                  <CCard className="h-100 payment-request-card">
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
                        {request.planName || 
                         (request.template && request.template.includes('plan') ? 
                            request.template.match(/plan\s+([^,]+)/i)?.[1] : 
                            'Subscription Plan')}
                      </h4>
                      <p className="request-details">{request.template || request.details || request.description}</p>
                      <div className="payment-status mb-3">
                        Payment Status: <span className={`status-${(request.paymentStatus || 'pending').toLowerCase()}`}>{request.paymentStatus || 'Pending'}</span>
                      </div>
                      <div className="request-amount mb-3">₹{(request.totalAfterDiscount || request.amount || request.price || request.rental || 1275).toLocaleString('en-IN')}</div>
                      
                      {(request.status === 'Pending' || request.status === 'pending') && (
                        <div className="action-buttons">
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
                            onClick={() => handleReject(request.id || request._id)}
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
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Base Price:</span>
                    <span className="fw-bold">₹{(planDetails?.rental || selectedRequest?.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {planDetails?.discountPercent > 0 && (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Discount ({planDetails.discountPercent}%):</span>
                        <span className="fw-bold text-success">-₹{(planDetails.displayDiscount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2 total-price">
                        <span className="text-muted fw-bold">Total:</span>
                        <span className="fw-bold">₹{(planDetails.totalAfterDiscount || planDetails?.rental || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  
                  {planDetails?.duration > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="text-muted">Duration:</span>
                      <span>{planDetails.duration} days</span>
                    </div>
                  )}
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
    </div>
  )
}

export default PaymentRequests
