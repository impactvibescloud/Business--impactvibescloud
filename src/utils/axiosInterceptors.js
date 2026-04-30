// Enhanced Axios interceptor to handle errors gracefully and prevent console spam
// Includes session management and timeout prevention for long-running sessions
import axios from 'axios'

// Flag to track if we've already set up interceptors
let interceptorsSetup = false

// Simple cache for frequently requested data to reduce API calls
const apiCache = new Map()
const CACHE_DURATION = 600000 // 10 minutes (increased for long sessions)

// Request throttling to prevent too many concurrent requests
const requestQueue = new Map()
const MAX_REQUESTS_PER_MINUTE = 15 // Increased for better user experience
const requestTimestamps = []

// Session timeout prevention
const SESSION_EXTENSION_INTERVAL = 25 * 60 * 1000 // 25 minutes
let lastSessionExtension = Date.now()

// Connection quality tracking
let connectionQuality = 'good' // good, poor, offline
let failedRequestCount = 0
const MAX_FAILED_REQUESTS = 5

// Logging control
const ENABLE_VERBOSE_LOGS = false // Set to false to disable most logs

// Centralized logging function
const log = (type, ...args) => {
  if (!ENABLE_VERBOSE_LOGS && type !== 'error') {
    return // Skip non-error logs when verbose logging is disabled
  }
  
  // Only log errors by default
  switch(type) {
    case 'log':
      console.log(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
    default:
      console.log(...args)
  }
}

// Throttle fallback. NEVER fabricates user identity, role, or businessId —
// returning a fake authenticated user from the client is a privilege-
// escalation vector (the UI will believe the user is logged in as someone
// they aren't, and any subsequent write that trusts the cached value will
// hit the wrong tenant). Throttling only returns inert empty payloads;
// auth-bearing endpoints fall through to the network so a real failure
// becomes a real error.
const generateFallbackData = (url) => {
  if (
    url.includes('/user/details') ||
    url.includes('/user/login') ||
    url.includes('/auth')
  ) {
    return null
  }
  if (url.includes('/config')) {
    return {
      success: true,
      message: 'Fallback config data - reducing API load',
      data: { theme: 'default', features: [] }
    }
  }
  return {
    success: true,
    message: 'Fallback data - reducing API load',
    data: []
  }
}

// Endpoints whose response shape includes mutable per-tenant state; any
// successful write should invalidate cached GETs that share the same prefix
// so the next read pulls fresh data.
const CACHE_INVALIDATION_PREFIXES = [
  '/contacts',
  '/contact-list',
  '/branches',
  '/numbers',
  '/call-logs',
  '/billing',
  '/invoices',
  '/tickets',
  '/departments',
  '/leads',
  '/business',
  '/user',
  '/plans',
  '/dispositions',
]

const invalidateCacheFor = (url = '') => {
  if (!url) return
  // Drop any cached GET whose URL shares an invalidation prefix with the
  // mutated URL. This is intentionally coarse — better to refetch a few
  // extra GETs than to serve stale data after a write.
  const matched = CACHE_INVALIDATION_PREFIXES.filter((p) => url.includes(p))
  if (matched.length === 0) return
  for (const key of Array.from(apiCache.keys())) {
    if (matched.some((p) => key.includes(p))) {
      apiCache.delete(key)
    }
  }
}

export const setupAxiosInterceptors = () => {
  if (interceptorsSetup) return
  
  // If requested, force axios to use the direct backend host as baseURL
  // This makes calls like `axios.post('/api/v1/user/login/')` target
  // `https://api.justconnect.biz/api/v1/user/login/` directly instead
  // of relying on dev-server proxying or stripping behavior.
  // Configure axios baseURL according to environment:
  // - development => http://localhost:5040
  // - production  => https://api.justconnect.biz
  // This can be explicitly overridden by setting `REACT_APP_USE_DIRECT_BACKEND=true`
  // and optionally `REACT_APP_DIRECT_BACKEND_URL` for a custom URL.
  if (process.env.REACT_APP_USE_DIRECT_BACKEND === 'true') {
    axios.defaults.baseURL = process.env.REACT_APP_DIRECT_BACKEND_URL || ''
    if (!axios.defaults.baseURL) {
      console.error('[axios] REACT_APP_USE_DIRECT_BACKEND=true but REACT_APP_DIRECT_BACKEND_URL is empty')
    }
  } else if (!axios.defaults.baseURL) {
    if (process.env.NODE_ENV === 'development') {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5040'
    } else {
      // In prod the backend is configured via build-time env vars (see config/api.js).
      // Falling back to same-origin avoids accidentally targeting a hardcoded host.
      axios.defaults.baseURL =
        process.env.REACT_APP_PROD_API_URL || process.env.REACT_APP_BASE_URL || ''
    }
  }
  
  // Enhanced URL rewriting interceptor with session management
  axios.interceptors.request.use(
    (config) => {
      // Add timestamp and request ID for tracking
      config.metadata = {
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }
      
          // Auto-extend session for API calls (except auth endpoints)
        if (!config.url?.includes('/login') && !config.url?.includes('/logout')) {
          const now = Date.now()
          if (now - lastSessionExtension > SESSION_EXTENSION_INTERVAL) {
            lastSessionExtension = now
            localStorage.setItem('lastAPICall', now.toString())
            // Remove console log for session extension
          }
        }      // Add retry configuration for important requests
      if (!config.retry) {
        // Disable automatic retries by default to reduce added latency.
        // Individual requests can enable retries if needed.
        config.retry = {
          retries: 0,
          retryDelay: 500,
          retryCondition: (error) => {
            return error.code === 'ERR_NETWORK' || 
                   error.code === 'ERR_CONNECTION_REFUSED' ||
                   (error.response && error.response.status >= 500)
          }
        }
      }
      
      // Clean up any URLs to prevent double api paths
      if (config.url) {
        config.url = config.url.replace(/\/api\/api\//g, '/api/')

        // If anyone leaked a fully-qualified backend URL into a call site,
        // strip it so axios honours the configured baseURL instead of
        // talking to a hardcoded host. The list comes from env so prod
        // hosts aren't baked into source.
        const knownHosts = [
          process.env.REACT_APP_PROD_API_URL,
          process.env.REACT_APP_BASE_URL,
          process.env.REACT_APP_DIRECT_BACKEND_URL,
        ].filter(Boolean)
        if (process.env.REACT_APP_USE_DIRECT_BACKEND !== 'true') {
          for (const host of knownHosts) {
            if (host && config.url.includes(host)) {
              config.url = config.url.replace(host, '')
            }
          }
        }
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Enhanced request interceptor for caching and throttling
  axios.interceptors.request.use(
    (config) => {
      // Intelligent caching for GET requests with connection quality awareness
      if (config.method === 'get' || !config.method) {
        const url = config.url || ''
        // Include a short hash of the auth token in the cache key so that
        // logging out and back in as a different user doesn't serve the
        // previous user's cached responses.
        const _tok = (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) || ''
        const _tokKey = _tok ? _tok.slice(-12) : 'anon'
        const cacheKey = `${config.method || 'get'}_${url}_${_tokKey}`
        const cached = apiCache.get(cacheKey)
        
        // For frequently called endpoints, use longer cache duration
        const isFrequentEndpoint = url.includes('/config') || 
                                   url.includes('/user/details') || 
                                   url.includes('/contacts') ||
                                   url.includes('/numbers') ||
                                   url.includes('/call-logs') ||
                                   url.includes('/branches')
        
        // Adjust cache duration based on connection quality
        let cacheDuration = CACHE_DURATION
        if (connectionQuality === 'poor') {
          cacheDuration = CACHE_DURATION * 2 // Use longer cache for poor connections
        } else if (connectionQuality === 'offline') {
          // Previously: cacheDuration = Infinity. Once a cluster of failures
          // tripped 'offline', the cache stayed stale forever even after the
          // network recovered. Cap at 30 minutes so a recovered network is
          // visible within a sane bound.
          cacheDuration = CACHE_DURATION * 3
        }
        
        const effectiveCacheDuration = isFrequentEndpoint ? cacheDuration : cacheDuration / 2
        
        if (cached && Date.now() - cached.timestamp < effectiveCacheDuration) {
          // Return cached data immediately to avoid API call
          config.metadata = { 
            ...config.metadata,
            fromCache: true, 
            cachedResponse: cached.data,
            cacheAge: Date.now() - cached.timestamp
          }
          // Remove log for cached data
        } else {
          // Adaptive request throttling based on connection quality
          const now = Date.now()
          
          // Clean old timestamps (older than 1 minute)
          while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
            requestTimestamps.shift()
          }
          
          // Adjust request limits based on connection quality
          let requestLimit = MAX_REQUESTS_PER_MINUTE
          if (connectionQuality === 'poor') {
            requestLimit = Math.floor(MAX_REQUESTS_PER_MINUTE / 2)
          }
          
          // If we've made too many requests recently, serve any real
          // cached response we have (still the user's actual data), but
          // do NOT fabricate an empty success response when no cache
          // exists — that masked legitimate failures and made the UI
          // render "0 contacts" when really the request was rate-limited.
          // Without cache we let the request through; the server will
          // 429 us if it needs to and the UI can react to that honestly.
          if (requestTimestamps.length >= requestLimit && cached) {
            config.metadata = {
              ...config.metadata,
              fromCache: true,
              cachedResponse: cached.data,
              throttled: true
            }
          } else {
            // Allow request and track it
            requestTimestamps.push(now)
          }
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Enhanced response interceptor with retry logic and connection monitoring
  axios.interceptors.response.use(
    (response) => {
      // Track successful requests for connection quality. Any successful
      // response is strong evidence the network is back, so reset the
      // counter aggressively rather than only when it reaches zero — the
      // old code could stay 'offline' indefinitely if a single failure
      // happened during recovery.
      failedRequestCount = 0
      if (connectionQuality !== 'good') {
        connectionQuality = 'good'
        console.log('🟢 Connection quality improved to good')
      }
      
      // Check if this was served from cache
      if (response.config.metadata?.fromCache) {
        const metadata = response.config.metadata
        return { 
          data: metadata.cachedResponse,
          fromCache: true,
          cacheAge: metadata.cacheAge,
          throttled: metadata.throttled
        }
      }
      
      // Cache successful responses for ALL GET requests to improve performance
      const url = response.config.url || ''
      const method = (response.config.method || 'get').toLowerCase()
      if (method === 'get') {
        const _tok = (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) || ''
        const _tokKey = _tok ? _tok.slice(-12) : 'anon'
        const cacheKey = `${method}_${url}_${_tokKey}`
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        })
      } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
        // Mutations on a resource invalidate any cached GETs for that resource;
        // otherwise the UI would render the pre-mutation snapshot until the
        // 10-minute TTL elapses.
        invalidateCacheFor(url)
      }

      return response
    },
    async (error) => {
      // Track failed requests for connection quality monitoring
      failedRequestCount++
      
      // Adjust connection quality based on failures
      if (failedRequestCount >= MAX_FAILED_REQUESTS) {
        if (connectionQuality === 'good') {
          connectionQuality = 'poor'
          console.log('🟡 Connection quality degraded to poor')
        } else if (connectionQuality === 'poor') {
          connectionQuality = 'offline'
          console.log('🔴 Connection appears to be offline')
        }
      }
      
      // Enhanced retry logic
      const config = error.config
      if (config && config.retry && config.retry.retries > 0) {
        const shouldRetry = config.retry.retryCondition ? 
          config.retry.retryCondition(error) : 
          (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED')
          
        if (shouldRetry) {
          config.retry.retries--
          console.log(`🔄 Retrying request (${config.retry.retries} attempts left): ${config.url}`)
          
          // Exponential backoff
          const delay = config.retry.retryDelay * (4 - config.retry.retries)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return axios(config)
        }
      }
      
      // Handle different types of errors for long-running sessions
      const isNetworkError = 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ERR_EMPTY_RESPONSE' || 
        error.code === 'ERR_CONNECTION_REFUSED' ||
        error.message.includes('CORS') ||
        !error.response

      const isTimeoutError = error.code === 'ECONNABORTED' || error.message.includes('timeout')
      const isRateLimited = error.response?.status === 429
      const is404Error = error.response?.status === 404
      const isAuthError = error.response?.status === 401 || error.response?.status === 403
      const isCorsError = error.message.includes('CORS') || 
                         error.message.includes('blocked by CORS policy') ||
                         error.message.includes('Failed to fetch') ||
                         error.code === 'ERR_BLOCKED_BY_CLIENT'
      
      // Handle authentication errors. The previous implementation fired a
      // `GET /user/details` then `return axios(config)` on the original
      // request — that re-drove the same 401-producing call in a recursion
      // loop and caused duplicate POSTs (double-billed payments / duplicate
      // contacts). Now we force logout once and reject; let the user log
      // back in cleanly.
      if (isAuthError) {
        console.warn('🚨 Authentication error detected - forcing logout')
        if (!config || !config.__authRetried) {
          try { localStorage.removeItem('authToken') } catch (e) {}
          try { sessionStorage.removeItem('authToken') } catch (e) {}
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = '/'
          }
        }
        return Promise.reject(error)
      }
      
      if (isNetworkError || isTimeoutError || isRateLimited || isCorsError || is404Error) {
        let errorType = 'Network error'
        if (isTimeoutError) errorType = 'Request timeout'
        if (isRateLimited) errorType = 'Rate limit exceeded'
        if (isCorsError) errorType = 'CORS policy restriction'
        if (is404Error) errorType = 'Endpoint not found'
        
        // Silent handling for long-running sessions - only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🔄 ${errorType} - serving fallback data for:`, error.config?.url)
        }
        
        const url = error.config?.url || ''
        
        // Enhanced cache serving - prioritize any cached data over fallbacks
        const _tok = (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) || ''
        const _tokKey = _tok ? _tok.slice(-12) : 'anon'
        const cacheKey = `${error.config?.method || 'get'}_${url}_${_tokKey}`
        const cached = apiCache.get(cacheKey)
        
        if (cached) {
          const cacheAge = Date.now() - cached.timestamp
          console.log(`📦 Serving cached data due to ${errorType} (${Math.round(cacheAge / 1000)}s old)`)
          return Promise.resolve({
            data: cached.data,
            fromCache: true,
            cacheAge: cacheAge,
            fallbackReason: errorType
          })
        }
        
        // Auth-bearing endpoints must never get a fabricated success response —
        // a fake "logged in" user causes the UI to render an authenticated
        // shell using a hardcoded businessId, which is a privilege-escalation
        // vector. Force these failures to surface so ProtectedRoute logs out.
        if (
          url.includes('/user/details') ||
          url.includes('/user/login') ||
          url.includes('/auth')
        ) {
          return Promise.reject(error)
        }

        // No fabricated-success fallback. Previously this block returned a
        // mock 200 with fake invoices (₹2250), fake contacts (John Doe /
        // Jane Smith), fake billing — operators could act on rows that
        // didn't exist on the server, and outage detection was impossible.
        // Now: surface the real error so the UI's empty/error state shows.
        return Promise.reject(error)
      }
      
      // For other HTTP errors (401, 403, 404, 500, etc.), let components handle them normally
      return Promise.reject(error)
    }
  )
  
  interceptorsSetup = true
  
  // Only log in debug mode
  if (window.DEBUG_MODE) {
    console.log('✅ Axios interceptors setup complete with session management')
  }
}

export default setupAxiosInterceptors
