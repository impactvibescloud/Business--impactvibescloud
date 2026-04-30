import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { apiCall } from '../../config/api'

const DidAssignmentsDialog = ({ open, onClose, number }) => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newExt, setNewExt] = useState('')
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (open && number) fetchAssignments()
    else {
      setAssignments([])
      setNewExt('')
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, number])

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiCall(`/numbers/${number._id}/assignments`, 'GET')
      const data = res?.data ?? res
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('fetchAssignments error', err)
      setError('Failed to load assignments')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const addAssignment = async () => {
    if (!newExt.trim()) return setError('Extension number required')
    setAdding(true)
    setError(null)
    try {
      const res = await apiCall(`/numbers/${number._id}/assign`, 'POST', { extensionNumber: newExt.trim() })
      const added = res?.data ?? res
      setAssignments((s) => [...s, added])
      setNewExt('')
    } catch (err) {
      console.error('addAssignment error', err)
      setError('Failed to add assignment')
    } finally {
      setAdding(false)
    }
  }

  const removeAssignment = async (id) => {
    if (!id) return
    setDeletingId(id)
    setError(null)
    try {
      await apiCall(`/numbers/${number._id}/assignments/${id}`, 'DELETE')
      setAssignments((s) => s.filter((a) => String(a._id) !== String(id)))
    } catch (err) {
      console.error('removeAssignment error', err)
      setError('Failed to remove assignment')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Assignments — {number?.number || '—'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField size="small" label="Extension" value={newExt} onChange={(e) => setNewExt(e.target.value)} fullWidth />
          <Button variant="contained" onClick={addAssignment} disabled={adding} startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}>
            Add
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
        ) : assignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No assignments found.</Typography>
        ) : (
          <List>
            {assignments.map((a) => (
              <ListItem key={a._id} secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => removeAssignment(a._id)} disabled={deletingId === a._id}>
                  {deletingId === a._id ? <CircularProgress size={18} /> : <DeleteIcon />}
                </IconButton>
              }>
                <ListItemText primary={a.extensionNumber} secondary={a.assignedToBranch ? `Branch: ${a.assignedToBranch}` : (a.assignedToBusiness ? `Business: ${a.assignedToBusiness}` : '')} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DidAssignmentsDialog
