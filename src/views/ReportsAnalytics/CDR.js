import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormCheck,
  CFormSelect,
} from '@coreui/react'
import { apiCall, getBaseURL } from '../../config/api'
import '../Branches/Branches.css'
import './CDR.css'

const CallLogsLegacy = () => {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

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
        if (res.pagination && res.pagination.page) try { setPage(res.pagination.page) } catch (e) {}
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
        <div className="audio-player d-flex align-items-center gap-2">
          <span className="text-muted">
            <CSpinner size="sm" className="me-2" /> Loading recording...
          </span>
        </div>
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
    setFromNumber(''); setToNumber(''); setAgentFilter(''); setStartDateFilter(''); setEndDateFilter(''); fetchRecords(1)
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
    <CCard className="mb-4">
      <CCardHeader style={{ borderBottom: '0' }}>
        <div className="filter-tiles">
          <div className="filter-tile">
            <label className="form-label">From</label>
            <input className="form-control form-control-sm" placeholder="From number" value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">To</label>
            <input className="form-control form-control-sm" placeholder="To number" value={toNumber} onChange={(e) => setToNumber(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">Agent / Branch</label>
            <CFormSelect className="form-control form-control-sm" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
              <option value="">All agents</option>
              {availableAgents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </CFormSelect>
          </div>
          <div className="filter-tile">
            <label className="form-label">From Date</label>
            <input type="date" className="form-control form-control-sm" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">To Date</label>
            <input type="date" className="form-control form-control-sm" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-sm btn-outline-secondary me-3" onClick={resetFilters} disabled={loading}>Reset</button>
          <button className="btn btn-sm btn-outline-primary me-2" onClick={applyFilters} disabled={loading}>Search</button>
          <button className="btn btn-sm btn-outline-success me-2" onClick={() => exportAllCDR()} disabled={loading || exporting}>{exporting ? 'Exporting...' : 'Export'}</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowColumnsModal(true)}>Columns</button>
        </div>
      </CCardHeader>

      <CCardBody>
        {!businessId && (
          <div className="mb-3">
            <CAlert color="warning">Missing <code>businessId</code> in localStorage. Set it to view CDRs.</CAlert>
          </div>
        )}

        <CModal visible={detailsOpen} onClose={closeDetails} alignment="center">
          <CModalHeader>
            <CModalTitle>CDR Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {!selectedItem ? (<div>No item selected</div>) : (
              <div>
                <div className="mb-3"><strong>Agent:</strong> {selectedItem.agent?.email || selectedItem.agent?.name || '-'}</div>
                <div className="mb-2"><strong>Contact:</strong> {selectedItem.callLog?.contact || '-'}</div>
                <div className="mb-2"><strong>Virtual Number:</strong> {selectedItem.callLog?.virtualNumber || '-'}</div>
                <div className="mb-2"><strong>Call Date:</strong> {formatDateTime(selectedItem.callLog?.callDate)}</div>
                <div className="mb-2"><strong>Duration:</strong> {selectedItem.callLog?.duration ? `${selectedItem.callLog.duration}s` : '-'}</div>
                <hr />
                <div className="mb-2"><strong>Note:</strong> {selectedItem.note || '-'}</div>
                <div className="mb-2"><strong>Call Status:</strong> <CBadge color={selectedItem.callLog?.status === 'answered' ? 'success' : selectedItem.callLog?.status === 'missed' ? 'danger' : 'secondary'}>{selectedItem.callLog?.status || '-'}</CBadge></div>
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={closeDetails}>Close</CButton>
          </CModalFooter>
        </CModal>

        {loading ? (
          <div className="text-center py-4"><CSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-3">No call logs found</div>
        ) : (
          <CTable hover responsive className="table-sm compact-table cdr-table" style={{ tableLayout: 'auto', borderTop: '0' }}>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '45%' }}>TO</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>DATE</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>TIME</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>TYPE</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '19%' }}>RESULTS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.map((d) => {
                const callDate = d.callLog?.callDate || d.callDate
                const dt = callDate ? new Date(callDate) : null
                const dateOnly = dt ? dt.toLocaleDateString() : '-'
                const timeOnly = dt ? dt.toLocaleTimeString() : '-'
                const resultText = d.note || d.callLog?.status || d.status || '—'

                // Determine call direction (inbound = customer -> agent)
                // Support various CDR shapes: prefer explicit `callType`, then check initiator fields
                const rawFrom = d.raw?.fromNumber || d.raw?.callInitiatedBy || d.raw?.callerNumber || '';
                const rawTo = d.raw?.toNumber || d.raw?.callReceivedBy || d.raw?.calleeNumber || '';
                const contact = d.callLog?.contact || d.contact || d.callInitiatedBy || '';
                let isInbound = false;

                // 1) explicit callType field
                if (d.callType && String(d.callType).toLowerCase() === 'inbound') {
                  isInbound = true
                } else if (d.raw?.callType && String(d.raw.callType).toLowerCase() === 'inbound') {
                  isInbound = true
                // 2) callInitiatedBy equals contact (customer initiated)
                } else if (d.callInitiatedBy && contact && String(d.callInitiatedBy) === String(contact)) {
                  isInbound = true
                // 3) fallback to raw from/to matching contact
                } else if (rawFrom && contact && String(rawFrom) === String(contact)) {
                  isInbound = true
                } else if (rawTo && contact && String(rawTo) === String(contact)) {
                  isInbound = false
                // 4) directional flags in raw
                } else if (d.raw && d.raw.direction) {
                  const dir = String(d.raw.direction).toLowerCase();
                  if (dir.includes('in')) isInbound = true;
                  else if (dir.includes('out')) isInbound = false;
                // 5) name heuristics
                } else if (d.agent && d.raw && (d.raw.fromName || d.raw.toName) && d.agent.name) {
                  const an = String(d.agent.name).toLowerCase();
                  if (d.raw.fromName && String(d.raw.fromName).toLowerCase().includes(an)) isInbound = false;
                  else if (d.raw.toName && String(d.raw.toName).toLowerCase().includes(an)) isInbound = true;
                }

                // Prepare left/right display based on detected direction
                // inbound: customer(from) -> agent(to)
                // outbound: agent(from) -> customer(to)
                const fromTimeDefault = formatDateTimeShort(d.raw?.fromAt || d.callLog?.callDate || d.callDate);
                const toTimeDefault = formatDateTimeShort(d.raw?.toAt || d.callLog?.callDate || d.callDate);

                let leftTitle, leftSub, leftTime, rightTitle, rightSub, rightTime;

                if (isInbound) {
                  // customer (from) -> agent (to)
                  leftTitle = d.raw?.fromName || d.callLog?.contact || 'Caller';
                  leftSub = d.raw?.fromNumber || d.callLog?.contact || '';
                  leftTime = fromTimeDefault;

                  rightTitle = d.agent?.name || d.raw?.toName || d.callLog?.virtualNumber || 'Agent';
                  rightSub = d.raw?.toNumber || d.callLog?.virtualNumber || d.virtualNumber || '';
                  rightTime = toTimeDefault;
                } else {
                  // agent (from) -> customer (to)
                  leftTitle = d.agent?.name || d.raw?.fromName || d.callLog?.virtualNumber || 'Agent';
                  leftSub = d.raw?.fromNumber || d.callLog?.virtualNumber || d.callLog?.contact || '';
                  leftTime = fromTimeDefault;

                  rightTitle = d.raw?.toName || d.callLog?.contact || d.raw?.toNumber || 'Customer';
                  rightSub = d.raw?.toNumber || d.callLog?.contact || '';
                  rightTime = toTimeDefault;
                }

                // Edge case: if both sides resolve to the same agent name (transfer/internal), prefer showing the actual customer where possible
                if (d.agent && String(leftTitle).toLowerCase() === String(rightTitle).toLowerCase()) {
                  if (d.callLog?.contact) {
                    if (!isInbound) {
                      rightTitle = d.callLog.contact;
                      rightSub = d.raw?.toNumber || d.callLog.contact || rightSub;
                    } else {
                      leftTitle = d.callLog.contact;
                      leftSub = d.raw?.fromNumber || d.callLog.contact || leftSub;
                    }
                  }
                }
                return (
                  <React.Fragment key={d._id}>
                    <CTableRow onClick={() => toggleRow(d._id)} style={{ cursor: 'pointer', backgroundColor: expandedRows.has(d._id) ? '#f8f9fa' : 'transparent' }} role="button" tabIndex={0} className="cdr-row">
                      <CTableDataCell className="align-middle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 600 }}>{d.callLog?.contact || d.contact || 'Unknown'}</div>
                            <div className="text-muted small"><span className="me-2">{d.callLog?.virtualNumber || d.virtualNumber || ''}</span></div>
                          </div>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="align-middle">{dateOnly}</CTableDataCell>
                      <CTableDataCell className="align-middle">{timeOnly}</CTableDataCell>
                      <CTableDataCell className="align-middle" style={{ width: '12%' }}>
                        <CBadge color={isInbound ? 'info' : 'warning'}>{isInbound ? 'Inbound' : 'Outbound'}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="align-middle">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>{resultText}</div>
                          <div><CBadge color={d.callLog?.status === 'answered' ? 'success' : d.callLog?.status === 'missed' ? 'danger' : 'secondary'}>{d.callLog?.status || ''}</CBadge></div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                    {expandedRows.has(d._id) && (
                      <CTableRow>
                        <CTableDataCell colSpan={4} style={{ padding: '1rem', backgroundColor: '#fff' }}>
                          <div className="cdr-expanded">
                            <div className="cdr-meta d-flex align-items-center mb-3">
                              <div className="me-4"><div className="text-muted small">Call ID</div><div className="fw-bold">{d._id}</div></div>
                              <div className="me-4"><div className="text-muted small">Region</div><div>{d.region || '-'}</div></div>
                              <div className="me-4"><div className="text-muted small">Duration</div><div>{d.callLog?.duration ? `${d.callLog.duration}s` : '—'}</div></div>
                              <div style={{ marginLeft: 'auto' }}>
                                <RecordingPlayer recordingFilename={getRecordingFilename(d)} onDownload={() => handleDownloadRecording(d)} />
                              </div>
                            </div>

                            <div className="cdr-actions mb-3">
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); toggleCallFlow(d._id)}} aria-pressed={openCallFlows.has(d._id)}>Call Flow</button>
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); openDetails(d)}}>View Note</button>
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); toggleMoreInfo(d._id)}} aria-pressed={openMoreInfo.has(d._id)}>More Information</button>
                            </div>

                            {openCallFlows.has(d._id) && (
                            <div className="cdr-callflow">
                              <div className="flow-step">
                                <div className="flow-icon caller"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#13A37F"/><path d="M9 8c1.66 0 3 1.34 3 3 0 .35-.07.68-.18.98L12.9 13c1.17.7 2.2 1.73 2.9 2.9l1.02-.72c.3-.11.63-.18.98-.18 1.66 0 3 1.34 3 3V19c0-.55-.45-1-1-1h-1c-4.97 0-9-4.03-9-9V8z" fill="#fff"/></svg></div>
                                <div className="flow-meta"><div className="flow-title">{leftTitle}</div><div className="flow-sub">{leftSub}</div><div className="flow-time">{leftTime}</div></div>
                              </div>

                              <div className="flow-connector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="36" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 12h12" stroke="#0b7a5f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 6l6 6-6 6" stroke="#0b7a5f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>

                              <div className="flow-step center-step" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                  <div className="flow-icon mid" style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 26, background: '#e9f6f0' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 8c1.66 0 3 1.34 3 3 0 .35-.07.68-.18.98L12.9 13c1.17.7 2.2 1.73 2.9 2.9l1.02-.72c.3-.11.63-.18.98-.18 1.66 0 3 1.34 3 3V19c0-.55-.45-1-1-1h-1c-4.97 0-9-4.03-9-9V8z" fill="#13A37F"/><path d="M7.6 5.6c-.4-.4-1.04-.4-1.44 0L4.6 7.16c-.4.4-.4 1.04 0 1.44l1.9 1.9c.4.4 1.04.4 1.44 0l1.06-1.06c.4-.4.4-1.04 0-1.44L7.6 5.6z" fill="#fff"/></svg>
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0b5240' }}>-Dailed</div>
                                </div>
                              </div>

                              <div className="flow-connector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="36" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 12h12" stroke="#0b7a5f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 6l6 6-6 6" stroke="#0b7a5f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>

                              <div className="flow-step">
                                <div className="flow-icon last"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#13A37F"/><path d="M16.5 11c-.9 0-1.73.2-2.49.57-.21.11-.34.34-.34.58v3.08c0 .24.13.47.34.58C14.77 16.8 15.6 17 16.5 17c1.38 0 2.5-1.12 2.5-2.5S17.88 11 16.5 11z" fill="#fff"/></svg></div>
                                <div className="flow-meta"><div className="flow-title">{rightTitle}</div><div className="flow-sub">{rightSub}</div><div className="flow-time">{rightTime}</div></div>
                              </div>

                            </div>
                            )}

                            {openMoreInfo.has(d._id) && (
                              <div className="cdr-moreinfo mt-3">
                                <div className="row">
                                  <div className="col-md-4"><strong>Agent</strong><div>{d.agent?.email || d.agent?.name || '-'}</div></div>
                                  <div className="col-md-4"><strong>Initiated By</strong><div>{d.raw?.callInitiatedBy || d.callLog?.initiatedBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Received By</strong><div>{d.raw?.callReceivedBy || d.callLog?.receivedBy || '-'}</div></div>
                                </div>
                                <div className="row mt-2">
                                  <div className="col-md-4"><strong>Rejected By</strong><div>{d.raw?.callRejectedBy || d.callLog?.rejectedBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Hang Up By</strong><div>{d.raw?.hangUpBy || d.callLog?.hangUpBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Team</strong><div>{d.team || '-'}</div></div>
                                </div>
                                <div className="row mt-2">
                                  <div className="col-md-4"><strong>Cost</strong><div>{d.cost != null ? `$${Number(d.cost).toFixed(2)}` : '-'}</div></div>
                                  <div className="col-md-8"><strong>Notes</strong><div>{d.note || d.callLog?.note || '-'}</div></div>
                                </div>
                              </div>
                            )}

                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </CTableBody>
          </CTable>
        )}
        {/* Columns Modal */}
        <CModal visible={showColumnsModal} onClose={() => setShowColumnsModal(false)} size="xl">
          <CModalHeader>
            <CModalTitle>Customize Columns</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div><strong>Preview (first 3 rows):</strong></div>
            <div style={{overflowX:'auto', marginTop:8}}>
              <table className="table table-sm">
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
            </div>

            <div className="mt-3 d-flex flex-column" style={{gap:8}}>
              {columnsList.map(c => (
                <CFormCheck key={c.key} label={c.label} checked={selectedColumns.indexOf(c.key) !== -1} onChange={(e)=>{
                  if (e.target.checked) setSelectedColumns(s => Array.from(new Set([...(s||[]), c.key])))
                  else setSelectedColumns(s => (s||[]).filter(x=>x!==c.key))
                }} />
              ))}
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="light" onClick={() => setSelectedColumns(columnsList.map(c=>c.key))}>Select All</CButton>
            <CButton color="light" onClick={() => setSelectedColumns([])}>Clear All</CButton>
            <CButton color="primary" onClick={() => { try { localStorage.setItem('cdrSelectedColumns', JSON.stringify(selectedColumns||[])) } catch(e){}; setShowColumnsModal(false) }}>Apply</CButton>
            <CButton color="secondary" onClick={() => setShowColumnsModal(false)}>Close</CButton>
          </CModalFooter>
        </CModal>
      </CCardBody>
    </CCard>
  )
}

export default CallLogsLegacy
