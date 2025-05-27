import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

export default function Content() {
  const pages = [
    {
      name: "Terms & Conditions ",
      action: "Edit",
      path: "/content/terms-and-conditions",
    },
    {
      name: "Privacy Policy ",
      action: "Edit",
      path: "/content/privacy-policy",
    },
    {
      name: "Shipping Policy ",
      action: "Edit",
      path: "/content/shipping-policy",
    },
    {
      name: "Refund policy",
      action: "Edit",
      path: "/content/refund-policy",
    },
    {
      name: "About Us",
      action: "Edit",
      path: "/content/about-us",
    }
  ];

  return (
    <div className="main-content">
      <Typography variant="h6" fontWeight={"bold"}>
        Content
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: "bold" }}>Page</TableCell>
              <TableCell style={{ fontWeight: "bold" }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="right">
                  {" "}
                  <Link to={row.path}>
                    <button
                      style={{
                        color: "white",
                        marginRight: "1rem",
                      }}
                      type="button"
                      className="
                                      btn btn-info btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mt-1
                                    mx-1
                                  "
                    >
                      {row.action}
                    </button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
