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
import { apiCall } from '../../config/api'

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
  const [newIvr, setNewIvr] = useState({ node: '', voice: '', active: true, options: [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }], menu: '' })
  const [departments, setDepartments] = useState([])
  const [deletingAll, setDeletingAll] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [availableAgents, setAvailableAgents] = useState([])
  const [departmentMembers, setDepartmentMembers] = useState({})

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
    setNewIvr({ node, voice, active: (item.status === 'active' || item.ivrStatus === 'on' || item.status === 'on'), options: options.length ? options : [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }], menu: '' })
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

  return (
    <CCard className="mb-4">
      <style>{`
        .compact-table th, .compact-table td { padding: 0.25rem 0.4rem !important; vertical-align: middle !important; }
      `}</style>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>IVR Management</span>
        <div>
          <button className="btn btn-sm btn-success me-2" onClick={() => { setEditingNode(null); setNewIvr({ node: '', voice: '', active: true, options: [{ key: '1', type: 'node', target: '', agentId: '', voice: '' }], menu: '' }); setAddOpen(true) }}>Add</button>
          <button className="btn btn-sm btn-outline-danger me-2" onClick={async () => {
            const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
            if (!currentBusinessId) return
            if (!window.confirm('Delete ALL IVRs for this business? This cannot be undone.')) return
            try {
              setDeletingAll(true)
              const endpoint = `/ivrs/business/${currentBusinessId}`
              const res = await apiCall(endpoint, 'DELETE')
              if (res && res.success) {
                console.log('Deleted all IVRs', res)
                fetchIvrs(1)
              } else {
                console.error('Failed to delete IVRs', res)
              }
            } catch (err) {
              console.error('Error deleting IVRs', err)
            } finally {
              setDeletingAll(false)
            }
          }} disabled={deletingAll || loading}>Delete all</button>
          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => fetchIvrs(1)} disabled={loading}>Refresh</button>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>Prev</button>
          <span className="mx-2">Page {page}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage((p) => p + 1)} disabled={loading}>Next</button>
        </div>
      </CCardHeader>
      <CCardBody>
        {!businessId && (
          <div className="mb-3">
            <div className="alert alert-warning">Missing <code>businessId</code> in localStorage. Set it to view IVRs.</div>
          </div>
        )}

        <CModal visible={detailsOpen} onClose={closeDetails} alignment="center">
          <CModalHeader>
            <CModalTitle>IVR Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {!selectedItem ? (<div>No item selected</div>) : (
              <div>
                <div className="mb-2"><strong>Name:</strong> {selectedItem.name || selectedItem.title || '-'}</div>
                <div className="mb-2"><strong>Virtual Number:</strong> {selectedItem.virtualNumber || selectedItem.number || '-'}</div>
                <div className="mb-2"><strong>Created By:</strong> {selectedItem.createdBy?.email || selectedItem.createdBy?.name || '-'}</div>
                <div className="mb-2"><strong>Created At:</strong> {formatDateTimeShort(selectedItem.createdAt || selectedItem.created)}</div>
                <div className="mb-2"><strong>Status:</strong> <CBadge color={selectedItem.active ? 'success' : 'secondary'}>{selectedItem.active ? 'Active' : 'Inactive'}</CBadge></div>
                <hr />
                <h6>Routing / Menu</h6>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedItem.menu || selectedItem.routing || selectedItem, null, 2)}</pre>
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={closeDetails}>Close</CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={addOpen} onClose={() => { setAddOpen(false); setEditingNode(null) }} alignment="center" size="xl">
          <CModalHeader>
            <CModalTitle>{editingNode ? `Edit IVR (${editingNode})` : 'Add IVR'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-2">
              <label className="form-label">Node (identifier)</label>
              <input className="form-control" value={newIvr.node} placeholder="e.g. menu, sales_menu" onChange={(e) => setNewIvr({ ...newIvr, node: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="form-label">Voice Text</label>
              <input className="form-control" value={newIvr.voice} placeholder="e.g. Welcome to Acme." onChange={(e) => setNewIvr({ ...newIvr, voice: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="form-label">Options (press {'>'} target)</label>
              {newIvr.options.map((opt, idx) => (
                <div key={idx} className="d-flex mb-2">
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
                        const val = e.target.value
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
                        const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], agentId: e.target.value }; setNewIvr({ ...newIvr, options: copy })
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
                      <select className="form-select me-2" value={opt.target || ''} onChange={(e) => {
                        const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                      }}>
                        <option value="">Select node</option>
                        {existingNodes.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      ) : (
                        <input className="form-control me-2" value={opt.target} onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                        }} placeholder="e.g. sales_menu" />
                      )
                    )
                  }
                  <input style={{ width: 200 }} className="form-control me-2" value={opt.voice || ''} onChange={(e) => {
                    const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], voice: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                  }} placeholder="Option voice text (e.g. For sales)" />
                  <button className="btn btn-sm btn-outline-danger" onClick={() => {
                    const copy = [...newIvr.options]; copy.splice(idx, 1); setNewIvr({ ...newIvr, options: copy })
                  }}>Remove</button>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-primary" onClick={() => setNewIvr({ ...newIvr, options: [...newIvr.options, { key: '', type: 'node', target: '', agentId: '', voice: '' }] })}>Add option</button>
            </div>
            {/* Timeout removed per request */}
            <div className="mb-2">
              <label className="form-label">Advanced JSON (optional)</label>
              <textarea className="form-control" rows={6} value={newIvr.menu} onChange={(e) => setNewIvr({ ...newIvr, menu: e.target.value })} placeholder='{"options": {"1":"node:sales_menu"}}' />
            </div>
            <div className="form-check form-switch mb-2">
              <input className="form-check-input" type="checkbox" id="ivrActive" checked={!!newIvr.active} onChange={(e) => setNewIvr({ ...newIvr, active: e.target.checked })} />
              <label className="form-check-label" htmlFor="ivrActive">Active</label>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { setAddOpen(false); setEditingNode(null) }}>Cancel</CButton>
            <CButton color="primary" onClick={async () => {
              const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
              if (!currentBusinessId) return
              try {
                // Build options from the friendly editor if it has entries, otherwise fall back to Advanced JSON
                const hasEditorOptions = Array.isArray(newIvr.options) && newIvr.options.some(o => o.key && (o.target || o.voice))

                if (editingNode) {
                  // Build payload for PUT /ivr/:node using array format
                  let optionsArray = []
                  if (hasEditorOptions) {
                    newIvr.options.forEach((o) => {
                      if (!o.key) return
                      if (o.type === 'dept') {
                        // if an agent was selected for this department option, prefer dept:<department>:<didExtension>
                        if (o.agentId) {
                          // try to resolve department from o.target first, otherwise find department containing this agent
                          let dept = departments.find(d => d._id === o.target || d.id === o.target)
                          if (!dept) {
                            dept = departments.find(d => Array.isArray(d.members) && d.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId)))
                          }
                          const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target || ''
                          let ext = ''
                          // prefer explicit member info on dept.members
                          if (dept && Array.isArray(dept.members) && dept.members.length) {
                            const member = dept.members.find(m => (m._id === o.agentId || m.userId === o.agentId || m.id === o.agentId))
                            if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                          }
                          // fallback to fetched departmentMembers cache
                          if (!ext) {
                            const members = dept ? (departmentMembers[dept._id] || departmentMembers[dept.id] || []) : []
                            const member = members.find(m => (m._id === o.agentId || m.id === o.agentId))
                            if (member) ext = member.didExtension || member.did_extension || member.didNumber || ''
                          }
                          // as last resort, search departmentMembers across all departments for this agent
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
                  } else if (newIvr.menu) {
                    try {
                      const parsed = JSON.parse(newIvr.menu)
                      if (parsed && typeof parsed === 'object') {
                        if (Array.isArray(parsed.options)) optionsArray = parsed.options
                        else if (parsed.options && typeof parsed.options === 'object') optionsArray = Object.keys(parsed.options).map(k => ({ key: k, voice: parsed.options[k].voice || '', destination: parsed.options[k].destination || parsed.options[k] }))
                      }
                    } catch (e) {
                      // fallback: try lines
                      const lines = newIvr.menu.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                      lines.forEach((line) => {
                        const m = line.match(/^(\d+)\s*[:=]\s*(.+)$/)
                        if (m) optionsArray.push({ key: m[1], voice: '', destination: m[2].trim() })
                      })
                    }
                  }

                  const putPayload = {
                    businessId: currentBusinessId,
                    menu: {
                      voice: newIvr.voice || '',
                      options: optionsArray,
                    }
                  }
                  const endpoint = `/ivr/${editingNode}`
                  const res = await apiCall(endpoint, 'PUT', putPayload)
                  if (res && (res.success || res.updated)) {
                    setAddOpen(false)
                    setEditingNode(null)
                    setNewIvr({ node: '', prompt: '', active: true, options: [{ key: '1', type: 'node', target: '', agentId: '' }], menu: '' })
                    fetchIvrs(1)
                  } else {
                    console.error('Failed to update IVR', res)
                  }
                } else {
                  // Create (existing generate flow)
                  let parsedOptions = {}
                  if (hasEditorOptions) {
                    newIvr.options.forEach((o) => {
                      if (!o.key) return
                      if (o.type === 'dept') {
                        if (o.agentId) {
                          // resolve department and extension similarly to update path
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
                  } else if (newIvr.menu) {
                    try {
                      const parsed = JSON.parse(newIvr.menu)
                      if (parsed && typeof parsed === 'object') {
                        parsedOptions = parsed.options && typeof parsed.options === 'object' ? parsed.options : parsed
                      }
                    } catch (e) {
                      const lines = newIvr.menu.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
                      lines.forEach((line) => {
                        const m = line.match(/^(\d+)\s*[:=]\s*(.+)$/)
                        if (m) parsedOptions[m[1]] = m[2].trim()
                      })
                    }
                  }

                  const generatePayload = {
                    businessId: currentBusinessId,
                    node: newIvr.node || `menu_${Date.now()}`,
                    voice: newIvr.voice || ``,
                    options: parsedOptions,
                  }
                  const endpoint = `/ivr/generate`
                  const res = await apiCall(endpoint, 'POST', generatePayload)
                  if (res && (res.success || res.generated)) {
                    setAddOpen(false)
                    setNewIvr({ node: '', prompt: '', active: true, options: [{ key: '1', type: 'node', target: '', agentId: '' }], menu: '' })
                    fetchIvrs(1)
                  } else {
                    console.error('Failed to generate IVR', res)
                  }
                }
              } catch (err) {
                console.error('Error saving IVR', err)
              }
            }}>{editingNode ? 'Save' : 'Create'}</CButton>
          </CModalFooter>
        </CModal>

        {loading ? (
          <div className="text-center py-4"><CSpinner /></div>
        ) : ivrs.length === 0 ? (
          <div className="text-center py-3">No IVRs found</div>
        ) : (
          <CTable hover responsive className="table-sm compact-table" style={{ tableLayout: 'auto' }}>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '3%' }}></CTableHeaderCell>
                <CTableHeaderCell style={{ width: '25%' }}>Name</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '30%' }}>Voice</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '10%' }}>Options</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '15%' }}>Created At</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '10%' }}>Action</CTableHeaderCell>
                <CTableHeaderCell className="text-center" style={{ width: '10%' }}>Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {ivrs.map((i) => (
                <React.Fragment key={i._id || i.id || i.name}>
                  <CTableRow onClick={() => toggleRow(i._id || i.id || i.name)} style={{ cursor: 'pointer', backgroundColor: expandedRows.has(i._id || i.id || i.name) ? '#f8f9fa' : 'transparent' }} role="button" tabIndex={0}>
                    <CTableDataCell className="align-middle text-center"><span style={{ fontSize: '1.2rem' }}>{expandedRows.has(i._id || i.id || i.name) ? '▼' : '▶'}</span></CTableDataCell>
                    <CTableDataCell className="align-middle">{i.name || '-'}</CTableDataCell>
                    <CTableDataCell className="align-middle">{i.voice || '-'}</CTableDataCell>
                    <CTableDataCell className="align-middle">{Array.isArray(i.options) ? i.options.length : (i.totalMenuOptions || '-')}</CTableDataCell>
                    <CTableDataCell className="align-middle">{formatDateTimeShort(i.createdAt)}</CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <div>
                        <button className="btn btn-sm btn-warning" onClick={(e) => { e.stopPropagation(); openEdit(i) }}>Edit</button>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-center align-middle"><CBadge color={i.status === 'active' || i.status === 'on' ? 'success' : 'secondary'}>{i.status || '-'}</CBadge></CTableDataCell>
                  </CTableRow>
                  {expandedRows.has(i._id || i.id || i.name) && (
                    <CTableRow>
                      <CTableDataCell colSpan={6} style={{ padding: '1rem', backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ flex: 1 }}>
                            <h6 className="mb-2">IVR Details</h6>
                            {/* Welcome removed (not used anymore) */}
                            <div className="mb-2"><strong>File:</strong> {i.fileName || i.audioFile || i._id || '-'}</div>
                            <div className="mb-2"><strong>Menu Options:</strong></div>
                            <div>
                              {Array.isArray(i.options) && i.options.length > 0 ? (
                                i.options.map((opt) => (
                                  <div key={opt._id || opt.key} className="mb-1 p-2" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                    <div><strong>Key:</strong> {opt.key}</div>
                                    <div><strong>Voice:</strong> {opt.voice || opt.text || '-'}</div>
                                    <div><strong>Destination:</strong> {opt.destination || opt.destinationType || opt.destination || '-'}</div>
                                  </div>
                                ))
                              ) : (
                                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(i.menu || i.raw || {}, null, 2)}</pre>
                              )}
                            </div>
                          </div>
                          <div className="ms-3">
                            <div>
                              <CButton size="sm" color="primary" onClick={(e) => { e.stopPropagation(); openDetails(i) }}>Details</CButton>
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </React.Fragment>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default IVRManagement