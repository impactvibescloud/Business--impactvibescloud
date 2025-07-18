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
import { AppHeaderDropdown } from "./header/index";
import { logo } from "src/assets/brand/logo";
import ConnectionStatus from "./ConnectionStatus";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { isAutheticated } from "src/auth";
import { useNavigate } from "react-router-dom";
import { getCredits, fetchCreditsFromAPI } from "src/views/Billing/creditUtils";

const AppHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarShow = useSelector((state) => state.coreUI.sidebarShow); // Updated selector
  const [AppName, setAppName] = useState("Businesses");
  const [credits, setCredits] = useState(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const token = isAutheticated();
  
  const handleAddCredits = () => {
    navigate("/billing/credits");
  };

  useEffect(() => {
    async function getConfiguration() {
      const configDetails = await axios.get(`/api/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppName("Businesses");
    }
    
    async function getUserCredits() {
      try {
        setIsLoadingCredits(true);
        // First try to fetch from API
        const apiCredits = await fetchCreditsFromAPI();
        setCredits(apiCredits || 0);
      } catch (error) {
        console.log("Error fetching user credits from API:", error);
        // Fallback to localStorage
        const localCredits = getCredits();
        setCredits(localCredits || 0);
      } finally {
        setIsLoadingCredits(false);
      }
    }
    
    // Listen for credits updates from other components
    const handleCreditsUpdated = (event) => {
      if (event.detail && typeof event.detail.credits !== 'undefined') {
        setCredits(event.detail.credits);
      }
    };
    
    // Add event listener
    window.addEventListener('creditsUpdated', handleCreditsUpdated);
    
    getConfiguration();
    getUserCredits();
    
    // Set up periodic refresh for credits (every 30 seconds)
    const creditsRefreshInterval = setInterval(() => {
      getUserCredits();
    }, 30000);
    
    // Clean up event listener and interval on component unmount
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdated);
      clearInterval(creditsRefreshInterval);
    };
  }, []);
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
          <CNavItem>
            <div className="credits-display d-flex align-items-center me-3">
              <span className="credits-label me-2">Credits:</span>
              <div className="d-flex align-items-center">
                {isLoadingCredits ? (
                  <span className="credits-value fw-bold">Loading...</span>
                ) : (
                  <span className="credits-value fw-bold">₹{credits}</span>
                )}
                <span 
                  className="credits-add-icon ms-2" 
                  onClick={handleAddCredits}
                  title="Add Credits"
                >+</span>
              </div>
            </div>
          </CNavItem>
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
