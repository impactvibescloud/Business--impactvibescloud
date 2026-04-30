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
  Card,
  CardHeader,
  CardContent,
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
  const [transferNumber, setTransferNumber] = useState('')
  const [transferStatus, setTransferStatus] = useState('idle') // idle, transferring, transferred, failed
  const [incomingSession, setIncomingSession] = useState(null)
  const [incomingCallInfo, setIncomingCallInfo] = useState(null)
  // Caller-ID picker state: list of DIDs assigned to the logged-in user's
  // extension, plus the currently selected one. Switching the value calls
  // PUT /numbers/my-caller-id which overwrites the `agent/<ext>` ASTDB key.
  const [myNumbers, setMyNumbers] = useState([])
  const [callerId, setCallerId] = useState('')
  const [callerIdSaving, setCallerIdSaving] = useState(false)
  const durationIntervalRef = React.useRef(null)

  useEffect(() => {
    let cancelled = false
    const loadMyNumbers = async () => {
      try {
        const res = await apiCall('/numbers/my-numbers', 'GET')
        if (cancelled) return
        const list = Array.isArray(res?.data) ? res.data : []
        setMyNumbers(list)
        // Pre-select whatever the server currently has as the agent's
        // outbound CID. We don't have a "read agent/<ext>" endpoint yet, so
        // fall back to the first DID — which mirrors the dialplan default.
        if (list.length > 0) setCallerId((prev) => prev || list[0].number)
      } catch (err) {
        if (!cancelled) console.warn('[WebPhoneDialer] Failed to load my-numbers:', err)
      }
    }
    loadMyNumbers()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCallerIdChange = async (newNumber) => {
    if (!newNumber || newNumber === callerId) return

    // Optimistically update UI so selection feels instant. Revert on failure.
    const previous = callerId
    setError(null)
    setCallerId(newNumber)
    setCallerIdSaving(true)
    try {
      await apiCall('/numbers/my-caller-id', 'PUT', { number: newNumber })
      // success — nothing else to do since UI already updated
    } catch (err) {
      // Revert optimistic update on failure and surface error
      setCallerId(previous)
      const msg = err?.response?.data?.message || err?.message || 'Failed to update caller-ID'
      setError(msg)
    } finally {
      setCallerIdSaving(false)
    }
  }

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

  // Listen for incoming calls
  useEffect(() => {
    if (!ua) return

    const handleIncomingCall = (evt) => {
      const session = evt.session
      const fromUri = session.request.headers?.From ? session.request.headers.From[0].uri : 'Unknown'
      const fromName = session.request.headers?.From ? session.request.headers.From[0].name || 'Unknown' : 'Unknown'
      const phoneNumber = fromUri.replace(/[^0-9]/g, '') || fromUri

      console.log('[WebPhoneDialer] Incoming call from:', phoneNumber)

      setIncomingSession(session)
      setIncomingCallInfo({
        from: phoneNumber,
        fromName: fromName,
        timestamp: new Date(),
      })

      // Setup event listeners for incoming session
      if (session && typeof session.on === 'function') {
        session.on('confirmed', () => {
          console.debug('[WebPhoneDialer] Incoming call confirmed')
          setCallStatus('connected')
        })

        session.on('ended', () => {
          console.debug('[WebPhoneDialer] Incoming call ended')
          setIncomingSession(null)
          setIncomingCallInfo(null)
          setCallStatus('idle')
        })

        session.on('failed', (data) => {
          console.error('[WebPhoneDialer] Incoming call failed:', data)
          setIncomingSession(null)
          setIncomingCallInfo(null)
          setCallStatus('idle')
        })
      }
    }

    ua.on('newRTC', handleIncomingCall)

    return () => {
      ua.removeListener('newRTC', handleIncomingCall)
    }
  }, [ua])

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

  const initiateTransfer = async () => {
    if (!callSession) {
      setError('No active call to transfer')
      return
    }

    if (!transferNumber.trim()) {
      setError('Please enter a number to transfer to')
      return
    }

    try {
      setTransferStatus('transferring')
      setError(null)

      // Clean the transfer number
      const cleanNumber = transferNumber.replace(/[^0-9+*#]/g, '')
      const transferTarget = `sip:${cleanNumber}@${sipDomain}`

      console.log('[WebPhoneDialer] Initiating transfer to:', transferTarget)

      // Use the refer method for SIP REFER (attended/blind transfer)
      if (typeof callSession.refer === 'function') {
        callSession.refer(transferTarget, {
          onNotify: (request) => {
            const statusLine = request.body ? request.body.split('\n')[0] : ''
            if (statusLine.includes('100 Trying') || statusLine.includes('100')) {
              console.debug('[WebPhoneDialer] Transfer in progress')
              setTransferStatus('transferring')
            } else if (statusLine.includes('200') || statusLine.includes('OK')) {
              console.debug('[WebPhoneDialer] Transfer successful')
              setTransferStatus('transferred')
              // Auto-hangup after successful transfer
              setTimeout(() => {
                hangupCall()
                setTransferNumber('')
                setTransferStatus('idle')
              }, 1000)
            } else {
              console.warn('[WebPhoneDialer] Transfer status:', statusLine)
            }
          }
        })
      } else {
        // Fallback: terminate current call and dial the transfer number
        console.warn('[WebPhoneDialer] REFER method not available, using fallback method')
        callSession.terminate()
        setTransferStatus('transferred')
        setTimeout(() => {
          setTransferNumber('')
          setTransferStatus('idle')
        }, 1000)
      }
    } catch (err) {
      console.error('[WebPhoneDialer] Transfer failed:', err)
      setError(`Transfer failed: ${String(err.message || err)}`)
      setTransferStatus('failed')
    }
  }

  const handleTransferKeyPress = (e) => {
    if (e.key === 'Enter' && callStatus === 'connected' && transferStatus === 'idle') {
      initiateTransfer()
    }
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

  const acceptIncomingCall = async () => {
    if (!incomingSession) return

    try {
      setError(null)

      // Request microphone access
      let userLocalStream = null
      try {
        console.log('[WebPhoneDialer] Requesting microphone for incoming call...')
        userLocalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        setLocalStream(userLocalStream)
        console.log('[WebPhoneDialer] Microphone access granted for incoming')
      } catch (micErr) {
        console.warn('[WebPhoneDialer] Microphone access failed:', micErr)
        setError('Microphone access denied. Call will be audio-out-only.')
      }

      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          iceTransportPolicy: 'all',
        },
        ...(userLocalStream && { mediaStream: userLocalStream }),
      }

      incomingSession.accept(options)
      setCallSession(incomingSession)
      setCallStatus('connected')
      setIncomingCallInfo(null)
    } catch (err) {
      console.error('[WebPhoneDialer] Accept call failed:', err)
      setError(`Accept failed: ${String(err.message || err)}`)
    }
  }

  const rejectIncomingCall = () => {
    if (!incomingSession) return

    try {
      console.log('[WebPhoneDialer] Rejecting incoming call')
      incomingSession.reject()
      setIncomingSession(null)
      setIncomingCallInfo(null)
    } catch (err) {
      console.error('[WebPhoneDialer] Reject call failed:', err)
      setError(`Reject failed: ${String(err.message || err)}`)
    }
  }

  const selectedAgentName = dialMode === 'agent' && selectedAgent ? agents.find((a) => a.id === selectedAgent)?.name : ''

  const keypadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ]

  const handleKeypadClick = (digit) => {
    if (dialMode === 'custom' && callStatus === 'idle') {
      setDialNumber(dialNumber + digit)
    }
  }

  const handleBackspace = () => {
    if (dialMode === 'custom' && callStatus === 'idle') {
      setDialNumber(dialNumber.slice(0, -1))
    }
  }

  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
              Dialer
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {supervisorNumber && (
                <Chip label={supervisorNumber} size="small" color="primary" variant="outlined" />
              )}
              <Chip
                label={regStatus === 'registered' ? 'Online' : regStatus === 'connecting' ? 'Connecting' : 'Offline'}
                size="small"
                color={regStatus === 'registered' ? 'success' : regStatus === 'connecting' ? 'warning' : 'error'}
                variant="filled"
              />
            </Box>
          </Box>
        }
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Incoming Call Alert */}
        {incomingCallInfo && (
          <Alert severity="info" sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Incoming Call
                </Typography>
                <Typography variant="body2">
                  From: {incomingCallInfo.fromName || incomingCallInfo.from}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={acceptIncomingCall}
                  sx={{ fontWeight: 600 }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={rejectIncomingCall}
                  sx={{ fontWeight: 600 }}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          </Alert>
        )}

        {/* Call Duration */}
        {callStatus !== 'idle' && (
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Duration
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
              {formatDuration(callDuration)}
            </Typography>
          </Box>
        )}

        {/* Display Screen */}
        <Box
          sx={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 1.5,
            p: 2,
            textAlign: 'center',
            minHeight: 60,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
            {callStatus === 'idle'
              ? dialMode === 'agent'
                ? 'Selected Agent'
                : 'Phone Number'
              : callStatus === 'dialing'
              ? 'Dialing'
              : callStatus === 'ringing'
              ? 'Ringing'
              : 'Connected'}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#111827',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              minHeight: 32,
            }}
          >
            {callStatus === 'idle'
              ? dialMode === 'agent'
                ? selectedAgentName || '—'
                : dialNumber || '—'
              : formatDuration(callDuration)}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ fontSize: '0.9rem' }}>
            {error}
          </Alert>
        )}

        {/* Caller-ID picker. Only shown when the agent has more than one DID
            assigned — single-DID users have nothing to choose. */}
        {callStatus === 'idle' && myNumbers.length > 1 && (
          <Box sx={{ position: 'relative' }}>
            <FormControl fullWidth size="small" disabled={callerIdSaving}>
              <InputLabel>Call from</InputLabel>
              <Select
                value={callerId}
                label="Call from"
                onChange={(e) => handleCallerIdChange(e.target.value)}
                renderValue={(val) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</Typography>
                    {callerIdSaving && <CircularProgress size={16} />}
                  </Box>
                )}
              >
                {myNumbers.map((n) => (
                  <MenuItem key={n._id || n.number} value={n.number}>
                    {n.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Mode Selector */}
        {callStatus === 'idle' && (
          <FormControl fullWidth size="small">
            <InputLabel>Dial Mode</InputLabel>
            <Select
              value={dialMode}
              onChange={(e) => {
                setDialMode(e.target.value)
                setError(null)
                setDialNumber('')
              }}
              label="Dial Mode"
            >
              <MenuItem value="custom">📱 Custom Number</MenuItem>
              <MenuItem value="agent">👤 Select Agent</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Custom Number with Keypad */}
        {dialMode === 'custom' && callStatus === 'idle' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="Tap keypad or enter number"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={regStatus !== 'registered'}
              size="small"
              slotProps={{
                input: {
                  style: {
                    fontSize: '1rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    fontFamily: 'monospace',
                  },
                },
              }}
            />

            {/* Dialpad Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
              {keypadButtons.map((row, rowIdx) =>
                row.map((digit) => (
                  <Button
                    key={digit}
                    variant="outlined"
                    onClick={() => handleKeypadClick(digit)}
                    disabled={regStatus !== 'registered'}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#111827',
                      borderColor: '#d1d5db',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                        borderColor: '#9ca3af',
                      },
                      '&:disabled': {
                        color: '#9ca3af',
                        borderColor: '#e5e7eb',
                      },
                    }}
                  >
                    {digit}
                  </Button>
                ))
              )}
            </Box>

            {/* Backspace Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleBackspace}
              disabled={regStatus !== 'registered' || dialNumber.length === 0}
              size="small"
              sx={{
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#9ca3af',
                },
              }}
            >
              ← Backspace
            </Button>
          </Box>
        )}

        {/* Agent Selection */}
        {dialMode === 'agent' && callStatus === 'idle' && (
          <Box>
            {agentsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Loading agents...
                </Typography>
              </Box>
            ) : agents.length === 0 ? (
              <Alert severity="info">No agents found</Alert>
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
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                          {agent.did || agent.extension || 'No DID/Ext'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* Dial/Hangup Button */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {callStatus === 'idle' ? (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={initiateDial}
              disabled={isDialDisabled()}
              startIcon={<PhoneIcon />}
              sx={{
                backgroundColor: regStatus === 'registered' ? '#10b981' : '#9ca3af',
                '&:hover': {
                  backgroundColor: regStatus === 'registered' ? '#059669' : '#9ca3af',
                },
                py: 1.2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {!ua || regStatus !== 'registered' ? 'Not Ready' : 'Dial'}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={hangupCall}
              startIcon={<CallEndIcon />}
              sx={{
                backgroundColor: '#ef4444',
                '&:hover': {
                  backgroundColor: '#dc2626',
                },
                py: 1.2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Hangup
            </Button>
          )}
        </Box>

        {/* Call Status Spinner */}
        {callStatus !== 'idle' && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {callStatus === 'dialing' && 'Dialing...'}
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'connected' && 'Call Connected'}
            </Typography>
          </Box>
        )}

        {/* Audio Element */}
        {callSession && (
          <Box sx={{ pt: 1.5, borderTop: '1px solid #e5e7eb' }}>
            <WebphoneAudio session={callSession} />
          </Box>
        )}

        {/* Transfer Section */}
        {callStatus === 'connected' && (
          <Box sx={{ pt: 2, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#111827' }}>
              Transfer Call
            </Typography>

            {transferStatus !== 'idle' && (
              <Alert
                severity={transferStatus === 'transferred' ? 'success' : transferStatus === 'failed' ? 'error' : 'info'}
                sx={{ mb: 1.5, fontSize: '0.85rem' }}
              >
                {transferStatus === 'transferring' && 'Transferring...'}
                {transferStatus === 'transferred' && 'Transfer successful'}
                {transferStatus === 'failed' && 'Transfer failed'}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Transfer To"
                placeholder="Phone number"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
                onKeyPress={handleTransferKeyPress}
                disabled={transferStatus !== 'idle'}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    style: {
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={initiateTransfer}
                disabled={transferStatus !== 'idle' || !transferNumber.trim()}
                sx={{
                  backgroundColor: '#0b5a47',
                  '&:hover': {
                    backgroundColor: '#084c3f',
                  },
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                Transfer
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default WebPhoneDialer

