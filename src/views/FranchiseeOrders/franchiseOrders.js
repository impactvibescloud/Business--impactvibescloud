import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Typography,
  Chip,
  Button,
} from "@mui/material";

import { isAutheticated } from "../../auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FranchiseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = isAutheticated();

  const fetchOrderHistory = async (page, limit) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/all-orders/history`, {
        params: { page: page + 1, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setOrders(response.data.data);
      setTotalOrders(response.data.pagination.totalOrders);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "paid":
        return "success";
      case "failed":
        return "error";
      case "created":
        return "info";
      default:
        return "default";
    }
  };
  const navigate = useNavigate();

  const handleViewDetails = (orderId) => {
    // Redirect or handle details view logic here

    navigate(`/order-history/${orderId}`);
    // For example, navigate to a new route with `orderId`
    // history.push(`/orders/${orderId}`);
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Order History
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Outlet Name</TableCell>
                  <TableCell>Outlet Email</TableCell>
                  <TableCell>Action</TableCell> {/* New Action Column */}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderId}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusChipColor(order.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{order.franchiseId?.name || "N/A"}</TableCell>
                      <TableCell>{order.franchiseId?.email || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleViewDetails(order._id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalOrders}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
    </Paper>
  );
};

export default FranchiseOrders;
