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
  cilMediaStop,
  cilCloudDownload,
  cilDescription,
  cilCalendar,
  cilReload,
  cilOptions,
  cilCheckCircle,
  cilPhone,
  cilXCircle
} from '@coreui/icons'
import './CallLogs.css'
import '../Branches/Branches.css'
import { ENDPOINTS, apiCall, getBaseURL } from '../../config/api'

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([])
  // Fixed page size: show 10 records per page only
  const [pageSize, setPageSize] = useState(10)
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
  const [showModal, setShowModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notesContent, setNotesContent] = useState('')
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [recordingLoading, setRecordingLoading] = useState(false)
  const [recordingError, setRecordingError] = useState(null)
  const [playingUrl, setPlayingUrl] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)
  const [recordingMimeType, setRecordingMimeType] = useState(null)
  const audioContextRef = useRef(null)
  const audioBufferRef = useRef(null)
  const audioSourceRef = useRef(null)
  const tempAudioRef = useRef(null)
  const [audioCtxPlaying, setAudioCtxPlaying] = useState(false)
  const [recordingInfo, setRecordingInfo] = useState(null)
  const [downloadLoadingMap, setDownloadLoadingMap] = useState({})
  const [exporting, setExporting] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDateModal, setShowDateModal] = useState(false)
  const [selectedFromDate, setSelectedFromDate] = useState(null)
  const [selectedToDate, setSelectedToDate] = useState(null)
  const [selectedFromTime, setSelectedFromTime] = useState('00:00')
  const [selectedToTime, setSelectedToTime] = useState('23:59')
  const [baseLeftDate, setBaseLeftDate] = useState(null)
  const [baseRightDate, setBaseRightDate] = useState(null)

  const openDateModal = () => {
    // initialize selected dates/times from current filters or sensible defaults
    const now = new Date()
    if (dateFrom) {
      const fromTs = parseLocalDate(dateFrom, false)
      if (fromTs !== null) setSelectedFromDate(new Date(fromTs))
      else setSelectedFromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    } else {
      setSelectedFromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    }

    if (dateTo) {
      const toTs = parseLocalDate(dateTo, true)
      if (toTs !== null) {
        const dt = new Date(toTs)
        setSelectedToDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))
      } else setSelectedToDate(now)
    } else {
      setSelectedToDate(now)
    }

    // initialize times
    if (dateFrom) {
      const parts = String(dateFrom).split('T')[1]
      // keep HH:MM if present else 00:00
      setSelectedFromTime(parts ? parts.slice(0,5) : '00:00')
    } else setSelectedFromTime('00:00')

    if (dateTo) {
      const parts = String(dateTo).split('T')[1]
      setSelectedToTime(parts ? parts.slice(0,5) : `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    } else setSelectedToTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)

    setShowDateModal(true)
  }
  const [callStats, setCallStats] = useState(null)
  const lastDateFilterKeyRef = useRef('')

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
    // Send unambiguous ISO timestamps to the backend to avoid UTC/local-date mixups.
    if (dateFrom) {
      try {
        const parts = String(dateFrom).split('-')
        if (parts.length === 3) {
          const y = Number(parts[0])
          const m = Number(parts[1]) - 1
          const d = Number(parts[2])
          const fromIso = new Date(y, m, d)
          fromIso.setHours(0, 0, 0, 0)
          endpoint += `&from=${encodeURIComponent(fromIso.toISOString())}`
        } else {
          endpoint += `&from=${encodeURIComponent(dateFrom)}`
        }
      } catch (e) {
        endpoint += `&from=${encodeURIComponent(dateFrom)}`
      }
    }
    if (dateTo) {
      try {
        const parts = String(dateTo).split('-')
        if (parts.length === 3) {
          const y = Number(parts[0])
          const m = Number(parts[1]) - 1
          const d = Number(parts[2])
          const toIso = new Date(y, m, d)
          toIso.setHours(23, 59, 59, 999)
          endpoint += `&to=${encodeURIComponent(toIso.toISOString())}`
        } else {
          endpoint += `&to=${encodeURIComponent(dateTo)}`
        }
      } catch (e) {
        endpoint += `&to=${encodeURIComponent(dateTo)}`
      }
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
        // If user has active date filters, request a larger page size and fetch page 1
        // so we can perform client-side pagination. This is a fallback for backends
        // that return incorrect pagination totals when filters are applied.
        const requestingAllFiltered = Boolean(dateFrom || dateTo)
        const requestLimit = requestingAllFiltered ? 1000 : pageSize
        const requestPage = requestingAllFiltered ? 1 : currentPage
        const endpoint = buildLogsEndpoint(requestPage, requestLimit)

        // Build a simple key for the current date filters so we can cache the
        // filtered dataset and avoid refetching when the user only changes page.
        const dateFilterKey = `${dateFrom || ''}|${dateTo || ''}|${businessId || ''}`

        let res = null
        let logs = []
        let pagination = null

        if (requestingAllFiltered && lastDateFilterKeyRef.current === dateFilterKey && callLogs && callLogs.length > 0) {
          // Use cached callLogs already stored in state; avoid network roundtrip.
          console.debug('Using cached filtered call logs for', dateFilterKey)
          logs = callLogs
        } else {
          // Log the endpoint for debugging (inspect in browser console/network tab)
          console.debug('Fetching call logs from endpoint:', endpoint)
          res = await apiCall(endpoint, 'GET');

          // Normalize response shape. API may return:
        //  - { success: true, data: [...], pagination: { totalPages, totalRecords, page, limit } }
        //  - or a raw array [...]
          if (Array.isArray(res)) {
            logs = res;
          } else if (res && Array.isArray(res.data)) {
            logs = res.data;
            pagination = res.pagination || null;
            // store server statistics if provided
            setCallStats(res.statistics || null);
          } else if (res && Array.isArray(res.callLogs)) {
            // fallback key
            logs = res.callLogs;
            pagination = res.pagination || null;
            setCallStats(res.statistics || null);
          } else {
            // Unknown shape, try to be defensive
            logs = [];
            pagination = res?.pagination || null;
            setCallStats(res?.statistics || null);
          }
        }

        // If we intentionally requested a large page because date filters are active,
        // treat results as non-paginated and do client-side pagination to avoid
        // relying on potentially incorrect server totals.
        if (requestingAllFiltered) {
          // determine whether filters changed compared to last cached key
          const filtersChanged = lastDateFilterKeyRef.current !== dateFilterKey
          // store key so subsequent page changes don't refetch
          lastDateFilterKeyRef.current = dateFilterKey
          setServerPaginated(false)
          setCallLogs(logs)
          setTotalRecords(logs.length)
          setTotalPages(Math.max(1, Math.ceil(logs.length / pageSize)))
          // No server stats expected when we fetched the full list, clear stats
          setCallStats(null)
          // reset to page 1 only when filters changed
          if (filtersChanged) {
            setCurrentPage(1)
          }
        } else {
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
          // If server included statistics, ensure we capture them (fallback)
          if (!callStats && res?.statistics) setCallStats(res.statistics)
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
    }, [businessId, currentPage, searchTerm, pageSize, dateFrom, dateTo, activeFilter, refreshTrigger]);

  // Auto-refresh interval: when enabled, increment `refreshTrigger` every 3s
  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(() => setRefreshTrigger(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Fetch available audio recordings once businessId is known
  const fetchAudioFiles = async () => {
    if (!businessId) return;
    setAudioLoading(true)
    setAudioError(null)
    try {
      // Try several possible endpoints/response shapes to be tolerant of backend differences
      const tryEndpoints = [
        `/v1/audio-recordings`,
        `/audio-recordings`,
        `/audio-recordings/business/${businessId}`,
        `/v1/audio-recordings/business/${businessId}`,
      ];
      let files = []
      for (let ep of tryEndpoints) {
        try {
          const r = await apiCall(ep, 'GET')
          // possible shapes: array of filenames, { files: [...] }, { data: [...] }, { recordings: [...] }
          if (Array.isArray(r)) {
            files = r
          } else if (Array.isArray(r?.files)) {
            files = r.files
          } else if (Array.isArray(r?.data)) {
            files = r.data
          } else if (Array.isArray(r?.recordings)) {
            files = r.recordings
          }
          if (files && files.length > 0) break
        } catch (e) {
          // try next endpoint
          console.debug('audio recordings endpoint failed', ep, e.message)
        }
      }

      // Normalize entries to simple filename strings when objects are returned
      const normalized = (files || []).map(f => {
        if (!f) return ''
        if (typeof f === 'string') return f
        if (typeof f === 'object') return f.filename || f.fileName || f.name || f.key || JSON.stringify(f)
        return String(f)
      }).filter(Boolean)
      setAudioFiles(normalized)
    } catch (err) {
      console.error('Failed to fetch audio recordings', err)
      setAudioError('Failed to load audio recordings')
      setAudioFiles([])
    } finally {
      setAudioLoading(false)
    }
  }

  useEffect(() => {
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

  // Parse a YYYY-MM-DD date string into a local timestamp.
  // Using string-based Date parsing can be inconsistent across browsers
  // (some treat 'YYYY-MM-DD' as UTC). So we parse components to ensure
  // we get a local Date at midnight (or end of day when requested).
  const parseLocalDate = (dateStr, endOfDay = false) => {
    if (!dateStr) return null
    const parts = String(dateStr).split('-')
    if (parts.length !== 3) return null
    const y = Number(parts[0])
    const m = Number(parts[1]) - 1
    const d = Number(parts[2])
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
    const dt = new Date(y, m, d)
    if (endOfDay) dt.setHours(23, 59, 59, 999)
    else dt.setHours(0, 0, 0, 0)
    return dt.getTime()
  }

  // Format a Date into YYYY-MM-DD for <input type="date"> controls
  const formatDateInput = (d) => {
    if (!d) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // Apply a quick preset range selected in the date modal
  const applyQuickRange = (preset) => {
    const now = new Date()
    let from = null
    let to = now
    switch (preset) {
      case 'Last 1 hour':
        from = new Date(now.getTime() - 1 * 60 * 60 * 1000)
        break
      case 'Last 24 hour':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'Today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        break
      case 'Yesterday':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        break
      case 'This Week':
        // Start from Monday
        const day = now.getDay() || 7
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1))
        break
      case 'Last 7 days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'Last 30 days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'Last Month':
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthLastDay = new Date(firstDayThisMonth.getTime() - 1)
        from = new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), 1)
        to = new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), lastMonthLastDay.getDate(), 23, 59, 59, 999)
        break
      case 'This Month':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        from = null
    }

    setDateFrom(from ? formatDateInput(from) : '')
    setDateTo(to ? formatDateInput(to) : '')
    // set selected states too so modal UI reflects current selection
    setSelectedFromDate(from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : null)
    setSelectedToDate(to ? new Date(to.getFullYear(), to.getMonth(), to.getDate()) : null)
    setSelectedFromTime(from ? `${String(from.getHours()).padStart(2,'0')}:${String(from.getMinutes()).padStart(2,'0')}` : '00:00')
    setSelectedToTime(to ? `${String(to.getHours()).padStart(2,'0')}:${String(to.getMinutes()).padStart(2,'0')}` : '23:59')
    // Keep modal open so user can review before applying
    setCurrentPage(1)
  }

  // Calendar helper component (basic month grid) with navigation
  const CalendarPanel = ({ valueDate, onSelect, baseDate, onPrev, onNext }) => {
    const today = new Date()
    const base = baseDate ? new Date(baseDate.getFullYear(), baseDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const weeks = []
    let day = 1 - firstDay
    for (let w = 0; w < 6; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dt = new Date(year, month, day)
        week.push(dt)
        day++
      }
      weeks.push(week)
    }

    const isSameDate = (a, b) => {
      if (!a || !b) return false
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    }

    return (
      <div className="calendar-panel">
        <div className="calendar-header d-flex align-items-center justify-content-between">
          <div className="calendar-controls">
            <button type="button" className="month-prev" onClick={onPrev}>◀</button>
            <span className="calendar-month">{base.toLocaleString('en-US', { month: 'long' })} {year}</span>
            <button type="button" className="month-next" onClick={onNext}>▶</button>
          </div>
        </div>
        <div className="calendar-grid">
          {['S','M','T','W','T','F','S'].map((h) => <div key={h} className="calendar-cell calendar-cell-header">{h}</div>)}
          {weeks.map((week,wi)=> week.map((dt,di)=> {
            const inMonth = dt.getMonth() === month
            const selected = valueDate && isSameDate(dt, valueDate)
            return (
              <div key={`${wi}-${di}`} className={`calendar-cell ${inMonth ? 'in-month':''} ${selected ? 'selected':''}`} onClick={() => onSelect(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}>
                {dt.getDate()}
              </div>
            )
          }))}
        </div>
      </div>
    )
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

    // callTypeFilter removed: rely on `activeFilter` for call type/status filtering

    // dateFrom / dateTo client-side filtering when server didn't paginate
    if (matches && (dateFrom || dateTo)) {
      const t = log.callDate || log.createdAt
      if (t) {
        // call timestamp in ms
        const callTs = new Date(t).getTime()

        if (dateFrom) {
          const fromTs = parseLocalDate(dateFrom, false)
          if (fromTs !== null && callTs < fromTs) matches = false
        }

        if (matches && dateTo) {
          // For inclusive behaviour, treat dateTo as end of that day
          const toTs = parseLocalDate(dateTo, true)
          if (toTs !== null && callTs > toTs) matches = false
        }
      }
    }

    return matches
  })

  // Determine paginated list: if server returned paginated data use it as-is; otherwise slice client-side
  const paginatedCallLogs = serverPaginated
    ? clientFilteredCallLogs
    : clientFilteredCallLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute effective totals based on whether server provided pagination or we're using client-side filtering
  const effectiveTotalRecords = serverPaginated ? totalRecords : clientFilteredCallLogs.length
  const effectiveTotalPages = serverPaginated ? totalPages : Math.max(1, Math.ceil(clientFilteredCallLogs.length / pageSize))
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handlePlayRecording = async (recordingUrl, rowId) => {
    // mark this row and URL as the currently requested playing resource
    setPlayingId(rowId != null ? String(rowId) : null)
    setPlayingUrl(recordingUrl)
    if (!recordingUrl) {
      alert('No recording available for this call');
      setPlayingId(null)
      setPlayingUrl(null)
      return;
    }
    setRecordingError(null)
    setRecordingLoading(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      // Normalize recording URL: if it's just a filename, build full download path
      let fetchUrl = recordingUrl
      try {
        const u = new URL(recordingUrl)
        fetchUrl = u.href
      } catch (e) {
        if (!recordingUrl.startsWith('/')) {
          fetchUrl = `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(recordingUrl)}`
        }
      }

      // Try direct fetch first; if it fails (CORS/auth), fallback to axios via apiCall
      let arrayBuffer = null
      let contentType = ''
      try {
        const resp = await fetch(fetchUrl, {
          method: 'GET',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        console.debug('Recording fetch response', { url: fetchUrl, ok: resp.ok, status: resp.status })
        if (resp.ok) {
          contentType = resp.headers.get('Content-Type') || ''
          arrayBuffer = await resp.arrayBuffer()
        } else {
          console.warn('fetch failed, will try axios fallback')
        }
      } catch (e) {
        console.warn('fetch threw, will try axios fallback', e)
      }

      if (!arrayBuffer || (arrayBuffer && arrayBuffer.byteLength === 0)) {
        // axios fallback using apiCall which includes Authorization via getHeaders
        try {
          const data = await apiCall(fetchUrl, 'GET', null, { responseType: 'arraybuffer' })
          arrayBuffer = data
          contentType = recordingUrl.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'
        } catch (e) {
          throw new Error('Failed to download recording (fetch and axios attempts failed): ' + (e.message || e))
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error('Empty audio file received')

      const blob = new Blob([arrayBuffer], { type: contentType || (recordingUrl.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg') })
      const blobUrl = URL.createObjectURL(blob)
      if (audioBlobUrl) {
        try { URL.revokeObjectURL(audioBlobUrl) } catch (e) {}
      }
      setAudioBlobUrl(blobUrl)
      setRecordingMimeType(contentType)
      setRecordingInfo({ status: 200, contentType, size: blob.size })

      // Play via audio element, fallback to WebAudio if needed
      setTimeout(async () => {
        try {
            if (audioRef.current) {
            try {
              audioRef.current.onerror = null
              audioRef.current.src = blobUrl
              audioRef.current.load()
              audioRef.current.onended = () => { setPlayingId(null); setPlayingUrl(null) }
              const playPromise = audioRef.current.play()
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch((err) => {
                  console.warn('Playback failed on audio element, using WebAudio fallback', err)
                  fallbackPlayViaWebAudio(arrayBuffer, contentType)
                })
              }
              audioRef.current.onerror = (ev) => { console.warn('Audio element error, WebAudio fallback', ev); fallbackPlayViaWebAudio(arrayBuffer, contentType) }
            } catch (e) {
              console.warn('audioRef play failed, will try temporary Audio object', e)
            }
          } else {
            // If no audio element is mounted (we're playing inline), use a temporary Audio object
            try {
              if (tempAudioRef.current) {
                try { tempAudioRef.current.pause() } catch (e) {}
                try { tempAudioRef.current.src = '' } catch (e) {}
                tempAudioRef.current = null
              }
              const a = new Audio(blobUrl)
              tempAudioRef.current = a
              a.onended = () => { setPlayingId(null); setPlayingUrl(null); tempAudioRef.current = null }
              a.play().catch((err) => {
                console.warn('Temporary Audio playback failed, using WebAudio fallback', err)
                fallbackPlayViaWebAudio(arrayBuffer, contentType)
              })
            } catch (e) {
              console.warn('Temporary Audio creation failed, using WebAudio fallback', e)
              fallbackPlayViaWebAudio(arrayBuffer, contentType)
            }
          }
        } catch (e) {
          console.warn('Audio play attempt failed, using WebAudio', e)
          try { fallbackPlayViaWebAudio(arrayBuffer, contentType) } catch (err) { console.warn(err) }
        }
      }, 50)
    } catch (err) {
      console.error('Failed to play recording', err)
      setRecordingError(err.message || 'Failed to play recording')
      setPlayingUrl(null)
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
        setPlayingUrl(null)
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
      setPlayingUrl(null)
    } catch (e) {
      console.warn('Error stopping WebAudio', e)
    }
  }

  const handleStopPlayback = () => {
    try {
      if (audioRef.current) {
        try { audioRef.current.pause() } catch (e) {}
        try { audioRef.current.currentTime = 0 } catch (e) {}
        try { audioRef.current.src = '' } catch (e) {}
      }
    } catch (e) {}
    try { stopWebAudio() } catch (e) {}
    // also stop temporary Audio if present
    try {
      if (tempAudioRef.current) {
        try { tempAudioRef.current.pause() } catch (e) {}
        try { tempAudioRef.current.src = '' } catch (e) {}
        tempAudioRef.current = null
      }
    } catch (e) {}
    setPlayingUrl(null)
    setPlayingId(null)
    setRecordingLoading(false)
  }

  const handleDownloadRecording = async (recordingUrl, fileName) => {
    // Use authenticated download endpoint to include Authorization header and stream the file
    const download = async (urlOrName, providedName) => {
      try {
        // Normalize filename: prefer providedName, else extract last path segment from URL-or-name
        let filename = providedName || ''
        if (!filename) {
          try {
            const maybeUrl = new URL(String(urlOrName))
            const parts = maybeUrl.pathname.split('/')
            filename = decodeURIComponent(parts.pop() || parts.pop() || '')
          } catch (e) {
            // urlOrName may be a relative path or plain filename
            const s = String(urlOrName || '')
            const parts = s.split('/')
            filename = decodeURIComponent(parts.pop() || parts.pop() || '')
          }
        }

        // strip query params if present
        if (filename && filename.indexOf('?') !== -1) filename = filename.split('?')[0]

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
    const loadingKey = (fileName && String(fileName)) || String(recordingUrl)
    try {
      setDownloadLoadingMap(m => ({ ...m, [loadingKey]: true }))
      await download(recordingUrl, fileName)
    } finally {
      setDownloadLoadingMap(m => {
        const nm = { ...m }
        delete nm[loadingKey]
        return nm
      })
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
      const requestingAllFiltered = Boolean(dateFrom || dateTo)
      const limit = 1000
      let logs = []

      // Fetch pages sequentially when date filters are active to ensure we
      // respect the server's filtered responses while avoiding relying on
      // server-reported totalPages (which may be incorrect).
      if (requestingAllFiltered) {
        let page = 1
        const maxRecordsCap = 5000 // safety cap to avoid huge downloads
        const maxPages = Math.ceil(maxRecordsCap / limit)
        const fromTs = dateFrom ? parseLocalDate(dateFrom, false) : null
        const toTs = dateTo ? parseLocalDate(dateTo, true) : null
        while (true) {
          const pageEndpoint = buildLogsEndpoint(page, limit)
          console.debug(`Export (filtered) fetching page ${page}:`, pageEndpoint)
          const res = await apiCall(pageEndpoint, 'GET')
          let pageLogs = []
          if (Array.isArray(res)) pageLogs = res
          else if (res && Array.isArray(res.data)) pageLogs = res.data
          else if (res && Array.isArray(res.callLogs)) pageLogs = res.callLogs
          else pageLogs = []

          if (pageLogs.length > 0) {
            // Filter page logs by selected date range (client-side safeguard)
            const pageTimestamps = pageLogs.map(l => new Date(l.callDate || l.createdAt).getTime()).filter(Boolean)
            const maxPageTs = pageTimestamps.length ? Math.max(...pageTimestamps) : null
            const minPageTs = pageTimestamps.length ? Math.min(...pageTimestamps) : null

            const matched = pageLogs.filter(l => {
              const t = new Date(l.callDate || l.createdAt).getTime()
              if (Number.isNaN(t)) return false
              if (fromTs !== null && t < fromTs) return false
              if (toTs !== null && t > toTs) return false
              return true
            })
            logs = logs.concat(matched)

            console.debug(`Export (filtered) page ${page} returned ${pageLogs.length} records, matched ${matched.length}`,
              matched.length ? { firstMatched: matched[0]?.callDate, lastMatched: matched[matched.length - 1]?.callDate } : null,
              { maxPageTs: maxPageTs ? new Date(maxPageTs).toISOString() : null, minPageTs: minPageTs ? new Date(minPageTs).toISOString() : null })

            // Heuristic early-stop: if server returns pages in descending date order and
            // the newest timestamp on this page is older than fromTs, further pages
            // will be older as well — we can stop early.
            if (fromTs !== null && maxPageTs !== null && maxPageTs < fromTs) {
              console.debug('Export (filtered) early stop: page max timestamp is older than fromTs')
              break
            }
          }

          // Stop when this page returned fewer than limit records (last page)
          if (pageLogs.length < limit) break
          page += 1
          if (page > maxPages) {
            console.warn('Reached export max pages cap; stopping further fetches')
            break
          }
        }
      } else {
        // No date filters: use existing pagination meta to fetch remaining pages in parallel
  const firstEndpoint = buildLogsEndpoint(1, limit)
  console.debug('Export (unfiltered) fetching first page:', firstEndpoint)
  const first = await apiCall(firstEndpoint, 'GET')
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

        if (pagination && pagination.totalPages && pagination.totalPages > 1) {
          const totalPages = pagination.totalPages
          const lim = pagination.limit || limit
          const promises = []
          for (let p = 2; p <= totalPages; p++) {
            const e = buildLogsEndpoint(p, lim)
            console.debug('Export (unfiltered) will fetch page', p, e)
            promises.push(apiCall(e, 'GET'))
          }
          const rest = await Promise.all(promises)
          rest.forEach(r => {
            if (Array.isArray(r)) logs = logs.concat(r)
            else if (r && Array.isArray(r.data)) logs = logs.concat(r.data)
            else if (r && Array.isArray(r.callLogs)) logs = logs.concat(r.callLogs)
          })
        }
      }

      if (!logs || logs.length === 0) {
        alert('No call logs available to export')
        return
      }

      // Prepare CSV headers and rows
      const headers = [
        'S.NO', 'TYPE', 'DATE', 'INITIATED BY', 'RECEIVED BY', 'REJECTED BY', 'TEAM', 'HANG UP BY', 'DURATION', 'COST', 'NOTES', 'STATUS', 'VIRTUAL NUMBER', 'CONTACT'
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
          csvEscape(log.notes || log.notebyagent || ''),
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
          <CRow className="mb-3 align-items-center call-logs-header">
            <CCol md={8}>
              <div className="calllogs-controls d-flex align-items-center gap-2">
                <button className="cl-date-range btn btn-light" onClick={openDateModal}>
                  <CIcon icon={cilCalendar} className="me-2" />
                  {dateFrom && dateTo ? `${dateFrom} ${selectedFromTime} - ${dateTo} ${selectedToTime}` : 'Select date range'}
                </button>

                <div className="cl-callid-search input-group">
                  <CFormInput placeholder="Search (Customer No. / Caller)" value={searchTerm} onChange={handleSearch} />
                  <CButton type="button" color="primary" variant="outline"><CIcon icon={cilSearch} /></CButton>
                </div>
                

                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <CFormSelect value={activeFilter} onChange={e=>{setActiveFilter(e.target.value); setCurrentPage(1)}} style={{width:170}} aria-label="Status filter">
                    <option>All Calls</option>
                    <option>Completed</option>
                    <option>Failed</option>
                    <option>Outgoing</option>
                    <option>Incoming</option>
                  </CFormSelect>
                  
                </div>
              </div>
            </CCol>
            <CCol md={4} className="d-flex justify-content-end align-items-center gap-2">
              <CButton color="warning" variant="outline" className="cl-oldcdr">OLD CDR</CButton>
              <CButton color="light" className="cl-icon-btn" onClick={exportAllCallLogs} disabled={exporting}>
                {exporting ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} />}
              </CButton>
              <CButton
                color={autoRefresh ? 'primary' : 'light'}
                className="cl-icon-btn"
                onClick={() => {
                  setAutoRefresh(prev => {
                    const next = !prev
                    if (next) setRefreshTrigger(t => t + 1) // immediate refresh when enabling
                    return next
                  })
                }}
                title={autoRefresh ? 'Auto-refresh ON (click to stop)' : 'Start auto-refresh (5s)'}
              >
                <CIcon icon={cilReload} className={autoRefresh ? 'reload-animate' : ''} />
              </CButton>
              <CButton color="light" className="cl-icon-btn"><CIcon icon={cilOptions} /></CButton>
            </CCol>
          </CRow>
          {/* New filters UI (top controls) are used. Old inline filter row removed. */}
          <CTable hover responsive className="table-sm compact-table branches-table" style={{ tableLayout: 'auto' }}>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{width: '48px'}}></CTableHeaderCell>
                <CTableHeaderCell>Customer No.</CTableHeaderCell>
                <CTableHeaderCell>DID No.</CTableHeaderCell>
                <CTableHeaderCell>Duration</CTableHeaderCell>
                <CTableHeaderCell>Call ID</CTableHeaderCell>
                <CTableHeaderCell>Solution</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Agents Involved</CTableHeaderCell>
                <CTableHeaderCell>Recording</CTableHeaderCell>
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
                  const callDate = formatDate(log.callDate || log.createdAt);
                  const callType = String((log.callType || log.type || '').toLowerCase())
                  const isIncoming = callType === 'inbound' || callType === 'incoming'
                  const isMissed = (log.status || '').toLowerCase().includes('miss') || (log.hangupby || '').toLowerCase() === 'caller'
                  const duration = formatDuration(log.callDuration || log.duration);
                  const callId = log.callId || log.call_id || log._id || '';
                  const solution = log.solution || log.callType || '';
                  const agents = Array.isArray(log.agents) && log.agents.length ? log.agents : (log.callReceivedBy ? [log.callReceivedBy] : []);
                  const recording = log.callRecording || log.recording || null;
                  // try to find a single best matching audio filename from `audioFiles` when inline recording not present
                  let matchedFiles = []
                  try {
                    if (!recording && audioFiles && audioFiles.length > 0) {
                      const vn = String(log.virtualNumber || '').replace(/[^0-9]/g, '')
                      const contactNum = String(log.contact || log.callInitiatedBy || '').replace(/[^0-9]/g, '')
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

                      const logTs = (() => {
                        const t = log.callDate || log.createdAt || log.timestamp
                        const dt = t ? new Date(t) : null
                        return dt && !Number.isNaN(dt.getTime()) ? dt.getTime() : null
                      })()

                      // helper: extract timestamp from filename if it follows YYYYMMDD_HHMMSS
                      const extractTsFromFilename = (fname) => {
                        try {
                          const m = fname.match(/(\d{8})[_-]?(\d{6})/)
                          if (!m) return null
                          const d = m[1] // YYYYMMDD
                          const t = m[2] // HHMMSS
                          const year = Number(d.slice(0,4))
                          const month = Number(d.slice(4,6)) - 1
                          const day = Number(d.slice(6,8))
                          const hour = Number(t.slice(0,2))
                          const minute = Number(t.slice(2,4))
                          const second = Number(t.slice(4,6))
                          const dt = new Date(year, month, day, hour, minute, second)
                          if (Number.isNaN(dt.getTime())) return null
                          return dt.getTime()
                        } catch (e) { return null }
                      }

                      const candidates = audioFiles.map(f => {
                        const lower = String(f)
                        const containsVn = vnVariants.some(v => v && lower.includes(v))
                        const containsContact = contactVariants.some(c => c && lower.includes(c))
                        const matchesCount = (containsVn ? 1 : 0) + (containsContact ? 1 : 0)
                        const fileTs = extractTsFromFilename(lower)
                        const tsDiff = (logTs && fileTs) ? Math.abs(logTs - fileTs) : Number.MAX_SAFE_INTEGER
                        return { fname: f, matchesCount, tsDiff, fileTs }
                      }).filter(Boolean)

                      if (candidates.length === 0) {
                        matchedFiles = []
                      } else {
                        // prefer candidates that match both numbers, then closest timestamp
                        candidates.sort((a,b) => {
                          if (b.matchesCount !== a.matchesCount) return b.matchesCount - a.matchesCount
                          return a.tsDiff - b.tsDiff
                        })
                        const best = candidates[0]
                        // sanity threshold: ignore if timestamp diff > 10 minutes unless it's the only match
                        const TEN_MIN = 10 * 60 * 1000
                        if (best) {
                          if (best.tsDiff <= TEN_MIN || candidates.length === 1) matchedFiles = [best.fname]
                          else {
                            // if no good time match, still allow best candidate if it matches both numbers
                            if (best.matchesCount === 2) matchedFiles = [best.fname]
                            else matchedFiles = []
                          }
                        }
                      }
                    }
                  } catch (e) {
                    matchedFiles = []
                  }

                  // compute static bar heights for visual variation
                  const computeBarHeights = () => {
                    // if we have a matching file or inline recording, derive a seed
                    const seedSource = recording || (matchedFiles && matchedFiles[0]) || callId || String(Math.random())
                    // simple hash to deterministic number
                    let h = 0
                    for (let i = 0; i < seedSource.length; i++) h = ((h << 5) - h) + seedSource.charCodeAt(i)
                    h = Math.abs(h)
                    // produce 5 heights between 6 and 18
                    const out = []
                    for (let i = 0; i < 5; i++) {
                      const v = 6 + ( (h >> (i*3)) % 13 ) // 6..18
                      out.push(v)
                    }
                    return out
                  }
                  const barHeights = computeBarHeights()

                  const initials = (name) => {
                    if (!name) return ''
                    return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
                  }

                  return (
                    <CTableRow key={log._id || index}>
                      <CTableDataCell className="align-middle">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <input type="checkbox" onClick={(e)=>e.stopPropagation()} />
                        </div>
                      </CTableDataCell>

                      <CTableDataCell className="align-middle">
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div className={isIncoming ? 'call-type-icon incoming' : (isMissed ? 'call-type-icon missed' : 'call-type-icon') }>
                            <CIcon icon={isIncoming ? cilPhone : (isMissed ? cilXCircle : cilPhone)} />
                          </div>
                          <div style={{display:'flex',flexDirection:'column'}}>
                            <div style={{fontWeight:600}}>{log.contact || log.callInitiatedBy || '—'}</div>
                            <div style={{fontSize:'12px',color:'#6b7280'}}>{callDate}</div>
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell className="align-middle">{log.virtualNumber || '—'}</CTableDataCell>

                      <CTableDataCell className="align-middle">{duration}</CTableDataCell>

                      <CTableDataCell className="align-middle">
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:220}}>{callId}</div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell className="align-middle">{solution}</CTableDataCell>
                      <CTableDataCell className="align-middle">{formatCallStatus(log.status)}</CTableDataCell>

                      <CTableDataCell className="align-middle">
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          {agents.map((a,ii)=> (
                            <div key={ii} style={{width:34,height:34,borderRadius:17,background:'#e5e7eb',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:600,color:'#374151'}}>{initials(a)}</div>
                          ))}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell className="align-middle">
                        {/** Unified recording control: show voice-loader + play/download buttons. Disabled when no recording. **/}
                        <div className="recording-control">
                          <div className={`voice-loader ${(!recording && (!matchedFiles || matchedFiles.length === 0)) ? 'disabled' : ''}`} aria-hidden>
                            {(barHeights || [12,12,12,12,12]).map((h, idx) => (
                              <div key={idx} className="voice-bar" style={{ height: `${h}px` }} />
                            ))}
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            {(() => {
                              const rowKey = log._id || callId || index
                              const rowUrl = recording || (matchedFiles && matchedFiles[0] ? `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(matchedFiles[0])}` : null)
                              const isPlayingRow = playingId === String(rowKey)
                              return (
                                <button
                                  type="button"
                                  className={`rec-btn play ${isPlayingRow ? 'playing' : ''}`}
                                  onClick={(e) => { e.stopPropagation();
                                    const url = rowUrl
                                    if (!url) return
                                    if (isPlayingRow) {
                                      handleStopPlayback()
                                    } else {
                                      handlePlayRecording(url, rowKey)
                                    }
                                  }}
                                  disabled={!rowUrl}
                                  title={isPlayingRow ? 'Stop playback' : 'Play recording'}
                                >
                                  {recordingLoading && isPlayingRow ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={isPlayingRow ? cilMediaStop : cilMediaPlay} />
                                  )}
                                </button>
                              )
                            })()}

                            {(() => {
                              const fname = recording && String(recording).split('/').pop() || (matchedFiles && matchedFiles[0])
                              const rowUrl = recording || (matchedFiles && matchedFiles[0] ? `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(matchedFiles[0])}` : null)
                              const downloadKey = fname || rowUrl
                              const isDownloading = Boolean(downloadLoadingMap && downloadKey && downloadLoadingMap[String(downloadKey)])
                              return (
                                <button
                                  type="button"
                                  className="rec-btn"
                                  onClick={(e) => { e.stopPropagation();
                                    if (!rowUrl) return
                                    handleDownloadRecording(rowUrl, fname)
                                  }}
                                  disabled={!rowUrl || isDownloading}
                                  title={isDownloading ? 'Downloading...' : 'Download recording'}
                                >
                                  {isDownloading ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} />}
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>
          {effectiveTotalPages > 1 && (
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
                  const showLast = effectiveTotalPages;
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
                  disabled={currentPage === effectiveTotalPages}
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
      <CModal visible={showModal} scrollable onClose={() => {
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
          <CModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {selectedLog && (
            <div>
              <div className="mb-3">
                <strong>Call Details:</strong>
                <p>Type: {selectedLog.callType || 'Unknown'}</p>
                <p>Initiated By: {selectedLog.callInitiatedBy || 'Unknown'}</p>
                <p>Received By: {selectedLog.callReceivedBy || 'N/A'}</p>
                <p>Rejected By: {selectedLog.callRejectedBy || 'N/A'}</p>
                <p>Team: {selectedLog.team || 'N/A'}</p>
                <p>Hang Up By: {selectedLog.hangUpBy || 'Unknown'}</p>
                <p>Duration: {formatDuration(selectedLog.callDuration || selectedLog.duration)}</p>
                <p>Cost: {selectedLog.cost != null ? `$${Number(selectedLog.cost).toFixed(2)}` : 'N/A'}</p>
                <p>Status: {formatCallStatus(selectedLog.status)}</p>
                <p>Notes: {selectedLog.notes || selectedLog.notebyagent || 'N/A'}</p>
              </div>
              
              <div className="mb-3">
                <strong>Recording Options:</strong>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {selectedLog.callRecording ? (
                    <>
                      {(() => {
                        const modalPlayKey = selectedLog._id ? String(selectedLog._id) : `modal-${selectedLog.callId || 'sel'}`
                        const isPlayingModal = playingId === String(modalPlayKey)
                        return (
                          <CButton
                            color="primary"
                            onClick={() => {
                              if (isPlayingModal) handleStopPlayback()
                              else handlePlayRecording(selectedLog.callRecording, modalPlayKey)
                            }}
                          >
                            {recordingLoading && isPlayingModal ? (
                              <CSpinner size="sm" className="me-2" />
                            ) : (
                              <CIcon icon={isPlayingModal ? cilMediaStop : cilMediaPlay} className="me-2" />
                            )}
                            {isPlayingModal ? 'Stop' : 'Play Recording'}
                          </CButton>
                        )
                      })()}
                      <CButton
                        color="success"
                        onClick={() => handleDownloadRecording(
                          selectedLog.callRecording,
                          `call-recording-${selectedLog._id}.mp3`
                        )}
                        disabled={Boolean(downloadLoadingMap && downloadLoadingMap[`call-recording-${selectedLog._id}.mp3`])}
                      >
                        {downloadLoadingMap && downloadLoadingMap[`call-recording-${selectedLog._id}.mp3`] ? (
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

                      if (strictMatches.length === 0) {
                        // Try a looser match: either VN or contact present (not necessarily both)
                        const loose = audioFiles.filter(f => {
                          return vnVariants.some(v => v && f.includes(v)) || contactVariants.some(c => c && f.includes(c))
                        })
                        if (loose.length === 0) return (
                          <div>
                            <p className="text-muted">No recording available for this call.</p>
                            <div className="mt-2">
                              <CButton size="sm" color="secondary" onClick={() => fetchAudioFiles()}>
                                Refresh recordings ({audioLoading ? '...' : (audioFiles.length)})
                              </CButton>
                            </div>
                          </div>
                        )
                        // prefer looser unique list
                        const seenLoose = new Set()
                        const dedup = loose.filter(fname => {
                          if (seenLoose.has(fname)) return false
                          seenLoose.add(fname)
                          return true
                        })
                        // assign back to strictMatches variable name to reuse rendering code below
                        strictMatches = dedup
                      } else {
                        const seen = new Set()
                        const dedup = strictMatches.filter(fname => {
                          if (seen.has(fname)) return false
                          seen.add(fname)
                          return true
                        })
                        strictMatches = dedup
                      }

                      return (
                        <div>
                          <p className="mb-2">Available recordings:</p>
                          <div className="d-flex flex-column gap-2">
                            {strictMatches.map((fname, i) => {
                              const fileUrl = `${getBaseURL()}/api/v1/audio-recordings/${encodeURIComponent(fname)}`;
                              return (
                                <div key={i} className="d-flex align-items-center gap-2 p-2 border rounded">
                                  <span className="flex-grow-1 text-truncate" title={fname}>{fname}</span>
                                        {(() => {
                                          const modalKey = `modal-${fname}`
                                          const isPlaying = playingId === String(modalKey)
                                          return (
                                            <CButton
                                              size="sm"
                                              color="primary"
                                              variant="outline"
                                              onClick={() => {
                                                if (isPlaying) handleStopPlayback()
                                                else handlePlayRecording(fileUrl, modalKey)
                                              }}
                                            >
                                              {recordingLoading && isPlaying ? <CSpinner size="sm" /> : <CIcon icon={isPlaying ? cilMediaStop : cilMediaPlay} size="sm" />}
                                            </CButton>
                                          )
                                        })()}
                                  <CButton
                                    size="sm"
                                    color="success"
                                    variant="outline"
                                    onClick={() => handleDownloadRecording(fileUrl, fname)}
                                    disabled={Boolean(downloadLoadingMap && downloadLoadingMap[fname])}
                                  >
                                    {downloadLoadingMap && downloadLoadingMap[fname] ? (
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

      {/* Date Range Modal (Quick Actions + Dual Calendar) */}
      <CModal visible={showDateModal} onClose={() => setShowDateModal(false)} size="lg">
        <div className="date-filter-modal date-filter-modal-rich">
          <div className="date-filter-left">
            <h5>Quick Actions</h5>
            <ul>
              {['Last 1 hour','Today','Last 24 hour','Yesterday','This Week','Last 7 days','Last 30 days','Last Month','This Month'].map((q) => (
                <li key={q}><button type="button" className="quick-action" onClick={() => applyQuickRange(q)}>{q}</button></li>
              ))}
            </ul>
          </div>
          <div className="date-filter-right">
            <div className="date-filter-top">
              <div className="date-display">
                <div className="date-block">
                  <div className="date-title">From</div>
                  <div className="date-large">{selectedFromDate ? selectedFromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                  <div className="time-large">{selectedFromTime}</div>
                </div>
                <div className="date-block">
                  <div className="date-title">To</div>
                  <div className="date-large">{selectedToDate ? selectedToDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                  <div className="time-large">{selectedToTime}</div>
                </div>
              </div>
            </div>

            <div className="date-filter-panels-rich">
              <div className="date-panel-rich">
                <div className="calendar-wrapper">
                  <CalendarPanel
                    valueDate={selectedFromDate}
                    onSelect={d=>setSelectedFromDate(d)}
                    baseDate={baseLeftDate || selectedFromDate || new Date()}
                    onPrev={() => setBaseLeftDate(prev => {
                      const src = prev || (selectedFromDate || new Date())
                      return new Date(src.getFullYear(), src.getMonth() - 1, 1)
                    })}
                    onNext={() => setBaseLeftDate(prev => {
                      const src = prev || (selectedFromDate || new Date())
                      return new Date(src.getFullYear(), src.getMonth() + 1, 1)
                    })}
                  />
                </div>
                <div className="time-row">
                  <input type="time" value={selectedFromTime} onChange={e=>setSelectedFromTime(e.target.value)} />
                </div>
              </div>
              <div className="date-panel-rich">
                <div className="calendar-wrapper">
                  <CalendarPanel
                    valueDate={selectedToDate}
                    onSelect={d=>setSelectedToDate(d)}
                    baseDate={baseRightDate || selectedToDate || new Date()}
                    onPrev={() => setBaseRightDate(prev => {
                      const src = prev || (selectedToDate || new Date())
                      return new Date(src.getFullYear(), src.getMonth() - 1, 1)
                    })}
                    onNext={() => setBaseRightDate(prev => {
                      const src = prev || (selectedToDate || new Date())
                      return new Date(src.getFullYear(), src.getMonth() + 1, 1)
                    })}
                  />
                </div>
                <div className="time-row">
                  <input type="time" value={selectedToTime} onChange={e=>setSelectedToTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="date-filter-actions-rich">
              <CButton color="warning" onClick={() => {
                // apply selected values to dateFrom/dateTo (date-only fields expected by backend)
                setDateFrom(selectedFromDate ? formatDateInput(selectedFromDate) : '')
                setDateTo(selectedToDate ? formatDateInput(selectedToDate) : '')
                setShowDateModal(false)
                setCurrentPage(1)
              }}>APPLY</CButton>
            </div>
          </div>
        </div>
      </CModal>
      {/* Filters moved inline; modal removed */}
      {/* Notes Modal (notepad) */}
      <CModal visible={showNotesModal} scrollable onClose={() => setShowNotesModal(false)} size="md">
        <CModalHeader>
          <h5>Notes</h5>
        </CModalHeader>
        <CModalBody style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          <div>
            <textarea
              readOnly
              value={notesContent}
              rows={12}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '10px', borderRadius: 4, border: '1px solid #ddd', background: '#fffef6' }}
            />
            {(!notesContent || String(notesContent).trim() === '') && (
              <div className="text-muted mt-2">No notes available for this call.</div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowNotesModal(false)}>Close</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default CallLogs