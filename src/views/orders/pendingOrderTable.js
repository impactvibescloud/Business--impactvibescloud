import {
  Box,
  Grid,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import React from "react";

const PendingOrderTable = ({ order }) => {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Price (₹)</TableCell>
                  <TableCell align="center">Pending Quantity</TableCell>
                  <TableCell align="center">Subtotal (₹)</TableCell>
                  <TableCell align="center">GST (%)</TableCell>
                  <TableCell align="center">GST Amount (₹)</TableCell>
                  <TableCell align="center">Total with GST (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order?.orderItem.map((item, index) => {
                  // Check if remainingQuantity is greater than 0
                  if (item.remainingQuantity > 0) {
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
                            style={{
                              width: 50,
                              height: 50,
                              marginRight: 10,
                            }}
                          />
                          <Typography variant="subtitle1">
                            {item?.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          {item.remainingQuantity}
                        </TableCell>
                        <TableCell align="center">₹{subtotal.toFixed(2)}</TableCell>
                        <TableCell align="center">{item.GST.toFixed(2)}%</TableCell>
                        <TableCell align="center">₹{gstAmount.toFixed(2)}</TableCell>
                        <TableCell align="center">₹{totalWithGST.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  }
                  // Return null if remainingQuantity is 0
                  return null;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PendingOrderTable;
