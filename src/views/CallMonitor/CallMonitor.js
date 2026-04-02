import React, { useEffect, useState, useRef } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CBadge,
  
} from '@coreui/react'
import { apiCall } from '../../config/api'
import SipRegistration from '../../components/sip/SipRegistration'
import WebphoneAudio from '../../components/sip/WebphoneAudio'

const CallMonitor = () => {
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [liveCalls, setLiveCalls] = useState([])
  const [logicalCalls, setLogicalCalls] = useState([])
  const pollingRef = useRef(null)
  
  const [regStatus, setRegStatus] = useState('disconnected')
  const [ua, setUa] = useState(null)
  const [monitorSession, setMonitorSession] = useState(null)
  const [monitorCall, setMonitorCall] = useState(null)
  const [whisperSession, setWhisperSession] = useState(null)
  const [whisperCall, setWhisperCall] = useState(null)
  const [bargeSession, setBargeSession] = useState(null)
  const [bargeCall, setBargeCall] = useState(null)

  const fetchBusinessIdIfNeeded = async () => {
    if (businessId) return businessId
    try {
      const res = await apiCall('/v1/user/details', 'GET')
      const u = res.user || res.data || res
      if (u && u.businessId) {
        setBusinessId(u.businessId)
        return u.businessId
      }
    } catch (err) {
      // ignore; will show error on fetch
    }
    return null
  }

  const fetchLiveCalls = async () => {
    setError(null)
    try {
      const bId = await fetchBusinessIdIfNeeded()
      if (!bId) {
        setError('Business ID not available')
        setLiveCalls([])
        setLogicalCalls([])
        return
      }

      setLoading(true)
      const res = await apiCall(`/asterisk/livecalls/${encodeURIComponent(bId)}`, 'GET')

      // Normalize response
      const lCalls = Array.isArray(res.liveCalls) ? res.liveCalls : []
      const logCalls = Array.isArray(res.logicalCalls) ? res.logicalCalls : []

      setLiveCalls(lCalls)
      setLogicalCalls(logCalls)
    } catch (err) {
      console.error('CallMonitor fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to fetch live calls')
      setLiveCalls([])
      setLogicalCalls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial fetch
    fetchLiveCalls()

    // poll every 5 seconds
    pollingRef.current = setInterval(() => {
      fetchLiveCalls()
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  

  // SIP config (using credentials provided)
  const sipCfg = {
    sip_domain: 'pbx.justconnect.biz',
    extension: '1036',
    sip_password: 'secure_password_1036',
    ws_port: 8089,
    ws_path: '/ws',
    wss: true,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }

  const extractExtension = (call) => {
    if (!call) return null

    // Strategy 1: Try assignedAgent object
    const assigned = call?.assignedAgent || call?.agent
    if (assigned) {
      if (typeof assigned === 'object') {
        if (assigned.extension) {
          const ext = String(assigned.extension).trim()
          if (/^\d{3,}$/.test(ext)) return ext
        }
        if (assigned.ext) {
          const ext = String(assigned.ext).trim()
          if (/^\d{3,}$/.test(ext)) return ext
        }
        if (assigned.sipExtension) {
          const ext = String(assigned.sipExtension).trim()
          if (/^\d{3,}$/.test(ext)) return ext
        }
        if (assigned.sip) {
          const ext = String(assigned.sip).trim()
          if (/^\d{3,}$/.test(ext)) return ext
        }
      } else if (typeof assigned === 'string') {
        // extract digits if it's a string
        const digits = assigned.replace(/\D/g, '')
        if (digits && /^\d{3,}$/.test(digits)) return digits
      }
    }

    // Strategy 2: Parse from channel (SIP channel usually has format like "SIP/1234-xyz")
    const channel = call?.channel || call?.legs?.[0]?.channel
    if (channel && typeof channel === 'string') {
      const m = channel.match(/[/:@](\d{3,})(?:[/-]|$)/)
      if (m && m[1]) {
        const ext = String(m[1]).trim()
        if (/^\d{3,}$/.test(ext)) return ext
      }
      // Try alternative pattern
      const m2 = channel.match(/(\d{3,})/)
      if (m2 && m2[1]) return m2[1]
    }

    // Strategy 3: Try other agent-related fields
    if (call?.agentExtension) {
      const ext = String(call.agentExtension).trim()
      if (/^\d{3,}$/.test(ext)) return ext
    }
    if (call?.agentId && /^\d{3,}$/.test(String(call.agentId).trim())) {
      return String(call.agentId).trim()
    }

    // Strategy 4: Extract from raw if available
    if (call?.raw && typeof call.raw === 'string') {
      const m = call.raw.match(/(\d{3,})/)
      if (m && m[1]) return m[1]
    }

    console.warn('Could not extract extension from call:', call)
    return null
  }

  // Helper to initiate monitor/whisper/barge with proper session listeners
  const initiateCall = async (callType, call) => {
    const ext = extractExtension(call)
    
    console.log(`[${callType}] Attempting call:`, {
      ext,
      callData: {
        assignedAgent: call?.assignedAgent,
        agent: call?.agent,
        channel: call?.channel,
        raw: call?.raw?.slice(0, 100),
      }
    })

    if (!ext) {
      alert(`Could not determine extension to ${callType} for this call.\n\nDebug Info:\nAgent: ${call?.assignedAgent?.name || call?.agent || 'unknown'}\nNo valid extension found in call data.`)
      return
    }

    // Validate extension format
    if (!/^\d{3,}$/.test(ext)) {
      alert(`Invalid extension format: "${ext}". Extension must be at least 3 digits.`)
      return
    }

    if (!ua) {
      alert('SIP UA not ready; please wait for registration.')
      return
    }

    const domain = (ua.configuration && ua.configuration.uri && ua.configuration.uri.host) || sipCfg.sip_domain || ''
    
    // Build dial string based on callType
    let dial = ''
    if (callType === 'monitor') dial = `*90${ext}`
    else if (callType === 'whisper') dial = `*91${ext}`
    else if (callType === 'barge') dial = `*92${ext}`
    else return

    const target = domain ? `sip:${dial}@${domain}` : `sip:${dial}`

    try {
      // Request microphone access BEFORE initiating call
      let localStream = null
      try {
        console.log(`[${callType}] Requesting microphone access...`)
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        })
        console.log(`[${callType}] Microphone access granted, local stream:`, localStream)
      } catch (micErr) {
        console.warn(`[${callType}] Microphone access failed (this may prevent two-way audio):`, micErr)
        alert(`Microphone access denied. ${callType} will be audio-out-only.\n\nPlease allow microphone access in browser settings.`)
        // Continue anyway - at least they can listen
      }

      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: { 
          iceServers: sipCfg.iceServers,
          // Ensure ICE consent check is enabled
          iceTransportPolicy: 'all',
        },
        // Pass local stream if available so it gets added to peer connection
        ...(localStream && { mediaStream: localStream })
      }
      
      console.log(`[${callType}] Initiating SIP call to: ${target}`)
      
      // Create session
      const session = ua.call(target, options)

      // Helper to clean up session
      const cleanup = () => {
        // Stop local stream tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            try { track.stop() } catch (e) {}
          })
        }

        if (callType === 'monitor') { setMonitorSession(null); setMonitorCall(null) }
        else if (callType === 'whisper') { setWhisperSession(null); setWhisperCall(null) }
        else if (callType === 'barge') { setBargeSession(null); setBargeCall(null) }
      }

      // Attach event listeners BEFORE storing in state to ensure they fire
      // This prevents race conditions where the session might end before listeners attach
      if (session && typeof session.on === 'function') {
        session.on('progress', () => {
          console.debug(`[${callType}] Call in progress to ${target}`)
        })
        session.on('confirmed', () => {
          console.debug(`[${callType}] Call confirmed to ${target}`)
          // Ensure local stream is added to peer connection if not already
          if (localStream && session.connection) {
            try {
              localStream.getTracks().forEach(track => {
                const senders = session.connection.getSenders ? session.connection.getSenders() : []
                const hasTrack = senders.some(s => s.track === track)
                if (!hasTrack) {
                  console.log(`[${callType}] Adding local ${track.kind} track to peer connection`)
                  session.connection.addTrack(track, localStream)
                }
              })
            } catch (e) {
              console.warn(`[${callType}] Error adding local stream to peer connection:`, e)
            }
          }
        })
        session.on('ended', () => {
          console.debug(`[${callType}] Call ended`)
          cleanup()
        })
        session.on('failed', (data) => {
          const errorMsg = data?.cause || (data?.message && data.message.reason) || 'Unknown error'
          console.error(`[${callType}] Call failed:`, { cause: errorMsg, data, dial, ext, target })
          alert(`${callType.charAt(0).toUpperCase() + callType.slice(1)} failed (${errorMsg}).\n\nDial: ${dial}\nExt: ${ext}`)
          cleanup()
        })
      }

      // NOW store the session in state - listeners are already attached
      if (callType === 'monitor') { setMonitorSession(session); setMonitorCall(call) }
      else if (callType === 'whisper') { setWhisperSession(session); setWhisperCall(call) }
      else if (callType === 'barge') { setBargeSession(session); setBargeCall(call) }

      console.debug(`[${callType}] Session created`, { session, ext, target, localStream })
    } catch (err) {
      console.error(`[${callType}] Failed:`, err)
      alert(`${callType.charAt(0).toUpperCase() + callType.slice(1)} failed: ${String(err.message || err)}\n\nExt: ${ext}`)
    }
  }

  const handleBargeClick = (call) => {
    initiateCall('barge', call)
  }

  const handleMonitorClick = (call) => {
    initiateCall('monitor', call)
  }

  const handleWhisperClick = (call) => {
    initiateCall('whisper', call)
  }

  // Heuristic to determine if a live call is inbound or outbound.
  // Strategy:
  // 1. Prefer explicit phone-number tokens (these indicate a dialed number -> Outgoing).
  // 2. If no phone tokens but UUID/group tokens are present, treat as Inbound (grouped/incoming legs).
  // 3. Use raw text hints (e.g. "incoming", "outbound", "Dial") as tiebreakers.
  const detectDirection = (call) => {
    const leg = (call.legs && call.legs[0]) || call
    const raw = String(leg?.raw || call?.raw || '')
    const rawLower = raw.toLowerCase()
    const tokens = Array.isArray(leg?.tokens || call?.tokens) ? (leg?.tokens || call?.tokens || []) : []

    const phoneRegex = /^\+?\d{7,15}$/
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

    const phoneTokens = tokens.filter((t) => typeof t === 'string' && phoneRegex.test(t))
    const uuidTokens = tokens.filter((t) => typeof t === 'string' && uuidRegex.test(t))

    // If there are clear phone tokens, this most often indicates an outbound/dialed call
    if (phoneTokens.length > 0) {
      // Many outbound raws include 'Dial' or multiple phone tokens
      if (phoneTokens.length >= 1) return 'Outgoing'
    }

    // If there are UUID-like tokens and no phone numbers, treat as inbound/grouped
    if (uuidTokens.length > 0 && phoneTokens.length === 0) return 'Inbound'

    // Raw text hints as fallback
    if (/\bincoming\b/i.test(rawLower) || /from-external/i.test(rawLower)) return 'Inbound'
    if (/\boutgoing\b/i.test(rawLower) || /outbound/i.test(rawLower) || /\bdial\b/i.test(rawLower)) return 'Outgoing'

    // If nothing else, prefer Inbound when there's no phone-like token, otherwise Outgoing
    return phoneTokens.length > 0 ? 'Outgoing' : 'Inbound'
  }

  return (
    <>
    <CRow>
      <CCol>
        <CCard>
          <div>
              <style>{`
                .compact-table th, .compact-table td { padding: 0.25rem 0.4rem !important; vertical-align: middle !important; line-height: 1.15 !important; }
                .compact-table td { overflow: hidden; text-overflow: ellipsis; }
              `}</style>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Call Monitor</h3>
                  <CBadge color={regStatus === 'registered' ? 'success' : regStatus === 'connected' ? 'info' : regStatus === 'connecting' ? 'warning' : 'secondary'}>{regStatus}</CBadge>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={fetchLiveCalls} disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</button>
                </div>
              </CCardHeader>

              <CCardBody>
                <SipRegistration sipConfig={sipCfg} enableDebug={false} onRegistrationStatus={setRegStatus} onUaReady={(u) => setUa(u)} />

                {error && <div style={{ color: 'var(--cui-danger)' }}>{error}</div>}

                <div style={{ marginTop: 12 }}>
                  {loading && !liveCalls.length ? (
                    <div style={{ padding: 20 }}><CSpinner />&nbsp;Loading live calls...</div>
                  ) : (
                    <>
                      {liveCalls.length === 0 ? (
                        <div style={{ padding: 20 }}><CBadge color="secondary">No active calls</CBadge></div>
                      ) : (
                        <CTable striped hover responsive className="table-sm compact-table" style={{ tableLayout: 'auto' }}>
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell>Direction</CTableHeaderCell>
                              <CTableHeaderCell>Channel</CTableHeaderCell>
                              <CTableHeaderCell>Status</CTableHeaderCell>
                              <CTableHeaderCell>Duration</CTableHeaderCell>
                              <CTableHeaderCell>DID</CTableHeaderCell>
                              <CTableHeaderCell>Agent</CTableHeaderCell>
                              <CTableHeaderCell>Branch</CTableHeaderCell>
                              <CTableHeaderCell>Raw</CTableHeaderCell>
                              <CTableHeaderCell>Actions</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {liveCalls.map((c, idx) => (
                              <CTableRow key={`${c.channel || c.groupId || idx}-${idx}`}>
                                <CTableDataCell>
                                  {(() => {
                                    const dir = detectDirection(c)
                                    return (
                                      <CBadge color={dir === 'Outgoing' ? 'primary' : dir === 'Inbound' ? 'info' : 'secondary'}>
                                        {dir}
                                      </CBadge>
                                    )
                                  })()}
                                </CTableDataCell>
                                <CTableDataCell>{c.channel || '-'}</CTableDataCell>
                                <CTableDataCell>
                                  <CBadge color={String(c.status || '').toLowerCase() === 'up' ? 'success' : String(c.status || '').toLowerCase() === 'ring' ? 'warning' : 'secondary'}>
                                    {c.status || '-'}
                                  </CBadge>
                                </CTableDataCell>
                                <CTableDataCell>{c.duration || '-'}</CTableDataCell>
                                <CTableDataCell>{c.did?.number || c.tokens?.[3] || '-'}</CTableDataCell>
                                <CTableDataCell>{c.assignedAgent?.name || c.assignedAgent?.email || '-'}</CTableDataCell>
                                <CTableDataCell>{c.branch?.branchName || '-'}</CTableDataCell>
                                <CTableDataCell style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.raw || '-'}</CTableDataCell>
                                <CTableDataCell>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <CButton
                                      size="sm"
                                      color="info"
                                      onClick={() => handleMonitorClick(c)}
                                      disabled={regStatus !== 'registered' || !ua}
                                    >
                                      Monitor
                                    </CButton>
                                    <CButton
                                      size="sm"
                                      color="warning"
                                      onClick={() => handleWhisperClick(c)}
                                      disabled={regStatus !== 'registered' || !ua}
                                    >
                                      Whisper
                                    </CButton>
                                    <CButton
                                      size="sm"
                                      color="success"
                                      onClick={() => handleBargeClick(c)}
                                      disabled={regStatus !== 'registered' || !ua}
                                    >
                                      Barge
                                    </CButton>
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      )}
                    </>
                  )}
                </div>
          </CCardBody>
              </div>
        </CCard>
      </CCol>
      </CRow>

      {/* Monitor session audio playback */}
      {monitorSession && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, width: 360, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.1)', zIndex: 1110 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Monitoring <strong>{monitorCall?.assignedAgent?.name || monitorCall?.assignedAgent?.email || monitorCall?.agent || 'agent'}</strong></div>
            <div>
              <CButton size="sm" color="danger" onClick={() => { 
                try { 
                  if (monitorSession && typeof monitorSession.terminate === 'function') {
                    monitorSession.terminate()
                  }
                } catch(e){ console.warn('Error terminating monitor session', e) }
                setMonitorSession(null)
                setMonitorCall(null)
              }}>Hangup</CButton>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <WebphoneAudio session={monitorSession} />
          </div>
        </div>
      )}

      {/* Whisper session audio playback */}
      {whisperSession && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, width: 360, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.1)', zIndex: 1100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Whispering to <strong>{whisperCall?.assignedAgent?.name || whisperCall?.assignedAgent?.email || whisperCall?.agent || 'agent'}</strong></div>
            <div>
              <CButton size="sm" color="danger" onClick={() => { 
                try { 
                  if (whisperSession && typeof whisperSession.terminate === 'function') {
                    whisperSession.terminate()
                  }
                } catch(e){ console.warn('Error terminating whisper session', e) }
                setWhisperSession(null)
                setWhisperCall(null)
              }}>Hangup</CButton>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <WebphoneAudio session={whisperSession} />
          </div>
        </div>
      )}

      {/* Barge session audio playback */}
      {bargeSession && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, width: 360, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.1)', zIndex: 1090 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Barging into <strong>{bargeCall?.assignedAgent?.name || bargeCall?.assignedAgent?.email || bargeCall?.agent || 'agent'}</strong></div>
            <div>
              <CButton size="sm" color="danger" onClick={() => { 
                try { 
                  if (bargeSession && typeof bargeSession.terminate === 'function') {
                    bargeSession.terminate()
                  }
                } catch(e){ console.warn('Error terminating barge session', e) }
                setBargeSession(null)
                setBargeCall(null)
              }}>Hangup</CButton>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <WebphoneAudio session={bargeSession} />
          </div>
        </div>
      )}
    </>
  )
}

export default CallMonitor
