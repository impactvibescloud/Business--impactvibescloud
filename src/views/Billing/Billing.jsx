import React, { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { getPurchasedNumbers, getPurchasedNumbersByCountry, savePurchasedNumber } from '../VirtualNumbers/virtualNumbersUtils'
import { apiCall, ENDPOINTS } from '../../config/api'
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
  Paper
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PhoneIcon from '@mui/icons-material/Phone'
import './Billing.css'
import './billing-alerts.css'
import './billing-buy-number.css'
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
  const [showContactModal, setShowContactModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentSuccessful, setPaymentSuccessful] = useState(false)
  const [totalCalls, setTotalCalls] = useState(234)
  const [userPlan, setUserPlan] = useState('Professional')
  const [planFeatures, setPlanFeatures] = useState([
    { name: 'Call Recording', desc: 'Record and store all your calls', enabled: true },
    { name: 'Browser Calling', desc: 'Make calls directly from your browser', enabled: true },
    { name: 'IVR', desc: 'Set up interactive voice response', enabled: true },
    { name: 'Call Analytics', desc: 'Track and analyze call performance', enabled: true }
  ])
  
  // Subscription plan states
  const [user, setUser] = useState(null)
  const [businessId, setBusinessId] = useState(null)
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState(null)
  const [planDetails, setPlanDetails] = useState(null)
  const [assignedNumbers, setAssignedNumbers] = useState([])
  const [allowedFeatures, setAllowedFeatures] = useState([])
  
  const navigate = useNavigate()
  const token = localStorage.getItem('authToken')
  
  // Fetch user details first
  useEffect(() => {
    if (!token) {
      setSubscriptionError('Authentication token not found. Please login again.')
      return
    }

    apiCall(ENDPOINTS.USER_DETAILS)
      .then((res) => {
        setUser(res.user)
        setBusinessId(res.user.businessId)
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err)
        setSubscriptionError('Could not fetch business details. Please try logging in again.')
      })
  }, [token])

  // Fetch subscription plan data
  useEffect(() => {
    if (!businessId) return

    setLoadingSubscription(true)
    const endpoint = `/businesses/${businessId}/subscription-plan`
    
    apiCall(endpoint)
      .then((res) => {
        if (res.success && res.data) {
          const data = res.data
          setSubscriptionData(data)
          setUserPlan(data.currentPlan || 'Professional')
          setPlanDetails(data.planDetails)
          setAssignedNumbers(data.assignedNumbers || [])
          
          // Update total calls - use totalCallsTillNow if available, otherwise calculate
          const total = data.totalCallsTillNow !== undefined ? 
            data.totalCallsTillNow : 
            ((data.callDetails?.inboundCalls || 0) + 
             (data.callDetails?.outboundCalls || 0) + 
             (data.callDetails?.missedCalls || 0) + 
             (data.callDetails?.hangCalls || 0))
          setTotalCalls(total)
          
          // Map allowed features to display format
          if (data.allowedFeatures && Array.isArray(data.allowedFeatures)) {
            setAllowedFeatures(data.allowedFeatures)
            
            // Create feature display from the new response structure
            // Features now have key and label, and all are enabled by default
            const featureDescriptions = {
              'cdr': 'Call Detail Records - Track all call details',
              'support_tickets': 'Support Tickets - Manage customer support',
              'settings': 'Settings - Configure system settings',
              'audio_campaign': 'Audio Campaign - Create audio campaigns',
              'contacts': 'Contacts - Manage contact database',
              'call_uses': 'Call Uses - Track call usage statistics',
              'call_monitor': 'Call Monitor - Monitor calls in real-time',
              'department_performance': 'Department Performance - View department metrics',
              'call_settings': 'Call Settings - Configure call handling',
              'reports': 'Reports - Generate detailed reports',
              'ivr_management': 'IVR Management - Manage IVR systems',
              'agent_performance': 'Agent Performance - Track agent metrics',
              'virtual_numbers': 'Virtual Numbers - Manage virtual numbers',
              'call_logs': 'Call Logs - View call history',
              'department': 'Department - Manage departments',
              'agents': 'Agents - Manage agents',
              'dashboard': 'Dashboard - View analytics dashboard',
              'billing': 'Billing - Manage billing',
              'leads': 'Leads - Manage leads',
              'dialer_real_time_report': 'Dialer Real Time Report - View dialer reports'
            }
            
            const mappedFeatures = data.allowedFeatures.map(f => ({
              name: f.label || f.key,
              desc: featureDescriptions[f.key] || 'Feature',
              enabled: true
            }))
            setPlanFeatures(mappedFeatures)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch subscription plan:', err)
        setSubscriptionError('Could not fetch subscription details')
      })
      .finally(() => {
        setLoadingSubscription(false)
      })
  }, [businessId])
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ]
  
  // Load purchased numbers on component mount
  useEffect(() => {
    // Use API assigned numbers if available, otherwise fall back to local storage
    if (assignedNumbers && assignedNumbers.length > 0) {
      setPurchasedNumbers(assignedNumbers)
    } else {
      const numbers = getPurchasedNumbers()
      setPurchasedNumbers(numbers)
    }
  }, [assignedNumbers])
  
  // Handle save changes. Previous implementation showed a green "Saved"
  // message after a setTimeout — no API call, form values were discarded
  // on refresh. Until the backend exposes a billing-info update endpoint,
  // surface this honestly so the user can request the change manually
  // instead of believing they saved successfully.
  const handleSaveChanges = (e) => {
    e.preventDefault()

    const form = e.target.closest('form')
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }

    setIsSaving(false)
    setShowSuccessMessage(false)
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(
        'Saving billing information from this page is not yet available. Please contact support to update your billing details.'
      )
    }
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
    
    if (tabParam === 'billing') {
      setActiveKey(2)
    } else if (tabParam === 'payment-requests') {
      setActiveKey(3)
    }
  }, [])
  
  // Function to update URL when changing tabs
  const handleTabChange = (key) => {
    setActiveKey(key)
    const tabParam = key === 1 ? '' : 
                    key === 2 ? 'billing' : 
                    key === 3 ? 'payment-requests' : '';
    
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

  // Handle payment submission. Previous implementation simulated a
  // payment with setTimeout, then wrote the "purchased" number to
  // localStorage — no real payment, no server record. The UI showed
  // "owned" numbers that didn't exist on the backend. Until the real
  // payment + provisioning endpoint is wired up, refuse honestly.
  const handlePaymentSubmit = () => {
    if (!paymentMethod) return
    setIsPaymentProcessing(false)
    setPaymentSuccessful(false)
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(
        'Number purchase is not yet available from this page. Please contact your administrator to add new numbers to your account.'
      )
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Plans & Numbers</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Manage your billing, plans, and virtual numbers</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs 
          value={activeKey - 1} 
          onChange={(e, newValue) => handleTabChange(newValue + 1)}
          sx={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <Tab label="Overview" />
          <Tab label="Billing" />
          <Tab label="Payment Requests" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeKey === 1 && (
        <Box>
          {/* Plan Details Card */}
          <Card sx={{ mb: 2, border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Account Overview</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f9fafb', borderRadius: '4px' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Total calls</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{totalCalls}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f9fafb', borderRadius: '4px' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Virtual Numbers</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>{purchasedNumbers.length}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f9fafb', borderRadius: '4px' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Current Plan</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5, color: '#6366f1' }}>{userPlan}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Call Details Breakdown Card */}
          <Card sx={{ mb: 2, border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Call Details Breakdown</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f0f9ff', borderRadius: '4px', borderLeft: '4px solid #3b82f6' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Inbound Calls</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#3b82f6' }}>
                    {subscriptionData?.callDetails?.inboundCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f0fdf4', borderRadius: '4px', borderLeft: '4px solid #10b981' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Outbound Calls</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#10b981' }}>
                    {subscriptionData?.callDetails?.outboundCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#fef3c7', borderRadius: '4px', borderLeft: '4px solid #f59e0b' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Missed Calls</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#f59e0b' }}>
                    {subscriptionData?.callDetails?.missedCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#fee2e2', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Failed Calls</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: '#ef4444' }}>
                    {subscriptionData?.callDetails?.failedCalls || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Numbers Card */}
          <Card sx={{ mb: 2, border: '1px solid #e5e7eb' }}>
            <CardContent>
              {!showBuyNumberView ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Numbers</Typography>
                    <Button variant="contained" onClick={() => setShowContactModal(true)}>Buy Number</Button>
                  </Box>

                  <Box>
                    {purchasedNumbers && purchasedNumbers.length > 0 ? (
                      <Box>
                        <Typography sx={{ fontWeight: 600, mb: 2 }}>Assigned Numbers ({purchasedNumbers.length})</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {purchasedNumbers.map(num => (
                            <Chip
                              key={num._id || num.id}
                              icon={<PhoneIcon />}
                              label={`${num.number} (${num.type || 'local'})`}
                              variant="outlined"
                              color="primary"
                              sx={{
                                height: '40px',
                                fontSize: '13px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '2px solid #6366f1',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f0f4ff',
                                  borderColor: '#6366f1',
                                  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
                                },
                                '& .MuiChip-icon': {
                                  color: '#6366f1',
                                  marginRight: '6px'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box>
                          <img src="https://flagcdn.com/w40/in.png" alt="India flag" style={{ width: 40, height: 30 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>No numbers assigned yet</Typography>
                          <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Purchase numbers to get started</Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Buy Virtual Number</Typography>
                    <Button variant="outlined" onClick={() => setShowBuyNumberView(false)}>Cancel</Button>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Select
                        fullWidth
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="India">India</MenuItem>
                        <MenuItem value="United States">United States</MenuItem>
                        <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                        <MenuItem value="Singapore">Singapore</MenuItem>
                        <MenuItem value="Australia">Australia</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        placeholder="Search by number, location, or type..."
                        value={searchTerm}
                        onChange={handleSearch}
                        size="small"
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>NUMBER</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>LOCATION</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>TYPE</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>PRICE</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>ACTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredNumbers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: '#6b7280' }}>No numbers available matching your search</TableCell>
                          </TableRow>
                        ) : (
                          filteredNumbers.map(num => (
                            <TableRow key={num.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhoneIcon sx={{ fontSize: '18px', color: '#6366f1' }} />
                                  {num.number}
                                </Box>
                              </TableCell>
                              <TableCell>{num.location}</TableCell>
                              <TableCell>
                                <Chip label={num.type} size="small" color={num.type === 'Toll-Free' ? 'success' : 'default'} variant="outlined" />
                              </TableCell>
                              <TableCell>₹{num.price}</TableCell>
                              <TableCell>
                                <Button size="small" variant="contained" onClick={() => handleSelectNumber(num)}>Buy</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Paper>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card sx={{ border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Features included</Typography>
                  <Chip label={userPlan} color="primary" variant="outlined" size="small" />
                </Box>
              </Box>
              <Grid container spacing={2}>
                {planFeatures.map((feature, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{ display: 'flex', gap: 2, opacity: feature.enabled ? 1 : 0.5 }}>
                      <Box sx={{ color: feature.enabled ? '#10b981' : '#d1d5db', fontWeight: 'bold', fontSize: '20px', mt: 0.2 }}>
                        {feature.enabled ? '✓' : '○'}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, textDecoration: !feature.enabled ? 'line-through' : 'none' }}>{feature.name}</Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6b7280' }}>{feature.desc}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeKey === 2 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Billing Information - Left Side */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Billing Information</Typography>
                  <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Company name *" fullWidth size="small" />
                    <TextField label="GST number *" fullWidth size="small" />
                    <TextField label="Address line 1 *" fullWidth size="small" />
                    <TextField label="Address line 2" fullWidth size="small" />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="City *" fullWidth size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Select fullWidth size="small" displayEmpty>
                          <MenuItem value="">Select state</MenuItem>
                          {indianStates.map(state => (
                            <MenuItem key={state} value={state}>{state}</MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Select fullWidth size="small" displayEmpty>
                          <MenuItem value="">Select country</MenuItem>
                          {countries.map(country => (
                            <MenuItem key={country} value={country}>{country}</MenuItem>
                          ))}
                        </Select>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Postal code *" fullWidth size="small" />
                      </Grid>
                    </Grid>

                    <TextField label="Email for invoices *" type="email" fullWidth size="small" />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2">Make default for all purchases</Typography>
                      <Box>
                        <Button variant="outlined" sx={{ mr: 1 }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveChanges} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Box>

                    {showSuccessMessage && (
                      <Box sx={{ p: 2, bgcolor: '#dcfce7', border: '1px solid #86efac', borderRadius: '4px', color: '#166534' }}>
                        Billing details saved successfully.
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Payment History - Right Side */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #d1d5db', height: '100%' }}>
                <Box sx={{ p: 2, bgcolor: '#f9fafb', fontWeight: 600, fontSize: 18, borderBottom: '1px solid #d1d5db' }}>Plan Summary</Box>
                <Box sx={{ p: 3 }}>
                  {loadingSubscription ? (
                    <Box sx={{ textAlign: 'center', color: '#6b7280' }}>Loading plan details...</Box>
                  ) : planDetails ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Plan Name</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mt: 0.5 }}>{planDetails.planName}</Typography>
                      </Box>
                      <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Duration</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mt: 0.5 }}>{planDetails.duration} days</Typography>
                      </Box>
                      <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Base Price</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mt: 0.5 }}>₹{planDetails.rental}</Typography>
                      </Box>
                      <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Discount</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mt: 0.5 }}>₹{planDetails.displayDiscount} ({planDetails.discount}%)</Typography>
                      </Box>
                      <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Final Amount</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mt: 0.5, color: '#10b981' }}>₹{planDetails.totalAfterDiscount}</Typography>
                      </Box>
                      <Box sx={{ pb: 2 }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Valid Till</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '14px', mt: 0.5 }}>
                          {new Date(planDetails.endDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', color: '#6b7280' }}>No plan details available</Box>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeKey === 3 && (
        <Box sx={{ mt: 3 }}>
          <PaymentRequests />
        </Box>
      )}

      {/* Contact Service Provider Modal */}
      <Dialog 
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Buy Number</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <PhoneIcon sx={{ fontSize: 64, color: '#6366f1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Contact Our Service Provider</Typography>
            <Typography sx={{ color: '#4b5563', lineHeight: 1.6 }}>
              Please contact the service provider for more numbers or any query.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContactModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog 
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Your Purchase</DialogTitle>
        <DialogContent>
          {paymentSuccessful ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ fontSize: '48px', color: '#10b981', mb: 2 }}>✓</Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Payment Successful!</Typography>
              <Typography sx={{ mb: 1 }}>Your number has been purchased successfully.</Typography>
              <Typography sx={{ color: '#6b7280' }}>Redirecting back to overview...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#f3f4f6', borderRadius: '4px' }}>
                <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>Selected Number:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{selectedNumber?.number}</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Payment Method</Typography>
                {['creditCard', 'upi', 'netBanking'].map((method, idx) => (
                  <Box key={method} sx={{ mb: 1 }}>
                    <TextField
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={handlePaymentMethodChange}
                      label={['Credit Card', 'UPI', 'Net Banking'][idx]}
                      sx={{ display: 'flex', gap: 1 }}
                    />
                  </Box>
                ))}
              </Box>

              {paymentMethod && (
                <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '4px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Number Price:</Typography>
                    <Typography>₹{selectedNumber?.price}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax (18% GST):</Typography>
                    <Typography>₹{(selectedNumber?.price * 0.18).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', pt: 1, borderTop: '1px solid #e5e7eb' }}>
                    <Typography>Total Amount:</Typography>
                    <Typography>₹{(selectedNumber?.price * 1.18).toFixed(2)}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        {!paymentSuccessful && (
          <DialogActions>
            <Button onClick={() => setShowPaymentModal(false)} disabled={isPaymentProcessing}>Cancel</Button>
            <Button 
              variant="contained"
              onClick={handlePaymentSubmit}
              disabled={isPaymentProcessing || !paymentMethod}
            >
              {isPaymentProcessing ? 'Processing...' : 'Confirm and Pay'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  )
}

export default Billing
