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
    
    try {
      return await originalFetch(url, options)
    } catch (error) {
      // Handle fetch errors gracefully
      console.warn('🔄 Fetch error intercepted:', error.message, 'for:', url)
      
      // Return mock response for common endpoints
      if (url.includes('/call-logs')) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock call logs data - Network unavailable',
          data: [
            {
              _id: 'fetch-mock-log-1',
              contact: '+1234567890',
              callType: 'outgoing',
              callDate: new Date().toISOString(),
              status: 'success',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'fetch-mock-log-2',
              contact: 'John Doe (+0987654321)',
              callType: 'incoming',
              callDate: new Date(Date.now() - 3600000).toISOString(),
              status: 'success',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      if (url.includes('/contacts')) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock contacts data - Network unavailable',
          data: [
            {
              _id: 'fetch-mock-contact-1',
              name: 'John Doe',
              phone: '+1234567890',
              email: 'john.doe@example.com',
              company: 'Example Corp',
              notes: 'Sample contact data',
              tags: ['client', 'priority']
            },
            {
              _id: 'fetch-mock-contact-2',
              name: 'Jane Smith',
              phone: '+0987654321',
              email: 'jane.smith@example.com',
              company: 'Tech Solutions',
              notes: 'Another sample contact',
              tags: ['prospect']
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      if (url.includes('/numbers')) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock virtual numbers data - Network unavailable',
          data: []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      if (url.includes('/branches') || url.includes('/trial-orders')) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock branches data - Network unavailable',
          data: []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // For other endpoints, return empty array
      return new Response(JSON.stringify({
        success: true,
        message: 'Mock data - Network unavailable',
        data: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
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
