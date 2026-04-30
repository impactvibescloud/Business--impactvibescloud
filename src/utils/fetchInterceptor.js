// Global fetch interceptor to handle any remaining direct fetch calls
// This will catch any components that still use fetch() directly

let originalFetch = null

export const setupFetchInterceptor = () => {
  if (originalFetch) return // Already setup
  
  originalFetch = window.fetch
  
  window.fetch = async (url, options = {}) => {
    // Enhanced URL interception - catch all variations of the production API URL
    // Proxy rewrite is opt-in. Set `REACT_APP_FORCE_PROXY=true` to enable
    // legacy behaviour that rewrites absolute API URLs into relative paths
    // (so hosting-level redirects/proxy rules can forward them). For
    // production deployments that should call the API directly, leave this
    // unset or false.
    if (
      process.env.REACT_APP_FORCE_PROXY === 'true' &&
      typeof url === 'string' && url.includes('https://api.justconnect.biz')
    ) {
      // Clean and normalize the URL (strip the host so hosting redirects can match)
      let cleanUrl = url.replace(/^https?:\/\//, '').replace('https://api.justconnect.biz', '').replace(/^\/+/, '')
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl
      }
      console.warn('🔄 Redirecting direct fetch call to proxy:', url, '->', cleanUrl)
      url = cleanUrl
    }
    
    // Special-case: convert JSON POSTs to the login endpoint into
    // application/x-www-form-urlencoded so the browser doesn't issue
    // a CORS preflight OPTIONS request (makes the request "simple").
    // This is intentionally targeted to the login endpoint only.
    try {
      try {
        const isLogin = typeof url === 'string' && url.includes('/api/v1/user/login')
        const method = (options && options.method) ? options.method.toString().toUpperCase() : 'GET'
        if (isLogin && method === 'POST' && options && options.body) {
          // Normalize headers access (Headers instance or plain object)
          const headers = options.headers instanceof Headers ? options.headers : Object.assign({}, options.headers || {})
          const contentType = (headers['Content-Type'] || headers['content-type'] || '').toString().toLowerCase()

          if (contentType === 'application/json') {
            try {
              const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
              // Only convert plain objects
              if (parsed && typeof parsed === 'object' && !(parsed instanceof FormData)) {
                const params = new URLSearchParams()
                Object.keys(parsed).forEach(k => {
                  const v = parsed[k]
                  if (v !== undefined && v !== null) params.append(k, String(v))
                })
                options.body = params.toString()
                if (options.headers instanceof Headers) options.headers.set('Content-Type', 'application/x-www-form-urlencoded')
                else options.headers = Object.assign({}, headers, { 'Content-Type': 'application/x-www-form-urlencoded' })
                console.warn('🔄 Converted login JSON POST to x-www-form-urlencoded to avoid preflight')
              }
            } catch (e) {
              // leave body as-is if parsing fails
            }
          }
        }
      } catch (e) {
        // ignore conversion errors and proceed
      }
      return await originalFetch(url, options)
    } catch (error) {
      // No fabricated-success fallback. Previously this block returned
      // mock contacts (John Doe / Jane Smith) and mock call-logs that the
      // UI presented as if they were real, masking outages and enabling
      // users to act on data that didn't exist server-side. Now the real
      // failure propagates to the caller.
      throw error
    }
  }
  
  console.log('✅ Fetch interceptor setup complete')
}

export const restoreFetch = () => {
  if (originalFetch) {
    window.fetch = originalFetch
    originalFetch = null
  }
}

export default setupFetchInterceptor
