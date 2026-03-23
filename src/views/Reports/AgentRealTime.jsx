import React, { useState } from 'react'
import './AgentRealTime.css'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilCalendar, cilArrowRight, cilCheckCircle, cilXCircle, cilPeople, cilClock } from '@coreui/icons'

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

const agents = [
  { id: 1, name: 'Dharmik Savdasiya', status: 'Available', duration: '10:31:38', callStatus: 'Not on call', dept: 'Interaction Hub', answered: 0, missed: 0, inCall: '00:00:00' },
  { id: 2, name: 'Yathish R', status: 'Available', duration: '10:31:38', callStatus: 'Not on call', dept: 'Interaction Hub', answered: 0, missed: 0, inCall: '00:00:00' },
  { id: 3, name: 'Gaurav Chauhan', status: 'Offline', duration: '00:00:00', callStatus: 'Offline', dept: 'Support', answered: 0, missed: 0, inCall: '00:00:00' }
]

const AgentRealTime = () => {
  const stats = [
    { value: 0, label: 'Total Calls', icon: cilPhone },
    { value: 0, label: 'Missed Calls', icon: cilPhone },
    { value: 0, label: 'Answered Calls', icon: cilCheckCircle },
    // Donut placeholder will be rendered specially
    { value: '0.00%', label: 'Missed Call Percentage', icon: cilPhone, isDonut: true },

    { value: '00:00:00', label: 'Average Speed Of Answer', icon: cilClock },
    { value: 0, label: 'Transferred Calls', icon: cilArrowRight },
    { value: '', label: 'Call Volume', icon: cilPeople, isChart: true },

    { value: 0, label: 'Hold Calls', icon: cilClock },
    { value: '00:00:00', label: 'Average Hold Duration', icon: cilClock },
    { value: '00:00:00', label: 'Average WrapUp Duration', icon: cilClock }
  ]

  const [legendOpen, setLegendOpen] = useState(true)

  return (
    <div className="art-page">
      <div className="art-header art-header-bar">
        <h3>Agent Real Time Report</h3>
        <div className="art-refresh-badge">Refresh in 1..</div>
      </div>

      <div className="art-stats-grid stats-grid-tiles">
        {stats.map((s, idx) => {
          if (s.isDonut) {
            return (
              <div className="art-stat-card donut-card" key={idx}>
                <div className="art-stat-top">
                  <div className="art-stat-title">{s.label}</div>
                </div>
                <div className="donut-wrap">
                  <div className="donut-ring"><div className="donut-center">{s.value}</div></div>
                </div>
                <div className="art-stat-compare">Missed Call Percentage</div>
              </div>
            )
          }
          if (s.isChart) {
            return (
              <div className="art-stat-card chart-card" key={idx}>
                <div className="art-stat-top"><div className="art-stat-title">{s.label}</div></div>
                <div className="chart-placeholder">Chart</div>
              </div>
            )
          }
          return <StatCard key={idx} value={s.value} label={s.label} icon={s.icon} />
        })}
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
            {agents.map(a => (
              <tr key={a.id} className={a.status === 'Available' ? 'art-row-available' : ''}>
                <td className="art-agent-cell">
                  <div className="art-avatar">{a.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
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
            ))}
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
