import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  Stack,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EventIcon from '@mui/icons-material/Event'
import CoffeeIcon from '@mui/icons-material/Coffee'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import WcIcon from '@mui/icons-material/Wc'
import DownloadIcon from '@mui/icons-material/Download'
import { apiCall } from '../../config/api'

const formatSeconds = (s) => {
  if (s == null) return '00:00:00'
  const sec = Math.max(0, Math.floor(Number(s) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const ss = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}
const formatClock = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return iso }
}
const formatMinutes = (sec) => {
  if (!sec) return '0m'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

// Detail page for a single agent's status sessions across the selected
// date range. Reached from the Agent Status Report — the row's "Show
// full details" button navigates here with userId + date range.
const AgentStatusDetail = () => {
  const { userId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const from = params.get('from') || ''
  const to = params.get('to') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agent, setAgent] = useState(null)
  // Filter pill — 'all' shows every status, otherwise show only the chosen one.
  const [activeStatus, setActiveStatus] = useState('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const bid = localStorage.getItem('businessId') || ''
        if (!bid) {
          setError('No business ID found for this account.')
          return
        }
        const qs = new URLSearchParams({ businessId: bid, from, to }).toString()
        const r = await apiCall(`/v1/user/activity/agent-status-report?${qs}`, 'GET')
        if (cancelled) return
        const payload = r?.data || r
        const list = Array.isArray(payload?.agents) ? payload.agents : []
        const match = list.find((x) => String(x.userId) === String(userId))
        if (!match) setError('Agent not found in this report range.')
        setAgent(match || null)
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, from, to])

  const statusCards = useMemo(
    () => [
      { key: 'online', label: 'Logged Hours (Online)', icon: <EventIcon fontSize="small" />, color: '#15803d' },
      { key: 'break', label: 'Break', icon: <CoffeeIcon fontSize="small" />, color: '#f59e0b' },
      { key: 'lunch', label: 'Lunch', icon: <RestaurantIcon fontSize="small" />, color: '#0288d1' },
      { key: 'bio_break', label: 'Bio Break', icon: <WcIcon fontSize="small" />, color: '#0097a7' },
    ],
    [],
  )

  // Export all of THIS agent's session data to an Excel workbook with
  // one sheet per status + a summary sheet. Uses dynamic import so the
  // xlsx bundle isn't pulled into the main chunk.
  const exportToExcel = async () => {
    if (!agent) return
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summary = [
      { Metric: 'Agent', Value: agent.name },
      { Metric: 'Email', Value: agent.email || '' },
      { Metric: 'Extension', Value: agent.extension || '' },
      { Metric: 'Departments', Value: (agent.departments || []).join(', ') },
      { Metric: 'Range', Value: `${from} → ${to}` },
      { Metric: 'Current Status', Value: agent.currentStatus || '' },
      { Metric: 'Last Seen', Value: agent.lastSeen || '' },
      { Metric: '— —', Value: '— —' },
      { Metric: 'Online (hh:mm:ss)', Value: formatSeconds(agent.seconds?.online) },
      { Metric: 'Break (hh:mm:ss)', Value: formatSeconds(agent.seconds?.break) },
      { Metric: 'Lunch (hh:mm:ss)', Value: formatSeconds(agent.seconds?.lunch) },
      { Metric: 'Bio Break (hh:mm:ss)', Value: formatSeconds(agent.seconds?.bio_break) },
      { Metric: 'Offline (hh:mm:ss)', Value: formatSeconds(agent.seconds?.offline) },
      { Metric: 'Total Tracked (hh:mm:ss)', Value: formatSeconds(agent.totalSeconds) },
      { Metric: 'Online sessions', Value: agent.sessions?.online || 0 },
      { Metric: 'Break sessions', Value: agent.sessions?.break || 0 },
      { Metric: 'Lunch sessions', Value: agent.sessions?.lunch || 0 },
      { Metric: 'Bio Break sessions', Value: agent.sessions?.bio_break || 0 },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')

    // One sheet per status — each row = one session
    statusCards.forEach(({ key, label }) => {
      const sessions = agent.sessionDetails?.[key] || []
      const rows = sessions.map((s, i) => ({
        '#': i + 1,
        Start: s.start ? new Date(s.start).toLocaleString() : '',
        End: s.ongoing ? 'ongoing' : (s.end ? new Date(s.end).toLocaleString() : ''),
        'Duration (seconds)': s.durationSec || 0,
        'Duration (hh:mm:ss)': formatSeconds(s.durationSec || 0),
        Ongoing: s.ongoing ? 'yes' : '',
      }))
      // Excel sheet names can't exceed 31 chars or contain []*/?:\
      const safeName = label.replace(/[\\/?*\[\]:]/g, '').slice(0, 31)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(rows.length ? rows : [{ '#': '', Start: 'no sessions', End: '', 'Duration (seconds)': '', 'Duration (hh:mm:ss)': '', Ongoing: '' }]),
        safeName,
      )
    })

    const slug = String(agent.name || 'agent').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const filename = `agent-status-${slug || agent.userId}-${from}-to-${to}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reports/agent-status')}
        >
          Back to report
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Agent Status — Detailed
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Full session-by-session breakdown for the selected date range.
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
          disabled={!agent || loading}
        >
          Export Excel
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !agent ? null : (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{agent.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agent.email || ''} {agent.extension ? `· ext ${agent.extension}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<EventIcon />} label={`Range: ${from} → ${to}`} variant="outlined" />
                  <Chip label={`Online: ${formatSeconds(agent.seconds?.online)}`} color="success" variant="outlined" />
                  <Chip label={`Break: ${formatSeconds(agent.seconds?.break)} · ${agent.sessions?.break || 0}×`} variant="outlined" />
                  <Chip label={`Lunch: ${formatSeconds(agent.seconds?.lunch)} · ${agent.sessions?.lunch || 0}×`} variant="outlined" />
                  <Chip label={`Bio Break: ${formatSeconds(agent.seconds?.bio_break)} · ${agent.sessions?.bio_break || 0}×`} variant="outlined" sx={{ color: '#0097a7' }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Filter pills — click one to focus on a single status, or
              "All" to see everything. Counts in each pill reflect the
              date range so the supervisor knows what they're filtering. */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Button
              variant={activeStatus === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveStatus('all')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              All
            </Button>
            {statusCards.map(({ key, label, icon, color }) => {
              const count = agent.sessionDetails?.[key]?.length || 0
              const active = activeStatus === key
              return (
                <Button
                  key={`tab-${key}`}
                  size="small"
                  variant={active ? 'contained' : 'outlined'}
                  onClick={() => setActiveStatus(key)}
                  startIcon={icon}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    ...(active
                      ? { bgcolor: color, color: '#fff', '&:hover': { bgcolor: color, opacity: 0.9 } }
                      : { color, borderColor: color + '80' }),
                  }}
                >
                  {label.replace(' (Online)', '')} · {count}
                </Button>
              )
            })}
          </Stack>

          <Stack direction="column" spacing={2}>
            {statusCards
              .filter(({ key }) => activeStatus === 'all' || activeStatus === key)
              .map(({ key, label, icon, color }) => {
              const sessions = (agent.sessionDetails?.[key] || []).slice().reverse() // newest first
              return (
                <Card key={key} variant="outlined" sx={{ width: '100%', borderColor: color + '55' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color }}>
                      {icon}
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{label}</Typography>
                      <Chip
                        label={`${sessions.length}× · ${formatSeconds(agent.seconds?.[key])}`}
                        size="small"
                        sx={{ ml: 'auto', bgcolor: color + '22', color, fontWeight: 600 }}
                      />
                    </Stack>
                    {sessions.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No {label.toLowerCase()} sessions.
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontSize: '0.75rem', color: '#6b7280' } }}>
                              <TableCell>#</TableCell>
                              <TableCell>Start</TableCell>
                              <TableCell>End</TableCell>
                              <TableCell align="right">Duration</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sessions.map((s, i) => (
                              <TableRow key={`${key}-${i}`}>
                                <TableCell>{sessions.length - i}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>{formatClock(s.start)}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                  {s.ongoing ? <em>ongoing</em> : formatClock(s.end)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                  {formatMinutes(s.durationSec)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </>
      )}
    </Box>
  )
}

export default AgentStatusDetail
