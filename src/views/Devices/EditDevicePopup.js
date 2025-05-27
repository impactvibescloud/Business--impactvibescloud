import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import axios from "axios";
import { isAutheticated } from "src/auth";

const EditDevicePopup = ({ open, onClose, deviceId, initialDeviceData, onUpdate, businessId }) => {
  const token = isAutheticated();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [currentDeviceIdValue, setCurrentDeviceIdValue] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchBranchesForBusiness = async () => {
      if (!businessId) return;
      try {
        const response = await axios.get(`/api/branch/${businessId}/branches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(response.data.data || []);
      } catch (error) {
        console.error("Error fetching branches:", error);
        setNotification({ open: true, message: "Failed to fetch branches.", severity: "error" });
      }
    };

    if (open) {
      fetchBranchesForBusiness();
      if (initialDeviceData) {
        setCurrentDeviceIdValue(initialDeviceData.deviceId || "");
        setSelectedBranchId(initialDeviceData.branchId?._id || initialDeviceData.branchId || "");
      } else {
        // Should not happen if opened via edit button, but good for robustness
        setCurrentDeviceIdValue("");
        setSelectedBranchId("");
      }
    } else {
      setCurrentDeviceIdValue("");
      setSelectedBranchId("");
      setBranches([]);
    }
  }, [open, initialDeviceData, token, businessId]);

  const handleSave = async () => {
    if (!currentDeviceIdValue.trim()) {
      setNotification({ open: true, message: "Please enter a Device ID.", severity: "error" });
      return;
    }
    if (!selectedBranchId) {
      setNotification({ open: true, message: "Please select a branch.", severity: "error" });
      return;
    }

    try {
      await axios.patch(
        `/api/business/device/edit/${deviceId}`,
        {
          deviceId: currentDeviceIdValue.trim(),
          branchId: selectedBranchId,
          businessId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotification({ open: true, message: "Device updated successfully!", severity: "success" });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating device:", error);
      setNotification({
        open: true,
        message: error?.response?.data?.message || "Failed to update device.",
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Device</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="edit-deviceId"
          label="Device ID"
          type="text"
          fullWidth
          variant="outlined"
          value={currentDeviceIdValue}
          onChange={(e) => setCurrentDeviceIdValue(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
        />
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="branch-select-label-edit">Select Branch</InputLabel>
          <Select
            labelId="branch-select-label-edit"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            label="Select Branch"
          >
            {branches.map((branch) => (
              <MenuItem key={branch._id} value={branch._id}>
                {branch.branchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditDevicePopup;