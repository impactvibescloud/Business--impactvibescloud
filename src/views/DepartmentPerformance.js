import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../config/api';
import DateTimeFilterModal from '../components/DateRange/DateTimeFilterModal';

import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilReload, cilExternalLink } from '@coreui/icons'
import {
  CCard,
  CCardBody,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormSelect,
  CButton,
} from '@coreui/react';
import './Reports/PerformanceDashboard.css'

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

const DepartmentPerformance = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableDepartments, setAvailableDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [showDateTimeModal, setShowDateTimeModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState('alltime');
  const [user, setUser] = useState({});
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (!token) return;
    apiCall('/v1/user/details', 'GET')
      .then((res) => {
        setUser(res.user || res.data?.user || res.user?.user || res.user?.data || res.data || {});
      })
      .catch(() => setUser({}));
  }, [token]);

  useEffect(() => {
    if (!user?.businessId) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        // Build query parameters
        let endpoint = `/performance/departments?businessId=${user.businessId}`;
        
        // Add date range if provided
        if (startDate && endDate) {
          // Build ISO timestamps with time components
          const fromTs = `${startDate}T${startTime}:00`
          const toTs = `${endDate}T${endTime}:00`
          endpoint += `&from=${encodeURIComponent(fromTs)}&to=${encodeURIComponent(toTs)}`
          console.log('Using custom date/time range:', { from: fromTs, to: toTs });
        } else {
          // Use period if no custom dates
          endpoint += `&period=${period}`;
          console.log('Using period:', period);
        }
        
        console.log('Fetching department performance:', endpoint);
        const res = await apiCall(endpoint, 'GET');
        const departments = Array.isArray(res) ? res : (res.data || res.departments || []);
        setData(departments);
        
        // Populate department selector
        const list = (departments || []).map(d => ({ 
          id: d.departmentId || d._id || d.name, 
          name: d.departmentName || d.name || d.departmentId 
        }));
        setAvailableDepartments(list);
      } catch (err) {
        console.error('Error fetching department performance:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId, period, startDate, endDate, startTime, endTime, token]);

  // charts removed to match AgentPerformance UI (stat tiles + small volume chart)

  const filtered = selectedDepartment ? data.filter(d => (d.departmentId || d._id || d.name) === selectedDepartment) : data

  const downloadReport = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      // If no filtered rows are selected, fallback to full data set
      const rowsToExport = (filtered && filtered.length > 0) ? filtered : (data || [])
      console.debug('DepartmentPerformance: downloadReport rows', rowsToExport.length)
      let csv = 'Department,Members,Handled Calls,Answered Calls,Missed Calls,Rejected Calls,Failed Calls,Transferred Calls,Avg AHT (sec),Avg ASA (sec),Total Talk Time (sec),Transfer Rate %,Occupancy %,Logged Hours,Presence %,Online Agents\n'
      rowsToExport.forEach(r => { 
        csv += `"${r.departmentName || r.name}","${r.membersCount||''}","${r.handledCalls||0}","${r.answeredCalls||0}","${r.missedCalls||0}","${r.rejectedCalls||0}","${r.failedCalls||0}","${r.transferredCalls||0}","${r.avgAHTSeconds||''}","${r.avgASASeconds||''}","${r.totalTalkSeconds||0}","${r.transferRatePercent||''}","${r.occupancyPercent||''}","${r.loggedHours||0}","${r.presencePercent||''}","${r.onlineAgentsCount||0}"\n` 
      })
      // prepend BOM so Excel recognizes UTF-8
      const bom = '\uFEFF'
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
      // IE fallback
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, `department-performance-${new Date().toISOString().split('T')[0]}.csv`)
      } else {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `department-performance-${new Date().toISOString().split('T')[0]}.csv`)
        // ensure it doesn't act as submit if inside any form
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => { try { window.URL.revokeObjectURL(url) } catch (e) {} }, 5000)
        console.info('DepartmentPerformance: CSV download triggered', rowsToExport.length)
      }
    } catch (e) {
      console.error('downloadReport failed', e)
    } finally {
      setIsDownloading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      let endpoint = `/performance/departments?businessId=${user.businessId}`;
      if (startDate && endDate) {
        const fromTs = `${startDate}T${startTime}:00`
        const toTs = `${endDate}T${endTime}:00`
        endpoint += `&from=${encodeURIComponent(fromTs)}&to=${encodeURIComponent(toTs)}`;
      } else {
        endpoint += `&period=${period}`;
      }
      const res = await apiCall(endpoint, 'GET');
      const departments = Array.isArray(res) ? res : (res.data || res.departments || []);
      setData(departments);
    } catch (e) {
      console.error('Error refreshing data:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = []
  // Calculate aggregated metrics from filtered data
  const totalHandledCalls = filtered.reduce((s, d) => s + (d.handledCalls || 0), 0)
  const totalAnswered = filtered.reduce((s, d) => s + (d.answeredCalls || 0), 0)
  const totalMissed = filtered.reduce((s, d) => s + (d.missedCalls || 0), 0)
  const totalOnlineAgents = filtered.reduce((s, d) => s + (d.onlineAgentsCount || 0), 0)
  const avgOccupancy = filtered.length ? (filtered.reduce((s, d) => s + (d.occupancyPercent || 0), 0) / filtered.length).toFixed(2) : 0
  const answerRate = totalHandledCalls > 0 ? ((totalAnswered / totalHandledCalls) * 100).toFixed(2) : 0
  
  // Compose stats similar to AgentPerformance layout
  stats.push({ title: 'Total Handled Calls', value: totalHandledCalls, note: `${totalAnswered} answered, ${totalMissed} missed`, onNavigate: () => navigate('/callogs') })
  stats.push({ title: 'Answer Rate', value: `${answerRate}%`, note: 'Answered / Handled' })
  stats.push({ title: 'Avg Occupancy %', value: avgOccupancy, note: 'Average across departments', isDonut: true, percent: parseFloat(avgOccupancy) || 0 })
  // Call volume by department
  const sampleVol = (filtered || []).slice(0, 11).map(d => d.handledCalls || 0)
  while (sampleVol.length < 11) sampleVol.push(0)
  stats.push({ title: 'Call Volume', volumeSample: sampleVol, note: '' })

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div className="ap-header-controls">
          <CFormSelect 
            className="ap-agent-select" 
            value={period} 
            onChange={(e) => { setPeriod(e.target.value); setStartDate(''); setEndDate(''); }}
            title="Select time period"
          >
            <option value="alltime">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last1hour">Last 1 Hour</option>
            <option value="last24hours">Last 24 Hours</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisweek">This Week</option>
            <option value="thismonth">This Month</option>
            <option value="lastmonth">Last Month</option>
          </CFormSelect>

          <CFormSelect className="ap-agent-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="">All departments</option>
            {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </CFormSelect>
          
          <button
            onClick={() => setShowDateTimeModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500',
              minWidth: '280px',
              textAlign: 'left'
            }}
            title="Select date and time range"
          >
            {startDate && endDate ? `${startDate} ${startTime} → ${endDate} ${endTime}` : 'Select Date & Time'}
          </button>
          
          <button type="button" className="ap-icon-btn" onClick={downloadReport} disabled={isDownloading}>{isDownloading ? 'Downloading...' : <CIcon icon={cilCloudDownload} />}</button>
          <button className={"ap-icon-btn" + (isRefreshing ? ' reload-animate' : '')} onClick={async () => { if (isRefreshing) return; setIsRefreshing(true); await refreshData(); setTimeout(() => setIsRefreshing(false), 600); }}><CIcon icon={cilReload} /></button>
        </div>
      </div>

      <DateTimeFilterModal
        visible={showDateTimeModal}
        onClose={() => setShowDateTimeModal(false)}
        initialStartDate={startDate}
        initialStartTime={startTime}
        initialEndDate={endDate}
        initialEndTime={endTime}
        onApply={({ startDate: sd, startTime: st, endDate: ed, endTime: et }) => {
          setStartDate(sd);
          setStartTime(st);
          setEndDate(ed);
          setEndTime(et);
        }}
      />

      <div className="ap-stats-grid">
        {loading ? (
          <div style={{ padding: 24 }}><CSpinner color="primary" /></div>
        ) : (
          stats.map((s, i) => {
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
            if (s.title === 'Call Volume') {
              return (
                <div className="ap-stat-tile chart-tile" key={i}>
                  <div className="ap-stat-header"><div className="ap-stat-title">{s.title}</div></div>
                  <div style={{ paddingTop: 8 }}><CallVolumeChart data={s.volumeSample || []} /></div>
                  <div className="ap-stat-footer">{s.note}</div>
                </div>
              )
            }
            return <StatTile key={i} title={s.title} value={s.value} note={s.note} onNavigate={s.onNavigate} />
          })
        )}
      </div>

      <CCard className="mb-4">
        <CCardBody>
          <CTable hover responsive className="mt-4">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Department Name</CTableHeaderCell>
                <CTableHeaderCell>Members</CTableHeaderCell>
                <CTableHeaderCell>Handled Calls</CTableHeaderCell>
                <CTableHeaderCell>Answered</CTableHeaderCell>
                <CTableHeaderCell>Missed</CTableHeaderCell>
                <CTableHeaderCell>Avg AHT (sec)</CTableHeaderCell>
                <CTableHeaderCell>Avg ASA (sec)</CTableHeaderCell>
                <CTableHeaderCell>Total Talk (sec)</CTableHeaderCell>
                <CTableHeaderCell>Occupancy %</CTableHeaderCell>
                <CTableHeaderCell>Presence %</CTableHeaderCell>
                <CTableHeaderCell>Online</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.map((dept) => (
                <CTableRow key={dept.departmentId || dept._id || dept.departmentName}>
                  <CTableDataCell><strong>{dept.departmentName}</strong></CTableDataCell>
                  <CTableDataCell>{dept.membersCount ?? '-'}</CTableDataCell>
                  <CTableDataCell>{dept.handledCalls ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.answeredCalls ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.missedCalls ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.avgAHTSeconds ? dept.avgAHTSeconds.toFixed(2) : '-'}</CTableDataCell>
                  <CTableDataCell>{dept.avgASASeconds ? dept.avgASASeconds.toFixed(2) : '-'}</CTableDataCell>
                  <CTableDataCell>{dept.totalTalkSeconds ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.occupancyPercent ? dept.occupancyPercent.toFixed(2) : '-'}%</CTableDataCell>
                  <CTableDataCell>{dept.presencePercent ? dept.presencePercent.toFixed(2) : '-'}%</CTableDataCell>
                  <CTableDataCell>{dept.onlineAgentsCount ?? 0}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default DepartmentPerformance;
