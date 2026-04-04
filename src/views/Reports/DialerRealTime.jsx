import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Chip,
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { apiCall } from '../../config/api'

// Direction detector (kept for potential future use)
const detectDirection = (call) => {
  try {
    const leg = (call.legs && call.legs[0]) || call
    const raw = String(leg?.raw || call?.raw || '').toLowerCase()
    const tokens = Array.isArray(leg?.tokens || call?.tokens) ? (leg?.tokens || call?.tokens || []) : []
    const phoneRegex = /^\+?\d{7,15}$/
    const phoneTokens = tokens.filter((t) => typeof t === 'string' && phoneRegex.test(t))
    if (phoneTokens.length > 0) return 'Outgoing'
    if (/\bincoming\b/.test(raw) || /from-external/.test(raw)) return 'Inbound'
    if (/\bdial\b|outbound|outgoing/.test(raw)) return 'Outgoing'
  } catch (e) {}
  return 'Inbound'
}

const StatCard = ({ value, label, icon: Icon }) => {
  const displayValue = value === '-' || value === null || value === undefined ? 0 : value
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #d1d5db' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 1.5, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, backgroundColor: '#eef2f6', borderRadius: '50%' }}>
            <Icon sx={{ fontSize: '1.5rem', color: '#6366f1' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', fontSize: '1.75rem', lineHeight: 1 }}>
              {displayValue}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

const DialerRealTime = () => {
  const [stats, setStats] = useState([
    { value: 0, label: 'Active Calls' },
    { value: 0, label: 'Calls Today' },
    { value: 0, label: 'Outgoing Answered' },
    { value: 0, label: 'Outgoing Missed' },
    { value: 0, label: 'Incoming Answered' },
    { value: 0, label: 'Incoming Missed' }
  ])
  const [liveCalls, setLiveCalls] = useState([])
  const [actualLiveCalls, setActualLiveCalls] = useState([])
  const livePollingRef = React.useRef(null)

  const fetchLiveCalls = async () => {
    try {
      const bId = await fetchBusinessIdIfNeeded()
      if (!bId) {
        setActualLiveCalls([])
        return
      }
      const res = await apiCall(`/asterisk/livecalls/${encodeURIComponent(bId)}`, 'GET')
      // Normalize response shapes (same approach as CallMonitor)
      const lCalls = Array.isArray(res.liveCalls) ? res.liveCalls : Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : [])
      setActualLiveCalls(lCalls)
    } catch (err) {
      console.error('DialerRealTime fetchLiveCalls failed', err)
      // don't clear existing liveCalls on transient errors; keep current data until a successful empty response arrives
    }
  }

  const fetchBusinessIdIfNeeded = async () => {
    const b = localStorage.getItem('businessId') || ''
    if (b) return b
    try {
      const ud = await apiCall('/v1/user/details', 'GET')
      const u = ud?.user || ud?.data || ud
      if (u && u.businessId) {
        try { localStorage.setItem('businessId', u.businessId) } catch (e) {}
        return u.businessId
      }
    } catch (e) {}
    return ''
  }
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchDialer = async () => {
      try {
        setIsRefreshing(true)
        const businessId = await fetchBusinessIdIfNeeded()
        if (!businessId) {
          setLiveCalls([])
          return
        }
        const res = await apiCall(`/performance/agents?businessId=${encodeURIComponent(businessId)}&period=today`)
        if (process.env.NODE_ENV === 'development') console.debug('DialerRealTime: performance/agents response', res)

        // Normalize response shapes
        const agentData = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.agents) ? res.agents : []))
        
        // Set live calls to agent data for display
        setLiveCalls(agentData)

        // Calculate aggregate stats from agent data
        const totalHandledCalls = agentData.reduce((sum, a) => sum + (a.handledCalls || 0), 0)
        const totalAnsweredCalls = agentData.reduce((sum, a) => sum + (a.answeredCalls || 0), 0)
        const totalMissedCalls = agentData.reduce((sum, a) => sum + (a.missedCalls || 0), 0)
        const totalRejectedCalls = agentData.reduce((sum, a) => sum + (a.rejectedCalls || 0), 0)
        const totalFailedCalls = agentData.reduce((sum, a) => sum + (a.failedCalls || 0), 0)
        const onlineAgents = agentData.filter(a => a.liveStatus === 'online').length

        if (!mounted) return
        setStats([
          { value: 0, label: 'Active Calls' }, // Will be set from actualLiveCalls
          { value: totalHandledCalls, label: 'Calls Today' },
          { value: totalAnsweredCalls, label: 'Outgoing Answered' },
          { value: totalMissedCalls, label: 'Outgoing Missed' },
          { value: totalRejectedCalls, label: 'Incoming Answered' },
          { value: totalFailedCalls, label: 'Incoming Missed' }
        ])
        setLastUpdated(new Date())
      } catch (e) {
        console.error('DialerRealTime fetchDialer failed', e)
      } finally {
        if (mounted) setIsRefreshing(false)
      }
    }

    // Initial fetch for stats
    fetchDialer()
    // Set up auto-refresh every 5 seconds for stats
    const id = setInterval(fetchDialer, 5000)
    // Initial fetch for live calls and poll like CallMonitor
    fetchLiveCalls()
    livePollingRef.current = setInterval(fetchLiveCalls, 5000)
    return () => { mounted = false; clearInterval(id); if (livePollingRef.current) clearInterval(livePollingRef.current) }
  }, [])

  return (
    <Box className="page-container" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Dialer Real Time Report</h3>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {isRefreshing ? 'Refreshing...' : (lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Not updated yet')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const s = stats[i]
          const value = (s.label === 'Active Calls') ? actualLiveCalls.length : s.value
          const iconMap = {
            'Active Calls': PhoneIcon,
            'Calls Today': CalendarTodayIcon,
            'Outgoing Answered': CheckCircleIcon,
            'Outgoing Missed': CancelIcon,
            'Incoming Answered': CheckCircleIcon,
            'Incoming Missed': CancelIcon,
          }
          return (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <StatCard value={value} label={s.label} icon={iconMap[s.label] || PhoneIcon} />
            </Grid>
          )
        })}
      </Grid>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <h5 style={{ margin: 0, color: '#111827', fontWeight: 600 }}>Active Calls / Live Calls</h5>
      </Box>

      <Paper variant="outlined" sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
        <Table size="small" sx={{ '& th, & td': { py: 1, px: 1.5, lineHeight: 1.15 }, '& td': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
              <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>DID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actualLiveCalls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#6b7280' }}>
                  No active calls
                </TableCell>
              </TableRow>
            ) : (
              actualLiveCalls.map((c, idx) => (
                <TableRow key={`${c.channel || c.groupId || idx}-${idx}`} hover>
                  <TableCell sx={{ fontSize: '0.9rem' }}>
                    {(() => {
                      const dir = detectDirection(c)
                      return (
                        <Chip
                          icon={dir === 'Outgoing' ? <CancelIcon /> : <CheckCircleIcon />}
                          label={dir}
                          size="small"
                          sx={{
                            backgroundColor: dir === 'Outgoing' ? '#e3f2fd' : dir === 'Inbound' ? '#f3e5f5' : '#f5f5f5',
                            color: dir === 'Outgoing' ? '#1565c0' : dir === 'Inbound' ? '#6a1b9a' : '#616161',
                            fontWeight: 500,
                          }}
                        />
                      )
                    })()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>{c.channel || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>
                    <Chip
                      label={c.status || '-'}
                      size="small"
                      sx={{
                        backgroundColor: String(c.status || '').toLowerCase() === 'up' ? '#c8e6c9' : String(c.status || '').toLowerCase() === 'ring' ? '#ffe0b2' : '#e0e0e0',
                        color: String(c.status || '').toLowerCase() === 'up' ? '#2e7d32' : String(c.status || '').toLowerCase() === 'ring' ? '#f57c00' : '#424242',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>{c.duration || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>{c.did?.number || c.tokens?.[3] || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>{c.assignedAgent?.name || c.assignedAgent?.email || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default DialerRealTime
