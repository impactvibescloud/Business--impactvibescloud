// API Configuration for the application
// This file centralizes all API endpoints and configurations to avoid CORS issues
import axios from 'axios'

// API Configuration with environment support
export const API_CONFIG = {
  // Development environment
  DEV_URL: 'http://localhost:5040',
  // Production environment
  PROD_URL: 'https://api-impactvibescloud.onrender.com',
  // Base API path
  API_PATH: '/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGZlMzljYTgyNTRlODkwNmU5OWFhYiIsImlhdCI6MTc1NDI5OTIxNH0.FlziqjjJZCNYwkUEE3TDDmyNrjRRnhdl-kSFnhSj_cU'
}

// Get the base URL based on environment
export const getBaseURL = () => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? API_CONFIG.DEV_URL : API_CONFIG.PROD_URL;
}

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_CONFIG.AUTH_TOKEN}`
}

// API Endpoints
export const ENDPOINTS = {
  // User endpoints
  USER_DETAILS: '/api/v1/user/details',
  USER_LOGIN: '/api/v1/user/login',
  USER_LOGOUT: '/api/v1/user/logout',
  USER_STATUS: '/api/v1/user/status',
  USER_CURRENT_STATUS: '/api/v1/user/status/current',
  USER_TEAM_STATUS: '/api/v1/user/status/team',
  
  CONFIG: '/api/config',
  
  // Billing endpoints
  BILLING_BUSINESS: (businessId) => `/api/billing/business/${businessId}`,
  BILLING_UPDATE: (id) => `/api/billing/${id}`,
  
  // Business endpoints
  BUSINESS_DETAILS: (businessId) => `/api/business/get_one/${businessId}`,
  
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
  
  // Department endpoints
  DEPARTMENTS: '/api/departments',
  DEPARTMENT_BY_ID: (id) => `/api/departments/${id}`,
  
  // Plan endpoints
  PLANS: (planId) => `/api/plans/${planId}`,
  
  // Other common endpoints
  REPORTS: '/api/reports',
  SETTINGS: '/api/settings',
  DASHBOARD: '/api/dashboard'
}

// Utility function to make API calls using axios (which supports proxy)
export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  // Internal function to make the actual request
  const makeRequest = async () => {
    // Get the actual auth token from localStorage if available
    const authToken = localStorage.getItem('authToken') || API_CONFIG.AUTH_TOKEN
    
    const config = {
      url: endpoint, // Use endpoint directly since axios baseURL is already configured
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
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
      return response.data
    } catch (error) {
      // Silent handling - the interceptor will handle fallbacks
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ API failed: ${endpoint} - ${error.message}`)
      }
      
      // Let the interceptor handle the error and fallbacks
      throw error
    }
  }
  
  // Make request directly without debouncing
  return await makeRequest()
}

export default API_CONFIG
