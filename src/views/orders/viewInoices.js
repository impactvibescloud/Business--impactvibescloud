import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  DialogContentText,
  DialogTitle,
  TextField,
  Divider,
  Chip,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import onvoicesData from "../../assets/incoicedata.json";
import { useNavigate, useParams } from "react-router-dom";
import { TableContainer } from "@mui/material";
import axios from "axios"; // Import axios for HTTP requests
import { isAutheticated } from "src/auth";
import Swal from "sweetalert2";
import OrderDetailsDialog from "./partialOrderModal";
import InvoiceTable from "./invoiceTable";
import PendingOrderTable from "./pendingOrderTable";

const ViewInvoices = () => {
  const [invoice, setInvoice] = useState(null); // State to store order details
  const [status, setStatus] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);

  const [openDeliveredDialog, setOpenDeliveredDialog] = useState(false); // New dialog state for delivery confirmation
  const [courierName, setCourierName] = useState("");
  const [couriertrackingId, setCourierId] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const token = isAutheticated(); // State for delivery date
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const navigate = useNavigate();
  const { id } = useParams();

  // Get order ID from URL params

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`/api/invoice/details/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response);
        setInvoice(response.data);
        setStatus(response.data.courierStatus);

        setLoading(false);
      } catch (err) {
        console.log(err);
        setError("Failed to fetch order details");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = (event) => {
    setInvoiceStatus(event.target.value);
  };

  const handleUpdateClick = () => {
    if (invoiceStatus === "dispatched") {
      setOpenDispatchDialog(true);
    } else if (invoiceStatus === "delivered") {
      setOpenDeliveredDialog(true);
    }
  };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    try {
      if (invoiceStatus === "dispatched") {
        const res = await axios.put(
          `/api/invoice/dispatched/${id}`,
          {
            courierName,
            couriertrackingId,
            transporterName,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // console.log(res);
        if (res.status === 200) {
          Swal.fire("Invoice Status updated", "Invoice Dispatched", "success");
          navigate(`/orders/dispatched`);
        }
      } else if (invoiceStatus === "delivered") {
        const deli = await axios.put(
          `/api/invoice/delivered/${id}`,
          {},

          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (deli.status === 200) {
          Swal.fire("Order Status updated", `Order  Dispatched`, "success");

          navigate(`/orders/delivered`);
        }
      }
    } catch (error) {
      Swal.fire("Something went wrong ", error.message, "error");
    }

    setOpenDispatchDialog(false);

    setOpenDeliveredDialog(false); // Close delivered dialog
  };

  const handleCancel = async () => {
    setOpenDispatchDialog(false);
    setOpenDeliveredDialog(false); // Close delivered dialog
  };
  const [transporterName, setTransporterName] = useState("");
  const [transporter, setTransporter] = useState([]);
  // Get order ID from URL params
  const getCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/transporter/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        }, // Include pagination and search
      });

      if (response.status === 200) {
        setTransporter(response?.data?.transporters);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={5}
      >
        <Typography variant="h4" sx={{ flexGrow: 1, textAlign: "center" }}>
          Invoice Id : {invoice?.invoiceId}
        </Typography>
        <Button
          color="primary"
          onClick={() => navigate(`/orders/${status}`)}
          variant="contained"
        >
          Back
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item md={8} xl={8} lg={8}>
          <Box sx={{ padding: 2, background: "#fff" }}>
            <Typography variant="h4" gutterBottom>
              Invoice
            </Typography>
            {/* <InvoiceTable invoices={invoice} /> */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice ID</TableCell>

                    <TableCell>Invoice Items</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>GST Total</TableCell>
                    <TableCell>Invoice Amount</TableCell>
                    <TableCell>Courier Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={invoice?.invoiceId}>
                    <TableCell>{invoice?.invoiceId}</TableCell>

                    <TableCell>
                      {invoice?.items?.map((item) => (
                        <div key={item.productId}>
                          {item?.name} ({item?.SKU}) x{" "}
                          <b>{item?.processquantity}</b>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>₹{invoice?.subtotal.toFixed(2)}</TableCell>
                    <TableCell>₹{invoice?.gstTotal.toFixed(2)}</TableCell>
                    <TableCell>₹{invoice?.invoiceAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice?.courierStatus}
                        color={
                          invoice?.courierStatus === "delivered"
                            ? "success"
                            : invoice?.courierStatus === "dispatched"
                            ? "primary"
                            : "warning"
                        }
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* <Typography variant="h4" my={3} gutterBottom>
              Order Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price (₹)</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Subtotal (₹)</TableCell>
                        <TableCell align="right">GST (%)</TableCell>
                        <TableCell align="right">GST Amount (₹)</TableCell>
                        <TableCell align="right">Total with GST (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice?.orderId?.orderItem.map((item, index) => {
                        const subtotal = item.price * item.quantity;
                        const gstAmount =
                          ((item.GST * item.price) / 100) * item.quantity;
                        const totalWithGST = subtotal + gstAmount;

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <img
                                src={item.productId.image}
                                alt={item.productId.name}
                                style={{
                                  width: 50,
                                  height: 50,
                                  marginRight: 10,
                                }}
                              />
                              <Typography variant="subtitle1">
                                {item.productId.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">₹{item.price}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{subtotal}</TableCell>
                            <TableCell align="right">{item.GST}%</TableCell>
                            <TableCell align="right">₹{gstAmount}</TableCell>
                            <TableCell align="right">₹{totalWithGST}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid> */}

            <Grid container spacing={2}>
              <Grid item sm={6} md={6} xl={6}>
                <Box
                  sx={{
                    marginTop: 4,
                    padding: 2,
                    backgroundColor: "blue",
                    color: "white",
                  }}
                >
                  <Typography variant="h5" gutterBottom>
                    Invoice Summary
                  </Typography>
                  <Divider sx={{ marginBottom: 2 }} />
                  <Typography>Total Items: {invoice?.items.length}</Typography>

                  <Typography>Total Subtotal: ₹{invoice?.subtotal}</Typography>
                  <Typography>
                    Total GST: ₹{invoice?.gstTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="h5" sx={{ marginTop: 2 }}>
                    Grand Total: ₹{invoice?.invoiceAmount}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid item md={4} xl={4} lg={4}>
          <Box
            sx={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "0.8rem",
            }}
          >
            <Grid container spacing={2}>
              <Grid item sm={12} md={12} lg={12}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Customer Details
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>SBU:</strong> {invoice?.orderId?.addedBy.SBU}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Name:</strong> {invoice?.orderId?.addedBy.name}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Email id:</strong> {invoice?.orderId?.addedBy.email}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Number:</strong> {invoice?.orderId?.addedBy.phone}
                </Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Bill Address
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  {invoice?.orderId?.billTo}
                </Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Ship Address
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  {invoice?.orderId?.shipTo}
                </Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Payment mode
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  {invoice?.orderId?.paymentMode}
                </Typography>
              </Grid>

              {/* <Grid item sm={12} md={12} lg={12}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Order Status
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>{order?.status}</Typography>
                {invoice?.courierStatus === "cancelled" && (
                  <Typography sx={{ mb: "0.5rem", color: "red" }}>
                    {order?.order_Cancelled_Reason}
                  </Typography>
                )}
              </Grid> */}
            </Grid>
          </Box>
          {invoice?.status !== "delivered" && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <select
                className="form-control"
                onChange={handleStatusChange}
                value={invoiceStatus}
              >
                {status === "processing" && (
                  <>
                    <option value="">Processing</option>
                    <option value="dispatched">Dispatch</option>
                  </>
                )}
                {status === "dispatched" && (
                  <>
                    <option value="">Dispatched</option>
                    <option value="delivered">Delivered</option>
                  </>
                )}
              </select>
            </FormControl>
          )}

          {invoiceStatus && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateClick}
              sx={{ mt: 2 }}
            >
              Update Status
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Dialogs for updating status */}
      <Dialog open={openConfirmDialog} onClose={handleCancel}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update the status to {invoiceStatus}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpdate}
            variant="contained"
            color="success"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for dispatch details */}
      <Dialog open={openDispatchDialog} onClose={handleCancel}>
        <DialogTitle>Dispatch Details</DialogTitle>
        <form onSubmit={handleConfirmUpdate}>
          <DialogContent>
            <DialogContentText>
              Please provide the transporter name:
            </DialogContentText>

            <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
              <InputLabel id="courier-name-label">Transporter Name</InputLabel>
              <Select
                labelId="courier-name-label"
                id="courier_name"
                value={transporterName || ""}
                onChange={(e) => setTransporterName(e.target.value)}
                label="Transporter Name"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Transporter name </em>
                </MenuItem>
                {transporter?.map((option) => (
                  <MenuItem key={option._id} value={option.transporterName}>
                    {option.transporterName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="primary">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="success" autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openDeliveredDialog} onClose={handleCancel}>
        <DialogTitle>Confirm Delivery</DialogTitle>
        <form onSubmit={handleConfirmUpdate}>
          <DialogContent>
            <DialogContentText>
              Please confirm the delivery details:
            </DialogContentText>
            <FormControl required>
              <TextField
                autoFocus
                required
                margin="dense"
                label="Delivery Date"
                type="date"
                fullWidth
                variant="outlined"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} variant="outlined" color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              variant="contained"
              color="success"
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
const formatAMPM = (date) => {
  var hours = new Date(date).getHours();
  var minutes = new Date(date).getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
};
export default ViewInvoices;
