import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";

const OrderDetailsDialog = ({ open, onClose, order, onSubmit }) => {
  // Create a state to store availability input for each product
  const [availability, setAvailability] = useState(
    order?.orderItem.map((item) => ({
      ...item, // Keep all original properties from orderItem
      processquantity: item.remainingQuantity, // Add availability field with default value equal to quantity
    }))
  );

  // Handle input change for availability
  const handleAvailabilityChange = (index, value) => {
    const updatedAvailability = [...availability];
    const newValue = Math.max(
      0,
      Math.min(value, updatedAvailability[index].remainingQuantity)
    ); // Ensure value is between 0 and available quantity
    updatedAvailability[index].processquantity = newValue;
    setAvailability(updatedAvailability);
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(availability); // Pass updated availability to parent component
    onClose(); // Close modal
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modify Product Availability</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price (₹)</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Availability</TableCell>
                    <TableCell align="right">Subtotal (₹)</TableCell>
                    <TableCell align="right">GST (%)</TableCell>
                    <TableCell align="right">GST Amount (₹)</TableCell>
                    <TableCell align="right">Total with GST (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order?.orderItem.map((item, index) => {
                    const subtotal = item.price * item.remainingQuantity;
                    const gstAmount =
                      ((item.GST * item.price) / 100) * item.remainingQuantity;
                    const totalWithGST = subtotal + gstAmount;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <img
                            src={item?.image}
                            // alt={item?.name}
                            style={{ width: 50, height: 50, marginRight: 10 }}
                          />
                          <Typography variant="subtitle1">
                            {item?.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">₹{item.price}</TableCell>
                        <TableCell align="right">
                          {item.remainingQuantity}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            sx={{ minWidth: "100px" }}
                            type="number"
                            value={availability[index].processquantity}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                index,
                                Number(e.target.value)
                              )
                            }
                            inputProps={{
                              min: 0,
                              max: item.remainingQuantity,
                            }}
                            style={{ width: "60px", textAlign: "center" }}
                          />
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsDialog;
