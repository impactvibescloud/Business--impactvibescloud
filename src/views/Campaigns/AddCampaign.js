import React, { useState, useEffect } from "react";
// import { Button } from '@mui/material'
import axios from "axios";

import { Link, useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CRow,
} from "@coreui/react";

import Button from "@mui/material/Button";

import { isAutheticated } from "src/auth";
import BasicDetaiils from "./BasicDetaiils.js";
import ContactDetails from "./ContactDetails.js";
import Preview from "./Preview.js";
import Videos from "./Video.js";
import TestLaunch from "./TestLaunch.js";
import Status from "./Status.js";
import VideoTemplate from "./VideoTemplate.js";

const AddCampaign = () => {
  const token = isAutheticated();
  const [productId, setProductId] = useState("");
  const [viewState, setViewState] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    WebsiteURL: "https://bolo.ai.in/",
    campaignName: "",
    language: "",
    campaignType: "",
    video: null,
    spreadSheet: null,
    videos: [null, null],
    recipients: [{ name: "", contact: "" }],
    testRecipents: [
      {
        name: "",
        phoneNumber: "",
        email: "",
        status: ["delivered"],
      },
    ],
  });

  // console.log(data)

  const handleView = (n) => {
    if (viewState === n) return;
    setViewState(n);
  };
  return (
    <CContainer>
      <CRow className="mt-3">
        <CCol md={12}>
          <div
            className="
                    page-title-box
                    d-flex
                    align-items-center
                    justify-content-between
                  "
          >
            <div style={{ fontSize: "22px" }} className="fw-bold">
              Add Campaign
            </div>
          </div>
        </CCol>
      </CRow>
      <CRow>
        <CCol md={9} className="mt-1">
          <CCardGroup>
            <CCard className="p-4 mb-3">
              <CCardBody>
                {viewState === 1 && (
                  <BasicDetaiils
                    props={{ data, setData, handleView }}
                    setData={setData}
                    handleView={handleView}
                  />
                )}

                {viewState === 2 && (
                  <VideoTemplate props={{ data, setData, handleView }} />
                )}
                {viewState === 3 && (
                  <ContactDetails props={{ data, setData, handleView }} />
                )}

                {viewState === 4 && (
                  <Preview props={{ data, setData, handleView }} />
                )}
                {viewState === 5 && (
                  <Videos props={{ data, setData, handleView }} />
                )}
                {viewState === 6 && (
                  <TestLaunch props={{ data, setData, handleView }} />
                )}
                {viewState === 7 && (
                  <Status props={{ data, setData, handleView }} />
                )}
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
        <CCol md={3} className="mt-1">
          <CCardGroup>
            <CCard>
              <CCardBody>
                <div className="d-grid gap-2">
                  <button
                    className={
                      viewState === 1
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(1)}
                  >
                    Basic Details
                  </button>
                  <button
                    className={
                      viewState === 2
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(2)}
                  >
                    Video Template
                  </button>
                  <button
                    className={
                      viewState === 3
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(3)}
                  >
                    Contact Details
                  </button>
                  <button
                    className={
                      viewState === 4
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(4)}
                  >
                    Preview
                  </button>
                  <button
                    className={
                      viewState === 5
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(5)}
                  >
                    Videos (Internal Process)
                  </button>
                  <button
                    className={
                      viewState === 6
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(6)}
                  >
                    Test & Launch
                  </button>
                  <button
                    className={
                      viewState === 7
                        ? "btn btn-light"
                        : "btn btn-info text-white"
                    }
                    type="button"
                    onClick={() => handleView(7)}
                  >
                    Status
                  </button>
                </div>
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default AddCampaign;
