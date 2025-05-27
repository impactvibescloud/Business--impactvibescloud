import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from "@mui/material";
import axios from "axios";
import { Typography } from "@mui/material";

const InvoiceTable = ({ invoices }) => {
  return (
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
          {false ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.invoiceId}>
                <TableCell>{invoice.invoiceId}</TableCell>

                <TableCell>
                  {invoice.items.map((item) => (
                    <div key={item.productId}>
                      {item.name} ({item.SKU}) x <b>{item.processquantity}</b>
                    </div>
                  ))}
                </TableCell>
                <TableCell>₹{invoice.subtotal.toFixed(2)}</TableCell>
                <TableCell>₹{invoice.gstTotal.toFixed(2)}</TableCell>
                <TableCell>₹{invoice.invoiceAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.courierStatus}
                    color={
                      invoice.courierStatus === "delivered"
                        ? "success"
                        : invoice.courierStatus === "dispatched"
                        ? "primary"
                        : "warning"
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InvoiceTable;
