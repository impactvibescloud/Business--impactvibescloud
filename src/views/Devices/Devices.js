import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Card,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { isAutheticated } from "src/auth";
import AddDevicePopup from "./AddDevicePopup";
import EditDevicePopup from "./EditDevicePopup";

const Devices = () => {
  const token = isAutheticated();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState(null);
  // const navigate = useNavigate(); // Not used, can be removed if not needed elsewhere

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
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (user?.businessId) {
      fetchDevices();
    }
  }, [user]); // Fetch devices when user changes

  const fetchDevices = async () => {
    if (!user?.businessId) {
      setDevices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`/api/business/device/${user.businessId}/get_all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming the API returns all devices if no page is specified,
      // or you might need to adjust the API endpoint if it strictly requires pagination.
      setDevices(response.data.data);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
    setLoading(false); // Ensure loading is set to false in all cases
  };

  const handleAddDevice = async (selectedBranchId, deviceIdValue) => { // Renamed deviceName to deviceIdValue
    try {
      await axios.post(
        "/api/business/device/create/new", // Ensure this API endpoint is correct
        { branchId: selectedBranchId, businessId: user?.businessId, deviceId: deviceIdValue }, // Changed deviceName to deviceId
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDevices();
      Swal.fire({
        title: "Device added successfully!",
        icon: "success",
      });
      setIsPopupOpen(false); // Close popup on success
    } catch (error) {
      console.error("Error adding device:", error);
      Swal.fire({
        title: "Failed to add device!",
        text: error?.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  const handleToggleDeviceStatus = async (device) => {
    const currentStatus = device.status || 'suspended'; // Default to 'suspended' if status is not present
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'suspend';

    Swal.fire({
      title: `Confirm ${actionText}`,
      text: `Are you sure you want to ${actionText} the device "${device.deviceId}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${actionText} it!`
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.patch(
            `/api/business/device/${device._id}/status`,
            { status: newStatus },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          fetchDevices(); // Refresh list
          Swal.fire(
            `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}d!`,
            `Device "${device.deviceId}" has been ${actionText}d.`,
            'success'
          );
        } catch (error) {
          console.error(`Error ${actionText}ing device:`, error);
          Swal.fire('Error!', error?.response?.data?.message || `Could not ${actionText} device.`, 'error');
        }
      }
    });
  };

  const handleEditSuccess = () => {
    fetchDevices();
    setIsEditPopupOpen(false);
    setSelectedDeviceForEdit(null);
  };

  const handleCloseEditPopup = () => {
    setIsEditPopupOpen(false);
    setSelectedDeviceForEdit(null);
  };

  return (
    <Box component={Card} p={3}>
      {/* Title and Add Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Devices
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsPopupOpen(true)}
          sx={{ textTransform: "none" }}
        >
          Add Device
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Branch Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && devices.length > 0 &&
              devices.map((device) => (
                <TableRow key={device._id}>
                  <TableCell>{device?.branchId?.branchName || "Unassigned"}</TableCell>
                  <TableCell>{device.deviceId}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setSelectedDeviceForEdit(device);
                        setIsEditPopupOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    {/* Status Button */}
                    <Button
                      variant="outlined"
                      color={device.status === 'active' ? 'warning' : 'success'}
                      onClick={() => handleToggleDeviceStatus(device)}
                    >
                      {device.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center"> {/* Corrected colSpan to 3 */}
                  No devices found.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body1" color="textSecondary">
                    Loading devices... {/* Corrected loading message */}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Device Popup */}
      <AddDevicePopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={handleAddDevice}
        businessId={user?.businessId}
      />
      <EditDevicePopup
        open={isEditPopupOpen}
        onClose={handleCloseEditPopup}
        deviceId={selectedDeviceForEdit?._id} // This is the MongoDB _id for the API call
        initialDeviceData={selectedDeviceForEdit} // Pass the whole device object for pre-filling
        onUpdate={handleEditSuccess}
        businessId={user?.businessId}
      />
    </Box>
  );
};

export default Devices;