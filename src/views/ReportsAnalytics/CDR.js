import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Alert,
  Grid,
} from '@mui/material'
import GetAppIcon from '@mui/icons-material/GetApp'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import { apiCall, getBaseURL } from '../../config/api'
import '../Branches/Branches.css'
import './CDR.css'
import '../Leads/CallLogsWebpage.css'

const CDR = () => {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  
  // Initialize with today's date
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const [startDateFilter, setStartDateFilter] = useState(getTodayDate())
  const [endDateFilter, setEndDateFilter] = useState(getTodayDate())

  const [expandedRows, setExpandedRows] = useState(new Set())
  const [openCallFlows, setOpenCallFlows] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [openMoreInfo, setOpenMoreInfo] = useState(new Set())

  // Recording blob URLs cache
  const recordingBlobCache = React.useRef({})

  // Filter inputs (UI only for now)
  const [fromNumber, setFromNumber] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [availableAgents, setAvailableAgents] = useState([])
  // Columns customization state
  const columnsList = [
    { key: 'sno', label: 'S.NO' },
    { key: 'contact', label: 'CONTACT' },
    { key: 'virtualNumber', label: 'VIRTUAL NUMBER' },
    { key: 'date', label: 'DATE' },
    { key: 'time', label: 'TIME' },
    { key: 'duration', label: 'DURATION' },
    { key: 'agent', label: 'AGENT' },
    { key: 'status', label: 'STATUS' },
    { key: 'notes', label: 'NOTES' },
  ]
  const [selectedColumns, setSelectedColumns] = useState(columnsList.map(c=>c.key))
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const tryPrefill = async () => {
      if (businessId) return
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u.businessId) {
          setBusinessId(u.businessId)
          try { localStorage.setItem('businessId', u.businessId) } catch (e) {}
        }
      } catch (e) {}
    }
    tryPrefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDateTime = (iso) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch (e) { return iso }
  }

  const formatDateTimeShort = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) { return iso }
  }

  const fetchRecords = async (p = 1) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) {
      setRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const qp = [`businessId=${encodeURIComponent(currentBusinessId)}`, `page=${p}`, `limit=${limit}`]
      if (startDateFilter) qp.push(`startDate=${encodeURIComponent(startDateFilter)}`)
      if (endDateFilter) qp.push(`endDate=${encodeURIComponent(endDateFilter)}`)
      if (fromNumber) qp.push(`from=${encodeURIComponent(fromNumber)}`)
      if (toNumber) qp.push(`to=${encodeURIComponent(toNumber)}`)
      if (agentFilter) qp.push(`agent=${encodeURIComponent(agentFilter)}`)
      if (typeFilter) qp.push(`type=${encodeURIComponent(typeFilter)}`)
      const endpoint = `/call-logs?${qp.join('&')}`
      const res = await apiCall(endpoint, 'GET')
      if (res && res.success) {
        const callLogs = Array.isArray(res.data) ? res.data : []
        const normalized = callLogs.map((cl) => ({
          ...cl,
          callLog: {
            callDate: cl.callDate,
            contact: cl.contact,
            virtualNumber: cl.virtualNumber,
            duration: cl.callDuration ?? cl.duration ?? 0,
            status: cl.status,
          },
          agent: cl.agent || null,
          note: cl.notebyagent || cl.cdrImportNote || null,
          raw: cl,
        }))
        setRecords(normalized)
        if (res.pagination) {
          try { 
            setPage(res.pagination.page || 1)
            setTotalPages(res.pagination.totalPages || 1)
            setTotalRecords(res.pagination.totalRecords || 0)
          } catch (e) {}
        }
      } else {
        setRecords([])
      }
    } catch (e) {
      console.error('fetchRecords error', e)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecords(page) }, [page, businessId])

  // load saved columns selection
  useEffect(() => {
    try {
      const s = localStorage.getItem('cdrSelectedColumns')
      if (s) {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed) && parsed.length) setSelectedColumns(parsed)
      }
    } catch (e) {}
  }, [])

  const fetchAgents = async () => {
    try {
      let bid = businessId || localStorage.getItem('businessId') || ''
      if (!bid) {
        try { const ud = await apiCall('/v1/user/details','GET'); const u = ud?.user || ud?.data || ud; bid = u?.businessId || u?.businessid || '' } catch (e) {}
      }
      if (!bid) return
      let agents = []
      try {
        const br = await apiCall(`/branch/${encodeURIComponent(bid)}/branches`, 'GET')
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
        const seen = {}
        agents = agents.filter((a) => { if (!a.id) return false; if (seen[a.id]) return false; seen[a.id]=true; return true })
      } catch (e) { agents = [] }
      if (!agents || agents.length === 0) {
        try {
          const res = await apiCall(`/users?businessId=${encodeURIComponent(bid)}`)
          let data = []
          if (Array.isArray(res)) data = res
          else if (res?.data && Array.isArray(res.data)) data = res.data
          else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data
          else if (res && typeof res === 'object') data = [res]
          agents = (data || []).map((a, idx) => {
            const first = a.firstName || a.first_name || ''
            const last = a.lastName || a.last_name || ''
            const combined = (first || last) ? `${first} ${last}`.trim() : ''
            const name = a.name || a.fullName || combined || a.email || a.username || `Agent ${idx+1}`
            const id = a._id || a.id || a.email || `${idx}`
            return { id, name }
          })
        } catch (e) { agents = [] }
      }
      setAvailableAgents(agents)
    } catch (e) { setAvailableAgents([]) }
  }

  useEffect(() => { fetchAgents() }, [businessId])

  const toggleRow = (id) => {
    const s = new Set(expandedRows)
    if (s.has(id)) s.delete(id); else s.add(id)
    setExpandedRows(s)
  }

  const toggleCallFlow = (id) => {
    const s = new Set(openCallFlows)
    if (s.has(id)) s.delete(id); else s.add(id)
    setOpenCallFlows(s)
  }

  const toggleMoreInfo = (id) => {
    const s = new Set(openMoreInfo)
    if (s.has(id)) s.delete(id); else s.add(id)
    setOpenMoreInfo(s)
  }

  const openDetails = (item) => { setSelectedItem(item); setDetailsOpen(true) }
  const closeDetails = () => { setSelectedItem(null); setDetailsOpen(false) }

  // Handle download recording
  const handleDownloadRecording = async (record) => {
    const filename = getRecordingFilename(record)
    if (!filename) {
      alert('Recording not available')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const apiUrl = `${getBaseURL()}/api/call-logs/download/${filename}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        alert('Failed to download recording')
        return
      }

      const blob = await response.blob()
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading recording:', error)
      alert('Error downloading recording')
    }
  }

  // Helper to fetch recording blob with authentication
  const getRecordingBlobUrl = async (filename) => {
    if (!filename) {
      console.warn('No filename provided')
      return null
    }
    
    // Check cache first
    if (recordingBlobCache.current[filename]) {
      console.log('Using cached blob URL for:', filename)
      return recordingBlobCache.current[filename]
    }

    try {
      const token = localStorage.getItem('authToken')
      const baseUrl = getBaseURL()
      // Construct the download URL - filename should contain the full filename from API
      const apiUrl = `${baseUrl}/api/call-logs/download/${encodeURIComponent(filename)}`
      
      console.log('Fetching recording:', { filename, apiUrl, token: token ? 'present' : 'missing' })
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      console.log('Recording fetch response status:', response.status, response.statusText)

      if (!response.ok) {
        console.error(`Failed to fetch recording: ${response.status} ${response.statusText}`)
        return null
      }

      const blob = await response.blob()
      console.log('Recording blob received, size:', blob.size)
      
      const blobUrl = URL.createObjectURL(blob)
      
      // Cache the blob URL
      recordingBlobCache.current[filename] = blobUrl
      
      return blobUrl
    } catch (error) {
      console.error('Error fetching recording blob:', error.message, error)
      return null
    }
  }

  // Recording Player Component
  const RecordingPlayer = ({ recordingFilename, onDownload }) => {
    const [blobUrl, setBlobUrl] = React.useState(null)
    const [loading, setLoading] = React.useState(false)
    const [playing, setPlaying] = React.useState(false)
    const audioRef = React.useRef(null)

    React.useEffect(() => {
      if (!recordingFilename) return

      const loadRecording = async () => {
        setLoading(true)
        const url = await getRecordingBlobUrl(recordingFilename)
        setBlobUrl(url)
        setLoading(false)
      }

      loadRecording()
    }, [recordingFilename])

    if (!recordingFilename) {
      return <span className="text-muted">No recording</span>
    }

    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#6c757d', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} /> Loading recording...
          </Typography>
        </Box>
      )
    }

    if (!blobUrl) {
      return <span className="text-danger">Failed to load recording</span>
    }

    return (
      <div className="audio-player d-flex align-items-center gap-2">
        <audio
          ref={audioRef}
          src={blobUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={(e) => {
            console.error('Audio playback error:', e)
            alert('Error playing recording')
          }}
          controls
          style={{ maxWidth: '260px' }}
        />
        <button
          className="recording-download-btn"
          onClick={onDownload}
          title="Download recording"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download</span>
        </button>
      </div>
    )
  }

  // Helper to get the filename from a call record
  const getRecordingFilename = (record) => {
    // New structure: recording field or recordingMeta.filename
    if (record?.recording) return record.recording
    if (record?.recordingMeta?.filename) return record.recordingMeta.filename
    // Legacy structure: callRecording field
    if (record?.callRecording) return record.callRecording
    return null
  }

  const exportAllCDR = async () => {
    if (!records || records.length === 0) {
      alert('No records to export')
      return
    }
    setExporting(true)
    try {
      const csvHeader = 'S.NO,Contact,Virtual Number,Date,Time,Duration,Agent,Status,Notes,Call Type,Recording\n'
      const csvRows = records.map((record, idx) => {
        const callDate = record.callLog?.callDate || record.callDate || ''
        const dt = callDate ? new Date(callDate) : null
        const dateOnly = dt ? dt.toLocaleDateString() : '-'
        const timeOnly = dt ? dt.toLocaleTimeString() : '-'
        const recording = getRecordingFilename(record) || 'N/A'
        return [
          idx + 1,
          record.callLog?.contact || record.contact || '',
          record.callLog?.virtualNumber || record.virtualNumber || '',
          dateOnly,
          timeOnly,
          record.callLog?.duration || record.duration || '0',
          record.agent?.name || record.agent?.email || '',
          record.callLog?.status || record.status || '',
          record.note || '',
          record.callType || 'unknown',
          recording
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      }).join('\n')
      const csv = csvHeader + csvRows
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `CDR_Export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CDR:', error)
      alert('Error exporting CDR data')
    } finally {
      setExporting(false)
    }
  }

  const resetFilters = () => {
    setFromNumber(''); setToNumber(''); setAgentFilter(''); setTypeFilter(''); setStartDateFilter(getTodayDate()); setEndDateFilter(getTodayDate()); fetchRecords(1)
  }
  const applyFilters = () => { fetchRecords(1) }

  const getColumnValue = (key, item, idx) => {
    switch (key) {
      case 'sno': return idx + 1
      case 'contact': return item.callLog?.contact || item.contact || ''
      case 'virtualNumber': return item.callLog?.virtualNumber || item.virtualNumber || ''
      case 'date': return formatDateTimeShort(item.callLog?.callDate || item.callDate)
      case 'time': return item.callLog?.callDate ? new Date(item.callLog.callDate).toLocaleTimeString() : ''
      case 'duration': return item.callLog?.duration ? `${item.callLog.duration}s` : ''
      case 'agent': return item.agent?.name || item.agent?.email || ''
      case 'status': return item.callLog?.status || ''
      case 'notes': return item.note || ''
      default: return ''
    }
  }

  const filtered = records.filter((r) => {
    const q = (searchTerm || '').trim().toLowerCase()
    if (!q) return true
    return (r.agent?.email || r.agent?.name || '').toString().toLowerCase().includes(q) || (r.callLog?.contact || '').toString().toLowerCase().includes(q) || (r.note || '').toString().toLowerCase().includes(q)
  })

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title={
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>Call Detail Records</Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>View and analyze call history with detailed information</Typography>
            </Box>
          }
        />
        <CardContent>
          {!businessId && (
            <Alert severity="warning" sx={{ mb: 3 }}>Missing <code>businessId</code> in localStorage. Set it to view CDRs.</Alert>
          )}

          {/* Columns Customization Dialog */}
          <Dialog open={showColumnsModal} onClose={() => setShowColumnsModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Customize Columns</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>Preview (first 3 rows):</Typography>
                <Box sx={{ overflowX: 'auto', mb: 3 }}>
                  <table className="table table-sm" style={{ minWidth: 500 }}>
                    <thead>
                      <tr>
                        {(selectedColumns && selectedColumns.length ? selectedColumns : columnsList.map(c=>c.key)).map(k => {
                          const m = columnsList.find(c=>c.key===k)
                          return <th key={k}>{(m && m.label) ? m.label : k}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {(filtered||[]).slice(0,3).map((r,ri)=> (
                        <tr key={ri}>
                          {(selectedColumns && selectedColumns.length ? selectedColumns : columnsList.map(c=>c.key)).map(k=> (
                            <td key={k} style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:200}}>{String(getColumnValue(k,r,ri) || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {columnsList.map(c => (
                    <FormControlLabel
                      key={c.key}
                      label={c.label}
                      control={
                        <Checkbox
                          checked={selectedColumns.indexOf(c.key) !== -1}
                          onChange={(e)=>{
                            if (e.target.checked) setSelectedColumns(s => Array.from(new Set([...(s||[]), c.key])))
                            else setSelectedColumns(s => (s||[]).filter(x=>x!==c.key))
                          }}
                        />
                      }
                    />
                  ))}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedColumns(columnsList.map(c=>c.key))} variant="text">Select All</Button>
              <Button onClick={() => setSelectedColumns([])} variant="text">Clear All</Button>
              <Button
                onClick={() => {
                  try { localStorage.setItem('cdrSelectedColumns', JSON.stringify(selectedColumns||[])) } catch(e){}
                  setShowColumnsModal(false)
                }}
                variant="contained"
                sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}
              >
                Apply
              </Button>
              <Button onClick={() => setShowColumnsModal(false)} variant="outlined">Close</Button>
            </DialogActions>
          </Dialog>

          {/* Details Modal */}
          <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="sm" fullWidth>
            <DialogTitle>CDR Details</DialogTitle>
            <DialogContent>
              {!selectedItem ? (
                <Typography>No item selected</Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 2 }}><Typography variant="subtitle2"><strong>Agent:</strong> {selectedItem.agent?.email || selectedItem.agent?.name || '-'}</Typography></Box>
                  <Box sx={{ mb: 1 }}><Typography variant="body2"><strong>Contact:</strong> {selectedItem.callLog?.contact || '-'}</Typography></Box>
                  <Box sx={{ mb: 1 }}><Typography variant="body2"><strong>Virtual Number:</strong> {selectedItem.callLog?.virtualNumber || '-'}</Typography></Box>
                  <Box sx={{ mb: 1 }}><Typography variant="body2"><strong>Call Date:</strong> {formatDateTime(selectedItem.callLog?.callDate)}</Typography></Box>
                  <Box sx={{ mb: 2 }}><Typography variant="body2"><strong>Duration:</strong> {selectedItem.callLog?.duration ? `${selectedItem.callLog.duration}s` : '-'}</Typography></Box>
                  <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2, mb: 2 }}></Box>
                  <Box sx={{ mb: 1 }}><Typography variant="body2"><strong>Note:</strong> {selectedItem.note || '-'}</Typography></Box>
                  <Box><Typography variant="body2"><strong>Call Status:</strong> <Chip label={selectedItem.callLog?.status || '-'} size="small" sx={{ backgroundColor: selectedItem.callLog?.status === 'answered' ? '#c8e6c9' : selectedItem.callLog?.status === 'missed' ? '#ffcdd2' : '#e0e0e0', color: selectedItem.callLog?.status === 'answered' ? '#2e7d32' : selectedItem.callLog?.status === 'missed' ? '#c62828' : '#424242', fontWeight: 500 }} /></Typography></Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetails} variant="outlined">Close</Button>
            </DialogActions>
          </Dialog>

          {/* Filter Section */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="From" size="small" fullWidth placeholder="From number" value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="To" size="small" fullWidth placeholder="To number" value={toNumber} onChange={(e) => setToNumber(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="Agent / Branch" select size="small" fullWidth value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                <MenuItem value="">All agents</MenuItem>
                {availableAgents.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="Type" select size="small" fullWidth value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">All types</MenuItem>
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="From Date" type="date" size="small" fullWidth value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="To Date" type="date" size="small" fullWidth value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={resetFilters}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={applyFilters}
                disabled={loading}
                sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}
              >
                Search
              </Button>
              <Button
                variant="contained"
                startIcon={exporting ? <CircularProgress size={18} /> : <GetAppIcon />}
                onClick={() => exportAllCDR()}
                disabled={loading || exporting}
                sx={{ backgroundColor: '#00b894', '&:hover': { backgroundColor: '#00a383' } }}
              >
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowColumnsModal(true)}
              >
                Columns
              </Button>
            </Grid>
          </Grid>

          {/* Table Section */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#6c757d' }}>
              <Typography>No call logs found</Typography>
            </Box>
          ) : (
            <>
              <Paper variant="outlined" className="calllogs-table-container">
                <Table size="small" sx={{ '& th, & td': { py: 1, px: 1.5 } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                    <TableCell sx={{ fontWeight: 600, width: '45%' }}>TO</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '12%' }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '12%' }}>TIME</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '12%' }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '19%' }}>RESULTS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((d) => {
                    const callDate = d.callLog?.callDate || d.callDate
                    const dt = callDate ? new Date(callDate) : null
                    const dateOnly = dt ? dt.toLocaleDateString() : '-'
                    const timeOnly = dt ? dt.toLocaleTimeString() : '-'
                    const resultText = d.note || d.callLog?.status || d.status || '—'

                    const rawFrom = d.raw?.fromNumber || d.raw?.callInitiatedBy || d.raw?.callerNumber || ''
                    const rawTo = d.raw?.toNumber || d.raw?.callReceivedBy || d.raw?.calleeNumber || ''
                    const contact = d.callLog?.contact || d.contact || d.callInitiatedBy || ''
                    let isInbound = false

                    if (d.callType && String(d.callType).toLowerCase() === 'inbound') {
                      isInbound = true
                    } else if (d.raw?.callType && String(d.raw.callType).toLowerCase() === 'inbound') {
                      isInbound = true
                    } else if (d.callInitiatedBy && contact && String(d.callInitiatedBy) === String(contact)) {
                      isInbound = true
                    } else if (rawFrom && contact && String(rawFrom) === String(contact)) {
                      isInbound = true
                    } else if (rawTo && contact && String(rawTo) === String(contact)) {
                      isInbound = false
                    } else if (d.raw && d.raw.direction) {
                      const dir = String(d.raw.direction).toLowerCase()
                      if (dir.includes('in')) isInbound = true
                      else if (dir.includes('out')) isInbound = false
                    } else if (d.agent && d.raw && (d.raw.fromName || d.raw.toName) && d.agent.name) {
                      const an = String(d.agent.name).toLowerCase()
                      if (d.raw.fromName && String(d.raw.fromName).toLowerCase().includes(an)) isInbound = false
                      else if (d.raw.toName && String(d.raw.toName).toLowerCase().includes(an)) isInbound = true
                    }

                    const fromTimeDefault = formatDateTimeShort(d.raw?.fromAt || d.callLog?.callDate || d.callDate)
                    const toTimeDefault = formatDateTimeShort(d.raw?.toAt || d.callLog?.callDate || d.callDate)

                    let leftTitle, leftSub, leftTime, rightTitle, rightSub, rightTime

                    if (isInbound) {
                      leftTitle = contact
                      leftSub = d.raw?.fromName || 'Incoming'
                      leftTime = fromTimeDefault
                      rightTitle = d.agent?.name || d.agent?.email || 'Agent'
                      rightSub = d.raw?.toName || 'Answered'
                      rightTime = toTimeDefault
                    } else {
                      leftTitle = d.agent?.name || d.agent?.email || 'Agent'
                      leftSub = d.raw?.fromName || 'Outgoing'
                      leftTime = fromTimeDefault
                      rightTitle = contact
                      rightSub = d.raw?.toName || 'Recipient'
                      rightTime = toTimeDefault
                    }

                    return (
                      <React.Fragment key={d._id}>
                        <TableRow hover onClick={() => toggleRow(d._id)} sx={{ cursor: 'pointer' }}>
                          <TableCell sx={{ fontSize: '0.9rem' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{leftTitle}</Typography>
                              <Typography variant="caption" sx={{ color: '#6c757d' }}>{rightTitle}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{dateOnly}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{timeOnly}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>
                            <Chip
                              label={isInbound ? 'Inbound' : 'Outbound'}
                              size="small"
                              sx={{
                                backgroundColor: isInbound ? '#e3f2fd' : '#fce4ec',
                                color: isInbound ? '#1565c0' : '#c2185b',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>
                            <Box>
                              <Typography variant="body2">{resultText}</Typography>
                              <Chip
                                label={d.callLog?.status || ''}
                                size="small"
                                sx={{
                                  backgroundColor: d.callLog?.status === 'answered' ? '#c8e6c9' : d.callLog?.status === 'missed' ? '#ffcdd2' : '#e0e0e0',
                                  color: d.callLog?.status === 'answered' ? '#2e7d32' : d.callLog?.status === 'missed' ? '#c62828' : '#424242',
                                  fontWeight: 500,
                                  mt: 0.5,
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(d._id) && (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ py: 2, backgroundColor: '#fff' }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 3 }}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#6c757d' }}>Call ID</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{d._id}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#6c757d' }}>Region</Typography>
                                    <Typography variant="body2">{d.region || '-'}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: '#6c757d' }}>Duration</Typography>
                                    <Typography variant="body2">{d.callLog?.duration ? `${d.callLog.duration}s` : '—'}</Typography>
                                  </Box>
                                  <Box sx={{ ml: 'auto' }}>
                                    {d.callLog?.status === 'missed' ? (
                                      <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>No recording available</Typography>
                                    ) : (
                                      <RecordingPlayer recordingFilename={getRecordingFilename(d)} onDownload={() => handleDownloadRecording(d)} />
                                    )}
                                  </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                  <Button size="small" variant="outlined" onClick={(e)=>{e.stopPropagation(); toggleCallFlow(d._id)}} sx={{ textTransform: 'none' }}>Call Flow</Button>
                                  <Button size="small" variant="outlined" onClick={(e)=>{e.stopPropagation(); openDetails(d)}} sx={{ textTransform: 'none' }}>View Note</Button>
                                  <Button size="small" variant="outlined" onClick={(e)=>{e.stopPropagation(); toggleMoreInfo(d._id)}} sx={{ textTransform: 'none' }}>More Information</Button>
                                </Box>

                                {openCallFlows.has(d._id) && (
                                  <Box sx={{ 
                                    mt: 3, 
                                    p: 3, 
                                    backgroundColor: '#f9fafb',
                                    borderRadius: 2,
                                    border: '1px solid #e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                  }}>
                                    {d.callType?.toLowerCase() === 'inbound' ? (
                                      // INBOUND FLOW: Caller -> Virtual Number -> Agent
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: { xs: 1.5, sm: 2, md: 3 },
                                        justifyContent: 'center',
                                        flexWrap: 'wrap',
                                        maxWidth: '100%'
                                      }}>
                                        {/* Caller */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                                          <Box sx={{ 
                                            width: 64, 
                                            height: 64, 
                                            borderRadius: '50%', 
                                            backgroundColor: '#e0f2f1',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(19, 163, 127, 0.15)',
                                            border: '2px solid #13A37F'
                                          }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="#13A37F"/><path d="M 12 14 C 8 14 5 16.239 5 19 C 5 20.657 6.343 22 8 22 L 16 22 C 17.657 22 19 20.657 19 19 C 19 16.239 16 14 12 14 Z" fill="#13A37F"/></svg>
                                          </Box>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', display: 'block' }}>{d.contact}</Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', display: 'block' }}>Incoming Call</Typography>
                                          </Box>
                                        </Box>

                                        {/* Arrow 1 */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#13A37F' }}>
                                          <svg width="100" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h14" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 9l3 3-3 3" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </Box>

                                        {/* Telephone Icon 1 */}
                                        <Box sx={{ 
                                          width: 48, 
                                          height: 48, 
                                          borderRadius: '50%', 
                                          backgroundColor: '#e0f2f1',
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          border: '2px solid #13A37F'
                                        }}>
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#13A37F"/></svg>
                                        </Box>

                                        {/* Arrow 2 */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#13A37F' }}>
                                          <svg width="100" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h14" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 9l3 3-3 3" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </Box>

                                        {/* Telephone Icon 2 */}
                                        <Box sx={{ 
                                          width: 48, 
                                          height: 48, 
                                          borderRadius: '50%', 
                                          backgroundColor: '#e0f2f1',
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          border: '2px solid #13A37F'
                                        }}>
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#13A37F"/></svg>
                                        </Box>

                                        {/* Arrow 3 */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#13A37F' }}>
                                          <svg width="100" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h14" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 9l3 3-3 3" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </Box>

                                        {/* Agent or Status */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                                          <Box sx={{ 
                                            width: 64, 
                                            height: 64, 
                                            borderRadius: '50%', 
                                            backgroundColor: d.callLog?.status === 'answered' ? '#dbeafe' : '#fee2e2',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            boxShadow: d.callLog?.status === 'answered' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(239, 68, 68, 0.15)',
                                            border: d.callLog?.status === 'answered' ? '2px solid #3b82f6' : '2px solid #ef4444'
                                          }}>
                                            {d.callLog?.status === 'answered' ? (
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#3b82f6"/></svg>
                                            ) : (
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#ef4444" opacity="0.3"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                                            )}
                                          </Box>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', display: 'block' }}>
                                              {d.callLog?.status === 'answered' ? d.agent?.name || 'Agent' : 'Missed'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', display: 'block' }}>
                                              {d.callLog?.duration ? `${d.callLog?.duration}s` : d.callLog?.status || 'unknown'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                    ) : (
                                      // OUTBOUND FLOW: Agent -> Customer
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: { xs: 1.5, sm: 2, md: 3 },
                                        justifyContent: 'center',
                                        flexWrap: 'wrap',
                                        maxWidth: '100%'
                                      }}>
                                        {/* Agent */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                                          <Box sx={{ 
                                            width: 64, 
                                            height: 64, 
                                            borderRadius: '50%', 
                                            backgroundColor: '#dbeafe',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                            border: '2px solid #3b82f6'
                                          }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="#3b82f6"/><path d="M 12 14 C 8 14 5 16.239 5 19 C 5 20.657 6.343 22 8 22 L 16 22 C 17.657 22 19 20.657 19 19 C 19 16.239 16 14 12 14 Z" fill="#3b82f6"/><path d="M18 11c-.5 0-.9.2-1.2.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                          </Box>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', display: 'block' }}>{d.agent?.name || 'Agent'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', display: 'block' }}>Agent Dialer</Typography>
                                          </Box>
                                        </Box>

                                        {/* Arrow */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#13A37F' }}>
                                          <svg width="100" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h14" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 9l3 3-3 3" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </Box>

                                        {/* Telephone Icon */}
                                        <Box sx={{ 
                                          width: 48, 
                                          height: 48, 
                                          borderRadius: '50%', 
                                          backgroundColor: d.callLog?.status === 'answered' ? '#e0f2f1' : '#fee2e2',
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          border: d.callLog?.status === 'answered' ? '2px solid #13A37F' : '2px solid #ef4444'
                                        }}>
                                          {d.callLog?.status === 'answered' ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#13A37F"/></svg>
                                          ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#ef4444" opacity="0.3"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                                          )}
                                        </Box>

                                        {/* Arrow */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#13A37F' }}>
                                          <svg width="100" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h14" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 9l3 3-3 3" stroke="#13A37F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </Box>

                                        {/* Customer/Contact */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                                          <Box sx={{ 
                                            width: 64, 
                                            height: 64, 
                                            borderRadius: '50%', 
                                            backgroundColor: d.callLog?.status === 'answered' ? '#e0f2f1' : '#fee2e2',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            boxShadow: d.callLog?.status === 'answered' ? '0 4px 12px rgba(19, 163, 127, 0.15)' : '0 4px 12px rgba(239, 68, 68, 0.15)',
                                            border: d.callLog?.status === 'answered' ? '2px solid #13A37F' : '2px solid #ef4444'
                                          }}>
                                            {d.callLog?.status === 'answered' ? (
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#13A37F"/></svg>
                                            ) : (
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="#ef4444" opacity="0.3"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                                            )}
                                          </Box>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', display: 'block' }}>{d.contact}</Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', display: 'block' }}>
                                              {d.callLog?.duration ? `${d.callLog?.duration}s` : d.callLog?.status === 'answered' ? 'Answered' : d.callLog?.status || 'Ringing'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                )}

                                {openMoreInfo.has(d._id) && (
                                  <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Agent</Typography>
                                      <Typography variant="body2">{d.agent?.email || d.agent?.name || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Initiated By</Typography>
                                      <Typography variant="body2">{d.raw?.callInitiatedBy || d.callLog?.initiatedBy || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Received By</Typography>
                                      <Typography variant="body2">{d.raw?.callReceivedBy || d.callLog?.receivedBy || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Rejected By</Typography>
                                      <Typography variant="body2">{d.raw?.callRejectedBy || d.callLog?.rejectedBy || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Hang Up By</Typography>
                                      <Typography variant="body2">{d.raw?.hangUpBy || d.callLog?.hangUpBy || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Team</Typography>
                                      <Typography variant="body2">{d.team || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Cost</Typography>
                                      <Typography variant="body2">{d.cost != null ? `$${Number(d.cost).toFixed(2)}` : '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={8}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Notes</Typography>
                                      <Typography variant="body2">{d.note || d.callLog?.note || '-'}</Typography>
                                    </Grid>
                                  </Grid>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e5e7eb' }}>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  Page {page} of {totalPages} | Total Records: {totalRecords}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      const newPage = page - 1
                      setPage(newPage)
                      fetchRecords(newPage)
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={page >= totalPages || loading}
                    onClick={() => {
                      const newPage = page + 1
                      setPage(newPage)
                      fetchRecords(newPage)
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </Paper>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default CDR
