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
// import { WebsiteURL } from '../WebsiteURL'

const EditTestimonial = () => {
  const id = useParams()?.id;

  const token = isAutheticated();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setcompany] = useState("");
  const [image, setimage] = useState(null);
  const [testimonial, settestimonial] = useState("");
  const [error, setError] = useState("");
  const [newUpdatedImages, setNewUpdatedImages] = useState(null);
  const [Img, setImg] = useState(true);

  //get testimonialdata
  const gettestimonial = async () => {
    axios
      .get(`/api/testimonial/getOne/${id}`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res?.data?.testimonial);
        setName(res?.data?.testimonial?.name);
        setcompany(res?.data?.testimonial?.company);
        settestimonial(res?.data?.testimonial?.testimonial);
        setimage(res?.data?.testimonial?.image);
        setImg(false);
      })
      .catch((err) => {
        swal({
          title: error,
          text: " Can not fetch the product  ",
          icon: "error",
          button: "Retry",
          dangerMode: true,
        });
      });
  };

  useEffect(() => {
    gettestimonial();
  }, []);

  const handleSubmit = () => {
    if (name === "" || testimonial === "" || (image === null && newUpdatedImages === null)) {
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
    const formData = new FormData();
    formData.append("name", name);

    formData.append("testimonial", testimonial);
    formData.append("company", company);

    // formData.append("image", JSON.stringify(newUpdatedImages));
    if (newUpdatedImages !== null) {
      formData.append("image", newUpdatedImages);
    }

    axios
      .patch(`/api/testimonial/update/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",

          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        swal({
          title: "Updated",
          text: "Testimonial Updated successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/testimonials", { replace: true });
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
      `/api/testimonial/deleteImage/GetSygnal/Testimonial/${ary[2]}`,
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
              Edit Testimonial
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
                {loading ? "Loading" : "Edit"}
              </Button>
              <Link to="/testimonials">
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
                  Name*
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={name}
                  maxLength={25}
                  onChange={(e) => setName(e.target.value)}
                />
                {name ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {25 - name.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>

              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Company
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="Company"
                  value={company}
                  maxLength="100"
                  onChange={(e) => setcompany(e.target.value)}
                />
                {company ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {30 - company.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}
              </div>
              {/* ************************* */}
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
                {Img === false ? (
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
          </div>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3 me-3">
                <label htmlFor="title" className="form-label">
                  Testimonial*
                </label>
                <textarea
                  className="form-control"
                  id="testimonial"
                  value={testimonial}
                  maxLength={200}
                  style={{ minHeight: "120px", resize: "vertical" }} // Adjust the height and resize behavior here
                  onChange={(e) => settestimonial(e.target.value)}
                />
                {testimonial ? (
                  <small className="charLeft mt-4 fst-italic">
                    {200 - testimonial.length} characters left
                  </small>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTestimonial;
