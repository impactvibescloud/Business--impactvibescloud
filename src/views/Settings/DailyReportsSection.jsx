import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import SaveIcon from '@mui/icons-material/Save'
import RefreshIcon from '@mui/icons-material/Refresh'
import { apiCall } from '../../config/api'

// 60-odd common IANA timezones — keeps the picker short while covering
// the cases that matter. Users can type anything valid; we don't validate
// against this list server-side (any IANA tz string works).
const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Africa/Johannesburg',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
]

const DailyReportsSection = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [config, setConfig] = useState({
    enabled: false,
    sendTime: '09:00',
    timezone: 'Asia/Kolkata',
    recipients: [],
    reports: {
      callLogs: true,
      activities: true,
      leads: true,
      followUps: true,
    },
    lastSentAt: null,
    lastError: '',
  })
  const [newRecipient, setNewRecipient] = useState('')

  const loadConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await apiCall('/daily-reports/config', 'GET')
      if (r?.success) {
        const cfg = r.config || {}
        setConfig((prev) => ({
          ...prev,
          ...cfg,
          recipients: Array.isArray(cfg.recipients) ? cfg.recipients : [],
          reports: cfg.reports || prev.reports,
        }))
      } else {
        setError(r?.message || 'Failed to load config')
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim())

  const addRecipient = () => {
    const v = String(newRecipient || '').trim()
    if (!isEmail(v)) {
      setError(`"${v}" is not a valid email`)
      return
    }
    if (config.recipients.includes(v)) {
      setNewRecipient('')
      return
    }
    setConfig((c) => ({ ...c, recipients: [...c.recipients, v] }))
    setNewRecipient('')
    setError(null)
  }

  const removeRecipient = (email) => {
    setConfig((c) => ({
      ...c,
      recipients: c.recipients.filter((e) => e !== email),
    }))
  }

  const saveConfig = async () => {
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      const payload = {
        enabled: !!config.enabled,
        sendTime: config.sendTime,
        timezone: config.timezone,
        recipients: config.recipients,
        reports: config.reports,
      }
      const r = await apiCall('/daily-reports/config', 'PUT', payload)
      if (r?.success) {
        setInfo('Saved')
        setConfig((c) => ({ ...c, ...r.config }))
      } else {
        setError(r?.message || 'Save failed')
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sendTestNow = async () => {
    setSending(true)
    setError(null)
    setInfo(null)
    try {
      // Building 4 Excel files + SMTP send can take 30s+ on cold start;
      // axios default 10s would fire spuriously. Give it 2 minutes.
      // Pass no window so the backend uses its default ("today" — same
      // as the scheduled send) — that way the test reflects what the
      // real automatic mail will look like.
      const r = await apiCall(
        '/daily-reports/send-now',
        'POST',
        {},
        { timeout: 120000 },
      )
      if (r?.success) {
        const recipients = (r.sentTo || []).join(', ')
        const files = (r.attachments || [])
          .map((a) => `${a.kind} (${a.rowCount} rows)`)
          .join(', ')
        setInfo(`Sent to ${recipients} — ${files || 'no rows in window'}`)
      } else {
        setError(r?.message || r?.error || 'Send failed')
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const setReport = (key, val) => {
    setConfig((c) => ({ ...c, reports: { ...c.reports, [key]: !!val } }))
  }

  return (
    <Card sx={{ border: '1px solid #e5e7eb' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
            Daily Reports — Email
          </Typography>
          <IconButton onClick={loadConfig} disabled={loading} title="Refresh">
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We'll email the business owner up to 4 Excel reports covering today's
          activity (from 00:00 in your timezone up to the moment the email
          fires), sent at the time you choose below. Pick the send time,
          timezone, additional recipients, and which reports to include.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}
        {config.lastError && !error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Last automatic send failed: {config.lastError}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <FormControlLabel
            control={
              <Switch
                checked={!!config.enabled}
                onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Enable daily report email
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  When ON, the reports will be sent automatically every day at the
                  configured time.
                </Typography>
              </Box>
            }
          />

          <Divider />

          {/* Time + timezone */}
          {(() => {
            // Parse "HH:MM" (24h, what the API stores) into 12h parts
            // for the three dropdowns. Round-trip back to "HH:MM" on
            // change so the API contract is unchanged.
            const [h24Str, mStr] = String(config.sendTime || '09:00').split(':')
            const h24 = Math.max(0, Math.min(23, parseInt(h24Str || '9', 10) || 0))
            const minute = Math.max(0, Math.min(59, parseInt(mStr || '0', 10) || 0))
            const period = h24 >= 12 ? 'PM' : 'AM'
            const hour12 = ((h24 + 11) % 12) + 1 // 0→12, 13→1, etc

            const composeSendTime = (h12, mm, ap) => {
              let h24Out = h12 % 12
              if (ap === 'PM') h24Out += 12
              return `${String(h24Out).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
            }
            return (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    select
                    label="Hour"
                    value={hour12}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        sendTime: composeSendTime(Number(e.target.value), minute, period),
                      }))
                    }
                    sx={{ minWidth: 90 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <MenuItem key={h} value={h}>
                        {h}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Minute"
                    value={minute}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        sendTime: composeSendTime(hour12, Number(e.target.value), period),
                      }))
                    }
                    sx={{ minWidth: 100 }}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <MenuItem key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="AM / PM"
                    value={period}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        sendTime: composeSendTime(hour12, minute, e.target.value),
                      }))
                    }
                    sx={{ minWidth: 90 }}
                  >
                    <MenuItem value="AM">AM</MenuItem>
                    <MenuItem value="PM">PM</MenuItem>
                  </TextField>
                </Stack>

                <TextField
                  select
                  label="Timezone"
                  value={config.timezone}
                  onChange={(e) => setConfig((c) => ({ ...c, timezone: e.target.value }))}
                  sx={{ minWidth: 240, flex: 1 }}
                  helperText={`Send time: ${hour12}:${String(minute).padStart(2, '0')} ${period} (${config.timezone})`}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            )
          })()}

          {/* Reports */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Reports to include
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { key: 'callLogs', label: 'Call Logs' },
                { key: 'activities', label: 'Status & Activities' },
                { key: 'leads', label: 'Leads' },
                { key: 'followUps', label: 'Follow-ups' },
              ].map((r) => (
                <Chip
                  key={r.key}
                  label={r.label}
                  color={config.reports?.[r.key] ? 'primary' : 'default'}
                  variant={config.reports?.[r.key] ? 'filled' : 'outlined'}
                  onClick={() => setReport(r.key, !config.reports?.[r.key])}
                  clickable
                />
              ))}
            </Stack>
          </Box>

          {/* Recipients */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Additional recipients
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              The business owner's email is always included automatically. Add
              extras here (e.g. operations lead, supervisor).
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                placeholder="user@example.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRecipient()
                  }
                }}
                sx={{ minWidth: 280 }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addRecipient}
                disabled={!newRecipient.trim()}
              >
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {config.recipients.map((e) => (
                <Chip
                  key={e}
                  label={e}
                  onDelete={() => removeRecipient(e)}
                  deleteIcon={<DeleteIcon />}
                  variant="outlined"
                />
              ))}
              {config.recipients.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No additional recipients yet.
                </Typography>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Status + actions */}
          {(config.lastSentAt || config.lastTestSentAt) && (
            <Stack spacing={0.25}>
              {config.lastSentAt && (
                <Typography variant="caption" color="text.secondary">
                  Last automatic send:{' '}
                  {new Date(config.lastSentAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Typography>
              )}
              {config.lastTestSentAt && (
                <Typography variant="caption" color="text.secondary">
                  Last test send:{' '}
                  {new Date(config.lastTestSentAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Typography>
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={saveConfig}
              disabled={saving}
            >
              Save settings
            </Button>
            <Button
              variant="outlined"
              startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
              onClick={sendTestNow}
              disabled={sending}
              title="Build today's reports right now and email them to the configured recipients."
            >
              Send a test now (today's data)
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default DailyReportsSection
