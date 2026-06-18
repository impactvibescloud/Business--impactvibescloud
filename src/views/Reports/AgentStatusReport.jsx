import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import CoffeeIcon from '@mui/icons-material/Coffee'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import WcIcon from '@mui/icons-material/Wc'
import { apiCall } from '../../config/api'

const formatClock = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

const formatMinutes = (sec) => {
  if (!sec) return '0m'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

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

  // Single date picker — pick any day, defaults to today. The backend
  // expects from/to so we send the same value for both (full-day window).
  const [reportDate, setReportDate] = useState(toDateInput(new Date()))
  const from = reportDate
  const to = reportDate
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [agents, setAgents] = useState([])
  const [totals, setTotals] = useState(null)
  const [page, setPage] = useState(1)
  const [expandedUserId, setExpandedUserId] = useState(null)
  const ROWS_PER_PAGE = 25
  const toggleExpand = (userId) =>
    setExpandedUserId((prev) => (prev === userId ? null : userId))

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
          Per-agent time spent in each status for <strong>today</strong>. Click any
          row to see the exact break / lunch / bio break times and durations.
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
              label="Date"
              type="date"
              size="small"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
              inputProps={{ max: toDateInput(new Date()) }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => setReportDate(toDateInput(new Date()))}
              disabled={reportDate === toDateInput(new Date())}
            >
              Today
            </Button>
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
                      <TableCell sx={{ width: 36 }} />
                      <TableCell>Agent</TableCell>
                      <TableCell>Departments</TableCell>
                      <TableCell>Current Status</TableCell>
                      <TableCell>Last Seen</TableCell>
                      <TableCell align="right">Logged Hours</TableCell>
                      <TableCell align="right">Break (×)</TableCell>
                      <TableCell align="right">Lunch (×)</TableCell>
                      <TableCell align="right">Bio Break (×)</TableCell>
                      <TableCell align="right">Offline</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedAgents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ color: 'text.secondary' }}>
                          No agents match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedAgents.map((a) => {
                      const isOpen = expandedUserId === a.userId
                      return (
                      <React.Fragment key={a.userId}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                        onClick={() => toggleExpand(a.userId)}
                      >
                        <TableCell>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(a.userId) }}>
                            {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                          </IconButton>
                        </TableCell>
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
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#15803d' }}>
                          {formatSeconds(a.seconds?.online)}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#6b7280', fontWeight: 400 }}>
                            · {a.sessions?.online || 0}×
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatSeconds(a.seconds?.break)}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#6b7280' }}>
                            · {a.sessions?.break || 0}×
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatSeconds(a.seconds?.lunch)}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#6b7280' }}>
                            · {a.sessions?.lunch || 0}×
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#0097a7' }}>
                          {formatSeconds(a.seconds?.bio_break)}
                          <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#0097a7', fontWeight: 600 }}>
                            · {a.sessions?.bio_break || 0}×
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#6b7280' }}>
                          {formatSeconds(a.seconds?.offline)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {formatSeconds(a.totalSeconds)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={11} sx={{ p: 0, borderBottom: isOpen ? '1px solid #e5e7eb' : 'none' }}>
                          <Collapse in={isOpen} unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Status breakdown for {a.name} ({from} → {to})
                              </Typography>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                                {[
                                  { key: 'online', label: 'Logged Hours (Online)', icon: <EventIcon fontSize="small" />, color: '#15803d' },
                                  { key: 'break', label: 'Break', icon: <CoffeeIcon fontSize="small" />, color: '#f59e0b' },
                                  { key: 'lunch', label: 'Lunch', icon: <RestaurantIcon fontSize="small" />, color: '#0288d1' },
                                  { key: 'bio_break', label: 'Bio Break', icon: <WcIcon fontSize="small" />, color: '#0097a7' },
                                ].map(({ key, label, icon, color }) => {
                                  const sessions = a.sessionDetails?.[key] || []
                                  // Show only the LATEST 4 sessions inline.
                                  // Sessions are sorted earliest-first by the
                                  // backend, so the most recent are at the end.
                                  const PREVIEW_COUNT = 4
                                  const visible = sessions.slice(-PREVIEW_COUNT).reverse()
                                  const hiddenCount = Math.max(0, sessions.length - visible.length)
                                  return (
                                    <Card key={key} variant="outlined" sx={{ flex: 1, minWidth: 260, borderColor: color + '55' }}>
                                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color }}>
                                          {icon}
                                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {label}
                                          </Typography>
                                          <Chip
                                            label={`${sessions.length}× · ${formatSeconds(a.seconds?.[key])}`}
                                            size="small"
                                            sx={{ ml: 'auto', bgcolor: color + '22', color, fontWeight: 600 }}
                                          />
                                        </Stack>
                                        {sessions.length === 0 ? (
                                          <Typography variant="caption" color="text.secondary">
                                            No {label.toLowerCase()} sessions in this range.
                                          </Typography>
                                        ) : (
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow sx={{ '& th': { py: 0.25, fontSize: '0.7rem', color: '#6b7280' } }}>
                                                <TableCell>#</TableCell>
                                                <TableCell>Start</TableCell>
                                                <TableCell>End</TableCell>
                                                <TableCell align="right">Duration</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {visible.map((s, i) => (
                                                <TableRow key={`${key}-${i}`}>
                                                  <TableCell sx={{ py: 0.25 }}>{sessions.length - i}</TableCell>
                                                  <TableCell sx={{ py: 0.25, fontSize: '0.75rem' }}>{formatClock(s.start)}</TableCell>
                                                  <TableCell sx={{ py: 0.25, fontSize: '0.75rem' }}>
                                                    {s.ongoing ? <em>ongoing</em> : formatClock(s.end)}
                                                  </TableCell>
                                                  <TableCell align="right" sx={{ py: 0.25, fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {formatMinutes(s.durationSec)}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        )}
                                        {hiddenCount > 0 && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#6b7280', fontStyle: 'italic' }}>
                                            +{hiddenCount} more — click "Show full details" below.
                                          </Typography>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )
                                })}
                              </Stack>
                              <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  endIcon={<KeyboardArrowRightIcon />}
                                  onClick={() => {
                                    const qs = new URLSearchParams({ from, to }).toString()
                                    window.location.href = `/reports/agent-status/${a.userId}?${qs}`
                                  }}
                                >
                                  Show full details
                                </Button>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                      </React.Fragment>
                      )
                    })}
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
