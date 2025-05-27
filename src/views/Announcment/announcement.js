import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Typography,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const token = isAutheticated();

  const fetchAnnouncements = async (page, rowsPerPage) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/announcement/get", {
        params: {
          page: page + 1, // backend uses 1-based index
          rowsPerPage,
        },
        headers: {
          Authorization: `Bearer ${token}`, // if token is necessary for authorization
        },
      });
      console.log(response);
      const { announcements, totalAnnouncements } = response.data;
      setAnnouncements(announcements);
      setTotalAnnouncements(totalAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset page to 0 when changing rows per page
  };

  const formatAMPM = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };
  const navigate = useNavigate();

  return (
    <Box>
      <Box display={"flex"} mb={2}>
        <Typography
          flex={1}
          textAlign={"center"}
          fontWeight={"bold"}
          variant="h4"
        >
          Announcements
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/announcement/create")}
          sx={{ textTransform: "none" }}
        >
          Add New{" "}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ fontWeight: "bold" }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Sent to</TableCell>
              <TableCell>Message</TableCell>
              {/* <TableCell>Action</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton height={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <TableRow key={announcement._id}>
                  <TableCell>{announcement.uniqueId}</TableCell>
                  <TableCell>
                    {new Date(announcement.createdAt).toDateString()}
                    <span>, {formatAMPM(announcement.createdAt)}</span>
                  </TableCell>
                  <TableCell>{announcement.sentTo.join(", ")}</TableCell>
                  <TableCell>{announcement.message}</TableCell>
                  {/* <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        alert(`Viewing announcement ${announcement.id}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1">Data not found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalAnnouncements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default Announcements;
