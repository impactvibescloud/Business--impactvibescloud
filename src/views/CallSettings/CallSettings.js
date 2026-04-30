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
        const res = await apiCall(`/branch/${user.businessId}/branches`, "GET");
        const list = res.data || res.branches || res;
        const formatted = Array.isArray(list) ? list : list.data || [];
        const agentsArr = formatted.map((branch) => {
          const name =
            branch.user?.name || branch.branchName || branch.manager?.name || "Unknown";
          const phone = branch.user?.phone || branch.phone || branch.didNumber || "";
          const did =
            (Array.isArray(branch.didNumbers) && branch.didNumbers[0]) ||
            branch.didNumber ||
            branch.did ||
            branch.user?.didNumber ||
            "";
          const sticky =
            typeof branch.callforward === "boolean" ? branch.callforward : !!branch.stickyBranch;
          const click =
            typeof branch.clickToCall === "boolean"
              ? branch.clickToCall
              : !!(branch.mobile || branch.user?.mobile || branch.callToMobile);
          return {
            id: branch._id || branch.id,
            name,
            phone,
            did,
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
  }, [user?.businessId]);

  useEffect(() => {
    if (!agents || agents.length === 0) return;
    let cancelled = false;

    const toFetch = [];
    agents.forEach((a) => {
      const did = a.did;
      if (did && numberExtensions[did] === undefined) toFetch.push(did);
    });
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
    const id = agent.id;
    const next = !agent.stickyBranch;
    const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
    const extensionFromCache = did ? numberExtensions[did] : undefined;
    const extension =
      extensionFromCache && extensionFromCache !== "—"
        ? extensionFromCache
        : agent.raw?.extension || agent.raw?.extensionNumber || agent.raw?.didNumber || agent.raw?.did || null;
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

      await apiCall(`/branch/edit/${id}`, "PATCH", { stickyBranch: next, callforward: next });
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
    const id = agent.id;
    const phone = (phones && phones[id]) || "";
    setSavingIds((s) => [...s, id]);
    setSavingClickIds((s) => [...s, id]);
    try {
      const payload = { userPhone: phone };
      await apiCall(`/branch/edit/${id}`, "PATCH", payload);
      const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
      const extensionFromCache = did ? numberExtensions[did] : undefined;
      const extension =
        extensionFromCache && extensionFromCache !== "—"
          ? extensionFromCache
          : agent.raw?.extension || agent.raw?.extensionNumber || agent.raw?.didNumber || agent.raw?.did || null;
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
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="text-muted">
                      {agent.did ? agent.did : "—"}
                    </div>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="text-muted">
                      {(() => {
                        const did = agent.did;
                        if (did && numberExtensions[did] !== undefined) return numberExtensions[did];
                        return agent.raw?.extension ?? agent.raw?.extensionNumber ?? "—";
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
