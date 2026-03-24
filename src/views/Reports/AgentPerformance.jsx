import React, { useEffect, useState } from 'react'
import './AgentPerformance.css'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilFilter, cilCloudDownload, cilReload, cilOptions, cilPhone, cilCheckCircle, cilClock } from '@coreui/icons'
import { apiCall } from '../../config/api'
import DateRangeModal from '../../components/DateRange/DateRangeModal'
import { CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormSelect } from '@coreui/react'

const StatTile = ({ title, value, note, icon }) => (
  <div className="ap-stat-tile">
    <div className="ap-stat-header">
      <div className="ap-stat-title">{title}</div>
      <div className="ap-stat-actions"><CIcon icon={icon} /></div>
    </div>
    <div className="ap-stat-body">
      <div className="ap-stat-value">{value}</div>
      <div className="ap-stat-note">{note}</div>
    </div>
    <div className="ap-stat-footer">vs 0 prev, 1 day</div>
  </div>
)

const AgentPerformance = () => {
  const [stats, setStats] = useState([])
  const [missedPercent, setMissedPercent] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDateModal, setShowDateModal] = useState(false)
  const [availableAgents, setAvailableAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
          const u = branch.user || branch.manager || branch.owner || null
          if (u && (u._id || u.id || u.email)) {
            const id = u._id || u.id || u.email
            const name = u.name || u.fullName || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || u.email || branch.branchName || `Agent ${id}`
            agents.push({ id, name })
          }
        })
        // dedupe
        const seen = {}
        agents = agents.filter((a) => {
          if (!a.id) return false
          if (seen[a.id]) return false
          seen[a.id] = true
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
            return { id, name }
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
    const w = 300
    const h = 120
    const max = Math.max(...data, 1)
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * (w - 40) + 20
      const y = h - 20 - (d / max) * (h - 40)
      return `${x},${y}`
    }).join(' ')
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="ap-vol-chart">
        <polyline points={points} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d,i)=> {
          const x = (i / (data.length - 1 || 1)) * (w - 40) + 20
          const y = h - 20 - (d / max) * (h - 40)
          return <circle key={i} cx={x} cy={y} r={3} fill="#fb7185" />
        })}
        <g className="ap-chart-legend" transform={`translate(${20}, ${h - 10})`}>
          <circle cx="0" cy="0" r="6" fill="#fb7185" />
          <text x="12" y="4" fontSize="10" fill="#6b7280">Current data</text>
        </g>
      </svg>
    )
  }

  return (
    <div className="ap-page">
      <div className="ap-header">
        <h3>Agent Performance Dashboard</h3>
        <div className="ap-header-controls">
          <button className="ap-date-btn" onClick={() => setShowDateModal(true)}><CIcon icon={cilCalendar} /> {startDate && endDate ? `${startDate} - ${endDate}` : 'Select date range'}</button>
          <CFormSelect className="ap-agent-select" value={selectedAgent} onChange={(e) => { setSelectedAgent(e.target.value); fetchStats(startDate, endDate, e.target.value); }}>
            <option value="">All agents</option>
            {availableAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
              if (selectedAgent) qp.push(`agent=${encodeURIComponent(selectedAgent)}`)
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
            try { await fetchStats(startDate, endDate, selectedAgent) } catch (e) {}
            setTimeout(() => setIsRefreshing(false), 800)
          }}><CIcon icon={cilReload} /></button>
        </div>
      </div>

      <DateRangeModal visible={showDateModal} onClose={() => setShowDateModal(false)} initialFrom={startDate} initialTo={endDate} onApply={({ from, to }) => { setStartDate(from); setEndDate(to); fetchStats(from, to, selectedAgent); }} />

      <div className="ap-stats-grid">
        {stats.length > 0 ? stats.map((s, i) => {
          if (s.title === 'Missed Call Percentage') {
            return (
              <div className="ap-stat-tile donut-tile" key={i}>
                <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'8px 0'}}>
                  <Donut percent={parseFloat(missedPercent) || 0} />
                </div>
                <div className="ap-stat-footer">{s.note}</div>
              </div>
            )
          }
          if (s.title === 'Call Volume') {
            const sample = s.volumeSample || [0,0,0,0,0,0,0,0,0,0,0]
            return (
              <div className="ap-stat-tile chart-tile" key={i}>
                <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                <div style={{paddingTop:8}}><CallVolumeChart data={sample} /></div>
                <div className="ap-stat-footer">{s.note}</div>
              </div>
            )
          }
          return <StatTile key={i} title={s.title} value={s.value} note={s.note} icon={s.icon} />
        }) : (
          // fallback to previous static display while loading
          stats.map((s, i) => <StatTile key={i} title={s.title} value={s.value} note={s.note} icon={s.icon} />)
        )}
      </div>
    </div>
  )
}

export default AgentPerformance
