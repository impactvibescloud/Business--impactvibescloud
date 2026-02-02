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

  const NodeEditor = ({ path, nodeProp, onChange }) => {
    const resolvedNode = nodeProp || getNodeAtPath(tree, path)
    const setNode = (newNode) => {
      if (onChange) return onChange(newNode)
      return updateTreeNode(path, newNode)
    }
    // Local helper wrappers that operate on the `node` when in `nodeProp` mode,
    // or delegate to global functions when editing by path.
    const updateOptionLocal = (optIdx, newOpt) => {
      if (onChange) {
        const newOptions = (node.menu?.options || []).map((o, i) => (i === optIdx ? newOpt : o))
        setNode({ ...node, menu: { ...node.menu, options: newOptions } })
      } else {
        updateOptionAt(path, optIdx, newOpt)
      }
    }
    const addOptionLocal = () => {
      if (onChange) {
        const newOptions = [...(node.menu?.options || []), { key: '', text: '', destination: '', destinationType: 'menu' }]
        setNode({ ...node, menu: { ...node.menu, options: newOptions } })
      } else addOptionAt(path)
    }
    const removeOptionLocal = (optIdx) => {
      if (onChange) {
        const newOptions = (node.menu?.options || []).filter((_, i) => i !== optIdx)
        setNode({ ...node, menu: { ...node.menu, options: newOptions } })
      } else removeOptionAt(path, optIdx)
    }
    const addChildToOptionLocal = (optIdx) => {
      if (onChange) {
        const options = node.menu?.options || []
        const child = { name: '', menu: { welcome: '', options: [], repeat: '' }, children: [] }
        const newOptions = options.map((o, i) => i === optIdx ? { ...(o || {}), children: [...((o && o.children) || []), child] } : o)
        setNode({ ...node, menu: { ...node.menu, options: newOptions } })
      } else {
        const opt = (node.menu?.options || [])[optIdx]
        addChildForOption(path, opt && opt.key)
      }
    }
    const removeChildFromOptionLocal = (optIdx, childIdx) => {
      if (onChange) {
        const options = node.menu?.options || []
        const newOptions = options.map((o, i) => {
          if (i !== optIdx) return o
          const children = (o.children || []).filter((_, ci) => ci !== childIdx)
          return { ...o, children }
        })
        setNode({ ...node, menu: { ...node.menu, options: newOptions } })
      } else removeChildFromOption(path, optIdx, childIdx)
    }
    const node = resolvedNode
    const rawChildren = node.children || []
    return (
      <div className="border rounded p-2 mb-2">
        <div className="mb-2">
          <CFormLabel>name</CFormLabel>
          <CFormInput value={node.name || ''} onChange={(e) => setNode({ ...node, name: e.target.value })} placeholder="name (e.g. menu or SalesMenu)" />
        </div>
        <div className="mb-2">
          <CFormLabel>menu.welcome</CFormLabel>
          <CFormInput value={node.menu?.welcome || ''} onChange={(e) => setNode({ ...node, menu: { ...node.menu, welcome: e.target.value } })} />
        </div>
        <div className="mb-2">
          <CFormLabel>menu.options[]</CFormLabel>
          {(node.menu?.options || []).map((opt, idx) => (
            <div key={idx} className="mb-2">
                <div className="input-group mb-1">
                <CFormInput style={{ maxWidth: 80 }} value={opt.key || ''} placeholder="menu.options[].key" onChange={(e) => {
                  const newOpt = { ...opt, key: e.target.value }
                  updateOptionLocal(idx, newOpt)
                }} />
                <CFormInput value={opt.text || ''} placeholder="menu.options[].text" onChange={(e) => updateOptionLocal(idx, { ...opt, text: e.target.value })} />
                <select className="form-control" style={{ maxWidth: 180, marginRight: 6 }} value={opt.destinationType || 'menu'} onChange={(e) => updateOptionLocal(idx, { ...opt, destinationType: e.target.value, destination: '' })}>
                  <option value="menu">menu.options[].destination (menu)</option>
                  <option value="did">menu.options[].destination (did)</option>
                </select>
                { (opt.destinationType || 'menu') === 'did' ? (
                  <select className="form-control" style={{ maxWidth: 220 }} value={opt.destination || ''} onChange={(e) => updateOptionLocal(idx, { ...opt, destination: e.target.value })}>
                    <option value="">menu.options[].destination</option>
                    {loadingDids ? <option disabled>Loading...</option> : didOptions.map(d => (
                      <option key={d.id} value={d.id}>{d.number}</option>
                    ))}
                  </select>
                ) : (
                  <CFormInput value={opt.destination || ''} placeholder="menu.options[].destination" onChange={(e) => updateOptionLocal(idx, { ...opt, destination: e.target.value })} />
                )}
                <button type="button" className="btn btn-danger" onClick={() => removeOptionLocal(idx)}>Remove</button>
              </div>
              <div>
                {(opt.children || []).map((childNode, cIdx) => (
                  <div key={cIdx} className="ms-3 mb-2">
                    <div className="mb-1 text-end">
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeChildFromOptionLocal(idx, cIdx)}>Remove Child</button>
                    </div>
                    <NodeEditor nodeProp={childNode} onChange={(newNode) => updateChildInOption(path, idx, cIdx, newNode)} />
                  </div>
                ))}
                <div className="mt-1">
                  <CButton color="secondary" size="sm" onClick={() => addChildToOptionLocal(idx)}>Add Child Menu</CButton>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-2">
            <CButton color="secondary" size="sm" onClick={() => addOptionAt(path)}>Add Option</CButton>
          </div>
        </div>
        <div className="mb-2">
          <CFormLabel>menu.repeat</CFormLabel>
          <CFormInput value={node.menu?.repeat || ''} onChange={(e) => setNode({ ...node, menu: { ...node.menu, repeat: e.target.value } })} />
        </div>
        <div className="mb-2">
          <CFormText className="text-muted">children (unattached)</CFormText>
          {(rawChildren || []).map((ch, idx) => {
            // skip attached mapping children (those with key+child/children that match an option)
            if (ch && ch.key && (ch.child || ch.children) && (node.menu?.options || []).some(o => o.key === ch.key)) return null
            return (
              <div key={idx} className="ms-3">
                <NodeEditor path={[...path, idx]} />
                <div className="mb-2 text-end">
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeChildAt(path, idx)}>Remove Child</button>
                </div>
              </div>
            )
          })}
          <div>
            <CButton color="secondary" size="sm" onClick={() => addChildAt(path)}>Add Child Menu</CButton>
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

  const handleCreate = async () => {
    if (!name || !businessId) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please provide a name.' })
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
      <div style={indent} className="mb-2">
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
      <CTableRow key={`node-${key}`}>
        <CTableDataCell>
          <div style={indentStyle} className="d-flex align-items-center">
            { (node.children && node.children.length > 0) ? (
              <CButton color="light" size="sm" className="me-2" onClick={() => toggleExpand(key)}>{isExpanded(key) ? '▾' : '▸'}</CButton>
            ) : <span style={{ width: 34 }} /> }
            <div>
              <div><strong>{node.name || node.fileName || 'Menu'}</strong></div>
              {node.menu && node.menu.welcome ? <div className="text-muted small">{node.menu.welcome}</div> : null}
            </div>
          </div>
        </CTableDataCell>
        <CTableDataCell>{node.description || '-'}</CTableDataCell>
        <CTableDataCell>
          { (node.name || node.fileName) ? (
            <CButton color="link" size="sm" className="p-0" onClick={() => handleOpenInNewTab(node)}>{node.name || node.fileName}</CButton>
          ) : (node.audio ? <a href={node.audio} target="_blank" rel="noreferrer">Play</a> : '-')}
        </CTableDataCell>
        <CTableDataCell style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(node.menu && node.menu.options && node.menu.options.map(o=>`${o.key}:${o.text}`).join(', ')) || node.generatedText || '-'}</CTableDataCell>
        <CTableDataCell>{node.status || node.state || '-'}</CTableDataCell>
        <CTableDataCell>{node.createdAt ? new Date(node.createdAt).toLocaleString() : '-'}</CTableDataCell>
        <CTableDataCell>
          {isSwitching(id) && <CSpinner size="sm" className="me-2" />}
          {(() => {
            const isOn = ((node.ivrStatus || node.status || node.state || '').toString().toLowerCase() === 'on' || (node.ivrStatus || node.status || '').toString().toLowerCase() === 'active')
            return (
              <CFormSwitch checked={isOn} className="me-2" disabled={isSwitching(id)} onChange={(e) => handleSwitch(node, e.target.checked)} />
            )
          })()}
          { (node.name || node.fileName || node.audio) && (
            <CButton color="info" size="sm" className="me-2" onClick={() => handlePlay(node)}>
              {playingId === (node._id || node.id) ? 'Stop' : 'Play'}
            </CButton>
          )}
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
            <CTableRow key={`opt-${key}-${idx}`}>
              <CTableDataCell colSpan={7}>
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
              <CButton color="primary" onClick={() => setShowModal(true)}>New IVR</CButton>
            </CCol>
          </CRow>

          <CModal visible={showModal} onClose={() => setShowModal(false)}>
            <CModalHeader closeButton>
              <CModalTitle>New IVR</CModalTitle>
            </CModalHeader>
            <CModalBody>
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
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
              <CButton color="primary" onClick={handleCreate}>Create</CButton>
            </CModalFooter>
          </CModal>

          <div className="mt-4">
            <h5>IVR List</h5>
            {/* Showing only main/root menus */}
            {loading ? (
              <div className="py-3 text-center"><CSpinner /></div>
            ) : displayedIvrs.length === 0 ? (
              <p className="text-muted">No IVRs found for this business.</p>
            ) : (
              <div className="table-responsive">
                <CTable>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell>File</CTableHeaderCell>
                      <CTableHeaderCell>Generated Text</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                      <CTableHeaderCell>Created</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {displayedIvrs.reduce((acc, i, idx) => acc.concat(renderTreeRows(i, 0, String(idx))), [])}
                  </CTableBody>
                </CTable>
              </div>
            )}
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
