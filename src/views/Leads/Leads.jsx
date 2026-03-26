import React, { useEffect, useState, useRef } from 'react'
import { apiCall } from '../../config/api'
import { Box, Grid, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress } from '@mui/material'
import './CallLogsWebpage.css'

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  const [leadFields, setLeadFields] = useState([])

  const createFieldKey = (label, id) => {
    const base = String(label || id || '').trim().toLowerCase()
    return base.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  }

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

  const fetchLeadFields = async () => {
    try {
      const bId = await fetchBusinessIdIfNeeded()
      if (!bId) {
        setLeadFields([])
        return []
      }
      const res = await apiCall(`/lead-fields?businessId=${encodeURIComponent(bId)}`, 'GET')
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.leadFields)
        ? res.leadFields
        : []
      const normalized = (data || []).map(f => ({ ...f, key: f.key || f.name || createFieldKey(f.label || f._id || f.id, f._id || f.id) }))
      if (mountedRef.current) setLeadFields(normalized)
      return normalized
    } catch (e) {
      console.warn('fetchLeadFields failed', e)
      if (mountedRef.current) setLeadFields([])
      return []
    }
  }

  const fetchLeads = async () => {
    if (!mountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      const bId = localStorage.getItem('businessId') || ''
      const res = await apiCall(`/leads?businessId=${encodeURIComponent(bId)}`, 'GET')
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.leads)
        ? res.leads
        : []
      if (!mountedRef.current) return
      setLeads(data || [])
    } catch (e) {
      console.warn('Leads fetch failed', e)
      if (!mountedRef.current) return
      // Do not show dummy/sample data in production UI. Show empty state and error message instead.
      setError('Failed to load leads. Please try again later.')
      setLeads([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    // initial load
    ;(async () => {
      await fetchLeadFields()
      await fetchLeads()
    })()

    // Listen to lead-fields updates emitted by LeadFields page
    const onFieldsUpdated = () => {
      fetchLeadFields()
      fetchLeads()
    }
    window.addEventListener('leadFieldsUpdated', onFieldsUpdated)

    // Poll for lead field changes as a fallback
    const id = setInterval(() => fetchLeadFields(), 5000)

    return () => {
      mountedRef.current = false
      window.removeEventListener('leadFieldsUpdated', onFieldsUpdated)
      clearInterval(id)
    }
  }, [])

  const formatDate = (s) => {
    if (!s) return ''
    try { return new Date(s).toLocaleString() } catch (e) { return s }
  }

  const defaultCols = [
    { key: 'name', label: 'Name', getter: (l) => l.name || l.contact || '-' },
    { key: 'phone', label: 'Phone', getter: (l) => l.phone || l.contact || '-' },
    { key: 'email', label: 'Email', getter: (l) => l.email || '-' },
    { key: 'source', label: 'Source', getter: (l) => l.source || '-' },
    { key: 'createdAt', label: 'Created', getter: (l) => formatDate(l.createdAt || l.created_at || l.ts) }
  ]

  const getLeadFieldValue = (lead, field) => {
    if (!lead || !field) return '-'
    // try by id
    if (field._id && lead[field._id] !== undefined && lead[field._id] !== null) return lead[field._id]
    // try by normalized key
    if (field.key && lead[field.key] !== undefined && lead[field.key] !== null) return lead[field.key]
    // try nested structures
    if (lead.customFields && (lead.customFields[field._id] !== undefined || lead.customFields[field.key] !== undefined)) return lead.customFields[field._id] ?? lead.customFields[field.key]
    if (lead.fields && (lead.fields[field._id] !== undefined || lead.fields[field.key] !== undefined || lead.fields[field.label] !== undefined)) return lead.fields[field._id] ?? lead.fields[field.key] ?? lead.fields[field.label]
    if (lead.data && (lead.data[field._id] !== undefined || lead.data[field.key] !== undefined)) return lead.data[field._id] ?? lead.data[field.key]

    // try matching by label/key names on the root object
    const labelNorm = String(field.label || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const k of Object.keys(lead)) {
      try {
        const kn = String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        if (!kn) continue
        if (kn === labelNorm || kn === String(field.key || '').toLowerCase().replace(/[^a-z0-9]/g, '')) {
          return lead[k]
        }
      } catch (e) {}
    }

    return '-'
  }

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <h3>Leads</h3>
          <Box component="div" sx={{ color: '#6b7280' }}>List of recent leads</Box>
        </Box>
      </Box>

      <Box>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Box>Loading leads...</Box>
          </Box>
        )}

        {!loading && leadFields && leadFields.length > 0 && (
          <Paper variant="outlined" className="calllogs-table-container">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {leadFields.map(f => <TableCell key={f.key || f._id || f.label}>{f.label || f.key}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {(!leads || leads.length === 0) ? (
                  <TableRow><TableCell colSpan={leadFields.length} align="center" sx={{ py: 3 }}>No leads found</TableCell></TableRow>
                ) : (
                  leads.map((l, i) => (
                    <TableRow key={l._id || l.id || i}>
                      {leadFields.map((f) => {
                        let v = getLeadFieldValue(l, f)
                        if (Array.isArray(v)) {
                          return (
                            <TableCell key={f._id || f.key || f.label}>
                              {v.map((val, idx) => (
                                <Chip key={idx} label={String(val)} size="small" className="custom-chip" sx={{ mr: 0.5 }} />
                              ))}
                            </TableCell>
                          )
                        }
                        if (v && typeof v === 'object') v = JSON.stringify(v)
                        if (typeof v === 'boolean') v = v ? 'Yes' : 'No'
                        return <TableCell key={f._id || f.key || f.label}>{v ?? '-'}</TableCell>
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {!loading && (!leadFields || leadFields.length === 0) && (
          <Box sx={{ p: 2, color: '#6b7280' }}>
            No custom lead fields defined. Create fields in <a href="/leads/fields">Lead Fields</a> to display columns here.
          </Box>
        )}
        {error && <Box sx={{ color: '#dc2626', mt: 1 }}>{error}</Box>}
      </Box>
    </Box>
  )
}

export default Leads
