import React, { useState, useEffect, useRef } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CAlert,
  CBadge,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilSearch, 
  cilFilter, 
  cilMediaPlay,
  cilCloudDownload
} from '@coreui/icons'
import './CallLogs.css'
import { ENDPOINTS, apiCall, getBaseURL } from '../../config/api'

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([])
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [serverPaginated, setServerPaginated] = useState(false)
  const [audioFiles, setAudioFiles] = useState([])
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All Calls')
  const [businessId, setBusinessId] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [callTypeFilter, setCallTypeFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [recordingLoading, setRecordingLoading] = useState(false)
  const [recordingError, setRecordingError] = useState(null)
  const audioRef = useRef(null)
  const [recordingMimeType, setRecordingMimeType] = useState(null)
  const audioContextRef = useRef(null)
  const audioBufferRef = useRef(null)
  const audioSourceRef = useRef(null)
  const [audioCtxPlaying, setAudioCtxPlaying] = useState(false)
  const [recordingInfo, setRecordingInfo] = useState(null)
  const [downloadLoading, setDownloadLoading] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Get the business ID when component mounts
  useEffect(() => {
    const getBusinessId = async () => {
      try {
        // First try to get from user details API using centralized apiCall (relative endpoint)
        const response = await apiCall('/v1/user/details', 'GET');
        if (response?.user?.businessId) {
          setBusinessId(response.user.businessId);
          return;
        }
        // If not in user details, try localStorage
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          setBusinessId(storedBusinessId);
          return;
        }
        throw new Error('Business ID not found');
      } catch (err) {
        console.error('Failed to get business ID:', err)
        setError('Failed to get business ID. Please make sure you are properly logged in.')
      }
    }

    getBusinessId()
  }, [])

  // Build endpoint helper with applied filters
  const buildLogsEndpoint = (page = 1, limit = pageSize) => {
    let endpoint = `/call-logs/business/${businessId}?page=${page}&limit=${limit}`
    if (searchTerm) endpoint += `&search=${encodeURIComponent(searchTerm)}`
    if (dateFrom) endpoint += `&from=${encodeURIComponent(dateFrom)}`
    if (dateTo) endpoint += `&to=${encodeURIComponent(dateTo)}`

  // Normalize call type filter to backend values
    if (callTypeFilter && callTypeFilter !== 'All') {
      const ct = String(callTypeFilter)
      let mapped = ct.toLowerCase()
      if (ct === 'Outgoing') mapped = 'outbound'
      else if (ct === 'Incoming') mapped = 'inbound'
      endpoint += `&callType=${encodeURIComponent(mapped)}`
    }

    // Normalize active filter to backend parameters (status / callType)
    if (activeFilter && activeFilter !== 'All Calls') {
      if (activeFilter === 'Completed') endpoint += `&status=completed`
      else if (activeFilter === 'Failed') endpoint += `&status=failed`
      else if (activeFilter === 'Outgoing') endpoint += `&callType=outbound`
      else if (activeFilter === 'Incoming') endpoint += `&callType=inbound`
    }
    return endpoint
  }

  // Fetch call logs with server-side pagination
  useEffect(() => {
    const fetchCallLogs = async () => {
      if (!businessId) return;
      setLoading(true);
      setError(null);
      try {
        // Build endpoint from current filters
        const endpoint = buildLogsEndpoint(currentPage, pageSize)
        const res = await apiCall(endpoint, 'GET');

        // Normalize response shape. API may return:
        //  - { success: true, data: [...], pagination: { totalPages, totalRecords, page, limit } }
        //  - or a raw array [...]
        let logs = [];
        let pagination = null;
        if (Array.isArray(res)) {
          logs = res;
        } else if (res && Array.isArray(res.data)) {
          logs = res.data;
          pagination = res.pagination || null;
        } else if (res && Array.isArray(res.callLogs)) {
          // fallback key
          logs = res.callLogs;
          pagination = res.pagination || null;
        } else {
          // Unknown shape, try to be defensive
          logs = [];
          pagination = res?.pagination || null;
        }

        setCallLogs(logs);
        if (pagination) {
          setServerPaginated(true);
          setTotalPages(pagination.totalPages || Math.max(1, Math.ceil((pagination.totalRecords || logs.length) / pageSize)));
          setTotalRecords(pagination.totalRecords || logs.length);
        } else {
          // Server didn't paginate: compute from full array
          setServerPaginated(false);
          setTotalRecords(logs.length);
          setTotalPages(Math.max(1, Math.ceil(logs.length / pageSize)));
        }
      } catch (err) {
        setError(err.message === 'Business ID not found'
          ? 'Business ID not found. Please make sure you are properly logged in.'
          : 'Failed to fetch call logs. Please try again later.');
        setCallLogs([]);
        setTotalPages(1);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };
      fetchCallLogs();
    }, [businessId, currentPage, searchTerm, pageSize, dateFrom, dateTo, callTypeFilter, activeFilter]);

  // Fetch available audio recordings once businessId is known
  useEffect(() => {
    const fetchAudioFiles = async () => {
      if (!businessId) return;
      setAudioLoading(true)
      setAudioError(null)
      try {
        // Centralized apiCall will prefix /api
  const res = await apiCall('/v1/audio-recordings', 'GET')
        if (Array.isArray(res?.files)) {
          setAudioFiles(res.files)
        } else if (Array.isArray(res)) {
          setAudioFiles(res)
        } else {
          setAudioFiles([])
        }
      } catch (err) {
        console.error('Failed to fetch audio recordings', err)
        setAudioError('Failed to load audio recordings')
        setAudioFiles([])
      } finally {
        setAudioLoading(false)
      }
    }

    fetchAudioFiles()
  }, [businessId])

  // Format the call status from API data
  const formatCallStatus = (status) => {
    if (!status) return 'Unknown'
    
    // Format the status properly
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    return formattedStatus
  }
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (err) {
      return dateString
    }
  }

  // When server provides paginated results, the server is expected to apply filters.
  // Only apply client-side filtering when server did NOT paginate (we have the full list).
  const clientFilteredCallLogs = serverPaginated ? callLogs : callLogs.filter(log => {
    const callType = String(log.callType || '').toLowerCase();
    const status = String(log.status || '').toLowerCase();
    let matches = true;

    // activeFilter can be: All Calls, Completed, Failed, Outgoing, Incoming
    if (activeFilter && activeFilter !== 'All Calls') {
      if (activeFilter === 'Completed') {
        matches = status === 'completed' || status === 'success'
      } else if (activeFilter === 'Failed') {
        matches = status.includes('fail') || status.includes('error')
      } else if (activeFilter === 'Outgoing') {
        matches = callType === 'outbound' || callType === 'outgoing'
      } else if (activeFilter === 'Incoming') {
        matches = callType === 'inbound' || callType === 'incoming'
      }
    }

    // callTypeFilter UI select (All, Incoming, Outgoing)
    if (matches && callTypeFilter && callTypeFilter !== 'All') {
      const ctVal = callTypeFilter.toLowerCase()
      if (ctVal === 'outgoing') {
        matches = callType === 'outbound' || callType === 'outgoing'
      } else if (ctVal === 'incoming') {
        matches = callType === 'inbound' || callType === 'incoming'
      }
    }

    // dateFrom / dateTo client-side filtering when server didn't paginate
    if (matches && (dateFrom || dateTo)) {
      const t = log.callDate || log.createdAt
      if (t) {
        const callTs = new Date(t).setHours(0,0,0,0)
        if (dateFrom) {
          const fromTs = new Date(dateFrom).setHours(0,0,0,0)
          if (callTs < fromTs) matches = false
        }
        if (matches && dateTo) {
          const toTs = new Date(dateTo).setHours(0,0,0,0)
          if (callTs > toTs) matches = false
        }
      }
    }

    return matches
  })

  // Determine paginated list: if server returned paginated data use it as-is; otherwise slice client-side
  const paginatedCallLogs = serverPaginated
    ? clientFilteredCallLogs
    : clientFilteredCallLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handlePlayRecording = async (recordingUrl) => {
    if (!recordingUrl) {
      alert('No recording available for this call');
      return;
    }
    setRecordingError(null)
    setRecordingLoading(true)
    try {
      const token = localStorage.getItem('authToken') || '';
      // Normalize recording URL: if it's just a filename, build full download path
      let fetchUrl = recordingUrl
      try {
        const u = new URL(recordingUrl)
        fetchUrl = u.href
      } catch (e) {
        // not a full URL — build from filename
        if (!recordingUrl.startsWith('/')) {
          fetchUrl = `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(recordingUrl)}`
        }
      }

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      console.debug('Recording fetch response', { url: recordingUrl, ok: response.ok, status: response.status, headers: Array.from(response.headers.entries()) })

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch recording: ${response.status} ${text}`);
      }

      // Determine MIME type
      let contentType = response.headers.get('Content-Type') || ''
      if (!contentType || contentType === 'application/octet-stream') {
        contentType = recordingUrl.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'
      }

      // Use arrayBuffer to ensure we can set the correct type on the resulting blob
      const arrayBuffer = await response.arrayBuffer()
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio file received')
      }

      const blob = new Blob([arrayBuffer], { type: contentType })
      const blobUrl = URL.createObjectURL(blob)

      // Clean up previous blob if any
      if (audioBlobUrl) {
        try { URL.revokeObjectURL(audioBlobUrl) } catch (e) { /* ignore */ }
      }

  setAudioBlobUrl(blobUrl)
  setRecordingMimeType(contentType)
  setRecordingInfo({ status: response.status, contentType, size: blob.size })

      // Try to play via <audio>. If that fails, fallback to WebAudio API.
      setTimeout(async () => {
        try {
          if (audioRef.current) {
            // clear previous handlers
            audioRef.current.onerror = null
            // set src and try play
            audioRef.current.src = blobUrl
            audioRef.current.load()
            const playPromise = audioRef.current.play()
            if (playPromise && typeof playPromise.then === 'function') {
              playPromise.catch((err) => {
                console.warn('Autoplay prevented or playback failed on audio element, will try WebAudio fallback', err)
                // fallback: decode and play via AudioContext
                fallbackPlayViaWebAudio(arrayBuffer, contentType)
              })
            }
            // also listen for immediate decode errors
            audioRef.current.onerror = (ev) => {
              console.warn('Audio element error, attempting WebAudio fallback', ev)
              fallbackPlayViaWebAudio(arrayBuffer, contentType)
            }
          }
        } catch (e) {
          console.warn('Error attempting to play audio element, trying WebAudio fallback', e)
          try { fallbackPlayViaWebAudio(arrayBuffer, contentType) } catch(err) { console.warn(err) }
        }
      }, 50)
    } catch (err) {
      console.error('Failed to play recording', err);
      setRecordingError(err.message || 'Failed to play recording')
    } finally {
      setRecordingLoading(false)
    }
  };

  // WebAudio fallback: decode arrayBuffer and play using AudioContext
  const fallbackPlayViaWebAudio = async (arrayBuffer, contentType) => {
    try {
      // create audio context if not present
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        audioContextRef.current = new AudioCtx()
      }
      const ctx = audioContextRef.current

      // stop previous source if playing
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(0) } catch (e) {}
        audioSourceRef.current.disconnect()
        audioSourceRef.current = null
      }

      // decode audio data
      let decoded
      if (ctx.decodeAudioData.length === 1) {
        // modern browsers return a Promise
        decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
      } else {
        // older callback style
        decoded = await new Promise((resolve, reject) => {
          ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject)
        })
      }
      audioBufferRef.current = decoded

      // create buffer source
      const source = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(ctx.destination)
      audioSourceRef.current = source
      source.onended = () => {
        setAudioCtxPlaying(false)
      }
      source.start(0)
      setAudioCtxPlaying(true)
    } catch (err) {
      console.error('WebAudio fallback failed', err)
      setRecordingError('Playback failed (decoder error)')
    }
  }

  const stopWebAudio = () => {
    try {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(0) } catch(e){}
        audioSourceRef.current.disconnect()
        audioSourceRef.current = null
      }
      setAudioCtxPlaying(false)
    } catch (e) {
      console.warn('Error stopping WebAudio', e)
    }
  }

  const handleDownloadRecording = async (recordingUrl, fileName) => {
    // Use authenticated download endpoint to include Authorization header and stream the file
    const download = async (urlOrName, providedName) => {
      try {
        let filename = providedName || ''
        // If passed a full URL, extract filename from pathname
        try {
          const maybeUrl = new URL(urlOrName)
          const parts = maybeUrl.pathname.split('/')
          filename = filename || decodeURIComponent(parts.pop() || parts.pop())
        } catch (e) {
          // not a full URL, treat urlOrName as filename if filename still empty
          if (!filename) filename = urlOrName
        }

        if (!filename) {
          alert('No recording available for download')
          return
        }

        const token = localStorage.getItem('authToken') || ''
  const downloadUrl = `${getBaseURL()}/api/v1/audio-recordings/download/${encodeURIComponent(filename)}`

        const resp = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          throw new Error(`Download failed: ${resp.status} ${text}`)
        }

        const blob = await resp.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(blobUrl)
      } catch (err) {
        console.error('Download failed', err)
        alert('Download failed')
      }
    }
    // set download loading indicator for this filename
    const loadingKey = fileName || recordingUrl
    try {
      setDownloadLoading(loadingKey)
      await download(recordingUrl, fileName)
    } finally {
      setDownloadLoading(null)
    }
  }

  const formatDuration = (duration) => {
    if (!duration) return '00:00'
    
    const seconds = parseInt(duration)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Export all call logs as CSV (spreadsheet-friendly)
  const exportAllCallLogs = async () => {
    if (!businessId) {
      alert('Business ID not available yet. Please try again.')
      return
    }
    setExporting(true)
    try {
  // Try to request logs; handle both non-paginated and paginated responses
  const first = await apiCall(buildLogsEndpoint(1, 1000), 'GET')
      let logs = []
      let pagination = null
      if (Array.isArray(first)) {
        logs = first
      } else if (first && Array.isArray(first.data)) {
        logs = first.data
        pagination = first.pagination || null
      } else if (first && Array.isArray(first.callLogs)) {
        logs = first.callLogs
        pagination = first.pagination || null
      } else {
        logs = []
        pagination = first?.pagination || null
      }

      // If server returned pagination, fetch remaining pages
      if (pagination && pagination.totalPages && pagination.totalPages > 1) {
        const totalPages = pagination.totalPages
        const limit = pagination.limit || 1000
        const promises = []
        for (let p = 2; p <= totalPages; p++) {
          promises.push(apiCall(buildLogsEndpoint(p, limit), 'GET'))
        }
        const rest = await Promise.all(promises)
        rest.forEach(r => {
          if (Array.isArray(r)) logs = logs.concat(r)
          else if (r && Array.isArray(r.data)) logs = logs.concat(r.data)
          else if (r && Array.isArray(r.callLogs)) logs = logs.concat(r.callLogs)
        })
      }

      if (!logs || logs.length === 0) {
        alert('No call logs available to export')
        return
      }

      // Prepare CSV headers and rows
      const headers = [
        'S.NO', 'CALL TYPE', 'CALL DATE', 'CALL INITIATED BY', 'CALL RECEIVED BY', 'CALL REJECTED BY', 'TEAM', 'HANG UP BY', 'DURATION', 'COST', 'NOTES', 'STATUS', 'VIRTUAL NUMBER', 'CONTACT'
      ]

      const csvRows = []
      csvRows.push(headers.join(','))

      logs.forEach((log, idx) => {
        const callDate = formatDate(log.callDate || log.createdAt)
        const duration = formatDuration(log.callDuration || log.duration)
        const cost = log.cost != null ? Number(log.cost).toFixed(2) : ''
        const row = [
          idx + 1,
          csvEscape(log.callType || ''),
          csvEscape(callDate),
          csvEscape(log.callInitiatedBy || ''),
          csvEscape(log.callReceivedBy || ''),
          csvEscape(log.callRejectedBy || ''),
          csvEscape(log.team || ''),
          csvEscape(log.hangUpBy || ''),
          csvEscape(duration),
          csvEscape(cost),
          csvEscape(log.notes || ''),
          csvEscape(formatCallStatus(log.status)),
          csvEscape(log.virtualNumber || ''),
          csvEscape(log.contact || ''),
        ]
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const fname = `call-logs-${businessId}-${now.toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
      alert('Export failed. Check console for details.')
    } finally {
      setExporting(false)
    }
  }

  const csvEscape = (val) => {
    if (val == null) return ''
    const s = String(val)
    // Escape double quotes
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  return (
    <div className="call-logs-container">
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-4 align-items-center">
            <CCol md={6}>
              <h1 className="call-logs-title">Call Logs</h1>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CDropdown>
                <CDropdownToggle color="primary" variant="outline" className="filter-btn">
                  <CIcon icon={cilFilter} className="me-2" />
                  {activeFilter}
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('All Calls')} 
                    active={activeFilter === 'All Calls'}
                  >
                    All Calls {activeFilter === 'All Calls' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Completed')} 
                    active={activeFilter === 'Completed'}
                  >
                    Completed {activeFilter === 'Completed' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Outgoing')} 
                    active={activeFilter === 'Outgoing'}
                  >
                    Outgoing {activeFilter === 'Outgoing' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Incoming')} 
                    active={activeFilter === 'Incoming'}
                  >
                    Incoming {activeFilter === 'Incoming' && '✓'}
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => handleFilterChange('Failed')} 
                    active={activeFilter === 'Failed'}
                  >
                    Failed {activeFilter === 'Failed' && '✓'}
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCol>
          </CRow>
          <CRow className="mb-4">
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  placeholder="Search call logs..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <CButton type="button" color="primary" variant="outline">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CInputGroup>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <div className="d-flex align-items-center">
                <CButton color="info" className="me-2" onClick={() => exportAllCallLogs()} disabled={!businessId || exporting}>
                  {exporting ? (
                    <>
                      <CSpinner size="sm" className="me-2" /> Exporting...
                    </>
                  ) : (
                    <>Export All</>
                  )}
                </CButton>
                <CInputGroup style={{ maxWidth: 180 }}>
                <CFormInput
                  type="number"
                  min={5}
                  max={100}
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  placeholder="Rows per page"
                />
                <CButton type="button" color="secondary" variant="outline" disabled>
                  Rows/Page
                </CButton>
                </CInputGroup>
              </div>
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={12}>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <CFormSelect value={callTypeFilter} onChange={e => { setCallTypeFilter(e.target.value); setCurrentPage(1); }} style={{ width: 160 }}>
                  <option value="All">All Call Types</option>
                  <option value="Incoming">Incoming</option>
                  <option value="Outgoing">Outgoing</option>
                </CFormSelect>
                <CFormInput type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }} style={{ width: 180 }} />
                <CFormInput type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }} style={{ width: 180 }} />
                <CButton color="light" onClick={() => { setDateFrom(''); setDateTo(''); setCallTypeFilter('All'); setSearchTerm(''); setActiveFilter('All Calls'); setCurrentPage(1); }}>
                  Clear Filters
                </CButton>
              </div>
            </CCol>
          </CRow>
          <CTable hover responsive className="call-logs-table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>S.NO</CTableHeaderCell>
                <CTableHeaderCell>CALL TYPE</CTableHeaderCell>
                <CTableHeaderCell>CALL DATE</CTableHeaderCell>
                <CTableHeaderCell>CALL INITIATED BY</CTableHeaderCell>
                <CTableHeaderCell>CALL RECEIVED BY</CTableHeaderCell>
                <CTableHeaderCell>CALL REJECTED BY</CTableHeaderCell>
                <CTableHeaderCell>TEAM</CTableHeaderCell>
                <CTableHeaderCell>HANG UP BY</CTableHeaderCell>
                <CTableHeaderCell>DURATION</CTableHeaderCell>
                <CTableHeaderCell>COST</CTableHeaderCell>
                <CTableHeaderCell>NOTES</CTableHeaderCell>
                <CTableHeaderCell>STATUS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan="12" className="text-center py-5">
                    <CSpinner color="primary" />
                    <div className="mt-3">Loading call logs...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : error ? (
                <CTableRow>
                  <CTableDataCell colSpan="12" className="text-center py-5">
                    <CAlert color="danger" className="mb-0">
                      {error}
                    </CAlert>
                  </CTableDataCell>
                </CTableRow>
              ) : clientFilteredCallLogs.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="12" className="text-center py-5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CIcon icon={cilSearch} size="xl" />
                      </div>
                      <h4>No call logs found</h4>
                      <p>There are no call logs available matching your search criteria.</p>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedCallLogs.map((log, index) => {
                  const callType = log.callType || 'Unknown';
                  const callDate = formatDate(log.callDate || log.createdAt);
                  const status = formatCallStatus(log.status);
                  return (
                    <CTableRow 
                      key={log._id} 
                      onClick={() => {
                        setSelectedLog(log);
                        setShowModal(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <CTableDataCell>
                        <span className="log-number">{(currentPage - 1) * pageSize + index + 1}</span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="log-type text-capitalize">{callType}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="log-date">{callDate}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{log.callInitiatedBy || 'Unknown'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{log.callReceivedBy || 'N/A'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{log.callRejectedBy || 'N/A'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{log.team || 'N/A'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{log.hangUpBy || 'Unknown'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{formatDuration(log.callDuration || log.duration)}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>${log.cost ? log.cost.toFixed(2) : 'N/A'}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="text-truncate" style={{maxWidth: '200px'}} title={log.notes || 'No notes available'}>
                          {log.notes || 'No notes available'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={status.toLowerCase() === 'success' || status.toLowerCase() === 'completed' ? 'success'
                            : status.toLowerCase().includes('fail') ? 'danger'
                            : status.toLowerCase() === 'missed' ? 'warning' : 'secondary'}
                          className="status-badge"
                        >
                          {status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  );
                })
              )}
            </CTableBody>
          </CTable>
          {totalPages > 1 && (
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              <CPagination aria-label="Page navigation" className="justify-content-center mt-4" style={{ display: 'inline-flex', flexWrap: 'nowrap' }}>
                <CPaginationItem
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </CPaginationItem>
                {/* Compact pagination: max 5 page buttons */}
                {(() => {
                  const pages = [];
                  const showFirst = 1;
                  const showLast = totalPages;
                  // Always show first page
                  pages.push(
                    <CPaginationItem key={showFirst} active={currentPage === showFirst} onClick={() => setCurrentPage(showFirst)}>
                      {showFirst}
                    </CPaginationItem>
                  );
                  // Show ellipsis if needed
                  if (currentPage > 3) {
                    pages.push(<CPaginationItem key="start-ellipsis" disabled>...</CPaginationItem>);
                  }
                  // Show previous page if not near start
                  if (currentPage > 2 && currentPage !== showLast) {
                    pages.push(
                      <CPaginationItem key={currentPage - 1} onClick={() => setCurrentPage(currentPage - 1)}>
                        {currentPage - 1}
                      </CPaginationItem>
                    );
                  }
                  // Show current page (if not first/last)
                  if (currentPage !== showFirst && currentPage !== showLast) {
                    pages.push(
                      <CPaginationItem key={currentPage} active onClick={() => setCurrentPage(currentPage)}>
                        {currentPage}
                      </CPaginationItem>
                    );
                  }
                  // Show next page if not near end
                  if (currentPage < showLast - 1 && currentPage !== showFirst) {
                    pages.push(
                      <CPaginationItem key={currentPage + 1} onClick={() => setCurrentPage(currentPage + 1)}>
                        {currentPage + 1}
                      </CPaginationItem>
                    );
                  }
                  // Show ellipsis if needed
                  if (currentPage < showLast - 2) {
                    pages.push(<CPaginationItem key="end-ellipsis" disabled>...</CPaginationItem>);
                  }
                  // Always show last page (if not already shown)
                  if (showLast !== showFirst) {
                    pages.push(
                      <CPaginationItem key={showLast} active={currentPage === showLast} onClick={() => setCurrentPage(showLast)}>
                        {showLast}
                      </CPaginationItem>
                    );
                  }
                  return pages;
                })()}
                <CPaginationItem
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Recording Modal */}
      <CModal visible={showModal} onClose={() => {
        setShowModal(false);
        if (audioBlobUrl) { try { URL.revokeObjectURL(audioBlobUrl); } catch(e){}; setAudioBlobUrl(null); }
        setRecordingMimeType(null);
        setRecordingError(null);
        setRecordingLoading(false);
        setRecordingInfo(null);
        try { stopWebAudio() } catch(e){}
        try { if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null } } catch(e){}
      }} size="lg">
        <CModalHeader>
          <h5>Call Recording - {selectedLog ? formatDate(selectedLog.callDate || selectedLog.createdAt) : ''}</h5>
        </CModalHeader>
        <CModalBody>
          {selectedLog && (
            <div>
              <div className="mb-3">
                <strong>Call Details:</strong>
                <p>Type: {selectedLog.callType || 'Unknown'}</p>
                <p>Initiated By: {selectedLog.callInitiatedBy || 'Unknown'}</p>
                <p>Received By: {selectedLog.callReceivedBy || 'N/A'}</p>
                <p>Duration: {formatDuration(selectedLog.callDuration || selectedLog.duration)}</p>
                <p>Status: {formatCallStatus(selectedLog.status)}</p>
              </div>
              
              <div className="mb-3">
                <strong>Recording Options:</strong>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {selectedLog.callRecording ? (
                    <>
                      <CButton
                        color="primary"
                        onClick={() => handlePlayRecording(selectedLog.callRecording)}
                      >
                        <CIcon icon={cilMediaPlay} className="me-2" />
                        Play Recording
                      </CButton>
                      <CButton
                        color="success"
                        onClick={() => handleDownloadRecording(
                          selectedLog.callRecording,
                          `call-recording-${selectedLog._id}.mp3`
                        )}
                        disabled={downloadLoading !== null}
                      >
                        {downloadLoading === `call-recording-${selectedLog._id}.mp3` ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilCloudDownload} className="me-2" />
                            Download Recording
                          </>
                        )}
                      </CButton>
                    </>
                  ) : (
                    // ...existing code for alternate recordings...
                    (() => {
                      const vn = String(selectedLog.virtualNumber || '').replace(/[^0-9]/g, '')
                      const contactNum = String(selectedLog.contact || '').replace(/[^0-9]/g, '')
                      if ((!vn || !contactNum) || audioFiles.length === 0) return <p className="text-muted">No recording available for this call.</p>

                      const makeVariants = (s) => {
                        const v = []
                        if (!s) return v
                        v.push(s)
                        if (s.length > 10) v.push(s.slice(-10))
                        if (s.length > 8) v.push(s.slice(-8))
                        if (s.length > 6) v.push(s.slice(-6))
                        return v
                      }

                      const vnVariants = makeVariants(vn)
                      const contactVariants = makeVariants(contactNum)

                      const strictMatches = audioFiles.filter(f => {
                        return vnVariants.some(v => v && f.includes(v)) && contactVariants.some(c => c && f.includes(c))
                      })

                      if (strictMatches.length === 0) return <p className="text-muted">No recording available for this call.</p>

                      const seen = new Set()
                      const dedup = strictMatches.filter(fname => {
                        if (seen.has(fname)) return false
                        seen.add(fname)
                        return true
                      })

                      return (
                        <div>
                          <p className="mb-2">Available recordings:</p>
                          <div className="d-flex flex-column gap-2">
                            {dedup.map((fname, i) => {
                              const fileUrl = `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(fname)}`;
                              return (
                                <div key={i} className="d-flex align-items-center gap-2 p-2 border rounded">
                                  <span className="flex-grow-1 text-truncate" title={fname}>{fname}</span>
                                  <CButton
                                    size="sm"
                                    color="primary"
                                    variant="outline"
                                    onClick={() => handlePlayRecording(fileUrl)}
                                  >
                                    <CIcon icon={cilMediaPlay} size="sm" />
                                  </CButton>
                                  <CButton
                                    size="sm"
                                    color="success"
                                    variant="outline"
                                    onClick={() => handleDownloadRecording(fileUrl, fname)}
                                    disabled={downloadLoading !== null}
                                  >
                                    {downloadLoading === fname ? (
                                      <>
                                        <CSpinner size="sm" className="me-1" />
                                        DL
                                      </>
                                    ) : (
                                      <CIcon icon={cilCloudDownload} size="sm" />
                                    )}
                                  </CButton>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
                {recordingLoading && (
                  <div className="mt-3">Loading recording...</div>
                )}
                {recordingError && (
                  <div className="mt-3 text-danger">{recordingError}</div>
                )}
                  {recordingInfo && (
                    <div className="mt-2 small text-muted">
                      Response: {recordingInfo.status} • Type: {recordingInfo.contentType} • Size: {Math.round((recordingInfo.size||0)/1024)} KB
                    </div>
                  )}
                {audioBlobUrl && (
                  <div className="mt-3">
                    <div className="d-flex gap-2 mb-2">
                      <CButton size="sm" color="info" variant="outline" onClick={() => window.open(audioBlobUrl, '_blank')}>Open in new tab</CButton>
                      <CButton size="sm" color="secondary" variant="outline" onClick={() => {
                        const a = document.createElement('a')
                        a.href = audioBlobUrl
                        a.download = `recording.${(recordingMimeType && recordingMimeType.includes('wav')) ? 'wav' : 'mp3'}`
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                      }}>Download (debug)</CButton>
                      {audioCtxPlaying ? (
                        <CButton size="sm" color="danger" variant="outline" onClick={() => stopWebAudio()}>Stop WebAudio</CButton>
                      ) : null}
                    </div>
                    <audio controls ref={audioRef} autoPlay style={{ width: '100%' }}>
                      <source src={audioBlobUrl} type={recordingMimeType || 'audio/mpeg'} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => {
            setShowModal(false);
            if (audioBlobUrl) { try { URL.revokeObjectURL(audioBlobUrl); } catch(e){}; setAudioBlobUrl(null); }
            setRecordingMimeType(null);
            setRecordingError(null);
            setRecordingLoading(false);
            setRecordingInfo(null);
            try { stopWebAudio() } catch(e){}
            try { if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null } } catch(e){}
          }}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default CallLogs