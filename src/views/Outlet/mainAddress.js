// MainAddress.js
import React from "react";
import TextField from "@mui/material/TextField";
import { Country, State, City } from "country-state-city";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { Box, Typography } from "@mui/material";

export default function MainAddress({ address, onAddressChange, edit }) {
  const { id, addressLine1, addressLine2, country, state, city, zipcode } =
    address;

  const handleFieldChange = (field, value) => {
    onAddressChange(field, value);
  };
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(country);
  const cities = City.getCitiesOfState(country, state);

  return (
    <div>
      <TextField
        label="Address Line 1*"
        variant="outlined"
        style={{ display: "block", marginBottom: "1rem" }}
        fullWidth
        disabled={edit}
        value={addressLine1}
        onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
      />
      <TextField
        label="Address Line 2 (optional)"
        variant="outlined"
        style={{ display: "block", marginBottom: "1rem" }}
        fullWidth
        disabled={edit}
        value={addressLine2}
        onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
      />
      {/* <TextField
        label="Country"
        variant="outlined"
        value={country}
        onChange={(e) => handleFieldChange("country", e.target.value)}
      /> */}
      <Typography>Select Country* </Typography>
      <FormControl fullWidth>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={country}
          disabled={edit}
          style={{ width: "50%", marginBottom: "1rem" }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200, // Adjust the value to your preferred maximum height
              },
            },
          }}
          onChange={(e) => handleFieldChange("country", e.target.value)}
        >
          {countries.map((country) => (
            <MenuItem key={country.isoCode} value={country.isoCode}>
              {country.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography>Select State* </Typography>
      <FormControl fullWidth>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          style={{ width: "50%", marginBottom: "1rem" }}
          value={state}
          disabled={edit}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200, // Adjust the value to your preferred maximum height
              },
            },
          }}
          onChange={(e) => handleFieldChange("state", e.target.value)}
        >
          {states.map((state) => (
            <MenuItem key={state.isoCode} value={state.isoCode}>
              {state.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography>Select City* </Typography>
      <FormControl fullWidth>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={city}
          disabled={edit}
          style={{ width: "50%", marginBottom: "1rem" }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200, // Adjust the value to your preferred maximum height
              },
            },
          }}
          onChange={(e) => handleFieldChange("city", e.target.value)}
        >
          {cities.length == 0 && (
            <MenuItem value={"City not available"}>City not available</MenuItem>
          )}
          {cities.length > 0 &&
            cities.map((city) => (
              <MenuItem key={city.name} value={city.name}>
                {city.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <Typography style={{ marginBottom: "1rem" }}>Zipcode*</Typography>
      <TextField
        label="Zipcode*"
        variant="outlined"
        value={zipcode}
        disabled={edit}
        style={{ width: "50%" }}
        onChange={(e) => handleFieldChange("zipcode", e.target.value)}
      />
    </div>
  );
}
