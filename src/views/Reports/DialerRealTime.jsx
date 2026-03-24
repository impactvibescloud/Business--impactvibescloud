import React, { useEffect, useState } from 'react'
import './DialerRealTime.css'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilCalendar, cilCheckCircle, cilXCircle, cilArrowRight } from '@coreui/icons'
import { apiCall } from '../../config/api'
// Simple direction detector reused from CallMonitor patterns
const detectDirection = (call) => {
  try {
    const leg = (call.legs && call.legs[0]) || call
    const raw = String(leg?.raw || call?.raw || '').toLowerCase()
    const tokens = Array.isArray(leg?.tokens || call?.tokens) ? (leg?.tokens || call?.tokens || []) : []
    const phoneRegex = /^\+?\d{7,15}$/
    const phoneTokens = tokens.filter((t) => typeof t === 'string' && phoneRegex.test(t))
    if (phoneTokens.length > 0) return 'Outgoing'
    if (/\bincoming\b/.test(raw) || /from-external/.test(raw)) return 'Inbound'
    if (/\bdial\b|outbound|outgoing/.test(raw)) return 'Outgoing'
  } catch (e) {}
  return 'Inbound'
}

const StatCard = ({ value, label, icon }) => {
  const displayValue = value === '-' || value === null || value === undefined ? 0 : value
  return (
    <div className="drt-stat-card">
      <div className="drt-stat-topline" />
      <div className="drt-stat-topicon"><CIcon icon={icon} size="lg" /></div>
      <div className="drt-stat-body">
        <div className="drt-stat-value">{displayValue}</div>
        <div className="drt-stat-label">{label}</div>
      </div>
    </div>
  )
}

const DialerRealTime = () => {
  const [stats, setStats] = useState([
    { value: 0, label: 'Active Calls', icon: cilPhone },
    { value: 0, label: 'Calls Today', icon: cilCalendar },
    { value: 0, label: 'Outgoing Answered', icon: cilCheckCircle },
    { value: 0, label: 'Outgoing Missed', icon: cilXCircle },
    { value: 0, label: 'Incoming Answered', icon: cilCheckCircle },
    { value: 0, label: 'Incoming Missed', icon: cilXCircle }
  ])
  const [liveCalls, setLiveCalls] = useState([])
  const livePollingRef = React.useRef(null)
  const [liveError, setLiveError] = useState(null)

  const fetchLiveCalls = async () => {
    setLiveError(null)
    try {
      const bId = await fetchBusinessIdIfNeeded()
      if (!bId) {
        setLiveCalls([])
        return
      }
      const res = await apiCall(`/asterisk/livecalls/${encodeURIComponent(bId)}`, 'GET')
      // Normalize response shapes (same approach as CallMonitor)
      const lCalls = Array.isArray(res.liveCalls) ? res.liveCalls : Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : [])
      setLiveCalls(lCalls)
    } catch (err) {
      console.error('DialerRealTime fetchLiveCalls failed', err)
      setLiveError(err?.response?.data?.message || err.message || 'Failed to fetch live calls')
      // don't clear existing liveCalls on transient errors; keep current data until a successful empty response arrives
    }
  }

  const fetchBusinessIdIfNeeded = async () => {
    const b = localStorage.getItem('businessId') || ''
    if (b) return b
    try {
      const ud = await apiCall('/v1/user/details', 'GET')
      const u = ud?.user || ud?.data || ud
      if (u && u.businessId) {
        try { localStorage.setItem('businessId', u.businessId) } catch (e) {}
        return u.businessId
      }
    } catch (e) {}
    return ''
  }
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchDialer = async () => {
      try {
        setIsRefreshing(true)
        const businessId = await fetchBusinessIdIfNeeded()
        if (!businessId) {
          // ensure liveCalls cleared if no businessId
          setLiveCalls([])
          return
        }
        const res = await apiCall(`/call-logs?businessId=${encodeURIComponent(businessId)}&page=1&limit=200`)
        if (process.env.NODE_ENV === 'development') console.debug('DialerRealTime: call-logs response', res)
        const data = (res && res.data) || []
        const callsToday = data.length
        const outgoingAnswered = data.filter(d => d.callType === 'outbound' && d.status === 'answered').length
        const outgoingMissed = data.filter(d => d.callType === 'outbound' && d.status === 'missed').length
        const incomingAnswered = data.filter(d => d.callType === 'inbound' && d.status === 'answered').length
        const incomingMissed = data.filter(d => d.callType === 'inbound' && d.status === 'missed').length
        // Active calls heuristic: duration > 0 and recent
        const active = data.filter(d => (d.callDuration || d.duration || 0) > 0).length
        if (!mounted) return
        setStats([
          { value: active, label: 'Active Calls', icon: cilPhone },
          { value: callsToday, label: 'Calls Today', icon: cilCalendar },
          { value: outgoingAnswered, label: 'Outgoing Answered', icon: cilCheckCircle },
          { value: outgoingMissed, label: 'Outgoing Missed', icon: cilXCircle },
          { value: incomingAnswered, label: 'Incoming Answered', icon: cilCheckCircle },
          { value: incomingMissed, label: 'Incoming Missed', icon: cilXCircle }
        ])
        setLastUpdated(new Date())
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setIsRefreshing(false)
      }
        // live calls are fetched independently by fetchLiveCalls to avoid
        // overlapping requests that cause transient clears/flicker.
    }

    // Initial fetch for stats
    fetchDialer()
    // Set up auto-refresh every 5 seconds for stats
    const id = setInterval(fetchDialer, 5000)
    // Initial fetch for live calls and poll like CallMonitor
    fetchLiveCalls()
    livePollingRef.current = setInterval(fetchLiveCalls, 5000)
    return () => { mounted = false; clearInterval(id); if (livePollingRef.current) clearInterval(livePollingRef.current) }
  }, [])

  return (
    <div className="drt-page">
      <div className="drt-header drt-header-bar">
        <div className="drt-header-left">
          <h3>Dialer Real Time Report</h3>
        </div>
        <div className="drt-header-right">
          <div className="drt-controls">
            <div className="drt-refresh">{isRefreshing ? 'Refreshing...' : (lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Not updated yet')}</div>
            
            
          </div>
        </div>
      </div>

      <div className="drt-stats-grid">
        {stats.map((s, i) => {
          const value = (s.label === 'Active Calls') ? liveCalls.length : s.value
          return <StatCard key={i} value={value} label={s.label} icon={s.icon} />
        })}
      </div>

      

      <div className="drt-table-wrap">
        <div className="drt-table-header">
          <button className="drt-filter-btn">Filter</button>
          <div className="drt-table-title">Agents / Agent Groups</div>
        </div>
          <div className="drt-table-placeholder">
          <table className="drt-table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Duration</th>
                <th>DID</th>
                <th>Agent</th>
                <th>Branch</th>
                <th>Raw</th>
              </tr>
            </thead>
            <tbody>
              {liveCalls.length === 0 ? (
                <tr>
                  <td className="drt-empty" colSpan="8">No active calls</td>
                </tr>
              ) : (
                liveCalls.map((c, idx) => (
                  <tr key={`${c.channel || c.groupId || idx}-${idx}`}>
                    <td>{detectDirection(c)}</td>
                    <td>{c.channel || '-'}</td>
                    <td>{c.status || '-'}</td>
                    <td>{c.duration || '-'}</td>
                    <td>{(c.did && c.did.number) || (c.tokens && c.tokens[3]) || '-'}</td>
                    <td>{(c.assignedAgent && (c.assignedAgent.name || c.assignedAgent.email)) || c.assignedAgent || '-'}</td>
                    <td>{(c.branch && (c.branch.branchName || c.branch.name)) || '-'}</td>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.raw || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="drt-legend-placeholder">
        <div className="drt-legend-header">Color Significance <span className="drt-toggle">+</span></div>
      </div>
    </div>
  )
}

export default DialerRealTime
