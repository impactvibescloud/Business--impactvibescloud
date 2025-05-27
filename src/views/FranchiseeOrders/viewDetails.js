import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  Box,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { isAutheticated } from "src/auth";

const ViewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = isAutheticated();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response, "response");
      setDetails(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch details.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const {
    orderId,
    amount,
    createdAt,
    franchiseId,
    paymentDetails,
    selectedIceCream,
    selectedToppings,
  } = details;

  return (
    <Paper sx={{ padding: 3, margin: 3, position: "relative" }}>
      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
        }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Order Details
      </Typography>
      <Divider sx={{ marginBottom: 2 }} />

      <Grid container spacing={2}>
        {/* Order Information */}
        <Grid item xs={12}>
          <Typography variant="h6">Order Information</Typography>
          <Typography>Order ID: {orderId}</Typography>
          <Typography>Amount: ₹{amount}</Typography>
          <Typography>Franchisee Name: {franchiseId?.name || "N/A"}</Typography>
          <Typography>
            Franchisee Email: {franchiseId?.email || "N/A"}
          </Typography>
        </Grid>

        <Divider sx={{ width: "100%", marginY: 2 }} />

        {/* Selected Ice Cream */}
        <Grid item xs={12}>
          <Typography variant="h6">Selected Ice Cream</Typography>
          <Typography>Name: {selectedIceCream?.name}</Typography>
          <Typography>Price: ₹{selectedIceCream?.price}</Typography>
        </Grid>

        <Divider sx={{ width: "100%", marginY: 2 }} />
        <Grid item xs={12}>
          <Typography variant="h6">Selected Toppings</Typography>
          <Typography>Name: {selectedToppings?.name}</Typography>
          <Typography>Price: ₹{selectedToppings?.price}</Typography>
        </Grid>
        {/* Selected Toppings */}
        {/* <Grid item xs={12}>
          <Typography variant="h6">Selected Toppings</Typography>
          {selectedToppings?.length > 0 ? (
            selectedToppings.map((topping, index) => (
              <Box key={index} sx={{ marginBottom: 1 }}>
                <Typography>
                  {index + 1}. {topping.name} - ₹{topping.price}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography>No toppings selected</Typography>
          )}
        </Grid> */}

        <Divider sx={{ width: "100%", marginY: 2 }} />

        {/* Payment Details */}
        {paymentDetails ? (
          <Grid item xs={12}>
            <Typography variant="h6">Payment Details</Typography>
            <Typography>Payment ID: {paymentDetails?.id}</Typography>
            <Typography>Amount: ₹{paymentDetails?.amount / 100}</Typography>
            <Typography>Currency: {paymentDetails?.currency}</Typography>
            <Typography>Status: {paymentDetails?.status}</Typography>
            <Typography>Method: {paymentDetails?.method}</Typography>
            <Typography>VPA: {paymentDetails?.vpa}</Typography>
            <Typography>Email: {paymentDetails?.email}</Typography>
            <Typography>Contact: {paymentDetails?.contact}</Typography>
            <Typography>
              Description: {paymentDetails?.notes?.description}
            </Typography>
          </Grid>
        ) : (
          <Typography>Payment not made yet</Typography>
        )}
      </Grid>
    </Paper>
  );
};

export default ViewDetails;
