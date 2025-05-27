import React, { useState } from "react";
import {
  Checkbox,
  Button,
  TextField,
  Container,
  FormControlLabel,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { isAutheticated } from "src/auth";
// import { createAnnouncement } from './api'; // Assume this is the API call

const CreateAnnouncement = () => {
  const [sendTo, setSendTo] = useState({
    PDs: false,
    RDs: false,
    SCs: false,
    TMs: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = isAutheticated();
  const handleCheckboxChange = (event) => {
    setSendTo({ ...sendTo, [event.target.name]: event.target.checked });
  };
  const navigate = useNavigate();

  const handleSendAnnouncement = async () => {
    if (!message || message.length > 250) {
      setError("Message is required and should not exceed 250 characters.");
      return;
    }

    const payload = {
      sentTo: Object.keys(sendTo).filter((role) => sendTo[role]),
      message,
    };
    console.log("this is the send to and ", sendTo, message);
    try {
      const res = await axios.post(
        "/api/announcement/create", // URL to your backend endpoint
        {
          sentTo: payload.sentTo, // assuming payload contains sentTo and message
          message: payload.message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // if token is necessary for authorization
          },
        }
      );
      if (res.status === 201) {
        swal({
          title: "Added",
          text: "Announcement added successfully!",
          icon: "success",
          button: "ok",
        });
        navigate("/announcement");
      } else {
        swal({
          text: "Something went wrong ",
          icon: "error",
          buttons: "ok",
        });
      }
    } catch (error) {
      swal({
        text: "Something went wrong ",
        icon: "error",
        buttons: "ok",
      });
    }
  };

  return (
    <Container>
      <Typography variant="h4" mb={1}>
        New Announcement
      </Typography>
      <Box sx={{ background: "#fff", borderRadius: "1rem", padding: "1rem" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={sendTo.PDs}
              onChange={handleCheckboxChange}
              name="PDs"
            />
          }
          label="PDs"
        />
        <br />
        <FormControlLabel
          control={
            <Checkbox
              checked={sendTo.RDs}
              onChange={handleCheckboxChange}
              name="RDs"
            />
          }
          label="RDs"
        />
        <br />
        <FormControlLabel
          control={
            <Checkbox
              checked={sendTo.SCs}
              onChange={handleCheckboxChange}
              name="SCs"
            />
          }
          label="SCs"
        />
        <br />
        <FormControlLabel
          control={
            <Checkbox
              checked={sendTo.TMs}
              onChange={handleCheckboxChange}
              name="TMs"
            />
          }
          label="TMs"
        />

        <br />
        <Typography fontWeight={"bold"} variant="h5">
          Messgae
        </Typography>
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          inputProps={{ maxLength: 250 }}
          helperText={`${message.length}/250`}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Box sx={{ marginTop: 2 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: "1rem" }}
            onClick={handleSendAnnouncement}
          >
            Send
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigateBack()}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateAnnouncement;
