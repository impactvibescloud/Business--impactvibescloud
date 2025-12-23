import React, { useEffect, useRef } from 'react'
import JsSIP from 'jssip'

// Props: sipConfig, enableDebug, onRegistrationStatus, onUaReady
const SipRegistration = ({ sipConfig = {}, enableDebug = false, onRegistrationStatus = () => {}, onUaReady = () => {} }) => {
  const uaRef = useRef(null)

  useEffect(() => {
    if (!sipConfig || !sipConfig.extension || !sipConfig.sip_password || !sipConfig.sip_domain) {
      onRegistrationStatus && onRegistrationStatus('missing-config')
      return
    }

    const wsPath = sipConfig.ws_path || '/ws'
    const defaultPort = sipConfig.ws_port || (sipConfig.wss !== false ? 8089 : 8088)
    const proto = sipConfig.wss !== false ? 'wss' : 'ws'
    const socketUrlPrimary = `${proto}://${sipConfig.sip_domain}:${defaultPort}${wsPath}`

    const uri = `sip:${sipConfig.extension}@${sipConfig.sip_domain}`

    let connectionTimeout = null
    let triedFallback = false

    const buildUaConfig = (socket) => ({
      sockets: [socket],
      uri: uri,
      password: sipConfig.sip_password,
      register: true,
      session_timers: false,
      register_expires: sipConfig.register_expires || 600,
      pcConfig: { iceServers: sipConfig.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] },
    })

    const clearConnectionTimeout = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
        connectionTimeout = null
      }
    }

    const attemptFallback = () => {
      if (triedFallback) return
      triedFallback = true
      console.warn('SipRegistration: attempting fallback to same-origin websocket')
      // choose protocol based on page protocol to satisfy CSP 'self'
      const pageProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const fallbackUri = `${pageProto}://${window.location.host}${wsPath}`
      initUaWithSocket(fallbackUri, false)
    }

    const initUaWithSocket = (wsUri, allowFallback = true) => {
      try {
        // stop previous UA if exists
        if (uaRef.current) {
          try { uaRef.current.stop() } catch (e) {}
          uaRef.current = null
        }

        const socket = new JsSIP.WebSocketInterface(wsUri)
        const configuration = buildUaConfig(socket)

        if (enableDebug) {
          JsSIP.debug.enable('JsSIP:*')
        }

        const ua = new JsSIP.UA(configuration)
        uaRef.current = ua
        window.sipUA = ua

        ua.on('connecting', () => onRegistrationStatus && onRegistrationStatus('connecting'))
        ua.on('connected', () => onRegistrationStatus && onRegistrationStatus('connected'))
        ua.on('registered', () => {
          clearConnectionTimeout()
          onRegistrationStatus && onRegistrationStatus('registered')
          try { onUaReady && onUaReady(ua) } catch (e) { console.warn('onUaReady failed', e) }
        })
        ua.on('unregistered', () => onRegistrationStatus && onRegistrationStatus('unregistered'))
        ua.on('registrationFailed', (e) => {
          console.warn('JsSIP registration failed', e)
          onRegistrationStatus && onRegistrationStatus('failed')
        })

        ua.on('newRTCSession', (data) => {
          const session = data.session
          session.on('ended', () => console.debug('session ended', session))
          session.on('failed', () => console.debug('session failed', session))
        })

        // start UA and set a timeout to try fallback if nothing happens
        ua.start()
        onRegistrationStatus && onRegistrationStatus('connecting')

        clearConnectionTimeout()
        connectionTimeout = setTimeout(() => {
          console.warn('SipRegistration: connection timeout; no registration yet')
          if (allowFallback) attemptFallback()
        }, sipConfig.connection_timeout_ms || 5000)
      } catch (err) {
        console.error('Failed to initialize JsSIP UA with', wsUri, err)
        onRegistrationStatus && onRegistrationStatus('failed')
        if (!triedFallback && wsUri !== socketUrlPrimary) {
          // if primary failed, try fallback
          attemptFallback()
        }
      }
    }

    // kick off primary attempt
    initUaWithSocket(socketUrlPrimary, true)

    return () => {
      try {
        if (uaRef.current) {
          uaRef.current.stop()
          uaRef.current = null
        }
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sipConfig)])

  return null
}

export default SipRegistration
