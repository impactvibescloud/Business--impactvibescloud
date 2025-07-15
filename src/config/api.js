// API Configuration for the application
// This file centralizes all API endpoints and configurations to avoid CORS issues
import axios from 'axios'
import { debouncedApiCall } from '../utils/apiDebouncer'

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
  
  // Call logs endpoints
  CALL_LOGS: '/api/call-logs',
  
  // Branches endpoints
  BRANCHES: '/api/branches',
  
  // Virtual Numbers endpoints
  NUMBERS: '/api/numbers',
  
  // Plan endpoints
  PLANS: (planId) => `/api/plans/${planId}`,
  
  // Other common endpoints
  REPORTS: '/api/reports',
  SETTINGS: '/api/settings',
  DASHBOARD: '/api/dashboard'
}

// Utility function to make API calls using axios (which supports proxy)
export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  // Create a unique key for debouncing based on endpoint and method
  const debounceKey = `${method.toUpperCase()}_${endpoint}`
  
  // Use debouncing for GET requests to prevent rapid successive calls
  if (method.toUpperCase() === 'GET') {
    return debouncedApiCall(debounceKey, async () => {
      return await makeRequest(endpoint, method, data, options)
    })
  }
  
  // For non-GET requests, make request directly
  return await makeRequest(endpoint, method, data, options)
}

// Internal function to make the actual request
const makeRequest = async (endpoint, method, data, options) => {
  const config = {
    url: endpoint, // Use endpoint directly since axios baseURL is already configured
    method: method.toUpperCase(),
    headers: {
      ...API_HEADERS,
      ...(options.headers || {})
    },
    ...options
  }
  
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.data = data
  }
  
  try {
    // Only log API calls in development mode to reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API: ${method} ${endpoint}`)
    }
    const response = await axios(config)
    return response.data // Return just the data, not the whole response object
  } catch (error) {
    // Silent handling - the interceptor will handle fallbacks
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ API failed: ${endpoint} - ${error.message}`)
    }
    
    // Let the interceptor handle the error and fallbacks
    throw error
  }
}

export default API_CONFIG
