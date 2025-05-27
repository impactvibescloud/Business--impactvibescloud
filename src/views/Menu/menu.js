import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Avatar,
  Typography,
  Card,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Ensure Axios is installed and imported
import Swal from "sweetalert2";
import { isAutheticated } from "src/auth";

const Menu = () => {
  const token = isAutheticated();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems(page);
  }, [page]);

  const fetchItems = async (currentPage) => {
    try {
      const response = await axios.get(`/api/get?page=${currentPage}&limit=5`);
      const { data, totalPages: total } = response.data;
      setItems(data);
      setTotalPages(total);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEdit = (id) => {
    navigate(`/edit-item/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/delete-items/${id}`, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchItems(page);
      Swal.fire({
        title: "Deleted successfully!",
        icon: "success",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      Swal.fire({
        title: "Something went wrong!",
        icon: "error",
      });
    }
  };

  const formatAMPM = (date) => {
    const hours = new Date(date).getHours();
    const minutes = new Date(date).getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <Box component={Card} p={3}>
      {/* Title and Add Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Menu
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/add-menu")}
          sx={{ textTransform: "none" }}
        >
          Add Menu Item
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Item</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Thumbnail</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Price</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>
                    <Avatar src={item.photo} alt={item.item} />
                  </TableCell>
                  <TableCell>
                    {item?.category?.categoryName || "Uncategorized"}
                  </TableCell>
                  <TableCell>{item._id}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                  <TableCell>
                    {new Date(item?.createdAt)
                      .toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      .replace(",", "")}{" "}
                    , {`${formatAMPM(item?.createdAt)}`}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleEdit(item._id)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="textSecondary">
                    Data not found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
        />
      </Box>
    </Box>
  );
};

export default Menu;
