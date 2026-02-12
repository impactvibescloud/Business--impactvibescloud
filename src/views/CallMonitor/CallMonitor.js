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
    const assigned = call?.assignedAgent || call?.agent
    if (assigned) {
      if (typeof assigned === 'object') {
        if (assigned.extension) return String(assigned.extension)
        if (assigned.ext) return String(assigned.ext)
        if (assigned.sipExtension) return String(assigned.sipExtension)
      } else if (typeof assigned === 'string' && /^\d+$/.test(assigned)) {
        return assigned
      }
    }

    const channel = call?.channel || call?.legs?.[0]?.channel
    if (channel && typeof channel === 'string') {
      const m = channel.match(/\/(\d+)(?:-|$)/)
      if (m && m[1]) return m[1]
    }

    if (call?.agent && typeof call.agent === 'string' && /\d+/.test(call.agent)) {
      const m = call.agent.match(/(\d{3,})/)
      if (m) return m[1]
    }

    return null
  }

  const handleBargeClick = async (call) => {
    const ext = extractExtension(call)
    if (!ext) {
      alert('Could not determine extension to barge for this call.')
      return
    }
    if (!ua) {
      alert('SIP UA not ready; please wait for registration.')
      return
    }
    const domain = (ua.configuration && ua.configuration.uri && ua.configuration.uri.host) || sipCfg.sip_domain || ''
    const dial = `*92${ext}`
    const target = domain ? `sip:${dial}@${domain}` : `sip:${dial}`
    try {
      const options = { mediaConstraints: { audio: true, video: false }, pcConfig: { iceServers: sipCfg.iceServers } }
      const session = ua.call(target, options)
      setBargeSession(session)
      setBargeCall(call)
      session.on && session.on('ended', () => { setBargeSession(null); setBargeCall(null) })
      session.on && session.on('failed', () => { setBargeSession(null); setBargeCall(null) })
    } catch (err) {
      console.error('Barge failed', err)
      alert('Barge failed: ' + String(err))
    }
  }

  const handleMonitorClick = async (call) => {
    const ext = extractExtension(call)
    if (!ext) {
      alert('Could not determine extension to monitor for this call.')
      return
    }
    if (!ua) { alert('SIP UA not ready; please wait for registration.'); return }
    const domain = (ua.configuration && ua.configuration.uri && ua.configuration.uri.host) || sipCfg.sip_domain || ''
    const dial = `*90${ext}`
    const target = domain ? `sip:${dial}@${domain}` : `sip:${dial}`
    try {
      const options = { mediaConstraints: { audio: true, video: false }, pcConfig: { iceServers: sipCfg.iceServers } }
      const session = ua.call(target, options)
      setMonitorSession(session)
      setMonitorCall(call)
      session.on && session.on('ended', () => { setMonitorSession(null); setMonitorCall(null) })
      session.on && session.on('failed', () => { setMonitorSession(null); setMonitorCall(null) })
    } catch (err) {
      console.error('Monitor failed', err)
      alert('Monitor failed: ' + String(err))
    }
  }

  const handleWhisperClick = async (call) => {
    const ext = extractExtension(call)
    if (!ext) { alert('Could not determine extension to whisper for this call.'); return }
    if (!ua) { alert('SIP UA not ready; please wait for registration.'); return }
    const domain = (ua.configuration && ua.configuration.uri && ua.configuration.uri.host) || sipCfg.sip_domain || ''
    const dial = `*91${ext}`
    const target = domain ? `sip:${dial}@${domain}` : `sip:${dial}`
    try {
      const options = { mediaConstraints: { audio: true, video: false }, pcConfig: { iceServers: sipCfg.iceServers } }
      const session = ua.call(target, options)
      setWhisperSession(session)
      setWhisperCall(call)
      session.on && session.on('ended', () => { setWhisperSession(null); setWhisperCall(null) })
      session.on && session.on('failed', () => { setWhisperSession(null); setWhisperCall(null) })
    } catch (err) {
      console.error('Whisper failed', err)
      alert('Whisper failed: ' + String(err))
    }
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
        <div style={{ position: 'fixed', bottom: 16, right: 16, width: 360, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Monitoring <strong>{monitorCall?.assignedAgent?.name || monitorCall?.assignedAgent?.email || monitorCall?.agent || 'agent'}</strong></div>
            <div>
              <CButton size="sm" color="danger" onClick={() => { try { monitorSession.terminate(); } catch(e){} setMonitorSession(null); setMonitorCall(null); }}>Hangup</CButton>
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
              <CButton size="sm" color="danger" onClick={() => { try { whisperSession.terminate(); } catch(e){} setWhisperSession(null); setWhisperCall(null); }}>Hangup</CButton>
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
              <CButton size="sm" color="danger" onClick={() => { try { bargeSession.terminate(); } catch(e){} setBargeSession(null); setBargeCall(null); }}>Hangup</CButton>
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
