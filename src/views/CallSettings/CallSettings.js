import React, { useEffect, useState } from "react";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormInput,
  CButton,
  CSpinner,
  CFormSwitch,
} from "@coreui/react";
import { apiCall } from "../../config/api";
import Swal from "sweetalert2";
import { isAutheticated } from "../../auth";

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
        const res = await apiCall('/v1/user/details', 'GET');
        // apiCall returns response.data shape, Branches uses res.user or res.data.user depending on API
        const u = res.user || res.data?.user || res;
        setUser(u || {});
      } catch (err) {
        console.error('Failed to fetch user details for Call Settings', err);
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
        const res = await apiCall(`/branch/${user.businessId}/branches`, 'GET');
        // branch list may live in res.data or res.branches or res
        const list = res.data || res.branches || res;
        const formatted = Array.isArray(list) ? list : (list.data || []);
        const agentsArr = formatted.map((branch) => {
          const name = branch.user?.name || branch.branchName || branch.manager?.name || 'Unknown';
          const phone = branch.user?.phone || branch.phone || branch.didNumber || '';
          // try to determine assigned DID (display only). API returns `didNumbers` array.
          const did = (Array.isArray(branch.didNumbers) && branch.didNumbers[0]) || branch.didNumber || branch.did || branch.user?.didNumber || '';
          // prefer explicit `callforward` flag from backend, fall back to `stickyBranch`
          const sticky = typeof branch.callforward === 'boolean' ? branch.callforward : !!branch.stickyBranch;
          // click-to-call initial flag: backend may expose `clickToCall` or `mobile`
          const click = typeof branch.clickToCall === 'boolean' ? branch.clickToCall : !!(branch.mobile || branch.user?.mobile || branch.callToMobile);
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
        // initialize phones map
        const phonesMap = {};
        agentsArr.forEach((a) => (phonesMap[a.id] = a.phone || ""));
        setPhones(phonesMap);
      } catch (err) {
        console.error('Failed to fetch agents for Call Settings', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [user?.businessId]);

  // Fetch extension info for numbers assigned to agents (DIDs)
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
          const res = await apiCall(`/api/v1/numbers/business/by-number/${encodeURIComponent(did)}`, 'GET');
          // apiCall returns axios response.data (e.g. { success: true, data: { ... } })
          // prefer `data.extension` or `data.sip_endpoint` per API shape
          const ext = res?.data?.extension ?? res?.data?.sip_endpoint ?? res?.data?.extensionNumber ?? res?.data?.ext ?? null;
          setNumberExtensions((prev) => ({ ...prev, [did]: ext ?? '—' }));
        } catch (err) {
          setNumberExtensions((prev) => ({ ...prev, [did]: '—' }));
        }
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [agents, numberExtensions]);

  const handleToggleForward = async (agent) => {
    const id = agent.id;
    const next = !agent.stickyBranch;
    const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
    const extensionFromCache = did ? numberExtensions[did] : undefined;
    const extension = extensionFromCache && extensionFromCache !== '—' ? extensionFromCache : (agent.raw?.extension || agent.raw?.extensionNumber || agent.raw?.didNumber || agent.raw?.did || null);
    const phone = (phones && phones[id]) || agent.phone || '';

    // optimistic update
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stickyBranch: next } : a)));
    setSavingForwardIds((s) => [...s, id]);
    try {
      if (!extension) throw new Error('No extension available for this agent to configure call forward.');

      if (next) {
        await apiCall('/v1/sipdatabase/astdb/cf', 'POST', { extension: String(extension), user_phone: String(phone) });
      } else {
        // axios requires DELETE request bodies to be provided via `data` in the config
        await apiCall('/v1/sipdatabase/astdb/cf', 'DELETE', null, { data: { extension: String(extension) } });
      }

      // persist branch-level flag `callforward` (also keep stickyBranch for compatibility)
      await apiCall(`/branch/edit/${id}`, 'PATCH', { stickyBranch: next, callforward: next });
    } catch (err) {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stickyBranch: !next } : a)));
      console.error('Failed to toggle forward for agent', id, err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || err?.message || 'Failed to update forward flag' });
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
      // Patch branch - backend may accept userPhone or phone. We try userPhone first.
      const payload = { userPhone: phone };
      await apiCall(`/branch/edit/${id}`, 'PATCH', payload);
      // Also save mobile to AST DB for click-to-call via agent extension if available.
      const did = agent.did || agent.raw?.didNumber || agent.raw?.did;
      const extensionFromCache = did ? numberExtensions[did] : undefined;
      const extension = extensionFromCache && extensionFromCache !== '—' ? extensionFromCache : (agent.raw?.extension || agent.raw?.extensionNumber || agent.raw?.didNumber || agent.raw?.did || null);
      try {
        if (extension) {
          if (phone && String(phone).trim() !== '') {
            await apiCall(`/api/agent/${encodeURIComponent(extension)}/mobile`, 'POST', { mobile: String(phone) });
          } else {
            // no phone provided - remove mobile mapping
            await apiCall(`/api/agent/${encodeURIComponent(extension)}/mobile`, 'DELETE', null, { data: {} });
          }
        }
        Swal.fire({ icon: 'success', title: 'Saved', text: `Phone for ${agent.name} updated.` });
      } catch (err) {
        console.error('Failed to update agent mobile in AST DB', err);
        Swal.fire({ icon: 'warning', title: 'Partial save', text: `Phone saved for ${agent.name}, but AST DB update failed: ${err?.response?.data?.message || err?.message}` });
      }
    } catch (err) {
      console.error('Failed to save phone for agent', id, err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to save phone' });
    } finally {
      setSavingIds((s) => s.filter((x) => x !== id));
      setSavingClickIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Call Settings</h1>
      </div>

      <CCard className="mb-4">
        <CCardBody>
          <h5>Call Forward</h5>
          <p className="text-muted">Configure per-agent call forward phone numbers below.</p>

          {loading ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-muted">No agents found for your business.</div>
          ) : (
            <div>
              {/* Header labels for columns */}
              <CRow className="align-items-center mb-2 g-1">
                <CCol sm={3} className="fw-semibold">Agent</CCol>
                <CCol sm={3} className="fw-semibold text-muted">Assigned DID</CCol>
                <CCol sm={2} className="fw-semibold">Extension</CCol>
                <CCol sm={2} className="fw-semibold">Forward number</CCol>
                <CCol sm={1} className="fw-semibold text-end">Save</CCol>
                <CCol sm={1} className="fw-semibold text-center">Forward</CCol>
              </CRow>

              {agents.map((agent) => (
                <CRow className="align-items-center mb-3 g-1" key={agent.id}>
                  <CCol sm={3} className="fw-semibold">{agent.name}</CCol>

                  {/* Assigned DID (display only) */}
                  <CCol sm={3} className="text-muted">
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.did ? agent.did : '—'}
                    </div>
                  </CCol>

                  <CCol sm={2} className="text-muted">
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(() => {
                        const did = agent.did;
                        if (did && numberExtensions[did] !== undefined) return numberExtensions[did];
                        return agent.raw?.extension ?? agent.raw?.extensionNumber ?? '—';
                      })()}
                    </div>
                  </CCol>

                  <CCol sm={2}>
                    <CFormInput
                      type="text"
                      value={phones[agent.id] || ""}
                      onChange={(e) => handlePhoneChange(agent.id, e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </CCol>

                  <CCol sm={1} className="text-end">
                    <CButton
                      color="primary"
                      onClick={() => handleSave(agent)}
                      disabled={savingIds.includes(agent.id) || savingClickIds.includes(agent.id)}
                      size="sm"
                    >
                      {savingIds.includes(agent.id) || savingClickIds.includes(agent.id) ? 'Saving...' : 'Save'}
                    </CButton>
                  </CCol>

                  <CCol sm={1} className="text-center">
                    <CFormSwitch
                      id={`cf_switch_${agent.id}`}
                      checked={!!agent.stickyBranch}
                      onChange={() => handleToggleForward(agent)}
                      disabled={savingForwardIds.includes(agent.id)}
                      label=""
                    />
                  </CCol>
                </CRow>
              ))}
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default CallSettings;
