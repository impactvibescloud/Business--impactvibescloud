import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
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
  Pagination,
  Tooltip,
  InputAdornment,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import PersonIcon from '@mui/icons-material/Person'
import GroupsIcon from '@mui/icons-material/Groups'
import DialpadIcon from '@mui/icons-material/Dialpad'
import { apiCall } from '../../config/api'

const PAGE_SIZE = 10

const DESTINATION_FILTERS = [
  { label: 'All destinations', value: 'all' },
  { label: 'Routed to department', value: 'dept' },
  { label: 'Routed to agent', value: 'transfer' },
  { label: 'Abandoned in IVR', value: 'abandoned' },
]

const fmtDateTime = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleString()
}

// "2 → 1 → 3" summary of the digits the caller pressed.
const keypressPath = (steps = []) =>
  steps.length ? steps.map((s) => s.digit).filter(Boolean).join('  →  ') : '—'

// Human label for a routing-trail leg result.
const trailResultLabel = (r) => ({
  answered: 'Answered',
  'no-answer': 'No answer',
  busy: 'Busy',
  failed: 'Failed',
}[r] || r || '—')

// Icon for the final destination type. Shows the TARGETED agent by name.
const DestinationChip = ({ report }) => {
  const type = report.finalType
  const tName = report.targetAgentName
  if (type === 'transfer') {
    return (
      <Chip size="small" color="primary" icon={<PersonIcon />} label={tName ? `Agent: ${tName}` : (report.destinationSummary || 'Agent')} />
    )
  }
  if (type === 'dept') {
    const dept = report.connectedDepartment?.name
    const label = dept
      ? (tName ? `${dept} → ${tName}` : `Dept: ${dept}`)
      : (report.destinationSummary || 'Department')
    return (
      <Chip size="small" color="success" icon={<GroupsIcon />} label={label} />
    )
  }
  return <Chip size="small" variant="outlined" color="warning" label="Abandoned in IVR" />
}

// Final outcome of the call after any department failover (from the correlated
// CallLog). Distinct from the IVR's targeted destination above.
const CallStatusChip = ({ status }) => {
  if (!status) return <Typography variant="caption" sx={{ opacity: 0.6 }}>—</Typography>
  const map = {
    answered: { color: 'success', label: 'Answered' },
    missed: { color: 'error', label: 'Missed' },
    'not-answered': { color: 'warning', label: 'Not answered' },
    busy: { color: 'warning', label: 'Busy' },
    failed: { color: 'default', label: 'Failed' },
    congestion: { color: 'default', label: 'Failed' },
  }
  const m = map[status] || { color: 'default', label: status }
  return <Chip size="small" color={m.color} variant="outlined" label={m.label} />
}

// "Answered by <name>" + status. The connected agent is who ACTUALLY picked up
// (after any failover), which may differ from the IVR-targeted agent.
const AnsweredByCell = ({ report }) => {
  const name = report.answeredAgent?.name
  if (!name) return <CallStatusChip status={report.callStatus} />
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <PersonIcon fontSize="small" sx={{ opacity: 0.6 }} />
      <span>{name}</span>
      <CallStatusChip status={report.callStatus} />
    </Box>
  )
}

// One expanded keypress timeline.
const StepTimeline = ({ steps = [] }) => {
  if (!steps.length) {
    return <Typography variant="body2" sx={{ opacity: 0.7 }}>No keypresses recorded.</Typography>
  }
  return (
    <Box sx={{ pl: 1 }}>
      {steps.map((s, i) => {
        const isRouting = s.type === 'transfer' || s.type === 'dept'
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
            {/* digit bubble */}
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: isRouting ? 'success.main' : 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {s.digit || '?'}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Pressed “{s.digit}”
                {s.node ? <span style={{ fontWeight: 400, opacity: 0.7 }}> at menu “{s.node}”</span> : null}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {s.type === 'node' && `→ Opened sub-menu: ${s.value}`}
                {s.type === 'transfer' && `→ ${s.label || `Agent ${s.value}`}`}
                {s.type === 'dept' && `→ ${s.label || `Department ${s.value}`}`}
                {!s.type && '→ No mapping (invalid option)'}
              </Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box sx={{ flex: 1, borderBottom: '1px dashed rgba(0,0,0,0.2)', mx: 1 }} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

const ReportRow = ({ report }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen((o) => !o)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{fmtDateTime(report.createdAt || report.startedAt)}</TableCell>
        <TableCell>{report.caller || '-'}</TableCell>
        <TableCell>{report.did || '-'}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace' }}>
            <DialpadIcon fontSize="small" sx={{ opacity: 0.6 }} />
            {keypressPath(report.steps)}
          </Box>
        </TableCell>
        <TableCell>{(report.steps || []).length}</TableCell>
        <TableCell><DestinationChip report={report} /></TableCell>
        <TableCell><AnsweredByCell report={report} /></TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallSplitIcon fontSize="small" /> Caller journey
              </Typography>
              <StepTimeline steps={report.steps} />
              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Where the IVR keypress ROUTED the call (the configured target) */}
                <Typography variant="body2">
                  <b>Routed to (target):</b>{' '}
                  {report.connectedDepartment?.name
                    ? `Department ${report.connectedDepartment.name}`
                    : ''}
                  {report.targetAgentName
                    ? `${report.connectedDepartment?.name ? ' → ' : ''}${report.targetAgentName}`
                    : (!report.connectedDepartment?.name ? (report.destinationSummary || 'Abandoned in IVR') : '')}
                </Typography>

                {/* Failover path: which agents were offered and why it moved on */}
                {Array.isArray(report.routingTrail) && report.routingTrail.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2"><b>Routing path:</b></Typography>
                    {report.routingTrail.map((t, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          icon={<PersonIcon />}
                          color={t.result === 'answered' ? 'success' : 'default'}
                          variant={t.result === 'answered' ? 'filled' : 'outlined'}
                          label={`${t.agentName || 'Agent'} · ${trailResultLabel(t.result)}`}
                        />
                        {i < report.routingTrail.length - 1 && (
                          <span style={{ opacity: 0.5 }}>→</span>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Who ACTUALLY answered (after any failover within the dept) */}
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <b>Answered by:</b>{' '}
                  {report.answeredAgent?.name
                    ? <span>{report.answeredAgent.name}</span>
                    : <span style={{ opacity: 0.7 }}>—</span>}
                  <CallStatusChip status={report.callStatus} />
                  {report.answeredAgent?.name &&
                   report.targetAgentName &&
                   report.answeredAgent.name !== report.targetAgentName && (
                    <Chip size="small" color="info" variant="outlined" label={`Failover — ${report.targetAgentName} didn't take it`} />
                  )}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const IvrReports = () => {
  const [businessId, setBusinessId] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [destFilter, setDestFilter] = useState('all')
  const [refreshTick, setRefreshTick] = useState(0)

  // Resolve businessId (same approach as the Call Logs page).
  useEffect(() => {
    const getBusinessId = async () => {
      try {
        const response = await apiCall('/v1/user/details', 'GET')
        if (response?.user?.businessId) {
          setBusinessId(response.user.businessId)
          return
        }
        const stored = localStorage.getItem('businessId')
        if (stored) {
          setBusinessId(stored)
          return
        }
        throw new Error('Business ID not found')
      } catch (err) {
        console.error('Failed to get business ID:', err)
        setError('Failed to get business ID. Please make sure you are properly logged in.')
      }
    }
    getBusinessId()
  }, [])

  const fetchReports = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    setError(null)
    try {
      let endpoint = `/ivr-reports?businessId=${businessId}&page=${page}&limit=${PAGE_SIZE}`
      if (search.trim()) endpoint += `&search=${encodeURIComponent(search.trim())}`
      if (dateFrom) endpoint += `&startDate=${encodeURIComponent(dateFrom)}`
      if (dateTo) endpoint += `&endDate=${encodeURIComponent(dateTo)}`
      if (destFilter && destFilter !== 'all') endpoint += `&destinationType=${destFilter}`

      const res = await apiCall(endpoint, 'GET')
      const data = res?.data || []
      setReports(Array.isArray(data) ? data : [])
      const pg = res?.pagination || {}
      setTotalPages(pg.totalPages || 1)
      setTotalRecords(pg.totalRecords || (Array.isArray(data) ? data.length : 0))
    } catch (err) {
      console.error('Failed to fetch IVR reports', err)
      setError('Failed to load IVR reports.')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [businessId, page, search, dateFrom, dateTo, destFilter, refreshTick])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1)
  }, [search, dateFrom, dateTo, destFilter])

  return (
    <Card sx={{ m: 2 }}>
      <CardHeader
        title="IVR Reports"
        subheader="Caller IVR menu selections — what they dialed and where the call was connected"
        action={
          <Tooltip title="Refresh">
            <IconButton onClick={() => setRefreshTick((t) => t + 1)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search caller / DID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            type="date"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <TextField
            size="small"
            select
            label="Destination"
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {DESTINATION_FILTERS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {totalRecords} call{totalRecords === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={48} />
                <TableCell>Date / Time</TableCell>
                <TableCell>Caller</TableCell>
                <TableCell>DID</TableCell>
                <TableCell>Keys pressed</TableCell>
                <TableCell>#</TableCell>
                <TableCell>Routed to (target)</TableCell>
                <TableCell>Answered by</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, opacity: 0.7 }}>
                    No IVR calls found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => <ReportRow key={r._id} report={r} />)
              )}
            </TableBody>
          </Table>
        </Paper>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default IvrReports
