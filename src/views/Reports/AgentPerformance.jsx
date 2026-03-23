import React from 'react'
import './AgentPerformance.css'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilFilter, cilCloudDownload, cilReload, cilOptions, cilPhone, cilCheckCircle, cilClock } from '@coreui/icons'

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
  const stats = [
    { title: 'Total Calls', value: 0, note: 'For 1 day', icon: cilPhone },
    { title: 'Missed Calls', value: 0, note: 'For 1 day', icon: cilPhone },
    { title: 'Answered Calls', value: 0, note: 'For 1 day', icon: cilCheckCircle },
    { title: 'Missed Call Percentage', value: '0.00%', note: 'Missed Call Percentage', icon: cilPhone },

    { title: 'Average Speed Of Answer', value: '00:00:00', note: 'For 1 day', icon: cilClock },
    { title: 'Transferred Calls', value: 0, note: 'For 1 day', icon: cilPhone },
    { title: 'Call Volume', value: '', note: '', icon: cilPhone },

    { title: 'Hold Calls', value: 0, note: 'For 1 day', icon: cilClock },
    { title: 'Average Hold Duration', value: '00:00:00', note: 'For 1 day', icon: cilClock },
    { title: 'Average WrapUp Duration', value: '00:00:00', note: 'For 1 day', icon: cilClock }
  ]
  const missedPercent = 0.0

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
          <button className="ap-date-btn"><CIcon icon={cilCalendar} /> 2026-03-16 00:00 - 2026-03-16 10:55</button>
          <button className="ap-filter-btn"><CIcon icon={cilFilter} /> FILTER</button>
          <button className="ap-icon-btn"><CIcon icon={cilCloudDownload} /></button>
          <button className="ap-icon-btn"><CIcon icon={cilReload} /></button>
        </div>
      </div>

      <div className="ap-stats-grid">
        {stats.map((s, i) => {
          if (s.title === 'Missed Call Percentage') {
            return (
              <div className="ap-stat-tile donut-tile" key={i}>
                <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'8px 0'}}>
                  <Donut percent={missedPercent} />
                </div>
                <div className="ap-stat-footer">{s.note}</div>
              </div>
            )
          }
          if (s.title === 'Call Volume') {
            const sample = [0,0,0,0,0,0,0,0,0,0,0]
            return (
              <div className="ap-stat-tile chart-tile" key={i}>
                <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                <div style={{paddingTop:8}}><CallVolumeChart data={sample} /></div>
                <div className="ap-stat-footer">{s.note}</div>
              </div>
            )
          }
          return <StatTile key={i} title={s.title} value={s.value} note={s.note} icon={s.icon} />
        })}
      </div>
    </div>
  )
}

export default AgentPerformance
