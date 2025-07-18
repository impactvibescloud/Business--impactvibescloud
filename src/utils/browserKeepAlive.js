// Keep-alive utility to prevent browser timeout and maintain session
// This ensures the application stays responsive even after hours of being open

class BrowserKeepAlive {
  constructor() {
    this.isActive = false
    this.intervals = []
    this.heartbeatInterval = null
    this.visibilityChangeHandler = null
    this.beforeUnloadHandler = null
    
    // Configuration
    this.HEARTBEAT_INTERVAL = 15 * 60 * 1000 // 15 minutes
    this.VISIBILITY_CHECK_INTERVAL = 30 * 1000 // 30 seconds
    this.STORAGE_CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour
    
    this.initialize()
  }
  
  initialize() {
    if (this.isActive) return
    
    this.setupHeartbeat()
    this.setupVisibilityHandling()
    this.setupStorageManagement()
    this.setupNetworkMonitoring()
    this.setupErrorPrevention()
    
    this.isActive = true
    console.log('✅ Browser Keep-Alive initialized')
  }
  
  setupHeartbeat() {
    // Send periodic heartbeat to keep session alive
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
    
    // Send initial heartbeat
    setTimeout(() => this.sendHeartbeat(), 5000) // Wait 5 seconds after init
  }
  
  async sendHeartbeat() {
    try {
      // Create a lightweight request to keep connection alive
      const timestamp = Date.now()
      
      // Try multiple endpoints to ensure session stays active
      const endpoints = [
        '/api/v1/user/details', // Primary endpoint for user validation
        '/api/config',          // Lightweight config endpoint
        '/api/contacts'         // Backup endpoint
      ]
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Cache-Control': 'no-cache',
              'X-Heartbeat': timestamp.toString()
            },
            timeout: 10000
          })
          
          if (response.ok) {
            console.log(`💓 Heartbeat successful via ${endpoint}`)
            localStorage.setItem('lastHeartbeat', timestamp.toString())
            return
          }
        } catch (endpointError) {
          console.warn(`⚠️ Heartbeat failed for ${endpoint}:`, endpointError.message)
        }
      }
      
      // If all endpoints fail, try a simple fetch to detect network issues
      try {
        await fetch('/favicon.ico', { method: 'HEAD', timeout: 5000 })
        console.log('💓 Network is available but API endpoints unreachable')
      } catch (networkError) {
        console.warn('🔴 Network appears to be offline')
      }
      
    } catch (error) {
      console.warn('⚠️ Heartbeat error:', error.message)
    }
  }
  
  setupVisibilityHandling() {
    // Handle page visibility changes
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        console.log('📵 Page hidden - reducing activity')
        this.reduceActivity()
      } else {
        console.log('👁️ Page visible - resuming normal activity')
        this.resumeActivity()
        // Send heartbeat when page becomes visible
        setTimeout(() => this.sendHeartbeat(), 1000)
      }
    }
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
    
    // Handle focus/blur events
    const focusHandler = () => {
      console.log('🎯 Window focused - user active')
      localStorage.setItem('lastFocus', Date.now().toString())
      this.sendHeartbeat()
    }
    
    const blurHandler = () => {
      console.log('🌫️ Window blurred - user inactive')
      localStorage.setItem('lastBlur', Date.now().toString())
    }
    
    window.addEventListener('focus', focusHandler)
    window.addEventListener('blur', blurHandler)
    
    // Store event listeners for cleanup
    this.intervals.push({ type: 'event', target: window, event: 'focus', handler: focusHandler })
    this.intervals.push({ type: 'event', target: window, event: 'blur', handler: blurHandler })
  }
  
  setupStorageManagement() {
    // Clean up localStorage periodically to prevent memory issues
    const storageCleanup = () => {
      try {
        const now = Date.now()
        const keysToCheck = [
          'apiCache_',
          'tempData_',
          'sessionTemp_'
        ]
        
        let cleanedCount = 0
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i)
          if (key) {
            // Remove keys that match patterns and are older than 24 hours
            const shouldCheck = keysToCheck.some(pattern => key.startsWith(pattern))
            if (shouldCheck) {
              try {
                const item = localStorage.getItem(key)
                const data = JSON.parse(item)
                if (data.timestamp && now - data.timestamp > 24 * 60 * 60 * 1000) {
                  localStorage.removeItem(key)
                  cleanedCount++
                }
              } catch (parseError) {
                // If can't parse, it might be old data, remove it
                localStorage.removeItem(key)
                cleanedCount++
              }
            }
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned ${cleanedCount} old storage items`)
        }
        
        // Update storage health metrics
        const usage = JSON.stringify(localStorage).length
        localStorage.setItem('storageHealth', JSON.stringify({
          timestamp: now,
          usage: usage,
          itemCount: localStorage.length
        }))
        
      } catch (error) {
        console.warn('⚠️ Storage cleanup error:', error.message)
      }
    }
    
    // Run storage cleanup periodically
    const cleanupInterval = setInterval(storageCleanup, this.STORAGE_CLEANUP_INTERVAL)
    this.intervals.push({ type: 'interval', id: cleanupInterval })
    
    // Run initial cleanup after 10 seconds
    setTimeout(storageCleanup, 10000)
  }
  
  setupNetworkMonitoring() {
    // Monitor network status
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine
      const timestamp = Date.now()
      
      localStorage.setItem('networkStatus', JSON.stringify({
        isOnline,
        timestamp,
        lastChange: timestamp
      }))
      
      console.log(`🌐 Network status: ${isOnline ? 'Online' : 'Offline'}`)
      
      if (isOnline) {
        // Send heartbeat when network comes back online
        setTimeout(() => this.sendHeartbeat(), 2000)
      }
    }
    
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // Store event listeners for cleanup
    this.intervals.push({ type: 'event', target: window, event: 'online', handler: updateNetworkStatus })
    this.intervals.push({ type: 'event', target: window, event: 'offline', handler: updateNetworkStatus })
    
    // Initial network status
    updateNetworkStatus()
  }
  
  setupErrorPrevention() {
    // Prevent common browser timeout errors
    
    // Handle beforeunload to save state
    this.beforeUnloadHandler = (event) => {
      console.log('📤 Page unloading - saving state')
      
      const state = {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionDuration: Date.now() - (parseInt(localStorage.getItem('sessionStart')) || Date.now())
      }
      
      localStorage.setItem('lastPageUnload', JSON.stringify(state))
      
      // Don't show confirmation dialog unless there's unsaved data
      // event.preventDefault()
      // event.returnValue = ''
    }
    
    window.addEventListener('beforeunload', this.beforeUnloadHandler)
    
    // Handle unhandled promise rejections
    const unhandledRejectionHandler = (event) => {
      console.warn('🚨 Unhandled promise rejection:', event.reason)
      
      // Log to localStorage for debugging
      try {
        const errors = JSON.parse(localStorage.getItem('unhandledErrors') || '[]')
        errors.push({
          timestamp: Date.now(),
          reason: event.reason?.toString() || 'Unknown error',
          type: 'unhandledrejection'
        })
        
        // Keep only last 10 errors
        if (errors.length > 10) {
          errors.splice(0, errors.length - 10)
        }
        
        localStorage.setItem('unhandledErrors', JSON.stringify(errors))
      } catch (logError) {
        console.warn('Failed to log error:', logError)
      }
      
      // Prevent the error from causing app crashes
      event.preventDefault()
    }
    
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)
    
    // Handle general errors
    const errorHandler = (event) => {
      console.warn('🚨 Global error:', event.error)
      
      try {
        const errors = JSON.parse(localStorage.getItem('globalErrors') || '[]')
        errors.push({
          timestamp: Date.now(),
          message: event.error?.message || event.message || 'Unknown error',
          filename: event.filename || 'Unknown file',
          lineno: event.lineno || 0,
          type: 'error'
        })
        
        // Keep only last 10 errors
        if (errors.length > 10) {
          errors.splice(0, errors.length - 10)
        }
        
        localStorage.setItem('globalErrors', JSON.stringify(errors))
      } catch (logError) {
        console.warn('Failed to log global error:', logError)
      }
    }
    
    window.addEventListener('error', errorHandler)
    
    // Store event listeners for cleanup
    this.intervals.push({ type: 'event', target: window, event: 'beforeunload', handler: this.beforeUnloadHandler })
    this.intervals.push({ type: 'event', target: window, event: 'unhandledrejection', handler: unhandledRejectionHandler })
    this.intervals.push({ type: 'event', target: window, event: 'error', handler: errorHandler })
  }
  
  reduceActivity() {
    // Reduce background activity when page is hidden
    console.log('😴 Reducing background activity')
    
    // Store current heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
      }, this.HEARTBEAT_INTERVAL * 2) // Double the interval when hidden
    }
  }
  
  resumeActivity() {
    // Resume normal activity when page becomes visible
    console.log('😊 Resuming normal activity')
    
    // Restore normal heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
      }, this.HEARTBEAT_INTERVAL)
    }
  }
  
  getStatus() {
    // Return current status of keep-alive system
    const lastHeartbeat = localStorage.getItem('lastHeartbeat')
    const networkStatus = JSON.parse(localStorage.getItem('networkStatus') || '{}')
    const storageHealth = JSON.parse(localStorage.getItem('storageHealth') || '{}')
    
    return {
      isActive: this.isActive,
      lastHeartbeat: lastHeartbeat ? new Date(parseInt(lastHeartbeat)) : null,
      timeSinceHeartbeat: lastHeartbeat ? Date.now() - parseInt(lastHeartbeat) : null,
      networkStatus: networkStatus.isOnline,
      storageUsage: storageHealth.usage || 0,
      activeIntervals: this.intervals.length,
      documentVisible: !document.hidden,
      windowFocused: document.hasFocus()
    }
  }
  
  destroy() {
    // Clean up all intervals and event listeners
    console.log('🧹 Destroying Browser Keep-Alive')
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    // Clean up all stored intervals and event listeners
    this.intervals.forEach(item => {
      if (item.type === 'interval') {
        clearInterval(item.id)
      } else if (item.type === 'event') {
        item.target.removeEventListener(item.event, item.handler)
      }
    })
    
    // Remove visibility change handler
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
    }
    
    this.intervals = []
    this.isActive = false
  }
}

// Create singleton instance
const browserKeepAlive = new BrowserKeepAlive()

export default browserKeepAlive
export { BrowserKeepAlive }
