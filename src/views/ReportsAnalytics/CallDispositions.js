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
  CTooltip,
  CBadge,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from '@coreui/react'
import axios from 'axios'
import { apiCall } from '../../config/api'

const CallDispositions = () => {
  const [dispositions, setDispositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [availableLevels, setAvailableLevels] = useState({ level1: false, level2: false, level3: false })
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Try to prefill businessId from current user details when available (same approach as CallUses)
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
      } catch (err) {
        // ignore prefill errors
      }
    }
    tryPrefill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helpers for optional date filters (do not apply by default)
  const formatDateISO = (d) => d.toISOString().split('T')[0]

  const fetchDispositions = async (p = 1) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) {
      console.warn('CallDispositions: missing businessId — attempting to prefill from user details or skip')
      setDispositions([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // Build query params dynamically — include date filters only when set
      const params = [`page=${p}`, `limit=${limit}`, `includeDispositions=true`]
      if (startDateFilter) params.push(`startDate=${encodeURIComponent(startDateFilter)}`)
      if (endDateFilter) params.push(`endDate=${encodeURIComponent(endDateFilter)}`)
      const endpoint = `/call-logs/business/${currentBusinessId}?${params.join('&')}`
      // Debug: log endpoint and token presence to help diagnose "api not calling"
      try {
        console.debug('CallDispositions -> Request', {
          endpoint,
          businessId: currentBusinessId,
          startDateFilter,
          endDateFilter,
          hasAuth: !!localStorage.getItem('authToken'),
          axiosBaseURL: axios.defaults.baseURL,
          fullUrlPreview: `${axios.defaults.baseURL || ''}${endpoint}`,
        })
      } catch (e) {
        // swallow
      }
      const res = await apiCall(endpoint, 'GET')
      if (res && res.success) {
        // New response: array of call logs with nested dispositions object containing level1/2/3 arrays
        let items = []
        const callLogs = res.data || []
        
        if (Array.isArray(callLogs)) {
          // For each call log, extract the deepest disposition level available
          callLogs.forEach((callLog) => {
            if (!callLog) return
            
            // Try to get the deepest disposition from nested dispositions object
            let dispositionData = null
            
            if (callLog.dispositions) {
              // Priority: level3 > level2 > level1 (use the most detailed)
              if (Array.isArray(callLog.dispositions.level3) && callLog.dispositions.level3.length > 0) {
                dispositionData = callLog.dispositions.level3[0]
              } else if (Array.isArray(callLog.dispositions.level2) && callLog.dispositions.level2.length > 0) {
                dispositionData = callLog.dispositions.level2[0]
              } else if (Array.isArray(callLog.dispositions.level1) && callLog.dispositions.level1.length > 0) {
                dispositionData = callLog.dispositions.level1[0]
              }
            }
            
            // If no disposition arrays, check dispositionSnapshot
            if (!dispositionData && callLog.dispositionSnapshot) {
              dispositionData = {
                level1: callLog.dispositionSnapshot.level1,
                level2: callLog.dispositionSnapshot.level2,
                level3: callLog.dispositionSnapshot.level3,
              }
            }
            
            // Merge call log data with disposition data
            items.push({
              ...callLog,
              ...dispositionData,
              callLog: {
                callDate: callLog.callDate,
                contact: callLog.contact,
                virtualNumber: callLog.virtualNumber,
                duration: callLog.duration,
                status: callLog.status,
              },
              agent: callLog.agent || (dispositionData && dispositionData.agent),
              code: dispositionData?.code || null,
              note: dispositionData?.note || callLog.notes || null,
              raw: callLog,
            })
          })
        }

        const merged = items

        // Determine which levels are available for this business
        const levelsPresent = { level1: false, level2: false, level3: false }
        merged.forEach((it) => {
          if (it.level1) levelsPresent.level1 = true
          if (it.level2) levelsPresent.level2 = true
          if (it.level3) levelsPresent.level3 = true
        })

        // Items are already normalized in the merge step above
        const normalized = merged

        setAvailableLevels(levelsPresent)
        setDispositions(normalized)
        
        // If server returned pagination, sync current page (optional)
        if (res.pagination && res.pagination.page) {
          try {
            setPage(res.pagination.page)
          } catch (e) {}
        }
      } else {
        setDispositions([])
      }
    } catch (error) {
      console.error('Failed to fetch dispositions', error)
      setDispositions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispositions(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const formatDateTime = (iso) => {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleString()
    } catch (e) {
      return iso
    }
  }

  const formatDateTimeShort = (iso) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return iso
    }
  }

  const openDetails = (item) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedItem(null)
  }

  const toggleRow = (itemId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <CCard className="mb-4">
      <style>{`
        /* Compact table tweaks scoped to this component */
        .compact-table th, .compact-table td {
          padding: 0.25rem 0.4rem !important;
          vertical-align: middle !important;
          line-height: 1.15 !important;
        }
        .compact-table td { overflow: hidden; text-overflow: ellipsis; }
        .compact-table .note-col { white-space: normal !important; }
        .compact-table .nowrap { white-space: nowrap !important; }
      `}</style>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Call Dispositions</span>
        <div>
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => fetchDispositions(1)}
            disabled={loading}
          >
            Refresh
          </button>
          <input
            type="date"
            className="form-control form-control-sm d-inline-block me-2"
            style={{ width: 150 }}
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            placeholder="Start date"
          />
          <input
            type="date"
            className="form-control form-control-sm d-inline-block me-2"
            style={{ width: 150 }}
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            placeholder="End date"
          />
          <button
            className="btn btn-sm btn-outline-success me-2"
            onClick={() => fetchDispositions(1)}
            disabled={loading}
          >
            Apply
          </button>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={() => {
              setStartDateFilter('')
              setEndDateFilter('')
              fetchDispositions(1)
            }}
            disabled={loading}
          >
            Clear
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              className="btn btn-sm btn-outline-warning me-2"
              onClick={() => {
                // Seed a sample businessId (for dev only) and trigger fetch
                try {
                  localStorage.setItem('businessId', '68d3c1bbcf0bcde3eac2606b')
                } catch (e) {}
                fetchDispositions(1)
              }}
            >
              Force Fetch (dev)
            </button>
          )}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Prev
          </button>
          <span className="mx-2">Page {page}</span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            Next
          </button>
        </div>
      </CCardHeader>
      <CCardBody>
        {!businessId && (
          <div className="mb-3">
            <CAlert color="warning">Missing <code>businessId</code> in localStorage. Set it to view dispositions.</CAlert>
          </div>
        )}
        {/* Details modal for clicked disposition */}
        <CModal visible={detailsOpen} onClose={closeDetails} alignment="center">
          <CModalHeader>
            <CModalTitle>Disposition Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {!selectedItem ? (
              <div>No item selected</div>
            ) : (
              <div>
                <div className="mb-3">
                  <strong>Agent:</strong> {selectedItem.agent?.email?.split('@')[0] || selectedItem.agent?._id || '-'}
                  {selectedItem.agent?.email && <div className="text-muted small">{selectedItem.agent.email}</div>}
                </div>
                <div className="mb-2"><strong>Contact:</strong> {selectedItem.callLog?.contact || selectedItem.contact || '-'}</div>
                <div className="mb-2"><strong>Virtual Number:</strong> {selectedItem.callLog?.virtualNumber || selectedItem.virtualNumber || '-'}</div>
                <div className="mb-2"><strong>Call Date:</strong> {formatDateTime(selectedItem.callLog?.callDate || selectedItem.callDate)}</div>
                <div className="mb-2"><strong>Duration:</strong> {selectedItem.callLog?.duration || selectedItem.duration ? `${selectedItem.callLog?.duration || selectedItem.duration}s` : '-'}</div>
                <div className="mb-2"><strong>Call Type:</strong> {selectedItem.callType || '-'}</div>
                <hr />
                <h6>Disposition Path</h6>
                <div className="mb-2">
                  {availableLevels.level1 && (
                    <div className="mb-1">
                      <CBadge color="primary" className="me-1">Level 1</CBadge>
                      <span>{selectedItem.level1 || '-'}</span>
                    </div>
                  )}
                  {availableLevels.level2 && (
                    <div className="mb-1">
                      <CBadge color="info" className="me-1">Level 2</CBadge>
                      <span>{selectedItem.level2 || '-'}</span>
                    </div>
                  )}
                  {availableLevels.level3 && (
                    <div className="mb-1">
                      <CBadge color="secondary" className="me-1">Level 3</CBadge>
                      <span>{selectedItem.level3 || '-'}</span>
                    </div>
                  )}
                </div>
                <hr />
                <div className="mb-2"><strong>Code:</strong> {selectedItem.code || '-'}</div>
                <div className="mb-2"><strong>Note:</strong> {selectedItem.note || '-'}</div>
                <div className="mb-2">
                  <strong>Call Status:</strong>{' '}
                  <CBadge color={
                    selectedItem.callLog?.status === 'closed' || selectedItem.status === 'closed' ? 'success' :
                    selectedItem.callLog?.status === 'completed' || selectedItem.status === 'completed' ? 'info' :
                    selectedItem.callLog?.status === 'failed' || selectedItem.status === 'failed' ? 'danger' : 'secondary'
                  }>
                    {selectedItem.callLog?.status || selectedItem.status || '-'}
                  </CBadge>
                </div>
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={closeDetails}>Close</CButton>
          </CModalFooter>
        </CModal>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner />
          </div>
        ) : dispositions.length === 0 ? (
          <div className="text-center py-3">No call logs found</div>
        ) : (
          <CTable hover responsive className="table-sm compact-table" style={{ tableLayout: 'auto' }}>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: '3%' }}></CTableHeaderCell>
                <CTableHeaderCell style={{ width: '15%' }}>Agent</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>Contact</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '12%' }}>Virtual Number</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '8%' }}>Duration</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '15%' }}>Call Date</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '10%' }}>Call Type</CTableHeaderCell>
                <CTableHeaderCell className="text-center" style={{ width: '10%' }}>Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {dispositions.map((d) => (
                <React.Fragment key={d._id}>
                  <CTableRow 
                    onClick={() => toggleRow(d._id)} 
                    style={{ cursor: 'pointer', backgroundColor: expandedRows.has(d._id) ? '#f8f9fa' : 'transparent' }} 
                    role="button" 
                    tabIndex={0}
                  >
                    <CTableDataCell className="align-middle text-center">
                      <span style={{ fontSize: '1.2rem' }}>{expandedRows.has(d._id) ? '▼' : '▶'}</span>
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <span title={d.agent?.email || d.agent?._id || '-'}>{d.agent?.email?.split('@')[0] || d.agent?._id || '-'}</span>
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">{d.callLog?.contact || d.contact || '-'}</CTableDataCell>
                    <CTableDataCell className="align-middle">{d.callLog?.virtualNumber || d.virtualNumber || '-'}</CTableDataCell>
                    <CTableDataCell className="align-middle">{d.callLog?.duration || d.duration ? `${d.callLog?.duration || d.duration}s` : '-'}</CTableDataCell>
                    <CTableDataCell className="align-middle nowrap">{formatDateTimeShort(d.callLog?.callDate || d.callDate)}</CTableDataCell>
                    <CTableDataCell className="align-middle">{d.callType || '-'}</CTableDataCell>
                    <CTableDataCell className="text-center align-middle">
                      <CBadge color={
                        d.callLog?.status === 'closed' || d.status === 'closed' ? 'success' : 
                        d.callLog?.status === 'completed' || d.status === 'completed' ? 'info' : 
                        d.callLog?.status === 'failed' || d.status === 'failed' ? 'danger' : 'secondary'
                      }>
                        {d.callLog?.status || d.status || '-'}
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                  {expandedRows.has(d._id) && (
                    <CTableRow>
                      <CTableDataCell colSpan={8} style={{ padding: '1rem', backgroundColor: '#f8f9fa' }}>
                        <div className="disposition-details">
                          <h6 className="mb-3">Disposition Details</h6>
                          {(!d.level1 && !d.level2 && !d.level3 && (!d.raw?.dispositions || (d.raw.dispositions.level1?.length === 0 && d.raw.dispositions.level2?.length === 0 && d.raw.dispositions.level3?.length === 0))) ? (
                            <div className="alert alert-warning mb-0">No disposition set for this call</div>
                          ) : (
                            <div>
                              {/* Show Level 1 dispositions */}
                              {(d.level1 || (d.raw?.dispositions?.level1 && d.raw.dispositions.level1.length > 0)) && (
                                <div className="mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <CBadge color="primary" className="me-2">Level 1</CBadge>
                                    <strong>{d.level1 || d.raw?.dispositions?.level1[0]?.level1 || '-'}</strong>
                                  </div>
                                  {d.raw?.dispositions?.level1?.map((l1, idx) => (
                                    <div key={idx} className="ms-4 mb-2 p-2" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                      <div><strong>Agent:</strong> {l1.agent?.name || l1.agent?.email?.split('@')[0] || '-'}</div>
                                      {l1.code && <div><strong>Code:</strong> {l1.code}</div>}
                                      {l1.note && <div><strong>Note:</strong> {l1.note}</div>}
                                      <div className="text-muted small">Created: {formatDateTimeShort(l1.createdAt)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Show Level 2 dispositions */}
                              {(d.level2 || (d.raw?.dispositions?.level2 && d.raw.dispositions.level2.length > 0)) && (
                                <div className="mb-3 ms-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <CBadge color="info" className="me-2">Level 2</CBadge>
                                    <strong>{d.level2 || d.raw?.dispositions?.level2[0]?.level2 || '-'}</strong>
                                  </div>
                                  {d.raw?.dispositions?.level2?.map((l2, idx) => (
                                    <div key={idx} className="ms-4 mb-2 p-2" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                      <div><strong>Agent:</strong> {l2.agent?.name || l2.agent?.email?.split('@')[0] || '-'}</div>
                                      {l2.code && <div><strong>Code:</strong> {l2.code}</div>}
                                      {l2.note && <div><strong>Note:</strong> {l2.note}</div>}
                                      <div className="text-muted small">Created: {formatDateTimeShort(l2.createdAt)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Show Level 3 dispositions */}
                              {(d.level3 || (d.raw?.dispositions?.level3 && d.raw.dispositions.level3.length > 0)) && (
                                <div className="mb-3 ms-4">
                                  <div className="d-flex align-items-center mb-2">
                                    <CBadge color="secondary" className="me-2">Level 3</CBadge>
                                    <strong>{d.level3 || d.raw?.dispositions?.level3[0]?.level3 || '-'}</strong>
                                  </div>
                                  {d.raw?.dispositions?.level3?.map((l3, idx) => (
                                    <div key={idx} className="ms-4 mb-2 p-2" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                      <div><strong>Agent:</strong> {l3.agent?.name || l3.agent?.email?.split('@')[0] || '-'}</div>
                                      {l3.code && <div><strong>Code:</strong> {l3.code}</div>}
                                      {l3.note && <div><strong>Note:</strong> {l3.note}</div>}
                                      {l3.meta && <div><strong>Meta:</strong> {JSON.stringify(l3.meta)}</div>}
                                      <div className="text-muted small">Created: {formatDateTimeShort(l3.createdAt)} | Updated: {formatDateTimeShort(l3.updatedAt)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
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

export default CallDispositions
