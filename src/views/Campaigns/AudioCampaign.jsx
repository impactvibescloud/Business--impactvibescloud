import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { apiCall, getBaseURL } from '../../config/api'
import {
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'

const STATUS_COLORS = {
  scheduled: 'info',
  running: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
}

const formatDateTime = (d) => {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleString()
  } catch {
    return String(d)
  }
}

// Convert an ISO/date string to the value format <input type="datetime-local"> expects
// (`YYYY-MM-DDTHH:mm`). Returns '' for falsy input.
const toDateTimeLocal = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

// Edit is only allowed when:
//   1. The campaign hasn't already fired (status not completed/running/failed)
//   2. The scheduled time is more than 5 minutes away — otherwise the
//      scheduler may pick it up mid-edit and use stale data
// Campaigns with no scheduledAt (manual-trigger only) remain editable
// until someone hits Run.
const EDIT_BUFFER_MS = 5 * 60 * 1000
const isCampaignEditable = (c) => {
  if (!c) return false
  const status = String(c.status || '').toLowerCase()
  if (['completed', 'running', 'failed', 'cancelled'].includes(status)) return false
  if (!c.scheduledAt) return true
  const due = new Date(c.scheduledAt).getTime()
  if (Number.isNaN(due)) return true
  return due - Date.now() > EDIT_BUFFER_MS
}

const editLockedReason = (c) => {
  if (!c) return ''
  const status = String(c.status || '').toLowerCase()
  if (status === 'completed') return 'Campaign has already completed'
  if (status === 'running') return 'Campaign is currently running'
  if (status === 'failed') return 'Campaign already attempted (failed)'
  if (status === 'cancelled') return 'Campaign was cancelled'
  if (c.scheduledAt) {
    const due = new Date(c.scheduledAt).getTime()
    const remaining = due - Date.now()
    if (remaining <= 0) return 'Scheduled time has passed'
    if (remaining <= EDIT_BUFFER_MS) {
      const mins = Math.max(0, Math.ceil(remaining / 60000))
      return `Too close to scheduled time (${mins} min away) — edits aren't safe within 5 minutes`
    }
  }
  return ''
}

const AudioCampaign = () => {
  // ------- Identity / DIDs -------
  const [businessId, setBusinessId] = useState('')
  const [didOptions, setDidOptions] = useState([])
  const [loadingDids, setLoadingDids] = useState(false)

  // ------- Campaign list -------
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)

  // ------- Create / Edit modal -------
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create') // 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null) // campaign being edited
  const [form, setForm] = useState({
    name: '',
    didNumber: '',
    scheduledAt: '',
  })
  const [numbersFile, setNumbersFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)
  const audioRef = useRef(null)

  // ------- View modal -------
  const [viewOpen, setViewOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)

  const token = useMemo(
    () => localStorage.getItem('authToken') || localStorage.getItem('token'),
    [],
  )

  // ---------- effects ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const user = res?.user || res?.data || res
        const bid = user?.businessId || user?.businessid || ''
        if (bid) setBusinessId(bid)
      } catch (e) {
        console.warn('Could not fetch user details for businessId', e)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!businessId) return
    const fetchDids = async () => {
      setLoadingDids(true)
      try {
        const resp = await apiCall(`/numbers/assigned-to/${businessId}`, 'GET')
        const list = resp?.data || resp?.numbers || resp || []
        const options = (Array.isArray(list) ? list : [])
          .map((d) => ({ id: d._id || d.id, number: d.number || String(d) }))
          .filter((d) => d.number)
        setDidOptions(options)
      } catch (e) {
        console.warn('Failed to fetch DID numbers', e)
      } finally {
        setLoadingDids(false)
      }
    }
    fetchDids()
  }, [businessId])

  const fetchCampaigns = useCallback(async () => {
    if (!businessId) return
    setLoadingCampaigns(true)
    try {
      const res = await apiCall(`/campaigns?businessId=${businessId}`, 'GET')
      let payload = res
      if (res?.data?.data !== undefined) payload = res.data
      else if (res?.success && res?.data !== undefined) payload = res
      const list = payload?.data || payload?.campaigns || payload?.results || payload || []
      setCampaigns(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn('Failed to fetch campaigns', e)
    } finally {
      setLoadingCampaigns(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // ---------- modal helpers ----------
  const resetForm = () => {
    setForm({ name: '', didNumber: '', scheduledAt: '' })
    setNumbersFile(null)
    setAudioFile(null)
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    if (audioRef.current) audioRef.current.value = ''
  }

  const openCreate = () => {
    resetForm()
    setFormMode('create')
    setEditTarget(null)
    setFormOpen(true)
  }

  const openEdit = (campaign) => {
    setFormMode('edit')
    setEditTarget(campaign)
    setForm({
      name: campaign.name || '',
      didNumber: campaign.didNumber || '',
      scheduledAt: toDateTimeLocal(campaign.scheduledAt),
    })
    setNumbersFile(null)
    setAudioFile(null)
    if (fileRef.current) fileRef.current.value = ''
    if (audioRef.current) audioRef.current.value = ''
    setFormOpen(true)
  }

  const closeForm = () => {
    if (uploading) return
    setFormOpen(false)
  }

  // ---------- submit (create OR edit) ----------
  const submitForm = async () => {
    if (!form.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Campaign name is required.' })
      return
    }
    if (formMode === 'create') {
      if (!businessId) {
        Swal.fire({ icon: 'error', title: 'Missing business', text: 'Business ID is required to create a campaign.' })
        return
      }
      if (!form.didNumber) {
        Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please pick a DID number.' })
        return
      }
      if (!numbersFile) {
        Swal.fire({ icon: 'warning', title: 'Missing file', text: 'Please upload a contacts CSV/XLSX.' })
        return
      }
    }

    const formData = new FormData()
    formData.append('name', form.name.trim())
    if (formMode === 'create') formData.append('businessId', businessId)
    if (form.didNumber) formData.append('didNumber', form.didNumber)
    if (form.scheduledAt) {
      formData.append('scheduledAt', new Date(form.scheduledAt).toISOString())
    }
    if (numbersFile) formData.append('file', numbersFile)
    if (audioFile) formData.append('audio', audioFile)

    const url =
      formMode === 'create'
        ? `${getBaseURL()}/api/campaigns/upload`
        : `${getBaseURL()}/api/campaigns/${editTarget._id || editTarget.id}`
    const method = formMode === 'create' ? 'post' : 'put'

    setUploading(true)
    setProgress(0)
    try {
      const res = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total))
        },
      })
      const ok = res?.data?.success !== false
      if (ok) {
        Swal.fire({
          icon: 'success',
          title: formMode === 'create' ? 'Campaign created' : 'Campaign updated',
          text: res?.data?.message || 'Saved successfully',
          timer: 1500,
          showConfirmButton: false,
        })
        setFormOpen(false)
        resetForm()
        await fetchCampaigns()
      } else {
        throw new Error(res?.data?.message || 'Save failed')
      }
    } catch (err) {
      console.error('Save failed', err)
      Swal.fire({
        icon: 'error',
        title: formMode === 'create' ? 'Create failed' : 'Update failed',
        text: err?.response?.data?.message || err?.message || 'Operation failed',
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  // ---------- view ----------
  const openView = (campaign) => {
    setViewTarget(campaign)
    setViewOpen(true)
  }

  const closeView = () => {
    setViewOpen(false)
    setViewTarget(null)
  }

  // ---------- delete ----------
  const handleDelete = async (campaign) => {
    const id = campaign._id || campaign.id
    if (!id) return
    const result = await Swal.fire({
      title: 'Delete campaign?',
      text: `"${campaign.name || 'this campaign'}" will be permanently deleted. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    })
    if (!result.isConfirmed) return
    try {
      // 60s — delete fans out to multiple Asterisk SSH commands (astdb
      // teardown + remote audio dir cleanup). Default 10s axios timeout
      // would fire before the cascade completes on a slow PBX.
      await apiCall(`/campaigns/${id}`, 'DELETE', null, { timeout: 60000 })
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        timer: 1200,
        showConfirmButton: false,
      })
      await fetchCampaigns()
    } catch (err) {
      // Treat client-side timeout as "probably succeeded" — verify by
      // re-fetching the list. If the row is gone, treat as success.
      const isTimeout =
        err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')
      if (isTimeout) {
        try {
          await fetchCampaigns()
          const stillThere = campaigns.some((c) => (c._id || c.id) === id)
          if (!stillThere) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              timer: 1200,
              showConfirmButton: false,
            })
            return
          }
        } catch (_) {}
      }
      console.error('Delete failed', err)
      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err?.response?.data?.message || err?.message || 'Failed',
      })
    }
  }

  // ---------- run now ----------
  const runNow = async (campaign) => {
    const id = campaign._id || campaign.id
    if (!id) return
    const result = await Swal.fire({
      title: 'Run this campaign now?',
      text: `Calls will be placed to all ${
        Array.isArray(campaign.numbers) ? campaign.numbers.length : '?'
      } contact(s).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Run Now',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return
    try {
      // Run-now dials each contact sequentially via Asterisk with a
      // configurable inter-call delay (default 3s). For even a small
      // contact list this blows past the 10s axios default. Give the
      // request a wide window. (The actual originate runs server-side
      // even if the client gives up earlier — see timeout handler below.)
      const r = await apiCall(`/campaigns/${id}/run`, 'POST', {}, { timeout: 600000 })
      Swal.fire({
        icon: 'success',
        title: 'Campaign started',
        text: r?.message || 'Campaign is running',
        timer: 1500,
        showConfirmButton: false,
      })
      await fetchCampaigns()
    } catch (err) {
      const isTimeout =
        err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')
      if (isTimeout) {
        // The server is still running the campaign — close out with a
        // friendly "started in background" message and refresh so the
        // status flips to "running".
        Swal.fire({
          icon: 'info',
          title: 'Campaign is running',
          text: 'Calls are being placed in the background. The status will update shortly.',
          timer: 2500,
          showConfirmButton: false,
        })
        try { await fetchCampaigns() } catch (_) {}
        return
      }
      Swal.fire({
        icon: 'error',
        title: 'Run failed',
        text: err?.response?.data?.message || err?.message || 'Failed',
      })
    }
  }

  // ---------- sample download ----------
  // Triggers a download via a temporary <a> using the API base URL +
  // bearer token query param? Backend expects bearer in headers, so we
  // fetch as blob then save with a synthesized object URL.
  const downloadSample = async (type) => {
    try {
      const res = await axios.get(`${getBaseURL()}/api/campaigns/sample/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        type === 'csv'
          ? 'campaign-contacts-sample.csv'
          : type === 'xlsx'
            ? 'campaign-contacts-sample.xlsx'
            : 'campaign-audio-sample.wav'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Download failed',
        text: err?.response?.data?.message || err?.message || 'Failed',
      })
    }
  }

  // ---------- audio URL helper (for the View modal player) ----------
  const audioPlaybackUrl = (campaign) => {
    if (!campaign?.audioFile) return null
    const a = campaign.audioFile
    if (/^https?:\/\//i.test(a)) return a
    if (a.startsWith('/uploads/')) return `${getBaseURL()}${a}`
    // If it's an asterisk-side identifier (e.g. custom/campaigns/<biz>/<did>/<name>),
    // it isn't directly fetchable over HTTP. Return null so the UI shows a
    // helpful message instead of a broken player.
    return null
  }

  // ---------- render ----------
  return (
    <Box className="page-container p-3">
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Audio Campaigns
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              Create, edit, and run automated audio campaigns. Upload a contacts
              file and an audio clip — we'll call each contact and play your audio.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="Refresh list">
              <IconButton onClick={fetchCampaigns} disabled={loadingCampaigns}>
                {loadingCampaigns ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}
            >
              New Campaign
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Paper variant="outlined">
          {loadingCampaigns ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : campaigns.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No campaigns yet. Click "New Campaign" to create your first one.</Typography>
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#f8fafc' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>DID</TableCell>
                  <TableCell align="right">Contacts</TableCell>
                  <TableCell>Audio</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last update</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => {
                  const id = c._id || c.id
                  const status = String(c.status || 'scheduled').toLowerCase()
                  const count = Array.isArray(c.numbers) ? c.numbers.length : 0
                  return (
                    <TableRow key={id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.name || 'Untitled'}
                        </Typography>
                      </TableCell>
                      <TableCell>{c.didNumber || c.did || '-'}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell>
                        {c.audioFile ? (
                          <Chip size="small" label="Audio attached" variant="outlined" color="success" />
                        ) : (
                          <Chip size="small" label="No audio" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(c.scheduledAt)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={status}
                          color={STATUS_COLORS[status] || 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{formatDateTime(c.updatedAt || c.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => openView(c)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isCampaignEditable(c) ? (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEdit(c)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={`Edit unavailable: ${editLockedReason(c)}`}>
                              <span>
                                <IconButton size="small" disabled>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {status !== 'running' && status !== 'completed' && (
                            <Tooltip title="Run now">
                              <IconButton size="small" color="success" onClick={() => runNow(c)}>
                                <PlayCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(c)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* ---------- Create / Edit dialog ---------- */}
      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {formMode === 'create' ? 'New Audio Campaign' : 'Edit Campaign'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Campaign name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
              autoFocus
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="did-label">DID number</InputLabel>
              <Select
                labelId="did-label"
                value={form.didNumber}
                label="DID number"
                onChange={(e) => setForm((f) => ({ ...f, didNumber: e.target.value }))}
              >
                <MenuItem value="">
                  <em>Select DID</em>
                </MenuItem>
                {loadingDids ? (
                  <MenuItem disabled>Loading…</MenuItem>
                ) : (
                  didOptions.map((d) => (
                    <MenuItem key={d.id || d.number} value={d.number}>
                      {d.number}
                    </MenuItem>
                  ))
                )}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Outbound DID used for the campaign calls.
              </Typography>
            </FormControl>

            <TextField
              label="Scheduled at (optional)"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              size="small"
              helperText="Leave empty to start manually via the Run button."
            />

            <Divider />

            {/* Contacts file + sample */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Contacts file (CSV / XLSX)
                  {formMode === 'edit' && (
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Leave empty to keep existing contacts
                    </Typography>
                  )}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadSample('csv')}
                    variant="text"
                  >
                    Sample CSV
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadSample('xlsx')}
                    variant="text"
                  >
                    Sample XLSX
                  </Button>
                </Stack>
              </Stack>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(e) => setNumbersFile(e.target.files?.[0] || null)}
                ref={fileRef}
                style={{ width: '100%' }}
              />
              {numbersFile && (
                <Typography variant="caption" color="text.secondary">
                  Selected: {numbersFile.name} ({Math.round(numbersFile.size / 1024)} KB)
                </Typography>
              )}
              {formMode === 'edit' && !numbersFile && (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}
                >
                  Currently attached:{' '}
                  <b>
                    {Array.isArray(editTarget?.numbers)
                      ? editTarget.numbers.length
                      : 0}{' '}
                    contact
                    {Array.isArray(editTarget?.numbers) && editTarget.numbers.length === 1
                      ? ''
                      : 's'}
                  </b>{' '}
                  — re-upload only if you want to replace the list.
                </Typography>
              )}
            </Box>

            {/* Audio file + sample */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Audio file{formMode === 'create' ? ' (optional)' : ''}
                  {formMode === 'edit' && (
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Leave empty to keep existing audio
                    </Typography>
                  )}
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadSample('audio')}
                  variant="text"
                >
                  Sample audio
                </Button>
              </Stack>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                ref={audioRef}
                style={{ width: '100%' }}
              />
              {audioFile && (
                <Typography variant="caption" color="text.secondary">
                  Selected: {audioFile.name} ({Math.round(audioFile.size / 1024)} KB)
                </Typography>
              )}
              {/* Show the currently-attached audio in EDIT mode so the
                  user knows what's already there without having to close
                  this dialog and open the View one. */}
              {formMode === 'edit' && editTarget?.audioFile && !audioFile && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534' }}>
                    Current audio file (kept if you don't upload a new one):
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.25,
                      color: '#374151',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      fontSize: 11,
                    }}
                  >
                    {editTarget.audioFile}
                  </Typography>
                </Box>
              )}
              {formMode === 'edit' && !editTarget?.audioFile && !audioFile && (
                <Alert severity="warning" sx={{ mt: 1, fontSize: 12 }}>
                  This campaign has no audio attached. Upload one before
                  saving — otherwise the campaign call will only beep.
                </Alert>
              )}
            </Box>

            <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
              The CSV/XLSX should have a column named <code>number</code>,{' '}
              <code>phone</code>, <code>msisdn</code>, or <code>mobile</code> — or
              just put one number per row in column A. Use the Sample buttons above
              to download a working template.
            </Alert>

            {uploading && (
              <Box>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption">{progress}% uploaded</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={submitForm}
            disabled={uploading}
            variant="contained"
            sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}
          >
            {uploading
              ? formMode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : formMode === 'create'
                ? 'Create Campaign'
                : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- View dialog ---------- */}
      <Dialog open={viewOpen} onClose={closeView} fullWidth maxWidth="sm">
        <DialogTitle>Campaign Details</DialogTitle>
        <DialogContent dividers>
          {viewTarget && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {viewTarget.name}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">DID</Typography>
                  <Typography variant="body2">{viewTarget.didNumber || '-'}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={viewTarget.status || 'scheduled'}
                      color={STATUS_COLORS[String(viewTarget.status || 'scheduled').toLowerCase()] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Contacts</Typography>
                  <Typography variant="body2">
                    {Array.isArray(viewTarget.numbers) ? viewTarget.numbers.length : 0}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Scheduled at</Typography>
                  <Typography variant="body2">{formatDateTime(viewTarget.scheduledAt)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{formatDateTime(viewTarget.createdAt)}</Typography>
                </Box>
              </Stack>

              {viewTarget.result?.summary && (
                <Box
                  sx={{
                    p: 1.5,
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    bgcolor: viewTarget.result.summary.allDryRun ? '#fff7ed' : '#f0fdf4',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151' }}>
                    Run summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`Total: ${viewTarget.result.summary.total}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      color="success"
                      label={`Succeeded: ${viewTarget.result.summary.succeeded}`}
                    />
                    <Chip
                      size="small"
                      color="error"
                      label={`Failed: ${viewTarget.result.summary.failed}`}
                    />
                    {viewTarget.result.summary.dryRun > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        label={`Dry-run (no real call): ${viewTarget.result.summary.dryRun}`}
                      />
                    )}
                  </Box>
                  {viewTarget.result.summary.allDryRun && (
                    <Alert severity="warning" sx={{ mt: 1, fontSize: 12 }}>
                      All numbers were dialed in DRY-RUN mode — no real calls
                      were placed. Set <code>CAMPAIGN_DRY_RUN=false</code> (or
                      remove the env var) in the API's <code>.env</code> and
                      restart the API to actually place calls.
                    </Alert>
                  )}
                </Box>
              )}

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Audio</Typography>
                {viewTarget.audioFile ? (
                  audioPlaybackUrl(viewTarget) ? (
                    <Box sx={{ mt: 0.5 }}>
                      <audio controls src={audioPlaybackUrl(viewTarget)} style={{ width: '100%' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {viewTarget.audioFile}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Chip size="small" label="Stored on Asterisk" color="info" variant="outlined" />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', wordBreak: 'break-all' }}>
                        {viewTarget.audioFile}
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary">No audio attached</Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Contacts list ({Array.isArray(viewTarget.numbers) ? viewTarget.numbers.length : 0})
                </Typography>
                <Box
                  sx={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    mt: 0.5,
                    p: 1,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {Array.isArray(viewTarget.numbers) && viewTarget.numbers.length > 0
                    ? viewTarget.numbers.join('\n')
                    : '(none)'}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {isCampaignEditable(viewTarget) ? (
            <Button
              onClick={() => {
                const target = viewTarget
                closeView()
                if (target) openEdit(target)
              }}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          ) : (
            <Tooltip title={editLockedReason(viewTarget)}>
              <span>
                <Button disabled startIcon={<EditIcon />}>
                  Edit
                </Button>
              </span>
            </Tooltip>
          )}
          <Button onClick={closeView} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AudioCampaign
