import React, { useState, useEffect, useRef } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CButton, CFormInput, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilX } from '@coreui/icons'
import SipRegistration from './sip/SipRegistration'
import WebphoneAudio from './sip/WebphoneAudio'
import './WebphoneDialerModal.css'

const WebphoneDialerModal = ({ visible, onClose }) => {
  const [dialInput, setDialInput] = useState('')
  const [regStatus, setRegStatus] = useState('disconnected')
  const [ua, setUa] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [calling, setCalling] = useState(false)
  const [callStats, setCallStats] = useState(null)

  // SIP config (hardcoded for now - can be fetched from API)
  const sipCfg = {
    sip_domain: 'pbx.justconnect.biz',
    extension: '1036',
    sip_password: 'secure_password_1036',
    ws_port: 8089,
    ws_path: '/ws',
    wss: true,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }

  const handleDial = (digit) => {
    if (activeSession) {
      // Send DTMF tone during active call
      try {
        activeSession.sendDTMF(digit)
      } catch (err) {
        console.warn('Failed to send DTMF', err)
      }
    } else {
      // Add digit to dial input
      setDialInput((prev) => prev + digit)
    }
  }

  const handleBackspace = () => {
    setDialInput((prev) => prev.slice(0, -1))
  }

  const handleCall = () => {
    const phoneNumber = dialInput.trim()
    if (!phoneNumber) {
      alert('Please enter a number to call')
      return
    }
    if (!ua || regStatus !== 'registered') {
      alert('SIP not registered. Please wait for registration.')
      return
    }

    setCalling(true)

    try {
      const target = /^sip:/.test(phoneNumber) ? phoneNumber : `sip:${phoneNumber}@${sipCfg.sip_domain}`

      const eventHandlers = {
        progress: () => {
          console.log('Call in progress')
        },
        failed: () => {
          console.error('Call failed')
          setCalling(false)
          setActiveSession(null)
          setCallStats(null)
        },
        started: (session) => {
          console.log('Call started')
          setActiveSession(session)
          setCallStats({ startTime: Date.now(), remoteTarget: phoneNumber })
        },
        ended: () => {
          console.log('Call ended')
          setCalling(false)
          setActiveSession(null)
          setCallStats(null)
          setDialInput('')
        },
      }

      const options = {
        eventHandlers,
        pcConfig: { iceServers: sipCfg.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] },
      }

      ua.call(target, options)
    } catch (err) {
      console.error('Failed to initiate call', err)
      setCalling(false)
      alert('Failed to initiate call')
    }
  }

  const handleHangup = () => {
    if (activeSession) {
      try {
        activeSession.terminate()
      } catch (err) {
        console.warn('Failed to terminate call', err)
      }
      setActiveSession(null)
      setCallStats(null)
    }
    setCalling(false)
  }

  const handleClose = () => {
    if (activeSession) {
      handleHangup()
    }
    setDialInput('')
    onClose()
  }

  const isRegistered = regStatus === 'registered'

  return (
    <>
      <CModal
        visible={visible}
        onClose={handleClose}
        backdrop="static"
        keyboard={false}
        className="webphone-modal"
        size="sm"
        alignment="center"
      >
        <CModalHeader closeButton={false}>
          <CModalTitle style={{ fontSize: '1rem' }}>Webphone Dialer</CModalTitle>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={handleClose}
          ></button>
        </CModalHeader>
        <CModalBody style={{ padding: '8px' }}>
          {/* SIP Registration (hidden, just for initialization) */}
          {!ua && (
            <SipRegistration
              sipConfig={sipCfg}
              enableDebug={false}
              onRegistrationStatus={setRegStatus}
              onUaReady={setUa}
            />
          )}

          {/* Status Badge */}
          <div className="webphone-status">
            <CBadge
              color={
                regStatus === 'registered'
                  ? 'success'
                  : regStatus === 'connecting'
                  ? 'warning'
                  : 'danger'
              }
            >
              {regStatus === 'registered' ? 'Connected' : regStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </CBadge>
            {regStatus === 'registered' && <span className="ext-label">Ext: {sipCfg.extension}</span>}
          </div>

          {/* Remote Audio */}
          {activeSession && <WebphoneAudio session={activeSession} />}

          {/* Dial Input */}
          <div className="webphone-input-group">
            <CFormInput
              type="text"
              placeholder="Enter phone number"
              value={dialInput}
              onChange={(e) => setDialInput(e.target.value)}
              disabled={calling}
              className="webphone-input"
            />
          </div>

          {/* Keypad */}
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                className="keypad-btn"
                onClick={() => handleDial(digit)}
                disabled={!isRegistered && !activeSession}
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Backspace */}
          <button
            className="backspace-btn"
            onClick={handleBackspace}
            disabled={!dialInput || calling}
          >
            ← Backspace
          </button>

          {/* Call Action */}
          {!activeSession ? (
            <CButton
              color="success"
              size="lg"
              className="call-btn"
              onClick={handleCall}
              disabled={!isRegistered || !dialInput || calling}
            >
              <CIcon icon={cilPhone} /> Call
            </CButton>
          ) : (
            <CButton
              color="danger"
              size="lg"
              className="hangup-btn"
              onClick={handleHangup}
            >
              <CIcon icon={cilX} /> Hangup
            </CButton>
          )}

          {/* Call Duration */}
          {activeSession && callStats && (
            <div className="call-info">
              <div className="call-recipient">Calling: {callStats.remoteTarget}</div>
              <CallDuration startTime={callStats.startTime} />
            </div>
          )}
        </CModalBody>
      </CModal>
    </>
  )
}

// Helper component to display call duration
const CallDuration = ({ startTime }) => {
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return <div className="call-duration">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
}

export default WebphoneDialerModal
