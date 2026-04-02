import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AgentPerformance.css'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilFilter, cilCloudDownload, cilReload, cilOptions, cilPhone, cilCheckCircle, cilClock, cilExternalLink } from '@coreui/icons'
import { apiCall } from '../../config/api'
import DateRangeModal from '../../components/DateRange/DateRangeModal'
import { CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormSelect } from '@coreui/react'

const StatTile = ({ title, value, note, icon, onNavigate }) => (
  <div className="ap-stat-tile">
    <div className="ap-stat-header">
      <div className="ap-stat-title">{title}</div>
      <div className="ap-stat-actions">
        {onNavigate && (
          <button 
            className="ap-nav-btn" 
            onClick={onNavigate} 
            title={`View ${title}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#0b5a47' }}
          >
            <CIcon icon={cilExternalLink} size="lg" />
          </button>
        )}
        {icon ? <CIcon icon={icon} /> : null}
      </div>
    </div>
    <div className="ap-stat-body">
      <div className="ap-stat-value">{value}</div>
      <div className="ap-stat-note">{note}</div>
    </div>
    <div className="ap-stat-footer">vs 0 prev, 1 day</div>
  </div>
)

const AgentPerformance = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [missedPercent, setMissedPercent] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDateModal, setShowDateModal] = useState(false)
  const [availableAgents, setAvailableAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})

  // Agent performance API state
  const [period, setPeriod] = useState('All-time')
  const [agentPerf, setAgentPerf] = useState([])
  const [perfLoading, setPerfLoading] = useState(false)
  const [perfError, setPerfError] = useState(null)

  const fetchStats = async (sDate = '', eDate = '', agent = '') => {
    try {
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
      if (!businessId) return
      const qp = [`businessId=${encodeURIComponent(businessId)}`, `page=1`, `limit=200`]
      if (sDate) qp.push(`startDate=${encodeURIComponent(sDate)}`)
      if (eDate) qp.push(`endDate=${encodeURIComponent(eDate)}`)
      if (agent) qp.push(`agent=${encodeURIComponent(agent)}`)
      const res = await apiCall(`/call-logs?${qp.join('&')}`)
      const data = (res && res.data) || []
      const total = data.length
      const missed = data.filter((d) => (d.status || d.callLog?.status) === 'missed').length
      const answered = data.filter((d) => (d.status || d.callLog?.status) === 'answered').length
      const missedP = total > 0 ? (missed / total) * 100 : 0

      const sample = []
      for (let i = 0; i < 11; i++) sample.push(0)
      for (let i = 0; i < Math.min(11, data.length); i++) sample[i] = 1

      const computed = [
        { title: 'Total Calls', value: total, note: 'For sample', icon: cilPhone },
        { title: 'Missed Calls', value: missed, note: 'For sample', icon: cilPhone },
        { title: 'Answered Calls', value: answered, note: 'For sample', icon: cilCheckCircle },
        { title: 'Missed Call Percentage', value: `${missedP.toFixed(2)}%`, note: 'Missed Call Percentage', icon: cilPhone },

        { title: 'Average Speed Of Answer', value: '00:00:00', note: 'For sample', icon: cilClock },
        { title: 'Transferred Calls', value: 0, note: 'For sample', icon: cilPhone },
        { title: 'Call Volume', value: '', note: '', icon: cilPhone, volumeSample: sample },

        { title: 'Hold Calls', value: 0, note: 'For sample', icon: cilClock },
        { title: 'Average Hold Duration', value: '00:00:00', note: 'For sample', icon: cilClock },
        { title: 'Average WrapUp Duration', value: '00:00:00', note: 'For sample', icon: cilClock }
      ]
      setStats(computed)
      setMissedPercent(missedP)
    } catch (e) {
      // keep defaults
    }
  }

  useEffect(() => { fetchStats() }, [])

  const fetchAgents = async () => {
    try {
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
      if (!businessId) return
      // Prefer branch endpoint which often includes user details (manager/user)
      let agents = []
      try {
        const br = await apiCall(`/branch/${encodeURIComponent(businessId)}/branches`, 'GET')
        let list = []
        if (Array.isArray(br)) list = br
        else if (br?.data && Array.isArray(br.data)) list = br.data
        else if (Array.isArray(br.branches)) list = br.branches
        else if (br?.data?.data && Array.isArray(br.data.data)) list = br.data.data
        else list = []
        list.forEach((branch) => {
          const branchId = branch._id || branch.id || branch.branchId || null
          const u = branch.user || branch.manager || branch.owner || null
          if (branchId) {
            const name = (u && (u.name || u.fullName)) || branch.branchName || `Branch ${branchId}`
            agents.push({ id: branchId, name, type: 'branch' })
          } else if (u && (u._id || u.id || u.email)) {
            const id = u._id || u.id || u.email
            const name = u.name || u.fullName || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || u.email || `Agent ${id}`
            agents.push({ id, name, type: 'user' })
          }
        })
        // dedupe (type:id)
        const seen = {}
        agents = agents.filter((a) => {
          if (!a.id) return false
          const key = `${a.type || 'user'}:${a.id}`
          if (seen[key]) return false
          seen[key] = true
          return true
        })
      } catch (e) {
        agents = []
      }

      // Fallback to /users endpoint if branch-based users not found
      if (!agents || agents.length === 0) {
        try {
          const res = await apiCall(`/users?businessId=${encodeURIComponent(businessId)}`)
          let data = []
          if (Array.isArray(res)) data = res
          else if (res?.data && Array.isArray(res.data)) data = res.data
          else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data
          else if (res && typeof res === 'object') data = [res]
          agents = (data || []).map((a, idx) => {
            const first = a.firstName || a.first_name || ''
            const last = a.lastName || a.last_name || ''
            const combined = (first || last) ? `${first} ${last}`.trim() : ''
            const name = a.name || a.fullName || combined || a.email || a.username || `Agent ${idx + 1}`
            const id = a._id || a.id || a.email || `${idx}`
            return { id, name, type: 'user' }
          })
        } catch (e) {
          agents = []
        }
      }

      setAvailableAgents(agents)
    } catch (e) {
      setAvailableAgents([])
    }
  }

  useEffect(() => { fetchAgents() }, [])

  // Helper to read flexible fields from API responses
  const pick = (obj, keys) => {
    if (!obj) return null
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    }
    return null
  }

  const formatSeconds = (s) => {
    if (s == null || s === '') return '-'
    const sec = Number(s)
    if (!Number.isFinite(sec)) return '-'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const ss = Math.floor(sec % 60)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  const formatHours = (h) => {
    if (h == null || h === '') return '-'
    const n = Number(h)
    if (!Number.isFinite(n)) return '-'
    return `${n.toFixed(2)} h`
  }

  const formatDate = (iso) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch (e) { return String(iso) }
  }

  const normalizePeriod = (p) => {
    if (!p) return p
    const map = {
      'Today': 'today',
      'Weekly': 'weekly',
      'Monthly': 'monthly',
      'Yearly': 'yearly',
      'All-time': 'all-time',
      'All time': 'all-time'
    }
    if (map[p]) return map[p]
    return String(p).toLowerCase().replace(/\s+/g, '-')
  }

  const parseSelected = (val) => {
    if (!val) return null
    const i = String(val).indexOf(':')
    if (i === -1) return { type: 'user', id: val }
    return { type: String(val).slice(0, i), id: String(val).slice(i + 1) }
  }

  const fetchAgentPerformance = async (p = period) => {
    try {
      setPerfLoading(true)
      setPerfError(null)
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
      if (!businessId) {
        setPerfError('Missing businessId')
        setAgentPerf([])
        return
      }

      const per = normalizePeriod(p)
      let endpoint = `/performance/agents?businessId=${encodeURIComponent(businessId)}&period=${encodeURIComponent(per)}`
      // Use branchId or agent param depending on selected type
      if (selectedAgent) {
        const sel = parseSelected(selectedAgent)
        if (sel) {
          if (sel.type === 'branch') endpoint += `&branchId=${encodeURIComponent(sel.id)}`
          else endpoint += `&agent=${encodeURIComponent(sel.id)}`
        }
      }
      const res = await apiCall(endpoint, 'GET')

      // Normalize response: support array responses, res.data arrays,
      // or single-object responses (wrap into an array)
      let list = []
      if (!res) list = []
      else if (Array.isArray(res)) list = res
      else if (Array.isArray(res.data)) list = res.data
      else if (Array.isArray(res?.data?.data)) list = res.data.data
      else if (res && typeof res === 'object') {
        // Prefer res.data when it's an object
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) list = [res.data]
        else {
          const arr = Object.values(res).find(v => Array.isArray(v))
          if (arr) list = arr
          else list = [res]
        }
      } else {
        list = []
      }

      setAgentPerf(list || [])
      // Aggregate metrics from agent performance response and populate stat tiles
      try {
        const arr = list || []
        const toNumber = (v) => {
          const n = Number(v)
          return Number.isFinite(n) ? n : 0
        }

        const totalHandled = arr.reduce((s, a) => s + toNumber(a.handledCalls || a.total || a.calls), 0)
        const totalAnswered = arr.reduce((s, a) => s + toNumber(a.answeredCalls || a.answered), 0)
        const totalMissed = arr.reduce((s, a) => s + toNumber(a.missedCalls || a.missed), 0)
        const totalRejected = arr.reduce((s, a) => s + toNumber(a.rejectedCalls || a.rejected), 0)
        const totalFailed = arr.reduce((s, a) => s + toNumber(a.failedCalls || a.failed), 0)
        const totalTransferred = arr.reduce((s, a) => s + toNumber(a.transferredCalls || a.transferred), 0)
        const totalTalkSeconds = arr.reduce((s, a) => s + toNumber(a.totalTalkSeconds || a.talkSeconds || a.talk), 0)
        const loggedHoursTotal = arr.reduce((s, a) => s + toNumber(a.loggedHours || a.logged_hours || 0), 0)

        // Weighted average for avgAHTSeconds and avgASASeconds (weight by handledCalls when available)
        const computeWeightedAvg = (key) => {
          let sum = 0, weight = 0
          arr.forEach(a => {
            const val = a[key]
            if (val != null) {
              const v = Number(val)
              const w = toNumber(a.handledCalls || a.total || 0)
              if (w > 0) { sum += v * w; weight += w } else { sum += v; weight += 1 }
            }
          })
          return weight ? (sum / weight) : null
        }

        const avgAHT = computeWeightedAvg('avgAHTSeconds')
        const avgASA = computeWeightedAvg('avgASASeconds')

        const occupancyVals = arr.map(a => a.occupancyPercent).filter(v => v != null).map(Number).filter(Number.isFinite)
        const occupancyAvg = occupancyVals.length ? (occupancyVals.reduce((s,v)=>s+v,0)/occupancyVals.length) : null

        const missedPct = totalHandled > 0 ? (totalMissed / totalHandled) * 100 : 0

        const formatSeconds = (s) => {
          if (s == null || s === '') return '-'
          const sec = Number(s)
          if (!Number.isFinite(sec)) return '-'
          const h = Math.floor(sec / 3600)
          const m = Math.floor((sec % 3600) / 60)
          const ss = Math.floor(sec % 60)
          return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
        }

        const formatHours = (h) => {
          if (h == null || h === '') return '-'
          const n = Number(h)
          if (!Number.isFinite(n)) return '-'
          return `${n.toFixed(2)} h`
        }

        const computed = [
          { title: 'Total Calls', value: totalHandled, note: 'Combined across agents', icon: cilPhone },
          { title: 'Missed Calls', value: totalMissed, note: 'Combined across agents', icon: cilPhone },
          { title: 'Answered Calls', value: totalAnswered, note: 'Combined across agents', icon: cilCheckCircle },
          { title: 'Missed Call Percentage', value: `${missedPct.toFixed(2)}%`, note: 'Missed Call Percentage', icon: cilPhone },

          { title: 'Average Speed Of Answer', value: avgASA ? formatSeconds(avgASA) : '-', note: 'Average across agents', icon: cilClock },
          { title: 'Average Handle Time', value: avgAHT ? formatSeconds(avgAHT) : '-', note: 'Average across agents', icon: cilClock },
          { title: 'Transferred Calls', value: totalTransferred, note: 'Combined across agents', icon: cilPhone },
          { title: 'Total Talk Time', value: formatSeconds(totalTalkSeconds), note: 'Sum of talk seconds', icon: cilClock },
          { title: 'Logged Hours', value: formatHours(loggedHoursTotal), note: 'Sum of logged hours', icon: cilClock }
        ]

        setStats(computed)
        setMissedPercent(missedPct)
      } catch (e) {
        // ignore aggregation errors
      }
    } catch (err) {
      setPerfError(err?.message || 'Failed to fetch agent performance')
      setAgentPerf([])
    } finally {
      setPerfLoading(false)
    }
  }

  useEffect(() => { fetchAgentPerformance(period) }, [period, selectedAgent])

  // Build a small volume array for charts from various possible response shapes
  const getVolumeArrayForAgent = (a) => {
    if (!a) return new Array(11).fill(0)
    const possibleKeys = ['volumeSample','callVolume','callTrend','trend','perAgent','callsTrend','perHour','volume','trendData','callCounts','volume_series','callSeries']
    for (const k of possibleKeys) {
      const v = pick(a, [k])
      if (Array.isArray(v) && v.length) return v.map(n => Number(n) || 0)
    }
    // Look for nested objects with numeric values
    for (const k of Object.keys(a || {})) {
      const v = a[k]
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const vals = Object.values(v).map(n => Number(n) || 0)
        if (vals.length) return vals
      }
    }
    // Fallback: create a small sample series based on handled calls
    const handled = Number(pick(a, ['handledCalls','handled','total','calls']) || 0)
    const arr = new Array(11).fill(0)
    for (let i = 0; i < Math.min(11, handled); i++) arr[i] = 1
    return arr
  }

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const Donut = ({ percent, size = 120 }) => {
    const stroke = 12
    const radius = (size - stroke) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * radius
    const dash = (percent / 100) * circumference
    return (
      <svg width={size} height={size} className="ap-donut-svg">
        <g transform={`translate(${cx}, ${cy})`}>
          <circle r={radius} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          <circle r={radius} cx={0} cy={0} fill="none" stroke="#f59e0b" strokeWidth={stroke} strokeLinecap="round" transform={`rotate(-90)`} strokeDasharray={`${dash} ${circumference - dash}`} />
          <text x="0" y="6" textAnchor="middle" fontWeight="800" fontSize="16" fill="#111">{percent.toFixed(2)}%</text>
        </g>
      </svg>
    )
  }

  const CallVolumeChart = ({ data = [] }) => {
    const w = 360
    const h = 140
    const padX = 36
    const padY = 20
    const innerW = w - padX * 2
    const innerH = h - padY * 2
    const max = Math.max(...(data.length ? data : [0]), 1)

    const points = (data.length ? data : new Array(11).fill(0)).map((d, i) => {
      const x = padX + (i / (data.length - 1 || 1)) * innerW
      const y = padY + innerH - ((Number(d) || 0) / max) * innerH
      return { x, y, v: Number(d) || 0 }
    })

    const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ')
    const areaPath = points.length ? `M ${points[0].x} ${padY + innerH} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${padY + innerH} Z` : ''

    // y ticks (0, 25%, 50%, 75%, 100%) with labels
    const ticks = [0, 0.25, 0.5, 0.75, 1]

    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="ap-vol-chart">
        <defs>
          <linearGradient id="volFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid lines and y labels */}
        {ticks.map((t, idx) => {
          const y = padY + innerH - t * innerH
          const v = Math.round(max * t * 100) / 100
          return (
            <g key={idx} className="ap-vol-grid">
              <line x1={padX} x2={padX + innerW} y1={y} y2={y} stroke="#eef2f6" strokeWidth={1} />
              <text x={6} y={y + 4} fontSize={10} fill="#9ca3af">{v}</text>
            </g>
          )
        })}

        {/* filled area */}
        {areaPath && <path d={areaPath} fill="url(#volFill)" stroke="none" />}

        {/* polyline */}
        <polyline points={polyPoints} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* points and labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#fb7185" />
            <text x={p.x} y={p.y - 8} fontSize={10} textAnchor="middle" fill="#374151">{p.v}</text>
          </g>
        ))}

        {/* legend */}
        <g className="ap-chart-legend" transform={`translate(${padX}, ${h - 6})`}>
          <circle cx="0" cy="0" r="6" fill="#fb7185" />
          <text x="12" y="4" fontSize="10" fill="#6b7280">Current data</text>
        </g>
      </svg>
    )
  }

    // Combine Total / Missed / Answered into a single main stat card
    const totalCallsStat = stats.find(s => s.title === 'Total Calls') || {}
    const missedCallsStat = stats.find(s => s.title === 'Missed Calls') || {}
    const answeredCallsStat = stats.find(s => s.title === 'Answered Calls') || {}

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div className="ap-header-controls">
          <button className="ap-date-btn" onClick={() => setShowDateModal(true)}><CIcon icon={cilCalendar} /> {startDate && endDate ? `${startDate} - ${endDate}` : 'Select date range'}</button>
          <CFormSelect className="ap-period-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="Today">Today</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="All-time">All-time</option>
          </CFormSelect>
          <CFormSelect className="ap-agent-select" value={selectedAgent} onChange={(e) => {
            const val = e.target.value
            setSelectedAgent(val)
            const parsed = parseSelected(val)
            const agentId = parsed && parsed.type === 'user' ? parsed.id : ''
            fetchStats(startDate, endDate, agentId)
          }}>
            <option value="">All agents</option>
            {availableAgents.map((a) => <option key={`${a.type || 'user'}:${a.id}`} value={`${a.type || 'user'}:${a.id}`}>{a.name}</option>)}
          </CFormSelect>
          <button className="ap-icon-btn" onClick={async () => {
            if (isDownloading) return
            setIsDownloading(true)
            try {
              // fetch call logs for current filters (large limit)
              let businessId = localStorage.getItem('businessId') || ''
              if (!businessId) {
                try { const ud = await apiCall('/v1/user/details', 'GET'); const u = ud?.user || ud?.data || ud; businessId = u?.businessId || u?.businessid || '' } catch (e) {}
              }
              if (!businessId) return
              const qp = [`businessId=${encodeURIComponent(businessId)}`, `limit=10000`, `page=1`]
              if (startDate) qp.push(`startDate=${encodeURIComponent(startDate)}`)
              if (endDate) qp.push(`endDate=${encodeURIComponent(endDate)}`)
              if (selectedAgent) {
                const sel = parseSelected(selectedAgent)
                if (sel) {
                  if (sel.type === 'branch') qp.push(`branchId=${encodeURIComponent(sel.id)}`)
                  else qp.push(`agent=${encodeURIComponent(sel.id)}`)
                }
              }
              const res = await apiCall(`/call-logs?${qp.join('&')}`)
              const rows = (res && res.data) || []
              // Build CSV
              const headers = ['ID','Agent','Caller','Receiver','Duration','Timestamp','Status']
              let csv = headers.join(',') + '\n'
              rows.forEach(r => {
                const id = r._id || r.id || ''
                const agentName = (r.agent && (r.agent.name || r.agent.fullName)) || r.agent || ''
                const caller = r.from || r.caller || r.callLog?.contact || ''
                const receiver = r.to || r.receiver || r.virtualNumber || ''
                const duration = r.callDuration || r.duration || ''
                const ts = r.callDate || r.createdAt || r.timestamp || ''
                const status = r.status || r.callLog?.status || ''
                csv += `"${id}","${agentName}","${caller}","${receiver}","${duration}","${ts}","${status}"\n`
              })
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              window.URL.revokeObjectURL(url)
            } catch (e) {
              console.error('Download failed', e)
            } finally { setIsDownloading(false) }
          }}>
            {isDownloading ? 'Downloading...' : <CIcon icon={cilCloudDownload} />}
          </button>
          <button className={"ap-icon-btn" + (isRefreshing ? ' reload-animate' : '')} onClick={async () => {
            if (isRefreshing) return
            setIsRefreshing(true)
            try { const sel = parseSelected(selectedAgent); const agentId = sel && sel.type === 'user' ? sel.id : ''; await fetchStats(startDate, endDate, agentId) } catch (e) {}
            setTimeout(() => setIsRefreshing(false), 800)
          }}><CIcon icon={cilReload} /></button>
        </div>
      </div>

      <DateRangeModal visible={showDateModal} onClose={() => setShowDateModal(false)} initialFrom={startDate} initialTo={endDate} onApply={({ from, to }) => { setStartDate(from); setEndDate(to); const sel = parseSelected(selectedAgent); const agentId = sel && sel.type === 'user' ? sel.id : ''; fetchStats(from, to, agentId); }} />

      {/* Show stat cards and graphs when viewing all agents */}
      {!selectedAgent && perfLoading === false && (
        <div className="ap-stats-grid">
          {agentPerf && agentPerf.length > 0 && (() => {
            const toNumber = (v) => {
              const n = Number(v)
              return Number.isFinite(n) ? n : 0
            }
            
            const totalHandled = agentPerf.reduce((s, a) => s + toNumber(pick(a, ['handledCalls','handled','total','calls'])), 0)
            const totalAnswered = agentPerf.reduce((s, a) => s + toNumber(pick(a, ['answeredCalls','answered'])), 0)
            const totalMissed = agentPerf.reduce((s, a) => s + toNumber(pick(a, ['missedCalls','missed'])), 0)
            const answerRate = totalHandled > 0 ? ((totalAnswered / totalHandled) * 100).toFixed(2) : 0
            
            const occupancyVals = agentPerf.map(a => a.occupancyPercent).filter(v => v != null).map(Number).filter(Number.isFinite)
            const avgOccupancy = occupancyVals.length ? (occupancyVals.reduce((s,v)=>s+v,0)/occupancyVals.length).toFixed(2) : 0
            
            const sampleVol = (agentPerf || []).slice(0, 11).map(d => pick(d, ['handledCalls','handled','total','calls']) || 0)
            while (sampleVol.length < 11) sampleVol.push(0)
            
            const aggStats = [
              { title: 'Total Calls', value: totalHandled, note: `${totalAnswered} answered, ${totalMissed} missed`, icon: cilPhone, onNavigate: () => navigate('/callogs') },
              { title: 'Answer Rate', value: `${answerRate}%`, note: 'Answered / Handled', icon: cilCheckCircle },
              { title: 'Avg Occupancy %', value: avgOccupancy, note: 'Average across agents', isDonut: true, percent: parseFloat(avgOccupancy) || 0 },
              { title: 'Call Volume', volumeSample: sampleVol, note: '', isVolume: true }
            ]
            
            return aggStats.map((s, i) => {
              if (s.isDonut) {
                return (
                  <div className="ap-stat-tile donut-tile" key={i}>
                    <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <Donut percent={s.percent || 0} />
                    </div>
                    <div className="ap-stat-footer">{s.note}</div>
                  </div>
                )
              }
              if (s.isVolume) {
                return (
                  <div className="ap-stat-tile chart-tile" key={i}>
                    <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                    <div style={{ paddingTop: 8 }}><CallVolumeChart data={s.volumeSample || []} /></div>
                    <div className="ap-stat-footer">{s.note}</div>
                  </div>
                )
              }
              return <StatTile key={i} title={s.title} value={s.value} note={s.note} icon={s.icon} onNavigate={s.onNavigate} />
            })
          })()}
        </div>
      )}

      {/* Show detailed charts/cards when a specific agent is selected */}
      {selectedAgent && agentPerf && agentPerf.length > 0 && (() => {
        const a = agentPerf[0]
        const handled = pick(a, ['handledCalls','handled','totalCalls','total','calls']) || 0
        const answered = pick(a, ['answeredCalls','answered','successful']) || 0
        const missed = pick(a, ['missedCalls','missed']) || 0
        const avgAHT = pick(a, ['avgAHTSeconds','avgAHT','averageHandleSeconds','avgHandle'])
        const avgASA = pick(a, ['avgASASeconds','avgASA','averageSpeedSeconds','avgAnswer'])
        const loggedHours = pick(a, ['loggedHours','logged_hours'])
        const occupancyRaw = pick(a, ['occupancyPercent','occupancy'])
        let occupancyPct = null
        if (occupancyRaw != null) {
          const n = Number(occupancyRaw)
          if (!Number.isNaN(n)) occupancyPct = n > 1 ? n : n * 100
        }
        const volumeData = getVolumeArrayForAgent(a)
        const missedPct = handled > 0 ? (Number(missed) / Number(handled)) * 100 : 0

        return (
          <div className="ap-agent-detail">
            <div className="ap-agent-detail-cards">
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{handled}</div>
                <div className="ap-agent-stat-title">Handled</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{answered}</div>
                <div className="ap-agent-stat-title">Answered</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{missed}</div>
                <div className="ap-agent-stat-title">Missed</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{handled > 0 ? `${missedPct.toFixed(1)}%` : '-'}</div>
                <div className="ap-agent-stat-title">Missed %</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{avgASA != null ? formatSeconds(avgASA) : '-'}</div>
                <div className="ap-agent-stat-title">Average Speed of Answer (ASA)</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{avgAHT != null ? formatSeconds(avgAHT) : '-'}</div>
                <div className="ap-agent-stat-title">Average Handle Time (AHT)</div>
              </div>
              <div className="ap-agent-stat-card">
                <div className="ap-agent-stat-value">{loggedHours != null ? formatHours(loggedHours) : '-'}</div>
                <div className="ap-agent-stat-title">Logged</div>
              </div>
            </div>
            <div className="ap-agent-charts">
              <div className="ap-donut-wrapper">
                <Donut percent={occupancyPct != null ? occupancyPct : 0} />
                <div style={{ textAlign: 'center', marginTop: 6 }}>{occupancyPct != null ? `Occupancy ${occupancyPct.toFixed(1)}%` : 'Occupancy: N/A'}</div>
              </div>
              <div className="ap-volume-chart-wrapper">
                <CallVolumeChart data={volumeData} />
              </div>
            </div>
          </div>
        )
      })()}

        <div className="ap-perf-section">
          <h4 style={{ marginTop: 18, marginBottom: 12 }}>Agent Performance Details — {period}</h4>
          {perfLoading ? (
            <div>Loading agent performance...</div>
          ) : perfError ? (
            <div style={{ color: 'var(--danger, #d9534f)' }}>{perfError}</div>
          ) : (
            <div>
              {(!agentPerf || agentPerf.length === 0) ? (
                <div>No performance data available for the selected period.</div>
              ) : (
                <div className="ap-agent-grid">
                  {agentPerf.map((a, idx) => {
                    const agentName = a.agentName || a.agent || a.name || a.name || a._id || a.id || `Agent ${idx+1}`
                    const branchName = a.branchName || a.branch || a.branch_name || '-'
                    const handled = pick(a, ['handledCalls','handled','totalCalls','total','calls']) || 0
                    const answered = pick(a, ['answeredCalls','answered','successful']) || 0
                    const missed = pick(a, ['missedCalls','missed']) || 0
                    const avgAHT = pick(a, ['avgAHTSeconds','avgAHT','averageHandleSeconds','avgHandle'])
                    const avgASA = pick(a, ['avgASASeconds','avgASA','averageSpeedSeconds','avgAnswer'])
                    const totalTalk = pick(a, ['totalTalkSeconds','totalTalk','talkSeconds','talk'])
                    const transferred = pick(a, ['transferredCalls','transferred']) || 0
                    const loggedHours = pick(a, ['loggedHours','logged_hours'])
                    const liveStatus = a.liveStatus || a.status || '-'
                    const lastSeen = a.lastSeen || a.last_seen || a.updatedAt || a.lastActive

                    return (
                      <div className="ap-agent-card" key={idx}>
                        <div className="ap-agent-card-header">
                          <div>
                            <div className="ap-agent-name">{agentName}</div>
                            <div className="ap-agent-branch">{branchName}</div>
                          </div>
                          <div className={`ap-agent-badge ${String(liveStatus).toLowerCase()}`}>
                            {String(liveStatus || '-').toUpperCase()}
                          </div>
                        </div>

                        <div className="ap-agent-metrics">
                          <div className="ap-agent-metric">
                            <div className="ap-agent-metric-title">Handled</div>
                            <div className="ap-agent-metric-value">{handled}</div>
                          </div>
                          <div className="ap-agent-metric">
                            <div className="ap-agent-metric-title">Answered</div>
                            <div className="ap-agent-metric-value">{answered}</div>
                          </div>
                          <div className="ap-agent-metric">
                            <div className="ap-agent-metric-title">Missed</div>
                            <div className="ap-agent-metric-value">{missed}</div>
                          </div>
                        </div>

                        <div className="ap-agent-extra">
                          <div><strong>Average Speed of Answer (ASA):</strong> {avgASA != null ? formatSeconds(avgASA) : '-'}</div>
                          <div><strong>Average Handle Time (AHT):</strong> {avgAHT != null ? formatSeconds(avgAHT) : '-'}</div>
                          <div><strong>Talk Time:</strong> {totalTalk != null ? formatSeconds(totalTalk) : '-'}</div>
                          <div><strong>Transferred:</strong> {transferred}</div>
                          <div><strong>Logged:</strong> {loggedHours != null ? formatHours(loggedHours) : '-'}</div>
                          <div className="ap-agent-lastseen">Last seen: {formatDate(lastSeen)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  )
}

export default AgentPerformance
