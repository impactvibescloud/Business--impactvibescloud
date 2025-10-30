import React, { useEffect, useState } from "react";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormInput,
  CButton,
  CSpinner,
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
          return {
            id: branch._id || branch.id,
            name,
            phone,
            did,
            raw: branch,
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

  const handlePhoneChange = (id, value) => {
    setPhones((p) => ({ ...p, [id]: value }));
  };

  const handleSave = async (agent) => {
    const id = agent.id;
    const phone = (phones && phones[id]) || "";
    setSavingIds((s) => [...s, id]);
    try {
      // Patch branch - backend may accept userPhone or phone. We try userPhone first.
      const payload = { userPhone: phone };
      await apiCall(`/branch/edit/${id}`, 'PATCH', payload);
      Swal.fire({ icon: 'success', title: 'Saved', text: `Phone for ${agent.name} updated.` });
    } catch (err) {
      console.error('Failed to save phone for agent', id, err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to save phone' });
    } finally {
      setSavingIds((s) => s.filter((x) => x !== id));
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
              <CRow className="align-items-center mb-2">
                <CCol sm={4} className="fw-semibold">
                  Agent
                </CCol>
                <CCol sm={3} className="fw-semibold text-muted">
                  Assigned DID
                </CCol>
                <CCol sm={3} className="fw-semibold">
                  Forward number
                </CCol>
                <CCol sm={2} />
              </CRow>

              {agents.map((agent) => (
                <CRow className="align-items-center mb-3" key={agent.id}>
                  <CCol sm={4} className="fw-semibold">
                    {agent.name}
                  </CCol>

                  {/* Assigned DID (display only) */}
                  <CCol sm={3} className="text-muted">
                    <div style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {agent.did ? agent.did : '—'}
                    </div>
                  </CCol>

                  <CCol sm={3}>
                    <CFormInput
                      type="text"
                      value={phones[agent.id] || ""}
                      onChange={(e) => handlePhoneChange(agent.id, e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </CCol>
                  <CCol sm={2} className="text-end">
                    <CButton
                      color="primary"
                      onClick={() => handleSave(agent)}
                      disabled={savingIds.includes(agent.id)}
                    >
                      {savingIds.includes(agent.id) ? 'Saving...' : 'Save'}
                    </CButton>
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
