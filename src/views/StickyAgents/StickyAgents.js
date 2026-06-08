import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Pagination,
} from "@mui/material";
import { Edit, Delete, Search, Refresh, Add } from "@mui/icons-material";
import Swal from "sweetalert2";
import { apiCall } from "../../config/api";
import { isAutheticated } from "../../auth";

// Sticky Agents page
//
// Lists every "this caller previously talked to this agent" mapping for
// the current business and lets the business admin edit or clear them.
// Backed by AstDB key sticky_agent/<businessId>/<callerNumber> -> extension,
// served by /api/sticky-agents.

const StickyAgents = () => {
  const token = isAutheticated();
  const [user, setUser] = useState({});
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editExtension, setEditExtension] = useState("");
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingNumber, setDeletingNumber] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createCallerNumber, setCreateCallerNumber] = useState("");
  const [createExtension, setCreateExtension] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);
  const [syncingLegacy, setSyncingLegacy] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ---- Initial data ----
  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      try {
        const res = await apiCall("/v1/user/details", "GET");
        const u = res.user || res.data?.user || res;
        setUser(u || {});
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }
    };
    fetchUser();
  }, [token]);

  const loadDepartments = async (businessId) => {
    if (!businessId) return;
    try {
      const res = await apiCall(`/departments/business/${businessId}`, "GET");
      const list = res.data || res.departments || res || [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
      setDepartments([]);
    }
  };

  const loadMappings = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const qs = selectedDept
        ? `?department=${encodeURIComponent(selectedDept)}`
        : "";
      const res = await apiCall(`/sticky-agents${qs}`, "GET");
      const list = res.data || [];
      setMappings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch sticky agents", err);
      setMappings([]);
      if (!silent) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            err?.response?.data?.message ||
            "Failed to load sticky agent mappings",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.businessId) loadDepartments(user.businessId);
  }, [user?.businessId]);

  useEffect(() => {
    if (user?.businessId) loadMappings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.businessId, selectedDept]);

  // ---- Filtering / search ----
  const filteredMappings = useMemo(() => {
    const q = search.trim();
    if (!q) return mappings;
    const lower = q.toLowerCase();
    return mappings.filter(
      (m) =>
        (m.callerNumber || "").includes(q) ||
        (m.extension || "").includes(q) ||
        (m.agentName || "").toLowerCase().includes(lower),
    );
  }, [mappings, search]);

  // ---- Edit modal ----
  const openEdit = async (row) => {
    setEditTarget(row);
    setEditExtension(row.extension || "");
    setEditOpen(true);
    setAssignableAgents([]);
    try {
      // If a department is selected, scope the agent dropdown to it; otherwise
      // show every agent in the business.
      const qs = selectedDept
        ? `?department=${encodeURIComponent(selectedDept)}`
        : "";
      const res = await apiCall(`/sticky-agents/assignable-agents${qs}`, "GET");
      setAssignableAgents(res.data || []);
    } catch (err) {
      console.error("Failed to load assignable agents", err);
      setAssignableAgents([]);
    }
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    setEditExtension("");
    setAssignableAgents([]);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editExtension || !/^[0-9]+$/.test(editExtension)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid extension",
        text: "Pick an agent from the dropdown.",
      });
      return;
    }
    setSavingEdit(true);
    try {
      await apiCall(
        `/sticky-agents/${encodeURIComponent(editTarget.callerNumber)}`,
        "PUT",
        { extension: editExtension },
      );
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Caller ${editTarget.callerNumber} now sticky to ext ${editExtension}.`,
        timer: 1800,
        showConfirmButton: false,
      });
      closeEdit();
      loadMappings({ silent: true });
    } catch (err) {
      console.error("Failed to save sticky", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to update sticky agent mapping",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async (row) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Clear sticky agent?",
      text: `Caller ${row.callerNumber} will no longer be auto-routed to ${row.agentName} (ext ${row.extension}).`,
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    setDeletingNumber(row.callerNumber);
    try {
      await apiCall(
        `/sticky-agents/${encodeURIComponent(row.callerNumber)}`,
        "DELETE",
      );
      setMappings((prev) =>
        prev.filter((m) => m.callerNumber !== row.callerNumber),
      );
    } catch (err) {
      console.error("Failed to delete sticky", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to clear sticky agent mapping",
      });
    } finally {
      setDeletingNumber("");
    }
  };

  // ---- Create ----
  const openCreate = async () => {
    setCreateOpen(true);
    setCreateCallerNumber("");
    setCreateExtension("");
    try {
      const qs = selectedDept
        ? `?department=${encodeURIComponent(selectedDept)}`
        : "";
      const res = await apiCall(`/sticky-agents/assignable-agents${qs}`, "GET");
      setAssignableAgents(res.data || []);
    } catch (err) {
      console.error("Failed to load assignable agents", err);
      setAssignableAgents([]);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateCallerNumber("");
    setCreateExtension("");
  };

  const saveCreate = async () => {
    if (!createCallerNumber || !/^[0-9]{4,20}$/.test(createCallerNumber)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid caller number",
        text: "Caller number must be 4-20 digits.",
      });
      return;
    }
    if (!createExtension) {
      Swal.fire({
        icon: "warning",
        title: "Invalid extension",
        text: "Pick an agent from the dropdown.",
      });
      return;
    }
    setSavingCreate(true);
    try {
      await apiCall(`/sticky-agents`, "POST", {
        callerNumber: createCallerNumber,
        extension: createExtension,
      });
      Swal.fire({
        icon: "success",
        title: "Created",
        text: `Caller ${createCallerNumber} now sticky to ext ${createExtension}.`,
        timer: 1800,
        showConfirmButton: false,
      });
      closeCreate();
      loadMappings({ silent: true });
    } catch (err) {
      console.error("Failed to create sticky", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to create sticky agent mapping",
      });
    } finally {
      setSavingCreate(false);
    }
  };

  // ---- Sync Legacy ----
  const handleSyncLegacy = async () => {
    const result = await Swal.fire({
      icon: "info",
      title: "Migrate legacy entries?",
      text: "This will convert old-format sticky agent entries to the new format with business scoping. No data is lost.",
      showCancelButton: true,
      confirmButtonText: "Yes, sync now",
    });
    if (!result.isConfirmed) return;

    setSyncingLegacy(true);
    try {
      const res = await apiCall(`/sticky-agents/sync/legacy`, "POST");
      const { message, data } = res;
      const migratedCount = data?.filter(d => d.status === "migrated").length || 0;

      Swal.fire({
        icon: "success",
        title: "Sync Complete",
        text: `${message}`,
      });

      loadMappings({ silent: true });
    } catch (err) {
      console.error("Failed to sync legacy", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to sync legacy sticky agent entries",
      });
    } finally {
      setSyncingLegacy(false);
    }
  };

  // ---- Clear All ----
  const handleClearAll = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Clear all sticky agents?",
      text: `This will delete ALL ${mappings.length} sticky agent mappings for this business. This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, clear all",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    setClearingAll(true);
    try {
      const response = await apiCall(
        `/sticky-agents/delete-all`,
        "DELETE",
        null,
        { timeout: 60000 },
      );
      const deletedCount = response?.count || 0;
      
      // Reload data to verify deletion
      try {
        await loadMappings({ silent: true });
      } catch (reloadErr) {
        console.warn("Warning: Failed to reload mappings after delete-all", reloadErr);
        // Still consider it a success if delete worked, even if reload failed
        setMappings([]);
      }
      
      setCurrentPage(1);
      Swal.fire({
        icon: "success",
        title: "Cleared",
        text: `Deleted ${deletedCount} sticky agent mappings.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to clear all sticky", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to clear all sticky agent mappings",
      });
    } finally {
      setClearingAll(false);
    }
  };

  // ---- Pagination ----
  const totalPages = Math.ceil(filteredMappings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMappings = filteredMappings.slice(startIndex, endIndex);

  // ---- Render ----
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5">Sticky Agents</Typography>
          <Typography variant="body2" className="text-muted">
            Callers are auto-routed to the agent who last answered them. Edit
            or clear individual mappings below.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            color="secondary"
            size="small"
            onClick={handleSyncLegacy}
            disabled={syncingLegacy || loading || refreshing}
            title="Migrate legacy entries to new format"
          >
            {syncingLegacy ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
          <IconButton
            size="small"
            onClick={openCreate}
            disabled={loading}
            title="Create new sticky agent mapping"
          >
            <Add />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClearAll}
            disabled={clearingAll || loading || mappings.length === 0}
            title="Clear all sticky agent mappings"
            color="error"
          >
            {clearingAll ? <CircularProgress size={20} /> : <Delete />}
          </IconButton>
        </Box>
      </Box>

      <Card className="mb-3">
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              label="Department"
              select
              value={selectedDept}
              onChange={(e) => {
                setCurrentPage(1);
                setSelectedDept(e.target.value);
              }}
              style={{ minWidth: 220 }}
            >
              <MenuItem value="">All departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id || d.id || d.name} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              placeholder="Search caller, extension, or agent"
              value={search}
              onChange={(e) => {
                setCurrentPage(1);
                setSearch(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              style={{ minWidth: 280, flex: 1 }}
            />

            <Box flexGrow={1} />
            <Typography variant="body2" className="text-muted">
              {filteredMappings.length} mapping
              {filteredMappings.length === 1 ? "" : "s"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : filteredMappings.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" className="text-muted">
                No sticky agent mappings found.
              </Typography>
              <Typography variant="caption" className="text-muted">
                Mappings are created automatically once a caller speaks to an
                agent and the call ends successfully.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Caller Number</TableCell>
                      <TableCell>Sticky Agent</TableCell>
                      <TableCell>Extension</TableCell>
                      <TableCell>Department(s)</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedMappings.map((row) => (
                      <TableRow key={row.callerNumber} hover>
                        <TableCell>{row.callerNumber}</TableCell>
                        <TableCell>{row.agentName}</TableCell>
                        <TableCell>{row.extension}</TableCell>
                        <TableCell>
                          {(row.departments || []).length === 0 ? (
                            <Typography
                              variant="caption"
                              className="text-muted"
                            >
                              —
                            </Typography>
                          ) : (
                            (row.departments || []).map((d) => (
                              <Chip
                                key={d}
                                label={d}
                                size="small"
                                style={{ marginRight: 4 }}
                              />
                            ))
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(row)}
                            title="Edit sticky agent"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row)}
                            disabled={deletingNumber === row.callerNumber}
                            title="Clear sticky agent"
                          >
                            {deletingNumber === row.callerNumber ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Delete fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box mt={3} display="flex" justifyContent="center">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Edit sticky agent</DialogTitle>
        <DialogContent>
          {editTarget && (
            <Box mb={2}>
              <Typography variant="body2">
                Caller: <strong>{editTarget.callerNumber}</strong>
              </Typography>
              <Typography variant="body2" className="text-muted">
                Currently sticky to {editTarget.agentName} (ext{" "}
                {editTarget.extension})
              </Typography>
            </Box>
          )}
          <TextField
            label="New agent"
            select
            fullWidth
            size="small"
            value={editExtension}
            onChange={(e) => setEditExtension(e.target.value)}
          >
            {assignableAgents.length === 0 ? (
              <MenuItem disabled value="">
                No agents available
              </MenuItem>
            ) : (
              assignableAgents.map((a) => (
                <MenuItem key={a.extension} value={a.extension}>
                  {a.agentName} — ext {a.extension}
                </MenuItem>
              ))
            )}
          </TextField>
          {selectedDept && (
            <Typography
              variant="caption"
              className="text-muted"
              style={{ marginTop: 8, display: "block" }}
            >
              Showing only agents in department: <strong>{selectedDept}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={savingEdit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={saveEdit}
            disabled={savingEdit || !editExtension}
          >
            {savingEdit ? <CircularProgress size={18} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={closeCreate} maxWidth="xs" fullWidth>
        <DialogTitle>Create sticky agent mapping</DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Caller Number"
              fullWidth
              size="small"
              value={createCallerNumber}
              onChange={(e) => setCreateCallerNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              helperText="4-20 digits"
            />
            <TextField
              label="Assign to Agent"
              select
              fullWidth
              size="small"
              value={createExtension}
              onChange={(e) => setCreateExtension(e.target.value)}
            >
              {assignableAgents.length === 0 ? (
                <MenuItem disabled value="">
                  No agents available
                </MenuItem>
              ) : (
                assignableAgents.map((a) => (
                  <MenuItem key={a.extension} value={a.extension}>
                    {a.agentName} — ext {a.extension}
                  </MenuItem>
                ))
              )}
            </TextField>
            {selectedDept && (
              <Typography
                variant="caption"
                className="text-muted"
              >
                Showing only agents in department: <strong>{selectedDept}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate} disabled={savingCreate}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={saveCreate}
            disabled={savingCreate || !createCallerNumber || !createExtension}
          >
            {savingCreate ? <CircularProgress size={18} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StickyAgents;
