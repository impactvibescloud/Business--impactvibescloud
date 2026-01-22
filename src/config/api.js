// API Configuration for the application
// This file centralizes all API endpoints and configurations to avoid CORS issues
import axios from 'axios'

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // API Configuration with environment support
// Helper to normalize env URLs (remove trailing slashes)
const normalizeUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/$/, '');
}

export const API_CONFIG = {
  // Development environment (can be set via REACT_APP_API_URL)
  DEV_URL: normalizeUrl(process.env.REACT_APP_API_URL) || 'http://localhost:5040',
  // Production environment: prefer explicit PRODUCTION var, then a generic BASE URL
  PROD_URL: normalizeUrl(process.env.REACT_APP_PROD_API_URL) || normalizeUrl(process.env.REACT_APP_BASE_URL) || 'https://api.justconnect.biz',
  // Base API path appended to the host (we will prefix '/api' centrally)
  API_PATH: '/api'
}

// Ensure PROD_URL does not accidentally include a trailing /api
API_CONFIG.PROD_URL = API_CONFIG.PROD_URL.replace(/\/api$/, '');

// Get authentication token
export const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
}

// Sanitize URL to prevent double /api
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  // If it's an absolute URL (http(s)://), return as-is
  if (/^https?:\/\//i.test(url)) return url;
  // Collapse duplicate /api/api/ to single /api/
  let out = url.replace(/\/api\/api\//g, '/api/');
  // Collapse multiple slashes to a single slash
  out = out.replace(/\/\/+/g, '/');
  return out;
}

// Get the base URL based on environment
export const getBaseURL = () => {
  // Always return the host-only base URL (no '/api' suffix).
  // apiCall() prefixes API_CONFIG.API_PATH ('/api') for relative endpoints,
  // so including '/api' in the base URL leads to double '/api/api' in requests.
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) return API_CONFIG.DEV_URL;
  return API_CONFIG.PROD_URL;
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
  BILLING_BUSINESS: (businessId) => `/billing/business/${businessId}`,
  BILLING_UPDATE: (id) => `/billing/${id}`,
  
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
  DASHBOARD: '/dashboard',
  
  // Ticket endpoints
  TICKETS: '/tickets',
  TICKET_MESSAGES: (ticketId) => `/tickets/${ticketId}/messages`,
  TICKET_UPDATE: (ticketId) => `/tickets/${ticketId}`
}

// Utility function to make API calls using axios (which supports proxy)
// Configure axios defaults: baseURL is the host only (no /api). apiCall will
// prefix API_PATH ('/api') for relative endpoints.
axios.defaults.baseURL = getBaseURL();

export const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  // Internal function to make the actual request
  const makeRequest = async () => {
      // Build endpoint: if absolute URL, leave as-is. Otherwise ensure it has a
      // leading slash and prefix API_PATH ('/api') if not already present. This
      // centralizes the '/api' prefix so callers don't need to manage it.
      let cleanEndpoint = endpoint || '';
      if (!/^https?:\/\//i.test(cleanEndpoint)) {
        if (!cleanEndpoint.startsWith('/')) cleanEndpoint = `/${cleanEndpoint}`;
        if (!cleanEndpoint.startsWith(API_CONFIG.API_PATH)) {
          cleanEndpoint = `${API_CONFIG.API_PATH}${cleanEndpoint}`;
        }
      }
      // Sanitize duplicates and normalize
      cleanEndpoint = sanitizeUrl(cleanEndpoint);
    
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
