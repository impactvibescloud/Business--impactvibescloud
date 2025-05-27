import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { isAutheticated } from "src/auth";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertFromHTML, ContentState } from "draft-js";
import { stateToHTML } from "draft-js-export-html"; // This is for converting Draft.js content state to HTML
import { stateFromHTML } from "draft-js-import-html"; // This is for converting HTML to Draft.js content state

const UpdateBlog = () => {
  const token = isAutheticated();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [image, setimage] = useState(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState(""); //tags array
  const [blogContent, setBlogContent] = useState(EditorState.createEmpty());
  const [error, setError] = useState("");
  const [newUpdatedImages, setNewUpdatedImages] = useState(null);
  const [Img, setImg] = useState(true);
  const id = useParams()?.id;
  //get Blogdata
  const getBlog = async () => {
    try {
      const res = await axios.get(`/api/v1/blog/getoneblog/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log(res?.data?.blog);
      setTitle(res?.data?.blog?.title);
      setimage(res?.data?.blog?.image);
      // Convert HTML content to Draft.js EditorState
      const contentState = stateFromHTML(res?.data?.blog?.blog_content);
      const editorState = EditorState.createWithContent(contentState);
      setBlogContent(editorState);

      setImg(false);

      // Joining the tags array into a string separated by commas
      const tagsString = res?.data?.blog?.tags.join(",");
      setTag(tagsString);
    } catch (err) {
      swal({
        title: "Error",
        text: "Unable to fetch the blog",
        icon: "error",
        button: "Retry",
        dangerMode: true,
      });
    }
  };

  useEffect(() => {
    getBlog();
  }, []);

  const handleFileChange = (e) => {
    const files = e.target.files;
    // Reset error state
    setError("");

    // Check if more than one image is selected
    if (files.length > 1 || Img === false || newUpdatedImages !== null) {
      setError("You can only upload one image.");
      return;
    }

    // Check file types and append to selectedFiles
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const file = files[0]; // Only one file is selected, so we get the first one

    if (allowedTypes.includes(file.type)) {
      setNewUpdatedImages(file);
    } else {
      setError("Please upload only PNG, JPEG, or JPG files.");
    }
  };

  const handelDelete = async (public_id) => {
    const ary = public_id.split("/");

    const res = await axios.delete(
      `/api/v1/blog/deleteImage/jatinMor/Blog/${ary[2]}`,
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (res) {
      setimage(null);
      setImg(true);
    }
  };
  const handellocalDelete = () => {
    setNewUpdatedImages(null);
  };
  const handleSubmit = () => {
    if (title === "" || blogContent === "" || tag === "") {
      swal({
        title: "Warning",
        text: "Fill all mandatory fields",
        icon: "error",
        button: "Close",
        dangerMode: true,
      });
      return;
    }
    setLoading(true);
    const contentState = blogContent.getCurrentContent();
    const htmlData = stateToHTML(contentState);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("blog_content", htmlData);
    formData.append("tags", tag);

    if (newUpdatedImages !== null) {
      formData.append("image", newUpdatedImages);
    }

    axios
      .patch(`/api/v1/blog/updateblog/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        swal({
          title: "Updated",
          text: "Blog Updated successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/blogs", { replace: true });
      })
      .catch((err) => {
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
              Update Blog
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
                      multiple
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
                          marginLeft: "0.5rem",
                          marginTop: "0.5rem",
                        }}
                        fontSize="large"
                      />
                    </Box>
                  </label>
                </Box>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <div>
                  <strong className="fs-6 fst-italic">
                    *You cannot upload more than 1 image
                  </strong>
                </div>

                <Box style={{ display: "flex" }}>
                  {Img === false && image !== null ? (
                    <Box marginRight={"2rem"}>
                      <img
                        src={image.url}
                        alt="profileImage"
                        style={{
                          width: 70,
                          height: 70,
                          marginBottom: "1rem",
                        }}
                      />
                      <DeleteSharpIcon
                        onClick={() => handelDelete(image.public_id)}
                        fontSize="small"
                        sx={{
                          color: "white",
                          position: "absolute",
                          cursor: "pointer",
                          padding: "0.2rem",
                          background: "black",
                          borderRadius: "50%",
                        }}
                      />
                    </Box>
                  ) : null}

                  {newUpdatedImages !== null && Img && (
                    <Box marginRight={"2rem"}>
                      <img
                        src={
                          newUpdatedImages
                            ? URL.createObjectURL(newUpdatedImages)
                            : ""
                        }
                        // src={newUpdatedImages?.url}
                        alt="profileImage"
                        style={{
                          width: 70,
                          height: 70,

                          marginBottom: "1rem",
                        }}
                      />
                      <DeleteSharpIcon
                        onClick={() => handellocalDelete()}
                        fontSize="small"
                        sx={{
                          color: "white",
                          position: "absolute",
                          cursor: "pointer",
                          padding: "0.2rem",
                          background: "black",
                          borderRadius: "50%",
                        }}
                      />
                      {/* </IconButton> */}
                    </Box>
                  )}
                </Box>
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

export default UpdateBlog;
