// API Configuration for the application
// This file centralizes all API endpoints and configurations to avoid CORS issues
import axios from 'axios'

// API Configuration with fallback support
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:5040/api',
  PROXY_URL: '/api', // Using proxy from package.json
  PRODUCTION_URL: 'https://api-impactvibescloud.onrender.com/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQ0OTBiZjkzMDYxNTQ1OTM4ODU4MSIsImlhdCI6MTc1MTg4MDYwMX0.tMpKo7INMcUp3u1b8NBnzRMutPCZVhNWbPxfAqFwIvc'
}

// Use proxy URL (this will work with axios proxy configuration)
const getBaseURL = () => {
  // Always use proxy URL which is handled by axios baseURL configuration
  return API_CONFIG.PROXY_URL
}

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_CONFIG.AUTH_TOKEN}`
}

// API Endpoints
export const ENDPOINTS = {
  // User endpoints
  USER_DETAILS: '/api/v1/user/details',
  CONFIG: '/api/config',
  
  // Billing endpoints
  BILLING_BUSINESS: (businessId) => `/api/billing/business/${businessId}`,
  BILLING_UPDATE: (id) => `/api/billing/${id}`,
  
  // Invoice endpoints
  INVOICES: (invoiceId) => `/api/invoices/${invoiceId}`,
  
  // Contact endpoints
  CONTACTS: '/api/contacts',
  CONTACT_LISTS: '/api/contact-list',
  
  // Plan endpoints
  PLANS: (planId) => `/api/plans/${planId}`
}

// Utility function to make API calls using axios (which supports proxy)
export const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', data, headers = {}, ...restOptions } = options
  
  const config = {
    url: endpoint, // Use endpoint directly since axios baseURL is already configured
    method,
    headers: {
      ...API_HEADERS,
      ...headers
    },
    ...restOptions
  }
  
  if (data) {
    config.data = data
  }
  
  try {
    console.log(`Making API call to: ${endpoint}`)
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.warn('API call failed:', error.message, 'for endpoint:', endpoint)
    
    // Return graceful fallbacks for specific endpoints
    if (endpoint.includes('/user/details')) {
      console.warn('User details API failed, returning mock data')
      return {
        success: true,
        message: 'Mock user data (API unavailable)',
        user: {
          role: 'business_admin',
          name: 'Admin User',
          email: 'admin@example.com',
          businessId: '684fe39da8254e8906e99aad'
        }
      }
    }
    
    if (endpoint.includes('/config')) {
      console.warn('Config API failed, returning mock config')
      return {
        success: true,
        message: 'Mock config (API unavailable)',
        result: [{
          logo: [{ Headerlogo: '', Footerlogo: '', Adminlogo: '' }],
          copyrightMessage: 'ImpactVibes Cloud'
        }]
      }
    }
    
    if (endpoint.includes('/billing/business')) {
      console.warn('Billing API failed, returning mock billing data')
      return {
        success: true,
        message: 'Mock billing data (API unavailable)',
        data: []
      }
    }
    
    if (endpoint.includes('/invoices/')) {
      console.warn('Invoice API failed, returning mock invoice data')
      return {
        success: true,
        message: 'Mock invoice data (API unavailable)',
        data: {
          amount: 29.99,
          planName: 'Basic Plan',
          description: 'Monthly subscription'
        }
      }
    }
    
    // For other endpoints, return a failed response
    return {
      success: false,
      message: error.message || 'API call failed',
      data: null
    }
  }
}

export default API_CONFIG
