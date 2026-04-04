import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import CallEndIcon from '@mui/icons-material/CallEnd'
import WebphoneAudio from './WebphoneAudio'
import { apiCall } from '../../config/api'

/**
 * WebPhoneDialer component
 * Props:
 * - ua: JsSIP User Agent instance
 * - regStatus: Registration status string
 * - sipDomain: SIP domain for calls
 * - businessId: Business ID for fetching agents
 * - supervisorNumber: Supervisor phone number to display
 * - onCallStateChange: Optional callback when call state changes
 */
const WebPhoneDialer = ({ ua, regStatus, sipDomain = 'pbx.justconnect.biz', businessId, supervisorNumber, onCallStateChange }) => {
  const [dialMode, setDialMode] = useState('custom') // 'custom' or 'agent'
  const [dialNumber, setDialNumber] = useState('')
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [callSession, setCallSession] = useState(null)
  const [callStatus, setCallStatus] = useState('idle') // idle, dialing, ringing, connected, ended
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const durationIntervalRef = React.useRef(null)

  // Update parent component on call state change
  useEffect(() => {
    onCallStateChange && onCallStateChange({ status: callStatus, session: callSession })
  }, [callStatus, callSession, onCallStateChange])

  // Fetch agents when mode changes to 'agent' or businessId changes
  useEffect(() => {
    if (dialMode === 'agent' && businessId) {
      fetchAgents()
    }
  }, [dialMode, businessId])

  // Timer for call duration
  useEffect(() => {
    if (callStatus === 'connected' && durationIntervalRef.current === null) {
      setCallDuration(0)
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((d) => d + 1)
      }, 1000)
    } else if (callStatus !== 'connected' && durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }
  }, [callStatus])

  const fetchAgents = async () => {
    if (!businessId) return
    setAgentsLoading(true)
    try {
      const res = await apiCall(`/branch/${encodeURIComponent(businessId)}/branches`, 'GET')
      const list = res.data || res.branches || res
      const formatted = Array.isArray(list) ? list : list.data || []
      const agentsArr = formatted.map((branch) => {
        const name = branch.user?.name || branch.branchName || branch.manager?.name || 'Unknown'
        const did =
          (Array.isArray(branch.didNumbers) && branch.didNumbers[0]) ||
          branch.didNumber ||
          branch.did ||
          branch.user?.didNumber ||
          ''
        const extension = branch.extension || branch.user?.extension || ''
        return {
          id: branch._id || branch.id,
          name,
          did,
          extension,
          phone: branch.user?.phone || branch.phone || '',
          raw: branch,
        }
      })
      setAgents(agentsArr)
      setSelectedAgent('')
    } catch (err) {
      console.error('[WebPhoneDialer] Failed to fetch agents:', err)
      setAgents([])
      setError('Failed to load agents list')
    } finally {
      setAgentsLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const initiateDial = async () => {
    setError(null)

    let numberToDial = ''

    if (dialMode === 'custom') {
      if (!dialNumber.trim()) {
        setError('Please enter a number to dial')
        return
      }
      numberToDial = dialNumber
    } else if (dialMode === 'agent') {
      if (!selectedAgent) {
        setError('Please select an agent to call')
        return
      }
      const agent = agents.find((a) => a.id === selectedAgent)
      if (!agent) {
        setError('Selected agent not found')
        return
      }
      // Use DID if available, otherwise use extension
      numberToDial = agent.did || agent.extension
      if (!numberToDial) {
        setError(`Agent ${agent.name} has no DID or extension configured`)
        return
      }
    }

    if (!ua) {
      setError('SIP UA not ready')
      return
    }

    if (regStatus !== 'registered') {
      setError('Not registered with SIP server')
      return
    }

    try {
      setCallStatus('dialing')

      // Request microphone access
      let userLocalStream = null
      try {
        console.log('[WebPhoneDialer] Requesting microphone access...')
        userLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        setLocalStream(userLocalStream)
        console.log('[WebPhoneDialer] Microphone access granted')
      } catch (micErr) {
        console.warn('[WebPhoneDialer] Microphone access failed:', micErr)
        setError('Microphone access denied. Call will be audio-out-only.')
        // Continue anyway
      }

      // Build target
      const cleanNumber = numberToDial.replace(/[^0-9+*#]/g, '')
      const target = `sip:${cleanNumber}@${sipDomain}`

      console.log('[WebPhoneDialer] Initiating call to:', target)

      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          iceTransportPolicy: 'all',
        },
        ...(userLocalStream && { mediaStream: userLocalStream }),
      }

      const session = ua.call(target, options)

      // Setup event listeners
      const cleanup = () => {
        if (userLocalStream) {
          userLocalStream.getTracks().forEach((track) => {
            try {
              track.stop()
            } catch (e) {}
          })
        }
        setLocalStream(null)
        setCallSession(null)
        setCallStatus('idle')
      }

      if (session && typeof session.on === 'function') {
        session.on('progress', () => {
          console.debug('[WebPhoneDialer] Call in progress')
          setCallStatus('ringing')
        })

        session.on('confirmed', () => {
          console.debug('[WebPhoneDialer] Call confirmed')
          setCallStatus('connected')
        })

        session.on('ended', () => {
          console.debug('[WebPhoneDialer] Call ended')
          cleanup()
        })

        session.on('failed', (data) => {
          const errorMsg = data?.cause || (data?.message && data.message.reason) || 'Unknown error'
          console.error('[WebPhoneDialer] Call failed:', errorMsg)
          setError(`Call failed: ${errorMsg}`)
          cleanup()
        })
      }

      setCallSession(session)
    } catch (err) {
      console.error('[WebPhoneDialer] Dial failed:', err)
      setError(`Dial failed: ${String(err.message || err)}`)
      setCallStatus('idle')
    }
  }

  const hangupCall = () => {
    if (callSession && typeof callSession.terminate === 'function') {
      try {
        callSession.terminate()
      } catch (e) {
        console.warn('[WebPhoneDialer] Error terminating call:', e)
      }
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {}
      })
    }

    setLocalStream(null)
    setCallSession(null)
    setCallStatus('idle')
    setError(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && callStatus === 'idle') {
      initiateDial()
    }
  }

  const isDialDisabled = () => {
    if (callStatus !== 'idle' || regStatus !== 'registered' || !ua) return true
    if (dialMode === 'custom') return !dialNumber.trim()
    if (dialMode === 'agent') return !selectedAgent
    return true
  }

  const selectedAgentName = dialMode === 'agent' && selectedAgent ? agents.find((a) => a.id === selectedAgent)?.name : ''

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Webphone
        </Typography>
        {supervisorNumber && (
          <Chip
            label={supervisorNumber}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Status:
        </Typography>
        <Chip
          label={regStatus}
          size="small"
          color={regStatus === 'registered' ? 'success' : regStatus === 'connected' ? 'info' : regStatus === 'connecting' ? 'warning' : 'default'}
          variant="outlined"
        />
      </Box>

      {/* Call Status */}
      {callSession && (
        <Box
          sx={{
            p: 2,
            backgroundColor: '#f0f9ff',
            borderRadius: 1,
            border: '1px solid #e0e7ff',
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Call Status:</strong> {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            <strong>Duration:</strong> {formatDuration(callDuration)}
          </Typography>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ fontSize: '0.9rem' }}>
          {error}
        </Alert>
      )}

      {/* Mode Selector (Custom or Agent) */}
      <FormControl fullWidth size="small">
        <InputLabel>Dial Mode</InputLabel>
        <Select
          value={dialMode}
          onChange={(e) => {
            setDialMode(e.target.value)
            setError(null)
          }}
          label="Dial Mode"
          disabled={callStatus !== 'idle'}
        >
          <MenuItem value="custom">Custom Number</MenuItem>
          <MenuItem value="agent">Select Agent</MenuItem>
        </Select>
      </FormControl>

      {/* Custom Number Input */}
      {dialMode === 'custom' && (
        <Box>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="Enter number to dial"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={callStatus !== 'idle' || regStatus !== 'registered'}
            slotProps={{
              input: {
                style: { fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.1em' },
              },
            }}
            sx={{
              '& .MuiInput-underline:before': { borderBottomColor: '#d1d5db' },
              '& .MuiInput-underline:hover:before': { borderBottomColor: '#9ca3af' },
            }}
          />
        </Box>
      )}

      {/* Agent Selection Dropdown */}
      {dialMode === 'agent' && (
        <Box>
          {agentsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ color: '#666' }}>
                Loading agents...
              </Typography>
            </Box>
          ) : agents.length === 0 ? (
            <Alert severity="info">No agents found for your business</Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Agent</InputLabel>
              <Select
                value={selectedAgent}
                onChange={(e) => {
                  setSelectedAgent(e.target.value)
                  setError(null)
                }}
                label="Select Agent"
                disabled={callStatus !== 'idle'}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {agent.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {agent.did || agent.extension || 'No DID/Ext'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Selected Agent Info */}
          {selectedAgentName && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0fdf4', borderRadius: 1, border: '1px solid #d1fae5' }}>
              <Typography variant="body2" sx={{ color: '#065f46' }}>
                <strong>Selected:</strong> {selectedAgentName}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Dial/Hangup Buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {callStatus === 'idle' ? (
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PhoneIcon />}
            onClick={initiateDial}
            disabled={isDialDisabled()}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': { backgroundColor: '#d1d5db', color: '#9ca3af' },
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            {!ua || regStatus !== 'registered' ? 'Not Ready' : 'Dial'}
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CallEndIcon />}
            onClick={hangupCall}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            Hangup
          </Button>
        )}
      </Box>

      {/* Call Status with spinner */}
      {callStatus !== 'idle' && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ color: '#666' }}>
            {callStatus === 'dialing' && 'Dialing...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && 'Connected'}
          </Typography>
        </Box>
      )}

      {/* Audio element for call */}
      {callSession && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
            Call Audio
          </Typography>
          <WebphoneAudio session={callSession} />
        </Box>
      )}
    </Paper>
  )
}

export default WebPhoneDialer

