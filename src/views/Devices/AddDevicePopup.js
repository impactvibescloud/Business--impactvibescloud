import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import axios from "axios";
import { isAutheticated } from "src/auth";

const AddDevicePopup = ({ open, onClose, onSave, businessId }) => {
  const token = isAutheticated();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [deviceIdValue, setDeviceIdValue] = useState(""); // Changed from deviceName
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await axios.get(`/api/branch/${businessId}/branches`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBranches(response.data.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    if (open) {
      fetchOutlets();
      // Reset fields when popup opens
      setSelectedBranch(""); // Keep
      setDeviceIdValue(""); // Changed from setDeviceName
    }
  }, [open, token, businessId]);

  const handleSave = () => {
    if (!selectedBranch) {
      setNotification({ open: true, message: "Please select an branch", severity: "error" });
      return;
    }
    if (!deviceIdValue.trim()) { // Changed from deviceName
      setNotification({ open: true, message: "Please enter a Device ID", severity: "error" }); // Changed message
      return;
    }

    onSave(selectedBranch, deviceIdValue.trim()); // Changed from deviceName
    onClose();
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Device</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="deviceId" // Changed id
            label="Device ID" // Changed label
            type="text"
            fullWidth
            variant="outlined"
            value={deviceIdValue} // Changed value
            onChange={(e) => setDeviceIdValue(e.target.value)} // Changed onChange
            sx={{ mb: 2 }}
          />
          <InputLabel id="branch-select-label">Select Branch</InputLabel>
          <Select
            labelId="branch-select-label"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
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
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddDevicePopup;