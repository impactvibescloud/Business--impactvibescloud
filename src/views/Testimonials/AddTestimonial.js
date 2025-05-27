import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";
import { isAutheticated } from "src/auth";
// import { WebsiteURL } from '../WebsiteURL'

const AddTestimonial = () => {
  const token = isAutheticated();
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    testimonial: "",
    company: "",
    image: "",
    imageURL: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.id === "image") {
      if (
        e.target.files[0]?.type === "image/jpeg" ||
        e.target.files[0]?.type === "image/png" ||
        e.target.files[0]?.type === "image/jpg"
      ) {
        setData((prev) => ({
          ...prev,
          imageURL: URL.createObjectURL(e.target.files[0]),
          image: e.target.files[0],
        }));
        return;
      } else {
        swal({
          title: "Warning",
          text: "Upload jpg, jpeg, png only.",
          icon: "error",
          button: "Close",
          dangerMode: true,
        });
        setData((prev) => ({
          ...prev,
          imageURL: "",
          image: "",
        }));
        e.target.value = null;
        return;
      }
    }
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = () => {
    if (
      data.name.trim() === "" ||
      data.company.trim() === "" ||
      data.image === "" ||
      data.testimonial.trim() === ""
    ) {
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
    formData.set("name", data.name);
    formData.set("company", data.company);
    formData.set("image", data.image);

    formData.set("testimonial", data.testimonial);

    axios
      .post(`/api/testimonial/new/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/formdata",
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((res) => {
        swal({
          title: "Added",
          text: "Testimonial added successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
        navigate("/testimonials", { replace: true });
      })
      .catch((err) => {
        setLoading(false);
        const message = err.response?.data?.message || "Something went wrong!";
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
              Testimonial
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
        <div className="col-lg-12 col-md-12  col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={data.name}
                  maxLength={25}
                  onChange={(e) => handleChange(e)}
                />
                {data.name ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {25 - data.name.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>

              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Company (Optional) *
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="company"
                  value={data.company}
                  maxLength={30}
                  onChange={(e) => handleChange(e)}
                />
                {data.company ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {30 - data.company.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}{" "}
              </div>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Testimonial *
                </label>
                <textarea
                  type="text"
                  className="form-control"
                  id="testimonial"
                  rows="10"
                  cols="80"
                  value={data.testimonial}
                  placeholder="your Testimonial..."
                  maxLength="500"
                  onChange={(e) => handleChange(e)}
                ></textarea>

                {data.testimonial ? (
                  <>
                    <small className="charLeft mt-4 fst-italic">
                      {500 - data.testimonial.length} characters left
                    </small>
                  </>
                ) : (
                  <></>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="image" className="form-label">
                  Photo*
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="image"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleChange(e)}
                />
                <p className="pt-1 pl-2 text-secondary">
                  Upload jpg, jpeg and png only*
                </p>
              </div>
              <div
                className="mb-3"
                style={{ height: "200px", maxWdth: "100%" }}
              >
                <img
                  src={data.imageURL}
                  alt="Uploaded Image will be shown here"
                  style={{ maxHeight: "200px", maxWidth: "100%" }}
                />
              </div>
              {/* <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Description *
                                </label>
                                <br />
                                <textarea id="w3review" name="w3review" rows="10" cols="100">
                                    At w3schools.com you will learn how to make a website. They offer free tutorials in all web development technologies.
                                </textarea>
                            </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTestimonial;
