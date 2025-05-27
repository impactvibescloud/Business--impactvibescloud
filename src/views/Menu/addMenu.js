import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  IconButton,
  Avatar,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UploadIcon from "@mui/icons-material/Upload";
import { isAutheticated } from "src/auth";
import Swal from "sweetalert2";

const AddMenu = () => {
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null); // State for image preview
  const [time, setTime] = useState(""); // State for time
  const [machineType, setMachineType] = useState(""); // State for machine type
  const navigate = useNavigate();
  const token = isAutheticated();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/menu-category/getCategories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 200) {
          setCategories(res?.data?.categories);
        } else {
          Swal.fire({
            title: "Failed to fetch categories",
            icon: "error",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error fetching categories",
          text: error.message,
          icon: "error",
        });
      }
    };

    fetchCategories();
  }, [token]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setPhoto(file);

    // Generate preview URL
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setPhotoPreview(previewURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    const formData = new FormData();
    formData.append("item", item);
    formData.append("description",description );
    formData.append("price", price);
    formData.append("category", selectedCategory);
    formData.append("photo", photo);
    formData.append("time", time);
    formData.append("machineType", machineType);

    try {
      const res = await axios.post("/api/add-items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);
      Swal.fire({
        title: "Menu added successfully !",
        icon: "success",
      });
      navigate("/menu");
    } catch (error) {
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
        Add New Item
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
          label="Item Description"
          variant="outlined"
          fullWidth
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        <TextField
          label="Time (in mins)"
          variant="outlined"
          required
          fullWidth
          type="number"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="machine-type-select-label">Type of Machine</InputLabel>
          <Select
            labelId="machine-type-select-label"
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
            required
          >
            <MenuItem value="Type1">Type1</MenuItem>
            <MenuItem value="Type2">Type2</MenuItem>
            <MenuItem value="Type3">Type3</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-select-label">Category</InputLabel>
          <Select
            labelId="category-select-label"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.categoryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box display="flex" alignItems="center" mb={2}>
          <input
            type="file"
            accept="image/*"
            required
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
          {loading ? "Adding..." : "Add Item"}
        </Button>
      </form>
    </Box>
  );
};

export default AddMenu;
