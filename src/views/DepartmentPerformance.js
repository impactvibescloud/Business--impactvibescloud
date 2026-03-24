import React, { useEffect, useState } from 'react';
import { apiCall } from '../config/api';
import DateRangeModal from '../components/DateRange/DateRangeModal'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilReload } from '@coreui/icons'
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
import './Reports/AgentPerformance.css'

const StatTile = ({ title, value, note, icon }) => (
  <div className="ap-stat-tile">
    <div className="ap-stat-header">
      <div className="ap-stat-title">{title}</div>
      <div className="ap-stat-actions">{icon ? <CIcon icon={icon} /> : null}</div>
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableDepartments, setAvailableDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [showDateModal, setShowDateModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState('weekly');
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
        const res = await apiCall(`/performance/departments?businessId=${user.businessId}&period=${period}`, 'GET');
        const departments = Array.isArray(res) ? res : (res.data || res.departments || []);
        setData(departments);
        // populate selector
        const list = (departments || []).map(d => ({ id: d.departmentId || d._id || d.name, name: d.departmentName || d.name || d.departmentId }))
        setAvailableDepartments(list)
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId, period, token]);

  // charts removed to match AgentPerformance UI (stat tiles + small volume chart)

  const filtered = selectedDepartment ? data.filter(d => (d.departmentId || d._id || d.name) === selectedDepartment) : data
  const totalHandled = filtered.reduce((s, d) => s + (d.handledCalls || 0), 0)
  const totalLogged = filtered.reduce((s, d) => s + (d.loggedHours || 0), 0)
  const avgLogged = filtered.length ? (totalLogged / filtered.length).toFixed(2) : 0
  const presence = filtered.length ? ((filtered.reduce((s,d)=>s+(d.presencePercent||0),0))/filtered.length).toFixed(2) : '-'

  const downloadReport = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      // If no filtered rows are selected, fallback to full data set
      const rowsToExport = (filtered && filtered.length > 0) ? filtered : (data || [])
      console.debug('DepartmentPerformance: downloadReport rows', rowsToExport.length)
      let csv = 'Department,Members,Handled Calls,Logged Hours,Presence%\n'
      rowsToExport.forEach(r => { csv += `"${r.departmentName || r.name}","${r.membersCount||''}","${r.handledCalls||0}","${r.loggedHours||0}","${r.presencePercent||''}"\n` })
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
    setIsRefreshing(true)
    try { const res = await apiCall(`/performance/departments?businessId=${user.businessId}&period=${period}`); const departments = Array.isArray(res) ? res : (res.data || res.departments || []); setData(departments); } catch(e){}
    setIsRefreshing(false)
  }

  const stats = []
  // Compose stats similar to AgentPerformance layout
  stats.push({ title: 'Total Handled Calls', value: totalHandled, note: 'For sample' })
  stats.push({ title: 'Average Logged Hours', value: avgLogged, note: 'For sample' })
  stats.push({ title: 'Presence %', value: presence, note: 'Average presence', isDonut: true, percent: parseFloat(presence) || 0 })
  // call volume sample
  const sampleVol = (filtered || []).slice(0, 11).map(d => d.handledCalls || 0)
  while (sampleVol.length < 11) sampleVol.push(0)
  stats.push({ title: 'Call Volume', volumeSample: sampleVol, note: '' })

  return (
    <div className="ap-page">
      <div className="ap-header">
        <h3>Department Performance</h3>
        <div className="ap-header-controls">
          <button className="ap-date-btn" onClick={() => setShowDateModal(true)}>{startDate && endDate ? `${startDate} - ${endDate}` : 'Select date range'}</button>
          <CFormSelect className="ap-agent-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="">All departments</option>
            {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </CFormSelect>
          <button type="button" className="ap-icon-btn" onClick={downloadReport} disabled={isDownloading}>{isDownloading ? 'Downloading...' : <CIcon icon={cilCloudDownload} />}</button>
          <button className={"ap-icon-btn" + (isRefreshing ? ' reload-animate' : '')} onClick={async () => { if (isRefreshing) return; setIsRefreshing(true); await refreshData(); setTimeout(() => setIsRefreshing(false), 600); }}><CIcon icon={cilReload} /></button>
        </div>
      </div>

      <DateRangeModal visible={showDateModal} onClose={() => setShowDateModal(false)} initialFrom={startDate} initialTo={endDate} onApply={({ from, to }) => { setStartDate(from); setEndDate(to); /* API not supporting custom dates here; could be used in future */ }} />

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
            return <StatTile key={i} title={s.title} value={s.value} note={s.note} />
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
                <CTableHeaderCell>Logged Hours</CTableHeaderCell>
                <CTableHeaderCell>Presence %</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.map((dept) => (
                <CTableRow key={dept.departmentId || dept._id || dept.departmentName}>
                  <CTableDataCell>{dept.departmentName}</CTableDataCell>
                  <CTableDataCell>{dept.membersCount ?? '-'}</CTableDataCell>
                  <CTableDataCell>{dept.handledCalls ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.loggedHours ?? 0}</CTableDataCell>
                  <CTableDataCell>{dept.presencePercent ?? '-'}</CTableDataCell>
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
