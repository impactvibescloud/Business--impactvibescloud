import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";

const isAuthenticated = () => localStorage.getItem("authToken");

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddBranch, setOpenAddBranch] = useState(false);
  const [openEditBranch, setOpenEditBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [branchStatus, setBranchStatus] = useState("Active");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [user, setUser] = useState({});
  const token = isAuthenticated();

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/v1/user/details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err);
      });
  }, [token]);

  useEffect(() => {
    if (user?.businessId) {
      fetchBranches();
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`/api/branch/${user.businessId}/branches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBranches(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleAddBranch = () => {
    setOpenAddBranch(true);
  };

  const handleCloseAddBranch = () => {
    setOpenAddBranch(false);
    resetForm();
  };

  const handleSaveBranch = async () => {
    try {
      await axios.post(
        "/api/branch/create/new",
        {
          branchName,
          managerName,
          branchEmail: managerEmail,
          businessId: user.businessId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchBranches();
      handleCloseAddBranch();
      Swal.fire({
        title: "Agent added successfully!",
        icon: "success",
      });
    } catch (error) {
      console.error("Error adding branch:", error);
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setBranchName(branch.branchName || "");
    setManagerName(branch.manager?.name || "");
    setManagerEmail(branch.manager?.email || "");
    setBranchStatus(branch.status || "Active");
    setOpenEditBranch(true);
  };

  const handleCloseEditBranch = () => {
    setOpenEditBranch(false);
    setSelectedBranch(null);
    resetForm();
  };

  const handleUpdateBranch = async () => {
    try {
      await axios.patch(
        `/api/branch/edit/${selectedBranch._id}`,
        {
          branchName,
          managerName,
          branchEmail: managerEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchBranches();
      handleCloseEditBranch();
      Swal.fire({
        title: "Agent updated successfully!",
        icon: "success",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setBranchName("");
    setManagerName("");
    setManagerEmail("");
    setBranchStatus("Active");
  };

  const handleSuspendBranch = async (branchId) => {
    try {
      await axios.patch(
        `/api/branch/${branchId}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchBranches(); // Refresh the list
      Swal.fire({
        icon: "success",
        title: "Agent status updated successfully",
      });
    } catch (error) {
      console.error("Error suspending branch:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong",
      });
    }
  };


  const handleDeleteBranch = (branchId) => {
    console.log("Delete branch:", branchId);
  };

  const handleResetPassword = async (email) => {
    try {
      Swal.fire({
        title: 'Are you sure?',
        text: "This will reset the manager's password. They will receive an email with instructions.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.post(
            `/api/v1/user/password/forgot`,
            {
              email
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          Swal.fire({
            icon: 'success',
            title: 'Password Reset',
            text: 'Password has been reset successfully. An email has been sent to the manager.',
          });
        }
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Something went wrong',
      });
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Agents</Typography>
        <Button variant="contained" onClick={handleAddBranch}>
          Add Agent
        </Button>
      </Stack>

      {/* Add Agent Modal */}
      <Dialog open={openAddBranch} onClose={handleCloseAddBranch} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Agent</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Agent Name"
              fullWidth
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
            <TextField
              label="Manager Name"
              fullWidth
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
            <TextField
              label="Manager Email"
              fullWidth
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddBranch}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBranch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={openEditBranch} onClose={handleCloseEditBranch} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Agent Name"
              fullWidth
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
            <TextField
              label="Manager Name"
              fullWidth
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
            <TextField
              label="Manager Email"
              fullWidth
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditBranch}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateBranch}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Agents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Agent Name</TableCell>
              <TableCell>Manager Name</TableCell>
              <TableCell>Manager Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch._id}>
                <TableCell>{branch.branchName}</TableCell>
                <TableCell>{branch.manager?.name || "-"}</TableCell>
                <TableCell>{branch.manager?.email || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={branch.isSuspended ? "Suspended" : "Active"}
                    color={branch.isSuspended ? "warning" : "success"}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleEditBranch(branch)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color={branch.isSuspended ? "success" : "warning"}
                      onClick={() => handleSuspendBranch(branch.id)}
                    >
                      {branch.isSuspended
                          ? "Activate"
                          : "Suspend"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => handleResetPassword(branch.manager.email)}
                    >
                      Reset
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && branches.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No agents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Branches;
