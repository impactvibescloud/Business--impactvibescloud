import React, { useState, useEffect } from 'react'
import './AgentRealTime.css'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilCalendar, cilArrowRight, cilCheckCircle, cilXCircle, cilPeople, cilClock } from '@coreui/icons'
import { apiCall, ENDPOINTS } from '../../config/api'

const StatCard = ({ value, label, icon, note, compare }) => (
  <div className="art-stat-card">
    <div className="art-stat-top">
      <div className="art-stat-title">{label}</div>
      <div className="art-stat-icon"><CIcon icon={icon} size="lg" /></div>
    </div>
    <div className="art-stat-value">{value}</div>
    <div className="art-stat-note">{note || 'For 1 day'}</div>
    <div className="art-stat-compare">{compare || 'vs 0 prev, 1 day'}</div>
  </div>
)

// Fallback static agents used when API is unavailable
const FALLBACK_AGENTS = [
  { id: 'fallback-1', name: 'Dharmik Savdasiya', status: 'Available', duration: '10:31:38', callStatus: 'Not on call', dept: 'Interaction Hub', answered: 0, missed: 0, inCall: '00:00:00' },
  { id: 'fallback-2', name: 'Yathish R', status: 'Available', duration: '10:31:38', callStatus: 'Not on call', dept: 'Interaction Hub', answered: 0, missed: 0, inCall: '00:00:00' },
  { id: 'fallback-3', name: 'Gaurav Chauhan', status: 'Offline', duration: '00:00:00', callStatus: 'Offline', dept: 'Support', answered: 0, missed: 0, inCall: '00:00:00' }
]

const formatSeconds = (s) => {
  if (s == null || s === '') return '00:00:00'
  const sec = Number(s)
  if (!Number.isFinite(sec)) return String(s)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const ss = Math.floor(sec % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

const AgentRealTime = () => {
  const [legendOpen, setLegendOpen] = useState(true)
  const [agents, setAgents] = useState(FALLBACK_AGENTS)
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const getBusinessId = async () => {
    let businessId = localStorage.getItem('businessId') || ''
    if (!businessId) {
      try {
        const ud = await apiCall('/v1/user/details', 'GET')
        const u = ud?.user || ud?.data || ud
        if (u && (u.businessId || u.businessid || u.business)) {
          businessId = u.businessId || u.businessid || (u.business && (u.business._id || u.business.id)) || ''
          try { localStorage.setItem('businessId', businessId) } catch (e) {}
        }
      } catch (e) {}
    }
    return businessId
  }

  const normalizeArrayResponse = (res) => {
    if (!res) return []
    if (Array.isArray(res)) return res
    if (res.data && Array.isArray(res.data)) return res.data
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return [res.data]
    if (typeof res === 'object') return [res]
    return []
  }

  const fetchRealtime = async () => {
    setLoading(true)
    try {
      const businessId = await getBusinessId()

      // Fetch business agent statuses from the backend endpoint provided
      // Endpoint returns { success, message, data: { businessId, businessName, summary, agents: [] } }
      let statusAgents = []
      let summary = {}
      try {
        if (businessId) {
          const sres = await apiCall(`/business/agents/status?businessId=${encodeURIComponent(businessId)}`, 'GET')
          const payload = sres?.data || sres || {}
          statusAgents = Array.isArray(payload.agents) ? payload.agents : (Array.isArray(sres) ? sres : [])
          summary = payload.summary || {}
        }
      } catch (e) {
        statusAgents = []
      }

      // Fetch recent performance snapshot (used to show answered/missed/talk)
      let perfList = []
      try {
        const qp = [`businessId=${encodeURIComponent(businessId)}`]
        qp.push('period=today')
        qp.push('limit=200')
        const pres = await apiCall(`/performance/agents?${qp.join('&')}`, 'GET')
        perfList = normalizeArrayResponse(pres)
      } catch (e) {
        perfList = []
      }

      // Build lookup maps for performance data
      const perfById = new Map()
      const perfByName = new Map()
      perfList.forEach(p => {
        const id = p._id || p.id || p.agent || p.agentId || p.userId
        if (id) perfById.set(String(id), p)
        const name = (p.agentName || p.name || p.agent || '').toString().trim().toLowerCase()
        if (name) perfByName.set(name, p)
      })

      let merged = []

      // Format a timestamp as "since" duration (e.g. "5m", "2h 14m").
      // Used for the "Availability Duration" column so it shows how long
      // the agent has been in the current status — NOT the raw ISO time.
      const formatSinceDuration = (iso) => {
        if (!iso) return '-'
        const t = new Date(iso).getTime()
        if (!t || Number.isNaN(t)) return '-'
        const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000))
        if (diffSec < 60) return `${diffSec}s`
        const m = Math.floor(diffSec / 60)
        if (m < 60) return `${m}m`
        const h = Math.floor(m / 60)
        const remM = m % 60
        return remM ? `${h}h ${remM}m` : `${h}h`
      }

      if (statusAgents.length) {
        merged = statusAgents.map(s => {
          const id = s.id || s._id || s._id || s.email || s.phone || null
          const name = s.name || s.fullName || s.email || ''
          const perf = (id && perfById.get(String(id))) || (name && perfByName.get(String(name).toLowerCase())) || null
          const statusRaw = s.status || s.current_status || 'unknown'
          return {
            id: id || name || `agent-${Math.random().toString(36).slice(2,8)}`,
            name: name || perf?.agentName || perf?.name || 'Unknown',
            // API returns `status` and `lastSeen`
            status: statusRaw,
            // show lastSeen as a "duration since last change" — was previously
            // rendering the raw ISO timestamp directly into the table.
            duration: formatSinceDuration(s.lastSeen || s.joinedAt),
            // Call status: only show "On call" when the agent's status is
            // explicitly busy/on-call. Otherwise reflect availability.
            callStatus: (statusRaw === 'online') ? 'Available'
                      : (statusRaw === 'offline') ? 'Offline'
                      : (statusRaw === 'break') ? 'On break'
                      : (statusRaw === 'lunch') ? 'On lunch'
                      : (statusRaw === 'bio_break') ? 'Bio break'
                      : 'Not on call',
            dept: s.branchId || s.dept || perf?.branchName || perf?.branch || '',
            answered: perf ? (perf.answeredCalls || perf.answered || 0) : 0,
            missed: perf ? (perf.missedCalls || perf.missed || 0) : 0,
            inCall: perf ? formatSeconds(perf.totalTalkSeconds || perf.talkSeconds || perf.talk || 0) : '00:00:00',
            rawStatus: s,
            rawPerf: perf
          }
        })
      } else if (perfList.length) {
        merged = perfList.map(p => ({
          id: p.agent || p._id || p.id || `perf-${Math.random().toString(36).slice(2,8)}`,
          name: p.agentName || p.name || p.agent || 'Agent',
          status: p.liveStatus || 'unknown',
          duration: p.loggedHours || '00:00:00',
          callStatus: p.liveStatus || 'Not on call',
          dept: p.branchName || p.branch || '-',
          answered: p.answeredCalls || p.answered || 0,
          missed: p.missedCalls || p.missed || 0,
          inCall: formatSeconds(p.totalTalkSeconds || p.talkSeconds || p.talk || 0),
          rawPerf: p,
        }))
      } else {
        merged = FALLBACK_AGENTS
      }

      setAgents(merged)
      setLastUpdated(new Date())
    } catch (e) {
      // fall back to static data
      setAgents(FALLBACK_AGENTS)
      console.error('AgentRealTime fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealtime()
    const id = setInterval(fetchRealtime, 10000) // poll every 10s
    return () => clearInterval(id)
  }, [])

  const toggleExpand = async (agent) => {
    const key = String(agent.id || agent.name)
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
    // when expanding, try to refresh the agent's perf data in-place
    if (!expanded[key]) {
      try {
        const businessId = await getBusinessId()
        const qp = [`businessId=${encodeURIComponent(businessId)}`, `agent=${encodeURIComponent(agent.id || agent.name)}`, 'period=today']
        const res = await apiCall(`/performance/agents?${qp.join('&')}`, 'GET')
        const list = normalizeArrayResponse(res)
        if (list && list.length) {
          const p = list[0]
          setAgents(prev => prev.map(a => {
            if (String(a.id) === String(agent.id) || String(a.name).toLowerCase() === String(agent.name).toLowerCase()) {
              return {
                ...a,
                answered: p.answeredCalls || p.answered || a.answered,
                missed: p.missedCalls || p.missed || a.missed,
                inCall: formatSeconds(p.totalTalkSeconds || p.talkSeconds || p.talk || 0),
                rawPerf: p
              }
            }
            return a
          }))
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return (
    <div className="art-page">
      <div className="art-header art-header-bar">
        <h3>Agent Real Time Report</h3>
        <div className="art-refresh-badge">{loading ? 'Updating…' : (lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Idle')}</div>
      </div>

      <div className="art-stats-grid stats-grid-tiles">
        {/* Simple aggregated tiles computed from current list */}
        {(() => {
          const total = agents.reduce((s, a) => s + (Number(a.answered || 0) + Number(a.missed || 0)), 0)
          const missed = agents.reduce((s, a) => s + Number(a.missed || 0), 0)
          const answered = agents.reduce((s, a) => s + Number(a.answered || 0), 0)
          const tiles = [
            { value: total, label: 'Total Calls', icon: cilPhone },
            { value: missed, label: 'Missed Calls', icon: cilPhone },
            { value: answered, label: 'Answered Calls', icon: cilCheckCircle },
            { value: total > 0 ? `${((missed/total)*100).toFixed(2)}%` : '0.00%', label: 'Missed Call Percentage', icon: cilPhone, isDonut: true },
            { value: '00:00:00', label: 'Average Speed Of Answer', icon: cilClock },
            { value: 0, label: 'Transferred Calls', icon: cilArrowRight },
            { value: '', label: 'Call Volume', icon: cilPeople, isChart: true },
          ]
          return tiles.map((s, idx) => {
            if (s.isDonut) {
              return (
                <div className="art-stat-card donut-card" key={idx}>
                  <div className="art-stat-top"><div className="art-stat-title">{s.label}</div></div>
                  <div className="donut-wrap"><div className="donut-ring"><div className="donut-center">{s.value}</div></div></div>
                  <div className="art-stat-compare">Missed Call Percentage</div>
                </div>
              )
            }
            if (s.isChart) {
              return (
                <div className="art-stat-card chart-card" key={idx}><div className="art-stat-top"><div className="art-stat-title">{s.label}</div></div><div className="chart-placeholder">Chart</div></div>
              )
            }
            return <StatCard key={idx} value={s.value} label={s.label} icon={s.icon} />
          })
        })()}
      </div>

      <div className="art-table-wrap">
        <div className="art-table-header">
          <button className="art-filter-btn">Filter</button>
          <div className="art-table-title">Agents</div>
        </div>
        <table className="art-table">
          <thead>
            <tr>
              <th>Agent Name</th>
              <th>Availability Status</th>
              <th>Availability Duration</th>
              <th>Call Status</th>
              <th>Department</th>
              <th>Answered Calls</th>
              <th>Missed Calls</th>
              <th>Total In-Call Time</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => {
              const key = String(a.id || a.name)
              return (
                <React.Fragment key={key}>
                  <tr onClick={() => toggleExpand(a)} className={String(a.status).toLowerCase() === 'available' ? 'art-row-available' : ''} style={{ cursor: 'pointer' }}>
                    <td className="art-agent-cell">
                      <div className="art-avatar">{String(a.name || '').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                      <div>
                        <div className="art-agent-name">{a.name}</div>
                        <div className="art-agent-sub">{a.callStatus}</div>
                      </div>
                    </td>
                    <td>{a.status}</td>
                    <td>{a.duration}</td>
                    <td>{a.callStatus}</td>
                    <td>{a.dept}</td>
                    <td>{a.answered}</td>
                    <td>{a.missed}</td>
                    <td>{a.inCall}</td>
                  </tr>
                  {expanded[key] && (
                    <tr className="art-agent-expand-row">
                      <td colSpan={8}>
                        <div className="art-agent-expand">
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div><strong>Name:</strong> {a.name}</div>
                            <div><strong>Status:</strong> {a.status}</div>
                            <div><strong>Call Status:</strong> {a.callStatus}</div>
                            <div><strong>Answered:</strong> {a.answered}</div>
                            <div><strong>Missed:</strong> {a.missed}</div>
                            <div><strong>In-call:</strong> {a.inCall}</div>
                            <div><strong>Dept:</strong> {a.dept}</div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <details>
                              <summary style={{ cursor: 'pointer' }}>Raw data</summary>
                              <pre style={{ maxHeight: 200, overflow: 'auto' }}>{JSON.stringify({ rawStatus: a.rawStatus, rawPerf: a.rawPerf }, null, 2)}</pre>
                            </details>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="art-legend-wrap">
        <div className={"art-legend-card" + (legendOpen ? '' : ' collapsed')}>
          <div
            className="art-legend-header"
            role="button"
            tabIndex={0}
            aria-expanded={legendOpen}
            onClick={() => setLegendOpen((s) => !s)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLegendOpen(s => !s) } }}
          >
            <div className="art-legend-title">Color Significance</div>
            <div className="art-legend-toggle" aria-hidden="true"><span className="chev">{legendOpen ? '▴' : '▾'}</span></div>
          </div>
          {legendOpen && (
            <>
              <div className="art-legend-grid">
                <div className="art-legend-item"><span className="art-legend-swatch swatch-busy-short"/> - Agent busy for less than a minute</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-busy-medium"/> - Agent busy for more than a minute</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-busy-long"/> - Agent busy for more than five minutes</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-avail-short"/> - Agent available for less than a minute</div>

                <div className="art-legend-item"><span className="art-legend-swatch swatch-avail-medium"/> - Agent available for more than a minute</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-avail-long"/> - Agent available for more than five minutes</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-call-short"/> - Agent on call/calls for less than a minute</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-call-medium"/> - Agent on call/calls for more than a minute</div>
                <div className="art-legend-item"><span className="art-legend-swatch swatch-call-long"/> - Agent on call/calls for more than five minutes</div>
              </div>

              <div className="art-note">Note :- Status will be reset to 0 every time there is a change in agent availability. Agents must login and logout in order to see correct data on the real-time report page.</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentRealTime
