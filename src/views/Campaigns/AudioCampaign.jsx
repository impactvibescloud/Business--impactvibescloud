import React, { useState, useRef, useEffect } from 'react'
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
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import '../Leads/CallLogsWebpage.css'

const AudioCampaign = () => {
  const [name, setName] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [didNumber, setDidNumber] = useState('')
  const [didOptions, setDidOptions] = useState([])
  const [loadingDids, setLoadingDids] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [numbersFile, setNumbersFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)
  const audioRef = useRef(null)
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)

  useEffect(() => {
    // try to get businessId from user details
    const fetchUser = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const user = res.user || res.data || res
        if (user && user.businessId) setBusinessId(user.businessId)
      } catch (err) {
        console.warn('Could not fetch user details for businessId')
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Once businessId is available, fetch DID numbers assigned to the business
    const fetchDids = async () => {
      if (!businessId) return
      setLoadingDids(true)
      try {
        const resp = await apiCall(`/numbers/assigned-to/${businessId}`, 'GET')
        // resp may be { data: [...]} or array
        const list = resp.data || resp.numbers || resp || []
        const options = (Array.isArray(list) ? list : []).map(d => ({ id: d._id || d.id, number: d.number || d }))
        setDidOptions(options)
        // Auto-select first DID if none selected
        if (!didNumber && options.length > 0) setDidNumber(options[0].number)
      } catch (err) {
        console.error('Failed to fetch DID numbers', err)
      } finally {
        setLoadingDids(false)
      }
    }
    fetchDids()
  }, [businessId])

  useEffect(() => {
    // fetch campaigns when businessId becomes available
    if (!businessId) return
    fetchCampaigns()
  }, [businessId])

  const fetchCampaigns = async () => {
    if (!businessId) return
    setLoadingCampaigns(true)
    try {
      // use query param as in your curl example
      const res = await apiCall(`/campaigns?businessId=${businessId}`, 'GET')
      // Normalize response shapes:
      // - axios style: res.data = { success: true, data: [...] }
      // - direct API: { success: true, data: [...] }
      // - legacy: array
      let payload = res
      if (res && res.data && res.data.data !== undefined) {
        // axios wrapper
        payload = res.data
      } else if (res && res.success && res.data !== undefined) {
        payload = res
      }
      const list = payload.data || payload.campaigns || payload.results || payload || []
      setCampaigns(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch campaigns', err)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const handleDelete = async (campaign) => {
    const id = campaign._id || campaign.id
    if (!id) {
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: 'Invalid campaign id' })
      return
    }

    const result = await Swal.fire({
      title: 'Delete campaign?',
      text: `Are you sure you want to delete "${campaign.name || campaign.title || 'this campaign'}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await apiCall(`/campaigns/${id}`, 'DELETE')
      Swal.fire({ icon: 'success', title: 'Deleted', text: 'Campaign deleted successfully' })
      // refresh list
      await fetchCampaigns()
    } catch (err) {
      console.error('Delete failed', err)
      const msg = err?.response?.data?.message || err.message || 'Delete failed'
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: msg })
    }
  }

  const token = localStorage.getItem('authToken')

  const handleSubmit = async () => {
    if (!name || !businessId || !didNumber || !scheduledAt) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill name, business, DID and schedule.' })
      return
    }
    if (!numbersFile) {
      Swal.fire({ icon: 'warning', title: 'Missing file', text: 'Please upload contacts CSV/XLSX file.' })
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('businessId', businessId)
    formData.append('didNumber', didNumber)
    // Convert scheduledAt (from datetime-local) to an ISO timestamp the API accepts
    // If scheduledAt already includes timezone, Date will preserve it; otherwise it will be treated as local time.
    const scheduledToSend = scheduledAt ? new Date(scheduledAt).toISOString() : ''
    formData.append('scheduledAt', scheduledToSend)
    formData.append('file', numbersFile)
    if (audioFile) formData.append('audio', audioFile)

    setUploading(true)
    setProgress(0)

    try {
      const url = `${getBaseURL()}/api/campaigns/upload`
      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total))
        }
      })

        console.log('campaign upload response', res.data)
        Swal.fire({ icon: 'success', title: 'Campaign Created', text: res.data?.message || 'Campaign uploaded successfully' })
        // reset
        setName('')
        setDidNumber('')
        setScheduledAt('')
        setNumbersFile(null)
        setAudioFile(null)
        if (fileRef.current) fileRef.current.value = ''
        if (audioRef.current) audioRef.current.value = ''
        // refresh campaigns list
        try {
          await fetchCampaigns()
        } catch (e) {
          // ignore fetch errors here
        }
        return true
      } catch (err) {
        console.error('Upload failed', err)
        const msg = err?.response?.data?.message || err.message || 'Upload failed'
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: msg })
        return false
      } finally {
        setUploading(false)
        setProgress(0)
      }
  }
  return (
    <Box className="page-container p-3">
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5">Audio Campaigns</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>Create and manage your audio campaigns here.</Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={() => setShowNewCampaign(true)} sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}>New Campaign</Button>
          </Grid>
        </Grid>

        {/* New Campaign Dialog */}
        <Dialog open={showNewCampaign} onClose={() => setShowNewCampaign(false)} fullWidth maxWidth="sm">
          <DialogTitle>New Audio Campaign</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Campaign Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" />

              <FormControl size="small" fullWidth>
                <InputLabel id="did-label">DID Number</InputLabel>
                <Select labelId="did-label" value={didNumber} label="DID Number" onChange={(e) => setDidNumber(e.target.value)}>
                  <MenuItem value="">Select DID Number</MenuItem>
                  {loadingDids ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    didOptions.map(d => (<MenuItem key={d.id} value={d.number}>{d.number}</MenuItem>))
                  )}
                </Select>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Destination DID number for outbound calls.</Typography>
              </FormControl>

              <TextField label="Schedule (UTC)" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />

              <Box>
                <Typography variant="body2">Contacts File (CSV/XLSX)</Typography>
                <input type="file" accept=".csv,.xls,.xlsx" onChange={(e) => setNumbersFile(e.target.files?.[0] || null)} ref={fileRef} />
              </Box>

              <Box>
                <Typography variant="body2">Audio File (optional)</Typography>
                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} ref={audioRef} />
              </Box>

              {uploading && (
                <Box>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption">{progress}%</Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewCampaign(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={async () => { const ok = await handleSubmit(); if (ok) setShowNewCampaign(false) }} disabled={uploading} variant="contained" sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}>{uploading ? 'Uploading...' : 'Create Campaign'}</Button>
          </DialogActions>
        </Dialog>

      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Campaigns</Typography>
        {loadingCampaigns ? (
          <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress /></Box>
        ) : campaigns.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>No campaigns found for this business.</Typography>
        ) : (
          <Box className="calllogs-table-container" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>DID</TableCell>
                  <TableCell>Numbers</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c._id || c.id || c.name}>
                    <TableCell>{c.name || c.title || 'Untitled Campaign'}</TableCell>
                    <TableCell>{c.didNumber || c.did || '-'}</TableCell>
                    <TableCell>{Array.isArray(c.numbers) ? c.numbers.length : (c.numbers ? c.numbers : '-')}</TableCell>
                    <TableCell>{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{c.result?.completedAt ? new Date(c.result.completedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{c.status || c.state || 'N/A'}</TableCell>
                    <TableCell>
                      <Tooltip title="Delete campaign">
                        <IconButton color="error" size="small" onClick={() => handleDelete(c)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default AudioCampaign
