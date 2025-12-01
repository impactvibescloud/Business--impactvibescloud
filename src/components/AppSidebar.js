import React, { useEffect, useState } from "react";
import './AppSidebar.css';
import { useSelector, useDispatch } from "react-redux";

import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";

import { AppSidebarNav } from "./AppSidebarNav";

import { logoNegative } from "src/assets/brand/logo-negative";
import { sygnet } from "src/assets/brand/sygnet";

import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { UserActivityStatus } from './index';
import { getBusinessFeatures, filterNavigationByFeatures } from '../utils/featureCheck';

// sidebar nav config
import navigation from "../_nav";
import { isAutheticated } from "src/auth";
import axios from "axios";
import { Link } from "react-router-dom";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.coreUI.sidebarShow); // Updated selector
  // Local collapsed state for sidebar minimization (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [navigationItem, setNavigationItem] = useState(navigation);

  const [userdata, setUserData] = useState(null);
  const [features, setFeatures] = useState({});
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const token = isAutheticated();
  // console.log("userDatt", userdata);

  useEffect(() => {
    const getUser = async () => {
      let existanceData = localStorage.getItem("authToken");
      if (!existanceData) {
        // console.log(existanceData.userData)
        setUserData(false);
      } else {
        try {
          // console.log('requesting user data from server')
          let response = await axios.get(`/api/v1/user/details`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // console.log(response.data)
          const data = response.data;
          if (
            data.success && 
            data.user && 
            data.user.role && 
            (data.user.role === "business_admin" || data.user.role === "Employee")
          ) {
            setUserData(data.user);
          } else {
            setUserData(false);
          }
        } catch (err) {
          setUserData(false);
          console.log(err);
        }
      }
    };
    getUser();
  }, []);
  // Fetch business features when userdata is available
  useEffect(() => {
    const fetchFeatures = async () => {
      if (!userdata) return;

      const businessId = userdata.businessId || localStorage.getItem('businessId');
      const token = localStorage.getItem('authToken');

      if (!businessId || !token) {
        console.warn('Cannot fetch features: missing businessId or token');
        return;
      }

      setFeaturesLoading(true);
      const businessFeatures = await getBusinessFeatures(businessId, token);
      setFeatures(businessFeatures);
      setFeaturesLoading(false);
      console.log('Business features loaded:', businessFeatures);
    };

    fetchFeatures();
  }, [userdata]);

  // Filter navigation based on both accessTo and features
  useEffect(() => {
    if (!userdata) {
      setNavigationItem(navigation);
      return;
    }

    let filtered = navigation;

    // Step 1: Filter by user access (accessTo)
    if (userdata.accessTo) {
      filtered = filtered.filter((item) => {
        if (userdata.accessTo[item.name]) {
          return true;
        }
        return false;
      });
    }

    // Step 2: Filter by business features (if features are loaded)
    if (!featuresLoading && Object.keys(features).length > 0) {
      filtered = filterNavigationByFeatures(filtered, features);
    }

    setNavigationItem(filtered);
  }, [userdata, features, featuresLoading]);

  ///----------------------//
  const [loading, setLoading] = useState(false);

  // urlcreated images
  const [AppName, setAppName] = useState("ImpactVibes");
  const [HeaderlogoUrl, setHeaderlogoUrl] = useState("");
  const [FooterlogoUrl, setFooterlogoUrl] = useState("");
  const [AdminlogoUrl, setAdminlogoUrl] = useState("");

  // Toggle collapsed state utility (prevent link navigation when toggling)
  const handleToggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('sidebar-collapsed', next ? 'true' : 'false');
    } catch (err) {}
  };

  // Logo click handler: toggle sidebar unless user used a modifier or middle-click (allow navigation)
  const handleLogoClick = (e) => {
    // React synthetic events wrap nativeEvent
    const native = e && e.nativeEvent ? e.nativeEvent : e;
    const isModifier = native && (native.ctrlKey || native.metaKey || native.shiftKey || native.altKey);
    const isMiddle = native && (native.button === 1 || native.which === 2);
    if (isModifier || isMiddle) {
      // allow normal navigation (open in new tab / middle click)
      return;
    }
    if (e && e.preventDefault) e.preventDefault();
    handleToggle();
  };

  useEffect(() => {
    async function getConfiguration() {
      try {
        const configDetails = await axios.get(`/api/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAppName("ImpactVibes");
        
        // Safely check if result exists and is an array
        if (configDetails.data && configDetails.data.result && Array.isArray(configDetails.data.result)) {
          configDetails.data.result.map((item) => {
            if (item?.logo && item.logo[0]) {
              setHeaderlogoUrl(item.logo[0].Headerlogo || "");
              setFooterlogoUrl(item.logo[0].Footerlogo || "");
              setAdminlogoUrl(item.logo[0].Adminlogo || "");
            }
          });
        }
      } catch (error) {
        console.warn('Config API failed, using defaults:', error.message);
        setAppName("ImpactVibes");
        setHeaderlogoUrl("");
        setFooterlogoUrl("");
        setAdminlogoUrl("");
      }
    }
    getConfiguration();
  }, []);

  //---------------------------//
  return (
    <CSidebar
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      className={collapsed ? 'c-sidebar c-sidebar-minimized' : 'c-sidebar'}
      style={{ background: '#FFFFFF', backgroundImage: 'none' }}
      onVisibleChange={(visible) => {
        dispatch({ type: "set", payload: { sidebarShow: visible } }); // Updated dispatch action
      }}
    >
      <CSidebarBrand className="d-none d-md-flex sidebar-brand" style={{ padding: 0, height: 56 }}>
        <div className="sidebar-brand-inner" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/dashboard"
              className="sidebar-logo"
              aria-label="Go to dashboard"
              onClick={(e) => handleLogoClick(e)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
            >
              <img src={AdminlogoUrl ? `${AdminlogoUrl}` : '/Logos/sidebarlogo.ico'} alt="Just Connect" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </Link>
            <button
              className="sidebar-title"
              onClick={(e) => { e.preventDefault(); handleToggle(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
              aria-pressed={collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="sidebar-title-main"><span style={{ color: '#0760c7ff' }}>just</span><span style={{ marginLeft: 6, color: '#f97316' }}>Connect</span></div>
              <div className="sidebar-title-sub">Enterprise Conversations Simplified</div>
            </button>
          </div>

          <button
            className="sidebar-toggle-btn"
            onClick={() => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem('sidebar-collapsed', next ? 'true' : 'false'); } catch (e) {} }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="sidebar-toggle-icon" aria-hidden>{'›'}</span>
          </button>
        </div>
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={navigationItem} />
        </SimpleBar>
      </CSidebarNav>
      {/* Sidebar footer: user/profile + status (fixed at bottom) */}
      {/* Divider to separate main nav from bottom menu */}
      <div className="sidebar-divider" aria-hidden />

      <div className="sidebar-footer p-2">
        <div className="sidebar-footer-inner" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Unified user chip: combined avatar, status dot, status controls and settings */}
          <div className="sidebar-user-status">
            <UserActivityStatus />
          </div>
        </div>
      </div>
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
