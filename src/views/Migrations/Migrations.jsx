import React, { useCallback, useEffect, useState } from "react";
import { apiCall } from "../../config/api";
import Swal from "sweetalert2";

/**
 * Business-side Migrations & Critical Ops page.
 *
 * Mirrors the admin Migrations page but scopes everything to the
 * authenticated business — the user can't pick another business. Used
 * for self-service v2 SIP identity migration so each business admin
 * can run their own rollout without contacting the platform team.
 */
const Migrations = () => {
  const [tab, setTab] = useState("sip");
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  const [opsLog, setOpsLog] = useState([]);

  // Diagnose state
  const [diagnoseEmail, setDiagnoseEmail] = useState("");
  const [diagnoseLoading, setDiagnoseLoading] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState(null);

  const pushOp = (kind, summary) => {
    setOpsLog((prev) =>
      [{ at: new Date().toISOString(), kind, summary }, ...prev].slice(0, 20),
    );
  };

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await apiCall("/v1/agent/sip-identity/status", "GET");
      const data = res?.data || res?.data?.data || res;
      // apiCall sometimes hands us the parsed body directly, sometimes
      // the axios wrapper — normalize.
      const payload = data?.data || data;
      setStatus(payload);
      pushOp(
        "status",
        `Status: ${payload.migrated}/${payload.total} migrated (${payload.pending} pending)`,
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Status fetch failed";
      setStatusError(msg);
      Swal.fire("Status error", msg, "error");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const resyncRouting = async () => {
    const confirm = await Swal.fire({
      title: "Re-sync department routing?",
      text: "Rebuilds dept_members, did_dept, and NumberAssignment for every department in this business — using MongoDB as the source of truth. Use this if inbound calls don't ring agents OR outbound calls show the wrong Caller-ID after the v2 migration.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Re-sync now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });
    if (!confirm.isConfirmed) return;
    setMigrating(true);
    try {
      const res = await apiCall(
        "/v1/agent/sip-identity/resync-routing",
        "POST",
        {},
        { timeout: 90000 },
      );
      const data = res?.data || res;
      const payload = data?.data || data;
      pushOp(
        "migrate",
        `Re-synced ${payload.ok}/${payload.departments} dept(s)${payload.failed ? `, ${payload.failed} with errors` : ""}`,
      );
      const summary =
        `Re-synced ${payload.ok} of ${payload.departments} department(s).` +
        (payload.failed
          ? `\n\n${payload.failed} department(s) had errors — check the API logs.`
          : "");
      Swal.fire(
        payload.failed ? "Re-sync completed with errors" : "Re-sync complete",
        summary,
        payload.failed ? "warning" : "success",
      );
    } catch (e) {
      Swal.fire(
        "Re-sync failed",
        e?.response?.data?.message || e?.message || "Re-sync failed",
        "error",
      );
    } finally {
      setMigrating(false);
    }
  };

  const rebuildPjsip = async () => {
    const confirm = await Swal.fire({
      title: "Rebuild PJSIP config?",
      text: "Rewrites /etc/asterisk/v2_user_endpoints.conf from MongoDB (source of truth) and reloads PJSIP. Use this if agents are seeing 'Authentication Error' — usually means the on-disk passwords got corrupted during the initial provisioning. Safe to run anytime.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Rebuild now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });
    if (!confirm.isConfirmed) return;
    setMigrating(true);
    try {
      // 60s timeout — the rebuild is two SSH calls (config write +
      // pjsip reload) plus a background astdb reseed. The synchronous
      // path is usually <3s, but SSH connection setup on a slow PBX
      // can occasionally push it past the default 10s axios timeout.
      const res = await apiCall(
        "/v1/agent/sip-identity/rebuild-pjsip",
        "POST",
        {},
        { timeout: 60000 },
      );
      const data = res?.data || res;
      const payload = data?.data || data;
      pushOp("migrate", `Rebuilt ${payload.rebuilt} PJSIP endpoint(s)`);
      Swal.fire(
        "Rebuild complete",
        `${payload.rebuilt} endpoint(s) rewritten and PJSIP reloaded. Have affected agents reload the dialer.`,
        "success",
      );
    } catch (e) {
      Swal.fire(
        "Rebuild failed",
        e?.response?.data?.message || e?.message || "PBX rewrite failed",
        "error",
      );
    } finally {
      setMigrating(false);
    }
  };

  const runDiagnose = async () => {
    if (!diagnoseEmail) {
      Swal.fire("Email required", "Enter the agent's email to diagnose.", "warning");
      return;
    }
    setDiagnoseLoading(true);
    setDiagnoseResult(null);
    try {
      const res = await apiCall(
        `/v1/agent/sip-identity/diagnose?email=${encodeURIComponent(diagnoseEmail)}`,
        "GET",
        null,
        { timeout: 30000 },
      );
      const data = res?.data || res;
      const payload = data?.data || data;
      setDiagnoseResult(payload);
    } catch (e) {
      Swal.fire(
        "Diagnose failed",
        e?.response?.data?.message || e?.message || "Lookup failed",
        "error",
      );
    } finally {
      setDiagnoseLoading(false);
    }
  };

  const runMigration = async (dryRun) => {
    if (!dryRun) {
      const result = await Swal.fire({
        title: "Run live migration?",
        text: `This will generate v2 SIP identities for every pending agent (${status?.pending ?? "?"}) and provision PJSIP endpoints on the PBX.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, migrate",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#10b981",
      });
      if (!result.isConfirmed) return;
    }
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await apiCall("/v1/agent/sip-identity/migrate", "POST", {
        dryRun,
      });
      const data = res?.data || res;
      const payload = data?.data || data;
      setMigrateResult(payload);
      pushOp(
        dryRun ? "dryRun" : "migrate",
        dryRun
          ? `Dry run: ${payload.eligible} would be migrated`
          : `Migrated ${payload.generated}/${payload.eligible} (${payload.provisioned} provisioned, ${payload.failures?.length || 0} failures)`,
      );
      if (!dryRun) {
        Swal.fire(
          "Migration complete",
          `Generated ${payload.generated} identities, ${payload.provisioned} PJSIP endpoints provisioned.`,
          "success",
        );
        fetchStatus();
      } else {
        Swal.fire(
          "Dry run complete",
          `${payload.eligible} agents would be migrated.`,
          "info",
        );
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Migration failed";
      Swal.fire("Migration failed", msg, "error");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Business / Migrations & Ops
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>
          Migrations & Critical Ops
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Manage v2 SIP identity rollout and other critical operations for
          your business.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 24,
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 24,
        }}
      >
        <TabBtn label="SIP Identity (v2)" active={tab === "sip"} onClick={() => setTab("sip")} />
        <TabBtn label="Recent Ops" active={tab === "ops"} onClick={() => setTab("ops")} />
      </div>

      {tab === "sip" && (
        <>
          {/* Status row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Migration status</div>
            <button
              onClick={fetchStatus}
              disabled={statusLoading}
              style={btnSecondary}
            >
              {statusLoading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          {statusError && (
            <div style={{ ...alertBox, background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
              {statusError}
            </div>
          )}

          {status && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <StatCard label="Total agents" value={status.total} />
                <StatCard
                  label="Migrated"
                  value={status.migrated}
                  tone={status.migrated === status.total ? "good" : "warn"}
                />
                <StatCard
                  label="Pending"
                  value={status.pending}
                  tone={status.pending === 0 ? "good" : "warn"}
                />
              </div>

              {/* Actions */}
              <div style={cardBox}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      Bulk migration
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      Generates the v2 SIP identity, seeds astdb, appends the PJSIP endpoint, reloads. Safe to re-run.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => runMigration(true)}
                      disabled={migrating || status.pending === 0}
                      style={btnSecondary}
                    >
                      {migrating ? "Running…" : "Dry Run"}
                    </button>
                    <button
                      onClick={() => runMigration(false)}
                      disabled={migrating || status.pending === 0}
                      style={btnPrimary}
                    >
                      {migrating ? "Migrating…" : `Migrate ${status.pending} agents`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Repair tools */}
              <div style={{ ...cardBox, marginTop: 12, borderColor: "#fde68a", background: "#fffbeb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>
                      Repair: Rebuild PJSIP config from DB
                    </div>
                    <div style={{ fontSize: 12, color: "#92400e", marginTop: 4, maxWidth: 600 }}>
                      Use this if agents see <strong>"Reg. Failed: Authentication Error"</strong>. Rewrites the PBX include file using MongoDB as the source of truth and reloads PJSIP.
                    </div>
                  </div>
                  <button
                    onClick={rebuildPjsip}
                    disabled={migrating || !status || status.migrated === 0}
                    style={{ ...btnSecondary, borderColor: "#d97706", color: "#92400e" }}
                  >
                    {migrating ? "Rebuilding…" : "Rebuild PJSIP"}
                  </button>
                </div>
              </div>

              <div style={{ ...cardBox, marginTop: 12, borderColor: "#bfdbfe", background: "#eff6ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>
                      Repair: Re-sync Department Routing
                    </div>
                    <div style={{ fontSize: 12, color: "#1e40af", marginTop: 4, maxWidth: 600 }}>
                      Use this if <strong>inbound calls to a department DID don't ring any agent</strong>, or <strong>outbound calls show the wrong Caller-ID</strong>. Rebuilds <code>dept_members</code>, <code>did_dept</code>, and NumberAssignment for every department using MongoDB as truth. Run this once after the v2 migration.
                    </div>
                  </div>
                  <button
                    onClick={resyncRouting}
                    disabled={migrating}
                    style={{ ...btnSecondary, borderColor: "#2563eb", color: "#1e40af" }}
                  >
                    {migrating ? "Re-syncing…" : "Re-sync Routing"}
                  </button>
                </div>
              </div>

              {/* Diagnose one agent */}
              <div style={{ ...cardBox, marginTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                  Diagnose one agent
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                  Compares what's in MongoDB, what's written to the PBX config file, and what Asterisk knows for an agent. Use this to find exactly where the mismatch is for an agent stuck on "Authentication Error".
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    type="email"
                    placeholder="agent@example.com"
                    value={diagnoseEmail}
                    onChange={(e) => setDiagnoseEmail(e.target.value.trim())}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: 13,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                    }}
                  />
                  <button
                    onClick={runDiagnose}
                    disabled={diagnoseLoading || !diagnoseEmail}
                    style={btnSecondary}
                  >
                    {diagnoseLoading ? "Looking up…" : "Diagnose"}
                  </button>
                </div>
                {diagnoseResult && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <DiagBlock label="MongoDB" value={JSON.stringify(diagnoseResult.db, null, 2)} />
                    <DiagBlock label={`Config file block (${diagnoseResult.include_path})`} value={diagnoseResult.conf_block} />
                    <DiagBlock label="pjsip show endpoint" value={diagnoseResult.pjsip_show_endpoint} />
                    <DiagBlock label="astdb" value={diagnoseResult.astdb} />
                  </div>
                )}
              </div>

              {/* Pending list */}
              {status.pendingList && status.pendingList.length > 0 && (
                <div style={{ ...cardBox, padding: 0, marginTop: 16 }}>
                  <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600 }}>
                    Pending users (up to 100)
                  </div>
                  <div style={{ maxHeight: 280, overflow: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                      <thead style={{ background: "#f9fafb" }}>
                        <tr>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Role</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.pendingList.map((u) => (
                          <tr key={u._id} style={{ borderTop: "1px solid #f3f4f6" }}>
                            <Td>{u.name || "—"}</Td>
                            <Td style={{ color: "#6b7280" }}>{u.email || "—"}</Td>
                            <Td>{u.role || "—"}</Td>
                            <Td>{u.status || "—"}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Migration result */}
              {migrateResult && (
                <div style={{ ...cardBox, marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                    {migrateResult.dryRun ? "Dry-run result" : "Migration result"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                    <Field label="Eligible" value={migrateResult.eligible} />
                    <Field label="Generated" value={migrateResult.generated} />
                    <Field label="Provisioned" value={migrateResult.provisioned} />
                    <Field
                      label="Failures"
                      value={migrateResult.failures?.length || 0}
                      tone={(migrateResult.failures?.length || 0) > 0 ? "bad" : "good"}
                    />
                  </div>
                  {migrateResult.failures && migrateResult.failures.length > 0 && (
                    <div style={{ ...alertBox, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Per-user failures</div>
                      <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 160, overflow: "auto" }}>
                        {migrateResult.failures.map((f, i) => (
                          <li key={i} style={{ fontFamily: "monospace", fontSize: 12 }}>
                            <strong>{f.userId}</strong>: {f.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "ops" && (
        <div style={{ ...cardBox, padding: 0 }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600 }}>
            Recent operations (this session, newest first)
          </div>
          {opsLog.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              No operations run yet in this session.
            </div>
          ) : (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <Th>Time</Th>
                  <Th>Kind</Th>
                  <Th>Summary</Th>
                </tr>
              </thead>
              <tbody>
                {opsLog.map((o, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <Td style={{ color: "#6b7280" }}>{new Date(o.at).toLocaleTimeString()}</Td>
                    <Td><Pill kind={o.kind} /></Td>
                    <Td>{o.summary}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ---- styles & helpers ------------------------------------------------------

const btnPrimary = {
  background: "#10b981",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
const btnSecondary = {
  background: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  padding: "8px 16px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
const cardBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
};
const alertBox = {
  border: "1px solid",
  borderRadius: 6,
  padding: 12,
  fontSize: 13,
  marginBottom: 12,
};

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      padding: "12px 0",
      fontSize: 14,
      fontWeight: 500,
      color: active ? "#2563eb" : "#6b7280",
      borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
      marginBottom: -1,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

const StatCard = ({ label, value, tone = "neutral" }) => {
  const color =
    tone === "good"
      ? "#10b981"
      : tone === "warn"
      ? "#d97706"
      : tone === "bad"
      ? "#dc2626"
      : "#111827";
  return (
    <div style={cardBox}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
};

const Field = ({ label, value, tone = "neutral" }) => {
  const color =
    tone === "good"
      ? "#047857"
      : tone === "warn"
      ? "#b45309"
      : tone === "bad"
      ? "#b91c1c"
      : "#111827";
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 12 }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
    </div>
  );
};

const Th = ({ children }) => (
  <th style={{ textAlign: "left", padding: "8px 12px", textTransform: "uppercase", fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
    {children}
  </th>
);
const Td = ({ children, style }) => (
  <td style={{ padding: "8px 12px", ...style }}>{children}</td>
);

const DiagBlock = ({ label, value }) => {
  const text =
    value == null
      ? "(none)"
      : typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6 }}>
      <div
        style={{
          padding: "6px 10px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 10,
          fontSize: 11,
          fontFamily: "monospace",
          background: "white",
          color: "#111827",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        {text || "(empty)"}
      </pre>
    </div>
  );
};

const Pill = ({ kind }) => {
  const styles = {
    status: { background: "#dbeafe", color: "#1d4ed8" },
    dryRun: { background: "#f3f4f6", color: "#374151" },
    migrate: { background: "#d1fae5", color: "#047857" },
  };
  const labels = { status: "STATUS", dryRun: "DRY-RUN", migrate: "MIGRATE" };
  return (
    <span
      style={{
        ...styles[kind],
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {labels[kind]}
    </span>
  );
};

export default Migrations;
