import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material'
import GetAppIcon from '@mui/icons-material/GetApp'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import { apiCall } from '../../config/api'
import '../Leads/CallLogsWebpage.css'

const CallUses = () => {
  const [userId, setUserId] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [logsPage, setLogsPage] = useState(1)
  const [logsLimit, setLogsLimit] = useState(20)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [callType, setCallType] = useState('All')
  const [status, setStatus] = useState('All')
  const [availableAgents, setAvailableAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [callUses, setCallUses] = useState([])
  const [callUsesCount, setCallUsesCount] = useState(0)
  const [callLogs, setCallLogs] = useState([])
  const [callLogsCount, setCallLogsCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    // try to prefill businessId & userId from current user details when available
    const tryPrefill = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u._id) setUserId(u._id)
        if (u && u.businessId) setBusinessId(u.businessId)
      } catch (err) {
        // ignore prefill errors
      }
    }
    tryPrefill()
  }, [])

  // Fetch available agents for the business once we have businessId
  useEffect(() => {
    const fetchAgents = async () => {
      if (!businessId) return
      setAgentsLoading(true)
      try {
        // Branches endpoint returns branches with their manager/user info. Reuse same approach as Branches component.
        const res = await apiCall(`/branch/${businessId}/branches`, 'GET')
        let list = []
        // possible response shapes: res.data (array), res.branches, or raw array
        if (Array.isArray(res)) list = res
        else if (Array.isArray(res.data)) list = res.data
        else if (Array.isArray(res.branches)) list = res.branches
        else list = []

        // Extract agent info from branch.user where available
        const agents = []
        list.forEach((branch) => {
          const u = branch.user || branch.manager || null
          if (u && (u._id || u.id)) {
            agents.push({
              _id: u._id || u.id,
              name: u.name || u.fullName || u.email || branch.branchName || `Agent ${u._id || u.id}`,
              email: u.email || '',
            })
          }
        })
        // Deduplicate by _id
        const dedup = {}
        const uniqueAgents = agents.filter((a) => {
          if (!a._id) return false
          if (dedup[a._id]) return false
          dedup[a._id] = true
          return true
        })
        setAvailableAgents(uniqueAgents)
      } catch (err) {
        console.error('Failed to fetch agents for business', err)
        setAvailableAgents([])
      } finally {
        setAgentsLoading(false)
      }
    }
    fetchAgents()
  }, [businessId])

  const fetchData = async (opts = {}) => {
    setError(null)
    if (!userId) {
      setError('Please provide an agent User ID')
      return
    }
    // ensure we have businessId from current user details (do not ask the user for it)
    if (!businessId) {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u.businessId) setBusinessId(u.businessId)
        else {
          setError('Business ID not found for current user. Please ensure you are logged in.')
          return
        }
      } catch (err) {
        setError('Unable to determine business id from current user details')
        return
      }
    }
    setLoading(true)
    try {
      // Build query params with optional filters. Use opts to allow immediate page/limit overrides
      const page = typeof opts.page !== 'undefined' ? opts.page : logsPage
      const limit = typeof opts.limit !== 'undefined' ? opts.limit : logsLimit

      const params = []
      params.push(`businessId=${encodeURIComponent(businessId)}`)
      params.push(`logsPage=${encodeURIComponent(page)}`)
      params.push(`logsLimit=${encodeURIComponent(limit)}`)
      if (dateFrom) params.push(`from=${encodeURIComponent(dateFrom)}`)
      if (dateTo) params.push(`to=${encodeURIComponent(dateTo)}`)
      if (callType && callType !== 'All') {
        const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType
        // send common variants to increase compatibility with backend implementations
        params.push(`callType=${encodeURIComponent(mapped)}`)
        params.push(`type=${encodeURIComponent(mapped)}`)
        params.push(`call_type=${encodeURIComponent(mapped)}`)
      }
      if (status && status !== 'All') {
        const mappedStatus = status.toLowerCase()
        params.push(`status=${encodeURIComponent(mappedStatus)}`)
        params.push(`callStatus=${encodeURIComponent(mappedStatus)}`)
        params.push(`call_status=${encodeURIComponent(mappedStatus)}`)
      }

      const endpoint = `/call-uses/user/${encodeURIComponent(userId)}/with-logs?${params.join('&')}`
      const res = await apiCall(endpoint, 'GET')

      // Normalize response
      const returnedCallUses = res.callUses || []
      const returnedCallLogs = Array.isArray(res.callLogs) ? res.callLogs : []

      // Apply client-side fallback filtering in case the backend didn't apply filters.
      // This ensures Call Type / Status / Date filters work even when server ignores params.
      let filteredLogs = returnedCallLogs

      // Filter by call type (map UI values to backend values)
      if (callType && callType !== 'All') {
        const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType.toLowerCase()
        filteredLogs = filteredLogs.filter((l) => String(l.callType || '').toLowerCase() === mapped)
      }

      // Filter by status (compare lowercased values)
      if (status && status !== 'All') {
        const mappedStatus = String(status).toLowerCase()
        filteredLogs = filteredLogs.filter((l) => String(l.status || '').toLowerCase() === mappedStatus)
      }

      // Filter by date range (if provided). Use local calendar date (YYYY-MM-DD)
      const formatLocalDate = (d) => {
        const Y = d.getFullYear()
        const M = String(d.getMonth() + 1).padStart(2, '0')
        const D = String(d.getDate()).padStart(2, '0')
        return `${Y}-${M}-${D}`
      }

      const wantFrom = dateFrom || null
      const wantTo = dateTo || null
      if (wantFrom || wantTo) {
        const beforeCount = filteredLogs.length
        filteredLogs = filteredLogs.filter((l) => {
          const raw = l.callDate || l.createdAt || l.contactedOn || null
          if (!raw) {
            console.warn('Skipping log with missing date', l)
            return false
          }
          const d = new Date(raw)
          if (isNaN(d)) {
            console.warn('Skipping log with invalid date', l)
            return false
          }
          const localDate = formatLocalDate(d)
          if (wantFrom && localDate < wantFrom) return false
          if (wantTo && localDate > wantTo) return false
          return true
        })
        console.log(`Date filter: ${beforeCount} -> ${filteredLogs.length} logs after applying ${wantFrom || '-'} to ${wantTo || '-'}`)
      }

      setCallUses(returnedCallUses)
      setCallUsesCount(res.callUsesCount || returnedCallUses.length)
      setCallLogs(filteredLogs)
      setCallLogsCount(filteredLogs.length)

      // keep local state in sync with what we just requested
      setLogsPage(page)
      setLogsLimit(limit)
    } catch (err) {
      console.error('Failed to fetch call uses', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load data')
      setCallUses([])
      setCallLogs([])
    } finally {
      setLoading(false)
    }
  }

  const clearLoadedData = () => {
    setCallUses([])
    setCallLogs([])
    setCallUsesCount(0)
    setCallLogsCount(0)
    setError(null)
  }

  // handleLoadCurrentUser removed — UI no longer exposes a "Use current user" button.


  const handleApplyFilters = async () => {
    // reset to first page when applying new filters
    await fetchData({ page: 1 })
  }

  const handleClearFilters = async () => {
    setDateFrom('')
    setDateTo('')
    setCallType('All')
    setStatus('All')
    await fetchData({ page: 1, limit: 20 })
  }

  const handleExport = async () => {
    setError(null)
    if (!userId) {
      setError('Please select an agent before exporting')
      return
    }
    // if no data loaded, ask user to load first
    if ((!callUses || callUses.length === 0) && (!callLogs || callLogs.length === 0)) {
      // If nothing loaded yet, we'll fetch full data using the current filters before exporting
      // fall through to fetch below
    }
    setExporting(true)
    try {
      // Ensure we have businessId
      if (!businessId) {
        try {
          const r = await apiCall('/v1/user/details', 'GET')
          const uu = r.user || r.data || r
          if (uu && uu.businessId) setBusinessId(uu.businessId)
          else {
            setError('Business ID not found for current user. Please ensure you are logged in.')
            setExporting(false)
            return
          }
        } catch (e) {
          setError('Unable to determine business id from current user details')
          setExporting(false)
          return
        }
      }

      // helper to normalize response shapes from apiCall
      const normalizeRes = (r) => {
        const payload = r && r.data ? (r.data.data || r.data) : r || {}
        return {
          callLogs: payload.callLogs || payload.logs || payload.data?.callLogs || [],
          callLogsCount: payload.callLogsCount || payload.logsCount || payload.total || 0,
          logsLimit: payload.logsLimit || payload.logs_limit || payload.limit || 0,
          logsPage: payload.logsPage || payload.page || 1,
          callUses: payload.callUses || payload.uses || payload.data?.callUses || [],
          callUsesCount: payload.callUsesCount || payload.usesCount || 0,
        }
      }
      // We'll fetch pages iteratively below; no single-shot params are used here.

      // We'll iteratively fetch pages to gather all logs. Start at page 1 and keep fetching until
      // we've collected total (if provided) or the server returns less than a full page.
      const endpointBase = `/call-uses/user/${encodeURIComponent(userId)}/with-logs`

      // start with page 1
      let page = 1
      const requestedLimit = callLogsCount && callLogsCount > 0 ? callLogsCount : Math.max(logsLimit, 1000)
      const collectedLogs = []
      let exportCallUses = []
      let totalLogs = null
      let serverPerPage = requestedLimit
      // safety cap to avoid infinite loops
      const SAFE_MAX_PAGES = 500
      while (page <= SAFE_MAX_PAGES) {
        // build params for this page
        const pageParams = []
        pageParams.push(`businessId=${encodeURIComponent(businessId)}`)
        pageParams.push(`logsPage=${page}`)
        pageParams.push(`logsLimit=${requestedLimit}`)
        if (dateFrom) pageParams.push(`from=${encodeURIComponent(dateFrom)}`)
        if (dateTo) pageParams.push(`to=${encodeURIComponent(dateTo)}`)
        if (callType && callType !== 'All') {
          const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType
          pageParams.push(`callType=${encodeURIComponent(mapped)}`)
          pageParams.push(`type=${encodeURIComponent(mapped)}`)
          pageParams.push(`call_type=${encodeURIComponent(mapped)}`)
        }
        if (status && status !== 'All') {
          const mappedStatus = status.toLowerCase()
          pageParams.push(`status=${encodeURIComponent(mappedStatus)}`)
          pageParams.push(`callStatus=${encodeURIComponent(mappedStatus)}`)
          pageParams.push(`call_status=${encodeURIComponent(mappedStatus)}`)
        }

        const url = `${endpointBase}?${pageParams.join('&')}`
        let pageRes
        try {
          pageRes = await apiCall(url, 'GET')
        } catch (err) {
          console.warn('Failed to fetch export page', page, err)
          break
        }
        const nr = normalizeRes(pageRes)
        // capture uses from first page if present
        if (page === 1) {
          exportCallUses = nr.callUses && nr.callUses.length ? nr.callUses : exportCallUses
          totalLogs = nr.callLogsCount || (Array.isArray(nr.callLogs) ? nr.callLogs.length : null) || totalLogs
          serverPerPage = nr.logsLimit && nr.logsLimit > 0 ? nr.logsLimit : serverPerPage
        }

        const pageLogs = Array.isArray(nr.callLogs) ? nr.callLogs : []
  if (pageLogs.length > 0) collectedLogs.push(...pageLogs)
  console.debug(`CallUses export - page ${page} returned ${pageLogs.length} logs`)

        // stop if we have all (when server supplied totalLogs) or server returned less than a full page
        if ((totalLogs && collectedLogs.length >= totalLogs) || (serverPerPage && pageLogs.length < serverPerPage)) {
          break
        }
        // if server didn't provide per-page info and returned empty page, stop
        if (!serverPerPage && pageLogs.length === 0) break

        page += 1
      }

  // Prefer collected logs; fall back to currently-loaded callLogs (if user previously loaded them in UI)
  let exportCallLogs = (collectedLogs && collectedLogs.length) ? collectedLogs : (callLogs && callLogs.length ? callLogs : [])

  console.debug('CallUses export - final counts -> summary:', (exportCallUses && exportCallUses.length) || 0, 'logs:', exportCallLogs.length, 'collected:', collectedLogs.length, 'expectedTotal:', totalLogs)
      // debug info to help diagnose missing logs in export
      try {
        console.debug('CallUses export - collectedLogs:', collectedLogs.length, 'expectedTotal:', totalLogs, 'perPage:', serverPerPage)
      } catch (e) {
        // ignore
      }

      // dynamic import xlsx and file-saver
      let xlsxModule = null
      try {
        xlsxModule = await import('xlsx')
      } catch (e) {
        console.error('xlsx import failed', e)
        setError('Export failed: xlsx library is not available. Please install "xlsx" dependency.')
        setExporting(false)
        return
      }
      const XLSX = xlsxModule && (xlsxModule.default || xlsxModule)
      let saveModule = null
      try {
        saveModule = await import('file-saver')
      } catch (e) {
        console.error('file-saver import failed', e)
        setError('Export failed: file-saver library is not available. Please install "file-saver" dependency.')
        setExporting(false)
        return
      }
      const saveAs = saveModule.saveAs || saveModule.default || (saveModule && saveModule)

      // Prepare summary sheet
      const summary = (exportCallUses || []).map((cu) => ({
        number: cu.numberId?.number || cu.number || '',
        outboundCalls: cu.outboundCalls ?? '',
        inboundCalls: cu.inboundCalls ?? '',
        missedCalls: cu.missedCalls ?? '',
        hangCalls: cu.hangCalls ?? '',
        createdAt: cu.createdAt || cu.created_at || '',
        updatedAt: cu.updatedAt || cu.updated_at || '',
      }))

      // Prepare logs sheet
      const logs = (exportCallLogs || []).map((l) => ({
        id: l._id || l.id || '',
        date: l.callDate || l.contactedOn || l.createdAt || '',
        contact: l.contact || l.callReceivedBy || '',
        virtualNumber: l.virtualNumber || l.number || (l.numberId && l.numberId.number) || '',
        duration: l.callDuration ?? l.duration ?? '',
        type: l.callType || '',
        status: l.status || '',
        notes: l.notes || '',
        cost: l.cost ?? '',
      }))

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(summary)
      const ws2 = XLSX.utils.json_to_sheet(logs)
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
      XLSX.utils.book_append_sheet(wb, ws2, 'Logs')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
      const filename = `calluses_${userId}_${new Date().toISOString().slice(0,10)}.xlsx`
      saveAs(blob, filename)
    } catch (err) {
      console.error('Export failed', err)
      setError('Export failed. See console for details.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>Call Uses</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Track call usage by agent with detailed logs</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left: Filters Form */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Agent"
              select
              fullWidth
              size="small"
              value={userId}
              onChange={(e) => {
                const val = e.target.value
                setUserId(val)
                clearLoadedData()
                setLogsPage(1)
              }}
            >
              <MenuItem value="">-- Select agent --</MenuItem>
              {agentsLoading ? (
                <MenuItem disabled>Loading agents...</MenuItem>
              ) : (
                availableAgents.map((ag) => (
                  <MenuItem key={ag._id} value={ag._id}>{ag.name || ag.email || ag._id}</MenuItem>
                ))
              )}
            </TextField>

            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Call Type"
              select
              size="small"
              fullWidth
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
            >
              {['All', 'Incoming', 'Outgoing'].map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Status"
              select
              size="small"
              fullWidth
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['All', 'Completed', 'Failed'].map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
                onClick={handleApplyFilters}
                disabled={loading || !userId}
                sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' }, flex: 1 }}
              >
                {loading ? 'Loading' : 'Load Data'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>

            <Button
              variant="contained"
              startIcon={exporting ? <CircularProgress size={18} /> : <GetAppIcon />}
              onClick={handleExport}
              disabled={exporting || !userId}
              sx={{ backgroundColor: '#00b894', '&:hover': { backgroundColor: '#00a383' } }}
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>

            <TextField
              label="Logs Per Page"
              select
              size="small"
              fullWidth
              value={logsLimit}
              onChange={(e) => setLogsLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Page"
              type="number"
              size="small"
              fullWidth
              value={logsPage}
              onChange={(e) => setLogsPage(Math.max(1, Number(e.target.value)))}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </Grid>

        {/* Right: Summary and Logs */}
        <Grid item xs={12} md={8}>
          {/* Summary Section */}
          {!loading && callUses.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {callUses.map((cu) => (
                  <Card key={cu._id} variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Number: {cu.numberId?.number || '—'}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <Chip
                              label={`Outbound: ${cu.outboundCalls}`}
                              size="small"
                              className="custom-chip"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`Inbound: ${cu.inboundCalls}`}
                              size="small"
                              className="custom-chip"
                            />
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', fontSize: '0.85rem', color: '#6c757d' }}>
                          <div>Created: {new Date(cu.createdAt).toLocaleString()}</div>
                          <div>Updated: {new Date(cu.updatedAt).toLocaleString()}</div>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Logs Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Call Logs</Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                Total: <strong>{callLogsCount}</strong>
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : callLogs.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: '#6c757d' }}>
                No call logs found
              </Paper>
            ) : (
              <Paper variant="outlined" className="calllogs-table-container">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Virtual Number</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Duration (s)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {callLogs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{new Date(log.callDate || log.createdAt).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{log.contact || log.callReceivedBy || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{log.virtualNumber || log.number || (log.numberId && log.numberId.number) || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{log.callDuration ?? log.duration ?? '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>
                          <Chip
                            label={log.callType === 'outbound' ? 'Outgoing' : 'Incoming'}
                            size="small"
                            sx={{
                              backgroundColor: log.callType === 'outbound' ? '#fce4ec' : '#e3f2fd',
                              color: log.callType === 'outbound' ? '#c2185b' : '#1565c0',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{log.status}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{log.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CallUses
