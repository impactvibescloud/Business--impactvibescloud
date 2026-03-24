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
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
} from '@coreui/react'
import { apiCall } from '../../config/api'
import '../Branches/Branches.css'
import './CallDispositions.css'

const CallLogsLegacy = () => {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  const [expandedRows, setExpandedRows] = useState(new Set())
  const [openCallFlows, setOpenCallFlows] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [openMoreInfo, setOpenMoreInfo] = useState(new Set())

  // Filter inputs (UI only for now)
  const [fromNumber, setFromNumber] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [availableAgents, setAvailableAgents] = useState([])

  useEffect(() => {
    const tryPrefill = async () => {
      if (businessId) return
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u.businessId) {
          setBusinessId(u.businessId)
          try { localStorage.setItem('businessId', u.businessId) } catch (e) {}
        }
      } catch (e) {}
    }
    tryPrefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDateTime = (iso) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString() } catch (e) { return iso }
  }

  const formatDateTimeShort = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) { return iso }
  }

  const fetchRecords = async (p = 1) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) {
      setRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const qp = [`businessId=${encodeURIComponent(currentBusinessId)}`, `page=${p}`, `limit=${limit}`]
      if (startDateFilter) qp.push(`startDate=${encodeURIComponent(startDateFilter)}`)
      if (endDateFilter) qp.push(`endDate=${encodeURIComponent(endDateFilter)}`)
      if (fromNumber) qp.push(`from=${encodeURIComponent(fromNumber)}`)
      if (toNumber) qp.push(`to=${encodeURIComponent(toNumber)}`)
      if (agentFilter) qp.push(`agent=${encodeURIComponent(agentFilter)}`)
      const endpoint = `/call-logs?${qp.join('&')}`
      const res = await apiCall(endpoint, 'GET')
      if (res && res.success) {
        const callLogs = Array.isArray(res.data) ? res.data : []
        const normalized = callLogs.map((cl) => ({
          ...cl,
          callLog: {
            callDate: cl.callDate,
            contact: cl.contact,
            virtualNumber: cl.virtualNumber,
            duration: cl.callDuration ?? cl.duration ?? 0,
            status: cl.status,
          },
          agent: cl.agent || null,
          note: cl.notebyagent || cl.cdrImportNote || null,
          raw: cl,
        }))
        setRecords(normalized)
        if (res.pagination && res.pagination.page) try { setPage(res.pagination.page) } catch (e) {}
      } else {
        setRecords([])
      }
    } catch (e) {
      console.error('fetchRecords error', e)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecords(page) }, [page, businessId])

  const fetchAgents = async () => {
    try {
      let bid = businessId || localStorage.getItem('businessId') || ''
      if (!bid) {
        try { const ud = await apiCall('/v1/user/details','GET'); const u = ud?.user || ud?.data || ud; bid = u?.businessId || u?.businessid || '' } catch (e) {}
      }
      if (!bid) return
      let agents = []
      try {
        const br = await apiCall(`/branch/${encodeURIComponent(bid)}/branches`, 'GET')
        let list = []
        if (Array.isArray(br)) list = br
        else if (br?.data && Array.isArray(br.data)) list = br.data
        else if (Array.isArray(br.branches)) list = br.branches
        else if (br?.data?.data && Array.isArray(br.data.data)) list = br.data.data
        else list = []
        list.forEach((branch) => {
          const u = branch.user || branch.manager || branch.owner || null
          if (u && (u._id || u.id || u.email)) {
            const id = u._id || u.id || u.email
            const name = u.name || u.fullName || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || u.email || branch.branchName || `Agent ${id}`
            agents.push({ id, name })
          }
        })
        const seen = {}
        agents = agents.filter((a) => { if (!a.id) return false; if (seen[a.id]) return false; seen[a.id]=true; return true })
      } catch (e) { agents = [] }
      if (!agents || agents.length === 0) {
        try {
          const res = await apiCall(`/users?businessId=${encodeURIComponent(bid)}`)
          let data = []
          if (Array.isArray(res)) data = res
          else if (res?.data && Array.isArray(res.data)) data = res.data
          else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data
          else if (res && typeof res === 'object') data = [res]
          agents = (data || []).map((a, idx) => {
            const first = a.firstName || a.first_name || ''
            const last = a.lastName || a.last_name || ''
            const combined = (first || last) ? `${first} ${last}`.trim() : ''
            const name = a.name || a.fullName || combined || a.email || a.username || `Agent ${idx+1}`
            const id = a._id || a.id || a.email || `${idx}`
            return { id, name }
          })
        } catch (e) { agents = [] }
      }
      setAvailableAgents(agents)
    } catch (e) { setAvailableAgents([]) }
  }

  useEffect(() => { fetchAgents() }, [businessId])

  const toggleRow = (id) => {
    const s = new Set(expandedRows)
    if (s.has(id)) s.delete(id); else s.add(id)
    setExpandedRows(s)
  }

  const toggleCallFlow = (id) => {
    const s = new Set(openCallFlows)
    if (s.has(id)) s.delete(id); else s.add(id)
    setOpenCallFlows(s)
  }

  const toggleMoreInfo = (id) => {
    const s = new Set(openMoreInfo)
    if (s.has(id)) s.delete(id); else s.add(id)
    setOpenMoreInfo(s)
  }

  const openDetails = (item) => { setSelectedItem(item); setDetailsOpen(true) }
  const closeDetails = () => { setSelectedItem(null); setDetailsOpen(false) }

  const resetFilters = () => {
    setFromNumber(''); setToNumber(''); setAgentFilter(''); setStartDateFilter(''); setEndDateFilter(''); fetchRecords(1)
  }
  const applyFilters = () => { fetchRecords(1) }

  const filtered = records.filter((r) => {
    const q = (searchTerm || '').trim().toLowerCase()
    if (!q) return true
    return (r.agent?.email || r.agent?.name || '').toString().toLowerCase().includes(q) || (r.callLog?.contact || '').toString().toLowerCase().includes(q) || (r.note || '').toString().toLowerCase().includes(q)
  })

  return (
    <CCard className="mb-4">
      <CCardHeader style={{ borderBottom: '0' }}>
        <div className="filter-tiles">
          <div className="filter-tile">
            <label className="form-label">From</label>
            <input className="form-control form-control-sm" placeholder="From number" value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">To</label>
            <input className="form-control form-control-sm" placeholder="To number" value={toNumber} onChange={(e) => setToNumber(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">Agent / Branch</label>
            <CFormSelect className="form-control form-control-sm" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
              <option value="">All agents</option>
              {availableAgents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </CFormSelect>
          </div>
          <div className="filter-tile">
            <label className="form-label">From Date</label>
            <input type="date" className="form-control form-control-sm" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div className="filter-tile">
            <label className="form-label">To Date</label>
            <input type="date" className="form-control form-control-sm" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-sm btn-outline-secondary me-3" onClick={resetFilters} disabled={loading}>Reset</button>
          <button className="btn btn-sm btn-outline-primary" onClick={applyFilters} disabled={loading}>Search</button>
        </div>
      </CCardHeader>

      <CCardBody>
        {!businessId && (
          <div className="mb-3">
            <CAlert color="warning">Missing <code>businessId</code> in localStorage. Set it to view CDRs.</CAlert>
          </div>
        )}

        <CModal visible={detailsOpen} onClose={closeDetails} alignment="center">
          <CModalHeader>
            <CModalTitle>CDR Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {!selectedItem ? (<div>No item selected</div>) : (
              <div>
                <div className="mb-3"><strong>Agent:</strong> {selectedItem.agent?.email || selectedItem.agent?.name || '-'}</div>
                <div className="mb-2"><strong>Contact:</strong> {selectedItem.callLog?.contact || '-'}</div>
                <div className="mb-2"><strong>Virtual Number:</strong> {selectedItem.callLog?.virtualNumber || '-'}</div>
                <div className="mb-2"><strong>Call Date:</strong> {formatDateTime(selectedItem.callLog?.callDate)}</div>
                <div className="mb-2"><strong>Duration:</strong> {selectedItem.callLog?.duration ? `${selectedItem.callLog.duration}s` : '-'}</div>
                <hr />
                <div className="mb-2"><strong>Note:</strong> {selectedItem.note || '-'}</div>
                <div className="mb-2"><strong>Call Status:</strong> <CBadge color={selectedItem.callLog?.status === 'answered' ? 'success' : selectedItem.callLog?.status === 'missed' ? 'danger' : 'secondary'}>{selectedItem.callLog?.status || '-'}</CBadge></div>
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={closeDetails}>Close</CButton>
          </CModalFooter>
        </CModal>

        {loading ? (
          <div className="text-center py-4"><CSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-3">No call logs found</div>
        ) : (
          <CTable hover responsive className="table-sm compact-table cdr-table" style={{ tableLayout: 'auto', borderTop: '0' }}>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '50%' }}>TO</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '15%' }}>DATE</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '15%' }}>TIME</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '20%' }}>RESULTS</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.map((d) => {
                const callDate = d.callLog?.callDate || d.callDate
                const dt = callDate ? new Date(callDate) : null
                const dateOnly = dt ? dt.toLocaleDateString() : '-'
                const timeOnly = dt ? dt.toLocaleTimeString() : '-'
                const resultText = d.note || d.callLog?.status || d.status || '—'
                return (
                  <React.Fragment key={d._id}>
                    <CTableRow onClick={() => toggleRow(d._id)} style={{ cursor: 'pointer', backgroundColor: expandedRows.has(d._id) ? '#f8f9fa' : 'transparent' }} role="button" tabIndex={0} className="cdr-row">
                      <CTableDataCell className="align-middle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 600 }}>{d.callLog?.contact || d.contact || 'Unknown'}</div>
                            <div className="text-muted small"><span className="me-2">{d.callLog?.virtualNumber || d.virtualNumber || ''}</span></div>
                          </div>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="align-middle">{dateOnly}</CTableDataCell>
                      <CTableDataCell className="align-middle">{timeOnly}</CTableDataCell>
                      <CTableDataCell className="align-middle">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>{resultText}</div>
                          <div><CBadge color={d.callLog?.status === 'answered' ? 'success' : d.callLog?.status === 'missed' ? 'danger' : 'secondary'}>{d.callLog?.status || ''}</CBadge></div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                    {expandedRows.has(d._id) && (
                      <CTableRow>
                        <CTableDataCell colSpan={4} style={{ padding: '1rem', backgroundColor: '#fff' }}>
                          <div className="cdr-expanded">
                            <div className="cdr-meta d-flex align-items-center mb-3">
                              <div className="me-4"><div className="text-muted small">Call ID</div><div className="fw-bold">{d._id}</div></div>
                              <div className="me-4"><div className="text-muted small">Region</div><div>{d.region || '-'}</div></div>
                              <div className="me-4"><div className="text-muted small">Duration</div><div>{d.callLog?.duration ? `${d.callLog.duration}s` : '—'}</div></div>
                              <div style={{ marginLeft: 'auto' }}>
                                { (d.callRecording || d.callLog?.recordingUrl) ? (
                                  <div className="audio-player"><audio controls src={d.callLog?.recordingUrl || d.callRecording || ''} />
                                  <a className="ms-3" href={d.callLog?.recordingUrl || d.callRecording || '#'} download onClick={(e)=>{if(!(d.callLog?.recordingUrl||d.callRecording))e.preventDefault();}} title="Download recording">⬇️</a>
                                  </div>
                                ) : null }
                              </div>
                            </div>

                            <div className="cdr-actions mb-3">
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); toggleCallFlow(d._id)}} aria-pressed={openCallFlows.has(d._id)}>Call Flow</button>
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); openDetails(d)}}>View Note</button>
                              <button className="btn btn-sm btn-light me-2" onClick={(e)=>{e.stopPropagation(); toggleMoreInfo(d._id)}} aria-pressed={openMoreInfo.has(d._id)}>More Information</button>
                            </div>

                            {openCallFlows.has(d._id) && (
                            <div className="cdr-callflow">
                              <div className="flow-step">
                                <div className="flow-icon caller"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#13A37F"/><path d="M9 8c1.66 0 3 1.34 3 3 0 .35-.07.68-.18.98L12.9 13c1.17.7 2.2 1.73 2.9 2.9l1.02-.72c.3-.11.63-.18.98-.18 1.66 0 3 1.34 3 3V19c0-.55-.45-1-1-1h-1c-4.97 0-9-4.03-9-9V8z" fill="#fff"/></svg></div>
                                <div className="flow-meta"><div className="flow-title">{d.raw?.fromName || d.agent?.name || 'Caller'}</div><div className="flow-sub">{d.raw?.fromNumber || d.callLog?.contact || ''}</div><div className="flow-time">{formatDateTimeShort(d.raw?.fromAt || d.callLog?.callDate || d.callDate)}</div></div>
                              </div>

                              <div className="flow-connector"><span className="line"/><span className="arrow"/></div>

                              <div className="flow-step center-step">
                                <div className="flow-icon mid"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#12323B"/><path d="M8 11h8v2H8z" fill="#fff"/></svg></div>
                                <div className="flow-meta"><div className="flow-title">Dial-1</div><div className="flow-sub">{d.raw?.dial1Number || d.raw?.via || ''}</div><div className="flow-time">{formatDateTimeShort(d.raw?.dial1At || d.callLog?.callDate || d.callDate)}</div></div>
                              </div>

                              <div className="flow-connector"><span className="line"/><span className="arrow"/></div>

                              <div className="flow-step">
                                <div className="flow-icon last"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#13A37F"/><path d="M16.5 11c-.9 0-1.73.2-2.49.57-.21.11-.34.34-.34.58v3.08c0 .24.13.47.34.58C14.77 16.8 15.6 17 16.5 17c1.38 0 2.5-1.12 2.5-2.5S17.88 11 16.5 11z" fill="#fff"/></svg></div>
                                <div className="flow-meta"><div className="flow-title">Dial-2</div><div className="flow-sub">{d.callLog?.virtualNumber || d.virtualNumber || ''}</div><div className="flow-time">{formatDateTimeShort(d.raw?.toAt || d.callLog?.callDate || d.callDate)}</div></div>
                              </div>

                            </div>
                            )}

                            {openMoreInfo.has(d._id) && (
                              <div className="cdr-moreinfo mt-3">
                                <div className="row">
                                  <div className="col-md-4"><strong>Agent</strong><div>{d.agent?.email || d.agent?.name || '-'}</div></div>
                                  <div className="col-md-4"><strong>Initiated By</strong><div>{d.raw?.callInitiatedBy || d.callLog?.initiatedBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Received By</strong><div>{d.raw?.callReceivedBy || d.callLog?.receivedBy || '-'}</div></div>
                                </div>
                                <div className="row mt-2">
                                  <div className="col-md-4"><strong>Rejected By</strong><div>{d.raw?.callRejectedBy || d.callLog?.rejectedBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Hang Up By</strong><div>{d.raw?.hangUpBy || d.callLog?.hangUpBy || '-'}</div></div>
                                  <div className="col-md-4"><strong>Team</strong><div>{d.team || '-'}</div></div>
                                </div>
                                <div className="row mt-2">
                                  <div className="col-md-4"><strong>Cost</strong><div>{d.cost != null ? `$${Number(d.cost).toFixed(2)}` : '-'}</div></div>
                                  <div className="col-md-8"><strong>Notes</strong><div>{d.note || d.callLog?.note || '-'}</div></div>
                                </div>
                              </div>
                            )}

                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default CallLogsLegacy
