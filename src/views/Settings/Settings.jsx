import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CFormInput,
  CButton,
  CFormSelect,
  CRow,
  CCol,
  CTable,
  CTableHead,
  CTableBody,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CFormCheck,
  CInputGroup,
  CInputGroupText,
  CFormLabel
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilBell, 
  cilLockLocked, 
  cilEnvelopeClosed, 
  cilUser, 
  cilPhone, 
  cilSpeech,
  cilSettings,
  cilClock,
  cilShieldAlt,
  cilBan,
  cilKey
} from '@coreui/icons'
import './Settings.css'

function Settings() {
  const [activeKey, setActiveKey] = useState(1)
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [workStartTime, setWorkStartTime] = useState('09:00')
  const [workEndTime, setWorkEndTime] = useState('18:00')
  const [breakStartTime, setBreakStartTime] = useState('13:00')
  const [breakEndTime, setBreakEndTime] = useState('14:00')
  
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }
  
  const isDaySelected = (day) => {
    return selectedDays.includes(day)
  }
  
  const handleSaveChanges = () => {
    // Handle saving changes here
    console.log({
      selectedDays,
      workTimes: { start: workStartTime, end: workEndTime },
      breakTimes: { start: breakStartTime, end: breakEndTime }
    })
  }
  
  return (
    <div className="settings-container">
      <CCard className="mb-4">
        <CCardBody>
          <CNav variant="tabs" role="tablist">
            <CNavItem>
              <CNavLink
                active={activeKey === 1}
                onClick={() => setActiveKey(1)}
                className="tab-link"
              >
                General
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 2}
                onClick={() => setActiveKey(2)}
                className="tab-link"
              >
                Calling
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 3}
                onClick={() => setActiveKey(3)}
                className="tab-link"
              >
                Account
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeKey === 4}
                onClick={() => setActiveKey(4)}
                className="tab-link"
              >
                Integrations
              </CNavLink>
            </CNavItem>
          </CNav>
          
          <CTabContent>
            <CTabPane role="tabpanel" visible={activeKey === 1}>
              <div className="settings-tab-content">
                <div className="general-card profile-card">
                  <h2 className="card-title">Profile</h2>
                  
                  <div className="profile-form">
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">First name</label>
                        <CFormInput 
                          placeholder="Enter first name" 
                          className="form-input"
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Last name</label>
                        <CFormInput 
                          placeholder="Enter last name" 
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <CFormInput 
                        placeholder="Enter email address" 
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Phone number</label>
                      <div className="phone-input-group">
                        <CFormSelect className="country-code-select">
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </CFormSelect>
                        <CFormInput 
                          placeholder="Enter phone number" 
                          className="phone-number-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <CFormSelect className="form-select">
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                      </CFormSelect>
                    </div>
                  </div>
                </div>
                
                <div className="general-card business-hours-card">
                  <h2 className="card-title">Business Hours</h2>
                  
                  <div className="business-hours-form">
                    <div className="form-group">
                      <label className="form-label">Working Days</label>
                      <div className="days-container">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <button 
                            key={day} 
                            className={`day-btn ${isDaySelected(day) ? 'active' : ''}`}
                            onClick={() => toggleDay(day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Work Timings</label>
                      <div className="time-container">
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={workStartTime}
                            onChange={(e) => setWorkStartTime(e.target.value)}
                            className="time-control"
                          />
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={workEndTime}
                            onChange={(e) => setWorkEndTime(e.target.value)}
                            className="time-control"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Break Timings</label>
                      <div className="time-container">
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={breakStartTime}
                            onChange={(e) => setBreakStartTime(e.target.value)}
                            className="time-control"
                          />
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={breakEndTime}
                            onChange={(e) => setBreakEndTime(e.target.value)}
                            className="time-control"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="save-changes-container">
                      <CButton 
                        color="primary" 
                        className="save-changes-btn"
                        onClick={handleSaveChanges}
                      >
                        Save Changes
                      </CButton>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 2}>
              <div className="settings-tab-content">
                <h2 className="settings-page-title">Virtual Numbers</h2>
                
                <div className="virtual-numbers-table-container">
                  <CTable hover className="virtual-numbers-table">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>NUMBER NAME</CTableHeaderCell>
                        <CTableHeaderCell>VIRTUAL NUMBER</CTableHeaderCell>
                        <CTableHeaderCell>LOCATION</CTableHeaderCell>
                        <CTableHeaderCell>CALLS</CTableHeaderCell>
                        <CTableHeaderCell>TYPE</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {/* You can add actual data rows here */}
                    </CTableBody>
                  </CTable>
                  
                  <div className="table-footer">
                    <div className="rows-per-page">
                      <span className="rows-text">Rows per page:</span>
                      <CFormSelect className="rows-select" size="sm">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </CFormSelect>
                    </div>
                    <div className="pagination-info">
                      1-1 of 1
                    </div>
                    <div className="pagination-controls">
                      <button className="pagination-button" disabled>
                        &lt;
                      </button>
                      <button className="pagination-button" disabled>
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
                
                <h2 className="settings-section-title">Connected to</h2>
                <div className="connected-to-section">
                  <div className="phone-input-group">
                    <CFormSelect className="country-code-select">
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </CFormSelect>
                    <CFormInput 
                      type="text"
                      placeholder="Enter phone number" 
                      defaultValue="9948220077"
                      className="phone-number-input"
                    />
                  </div>
                  <div className="save-button-container">
                    <CButton color="light" className="save-button">Save</CButton>
                  </div>
                </div>
                
                <h2 className="settings-section-title">Call settings</h2>
                <div className="browser-calling-section">
                  <div className="browser-calling-option">
                    <div className="option-text">
                      <h4 className="option-title">Browser calling</h4>
                      <p className="option-description">Make calls directly from desktop, without involving mobile phone.</p>
                    </div>
                    <div className="toggle-switch-container">
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked={true} />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 3}>
              <div className="settings-tab-content">
                {/* Call Attributes Section */}
                <div className="account-card">
                  <div className="account-card-header">
                    <span className="account-section-icon">📞</span>
                    <h2 className="account-section-title">Call Attributes</h2>
                  </div>
                  
                  <div className="account-section-content">
                    <div className="attribute-group">
                      <label className="attribute-label">Call Reason</label>
                      <div className="select-with-button">
                        <CFormSelect className="attribute-select">
                          <option value="">Select call reason...</option>
                          <option value="support">Support</option>
                          <option value="sales">Sales</option>
                          <option value="feedback">Feedback</option>
                        </CFormSelect>
                        <CButton color="primary" className="add-button">Add</CButton>
                      </div>
                    </div>
                    
                    <div className="attribute-group">
                      <label className="attribute-label">Call Outcome</label>
                      <div className="select-with-button">
                        <CFormSelect className="attribute-select">
                          <option value="">Select call outcome...</option>
                          <option value="resolved">Resolved</option>
                          <option value="followup">Follow-up required</option>
                          <option value="escalated">Escalated</option>
                        </CFormSelect>
                        <CButton color="primary" className="add-button">Add</CButton>
                      </div>
                    </div>
                    
                    <div className="attribute-group">
                      <label className="attribute-label">Custom Tags</label>
                      <CFormInput 
                        type="text" 
                        placeholder="Type and press Enter to create..." 
                        className="tags-input" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Notifications Section */}
                <div className="account-card">
                  <div className="account-card-header">
                    <span className="account-section-icon">🔔</span>
                    <h2 className="account-section-title">Notifications</h2>
                  </div>
                  
                  <div className="account-section-content">
                    <div className="notification-item">
                      <div className="notification-info">
                        <h3 className="notification-title">Call Records</h3>
                        <p className="notification-description">Receive notification when a new call is recorded</p>
                        <div className="notification-channels">
                          <span className="channel-label">Email</span>
                          <span className="channel-separator">•</span>
                          <span className="channel-label">SMS</span>
                          <span className="channel-separator">•</span>
                          <span className="channel-label">Push</span>
                        </div>
                      </div>
                      <div className="toggle-container">
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={true} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <h3 className="notification-title">Call Recording Database server</h3>
                        <p className="notification-description">Notify me when recordings that are of being uploaded</p>
                      </div>
                      <div className="toggle-container">
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={false} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Privacy & Security Section */}
                <div className="account-card">
                  <div className="account-card-header">
                    <span className="account-section-icon">🔒</span>
                    <h2 className="account-section-title">Privacy & Security</h2>
                  </div>
                  
                  <div className="account-section-content">
                    <div className="security-item">
                      <div className="security-info">
                        <h3 className="security-title">Require Recording</h3>
                        <p className="security-description">Mandate recording this week for privacy</p>
                      </div>
                      <div className="toggle-container">
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={false} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="security-item">
                      <div className="security-info">
                        <h3 className="security-title">Two Factor Authentication</h3>
                        <p className="security-description">Use an app or device verification code for all users</p>
                      </div>
                      <div className="toggle-container">
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={false} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Block List Section */}
                <div className="account-card">
                  <div className="account-card-header">
                    <span className="account-section-icon">🚫</span>
                    <h2 className="account-section-title">Block List</h2>
                  </div>
                  
                  <div className="account-section-content">
                    <div className="block-list-description">
                      <p>Block numbers from calling or messaging you</p>
                    </div>
                    <div className="block-list-action">
                      <CButton color="light" className="manage-button">Manage List</CButton>
                    </div>
                  </div>
                </div>
                
                {/* API Key Section */}
                <div className="account-card">
                  <div className="account-card-header">
                    <span className="account-section-icon">🔑</span>
                    <h2 className="account-section-title">API Key</h2>
                  </div>
                  
                  <div className="account-section-content">
                    <div className="api-key-input-container">
                      <CFormInput 
                        type="text" 
                        placeholder="Click the button to create API key..." 
                        className="api-key-input" 
                        disabled
                      />
                      <CButton color="primary" className="create-key-button">Create</CButton>
                    </div>
                    <div className="api-key-description">
                      <p className="api-key-note">This helps generate authentication codes for your API and applications that help for integration.</p>
                      <p className="api-key-note">Use <a href="#" className="api-key-link">API Help</a> / <a href="#" className="api-key-link">FAQs</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={activeKey === 4}>
              <div className="settings-tab-content">
                <h2 className="integrations-title">CRM Integrations</h2>
                
                <div className="integrations-grid">
                  <CRow className="mb-4">
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/hubspot_logo_icon_170209.png" alt="Hubspot" className="integration-image" />
                        </div>
                        <div className="integration-name">Hubspot</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/pipedrive.svg" alt="Pipedrive" className="integration-image" />
                        </div>
                        <div className="integration-name">Pipedrive</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/zoho-2.svg" alt="Zoho Phonebridge" className="integration-image" />
                        </div>
                        <div className="integration-name">Zoho Phonebridge</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/deskera.svg" alt="Deskera" className="integration-image" />
                        </div>
                        <div className="integration-name">Deskera</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                  </CRow>
                  
                  <CRow>
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/freshworks-1.svg" alt="Freshworks" className="integration-image" />
                        </div>
                        <div className="integration-name">Freshworks</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/microsoft-dynamics-365-1.svg" alt="Microsoft Dynamics 365" className="integration-image" />
                        </div>
                        <div className="integration-name">Microsoft Dynamics 365</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.worldvectorlogo.com/logos/salesforce-1.svg" alt="Salesforce" className="integration-image" />
                        </div>
                        <div className="integration-name">Salesforce</div>
                        <CButton color="light" className="integration-connect-btn">Connect</CButton>
                      </div>
                    </CCol>
                    
                    <CCol sm={6} md={3}>
                      <div className="integration-card">
                        <div className="integration-logo">
                          <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/viasocket_logo_icon_171159.png" alt="viaSocket" className="integration-image" />
                        </div>
                        <div className="integration-name">viaSocket</div>
                        <CButton color="primary" className="integration-connect-btn">Create Workflow</CButton>
                      </div>
                    </CCol>
                  </CRow>
                </div>
                
                <div className="integration-help-section">
                  <h3 className="integration-help-title">Need help with integrations?</h3>
                  <p className="integration-help-text">Our support team is here to help you set up and configure any CRM integration.</p>
                  <div className="text-center mt-3">
                    <CButton color="primary" variant="outline">Contact Support</CButton>
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

export default Settings
