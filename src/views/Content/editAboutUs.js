import { Typography } from "@mui/material";
import { Box, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { isAutheticated } from "src/auth";
import { Link } from "react-router-dom";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ script: "super" }, { script: "sub" }],
  ["undo", "redo"],
];

export default function EditAboutUs() {
  const [title, setTitle] = useState("About Us");
  const [content, setContent] = useState("");
  const [added, setAdded] = useState(false);
  const [olderContent, setOlderContent] = useState("");
  const [id, setId] = useState(null);

  const token = isAutheticated();
  const handleContentChange = (content, delta, source, editor) => {
    setContent(editor.getHTML());
  };
  const getAboutUs = async () => {
    const response = await axios.get("/api/content/about-us", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setContent(response?.data?.aboutUs[0]?.aboutUsContent);
      setId(response?.data?.aboutUs[0]?._id);
      setOlderContent(response?.data?.aboutUs[0]?.aboutUsContent);
    }
  };

  const addAboutUs = async () => {
    const response = await axios.post(
      "/api/content/about-us",
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status == 201) {
      swal({
        title: "Congratulations!!",
        text: "About us  added successfully!",
        icon: "success",
        button: "OK",
      });
    }
  };
  const handleCancelClick = () => {
    setContent(olderContent);
  };
  const updateContent = async () => {
    const response = await axios.patch(
      "/api/content/about-us-update",
      { content },
      {
        params: { id: id },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 200) {
      swal({
        title: "Congratulations!",
        text: "About Us updated successfully!",
        icon: "success",
        button: "OK",
      });
    } else {
      swal({
        title: "Sorry, please try again",
        text: "Something went wrong!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };
  const handleSaveClick = async () => {
    if (olderContent === undefined || olderContent === "") {
      await addAboutUs();
      setAdded(true);
    } else {
      setAdded(false);
      await updateContent();
    }
    // // Reload terms and conditions
    // await getAboutUs();
  };
  useEffect(() => {
    // addTermsandConditions();
    getAboutUs();
  }, [added]);
  return (
    <div>
      <div style={{ display: "flex" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveClick}
          style={{
            fontWeight: "bold",
            marginBottom: "1rem",
            textTransform: "capitalize",
            marginRight: "5px",
          }}
        >
          Save
        </Button>
        <Link to="/content">
          <Button
            variant="contained"
            color="primary"
            // onClick={handleCancelClick}
            style={{
              fontWeight: "bold",
              marginBottom: "1rem",
              textTransform: "capitalize",
              marginRight: "5px",
            }}
          >
            Back
          </Button>
        </Link>
      </div>

      <Box style={{ background: "#FFFFFF", color: "black", padding: "1rem" }}>
        <Typography
          style={{ margin: "0.5rem 0rem", fontWeight: "bold" }}
          variant="h6"
        >
          {" "}
          {title} :{" "}
        </Typography>
        <Typography style={{ margin: "0.5rem 0rem" }}>Body</Typography>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={{ toolbar: TOOLBAR_OPTIONS }}
        />
      </Box>
    </div>
  );
}
