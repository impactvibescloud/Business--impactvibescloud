import React, { useEffect, useState, useMemo } from 'react'
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
import { cilTrash, cilPencil, cilMediaPlay, cilMediaStop, cilSearch, cilPlus, cilCloudDownload, cilCheck } from '@coreui/icons'
import { IoEyeOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { apiCall, getAuthToken } from '../../config/api'
import '../Branches/Branches.css'
import './IVRManagement.css'
import '../Leads/CallLogsWebpage.css'

// Material-UI
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import AssessmentIcon from '@mui/icons-material/Assessment'

const IVRManagement = () => {
  const navigate = useNavigate()
  const [ivrs, setIvrs] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [businessId, setBusinessId] = useState(localStorage.getItem('businessId') || '')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newIvr, setNewIvr] = useState({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
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
  const [afterLanguage, setAfterLanguage] = useState('')
  const [languages, setLanguages] = useState([])
  const [langCode, setLangCode] = useState('')
  const [langName, setLangName] = useState('')
  const [savingLang, setSavingLang] = useState(false)
  const [langModalOpen, setLangModalOpen] = useState(false)
  const [editingLangId, setEditingLangId] = useState(null)
  const [langToDelete, setLangToDelete] = useState(null)
  const [langDeleteModalOpen, setLangDeleteModalOpen] = useState(false)
  const [deletingLang, setDeletingLang] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateLangCode, setGenerateLangCode] = useState('')
  const [generateText, setGenerateText] = useState('')
  const [generateFileName, setGenerateFileName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateType, setGenerateType] = useState('text')
  const [generateUploadFile, setGenerateUploadFile] = useState(null)
  const [generateUploading, setGenerateUploading] = useState(false)
  const [playLoadingId, setPlayLoadingId] = useState(null)
  const [filesModalOpen, setFilesModalOpen] = useState(false)
  const [filesLangCode, setFilesLangCode] = useState('')
  const [filesList, setFilesList] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [voiceMode, setVoiceMode] = useState('text')
  const [voiceFiles, setVoiceFiles] = useState([])
  const [ivrAudioFile, setIvrAudioFile] = useState(null)
  const [ivrAudioBase64, setIvrAudioBase64] = useState('')
  const [ivrAudioFileName, setIvrAudioFileName] = useState('')
  const [editingAudioFile, setEditingAudioFile] = useState(null)
  const [editAudioModalOpen, setEditAudioModalOpen] = useState(false)
  const [editAudioText, setEditAudioText] = useState('')
  const [editAudioFileName, setEditAudioFileName] = useState('')
  const [savingEditAudio, setSavingEditAudio] = useState(false)
  const [audioToDelete, setAudioToDelete] = useState(null)
  const [audioDeleteModalOpen, setAudioDeleteModalOpen] = useState(false)
  const [deletingAudio, setDeletingAudio] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState(null)
  const [elevenVoices, setElevenVoices] = useState([])
  const [loadingElevenVoices, setLoadingElevenVoices] = useState(false)
  const [selectedElevenVoiceId, setSelectedElevenVoiceId] = useState('')
  const [filterLanguage, setFilterLanguage] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterAccent, setFilterAccent] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [voiceNameSetting, setVoiceNameSetting] = useState('')
  const [voiceGenderSetting, setVoiceGenderSetting] = useState('')
  const [voiceAccentSetting, setVoiceAccentSetting] = useState('')
  const [loadingVoiceSettings, setLoadingVoiceSettings] = useState(false)
  const [savingVoiceSettings, setSavingVoiceSettings] = useState(false)
  // DID numbers for IVR assignment
  const [availableDids, setAvailableDids] = useState([])
  const [selectedDid, setSelectedDid] = useState('')

  // Expand/collapse state for showing root node children
  const [expandedRoots, setExpandedRoots] = useState(new Set())

  const nodeMap = useMemo(() => {
    const map = {}
    ivrs.forEach((it) => {
      if (it && it.name) {
        try {
          const key = String(it.name).toLowerCase().trim()
          map[key] = it
        } catch (e) {
          map[it.name] = it
        }
      }
    })
    return map
  }, [ivrs])

  const referencedNodes = useMemo(() => {
    const s = new Set()
    ivrs.forEach((it) => {
      const opts = Array.isArray(it.options) ? it.options : (it.menu?.options || [])
      if (Array.isArray(opts)) {
        opts.forEach((o) => {
          const dest = (o && (o.destination || o.destinationType || o.target || '')).toString()
          if (dest && dest.startsWith('node:')) {
            const parts = dest.split(':')
            if (parts.length >= 2 && parts[1]) s.add(parts[1].toString().toLowerCase().trim())
          }
        })
      }
    })
    return s
  }, [ivrs])

  const roots = useMemo(() => {
    let r = ivrs.filter((it) => it && it.name && !referencedNodes.has(String(it.name).toLowerCase()))
    if (!r || r.length === 0) {
      const mainCandidates = ivrs.filter((it) => it && it.name && it.name.toLowerCase().includes('main'))
      r = mainCandidates.length ? mainCandidates : ivrs
    }
    return r
  }, [ivrs, referencedNodes])

  const toggleRootExpand = (name) => {
    setExpandedRoots((prev) => {
      const copy = new Set(prev)
      if (copy.has(name)) copy.delete(name)
      else copy.add(name)
      return copy
    })
  }

  const getDescendants = (rootName) => {
    const results = []
    const visited = new Set()
    const dfs = (name, depth = 1) => {
      if (!name) return
      const key = String(name).toLowerCase()
      if (visited.has(key)) return
      visited.add(key)
      const node = nodeMap[key]
      if (!node) return
      const opts = Array.isArray(node.options) ? node.options : (node.menu?.options || [])
      if (Array.isArray(opts)) {
        for (const o of opts) {
          const dest = (o && (o.destination || o.destinationType || o.target || '')).toString()
          if (dest && dest.startsWith('node:')) {
            const childName = (dest.split(':')[1] || '').toString()
            const childKey = childName.toLowerCase().trim()
            const child = nodeMap[childKey]
            if (child) {
              results.push({ node: child, depth })
              dfs(childName, depth + 1)
            }
          }
        }
      }
    }
    dfs(rootName)
    return results
  }

  const fetchLanguageFiles = async (langCode) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId || !langCode) return setFilesList([])
    try {
      setLoadingFiles(true)
      const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(langCode)}/files`
      const res = await apiCall(endpoint, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (Array.isArray(res.data)) list = res.data
      else if (Array.isArray(res.files)) list = res.files
      else if (res?.files && Array.isArray(res.files)) list = res.files
      setFilesList(list)
    } catch (err) {
      console.error('Failed to fetch language files', err)
      setFilesList([])
    } finally {
      setLoadingFiles(false)
    }
  }

    const fetchElevenVoices = async () => {
      try {
        setLoadingElevenVoices(true)
        const res = await apiCall('/api/elevenlabs/voices', 'GET')
        if (res && res.voices && Array.isArray(res.voices)) {
          setElevenVoices(res.voices)
        } else if (Array.isArray(res)) {
          setElevenVoices(res)
        } else {
          setElevenVoices([])
        }
      } catch (err) {
        console.error('Failed to fetch ElevenLabs voices', err)
        setElevenVoices([])
      } finally {
        setLoadingElevenVoices(false)
      }
    }

  const fetchVoiceFiles = async (langCode) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId || !langCode) {
      setVoiceFiles([])
      return []
    }
    try {
      const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(langCode)}/files`
      const res = await apiCall(endpoint, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (Array.isArray(res.data)) list = res.data
      else if (Array.isArray(res.files)) list = res.files
      else if (res?.files && Array.isArray(res.files)) list = res.files
      setVoiceFiles(list)
      return list
    } catch (err) {
      console.error('Failed to fetch voice files', err)
      setVoiceFiles([])
      return []
    }
  }

  const fetchVoiceSettings = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    try {
      setLoadingVoiceSettings(true)
      const endpoint = `/api/voice-settings/${encodeURIComponent(currentBusinessId)}`
      const res = await apiCall(endpoint, 'GET')
      const data = res && (res.data || res.setting || res || {})
      const vid = data.voiceId || data.voiceID || data.voice_id || ''
      const perKey = currentBusinessId ? `elevenVoiceId_${currentBusinessId}` : 'elevenVoiceId'
      const localSaved = currentBusinessId ? (localStorage.getItem(perKey) || '') : (localStorage.getItem('elevenVoiceId') || '')
      setSelectedElevenVoiceId(vid || localSaved)
      setVoiceNameSetting(data.voiceName || data.voiceName || '')
      setVoiceGenderSetting(data.gender || data.voiceGender || '')
      setVoiceAccentSetting(data.accent || data.locale || '')
    } catch (err) {
      console.error('Failed to fetch saved voice settings', err)
    } finally {
      setLoadingVoiceSettings(false)
    }
  }

  const saveVoiceSettings = async () => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId) return
    try {
      setSavingVoiceSettings(true)
      const payload = {
        voiceId: selectedElevenVoiceId || '',
        voiceName: voiceNameSetting || '',
        gender: voiceGenderSetting || '',
        accent: voiceAccentSetting || '',
      }
      const endpoint = `/api/voice-settings/${encodeURIComponent(currentBusinessId)}`
      const res = await apiCall(endpoint, 'POST', payload)
      if (res && (res.success || res.created || res.data)) {
        try {
          const perKey = businessId ? `elevenVoiceId_${businessId}` : 'elevenVoiceId'
          localStorage.setItem(perKey, selectedElevenVoiceId || '')
        } catch (e) {}
      } else {
        console.error('Failed to save voice settings', res)
      }
      return res
    } catch (err) {
      console.error('Error saving voice settings', err)
      throw err
    } finally {
      setSavingVoiceSettings(false)
    }
  }

  const fetchAllVoiceFiles = async () => {
    try {
      const langs = await fetchLanguages()
      const allLangs = Array.isArray(langs) ? langs : []
      const agg = []
      for (let i = 0; i < allLangs.length; i++) {
        const code = allLangs[i].code || allLangs[i]._id || allLangs[i].id
        if (!code) continue
        const list = await fetchFilesForLang(code)
        if (Array.isArray(list) && list.length) list.forEach((f) => { agg.push({ ...(f || {}), _lang: code }) })
      }
      setVoiceFiles(agg)
      return agg
    } catch (e) {
      console.error('Failed to fetch all voice files', e)
      setVoiceFiles([])
      return []
    }
  }

  const fetchFilesForLang = async (langCode) => {
    const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
    if (!currentBusinessId || !langCode) return []
    try {
      const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(langCode)}/files`
      const res = await apiCall(endpoint, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (Array.isArray(res.data)) list = res.data
      else if (Array.isArray(res.files)) list = res.files
      else if (res?.files && Array.isArray(res.files)) list = res.files
      return list
    } catch (err) {
      console.error('Failed to fetch files for language', langCode, err)
      return []
    }
  }

  const fetchLanguageFileAsBase64 = async (bizId, langCode, fileName) => {
    if (!bizId || !fileName) return null
    try {
      let endpoint = ''
      let attemptedLang = langCode
      // try to resolve a file id first for the given language
      try {
        const list = await fetchFilesForLang(langCode)
        const match = (list || []).find(f => ((f.fileName || f.name || f._id || f.id || '').toString() === fileName.toString()))
        const fileId = match ? (match._id || match.id) : null
        if (fileId) {
          endpoint = `/api/languages/business/${encodeURIComponent(bizId)}/${encodeURIComponent(langCode)}/files/play?fileId=${encodeURIComponent(fileId)}`
        }
      } catch (e) {
        // ignore and continue to broader search
      }
      // if we couldn't resolve and lang is 'default' or not found, search across all languages
      if (!endpoint) {
        const allLangs = await fetchLanguages()
        const langsArr = Array.isArray(allLangs) ? allLangs : []
        for (let i = 0; i < langsArr.length && !endpoint; i++) {
          const code = langsArr[i].code || langsArr[i]._id || langsArr[i].id
          if (!code) continue
          try {
            const list = await fetchFilesForLang(code)
            const match = (list || []).find(f => ((f.fileName || f.name || f._id || f.id || '').toString() === fileName.toString()))
            const fileId = match ? (match._id || match.id) : null
            if (fileId) {
              endpoint = `/api/languages/business/${encodeURIComponent(bizId)}/${encodeURIComponent(code)}/files/play?fileId=${encodeURIComponent(fileId)}`
              attemptedLang = code
              break
            }
          } catch (e) {
            // continue searching other languages
          }
        }
      }
      // final fallback to filename-based call with original langCode
      if (!endpoint) endpoint = `/api/languages/business/${encodeURIComponent(bizId)}/${encodeURIComponent(langCode || '')}/files/play?fileName=${encodeURIComponent(fileName)}`
      const data = await apiCall(endpoint, 'GET', null, { responseType: 'arraybuffer' })
      if (!data) return null
      const bytes = new Uint8Array(data)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)
      return `data:audio/wav;base64,${base64}`
    } catch (e) {
      console.error('Failed to fetch language file as base64', e)
      return null
    }
  }

  const refreshAudioFiles = async () => {
    // refresh filesList either for a selected language or aggregate all languages
    if (filesLangCode) {
      await fetchLanguageFiles(filesLangCode)
      return
    }
    try {
      setLoadingFiles(true)
      const langs = await fetchLanguages()
      const allLangs = Array.isArray(langs) ? langs : []
      const agg = []
      for (let i = 0; i < allLangs.length; i++) {
        const code = allLangs[i].code || allLangs[i]._id || allLangs[i].id
        if (!code) continue
        const list = await fetchFilesForLang(code)
        if (Array.isArray(list) && list.length) list.forEach((f) => { agg.push({ ...(f || {}), _lang: code }) })
      }
      setFilesList(agg)
    } catch (e) {
      console.error('Failed to refresh audio files', e)
      setFilesList([])
    } finally {
      setLoadingFiles(false)
    }
  }

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

  // fetch assigned virtual numbers (DIDs) for business to populate DID dropdown
  useEffect(() => {
    const fetchDids = async () => {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      if (!currentBusinessId) return
      try {
        const res = await apiCall(`/numbers/assigned-to/${encodeURIComponent(currentBusinessId)}`, 'GET')
        let list = []
        if (Array.isArray(res)) list = res
        else if (Array.isArray(res.data)) list = res.data
        else if (Array.isArray(res.numbers)) list = res.numbers
        else if (Array.isArray(res.results)) list = res.results
        else list = []
        // normalize to objects with id and number
        const normalized = (list || []).map((it) => ({ id: it._id || it.id || it.numberId || '', number: it.number || it.extension || it.virtualNumber || it.number }))
        setAvailableDids(normalized.filter(Boolean))
      } catch (e) {
        console.error('Failed to fetch DIDs for IVR', e)
        setAvailableDids([])
      }
    }
    if (businessId) fetchDids()
  }, [businessId])

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

  // reset selected DID whenever the add modal closes
  useEffect(() => {
    if (!addOpen) setSelectedDid('')
  }, [addOpen])

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
      return []
    }
    try {
      const res = await apiCall(`/api/languages/business/${encodeURIComponent(currentBusinessId)}`, 'GET')
      let list = []
      if (Array.isArray(res)) list = res
      else if (res?.data && Array.isArray(res.data)) list = res.data
      else if (res?.languages && Array.isArray(res.languages)) list = res.languages
      setLanguages(list)
      return list
    } catch (err) {
      console.error('Failed to fetch languages', err)
      setLanguages([])
      return []
    }
  }

  useEffect(() => {
    if (activeTab !== 'language' && activeTab !== 'audio') return
    const load = async () => {
      const langs = await fetchLanguages()
      // if audio tab opened, load all audio files across languages by default
      if (activeTab === 'audio') {
        setLoadingFiles(true)
        try {
          const allLangs = Array.isArray(langs) ? langs : []
          if (allLangs.length === 0) {
            setFilesList([])
            setFilesLangCode('')
            return
          }
          const agg = []
          for (let i = 0; i < allLangs.length; i++) {
            const code = allLangs[i].code || allLangs[i]._id || allLangs[i].id
            if (!code) continue
            const list = await fetchFilesForLang(code)
            if (Array.isArray(list) && list.length) {
              list.forEach((f) => { agg.push({ ...(f || {}), _lang: code }) })
            }
          }
          setFilesList(agg)
          setFilesLangCode('')
        } catch (e) {
          console.error('Failed to load audio files for Audio tab', e)
          setFilesList([])
        } finally {
          setLoadingFiles(false)
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    // when user opens Settings tab, load ElevenLabs voices
    if (activeTab !== 'settings') return
    const load = async () => {
      try {
        await fetchElevenVoices()
        // fetch saved settings from backend (and per-business local fallback)
        await fetchVoiceSettings()
      } catch (e) {
        console.error('Failed to load ElevenLabs voices', e)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const availableVoiceLanguages = useMemo(() => {
    const s = new Set()
    ;(elevenVoices || []).forEach((v) => {
      if (v.labels && v.labels.language) s.add(v.labels.language)
      ;(v.verified_languages || []).forEach((rl) => { if (rl.language) s.add(rl.language) })
    })
    return Array.from(s).filter(Boolean).sort()
  }, [elevenVoices])

  const getLanguageDisplayName = (code) => {
    if (!code) return ''
    // prefer business languages list if available
    try {
      const found = (languages || []).find(l => (l.code === code || l._id === code || l.id === code))
      if (found && (found.name || found.title)) return found.name || found.title
    } catch (e) {}
    // try Intl.DisplayNames for language
    try {
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        const dn = new Intl.DisplayNames([navigator?.language || 'en'], { type: 'language' })
        const pretty = dn.of(code)
        if (pretty) return pretty
      }
    } catch (e) {}
    return code
  }

  const availableVoiceGenders = useMemo(() => {
    const s = new Set()
    ;(elevenVoices || []).forEach((v) => { if (v.labels && v.labels.gender) s.add(v.labels.gender) })
    return Array.from(s).filter(Boolean).sort()
  }, [elevenVoices])

  const availableVoiceAccents = useMemo(() => {
    const s = new Set()
    ;(elevenVoices || []).forEach((v) => {
      if (v.labels && v.labels.accent) s.add(v.labels.accent)
      ;(v.verified_languages || []).forEach((rl) => { if (rl.accent) s.add(rl.accent) })
    })
    return Array.from(s).filter(Boolean).sort()
  }, [elevenVoices])

  const availableVoiceCategories = useMemo(() => {
    const s = new Set()
    ;(elevenVoices || []).forEach((v) => { if (v.category) s.add(v.category) })
    return Array.from(s).filter(Boolean).sort()
  }, [elevenVoices])

  const filteredElevenVoices = useMemo(() => {
    return (elevenVoices || []).filter((v) => {
      if (filterLanguage) {
        const labelLang = v.labels && v.labels.language
        const verified = (v.verified_languages || []).some(rl => rl.language === filterLanguage)
        if (!(labelLang === filterLanguage || verified)) return false
      }
      if (filterGender) {
        if (!((v.labels && v.labels.gender) === filterGender)) return false
      }
      if (filterAccent) {
        const labelAccent = v.labels && v.labels.accent
        const verifiedAccent = (v.verified_languages || []).some(rl => rl.accent === filterAccent)
        if (!(labelAccent === filterAccent || verifiedAccent)) return false
      }
      if (filterCategory) {
        if (!v.category || v.category !== filterCategory) return false
      }
      return true
    })
  }, [elevenVoices, filterLanguage, filterGender, filterAccent, filterCategory])

  const displayedElevenVoices = useMemo(() => {
    const list = Array.isArray(filteredElevenVoices) ? [...filteredElevenVoices] : []
    if (!selectedElevenVoiceId) return list
    const sel = String(selectedElevenVoiceId)
    list.sort((a, b) => {
      const aid = String(a.voice_id || a.id || a.name || '')
      const bid = String(b.voice_id || b.id || b.name || '')
      if (aid === sel && bid !== sel) return -1
      if (bid === sel && aid !== sel) return 1
      return 0
    })
    return list
  }, [filteredElevenVoices, selectedElevenVoiceId])

  useEffect(() => {
    // When modal is open and language selection changes, fetch available voice files
    if (!addOpen) return
    const lang = newIvr.language || ''
    if (!lang) {
      // language default -> show all available audio files across languages
      fetchAllVoiceFiles()
      return
    }
    fetchVoiceFiles(lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newIvr.language, addOpen])

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

  // DIDs that already have an ACTIVE IVR bound to them. The create / edit
  // form hides these from the DID picker so the user can't pick a number
  // that's already in use — they must deactivate the current IVR on that
  // DID first (use the Activate/Deactivate button in the IVR list).
  // Exception: when editing an existing IVR, keep ITS own DID visible so
  // the user can save without re-selecting.
  const didsWithActiveIvr = React.useMemo(() => {
    const set = new Set()
    for (const ivr of ivrs) {
      const isActive = ivr?.status === 'active' || ivr?.status === 'on'
      if (isActive && ivr?.did) set.add(String(ivr.did))
    }
    return set
  }, [ivrs])

  const selectableDids = React.useMemo(() => {
    // When editing, allow the IVR's own DID to stay in the list.
    const ownDid = editingNode
      ? (() => {
          const ed = ivrs.find(i => (i.node || i.name) === editingNode)
          return ed?.did ? String(ed.did) : null
        })()
      : null
    return (availableDids || []).filter(d => {
      const num = String(d?.number || '')
      if (!num) return false
      if (didsWithActiveIvr.has(num) && num !== ownDid) return false
      return true
    })
  }, [availableDids, didsWithActiveIvr, editingNode, ivrs])

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
      if (type === 'lang') {
        const langCode = rest.join(':') || ''
        return { key: o.key || o._id || '', type: 'lang', target: langCode }
      }
      if (type === 'agent') {
        // legacy agent:<id> stored — map to dept editor with agentId populated so user can see agent selection
        const agentId = rest.join(':') || ''
        return { key: o.key || o._id || '', type: 'dept', target: '', agentId: agentId || '' }
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
        return { key: o.key || o._id || '', type: 'dept', target: targetValue || '', agentId: agentId || '', ext: extPart || '' }
      }
      return { key: o.key || o._id || '', type: 'node', target: rest.join(':') || '', agentId: '' }
    })
    const language = item.language || item.menu?.language || item.lang || item.languageCode || ''
    setNewIvr({ node, voice, language, options: options.length ? options : [{ key: '1', type: 'node', target: '', agentId: '' }] })
    // reset ivr audio upload state
    setIvrAudioFile(null)
    setIvrAudioBase64('')
    setIvrAudioFileName(voice || '')
    setEditingNode(node)
    // fetch available languages for selection
    fetchLanguages()
    // fetch available voice files for this language and set mode if voice matches a file
    try {
      const files = await fetchVoiceFiles(language)
      const matched = (files || []).find(f => (f.fileName || f.name || '').toString() === (voice || '').toString())
      if (matched) setVoiceMode('upload')
      else setVoiceMode('text')
    } catch (e) {
      setVoiceMode('text')
    }
    setAddOpen(true)
    // prefill selected DID when editing if present on item
    try {
      const candidateDid = item.did || item.number || item.virtualNumber || (item.numberId && item.numberId.number) || ''
      setSelectedDid(candidateDid || '')
    } catch (e) {}
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
      const playingKey = ivr._id || ivr.id || ivr.fileName || ivr.audioFile || ''
      if (playingIvrId === playingKey) {
        stopPlaying()
        return
      }
      setPlayLoadingId(playingKey)
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
      audio.play().then(() => {
        setPlayingIvrId(ivr._id || ivr.id || name)
        setPlayLoadingId(null)
      }).catch((e) => { console.error('Audio play failed', e); setPlayLoadingId(null) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      setPlayLoadingId(null)
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
    setPlayLoadingId(null)
  }

  const playAfterHours = async (doc) => {
    try {
      const playingKey = `after-${doc._id || doc.fileName || doc.name}`
      if (playingIvrId === playingKey) {
        stopPlaying()
        return
      }
      setPlayLoadingId(playingKey)
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
      audio.play().then(() => {
        setPlayingIvrId(`after-${doc._id || doc.name}`)
        setPlayLoadingId(null)
      }).catch((e) => { console.error('Audio play failed', e); setPlayLoadingId(null) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      setPlayLoadingId(null)
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
    const newOpt = { key: String(next), type: 'node', target: '', agentId: '' }
    setNewIvr({ ...newIvr, options: [...opts, newOpt] })
  }

  const playLanguageFile = async (file) => {
    try {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      const playingKey = `lang-${filesLangCode}-${file._id || file.id || file.fileName}`
      if (playingIvrId === playingKey) {
        stopPlaying()
        return
      }
      setPlayLoadingId(playingKey)
      if (!currentBusinessId || !file) return
      // identify resource
      const id = file._id || file.id || ''
      const lang = filesLangCode || ''
      let endpoint = ''
      // Prefer an explicit download/url if provided by the API
      if (file.downloadUrl || file.url) {
        endpoint = file.downloadUrl || file.url
      } else if (id && lang) {
        // try a play endpoint by id (best-effort)
        endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/play?fileId=${encodeURIComponent(id)}`
      } else if (file.fileName && lang) {
        endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/play?fileName=${encodeURIComponent(file.fileName)}`
      } else {
        return
      }

      const data = await apiCall(endpoint, 'GET', null, { responseType: 'arraybuffer' })
      if (!data) return
      const mime = file.mimeType || 'audio/wav'
      const blob = new Blob([data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      if (playingAudio) {
        try { playingAudio.pause() } catch (e) {}
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) {}
      }
      const audio = new Audio(url)
      setPlayingUrl(url)
      setPlayingAudio(audio)
      audio.play().then(() => {
        setPlayingIvrId(`lang-${lang}-${id || file.fileName}`)
        setPlayLoadingId(null)
      }).catch((e) => { console.error('Audio play failed', e); setPlayLoadingId(null) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      setPlayLoadingId(null)
      console.error('Failed to play language file', err)
    }
  }

  const playElevenPreview = async (v) => {
    try {
      if (!v) return
      const idKey = v.voice_id || v.id || v.name
      const playingKey = `eleven-${idKey}`
      if (playingIvrId === playingKey) {
        stopPlaying()
        return
      }
      setPlayLoadingId(playingKey)
      // stop previous
      if (playingAudio) {
        try { playingAudio.pause() } catch (e) {}
        try { window.URL.revokeObjectURL(playingUrl) } catch (e) {}
      }
      const url = v.preview_url || v.url || ''
      if (!url) return
      const audio = new Audio(url)
      setPlayingUrl(url)
      setPlayingAudio(audio)
      audio.play().then(() => {
        setPlayingIvrId(playingKey)
        setPlayLoadingId(null)
      }).catch((e) => { console.error('Eleven preview play failed', e); setPlayLoadingId(null) })
      audio.onended = () => {
        try { window.URL.revokeObjectURL(url) } catch (e) {}
        setPlayingUrl(null)
        setPlayingAudio(null)
        setPlayingIvrId(null)
      }
    } catch (err) {
      setPlayLoadingId(null)
      console.error('Failed to play eleven preview', err)
    }
  }

  const downloadLanguageFile = async (file) => {
    try {
      const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
      if (!currentBusinessId || !file) return
      const idKey = (file._id || file.id || file.fileName)
      try { setDownloadingFileId(idKey) } catch (e) {}
      const lang = filesLangCode || file._lang || ''
      let endpoint = ''
      if (file.downloadUrl || file.url) {
        endpoint = file.downloadUrl || file.url
      } else if ((file._id || file.id) && lang) {
        endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/play?fileId=${encodeURIComponent(file._id || file.id)}`
      } else if (file.fileName && lang) {
        endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/play?fileName=${encodeURIComponent(file.fileName)}`
      } else {
        return
      }
      const data = await apiCall(endpoint, 'GET', null, { responseType: 'arraybuffer' })
      if (!data) return
      const mime = file.mimeType || 'audio/wav'
      const blob = new Blob([data], { type: mime })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (file.fileName || file.name || 'audio').toString().replace(/\s+/g, '_')
      a.download = `${safeName}.wav`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download language file', err)
    }
    try { setDownloadingFileId(null) } catch (e) {}
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
                            const token = getAuthToken()
                            const headers = { 'Content-Type': 'multipart/form-data' }
                            if (token) headers.Authorization = `Bearer ${token}`
                            await apiCall(endpoint, 'POST', form, { headers })
      }
    } catch (err) {
      console.error('Error deleting IVR node', err)
    } finally {
      setDeletingNode(null)
    }
  }

  // Activate / deactivate an IVR. Backend enforces "one active IVR
  // per DID per business" — if another IVR is already active on this
  // DID, the API returns 409 and we surface the message so the user
  // knows to deactivate the other one first.
  const [togglingIvrId, setTogglingIvrId] = useState(null)
  const toggleIvrActive = async (ivr) => {
    const ivrId = ivr?._id || ivr?.id
    if (!ivrId) return
    const currentlyActive = ivr.status === 'active' || ivr.status === 'on'
    setTogglingIvrId(ivrId)
    try {
      const res = await apiCall(`/ivr/${encodeURIComponent(ivrId)}/toggle-active`, 'POST', {
        active: !currentlyActive,
      })
      if (res?.success) {
        fetchIvrs(page)
      } else if (res?.message) {
        // Only surface a message when the user explicitly tried to
        // activate while another IVR was already active on the same DID
        // — this is the one case where they need to take action.
        alert(res.message)
      }
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      const code = err?.response?.data?.code
      if (code === 'DID_HAS_ACTIVE_IVR') {
        alert(apiMsg || 'This DID already has an active IVR. Deactivate it first.')
      } else {
        // Don't pop a generic "failed" alert — log so devs can see the
        // real cause; the user just sees the toggle stay in its previous
        // state and can retry.
        console.error('toggleIvrActive failed', err?.response?.data || err)
      }
    } finally {
      setTogglingIvrId(null)
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
      const payload = { text: afterHoursMessage, language: afterLanguage || '' }
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
          setAfterLanguage('')
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
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#111827', fontWeight: 700 }}>IVR Management</h3>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Create and manage interactive voice response (IVR) systems with menus, after-hours messages, and audio configurations</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={() => navigate('/ivr-reports')}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#6c5ce7',
            borderColor: '#6c5ce7',
            '&:hover': { borderColor: '#5a46eb', backgroundColor: 'rgba(108, 92, 231, 0.04)' },
          }}
        >
          Reports
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: '#d1d5db' }}
        >
          <Tab label="Menu" value="ivr" />
          <Tab label="After Hours" value="after" />
          <Tab label="Language" value="language" />
          <Tab label="Audio" value="audio" />
          <Tab label="Settings" value="settings" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <div style={{ display: activeTab === 'ivr' ? 'block' : 'none' }}>
            <div className="ivr-header mb-3">
            
          <div className="ivr-actions">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" color="primary" startIcon={<CIcon icon={cilPlus} />} onClick={() => { setEditingNode(null); setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] }); fetchLanguages(); setAddOpen(true) }} className="filter-btn">Add</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => {
                const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
                if (!currentBusinessId) return
                setDeleteAllModalOpen(true)
              }} disabled={deletingAll || loading} className="filter-btn">{deletingAll ? 'Deleting...' : 'Delete all'}</Button>
            </Box>
          </div>
        </div>
        {!businessId && (
          <div className="mb-3">
            <div className="alert alert-warning">Missing <code>businessId</code> in localStorage. Set it to view IVRs.</div>
          </div>
        )}
        {/* Generate Audio Dialog (replaces CModal) */}
        <Dialog open={generateModalOpen} onClose={() => { if (!generating && !generateUploading) { setGenerateModalOpen(false); setGenerateLangCode(''); setGenerateText(''); setGenerateFileName(''); setGenerateType('text'); setGenerateUploadFile(null); setGenerateUploading(false) } }} maxWidth="md" className="ivr-no-focus-modal">
          <DialogTitle>Generate Audio for Language</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 0 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Language</Typography>
                <TextField fullWidth size="small" value={generateLangCode} disabled />
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={generateType} onChange={(e) => setGenerateType(e.target.value)}>
                  <MenuItem value="text">Text (generate)</MenuItem>
                  <MenuItem value="upload">Upload (device file)</MenuItem>
                </Select>
              </FormControl>

              {generateType === 'text' ? (
                <TextField fullWidth multiline rows={6} size="small" label="Text" value={generateText} onChange={(e) => setGenerateText(e.target.value)} placeholder="Enter text to generate audio" />
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>Upload file</Typography>
                  <input id="generate-upload-file" type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; setGenerateUploadFile(f || null); if (f && !generateFileName) setGenerateFileName((f.name||'').replace(/\.[^/.]+$/, '')) }} />
                  <label htmlFor="generate-upload-file" style={{ display: 'inline-block' }}>
                    <Button component="span" size="small" variant="outlined" className="filter-btn">Choose file</Button>
                  </label>
                  <Typography variant="body2" sx={{ ml: 1, display: 'inline-block' }}>{generateUploadFile ? generateUploadFile.name : ''}</Typography>
                </Box>
              )}

              <TextField fullWidth size="small" label="File name" value={generateFileName} onChange={(e) => setGenerateFileName(e.target.value)} placeholder="e.g. welcome_hi" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!generating && !generateUploading) { setGenerateModalOpen(false); setGenerateLangCode(''); setGenerateText(''); setGenerateFileName(''); setGenerateType('text'); setGenerateUploadFile(null); setGenerateUploading(false) } }} disabled={generating || generateUploading}>Cancel</Button>
            <Button className="filter-btn" variant="contained" color="primary" onClick={async () => {
              const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
              if (!currentBusinessId || !generateLangCode || !generateFileName) return
              if (generateType === 'text') {
                if (!generateText) return
                setGenerating(true)
                try {
                  const payload = { text: generateText, fileName: generateFileName, type: 'text' }
                  if (selectedElevenVoiceId) {
                    payload.voiceProvider = 'elevenlabs'
                    payload.voiceId = selectedElevenVoiceId
                  }
                  const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(generateLangCode)}/generate`
                  const res = await apiCall(endpoint, 'POST', payload)
                  if (res && (res.success || res.created || res.data)) {
                    setGenerateModalOpen(false)
                    setGenerateLangCode('')
                    setGenerateText('')
                    setGenerateFileName('')
                    await fetchLanguages()
                    if (filesLangCode === generateLangCode) await fetchLanguageFiles(filesLangCode)
                  } else {
                    console.error('Failed to generate language audio', res)
                  }
                } catch (err) {
                  console.error('Error generating language audio', err)
                } finally {
                  setGenerating(false)
                }
              } else {
                // upload flow
                if (!generateUploadFile) return alert('Select a file to upload')
                setGenerateUploading(true)
                try {
                  const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(generateLangCode)}/files`
                  const form = new FormData()
                  form.append('file', generateUploadFile)
                  form.append('fileName', generateFileName)
                  form.append('type', 'upload')
                  try {
                    const token = getAuthToken()
                    const headers = { 'Content-Type': 'multipart/form-data' }
                    if (token) headers.Authorization = `Bearer ${token}`
                    await apiCall(endpoint, 'POST', form, { headers })
                  } catch (err) {
                    throw err
                  }
                  setGenerateModalOpen(false)
                  setGenerateLangCode('')
                  setGenerateUploadFile(null)
                  setGenerateFileName('')
                  await refreshAudioFiles()
                } catch (err) {
                  console.error('Failed to upload generated file', err)
                  alert('Upload failed')
                } finally {
                  setGenerateUploading(false)
                }
              }
            }} disabled={generating || generateUploading}>
              {generateType === 'text' ? (generating ? (<><CircularProgress size={16} />&nbsp;Generating</>) : 'Generate') : (generateUploading ? (<><CircularProgress size={16} />&nbsp;Uploading</>) : 'Upload')}
            </Button>
          </DialogActions>
        </Dialog>
        <CModal visible={audioDeleteModalOpen} onClose={() => { if (!deletingAudio) { setAudioDeleteModalOpen(false); setAudioToDelete(null) } }} alignment="center" className="ivr-no-focus-modal">
          <CModalHeader>
            <CModalTitle>Delete Audio File</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Are you sure you want to delete this audio file? This action cannot be undone.
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { if (!deletingAudio) { setAudioDeleteModalOpen(false); setAudioToDelete(null) } }} disabled={deletingAudio}>Cancel</CButton>
            <CButton color="danger" onClick={async () => {
              if (!audioToDelete) return
              const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
              const fileId = (audioToDelete.file && (audioToDelete.file._id || audioToDelete.file.id))
              const lang = audioToDelete.lang || ''
              if (!currentBusinessId || !fileId || !lang) return
              setDeletingAudio(true)
              try {
                const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/${encodeURIComponent(fileId)}`
                await apiCall(endpoint, 'DELETE')
              } catch (err) {
                console.error('Failed to delete audio file', err)
              }
              setAudioDeleteModalOpen(false)
              setAudioToDelete(null)
              setDeletingAudio(false)
              await refreshAudioFiles()
            }} disabled={deletingAudio}>{deletingAudio ? (<><CSpinner size="sm" />&nbsp;Deleting</>) : 'Delete'}</CButton>
          </CModalFooter>
        </CModal>
        <Dialog open={editAudioModalOpen} onClose={() => { if (!savingEditAudio) { setEditAudioModalOpen(false); setEditingAudioFile(null); setEditAudioFileName(''); setEditAudioText('') } }} maxWidth="sm" className="ivr-no-focus-modal">
          <DialogTitle>Edit Audio File</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="File name" fullWidth size="small" value={editAudioFileName} onChange={(e) => setEditAudioFileName(e.target.value)} />
              <TextField label="Text" fullWidth multiline rows={6} size="small" value={editAudioText} onChange={(e) => setEditAudioText(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!savingEditAudio) { setEditAudioModalOpen(false); setEditingAudioFile(null); setEditAudioFileName(''); setEditAudioText('') } }} disabled={savingEditAudio}>Cancel</Button>
            <Button className="filter-btn" variant="contained" color="primary" onClick={async () => {
              if (!editingAudioFile) return
              const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
              const fileId = editingAudioFile._id || editingAudioFile.id
              const lang = filesLangCode || editingAudioFile._lang || ''
              if (!currentBusinessId || !fileId || !lang) return
              setSavingEditAudio(true)
              try {
                const payload = { text: editAudioText, fileName: editAudioFileName }
                const endpoint = `/api/languages/business/${encodeURIComponent(currentBusinessId)}/${encodeURIComponent(lang)}/files/${encodeURIComponent(fileId)}`
                const res = await apiCall(endpoint, 'PUT', payload)
                if (res && (res.success || res.updated || res.data)) {
                  setEditAudioModalOpen(false)
                  setEditingAudioFile(null)
                  setEditAudioFileName('')
                  setEditAudioText('')
                  // refresh files list
                  await refreshAudioFiles()
                } else {
                  console.error('Failed to update audio file', res)
                }
              } catch (err) {
                console.error('Error updating audio file', err)
              } finally {
                setSavingEditAudio(false)
              }
            }} disabled={savingEditAudio}>{savingEditAudio ? (<><CircularProgress size={16} />&nbsp;Saving</>) : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="md" className="ivr-no-focus-modal" PaperProps={{ sx: { width: '90%', maxWidth: '900px' } }}>
          <DialogTitle>IVR Details</DialogTitle>
          <DialogContent dividers>
            {!selectedItem ? (
              <Typography color="text.secondary">No item selected</Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Name</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{selectedItem.name || selectedItem.title || '-'}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Voice Text</Typography>
                    <Box sx={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{selectedItem.voice || selectedItem.menu?.voice || ''}</Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Routing / Menu</Typography>
                    <Box sx={{ background: '#ffffff', p: 1.5, borderRadius: 1, border: '1px solid rgba(16,24,40,0.04)', maxHeight: 240, overflowY: 'auto' }}>
                      {(() => {
                        const menuObj = selectedItem.menu || selectedItem.routing || selectedItem || {}
                        const opts = Array.isArray(menuObj.options) ? menuObj.options : (Array.isArray(selectedItem.options) ? selectedItem.options : [])
                        if (!opts || opts.length === 0) return (<Typography color="text.secondary">No routing options available</Typography>)
                        return (
                          <div>
                            {opts.map((o) => {
                              const dest = (o.destination || o.destinationType || o.target || '').toString()
                              let kind = 'default'
                              let displayLabel = ''
                              if (dest.startsWith('dept:')) {
                                kind = 'dept'
                                const parts = dest.split(':')
                                const deptName = parts[1] || ''
                                const ext = parts[2] || ''
                                const dept = departments.find(d => (d.slug && d.slug === deptName) || (d.name && d.name.toLowerCase() === deptName.toLowerCase()))
                                displayLabel = dept ? (dept.name || dept.departmentName) : deptName
                                if (ext) displayLabel += ` (${ext})`
                              } else if (dest.startsWith('node:')) {
                                kind = 'node'
                                const parts = dest.split(':')
                                displayLabel = parts[1] || 'Menu Node'
                              } else if (dest.startsWith('lang:')) {
                                kind = 'default'
                                const parts = dest.split(':')
                                displayLabel = `Language: ${parts[1] || ''}`
                              } else if (dest.startsWith('agent:')) {
                                kind = 'agent'
                                const parts = dest.split(':')
                                const agentId = parts[1] || ''
                                const agent = availableAgents.find(a => a.id === agentId)
                                displayLabel = agent ? agent.name : agentId
                              } else {
                                displayLabel = dest || 'Unknown'
                              }
                              const colorMap = {
                                dept: { accent: '#fff7ed', border: '#f6ad55', badgeBg: '#fff2e8', badgeColor: '#7a4100' },
                                node: { accent: '#eff6ff', border: '#60a5fa', badgeBg: '#eef6ff', badgeColor: '#0b4ea2' },
                                agent: { accent: '#ecfdf5', border: '#34d399', badgeBg: '#f0fdf4', badgeColor: '#065f46' },
                                default: { accent: '#f8fafc', border: '#e5e7eb', badgeBg: '#f3f4f6', badgeColor: '#111827' },
                              }
                              const styles = colorMap[kind] || colorMap.default
                              return (
                                <Box key={o._id || o.key || Math.random()} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1, borderBottom: '1px solid rgba(16,24,40,0.03)', background: styles.accent, borderLeft: `4px solid ${styles.border}`, borderRadius: 1, mb: 1 }}>
                                  <Box sx={{ flex: '0 0 46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ background: styles.badgeBg, color: styles.badgeColor, px: 0.5, py: 0.25, fontSize: '0.85rem', borderRadius: 1, fontWeight: 600 }}>{o.key}</Box>
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#102a43' }}>{displayLabel || '—'}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>{dest || ''}</Typography>
                                  </Box>
                                </Box>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Virtual Number</Typography>
                    <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{selectedItem.did || selectedItem.virtualNumber || selectedItem.number || '-'}</Typography>
                    {(() => {
                      const createdByValue = 
                        selectedItem.createdBy?.email || 
                        selectedItem.createdBy?.name || 
                        selectedItem.raw?.createdBy?.email ||
                        selectedItem.raw?.createdBy?.name ||
                        selectedItem.raw?.createdByEmail ||
                        selectedItem.raw?.createdByName ||
                        selectedItem.raw?.createdBy
                      if (createdByValue) {
                        return (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">Created By</Typography>
                            <Typography>{createdByValue}</Typography>
                          </Box>
                        )
                      }
                      return null
                    })()}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Created At</Typography>
                      <Typography>{formatDateTimeShort(selectedItem.createdAt || selectedItem.created)}</Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <CBadge color={
                          selectedItem.active === true || 
                          selectedItem.active === 'true' || 
                          selectedItem.active === 1 ||
                          selectedItem.raw?.active === true ||
                          selectedItem.raw?.active === 'true' ||
                          selectedItem.raw?.active === 1 ||
                          selectedItem.status === 'active' ||
                          selectedItem.status === 'on' ||
                          selectedItem.raw?.status === 'active' ||
                          selectedItem.raw?.status === 'on' ||
                          selectedItem.raw?.ivrStatus === 'active' ||
                          selectedItem.raw?.state === 'active'
                          ? 'success' : 'secondary'
                        }>
                          {
                            selectedItem.active === true || 
                            selectedItem.active === 'true' || 
                            selectedItem.active === 1 ||
                            selectedItem.raw?.active === true ||
                            selectedItem.raw?.active === 'true' ||
                            selectedItem.raw?.active === 1 ||
                            selectedItem.status === 'active' ||
                            selectedItem.status === 'on' ||
                            selectedItem.raw?.status === 'active' ||
                            selectedItem.raw?.status === 'on' ||
                            selectedItem.raw?.ivrStatus === 'active' ||
                            selectedItem.raw?.state === 'active'
                            ? 'Active' : 'Inactive'
                          }
                        </CBadge>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions />
        </Dialog>

        <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingNode(null) }} maxWidth="md" className="ivr-no-focus-modal">
          <DialogTitle>{editingNode ? `Edit IVR (${editingNode})` : 'Add IVR'}</DialogTitle>
          <DialogContent dividers>
            <div style={{ background: '#fbfdff', padding: '1rem 1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
              <div className="row mb-2">
              <div className="col-12 col-md-4">
                <TextField label="Node (identifier)" fullWidth size="small" value={newIvr.node} placeholder="e.g. menu, sales" onChange={(e) => setNewIvr({ ...newIvr, node: e.target.value })} />
              </div>
              <div className="col-12 col-md-4">
                <FormControl fullWidth size="small">
                  <InputLabel>DID Number (optional)</InputLabel>
                  <Select label="DID Number (optional)" value={selectedDid || ''} onChange={(e) => setSelectedDid(e.target.value)}>
                    <MenuItem value="">(No DID)</MenuItem>
                    {selectableDids.map(d => (
                      <MenuItem key={d.id || d.number} value={d.number}>{d.number}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className="col-12 col-md-3">
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select label="Language" value={newIvr.language || ''} onChange={(e) => setNewIvr({ ...newIvr, language: e.target.value })}>
                    <MenuItem value="">Default</MenuItem>
                    {languages.map((ln) => (
                      <MenuItem key={ln.code || ln._id || ln.id} value={ln.code || ln._id || ln.id}>{ln.name || ln.code}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className="col-12 col-md-5">
                <label className="form-label" style={{ fontSize: 13, color: '#556270' }}>Voice</label>
                <div className="d-flex mb-2" style={{ gap: 8 }}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Mode</InputLabel>
                    <Select label="Mode" value={voiceMode} onChange={(e) => setVoiceMode(e.target.value)}>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="upload">Upload</MenuItem>
                    </Select>
                  </FormControl>
                  {voiceMode === 'text' ? (
                    <TextField fullWidth size="small" value={newIvr.voice} placeholder="e.g. Welcome to Acme." onChange={(e) => setNewIvr({ ...newIvr, voice: e.target.value })} />
                  ) : (
                    <FormControl fullWidth size="small">
                      <InputLabel>Existing file</InputLabel>
                      <Select label="Existing file" value={newIvr.voice || ''} onChange={(e) => setNewIvr({ ...newIvr, voice: e.target.value })}>
                        <MenuItem value="">Select existing audio file</MenuItem>
                        {(voiceFiles || []).map((vf) => (
                          <MenuItem key={vf._id || vf.id || vf.fileName} value={vf.fileName || vf.name || vf.id}>{vf.fileName || vf.name || vf.id}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </div>
              </div>
            </div>
            {/* when language changes in the modal, refresh available voice files */}
            {/* fetch voice files for chosen language to populate Upload dropdown */}
            {addOpen && (
              <React.Fragment>
                {newIvr.language ? null : null}
              </React.Fragment>
            )}
            <div className="mb-2">
              <label className="form-label" style={{ fontSize: 13, color: '#556270' }}>Options (press {'>'} target)</label>
              {newIvr.options.map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField size="small" sx={{ width: 80 }} value={opt.key} onChange={(e) => {
                    const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], key: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                  }} />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={opt.type || 'node'} onChange={(e) => {
                      const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], type: e.target.value, target: '' }; setNewIvr({ ...newIvr, options: copy })
                    }}>
                      <MenuItem value="node">node</MenuItem>
                      <MenuItem value="dept">dept</MenuItem>
                      <MenuItem value="lang">lang</MenuItem>
                    </Select>
                  </FormControl>
                  {opt.type === 'dept' ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Department</InputLabel>
                        <Select value={opt.target || ''} label="Department" onChange={(e) => {
                          const val = e.target.value;
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: val, agentId: '' }; setNewIvr({ ...newIvr, options: copy })
                          fetchDepartmentMembers(val)
                        }}>
                          <MenuItem value="">Select department</MenuItem>
                          {departments.map((d) => (
                            <MenuItem key={d._id || d.id} value={d._id || d.id}>{d.name || d.departmentName || d.title || d.slug || d._id}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Agent (optional)</InputLabel>
                        <Select value={opt.agentId || ''} label="Agent (optional)" onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], agentId: e.target.value }; setNewIvr({ ...newIvr, options: copy });
                        }}>
                          <MenuItem value="">Select agent (optional)</MenuItem>
                          {(() => {
                            const dep = departments.find(d => (d._id === opt.target || d.id === opt.target))
                            if (!dep) return null
                            const members = departmentMembers[dep._id] || departmentMembers[dep.id] || []
                            const headId = dep.departmentHead || dep.head || dep.userId || dep.departmentHeadId || dep.department_head
                            const headAgent = members.find(a => a._id === headId || a.id === headId)
                            const merged = headAgent ? ([headAgent, ...members.filter(a => a._id !== headAgent._id)]) : members
                            return merged.map((ag) => (
                              <MenuItem key={ag._id || ag.id} value={ag._id || ag.id}>{ag.name || ag.email || ag._id}</MenuItem>
                            ))
                          })()}
                        </Select>
                      </FormControl>
                    </Box>
                    ) : opt.type === 'lang' ? (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Language</InputLabel>
                        <Select value={opt.target || ''} label="Language" onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                        }}>
                          <MenuItem value="">Select language</MenuItem>
                          {languages.map((ln) => (
                            <MenuItem key={ln.code || ln._id || ln.id} value={ln.code || ln._id || ln.id}>{ln.name || ln.code}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      existingNodes.length > 0 ? (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Node</InputLabel>
                        <Select value={opt.target || ''} label="Node" onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                        }}>
                          <MenuItem value="">Select node</MenuItem>
                          {existingNodes.map((n) => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      ) : (
                        <TextField size="small" sx={{ maxWidth: 220 }} value={opt.target} onChange={(e) => {
                          const copy = [...newIvr.options]; copy[idx] = { ...copy[idx], target: e.target.value }; setNewIvr({ ...newIvr, options: copy })
                        }} placeholder="e.g. sales" />
                      )
                    )}
                  {/* per-option voice removed - voice is defined at menu level */}
                  <Button size="small" variant="outlined" color="error" onClick={() => {
                    const copy = [...newIvr.options]; copy.splice(idx, 1); setNewIvr({ ...newIvr, options: copy })
                  }}>Remove</Button>
                </Box>
              ))}
              <Button size="small" variant="outlined" className="filter-btn" onClick={addOptionWithNextKey}>Add option</Button>
            </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddOpen(false); setEditingNode(null) }} disabled={saving}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={async () => {
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
                            optionsArray.push({ key: o.key, destination: dest })
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            optionsArray.push({ key: o.key, destination: dest })
                          }
                        } else if (o.type === 'lang') {
                          optionsArray.push({ key: o.key, destination: `lang:${o.target || ''}` })
                        } else {
                          optionsArray.push({ key: o.key, destination: `node:${o.target || ''}` })
                        }
                      })
                    }
                    const newNodeValue = (newIvr.node || editingNode || '').toString()
                    const putPayload = {
                      businessId: currentBusinessId,
                      // use the edited node/name when provided (fall back to original)
                      node: newNodeValue,
                      name: newIvr.node || newNodeValue,
                      language: newIvr.language ? newIvr.language : 'default',
                      menu: {
                        voice: newIvr.voice || '',
                        options: optionsArray,
                      }
                    }
                    // include optional DID if selected
                    if (selectedDid) putPayload.did = selectedDid
                    // when mode is text, explicitly include type=text so backend knows
                    if (voiceMode === 'text') {
                      putPayload.type = 'text'
                    }
                    // if voiceMode is upload, include file reference or inline base64 as appropriate
                    if (voiceMode === 'upload') {
                      putPayload.type = 'upload'
                      // prefer inline base64 if user selected a local file
                      if (ivrAudioBase64) {
                        putPayload.audioBase64 = ivrAudioBase64
                        if (ivrAudioFileName) putPayload.fileName = ivrAudioFileName
                      } else if (newIvr.voice) {
                        // user selected an existing file from dropdown; send the filename (or id)
                        putPayload.fileName = newIvr.voice
                        // if we don't have inline base64, fetch the file as base64 to satisfy backend
                        try {
                          const fetched = await fetchLanguageFileAsBase64(currentBusinessId, putPayload.language || newIvr.language, putPayload.fileName)
                          if (fetched) putPayload.audioBase64 = fetched
                        } catch (e) {
                          console.error('Failed to fetch selected file as base64 for update', e)
                        }
                      }
                      // lowercase other fields but keep audioBase64 intact
                      const finalPayload = deepLowercase({ ...putPayload })
                      if (putPayload.audioBase64) finalPayload.audioBase64 = putPayload.audioBase64
                      if (putPayload.fileName && typeof putPayload.fileName === 'string') finalPayload.fileName = putPayload.fileName
                      // debug: log final payload being sent for upload mode
                      console.debug('IVR update finalPayload (upload):', finalPayload)
                      const res = await apiCall(`/ivr/update/full/${encodeURIComponent((editingNode || '').toString().toLowerCase())}`, 'PUT', finalPayload)
                      if (res && (res.success || res.updated || res.data)) {
                        setAddOpen(false)
                        setEditingNode(null)
                        setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                        fetchIvrs(1)
                      } else {
                        console.error('Failed to update IVR', res)
                      }
                    } else {
                      // debug: log payload being sent for non-upload (text) mode
                      const payloadToSend = deepLowercase(putPayload)
                      console.debug('IVR update payload (text):', payloadToSend)
                      const res = await apiCall(`/ivr/update/full/${encodeURIComponent((editingNode || '').toString().toLowerCase())}`, 'PUT', payloadToSend)
                      if (res && (res.success || res.updated || res.data)) {
                        setAddOpen(false)
                        setEditingNode(null)
                        setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                        fetchIvrs(1)
                      } else {
                        console.error('Failed to update IVR', res)
                      }
                    }
                    if (res && (res.success || res.updated || res.data)) {
                      setAddOpen(false)
                      setEditingNode(null)
                      setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
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
                            parsedOptions[o.key] = { destination: dest }
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            parsedOptions[o.key] = { destination: dest }
                          }
                        } else {
                          parsedOptions[o.key] = { destination: `node:${o.target || ''}` }
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
                            optionsArrayFromParsed.push({ key: o.key, destination: dest })
                          } else {
                            const dept = departments.find(d => (
                              d._id === o.target || d.id === o.target ||
                              (d.slug && d.slug === o.target) ||
                              (d.name && d.name.toString().toLowerCase() === (o.target || '').toString().toLowerCase())
                            ))
                            const resolvedName = dept ? (dept.name || dept.departmentName || dept.slug || dept._id) : o.target
                            const dest = `dept:${String(resolvedName || '').toLowerCase()}`
                            optionsArrayFromParsed.push({ key: o.key, destination: dest })
                          }
                        } else if (o.type === 'lang') {
                          optionsArrayFromParsed.push({ key: o.key, destination: `lang:${o.target || ''}` })
                        } else {
                          optionsArrayFromParsed.push({ key: o.key, destination: `node:${o.target || ''}` })
                        }
                      })
                    }
                    const savePayload = {
                      businessId: currentBusinessId,
                      node: nodeName,
                      name: newIvr.node || nodeName,
                      language: newIvr.language ? newIvr.language : 'default',
                      menu: {
                        voice: newIvr.voice || ``,
                        options: optionsArrayFromParsed,
                      }
                    }
                    // include optional DID if selected
                    if (selectedDid) savePayload.did = selectedDid
                    // when mode is text, explicitly include type=text so backend knows
                    if (voiceMode === 'text') {
                      savePayload.type = 'text'
                    }
                    try {
                      // if voiceMode is upload, include file reference or inline base64 as appropriate
                      if (voiceMode === 'upload') {
                        savePayload.type = 'upload'
                        if (ivrAudioBase64) {
                          savePayload.audioBase64 = ivrAudioBase64
                          if (ivrAudioFileName) savePayload.fileName = ivrAudioFileName
                        } else if (newIvr.voice) {
                          savePayload.fileName = newIvr.voice
                          // fetch base64 for selected existing file so backend receives audioBase64
                          try {
                            const fetched = await fetchLanguageFileAsBase64(currentBusinessId, savePayload.language || newIvr.language, savePayload.fileName)
                            if (fetched) savePayload.audioBase64 = fetched
                          } catch (e) {
                            console.error('Failed to fetch selected file as base64 for create', e)
                          }
                        }
                        const finalSave = deepLowercase({ ...savePayload })
                        if (savePayload.audioBase64) finalSave.audioBase64 = savePayload.audioBase64
                        if (savePayload.fileName && typeof savePayload.fileName === 'string') finalSave.fileName = savePayload.fileName
                        // debug: log final payload being sent for upload create
                        console.debug('IVR create finalSave (upload):', finalSave)
                        const saveRes = await apiCall('/ivr/create', 'POST', finalSave)
                        if (saveRes && (saveRes.success || saveRes.created || saveRes.data)) {
                          setAddOpen(false)
                          setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                          fetchIvrs(1)
                        } else {
                          console.error('Failed to create IVR', saveRes)
                        }
                      } else {
                        // debug: log payload being sent for non-upload (text) create
                        const payloadToSend = deepLowercase(savePayload)
                        console.debug('IVR create payload (text):', payloadToSend)
                        const saveRes = await apiCall('/ivr/create', 'POST', payloadToSend)
                        if (saveRes && (saveRes.success || saveRes.created || saveRes.data)) {
                          setAddOpen(false)
                          setNewIvr({ node: '', voice: '', language: '', options: [{ key: '1', type: 'node', target: '', agentId: '' }] })
                          fetchIvrs(1)
                        } else {
                          console.error('Failed to create IVR', saveRes)
                        }
                      }
                    } catch (err) {
                      // The dropdown already hides DIDs with an active IVR
                      // so DID_HAS_ACTIVE_IVR should be unreachable here.
                      // Keep a quiet fallback for any other API errors —
                      // log to console only, no popup. (The user already
                      // saw a successful submit attempt; if the API rejects
                      // for some other reason, the modal will stay open
                      // and the dev console will show what happened.)
                      console.error('Error creating IVR', err?.response?.data || err)
                    }
                  }
                } catch (err) {
                  console.error('Error saving IVR', err?.response?.data || err)
                } finally {
                  setSaving(false)
                }
              }} disabled={saving} className="filter-btn">
                {saving ? (<><CircularProgress size={16} />&nbsp;Saving</>) : (editingNode ? 'Save' : 'Create')}
              </Button>
          </DialogActions>
        </Dialog>

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

        <Dialog open={afterModalOpen} onClose={() => { if (!savingAfterHours) { setAfterModalOpen(false); setEditingAfterId(null) } }} maxWidth="md" className="ivr-no-focus-modal">
          <DialogTitle>{editingAfterId ? 'Edit After Hours' : 'Add After Hours'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select value={afterLanguage || ''} label="Language" onChange={(e) => setAfterLanguage(e.target.value)}>
                  <MenuItem value="">Default</MenuItem>
                  {languages.map((ln) => (
                    <MenuItem key={ln.code || ln._id || ln.id} value={ln.code || ln._id || ln.id}>{ln.name || ln.code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Message" multiline rows={6} fullWidth size="small" value={afterHoursMessage} placeholder="Enter the after-hours voice/text here" onChange={(e) => setAfterHoursMessage(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!savingAfterHours) { setAfterModalOpen(false); setEditingAfterId(null) } }} disabled={savingAfterHours}>Cancel</Button>
            <Button className="filter-btn" variant="contained" color="primary" onClick={async () => { await saveAfterHours() }} disabled={savingAfterHours}>{savingAfterHours ? (<><CircularProgress size={16} />&nbsp;Saving</>) : (editingAfterId ? 'Update' : 'Save')}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={langModalOpen} onClose={() => { if (!savingLang) { setLangModalOpen(false); setEditingLangId(null) } }} maxWidth="sm" className="ivr-no-focus-modal">
          <DialogTitle>{editingLangId ? 'Edit Language' : 'Add Language'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Code" fullWidth size="small" value={langCode} placeholder="e.g. en" onChange={(e) => setLangCode(e.target.value)} />
              <TextField label="Name" fullWidth size="small" value={langName} placeholder="e.g. English" onChange={(e) => setLangName(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!savingLang) { setLangModalOpen(false); setEditingLangId(null) } }} disabled={savingLang}>Cancel</Button>
            <Button className="filter-btn" variant="contained" color="primary" onClick={async () => {
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
            }} disabled={savingLang}>{savingLang ? (<><CircularProgress size={16} />&nbsp;Saving</>) : (editingLangId ? 'Update' : 'Save')}</Button>
          </DialogActions>
        </Dialog>

        {/* After Hours tab handled in tab content below */}

        {loading ? (
          <div className="text-center py-4"><CSpinner /></div>
        ) : ivrs.length === 0 ? (
          <div className="text-center py-3">No IVRs found</div>
        ) : (
          <Grid container spacing={2}>
            {roots.map((root) => (
              <Grid item xs={12} key={root._id || root.id || root.name}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{root.name || root._id || '(ivr)'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{root.menu?.voice || root.voice || ''}</Typography>
                      <Typography variant="body2" color="text.secondary">{Array.isArray(root.menu?.options) ? `${root.menu.options.length} options` : (Array.isArray(root.options) ? `${root.options.length} options` : '-')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CBadge color={root.status === 'active' || root.status === 'on' ? 'success' : 'secondary'}>{root.status || '-'}</CBadge>
                      <IconButton size="small" onClick={() => toggleRootExpand(root.name)} title={expandedRoots.has(root.name) ? 'Collapse' : 'Expand'}>
                        {expandedRoots.has(root.name) ? <IoChevronUpOutline style={{ fontSize: '1em' }} /> : <IoChevronDownOutline style={{ fontSize: '1em' }} />}
                      </IconButton>
                      {playingIvrId === (root._id || root.id || (root.fileName || root.audioFile)) ? (
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></IconButton>
                      ) : (
                        (root.fileName || root.audioFile || root._id) && (
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); playIvrFile(root) }} title="Play"><CIcon icon={cilMediaPlay} /></IconButton>
                        )
                      )}
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetails(root) }} title="View"><IoEyeOutline style={{ fontSize: '1em', verticalAlign: 'middle', lineHeight: 1 }} /></IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(root) }} title="Edit"><CIcon icon={cilPencil} /></IconButton>
                      {/* Activate / Deactivate. One active IVR allowed per DID. */}
                      <Button
                        size="small"
                        variant={root.status === 'active' || root.status === 'on' ? 'contained' : 'outlined'}
                        color={root.status === 'active' || root.status === 'on' ? 'success' : 'warning'}
                        disabled={togglingIvrId === (root._id || root.id)}
                        onClick={(e) => { e.stopPropagation(); toggleIvrActive(root) }}
                        sx={{ minWidth: 96, ml: 0.5, textTransform: 'none', fontWeight: 600 }}
                        title={root.status === 'active' || root.status === 'on'
                          ? 'Deactivate this IVR (releases the DID so a new IVR can be created on it)'
                          : `Activate this IVR${root.did ? ` on DID ${root.did}` : ''}`}
                      >
                        {togglingIvrId === (root._id || root.id)
                          ? '…'
                          : (root.status === 'active' || root.status === 'on' ? 'Deactivate' : 'Activate')}
                      </Button>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); const nodeId = (root.name || root.node || root._id || root.id); if (!nodeId) return; setNodeToDelete(nodeId); setDeleteModalOpen(true); }} title="Delete"><CIcon icon={cilTrash} /></IconButton>
                    </Box>
                  </Box>
                  <Collapse in={expandedRoots.has(root.name)} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 1 }}>
                      {getDescendants(root.name).map(({ node, depth }) => (
                        <Paper key={node._id || node.id || node.name} variant="outlined" sx={{ p: 1, mt: 1, ml: depth * 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{node.name || node._id}</Typography>
                            <Typography variant="body2" color="text.secondary">{node.menu?.voice || node.voice || ''}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {playingIvrId === (node._id || node.id || (node.fileName || node.audioFile)) ? (
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></IconButton>
                            ) : (
                              (node.fileName || node.audioFile || node._id) && (
                                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); playIvrFile(node) }} title="Play"><CIcon icon={cilMediaPlay} /></IconButton>
                              )
                            )}
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetails(node) }} title="View"><IoEyeOutline style={{ fontSize: '1em', verticalAlign: 'middle', lineHeight: 1 }} /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(node) }} title="Edit"><CIcon icon={cilPencil} /></IconButton>
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); const nodeId = (node.name || node.node || node._id || node.id); if (!nodeId) return; setNodeToDelete(nodeId); setDeleteModalOpen(true); }} title="Delete"><CIcon icon={cilTrash} /></IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Collapse>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
        </div>
          {activeTab === 'after' && (
            <Box className="page-container">
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="ivr-header">
                <Box>
                  <Typography variant="h6">After Hours</Typography>
                  <Typography variant="body2" color="text.secondary">Manage the after-hours message for this business.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" color="primary" onClick={() => { setEditingAfterId(null); setAfterHoursMessage(''); setAfterLanguage(''); fetchLanguages(); setAfterModalOpen(true) }} startIcon={<CIcon icon={cilPlus} />}>Add</Button>
                  <Button size="small" variant="outlined" color="error" onClick={async () => {
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
                  }} disabled={deletingAfterAll} className="filter-btn">{deletingAfterAll ? 'Deleting...' : 'Delete all'}</Button>
                </Box>
              </Box>

              {!businessId && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="warning">Missing <code>businessId</code> in localStorage. Set it to manage after-hours.</Alert>
                </Box>
              )}

              <Typography variant="subtitle1" sx={{ mb: 1 }}>Saved After Hours Audios</Typography>

              {afterHoursList.length === 0 ? (
                <Typography color="text.secondary">No saved after-hours audio for this business.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {afterHoursList.map((a) => (
                    <Grid item xs={12} sm={6} key={a._id || a.id || a.name}>
                      <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{a.name || a._id || '(audio)'}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{a.generatedText || a.text || a.message || ''}</Typography>
                          <Typography variant="body2" color="text.secondary">{a.createdAt ? (new Date(a.createdAt)).toLocaleString() : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {playingIvrId === `after-${a._id || a.name}` ? (
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></IconButton>
                          ) : (
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); playAfterHours(a) }} title="Play"><CIcon icon={cilMediaPlay} /></IconButton>
                          )}
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openAfterDetails(a) }} title="View"><IoEyeOutline style={{fontSize: '1em', verticalAlign: 'middle', lineHeight: 1}} /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingAfterId(a._id || a.id); setAfterHoursMessage(a.generatedText || a.text || a.message || ''); setAfterLanguage(a.language || a.lang || a.languageCode || ''); fetchLanguages(); setAfterModalOpen(true) }} title="Edit"><CIcon icon={cilPencil} /></IconButton>
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); confirmDeleteAfterHours(a._id || a.id) }} title="Delete"><CIcon icon={cilTrash} /></IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        <Dialog open={afterDeleteModalOpen} onClose={() => { if (!deletingAfterItem) { setAfterDeleteModalOpen(false); setAfterToDelete(null) } }} className="ivr-no-focus-modal">
          <DialogTitle>Delete After Hours</DialogTitle>
          <DialogContent dividers>
            <Typography>Are you sure you want to delete this after-hours audio? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!deletingAfterItem) { setAfterDeleteModalOpen(false); setAfterToDelete(null) } }} disabled={deletingAfterItem}>Cancel</Button>
            <Button color="error" variant="contained" onClick={deleteAfterHoursConfirmed} disabled={deletingAfterItem}>{deletingAfterItem ? (<><CircularProgress size={16} />&nbsp;Deleting</>) : 'Delete'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={afterDetailsOpen} onClose={closeAfterDetails} maxWidth="md" className="ivr-no-focus-modal">
          <DialogTitle>After Hours Details</DialogTitle>
          <DialogContent dividers>
            {!afterSelected ? (
              <Typography color="text.secondary">No item selected</Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="caption" color="text.secondary">Message</Typography>
                  <Box sx={{ background: '#f0f9ff', p: 2, borderRadius: 1.25, border: '1px solid rgba(96,165,250,0.12)', minHeight: 80, whiteSpace: 'pre-wrap', color: '#334155' }}>
                    {afterSelected.generatedText || afterSelected.text || afterSelected.message || '-'}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">File</Typography>
                    <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{afterSelected.fileName || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">{afterSelected.mimeType ? `${afterSelected.mimeType} • ${afterSelected.sizeKB ? afterSelected.sizeKB + ' KB' : ''}` : ''}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Uploaded</Typography>
                      <Box sx={{ mt: 0.5 }}>{afterSelected.uploadedToAsterisk ? <CBadge color="success">Uploaded</CBadge> : <CBadge color="secondary">Not uploaded</CBadge>}</Box>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">Created</Typography>
                      <Typography>{afterSelected.createdAt ? (new Date(afterSelected.createdAt)).toLocaleString() : '-'}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Updated</Typography>
                      <Typography>{afterSelected.updatedAt ? (new Date(afterSelected.updatedAt)).toLocaleString() : '-'}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions />
        </Dialog>
        {activeTab === 'language' && (
          <div>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="ivr-header">
              <Box>
                <Typography variant="h6">Languages</Typography>
                <Typography variant="body2" color="text.secondary">Create a new language for the system.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" className="filter-btn" onClick={() => { setLangCode(''); setLangName(''); setEditingLangId(null); setLangModalOpen(true) }}>Add</Button>
              </Box>
            </Box>

            {languages.length === 0 ? (
              <Typography color="text.secondary">No languages found.</Typography>
            ) : (
              <Grid container spacing={2}>
                {languages.map((l) => (
                  <Grid item xs={12} sm={6} md={4} key={l.code || l._id || l.id}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{l.name || l.title || l.code}</Typography>
                        <Typography variant="body2" color="text.secondary">{l.code}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingLangId(l.code || l._id || l.id); setLangCode(l.code || ''); setLangName(l.name || ''); setLangModalOpen(true) }} title="Edit"><CIcon icon={cilPencil} /></IconButton>
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); const id = l.code || l._id || l.id; if (!id) return; setLangToDelete(id); setLangDeleteModalOpen(true) }} title="Delete"><CIcon icon={cilTrash} /></IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
            <CModal visible={filesModalOpen} onClose={() => { if (!loadingFiles) { setFilesModalOpen(false); setFilesLangCode(''); setFilesList([]) } }} alignment="center" size="lg" className="ivr-no-focus-modal">
              <CModalHeader>
                <CModalTitle>Language Files</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <div className="mb-2">
                  <div style={{ fontSize: 13, color: '#556270', marginBottom: 8 }}>Language</div>
                  <div style={{ fontWeight: 600 }}>{filesLangCode || '-'}</div>
                </div>
                <div>
                  {loadingFiles ? (
                    <div className="text-center"><CSpinner /></div>
                  ) : filesList.length === 0 ? (
                    <div className="text-muted">No files found for this language.</div>
                  ) : (
                    <div>
                      {filesList.map((f) => (
                        <div key={f._id || f.id || f.fileName} className="d-flex justify-content-between align-items-center mb-2 p-2" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{f.fileName || f.name || '-'}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{f.createdAt ? (new Date(f.createdAt)).toLocaleString() : ''}</div>
                          </div>
                          <div>
                            {playLoadingId === (`lang-${filesLangCode}-${f._id || f.id || f.fileName}`) ? (
                              <button className="btn btn-sm btn-outline-secondary" disabled title="Loading"><CSpinner size="sm" /></button>
                            ) : playingIvrId === (`lang-${filesLangCode}-${f._id || f.id || f.fileName}`) ? (
                              <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></button>
                            ) : (
                              <button className="btn btn-sm btn-outline-success" onClick={(e) => { e.stopPropagation(); playLanguageFile(f) }} title="Play"><CIcon icon={cilMediaPlay} /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" onClick={() => { if (!loadingFiles) { setFilesModalOpen(false); setFilesLangCode(''); setFilesList([]) } }}>Close</CButton>
              </CModalFooter>
            </CModal>
            <CModal visible={langDeleteModalOpen} onClose={() => { if (!deletingLang) { setLangDeleteModalOpen(false); setLangToDelete(null) } }} alignment="center" className="ivr-no-focus-modal">
              <CModalHeader>
                <CModalTitle>Delete Language</CModalTitle>
              </CModalHeader>
              <CModalBody>
                Are you sure you want to delete this language? This action cannot be undone.
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" onClick={() => { if (!deletingLang) { setLangDeleteModalOpen(false); setLangToDelete(null) } }} disabled={deletingLang}>Cancel</CButton>
                <CButton color="danger" onClick={async () => {
                  if (!langToDelete) return
                  setDeletingLang(true)
                  try {
                    await apiCall(`/api/languages/${encodeURIComponent(langToDelete)}`, 'DELETE')
                  } catch (err) { console.error('Failed to delete language', err) }
                  setLangDeleteModalOpen(false)
                  setLangToDelete(null)
                  setDeletingLang(false)
                  await fetchLanguages()
                }} disabled={deletingLang}>{deletingLang ? (<><CSpinner size="sm" />&nbsp;Deleting</>) : 'Delete'}</CButton>
              </CModalFooter>
              </CModal>
            </div>
        )}
        {activeTab === 'audio' && (
          <Box className="page-container">
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }} className="ivr-header">
              <Box>
                <Typography variant="h6">Manage audio files</Typography>
                <Typography variant="body2" color="text.secondary">for languages.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button size="small" variant="contained" color="primary" onClick={() => {
                  const code = filesLangCode || (languages[0] && (languages[0].code || languages[0]._id || languages[0].id)) || ''
                  if (!code) return
                  setGenerateLangCode(code)
                  setGenerateText('')
                  setGenerateFileName(`welcome_${(code||'lang')}`)
                  setGenerateModalOpen(true)
                }} startIcon={<CIcon icon={cilPlus} />}>Add</Button>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Language</InputLabel>
                  <Select label="Language" value={filesLangCode || ''} onChange={(e) => { const v = e.target.value; setFilesLangCode(v); setFilesList([]); if (v) fetchLanguageFiles(v); }}>
                    <MenuItem value="">Select language</MenuItem>
                    {languages.map((ln) => (
                      <MenuItem key={ln.code || ln._id || ln.id} value={ln.code || ln._id || ln.id}>{ln.name || ln.code}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button size="small" variant="outlined" className="filter-btn" onClick={() => { if (filesLangCode) fetchLanguageFiles(filesLangCode) }}>Refresh</Button>
              </Box>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Audio Files</Typography>

            {loadingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
            ) : (!loadingFiles && filesList.length === 0) ? (
              <Typography color="text.secondary">No files found for selected language.</Typography>
            ) : (
              <Grid container spacing={2}>
                {filesList.map((f) => (
                  <Grid item xs={12} sm={6} key={f._id || f.id || f.fileName}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{f.fileName || f.name || '-'}</Typography>
                        <Typography variant="body2" color="text.secondary">{f.createdAt ? (new Date(f.createdAt)).toLocaleString() : ''}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {playLoadingId === (`lang-${filesLangCode}-${f._id || f.id || f.fileName}`) ? (
                          <IconButton size="small" disabled title="Loading"><CSpinner size="sm" /></IconButton>
                        ) : playingIvrId === (`lang-${filesLangCode}-${f._id || f.id || f.fileName}`) ? (
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); stopPlaying() }} title="Stop"><CIcon icon={cilMediaStop} /></IconButton>
                        ) : (
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); playLanguageFile(f) }} title="Play"><CIcon icon={cilMediaPlay} /></IconButton>
                        )}

                        {downloadingFileId === (f._id || f.id || f.fileName) ? (
                          <IconButton size="small" disabled title="Downloading"><CSpinner size="sm" /></IconButton>
                        ) : (
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); downloadLanguageFile(f) }} title="Download"><CIcon icon={cilCloudDownload} /></IconButton>
                        )}

                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); const lang = filesLangCode || f._lang || ''; setEditingAudioFile(f); setEditAudioFileName(f.fileName || f.name || ''); setEditAudioText(f.text || f.generatedText || ''); setEditAudioModalOpen(true) }} title="Edit"><CIcon icon={cilPencil} /></IconButton>

                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setAudioToDelete({ file: f, lang: filesLangCode || f._lang || '' }); setAudioDeleteModalOpen(true) }} title="Delete"><CIcon icon={cilTrash} /></IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
        {activeTab === 'settings' && (
          <Box className="page-container">
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">IVR Settings</Typography>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Available Voices</Typography>

            {loadingElevenVoices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
            ) : (!loadingElevenVoices && elevenVoices.length === 0) ? (
              <Typography color="text.secondary">No voices found.</Typography>
            ) : (
              <Box>
                <Grid container spacing={2} alignItems="center" className="filter-container" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Language</InputLabel>
                      <Select label="Language" value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableVoiceLanguages.map((l) => (<MenuItem key={l} value={l}>{getLanguageDisplayName(l)}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Gender</InputLabel>
                      <Select label="Gender" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableVoiceGenders.map((g) => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Accent</InputLabel>
                      <Select label="Accent" value={filterAccent} onChange={(e) => setFilterAccent(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableVoiceAccents.map((a) => (<MenuItem key={a} value={a}>{a}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {availableVoiceCategories.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" className="filter-btn" onClick={() => { setFilterLanguage(''); setFilterGender(''); setFilterAccent(''); setFilterCategory('') }}>Clear</Button>
                  </Grid>
                </Grid>

                {displayedElevenVoices.length === 0 ? (
                  <Typography color="text.secondary">No voices match the selected filters.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {displayedElevenVoices.map((v) => {
                      const idKey = v.voice_id || v.id || v.name || ''
                      const isSelected = selectedElevenVoiceId && String(selectedElevenVoiceId) === String(idKey)
                      return (
                        <Grid item xs={12} sm={6} md={6} key={idKey}>
                          <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: isSelected ? '2px solid var(--completed)' : '1px solid #e9ecef', background: isSelected ? '#ecfdf5' : 'transparent' }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600 }}>{v.name || idKey}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(() => {
                                  const labelLang = (v.labels && v.labels.language) || (v.verified_languages && v.verified_languages[0] && v.verified_languages[0].language) || ''
                                  const genderLabel = (v.labels && v.labels.gender) || ''
                                  const labelAccent = (v.labels && v.labels.accent) || (v.verified_languages && v.verified_languages[0] && v.verified_languages[0].accent) || ''
                                  const parts = []
                                  if (labelLang) parts.push(getLanguageDisplayName(labelLang))
                                  if (genderLabel) parts.push(genderLabel)
                                  if (labelAccent) parts.push(labelAccent)
                                  if (v.category) parts.push(v.category)
                                  return parts.join(' • ')
                                })()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {v.preview_url ? (
                                playingIvrId === `eleven-${idKey}` ? (
                                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); playElevenPreview(v) }} aria-label="stop">
                                    <CIcon icon={cilMediaStop} />
                                  </IconButton>
                                ) : (
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); playElevenPreview(v) }} aria-label="play">
                                    <CIcon icon={cilMediaPlay} />
                                  </IconButton>
                                )
                              ) : null}
                              {isSelected ? (
                                <IconButton size="small" color="success" disabled aria-label="selected">
                                  <CIcon icon={cilCheck} />
                                </IconButton>
                              ) : (
                                <IconButton size="small" color="primary" onClick={async (e) => {
                                  e.stopPropagation()
                                  const vid = idKey
                                  const currentBusinessId = businessId || localStorage.getItem('businessId') || ''
                                  try {
                                    setSavingVoiceSettings(true)
                                    if (currentBusinessId && vid) {
                                      const endpoint = `/api/voice-settings/${encodeURIComponent(currentBusinessId)}`
                                      await apiCall(endpoint, 'POST', { voiceId: vid })
                                      try {
                                        const perKey = currentBusinessId ? `elevenVoiceId_${currentBusinessId}` : 'elevenVoiceId'
                                        localStorage.setItem(perKey, vid)
                                      } catch (e) {}
                                    }
                                    setSelectedElevenVoiceId(vid)
                                    setVoiceNameSetting(v.name || '')
                                    setVoiceAccentSetting((v.verified_languages && v.verified_languages[0] && v.verified_languages[0].locale) || '')
                                    setVoiceGenderSetting((v.labels && v.labels.gender) || '')
                                  } catch (err) {
                                    console.error('Failed to save selected voice for business', err)
                                  } finally {
                                    setSavingVoiceSettings(false)
                                  }
                                }} aria-label="select">
                                  <CIcon icon={cilCheck} />
                                </IconButton>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      )
                    })}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        )}
        </Box>
      </Paper>
    </Box>
  )
}

export default IVRManagement