import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { isAutheticated } from "src/auth";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";
import { TagsInput } from "react-tag-input-component";
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
// import { WebsiteURL } from '../WebsiteURL'

const CreateBlog = () => {
  const token = isAutheticated();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [image, setimage] = useState(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState(""); //tags array
  const [blogContent, setBlogContent] = useState(EditorState.createEmpty());
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const files = e.target.files;
    // Reset error state
    setError("");

    // Check if more than one image is selected
    if (files.length > 1) {
      setError("You can only upload one image.");
      return;
    }

    // Check file types and append to selectedFiles
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const file = files[0]; // Only one file is selected, so we get the first one

    if (allowedTypes.includes(file.type)) {
      setimage(file);
    } else {
      setError("Please upload only PNG, JPEG, or JPG files.");
    }
  };

  const handelDelete = (image) => {
    setimage(null);
  };

  const handleSubmit = () => {
    // Check if any of the required fields are empty
    if (!title || !image || !tag || !blogContent) {
      swal({
        title: "Warning",
        text: "All fields are required!",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
      return; // Exit the function early if any field is empty
    }

    setLoading(true);

    const contentState = blogContent.getCurrentContent();
    const htmlData = stateToHTML(contentState);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("blog_content", htmlData);
    formData.append("image", image);
    formData.append("tags", tag);

    axios
      .post(`/api/v1/blog/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        swal({
          title: "Added",
          text: "Blog added successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/blogs");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        const message = err.response?.data?.message
          ? err.response?.data?.message
          : "Something went wrong!";
        swal({
          title: "Warning",
          text: message,
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  };

  // console.log(data);
  //   console.log(productImages);
  // To log the content when needed...
  // console.log(tag);
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div
            className="
                    page-title-box
                    d-flex
                    align-items-center
                    justify-content-between
                  "
          >
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Add Blog
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>

            <div className="page-title-right">
              <Button
                variant="contained"
                color="primary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                  marginRight: "5px",
                }}
                onClick={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? "Loading" : "Save"}
              </Button>
              <Link to="/blogs">
                <Button
                  variant="contained"
                  color="secondary"
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    textTransform: "capitalize",
                  }}
                >
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-6  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Blog Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  placeHolder="enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="tag" className="form-label">
                  Tags
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="form-control"
                  id="tag"
                  placeHolder="enter Tags"
                />
                <em style={{ fontSize: "0.8rem" }}>
                  enter space or comma to add new tag
                </em>
              </div>
              <div>
                <label htmlFor="image" className="form-label">
                  Blog Image
                </label>
                <Box>
                  <label htmlFor="upload-Image">
                    <TextField
                      style={{
                        display: "none",
                        width: "350px",
                        height: "350px",
                        borderRadius: "10%",
                      }}
                      fullWidth
                      id="upload-Image"
                      type="file"
                      accept=".jpg , .png ,.jpeg"
                      label="file"
                      variant="outlined"
                      onChange={(e) => handleFileChange(e)}
                    />
                    <Box
                      style={{ borderRadius: "10%" }}
                      sx={{
                        margin: "1rem 0rem",
                        cursor: "pointer",
                        width: "100px",
                        height: "100px",
                        border: "2px solid grey",
                        display: "grid",
                        placeItems: "center",
                        // borderRadius: '50%',

                        "&:hover": {
                          background: "rgba(112,112,112,0.5)",
                        },
                      }}
                    >
                      <CloudUploadIcon
                        style={{
                          color: "grey",
                          margin: "auto",
                          fontSize: "5rem",
                        }}
                        fontSize="large"
                      />
                    </Box>
                  </label>
                </Box>

                {error && <p style={{ color: "red" }}>{error}</p>}
                <p className="pt-1 pl-2 text-secondary">
                  Upload jpg, jpeg and png only*
                </p>
                {image && (
                  <Box marginRight={"2rem"}>
                    <img
                      src={image ? URL.createObjectURL(image) : ""}
                      alt="BlogImage"
                      style={{
                        width: 70,
                        height: 70,

                        marginBottom: "1rem",
                      }}
                    />
                    {/* <DeleteSharpIcon
                      onClick={() => handelDelete(image)}
                      fontSize="small"
                      sx={{
                        color: "white",
                        position: "absolute",
                        cursor: "pointer",
                        padding: "0.2rem",
                        background: "black",
                        borderRadius: "50%",
                      }}
                    /> */}
                    {/* </IconButton> */}
                  </Box>
                )}
              </div>

              {/* <div id="createProductFormImage" className="w-25 d-flex">
                  <img
                    className=" w-50 p-1 "
                    src={image}
                    alt="Blog Image Preview"
                  />
              </div> */}
            </div>
          </div>
        </div>
        <div className="col-lg-6 col-md-6  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <label>Blog Content</label>
              {/* Note : style at _custom.scss */}
              <Editor
                editorState={blogContent}
                toolbarClassName="blog-toolbar"
                wrapperClassName="wrapperClassName"
                editorClassName="blog-content"
                onEditorStateChange={(editorState) => {
                  setBlogContent(editorState);
                }}
              />
              {/* <Button onClick={logContent}>Log Content</Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
