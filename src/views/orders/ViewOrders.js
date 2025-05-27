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

const ViewOrders = () => {
  const [order, setOrder] = useState(null); // State to store order details
  const [status, setStatus] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDeliveredDialog, setOpenDeliveredDialog] = useState(false); // New dialog state for delivery confirmation
  const [courierName, setCourierName] = useState("");
  const [courierId, setCourierId] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const token = isAutheticated(); // State for delivery date
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const navigate = useNavigate();
  const { id } = useParams();
  const [parialModal, setOpnePartialModal] = useState(false);
  // Get order ID from URL params

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `/api/get-single-placed-order-pd/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // console.log(response);
        setOrder(response.data.singleOrder);
        setStatus(response.data.singleOrder?.status);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch order details");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = (event) => {
    setOrderStatus(event.target.value);
  };

  const handleUpdateClick = () => {
    if (orderStatus === "dispatched") {
      setOpenDispatchDialog(true);
    } else if (orderStatus === "partial-processing") {
      setOpnePartialModal(true);
    } else if (orderStatus === "cancelled") {
      setOpenCancelDialog(true);
    } else if (orderStatus === "delivered") {
      setOpenDeliveredDialog(true);
    } else {
      setOpenConfirmDialog(true);
    }
  };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    try {
      if (orderStatus === "cancelled") {
        if (!cancellationReason) {
          Swal.fire("Please give the order cancellation reason");
        }
        const cancellationRes = await axios.put(
          `/api/cancel-order/${id}`,
          {
            cancellationReason: cancellationReason,
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (cancellationRes.status === 200) {
          Swal.fire(
            "Order Status updated",
            `Order got cancelled due to${cancellationReason}`,
            "success"
          );
          navigate(`/orders/${orderStatus}`);
        }
      } else if (orderStatus === "dispatched") {
        const cancellationRes = await axios.patch(
          `/api/change/status/${id}`,
          {
            status: orderStatus,
            courierName,
            TrackingID: courierId,
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (cancellationRes.status === 200) {
          Swal.fire("Order Status updated", `Order  Dispatched`, "success");

          navigate(`/orders/${orderStatus}`);
        }
      } else if (orderStatus === "delivered") {
        if (!deliveryDate) {
          Swal.fire("Please enter the Delivery Date");
          setOpenDeliveredDialog(false);
          return;
        }
        const cancellationRes = await axios.patch(
          `/api/change/status/${id}`,
          {
            status: orderStatus,
            DDate: deliveryDate,
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (cancellationRes.status === 200) {
          Swal.fire("Order Status updated", `Order in processing`, "success");
          navigate(`/orders/${orderStatus}`);
        }
      } else if (orderStatus === "processing") {
        const processingOrderInvoice = order?.orderItem
          .filter((item) => item.remainingQuantity > 0) // Only include items with remainingQuantity > 0
          .map((item) => ({
            ...item,
            productId: item.productId._id,
            processquantity: item.remainingQuantity, // Add processquantity only for items with remainingQuantity > 0
          }));
        // console.log(processingOrderInvoice);
        const cancellationRes = await axios.post(
          `/api/processing-order`,
          {
            invoiceItems: processingOrderInvoice,
            orderId: order._id,
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (cancellationRes.status === 200) {
          Swal.fire("Order Status updated", `Order in processing`, "success");
          navigate(`/orders/${orderStatus}`);
        }
      }
    } catch (error) {
      Swal.fire("Something went wrong ", error.message, "error");
    }
    // Perform update logic here
    setOpnePartialModal(false);
    setOpenConfirmDialog(false);
    setOpenDispatchDialog(false);
    setOpenCancelDialog(false);
    setOpenDeliveredDialog(false); // Close delivered dialog
  };

  const handleCancel = async () => {
    setOpenConfirmDialog(false);
    setOpenDispatchDialog(false);
    setOpenCancelDialog(false);
    setOpenDeliveredDialog(false); // Close delivered dialog
  };
  const handlePartialOrderClose = () => {
    setOpnePartialModal(false);
  };
  const handlePartialProcess = async (availability) => {
    const prepareData = availability
      .filter(({ processquantity }) => processquantity > 0)
      .map(
        ({
          productId,
          SKU,
          name,
          categoryName,
          brandName,
          price,
          GST,
          HSN_Code,
          description,
          processquantity,
        }) => ({
          productId: productId._id,
          SKU,
          name,
          categoryName,
          brandName,
          price,
          GST,
          HSN_Code,
          description,
          processquantity,
        })
      );
    // console.log(prepareData);

    try {
      const cancellationRes = await axios.post(
        `/api/processing-order`,
        {
          invoiceItems: prepareData,
          orderId: id,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (cancellationRes.status === 200) {
        Swal.fire("Order Status updated", `Order in processing`, "success");
        navigate(`/orders/pending`);
      }
    } catch (error) {
      Swal.fire("Something went wrong ", error.message, "error");
    }
  };

  const timelineData = [
    { event: "Order Placed On", date: order?.createdAt },
    {
      event: "Processing Started",
      date: order?.status_timeline?.processing || "-",
    },
    { event: "Dispatched On", date: order?.status_timeline?.dispatched || "-" },
    { event: "Delivered On", date: order?.status_timeline?.delivered || "-" },
  ];

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
          Order ID: {order?.uniqueId}
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
            {order.invoices?.length > 0 && (
              <>
                <Typography variant="h4" gutterBottom>
                  Invoices
                </Typography>
                <InvoiceTable invoices={order.invoices} />
              </>
            )}
            <Typography variant="h4" my={3} gutterBottom>
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
                        <TableCell align="right">Order Quantity</TableCell>
                        <TableCell align="right">Subtotal (₹)</TableCell>
                        <TableCell align="right">GST (%)</TableCell>
                        <TableCell align="right">GST Amount (₹)</TableCell>
                        <TableCell align="right">Total with GST (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order?.orderItem.map((item, index) => {
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
                            <TableCell align="center">
                              {item.quantity}
                            </TableCell>
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
            </Grid>
            {order.invoices?.length > 0 && (
              <>
                {" "}
                <Typography variant="h4" my={3} gutterBottom>
                  Order Items{" "}
                  {order?.status == "pending" ? "to be Processed" : "Cancelled"}
                </Typography>
                <PendingOrderTable order={order} />
              </>
            )}

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
                    Order Summary
                  </Typography>
                  <Divider sx={{ marginBottom: 2 }} />
                  <Typography>
                    Total Items: {order?.orderItem.length}
                  </Typography>

                  <Typography>Total Subtotal: ₹{order?.subtotal}</Typography>
                  <Typography>Total GST: ₹{order?.gstTotal}</Typography>
                  <Typography variant="h5" sx={{ marginTop: 2 }}>
                    Grand Total: ₹{order?.grandTotal}
                  </Typography>
                </Box>
              </Grid>
              {/* <Grid item sm={6} md={6} xl={6}>
                <TableContainer
                  component={Paper}
                  sx={{ maxWidth: 600, margin: "auto", mt: 4 }}
                >
                  <Table
                    sx={{
                      background: "#3c4b64",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <TableHead sx={{ padding: "1rem" }}>
                      <TableRow sx={{ padding: "1rem" }}>
                        Status timeline
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timelineData.map((row, index) => (
                        <TableRow
                          sx={{ color: "white", fontWeight: "bold" }}
                          key={index}
                        >
                          <TableCell
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            {row.event}
                          </TableCell>
                          <TableCell
                            sx={{ color: "white", fontWeight: "bold" }}
                            align="right"
                          >
                            {row.date !== "-" ? (
                              <>
                                {new Date(row.date).toDateString()}
                                <span>, {formatAMPM(row.date)}</span>
                              </>
                            ) : (
                              "-"
                            )}

                          
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid> */}
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
                  <strong>SBU:</strong> {order?.addedBy.SBU}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Name:</strong> {order?.addedBy.name}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Email id:</strong> {order?.addedBy.email}
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  <strong>Number:</strong> {order?.addedBy.phone}
                </Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Bill Address
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>{order?.billTo}</Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Ship Address
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>{order?.shipTo}</Typography>
              </Grid>
              <Grid item sm={6} md={6} lg={6}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Payment mode
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>
                  {order?.paymentMode}
                </Typography>
              </Grid>

              <Grid item sm={12} md={12} lg={12}>
                <Typography variant="h5" sx={{ mb: "0.5rem" }}>
                  Order Status
                </Typography>
                <Typography sx={{ mb: "0.5rem" }}>{order?.status}</Typography>
                {order?.status === "cancelled" && (
                  <Typography sx={{ mb: "0.5rem", color: "red" }}>
                    {order?.order_Cancelled_Reason}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
          {order?.status !== "cancelled" && order?.status !== "delivered" && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <select
                className="form-control"
                onChange={handleStatusChange}
                value={orderStatus}
              >
                {status === "new" && (
                  <>
                    <option value="">New</option>
                    <option value="processing">Processing</option>
                    <option value="partial-processing">
                      Partial Processing
                    </option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
                {status === "pending" && (
                  <>
                    <option value="">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="partial-processing">
                      Partial Processing
                    </option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
                {status === "processing" && (
                  <>
                    <option value="">Processing</option>
                    <option value="dispatched">Dispatch</option>
                  </>
                )}
                {status === "dispatched" && (
                  <>
                    <option value="">Dispatch</option>
                    <option value="delivered">Delivered</option>
                  </>
                )}
              </select>
            </FormControl>
          )}

          {orderStatus && (
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
            Are you sure you want to update the status to {orderStatus}?
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
              Please provide courier name and ID for dispatch:
            </DialogContentText>

            <TextField
              autoFocus
              required
              margin="dense"
              label="Courier Name"
              fullWidth
              variant="outlined"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            />
            <TextField
              required
              margin="dense"
              label="Courier ID"
              fullWidth
              variant="outlined"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
            />
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

      {/* Dialog for cancellation reason */}
      <Dialog open={openCancelDialog} onClose={handleCancel}>
        <DialogTitle>Cancellation Reason</DialogTitle>
        <form onSubmit={handleConfirmUpdate}>
          <DialogContent>
            <DialogContentText>
              Please select a reason for cancelling the order:
            </DialogContentText>
            <FormControl fullWidth variant="outlined" margin="dense">
              <InputLabel id="cancellation-reason-label">
                Cancellation Reason
              </InputLabel>
              <Select
                labelId="cancellation-reason-label"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                required
              >
                <MenuItem value="Out of stock">Out of stock</MenuItem>
                <MenuItem value="Customer request">Customer request</MenuItem>
                <MenuItem value="Price issue">Price issue</MenuItem>
                <MenuItem value="Partial cancellation">
                  Partial cancellation
                </MenuItem>
                <MenuItem value="Other">Other</MenuItem>
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

      {/* Dialog for delivery confirmation */}
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

      {/* partial processing  */}
      <OrderDetailsDialog
        open={parialModal}
        onClose={handlePartialOrderClose}
        order={order}
        onSubmit={handlePartialProcess}
      />
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
export default ViewOrders;
