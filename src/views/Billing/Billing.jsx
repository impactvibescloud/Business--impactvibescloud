import React, { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { getPurchasedNumbers, getPurchasedNumbersByCountry, savePurchasedNumber } from '../VirtualNumbers/virtualNumbersUtils'
import { getCredits, saveCredits, fetchCreditsFromAPI } from './creditUtils'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CRow,
  CCol,
  CButton,
  CInputGroup,
  CFormInput,
  CFormSwitch,
  CInputGroupText,
  CForm,
  CFormLabel,
  CFormSelect,
  CAlert,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPhone, cilArrowLeft } from '@coreui/icons'
import './Billing.css'
import './billing-alerts.css'
import './billing-buy-number.css'
import './billing-credits.css'
import './billing-toggle.css'
import './payment-requests.css'
import PaymentRequests from './PaymentRequests'

function Billing() {
  const [activeKey, setActiveKey] = useState(1)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [purchasedNumbers, setPurchasedNumbers] = useState([])
  const [numbersByCountry, setNumbersByCountry] = useState({})
  const [showBuyNumberView, setShowBuyNumberView] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentSuccessful, setPaymentSuccessful] = useState(false)
  
  // Credit management states
  const [credits, setCredits] = useState(0)
  const [creditAmount, setCreditAmount] = useState('')
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [creditPaymentMethod, setCreditPaymentMethod] = useState('')
  const [isProcessingCredits, setIsProcessingCredits] = useState(false)
  const [autoPaySubscription, setAutoPaySubscription] = useState(false)
  const [notifyLowBalance, setNotifyLowBalance] = useState(false)
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(100)
  
  const navigate = useNavigate()
  
  // Indian states array
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ]
  
  // Load purchased numbers and credits on component mount
  useEffect(() => {
    const numbers = getPurchasedNumbers()
    setPurchasedNumbers(numbers)
    
    const groupedNumbers = getPurchasedNumbersByCountry()
    setNumbersByCountry(groupedNumbers)
    
    // Load credits from API first, then fallback to localStorage
    const loadCredits = async () => {
      try {
        const apiCredits = await fetchCreditsFromAPI()
        setCredits(apiCredits)
      } catch (error) {
        console.error('Error fetching credits from API:', error)
        const userCredits = getCredits()
        setCredits(userCredits)
      }
    }
    
    loadCredits()
  }, [])
  
  // Handle save changes
  const handleSaveChanges = (e) => {
    e.preventDefault()
    
    // Get the form element
    const form = e.target.closest('form')
    
    // Check form validity
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }
    
    setIsSaving(true)
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccessMessage(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
    }, 800)
  }
  
  // Countries array
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
    "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
    "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
    "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica",
    "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
    "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
    "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
    "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait",
    "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
    "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
    "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
    "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
    "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
    "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain",
    "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
    "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
    "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ]
  
  useEffect(() => {
    // Check for URL params to determine active tab
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    
    if (tabParam === 'credits') {
      setActiveKey(2)
    } else if (tabParam === 'billing') {
      setActiveKey(3)
    } else if (tabParam === 'payment-requests') {
      setActiveKey(4)
    }
  }, [])
  
  // Function to update URL when changing tabs
  const handleTabChange = (key) => {
    setActiveKey(key)
    const tabParam = key === 1 ? '' : 
                    key === 2 ? 'credits' : 
                    key === 3 ? 'billing' : 
                    key === 4 ? 'payment-requests' : '';
    
    if (tabParam) {
      const url = new URL(window.location)
      url.searchParams.set('tab', tabParam)
      window.history.pushState({}, '', url)
    } else {
      const url = new URL(window.location)
      url.searchParams.delete('tab')
      window.history.pushState({}, '', url)
    }
  }
  
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
        const updatedNumbers = savePurchasedNumber(selectedNumber)
        setPurchasedNumbers(updatedNumbers)
        setNumbersByCountry(getPurchasedNumbersByCountry())
      }
      
      setIsPaymentProcessing(false)
      setPaymentSuccessful(true)
      
      // After successful payment, close everything and go back to overview tab
      setTimeout(() => {
        setShowPaymentModal(false)
        setShowBuyNumberView(false)
        setActiveKey(1)
        setSelectedNumber(null)
        setPaymentMethod('')
        setPaymentSuccessful(false)
      }, 2000)
    }, 1500)
  }
  
  // Handle credit payment method selection
  const handleCreditPaymentMethodChange = (e) => {
    setCreditPaymentMethod(e.target.value)
  }
  
  // Handle adding credits
  const handleAddCredits = () => {
    if (!creditPaymentMethod || !creditAmount) return
    
    setIsProcessingCredits(true)
    
    // Simulate credit purchase processing
    setTimeout(() => {
      // Add credits to the balance using utility function
      const amount = parseInt(creditAmount, 10) || 0
      const updatedCredits = saveCredits(amount)
      setCredits(updatedCredits)
      
      // Reset form
      setIsProcessingCredits(false)
      setCreditAmount('')
      setCreditPaymentMethod('')
      setShowPaymentOptions(false)
      
      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    }, 1500)
  }
  
  // Handle view usage
  const handleViewUsage = () => {
    // This would typically open a detailed view of credits usage
    console.log('View credits usage history')
  }
  
  // Handle saving low balance threshold
  const handleSaveThreshold = () => {
    // This would typically save the threshold to the backend
    console.log(`Low balance threshold saved: ${lowBalanceThreshold}`)
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }
  
  return (
    <div className="billing-container">
      <h1 className="page-title">Plans & Numbers</h1>
      
      <CCard className="mb-4">
        <CCardBody>
          <CNav variant="tabs" role="tablist" className="billing-tabs">
            <CNavItem>
              <CNavLink
                active={activeKey === 1}
                onClick={() => handleTabChange(1)}
                className="tab-link"
              >
                Overview
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 2}
                onClick={() => handleTabChange(2)}
                className="tab-link"
              >
                Credits
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 3}
                onClick={() => handleTabChange(3)}
                className="tab-link"
              >
                Billing
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 4}
                onClick={() => handleTabChange(4)}
                className="tab-link"
              >
                Payment Requests
              </CNavLink>
            </CNavItem>
          </CNav>
          
          <CTabContent>
            <CTabPane role="tabpanel" visible={activeKey === 1}>
              <div className="tab-content-wrapper">
                {/* Plan Details Card */}
                <CCard className="plan-card mb-4">
                  <CCardBody>
                    <div className="plan-header d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3 className="plan-title">Account Overview</h3>
                      </div>
                      <CButton 
                        color="outline-primary" 
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiCredits = await fetchCreditsFromAPI()
                            setCredits(apiCredits)
                          } catch (error) {
                            console.error('Error refreshing credits:', error)
                          }
                        }}
                      >
                        Refresh Credits
                      </CButton>
                    </div>
                    
                    <CRow className="plan-stats">
                      <CCol md={6}>
                        <div className="stat-item">
                          <span className="stat-label">Total calls</span>
                          <span className="stat-value">0</span>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="stat-item">
                          <span className="stat-label">Credit balance</span>
                          <span className="stat-value">₹{credits}</span>
                        </div>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>
                
                {/* Numbers Card */}
                <CCard className="numbers-card mb-4">
                  <CCardBody>
                    {!showBuyNumberView ? (
                      // Numbers List View
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h3 className="card-section-title mb-0">Numbers</h3>
                          <CButton 
                            color="primary" 
                            className="buy-number-btn"
                            onClick={() => setShowBuyNumberView(true)}
                          >
                            Buy Number
                          </CButton>
                        </div>
                        
                        <div className="numbers-list">
                          {purchasedNumbers.length > 0 ? (
                            Object.entries(numbersByCountry).map(([location, numbers]) => (
                              <div key={location} className="number-item d-flex align-items-center mb-3">
                                <div className="country-flag me-3">
                                  <img
                                    src="https://flagcdn.com/w40/in.png"
                                    alt="India flag"
                                    className="flag-image"
                                  />
                                </div>
                                <div className="number-details">
                                  <span className="country-name">+91 {location} numbers</span>
                                  <span className="number-count">{Array.isArray(numbers) ? numbers.length : 0} {(Array.isArray(numbers) && numbers.length === 1) ? 'number' : 'numbers'}</span>
                                  <div className="purchased-numbers mt-1">
                                    {Array.isArray(numbers) && numbers.map(num => (
                                      <div key={num.id || Math.random().toString()} className="purchased-number-item">
                                        {num.number}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="number-item d-flex align-items-center">
                              <div className="country-flag me-3">
                                <img
                                  src="https://flagcdn.com/w40/in.png"
                                  alt="India flag"
                                  className="flag-image"
                                />
                              </div>
                              <div className="number-details">
                                <span className="country-name">+91 India numbers</span>
                                <span className="number-count">No numbers purchased yet</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // Buy Number View
                      <div className="buy-number-section">
                        <div className="section-header d-flex justify-content-between align-items-center mb-4">
                          <h3 className="section-title">Buy Virtual Number</h3>
                          <CButton 
                            color="primary" 
                            className="cancel-btn"
                            onClick={() => setShowBuyNumberView(false)}
                          >
                            Cancel
                          </CButton>
                        </div>
                        
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
                            <div className="search-container">
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
                            </div>
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
                      </div>
                    )}
                  </CCardBody>
                </CCard>
                
                {/* Features Card */}
                <CCard className="features-card">
                  <CCardBody>
                    <h3 className="card-section-title mb-3">Features included</h3>
                    <CRow>
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">Call Recording</h5>
                            <p className="feature-description">Record and store all your calls</p>
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">Browser Calling</h5>
                            <p className="feature-description">Make calls directly from your browser</p>
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">IVR</h5>
                            <p className="feature-description">Set up interactive voice response</p>
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">Call Analytics</h5>
                            <p className="feature-description">Track and analyze call performance</p>
                          </div>
                        </div>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 2}>
              <div className="tab-content-wrapper">
                {/* Credits Tab Content */}
                <div className="credits-tab-content">
                  <div className="credits-header mb-4">
                    <div className="credits-balance-container">
                      <h4 className="credits-label">Credits (INR)</h4>
                      <div className="credits-amount">₹{credits}</div>
                      <CButton 
                        color="link" 
                        className="view-usage-link"
                        onClick={() => handleViewUsage()}
                      >
                        View usage
                      </CButton>
                    </div>
                    <p className="credits-description">
                      Credits are used for calling and transcription. It can also be used for subscription payments.
                    </p>
                  </div>
                  
                  <div className="add-credits-section mb-4">
                    <h4 className="mb-3">Add credits</h4>
                    {showSuccessMessage && (
                      <CAlert color="success" className="mb-3">
                        Credits added successfully!
                      </CAlert>
                    )}
                    <div className="d-flex align-items-end">
                      <div className="me-2" style={{ width: '200px' }}>
                        <CInputGroup>
                          <CInputGroupText>₹</CInputGroupText>
                          <CFormInput 
                            type="number" 
                            min="100" 
                            placeholder="Enter amount" 
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                          />
                        </CInputGroup>
                      </div>
                      <CButton 
                        color="secondary" 
                        onClick={() => setShowPaymentOptions(true)}
                        disabled={!creditAmount || creditAmount < 100}
                      >
                        Add
                      </CButton>
                    </div>
                    
                    {showPaymentOptions && (
                      <div className="payment-options-container mt-4">
                        <h5 className="mb-3">Select payment method</h5>
                        <div className="payment-methods-list">
                          <div className="payment-method-option">
                            <CFormCheck
                              type="radio"
                              name="creditPaymentMethod"
                              id="credit-upi"
                              value="upi"
                              label="UPI"
                              checked={creditPaymentMethod === 'upi'}
                              onChange={handleCreditPaymentMethodChange}
                            />
                          </div>
                          
                          <div className="payment-method-option">
                            <CFormCheck
                              type="radio"
                              name="creditPaymentMethod"
                              id="credit-card"
                              value="card"
                              label="Credit/Debit Card"
                              checked={creditPaymentMethod === 'card'}
                              onChange={handleCreditPaymentMethodChange}
                            />
                          </div>
                          
                          <div className="payment-method-option">
                            <CFormCheck
                              type="radio"
                              name="creditPaymentMethod"
                              id="credit-netbanking"
                              value="netbanking"
                              label="Net Banking"
                              checked={creditPaymentMethod === 'netbanking'}
                              onChange={handleCreditPaymentMethodChange}
                            />
                          </div>
                        </div>
                        
                        {creditPaymentMethod && (
                          <div className="payment-form mt-4">
                            {creditPaymentMethod === 'upi' && (
                              <div className="upi-form">
                                <CFormInput
                                  type="text"
                                  placeholder="Enter UPI ID"
                                  className="mb-3"
                                />
                              </div>
                            )}
                            
                            {creditPaymentMethod === 'card' && (
                              <div className="card-form">
                                <CFormInput
                                  type="text"
                                  placeholder="Card Number"
                                  className="mb-2"
                                />
                                <CRow>
                                  <CCol md={6}>
                                    <CFormInput
                                      type="text"
                                      placeholder="MM/YY"
                                      className="mb-2"
                                    />
                                  </CCol>
                                  <CCol md={6}>
                                    <CFormInput
                                      type="text"
                                      placeholder="CVV"
                                      className="mb-2"
                                    />
                                  </CCol>
                                </CRow>
                              </div>
                            )}
                            
                            {creditPaymentMethod === 'netbanking' && (
                              <div className="netbanking-form">
                                <CFormSelect
                                  className="mb-3"
                                >
                                  <option value="">Select Bank</option>
                                  <option value="sbi">State Bank of India</option>
                                  <option value="hdfc">HDFC Bank</option>
                                  <option value="icici">ICICI Bank</option>
                                  <option value="axis">Axis Bank</option>
                                </CFormSelect>
                              </div>
                            )}
                            
                            <div className="d-flex justify-content-end mt-3">
                              <CButton
                                color="secondary"
                                variant="outline"
                                onClick={() => setShowPaymentOptions(false)}
                                className="me-2"
                              >
                                Cancel
                              </CButton>
                              <CButton
                                color="primary"
                                onClick={handleAddCredits}
                                disabled={isProcessingCredits}
                              >
                                {isProcessingCredits ? 'Processing...' : 'Add Credits'}
                              </CButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="subscription-settings">
                    <div className="toggle-wrapper mb-3">
                      <h4 className="toggle-title">Subscription payments</h4>
                      <div className="custom-toggle">
                        <CFormSwitch 
                          id="subscriptionSwitch" 
                          checked={autoPaySubscription}
                          onChange={() => setAutoPaySubscription(!autoPaySubscription)}
                          label=""
                        />
                      </div>
                    </div>
                    <p className="text-muted">Automatically pay for your subscriptions using credits.</p>
                    
                    <div className="toggle-wrapper mt-4 mb-3">
                      <h4 className="toggle-title">Notify low balance</h4>
                      <div className="custom-toggle">
                        <CFormSwitch 
                          id="lowBalanceSwitch" 
                          checked={notifyLowBalance}
                          onChange={() => setNotifyLowBalance(!notifyLowBalance)}
                          label=""
                        />
                      </div>
                    </div>
                    <p className="text-muted mb-3">Billing contacts will receive email notification when balance falls below:</p>
                    <div className="d-flex">
                      <div style={{ width: '120px' }}>
                        <CInputGroup>
                          <CInputGroupText>₹</CInputGroupText>
                          <CFormInput 
                            type="number" 
                            min="0" 
                            value={lowBalanceThreshold}
                            onChange={(e) => setLowBalanceThreshold(e.target.value)}
                            disabled={!notifyLowBalance}
                          />
                        </CInputGroup>
                      </div>
                      <CButton 
                        color="secondary" 
                        className="ms-2"
                        onClick={handleSaveThreshold}
                      >
                        Save
                      </CButton>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 3}>
              <div className="tab-content-wrapper">
                {/* Billing Tab Content */}
                <div className="billing-tab-content">
                  <h3 className="mb-4">Billing Details</h3>
                  
                  <div className="d-flex justify-content-center">
                    <CCard className="mb-4" style={{ width: '100%', maxWidth: 600, boxShadow: '0 2px 16px 0 rgba(44,62,80,.07)' }}>
                      <CCardBody>
                        <h4 className="mb-4 text-center fw-bold" style={{ letterSpacing: 0.2 }}>Billing information</h4>
                        <CForm id="billingForm">
                          <div className="mb-3">
                            <CFormLabel>Company name <span className="text-danger">*</span></CFormLabel>
                            <CFormInput type="text" placeholder="Enter company name" required />
                          </div>
                          <div className="mb-3">
                            <CFormLabel>GST number <span className="text-danger">*</span></CFormLabel>
                            <CFormInput type="text" placeholder="Enter GST number" required />
                          </div>
                          <div className="mb-3">
                            <CFormLabel>Address <span className="text-danger">*</span></CFormLabel>
                            <CFormInput type="text" placeholder="Address line 1" className="mb-2" required />
                            <CFormInput type="text" placeholder="Address line 2" />
                          </div>
                          <div className="row mb-3">
                            <div className="col-md-6 mb-3 mb-md-0">
                              <CFormLabel>City <span className="text-danger">*</span></CFormLabel>
                              <CFormInput type="text" placeholder="Enter city" required />
                            </div>
                            <div className="col-md-6">
                              <CFormLabel>State <span className="text-danger">*</span></CFormLabel>
                              <CFormSelect required>
                                <option value="">Select state</option>
                                {indianStates.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </CFormSelect>
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-md-6 mb-3 mb-md-0">
                              <CFormLabel>Country <span className="text-danger">*</span></CFormLabel>
                              <CFormSelect required>
                                <option value="">Select country</option>
                                {countries.map(country => (
                                  <option key={country} value={country}>{country}</option>
                                ))}
                              </CFormSelect>
                            </div>
                            <div className="col-md-6">
                              <CFormLabel>Postal code <span className="text-danger">*</span></CFormLabel>
                              <CFormInput type="text" placeholder="Enter postal code" required />
                            </div>
                          </div>
                          <div className="mb-4">
                            <CFormLabel>Email for invoices <span className="text-danger">*</span></CFormLabel>
                            <CFormInput type="email" placeholder="Enter email address" required />
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="custom-toggle">
                              <CFormSwitch 
                                label="Make default for all purchases" 
                                id="defaultBillingSwitch" 
                              />
                            </div>
                            <div>
                              <CButton color="light" className="me-2">Cancel</CButton>
                              <CButton 
                                color="primary" 
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                              </CButton>
                            </div>
                          </div>
                          {showSuccessMessage && (
                            <CAlert color="success" className="mt-4">
                              Billing details saved successfully.
                            </CAlert>
                          )}
                        </CForm>
                      </CCardBody>
                    </CCard>
                  </div>
                  <div className="d-flex justify-content-center">
                    <div style={{ width: '100%', maxWidth: 700 }}>
                      <div className="payment-history-section mt-4" style={{ border: '1px solid #d1d5db', borderRadius: 8, background: '#fff' }}>
                        <div className="py-3 px-4 border-bottom" style={{ borderBottom: '1px solid #d1d5db', fontWeight: 600, fontSize: 18, textAlign: 'center' }}>
                          Payment History
                        </div>
                        <div className="p-4 text-center" style={{ color: '#6b7280', fontSize: 16 }}>
                          No payment history available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            {/* Payment Requests Tab */}
            <CTabPane role="tabpanel" visible={activeKey === 4}>
              <PaymentRequests />
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>
      
      {/* Payment Modal */}
      <CModal 
        visible={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        className="payment-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Your Purchase</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {paymentSuccessful ? (
            <div className="text-center py-4">
              <div className="success-icon mb-3">
                <i className="success-check">✓</i>
              </div>
              <h4 className="mb-3">Payment Successful!</h4>
              <p>Your number has been purchased successfully.</p>
              <p className="mb-0">Redirecting back to overview...</p>
            </div>
          ) : (
            <>
              <div className="selected-number-info mb-4">
                <div className="number-label">Selected Number:</div>
                <div className="number-value">{selectedNumber?.number}</div>
              </div>
              
              <div className="payment-methods">
                <div className="method-item">
                  <CFormCheck 
                    type="radio"
                    id="payment-method-1"
                    name="paymentMethod"
                    value="creditCard"
                    checked={paymentMethod === 'creditCard'}
                    onChange={handlePaymentMethodChange}
                    className="custom-radio"
                  />
                  <CFormLabel htmlFor="payment-method-1" className="method-label">
                    Credit Card
                  </CFormLabel>
                </div>
                <div className="method-item">
                  <CFormCheck 
                    type="radio"
                    id="payment-method-2"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={handlePaymentMethodChange}
                    className="custom-radio"
                  />
                  <CFormLabel htmlFor="payment-method-2" className="method-label">
                    UPI
                  </CFormLabel>
                </div>
                <div className="method-item">
                  <CFormCheck 
                    type="radio"
                    id="payment-method-3"
                    name="paymentMethod"
                    value="netBanking"
                    checked={paymentMethod === 'netBanking'}
                    onChange={handlePaymentMethodChange}
                    className="custom-radio"
                  />
                  <CFormLabel htmlFor="payment-method-3" className="method-label">
                    Net Banking
                  </CFormLabel>
                </div>
              </div>
              
              {paymentMethod && (
                <div className="payment-summary mt-4">
                  <div className="summary-item d-flex justify-content-between">
                    <div className="item-label">Number Price:</div>
                    <div className="item-value">₹{selectedNumber?.price}</div>
                  </div>
                  <div className="summary-item d-flex justify-content-between">
                    <div className="item-label">Tax (18% GST):</div>
                    <div className="item-value">₹{(selectedNumber?.price * 0.18).toFixed(2)}</div>
                  </div>
                  <div className="summary-item d-flex justify-content-between fw-bold">
                    <div className="item-label">Total Amount:</div>
                    <div className="item-value">₹{(selectedNumber?.price * 1.18).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </CModalBody>
        {!paymentSuccessful && (
          <CModalFooter>
            <CButton 
              color="primary" 
              onClick={handlePaymentSubmit}
              disabled={isPaymentProcessing || !paymentMethod}
            >
              {isPaymentProcessing ? 'Processing...' : 'Confirm and Pay'}
            </CButton>
            <CButton 
              color="secondary" 
              onClick={() => setShowPaymentModal(false)}
              disabled={isPaymentProcessing}
            >
              Cancel
            </CButton>
          </CModalFooter>
        )}
      </CModal>
    </div>
  )
}

export default Billing
