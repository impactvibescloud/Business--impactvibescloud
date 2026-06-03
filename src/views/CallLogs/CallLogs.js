import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Alert,
  Typography,
  InputAdornment,
  Pagination,
} from '@mui/material'
import GetAppIcon from '@mui/icons-material/GetApp'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import CallMakeIcon from '@mui/icons-material/CallMade'
import CallMissedIcon from '@mui/icons-material/CallMissed'
import './CallLogs.css'
import '../Branches/Branches.css'
import '../Leads/CallLogsWebpage.css'
import { ENDPOINTS, apiCall, getBaseURL } from '../../config/api'

const CallLogs = () => {
  const location = useLocation()
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
  const [agentMap, setAgentMap] = useState({})
  const [agentByNumberMap, setAgentByNumberMap] = useState({})
  const [activeFilter, setActiveFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [agentOptions, setAgentOptions] = useState([])
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
  // Ref to the inline <audio> element rendered below the call-log row.
  // Without this, handleStopPlayback couldn't actually pause it — the
  // element was only being "unmounted" via state, which lets the audio
  // continue playing in memory until the next React reconciliation.
  const inlineAudioRef = useRef(null)
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
  // Customize Columns modal state
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const columnsAvailable = [
    { key: 'sno', label: 'S.NO' },
    { key: 'type', label: 'TYPE' },
    { key: 'date', label: 'DATE' },
    { key: 'initiated_by', label: 'INITIATED BY' },
    { key: 'received_by', label: 'RECEIVED BY' },
    { key: 'rejected_by', label: 'REJECTED BY' },
    { key: 'team', label: 'TEAM' },
    { key: 'hangup_by', label: 'HANG UP BY' },
    { key: 'duration', label: 'DURATION' },
    { key: 'cost', label: 'COST' },
    { key: 'notes', label: 'NOTES' },
    { key: 'status', label: 'STATUS' },
    { key: 'virtual_number', label: 'VIRTUAL NUMBER' },
    { key: 'contact', label: 'CONTACT' },
  ]
  const [selectedColumns, setSelectedColumns] = useState(columnsAvailable.map(c=>c.key))

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

  // Initialize filters from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const filterParam = params.get('filter')
    const fromParam = params.get('from')
    const toParam = params.get('to')
    const statusParam = params.get('status')

    // Set filter if provided. Map legacy filter params to direction/status.
    if (filterParam) {
      const fp = String(filterParam || '')
      const lower = fp.toLowerCase()
      if (lower === 'answered') setStatusFilter('answered')
      else if (lower === 'missed') setStatusFilter('missed')
      else if (lower === 'outgoing' || lower === 'outbound') setActiveFilter('outbound')
      else if (lower === 'incoming' || lower === 'inbound') setActiveFilter('inbound')
      else setActiveFilter('all')
    }

    // Set date range if provided
    if (fromParam) {
      setDateFrom(fromParam)
    }
    if (toParam) {
      setDateTo(toParam)
    }

    // Set status filter if provided via URL (normalize common values)
    if (statusParam) {
      try {
        const s = String(statusParam)
        const lower = s.toLowerCase()
        if (lower === 'not answered' || lower === 'not-answered') setStatusFilter('not-answered')
        else setStatusFilter(lower)
      } catch (e) {
        setStatusFilter(statusParam)
      }
    }
  }, [location.search])

  // Build endpoint helper with applied filters
  const buildLogsEndpoint = (page = 1, limit = pageSize) => {
    // Use the public call-logs endpoint with businessId as query param (matches backend curl)
    let endpoint = `/call-logs?businessId=${encodeURIComponent(businessId)}&page=${page}&limit=${limit}`
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

    // Prefer explicit statusFilter when provided; fall back to activeFilter mapping
    // Note: treat 'all' as no-filter; backend may not recognize 'missed' consistently
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter !== 'missed') {
        endpoint += `&status=${encodeURIComponent(statusFilter)}`
      }
    } else if (activeFilter && activeFilter !== 'all') {
      if (activeFilter === 'outbound') endpoint += `&callType=outbound`
      else if (activeFilter === 'inbound') endpoint += `&callType=inbound`
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
        // If user has active date filters, agent filter, or a client-only status
        // filter (e.g. 'missed'), request a larger page size and fetch page 1 so
        // we can perform client-side pagination. This avoids relying on server
        // pagination totals when the backend doesn't support those filters.
        const requestingAllFiltered = Boolean(
          dateFrom || dateTo || (agentFilter && agentFilter !== 'all') || (statusFilter && statusFilter === 'missed')
        )
        const requestLimit = requestingAllFiltered ? 1000 : pageSize
        const requestPage = requestingAllFiltered ? 1 : currentPage
        const endpoint = buildLogsEndpoint(requestPage, requestLimit)

        // Build a simple key for the current date filters so we can cache the
        // filtered dataset and avoid refetching when the user only changes page.
        // IMPORTANT: Include searchTerm in the key so that search term changes trigger a refetch
        const dateFilterKey = `${dateFrom || ''}|${dateTo || ''}|${searchTerm || ''}|${businessId || ''}|${statusFilter || ''}|${activeFilter || ''}|${agentFilter || ''}`

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
    }, [businessId, currentPage, searchTerm, pageSize, dateFrom, dateTo, activeFilter, statusFilter, agentFilter, refreshTrigger]);

  // Auto-refresh interval: when enabled, increment `refreshTrigger` every 3s
  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(() => setRefreshTrigger(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Fetch available audio recordings once businessId is known
  // Helper to construct a recording access/download URL.
  // Accepts absolute URLs, server paths or plain filenames and returns
  // a usable URL that points to the unified call-logs download endpoint.
  const buildRecordingApiUrl = (input) => {
    if (!input) return null
    try {
      const u = new URL(String(input))
      return u.href
    } catch (e) {
      // Not an absolute URL; extract filename if a path was provided
      let fname = String(input || '')
      if (fname.includes('/')) fname = fname.split('/').pop()
      if (!fname) return null
      // Use the call-logs download route (server should expose this)
      return `${getBaseURL()}/api/call-logs/download/${encodeURIComponent(fname)}`
    }
  }

  const fetchAudioFiles = async () => {
    // Populate available audio filenames by querying call-logs (single API)
    setAudioLoading(true)
    setAudioError(null)
    try {
      if (!businessId) {
        setAudioFiles([])
        return
      }
      const endpoint = `/call-logs?businessId=${encodeURIComponent(businessId)}&page=1&limit=1000`
      const r = await apiCall(endpoint, 'GET')
      let logs = []
      if (Array.isArray(r)) logs = r
      else if (Array.isArray(r?.data)) logs = r.data
      else if (Array.isArray(r?.callLogs)) logs = r.callLogs
      else logs = []

      const files = (logs || []).map(l => {
        if (!l) return null
        if (l.recording) return l.recording
        if (l.callRecording) return l.callRecording
        if (l.recordingMeta && (l.recordingMeta.filename || l.recordingMeta.fileName)) return l.recordingMeta.filename || l.recordingMeta.fileName
        if (l.recordingMeta && l.recordingMeta.path) {
          const p = String(l.recordingMeta.path)
          if (p.includes('/')) return p.split('/').pop()
          return p
        }
        return null
      }).filter(Boolean)

      // Deduplicate
      const uniq = Array.from(new Set(files))
      setAudioFiles(uniq)
    } catch (err) {
      console.error('Failed to fetch audio recordings from call-logs', err)
      setAudioError('Failed to load audio recordings')
      setAudioFiles([])
    } finally {
      setAudioLoading(false)
    }
  }

  useEffect(() => {
    fetchAudioFiles()
  }, [businessId])

  const fetchAgents = async () => {
    if (!businessId) return
    try {
      const br = await apiCall(`/branch/${encodeURIComponent(businessId)}/branches`, 'GET')
      let list = []
      if (Array.isArray(br)) list = br
      else if (br?.data && Array.isArray(br.data)) list = br.data
      else if (Array.isArray(br.branches)) list = br.branches
      else if (br?.data?.data && Array.isArray(br.data.data)) list = br.data.data
      else list = []

      const idMap = {}
      const numMap = {}
      const agentEntries = new Map()

      list.forEach((branch) => {
        const u = branch.user || branch.manager || branch.owner || null
        if (u) {
          const id = u._id || u.id || u.email
          const name = u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
          if (id) {
            const ks = [String(id)]
            ks.forEach(k => { idMap[k] = name; idMap[String(k).toLowerCase()] = name })
            const digits = String(id).replace(/[^0-9]/g, '')
            if (digits) idMap[digits] = name
            // record a canonical agent entry (prefer id, fallback to email)
            try { agentEntries.set(String(id), name) } catch (e) {}
          }
          if (u.extension) {
            numMap[String(u.extension)] = name
            numMap[String(u.extension).replace(/[^0-9]/g,'')] = name
          }
          if (u.phone) {
            numMap[String(u.phone)] = name
            numMap[String(u.phone).replace(/[^0-9]/g,'')] = name
          }
        }
        if (Array.isArray(branch.members)) {
          branch.members.forEach((m) => {
            const id = m._id || m.id || m.email
            const name = m.name || m.fullName || m.email
            if (id) {
              const ks = [String(id)]
              ks.forEach(k => { idMap[k] = name; idMap[String(k).toLowerCase()] = name })
              const digits = String(id).replace(/[^0-9]/g, '')
              if (digits) idMap[digits] = name
              try { agentEntries.set(String(id), name) } catch (e) {}
            }
            if (m.extension) {
              numMap[String(m.extension)] = name
              numMap[String(m.extension).replace(/[^0-9]/g,'')] = name
            }
            if (m.phone) {
              numMap[String(m.phone)] = name
              numMap[String(m.phone).replace(/[^0-9]/g,'')] = name
            }
          })
        }
        if (Array.isArray(branch.didNumbers)) {
          branch.didNumbers.forEach((dn) => {
            let num = ''
            let assignedTo = ''
            if (typeof dn === 'string') num = dn
            else if (typeof dn === 'object') {
              num = dn.number || dn.did || dn.value || ''
              assignedTo = dn.assignedTo || dn.extensionOwner || ''
            }
            if (num) {
              const n = String(num)
              numMap[n] = branch.branchName || assignedTo || numMap[n] || n
              const digits = n.replace(/[^0-9]/g, '')
              if (digits) numMap[digits] = numMap[digits] || (branch.branchName || assignedTo || n)
            }
          })
        }
      })

      try {
        const users = await apiCall(`/users?businessId=${encodeURIComponent(businessId)}`, 'GET')
        let ulist = []
        if (Array.isArray(users)) ulist = users
        else if (users?.data && Array.isArray(users.data)) ulist = users.data
        else if (users?.data?.data && Array.isArray(users.data.data)) ulist = users.data.data
        ulist.forEach((u) => {
          const id = u._id || u.id || u.email
          const name = u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
          if (id) {
            const ks = [String(id)]
            ks.forEach(k => { idMap[k] = name; idMap[String(k).toLowerCase()] = name })
            const digits = String(id).replace(/[^0-9]/g, '')
            if (digits) idMap[digits] = name
            try { agentEntries.set(String(id), name) } catch (e) {}
          }
          if (u.extension) {
            numMap[String(u.extension)] = name
            numMap[String(u.extension).replace(/[^0-9]/g,'')] = name
          }
          if (u.phone) {
            numMap[String(u.phone)] = name
            numMap[String(u.phone).replace(/[^0-9]/g,'')] = name
          }
          if (u.mobile) {
            numMap[String(u.mobile)] = name
            numMap[String(u.mobile).replace(/[^0-9]/g,'')] = name
          }
        })
      } catch (e) {}

      setAgentMap(idMap)
      setAgentByNumberMap(numMap)
      try {
        const opts = Array.from(agentEntries.entries()).map(([id,name]) => ({ id: String(id), name }))
        opts.sort((a,b) => String(a.name).localeCompare(String(b.name)))
        setAgentOptions(opts)
      } catch (e) {
        setAgentOptions([])
      }
    } catch (e) {
      setAgentMap({})
      setAgentByNumberMap({})
    }
  }

  useEffect(() => { fetchAgents() }, [businessId])

  // Load saved columns selection from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('callLogsSelectedColumns')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedColumns(parsed)
      }
    } catch (e) {}
  }, [])

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

  // Apply both server-side and client-side filtering for comprehensive filtering support
  // Client-side filtering is always applied to handle all filter types reliably
  const clientFilteredCallLogs = callLogs.filter(log => {
    const callType = String(log.callType || log.type || '').toLowerCase();
    const status = String(log.status || '').toLowerCase();
    let matches = true;

    // direction filter: activeFilter now represents direction ('all' | 'outbound' | 'inbound')
    if (activeFilter && activeFilter !== 'all') {
      if (activeFilter === 'outbound') {
        matches = callType === 'outbound' || callType === 'outgoing'
      } else if (activeFilter === 'inbound') {
        matches = callType === 'inbound' || callType === 'incoming'
      }
    }

    // explicit status filter (based on the `status` column). Ignore when 'all'.
    if (matches && statusFilter && statusFilter !== 'all') {
      const sf = String(statusFilter).toLowerCase()
      if (sf === 'missed') {
        const isMissedCall = status.includes('miss') || status.includes('unanswer') || status.includes('no_answer') || String(log.hangupby || '').toLowerCase() === 'caller' || String(log.hangUpBy || '').toLowerCase() === 'caller'
        if (!isMissedCall) matches = false
      } else {
        // accept exact match or substring or formatted label match
        if (!(status === sf || status.includes(sf) || formatCallStatus(status).toLowerCase() === sf)) matches = false
      }
    }

    // agent filter: match by agent id (preferred) or display name when 'all' not selected
    if (matches && agentFilter && agentFilter !== 'all') {
      const selectedAgentId = String(agentFilter)
      const selectedAgentOption = (agentOptions || []).find(o => String(o.id) === selectedAgentId)
      const selectedAgentName = selectedAgentOption ? String(selectedAgentOption.name).toLowerCase() : (agentMap && (agentMap[selectedAgentId] || agentMap[String(selectedAgentId).toLowerCase()]) ? String(agentMap[selectedAgentId] || agentMap[String(selectedAgentId).toLowerCase()]).toLowerCase() : null)

      let agentsArr = []
      if (Array.isArray(log.agents) && log.agents.length) agentsArr = log.agents
      else if (log.agent) agentsArr = [log.agent]
      else if (Array.isArray(log.callReceivedBy)) agentsArr = log.callReceivedBy
      else if (log.callReceivedBy && typeof log.callReceivedBy === 'string') agentsArr = [log.callReceivedBy]
      else agentsArr = []

      const matchesAgent = (entry) => {
        if (!entry) return false
        if (typeof entry === 'object') {
          const id = String(entry._id || entry.id || entry.email || '')
          if (id && id === selectedAgentId) return true
          const name = (entry.name || entry.fullName || `${entry.firstName || ''} ${entry.lastName || ''}`).trim()
          if (name && selectedAgentName && String(name).toLowerCase().includes(selectedAgentName)) return true
          if (entry.email && String(entry.email).toLowerCase() === String(selectedAgentId).toLowerCase()) return true
          return false
        }
        const s = String(entry).trim()
        if (!s) return false
        if (s === selectedAgentId) return true
        if (selectedAgentName && s.toLowerCase().includes(selectedAgentName)) return true
        // check mapping tables
        if (agentMap && (agentMap[s] || agentMap[s.toLowerCase()])) {
          const mappedName = String(agentMap[s] || agentMap[s.toLowerCase()]).toLowerCase()
          if (selectedAgentName && mappedName.includes(selectedAgentName)) return true
        }
        const digits = s.replace(/[^0-9]/g, '')
        if (digits && agentByNumberMap && (agentByNumberMap[digits] || agentByNumberMap[s])) {
          const mapped = String(agentByNumberMap[digits] || agentByNumberMap[s]).toLowerCase()
          if (selectedAgentName && mapped.includes(selectedAgentName)) return true
        }
        return false
      }

      const found = (agentsArr || []).some(matchesAgent)
      if (!found) matches = false
    }

    // callTypeFilter removed: rely on `activeFilter` for call type/status filtering

    // dateFrom / dateTo client-side filtering
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
        // Prefer the unified call-logs download URL for non-absolute inputs
        fetchUrl = buildRecordingApiUrl(recordingUrl)
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
    // Stop the modal audio element (if any).
    try {
      if (audioRef.current) {
        try { audioRef.current.pause() } catch (e) {}
        try { audioRef.current.currentTime = 0 } catch (e) {}
        try { audioRef.current.src = '' } catch (e) {}
      }
    } catch (e) {}
    // Stop the inline-row audio element (the one rendered below the
    // call-log row). This was previously NOT stopped explicitly, so
    // even after the UI showed "Play", the audio kept playing in
    // memory until React unmounted the element.
    try {
      if (inlineAudioRef.current) {
        try { inlineAudioRef.current.pause() } catch (e) {}
        try { inlineAudioRef.current.currentTime = 0 } catch (e) {}
        try { inlineAudioRef.current.src = '' } catch (e) {}
        try { inlineAudioRef.current.load() } catch (e) {}
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
    // Safety net — pause every <audio> element on the page. Belt and
    // braces in case the recording is playing through some element we
    // don't hold a ref to (modal reopen, multiple rows etc).
    try {
      document.querySelectorAll('audio').forEach((el) => {
        try { el.pause() } catch (e) {}
        try { el.currentTime = 0 } catch (e) {}
      })
    } catch (e) {}
    // Free the blob URL so the browser truly drops the audio data.
    try {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl)
        setAudioBlobUrl(null)
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
        const downloadUrl = buildRecordingApiUrl(filename)

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

  // Talk-time only — counts from when the customer picked up. For
  // ANSWERED calls we read callDuration (Asterisk's BillableSeconds);
  // for non-answered statuses (busy, not-answered, missed) we show 0
  // because no real conversation happened.
  const computeDisplayDuration = (log) => {
    if (!log) return 0
    const billable = Number(log.callDuration) || 0
    const total = Number(log.duration) || 0
    const status = String(log.status || '').toLowerCase()
    const answered = status === 'answered' || status === 'completed' || status === 'connected'
    if (answered) {
      if (billable > 0) return billable
      if (total > 0) return total
      return 0
    }
    return billable
  }

  const formatDuration = (duration) => {
    if (!duration) return '00:00'

    const seconds = parseInt(duration)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Map column key to CSV cell value
  const getColumnValue = (colKey, log, idx) => {
    switch (colKey) {
      case 'sno': return idx + 1
      case 'type': return log.callType || log.type || ''
      case 'date': return formatDate(log.callDate || log.createdAt)
      case 'initiated_by': 
        // Return phone number (contact) first, fallback to callInitiatedBy
        return log.contact || log.callInitiatedBy || ''
      case 'received_by': 
        // Extract agent names/emails from agents array
        {
          let agents = []
          if (Array.isArray(log.agents) && log.agents.length) agents = log.agents
          else if (log.agent) agents = [log.agent]
          else if (Array.isArray(log.callReceivedBy)) agents = log.callReceivedBy
          else if (log.callReceivedBy && typeof log.callReceivedBy === 'string') agents = [log.callReceivedBy]
          
          const agentDisplays = (agents || []).map(a => {
            if (!a) return ''
            if (typeof a === 'object') {
              // Try to get name first
              const name = a.name || a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
              if (name) return name
              // Fall back to email or ID
              if (a.email && agentMap && (agentMap[a.email] || agentMap[a.email.toLowerCase()])) return agentMap[a.email] || agentMap[a.email.toLowerCase()]
              if (a._id && agentMap && agentMap[a._id]) return agentMap[a._id]
              return a.email || a._id || a.phone || ''
            }
            const s = String(a).trim()
            // Try exact lookup
            if (agentMap && (agentMap[s] || agentMap[s.toLowerCase()])) return agentMap[s] || agentMap[s.toLowerCase()]
            // Try numeric lookup
            const digits = s.replace(/[^0-9]/g, '')
            if (digits && agentByNumberMap && (agentByNumberMap[digits] || agentByNumberMap[s])) return agentByNumberMap[digits] || agentByNumberMap[s]
            return s
          }).filter(Boolean)
          
          const unique = Array.from(new Set(agentDisplays))
          return unique.length ? unique.join(', ') : (log.callReceivedBy || '')
        }
      case 'rejected_by': return log.callRejectedBy || ''
      case 'team': return log.team || ''
      case 'hangup_by': return log.hangUpBy || log.hangupBy || ''
      // Talk-time only for ANSWERED calls. For Busy / Not-Answered /
      // Missed / Failed the call never connected, so ring-time is NOT
      // duration — show 00:00. Answered calls fall back to the total
      // duration when BillableSeconds was missed by Asterisk.
      case 'duration': {
        const s = String(log.status || '').toLowerCase()
        const answered = s === 'answered' || s === 'completed' || s === 'connected'
        return formatDuration(computeDisplayDuration(log))
      }
      case 'cost': return log.cost != null ? Number(log.cost).toFixed(2) : ''
      case 'notes': return log.notes || log.notebyagent || ''
      case 'status': return formatCallStatus(log.status)
      case 'virtual_number': return log.virtualNumber || ''
      case 'contact': return log.contact || log.callInitiatedBy || ''
      default: return ''
    }
  }

    const applyColumns = () => {
      try {
        localStorage.setItem('callLogsSelectedColumns', JSON.stringify(selectedColumns || []))
      } catch (e) {}
      setShowColumnsModal(false)
    }

  // Export all call logs as CSV (spreadsheet-friendly)
  const exportAllCallLogs = async () => {
    if (!businessId) {
      alert('Business ID not available yet. Please try again.')
      return
    }
    setExporting(true)
    try {
      const requestingAllFiltered = Boolean(dateFrom || dateTo || (agentFilter && agentFilter !== 'all') || (statusFilter && statusFilter === 'missed'))
      const limit = 100 // Use reasonable page size (API may not support 1000)
      let logs = []
      let totalFetched = 0

      console.log('=== EXPORT START ===')
      console.log('Filters:', { activeFilter, dateFrom, dateTo, searchTerm })
      console.log('Selected Columns:', selectedColumns)

      // Always use sequential fetching for consistency
      let page = 1
      const maxRecordsCap = requestingAllFiltered ? 5000 : 10000
      const maxPages = Math.ceil(maxRecordsCap / limit)
      const fromTs = dateFrom ? parseLocalDate(dateFrom, false) : null
      const toTs = dateTo ? parseLocalDate(dateTo, true) : null

      console.log(`Starting export: filters=${requestingAllFiltered ? 'yes' : 'no'}, maxRecords=${maxRecordsCap}, limit=${limit}`)

      while (true) {
        const pageEndpoint = buildLogsEndpoint(page, limit)
        console.log(`Fetching page ${page}:`, pageEndpoint)
        
        const res = await apiCall(pageEndpoint, 'GET')
        let pageLogs = []
        
        // Extract logs from various response formats
        if (Array.isArray(res)) {
          pageLogs = res
        } else if (res && Array.isArray(res.data)) {
          pageLogs = res.data
        } else if (res && Array.isArray(res.callLogs)) {
          pageLogs = res.callLogs
        } else {
          pageLogs = []
        }

        console.log(`Page ${page}: received ${pageLogs.length} records`)

        if (pageLogs.length === 0) {
          console.log(`Page ${page}: empty response, stopping`)
          break
        }

        // Apply client-side date filtering if needed
        if (requestingAllFiltered && (fromTs !== null || toTs !== null)) {
          const beforeFilter = pageLogs.length
          pageLogs = pageLogs.filter(l => {
            const t = new Date(l.callDate || l.createdAt).getTime()
            if (Number.isNaN(t)) return false
            if (fromTs !== null && t < fromTs) return false
            if (toTs !== null && t > toTs) return false
            return true
          })
          console.log(`Page ${page}: date filter: ${beforeFilter} → ${pageLogs.length} records`)
        }

        // Apply client-side status filter if needed
        if (requestingAllFiltered && statusFilter && statusFilter !== 'all') {
          const sf = String(statusFilter).toLowerCase()
          const before = pageLogs.length
          pageLogs = pageLogs.filter(l => {
            const s = String(l.status || '').toLowerCase()
            if (sf === 'missed') {
              return s.includes('miss') || s.includes('unanswer') || s.includes('no_answer') || String(l.hangupby || '').toLowerCase() === 'caller' || String(l.hangUpBy || '').toLowerCase() === 'caller'
            }
            return (s === sf || s.includes(sf) || formatCallStatus(s).toLowerCase() === sf)
          })
          console.log(`Page ${page}: status filter (${statusFilter}): ${before} → ${pageLogs.length} records`)
        }

        // Apply client-side agent filter if needed
        if (requestingAllFiltered && agentFilter && agentFilter !== 'all') {
          const selectedAgentId = String(agentFilter)
          const selectedAgentOption = (agentOptions || []).find(o => String(o.id) === selectedAgentId)
          const selectedAgentName = selectedAgentOption ? String(selectedAgentOption.name).toLowerCase() : (agentMap && (agentMap[selectedAgentId] || agentMap[String(selectedAgentId).toLowerCase()]) ? String(agentMap[selectedAgentId] || agentMap[String(selectedAgentId).toLowerCase()]).toLowerCase() : null)
          const before = pageLogs.length
          pageLogs = pageLogs.filter(l => {
            let agentsArr = []
            if (Array.isArray(l.agents) && l.agents.length) agentsArr = l.agents
            else if (l.agent) agentsArr = [l.agent]
            else if (Array.isArray(l.callReceivedBy)) agentsArr = l.callReceivedBy
            else if (l.callReceivedBy && typeof l.callReceivedBy === 'string') agentsArr = [l.callReceivedBy]
            else agentsArr = []

            const check = (entry) => {
              if (!entry) return false
              if (typeof entry === 'object') {
                const id = String(entry._id || entry.id || entry.email || '')
                if (id && id === selectedAgentId) return true
                const name = (entry.name || entry.fullName || `${entry.firstName || ''} ${entry.lastName || ''}`).trim()
                if (name && selectedAgentName && String(name).toLowerCase().includes(selectedAgentName)) return true
                if (entry.email && String(entry.email).toLowerCase() === String(selectedAgentId).toLowerCase()) return true
                return false
              }
              const s = String(entry).trim()
              if (!s) return false
              if (s === selectedAgentId) return true
              if (selectedAgentName && s.toLowerCase().includes(selectedAgentName)) return true
              if (agentMap && (agentMap[s] || agentMap[s.toLowerCase()])) {
                const mappedName = String(agentMap[s] || agentMap[s.toLowerCase()]).toLowerCase()
                if (selectedAgentName && mappedName.includes(selectedAgentName)) return true
              }
              const digits = s.replace(/[^0-9]/g, '')
              if (digits && agentByNumberMap && (agentByNumberMap[digits] || agentByNumberMap[s])) {
                const mapped = String(agentByNumberMap[digits] || agentByNumberMap[s]).toLowerCase()
                if (selectedAgentName && mapped.includes(selectedAgentName)) return true
              }
              return false
            }

            return (agentsArr || []).some(check)
          })
          console.log(`Page ${page}: agent filter: ${before} → ${pageLogs.length} records`)
        }

        if (pageLogs.length > 0) {
          logs = logs.concat(pageLogs)
          totalFetched += pageLogs.length
          console.log(`Page ${page}: total collected so far: ${logs.length}`)
        }

        // Stop if this page had fewer records than limit (last page)
        if (pageLogs.length < limit) {
          console.log(`Page ${page}: returned ${pageLogs.length} < ${limit}, this is last page`)
          break
        }

        page += 1
        if (page > maxPages) {
          console.warn(`Reached max pages cap (${maxPages}), stopping`)
          break
        }
      }

      console.log(`Export complete: fetched ${totalFetched} raw records, after filtering: ${logs.length}`)

      if (!logs || logs.length === 0) {
        alert('No call logs available to export')
        setExporting(false)
        return
      }

      // Prepare CSV headers using selected columns
      const headers = (selectedColumns && selectedColumns.length > 0)
        ? selectedColumns.map(k => {
            const m = columnsAvailable.find(c => (c.key || c) === k)
            return (m && m.label) ? m.label : (typeof k === 'string' ? k : String(k))
          })
        : columnsAvailable.map(c => c.label)

      console.log(`CSV Headers (${headers.length}):`, headers)

      const csvRows = []
      csvRows.push(headers.map(h => csvEscape(h)).join(','))

      logs.forEach((log, idx) => {
        let row
        if (selectedColumns && selectedColumns.length > 0) {
          row = selectedColumns.map(colKey => csvEscape(getColumnValue(colKey, log, idx)))
        } else {
          // Default columns in order
          row = [
            idx + 1,
            csvEscape(log.callType || ''),
            csvEscape(formatDate(log.callDate || log.createdAt)),
            csvEscape(log.callInitiatedBy || ''),
            csvEscape(log.callReceivedBy || ''),
            csvEscape(log.callRejectedBy || ''),
            csvEscape(log.team || ''),
            csvEscape(log.hangUpBy || ''),
            csvEscape((() => {
              const s = String(log.status || '').toLowerCase()
              const answered = s === 'answered' || s === 'completed' || s === 'connected'
              return formatDuration(computeDisplayDuration(log))
            })()),
            csvEscape(log.cost != null ? Number(log.cost).toFixed(2) : ''),
            csvEscape(log.notes || log.notebyagent || ''),
            csvEscape(formatCallStatus(log.status)),
            csvEscape(log.virtualNumber || ''),
            csvEscape(log.contact || ''),
          ]
        }
        csvRows.push(row.join(','))
      })

      console.log(`CSV Rows: ${csvRows.length} total (1 header + ${logs.length} data rows)`)
      console.log(`First data row sample:`, csvRows[1])

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

      console.log(`Export successful: ${fname} (${(blob.size / 1024).toFixed(2)} KB)`)
      alert(`Export successful! ${logs.length} records exported.`)
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export failed: ${err.message}`)
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
    <Box className="page-container" sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title={
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>Call Logs</Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>View and manage detailed call records</Typography>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={openDateModal}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap', height: '40px', display: 'flex', alignItems: 'center' }}
            >
              {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Date range'}
            </Button>

            <TextField
              placeholder="Search"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ cursor: 'pointer', color: '#6c5ce7' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              size="small"
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value); setCurrentPage(1) }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Directions</MenuItem>
              <MenuItem value="outbound">Outbound</MenuItem>
              <MenuItem value="inbound">Inbound</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="answered">Answered</MenuItem>
              <MenuItem value="missed">Missed</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
              <MenuItem value="not-answered">Not Answered</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={agentFilter}
              onChange={e => { setAgentFilter(e.target.value); setCurrentPage(1) }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Agents</MenuItem>
              {(agentOptions || []).map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={exportAllCallLogs}
                disabled={exporting}
                title={exporting ? 'Exporting...' : 'Export call logs'}
                sx={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset', p: 0 }}
              >
                {exporting ? <CircularProgress size={18} /> : <GetAppIcon />}
              </Button>
              <Button
                variant={autoRefresh ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setAutoRefresh(prev => {
                    const next = !prev
                    if (next) setRefreshTrigger(t => t + 1)
                    return next
                  })
                }}
                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                sx={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset', p: 0 }}
              >
                <RefreshIcon sx={{ animation: autoRefresh ? 'spin 1s linear infinite' : 'none' }} />
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowColumnsModal(true)}
                title="Customize columns"
                sx={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset', p: 0 }}
              >
                <MoreVertIcon />
              </Button>
            </Box>
          </Box>

          {/* Table Section */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : clientFilteredCallLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#6c757d' }}>
              <Typography>No call logs found</Typography>
              <Typography variant="body2">There are no call logs matching your search criteria.</Typography>
            </Box>
          ) : (
            <Paper variant="outlined" className="calllogs-table-container">
              <Table size="small" sx={{ '& th, & td': { py: 1, px: 1.5 } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Customer No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>DID No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Agents</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Recording</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCallLogs.map((log, index) => {
                    const callDate = formatDate(log.callDate || log.createdAt);
                    const callType = String((log.callType || log.type || '').toLowerCase())
                    const isIncoming = callType === 'inbound' || callType === 'incoming'
                    const isMissed = (log.status || '').toLowerCase().includes('miss') || (log.hangupby || '').toLowerCase() === 'caller'
                    const _statusLc = String(log.status || '').toLowerCase();
                    const _isAnswered = _statusLc === 'answered' || _statusLc === 'completed' || _statusLc === 'connected';
                    const duration = formatDuration(computeDisplayDuration(log));
                    const callId = log.callId || log.call_id || log._id || '';
                    const solution = log.solution || log.callType || '';
                    let agents = []
                    if (Array.isArray(log.agents) && log.agents.length) agents = log.agents
                    else if (log.agent) agents = [log.agent]
                    else if (Array.isArray(log.callReceivedBy)) agents = log.callReceivedBy
                    else if (log.callReceivedBy) agents = [log.callReceivedBy]
                    else if (log.callReceivedByString) agents = [log.callReceivedByString]
                    else agents = []
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
                    <React.Fragment key={log._id || index}>
                    <TableRow hover>
                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: (() => {
                                if (log.status === 'missed') return '#ffebee'
                                if (log.status === 'answered') return '#f1f8e9'
                                if (log.status === 'busy') return '#e3f2fd'
                                if (log.status === 'not-answered') return '#fff3e0'
                                if (log.status === 'failed') return '#fff3f3'
                                if (log.status === 'ringing') return '#eef7ff'
                                return '#f5f5f5'
                              })(),
                              color: (() => {
                                if (log.status === 'missed') return '#d32f2f'
                                if (log.status === 'answered') return '#388e3c'
                                if (log.status === 'busy') return '#1976d2'
                                if (log.status === 'not-answered') return '#f57c00'
                                if (log.status === 'failed') return '#d32f2f'
                                if (log.status === 'ringing') return '#0288d1'
                                return '#6b7280'
                              })(),
                            }}
                          >
                            {isMissed ? (
                              <CallMissedIcon fontSize="small" />
                            ) : isIncoming ? (
                              <CallReceivedIcon fontSize="small" />
                            ) : (
                              <CallMakeIcon fontSize="small" />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.contact || log.callInitiatedBy || '—'}</Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>{callDate}</Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>{log.virtualNumber || '—'}</TableCell>

                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>{duration}</TableCell>

                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>{solution}</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {(() => {
                            const isMissed = log.status === 'missed'
                            const isAnswered = log.status === 'answered'
                            const isBusy = log.status === 'busy'
                            const isNotAnswered = log.status === 'not-answered'
                            const isFailed = log.status === 'failed'
                            const isRinging = log.status === 'ringing'
                            const isIncoming = log.callType === 'inbound' || log.callType === 'Inbound'
                            const isOutgoing = log.callType === 'outbound' || log.callType === 'Outbound'
                            
                            // Determine color based on status
                            let statusColor = '#6b7280' // default gray
                            if (isMissed) statusColor = '#d32f2f' // red
                            else if (isFailed) statusColor = '#d32f2f' // failed -> red
                            else if (isAnswered) statusColor = '#388e3c' // green
                            else if (isBusy) statusColor = '#1976d2' // blue
                            else if (isRinging) statusColor = '#0288d1' // ringing -> info blue
                            else if (isNotAnswered) statusColor = '#f57c00' // orange
                            
                            // Determine icon based on call direction
                            if (isIncoming) {
                              return <CallReceivedIcon sx={{ color: statusColor, fontSize: 20 }} />
                            } else if (isOutgoing) {
                              return <CallMakeIcon sx={{ color: statusColor, fontSize: 20 }} />
                            }
                            return null
                          })()}
                          <Chip 
                            label={formatCallStatus(log.status)} 
                            size="small"
                            color={log.status === 'missed' ? 'error' : log.status === 'failed' ? 'error' : log.status === 'answered' ? 'success' : log.status === 'busy' ? 'primary' : log.status === 'ringing' ? 'info' : log.status === 'not-answered' ? 'warning' : 'default'}
                            variant={(log.status === 'missed' || log.status === 'failed' || log.status === 'answered' || log.status === 'busy' || log.status === 'not-answered' || log.status === 'ringing') ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>
                        {(() => {
                          const agentDisplays = (agents || []).map(a => {
                            if (!a) return ''
                            if (typeof a === 'object') {
                              const name = a.name || a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
                              if (name) return name
                              if (a.email && agentMap && (agentMap[a.email] || agentMap[a.email.toLowerCase()])) return agentMap[a.email] || agentMap[a.email.toLowerCase()]
                              if (a._id && agentMap && agentMap[a._id]) return agentMap[a._id]
                              return a.email || a._id || ''
                            }
                            const s = String(a).trim()
                            if (s && (s === String(log.contact || '') || s === String(log.callInitiatedBy || ''))) return ''
                            if (agentMap && (agentMap[s] || agentMap[s.toLowerCase()])) return agentMap[s] || agentMap[s.toLowerCase()]
                            const digits = s.replace(/[^0-9]/g, '')
                            if (digits && agentByNumberMap && (agentByNumberMap[digits] || agentByNumberMap[s])) return agentByNumberMap[digits] || agentByNumberMap[s]
                            if (s.includes('@')) return (agentMap && (agentMap[s] || agentMap[s.toLowerCase()])) || s
                            return s
                          }).filter(Boolean)
                          const unique = Array.from(new Set(agentDisplays))
                          return <Typography variant="body2">{unique.length ? unique.join(', ') : '—'}</Typography>
                        })()}
                      </TableCell>

                      <TableCell sx={{ py: 1, fontSize: '0.9rem' }}>
                        {log.status === 'missed' || log.status === 'busy' || log.status === 'not-answered' || log.status === 'failed' || log.status === 'ringing' ? (
                          <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>No recording available</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            {(() => {
                              const rowKey = log._id || callId || index
                              const rowUrl = recording ? buildRecordingApiUrl(recording) : (matchedFiles && matchedFiles[0] ? buildRecordingApiUrl(matchedFiles[0]) : null)
                              const isPlayingRow = playingId === String(rowKey)
                              return (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!rowUrl) return
                                    if (isPlayingRow) handleStopPlayback()
                                    else handlePlayRecording(rowUrl, rowKey)
                                  }}
                                  disabled={!rowUrl}
                                  startIcon={recordingLoading && isPlayingRow ? <CircularProgress size={16} /> : (isPlayingRow ? <StopIcon /> : <PlayArrowIcon />)}
                                  sx={{ minWidth: 'auto', textTransform: 'none', fontSize: '0.8rem' }}
                                >
                                  {recordingLoading && isPlayingRow ? 'Loading' : (isPlayingRow ? 'Stop' : 'Play')}
                                </Button>
                              )
                            })()}

                            {(() => {
                              const fname = recording && String(recording).split('/').pop() || (matchedFiles && matchedFiles[0])
                              const rowUrl = recording ? buildRecordingApiUrl(recording) : (matchedFiles && matchedFiles[0] ? buildRecordingApiUrl(matchedFiles[0]) : null)
                              const downloadKey = fname || rowUrl
                              const isDownloading = Boolean(downloadLoadingMap && downloadKey && downloadLoadingMap[String(downloadKey)])
                              return (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!rowUrl) return
                                    handleDownloadRecording(rowUrl, fname)
                                  }}
                                  disabled={!rowUrl || isDownloading}
                                  startIcon={isDownloading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                                  sx={{ minWidth: 'auto', textTransform: 'none', fontSize: '0.8rem' }}
                                >
                                  {isDownloading ? 'Saving' : 'Download'}
                                </Button>
                              )
                            })()}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Inline audio player — appears below the row when
                        Play is clicked. Native controls so the agent can
                        scrub through the recording. */}
                    {(() => {
                      const rowKey = log._id || callId || index
                      const isThisRowPlaying = playingId === String(rowKey) && audioBlobUrl
                      if (!isThisRowPlaying) return null
                      return (
                        <TableRow>
                          <TableCell colSpan={20} sx={{ bgcolor: '#f9fafb', py: 1.5 }}>
                            <audio
                              ref={inlineAudioRef}
                              controls
                              autoPlay
                              src={audioBlobUrl}
                              style={{ width: '100%' }}
                              onEnded={handleStopPlayback}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })()}
                  </React.Fragment>
                  )
                })}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Pagination */}
          {effectiveTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={effectiveTotalPages}
                page={currentPage}
                onChange={(e, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

        {/* Customize Columns Modal */}
        <Dialog open={showColumnsModal} onClose={() => setShowColumnsModal(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Customize Columns</DialogTitle>
          <DialogContent>
            <div className="d-flex flex-column" style={{gap:8}}>
              <div>
                <strong>Preview (first 3 rows):</strong>
                <div className="mt-2" style={{overflowX:'auto'}}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        {(selectedColumns && selectedColumns.length ? selectedColumns : (columnsAvailable||[]).map(c=> (c.key||c))).map((k) => {
                          const m = (columnsAvailable||[]).find(cc => (cc.key||cc) === k)
                          return <th key={k}>{(m && m.label) ? m.label : String(k)}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {(clientFilteredCallLogs || []).slice(0,3).map((log, ridx) => (
                        <tr key={ridx}>
                          {(selectedColumns && selectedColumns.length ? selectedColumns : (columnsAvailable||[]).map(c=> (c.key||c))).map((k) => (
                            <td key={k} style={{whiteSpace:'nowrap',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{String(getColumnValue(k, log, ridx) || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(Array.isArray(columnsAvailable) ? columnsAvailable : []).map((c, i) => {
                const key = (typeof c === 'string') ? c : c.key
                const label = (typeof c === 'string') ? c : c.label || c.key
                const checked = selectedColumns && selectedColumns.indexOf(key) !== -1
                return (
                  <FormControlLabel
                    key={key}
                    label={label}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedColumns(s => Array.from(new Set([...(s||[]), key])))
                          else setSelectedColumns(s => (s||[]).filter(x=>x!==key))
                        }}
                      />
                    }
                  />
                )
              })}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setSelectedColumns((columnsAvailable||[]).map(c => (c.key || c))); }}>Select All</Button>
            <Button onClick={() => { setSelectedColumns([]); }}>Clear All</Button>
            <Button onClick={() => applyColumns()} variant="contained">Apply</Button>
            <Button onClick={() => setShowColumnsModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>

      {/* Recording Modal */}
      <Dialog 
        open={showModal} 
        onClose={() => {
          setShowModal(false);
          if (audioBlobUrl) { try { URL.revokeObjectURL(audioBlobUrl); } catch(e){}; setAudioBlobUrl(null); }
          setRecordingMimeType(null);
          setRecordingError(null);
          setRecordingLoading(false);
          setRecordingInfo(null);
          try { stopWebAudio() } catch(e){}
          try { if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null } } catch(e){}
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Call Recording - {selectedLog ? formatDate(selectedLog.callDate || selectedLog.createdAt) : ''}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {selectedLog && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Call Details:</Typography>
                <Typography variant="body2">Type: {selectedLog.callType || 'Unknown'}</Typography>
                <Typography variant="body2">Initiated By: {selectedLog.callInitiatedBy || 'Unknown'}</Typography>
                <Typography variant="body2">Received By: {selectedLog.callReceivedBy || 'N/A'}</Typography>
                <Typography variant="body2">Rejected By: {selectedLog.callRejectedBy || 'N/A'}</Typography>
                <Typography variant="body2">Team: {selectedLog.team || 'N/A'}</Typography>
                <Typography variant="body2">Hang Up By: {selectedLog.hangUpBy || 'Unknown'}</Typography>
                <Typography variant="body2">Duration: {(() => {
                  const s = String(selectedLog.status || '').toLowerCase();
                  const answered = s === 'answered' || s === 'completed' || s === 'connected';
                  return formatDuration(computeDisplayDuration(selectedLog));
                })()}</Typography>
                <Typography variant="body2">Cost: {selectedLog.cost != null ? `$${Number(selectedLog.cost).toFixed(2)}` : 'N/A'}</Typography>
                <Typography variant="body2">Status: {formatCallStatus(selectedLog.status)}</Typography>
                <Typography variant="body2">Notes: {selectedLog.notes || selectedLog.notebyagent || 'N/A'}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Recording Options:</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  {selectedLog.callRecording ? (
                    <>
                      {(() => {
                        const modalPlayKey = selectedLog._id ? String(selectedLog._id) : `modal-${selectedLog.callId || 'sel'}`
                        const isPlayingModal = playingId === String(modalPlayKey)
                        return (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={recordingLoading && isPlayingModal ? <CircularProgress size={20} sx={{ mr: 1 }} /> : (isPlayingModal ? <StopIcon /> : <PlayArrowIcon />)}
                            onClick={() => {
                              if (isPlayingModal) handleStopPlayback()
                              else handlePlayRecording(selectedLog.callRecording, modalPlayKey)
                            }}
                          >
                            {recordingLoading && isPlayingModal ? 'Loading...' : (isPlayingModal ? 'Stop' : 'Play Recording')}
                          </Button>
                        )
                      })()}
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={downloadLoadingMap && downloadLoadingMap[`call-recording-${selectedLog._id}.mp3`] ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                        onClick={() => handleDownloadRecording(
                          selectedLog.callRecording,
                          `call-recording-${selectedLog._id}.mp3`
                        )}
                        disabled={Boolean(downloadLoadingMap && downloadLoadingMap[`call-recording-${selectedLog._id}.mp3`])}
                      >
                        {downloadLoadingMap && downloadLoadingMap[`call-recording-${selectedLog._id}.mp3`] ? 'Downloading...' : 'Download Recording'}
                      </Button>
                    </>
                  ) : (
                    // ...existing code for alternate recordings...
                    (() => {
                      const vn = String(selectedLog.virtualNumber || '').replace(/[^0-9]/g, '')
                      const contactNum = String(selectedLog.contact || '').replace(/[^0-9]/g, '')
                      if ((!vn || !contactNum) || audioFiles.length === 0) return <Typography color="textSecondary">No recording available for this call.</Typography>

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
                          <Box>
                            <Typography color="textSecondary">No recording available for this call.</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Button size="small" color="inherit" onClick={() => fetchAudioFiles()}>
                                Refresh recordings ({audioLoading ? '...' : (audioFiles.length)})
                              </Button>
                            </Box>
                          </Box>
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
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2 }}>Available recordings:</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {strictMatches.map((fname, i) => {
                              const fileUrl = buildRecordingApiUrl(fname);
                              return (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                  <Typography sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fname}>{fname}</Typography>
                                        {(() => {
                                          const modalKey = `modal-${fname}`
                                          const isPlaying = playingId === String(modalKey)
                                          return (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="primary"
                                              startIcon={recordingLoading && isPlaying ? <CircularProgress size={16} /> : (isPlaying ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />)}
                                              onClick={() => {
                                                if (isPlaying) handleStopPlayback()
                                                else handlePlayRecording(fileUrl, modalKey)
                                              }}
                                            />
                                          )
                                        })()}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={downloadLoadingMap && downloadLoadingMap[fname] ? <CircularProgress size={16} /> : <FileDownloadIcon fontSize="small" />}
                                    onClick={() => handleDownloadRecording(fileUrl, fname)}
                                    disabled={Boolean(downloadLoadingMap && downloadLoadingMap[fname])}
                                  >
                                    {downloadLoadingMap && downloadLoadingMap[fname] ? 'DL' : 'DL'}
                                  </Button>
                                </Box>
                              )
                            })}
                          </Box>
                        </Box>
                      )
                    })()
                  )}
                </Box>
                {recordingLoading && (
                  <Box sx={{ mt: 3 }}>Loading recording...</Box>
                )}
                {recordingError && (
                  <Box sx={{ mt: 3, color: 'error.main' }}>{recordingError}</Box>
                )}
                  {recordingInfo && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                      Response: {recordingInfo.status} • Type: {recordingInfo.contentType} • Size: {Math.round((recordingInfo.size||0)/1024)} KB
                    </Typography>
                  )}
                {audioBlobUrl && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Button size="small" variant="outlined" color="info" onClick={() => window.open(audioBlobUrl, '_blank')}>Open in new tab</Button>
                      <Button size="small" variant="outlined" onClick={() => {
                        const a = document.createElement('a')
                        a.href = audioBlobUrl
                        a.download = `recording.${(recordingMimeType && recordingMimeType.includes('wav')) ? 'wav' : 'mp3'}`
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                      }}>Download (debug)</Button>
                      {audioCtxPlaying ? (
                        <Button size="small" variant="outlined" color="error" onClick={() => stopWebAudio()}>Stop WebAudio</Button>
                      ) : null}
                    </Box>
                    <Box component="audio" controls ref={audioRef} autoPlay={true} sx={{ width: '100%' }}>
                      <source src={audioBlobUrl} type={recordingMimeType || 'audio/mpeg'} />
                      Your browser does not support the audio element.
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
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
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Range Modal (Quick Actions + Dual Calendar) */}
      <Dialog open={showDateModal} onClose={() => setShowDateModal(false)} maxWidth="lg" fullWidth>
        <Card sx={{ m: 2 }}>
          <CardHeader
            title="Select Date Range"
            subheader="Choose dates and times for filtering call logs"
          />
          <CardContent sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>Quick Actions</Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {['Last 1 hour','Today','Last 24 hour','Yesterday','This Week','Last 7 days','Last 30 days','Last Month','This Month'].map((q) => (
                  <Box component="li" key={q} sx={{ mb: 0.5 }}>
                    <Button
                      type="button"
                      size="small"
                      fullWidth
                      variant="text"
                      onClick={() => applyQuickRange(q)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', color: '#1565c0' }}
                    >
                      {q}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>From</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedFromDate ? selectedFromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>{selectedFromTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>To</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {selectedToDate ? selectedToDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>{selectedToTime}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>Start Date & Time</Typography>
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
                    <TextField
                      type="time"
                      value={selectedFromTime}
                      onChange={e=>setSelectedFromTime(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                      inputProps={{ style: { cursor: 'pointer' } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>End Date & Time</Typography>
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
                  <TextField
                    type="time"
                    value={selectedToTime}
                    onChange={e=>setSelectedToTime(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                    inputProps={{ style: { cursor: 'pointer' } }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
          </CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2, borderTop: '1px solid #e5e7eb' }}>
            <Button
              variant="outlined"
              onClick={() => setShowDateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setDateFrom(selectedFromDate ? formatDateInput(selectedFromDate) : '')
                setDateTo(selectedToDate ? formatDateInput(selectedToDate) : '')
                setShowDateModal(false)
                setCurrentPage(1)
              }}
            >
              Apply Filter
            </Button>
          </Box>
        </Card>
      </Dialog>
      {/* Filters moved inline; modal removed */}
      {/* Notes Modal (notepad) */}
      <Dialog open={showNotesModal} onClose={() => setShowNotesModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notes</DialogTitle>
        <DialogContent sx={{ maxHeight: '50vh', overflowY: 'auto', py: 2 }}>
          <Box>
            <textarea
              readOnly
              value={notesContent}
              rows={12}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '10px', borderRadius: 4, border: '1px solid #ddd', background: '#fffef6' }}
            />
            {(!notesContent || String(notesContent).trim() === '') && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>No notes available for this call.</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button color="inherit" onClick={() => setShowNotesModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CallLogs