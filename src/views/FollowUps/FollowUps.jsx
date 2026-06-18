import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import EventIcon from '@mui/icons-material/Event'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material'
import { apiCall } from '../../config/api'

// Business-app Follow-ups page. Mirrors what the agent app shows on its
// "Follow Ups" view — every Task scheduled across every agent in this
// business, with status (open/completed) and priority. Tasks are
// auto-created whenever an agent sets a follow-up date on a call, so
// this view is the cross-agent rollup the business admin needs.

const TASK_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const BUCKET_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-today', label: 'Due today' },
  { value: 'upcoming', label: 'Upcoming' },
]

const PRIORITY_COLORS = {
  high: 'error',
  medium: 'warning',
  low: 'default',
}

const formatDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return '-'
    return dt.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return String(d)
  }
}

const formatShortDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch (e) {
    return '-'
  }
}

// Pick a color for the dueDate chip based on how urgent it is. Drives
// the at-a-glance scan: red = overdue, amber = today, blue = upcoming.
const dueChipColor = (task) => {
  if (task.status === 'completed' || task.status === 'cancelled') return 'default'
  if (!task.dueDate) return 'default'
  const t = new Date(task.dueDate).getTime()
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  const endOfToday = new Date(new Date().setHours(23, 59, 59, 999)).getTime()
  if (t < startOfToday) return 'error'
  if (t <= endOfToday) return 'warning'
  return 'info'
}

const statusChipColor = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'default'
  return 'warning' // open
}

const FollowUps = () => {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    open: 0,
    completed: 0,
    total: 0,
  })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(24)
  const [taskStatus, setTaskStatus] = useState('all')
  const [bucket, setBucket] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null) // single task to delete (object)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [actionInfo, setActionInfo] = useState(null) // success toast text

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (taskStatus && taskStatus !== 'all') params.set('taskStatus', taskStatus)
      if (bucket && bucket !== 'all') params.set('bucket', bucket)
      if (from) params.set('from', new Date(from).toISOString())
      if (to) params.set('to', new Date(to).toISOString())
      if (search.trim()) params.set('search', search.trim())
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await apiCall(`/call-logs/follow-ups?${params.toString()}`, 'GET')
      if (res?.success) {
        setRows(res.rows || [])
        setTotal(res.total || 0)
        setCounts(
          res.counts || {
            overdue: 0,
            dueToday: 0,
            upcoming: 0,
            open: 0,
            completed: 0,
            total: 0,
          },
        )
      } else {
        setError(res?.message || 'Failed to load follow-ups')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }, [taskStatus, bucket, from, to, search, page, limit])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Resolve the current business's id from localStorage (cached by login)
  // or by calling /user/details. Cached after first resolution so repeat
  // bulk deletes don't pay the round-trip every time.
  const resolveBusinessId = useCallback(async () => {
    let bid = localStorage.getItem('businessId') || ''
    if (bid) return bid
    try {
      const r = await apiCall('/v1/user/details', 'GET')
      const u = r?.user || r?.data || r
      bid =
        u?.businessId ||
        u?.businessid ||
        (u?.business && (u.business._id || u.business.id)) ||
        ''
      if (bid) {
        try { localStorage.setItem('businessId', bid) } catch (e) {}
      }
    } catch (e) {}
    return bid
  }, [])

  const handleConfirmDeleteOne = async () => {
    if (!deleteTarget?._id) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const r = await apiCall(`/tasks/${deleteTarget._id}`, 'DELETE')
      if (r?.success) {
        setActionInfo(`Deleted follow-up "${deleteTarget.title || 'Follow up'}"`)
        setDeleteTarget(null)
        // Refresh; if the page is now empty after deletion, drop back.
        await fetchRows()
      } else {
        setDeleteError(r?.message || 'Failed to delete')
      }
    } catch (e) {
      setDeleteError(e?.response?.data?.message || e?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleConfirmDeleteAll = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const bid = await resolveBusinessId()
      if (!bid) {
        setDeleteError('No business ID found for this account.')
        return
      }
      // 60s timeout: deleteMany on a large fleet can take longer than
      // axios default of 10s. Same pattern as the sticky-agents clear-all.
      const r = await apiCall(`/tasks/business/${bid}`, 'DELETE', null, {
        timeout: 60000,
      })
      if (r?.success) {
        setActionInfo(`Deleted ${r.deleted ?? 0} follow-up${r.deleted === 1 ? '' : 's'}`)
        setBulkDeleteOpen(false)
        setPage(1)
        await fetchRows()
      } else {
        setDeleteError(r?.message || 'Failed to delete')
      }
    } catch (e) {
      setDeleteError(e?.response?.data?.message || e?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // Client-side agent filter on top of the server response. Pages are
  // small enough that this is fine; promotes to server-side once a
  // tenant grows.
  const visibleRows = useMemo(() => {
    if (!agentFilter.trim()) return rows
    const needle = agentFilter.trim().toLowerCase()
    return rows.filter((r) => {
      const name = (r.agent?.name || '').toLowerCase()
      const email = (r.agent?.email || '').toLowerCase()
      return name.includes(needle) || email.includes(needle)
    })
  }, [rows, agentFilter])

  const toggleBucket = (val) => {
    setPage(1)
    setBucket((cur) => (cur === val ? 'all' : val))
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="h5" fontWeight={600}>
          Follow Ups
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setBulkDeleteOpen(true)}
            disabled={loading || total === 0}
          >
            Delete All
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRows} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {actionInfo && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionInfo(null)}>
          {actionInfo}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {total} tasks — {counts.open} open, {counts.completed} completed.
      </Typography>

      {/* Quick-glance chips: each clickable as a bucket filter. */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<WarningAmberIcon />}
          label={`Overdue: ${counts.overdue}`}
          color={bucket === 'overdue' ? 'error' : 'default'}
          variant={bucket === 'overdue' ? 'filled' : 'outlined'}
          onClick={() => toggleBucket('overdue')}
          clickable
        />
        <Chip
          icon={<AccessTimeIcon />}
          label={`Due Today: ${counts.dueToday}`}
          color={bucket === 'due-today' ? 'warning' : 'default'}
          variant={bucket === 'due-today' ? 'filled' : 'outlined'}
          onClick={() => toggleBucket('due-today')}
          clickable
        />
        <Chip
          icon={<EventIcon />}
          label={`Upcoming: ${counts.upcoming}`}
          color={bucket === 'upcoming' ? 'info' : 'default'}
          variant={bucket === 'upcoming' ? 'filled' : 'outlined'}
          onClick={() => toggleBucket('upcoming')}
          clickable
        />
        <Chip
          icon={<CheckCircleIcon />}
          label={`Completed: ${counts.completed}`}
          color={taskStatus === 'completed' ? 'success' : 'default'}
          variant={taskStatus === 'completed' ? 'filled' : 'outlined'}
          onClick={() => {
            setPage(1)
            setBucket('all')
            setTaskStatus((cur) => (cur === 'completed' ? 'all' : 'completed'))
          }}
          clickable
        />
        <Chip
          label={`Total: ${counts.total}`}
          color={taskStatus === 'all' && bucket === 'all' ? 'primary' : 'default'}
          variant={taskStatus === 'all' && bucket === 'all' ? 'filled' : 'outlined'}
          onClick={() => {
            setPage(1)
            setBucket('all')
            setTaskStatus('all')
          }}
          clickable
        />
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' },
              gap: 2,
            }}
          >
            <TextField
              select
              size="small"
              label="Status"
              value={taskStatus}
              onChange={(e) => {
                setPage(1)
                setTaskStatus(e.target.value)
              }}
              fullWidth
            >
              {TASK_STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="When"
              value={bucket}
              onChange={(e) => {
                setPage(1)
                setBucket(e.target.value)
              }}
              fullWidth
            >
              {BUCKET_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="From"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => {
                setPage(1)
                setFrom(e.target.value)
              }}
              fullWidth
            />
            <TextField
              size="small"
              label="To"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => {
                setPage(1)
                setTo(e.target.value)
              }}
              fullWidth
            />
            <TextField
              size="small"
              label="Search (title/note/contact)"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              fullWidth
            />
          </Box>
          <Box sx={{ mt: 2, maxWidth: 320 }}>
            <TextField
              size="small"
              label="Filter by agent name or email"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              fullWidth
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ color: 'error.main' }}>{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress size={32} />
        </Box>
      ) : visibleRows.length === 0 ? (
        <Card>
          <CardContent sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
            No follow-ups match the current filters.
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, backgroundColor: '#f7f8fa' } }}>
                <TableCell>Status</TableCell>
                <TableCell>Title / Note</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Sentiment</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Call Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((task) => (
                <TableRow key={task._id} hover>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      color={statusChipColor(task.status)}
                      sx={{ textTransform: 'capitalize', minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {task.title || 'Follow up'}
                    </Typography>
                    {task.note && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={task.note}
                      >
                        {task.note}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.agent?.name || '-'}</Typography>
                    {task.agent?.email && (
                      <Typography variant="caption" color="text.secondary">
                        {task.agent.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.contact || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <Chip
                        label={formatShortDate(task.dueDate)}
                        size="small"
                        color={dueChipColor(task)}
                        variant={dueChipColor(task) === 'default' ? 'outlined' : 'filled'}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      variant="outlined"
                      color={PRIORITY_COLORS[task.priority] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  {/* Sentiment — agent's lead-qualification verdict, copied
                      from the linked call log when the task was created.
                      Stored under the historical field name `callInterest`. */}
                  <TableCell>
                    {task.callInterest ? (() => {
                      const v = task.callInterest
                      const positive = v === 'interested' || v === 'callback'
                      const negative = v === 'not_interested' || v === 'do_not_call'
                      return (
                        <Chip
                          label={String(v).replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            bgcolor: positive ? '#d1fae5' : negative ? '#fee2e2' : '#f3f4f6',
                            color: positive ? '#065f46' : negative ? '#991b1b' : '#374151',
                            fontWeight: 600,
                          }}
                        />
                      )
                    })() : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    {Array.isArray(task.tags) && task.tags.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {task.tags.slice(0, 3).map((tag, i) => (
                          <Chip
                            key={`${task._id}-tag-${i}`}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        ))}
                        {task.tags.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{task.tags.length - 3}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{task.callType || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatShortDate(task.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete this follow-up">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(task)}
                          disabled={deleting}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {total > limit && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(e, p) => setPage(p)}
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Single-row delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this follow-up?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <b>{deleteTarget?.title || 'Follow up'}</b>
            <br />
            <Typography variant="caption" color="text.secondary">
              Agent: {deleteTarget?.agent?.name || '-'}
              {deleteTarget?.contact ? ` · Contact: ${deleteTarget.contact}` : ''}
            </Typography>
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteOne}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Master / bulk-delete confirmation */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={() => (deleting ? null : setBulkDeleteOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete ALL follow-ups?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete <b>every</b> follow-up across every agent
            in this business — <b>{total}</b> task{total === 1 ? '' : 's'} total.
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteAll}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} /> : <DeleteSweepIcon />}
          >
            {deleting ? 'Deleting…' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FollowUps
