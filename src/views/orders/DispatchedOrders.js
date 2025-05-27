import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isAutheticated } from "src/auth";
import { debounce } from "lodash"; // Import debounce from lodash

const ProcessingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-based page
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchField, setSearchField] = useState("Order ID");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const token = isAutheticated();
  const searchRef = useRef();
  const fetchOrdersDebounced = useRef(
    debounce((page, limit, searchField, searchText) => {
      fetchOrders(page, limit, searchField, searchText);
    }, 500)
  ).current;

  const fetchOrders = async (
    page,
    limit,
    searchField = "",
    searchText = ""
  ) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/get-dispatched-invoice-admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit,
          page: page + 1,
          [searchField === "Order ID" ? "orderId" : "invoiceId"]:
            searchText || "",
        },
      });
      setOrders(response?.data?.invoices);
      setTotalOrders(response?.data?.totalCount);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersDebounced(page, rowsPerPage, searchField, searchText);
  }, [page, rowsPerPage, searchField, searchText]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);
    searchRef.current = value;
  };

  const handleSearchFieldChange = (event) => {
    setSearchField(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" mb={2} textAlign="center">
        Dispatch Invoice List
      </Typography>
      <Box display="flex" mb={2} alignItems="center">
        <FormControl variant="outlined" sx={{ minWidth: 150, mr: 2 }}>
          <InputLabel id="search-field-label">Search By</InputLabel>
          <Select
            labelId="search-field-label"
            id="search-field"
            value={searchField}
            onChange={handleSearchFieldChange}
            label="Search By"
          >
            <MenuItem value="Order ID">Order ID</MenuItem>
            <MenuItem value="Invoice ID">Invoice ID</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={`Search by ${searchField}`}
          variant="outlined"
          value={searchText}
          onChange={handleSearchChange}
          fullWidth
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Dispatched Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Invoice Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton height={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>{invoice.orderId.uniqueId}</TableCell>
                  <TableCell>{invoice.invoiceId}</TableCell>
                  <TableCell>
                    {new Date(
                      invoice.courierstatus_timeline.dispatched
                    ).toDateString()}
                    <span>
                      , {formatAMPM(invoice.courierstatus_timeline.dispatched)}
                    </span>
                  </TableCell>
                  <TableCell>{invoice.items.length}</TableCell>
                  <TableCell>₹ {invoice.invoiceAmount.toFixed(2)}</TableCell>
                  <TableCell>{invoice.courierStatus}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        navigate(
                          `/orders/invoice/${invoice.courierStatus}/${invoice._id}`
                        )
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1">No data found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalOrders}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

// Helper function to format time as AM/PM
const formatAMPM = (date) => {
  const hours = new Date(date).getHours();
  const minutes = new Date(date).getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export default ProcessingOrders;
