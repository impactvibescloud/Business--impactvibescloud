import React, { useState, useRef, useEffect } from 'react'
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
  CFormSelect,
  CSpinner,
  CFormText,
  CProgress
} from '@coreui/react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { apiCall, getBaseURL } from '../../config/api'

const AudioCampaign = () => {
  const [name, setName] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [didNumber, setDidNumber] = useState('')
  const [didOptions, setDidOptions] = useState([])
  const [loadingDids, setLoadingDids] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [numbersFile, setNumbersFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)
  const audioRef = useRef(null)
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)

  useEffect(() => {
    // try to get businessId from user details
    const fetchUser = async () => {
      try {
        const res = await apiCall('/v1/user/details', 'GET')
        const user = res.user || res.data || res
        if (user && user.businessId) setBusinessId(user.businessId)
      } catch (err) {
        console.warn('Could not fetch user details for businessId')
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Once businessId is available, fetch DID numbers assigned to the business
    const fetchDids = async () => {
      if (!businessId) return
      setLoadingDids(true)
      try {
        const resp = await apiCall(`/numbers/assigned-to/${businessId}`, 'GET')
        // resp may be { data: [...]} or array
        const list = resp.data || resp.numbers || resp || []
        const options = (Array.isArray(list) ? list : []).map(d => ({ id: d._id || d.id, number: d.number || d }))
        setDidOptions(options)
        // Auto-select first DID if none selected
        if (!didNumber && options.length > 0) setDidNumber(options[0].number)
      } catch (err) {
        console.error('Failed to fetch DID numbers', err)
      } finally {
        setLoadingDids(false)
      }
    }
    fetchDids()
  }, [businessId])

  useEffect(() => {
    // fetch campaigns when businessId becomes available
    if (!businessId) return
    fetchCampaigns()
  }, [businessId])

  const fetchCampaigns = async () => {
    if (!businessId) return
    setLoadingCampaigns(true)
    try {
      // use query param as in your curl example
      const res = await apiCall(`/campaigns?businessId=${businessId}`, 'GET')
      // Normalize response shapes:
      // - axios style: res.data = { success: true, data: [...] }
      // - direct API: { success: true, data: [...] }
      // - legacy: array
      let payload = res
      if (res && res.data && res.data.data !== undefined) {
        // axios wrapper
        payload = res.data
      } else if (res && res.success && res.data !== undefined) {
        payload = res
      }
      const list = payload.data || payload.campaigns || payload.results || payload || []
      setCampaigns(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch campaigns', err)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const handleDelete = async (campaign) => {
    const id = campaign._id || campaign.id
    if (!id) {
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: 'Invalid campaign id' })
      return
    }

    const result = await Swal.fire({
      title: 'Delete campaign?',
      text: `Are you sure you want to delete "${campaign.name || campaign.title || 'this campaign'}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await apiCall(`/campaigns/${id}`, 'DELETE')
      Swal.fire({ icon: 'success', title: 'Deleted', text: 'Campaign deleted successfully' })
      // refresh list
      await fetchCampaigns()
    } catch (err) {
      console.error('Delete failed', err)
      const msg = err?.response?.data?.message || err.message || 'Delete failed'
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: msg })
    }
  }

  const token = localStorage.getItem('authToken')

  const handleSubmit = async () => {
    if (!name || !businessId || !didNumber || !scheduledAt) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill name, business, DID and schedule.' })
      return
    }
    if (!numbersFile) {
      Swal.fire({ icon: 'warning', title: 'Missing file', text: 'Please upload contacts CSV/XLSX file.' })
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('businessId', businessId)
    formData.append('didNumber', didNumber)
    // Convert scheduledAt (from datetime-local) to an ISO timestamp the API accepts
    // If scheduledAt already includes timezone, Date will preserve it; otherwise it will be treated as local time.
    const scheduledToSend = scheduledAt ? new Date(scheduledAt).toISOString() : ''
    formData.append('scheduledAt', scheduledToSend)
    formData.append('file', numbersFile)
    if (audioFile) formData.append('audio', audioFile)

    setUploading(true)
    setProgress(0)

    try {
      const url = `${getBaseURL()}/api/campaigns/upload`
      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total))
        }
      })

        console.log('campaign upload response', res.data)
        Swal.fire({ icon: 'success', title: 'Campaign Created', text: res.data?.message || 'Campaign uploaded successfully' })
        // reset
        setName('')
        setDidNumber('')
        setScheduledAt('')
        setNumbersFile(null)
        setAudioFile(null)
        if (fileRef.current) fileRef.current.value = ''
        if (audioRef.current) audioRef.current.value = ''
        // refresh campaigns list
        try {
          await fetchCampaigns()
        } catch (e) {
          // ignore fetch errors here
        }
        return true
      } catch (err) {
        console.error('Upload failed', err)
        const msg = err?.response?.data?.message || err.message || 'Upload failed'
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: msg })
        return false
      } finally {
        setUploading(false)
        setProgress(0)
      }
  }

  return (
    <div className="p-3">
      <CCard>
        <CCardBody>
          <CRow className="align-items-center mb-3">
            <CCol>
              <h3>Audio Campaigns</h3>
              <p className="text-muted">Create and manage your audio campaigns here.</p>
            </CCol>
            <CCol className="text-end">
              <CButton color="primary" onClick={() => setShowNewCampaign(true)}>New Campaign</CButton>
            </CCol>
          </CRow>

          {/* New Campaign Modal (form moved inside modal) */}
          <CModal visible={showNewCampaign} onClose={() => setShowNewCampaign(false)} backdrop="static">
            <CModalHeader closeButton>
              <CModalTitle>New Audio Campaign</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <div className="mb-3">
                <CFormLabel htmlFor="campaignName">Campaign Name</CFormLabel>
                <CFormInput id="campaignName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter audio campaign name" />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="didNumber">DID Number</CFormLabel>
                <CFormSelect id="didNumber" value={didNumber} onChange={(e) => setDidNumber(e.target.value)} aria-label="Select DID Number">
                  <option value="">Select DID Number</option>
                  {loadingDids ? (
                    <option disabled>Loading...</option>
                  ) : (
                    didOptions.map(d => (
                      <option key={d.id} value={d.number}>{d.number}</option>
                    ))
                  )}
                </CFormSelect>
                <CFormText className="text-muted">Destination DID number for outbound calls.</CFormText>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="scheduledAt">Schedule (UTC)</CFormLabel>
                <CFormInput id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <CFormText className="text-muted">Set scheduled start time for the campaign.</CFormText>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="numbersFile">Contacts File (CSV/XLSX)</CFormLabel>
                <CFormInput type="file" id="numbersFile" accept=".csv,.xls,.xlsx" onChange={(e) => setNumbersFile(e.target.files?.[0] || null)} ref={fileRef} />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="audioFile">Audio File (optional)</CFormLabel>
                <CFormInput type="file" id="audioFile" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} ref={audioRef} />
              </div>

              {uploading && (
                <div className="mb-3">
                  <CProgress value={progress}>{progress}%</CProgress>
                </div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setShowNewCampaign(false)} disabled={uploading}>Cancel</CButton>
              <CButton color="primary" onClick={async () => {
                const success = await handleSubmit()
                if (success) setShowNewCampaign(false)
              }} disabled={uploading}>{uploading ? 'Uploading...' : 'Create Campaign'}</CButton>
            </CModalFooter>
          </CModal>

        </CCardBody>
      </CCard>
      <div className="mt-4">
        <h5>Campaigns</h5>
        {loadingCampaigns ? (
          <div className="py-3 text-center"><CSpinner /></div>
        ) : campaigns.length === 0 ? (
          <p className="text-muted">No campaigns found for this business.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>DID</th>
                  <th>Numbers</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id || c.id || c.name}>
                    <td>{c.name || c.title || 'Untitled Campaign'}</td>
                    <td>{c.didNumber || c.did || '-'}</td>
                    <td>{Array.isArray(c.numbers) ? c.numbers.length : (c.numbers ? c.numbers : '-')}</td>
                    <td>{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '-'}</td>
                    <td>{c.result?.completedAt ? new Date(c.result.completedAt).toLocaleString() : '-'}</td>
                    <td>{c.status || c.state || 'N/A'}</td>
                    <td>
                      <CButton color="danger" size="sm" onClick={() => handleDelete(c)} className="me-2">Delete</CButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioCampaign
