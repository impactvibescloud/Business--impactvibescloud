import React, { useEffect, useState, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormLabel,
  CFormInput,
  CFormText,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
  CFormSwitch,
} from '@coreui/react'
import Swal from 'sweetalert2'
import axios from 'axios'
import { apiCall, getBaseURL } from '../../config/api'

const IVRManagement = () => {
  const [businessId, setBusinessId] = useState('')
  const [ivrs, setIvrs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [menuWelcome, setMenuWelcome] = useState('')
  const [menuRepeat, setMenuRepeat] = useState('')
  const [options, setOptions] = useState([])
  // tree represents nested menu structure for the new create-nested API
  const [tree, setTree] = useState({ name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] })
  const [didOptions, setDidOptions] = useState([])
  const [loadingDids, setLoadingDids] = useState(false)
  const audioRef = useRef(null)
  const audioPlayerRef = useRef(null)
  const [playingUrl, setPlayingUrl] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const token = localStorage.getItem('authToken')
  const [treeModalVisible, setTreeModalVisible] = useState(false)
  const [activeTree, setActiveTree] = useState(null)
  const [treeLoading, setTreeLoading] = useState(false)

  const getLevelBg = (level) => {
    const levelColors = ['#e8fff0', '#e8f7ff', '#fff7e0', '#f7e8ff', '#ffffff']
    return levelColors[level] || (level % 2 === 0 ? '#f7f7f7' : '#eef7f7')
  }

  // Helpers to manage tree state immutably by path (path is array of child indices)
  const getNodeAtPath = (node, path) => {
    if (!path || path.length === 0) return node
    const [idx, ...rest] = path
    if (!node.children || !node.children[idx]) return { name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
    return getNodeAtPath(node.children[idx], rest)
  }

  const setNodeAtPath = (node, path, newNode) => {
    if (!path || path.length === 0) return newNode
    const [idx, ...rest] = path
    const children = (node.children || []).map((c, i) => (i === idx ? setNodeAtPath(c, rest, newNode) : c))
    return { ...node, children }
  }

  const updateTreeNode = (path, newNode) => {
    setTree(prev => setNodeAtPath(prev, path, newNode))
  }

  const addChildAt = (path) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const child = { name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
      const newParent = { ...parent, children: [...(parent.children || []), child] }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const removeChildAt = (path, childIdx) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const newChildren = (parent.children || []).filter((_, i) => i !== childIdx)
      const newParent = { ...parent, children: newChildren }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const addOptionAt = (path) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const newOptions = [...(parent.menu?.options || []), { key: '', text: '', destination: '', destinationType: 'menu' }]
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  // Attach a child mapping to a specific option (stores mapping in children array)
  const addChildForOption = (path, optKey) => {
    // Add a child node inside the matching option's `children` array so multiple children per option are supported
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const options = parent.menu?.options || []
      const found = options.findIndex(o => o.key === optKey)
      const optIdx = found >= 0 ? found : 0
      const child = { name: optKey || '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
      const newOptions = options.map((o, i) => i === optIdx ? { ...(o || {}), children: [...((o && o.children) || []), child] } : o)
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const updateChildInOption = (path, optIndex, childIndex, newChild) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const options = parent.menu?.options || []
      const newOptions = options.map((o, i) => {
        if (i !== optIndex) return o
        const children = (o.children || []).map((c, ci) => (ci === childIndex ? newChild : c))
        return { ...o, children }
      })
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const removeChildFromOption = (path, optIndex, childIndex) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const options = parent.menu?.options || []
      const newOptions = options.map((o, i) => {
        if (i !== optIndex) return o
        const children = (o.children || []).filter((_, ci) => ci !== childIndex)
        return { ...o, children }
      })
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const updateOptionAt = (path, optIndex, newOpt) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const newOptions = (parent.menu?.options || []).map((o, i) => (i === optIndex ? newOpt : o))
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const removeOptionAt = (path, optIndex) => {
    setTree(prev => {
      const parent = getNodeAtPath(prev, path)
      const newOptions = (parent.menu?.options || []).filter((_, i) => i !== optIndex)
      const newParent = { ...parent, menu: { ...parent.menu, options: newOptions } }
      return setNodeAtPath(prev, path, newParent)
    })
  }

  const NodeEditor = ({ path, nodeProp, onChange, level = 0 }) => {
    const resolvedNode = nodeProp || getNodeAtPath(tree, path)
    const [localNode, setLocalNode] = useState(resolvedNode)
    const containerRef = useRef(null)
    const [expandedOptChildren, setExpandedOptChildren] = useState(() => new Set())
    const [expandedChildren, setExpandedChildren] = useState(() => new Set())
    useEffect(() => {
      try {
        // If an input inside this editor is focused, avoid overwriting local state (prevents blur/caret issues)
        const active = document && document.activeElement
        if (containerRef.current && active && containerRef.current.contains(active)) {
          return
        }
      } catch (e) {
        // ignore (server-side or test env)
      }
      setLocalNode(resolvedNode)
    }, [resolvedNode])

    const setNode = (newNode) => {
      // only update local copy — defer committing to parent until blur or explicit commit
      setLocalNode(newNode)
    }

    const commitNode = (nodeToCommit) => {
      if (!nodeToCommit) nodeToCommit = localNode
      if (syncTimer.current) {
        clearTimeout(syncTimer.current)
        syncTimer.current = null
      }
      if (onChange) return onChange(nodeToCommit)
      return updateTreeNode(path, nodeToCommit)
    }

    const syncTimer = useRef(null)
    useEffect(() => {
      return () => { if (syncTimer.current) clearTimeout(syncTimer.current) }
    }, [])
    // Local helper wrappers that operate on the `node` when in `nodeProp` mode,
    // or delegate to global functions when editing by path.
    const updateOptionLocal = (optIdx, newOpt) => {
      const newOptions = (localNode.menu?.options || []).map((o, i) => (i === optIdx ? newOpt : o))
      const newLocal = { ...localNode, menu: { ...localNode.menu, options: newOptions } }
      setNode(newLocal)
    }
    const addOptionLocal = () => {
      const newOptions = [...(localNode.menu?.options || []), { key: '', text: '', destination: '', destinationType: 'menu' }]
      const newLocal = { ...localNode, menu: { ...localNode.menu, options: newOptions } }
      setNode(newLocal)
      // commit structural change immediately
      commitNode(newLocal)
    }
    const removeOptionLocal = (optIdx) => {
      const newOptions = (localNode.menu?.options || []).filter((_, i) => i !== optIdx)
      const newLocal = { ...localNode, menu: { ...localNode.menu, options: newOptions } }
      setNode(newLocal)
      commitNode(newLocal)
    }
    const addChildToOptionLocal = (optIdx) => {
      const options = localNode.menu?.options || []
      const child = { name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
      const newOptions = options.map((o, i) => i === optIdx ? { ...(o || {}), children: [...((o && o.children) || []), child] } : o)
      const newLocal = { ...localNode, menu: { ...localNode.menu, options: newOptions } }
      setNode(newLocal)
      commitNode(newLocal)
    }

    const addChildLocal = () => {
      if (path && path.length >= 0) {
        // when editing by path, delegate to global helper
        return addChildAt(path)
      }
      const child = { name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
      const newLocal = { ...localNode, children: [...(localNode.children || []), child] }
      setNode(newLocal)
      commitNode(newLocal)
    }
    const removeChildFromOptionLocal = (optIdx, childIdx) => {
      const options = localNode.menu?.options || []
      const newOptions = options.map((o, i) => {
        if (i !== optIdx) return o
        const children = (o.children || []).filter((_, ci) => ci !== childIdx)
        return { ...o, children }
      })
      const newLocal = { ...localNode, menu: { ...localNode.menu, options: newOptions } }
      setNode(newLocal)
      commitNode(newLocal)
    }
    // determine effective level: prefer path depth if editing by path, otherwise use explicit level prop
    const effectiveLevel = (Array.isArray(path) ? path.length : level) || 0
    const node = localNode
    const rawChildren = node.children || []
    return (
      <div ref={containerRef} className="border rounded p-2 mb-2" style={{ backgroundColor: getLevelBg(effectiveLevel) }}>
        <div className="mb-2">
          <CFormLabel>name</CFormLabel>
          <CFormInput value={node.name || ''} onChange={(e) => setNode({ ...node, name: e.target.value })} onBlur={() => commitNode()} placeholder="name (e.g. menu or SalesMenu)" />
        </div>
        <div className="mb-2">
          <CFormLabel>menu.welcome</CFormLabel>
          <CFormInput value={node.menu?.welcome || ''} onChange={(e) => setNode({ ...node, menu: { ...node.menu, welcome: e.target.value } })} onBlur={() => commitNode()} />
        </div>
        <div className="mb-2">
          <CFormLabel>menu.options[]</CFormLabel>
          {(node.menu?.options || []).map((opt, idx) => (
            <div key={idx} className="mb-2">
                <div className="input-group mb-1">
                <CFormInput style={{ maxWidth: 80 }} value={opt.key || ''} placeholder="menu.options[].key" onChange={(e) => {
                  const newOpt = { ...opt, key: e.target.value }
                  updateOptionLocal(idx, newOpt)
                }} onBlur={() => commitNode()} />
                <CFormInput value={opt.text || ''} placeholder="menu.options[].text" onChange={(e) => updateOptionLocal(idx, { ...opt, text: e.target.value })} onBlur={() => commitNode()} />
                <select className="form-control" style={{ maxWidth: 180, marginRight: 6 }} value={opt.destinationType || 'menu'} onChange={(e) => updateOptionLocal(idx, { ...opt, destinationType: e.target.value, destination: '' })} onBlur={() => commitNode()}>
                  <option value="menu">menu.options[].destination (menu)</option>
                  <option value="did">menu.options[].destination (did)</option>
                </select>
                { (opt.destinationType || 'menu') === 'did' ? (
                  <select className="form-control" style={{ maxWidth: 220 }} value={opt.destination || ''} onChange={(e) => updateOptionLocal(idx, { ...opt, destination: e.target.value })} onBlur={() => commitNode()}>
                    <option value="">menu.options[].destination</option>
                    {loadingDids ? <option disabled>Loading...</option> : didOptions.map(d => (
                      <option key={d.id} value={d.id}>{d.number}</option>
                    ))}
                  </select>
                ) : (
                  <CFormInput value={opt.destination || ''} placeholder="menu.options[].destination" onChange={(e) => updateOptionLocal(idx, { ...opt, destination: e.target.value })} onBlur={() => commitNode()} />
                )}
                <button type="button" className="btn btn-danger" onClick={() => removeOptionLocal(idx)}>Remove</button>
              </div>
              <div>
                      {(opt.children || []).map((childNode, cIdx) => {
                        const childKey = `opt-${idx}-child-${cIdx}`
                        const isExpandedChild = expandedOptChildren.has(childKey)
                        return (
                          <div key={cIdx} className="ms-3 mb-2">
                            <div className="d-flex justify-content-between mb-1">
                              <div className="text-muted small">{childNode.name || childNode.fileName || 'Child Menu'}</div>
                              <div>
                                <CButton color="light" size="sm" className="me-2" onClick={() => {
                                  setExpandedOptChildren(prev => {
                                    const copy = new Set(prev)
                                    if (copy.has(childKey)) copy.delete(childKey)
                                    else copy.add(childKey)
                                    return copy
                                  })
                                }}>{isExpandedChild ? 'Collapse' : 'Expand'}</CButton>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeChildFromOptionLocal(idx, cIdx)}>Remove Child</button>
                              </div>
                            </div>
                            {isExpandedChild ? (
                              <NodeEditor nodeProp={childNode} level={effectiveLevel + 1} onChange={(newNode) => updateChildInOption(path, idx, cIdx, newNode)} />
                            ) : null}
                          </div>
                        )
                      })}
                <div className="mt-1">
                  <CButton color="secondary" size="sm" onClick={() => addChildToOptionLocal(idx)}>Add Child Menu</CButton>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-2">
            <CButton color="secondary" size="sm" onClick={() => addOptionLocal()}>Add Option</CButton>
          </div>
        </div>
        <div className="mb-2">
          <CFormLabel>menu.repeat</CFormLabel>
          <CFormInput value={node.menu?.repeat || ''} onChange={(e) => setNode({ ...node, menu: { ...node.menu, repeat: e.target.value } })} onBlur={() => commitNode()} />
        </div>
        <div className="mb-2">
          <CFormText className="text-muted">children (unattached)</CFormText>
          {(rawChildren || []).map((ch, idx) => {
            // skip attached mapping children (those with key+child/children that match an option)
            if (ch && ch.key && (ch.child || ch.children) && (node.menu?.options || []).some(o => o.key === ch.key)) return null
            const childKey = `child-${idx}`
            const isExpanded = expandedChildren.has(childKey)
            return (
              <div key={idx} className="ms-3 mb-2">
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted small">{ch.name || ch.fileName || 'Child Menu'}</div>
                  <div>
                    <CButton color="light" size="sm" className="me-2" onClick={() => setExpandedChildren(prev => {
                      const copy = new Set(prev)
                      if (copy.has(childKey)) copy.delete(childKey)
                      else copy.add(childKey)
                      return copy
                    })}>{isExpanded ? 'Collapse' : 'Expand'}</CButton>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeChildAt(path, idx)}>Remove Child</button>
                  </div>
                </div>
                {isExpanded ? (
                  <NodeEditor path={[...path, idx]} level={effectiveLevel + 1} />
                ) : null}
              </div>
            )
          })}
          <div>
            <CButton color="secondary" size="sm" onClick={() => addChildLocal()}>Add Child Menu</CButton>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const user = res.user || res.data || res
        if (user && user.businessId) setBusinessId(user.businessId)
      } catch (e) {
        console.warn('Failed to fetch user details', e)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!businessId) return
    fetchIvrs()
  }, [businessId])

  useEffect(() => {
    if (!businessId) return
    const fetchDids = async () => {
      setLoadingDids(true)
      try {
        const resp = await apiCall(`/numbers/assigned-to/${businessId}`, 'GET')
        const list = resp.data || resp.numbers || resp || []
        const opts = (Array.isArray(list) ? list : []).map(d => ({ id: d._id || d.id, number: d.number || d }))
        setDidOptions(opts)
      } catch (e) {
        console.warn('Failed to fetch DIDs', e)
      } finally {
        setLoadingDids(false)
      }
    }
    fetchDids()
  }, [businessId])

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (playingUrl) {
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) { /* ignore */ }
      }
    }
  }, [playingUrl])

  const fetchIvrs = async () => {
    setLoading(true)
    try {
      // Fetch the main menu tree for this business. We no longer use the by-business listing.
      const url = `${getBaseURL()}/api/ivr/tree/menu?businessId=${businessId}`
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      const payload = resp && resp.data ? resp.data : resp
      // Expect payload.tree to be the root menu object. Normalize into an array so UI can reuse ivrs list.
      const tree = payload && (payload.tree || payload)
      setIvrs(tree ? (Array.isArray(tree) ? tree : [tree]) : [])
    } catch (err) {
      console.error('Failed to fetch IVRs', err)
      setIvrs([])
    } finally {
      setLoading(false)
    }
  }

  // populate form when single IVR exists
  useEffect(() => {
    if (!displayedIvrs) return
    if (displayedIvrs.length === 0) {
      // clear form for fresh creation when no IVR exists
      setName('')
      setDescription('')
      setAudioFile(null)
      setTree({ name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] })
      return
    }
    const ivr = displayedIvrs[0]
    setName(ivr.name || '')
    setDescription(ivr.description || '')
    // try to populate tree shape
    let payloadTree = null
    if (ivr.tree) payloadTree = ivr.tree
    else if (ivr.menu) payloadTree = { name: ivr.name || '', menu: ivr.menu, children: ivr.children || [] }
    else payloadTree = ivr
    // normalize option children: if option children reference ivr ids, replace with full child node from tree.children
    const normalizeTree = (t) => {
      if (!t) return t
      const map = new Map()
      // collect direct child nodes from tree.children which may contain { key, destination, child }
      if (Array.isArray(t.children)) {
        t.children.forEach(c => {
          if (c && c.child && (c.child._id || c.child.id)) {
            map.set(c.child._id || c.child.id, c.child)
          } else if (c && (c._id || c.id)) {
            map.set(c._id || c.id, c)
          }
        })
      }
      // also collect any children that may appear under menu.options[].children as full nodes
      if (t.menu && Array.isArray(t.menu.options)) {
        t.menu.options.forEach(o => {
          if (o && Array.isArray(o.children)) {
            o.children.forEach(ch => {
              const id = ch && (ch._id || ch.ivrId || ch.id)
              if (id && ch.menu) {
                map.set(id, ch)
              }
            })
          }
        })
      }

      // replace shallow children with full nodes when possible
      if (t.menu && Array.isArray(t.menu.options)) {
        t.menu.options = t.menu.options.map(o => {
          if (!o) return o
          if (Array.isArray(o.children)) {
            o.children = o.children.map(ch => {
              const id = ch && (ch._id || ch.ivrId || ch.id)
              if (id && map.has(id)) return map.get(id)
              // if child already has menu, keep as-is
              if (ch && ch.menu) return ch
              // otherwise construct a minimal node so inputs render
              return { name: ch.name || '', fileName: ch.fileName || ch.file || '', businessId: ch.businessId || t.businessId || '', menu: ch.menu || { welcome: '', options: [], repeat: '' }, children: ch.children || [] }
            })
          }
          return o
        })
      }
      return t
    }

    if (payloadTree) setTree(normalizeTree(payloadTree))
  }, [ivrs])

  const handleSave = async (existingIvr) => {
    if (!businessId) return Swal.fire({ icon: 'warning', title: 'Missing business', text: 'Business ID not available' })
    try {
      const hasMenuForm = (tree && (tree.menu && (tree.menu.welcome || (tree.menu.options && tree.menu.options.length > 0) || tree.menu.repeat) || (tree.children && tree.children.length > 0)))
      if (hasMenuForm) {
        const payloadTree = { ...tree }
        if (!payloadTree.name) payloadTree.name = name || 'menu'
        const url = `${getBaseURL()}/api/ivr/create-nested`
        await axios.post(url, { businessId, tree: payloadTree }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      } else if (audioFile) {
        const form = new FormData()
        form.append('name', name)
        form.append('description', description)
        form.append('businessId', businessId)
        form.append('audio', audioFile)
        const url = `${getBaseURL()}/api/ivr`
        await axios.post(url, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        })
      } else {
        const url = `${getBaseURL()}/api/ivr`
        await axios.post(url, { name, description, businessId }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      }
      Swal.fire({ icon: 'success', title: existingIvr ? 'Saved' : 'Created' })
      // reset audio input
      if (audioRef.current) audioRef.current.value = ''
      setAudioFile(null)
      await fetchIvrs()
    } catch (err) {
      console.error('Save failed', err)
      const msg = err?.response?.data?.message || err?.message || 'Save failed'
      Swal.fire({ icon: 'error', title: 'Save failed', text: msg })
    }
  }

  const handleCreate = async () => {
    if (!businessId) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Business ID not available.' })
      return
    }

    try {
      // If user built the menu using the visual editor, call the nested create endpoint
      const hasMenuForm = (tree && (tree.menu && (tree.menu.welcome || (tree.menu.options && tree.menu.options.length > 0) || tree.menu.repeat) || (tree.children && tree.children.length > 0)))
      if (hasMenuForm) {
        // use the tree state; ensure it has a name
        const payloadTree = { ...tree }
        if (!payloadTree.name) payloadTree.name = name || 'menu'
        const url = `${getBaseURL()}/api/ivr/create-nested`
        await axios.post(url, { businessId, tree: payloadTree }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      } else if (audioFile) {
        const form = new FormData()
        form.append('name', name)
        form.append('description', description)
        form.append('businessId', businessId)
        form.append('audio', audioFile)
        const url = `${getBaseURL()}/api/ivr`
        await axios.post(url, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        })
      } else {
        // Use explicit API for simple IVR creation
        const url = `${getBaseURL()}/api/ivr`
        await axios.post(url, { name, description, businessId }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      }
      Swal.fire({ icon: 'success', title: 'IVR Created' })
      setShowModal(false)
      setName('')
      setDescription('')
      setAudioFile(null)
      setMenuWelcome('')
      setMenuRepeat('')
      setOptions([])
      setTree({ name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] })
      if (audioRef.current) audioRef.current.value = ''
      await fetchIvrs()
    } catch (err) {
      console.error('Create IVR failed', err)
      const msg = err?.response?.data?.message || err.message || 'Create failed'
      Swal.fire({ icon: 'error', title: 'Create failed', text: msg })
    }
  }

  const handleDelete = async (ivr) => {
    const id = ivr._id || ivr.id
    if (!id) return Swal.fire({ icon: 'error', title: 'Invalid IVR' })
    const res = await Swal.fire({ title: 'Delete IVR?', text: `Delete "${ivr.name || 'IVR'}"?`, icon: 'warning', showCancelButton: true })
    if (!res.isConfirmed) return
    try {
      // If this is the main/root menu (e.g. name === 'menu' or filename contains '-menu'),
      // call the nested delete endpoint which deletes the whole tree for the business.
      const nameLower = (ivr.name || '').toString().toLowerCase()
      const fileLower = (ivr.fileName || '').toString().toLowerCase()
      const isRootMenu = nameLower === 'menu' || fileLower.includes('-menu')
      if (isRootMenu) {
        const url = `${getBaseURL()}/api/ivr/nested/menu?businessId=${businessId}`
        await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await apiCall(`/api/ivr/${id}`, 'DELETE')
      }
      Swal.fire({ icon: 'success', title: 'Deleted' })
      await fetchIvrs()
    } catch (err) {
      console.error('Delete IVR failed', err)
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err?.message || 'Delete failed' })
    }
  }

  const handlePlay = async (ivr) => {
    const id = ivr._id || ivr.id
    // Prefer using the IVR 'name' as the download key (example: /api/ivr/download/menu)
    const fileKey = ivr.name || ivr.fileName || ivr.file || ''
    if (!fileKey) return Swal.fire({ icon: 'error', title: 'No audio', text: 'No audio file available for this IVR.' })

    // If already playing this id, stop it
    if (playingId === id) {
      handleStop()
      return
    }

    try {
      // stop any existing
      handleStop()
      const url = `${getBaseURL()}/api/ivr/download/${encodeURIComponent(fileKey)}`
      // request as arraybuffer to ensure we receive raw bytes
      const resp = await axios.get(url, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } })
      const contentType = resp.headers && resp.headers['content-type'] ? resp.headers['content-type'] : 'audio/wav'
      const blob = new Blob([resp.data], { type: contentType })
      const objectUrl = window.URL.createObjectURL(blob)
      setPlayingUrl(objectUrl)
      setPlayingId(id)
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = objectUrl
        // ensure audio element loads the new source
        try { audioPlayerRef.current.load() } catch (e) { /* ignore */ }
        try { await audioPlayerRef.current.play() } catch (e) { /* autoplay might be blocked */ }
      }
    } catch (err) {
      console.error('Play failed', err)
      const message = err?.response?.data || err?.message || 'Could not play audio'
      Swal.fire({ icon: 'error', title: 'Play failed', text: message })
    }
  }

  const handleOpenInNewTab = async (ivr) => {
    const fileKey = ivr.name || ivr.fileName || ivr.file || ''
    if (!fileKey) return Swal.fire({ icon: 'error', title: 'No audio', text: 'No audio file available for this IVR.' })
    try {
      const url = `${getBaseURL()}/api/ivr/download/${encodeURIComponent(fileKey)}`
      const resp = await axios.get(url, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } })
      const contentType = resp.headers && resp.headers['content-type'] ? resp.headers['content-type'] : 'audio/wav'
      const blob = new Blob([resp.data], { type: contentType })
      const objectUrl = window.URL.createObjectURL(blob)
      window.open(objectUrl, '_blank')
      // revoke after a delay to allow the new tab to start loading
      setTimeout(() => { try { window.URL.revokeObjectURL(objectUrl) } catch (e) {} }, 60000)
    } catch (err) {
      console.error('Open failed', err)
      Swal.fire({ icon: 'error', title: 'Open failed', text: err?.response?.data || err?.message || 'Could not open audio' })
    }
  }

  const handleShowTree = async (ivr) => {
    const fileKey = ivr.name || ivr.fileName || ivr.file || ''
    if (!fileKey) return Swal.fire({ icon: 'error', title: 'No tree', text: 'No tree available for this IVR.' })
    setTreeLoading(true)
    try {
      const url = `${getBaseURL()}/api/ivr/tree/${encodeURIComponent(fileKey)}?businessId=${businessId}`
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      const tree = resp.data && (resp.data.tree || resp.data) ? (resp.data.tree || resp.data.tree || resp.data) : null
      // Try common shapes
      const payloadTree = resp.data && resp.data.tree ? resp.data.tree : (resp.data && resp.data.tree === undefined ? resp.data : null)
      setActiveTree(payloadTree || resp.data || null)
      setTreeModalVisible(true)
    } catch (err) {
      console.error('Fetch tree failed', err)
      Swal.fire({ icon: 'error', title: 'Fetch failed', text: err?.response?.data?.message || err?.message || 'Could not fetch tree' })
    } finally {
      setTreeLoading(false)
    }
  }

  const TreeViewer = ({ node, level = 0 }) => {
    if (!node) return null
    const indent = { marginLeft: `${level * 12}px`, borderLeft: level === 0 ? 'none' : '1px dashed #ccc', paddingLeft: '8px' }
    // Support response shapes: node.menu, node.children (array of { key,destination,child }), or children array of nodes
    const menu = node.menu || {}
    const children = node.children || []
    return (
      <div style={{ ...indent, backgroundColor: getLevelBg(level), borderRadius: 4 }} className="mb-2 p-2">
        <div><strong>{node.name || node.fileName || 'Menu'}</strong> {node.fileName ? <span className="text-muted">({node.fileName})</span> : null}</div>
        {menu.welcome ? <div className="text-muted">{menu.welcome}</div> : null}
        {menu.options && menu.options.length > 0 && (
          <div className="mt-1">
            <small className="text-muted">Options:</small>
            <ul>
              {menu.options.map((o, i) => (
                <li key={o._id || i}>{o.key}: {o.text} → {o.destination}</li>
              ))}
            </ul>
          </div>
        )}
        {menu.repeat ? <div className="text-muted">Repeat: {menu.repeat}</div> : null}
        {/* Option-level children (menu.options[].children) */}
        {menu.options && menu.options.length > 0 && (
          <div className="mt-2">
            <small className="text-muted">Option Children:</small>
            <div>
              {menu.options.map((o, i) => (
                (o.children && o.children.length > 0) ? (
                  <div key={i} className="mb-2">
                    <div className="text-muted">On press <strong>{o.key}</strong> → {o.text}</div>
                    {o.children.map((child, ci) => (
                      <div key={ci} className="ms-3 mb-1">
                        <TreeViewer node={child} level={level + 1} />
                      </div>
                    ))}
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* children may also be an array of nodes or old-style mappings on the node */}
        {children && children.length > 0 && (
          <div className="mt-2">
            <small className="text-muted">Children:</small>
            <div>
              {children.map((c, idx) => {
                // If shape is { key, destination, child }
                if (c && c.child) {
                  return (
                    <div key={idx} className="mb-2">
                      <div className="text-muted">On press <strong>{c.key}</strong> → {c.destination}</div>
                      <TreeViewer node={c.child} level={level + 1} />
                    </div>
                  )
                }
                // Otherwise assume child is node
                return <TreeViewer key={idx} node={c} level={level + 1} />
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleStop = () => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.currentTime = 0
        audioPlayerRef.current.src = ''
      }
      if (playingUrl) {
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) { /* ignore */ }
      }
    } finally {
      setPlayingUrl(null)
      setPlayingId(null)
    }
  }

  // display only main/root menus (always)
  const displayedIvrs = ivrs.filter(i => {
    const nm = (i.name || '').toString().toLowerCase()
    if (nm === 'menu' || nm === 'main' || nm === 'root') return true
    if (i.menu && Array.isArray(i.children) && i.children.length > 0) return true
    if (Array.isArray(i.children) && i.children.length > 0) return true
    if (i.uploadedToAsterisk) return true
    return false
  })

  const [expandedKeys, setExpandedKeys] = useState([])
  const isExpanded = (k) => expandedKeys.includes(k)
  const toggleExpand = (k) => {
    setExpandedKeys(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }

  const [switchingIds, setSwitchingIds] = useState([])
  const isSwitching = (id) => switchingIds.includes(id)

  const handleSwitch = async (ivr, turnOn) => {
    const id = ivr._id || ivr.id || ivr.name
    if (!id) return Swal.fire({ icon: 'error', title: 'Invalid IVR' })
    const statusLower = (ivr.ivrStatus || ivr.status || ivr.state || '').toString().toLowerCase()
    // If caller provided explicit desired state, use it. Otherwise fall back to previous toggle logic.
    const action = typeof turnOn === 'boolean' ? (turnOn ? 'on' : 'off') : (statusLower === 'off' ? 'off' : ((statusLower === 'on' || statusLower === 'active') ? 'off' : 'on'))
    try {
      setSwitchingIds(prev => [...prev, id])
      const payload = { action, name: ivr.name || ivr.fileName || ivr.file || '', businessId }
      const url = `${getBaseURL()}/api/ivr/switch`
      await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      Swal.fire({ icon: 'success', title: `Switched ${action}` })
      await fetchIvrs()
    } catch (err) {
      console.error('Switch failed', err)
      const msg = err?.response?.data?.message || err?.message || 'Switch failed'
      Swal.fire({ icon: 'error', title: 'Switch failed', text: msg })
    } finally {
      setSwitchingIds(prev => prev.filter(x => x !== id))
    }
  }

  const renderTreeRows = (node, level = 0, path = '') => {
    if (!node) return []
    const key = node._id || node.name || path || Math.random().toString(36).slice(2)
    const id = node._id || node.id || node.name || key
    const indentStyle = { paddingLeft: `${level * 18}px` }
    const rows = []
    rows.push(
      <CTableRow key={`node-${key}`} style={{ backgroundColor: getLevelBg(level) }}>
        <CTableDataCell>
          <div style={indentStyle} className="d-flex align-items-center">
            { (node.children && node.children.length > 0) ? (
              <CButton color="light" size="sm" className="me-2" onClick={() => toggleExpand(key)}>{isExpanded(key) ? '▾' : '▸'}</CButton>
            ) : <span style={{ width: 34 }} /> }
            <div>
              <div><strong>{node.name || 'Menu'}</strong></div>
              {node.menu && node.menu.welcome ? <div className="text-muted small">{node.menu.welcome}</div> : null}
            </div>
          </div>
        </CTableDataCell>
        <CTableDataCell>
          { (node.name || node.fileName) ? (
            <CButton color="link" size="sm" className="p-0" onClick={() => handleOpenInNewTab(node)}>{node.name || node.fileName}</CButton>
          ) : (node.audio ? <a href={node.audio} target="_blank" rel="noreferrer">Play</a> : '-')}
        </CTableDataCell>
        <CTableDataCell style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(node.menu && node.menu.options && node.menu.options.map(o=>`${o.key}:${o.text}`).join(', ')) || node.generatedText || '-'}</CTableDataCell>
        <CTableDataCell>
          {isSwitching(id) && <CSpinner size="sm" className="me-2" />}
          {(() => {
            const isOn = ((node.ivrStatus || node.status || node.state || '').toString().toLowerCase() === 'on' || (node.ivrStatus || node.status || '').toString().toLowerCase() === 'active')
            return (
              <CFormSwitch checked={isOn} className="me-2" disabled={isSwitching(id)} onChange={(e) => handleSwitch(node, e.target.checked)} />
            )
          })()}
        </CTableDataCell>
        <CTableDataCell>
          <CButton color="secondary" size="sm" className="me-2" onClick={() => handleShowTree(node)}>View Tree</CButton>
          <CButton color="danger" size="sm" onClick={() => handleDelete(node)}>Delete</CButton>
        </CTableDataCell>
      </CTableRow>
    )

    // if expanded, render children
    if (isExpanded(key) && node.children && node.children.length > 0) {
      node.children.forEach((c, idx) => {
        // shape: { key, destination, child }
        if (c && c.child) {
          // render an option row describing the mapping then the child node
          rows.push(
            <CTableRow key={`opt-${key}-${idx}`} style={{ backgroundColor: getLevelBg(level + 1) }}>
                  <CTableDataCell colSpan={5}>
                    <div style={{ paddingLeft: `${(level+1) * 18}px` }} className="text-muted small">On press <strong>{c.key}</strong> → {c.destination}</div>
                  </CTableDataCell>
                </CTableRow>
          )
          rows.push(...renderTreeRows(c.child, level + 1, `${path}/${idx}`))
        } else {
          // direct child node
          rows.push(...renderTreeRows(c, level + 1, `${path}/${idx}`))
        }
      })
    }

    return rows
  }

  return (
    <div className="p-3">
      <CCard>
        <CCardBody>
          <CRow className="align-items-center mb-3">
            <CCol>
              <h3>IVR Management</h3>
              <p className="text-muted">Create and manage IVR flows and audio prompts.</p>
            </CCol>
            <CCol className="text-end">
            </CCol>
          </CRow>

          {showModal && (
            <CCard className="mb-4">
              <CCardBody>
                <CRow className="align-items-center mb-3">
                  <CCol>
                    <h4 className="mb-0">New IVR</h4>
                  </CCol>
                  <CCol className="text-end">
                    <CButton color="secondary" onClick={() => setShowModal(false)}>Back</CButton>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel>name</CFormLabel>
                  <CFormInput value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
                </div>
                <div className="mb-3">
                  <CFormLabel>description</CFormLabel>
                  <CFormInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="description" />
                </div>

                <div className="mb-3">
                  <CFormLabel>Build Menu (visual editor)</CFormLabel>
                  <NodeEditor path={[]} />
                  <CFormText className="text-muted">Use the visual editor to build a nested menu tree. Top-level node name will default to the IVR name if left empty.</CFormText>
                </div>

                <div className="text-end">
                  <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                  <CButton color="primary" onClick={handleCreate} className="ms-2">Create</CButton>
                </div>
              </CCardBody>
            </CCard>
          )}

          <div className="mt-4">
            <h5>IVR Settings</h5>
            {/* If loading, show spinner. If no IVRs show message. If one IVR, show settings UI. Otherwise show table list. */}
            {loading ? (
              <div className="py-3 text-center"><CSpinner /></div>
            ) : (displayedIvrs.length <= 1 ? (
              (() => {
                  const ivr = displayedIvrs[0]
                  const id = ivr && (ivr._id || ivr.id || ivr.name)
                  const isOn = !!(ivr && ((ivr.ivrStatus || ivr.status || ivr.state || '').toString().toLowerCase() === 'on' || (ivr.ivrStatus || ivr.status || '').toString().toLowerCase() === 'active'))
                  return (
                    <CCard>
                      <CCardBody>
                        <div className="mb-3">
                          <CFormLabel>Build Menu (visual editor)</CFormLabel>
                          <NodeEditor path={[]} />
                          <CFormText className="text-muted">Use the visual editor to build a nested menu tree.</CFormText>
                        </div>
                        {ivr && (
                          <div className="mb-3 d-flex align-items-center">
                            <strong className="me-2">Status:</strong>
                            {isSwitching(id) && <CSpinner size="sm" className="me-2" />}
                            <CFormSwitch checked={isOn} className="me-2" disabled={isSwitching(id)} onChange={(e) => handleSwitch(ivr, e.target.checked)} />
                          </div>
                        )}
                        <div className="text-end">
                          {ivr && <CButton color="secondary" size="sm" className="me-2" onClick={() => handleShowTree(ivr)}>View Tree</CButton>}
                          {ivr && <CButton color="danger" size="sm" className="me-2" onClick={() => handleDelete(ivr)}>Delete</CButton>}
                          <CButton color="primary" onClick={() => handleSave(ivr)}>{ivr ? 'Save' : 'Create'}</CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  )
                })()
            ) : (
              <div className="table-responsive">
                <CTable>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>File</CTableHeaderCell>
                      <CTableHeaderCell>Generated Text</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {displayedIvrs.reduce((acc, i, idx) => acc.concat(renderTreeRows(i, 0, String(idx))), [])}
                  </CTableBody>
                </CTable>
              </div>
            ))}
            {/* Audio player (visible when playing) */}
            {playingUrl && (
              <div className="mt-3">
                <h6>Now playing</h6>
                <audio ref={audioPlayerRef} controls style={{ width: '100%' }} />
              </div>
            )}

            <CModal visible={treeModalVisible} onClose={() => { setTreeModalVisible(false); setActiveTree(null) }}>
              <CModalHeader closeButton>
                <CModalTitle>IVR Tree</CModalTitle>
              </CModalHeader>
              <CModalBody>
                {treeLoading ? <div className="text-center py-3"><CSpinner /></div> : (
                  activeTree ? (
                    <div>
                      <TreeViewer node={activeTree} />
                    </div>
                  ) : (
                    <div className="text-muted">No tree data available.</div>
                  )
                )}
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" onClick={() => { setTreeModalVisible(false); setActiveTree(null) }}>Close</CButton>
              </CModalFooter>
            </CModal>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default IVRManagement
