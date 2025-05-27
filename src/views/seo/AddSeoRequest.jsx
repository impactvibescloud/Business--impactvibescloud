import React, { useState } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import axios from "axios";

const AddSeoRequest = () => {
  const [data, setData] = useState({
    googleTag: "",
    facebookPixel: "",
    googleAnalytics: "",
    microsoftClarity: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = () => {
    setLoading(true);
    const formData = new FormData();
    formData.set("GoogleTag", data.googleTag);
    formData.set("FacebookPixel", data.facebookPixel);
    formData.set("GoogleAnalytics", data.googleAnalytics);
    formData.set("MicrosoftClarity", data.microsoftClarity);

    axios
      .post(`api/seo/new`, formData)
      .then((res) => {
        swal({
          title: "Added",
          text: "SEO Requests added successfully!",
          icon: "success",
          button: "ok",
        });
        setLoading(false);
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
          <h2>New SEO Request</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-sm-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="googleTag" className="form-label">
                  Google Tag
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="googleTag"
                  value={data.googleTag}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="facebookPixel" className="form-label">
                  Facebook Pixel
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="facebookPixel"
                  value={data.facebookPixel}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="googleAnalytics" className="form-label">
                  Google Analytics
                </label>
                <textarea
                  type="text"
                  className="form-control"
                  id="googleAnalytics"
                  rows="5"
                  value={data.googleAnalytics}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="mb-3">
                <label htmlFor="microsoftClarity" className="form-label">
                  Microsoft Clarity
                </label>
                <textarea
                  type="text"
                  className="form-control"
                  id="microsoftClarity"
                  rows="5"
                  value={data.microsoftClarity}
                  onChange={handleChange}
                ></textarea>
              </div>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Loading" : "Save"}
              </Button>
              <Link to="/dashboard">
                <Button variant="contained" color="secondary">
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSeoRequest;
