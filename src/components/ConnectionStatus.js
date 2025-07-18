import React, { useState, useEffect } from 'react'
import { CAlert, CBadge } from '@coreui/react'

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionQuality, setConnectionQuality] = useState('good')
  const [showAlert, setShowAlert] = useState(false)
  const [lastApiCall, setLastApiCall] = useState(null)
  const [sessionHealth, setSessionHealth] = useState('good')

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (!online) {
        setShowAlert(true)
        setConnectionQuality('offline')
      } else {
        setConnectionQuality('good')
        // Hide alert after 3 seconds when coming back online
        setTimeout(() => setShowAlert(false), 3000)
      }
    }

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Monitor session health
    const monitorSession = () => {
      try {
        // Check last API call time
        const lastCall = localStorage.getItem('lastAPICall')
        if (lastCall) {
          const timeSinceLastCall = Date.now() - parseInt(lastCall)
          setLastApiCall(timeSinceLastCall)
          
          // If no API calls in the last hour, session might be stale
          if (timeSinceLastCall > 60 * 60 * 1000) {
            setSessionHealth('stale')
          } else if (timeSinceLastCall > 30 * 60 * 1000) {
            setSessionHealth('warning')
          } else {
            setSessionHealth('good')
          }
        }

        // Check for failed requests
        const errors = JSON.parse(localStorage.getItem('globalErrors') || '[]')
        const recentErrors = errors.filter(error => Date.now() - error.timestamp < 5 * 60 * 1000)
        
        if (recentErrors.length > 3) {
          setConnectionQuality('poor')
          setShowAlert(true)
        }

      } catch (error) {
        console.warn('Error monitoring session:', error)
      }
    }

    // Check session health every 30 seconds
    const sessionInterval = setInterval(monitorSession, 30000)
    
    // Initial check
    monitorSession()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(sessionInterval)
    }
  }, [])

  const getStatusColor = () => {
    if (!isOnline) return 'danger'
    if (connectionQuality === 'poor') return 'warning'
    if (sessionHealth === 'stale') return 'warning'
    return 'success'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (connectionQuality === 'poor') return 'Poor Connection'
    if (sessionHealth === 'stale') return 'Session Stale'
    if (sessionHealth === 'warning') return 'Session Inactive'
    return 'Online'
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return 'You are currently offline. The app will continue to work with cached data and sync when connection is restored.'
    }
    if (connectionQuality === 'poor') {
      return 'Connection quality is poor. Some features may be slower than usual.'
    }
    if (sessionHealth === 'stale') {
      return 'Your session has been inactive for a while. Please refresh if you experience any issues.'
    }
    return null
  }

  return (
    <>
      {/* Connection status badge - always visible in header */}
      <div className="connection-status-badge me-3">
        <CBadge 
          color={getStatusColor()} 
          shape="rounded-pill"
          title={getStatusMessage() || 'Connection is stable'}
        >
          <i className={`bi bi-${isOnline ? 'wifi' : 'wifi-off'} me-1`}></i>
          {getStatusText()}
        </CBadge>
      </div>

      {/* Alert for connection issues */}
      {showAlert && getStatusMessage() && (
        <div className="position-fixed" style={{ top: '20px', right: '20px', zIndex: 9999 }}>
          <CAlert
            color={getStatusColor()}
            dismissible
            onClose={() => setShowAlert(false)}
            className="d-flex align-items-center"
            style={{ minWidth: '300px' }}
          >
            <i className={`bi bi-${isOnline ? 'exclamation-triangle' : 'wifi-off'} me-2`}></i>
            <div>
              <strong>{getStatusText()}</strong>
              <div className="small mt-1">{getStatusMessage()}</div>
            </div>
          </CAlert>
        </div>
      )}
    </>
  )
}

export default ConnectionStatus
