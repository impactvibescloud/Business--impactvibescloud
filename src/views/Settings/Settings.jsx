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
  CFormLabel,
  CBadge,
  CBadgeProps
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
  cilKey,
  cilX,
  cilCheck,
  cilLink
} from '@coreui/icons'
import './Settings.css'

function Settings() {
  const [activeKey, setActiveKey] = useState(1)
  const [selectedDays, setSelectedDays] = useState([])
  const [workStartTime, setWorkStartTime] = useState('00:00')
  const [workEndTime, setWorkEndTime] = useState('00:00')
  const [breakStartTime, setBreakStartTime] = useState('00:00')
  const [breakEndTime, setBreakEndTime] = useState('00:00')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSuccess, setContactSuccess] = useState(false)
  
  // Form values for user profile
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+1',
    phoneNumber: '',
    role: ''
  })
  
  // Integrations data with categories
  const integrations = [
    {
      id: 1,
      name: 'Hubspot',
      category: 'crm',
      logo: 'https://www.vectorlogo.zone/logos/hubspot/hubspot-ar21.svg',
      isConnected: true,
      description: 'CRM, marketing, and sales platform'
    },
    {
      id: 2,
      name: 'Pipedrive',
      category: 'crm',
      logo: 'https://www.vectorlogo.zone/logos/pipedrive/pipedrive-ar21.svg',
      isConnected: false,
      description: 'Sales pipeline management tool'
    },
    {
      id: 3,
      name: 'Zoho CRM',
      category: 'crm',
      logo: 'https://www.vectorlogo.zone/logos/zoho/zoho-ar21.svg',
      isConnected: true,
      description: 'Customer relationship management platform'
    },
    {
      id: 4,
      name: 'Zendesk',
      category: 'support',
      logo: 'https://www.vectorlogo.zone/logos/zendesk/zendesk-ar21.svg',
      isConnected: false,
      description: 'Customer service and support ticketing system'
    },
    {
      id: 5,
      name: 'Freshworks',
      category: 'support',
      logo: 'https://www.vectorlogo.zone/logos/freshdesk/freshdesk-ar21.svg',
      isConnected: false,
      description: 'Customer engagement solutions'
    },
    {
      id: 6,
      name: 'Microsoft Dynamics 365',
      category: 'crm',
      logo: 'https://www.vectorlogo.zone/logos/microsoft_dynamics365/microsoft_dynamics365-ar21.svg',
      isConnected: false,
      description: 'Business applications suite'
    },
    {
      id: 7,
      name: 'Salesforce',
      category: 'crm',
      logo: 'https://www.vectorlogo.zone/logos/salesforce/salesforce-ar21.svg',
      isConnected: false,
      description: 'Cloud-based CRM platform'
    },
    {
      id: 8,
      name: 'Zapier',
      category: 'automation',
      logo: 'https://www.vectorlogo.zone/logos/zapier/zapier-ar21.svg',
      isConnected: true,
      description: 'Connect apps and automate workflows'
    },
    {
      id: 9,
      name: 'Slack',
      category: 'communication',
      logo: 'https://www.vectorlogo.zone/logos/slack/slack-ar21.svg',
      isConnected: false,
      description: 'Business communication platform'
    },
    {
      id: 10,
      name: 'Trello',
      category: 'productivity',
      logo: 'https://www.vectorlogo.zone/logos/trello/trello-ar21.svg',
      isConnected: false,
      description: 'Project management tool'
    },
    {
      id: 11,
      name: 'Asana',
      category: 'productivity',
      logo: 'https://www.vectorlogo.zone/logos/asana/asana-ar21.svg',
      isConnected: false,
      description: 'Work management platform'
    },
    {
      id: 12,
      name: 'Shopify',
      category: 'ecommerce',
      logo: 'https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg',
      isConnected: false,
      description: 'E-commerce platform'
    },
    {
      id: 13,
      name: 'WooCommerce',
      category: 'ecommerce',
      logo: 'https://www.vectorlogo.zone/logos/woocommerce/woocommerce-ar21.svg',
      isConnected: false,
      description: 'E-commerce plugin for WordPress'
    },
    {
      id: 14,
      name: 'Mailchimp',
      category: 'marketing',
      logo: 'https://www.vectorlogo.zone/logos/mailchimp/mailchimp-ar21.svg',
      isConnected: false,
      description: 'Marketing automation platform'
    },
    {
      id: 15,
      name: 'Google Analytics',
      category: 'analytics',
      logo: 'https://www.vectorlogo.zone/logos/google_analytics/google_analytics-ar21.svg',
      isConnected: false,
      description: 'Web analytics service'
    },
    {
      id: 16,
      name: 'n8n',
      category: 'automation',
      logo: 'https://www.vectorlogo.zone/logos/n8n_io/n8n_io-ar21.svg',
      isConnected: false,
      description: 'Workflow automation tool',
      primaryAction: true
    }
  ]
  
  // Filter integrations based on search query and selected category
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = searchQuery === '' || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      integration.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }
  
  // Handle category filter change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
  }
  
  // Clear all filters and search
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
  }
  
  // Filter by clicking on category badge
  const filterByCategory = (category) => {
    setSelectedCategory(category)
  }
  
  // Function to get category display name
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'crm': 'CRM',
      'marketing': 'Marketing',
      'productivity': 'Productivity',
      'ecommerce': 'E-commerce',
      'analytics': 'Analytics',
      'automation': 'Automation',
      'support': 'Support',
      'communication': 'Communication'
    }
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }
  
  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.onerror = null
    e.target.style.opacity = '0.85'
    e.target.style.filter = 'grayscale(0.4)'
    
    // Get the parent element's text to determine which logo to use
    const parentElement = e.target.closest('.integration-card')
    const integrationName = parentElement ? 
      parentElement.querySelector('.integration-name')?.textContent.toLowerCase() : ''
    
    // Try to provide a specific fallback based on the integration name
    if (integrationName.includes('hubspot')) {
      e.target.src = 'https://cdn-icons-png.flaticon.com/512/5968/5968872.png'
    } else if (integrationName.includes('salesforce')) {
      e.target.src = 'https://cdn-icons-png.flaticon.com/512/5968/5968914.png'
    } else if (integrationName.includes('zoho')) {
      e.target.src = 'https://cdn-icons-png.flaticon.com/512/2649/2649205.png'
    } else if (integrationName.includes('freshworks') || integrationName.includes('freshdesk')) {
      e.target.src = 'https://cdn-icons-png.flaticon.com/512/6125/6125764.png'
    } else {
      // Generic fallback
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWltYWdlIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg=='
    }
  }
  
  // Virtual Numbers state
  const [virtualNumbers, setVirtualNumbers] = useState([
    {
      id: 1,
      name: 'Sales Support',
      number: '+91 98765 43210',
      location: 'Mumbai, India',
      calls: 427,
      type: 'Toll-Free',
    }
  ])
  
  // Call Attributes state
  const [selectedCallReason, setSelectedCallReason] = useState('')
  const [addedCallReasons, setAddedCallReasons] = useState([])
  const [selectedCallOutcome, setSelectedCallOutcome] = useState('')
  const [addedCallOutcomes, setAddedCallOutcomes] = useState([])
  
  const callReasonOptions = [
    'Select call reason',
    'Inquiry',
    'Update',
    'Feedback',
    'Support',
    'Confirmation',
    'Request',
    'Follow-up',
    'Complaint',
    'Assistance',
    'Scheduling'
  ]
  
  const callOutcomeOptions = [
    'Select call outcome',
    'Resolved',
    'Follow-up required',
    'Escalated',
    'Information provided',
    'Transfer to another department',
    'Callback scheduled',
    'Customer satisfied',
    'No solution available'
  ]
  
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
      formValues,
      selectedDays,
      workTimes: { start: workStartTime, end: workEndTime },
      breakTimes: { start: breakStartTime, end: breakEndTime }
    })
    
    // Show success message
    setShowSuccessMessage(true)
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }
  
  const handleFormChange = (field, value) => {
    setFormValues({
      ...formValues,
      [field]: value
    })
  }
  
  // API Key functions
  const generateApiKey = () => {
    // Generate a random API key
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 24; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Format the key with dashes
    const formattedKey = `${key.slice(0, 8)}-${key.slice(8, 16)}-${key.slice(16, 24)}`;
    setApiKey(formattedKey);
    setShowApiKey(true);
  }
  
  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
        .then(() => {
          // Could add a toast notification here if you have a notification system
          console.log('API key copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy API key: ', err);
        });
    }
  }
  
  // Call Attributes functions
  const handleAddCallReason = () => {
    if (selectedCallReason && selectedCallReason !== 'Select call reason' && !addedCallReasons.includes(selectedCallReason)) {
      setAddedCallReasons([...addedCallReasons, selectedCallReason])
      setSelectedCallReason('Select call reason')
    }
  }
  
  const handleRemoveCallReason = (reason) => {
    setAddedCallReasons(addedCallReasons.filter(r => r !== reason))
  }
  
  const handleAddCallOutcome = () => {
    if (selectedCallOutcome && selectedCallOutcome !== 'Select call outcome' && !addedCallOutcomes.includes(selectedCallOutcome)) {
      setAddedCallOutcomes([...addedCallOutcomes, selectedCallOutcome])
      setSelectedCallOutcome('Select call outcome')
    }
  }
  
  const handleRemoveCallOutcome = (outcome) => {
    setAddedCallOutcomes(addedCallOutcomes.filter(o => o !== outcome))
  }
  
  // Handle integration button click
  const handleIntegrationClick = (integration) => {
    // If connected, go to management page
    // If not connected, go to connection page
    // If primary action, go to workflow creation
    
    let url = '';
    const baseUrls = {
      'hubspot': 'https://www.hubspot.com',
      'pipedrive': 'https://www.pipedrive.com',
      'zoho crm': 'https://www.zoho.com/crm',
      'zendesk': 'https://www.zendesk.com',
      'freshworks': 'https://www.freshworks.com',
      'microsoft dynamics 365': 'https://dynamics.microsoft.com',
      'salesforce': 'https://www.salesforce.com',
      'zapier': 'https://zapier.com',
      'slack': 'https://slack.com',
      'trello': 'https://trello.com',
      'asana': 'https://asana.com',
      'shopify': 'https://www.shopify.com',
      'woocommerce': 'https://woocommerce.com',
      'mailchimp': 'https://mailchimp.com',
      'google analytics': 'https://analytics.google.com',
      'n8n': 'https://n8n.io'
    };
    
    const integrationName = integration.name.toLowerCase();
    const baseUrl = baseUrls[integrationName] || `https://www.google.com/search?q=${integration.name}`;
    
    if (integration.primaryAction) {
      // For workflow creation
      if (integrationName === 'zapier') {
        url = `${baseUrl}/app/editor`;
      } else if (integrationName === 'n8n') {
        url = `${baseUrl}/workflow`;
      } else {
        url = `${baseUrl}/integrations`;
      }
    } else if (integration.isConnected) {
      // For managing existing connections
      url = `${baseUrl}/dashboard`;
    } else {
      // For new connections
      url = `${baseUrl}/signup`;
    }
    
    // Open the URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  
  // Contact form handling
  const handleContactFormChange = (field, value) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleContactSupport = () => {
    setShowContactForm(true)
    setContactSuccess(false)
  }
  
  const handleSubmitContactForm = (e) => {
    e.preventDefault()
    // Here you would typically send the form data to a server
    // For now, we'll just show the success message
    setContactSuccess(true)
    setShowContactForm(false)
    
    // Reset the form
    setContactForm({
      name: '',
      email: '',
      message: ''
    })
  }
  
  const handleCloseContactForm = () => {
    setShowContactForm(false)
  }
  
  // Integrations data is already defined above
  
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
          </CNav>
          
          <CTabContent>
            <CTabPane role="tabpanel" visible={activeKey === 1}>
              <div className="settings-tab-content">
                <div className="general-card profile-card">
                  <h2 className="card-title">Profile</h2>
                  
                  <div className="profile-form">
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">First name<span className="required-mark">*</span></label>
                        <CFormInput 
                          placeholder="Enter first name" 
                          className="form-input"
                          required
                          value={formValues.firstName}
                          onChange={(e) => handleFormChange('firstName', e.target.value)}
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Last name<span className="required-mark">*</span></label>
                        <CFormInput 
                          placeholder="Enter last name" 
                          className="form-input"
                          required
                          value={formValues.lastName}
                          onChange={(e) => handleFormChange('lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email<span className="required-mark">*</span></label>
                      <CFormInput 
                        placeholder="Enter email address" 
                        className="form-input"
                        type="email"
                        required
                        value={formValues.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Phone number<span className="required-mark">*</span></label>
                      <div className="phone-input-group">
                        <CFormSelect 
                          className="country-code-select"
                          value={formValues.countryCode}
                          onChange={(e) => handleFormChange('countryCode', e.target.value)}
                          required
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </CFormSelect>
                        <CFormInput 
                          placeholder="Enter phone number" 
                          className="phone-number-input"
                          required
                          value={formValues.phoneNumber}
                          onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Role<span className="required-mark">*</span></label>
                      <CFormSelect 
                        className="form-select"
                        required
                        value={formValues.role}
                        onChange={(e) => handleFormChange('role', e.target.value)}
                      >
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
                      <label className="form-label">Working Days<span className="required-mark">*</span></label>
                      <div className="days-container">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <button 
                            key={day} 
                            className={`day-btn ${isDaySelected(day) ? 'active' : ''}`}
                            onClick={() => toggleDay(day)}
                            type="button"
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {selectedDays.length === 0 && (
                        <div className="days-validation-message">Please select at least one working day</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Work Timings<span className="required-mark">*</span></label>
                      <div className="time-container">
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={workStartTime}
                            onChange={(e) => setWorkStartTime(e.target.value)}
                            className="time-control"
                            required
                          />
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={workEndTime}
                            onChange={(e) => setWorkEndTime(e.target.value)}
                            className="time-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Break Timings<span className="required-mark">*</span></label>
                      <div className="time-container">
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={breakStartTime}
                            onChange={(e) => setBreakStartTime(e.target.value)}
                            className="time-control"
                            required
                          />
                        </div>
                        <span className="time-separator">to</span>
                        <div className="time-input">
                          <CFormInput 
                            type="time" 
                            value={breakEndTime}
                            onChange={(e) => setBreakEndTime(e.target.value)}
                            className="time-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {showSuccessMessage && (
                      <div className="success-message">
                        Settings saved successfully!
                      </div>
                    )}
                    
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
                      {virtualNumbers.map((number) => (
                        <CTableRow key={number.id}>
                          <CTableDataCell>{number.name}</CTableDataCell>
                          <CTableDataCell>{number.number}</CTableDataCell>
                          <CTableDataCell>{number.location}</CTableDataCell>
                          <CTableDataCell>{number.calls}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="info" shape="rounded-pill" className="type-badge">
                              {number.type}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
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
                      1-{virtualNumbers.length} of {virtualNumbers.length}
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
                      className="phone-number-input"
                    />
                  </div>
                  <div className="save-button-container">
                    <CButton 
                      color="primary" 
                      className="save-button" 
                      onClick={() => {
                        setShowSuccessMessage(true);
                        setTimeout(() => setShowSuccessMessage(false), 3000);
                      }}
                    >
                      Save
                    </CButton>
                  </div>
                  {showSuccessMessage && (
                    <div className="mt-2 success-message">
                      <CIcon icon={cilCheck} className="me-1" />
                      Connected number saved successfully
                    </div>
                  )}
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
                        <CFormSelect className="attribute-select" value={selectedCallReason} onChange={(e) => setSelectedCallReason(e.target.value)}>
                          {callReasonOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </CFormSelect>
                        <CButton color="primary" className="add-button" onClick={handleAddCallReason}>Add</CButton>
                      </div>
                      
                      <div className="added-attributes">
                        {addedCallReasons.map((reason, index) => (
                          <CBadge 
                            key={index} 
                            color="primary" 
                            className="added-attribute-badge"
                            onClick={() => handleRemoveCallReason(reason)}
                          >
                            {reason} <CIcon icon={cilX} className="remove-icon" />
                          </CBadge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="attribute-group">
                      <label className="attribute-label">Call Outcome</label>
                      <div className="select-with-button">
                        <CFormSelect className="attribute-select" value={selectedCallOutcome} onChange={(e) => setSelectedCallOutcome(e.target.value)}>
                          {callOutcomeOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </CFormSelect>
                        <CButton color="primary" className="add-button" onClick={handleAddCallOutcome}>Add</CButton>
                      </div>
                      
                      <div className="added-attributes">
                        {addedCallOutcomes.map((outcome, index) => (
                          <CBadge 
                            key={index} 
                            color="primary" 
                            className="added-attribute-badge"
                            onClick={() => handleRemoveCallOutcome(outcome)}
                          >
                            {outcome} <CIcon icon={cilX} className="remove-icon" />
                          </CBadge>
                        ))}
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
                        disabled={!showApiKey}
                        readOnly={showApiKey}
                        value={apiKey}
                      />
                      {!showApiKey && <CButton color="primary" className="create-key-button" onClick={generateApiKey}>Create</CButton>}
                    </div>
                    <div className="api-key-actions">
                      {showApiKey && 
                        <CButton color="secondary" className="copy-key-button" onClick={copyApiKey}>
                          Copy Key
                        </CButton>
                      }
                    </div>
                    <div className="api-key-description">
                      <p className="api-key-note">This helps generate authentication codes for your API and applications that help for integration.</p>
                      <p className="api-key-note">Use <a href="#" className="api-key-link">API Help</a> / <a href="#" className="api-key-link">FAQs</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </CTabPane>
            
            <CTabPane role="tabpanel" visible={false}>
              <div className="settings-tab-content">
                <h2 className="integrations-title">CRM & Business Integrations</h2>
                
                {/* Search and filter bar */}
                <div className="integration-search-container">
                  <div className="search-box">
                    <CIcon icon={cilSpeech} className="search-icon" />
                    <CFormInput 
                      type="text"
                      placeholder="Search integrations..."
                      className="integration-search-input"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="integration-filter">
                    <CFormSelect 
                      className="integration-filter-select"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                    >
                      <option value="all">All Categories</option>
                      <option value="crm">CRM</option>
                      <option value="marketing">Marketing</option>
                      <option value="productivity">Productivity</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="analytics">Analytics</option>
                      <option value="automation">Automation</option>
                      <option value="support">Support</option>
                      <option value="communication">Communication</option>
                    </CFormSelect>
                  </div>
                </div>
                
                <div className="integration-results-counter">
                  Showing {filteredIntegrations.length} {filteredIntegrations.length === 1 ? 'integration' : 'integrations'}
                  {selectedCategory !== 'all' ? ` in ${getCategoryDisplayName(selectedCategory)}` : ''}
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </div>
                
                <div className="integrations-grid">
                  {filteredIntegrations.length === 0 ? (
                    <div className="no-integrations-found">
                      <div className="no-results-icon">🔍</div>
                      <h3>No integrations found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    <CRow className="mb-4">
                      {filteredIntegrations.map((integration, index) => (
                        <CCol sm={6} md={3} key={integration.id} className={index % 4 === 3 && index !== filteredIntegrations.length - 1 ? 'mb-4' : ''}>
                          <div className="integration-card">
                            <div className="integration-category-badge">
                              {getCategoryDisplayName(integration.category)}
                            </div>
                            <div className="integration-logo">
                              <img 
                                src={integration.logo} 
                                alt={integration.name} 
                                className="integration-image" 
                                onError={handleImageError}
                              />
                            </div>
                            <div className="integration-name">{integration.name}</div>
                            {integration.isConnected && (
                              <div className="integration-status">
                                <CIcon icon={cilCheck} size="sm" /> Connected
                              </div>
                            )}
                            <CButton 
                              color="primary"
                              className={`integration-connect-btn ${integration.isConnected ? 'connected' : ''}`}
                              onClick={() => handleIntegrationClick(integration)}
                            >
                              {integration.primaryAction ? "Create Workflow" : integration.isConnected ? "Manage" : "Connect"}
                            </CButton>
                          </div>
                        </CCol>
                      ))}
                    </CRow>
                  )}
                </div>
                
                <div className="missing-integration-section">
                  <h3 className="missing-integration-title">Don't see what you're looking for?</h3>
                  <p className="missing-integration-text">If you need to integrate with a system that's not listed, let us know and we'll help you connect it.</p>
                  <div className="text-center mt-3">
                    {!showContactForm && !contactSuccess && (
                      <CButton 
                        color="primary" 
                        variant="outline" 
                        onClick={() => setShowContactForm(true)}
                      >
                        Contact Support
                      </CButton>
                    )}
                  </div>
                  
                  {/* Contact Support Form */}
                  {showContactForm && !contactSuccess && (
                    <div className="contact-support-form">
                      <h4 className="contact-form-title">Contact Support</h4>
                      <CFormInput
                        className="mb-3"
                        placeholder="Your Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                      <CFormInput
                        className="mb-3"
                        type="email"
                        placeholder="Your Email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                      <CFormInput
                        as="textarea"
                        rows={4}
                        className="mb-3"
                        placeholder="Describe the integration you need"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                      />
                      <div className="d-flex justify-content-between">
                        <CButton 
                          color="secondary" 
                          variant="outline"
                          onClick={() => setShowContactForm(false)}
                        >
                          Cancel
                        </CButton>
                        <CButton 
                          color="primary"
                          onClick={() => {
                            // Here you would typically send the form data to your backend
                            console.log('Contact form submitted:', contactForm);
                            setContactSuccess(true);
                            setShowContactForm(false);
                          }}
                        >
                          Submit Request
                        </CButton>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Message */}
                  {contactSuccess && (
                    <div className="contact-success-message">
                      <div className="success-icon">
                        <CIcon icon={cilCheck} size="xl" className="text-success" />
                      </div>
                      <h4>Request Submitted!</h4>
                      <p>Thank you for your integration request. Our support team will review it and contact you shortly.</p>
                      <CButton 
                        color="primary" 
                        variant="outline"
                        onClick={() => {
                          setContactSuccess(false);
                          setContactForm({ name: '', email: '', message: '' });
                        }}
                      >
                        Submit Another Request
                      </CButton>
                    </div>
                  )}
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
