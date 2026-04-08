import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../config/api';
import DateTimeFilterModal from '../components/DateRange/DateTimeFilterModal';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Paper,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const StatTile = ({ title, value, note, onNavigate }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #000' }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 1.5, pt: 2 }}>
      {/* Header with Title and Icon Button */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: '#374151', fontWeight: 700, fontSize: '1rem' }}>
          {title}
        </Typography>
        {onNavigate && (
          <Button
            size="small"
            onClick={onNavigate}
            sx={{ minWidth: 'auto', p: 0.5, color: '#0b5a47' }}
          >
            <OpenInNewIcon sx={{ fontSize: '1.2rem' }} />
          </Button>
        )}
      </Box>

      {/* Middle Section - Value and Note */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', lineHeight: 1, color: '#111827' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500 }}>
          {note}
        </Typography>
      </Box>

      {/* Footer */}
      <Typography variant="caption" sx={{ color: '#9ca3af', mt: 2, fontSize: '0.75rem' }}>
        vs 0 prev, 1 day
      </Typography>
    </CardContent>
  </Card>
)

const Donut = ({ percent, size = 120, title, note }) => {
  const stroke = 12
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const dash = (percent / 100) * circumference
  return (
    <Card sx={{ height: '100%', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #000' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', pb: 1.5, pt: 2 }}>
        {/* Title */}
        <Typography variant="subtitle1" sx={{ color: '#374151', fontWeight: 700, fontSize: '1rem', mb: 2 }}>
          {title}
        </Typography>

        {/* Chart - Centered */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
          <svg width={size} height={size}>
            <g transform={`translate(${cx}, ${cy})`}>
              <circle r={radius} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
              <circle r={radius} cx={0} cy={0} fill="none" stroke="#f59e0b" strokeWidth={stroke} strokeLinecap="round" transform={`rotate(-90)`} strokeDasharray={`${dash} ${circumference - dash}`} />
              <text x="0" y="6" textAnchor="middle" fontWeight="800" fontSize="16" fill="#111">{percent.toFixed(2)}%</text>
            </g>
          </svg>
        </Box>

        {/* Note */}
        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500, textAlign: 'center', mb: 'auto' }}>
          {note}
        </Typography>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: '#9ca3af', mt: 2, fontSize: '0.75rem' }}>
          vs 0 prev, 1 day
        </Typography>
      </CardContent>
    </Card>
  )
}

const CallVolumeChart = ({ data = [], title, note }) => {
  const w = 300
  const h = 120
  const max = Math.max(...data, 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * (w - 40) + 20
    const y = h - 20 - (d / max) * (h - 40)
    return `${x},${y}`
  }).join(' ')
  return (
    <Card sx={{ height: '100%', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #000' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', pb: 1.5, pt: 2 }}>
        {/* Title */}
        <Typography variant="subtitle1" sx={{ color: '#374151', fontWeight: 700, fontSize: '1rem', mb: 2 }}>
          {title}
        </Typography>

        {/* Chart - Centered */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', my: 1 }}>
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', minHeight: 80 }}>
            <polyline points={points} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * (w - 40) + 20
              const y = h - 20 - (d / max) * (h - 40)
              return <circle key={i} cx={x} cy={y} r={3} fill="#fb7185" />
            })}
            <g transform={`translate(${20}, ${h - 10})`}>
              <circle cx="0" cy="0" r="6" fill="#fb7185" />
              <text x="12" y="4" fontSize="10" fill="#6b7280">Current data</text>
            </g>
          </svg>
        </Box>

        {/* Note */}
        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, mb: 'auto' }}>
          {note}
        </Typography>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: '#9ca3af', mt: 2, fontSize: '0.75rem' }}>
          vs 0 prev, 1 day
        </Typography>
      </CardContent>
    </Card>
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
        console.log('Department performance data received:', { count: departments.length, sample: departments[0] });
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
      let csv = 'Department,Members,Online Agents,Answered Calls,Missed Calls,Busy Calls,Not Answered,Avg AHT (sec),Avg ASA (sec),Total Talk Time (sec),Occupancy %\n'
      rowsToExport.forEach(r => { 
        csv += `"${r.departmentName || r.name}","${r.membersCount||''}","${r.onlineAgentsCount||0}","${r.answeredCalls||0}","${r.missedCalls||0}","${r.busyCalls||0}","${r.notAnsweredOutbound||0}","${r.avgAHTSeconds||''}","${r.avgASASeconds||''}","${r.totalTalkSeconds||0}","${r.occupancyPercent||''}"\n` 
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
  const totalBusy = filtered.reduce((s, d) => s + (d.busyCalls || 0), 0)
  const totalNotAnswered = filtered.reduce((s, d) => s + (d.notAnsweredOutbound || 0), 0)
  const totalOccupancySum = filtered.reduce((s, d) => s + (parseFloat(d.occupancyPercent) || 0), 0)
  const avgOccupancy = filtered.length > 0 ? (totalOccupancySum / filtered.length).toFixed(2) : '0.00'
  const answerRate = totalHandledCalls > 0 ? ((totalAnswered / totalHandledCalls) * 100).toFixed(2) : 0
  
  // Compose stats similar to AgentPerformance layout
  stats.push({ title: 'Total Handled Calls', value: totalHandledCalls, note: `${totalAnswered} answered, ${totalMissed} missed, ${totalBusy} busy, ${totalNotAnswered} not answered`, onNavigate: () => navigate('/callogs') })
  stats.push({ title: 'Answer Rate', value: `${answerRate}%`, note: 'Answered / Handled' })
  stats.push({ title: 'Avg Occupancy %', value: `${avgOccupancy}%`, note: 'Average across departments', isDonut: true, percent: parseFloat(avgOccupancy) || 0 })
  // Call volume by department
  const sampleVol = (filtered || []).slice(0, 11).map(d => d.handledCalls || 0)
  while (sampleVol.length < 11) sampleVol.push(0)
  stats.push({ title: 'Call Volume', volumeSample: sampleVol, note: '' })
  
  console.log('Stats calculated:', { stats: stats.length, avgOccupancy, hasVolume: sampleVol.some(v => v > 0), totalHandledCalls, period, selectedDepartment })

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Department Performance
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Track and analyze department-level call metrics and performance
            </Typography>
          </Box>
        </Box>

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Period"
            size="small"
            variant="outlined"
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setStartDate(''); setEndDate(''); }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180, width: 160 }}
          >
            <MenuItem value="alltime">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="last1hour">Last 1 Hour</MenuItem>
            <MenuItem value="last24hours">Last 24 Hours</MenuItem>
            <MenuItem value="last7days">Last 7 Days</MenuItem>
            <MenuItem value="last30days">Last 30 Days</MenuItem>
            <MenuItem value="thisweek">This Week</MenuItem>
            <MenuItem value="thismonth">This Month</MenuItem>
            <MenuItem value="lastmonth">Last Month</MenuItem>
          </TextField>

          <TextField
            select
            label="Department"
            size="small"
            variant="outlined"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => {
                if (value === '' || !value) {
                  return 'All departments'
                }
                const dept = availableDepartments.find(d => d.id === value)
                return dept?.name || 'All departments'
              }
            }}
            sx={{ minWidth: 180, width: 160 }}
          >
            <MenuItem value="">All departments</MenuItem>
            {availableDepartments.map(d => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowDateTimeModal(true)}
            sx={{ 
              textTransform: 'none', 
              minWidth: 280,
              height: 40,
              borderRadius: '4px',
              justifyContent: 'flex-start',
              color: '#374151',
              borderColor: '#d1d5db',
            }}
          >
            {startDate && endDate ? `${startDate} ${startTime} → ${endDate} ${endTime}` : 'Select Date & Time'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={downloadReport}
            disabled={isDownloading}
            startIcon={isDownloading ? <CircularProgress size={16} /> : <GetAppIcon />}
            sx={{ 
              textTransform: 'none',
              height: 40,
              borderRadius: '4px',
              color: '#374151',
              borderColor: '#d1d5db',
            }}
          >
            {isDownloading ? 'Downloading' : 'Export'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={refreshData}
            disabled={isRefreshing}
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{ 
              textTransform: 'none',
              height: 40,
              borderRadius: '4px',
              color: '#374151',
              borderColor: '#d1d5db',
            }}
          >
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </Box>
      </Box>

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

      {/* Stats Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((s, i) => {
            if (s.isDonut) {
              return (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Donut percent={s.percent || 0} title={s.title} note={s.note} />
                </Grid>
              )
            }
            if (s.title === 'Call Volume') {
              return (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <CallVolumeChart data={s.volumeSample || []} title={s.title} note={s.note} />
                </Grid>
              )
            }
            return (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatTile title={s.title} value={s.value} note={s.note} onNavigate={s.onNavigate} />
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader
          title="Department Details"
          sx={{
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Members</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Online</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Answered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Missed</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Busy</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Not Answered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Avg AHT (sec)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Avg ASA (sec)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Talk (sec)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Occupancy %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 3, color: '#6b7280' }}>
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((dept) => (
                    <TableRow key={dept.departmentId || dept._id || dept.departmentName} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{dept.departmentName}</TableCell>
                      <TableCell align="right">{dept.membersCount ?? '-'}</TableCell>
                      <TableCell align="right">{dept.onlineAgentsCount ?? 0}</TableCell>
                      <TableCell align="right">{dept.answeredCalls ?? 0}</TableCell>
                      <TableCell align="right">{dept.missedCalls ?? 0}</TableCell>
                      <TableCell align="right">{dept.busyCalls ?? 0}</TableCell>
                      <TableCell align="right">{dept.notAnsweredOutbound ?? 0}</TableCell>
                      <TableCell align="right">{dept.avgAHTSeconds ? dept.avgAHTSeconds.toFixed(2) : '-'}</TableCell>
                      <TableCell align="right">{dept.avgASASeconds ? dept.avgASASeconds.toFixed(2) : '-'}</TableCell>
                      <TableCell align="right">{dept.totalTalkSeconds ?? 0}</TableCell>
                      <TableCell align="right">{dept.occupancyPercent ? dept.occupancyPercent.toFixed(2) : '-'}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DepartmentPerformance;
