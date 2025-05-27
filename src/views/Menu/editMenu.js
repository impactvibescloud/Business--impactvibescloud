import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Card,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import UploadIcon from "@mui/icons-material/Upload";
import Swal from "sweetalert2";
import axios from "axios";
import { isAutheticated } from "src/auth";

const EditMenuPage = () => {
  const { id } = useParams(); // Get item ID from the URL
  const navigate = useNavigate();
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(""); // Selected category
  const [categories, setCategories] = useState([]); // List of categories
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = isAutheticated();

  useEffect(() => {
    fetchMenuItem();
    fetchCategories();
  }, []);

  const fetchMenuItem = async () => {
    try {
      const res = await axios.get(`/api/get/${id}`);
      const { item, price, category, photo } = res.data.menuItem;
      setItem(item);
      setPrice(price);
      setCategory(category);
      setPhotoPreview(photo);
    } catch (error) {
      console.error("Error fetching menu item:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/menu-category/getCategories");
      setCategories(res.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setNewPhoto(file);

    // Generate preview URL
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setPhotoPreview(previewURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("item", item);
    formData.append("price", price);
    formData.append("category", category);
    if (newPhoto) formData.append("photo", newPhoto);

    try {
      const res = await axios.put(`/api/edit-items/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);
      Swal.fire({
        title: "Menu updated successfully!",
        icon: "success",
      });
      navigate("/menu");
    } catch (error) {
      console.error("Error updating menu item:", error);
      Swal.fire({
        title: "Something went wrong!",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={2} component={Card}>
      <Typography variant="h5" mb={2}>
        Edit Menu Item
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Item Name"
          variant="outlined"
          fullWidth
          required
          value={item}
          onChange={(e) => setItem(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Price"
          variant="outlined"
          required
          fullWidth
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.categoryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box display="flex" alignItems="center" mb={2}>
          <input
            type="file"
            accept="image/*"
            id="file-input"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="file-input">
            <IconButton
              color="primary"
              component="span"
              sx={{
                border: "1px solid",
                borderRadius: "8px",
                p: 5,
                background: "#f4f5f5",
              }}
            >
              <UploadIcon />
            </IconButton>
          </label>
          {photoPreview ? (
            <Avatar
              src={photoPreview}
              alt="Preview"
              sx={{ width: 56, height: 56, ml: 2 }}
            />
          ) : (
            <Typography variant="body1" ml={2}>
              No file selected
            </Typography>
          )}
        </Box>
        <Button
          disabled={loading}
          variant="contained"
          color="primary"
          type="submit"
        >
          {loading ? "Updating..." : "Update Item"}
        </Button>
      </form>
    </Box>
  );
};

export default EditMenuPage;
