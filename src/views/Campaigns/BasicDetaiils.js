import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import toast from "react-hot-toast";

const BasicDetaiils = ({ props }) => {
  const { data, setData, handleView } = props;

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    setData((prev) => ({
      ...prev,
      [e.target.id]: URL.createObjectURL(file),
    }));
  };
  const handleCampaignTypeClick = (campaignType) => {
    setData((prevData) => ({
      ...prevData,
      campaignType: campaignType,
    }));
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
              Basic Details
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <h4 className="mb-0"></h4>
            </div>

            <div className="page-title-right">
              <Button
                variant="contained"
                color="secondary"
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                }}
                onClick={() => {
                  if (
                    data?.campaignName === "" ||
                    data?.campaignType === "" ||
                    data?.selectedLanguage === null
                  ) {
                    toast.error("Fill all details");
                  } else {
                    handleView(2);
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12 col-md-12 col-lg-12 my-1">
          <div className="card h-100">
            <div className="card-body px-5">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Select Campaign Type
                </label>
                <button
                  onClick={() => handleCampaignTypeClick("whatsapp")}
                  type="button"
                  className={`btn ${
                    data?.campaignType === "whatsapp"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } mx-4`}
                >
                  WHATSAPP
                </button>
                <button
                  onClick={() => handleCampaignTypeClick("rcs")}
                  type="button"
                  className={`btn ${
                    data?.campaignType === "rcs"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } mx-4`}
                >
                  RCS
                </button>
                <button
                  onClick={() => handleCampaignTypeClick("email")}
                  type="button"
                  className={`btn ${
                    data?.campaignType === "email"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } mx-4`}
                >
                  EMAIL
                </button>
              </div>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="campaignName"
                  value={data?.campaignName}
                  maxLength="50"
                  onChange={(e) => handleChange(e)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Select Language
                </label>
                <select
                  onChange={(e) => handleChange(e)}
                  value={data?.language}
                  className="form-control"
                  id="language"
                >
                  <option value="">---English/Hindi---</option>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicDetaiils;
