import React, { useEffect, useState } from 'react'
import { apiCall } from '../../config/api'
import {
  Box,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import './CallLogsWebpage.css'

const LeadFields = () => {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [label, setLabel] = useState('')
  const [type, setType] = useState('string')
  const [hasOptions, setHasOptions] = useState(false)
  const [options, setOptions] = useState([''])

  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const fetchBusinessIdIfNeeded = async () => {
    const b = localStorage.getItem('businessId') || ''
    if (b) return b
    try {
      const ud = await apiCall('/v1/user/details', 'GET')
      const u = ud?.user || ud?.data || ud
      if (u && u.businessId) {
        try { localStorage.setItem('businessId', u.businessId) } catch (e) {}
        return u.businessId
      }
    } catch (e) {}
    return ''
  }

  const createFieldKey = (label, id) => {
    const base = String(label || id || '').trim().toLowerCase()
    return base.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  }

  const fetchFields = async () => {
    setLoading(true)
    setError(null)
    try {
      const businessId = await fetchBusinessIdIfNeeded()
      if (!businessId) {
        setFields([])
        setLoading(false)
        return []
      }
      const res = await apiCall(`/lead-fields?businessId=${encodeURIComponent(businessId)}`, 'GET')
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.leadFields)
        ? res.leadFields
        : []
      const normalized = (data || []).map(f => ({
        ...f,
        key: f.key || f.name || createFieldKey(f.label || f._id || f.id, f._id || f.id)
      }))
      setFields(normalized)
      return normalized
    } catch (e) {
      console.warn('lead-fields fetch failed', e)
      setError('Failed to load lead fields')
      setFields([])
      return []
    } finally {
      setLoading(false)
    }
  }

  const persistReorder = async (updated) => {
    if (!Array.isArray(updated)) return
    setSavingOrder(true)
    setError(null)
    try {
      const businessId = await fetchBusinessIdIfNeeded()
      const positions = updated.map((f, i) => ({ id: f._id || f.id || f.key, order: i }))
      const payload = { positions }
      if (businessId) payload.businessId = businessId
      await apiCall('/lead-fields/reorder', 'POST', payload)
      // refresh server state and notify listeners
      await fetchFields()
      try { window.dispatchEvent(new Event('leadFieldsUpdated')) } catch (e) {}
    } catch (e) {
      console.error('persistReorder failed', e)
      setError('Failed to save field order')
    } finally {
      setSavingOrder(false)
    }
  }

  // Drag & drop handlers (HTML5 DnD)
  const onDragStart = (e, idx) => {
    try { e.dataTransfer.setData('text/plain', String(idx)) } catch (err) {}
    e.dataTransfer.effectAllowed = 'move'
    setDragIndex(idx)
  }

  const onDragEnter = (e, idx) => {
    e.preventDefault()
    setDragOverIndex(idx)
  }

  const onDragOverRow = (e) => {
    e.preventDefault()
    try { e.dataTransfer.dropEffect = 'move' } catch (err) {}
  }

  const onDragLeave = () => setDragOverIndex(null)

  const onDrop = async (e, idx) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('text/plain')
    const from = Number(raw)
    if (isNaN(from)) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    let to = idx
    if (to < 0) to = 0
    if (to > fields.length) to = fields.length
    if (from === to) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const copy = fields.slice()
    const item = copy.splice(from, 1)[0]
    // adjust insertion when removing earlier index
    if (from < to) {
      copy.splice(to - 1, 0, item)
    } else {
      copy.splice(to, 0, item)
    }
    setFields(copy)
    setDragIndex(null)
    setDragOverIndex(null)
    await persistReorder(copy)
  }

  useEffect(() => {
    fetchFields()
  }, [])

  const handleAddOption = () => setOptions(o => [...o, ''])
  const handleOptionChange = (idx, v) => setOptions(o => o.map((x,i) => i===idx ? v : x))
  const handleRemoveOption = (idx) => setOptions(o => o.filter((_,i)=>i!==idx))

  const resetForm = () => {
    setLabel('')
    setType('string')
    setHasOptions(false)
    setOptions([''])
  }

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const businessId = await fetchBusinessIdIfNeeded()
      if (!businessId) {
        setError('Business ID not found. Please login again.')
        setSaving(false)
        return
      }
      const payload = { label: String(label || '').trim(), type: String(type || '').trim(), businessId }
      if (hasOptions) payload.options = options.map(o => String(o || '').trim()).filter(Boolean)
      if (!payload.label) {
        setError('Label is required')
        setSaving(false)
        return
      }
      await apiCall('/lead-fields', 'POST', payload)
      resetForm()
      await fetchFields()
      try { window.dispatchEvent(new Event('leadFieldsUpdated')) } catch (e) {}
    } catch (err) {
      console.error('create lead field failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to create field')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this custom field?')) return
    setLoading(true)
    try {
      const businessId = await fetchBusinessIdIfNeeded()
      if (!businessId) throw new Error('Business ID not found')
      // Best-effort delete; backend may accept DELETE /lead-fields/:id
      await apiCall(`/lead-fields/${encodeURIComponent(id)}?businessId=${encodeURIComponent(businessId)}`, 'DELETE')
      await fetchFields()
      try { window.dispatchEvent(new Event('leadFieldsUpdated')) } catch (e) {}
    } catch (err) {
      console.warn('delete failed', err)
      setError('Failed to delete field')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <h3>Lead Fields</h3>
          <Box component="div" sx={{ color: '#6b7280' }}>Create and manage custom fields for leads</Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} size="small" fullWidth />

            <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value)} size="small" fullWidth>
              <MenuItem value="string">String</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
            </TextField>

            <FormControlLabel control={<Checkbox checked={hasOptions} onChange={(e) => setHasOptions(Boolean(e.target.checked))} />} label="Has options (select)" />

            {hasOptions && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {options.map((opt, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} size="small" fullWidth />
                    <Button variant="outlined" color="error" size="small" onClick={() => handleRemoveOption(idx)}>Remove</Button>
                  </Box>
                ))}
                <Button variant="text" size="small" onClick={handleAddOption}>Add option</Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="contained" type="submit" sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }} disabled={saving}>{saving ? 'Saving…' : 'Create Field'}</Button>
              <Button variant="outlined" onClick={resetForm}>Reset</Button>
            </Box>
            {error && <Box sx={{ color: '#dc2626', mt: 1 }}>{error}</Box>}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <h5>Existing Fields</h5>
            {savingOrder && <Box sx={{ color: '#6c5ce7' }}>Saving…</Box>}
          </Box>

          {loading ? (
            <div>Loading…</div>
          ) : (
            <Paper variant="outlined" className="calllogs-table-container">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Options</TableCell>
                    <TableCell style={{ width: 140 }}>Order / Drag</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, fields.length)}>
                  {(!fields || fields.length === 0) ? (
                    <TableRow><TableCell colSpan={5} align="center">No custom fields</TableCell></TableRow>
                  ) : (
                    fields.map((f, idx) => (
                      <TableRow
                        key={f._id || f.id || f.label}
                        draggable
                        onDragStart={(e) => onDragStart(e, idx)}
                        onDragEnter={(e) => onDragEnter(e, idx)}
                        onDragOver={(e) => onDragOverRow(e)}
                        onDragLeave={(e) => onDragLeave(e)}
                        onDrop={(e) => onDrop(e, idx)}
                        className={dragOverIndex === idx ? 'draggable-over' : ''}
                        sx={{ opacity: dragIndex === idx ? 0.5 : 1, cursor: 'move' }}
                      >
                        <TableCell>{f.label || '-'}</TableCell>
                        <TableCell>{f.type || '-'}</TableCell>
                        <TableCell>
                          {Array.isArray(f.options) ? f.options.map((opt, i) => (
                            <Chip key={i} label={opt} size="small" className="custom-chip" sx={{ backgroundColor: '#e9f0fa', color: '#321fdb', mr: 0.5 }} />
                          )) : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" className="drag-handle" aria-label="drag"><DragIndicatorIcon fontSize="small" /></IconButton>
                            <Box component="span" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>{idx + 1}</Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(f._id || f.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default LeadFields
