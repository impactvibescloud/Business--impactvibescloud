import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Card,
  Grid,
  Typography,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { isAutheticated } from "src/auth";
import { City, State } from "country-state-city";

const AddPrincipalDistributor = () => {
  const navigate = useNavigate();
  const token = isAutheticated();

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [data, setData] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    gstNumber: "",
    latitude: "",
    longitude: ""
  });

  const [loading, setLoading] = useState(false);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      const states = State.getStatesOfCountry("IN").map((state) => ({
        label: state.name,
        value: state.isoCode,
      }));
      setStateOptions(states);
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        const cities = City.getCitiesOfState("IN", selectedState.value).map(
          (city) => ({
            label: city.name,
            value: city.name,
          })
        );
        setCityOptions(cities);
      }
    };
    fetchCities();
  }, [selectedState]);

  const handleInputChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleDataChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleStateChange = (event, newValue) => {
    setSelectedState(newValue);
  };

  const handleCityChange = (event, newValue) => {
    setSelectedCity(newValue);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate input fields
      if (
        !user.name ||
        !user.email ||
        !user.phone ||
        !selectedState ||
        !selectedCity ||
        !data.street ||
        !data.postalCode
      ) {
        throw new Error("Fill all fields!");
      }
      console.log("came here ");
      setLoading(true);

      // Attempt to register user
      const userResponse = await axios.post("/api/v1/user/register", {
        ...user,
        role: "franchisee",
      });

      if (userResponse.status === 201 || userResponse.status === 200) {
        const userId = userResponse.data.userId;
        // console.log(userId);
        // Add address details for the user
        const addressResponse = await axios.post(
          `/api/shipping/address/admin/new/${userResponse.data.userId}`,
          {
            ...data,
            Name: user.name,
            phoneNumber: user.phone,
            isDefault: true,
            state: selectedState.label, // Send selected state label
            city: selectedCity.label, // Send selected city label
            user: userId
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLoading(false);
        if (addressResponse.status === 201) {
          toast.success("Outlet and Address Added Successfully");
          navigate("/franchisee");
        }
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response?.data) {
        toast.error(error.response?.data.message || "Something went wrong!");
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  const handleCancel = () => {
    navigate("/franchisee");
  };

  return (
    <div>
      <Card
        sx={{ padding: "1rem", marginBottom: "1rem", position: "relative" }}
      >
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleCancel}
          sx={{ position: "absolute", top: "10px", right: "10px" }}
        >
          Cancel
        </Button>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Add Outlet
        </Typography>
        <form onSubmit={handleFormSubmit}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Principal Distributor ID */}

            {/* Name */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="name"
                  className="form-label"
                >
                  Name*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="name"
                  required
                  type="text"
                  fullWidth
                  name="name"
                  value={user.name}
                  variant="outlined"
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            {/* Email */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="email"
                  className="form-label"
                >
                  Email*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="email"
                  required
                  type="email"
                  fullWidth
                  name="email"
                  value={user.email}
                  variant="outlined"
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            {/* Phone Number */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="phone"
                  className="form-label"
                >
                  Phone Number*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="phone"
                  required
                  type="text"
                  fullWidth
                  name="phone"
                  value={user.phone}
                  variant="outlined"
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mb: 2 }}>
            Business Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>

            {/* GST Number */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="gstNumber"
                  className="form-label"
                >
                  GST Number*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="gstNumber"
                  required
                  type="text"
                  fullWidth
                  name="gstNumber"
                  value={data.gstNumber}
                  variant="outlined"
                  onChange={handleDataChange}
                />
              </Grid>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mb: 2 }}>
            Address
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Country */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="country"
                  className="form-label"
                >
                  Country*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="country"
                  required
                  type="text"
                  fullWidth
                  name="country"
                  value={data.country}
                  variant="outlined"
                  disabled
                />
              </Grid>
            </Grid>

            {/* State */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="state"
                  className="form-label"
                >
                  State*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <Autocomplete
                  id="state"
                  options={stateOptions}
                  getOptionLabel={(option) => option.label}
                  value={selectedState}
                  onChange={handleStateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label="Select State"
                      error={!selectedState}
                      helperText={!selectedState ? "Select a state" : null}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* City */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="city"
                  className="form-label"
                >
                  City*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <Autocomplete
                  id="city"
                  options={cityOptions}
                  getOptionLabel={(option) => option.label}
                  value={selectedCity}
                  onChange={handleCityChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label="Select City"
                      error={!selectedCity}
                      helperText={!selectedCity ? "Select a city" : null}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Street */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="street"
                  className="form-label"
                >
                  Street*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="street"
                  required
                  type="text"
                  fullWidth
                  name="street"
                  value={data.street}
                  variant="outlined"
                  onChange={handleDataChange}
                />
              </Grid>
            </Grid>

            {/* Postal Code */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="postalCode"
                  className="form-label"
                >
                  Postal Code*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="postalCode"
                  required
                  type="text"
                  fullWidth
                  name="postalCode"
                  value={data.postalCode}
                  variant="outlined"
                  onChange={handleDataChange}
                />
              </Grid>
            </Grid>
            {/* latitude */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="latitude"
                  className="form-label"
                >
                  Latitude*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="latitude"
                  required
                  type="text"
                  fullWidth
                  name="latitude"
                  value={data.latitude}
                  variant="outlined"
                  onChange={handleDataChange}
                />
              </Grid>
            </Grid>
            {/* longitude */}
            <Grid item xs={12} className="d-flex align-items-center">
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  htmlFor="longitude"
                  className="form-label"
                >
                  Longitude*
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <TextField
                  id="longitude"
                  required
                  type="text"
                  fullWidth
                  name="longitude"
                  value={data.longitude}
                  variant="outlined"
                  onChange={handleDataChange}
                />
              </Grid>
            </Grid>
          </Grid>

          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            color="primary"
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              "Create Principal Distributor"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddPrincipalDistributor;
