import React, { useEffect, useRef } from 'react'

// Attach remote audio from a JsSIP session to a hidden <audio> element.
//
// The earlier version attached once at mount and assumed the remote
// stream was already on the peer connection. In practice the `track`
// event fires LATER — when Asterisk's spy bridge starts sending media
// — and we'd silently miss it: no srcObject, no audio. Now we wire up
// multiple paths and reattach whenever a new track arrives:
//
//   1. Initial attach from existing receivers/streams (covers media
//      that arrived before mount).
//   2. Listen for `track` events on the peer connection (modern WebRTC).
//   3. Listen for legacy `addstream` events (older stacks).
//   4. Reattach on session 'confirmed' / 'accepted' / 'peerconnection'
//      events so we cover JsSIP re-negotiation.
//
// Also gate play() inside a try/catch so autoplay-policy errors don't
// show up as red errors in the console.
const WebphoneAudio = ({ session }) => {
  const audioRef = useRef(null)

  useEffect(() => {
    if (!session || !audioRef.current) return
    const audio = audioRef.current
    let cancelled = false

    const safePlay = () => {
      audio.play().catch((e) => {
        console.warn('[WebphoneAudio] play() blocked:', e?.message || e)
      })
    }

    const ensureStream = () => {
      if (!audio.srcObject || !(audio.srcObject instanceof MediaStream)) {
        audio.srcObject = new MediaStream()
      }
      return audio.srcObject
    }

    const attachTrack = (track) => {
      if (cancelled || !track) return
      const stream = ensureStream()
      const has = stream.getTracks().some((t) => t.id === track.id)
      if (!has) {
        try { stream.addTrack(track) } catch (e) {}
      }
      safePlay()
    }

    const attachFromPc = (pc) => {
      if (!pc) return
      try {
        const receivers = pc.getReceivers ? pc.getReceivers() : []
        receivers.forEach((r) => {
          if (r?.track && r.track.kind === 'audio') attachTrack(r.track)
        })
      } catch (e) {}
      try {
        const streams = pc.getRemoteStreams ? pc.getRemoteStreams() : []
        if (streams && streams.length && !audio.srcObject) {
          audio.srcObject = streams[0]
          safePlay()
        }
      } catch (e) {}
    }

    const onTrack = (e) => {
      if (e?.streams && e.streams[0]) {
        audio.srcObject = e.streams[0]
        safePlay()
      } else if (e?.track) {
        attachTrack(e.track)
      }
    }
    const onAddStream = (e) => {
      if (e?.stream) {
        audio.srcObject = e.stream
        safePlay()
      }
    }

    const wirePc = (pc) => {
      if (!pc) return
      attachFromPc(pc)
      try { pc.addEventListener && pc.addEventListener('track', onTrack) } catch (e) {}
      try { pc.addEventListener && pc.addEventListener('addstream', onAddStream) } catch (e) {}
    }

    if (session.connection) wirePc(session.connection)

    const onPeerConnection = (data) => wirePc(data?.peerconnection || session.connection)
    const onConfirmed = () => wirePc(session.connection)
    const onAccepted = () => wirePc(session.connection)

    try { session.on && session.on('peerconnection', onPeerConnection) } catch (e) {}
    try { session.on && session.on('confirmed', onConfirmed) } catch (e) {}
    try { session.on && session.on('accepted', onAccepted) } catch (e) {}

    return () => {
      cancelled = true
      const pc = session.connection
      if (pc) {
        try { pc.removeEventListener && pc.removeEventListener('track', onTrack) } catch (e) {}
        try { pc.removeEventListener && pc.removeEventListener('addstream', onAddStream) } catch (e) {}
      }
      try { session.removeListener && session.removeListener('peerconnection', onPeerConnection) } catch (e) {}
      try { session.removeListener && session.removeListener('confirmed', onConfirmed) } catch (e) {}
      try { session.removeListener && session.removeListener('accepted', onAccepted) } catch (e) {}
    }
  }, [session])

  return <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
}

export default WebphoneAudio
