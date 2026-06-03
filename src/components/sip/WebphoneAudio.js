import React, { useEffect, useRef } from 'react'

// Simple component to attach remote audio from a JsSIP session
const WebphoneAudio = ({ session }) => {
  const audioRef = useRef(null)

  useEffect(() => {
    if (!session || !audioRef.current) return

    const attachStream = () => {
      try {
        const pc = session.connection
        if (!pc) return
        // Newer APIs use getReceivers/getRemoteStreams
        const remoteStreams = pc.getRemoteStreams ? pc.getRemoteStreams() : []
        if (remoteStreams && remoteStreams.length) {
          audioRef.current.srcObject = remoteStreams[0]
          audioRef.current.play().catch(() => {})
          return
        }
        // Fallback: iterate receivers and build a stream
        const receivers = pc.getReceivers ? pc.getReceivers() : []
        if (receivers.length) {
          const ms = new MediaStream()
          receivers.forEach((r) => { if (r.track) ms.addTrack(r.track) })
          audioRef.current.srcObject = ms
          audioRef.current.play().catch(() => {})
        }
      } catch (e) {
        console.warn('Failed to attach remote audio', e)
      }
    }

    attachStream()

    const onaddstream = (e) => {
      try {
        audioRef.current.srcObject = e.stream
        audioRef.current.play().catch(() => {})
      } catch (err) {
        console.warn('onaddstream attach failed', err)
      }
    }

    // Some browsers/implementations emit 'addstream' on the peer connection
    try {
      session.connection && session.connection.addEventListener && session.connection.addEventListener('addstream', onaddstream)
    } catch (e) {}

    return () => {
      try {
        session.connection && session.connection.removeEventListener && session.connection.removeEventListener('addstream', onaddstream)
      } catch (e) {}
    }
  }, [session])

  // Hidden audio element — the dialer UI already shows the call
  // duration/status, so the native HTML5 audio controls are redundant
  // (and confusing because they appear UNDER the dialer with their own
  // time counter and volume slider). Audio still plays via the WebRTC
  // stream attached above; we just don't render the player chrome.
  return (
    <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
  )
}

export default WebphoneAudio
