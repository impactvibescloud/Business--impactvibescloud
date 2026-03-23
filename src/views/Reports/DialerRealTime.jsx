import React from 'react'
import './DialerRealTime.css'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilCalendar, cilCheckCircle, cilXCircle, cilArrowRight } from '@coreui/icons'

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
  const stats = [
    { value: 0, label: 'Active Calls', icon: cilPhone },
    { value: 0, label: 'Calls Today', icon: cilCalendar },
    { value: 0, label: 'Outgoing Answered', icon: cilCheckCircle },
    { value: 0, label: 'Outgoing Missed', icon: cilXCircle },
    { value: 0, label: 'Incoming Answered', icon: cilCheckCircle },
    { value: 0, label: 'Incoming Missed', icon: cilXCircle }
  ]

  return (
    <div className="drt-page">
      <div className="drt-header drt-header-bar">
        <div className="drt-header-left">
          <h3>Dialer Real Time Report</h3>
        </div>
        <div className="drt-header-right">
          <div className="drt-controls">
            <div className="drt-refresh">Refreshing...</div>
            <select className="drt-select">
              <option>Nothing selected</option>
            </select>
            <button className="drt-btn">+ Select KPI</button>
            <button className="drt-gear">⚙</button>
          </div>
        </div>
      </div>

      <div className="drt-stats-grid">
        {stats.map((s, i) => (
          <StatCard key={i} value={s.value} label={s.label} icon={s.icon} />
        ))}
      </div>

      <div className="drt-action-row">
        <button className="drt-primary">Set Listen/Whisper/Barge destination</button>
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
                <th>Agents/Agent Groups</th>
                <th>Status</th>
                <th>Status Duration</th>
                <th>Campaign</th>
                <th>Answered Calls</th>
                <th>Missed Calls</th>
                <th>Total In-Call Time</th>
                  <th>Total Break Duration</th>
                  <th>Total Available Duration</th>
                  <th>Total ACD Time</th>
                  <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                  <td className="drt-empty" colSpan="11">No data available</td>
              </tr>
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
