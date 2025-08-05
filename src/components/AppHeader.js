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

import { AppBreadcrumb, UserActivityStatus } from "./index";
import { AppHeaderDropdown } from "./header/index";
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
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() =>
            dispatch({ type: "set", payload: { sidebarShow: !sidebarShow } }) // Updated dispatch action
          }
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="mx-auto d-md-none" to="/">
          <h3>{AppName}</h3>
        </CHeaderBrand>
        <CHeaderNav className="d-none d-md-flex me-auto">
          <CNavItem>
            <CNavLink
              to="/dashboard"
              component={NavLink}
              activeclassname="active"
            >
              <h3>{AppName}</h3>
            </CNavLink>
          </CNavItem>
          {/* <CNavItem>
            <CNavLink href="#">Users</CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">Settings</CNavLink>
          </CNavItem> */}
        </CHeaderNav>
        <CHeaderNav>
          <ConnectionStatus />
          <UserActivityStatus />
        </CHeaderNav>
        <CHeaderNav className="ms-3">
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CHeaderDivider />
      <CContainer fluid>{/* <AppBreadcrumb /> */}</CContainer>
    </CHeader>
  );
};

export default AppHeader;
