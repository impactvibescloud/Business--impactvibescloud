import React, { useState } from 'react'
import { savePurchasedNumber } from './virtualNumbersUtils'
import { NavLink } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CContainer,
  CRow,
  CCol,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CForm,
  CFormSelect,
  CFormCheck,
  CFormInput,
  CInputGroup,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBreadcrumb,
  CBreadcrumbItem,
  CAlert,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPhone } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import './BuyNumber.css'

function BuyNumber() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentSuccessful, setPaymentSuccessful] = useState(false)
  
  // Sample available numbers data
  const availableNumbers = [
    { id: 1, number: '+91 98765 43215', location: 'Mumbai', type: 'Toll-Free', price: 1200 },
    { id: 2, number: '+91 98765 43216', location: 'Delhi', type: 'Local', price: 999 },
    { id: 3, number: '+91 98765 43217', location: 'Bangalore', type: 'Local', price: 999 },
    { id: 4, number: '+91 98765 43218', location: 'Chennai', type: 'Toll-Free', price: 1200 },
    { id: 5, number: '+91 98765 43219', location: 'Hyderabad', type: 'Local', price: 999 },
    { id: 6, number: '+91 98765 43220', location: 'Kolkata', type: 'Toll-Free', price: 1200 },
    { id: 7, number: '+91 98765 43221', location: 'Pune', type: 'Local', price: 999 }
  ]

  // Filter numbers by search term
  const filteredNumbers = availableNumbers.filter(num => 
    num.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    num.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    num.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle number selection
  const handleSelectNumber = (number) => {
    setSelectedNumber(number)
    setShowPaymentModal(true)
  }

  // Handle payment method selection
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value)
  }

  // Handle payment submission
  const handlePaymentSubmit = () => {
    if (!paymentMethod) return
    
    setIsPaymentProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      // Save purchased number to localStorage
      if (selectedNumber) {
        savePurchasedNumber(selectedNumber)
      }
      
      setIsPaymentProcessing(false)
      setPaymentSuccessful(true)
      
      // After successful payment, navigate back to billing page after a delay
      setTimeout(() => {
        navigate('/billing')
      }, 2000)
    }, 1500)
  }

  return (
    <div className="buy-number-container">
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem>
          <NavLink to="/billing" className="text-decoration-none">Billing</NavLink>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>Buy Number</CBreadcrumbItem>
      </CBreadcrumb>

      <h1 className="page-title mb-4">Buy Virtual Number</h1>
      
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4">
            <CCol md={4}>
              <CFormSelect 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="country-selector"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Singapore">Singapore</option>
                <option value="Australia">Australia</option>
              </CFormSelect>
            </CCol>
            <CCol md={8}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search by number, location, or type..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <CButton color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
          </CRow>
          
          <CTable striped responsive className="available-numbers-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>NUMBER</CTableHeaderCell>
                <CTableHeaderCell>LOCATION</CTableHeaderCell>
                <CTableHeaderCell>TYPE</CTableHeaderCell>
                <CTableHeaderCell>PRICE</CTableHeaderCell>
                <CTableHeaderCell>ACTION</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredNumbers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center py-4">
                    No numbers available matching your search
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredNumbers.map(num => (
                  <CTableRow key={num.id}>
                    <CTableDataCell>
                      <div className="number-cell">
                        <CIcon icon={cilPhone} className="phone-icon" />
                        {num.number}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{num.location}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={num.type === 'Toll-Free' ? 'success' : 'info'}>
                        {num.type}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>₹{num.price}</CTableDataCell>
                    <CTableDataCell>
                      <CButton 
                        color="primary" 
                        size="sm"
                        onClick={() => handleSelectNumber(num)}
                      >
                        Buy
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Payment Modal */}
      <CModal 
        visible={showPaymentModal} 
        onClose={() => !isPaymentProcessing && setShowPaymentModal(false)}
        alignment="center"
      >
        <CModalHeader closeButton={!isPaymentProcessing}>
          <CModalTitle>Payment Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {paymentSuccessful ? (
            <div className="text-center">
              <div className="payment-success-icon mb-3">
                <i className="cil-check-circle" style={{ fontSize: '48px', color: '#2eb85c' }}></i>
              </div>
              <h4 className="mb-3">Payment Successful!</h4>
              <p>Your number has been purchased successfully.</p>
              <p>You will be redirected back to the billing page.</p>
            </div>
          ) : (
            <>
              {selectedNumber && (
                <div className="selected-number-summary mb-4">
                  <h5>Selected Number</h5>
                  <p className="mb-1"><strong>Number:</strong> {selectedNumber.number}</p>
                  <p className="mb-1"><strong>Location:</strong> {selectedNumber.location}</p>
                  <p className="mb-1"><strong>Type:</strong> {selectedNumber.type}</p>
                  <p className="mb-0"><strong>Price:</strong> ₹{selectedNumber.price}</p>
                </div>
              )}
              
              <div className="payment-methods">
                <h5>Choose Payment Method</h5>
                <div className="payment-methods-list">
                  <div className="payment-method-option">
                    <CFormCheck
                      type="radio"
                      name="paymentMethod"
                      id="upi"
                      value="upi"
                      label="UPI"
                      checked={paymentMethod === 'upi'}
                      onChange={handlePaymentMethodChange}
                      disabled={isPaymentProcessing}
                    />
                  </div>
                  
                  <div className="payment-method-option">
                    <CFormCheck
                      type="radio"
                      name="paymentMethod"
                      id="card"
                      value="card"
                      label="Credit/Debit Card"
                      checked={paymentMethod === 'card'}
                      onChange={handlePaymentMethodChange}
                      disabled={isPaymentProcessing}
                    />
                  </div>
                  
                  <div className="payment-method-option">
                    <CFormCheck
                      type="radio"
                      name="paymentMethod"
                      id="netbanking"
                      value="netbanking"
                      label="Net Banking"
                      checked={paymentMethod === 'netbanking'}
                      onChange={handlePaymentMethodChange}
                      disabled={isPaymentProcessing}
                    />
                  </div>
                </div>
              </div>
              
              {paymentMethod && (
                <div className="payment-form mt-4">
                  {paymentMethod === 'upi' && (
                    <div className="upi-form">
                      <CFormInput
                        type="text"
                        placeholder="Enter UPI ID"
                        disabled={isPaymentProcessing}
                      />
                    </div>
                  )}
                  
                  {paymentMethod === 'card' && (
                    <div className="card-form">
                      <CFormInput
                        type="text"
                        placeholder="Card Number"
                        className="mb-2"
                        disabled={isPaymentProcessing}
                      />
                      <CRow>
                        <CCol md={6}>
                          <CFormInput
                            type="text"
                            placeholder="MM/YY"
                            className="mb-2"
                            disabled={isPaymentProcessing}
                          />
                        </CCol>
                        <CCol md={6}>
                          <CFormInput
                            type="text"
                            placeholder="CVV"
                            disabled={isPaymentProcessing}
                          />
                        </CCol>
                      </CRow>
                    </div>
                  )}
                  
                  {paymentMethod === 'netbanking' && (
                    <div className="netbanking-form">
                      <CFormSelect
                        className="mb-2"
                        disabled={isPaymentProcessing}
                      >
                        <option value="">Select Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                      </CFormSelect>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CModalBody>
        {!paymentSuccessful && (
          <CModalFooter>
            <CButton 
              color="secondary" 
              onClick={() => setShowPaymentModal(false)}
              disabled={isPaymentProcessing}
            >
              Cancel
            </CButton>
            <CButton 
              color="primary" 
              onClick={handlePaymentSubmit}
              disabled={!paymentMethod || isPaymentProcessing}
            >
              {isPaymentProcessing ? 'Processing...' : `Pay ₹${selectedNumber?.price || '0'}`}
            </CButton>
          </CModalFooter>
        )}
      </CModal>
    </div>
  )
}

export default BuyNumber
