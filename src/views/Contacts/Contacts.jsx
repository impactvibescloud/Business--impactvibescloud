import React, { useState, useEffect } from 'react'
import { apiCall } from '../../config/api'
import {
  Box,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import '../Leads/CallLogsWebpage.css'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewContact, setViewContact] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState('name')
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', tags: [] })
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchContacts = async () => {
    setLoading(true)
    setError('')
    try {
      const userData = await apiCall('/v1/user/details', 'GET').catch(() => null)
      const businessId = userData?.user?.businessId || localStorage.getItem('businessId')
      if (!businessId) throw new Error('Business ID not found. Please login again.')

      const params = new URLSearchParams({ page: String(currentPage), limit: String(itemsPerPage), sortBy: 'createdAt', order: 'desc' })
      if (searchTerm) {
        params.append('search', searchTerm)
        params.append('searchField', searchField)
      }

      const res = await apiCall(`/contacts/business/${businessId}?${params.toString()}`, 'GET')

      let data = []
      if (Array.isArray(res)) data = res
      else if (res && Array.isArray(res.data)) data = res.data
      else if (res && Array.isArray(res.contacts)) data = res.contacts
      else data = []

      setContacts(data)
      const pagination = res?.pagination || res?.data?.pagination || null
      const total = pagination?.total ?? data.length
      const pages = pagination?.pages ?? Math.max(1, Math.ceil(total / itemsPerPage))
      setTotalContacts(total)
      setTotalPages(pages)
    } catch (err) {
      setError(err?.message || 'Failed to fetch contacts')
      setContacts([])
      setTotalPages(1)
      setTotalContacts(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, searchField])

  const resetForm = () => {
    setContactForm({ name: '', email: '', phone: '', company: '', tags: [] })
    setIsEditMode(false)
  }

  const handleInputChange = (e) => {
    const name = e.target.name
    const value = e.target.value
    if (name === 'tags') {
      setContactForm((prev) => ({ ...prev, tags: value ? value.split(',').map(t => t.trim()).filter(Boolean) : [] }))
    } else {
      setContactForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userData = await apiCall('/v1/user/details', 'GET').catch(() => null)
      const businessId = userData?.user?.businessId || localStorage.getItem('businessId')
      if (!businessId) throw new Error('Business ID not found. Please login again.')

      const payload = { ...contactForm, businessId }
      let saved = null
      if (isEditMode && contactForm._id) {
        saved = await apiCall(`/contacts/${contactForm._id}`, 'PUT', payload)
      } else {
        saved = await apiCall('/contacts', 'POST', payload)
      }

      // Normalize response
      const savedContact = (saved && saved.data) ? saved.data : saved

      // Refresh list
      await fetchContacts()
      setShowDialog(false)
      resetForm()
    } catch (err) {
      alert(err?.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  const getCreatedBy = (c) => {
    const cb = c?.createdBy
    if (!cb) return '—'
    if (typeof cb === 'string') return cb
    return cb.name || cb.email || '—'
  }

  const handleEdit = (contact) => {
    setContactForm(contact)
    setIsEditMode(true)
    setShowDialog(true)
  }

  const handleDelete = async (contactId) => {
    if (!contactId) return
    try {
      const userData = await apiCall('/v1/user/details', 'GET').catch(() => null)
      const businessId = userData?.user?.businessId || localStorage.getItem('businessId')
      if (!businessId) throw new Error('Business ID not found. Please login again.')
      await apiCall(`/contacts/business/${businessId}/${contactId}`, 'DELETE')
      await fetchContacts()
      setDeleteConfirm(null)
    } catch (err) {
      alert(err?.message || 'Failed to delete contact')
    }
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <h2>Contacts</h2>
        </Box>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }} onClick={() => { resetForm(); setShowDialog(true) }}>Add Contact</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="search-field-label">Field</InputLabel>
          <Select labelId="search-field-label" value={searchField} label="Field" onChange={(e) => setSearchField(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="phone">Phone</MenuItem>
            <MenuItem value="company">Company</MenuItem>
            <MenuItem value="tags">Tags</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" fullWidth placeholder={`Search by ${searchField}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={18} /> Loading contacts...</Box>
      ) : error ? (
        <Box sx={{ color: '#dc2626' }}>Error: {error}</Box>
      ) : (
        <Paper variant="outlined" className="calllogs-table-container">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(contacts || []).map((c) => (
                <TableRow key={c._id || c.email}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.company}</TableCell>
                  <TableCell>
                    {(c.tags || []).map((t, i) => <Chip key={i} label={t} size="small" className="custom-chip" sx={{ mr: 0.5 }} />)}
                  </TableCell>
                  <TableCell>{getCreatedBy(c)}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="info" onClick={() => setViewContact(c)}><VisibilityIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="warning" onClick={() => handleEdit(c)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(c)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Box>Showing {contacts.length} of {totalContacts} contacts</Box>
        <Box>
          <Button variant="outlined" size="small" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage <= 1}>Previous</Button>
          <Box component="span" sx={{ mx: 1 }}>Page {currentPage} of {totalPages}</Box>
          <Button variant="outlined" size="small" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}>Next</Button>
        </Box>
      </Box>

      {/* View dialog */}
      <Dialog open={!!viewContact} onClose={() => setViewContact(null)}>
        <DialogTitle>Contact Details</DialogTitle>
        <DialogContent>
          {viewContact && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 300 }}>
              <Box><strong>Name:</strong> {viewContact.name}</Box>
              <Box><strong>Email:</strong> {viewContact.email}</Box>
              <Box><strong>Phone:</strong> {viewContact.phone}</Box>
              <Box><strong>Company:</strong> {viewContact.company}</Box>
              <Box><strong>Tags:</strong> {(viewContact.tags || []).join(', ')}</Box>
              <Box><strong>Created By:</strong> {getCreatedBy(viewContact)}</Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewContact(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ minWidth: 360 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Name" name="name" value={contactForm.name} onChange={handleInputChange} required size="small" />
              <TextField label="Email" name="email" value={contactForm.email} onChange={handleInputChange} required size="small" disabled={isEditMode} />
              <TextField label="Phone" name="phone" value={contactForm.phone} onChange={handleInputChange} size="small" />
              <TextField label="Company" name="company" value={contactForm.company} onChange={handleInputChange} size="small" />
              <TextField label="Tags" name="tags" placeholder="comma separated" value={Array.isArray(contactForm.tags) ? contactForm.tags.join(', ') : ''} onChange={handleInputChange} size="small" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowDialog(false); resetForm() }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#6c5ce7', '&:hover': { backgroundColor: '#5a46eb' } }}>{isEditMode ? 'Update Contact' : 'Add Contact'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete {deleteConfirm?.name}?</DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => handleDelete(deleteConfirm?._id || deleteConfirm?.email)}>Delete</Button>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
