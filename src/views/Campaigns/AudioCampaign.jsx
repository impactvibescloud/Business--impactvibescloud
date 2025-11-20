import React, { useState, useRef, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CFormLabel,
  CFormInput,
  CFormSelect,
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
    } catch (err) {
      console.error('Upload failed', err)
      const msg = err?.response?.data?.message || err.message || 'Upload failed'
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: msg })
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
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="campaignName">Campaign Name</CFormLabel>
            <CFormInput id="campaignName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter audio campaign name" />
          </div>

          {/* Business ID is populated automatically from logged-in user and is not shown here */}

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

          <div className="d-flex justify-content-end">
            <CButton color="secondary" className="me-2" onClick={() => {
              setName(''); setDidNumber(''); setScheduledAt(''); setNumbersFile(null); setAudioFile(null);
              if (fileRef.current) fileRef.current.value = ''
              if (audioRef.current) audioRef.current.value = ''
            }} disabled={uploading}>Cancel</CButton>
            <CButton color="primary" onClick={handleSubmit} disabled={uploading}>{uploading ? 'Uploading...' : 'Create Campaign'}</CButton>
          </div>

        </CCardBody>
      </CCard>
    </div>
  )
}

export default AudioCampaign
