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
  Pagination,
  Avatar,
  Typography,
  Card,
  TextField,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import { isAutheticated } from "src/auth"; // Import isAutheticated

const FacesTable = () => {
  const token = isAutheticated(); // Get token
  const [faces, setFaces] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    // Fetch user details to get businessId
    const fetchUserDetails = async () => {
      if (!token) return;
      try {
        const response = await axios.get("/api/v1/user/details", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBusinessId(response.data.user?.businessId);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, [token]);

  useEffect(() => {
    if (businessId) {
      fetchBranches();
      fetchFaces(page, businessId, selectedBranch, startDate, endDate); // Pass all params
    }
  }, [page, businessId, selectedBranch, startDate, endDate]); // Add dependencies

  const fetchBranches = async () => {
    if (!businessId) return;
    try {
      const response = await axios.get(`/api/branches/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data.data || []); // Assuming branches are in response.data.data
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchFaces = async (currentPage, currentBusinessId, currentBranch, currentStartDate, currentEndDate) => {
    if (!currentBusinessId) return;
    try {
      const response = await axios.get(
        `/api/faces/get/all?page=${currentPage}&limit=5&businessId=${currentBusinessId}&branch=${currentBranch}&startDate=${currentStartDate}&endDate=${currentEndDate}`
      );
      const { data, pagination } = response.data;
      setFaces(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Error fetching faces:", error);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewImage = (photoUrl) => {
    Swal.fire({
      title: "Captured Image",
      imageUrl: photoUrl,
      imageAlt: "Captured Face",
      showCloseButton: true,
    });
  };

  const handleFilter = () => {
    setPage(1); // Reset to the first page when applying filters
    // fetchFaces will be called by useEffect due to state change
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <Box component={Card} p={3}>
      {/* Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Visited Customers
        </Typography>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} justifyContent="space-between">
        <Box display="flex" gap={2}>
          <TextField
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <TextField
            label="Branch"
            placeholder="Branch"
            select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            sx={{ minWidth: 200 }} // Set a minimum width for better appearance
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch._id} value={branch._id}>
                {branch.branchName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="contained" color="primary" onClick={handleFilter}>
            Filter
          </Button>
          <Button variant="outlined" color="secondary" onClick={clearDates}>
            Clear Dates
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Photo</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Device ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Captured Time</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faces.length > 0 ? (
              faces.map((face) => (
                <TableRow key={face._id}>
                  <TableCell>
                    <Avatar src={face.photoUrl} alt="Face" />
                  </TableCell>
                  <TableCell>{face.deviceId || "Unknown"}</TableCell>
                  <TableCell>{face?.branch.branchName || "Unknown branch"}</TableCell>
                  <TableCell>
                    {new Date(face?.lastVisit).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewImage(face.photoUrl)}
                    >
                      View Image
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="textSecondary">
                    No data found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination count={totalPages} page={page} onChange={handlePageChange} />
      </Box>
    </Box>
  );
};

export default FacesTable;