import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CBadge,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CSpinner
} from '@coreui/react'

function SessionDiagnostics() {
  const [sessionInfo, setSessionInfo] = useState(null)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [storageInfo, setStorageInfo] = useState(null)
  const [errorLogs, setErrorLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDiagnostics = async () => {
    try {
      // Load session manager info
      const { default: sessionManager } = await import('../../utils/sessionManager')
      const sessionData = sessionManager.getSessionInfo()
      setSessionInfo(sessionData)

      // Load browser keep-alive info
      const { default: browserKeepAlive } = await import('../../utils/browserKeepAlive')
      const keepAliveStatus = browserKeepAlive.getStatus()
      setConnectionInfo(keepAliveStatus)

      // Load storage information
      const storageData = {
        usage: JSON.stringify(localStorage).length,
        itemCount: localStorage.length,
        lastCleanup: localStorage.getItem('storageHealth'),
        networkStatus: JSON.parse(localStorage.getItem('networkStatus') || '{}'),
        lastAPICall: localStorage.getItem('lastAPICall'),
        lastHeartbeat: localStorage.getItem('lastHeartbeat')
      }
      setStorageInfo(storageData)

      // Load error logs
      const globalErrors = JSON.parse(localStorage.getItem('globalErrors') || '[]')
      const unhandledErrors = JSON.parse(localStorage.getItem('unhandledErrors') || '[]')
      const allErrors = [...globalErrors, ...unhandledErrors]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10) // Last 10 errors
      setErrorLogs(allErrors)

    } catch (error) {
      console.error('Error loading diagnostics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadDiagnostics()
  }

  const handleClearErrors = () => {
    localStorage.removeItem('globalErrors')
    localStorage.removeItem('unhandledErrors')
    setErrorLogs([])
  }

  const handleForceSessionRefresh = async () => {
    try {
      const { default: sessionManager } = await import('../../utils/sessionManager')
      const success = await sessionManager.forceRefresh()
      if (success) {
        alert('Session refreshed successfully!')
      } else {
        alert('Session refresh failed. You may need to log in again.')
      }
      loadDiagnostics()
    } catch (error) {
      alert('Error refreshing session: ' + error.message)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(parseInt(timestamp))
    return date.toLocaleString()
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getHealthBadge = (condition, goodText = 'Good', badText = 'Issue') => {
    return (
      <CBadge color={condition ? 'success' : 'danger'}>
        {condition ? goodText : badText}
      </CBadge>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <p className="mt-2">Loading diagnostics...</p>
      </div>
    )
  }

  return (
    <div className="session-diagnostics">
      <CRow className="mb-4">
        <CCol>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Session Diagnostics</h2>
            <CButton 
              color="primary" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              {refreshing ? <CSpinner size="sm" className="me-2" /> : null}
              Refresh
            </CButton>
          </div>
        </CCol>
      </CRow>

      {/* Session Health Overview */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <h5>Session Health</h5>
            </CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell><strong>Session Valid</strong></CTableDataCell>
                    <CTableDataCell>
                      {getHealthBadge(sessionInfo?.isValid, 'Valid', 'Invalid')}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Time Until Expiry</strong></CTableDataCell>
                    <CTableDataCell>
                      {sessionInfo?.expiresIn ? formatDuration(sessionInfo.expiresIn * 1000) : 'Unknown'}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Last Activity</strong></CTableDataCell>
                    <CTableDataCell>
                      {formatTime(sessionInfo?.lastActivity)}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Time Since Activity</strong></CTableDataCell>
                    <CTableDataCell>
                      {sessionInfo?.timeSinceActivity ? formatDuration(sessionInfo.timeSinceActivity) : 'N/A'}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
              <CButton 
                color="warning" 
                size="sm" 
                onClick={handleForceSessionRefresh}
                className="mt-2"
              >
                Force Session Refresh
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <h5>Connection Status</h5>
            </CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell><strong>Keep-Alive Active</strong></CTableDataCell>
                    <CTableDataCell>
                      {getHealthBadge(connectionInfo?.isActive, 'Active', 'Inactive')}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Network Status</strong></CTableDataCell>
                    <CTableDataCell>
                      {getHealthBadge(connectionInfo?.networkStatus, 'Online', 'Offline')}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Document Visible</strong></CTableDataCell>
                    <CTableDataCell>
                      {getHealthBadge(connectionInfo?.documentVisible, 'Visible', 'Hidden')}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Window Focused</strong></CTableDataCell>
                    <CTableDataCell>
                      {getHealthBadge(connectionInfo?.windowFocused, 'Focused', 'Blurred')}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Last Heartbeat</strong></CTableDataCell>
                    <CTableDataCell>
                      {formatTime(storageInfo?.lastHeartbeat)}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Storage and Performance */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <h5>Storage and Performance</h5>
            </CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell><strong>LocalStorage Usage</strong></CTableDataCell>
                    <CTableDataCell>
                      {(storageInfo?.usage / 1024).toFixed(2)} KB ({storageInfo?.itemCount} items)
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Last API Call</strong></CTableDataCell>
                    <CTableDataCell>
                      {formatTime(storageInfo?.lastAPICall)}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Session Start</strong></CTableDataCell>
                    <CTableDataCell>
                      {formatTime(localStorage.getItem('sessionStart'))}
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableDataCell><strong>Session Duration</strong></CTableDataCell>
                    <CTableDataCell>
                      {localStorage.getItem('sessionStart') ? 
                        formatDuration(Date.now() - parseInt(localStorage.getItem('sessionStart'))) : 
                        'Unknown'
                      }
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Error Logs */}
      <CRow>
        <CCol>
          <CCard>
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Recent Errors</h5>
                {errorLogs.length > 0 && (
                  <CButton 
                    color="danger" 
                    size="sm" 
                    onClick={handleClearErrors}
                  >
                    Clear Errors
                  </CButton>
                )}
              </div>
            </CCardHeader>
            <CCardBody>
              {errorLogs.length === 0 ? (
                <CAlert color="success">
                  <i className="bi bi-check-circle me-2"></i>
                  No recent errors found. Your session is healthy!
                </CAlert>
              ) : (
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Time</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Message</CTableHeaderCell>
                      <CTableHeaderCell>Location</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {errorLogs.map((error, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>
                          {new Date(error.timestamp).toLocaleString()}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={error.type === 'error' ? 'danger' : 'warning'}>
                            {error.type}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{error.message || error.reason}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{error.filename}:{error.lineno}</small>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default SessionDiagnostics
