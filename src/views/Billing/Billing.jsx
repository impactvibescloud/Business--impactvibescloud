import React, { useState, useEffect } from 'react'
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
  CFormSelect
} from '@coreui/react'
import './Billing.css'

function Billing() {
  const [activeKey, setActiveKey] = useState(1)
  
  useEffect(() => {
    // Check for URL params to determine active tab
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    
    if (tabParam === 'credits') {
      setActiveKey(2)
    } else if (tabParam === 'billing') {
      setActiveKey(3)
    }
  }, [])
  
  // Function to update URL when changing tabs
  const handleTabChange = (key) => {
    setActiveKey(key)
    const tabParam = key === 1 ? '' : key === 2 ? 'credits' : 'billing'
    
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
          </CNav>
          
          <CTabContent>
            <CTabPane role="tabpanel" visible={activeKey === 1}>
              <div className="tab-content-wrapper">
                {/* Plan Details Card */}
                <CCard className="plan-card mb-4">
                  <CCardBody>
                    <div className="plan-header d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3 className="plan-title">Professional Plan - Trial</h3>
                        <div className="plan-license">
                          <span className="trial-badge">Trial</span>
                        </div>
                      </div>
                      <CButton color="success" className="upgrade-btn">Upgrade</CButton>
                    </div>
                    
                    <div className="plan-expiry">
                      <div className="expiry-label">Your trial will end in</div>
                      <div className="expiry-value">13 days</div>
                    </div>
                    
                    <CRow className="plan-stats">
                      <CCol md={4}>
                        <div className="stat-item">
                          <span className="stat-label">Duration</span>
                          <span className="stat-value">0m</span>
                        </div>
                      </CCol>
                      <CCol md={4}>
                        <div className="stat-item">
                          <span className="stat-label">Total calls</span>
                          <span className="stat-value">0</span>
                        </div>
                      </CCol>
                      <CCol md={4}>
                        <div className="stat-item">
                          <span className="stat-label">Credit balance</span>
                          <span className="stat-value">₹0</span>
                        </div>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>
                
                {/* Numbers Card */}
                <CCard className="numbers-card mb-4">
                  <CCardBody>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="card-section-title mb-0">Numbers</h3>
                      <CButton color="primary" className="buy-number-btn">Buy Number</CButton>
                    </div>
                    
                    <div className="numbers-list">
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
                          <span className="number-count">1 India number</span>
                        </div>
                        <div className="ms-auto">
                          <CButton color="link" className="manage-btn">Manage</CButton>
                        </div>
                      </div>
                    </div>
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
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">CRM Integration</h5>
                            <p className="feature-description">Connect with your existing CRM</p>
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="feature-item">
                          <div className="feature-check-icon">
                            <span className="check-mark">✓</span>
                          </div>
                          <div>
                            <h5 className="feature-name">Mobile App</h5>
                            <p className="feature-description">Access on iOS and Android devices</p>
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
                <div className="credits-section">
                  <div className="credits-balance-container">
                    <div className="credits-label">Credits (INR)</div>
                    <div className="credits-balance">₹0</div>
                    <div className="credits-usage">
                      <a href="#" className="usage-link">View usage</a>
                    </div>
                  </div>
                  
                  <div className="credits-info-text">
                    Credits are used for calling and transcription. It can also be used for subscription payments.
                  </div>
                  
                  <div className="add-credits-section">
                    <h5 className="section-title">Add credits</h5>
                    <div className="add-credits-form">
                      <div className="input-with-button">
                        <CInputGroup>
                          <CInputGroupText>₹</CInputGroupText>
                          <CFormInput 
                            placeholder="Enter amount" 
                            className="amount-input"
                          />
                          <CButton color="primary" className="add-btn">Add</CButton>
                        </CInputGroup>
                      </div>
                    </div>
                  </div>
                  
                  <div className="subscription-section">
                    <h5 className="section-title">Subscription payments</h5>
                    <div className="subscription-option">
                      <div className="option-text">Automatically pay for your subscriptions using credits.</div>
                      <div className="toggle-container">
                        <CFormSwitch 
                          id="subscription-toggle" 
                          className="custom-switch"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="notification-section">
                    <h5 className="section-title">Notify low balance</h5>
                    <div className="notification-option">
                      <div className="option-text">Billing contacts will receive email notification when balance falls below:</div>
                      <div className="toggle-container">
                        <CFormSwitch 
                          id="notification-toggle" 
                          className="custom-switch"
                        />
                      </div>
                    </div>
                    <div className="threshold-input-container">
                      <CInputGroup>
                        <CInputGroupText>₹</CInputGroupText>
                        <CFormInput 
                          placeholder="0" 
                          className="threshold-input"
                        />
                        <CButton color="light" className="save-btn">Save</CButton>
                      </CInputGroup>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 3}>
              <div className="tab-content-wrapper">
                <div className="billing-section">
                  <div className="billing-header">
                    <h3 className="section-title mb-4">Billing Information</h3>
                  </div>
                  
                  {/* Billing Information Form */}
                  <div className="billing-info-form-section mb-5">
                    <h5 className="subsection-title">Company Information</h5>
                    <CCard className="billing-form-card mb-3">
                      <CCardBody>
                        <CRow className="mb-3">
                          <CCol md={12}>
                            <CFormLabel>Company name</CFormLabel>
                            <CFormInput
                              placeholder="Enter company name"
                            />
                          </CCol>
                        </CRow>
                        <CRow className="mb-3">
                          <CCol md={12}>
                            <CFormInput
                              label="Address"
                              placeholder="Address line 1"
                            />
                          </CCol>
                        </CRow>
                        <CRow className="mb-3">
                          <CCol md={12}>
                            <CFormInput
                              placeholder="Address line 2"
                            />
                          </CCol>
                        </CRow>
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel>City</CFormLabel>
                            <CFormInput
                              placeholder="Enter city name"
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel>ZIP Code</CFormLabel>
                            <CFormInput
                              placeholder="Enter ZIP code"
                            />
                          </CCol>
                        </CRow>
                        <CRow className="mb-3">
                          <CCol md={6}>
                            <CFormLabel>State</CFormLabel>
                            <CFormSelect
                              placeholder="State"
                              className="form-select"
                            >
                              <option value="">Select state</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Maharashtra">Maharashtra</option>
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Delhi">Delhi</option>
                            </CFormSelect>
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel>Country</CFormLabel>
                            <CFormSelect
                              placeholder="Country"
                              className="form-select"
                              value="India"
                            >
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                            </CFormSelect>
                          </CCol>
                        </CRow>
                        <CRow className="mb-3">
                          <CCol md={12}>
                            <CFormInput
                              label="GST number"
                              placeholder="Enter GST number"
                            />
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol>
                            <CButton color="primary" className="save-changes-btn">
                              Save changes
                            </CButton>
                          </CCol>
                        </CRow>
                      </CCardBody>
                    </CCard>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="payment-methods-section mb-5">
                    <h5 className="subsection-title">Payment Methods</h5>
                    <CCard className="payment-methods-card mb-3">
                      <CCardBody className="p-0">
                        <div className="payment-method-item">
                          <div className="payment-method-details d-flex align-items-center">
                            <div className="payment-method-icon me-3">
                              <i className="cil-credit-card fs-4"></i>
                            </div>
                            <div className="payment-method-info">
                              <div className="payment-method-name">Credit/Debit Card</div>
                              <div className="payment-method-number">**** **** **** 4242</div>
                            </div>
                            <div className="ms-auto">
                              <CButton color="link" className="edit-btn">Edit</CButton>
                            </div>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                    <CButton color="primary" variant="outline" className="add-method-btn">
                      Add Payment Method
                    </CButton>
                  </div>
                  
                  {/* Billing History */}
                  <div className="billing-history-section">
                    <h5 className="subsection-title">Billing History</h5>
                    <CCard className="billing-history-card">
                      <CCardBody className="p-0">
                        {/* Table Header */}
                        <div className="billing-history-header d-flex p-3 border-bottom">
                          <div className="col-3 fw-bold">Date</div>
                          <div className="col-4 fw-bold">Description</div>
                          <div className="col-2 fw-bold">Amount</div>
                          <div className="col-3 fw-bold text-center">Receipt</div>
                        </div>
                        
                        {/* Table Content - No transactions yet */}
                        <div className="billing-history-empty p-4 text-center">
                          <div className="empty-icon mb-3">
                            <i className="cil-list fs-1 text-muted"></i>
                          </div>
                          <div className="empty-message mb-2">No billing history available</div>
                          <div className="empty-description text-muted">
                            Your transaction history will appear here
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </div>
                </div>
              </div>
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Billing
