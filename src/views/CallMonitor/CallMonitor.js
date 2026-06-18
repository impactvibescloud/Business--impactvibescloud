import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CallMissedIcon from "@mui/icons-material/CallMissed";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import { apiCall } from "../../config/api";
import SipRegistration from "../../components/sip/SipRegistration";
import WebphoneAudio from "../../components/sip/WebphoneAudio";
import WebPhoneDialer from "../../components/sip/WebPhoneDialer";
import "../Leads/CallLogsWebpage.css";

// Small status pill rendered inside each spy panel so supervisors always
// know exactly where the session is in its lifecycle. Map of state →
// (label, color, pulsing dot).
const SpyStatusBadge = ({ state, error }) => {
  const map = {
    idle: { label: "Idle", color: "#6b7280", dot: false },
    connecting: { label: "Connecting…", color: "#0288d1", dot: true },
    ringing: { label: "Ringing PBX…", color: "#f59e0b", dot: true },
    connected: { label: "Connected · Talking", color: "#16a34a", dot: false },
    ended: { label: "Ended", color: "#6b7280", dot: false },
    failed: {
      label: `Failed${error ? ": " + error : ""}`,
      color: "#dc2626",
      dot: false,
    },
  };
  const m = map[state] || map.idle;
  return (
    <Box
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, mt: 0.5 }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: m.color,
          animation: m.dot ? "pulse 1.4s ease-in-out infinite" : "none",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.35 },
          },
        }}
      />
      <Typography variant="caption" sx={{ color: m.color, fontWeight: 600 }}>
        {m.label}
      </Typography>
    </Box>
  );
};

const CallMonitor = () => {
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveCalls, setLiveCalls] = useState([]);
  const [logicalCalls, setLogicalCalls] = useState([]);
  const pollingRef = useRef(null);

  const [regStatus, setRegStatus] = useState("disconnected");
  const [ua, setUa] = useState(null);
  const [monitorSession, setMonitorSession] = useState(null);
  const [monitorCall, setMonitorCall] = useState(null);
  // Per-session lifecycle status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed'
  // Used to show clear visual feedback in the floating panels so supervisors
  // know exactly what state their spy session is in (otherwise the panel
  // looked identical whether the call was ringing, dead, or actively
  // bridging audio).
  const [sessionStates, setSessionStates] = useState({
    monitor: "idle",
    whisper: "idle",
    barge: "idle",
  });
  const [sessionErrors, setSessionErrors] = useState({
    monitor: null,
    whisper: null,
    barge: null,
  });
  const updateSessionState = (kind, state, errorMsg = null) =>
    setSessionStates((prev) => {
      if (prev[kind] === state) return prev;
      setSessionErrors((er) => ({ ...er, [kind]: errorMsg }));
      return { ...prev, [kind]: state };
    });
  const [whisperSession, setWhisperSession] = useState(null);
  const [whisperCall, setWhisperCall] = useState(null);
  const [bargeSession, setBargeSession] = useState(null);
  const [bargeCall, setBargeCall] = useState(null);

  // SIP configuration state
  const [sipConfig, setSipConfig] = useState(null);
  const [loadingSipConfig, setLoadingSipConfig] = useState(false);
  const [supervisorNumber, setSupervisorNumber] = useState(null);

  const fetchBusinessIdIfNeeded = async () => {
    if (businessId) return businessId;
    try {
      const res = await apiCall("/v1/user/details", "GET");
      const u = res.user || res.data || res;
      if (u && u.businessId) {
        setBusinessId(u.businessId);
        return u.businessId;
      }
    } catch (err) {
      // ignore; will show error on fetch
    }
    return null;
  };

  const isIpAddress = (domain) => {
    // Check if domain is an IP address (IPv4 or IPv6)
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^(\[?([a-f0-9:]+)\]?)$/;
    return ipv4Pattern.test(domain) || ipv6Pattern.test(domain);
  };

  const fetchSipConfiguration = async () => {
    const bId = await fetchBusinessIdIfNeeded();
    if (!bId) {
      console.warn("Business ID not available for SIP config fetch");
      return;
    }

    setLoadingSipConfig(true);
    try {
      // Fetch supervisor-number endpoint which now returns password
      const supervisorRes = await apiCall(
        `/businesses/${encodeURIComponent(bId)}/supervisor-number`,
        "GET",
      );

      console.log("[CallMonitor] Supervisor-Number Response:", supervisorRes);

      if (supervisorRes?.success && supervisorRes?.numberDetails) {
        const details = supervisorRes.numberDetails;
        let domain = details.sip_domain || "pbx.justconnect.biz";

        // Store supervisor number
        const supervisorNum =
          supervisorRes.supervisorNumber || supervisorRes.numberDetails?.number;
        setSupervisorNumber(supervisorNum);

        // If domain is an IP address, use WS (non-secure) instead of WSS
        // because SSL certificates don't support IP addresses
        const isIP = isIpAddress(domain);
        const shouldUseWSS =
          !isIP &&
          (details.sip_transport === "wss" || details.sip_transport === "WSS");

        const config = {
          sip_domain: domain,
          extension: details.sip_endpoint || details.extension || "1010",
          sip_password: details.sip_password || "",
          ws_port: details.sip_port || 8089,
          ws_path: "/ws",
          wss: shouldUseWSS,
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        };
        setSipConfig(config);
        console.log("[CallMonitor] SIP configuration ready with credentials:", {
          domain: config.sip_domain,
          isIP: isIP,
          extension: config.extension,
          hasPassword: !!config.sip_password,
          port: config.ws_port,
          transport: config.wss ? "WSS" : "WS",
          note: isIP
            ? "Using WS instead of WSS because domain is IP address"
            : "",
        });
      } else {
        console.warn(
          "[CallMonitor] Invalid SIP configuration response:",
          supervisorRes,
        );
      }
    } catch (err) {
      console.error("[CallMonitor] Failed to fetch SIP configuration:", err);
      // Use fallback config
      setSipConfig({
        sip_domain: "pbx.justconnect.biz",
        extension: "1010",
        sip_password: "",
        ws_port: 8089,
        ws_path: "/ws",
        wss: true,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
    } finally {
      setLoadingSipConfig(false);
    }
  };

  const fetchLiveCalls = async () => {
    setError(null);
    try {
      const bId = await fetchBusinessIdIfNeeded();
      if (!bId) {
        setError("Business ID not available");
        setLiveCalls([]);
        setLogicalCalls([]);
        return;
      }

      setLoading(true);
      const res = await apiCall(
        `/asterisk/livecalls/${encodeURIComponent(bId)}`,
        "GET",
      );

      // Normalize response
      const lCalls = Array.isArray(res.liveCalls) ? res.liveCalls : [];
      const logCalls = Array.isArray(res.logicalCalls) ? res.logicalCalls : [];

      setLiveCalls(lCalls);
      setLogicalCalls(logCalls);
    } catch (err) {
      console.error("CallMonitor fetch failed", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch live calls",
      );
      setLiveCalls([]);
      setLogicalCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchLiveCalls();
    fetchSipConfiguration();

    // poll every 5 seconds
    pollingRef.current = setInterval(() => {
      fetchLiveCalls();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use fetched SIP config if available, fallback to default
  const sipCfg = sipConfig || {
    sip_domain: "pbx.justconnect.biz",
    extension: "1010",
    sip_password: "",
    ws_port: 8089,
    ws_path: "/ws",
    wss: true,
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const extractExtension = (call) => {
    if (!call) return null;

    // Strategy 1: Try assignedAgent object — on the call AND on every leg.
    // Logical-call objects don't carry assignedAgent at the top level,
    // only individual legs do (the agent leg, not the trunk leg). Walk
    // all candidates so we find the extension regardless of where it
    // was attached.
    const assignedCandidates = [];
    if (call?.assignedAgent) assignedCandidates.push(call.assignedAgent);
    if (call?.agent) assignedCandidates.push(call.agent);
    if (Array.isArray(call?.legs)) {
      for (const l of call.legs) {
        if (l?.assignedAgent) assignedCandidates.push(l.assignedAgent);
        if (l?.agent) assignedCandidates.push(l.agent);
      }
    }

    const readExtFromAssigned = (assigned) => {
      if (!assigned) return null;
      if (typeof assigned === "object") {
        for (const f of ["extension", "ext", "sipExtension", "sip"]) {
          if (assigned[f]) {
            const ext = String(assigned[f]).trim();
            if (/^\d{3,}$/.test(ext)) return ext;
          }
        }
      } else if (typeof assigned === "string") {
        const digits = assigned.replace(/\D/g, "");
        if (digits && /^\d{3,}$/.test(digits)) return digits;
      }
      return null;
    };

    for (const a of assignedCandidates) {
      const ext = readExtFromAssigned(a);
      if (ext) return ext;
    }

    // Also try the DID's sip_endpoint as a last resort (NumberInventory
    // stores the agent's extension under sip_endpoint when assigned).
    if (call?.did?.sip_endpoint) {
      const ext = String(call.did.sip_endpoint).trim();
      if (/^\d{3,}$/.test(ext)) return ext;
    }
    if (Array.isArray(call?.legs)) {
      for (const l of call.legs) {
        if (l?.did?.sip_endpoint) {
          const ext = String(l.did.sip_endpoint).trim();
          if (/^\d{3,}$/.test(ext)) return ext;
        }
      }
    }

    // Strategy 2: Parse from channel. For a call between trunk and
    // extension Asterisk gives us TWO channels (e.g.
    //   Channel:     PJSIP/1009-00001f43        ← extension leg
    //   DestChannel: PJSIP/tata-trunk-92-...    ← trunk leg
    // ). Older code grabbed `legs[0]` blindly, which on inbound calls is
    // the trunk leg — and the regex then matched the trunk's tail digits
    // (e.g. "00001" or "92") and we'd try to spy on a non-existent
    // extension. Walk both legs and prefer the one that is NOT a trunk.
    const candidateChannels = [
      call?.channel,
      call?.destinationChannel,
      call?.destChannel,
      ...(Array.isArray(call?.legs)
        ? call.legs.map((l) => l?.channel || l?.destinationChannel)
        : []),
    ].filter((c) => typeof c === "string" && c.length > 0);

    const isTrunkChannel = (ch) => /trunk/i.test(ch);
    const extFromChannel = (ch) => {
      // Match the SIP user portion: "PJSIP/<user>-<id>"
      const userPart = ch.split("/")[1] || "";
      const userOnly = userPart.split("-")[0];
      // Only treat as an extension if it's a 3–6 digit number (typical
      // extension range — filters out trunk names like "tata" and
      // garbage tail-IDs like "00001f44").
      if (/^\d{3,6}$/.test(userOnly)) return userOnly;
      return null;
    };

    // Prefer non-trunk channels first.
    for (const ch of candidateChannels) {
      if (isTrunkChannel(ch)) continue;
      const ext = extFromChannel(ch);
      if (ext) return ext;
    }
    // Fall back to any channel if no non-trunk produced an extension.
    for (const ch of candidateChannels) {
      const ext = extFromChannel(ch);
      if (ext) return ext;
    }

    // Strategy 3: Try other agent-related fields
    if (call?.agentExtension) {
      const ext = String(call.agentExtension).trim();
      if (/^\d{3,}$/.test(ext)) return ext;
    }
    if (call?.agentId && /^\d{3,}$/.test(String(call.agentId).trim())) {
      return String(call.agentId).trim();
    }

    // Strategy 4: Extract from raw if available
    if (call?.raw && typeof call.raw === "string") {
      const m = call.raw.match(/(\d{3,})/);
      if (m && m[1]) return m[1];
    }

    console.warn("Could not extract extension from call:", call);
    return null;
  };

  // Helper to initiate monitor/whisper/barge with proper session listeners.
  //
  // Session-conflict policy:
  // - Only ONE active spy session at a time.
  // - If another type is active, AUTO-TERMINATE it instead of asking the
  //   user to hang up manually (the previous "alert + return" flow could
  //   get stuck forever if a session ended without ending/failed handlers
  //   firing, leaving stale state pointing at a dead JsSIP object).
  // - Self-heals stale state: if the stored session reports ended/closed,
  //   wipe it before evaluating the gate so the user can always click.
  const isSessionAlive = (s) => {
    if (!s) return false;
    try {
      // JsSIP sessions expose `isEnded()` / `isInProgress()` / `isEstablished()`.
      if (typeof s.isEnded === "function" && s.isEnded()) return false;
      // Some versions store status; '8' / 'TERMINATED' is dead.
      if (s.status === "TERMINATED" || s.status === 8) return false;
      // PeerConnection signaling state 'closed' = dead.
      if (s.connection && s.connection.signalingState === "closed")
        return false;
    } catch (e) {}
    return true;
  };
  const initiateCall = async (callType, call) => {
    // Self-heal stale state.
    if (monitorSession && !isSessionAlive(monitorSession)) {
      setMonitorSession(null);
      setMonitorCall(null);
    }
    if (whisperSession && !isSessionAlive(whisperSession)) {
      setWhisperSession(null);
      setWhisperCall(null);
    }
    if (bargeSession && !isSessionAlive(bargeSession)) {
      setBargeSession(null);
      setBargeCall(null);
    }

    // Auto-terminate any OTHER active session (don't force the user to
    // hang up manually). Asterisk will tear down its side automatically.
    const terminateLive = (sess) => {
      try {
        sess && typeof sess.terminate === "function" && sess.terminate();
      } catch (e) {}
    };
    if (
      callType !== "monitor" &&
      monitorSession &&
      isSessionAlive(monitorSession)
    ) {
      console.log(
        "[initiateCall] auto-terminating Monitor before starting",
        callType,
      );
      terminateLive(monitorSession);
      setMonitorSession(null);
      setMonitorCall(null);
    }
    if (
      callType !== "whisper" &&
      whisperSession &&
      isSessionAlive(whisperSession)
    ) {
      console.log(
        "[initiateCall] auto-terminating Whisper before starting",
        callType,
      );
      terminateLive(whisperSession);
      setWhisperSession(null);
      setWhisperCall(null);
    }
    if (callType !== "barge" && bargeSession && isSessionAlive(bargeSession)) {
      console.log(
        "[initiateCall] auto-terminating Barge before starting",
        callType,
      );
      terminateLive(bargeSession);
      setBargeSession(null);
      setBargeCall(null);
    }
    // Same-type re-click: if a LIVE session of the same type exists, do
    // nothing (avoid duplicate channels). Stale ones were already wiped.
    if (
      callType === "monitor" &&
      monitorSession &&
      isSessionAlive(monitorSession)
    )
      return;
    if (
      callType === "whisper" &&
      whisperSession &&
      isSessionAlive(whisperSession)
    )
      return;
    if (callType === "barge" && bargeSession && isSessionAlive(bargeSession))
      return;

    const ext = extractExtension(call);

    console.log(`[${callType}] Attempting call:`, {
      ext,
      callData: {
        assignedAgent: call?.assignedAgent,
        agent: call?.agent,
        channel: call?.channel,
        raw: call?.raw?.slice(0, 100),
      },
    });

    if (!ext) {
      alert(
        `Could not determine extension to ${callType} for this call.\n\nDebug Info:\nAgent: ${call?.assignedAgent?.name || call?.agent || "unknown"}\nNo valid extension found in call data.`,
      );
      return;
    }

    // Validate extension format
    if (!/^\d{3,}$/.test(ext)) {
      alert(
        `Invalid extension format: "${ext}". Extension must be at least 3 digits.`,
      );
      return;
    }

    if (!ua) {
      alert("SIP UA not ready; please wait for registration.");
      return;
    }

    const domain =
      (ua.configuration && ua.configuration.uri && ua.configuration.uri.host) ||
      sipCfg.sip_domain ||
      "";

    // Build dial string based on callType
    let dial = "";
    if (callType === "monitor") dial = `*90${ext}`;
    else if (callType === "whisper") dial = `*91${ext}`;
    else if (callType === "barge") dial = `*92${ext}`;
    else return;

    const target = domain ? `sip:${dial}@${domain}` : `sip:${dial}`;

    try {
      // Request microphone access BEFORE initiating call
      let localStream = null;
      try {
        console.log(`[${callType}] Requesting microphone access...`);
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        console.log(
          `[${callType}] Microphone access granted, local stream:`,
          localStream,
        );
      } catch (micErr) {
        console.warn(
          `[${callType}] Microphone access failed (this may prevent two-way audio):`,
          micErr,
        );
        alert(
          `Microphone access denied. ${callType} will be audio-out-only.\n\nPlease allow microphone access in browser settings.`,
        );
        // Continue anyway - at least they can listen
      }

      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
          iceServers: sipCfg.iceServers,
          // Ensure ICE consent check is enabled
          iceTransportPolicy: "all",
        },
        // Pass local stream if available so it gets added to peer connection
        ...(localStream && { mediaStream: localStream }),
      };

      console.log(`[${callType}] Initiating SIP call to: ${target}`);

      // Create session
      const session = ua.call(target, options);

      // Helper to clean up session
      const cleanup = () => {
        // Stop local stream tracks
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
        }

        if (callType === "monitor") {
          setMonitorSession(null);
          setMonitorCall(null);
        } else if (callType === "whisper") {
          setWhisperSession(null);
          setWhisperCall(null);
        } else if (callType === "barge") {
          setBargeSession(null);
          setBargeCall(null);
        }
        updateSessionState(callType, "idle");
      };

      // Mark as 'connecting' immediately so the panel shows the right state.
      updateSessionState(callType, "connecting");

      // Attach event listeners BEFORE storing in state to ensure they fire
      // This prevents race conditions where the session might end before listeners attach
      if (session && typeof session.on === "function") {
        session.on("progress", () => {
          console.debug(`[${callType}] Call in progress to ${target}`);
          updateSessionState(callType, "ringing");
        });
        session.on("accepted", () => {
          console.debug(`[${callType}] Call accepted (180/183) for ${target}`);
        });
        session.on("confirmed", () => {
          console.debug(`[${callType}] Call confirmed to ${target}`);
          updateSessionState(callType, "connected");
          // Ensure local stream is added to peer connection if not already
          if (localStream && session.connection) {
            try {
              localStream.getTracks().forEach((track) => {
                const senders = session.connection.getSenders
                  ? session.connection.getSenders()
                  : [];
                const hasTrack = senders.some((s) => s.track === track);
                if (!hasTrack) {
                  console.log(
                    `[${callType}] Adding local ${track.kind} track to peer connection`,
                  );
                  session.connection.addTrack(track, localStream);
                }
              });
            } catch (e) {
              console.warn(
                `[${callType}] Error adding local stream to peer connection:`,
                e,
              );
            }
          }
        });
        session.on("ended", () => {
          console.debug(`[${callType}] Call ended`);
          updateSessionState(callType, "ended");
          // Slight delay before clearing state so the user sees "Ended"
          // briefly instead of the panel disappearing instantly.
          setTimeout(cleanup, 900);
        });
        session.on("failed", (data) => {
          const errorMsg =
            data?.cause ||
            (data?.message && data.message.reason) ||
            "Unknown error";
          console.error(`[${callType}] Call failed:`, {
            cause: errorMsg,
            data,
            dial,
            ext,
            target,
          });
          updateSessionState(callType, "failed", errorMsg);
          // Show failure state in panel for 2.5s so the user can read it,
          // then cleanup. Don't alert() — it's intrusive.
          setTimeout(cleanup, 2500);
        });
      }

      // NOW store the session in state - listeners are already attached
      if (callType === "monitor") {
        setMonitorSession(session);
        setMonitorCall(call);
      } else if (callType === "whisper") {
        setWhisperSession(session);
        setWhisperCall(call);
      } else if (callType === "barge") {
        setBargeSession(session);
        setBargeCall(call);
      }

      console.debug(`[${callType}] Session created`, {
        session,
        ext,
        target,
        localStream,
      });
    } catch (err) {
      console.error(`[${callType}] Failed:`, err);
      alert(
        `${callType.charAt(0).toUpperCase() + callType.slice(1)} failed: ${String(err.message || err)}\n\nExt: ${ext}`,
      );
    }
  };

  const handleBargeClick = (call) => {
    initiateCall("barge", call);
  };

  const handleMonitorClick = (call) => {
    initiateCall("monitor", call);
  };

  const handleWhisperClick = (call) => {
    initiateCall("whisper", call);
  };

  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

  const getCallLegs = (call) => {
    if (Array.isArray(call?.legs) && call.legs.length) {
      return call.legs.filter(Boolean);
    }
    return call ? [call] : [];
  };

  const getDisplayLeg = (call) => {
    const legs = getCallLegs(call);
    return (
      legs.find(
        (leg) =>
          leg?.assignedAgent && leg?.channel && !/trunk/i.test(leg.channel),
      ) ||
      legs.find((leg) => leg?.channel && !/trunk/i.test(leg.channel)) ||
      legs.find((leg) => leg?.assignedAgent) ||
      legs.find((leg) => leg?.did?.number) ||
      legs[0] ||
      call
    );
  };

  const getMergedStatus = (call) => {
    const statuses = [
      call?.status,
      ...getCallLegs(call).map((leg) => leg?.status),
    ]
      .map((status) => (typeof status === "string" ? status.trim() : status))
      .filter(Boolean);

    if (!statuses.length) return null;

    const priority = [
      "Up",
      "Ringing",
      "Ring",
      "Bridged",
      "In use",
      "InUse",
      "Trying",
      "Proceeding",
      "Down",
    ];
    for (const candidate of priority) {
      const match = statuses.find(
        (status) => String(status).toLowerCase() === candidate.toLowerCase(),
      );
      if (match) return match;
    }

    return statuses[0];
  };

  const getMergedTokens = (call) => {
    const tokens = new Set();

    const addTokens = (value) => {
      if (!Array.isArray(value)) return;
      value.forEach((token) => {
        if (typeof token === "string" && token.trim()) {
          tokens.add(token.trim());
        }
      });
    };

    addTokens(call?.tokens);
    getCallLegs(call).forEach((leg) => addTokens(leg?.tokens));

    return Array.from(tokens);
  };

  const normalizeCallForDisplay = (call) => {
    const legs = getCallLegs(call);
    const displayLeg = getDisplayLeg(call);
    const mergedAgent =
      call?.assignedAgent ||
      displayLeg?.assignedAgent ||
      legs.find((leg) => leg?.assignedAgent)?.assignedAgent ||
      null;
    const mergedDid =
      call?.did || displayLeg?.did || legs.find((leg) => leg?.did)?.did || null;
    const mergedRaw = [call?.raw, ...legs.map((leg) => leg?.raw)]
      .filter((value) => typeof value === "string" && value.trim())
      .join("\n");

    return {
      ...call,
      legs,
      assignedAgent: mergedAgent,
      did: mergedDid,
      channel: displayLeg?.channel || call?.channel || "-",
      status: getMergedStatus(call),
      tokens: getMergedTokens(call),
      raw: mergedRaw,
    };
  };

  const getStatusChipSx = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (["up", "bridged", "in use", "inuse"].includes(normalized)) {
      return { backgroundColor: "#c8e6c9", color: "#2e7d32", fontWeight: 500 };
    }

    if (["ring", "ringing", "trying", "proceeding"].includes(normalized)) {
      return { backgroundColor: "#ffe0b2", color: "#f57c00", fontWeight: 500 };
    }

    if (["down", "ended"].includes(normalized)) {
      return { backgroundColor: "#eeeeee", color: "#616161", fontWeight: 500 };
    }

    return { backgroundColor: "#e0e0e0", color: "#424242", fontWeight: 500 };
  };

  // Heuristic to determine if a live call is inbound or outbound.
  // Strategy:
  // 1. Normalize grouped logical calls so we inspect all legs, not just one.
  // 2. If the business DID is present alongside another external number, treat as Inbound.
  // 3. Fall back to raw Asterisk hints (from-external / outbound / Dial).
  const detectDirection = (call) => {
    const normalizedCall = normalizeCallForDisplay(call);
    const legs = getCallLegs(normalizedCall);
    const displayLeg = getDisplayLeg(normalizedCall);
    const raw = String(displayLeg?.raw || normalizedCall.raw || "");
    const rawLower = raw.toLowerCase();
    const contextToken =
      raw.split(/\s+/).filter(Boolean)[1]?.toLowerCase() || "";
    const didDigits = normalizeDigits(normalizedCall.did?.number);
    const phoneTokens = normalizedCall.tokens
      .map((token) => normalizeDigits(token))
      .filter((token) => token.length >= 7 && token.length <= 15);
    const distinctPhoneTokens = Array.from(new Set(phoneTokens));
    const externalNumbers = distinctPhoneTokens.filter(
      (token) => !didDigits || token !== didDigits,
    );
    const hasTrunkLeg = legs.some((leg) =>
      /trunk|pstn|tata/i.test(String(leg?.channel || "")),
    );

    if (
      /\bfrom-external\b/i.test(rawLower) ||
      /\bincoming\b/i.test(rawLower) ||
      /\btata\b/i.test(contextToken)
    ) {
      return "Inbound";
    }
    if (
      /\bfrom-internal\b/i.test(rawLower) ||
      /\boutbound\b/i.test(rawLower) ||
      /\binternal\b/i.test(contextToken)
    ) {
      return "Outgoing";
    }

    if (
      didDigits &&
      distinctPhoneTokens.includes(didDigits) &&
      externalNumbers.length > 0
    ) {
      return "Inbound";
    }

    if (/\boutgoing\b/i.test(rawLower) || /\bdial\b/i.test(rawLower))
      return "Outgoing";

    if (didDigits && externalNumbers.length > 0 && hasTrunkLeg)
      return "Inbound";
    if (!didDigits && externalNumbers.length > 0) return "Outgoing";

    return hasTrunkLeg ? "Inbound" : "Outgoing";
  };

  const displayCalls = (
    logicalCalls && logicalCalls.length ? logicalCalls : liveCalls
  ).map(normalizeCallForDisplay);

  return (
    <>
      <Box className="page-container" sx={{ p: 2 }}>
        {/* Two-column layout: Webphone on left, Call Monitor on right */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
            gap: 2,
            minHeight: "calc(100vh - 100px)",
          }}
        >
          {/* LEFT SIDEBAR: Webphone Dialer */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
            }}
          >
            <WebPhoneDialer
              ua={ua}
              regStatus={regStatus}
              sipDomain={sipCfg.sip_domain}
              businessId={businessId}
              supervisorNumber={supervisorNumber}
            />
          </Box>

          {/* RIGHT MAIN: Call Monitor Table and SIP Registration */}
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, m: 0 }}>
                      Call Monitor
                    </Typography>
                    <Chip
                      label={
                        regStatus === "registered"
                          ? "Online"
                          : regStatus === "connecting"
                            ? "Connecting"
                            : "Offline"
                      }
                      size="small"
                      color={
                        regStatus === "registered"
                          ? "success"
                          : regStatus === "connected"
                            ? "info"
                            : regStatus === "connecting"
                              ? "warning"
                              : "default"
                      }
                      variant="outlined"
                    />
                  </Box>
                }
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      loading ? <CircularProgress size={18} /> : <RefreshIcon />
                    }
                    onClick={fetchLiveCalls}
                    disabled={loading}
                  >
                    {loading ? "Refreshing" : "Refresh"}
                  </Button>
                }
                sx={{ pb: 2 }}
              />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  {loadingSipConfig ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 2,
                      }}
                    >
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography variant="body2">
                        Loading SIP configuration...
                      </Typography>
                    </Box>
                  ) : !sipConfig?.sip_password ? (
                    <Alert severity="warning">
                      SIP password not configured. Please configure it in
                      Settings &gt; Call Settings.
                    </Alert>
                  ) : (
                    <SipRegistration
                      sipConfig={sipCfg}
                      enableDebug={false}
                      onRegistrationStatus={setRegStatus}
                      onUaReady={(u) => setUa(u)}
                    />
                  )}
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {loading && !displayCalls.length ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 4,
                    }}
                  >
                    <CircularProgress sx={{ mr: 2 }} />
                    <Typography>Loading live calls...</Typography>
                  </Box>
                ) : displayCalls.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Chip label="No active calls" color="default" />
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    className="calllogs-table-container"
                  >
                    <Table
                      size="small"
                      sx={{
                        "& th, & td": { py: 1, px: 1.5, lineHeight: 1.15 },
                        "& td": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Direction
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Channel
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Duration
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>DID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Render ONE row per logical call (groups the trunk
                          leg + agent leg into a single entry). Falling back
                          to liveCalls only if the API didn't group them. */}
                        {displayCalls.map((c, idx) => {
                          return (
                            <TableRow
                              key={`${c.id || c.channel || c.groupId || idx}-${idx}`}
                              hover
                            >
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                {(() => {
                                  const dir = detectDirection(c);
                                  return (
                                    <Chip
                                      icon={
                                        dir === "Outgoing" ? (
                                          <CallMissedIcon />
                                        ) : (
                                          <CallReceivedIcon />
                                        )
                                      }
                                      label={dir}
                                      size="small"
                                      sx={{
                                        backgroundColor:
                                          dir === "Outgoing"
                                            ? "#e3f2fd"
                                            : dir === "Inbound"
                                              ? "#f3e5f5"
                                              : "#f5f5f5",
                                        color:
                                          dir === "Outgoing"
                                            ? "#1565c0"
                                            : dir === "Inbound"
                                              ? "#6a1b9a"
                                              : "#616161",
                                        fontWeight: 500,
                                      }}
                                    />
                                  );
                                })()}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                {c.channel || "-"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                <Chip
                                  label={c.status || "-"}
                                  size="small"
                                  sx={getStatusChipSx(c.status)}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                {c.duration || "-"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                {c.did?.number || c.tokens?.[3] || "-"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                {c.assignedAgent?.name ||
                                  c.assignedAgent?.email ||
                                  "-"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.9rem" }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#3b82f6",
                                      "&:hover": { backgroundColor: "#2563eb" },
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1,
                                    }}
                                    onClick={() => handleMonitorClick(c)}
                                    disabled={regStatus !== "registered" || !ua}
                                  >
                                    Monitor
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#f59e0b",
                                      "&:hover": { backgroundColor: "#d97706" },
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1,
                                    }}
                                    onClick={() => handleWhisperClick(c)}
                                    disabled={regStatus !== "registered" || !ua}
                                  >
                                    Whisper
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#10b981",
                                      "&:hover": { backgroundColor: "#059669" },
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1,
                                    }}
                                    onClick={() => handleBargeClick(c)}
                                    disabled={regStatus !== "registered" || !ua}
                                  >
                                    Barge
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Session-status panel helper. Renders a colored chip showing
          where the spy session is in its lifecycle so the supervisor
          isn't left guessing whether audio is about to start. */}
      {/* eslint-disable-next-line no-unused-vars */}
      {(() => null)()}
      {/* Monitor session audio playback */}
      {monitorSession && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            width: 380,
            background: "white",
            padding: 2,
            borderRadius: 1,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            zIndex: 1110,
            borderTop: "4px solid #3b82f6",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🎧 Monitoring{" "}
                <strong>
                  {monitorCall?.assignedAgent?.name ||
                    monitorCall?.assignedAgent?.email ||
                    monitorCall?.agent ||
                    "agent"}
                </strong>
              </Typography>
              <SpyStatusBadge
                state={sessionStates.monitor}
                error={sessionErrors.monitor}
              />
            </Box>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                try {
                  if (
                    monitorSession &&
                    typeof monitorSession.terminate === "function"
                  ) {
                    monitorSession.terminate();
                  }
                } catch (e) {
                  console.warn("Error terminating monitor session", e);
                }
                setMonitorSession(null);
                setMonitorCall(null);
                updateSessionState("monitor", "idle");
              }}
            >
              Hangup
            </Button>
          </Box>
          <Box>
            <WebphoneAudio session={monitorSession} />
          </Box>
        </Box>
      )}

      {/* Whisper session audio playback */}
      {whisperSession && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            width: 380,
            background: "white",
            padding: 2,
            borderRadius: 1,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            zIndex: 1100,
            borderTop: "4px solid #f59e0b",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🗣️ Whispering to{" "}
                <strong>
                  {whisperCall?.assignedAgent?.name ||
                    whisperCall?.assignedAgent?.email ||
                    whisperCall?.agent ||
                    "agent"}
                </strong>
              </Typography>
              <SpyStatusBadge
                state={sessionStates.whisper}
                error={sessionErrors.whisper}
              />
            </Box>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                try {
                  if (
                    whisperSession &&
                    typeof whisperSession.terminate === "function"
                  ) {
                    whisperSession.terminate();
                  }
                } catch (e) {
                  console.warn("Error terminating whisper session", e);
                }
                setWhisperSession(null);
                setWhisperCall(null);
                updateSessionState("whisper", "idle");
              }}
            >
              Hangup
            </Button>
          </Box>
          <Box>
            <WebphoneAudio session={whisperSession} />
          </Box>
        </Box>
      )}

      {/* Barge session audio playback */}
      {bargeSession && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            width: 380,
            background: "white",
            padding: 2,
            borderRadius: 1,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            zIndex: 1090,
            borderTop: "4px solid #10b981",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🔊 Barging into{" "}
                <strong>
                  {bargeCall?.assignedAgent?.name ||
                    bargeCall?.assignedAgent?.email ||
                    bargeCall?.agent ||
                    "agent"}
                </strong>
              </Typography>
              <SpyStatusBadge
                state={sessionStates.barge}
                error={sessionErrors.barge}
              />
            </Box>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                try {
                  if (
                    bargeSession &&
                    typeof bargeSession.terminate === "function"
                  ) {
                    bargeSession.terminate();
                  }
                } catch (e) {
                  console.warn("Error terminating barge session", e);
                }
                setBargeSession(null);
                setBargeCall(null);
                updateSessionState("barge", "idle");
              }}
            >
              Hangup
            </Button>
          </Box>
          <Box>
            <WebphoneAudio session={bargeSession} />
          </Box>
        </Box>
      )}
    </>
  );
};

export default CallMonitor;
