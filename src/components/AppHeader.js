import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderDivider,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilBell, cilEnvelopeOpen, cilList, cilMenu } from "@coreui/icons";
import "./AppHeader.css";

import { AppBreadcrumb } from "./index";
import { logo } from "src/assets/brand/logo";
import ConnectionStatus from "./ConnectionStatus";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { isAutheticated } from "src/auth";
import { useNavigate } from "react-router-dom";

const AppHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarShow = useSelector((state) => state.coreUI.sidebarShow); // Updated selector
  const [AppName, setAppName] = useState("Businesses");
  const [userId, setUserId] = useState(null);
  const token = isAutheticated();

  useEffect(() => {
    async function getConfiguration() {
      const configDetails = await axios.get(`/api/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppName("Businesses");
    }
    
    getConfiguration();
    
    // Fetch user details to get userId
    async function getUserDetails() {
      try {
        const response = await axios.get(`/api/v1/user/details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data && response.data.user && response.data.user._id) {
          setUserId(response.data.user._id);
        }
      } catch (error) {
        console.warn("Failed to fetch user details:", error.message);
      }
    }
    
    getUserDetails();
  }, [token]);
  return (
    <CHeader position="sticky">
    <CContainer fluid className="d-flex align-items-center py-10">
        <CHeaderToggler
          className="ps-1 d-flex align-items-center"
          onClick={() =>
            dispatch({ type: "set", payload: { sidebarShow: !sidebarShow } }) // Updated dispatch action
          }
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <div className="app-header-left d-flex align-items-center">
          <div className="app-header-title">Home</div>
        </div>

        <div className="app-header-actions d-flex align-items-center ms-auto">
          <button className="header-pill">Feedback</button>
          <button className="header-pill">Docs</button>
          <button className="header-pill d-flex align-items-center">
            <CIcon icon={cilEnvelopeOpen} className="me-2" />
            <span>Talk to El</span>
          </button>
          <button className="icon-btn ms-2" aria-label="Notifications">
            <CIcon icon={cilBell} size="lg" />
          </button>
          <div className="header-avatar ms-3">I</div>
          <div className="ms-3 d-none d-md-flex">
            <ConnectionStatus />
          </div>
        </div>
      </CContainer>
      
    </CHeader>
  );
};

export default AppHeader;
