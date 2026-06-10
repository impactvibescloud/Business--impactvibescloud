import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  TextField,
  Stack,
  MenuItem,
  Pagination,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import EventIcon from '@mui/icons-material/Event'
import { apiCall } from '../../config/api'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'bio_break', label: 'Bio Break' },
]

const STATUS_COLORS = {
  online: 'success',
  offline: 'default',
  break: 'warning',
  lunch: 'info',
  bio_break: 'secondary',
}

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  break: 'Break',
  lunch: 'Lunch',
  bio_break: 'Bio Break',
}

const formatSeconds = (s) => {
  if (s == null) return '00:00:00'
  const sec = Math.max(0, Math.floor(Number(s) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const ss = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const toDateInput = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatLastSeen = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

const AgentStatusReport = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')

  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const [from, setFrom] = useState(toDateInput(sevenDaysAgo))
  const [to, setTo] = useState(toDateInput(today))
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [agents, setAgents] = useState([])
  const [totals, setTotals] = useState(null)
  const [page, setPage] = useState(1)
  const ROWS_PER_PAGE = 25

  const resolveBusinessId = async () => {
    if (businessId) return businessId
    try {
      const r = await apiCall('/v1/user/details', 'GET')
      const u = r?.user || r?.data || r
      const bid =
        u?.businessId ||
        u?.businessid ||
        (u?.business && (u.business._id || u.business.id)) ||
        ''
      if (bid) {
        localStorage.setItem('businessId', bid)
        setBusinessId(bid)
        return bid
      }
    } catch {}
    return ''
  }

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const bid = await resolveBusinessId()
      if (!bid) {
        setError('No business ID found for this account.')
        return
      }
      const qs = new URLSearchParams({
        businessId: bid,
        from,
        to,
      })
      if (statusFilter && statusFilter !== 'all') qs.set('status', statusFilter)
      if (search) qs.set('search', search)
      const r = await apiCall(`/v1/user/activity/agent-status-report?${qs.toString()}`, 'GET')
      const payload = r?.data || r
      setAgents(Array.isArray(payload?.agents) ? payload.agents : [])
      setTotals(payload?.totals || null)
      setPage(1)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredAgents = useMemo(() => agents, [agents])
  const pagedAgents = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE
    return filteredAgents.slice(start, start + ROWS_PER_PAGE)
  }, [filteredAgents, page])

  const exportToExcel = async () => {
    if (!agents.length) return
    const XLSX = await import('xlsx')
    const rows = agents.map((a) => ({
      Name: a.name,
      Email: a.email || '',
      Phone: a.phone || '',
      Extension: a.extension || '',
      'SIP Username': a.sipUsername || '',
      Departments: (a.departments || []).join(', '),
      'Current Status': STATUS_LABELS[a.currentStatus] || a.currentStatus,
      'Last Seen': a.lastSeen ? new Date(a.lastSeen).toISOString() : '',
      'Online (hh:mm:ss)': formatSeconds(a.seconds?.online),
      'Break (hh:mm:ss)': formatSeconds(a.seconds?.break),
      'Lunch (hh:mm:ss)': formatSeconds(a.seconds?.lunch),
      'Bio Break (hh:mm:ss)': formatSeconds(a.seconds?.bio_break),
      'Offline (hh:mm:ss)': formatSeconds(a.seconds?.offline),
      'Total Tracked (hh:mm:ss)': formatSeconds(a.totalSeconds),
      'Online (sec)': a.seconds?.online || 0,
      'Break (sec)': a.seconds?.break || 0,
      'Lunch (sec)': a.seconds?.lunch || 0,
      'Bio Break (sec)': a.seconds?.bio_break || 0,
      'Offline (sec)': a.seconds?.offline || 0,
      'Online sessions': a.sessions?.online || 0,
      'Break sessions': a.sessions?.break || 0,
      'Lunch sessions': a.sessions?.lunch || 0,
      'Bio Break sessions': a.sessions?.bio_break || 0,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Agent Status')

    // Add a summary sheet
    if (totals) {
      const summaryRows = [
        { Metric: 'Agents in report', Value: totals.agents },
        { Metric: 'Online now', Value: totals.onlineNow ?? 0 },
        { Metric: 'Offline now', Value: totals.offlineNow ?? 0 },
        { Metric: 'On Break now', Value: totals.breakNow ?? 0 },
        { Metric: 'On Lunch now', Value: totals.lunchNow ?? 0 },
        { Metric: 'On Bio Break now', Value: totals.bioBreakNow ?? 0 },
        { Metric: 'Total Online (hh:mm:ss)', Value: formatSeconds(totals.totalSeconds?.online) },
        { Metric: 'Total Break (hh:mm:ss)', Value: formatSeconds(totals.totalSeconds?.break) },
        { Metric: 'Total Lunch (hh:mm:ss)', Value: formatSeconds(totals.totalSeconds?.lunch) },
        { Metric: 'Total Bio Break (hh:mm:ss)', Value: formatSeconds(totals.totalSeconds?.bio_break) },
        { Metric: 'Total Offline (hh:mm:ss)', Value: formatSeconds(totals.totalSeconds?.offline) },
        { Metric: 'Range', Value: `${from} → ${to}` },
      ]
      const sumWs = XLSX.utils.json_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, sumWs, 'Summary')
    }

    const filename = `agent-status-report-${from}-to-${to}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Agent Status Report
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Per-agent time spent in each status across a date range. Use filters to
          narrow down, then export to Excel.
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              label="From"
              type="date"
              size="small"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              select
              label="Current status"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Search agent"
              placeholder="Name / email / ext"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchReport()
              }}
              InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ color: '#9ca3af', mr: 0.5 }} /> }}
              sx={{ minWidth: 240 }}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={fetchReport}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Apply / Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              disabled={!agents.length}
            >
              Export Excel
            </Button>
          </Stack>

          {totals && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={<EventIcon />}
                label={`Range ${from} → ${to}`}
                variant="outlined"
              />
              <Chip size="small" color="success" label={`Online now: ${totals.onlineNow}`} />
              <Chip size="small" color="default" label={`Offline now: ${totals.offlineNow}`} />
              <Chip size="small" color="warning" label={`Break: ${totals.breakNow}`} />
              <Chip size="small" color="info" label={`Lunch: ${totals.lunchNow}`} />
              <Chip size="small" color="secondary" label={`Bio Break: ${totals.bioBreakNow}`} />
              <Chip
                size="small"
                variant="outlined"
                label={`Total Online: ${formatSeconds(totals.totalSeconds?.online)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Total Break: ${formatSeconds(totals.totalSeconds?.break)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Total Lunch: ${formatSeconds(totals.totalSeconds?.lunch)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Total Bio Break: ${formatSeconds(totals.totalSeconds?.bio_break)}`}
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading && !agents.length ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#f8fafc' } }}>
                      <TableCell>Agent</TableCell>
                      <TableCell>Departments</TableCell>
                      <TableCell>Current Status</TableCell>
                      <TableCell>Last Seen</TableCell>
                      <TableCell align="right">Online</TableCell>
                      <TableCell align="right">Break</TableCell>
                      <TableCell align="right">Lunch</TableCell>
                      <TableCell align="right">Bio Break</TableCell>
                      <TableCell align="right">Offline</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedAgents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ color: 'text.secondary' }}>
                          No agents match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedAgents.map((a) => (
                      <TableRow key={a.userId} hover>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {a.name}
                            </Typography>
                            {a.email && (
                              <Typography variant="caption" color="text.secondary">
                                {a.email}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {a.departments?.length ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {a.departments.map((d) => (
                                <Chip key={d} label={d} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STATUS_LABELS[a.currentStatus] || a.currentStatus}
                            color={STATUS_COLORS[a.currentStatus] || 'default'}
                            variant={a.currentStatus === 'online' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{formatLastSeen(a.lastSeen)}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatSeconds(a.seconds?.online)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatSeconds(a.seconds?.break)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatSeconds(a.seconds?.lunch)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#0097a7' }}>
                          {formatSeconds(a.seconds?.bio_break)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#6b7280' }}>
                          {formatSeconds(a.seconds?.offline)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {formatSeconds(a.totalSeconds)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredAgents.length > ROWS_PER_PAGE && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={Math.ceil(filteredAgents.length / ROWS_PER_PAGE)}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AgentStatusReport
