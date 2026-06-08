import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Switch,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { apiCall } from "../../config/api";
import Swal from "sweetalert2";
import { isAutheticated } from "../../auth";
import "../Leads/CallLogsWebpage.css";

const CallSettings = () => {
  const [user, setUser] = useState({});
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phones, setPhones] = useState({});
  const [savingIds, setSavingIds] = useState([]);
  const [savingClickIds, setSavingClickIds] = useState([]);
  const [savingForwardIds, setSavingForwardIds] = useState([]);
  const [numberExtensions, setNumberExtensions] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);
  const token = isAutheticated();

  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      try {
        const res = await apiCall("/v1/user/details", "GET");
        const u = res.user || res.data?.user || res;
        setUser(u || {});
      } catch (err) {
        console.error("Failed to fetch user details for Call Settings", err);
        setUser({});
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.businessId) return;
      setLoading(true);
      try {
        // Fetch branches AND departments in parallel. An agent who is
        // a member of multiple departments (but whose branch only has
        // ONE assigned DID) still needs a row per dept membership so
        // the page can show each department's DID + the agent's
        // extension in that dept.
        const [branchRes, deptRes] = await Promise.all([
          apiCall(`/branch/${user.businessId}/branches`, "GET"),
          apiCall(`/api/departments?businessId=${user.businessId}`, "GET").catch(
            () => ({ data: [] }),
          ),
        ]);
        const res = branchRes;
        const list = res.data || res.branches || res;
        const formatted = Array.isArray(list) ? list : list.data || [];

        // Build userId → [{ didNumber, deptName }] map from departments.
        // We'll add rows for each (agent, dept) the agent is a member
        // of, in addition to rows from their own branch's assignedNumbers.
        const deptList = (deptRes?.data?.departments || deptRes?.departments || deptRes?.data || deptRes || []);
        const deptsByUser = new Map();
        const deptArr = Array.isArray(deptList) ? deptList : [];
        for (const d of deptArr) {
          const did = d?.didNumber || (Array.isArray(d?.didNumbers) ? d.didNumbers[0] : null);
          if (!did) continue;
          const members = Array.isArray(d?.members) ? d.members : [];
          for (const m of members) {
            const uid = String(m?.userId || "");
            if (!uid) continue;
            if (!deptsByUser.has(uid)) deptsByUser.set(uid, []);
            deptsByUser.get(uid).push({
              didNumber: String(did),
              deptName: d.name || "",
              memberDidNumber: m?.didNumber ? String(m.didNumber) : null,
            });
          }
          // Department head — count as a member too
          const head = d?.departmentHead;
          if (head) {
            const uid = String(head);
            if (!deptsByUser.has(uid)) deptsByUser.set(uid, []);
            const list = deptsByUser.get(uid);
            if (!list.some((x) => x.didNumber === String(did))) {
              list.push({ didNumber: String(did), deptName: d.name || "" });
            }
          }
        }
        // ONE ROW PER AGENT. If an agent has multiple DIDs (across
        // branch assignments + department memberships), the row shows
        // all DIDs and all extensions comma-separated. The primary
        // DID is still tracked separately for actions that need a
        // single value (call forward, etc.).
        const agentsArr = formatted.map((branch) => {
          const name =
            branch.user?.name || branch.branchName || branch.manager?.name || "Unknown";
          const phone = branch.user?.phone || branch.phone || branch.didNumber || "";
          const sticky =
            typeof branch.callforward === "boolean" ? branch.callforward : !!branch.stickyBranch;
          const click =
            typeof branch.clickToCall === "boolean"
              ? branch.clickToCall
              : !!(branch.mobile || branch.user?.mobile || branch.callToMobile);

          // Collect every DID this agent owns. Prefer the rich
          // `assignedNumbers[]` array because each entry carries its
          // own `extension` field; fall back to `didNumbers[]` and
          // dept memberships when the rich data isn't available.
          const didEntries = [];
          const seenDid = new Set();
          const pushDid = (num, ext) => {
            if (!num) return;
            const key = String(num);
            if (seenDid.has(key)) return;
            seenDid.add(key);
            didEntries.push({ number: key, extension: ext || null });
          };

          if (Array.isArray(branch.assignedNumbers)) {
            for (const an of branch.assignedNumbers) {
              pushDid(
                an?.number,
                an?.extension || an?.extensionNumber || an?.sip_endpoint || null,
              );
            }
          }
          if (Array.isArray(branch.didNumbers)) {
            for (const d of branch.didNumbers) pushDid(d, null);
          }
          if (branch.didNumber) pushDid(branch.didNumber, null);
          if (branch.did) pushDid(branch.did, null);

          // Merge dept-membership DIDs
          const userId = String(branch?.user?._id || "");
          if (userId && deptsByUser.has(userId)) {
            for (const d of deptsByUser.get(userId)) {
              pushDid(d.didNumber, null);
            }
          }

          // Combined display strings — comma-separated for the row's
          // DID + Extension cells.
          const didsDisplay = didEntries.length
            ? didEntries.map((e) => e.number).join(", ")
            : "";
          const extsDisplay = didEntries
            .map((e) => e.extension)
            .filter(Boolean)
            .join(", ");
          // Primary DID/extension — what the Save/Forward handlers use
          // when they need a single value.
          const primary = didEntries[0] || { number: "", extension: null };

          return {
            id: branch._id || branch.id,
            branchId: branch._id || branch.id,
            name,
            phone,
            did: primary.number, // primary DID for backend operations
            didsDisplay, // "9240023450, 9240023452"
            extsDisplay, // "1002, 1085"
            rowExtension: primary.extension,
            allDidEntries: didEntries, // for handlers that want to iterate
            raw: branch,
            stickyBranch: sticky,
            clickToCall: click,
          };
        });
        setAgents(agentsArr);
        const phonesMap = {};
        agentsArr.forEach((a) => (phonesMap[a.id] = a.phone || ""));
        setPhones(phonesMap);
      } catch (err) {
        console.error("Failed to fetch agents for Call Settings", err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [user?.businessId, refreshTick]);

  // Refresh when the tab/window regains focus or becomes visible — so
  // changes made on the Department / Agents pages show up here without
  // a full reload. Also re-fetches `numberExtensions` from scratch.
  useEffect(() => {
    const triggerRefresh = () => {
      setNumberExtensions({});
      setRefreshTick((t) => t + 1);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") triggerRefresh();
    };
    window.addEventListener("focus", triggerRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", triggerRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Exposed handler for the manual Refresh button in the header.
  const handleManualRefresh = () => {
    setNumberExtensions({});
    setRefreshTick((t) => t + 1);
  };

  useEffect(() => {
    if (!agents || agents.length === 0) return;
    let cancelled = false;

    // Enumerate EVERY DID across all agents (not just the primary).
    // For multi-DID agents the row shows multiple extensions; each
    // DID needs its own /by-number/ lookup so the Extension cell
    // can show all of them.
    const seen = new Set();
    const toFetch = [];
    for (const a of agents) {
      const entries = a.allDidEntries || [];
      const list = entries.length > 0 ? entries.map((e) => e.number) : [a.did];
      for (const did of list) {
        if (!did || seen.has(did)) continue;
        seen.add(did);
        if (numberExtensions[did] === undefined) toFetch.push(did);
      }
    }
    if (toFetch.length === 0) return;

    const fetchAll = async () => {
      for (const did of toFetch) {
        if (cancelled) break;
        try {
          const res = await apiCall(
            `/api/v1/numbers/business/by-number/${encodeURIComponent(did)}`,
            "GET"
          );
          const ext =
            res?.data?.extension ??
            res?.data?.sip_endpoint ??
            res?.data?.extensionNumber ??
            res?.data?.ext ??
            null;
          setNumberExtensions((prev) => ({ ...prev, [did]: ext ?? "—" }));
        } catch (err) {
          setNumberExtensions((prev) => ({ ...prev, [did]: "—" }));
        }
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [agents, numberExtensions]);

  const handleToggleForward = async (agent) => {
    const id = agent.id; // composite row id (branchId::did)
    const branchId = agent.branchId || id; // real MongoDB branch id
    const next = !agent.stickyBranch;
    const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
    // Per-row extension wins (correct extension for THIS DID on a
    // multi-DID agent). Falls back to cache then branch defaults.
    const extensionFromCache = did ? numberExtensions[did] : undefined;
    const extension =
      agent.rowExtension ||
      (extensionFromCache && extensionFromCache !== "—" ? extensionFromCache : null) ||
      agent.raw?.extension ||
      agent.raw?.extensionNumber ||
      null;
    const phone = (phones && phones[id]) || agent.phone || "";

    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stickyBranch: next } : a)));
    setSavingForwardIds((s) => [...s, id]);
    try {
      if (!extension) throw new Error("No extension available for this agent to configure call forward.");

      if (next) {
        await apiCall("/v1/sipdatabase/astdb/cf", "POST", { extension: String(extension), user_phone: String(phone) });
      } else {
        await apiCall("/v1/sipdatabase/astdb/cf", "DELETE", null, { data: { extension: String(extension) } });
      }

      // Branch-level toggle uses the real branch _id, not the composite row id.
      await apiCall(`/branch/edit/${branchId}`, "PATCH", { stickyBranch: next, callforward: next });
    } catch (err) {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stickyBranch: !next } : a)));
      console.error("Failed to toggle forward for agent", id, err);
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || err?.message || "Failed to update forward flag" });
    } finally {
      setSavingForwardIds((s) => s.filter((x) => x !== id));
    }
  };

  const handlePhoneChange = (id, value) => {
    setPhones((p) => ({ ...p, [id]: value }));
  };

  const handleSave = async (agent) => {
    const id = agent.id; // composite row id
    const branchId = agent.branchId || id;
    const phone = (phones && phones[id]) || "";
    setSavingIds((s) => [...s, id]);
    setSavingClickIds((s) => [...s, id]);
    try {
      const payload = { userPhone: phone };
      // Branch-level edit uses the real branch id (not the composite row id)
      await apiCall(`/branch/edit/${branchId}`, "PATCH", payload);
      const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
      const extensionFromCache = did ? numberExtensions[did] : undefined;
      // Prefer the per-row extension so multi-DID agents map mobile to
      // the correct extension for the displayed DID.
      const extension =
        agent.rowExtension ||
        (extensionFromCache && extensionFromCache !== "—" ? extensionFromCache : null) ||
        agent.raw?.extension ||
        agent.raw?.extensionNumber ||
        null;
      try {
        if (extension) {
          if (phone && String(phone).trim() !== "") {
            await apiCall(`/api/agent/${encodeURIComponent(extension)}/mobile`, "POST", { mobile: String(phone) });
          } else {
            await apiCall(`/api/agent/${encodeURIComponent(extension)}/mobile`, "DELETE", null, { data: {} });
          }
        }
        Swal.fire({ icon: "success", title: "Saved", text: `Phone for ${agent.name} updated.` });
      } catch (err) {
        console.error("Failed to update agent mobile in AST DB", err);
        Swal.fire({ icon: "warning", title: "Partial save", text: `Phone saved for ${agent.name}, but AST DB update failed: ${err?.response?.data?.message || err?.message}` });
      }
    } catch (err) {
      console.error("Failed to save phone for agent", id, err);
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to save phone" });
    } finally {
      setSavingIds((s) => s.filter((x) => x !== id));
      setSavingClickIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Call Settings</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleManualRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : "Refresh"}
        </Button>
      </Box>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="h6">Call Forward</Typography>
          <Typography variant="body2" className="text-muted" gutterBottom>
            Configure per-agent call forward phone numbers below.
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : agents.length === 0 ? (
            <Typography className="text-muted">No agents found for your business.</Typography>
          ) : (
            <Box>
              <Grid container spacing={1} alignItems="center" className="mb-2">
                <Grid item xs={12} sm={3}>
                  <Typography className="fw-semibold">Agent</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography className="fw-semibold text-muted">Assigned DID</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography className="fw-semibold">Extension</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography className="fw-semibold">Agent Number</Typography>
                </Grid>
                <Grid item xs={6} sm={1} style={{ textAlign: "end" }}>
                  <Typography className="fw-semibold">Save</Typography>
                </Grid>
                <Grid item xs={6} sm={1} style={{ textAlign: "center" }}>
                  <Typography className="fw-semibold">Forward</Typography>
                </Grid>
              </Grid>

              {agents.map((agent) => (
                <Grid container spacing={1} alignItems="center" className="mb-3" key={agent.id}>
                  <Grid item xs={12} sm={3}>
                    <Typography className="fw-semibold">{agent.name}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <div
                      style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                      className="text-muted"
                      title={agent.didsDisplay || ""}
                    >
                      {agent.didsDisplay || "—"}
                    </div>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <div
                      style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                      className="text-muted"
                    >
                      {(() => {
                        // One extension per DID, in the same order as
                        // the DIDs column. If an agent has 3 DIDs,
                        // this shows 3 extensions — even if the agent
                        // uses the SAME extension for all (one row
                        // per DID, e.g. "1090, 1090, 1090").
                        const entries = agent.allDidEntries || [];
                        if (entries.length === 0) {
                          return agent.rowExtension || "—";
                        }
                        const exts = entries.map((e) => {
                          if (e.extension) return String(e.extension);
                          const cached = numberExtensions[e.number];
                          if (cached && cached !== "—") return String(cached);
                          return "—";
                        });
                        return exts.join(", ");
                      })()}
                    </div>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <TextField
                      size="small"
                      fullWidth
                      value={phones[agent.id] || ""}
                      onChange={(e) => handlePhoneChange(agent.id, e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </Grid>

                  <Grid item xs={6} sm={1} style={{ textAlign: "end" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSave(agent)}
                      disabled={savingIds.includes(agent.id) || savingClickIds.includes(agent.id)}
                      size="small"
                    >
                      {savingIds.includes(agent.id) || savingClickIds.includes(agent.id) ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </Grid>

                  <Grid item xs={6} sm={1} style={{ textAlign: "center" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          id={`cf_switch_${agent.id}`}
                          checked={!!agent.stickyBranch}
                          onChange={() => handleToggleForward(agent)}
                          disabled={savingForwardIds.includes(agent.id)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Grid>
                </Grid>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CallSettings;
