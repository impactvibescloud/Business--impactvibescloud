// API Configuration for the application
// This file centralizes all API endpoints and configurations to avoid CORS issues
import axios from 'axios'

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // API Configuration with environment support
export const API_CONFIG = {
  // Development environment
  DEV_URL: process.env.REACT_APP_API_URL || 'http://localhost:5040',
  // Production environment
  PROD_URL: process.env.REACT_APP_PROD_API_URL || 'https://api-impactvibescloud.onrender.com',
  // Base API path for all endpoints
  API_PATH: ''
}

// Get authentication token
export const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
}

// Sanitize URL to prevent double /api
export const sanitizeUrl = (url) => {
  return url.replace(/\/api\/api\//, '/api/').replace(/^\/api\//, '/');
}

// Get the base URL based on environment
export const getBaseURL = () => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment ? API_CONFIG.DEV_URL : API_CONFIG.PROD_URL;
  // In production, we need to append /api
  return isDevelopment ? baseUrl : `${baseUrl}/api`;
}

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// API Endpoints
export const ENDPOINTS = {
  // User endpoints
  USER_DETAILS: '/v1/user/details',
  USER_LOGIN: '/v1/user/login',
  USER_LOGOUT: '/v1/user/logout',
  USER_STATUS: '/v1/user/status',
  USER_CURRENT_STATUS: '/v1/user/status/current',
  USER_TEAM_STATUS: '/v1/user/status/team',
  
  CONFIG: '/config',
  
  // Billing endpoints
  BILLING_BUSINESS: (businessId) => `/api/billing/business/${businessId}`,
  BILLING_UPDATE: (id) => `/api/billing/${id}`,
  
  // Business endpoints
  BUSINESS_DETAILS: (businessId) => `/business/get_one/${businessId}`,
  
  // Invoice endpoints
  INVOICES: (invoiceId) => `/invoices/${invoiceId}`,
  
  // Contact endpoints
  CONTACTS: '/contacts',
  CONTACT_LISTS: '/contact-list',
  
  // Call logs endpoints
  CALL_LOGS: '/call-logs',
  
  // Branches endpoints
  BRANCHES: '/branches',
  
  // Virtual Numbers endpoints
  NUMBERS: '/numbers',
  
  // Department endpoints
  DEPARTMENTS: '/departments',
  DEPARTMENT_BY_ID: (id) => `/departments/${id}`,
  
  // Plan endpoints
  PLANS: (planId) => `/plans/${planId}`,
  
  // Other common endpoints
  REPORTS: '/reports',
  SETTINGS: '/settings',
  DASHBOARD: '/dashboard'
}

// Utility function to make API calls using axios (which supports proxy)
// Configure axios defaults
axios.defaults.baseURL = getBaseURL() + API_CONFIG.API_PATH;

export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  // Internal function to make the actual request
  const makeRequest = async () => {
    // Sanitize the endpoint and ensure it's clean
    const cleanEndpoint = sanitizeUrl(endpoint);
    
    const config = {
      url: cleanEndpoint, // Use sanitized endpoint
      method: method.toUpperCase(),
      headers: {
        ...getHeaders(),
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
