import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilPencil, cilMediaPlay, cilMediaStop, cilSearch } from '@coreui/icons'
import { IoEyeOutline } from 'react-icons/io5'
import { apiCall } from '../../config/api'
import '../Branches/Branches.css'
import './IVRManagement.css'

const IVRManagement = () => {
  const [ivrs, setIvrs] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newIvr, setNewIvr] = useState({ node: '', voice: '', options: [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }] })
  const [departments, setDepartments] = useState([])
  const [deletingAll, setDeletingAll] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [availableAgents, setAvailableAgents] = useState([])
  const [departmentMembers, setDepartmentMembers] = useState({})
  const [playingUrl, setPlayingUrl] = useState(null)
  const [playingAudio, setPlayingAudio] = useState(null)
  const [playingIvrId, setPlayingIvrId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingNode, setDeletingNode] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState(null)
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false)
  const [afterHoursMessage, setAfterHoursMessage] = useState('')
  const [savingAfterHours, setSavingAfterHours] = useState(false)
  const [activeTab, setActiveTab] = useState('ivr')
  const [afterHoursList, setAfterHoursList] = useState([])
  const [editingAfterId, setEditingAfterId] = useState(null)
  const [afterModalOpen, setAfterModalOpen] = useState(false)
  const [deletingAfterAll, setDeletingAfterAll] = useState(false)
  const [afterToDelete, setAfterToDelete] = useState(null)
  const [afterDeleteModalOpen, setAfterDeleteModalOpen] = useState(false)
  const [deletingAfterItem, setDeletingAfterItem] = useState(false)
  const [afterDetailsOpen, setAfterDetailsOpen] = useState(false)
  const [afterSelected, setAfterSelected] = useState(null)
  const [languages, setLanguages] = useState([])
  const [langCode, setLangCode] = useState('')
  const [langName, setLangName] = useState('')
  const [savingLang, setSavingLang] = useState(false)
  const [langModalOpen, setLangModalOpen] = useState(false)
  const [editingLangId, setEditingLangId] = useState(null)

  useEffect(() => {
    const tryPrefill = async () => {
      if (businessId) return
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u.businessId) {
          setBusinessId(u.businessId)
          try {
            localStorage.setItem('businessId', u.businessId)
          } catch (e) {}
        }
      } catch (err) {}
    }
    tryPrefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchDepartments = async () => {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      if (!currentBusinessId) return
      try {
        const res = await apiCall(`/departments/business/${currentBusinessId}`, 'GET')
        let list = []
        if (Array.isArray(res)) list = res
        else if (res?.data && Array.isArray(res.data)) list = res.data
        else if (res?.departments && Array.isArray(res.departments)) list = res.departments
        else if (res && typeof res === 'object' && res.name) list = [res]
        setDepartments(list)
      } catch (err) {
        console.error('Failed to fetch departments', err)
        setDepartments([])
      }
    }

    if (businessId) fetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const fetchAfterHours = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    try {
      const res = await apiCall(`/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours`, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (res?.data && Array.isArray(res.data)) list = res.data
      else if (res?.afterHours && Array.isArray(res.afterHours)) list = res.afterHours
      else list = []
      setAfterHoursList(list)
      if (list.length) {
        const latest = list[0]
        const msg = latest?.generatedText || latest?.text || latest?.message || ''
        setAfterHoursMessage(msg || '')
      } else {
        setAfterHoursMessage('')
      }
    } catch (err) {
      console.error('Failed to fetch after-hours', err)
      setAfterHoursList([])
    }
  }

  useEffect(() => {
    if (activeTab !== 'after') return
    fetchAfterHours()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, businessId])

  const fetchLanguages = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) {
      setLanguages([])
      return
    }
    try {
      const res = await apiCall(`/api/languages/business/${encodeURIComponent(currentBusinessId)}`, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (res?.data && Array.isArray(res.data)) list = res.data
      else if (res?.languages && Array.isArray(res.languages)) list = res.languages
      setLanguages(list)
    } catch (err) {
      console.error('Failed to fetch languages', err)
      setLanguages([])
    }
  }

  useEffect(() => {
    if (activeTab !== 'language') return
    fetchLanguages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const saveLanguage = async () => {
    if (!langCode || !langName) return
    setSavingLang(true)
    try {
      const payload = { code: langCode, name: langName }
        let res = editingLangId
          ? await apiCall(`/api/languages/${encodeURIComponent(editingLangId)}`, 'PUT', payload)
          : await apiCall(`/api/languages/business/${encodeURIComponent(businessId || localStorage.getItem('businessId') || '')}`, 'POST', payload);
      if (res && (res.success || res.created || res.updated || res.data)) {
        setLangCode('')
        setLangName('')
        setEditingLangId(null)
        await fetchLanguages()
      } else {
        console.error('Failed to save language', res)
      }
    } catch (err) {
      console.error('Error creating language', err)
    } finally {
      setSavingLang(false)
    }
  }

  const fetchIvrs = async (p = 1) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) {
      setIvrs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const endpoint = `/ivrs/business/${currentBusinessId}?page=${p}&limit=${limit}`
      const res = await apiCall(endpoint, 'GET')
      if (res && res.success) {
        // support multiple response shapes: res.files, res.data (array), res.data.files
        let items = []
        if (Array.isArray(res.files)) items = res.files
        else if (Array.isArray(res.data)) items = res.data
        else if (Array.isArray(res.data?.files)) items = res.data.files
        else if (Array.isArray(res)) items = res
        else items = []

        // Normalize items to expected IVR shape where possible
        const normalized = items.map((it) => {
          return {
            ...it,
            name: it.name || it.title || it._id || '',
            voice: it.menu?.voice || it.menu?.welcome || it.voice || it.welcome || it.generatedText || '',
            options: Array.isArray(it.options) ? it.options : (it.menu?.options || []),
            createdAt: it.createdAt || it.uploadedAt || it.updatedAt || it.created || null,
            status: it.status || it.ivrStatus || it.state || 'unknown',
            raw: it,
          }
        })

        setIvrs(normalized)
        if (res.pagination && res.pagination.page) {
          try { setPage(res.pagination.page) } catch (e) {}
        }
      } else {
        setIvrs([])
      }
    } catch (error) {
      console.error('Failed to fetch IVRs', error)
      setIvrs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIvrs(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const existingNodes = React.useMemo(() => {
    try {
      return Array.from(new Set(ivrs.map(i => (i.node || i.name || i.title || '').toString()).filter(Boolean)))
    } catch (e) { return [] }
  }, [ivrs])

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedRows(newExpanded)
  }

  const openDetails = (item) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const openAfterDetails = (item) => {
    setAfterSelected(item)
    setAfterDetailsOpen(true)
  }

  const closeAfterDetails = () => {
    setAfterDetailsOpen(false)
    setAfterSelected(null)
  }

  const openEdit = async (item) => {
    // Prefill newIvr from existing item
    const node = item.name || item.node || item._id
    const voice = item.voice || item.menu?.voice || ''
    const options = (Array.isArray(item.options) ? item.options : (item.menu?.options || [])).map((o) => {
      // destination like 'node:menu' or 'dept:sales' or 'agent:<id>'
      const dest = (o.destination || o.destinationType || '').toString()
      const parts = dest.split(':')
      const type = parts[0] || 'node'
      // rest contains everything after the type
      const rest = parts.slice(1)
      if (type === 'agent') {
        // legacy agent:<id> stored — map to dept editor with agentId populated so user can see agent selection
        const agentId = rest.join(':') || ''
        return { key: o.key || o._id || '', type: 'dept', target: '', agentId: agentId || '', voice: o.voice || o.text || '' }
      }
      if (type === 'dept') {
        // dest may be like 'dept:sales' or 'dept:sales:1008' or 'dept:<id>:1008'
        const deptPart = rest[0] || ''
        const extPart = rest[1] || ''
        // try to find department by id or by name/slug (case-insensitive)
        const found = departments.find(d => (
          d._id === deptPart || d.id === deptPart ||
          (d.name && d.name.toString().toLowerCase() === deptPart.toString().toLowerCase()) ||
          (d.slug && d.slug === deptPart)
        ))
        const targetValue = found ? (found._id || found.id) : deptPart
        // if extension present, try to map it back to a member and set agentId so agent dropdown shows the name
        let agentId = ''
        if (extPart && found) {
          // check department.members from the departments API first
          const memberFromDept = Array.isArray(found.members) ? found.members.find(m => (String(m.didExtension || m.did_extension || m.didNumber || '').toString() === String(extPart))) : null
          if (memberFromDept) agentId = memberFromDept._id || memberFromDept.id || memberFromDept.userId || ''
          // fallback to cached departmentMembers
          if (!agentId) {
            const members = departmentMembers[found._id] || departmentMembers[found.id] || []
            const memberFromCache = members.find(m => (String(m.didExtension || m.did_extension || m.didNumber || '').toString() === String(extPart)))
            if (memberFromCache) agentId = memberFromCache._id || memberFromCache.id || ''
          }
        }
        return { key: o.key || o._id || '', type: 'dept', target: targetValue || '', agentId: agentId || '', voice: o.voice || o.text || '', ext: extPart || '' }
      }
      return { key: o.key || o._id || '', type: 'node', target: rest.join(':') || '', agentId: '', voice: o.voice || o.text || '' }
    })
    setNewIvr({ node, voice, options: options.length ? options : [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }] })
    setEditingNode(node)
    setAddOpen(true)
    // ensure department members are fetched and agent dropdowns populate. If ext present, map it back to agentId.
    options.forEach(async (opt, idx) => {
      if (opt.type === 'dept' && opt.target) {
        const members = await fetchDepartmentMembers(opt.target)
        if (opt.ext) {
          const member = (Array.isArray(members) ? members : []).find(m => String(m.didExtension || m.did_extension || m.didNumber || '').toString() === String(opt.ext))
          if (member) {
            setNewIvr(prev => {
              const copy = Array.isArray(prev.options) ? [...prev.options] : []
              if (!copy[idx]) return prev
              copy[idx] = { ...copy[idx], agentId: member._id || member.id || member.userId || '' }
              return { ...prev, options: copy }
            })
          }
        }
      }
    })
  }

  const fetchDepartmentMembers = async (deptId) => {
    if (!deptId) return
    try {
      const res = await apiCall(`/departments/${deptId}/members`, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (Array.isArray(res.data)) list = res.data
      else if (Array.isArray(res.data?.data)) list = res.data.data
      else if (res?.members && Array.isArray(res.members)) list = res.members
      else list = []
      // Normalize expected member shapes. API returns objects like { userId, user: { email, firstName, ... }, phone, didNumber, role }
      const normalized = list.map((m) => {
        const userObj = m.user || {}
        const id = m.userId || m.user?._id || m._id || m.id
        const name = userObj.name || [userObj.firstName, userObj.lastName].filter(Boolean).join(' ') || userObj.email || userObj.fullName || id
        return {
          _id: id,
          id: id,
          name,
          email: userObj.email,
          phone: m.phone || userObj.phone || userObj.mobile || '',
          didNumber: m.didNumber || '',
          didExtension: m.didExtension || m.did_extension || '',
          role: m.role || userObj.role || '',
          raw: m,
        }
      })
      setDepartmentMembers((prev) => ({ ...prev, [deptId]: normalized }))
      return normalized
    } catch (e) {
      console.error('Failed to fetch department members', e)
      setDepartmentMembers((prev) => ({ ...prev, [deptId]: [] }))
      return []
    }
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedItem(null)
  }

  const formatDateTimeShort = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) { return iso }
  }

  const deepLowercase = (obj) => {
    if (typeof obj === 'string') return obj.toLowerCase()
    if (Array.isArray(obj)) return obj.map(deepLowercase)
    if (obj && typeof obj === 'object') {
      const out = {}
      Object.keys(obj).forEach((k) => { out[k] = deepLowercase(obj[k]) })
      return out
    }
    return obj
  }

  const playIvrFile = async (ivr) => {
    try {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      const id = ivr._id || ivr.id
      let endpoint = ''
      if (id) {
        // preferred endpoint uses ivrs and the resource id
        endpoint = `/ivrs/download/${encodeURIComponent(id)}?businessId=${encodeURIComponent(currentBusinessId)}`
      } else {
        const name = ivr.fileName || ivr.audioFile
        if (!name) return
        endpoint = `/ivr/download/${encodeURIComponent(name)}?businessId=${encodeURIComponent(currentBusinessId)}`
      }
      // fetch binary audio
      const data = await apiCall(endpoint, 'GET', null, { responseType: 'arraybuffer' })
      if (!data) return
      const mime = (ivr.mimeType || 'audio/wav')
      const blob = new Blob([data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      // stop previously playing
      if (playingAudio) {
        try { playingAudio.pause() } catch (e) {}
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) {}
      }
      const audio = new Audio(url)
      setPlayingUrl(url)
      setPlayingAudio(audio)
      setPlayingIvrId(ivr._id || ivr.id || name)
      audio.play().catch((e) => { console.error('Audio play failed', e) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      console.error('Failed to play IVR file', err)
    }
  }

  const stopPlaying = () => {
    if (playingAudio) {
      try { playingAudio.pause() } catch (e) {}
      try { window.URL.revokeObjectURL(playingUrl) } catch (e) {}
    }
    setPlayingAudio(null)
    setPlayingUrl(null)
    setPlayingIvrId(null)
  }

  const playAfterHours = async (doc) => {
    try {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      if (!currentBusinessId || !doc) return
      let endpoint = ''
      if (doc._id) endpoint = `/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours/play?audioId=${encodeURIComponent(doc._id)}`
      else if (doc.fileName || doc.name) endpoint = `/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours/play?name=${encodeURIComponent(doc.fileName || doc.name)}`
      else return
      const data = await apiCall(endpoint, 'GET', null, { responseType: 'arraybuffer' })
      if (!data) return
      const mime = 'audio/wav'
      const blob = new Blob([data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      if (playingAudio) {
        try { playingAudio.pause() } catch (e) {}
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) {}
      }
      const audio = new Audio(url)
      setPlayingUrl(url)
      setPlayingAudio(audio)
      setPlayingIvrId(`after-${doc._id || doc.name}`)
      audio.play().catch((e) => { console.error('Audio play failed', e) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      console.error('Failed to play after-hours audio', err)
    }
  }

  const addOptionWithNextKey = () => {
    const opts = Array.isArray(newIvr.options) ? [...newIvr.options] : []
    const numericKeys = opts.map((o) => {
      const k = (o && (o.key || '')).toString()
      const n = parseInt(k, 10)
      return Number.isNaN(n) ? null : n
    }).filter(n => n !== null)
    let next = 1
    if (numericKeys.length) next = Math.max(...numericKeys) + 1
    else next = opts.length ? (opts.length + 1) : 1
    const newOpt = { key: String(next), type: 'node', target: '', agentId: '', voice: '' }
    setNewIvr({ ...newIvr, options: [...opts, newOpt] })
  }

  const deleteIvrNode = async (node) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId || !node) return
    try {
      setDeletingNode(node)
      const endpoint = `/ivr/node/${encodeURIComponent(node.toString())}?businessId=${encodeURIComponent(currentBusinessId)}`
      const res = await apiCall(endpoint, 'DELETE')
      if (res && (res.success || res.deleted || res.data)) {
        fetchIvrs(1)
        setDeleteModalOpen(false)
        setNodeToDelete(null)
      } else {
        console.error('Failed to delete IVR node', res)
      }
    } catch (err) {
      console.error('Error deleting IVR node', err)
    } finally {
      setDeletingNode(null)
    }
  }

  const deleteAllIvrs = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    try {
      setDeletingAll(true)
      const endpoint = `/ivrs/business/${currentBusinessId}`
      const res = await apiCall(endpoint, 'DELETE')
      if (res && (res.success || res.deleted || res.data)) {
        fetchIvrs(1)
        setDeleteAllModalOpen(false)
      } else {
        console.error('Failed to delete IVRs', res)
      }
    } catch (err) {
      console.error('Error deleting IVRs', err)
    } finally {
      setDeletingAll(false)
    }
  }

  const saveAfterHours = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    setSavingAfterHours(true)
    try {
      const payload = { text: afterHoursMessage }
      let res
      if (editingAfterId) {
        res = await apiCall(`/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours/${encodeURIComponent(editingAfterId)}`, 'PUT', payload)
      } else {
        res = await apiCall(`/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours`, 'POST', payload)
      }
      if (res && (res.success || res.updated || res.created || res.data)) {
        // refresh list and close modal
        await fetchAfterHours()
        setAfterHoursMessage('')
        setEditingAfterId(null)
        setAfterModalOpen(false)
      } else {
        console.error('Failed to save after-hours', res)
      }
    } catch (err) {
      console.error('Error saving after-hours', err)
    } finally {
      setSavingAfterHours(false)
    }
  }

  const deleteAfterHours = async (audioId) => {
    // deprecated - use modal-driven delete
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId || !audioId) return
    try {
      const res = await apiCall(`/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours/${encodeURIComponent(audioId)}`, 'DELETE')
      if (res && (res.success || res.deleted || res.data)) {
        await fetchAfterHours()
      } else {
        console.error('Failed to delete after-hours', res)
      }
    } catch (err) {
      console.error('Error deleting after-hours', err)
    }
  }

  const confirmDeleteAfterHours = (audioId) => {
    setAfterToDelete(audioId)
    setAfterDeleteModalOpen(true)
  }

  const deleteAfterHoursConfirmed = async () => {
    const audioId = afterToDelete
    if (!audioId) return
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    setDeletingAfterItem(true)
    try {
      const res = await apiCall(`/api/businesses/${encodeURIComponent(currentBusinessId)}/after-hours/${encodeURIComponent(audioId)}`, 'DELETE')
      if (res && (res.success || res.deleted || res.data)) {
        setAfterDeleteModalOpen(false)
        setAfterToDelete(null)
        await fetchAfterHours()
      } else {
        console.error('Failed to delete after-hours', res)
      }
    } catch (err) {
      console.error('Error deleting after-hours', err)
    } finally {
      setDeletingAfterItem(false)
    }
  }

  return (
    <CCard className="mb-4 ivr-no-focus">
    
      <div className="p-2 border-bottom ivr-tabs-wrap">
        <ul className="nav nav-tabs card-header-tabs mb-0">
          <li className="nav-item">
            <button type="button" className={`nav-link btn btn-link ${activeTab === 'ivr' ? 'active' : ''}`} onClick={() => setActiveTab('ivr')}>Menu</button>
          </li>
          <li className="nav-item">
            <button type="button" className={`nav-link btn btn-link ${activeTab === 'after' ? 'active' : ''}`} onClick={() => setActiveTab('after')}>After Hours</button>
          </li>
          <li className="nav-item">
            <button type="button" className={`nav-link btn btn-link ${activeTab === 'language' ? 'active' : ''}`} onClick={() => setActiveTab('language')}>Language</button>
          </li>
        </ul>
      </div>
      <CCardBody>
        <div style={{ display: activeTab === 'ivr' ? 'block' : 'none' }}>
        <div className="ivr-header mb-3">
          <div className="ivr-note">Note: The primary/main IVR node should be named{' '}<strong>menu</strong>.</div>
          <div className="ivr-actions">
            <button className="btn btn-sm btn-success me-2" onClick={() => { setEditingNode(null); setNewIvr({ node: '', voice: '', options: [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }] }); setAddOpen(true) }}>Add</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => {
              const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
              if (!currentBusinessId) return
              setDeleteAllModalOpen(true)
            }} disabled={deletingAll || loading}>Delete all</button>
          </div>
        </div>
        {!businessId && (
          <div className="mb-3">
            <div className="alert alert-warning">Missing <code>businessId</code> in localStorage. Set it to view IVRs.</div>
          </div>
        )}

        <CModal visible={detailsOpen} onClose={closeDetails} alignment="center" size="lg" className="ivr-no-focus-modal">
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', maxWidth: 960, width: '100%' }}>
            <CModalHeader style={{ borderBottom: 'none', padding: '1rem 1.25rem', background: '#ffffff' }}>
              <CModalTitle style={{ fontWeight: 700, fontSize: '1.05rem', color: '#102a43' }}>IVR Details</CModalTitle>
            </CModalHeader>
            <CModalBody style={{ background: '#fbfdff', padding: '1rem 1.25rem', maxHeight: '360px', overflowY: 'auto' }}>
              {!selectedItem ? (
                <div className="text-muted">No item selected</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Name</div>
                      <div style={{ fontWeight: 700, color: '#102a43' }}>{selectedItem.name || selectedItem.title || '-'}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Voice Text</div>
                      <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{selectedItem.voice || selectedItem.menu?.voice || ''}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Routing / Menu</div>
                      <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid rgba(16,24,40,0.04)', maxHeight: 240, overflowY: 'auto' }}>
                        {(() => {
                          const menuObj = selectedItem.menu || selectedItem.routing || selectedItem || {}
                          const opts = Array.isArray(menuObj.options) ? menuObj.options : (Array.isArray(selectedItem.options) ? selectedItem.options : [])
                          if (!opts || opts.length === 0) return (<div style={{ color: '#6b7280' }}>No routing options available</div>)
                          return (
                            <div>
                              {opts.map((o) => {
                                const dest = (o.destination || o.destinationType || o.target || '').toString()
                                let kind = 'default'
                                if (dest.startsWith('dept:')) kind = 'dept'
                                else if (dest.startsWith('node:')) kind = 'node'
                                else if (dest.startsWith('agent:')) kind = 'agent'
                                const colorMap = {
                                  dept: { accent: '#fff7ed', border: '#f6ad55', badgeBg: '#fff2e8', badgeColor: '#7a4100' },
                                  node: { accent: '#eff6ff', border: '#60a5fa', badgeBg: '#eef6ff', badgeColor: '#0b4ea2' },
                                  agent: { accent: '#ecfdf5', border: '#34d399', badgeBg: '#f0fdf4', badgeColor: '#065f46' },
                                  default: { accent: '#f8fafc', border: '#e5e7eb', badgeBg: '#f3f4f6', badgeColor: '#111827' },
                                }
                                const styles = colorMap[kind] || colorMap.default
                                return (
                                  <div key={o._id || o.key || Math.random()} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(16,24,40,0.03)', background: styles.accent, borderLeft: `4px solid ${styles.border}`, borderRadius: 6, marginBottom: 8 }}>
                                    <div style={{ flex: '0 0 46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <div style={{ background: styles.badgeBg, color: styles.badgeColor, padding: '0.25rem 0.45rem', fontSize: '0.85rem', borderRadius: 6, fontWeight: 600 }}>{o.key}</div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, color: '#102a43' }}>{o.voice || o.text || '—'}</div>
                                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, wordBreak: 'break-word' }}>{dest || ''}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Virtual Number</div>
                      <div style={{ fontWeight: 600 }}>{selectedItem.virtualNumber || selectedItem.number || '-'}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Created By</div>
                      <div>{selectedItem.createdBy?.email || selectedItem.createdBy?.name || '-'}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Created At</div>
                      <div>{formatDateTimeShort(selectedItem.createdAt || selectedItem.created)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Status</div>
                      <div><CBadge color={selectedItem.active ? 'success' : 'secondary'}>{selectedItem.active ? 'Active' : 'Inactive'}</CBadge></div>
                    </div>
                  </div>
                </div>
              )}
            </CModalBody>
            <CModalFooter style={{ borderTop: 'none', padding: '0.75rem 1.25rem', background: '#ffffff' }} />
          </div>
        </CModal>

        <CModal visible={addOpen} onClose={() => { setAddOpen(false); setEditingNode(null) }} alignment="center" size="lg" className="ivr-no-focus-modal">
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', maxWidth: 960, width: '100%' }}>
            <CModalHeader style={{ borderBottom: 'none', padding: '1rem 1.25rem', background: '#ffffff' }}>
              <CModalTitle style={{ fontWeight: 700, fontSize: '1.05rem', color: '#102a43' }}>{editingNode ? `Edit IVR (${editingNode})` : 'Add IVR'}</CModalTitle>
            </CModalHeader>
            <CModalBody style={{ background: '#fbfdff', padding: '1rem 1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
            <div className="row mb-2">
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ fontSize: 13, color: '#556270' }}>Node (identifier)</label>
                <input className="form-control" value={newIvr.node} placeholder="e.g. menu, sales" onChange={(e) => setNewIvr({ ...newIvr, node: e.target.value })} />
              </div>
              <div className="col-12 col-md-8">
                <label className="form-label" style={{ fontSize: 13, color: '#556270' }}>Voice Text</label>
                <input className="form-control" value={newIvr.voice} placeholder="e.g. Welcome to Acme." onChange={(e) => setNewIvr({ ...newIvr, voice: e.target.value })} />
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label" style={{ fontSize: 13, color: '#556270' }}>Options (press {'>'} target)</label>
              {newIvr.options.map((opt, idx) => (
                <div key={idx} className="d-flex mb-2" style={{ gap: 8 }}>
                  <input style={{ width: 80 }} className="form-control me-2" value={opt.key} onChange={(e) => {
                    const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], key: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                  }} />
                  <select className="form-select me-2" style={{ width: 140 }} value={opt.type || 'node'} onChange={(e) => {
                    const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], type: e.target.value, target: '' }; setNewIvr({ ...newIvr, options: copy })
                  }}>
                    <option value="node">node</option>
                    <option value="dept">dept</option>
                  </select>
                  {opt.type === 'dept' ? (
                    <div className="me-2 d-flex" style={{ gap: 8 }}>
                      <select className="form-select" value={opt.target || ''} onChange={(e) => {
                        const val = e.target.value;
                        const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: val, agentId: '' }; setNewIvr({ ...newIvr, options: copy })
                        // fetch members for this department so agent dropdown can populate
                        fetchDepartmentMembers(val)
                      }}>
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d._id || d.id} value={d._id || d.id}>{d.name || d.departmentName || d.title || d.slug || d._id}</option>
                        ))}
                      </select>
                      <select className="form-select" value={opt.agentId || ''} onChange={(e) => {
                        const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], agentId: e.target.value }; setNewIvr({ ...newIvr, options: copy });
                      }}>
                        <option value="">Select agent (optional)</option>
                        {(() => {
                          const dep = departments.find(d => (d._id === opt.target || d.id === opt.target))
                          if (!dep) return null
                          const members = departmentMembers[dep._id] || departmentMembers[dep.id] || []
                          const headId = dep.departmentHead || dep.head || dep.userId || dep.departmentHeadId || dep.department_head
                          const headAgent = members.find(a => a._id === headId || a.id === headId)
                          const merged = headAgent ? ([headAgent, ...members.filter(a => a._id !== headAgent._id)]) : members
                          return merged.map((ag) => (
                            <option key={ag._id || ag.id} value={ag._id || ag.id}>{ag.name || ag.email || ag._id}</option>
                          ))
                        })()}
                      </select>
                    </div>
                    ) : (
                      existingNodes.length > 0 ? (
                      <select className="form-select me-2" style={{ width: 180 }} value={opt.target || ''} onChange={(e) => {
                        const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                      }}>
                        <option value="">Select node</option>
                        {existingNodes.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      ) : (
                        <input className="form-control me-2" style={{ maxWidth: 220 }} value={opt.target} onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                        }} placeholder="e.g. sales" />
                      )
                    )
                  }
                  <input style={{ width: 260 }} className="form-control me-2" value={opt.voice || ''} onChange={(e) => {
                    const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], voice: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                  }} placeholder="Option voice text (e.g. For sales)" />
                  <button className="btn btn-sm btn-outline-danger" onClick={() => {
                    const copy = [...newIvr.options]; copy.splice(idx, 1); setNewIvr({ ...newIvr, options: copy })
                  }}>Remove</button>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-primary" onClick={addOptionWithNextKey}>Add option</button>
            </div>
            </CModalBody>
            <CModalFooter style={{ borderTop: 'none', padding: '0.75rem 1.25rem', background: '#ffffff' }}>
              <CButton color="secondary" onClick={() => { setAddOpen(false); setEditingNode(null) }} disabled={saving}>Cancel</CButton>
              <CButton color="primary" onClick={async () => {
                const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
                if (!currentBusinessId) return
                setSaving(true)
                try {
                  const hasEditorOptions = Array.isArray(newIvr.options) && newIvr.options.some(o => o.key && (o.target || o.voice))
                  if (editingNode) {
                    let optionsArray = []
                    if (hasEditorOptions) {
                      newIvr.options.forEach((o) => {
                        if (!o.key) return
                        if (o.type === 'dept') {
                          if (o.agentId) {
                            let dept = departments.find(d => d._id === o.target || d.id === o.target)
                            if (!dept) {
                              dept = departments.find(d => Array.isArray(d.members) && d.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId)))
                            }
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target || ''
                            let ext = ''
                            if (dept && Array.isArray(dept.members) && dept.members.length) {
                              const member = dept.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const members = dept ? (departmentMembers[dept._id] || departmentMembers[dept.id] || []) : []
                              const member = members.find(m => (m._id === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const allDeps = Object.keys(departmentMembers)
                              for (let k = 0; k < allDeps.length && !ext; k++) {
                                const mlist = departmentMembers[allDeps[k]] || []
                                const member = mlist.find(m => (m._id === o.agentId || m.id === o.agentId))
                                if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                              }
                            }
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}${ext ? ':' + String(ext) : ''}`
                            optionsArray.push({ key: o.key, voice: o.voice || '', destination: dest })
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            optionsArray.push({ key: o.key, voice: o.voice || '', destination: dest })
                          }
                        } else {
                          optionsArray.push({ key: o.key, voice: o.voice || '', destination: `node:${o.target || ''}` })
                        }
                      })
                    }
                    const putPayload = {
                      businessId: currentBusinessId,
                      menu: {
                        voice: newIvr.voice || '',
                        options: optionsArray,
                      }
                    }
                    const res = await apiCall(`/ivr/update/full/${encodeURIComponent((editingNode || '').toString().toLowerCase())}`, 'PUT', deepLowercase(putPayload))
                    if (res && (res.success || res.updated || res.data)) {
                      setAddOpen(false)
                      setEditingNode(null)
                      setNewIvr({ node: '', voice: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                      fetchIvrs(1)
                    } else {
                      console.error('Failed to update IVR', res)
                    }
                  } else {
                    let parsedOptions = {}
                    if (hasEditorOptions) {
                      newIvr.options.forEach((o) => {
                        if (!o.key) return
                        if (o.type === 'dept') {
                          if (o.agentId) {
                            let dept = departments.find(d => d._id === o.target || d.id === o.target)
                            if (!dept) {
                              dept = departments.find(d => Array.isArray(d.members) && d.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId)))
                            }
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target || ''
                            let ext = ''
                            if (dept && Array.isArray(dept.members) && dept.members.length) {
                              const member = dept.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const members = dept ? (departmentMembers[dept._id] || departmentMembers[dept.id] || []) : []
                              const member = members.find(m => (m._id === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const allDeps = Object.keys(departmentMembers)
                              for (let k = 0; k < allDeps.length && !ext; k++) {
                                const mlist = departmentMembers[allDeps[k]] || []
                                const member = mlist.find(m => (m._id === o.agentId || m.id === o.agentId))
                                if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                              }
                            }
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}${ext ? ':' + String(ext) : ''}`
                            parsedOptions[o.key] = { destination: dest, voice: o.voice || '' }
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            parsedOptions[o.key] = { destination: dest, voice: o.voice || '' }
                          }
                        } else {
                          parsedOptions[o.key] = { destination: `node:${o.target || ''}`, voice: o.voice || '' }
                        }
                      })
                    }
                    const nodeName = (newIvr.node || `menu_${Date.now()}`).toString().toLowerCase()
                    let optionsArrayFromParsed = []
                    if (hasEditorOptions) {
                      newIvr.options.forEach((o) => {
                        if (!o.key) return
                        if (o.type === 'dept') {
                          if (o.agentId) {
                            let dept = departments.find(d => d._id === o.target || d.id === o.target)
                            if (!dept) {
                              dept = departments.find(d => Array.isArray(d.members) && d.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId)))
                            }
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target || ''
                            let ext = ''
                            if (dept && Array.isArray(dept.members) && dept.members.length) {
                              const member = dept.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const members = dept ? (departmentMembers[dept._id] || departmentMembers[dept.id] || []) : []
                              const member = members.find(m => (m._id === o.agentId || m.id === o.agentId))
                              if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                            }
                            if (!ext) {
                              const allDeps = Object.keys(departmentMembers)
                              for (let k = 0; k < allDeps.length && !ext; k++) {
                                const mlist = departmentMembers[allDeps[k]] || []
                                const member = mlist.find(m => (m._id === o.agentId || m.id === o.agentId))
                                if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                              }
                            }
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}${ext ? ':' + String(ext) : ''}`
                            optionsArrayFromParsed.push({ key: o.key, voice: o.voice || '', destination: dest })
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            optionsArrayFromParsed.push({ key: o.key, voice: o.voice || '', destination: dest })
                          }
                        } else {
                          optionsArrayFromParsed.push({ key: o.key, voice: o.voice || '', destination: `node:${o.target || ''}` })
                        }
                      })
                    }
                    const savePayload = {
                      businessId: currentBusinessId,
                      node: nodeName,
                      menu: {
                        voice: newIvr.voice || ``,
                        options: optionsArrayFromParsed,
                      }
                    }
                    try {
                      const saveRes = await apiCall('/ivr/create', 'POST', deepLowercase(savePayload))
                      if (saveRes && (saveRes.success || saveRes.created || saveRes.data)) {
                        setAddOpen(false)
                        setNewIvr({ node: '', voice: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                        fetchIvrs(1)
                      } else {
                        console.error('Failed to create IVR', saveRes)
                      }
                    } catch (err) {
                      console.error('Error creating IVR', err)
                    }
                  }
                } catch (err) {
                  console.error('Error saving IVR', err)
                } finally {
                  setSaving(false)
                }
              }} disabled={saving}>
                {saving ? (<><CSpinner size="sm" />&nbsp;Saving</>) : (editingNode ? 'Save' : 'Create')}
              </CButton>
            </CModalFooter>
          </div>
        </CModal>

        <CModal visible={deleteModalOpen} onClose={() => { if (deletingNode !== nodeToDelete) { setDeleteModalOpen(false); setNodeToDelete(null) } }} alignment="center" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>Delete IVR</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Are you sure you want to delete IVR node "{nodeToDelete}"? This action cannot be undone.
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (deletingNode !== nodeToDelete) { setDeleteModalOpen(false); setNodeToDelete(null) } }} disabled={deletingNode === nodeToDelete}>Cancel</CButton>
            <CButton color="danger" onClick={() => deleteIvrNode(nodeToDelete)} disabled={deletingNode === nodeToDelete}>
              {deletingNode === nodeToDelete ? (<><CSpinner size="sm" />&nbsp;Deleting</>) : 'Delete'}
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={deleteAllModalOpen} onClose={() => { if (!deletingAll) { setDeleteAllModalOpen(false) } }} alignment="center" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>Delete All IVRs</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Are you sure you want to delete ALL IVRs for this business? This action cannot be undone.
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (!deletingAll) { setDeleteAllModalOpen(false) } }} disabled={deletingAll}>Cancel</CButton>
            <CButton color="danger" onClick={deleteAllIvrs} disabled={deletingAll}>
              {deletingAll ? (<><CSpinner size="sm" />&nbsp;Deleting</>) : 'Delete'}
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={afterModalOpen} onClose={() => { if (!savingAfterHours) { setAfterModalOpen(false); setEditingAfterId(null) } }} alignment="center" size="lg" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>{editingAfterId ? 'Edit After Hours' : 'Add After Hours'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-2">
              <label className="form-label">Message</label>
              <textarea className="form-control" rows={8} value={afterHoursMessage} onChange={(e) => setAfterHoursMessage(e.target.value)} placeholder="Enter the after-hours voice/text here" />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (!savingAfterHours) { setAfterModalOpen(false); setEditingAfterId(null) } }} disabled={savingAfterHours}>Cancel</CButton>
            <CButton color="primary" onClick={async () => { await saveAfterHours() }} disabled={savingAfterHours}>{savingAfterHours ? (<><CSpinner size="sm" />&nbsp;Saving</>) : (editingAfterId ? 'Update' : 'Save')}</CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={langModalOpen} onClose={() => { if (!savingLang) { setLangModalOpen(false); setEditingLangId(null) } }} alignment="center" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>{editingLangId ? 'Edit Language' : 'Add Language'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-2">
              <label className="form-label">Code</label>
              <input className="form-control" value={langCode} placeholder="e.g. en" onChange={(e) => setLangCode(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="form-label">Name</label>
              <input className="form-control" value={langName} placeholder="e.g. English" onChange={(e) => setLangName(e.target.value)} />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (!savingLang) { setLangModalOpen(false); setEditingLangId(null) } }} disabled={savingLang}>Cancel</CButton>
            <CButton color="primary" onClick={async () => {
              // Support edit via PUT if editingLangId looks like an id
              setSavingLang(true)
              try {
                const payload = { code: langCode, name: langName }
                if (editingLangId) {
                  await apiCall(`/api/languages/${encodeURIComponent(editingLangId)}`, 'PUT', payload)
                } else {
                  const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
                  if (!currentBusinessId) {
                    console.error('Missing businessId for creating language')
                  } else {
                    await apiCall(`/api/languages/business/${encodeURIComponent(currentBusinessId)}`, 'POST', payload)
                  }
                }
                setLangModalOpen(false)
                setEditingLangId(null)
                setLangCode('')
                setLangName('')
                await fetchLanguages()
              } catch (e) {
                console.error('Failed to save language', e)
              } finally { setSavingLang(false) }
            }} disabled={savingLang}>{savingLang ? 'Saving...' : (editingLangId ? 'Update' : 'Save')}</CButton>
          </CModalFooter>
        </CModal>

        {/* After Hours tab handled in tab content below */}

        {loading ? (
          <div className="text-center py-4"><CSpinner /></div>
        ) : ivrs.length === 0 ? (
          <div className="text-center py-3">No IVRs found</div>
        ) : (
          <div>
            {ivrs.map((i) => (
              <div key={i._id || i.id || i.name} className="d-flex align-items-center mb-2 p-2" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {i.name || i._id || '(ivr)'}
                    {((String(i.name || i.node || '')).toLowerCase() === 'menu') && (
                      <CBadge className="ms-2" style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', backgroundColor: '#e67e22', color: '#ffffff' }}>Entry IVR</CBadge>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, wordBreak: 'break-word' }}>{i.voice || ''}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{Array.isArray(i.options) ? `${i.options.length} options` : '-'}</div>
                </div>
                <div style={{ width: 140, textAlign: 'center' }}>
                  <CBadge color={i.status === 'active' || i.status === 'on' ? 'success' : 'secondary'}>{i.status || '-'}</CBadge>
                </div>
                <div>
                    {playingIvrId === (i._id || i.id || (i.fileName || i.audioFile)) ? (
                    <button className="btn btn-sm btn-outline-danger me-2" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></button>
                  ) : (
                    (i.fileName || i.audioFile || i._id) && (
                      <button className="btn btn-sm btn-outline-success me-2" onClick={(e) => { e.stopPropagation(); playIvrFile(i) }} title="Play"><CIcon icon={cilMediaPlay} /></button>
                    )
                  )}
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={(e) => { e.stopPropagation(); openDetails(i) }} title="View"><IoEyeOutline style={{fontSize: '1em', verticalAlign: 'middle', lineHeight: 1}} /></button>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={(e) => { e.stopPropagation(); openEdit(i) }} title="Edit"><CIcon icon={cilPencil} /></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); const nodeId = (i.name || i.node || i._id || i.id); if (!nodeId) return; setNodeToDelete(nodeId); setDeleteModalOpen(true); }} title="Delete"><CIcon icon={cilTrash} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {activeTab === 'after' && (
          <div>
            <div className="ivr-header mb-3">
              <div className="ivr-note">Manage the after-hours message for this business.</div>
              <div className="ivr-actions">
                <button className="btn btn-sm btn-success me-2" onClick={() => { setEditingAfterId(null); setAfterHoursMessage(''); setAfterModalOpen(true) }}>Add</button>
                <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                  if (!afterHoursList || afterHoursList.length === 0) return
                  const ok = window.confirm('Delete ALL after-hours audios for this business? This cannot be undone.')
                  if (!ok) return
                  setDeletingAfterAll(true)
                  try {
                    for (let i = 0; i < afterHoursList.length; i++) {
                      const id = afterHoursList[i]._id || afterHoursList[i].id
                      if (!id) continue
                      try {
                        await apiCall(`/api/businesses/${encodeURIComponent(businessId)}/after-hours/${encodeURIComponent(id)}`, 'DELETE')
                      } catch (e) {
                        console.error('Failed to delete after-hours item', id, e)
                      }
                    }
                    await fetchAfterHours()
                  } finally {
                    setDeletingAfterAll(false)
                  }
                }} disabled={deletingAfterAll}>{deletingAfterAll ? 'Deleting...' : 'Delete all'}</button>
              </div>
            </div>
            {!businessId && (
              <div className="mb-3">
                <div className="alert alert-warning">Missing <code>businessId</code> in localStorage. Set it to manage after-hours.</div>
              </div>
            )}
            
            <h6>Saved After Hours Audios</h6>
            {afterHoursList.length === 0 ? (
              <div className="text-muted">No saved after-hours audio for this business.</div>
            ) : (
              <div>
                {afterHoursList.map((a) => (
                  <div key={a._id || a.id || a.name} className="d-flex align-items-center mb-2 p-2" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{a.name || a._id || '(audio)'}</div>
                      <div className="text-muted" style={{ fontSize: 12, wordBreak: 'break-word' }}>{a.text || a.message || ''}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{a.createdAt ? (new Date(a.createdAt)).toLocaleString() : ''}</div>
                    </div>
                    <div>
                      {playingIvrId === `after-${a._id || a.name}` ? (
                        <button className="btn btn-sm btn-outline-danger me-2" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></button>
                      ) : (
                        <button className="btn btn-sm btn-outline-success me-2" onClick={(e) => { e.stopPropagation(); playAfterHours(a) }} title="Play"><CIcon icon={cilMediaPlay} /></button>
                      )}
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={(e) => { e.stopPropagation(); openAfterDetails(a) }} title="View"><IoEyeOutline style={{fontSize: '1em', verticalAlign: 'middle', lineHeight: 1}} /></button>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={(e) => { e.stopPropagation(); setEditingAfterId(a._id || a.id); setAfterHoursMessage(a.generatedText || a.text || a.message || ''); setAfterModalOpen(true) }} title="Edit"><CIcon icon={cilPencil} /></button>
                      <button className="btn btn-sm btn-outline-danger me-2" title="Delete" onClick={(e) => { e.stopPropagation(); confirmDeleteAfterHours(a._id || a.id) }}><CIcon icon={cilTrash} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <CModal visible={afterDeleteModalOpen} onClose={() => { if (!deletingAfterItem) { setAfterDeleteModalOpen(false); setAfterToDelete(null) } }} alignment="center" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>Delete After Hours</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Are you sure you want to delete this after-hours audio? This action cannot be undone.
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (!deletingAfterItem) { setAfterDeleteModalOpen(false); setAfterToDelete(null) } }} disabled={deletingAfterItem}>Cancel</CButton>
            <CButton color="danger" onClick={deleteAfterHoursConfirmed} disabled={deletingAfterItem}>{deletingAfterItem ? (<><CSpinner size="sm" />&nbsp;Deleting</>) : 'Delete'}</CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={afterDetailsOpen} onClose={closeAfterDetails} alignment="center" size="lg" className="ivr-no-focus-modal">
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 30px rgba(16,24,40,0.08)', maxWidth: 920, width: '100%', background: '#f8fbff' }}>
            <CModalHeader style={{ borderBottom: 'none', padding: '1rem 1.25rem', background: '#ffffff' }}>
              <CModalTitle style={{ fontWeight: 700, fontSize: '1.05rem', color: '#102a43' }}>After Hours Details</CModalTitle>
            </CModalHeader>
            <CModalBody style={{ padding: '1rem', maxHeight: '420px', overflowY: 'auto', background: '#f8fbff' }}>
              {!afterSelected ? (
                <div className="text-muted">No item selected</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Message</div>
                    <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 10, border: '1px solid rgba(96,165,250,0.12)', minHeight: 80, whiteSpace: 'pre-wrap', color: '#334155' }}>{afterSelected.generatedText || afterSelected.text || afterSelected.message || '-'}</div>
                  </div>
                  <div>
                    <div style={{ background: '#ffffff', padding: 12, borderRadius: 10, border: '1px solid rgba(16,24,40,0.04)' }}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>File</div>
                      <div style={{ fontWeight: 600, marginTop: 6 }}>{afterSelected.fileName || '-'}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{afterSelected.mimeType ? `${afterSelected.mimeType} • ${afterSelected.sizeKB ? afterSelected.sizeKB + ' KB' : ''}` : ''}</div>
                      <hr style={{ border: 'none', height: 1, background: 'rgba(16,24,40,0.04)', margin: '12px 0' }} />
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Uploaded</div>
                      <div style={{ marginTop: 6 }}>{afterSelected.uploadedToAsterisk ? <CBadge color="success">Uploaded</CBadge> : <CBadge color="secondary">Not uploaded</CBadge>}</div>
                      <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>Created</div>
                      <div>{afterSelected.createdAt ? (new Date(afterSelected.createdAt)).toLocaleString() : '-'}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Updated</div>
                      <div>{afterSelected.updatedAt ? (new Date(afterSelected.updatedAt)).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                </div>
              )}
            </CModalBody>
            <CModalFooter style={{ borderTop: 'none', padding: '0.75rem 1rem', background: '#ffffff' }} />
          </div>
        </CModal>
        {activeTab === 'language' && (
          <div>
            <div className="ivr-header mb-3">
              <div className="ivr-note">Create a new language for the system.</div>
              <div className="ivr-actions">
                <button className="btn btn-sm btn-success me-2" onClick={() => { setLangCode(''); setLangName(''); setEditingLangId(null); setLangModalOpen(true) }}>Add</button>
              </div>
            </div>
            <h6>Available Languages</h6>
            {languages.length === 0 ? (
              <div className="text-muted">No languages found.</div>
            ) : (
              <div>
                {languages.map((l) => (
                  <div key={l.code || l._id || l.id} className="d-flex justify-content-between align-items-center mb-2 p-2" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{l.name || l.title || l.code}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{l.code}</div>
                    </div>
                    <div>
                      <button className="btn btn-sm btn-outline-primary me-2" title="Edit" onClick={(e) => { e.stopPropagation(); setEditingLangId(l.code || l._id || l.id); setLangCode(l.code || ''); setLangName(l.name || ''); setLangModalOpen(true) }}><CIcon icon={cilPencil} /></button>
                      <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={async (e) => {
                        e.stopPropagation();
                        const id = l.code || l._id || l.id
                        if (!id) return
                        if (!window.confirm('Delete this language? This cannot be undone.')) return
                        try {
                          await apiCall(`/api/languages/${encodeURIComponent(id)}`, 'DELETE')
                        } catch (e) { console.error('Failed to delete language', e) }
                        await fetchLanguages()
                      }}><CIcon icon={cilTrash} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default IVRManagement