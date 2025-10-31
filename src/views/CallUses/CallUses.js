import React, { useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormInput,
  CFormSelect,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CBadge,
} from '@coreui/react'
import { apiCall } from '../../config/api'

const CallUses = () => {
  const [userId, setUserId] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [logsPage, setLogsPage] = useState(1)
  const [logsLimit, setLogsLimit] = useState(20)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [callType, setCallType] = useState('All')
  const [status, setStatus] = useState('All')
  const [availableAgents, setAvailableAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [callUses, setCallUses] = useState([])
  const [callUsesCount, setCallUsesCount] = useState(0)
  const [callLogs, setCallLogs] = useState([])
  const [callLogsCount, setCallLogsCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    // try to prefill businessId & userId from current user details when available
    const tryPrefill = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u._id) setUserId(u._id)
        if (u && u.businessId) setBusinessId(u.businessId)
      } catch (err) {
        // ignore prefill errors
      }
    }
    tryPrefill()
  }, [])

  // Fetch available agents for the business once we have businessId
  useEffect(() => {
    const fetchAgents = async () => {
      if (!businessId) return
      setAgentsLoading(true)
      try {
        // Branches endpoint returns branches with their manager/user info. Reuse same approach as Branches component.
        const res = await apiCall(`/branch/${businessId}/branches`, 'GET')
        let list = []
        // possible response shapes: res.data (array), res.branches, or raw array
        if (Array.isArray(res)) list = res
        else if (Array.isArray(res.data)) list = res.data
        else if (Array.isArray(res.branches)) list = res.branches
        else list = []

        // Extract agent info from branch.user where available
        const agents = []
        list.forEach((branch) => {
          const u = branch.user || branch.manager || null
          if (u && (u._id || u.id)) {
            agents.push({
              _id: u._id || u.id,
              name: u.name || u.fullName || u.email || branch.branchName || `Agent ${u._id || u.id}`,
              email: u.email || '',
            })
          }
        })
        // Deduplicate by _id
        const dedup = {}
        const uniqueAgents = agents.filter((a) => {
          if (!a._id) return false
          if (dedup[a._id]) return false
          dedup[a._id] = true
          return true
        })
        setAvailableAgents(uniqueAgents)
      } catch (err) {
        console.error('Failed to fetch agents for business', err)
        setAvailableAgents([])
      } finally {
        setAgentsLoading(false)
      }
    }
    fetchAgents()
  }, [businessId])

  const fetchData = async (opts = {}) => {
    setError(null)
    if (!userId) {
      setError('Please provide an agent User ID')
      return
    }
    // ensure we have businessId from current user details (do not ask the user for it)
    if (!businessId) {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const u = res.user || res.data || res
        if (u && u.businessId) setBusinessId(u.businessId)
        else {
          setError('Business ID not found for current user. Please ensure you are logged in.')
          return
        }
      } catch (err) {
        setError('Unable to determine business id from current user details')
        return
      }
    }
    setLoading(true)
    try {
      // Build query params with optional filters. Use opts to allow immediate page/limit overrides
      const page = typeof opts.page !== 'undefined' ? opts.page : logsPage
      const limit = typeof opts.limit !== 'undefined' ? opts.limit : logsLimit

      const params = []
      params.push(`businessId=${encodeURIComponent(businessId)}`)
      params.push(`logsPage=${encodeURIComponent(page)}`)
      params.push(`logsLimit=${encodeURIComponent(limit)}`)
      if (dateFrom) params.push(`from=${encodeURIComponent(dateFrom)}`)
      if (dateTo) params.push(`to=${encodeURIComponent(dateTo)}`)
      if (callType && callType !== 'All') {
        const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType
        // send common variants to increase compatibility with backend implementations
        params.push(`callType=${encodeURIComponent(mapped)}`)
        params.push(`type=${encodeURIComponent(mapped)}`)
        params.push(`call_type=${encodeURIComponent(mapped)}`)
      }
      if (status && status !== 'All') {
        const mappedStatus = status.toLowerCase()
        params.push(`status=${encodeURIComponent(mappedStatus)}`)
        params.push(`callStatus=${encodeURIComponent(mappedStatus)}`)
        params.push(`call_status=${encodeURIComponent(mappedStatus)}`)
      }

      const endpoint = `/call-uses/user/${encodeURIComponent(userId)}/with-logs?${params.join('&')}`
      const res = await apiCall(endpoint, 'GET')

      // Normalize response
      const returnedCallUses = res.callUses || []
      const returnedCallLogs = Array.isArray(res.callLogs) ? res.callLogs : []

      // Apply client-side fallback filtering in case the backend didn't apply filters.
      // This ensures Call Type / Status / Date filters work even when server ignores params.
      let filteredLogs = returnedCallLogs

      // Filter by call type (map UI values to backend values)
      if (callType && callType !== 'All') {
        const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType.toLowerCase()
        filteredLogs = filteredLogs.filter((l) => String(l.callType || '').toLowerCase() === mapped)
      }

      // Filter by status (compare lowercased values)
      if (status && status !== 'All') {
        const mappedStatus = String(status).toLowerCase()
        filteredLogs = filteredLogs.filter((l) => String(l.status || '').toLowerCase() === mappedStatus)
      }

      // Filter by date range (if provided). Compare using Date objects.
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        filteredLogs = filteredLogs.filter((l) => {
          const d = new Date(l.callDate || l.createdAt || l.contactedOn || null)
          return !isNaN(d) && d >= fromDate
        })
      }
      if (dateTo) {
        // include the entire day of dateTo
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        filteredLogs = filteredLogs.filter((l) => {
          const d = new Date(l.callDate || l.createdAt || l.contactedOn || null)
          return !isNaN(d) && d <= toDate
        })
      }

      setCallUses(returnedCallUses)
      setCallUsesCount(res.callUsesCount || returnedCallUses.length)
      setCallLogs(filteredLogs)
      setCallLogsCount(filteredLogs.length)

      // keep local state in sync with what we just requested
      setLogsPage(page)
      setLogsLimit(limit)
    } catch (err) {
      console.error('Failed to fetch call uses', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load data')
      setCallUses([])
      setCallLogs([])
    } finally {
      setLoading(false)
    }
  }

  const clearLoadedData = () => {
    setCallUses([])
    setCallLogs([])
    setCallUsesCount(0)
    setCallLogsCount(0)
    setError(null)
  }

  // handleLoadCurrentUser removed — UI no longer exposes a "Use current user" button.


  const handleApplyFilters = async () => {
    // reset to first page when applying new filters
    await fetchData({ page: 1 })
  }

  const handleClearFilters = async () => {
    setDateFrom('')
    setDateTo('')
    setCallType('All')
    setStatus('All')
    await fetchData({ page: 1, limit: 20 })
  }

  const handleExport = async () => {
    setError(null)
    if (!userId) {
      setError('Please select an agent before exporting')
      return
    }
    // if no data loaded, ask user to load first
    if ((!callUses || callUses.length === 0) && (!callLogs || callLogs.length === 0)) {
      // If nothing loaded yet, we'll fetch full data using the current filters before exporting
      // fall through to fetch below
    }
    setExporting(true)
    try {
      // Ensure we have businessId
      if (!businessId) {
        try {
          const r = await apiCall('/v1/user/details', 'GET')
          const uu = r.user || r.data || r
          if (uu && uu.businessId) setBusinessId(uu.businessId)
          else {
            setError('Business ID not found for current user. Please ensure you are logged in.')
            setExporting(false)
            return
          }
        } catch (e) {
          setError('Unable to determine business id from current user details')
          setExporting(false)
          return
        }
      }

      // helper to normalize response shapes from apiCall
      const normalizeRes = (r) => {
        const payload = r && r.data ? (r.data.data || r.data) : r || {}
        return {
          callLogs: payload.callLogs || payload.logs || payload.data?.callLogs || [],
          callLogsCount: payload.callLogsCount || payload.logsCount || payload.total || 0,
          logsLimit: payload.logsLimit || payload.logs_limit || payload.limit || 0,
          logsPage: payload.logsPage || payload.page || 1,
          callUses: payload.callUses || payload.uses || payload.data?.callUses || [],
          callUsesCount: payload.callUsesCount || payload.usesCount || 0,
        }
      }
      // We'll fetch pages iteratively below; no single-shot params are used here.

      // We'll iteratively fetch pages to gather all logs. Start at page 1 and keep fetching until
      // we've collected total (if provided) or the server returns less than a full page.
      const endpointBase = `/call-uses/user/${encodeURIComponent(userId)}/with-logs`

      // start with page 1
      let page = 1
      const requestedLimit = callLogsCount && callLogsCount > 0 ? callLogsCount : Math.max(logsLimit, 1000)
      const collectedLogs = []
      let exportCallUses = []
      let totalLogs = null
      let serverPerPage = requestedLimit
      // safety cap to avoid infinite loops
      const SAFE_MAX_PAGES = 500
      while (page <= SAFE_MAX_PAGES) {
        // build params for this page
        const pageParams = []
        pageParams.push(`businessId=${encodeURIComponent(businessId)}`)
        pageParams.push(`logsPage=${page}`)
        pageParams.push(`logsLimit=${requestedLimit}`)
        if (dateFrom) pageParams.push(`from=${encodeURIComponent(dateFrom)}`)
        if (dateTo) pageParams.push(`to=${encodeURIComponent(dateTo)}`)
        if (callType && callType !== 'All') {
          const mapped = callType === 'Outgoing' ? 'outbound' : callType === 'Incoming' ? 'inbound' : callType
          pageParams.push(`callType=${encodeURIComponent(mapped)}`)
          pageParams.push(`type=${encodeURIComponent(mapped)}`)
          pageParams.push(`call_type=${encodeURIComponent(mapped)}`)
        }
        if (status && status !== 'All') {
          const mappedStatus = status.toLowerCase()
          pageParams.push(`status=${encodeURIComponent(mappedStatus)}`)
          pageParams.push(`callStatus=${encodeURIComponent(mappedStatus)}`)
          pageParams.push(`call_status=${encodeURIComponent(mappedStatus)}`)
        }

        const url = `${endpointBase}?${pageParams.join('&')}`
        let pageRes
        try {
          pageRes = await apiCall(url, 'GET')
        } catch (err) {
          console.warn('Failed to fetch export page', page, err)
          break
        }
        const nr = normalizeRes(pageRes)
        // capture uses from first page if present
        if (page === 1) {
          exportCallUses = nr.callUses && nr.callUses.length ? nr.callUses : exportCallUses
          totalLogs = nr.callLogsCount || (Array.isArray(nr.callLogs) ? nr.callLogs.length : null) || totalLogs
          serverPerPage = nr.logsLimit && nr.logsLimit > 0 ? nr.logsLimit : serverPerPage
        }

        const pageLogs = Array.isArray(nr.callLogs) ? nr.callLogs : []
  if (pageLogs.length > 0) collectedLogs.push(...pageLogs)
  console.debug(`CallUses export - page ${page} returned ${pageLogs.length} logs`)

        // stop if we have all (when server supplied totalLogs) or server returned less than a full page
        if ((totalLogs && collectedLogs.length >= totalLogs) || (serverPerPage && pageLogs.length < serverPerPage)) {
          break
        }
        // if server didn't provide per-page info and returned empty page, stop
        if (!serverPerPage && pageLogs.length === 0) break

        page += 1
      }

  // Prefer collected logs; fall back to currently-loaded callLogs (if user previously loaded them in UI)
  let exportCallLogs = (collectedLogs && collectedLogs.length) ? collectedLogs : (callLogs && callLogs.length ? callLogs : [])

  console.debug('CallUses export - final counts -> summary:', (exportCallUses && exportCallUses.length) || 0, 'logs:', exportCallLogs.length, 'collected:', collectedLogs.length, 'expectedTotal:', totalLogs)
      // debug info to help diagnose missing logs in export
      try {
        console.debug('CallUses export - collectedLogs:', collectedLogs.length, 'expectedTotal:', totalLogs, 'perPage:', serverPerPage)
      } catch (e) {
        // ignore
      }

      // dynamic import xlsx and file-saver
      let xlsxModule = null
      try {
        xlsxModule = await import('xlsx')
      } catch (e) {
        console.error('xlsx import failed', e)
        setError('Export failed: xlsx library is not available. Please install "xlsx" dependency.')
        setExporting(false)
        return
      }
      const XLSX = xlsxModule && (xlsxModule.default || xlsxModule)
      let saveModule = null
      try {
        saveModule = await import('file-saver')
      } catch (e) {
        console.error('file-saver import failed', e)
        setError('Export failed: file-saver library is not available. Please install "file-saver" dependency.')
        setExporting(false)
        return
      }
      const saveAs = saveModule.saveAs || saveModule.default || (saveModule && saveModule)

      // Prepare summary sheet
      const summary = (exportCallUses || []).map((cu) => ({
        number: cu.numberId?.number || cu.number || '',
        outboundCalls: cu.outboundCalls ?? '',
        inboundCalls: cu.inboundCalls ?? '',
        missedCalls: cu.missedCalls ?? '',
        hangCalls: cu.hangCalls ?? '',
        createdAt: cu.createdAt || cu.created_at || '',
        updatedAt: cu.updatedAt || cu.updated_at || '',
      }))

      // Prepare logs sheet
      const logs = (exportCallLogs || []).map((l) => ({
        id: l._id || l.id || '',
        date: l.callDate || l.contactedOn || l.createdAt || '',
        contact: l.contact || l.callReceivedBy || '',
        virtualNumber: l.virtualNumber || l.number || (l.numberId && l.numberId.number) || '',
        duration: l.callDuration ?? l.duration ?? '',
        type: l.callType || '',
        status: l.status || '',
        notes: l.notes || '',
        cost: l.cost ?? '',
      }))

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(summary)
      const ws2 = XLSX.utils.json_to_sheet(logs)
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
      XLSX.utils.book_append_sheet(wb, ws2, 'Logs')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
      const filename = `calluses_${userId}_${new Date().toISOString().slice(0,10)}.xlsx`
      saveAs(blob, filename)
    } catch (err) {
      console.error('Export failed', err)
      setError('Export failed. See console for details.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Call Uses</h1>
      </div>

      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={6} className="mb-2">
              <label className="form-label">Agent</label>
              <CFormSelect
                value={userId}
                onChange={(e) => {
                  const val = e.target.value
                  setUserId(val)
                  // Clear previously loaded data so old data doesn't conflict with the newly selected agent
                  clearLoadedData()
                  setLogsPage(1)
                }}
              >
                <option value="">-- Select agent --</option>
                {agentsLoading ? (
                  <option value="">Loading agents...</option>
                ) : (
                  availableAgents.map((ag) => (
                    <option key={ag._id} value={ag._id}>{ag.name || ag.email || ag._id}</option>
                  ))
                )}
              </CFormSelect>
            </CCol>
            <CCol md={6} className="d-flex align-items-end gap-2 justify-content-end">
              <CButton color="primary" onClick={fetchData} disabled={loading || !userId}>
                {loading ? <><CSpinner size="sm" />&nbsp;Loading</> : 'Load'}
              </CButton>
            </CCol>
          </CRow>

          {error && <div className="text-danger mb-3">{error}</div>}

          {/* Summary */}
          <CRow className="mb-3">
            <CCol>
              <h5>Summary</h5>
              {loading ? (
                <CSpinner />
              ) : callUses.length === 0 ? (
                <div className="text-muted">No call uses found for the selected agent.</div>
              ) : (
                callUses.map((cu) => (
                  <CCard className="mb-2" key={cu._id}>
                    <CCardBody>
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>Number:</strong> {cu.numberId?.number || '—'}<br />
                          <strong>Outbound:</strong> {cu.outboundCalls} &nbsp; <strong>Inbound:</strong> {cu.inboundCalls}
                        </div>
                        <div className="text-end text-muted">
                          <div>Created: {new Date(cu.createdAt).toLocaleString()}</div>
                          <div>Updated: {new Date(cu.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                ))
              )}
            </CCol>
          </CRow>

          {/* Logs controls */}
          <CRow className="align-items-center mb-2">
            <CCol md={2} className="mb-2">
              <label className="form-label">Logs page</label>
              <CFormSelect value={logsPage} onChange={(e) => setLogsPage(Number(e.target.value))}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} className="mb-2">
              <label className="form-label">Logs limit</label>
              <CFormSelect value={logsLimit} onChange={(e) => setLogsLimit(Number(e.target.value))}>
                {[10, 20, 50, 100].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} className="mb-2">
              <label className="form-label">From</label>
              <CFormInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </CCol>
            <CCol md={2} className="mb-2">
              <label className="form-label">To</label>
              <CFormInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </CCol>
            <CCol md={2} className="mb-2">
              <label className="form-label">Call Type</label>
              <CFormSelect value={callType} onChange={(e) => setCallType(e.target.value)}>
                {['All', 'Incoming', 'Outgoing'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} className="mb-2">
              <label className="form-label">Status</label>
              <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                {['All', 'Completed', 'Failed'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="align-items-center mb-2">
            <CCol md={6} className="mb-2 d-flex gap-2">
              <CButton color="primary" onClick={handleApplyFilters} disabled={loading}>
                {loading ? (<><CSpinner size="sm" />&nbsp;Loading</>) : 'Apply Filters'}
              </CButton>
              <CButton color="secondary" onClick={handleClearFilters} disabled={loading}>
                Clear Filters
              </CButton>
              <CButton color="info" onClick={fetchData} disabled={loading || !userId}>
                Refresh Logs
              </CButton>
              <CButton color="success" onClick={handleExport} disabled={exporting || !userId}>
                {exporting ? (<><CSpinner size="sm" />&nbsp;Exporting</>) : 'Export Excel'}
              </CButton>
            </CCol>
            <CCol md={6} className="mb-2">
              <div className="text-end text-muted">Total logs: <strong>{callLogsCount}</strong></div>
            </CCol>
          </CRow>

          {/* Logs table */}
          <CRow>
            <CCol>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Contact</CTableHeaderCell>
                    <CTableHeaderCell>Virtual Number</CTableHeaderCell>
                    <CTableHeaderCell>Duration (s)</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Notes</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        <CSpinner />
                      </CTableDataCell>
                    </CTableRow>
                  ) : callLogs.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">No call logs</CTableDataCell>
                    </CTableRow>
                  ) : (
                    callLogs.map((log) => (
                      <CTableRow key={log._id}>
                        <CTableDataCell>{new Date(log.callDate || log.createdAt).toLocaleString()}</CTableDataCell>
                        <CTableDataCell>{log.contact || log.callReceivedBy || '—'}</CTableDataCell>
                        <CTableDataCell>{log.virtualNumber || log.number || (log.numberId && log.numberId.number) || '—'}</CTableDataCell>
                        <CTableDataCell>{log.callDuration ?? log.duration ?? '—'}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={log.callType === 'outbound' ? 'primary' : 'success'}>{log.callType}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{log.status}</CTableDataCell>
                        <CTableDataCell>{log.notes || '—'}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default CallUses
