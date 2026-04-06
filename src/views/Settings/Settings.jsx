import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  FormControl,
  InputLabel
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PhoneIcon from '@mui/icons-material/Phone'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import LockIcon from '@mui/icons-material/Lock'
import './Settings.css'
import axios from 'axios'
import { isAutheticated } from 'src/auth'

function Settings() {
  const [activeKey, setActiveKey] = useState(1)
  const [selectedDays, setSelectedDays] = useState([])
  const [workStartTime, setWorkStartTime] = useState('00:00')
  const [workEndTime, setWorkEndTime] = useState('00:00')
  const [breakStartTime, setBreakStartTime] = useState('00:00')
  const [breakEndTime, setBreakEndTime] = useState('00:00')
  // Business fields to PATCH
  const [businessName, setBusinessName] = useState('')
  const [contactPersonName, setContactPersonName] = useState('')
  const [contactPersonEmail, setContactPersonEmail] = useState('')
  const [contactPersonPhone, setContactPersonPhone] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [country, setCountry] = useState('')
  const [stateName, setStateName] = useState('')
  const [city, setCity] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [pincode, setPincode] = useState('')
  const [status, setStatus] = useState('Active')
  const [ivrEnabled, setIvrEnabled] = useState(true)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('')
  const [creatingMaster, setCreatingMaster] = useState(false)
  const [masterMessage, setMasterMessage] = useState(null)
  const [showMasterPasswordField, setShowMasterPasswordField] = useState(false)
  const [showConfirmMasterPasswordField, setShowConfirmMasterPasswordField] = useState(false)
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
    countryCode: '+91',
    phoneNumber: '',
    role: ''
  })

  // Call Settings state
  const [supervisorNumber, setSupervisorNumber] = useState('')
  const [supervisorNumberDetails, setSupervisorNumberDetails] = useState(null)
  const [selectedSupervisorNumber, setSelectedSupervisorNumber] = useState('')
  const [assignedNumbers, setAssignedNumbers] = useState([])
  const [sipPassword, setSipPassword] = useState('')
  const [loadingCallSettings, setLoadingCallSettings] = useState(false)
  const [savingCallSettings, setSavingCallSettings] = useState(false)
  const [callSettingsMessage, setCallSettingsMessage] = useState(null)
  
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

  // Fetch existing business details and prefill form
  useEffect(() => {
    const load = async () => {
      const businessId = localStorage.getItem('businessId') || ''
      if (!businessId) return
      const token = localStorage.getItem('authToken') || isAutheticated()
      try {
        const res = await axios.get(`/api/businesses/get_one/${encodeURIComponent(businessId)}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const data = res?.data?.data || res?.data || null
        if (!data) return
        // map contact person to form values
        const contact = data.contactPerson || {}
        const fullName = contact.name || ''
        const parts = fullName.trim().split(' ')
        const first = parts.length ? parts[0] : ''
        const last = parts.length > 1 ? parts.slice(1).join(' ') : ''
        setFormValues((prev) => ({ ...prev, firstName: first, lastName: last, email: contact.email || '', phoneNumber: contact.phone || '' }))

        setBusinessName(data.businessName || '')
        setGstNumber(data.gstNumber || '')
        setCountry(data.country || '')
        setStateName(data.state || '')
        setCity(data.city || '')
        setAddress1(data.address1 || '')
        setAddress2(data.address2 || '')
        setPincode(data.pincode || '')
        setStatus(data.status || 'Active')
        setIvrEnabled(Boolean(data.ivrEnabled))

        // business hours
        try {
          const bh = data.businessHours || {}
          if (bh.start) setWorkStartTime(bh.start)
          if (bh.end) setWorkEndTime(bh.end)
        } catch (e) {}

        // business days -> selectedDays array
        try {
          const bd = data.businessDays || {}
          const revMap = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
          const days = []
          Object.keys(revMap).forEach(k => {
            const v = bd[k]
            if (v === '1' || v === 1 || v === true || String(v) === 'true') days.push(revMap[k])
          })
          setSelectedDays(days)
        } catch (e) {}
      } catch (err) {
        console.error('Failed to load business settings', err)
      }
    }
    load()
  }, [])
  
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
    // Save to API
    saveBusinessSettings()
  }

  const buildBusinessDaysPayload = () => {
    const map = { Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed', Thursday: 'thu', Friday: 'fri', Saturday: 'sat', Sunday: 'sun' }
    const out = {}
    Object.keys(map).forEach((day) => {
      out[map[day]] = selectedDays.includes(day) ? '1' : '0'
    })
    return out
  }

  const saveBusinessSettings = async () => {
    const businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      console.error('Missing businessId in localStorage')
      return
    }
    const token = localStorage.getItem('authToken') || isAutheticated()
    const payload = {
      businessName: businessName || formValues.firstName || '',
      contactPersonName: contactPersonName || `${formValues.firstName || ''} ${formValues.lastName || ''}`.trim(),
      contactPersonEmail: contactPersonEmail || formValues.email || '',
      contactPersonPhone: contactPersonPhone || formValues.phoneNumber || '',
      gstNumber: gstNumber || '',
      country: country || '',
      state: stateName || '',
      city: city || '',
      address1: address1 || '',
      address2: address2 || '',
      pincode: pincode || '',
      status: status || 'Active',
      ivrEnabled: !!ivrEnabled,
      businessHours: { start: workStartTime, end: workEndTime },
      businessDays: buildBusinessDaysPayload(),
    }

    try {
      setSavingBusiness(true)
      const res = await axios.patch(`/api/businesses/edit/${encodeURIComponent(businessId)}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      if (res && (res.data && (res.data.success || res.data.updated) || res.status === 200)) {
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        console.error('Failed to save business settings', res)
      }
    } catch (err) {
      console.error('Error saving business settings', err)
    } finally {
      setSavingBusiness(false)
    }
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

  // Master password functions
  const createMasterPassword = async () => {
    const businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      setMasterMessage({ type: 'error', text: 'Missing businessId in localStorage' })
      return
    }
    if (!masterPassword) {
      setMasterMessage({ type: 'error', text: 'Please enter a master password' })
      return
    }
    if (masterPassword !== confirmMasterPassword) {
      setMasterMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    try {
      setCreatingMaster(true)
      setMasterMessage(null)
      const token = localStorage.getItem('authToken') || isAutheticated()
      const res = await axios.post(`/api/business/${encodeURIComponent(businessId)}/master-password`, { masterPassword }, {
        headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
      })
      if (res && (res.status === 200 || (res.data && res.data.success))) {
        setMasterMessage({ type: 'success', text: 'Master password created successfully' })
        setMasterPassword('')
        setConfirmMasterPassword('')
      } else {
        setMasterMessage({ type: 'error', text: (res?.data?.message) || 'Failed to create master password' })
      }
    } catch (err) {
      setMasterMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Request failed' })
    } finally {
      setCreatingMaster(false)
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

  // Call Settings functions
  const fetchCallSettings = async () => {
    const businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      setCallSettingsMessage({ type: 'error', text: 'Business ID not found' })
      return
    }

    setLoadingCallSettings(true)
    try {
      const token = localStorage.getItem('authToken') || isAutheticated()
      
      // Fetch supervisor number and assigned numbers in parallel
      const [supervisorRes, numbersRes] = await Promise.all([
        axios.get(
          `/api/businesses/${encodeURIComponent(businessId)}/supervisor-number`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
          }
        ).catch(err => {
          console.warn('Failed to fetch supervisor number details:', err)
          return { data: {} }
        }),
        axios.get(
          `/api/businesses/${encodeURIComponent(businessId)}/assigned-numbers`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
          }
        )
      ])
      
      // Get supervisor number from the dedicated endpoint
      const supervisorNumberFromEndpoint = supervisorRes?.data?.supervisorNumber || ''
      const supervisorDetailsFromEndpoint = supervisorRes?.data?.numberDetails || null
      const supervisorNumberFromList = numbersRes?.data?.currentSupervisorNumber || ''
      const currentSupervisor = supervisorNumberFromEndpoint || supervisorNumberFromList
      
      // Get SIP password directly from numberDetails
      const password = supervisorDetailsFromEndpoint?.sip_password || ''
      
      console.log('[CallSettings] Supervisor Number & SIP Details:', {
        number: currentSupervisor,
        details: supervisorDetailsFromEndpoint,
        hasPassword: !!password,
        domain: supervisorDetailsFromEndpoint?.sip_domain,
        extension: supervisorDetailsFromEndpoint?.sip_endpoint || supervisorDetailsFromEndpoint?.extension,
      })
      
      setSupervisorNumber(currentSupervisor)
      setSupervisorNumberDetails(supervisorDetailsFromEndpoint)
      setSelectedSupervisorNumber(currentSupervisor)
      setSipPassword(password)

      // Extract numbersDetail array
      const numbers = Array.isArray(numbersRes?.data?.numbersDetail) ? numbersRes?.data?.numbersDetail : []
      setAssignedNumbers(numbers)
    } catch (err) {
      console.error('Failed to fetch call settings:', err)
      setCallSettingsMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to load call settings' })
    } finally {
      setLoadingCallSettings(false)
    }
  }

  const saveSupervisorNumber = async () => {
    const businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      setCallSettingsMessage({ type: 'error', text: 'Business ID not found' })
      return
    }

    if (!selectedSupervisorNumber.trim()) {
      setCallSettingsMessage({ type: 'error', text: 'Please select or enter a supervisor number' })
      return
    }

    setSavingCallSettings(true)
    setCallSettingsMessage(null)
    try {
      const token = localStorage.getItem('authToken') || isAutheticated()
      
      // Update supervisor number via the dedicated endpoint
      const supervisorRes = await axios.patch(
        `/api/businesses/${encodeURIComponent(businessId)}/supervisor-number`,
        { supervisorNumber: selectedSupervisorNumber },
        {
          headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
        }
      )
      
      if (!supervisorRes || !(supervisorRes.status === 200 || (supervisorRes.data && supervisorRes.data.success))) {
        throw new Error(supervisorRes?.data?.message || 'Failed to update supervisor number')
      }
      
      // Get the new password from the response if available
      const newPassword = supervisorRes?.data?.numberDetails?.sip_password || sipPassword
      setSipPassword(newPassword)
      
      setSupervisorNumber(selectedSupervisorNumber)
      setCallSettingsMessage({ type: 'success', text: 'Supervisor number updated successfully' })
    } catch (err) {
      console.error('Failed to save supervisor number:', err)
      setCallSettingsMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to save supervisor number' })
    } finally {
      setSavingCallSettings(false)
    }
  }

  const releaseSupervisorNumber = async () => {
    const businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      setCallSettingsMessage({ type: 'error', text: 'Business ID not found' })
      return
    }

    if (!window.confirm('Are you sure you want to release this supervisor number? It will revert to a normal number.')) {
      return
    }

    setSavingCallSettings(true)
    setCallSettingsMessage(null)
    try {
      const token = localStorage.getItem('authToken') || isAutheticated()
      
      // Delete supervisor number via the dedicated endpoint
      const res = await axios.delete(
        `/api/businesses/${encodeURIComponent(businessId)}/supervisor-number`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
        }
      )
      
      if (!res || !(res.status === 200 || (res.data && res.data.success))) {
        setCallSettingsMessage({ type: 'error', text: 'Failed to release supervisor number' })
        return
      }
      
      // Reset the supervisor number state
      setSupervisorNumber('')
      setSelectedSupervisorNumber('')
      setSipPassword('')
      setSupervisorNumberDetails(null)
      setCallSettingsMessage({ type: 'success', text: 'Supervisor number released successfully' })
    } catch (err) {
      console.error('Failed to release supervisor number:', err)
      setCallSettingsMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to release supervisor number' })
    } finally {
      setSavingCallSettings(false)
    }
  }

  // Load call settings when component mounts
  useEffect(() => {
    fetchCallSettings()
  }, [])
  
  // Integrations data is already defined above
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Settings</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage your profile, business hours, and account settings</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs 
          value={activeKey - 1} 
          onChange={(e, newValue) => setActiveKey(newValue + 1)}
          sx={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <Tab label="General" />
          <Tab label="Account" />
          <Tab label="Call Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeKey === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Profile Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Profile</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First name"
                        placeholder="Enter first name"
                        required
                        value={formValues.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        size="small"
                        InputLabelProps={{ required: false }}
                        inputProps={{
                          style: { fontSize: '14px' }
                        }}
                        FormHelperTextProps={{ style: { fontSize: '12px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last name"
                        placeholder="Enter last name"
                        required
                        value={formValues.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        size="small"
                        InputLabelProps={{ required: false }}
                        inputProps={{
                          style: { fontSize: '14px' }
                        }}
                        FormHelperTextProps={{ style: { fontSize: '12px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        required
                        value={formValues.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        size="small"
                        InputLabelProps={{ required: false }}
                        inputProps={{
                          style: { fontSize: '14px' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Select
                        fullWidth
                        value={formValues.countryCode}
                        onChange={(e) => handleFormChange('countryCode', e.target.value)}
                        size="small"
                      >
                        <MenuItem value="+91">+91</MenuItem>
                        <MenuItem value="+1">+1</MenuItem>
                        <MenuItem value="+44">+44</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Phone number"
                        placeholder="Enter phone number"
                        required
                        value={formValues.phoneNumber}
                        onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                        size="small"
                        InputLabelProps={{ required: false }}
                        inputProps={{
                          style: { fontSize: '14px' }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Business Hours Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Business Hours</Typography>
                  
                  {/* Working Days */}
                  <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 1.5 }}>Working Days</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <Button
                        key={day}
                        variant={isDaySelected(day) ? 'contained' : 'outlined'}
                        onClick={() => toggleDay(day)}
                        sx={{
                          px: 2,
                          py: 0.75,
                          fontWeight: '500',
                          fontSize: '13px',
                          borderRadius: '6px',
                          backgroundColor: isDaySelected(day) ? '#6366f1' : 'transparent',
                          color: isDaySelected(day) ? '#fff' : '#374151',
                          border: isDaySelected(day) ? '2px solid #6366f1' : '2px solid #d1d5db',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isDaySelected(day) ? '#4f46e5' : '#f3f4f6',
                            borderColor: '#6366f1'
                          }
                        }}
                        size="small"
                      >
                        {day.substring(0, 3)}
                      </Button>
                    ))}
                  </Box>
                  {selectedDays.length === 0 && (
                    <Typography sx={{ color: '#ef4444', fontSize: '12px', mb: 2 }}>Please select at least one working day</Typography>
                  )}

                  {/* Work Timings */}
                  <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 1.5 }}>Work Timings</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  {/* Break Timings */}
                  <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 1.5 }}>Break Timings</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Break Start"
                        value={breakStartTime}
                        onChange={(e) => setBreakStartTime(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Break End"
                        value={breakEndTime}
                        onChange={(e) => setBreakEndTime(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  {/* Success Message */}
                  {showSuccessMessage && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px' }}>
                      <Typography sx={{ color: '#166534', fontSize: '14px', fontWeight: '500' }}>
                        ✓ Settings saved successfully!
                      </Typography>
                    </Box>
                  )}

                  {/* Save Button */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveChanges}
                      disabled={savingBusiness}
                      sx={{
                        bgcolor: '#6366f1',
                        color: '#fff',
                        fontWeight: '600',
                        textTransform: 'none',
                        fontSize: '14px',
                        px: 3,
                        py: 1,
                        '&:hover': {
                          bgcolor: '#4f46e5'
                        },
                        '&:disabled': {
                          bgcolor: '#d1d5db',
                          color: '#9ca3af'
                        }
                      }}
                    >
                      {savingBusiness ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeKey === 2 && (
        <Box>
          <Grid container spacing={3}>
            {/* Master Password Card */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <LockIcon sx={{ fontSize: '24px', color: '#6366f1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Master Password</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Set Master Password"
                        type={showMasterPasswordField ? 'text' : 'password'}
                        placeholder="Enter master password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => setShowMasterPasswordField(!showMasterPasswordField)}
                                sx={{ minWidth: '0', color: '#6366f1', p: 0 }}
                              >
                                {showMasterPasswordField ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </Button>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmMasterPasswordField ? 'text' : 'password'}
                        placeholder="Confirm master password"
                        value={confirmMasterPassword}
                        onChange={(e) => setConfirmMasterPassword(e.target.value)}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => setShowConfirmMasterPasswordField(!showConfirmMasterPasswordField)}
                                sx={{ minWidth: '0', color: '#6366f1', p: 0 }}
                              >
                                {showConfirmMasterPasswordField ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </Button>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>

                  {masterMessage && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: masterMessage.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${masterMessage.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius: '6px' }}>
                      <Typography sx={{ color: masterMessage.type === 'success' ? '#166534' : '#991b1b', fontSize: '14px', fontWeight: '500' }}>
                        {masterMessage.type === 'success' ? '✓' : '✕'} {masterMessage.text}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={createMasterPassword}
                      disabled={creatingMaster}
                      sx={{
                        bgcolor: '#6366f1',
                        color: '#fff',
                        fontWeight: '600',
                        textTransform: 'none',
                        fontSize: '14px',
                        '&:hover': {
                          bgcolor: '#4f46e5'
                        },
                        '&:disabled': {
                          bgcolor: '#d1d5db'
                        }
                      }}
                    >
                      {creatingMaster ? 'Creating...' : 'Create Master Password'}
                    </Button>
                  </Box>
                  
                  <Typography sx={{ color: '#6b7280', fontSize: '12px', mt: 1.5, fontStyle: 'italic' }}>
                    This password allows admin to login as any agent/branch user for this business.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* API Key Card */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <LockIcon sx={{ fontSize: '24px', color: '#6366f1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>API Key</Typography>
                  </Box>
                  
                  {!apiKey ? (
                    <Button
                      variant="contained"
                      onClick={generateApiKey}
                      sx={{
                        bgcolor: '#6366f1',
                        color: '#fff',
                        fontWeight: '600',
                        textTransform: 'none',
                        fontSize: '14px',
                        '&:hover': {
                          bgcolor: '#4f46e5'
                        }
                      }}
                    >
                      Generate API Key
                    </Button>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        value={apiKey}
                        readOnly
                        size="small"
                        sx={{ mb: 1 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="text"
                                size="small"
                                onClick={copyApiKey}
                                sx={{ minWidth: '0', color: '#6366f1', p: 0 }}
                              >
                                Copy
                              </Button>
                            </InputAdornment>
                          )
                        }}
                      />
                      <Typography sx={{ color: '#6b7280', fontSize: '12px' }}>
                        Keep this API key secure. Never share it publicly.
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Call Settings Tab */}
      {activeKey === 3 && (
        <Box>
          <Grid container spacing={3}>
            {/* Supervisor Number Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <PhoneIcon sx={{ fontSize: '24px', color: '#6366f1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Supervisor Number</Typography>
                  </Box>

                  {loadingCallSettings ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ mr: 2 }} />
                      <Typography>Loading...</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {assignedNumbers.length > 0 ? (
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select from Assigned Numbers</InputLabel>
                            <Select
                              value={selectedSupervisorNumber}
                              onChange={(e) => {
                                setSelectedSupervisorNumber(e.target.value)
                                setCallSettingsMessage(null)
                              }}
                              label="Select from Assigned Numbers"
                            >
                              {assignedNumbers.map((num, idx) => (
                                <MenuItem key={num.number || idx} value={num.number}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {num.number}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                        {num.status === 'assigned' ? `Assigned to ${num.assignedTo}` : 'Available'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography sx={{ color: '#6b7280', fontSize: '12px', mt: 1 }}>
                            Select a number from your assigned numbers
                          </Typography>
                        </Grid>
                      ) : (
                        <Grid item xs={12}>
                          <Typography sx={{ color: '#6b7280', fontSize: '14px', mb: 2 }}>
                            No assigned numbers found. You can enter a custom number below.
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Or Enter Custom Number"
                          placeholder="Enter supervisor phone number"
                          value={selectedSupervisorNumber}
                          onChange={(e) => {
                            setSelectedSupervisorNumber(e.target.value)
                            setCallSettingsMessage(null)
                          }}
                          size="small"
                          helperText="Enter the supervisor's phone number (will override dropdown selection)"
                        />
                      </Grid>

                      {sipPassword && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="SIP Password"
                            placeholder="SIP password"
                            value={sipPassword}
                            InputProps={{
                              readOnly: true,
                            }}
                            type="password"
                            size="small"
                            helperText="SIP password is automatically retrieved from your configuration"
                          />
                        </Grid>
                      )}

                      {callSettingsMessage && (
                        <Grid item xs={12}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: callSettingsMessage.type === 'success' ? '#dcfce7' : '#fee2e2', 
                            border: `1px solid ${callSettingsMessage.type === 'success' ? '#86efac' : '#fca5a5'}`, 
                            borderRadius: '6px' 
                          }}>
                            <Typography sx={{ 
                              color: callSettingsMessage.type === 'success' ? '#166534' : '#991b1b', 
                              fontSize: '14px', 
                              fontWeight: '500' 
                            }}>
                              {callSettingsMessage.type === 'success' ? '✓' : '✕'} {callSettingsMessage.text}
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      {supervisorNumber && (
                        <Grid item xs={12}>
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: '#f0fdf4', 
                            border: '1px solid #d1fae5', 
                            borderRadius: '6px' 
                          }}>
                            <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 600, mb: 1.5 }}>
                              ✓ Current Supervisor Number
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                    Phone Number
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500 }}>
                                    {supervisorNumber}
                                  </Typography>
                                </Box>
                              </Grid>

                              {supervisorNumberDetails?.city && (
                                <Grid item xs={12} sm={6}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                      City
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500 }}>
                                      {supervisorNumberDetails.city}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}

                              {supervisorNumberDetails?.type && (
                                <Grid item xs={12} sm={6}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                      Type
                                    </Typography>
                                    <Chip 
                                      label={supervisorNumberDetails.type} 
                                      size="small"
                                      sx={{ 
                                        bgcolor: '#dcfce7', 
                                        color: '#047857',
                                        textTransform: 'capitalize',
                                        fontWeight: 500
                                      }} 
                                    />
                                  </Box>
                                </Grid>
                              )}

                              {supervisorNumberDetails?.usageType && (
                                <Grid item xs={12} sm={6}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                      Usage Type
                                    </Typography>
                                    <Chip 
                                      label={supervisorNumberDetails.usageType} 
                                      size="small"
                                      sx={{ 
                                        bgcolor: '#dcfce7', 
                                        color: '#047857',
                                        textTransform: 'capitalize',
                                        fontWeight: 500
                                      }} 
                                    />
                                  </Box>
                                </Grid>
                              )}

                              {supervisorNumberDetails?.status && (
                                <Grid item xs={12}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                      Status
                                    </Typography>
                                    <Chip 
                                      label={supervisorNumberDetails.status} 
                                      size="small"
                                      sx={{ 
                                        bgcolor: supervisorNumberDetails.status === 'assigned' ? '#dbeafe' : '#dcfce7',
                                        color: supervisorNumberDetails.status === 'assigned' ? '#0c4a6e' : '#047857',
                                        textTransform: 'capitalize',
                                        fontWeight: 500
                                      }} 
                                    />
                                  </Box>
                                </Grid>
                              )}

                              {/* SIP Configuration Section */}
                              {supervisorNumberDetails?.sip_domain && (
                                <>
                                  <Grid item xs={12}>
                                    <Box sx={{ borderTop: '1px solid #d1d5db', pt: 2, mt: 1 }}>
                                      <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, display: 'block', mb: 1 }}>
                                        SIP Configuration
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={6}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                        SIP Domain
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500, wordBreak: 'break-all' }}>
                                        {supervisorNumberDetails.sip_domain}
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  {supervisorNumberDetails?.sip_port && (
                                    <Grid item xs={12} sm={6}>
                                      <Box>
                                        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                          SIP Port
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500 }}>
                                          {supervisorNumberDetails.sip_port}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  )}

                                  {supervisorNumberDetails?.sip_endpoint && (
                                    <Grid item xs={12} sm={6}>
                                      <Box>
                                        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                          SIP Extension
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500 }}>
                                          {supervisorNumberDetails.sip_endpoint}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  )}

                                  {supervisorNumberDetails?.sip_transport && (
                                    <Grid item xs={12} sm={6}>
                                      <Box>
                                        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                                          Transport
                                        </Typography>
                                        <Chip 
                                          label={supervisorNumberDetails.sip_transport.toUpperCase()} 
                                          size="small"
                                          sx={{ 
                                            bgcolor: '#dcfce7', 
                                            color: '#047857',
                                            fontWeight: 500
                                          }} 
                                        />
                                      </Box>
                                    </Grid>
                                  )}
                                </>
                              )}
                            </Grid>
                          </Box>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={saveSupervisorNumber}
                            disabled={savingCallSettings || !selectedSupervisorNumber.trim()}
                            sx={{
                              bgcolor: '#6366f1',
                              color: '#fff',
                              fontWeight: '600',
                              textTransform: 'none',
                              fontSize: '14px',
                              '&:hover': { bgcolor: '#4f46e5' },
                              '&:disabled': { bgcolor: '#d1d5db' }
                            }}
                          >
                            {savingCallSettings ? 'Saving...' : 'Save Supervisor Number'}
                          </Button>
                          {supervisorNumber && (
                            <Button
                              variant="outlined"
                              onClick={releaseSupervisorNumber}
                              disabled={savingCallSettings}
                              sx={{
                                color: '#dc2626',
                                borderColor: '#dc2626',
                                fontWeight: '600',
                                textTransform: 'none',
                                fontSize: '14px',
                                '&:hover': { bgcolor: '#fef2f2', borderColor: '#991b1b' },
                                '&:disabled': { bgcolor: '#f3f4f6', color: '#d1d5db' }
                              }}
                            >
                              Release Number
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Assigned Numbers Info Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <PhoneIcon sx={{ fontSize: '24px', color: '#10b981' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>All Phone Numbers</Typography>
                  </Box>

                  {loadingCallSettings ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ mr: 2 }} />
                      <Typography>Loading...</Typography>
                    </Box>
                  ) : assignedNumbers.length > 0 ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                        Total numbers: {assignedNumbers.length}
                        {assignedNumbers.filter(n => n.status === 'available').length > 0 && (
                          <span> • {assignedNumbers.filter(n => n.status === 'available').length} available</span>
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '400px', overflowY: 'auto' }}>
                        {assignedNumbers.map((num, idx) => {
                          const isAvailable = num.status === 'available'
                          const isSupervisor = num.isCurrentSupervisor
                          return (
                            <Box
                              key={num.number || idx}
                              sx={{
                                p: 2,
                                bgcolor: isAvailable ? '#f0fdf4' : '#f9fafb',
                                border: isAvailable ? '1px solid #d1fae5' : isSupervisor ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {num.number}
                                  </Typography>
                                  {isSupervisor && (
                                    <Chip label="Supervisor" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', height: '20px' }} />
                                  )}
                                </Box>
                                {!isAvailable && (
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    Assigned to: {num.assignedTo}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={isAvailable ? 'Available' : 'Assigned'}
                                size="small"
                                sx={{
                                  bgcolor: isAvailable ? '#d1fae5' : '#e0e7ff',
                                  color: isAvailable ? '#065f46' : '#3730a3',
                                  fontWeight: 500
                                }}
                              />
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, bgcolor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#92400e' }}>
                        No phone numbers found. Please contact your administrator to assign numbers.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default Settings
