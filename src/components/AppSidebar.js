import React, { useEffect, useState } from "react";
import './AppSidebar.css';
import { useSelector, useDispatch } from "react-redux";

import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Collapse,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { AppSidebarNav } from "./AppSidebarNav";

import { logoNegative } from "src/assets/brand/logo-negative";
import { sygnet } from "src/assets/brand/sygnet";

import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { getBusinessFeatures, filterNavigationByFeatures, filterNavigationByFeaturesMenu } from '../utils/featureCheck';

// sidebar nav config
import navigation from "../_nav";
import { isAutheticated } from "src/auth";
import axios from "axios";
import { Link } from "react-router-dom";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.coreUI.sidebarShow); // Updated selector
  // Coerce values to booleans to avoid CoreUI internal toggling when undefined/null
  const visibleFlag = Boolean(sidebarShow);
  const unfoldableFlag = Boolean(unfoldable);
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
  const [featuresMap, setFeaturesMap] = useState({});
  const [featuresMenu, setFeaturesMenu] = useState([]);
  const [featuresLabels, setFeaturesLabels] = useState({});
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
      // businessFeatures now: { featuresMap, featuresMenu }
      const map = businessFeatures.featuresMap || {};
      const menu = Array.isArray(businessFeatures.featuresMenu) ? businessFeatures.featuresMenu : [];
      const labels = businessFeatures.featuresLabels || {};
      setFeaturesMap(map);
      setFeaturesMenu(menu);
      setFeaturesLabels(labels);
      setFeaturesLoading(false);
      console.log('Business features loaded:', { map, menu });
    };

    fetchFeatures();
  }, [userdata]);

  // Filter navigation based on both accessTo and features
  useEffect(() => {
    if (!userdata) {
      setNavigationItem((prev) => {
        try {
          if (JSON.stringify(prev) === JSON.stringify(navigation)) return prev
        } catch (e) {}
        return navigation
      });
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
    if (!featuresLoading) {
      if (Array.isArray(featuresMenu) && featuresMenu.length > 0) {
        filtered = filterNavigationByFeaturesMenu(filtered, featuresMenu, featuresMap, featuresLabels);
      } else if (Object.keys(featuresMap || {}).length > 0 || Object.keys(featuresLabels || {}).length > 0) {
        filtered = filterNavigationByFeatures(filtered, featuresMap, featuresLabels);
      }
    }

    setNavigationItem((prev) => {
      try {
        if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev
      } catch (e) {}
      return filtered
    });
  }, [userdata, featuresMap, featuresMenu, featuresLoading]);

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

  // Listen for header-initiated collapse toggle events (keeps behavior identical to sidebar head logo)
  useEffect(() => {
    const onToggle = () => {
      const next = !collapsed;
      setCollapsed(next);
      try { localStorage.setItem('sidebar-collapsed', next ? 'true' : 'false'); } catch (e) {}
    };
    window.addEventListener('toggleSidebarCollapsed', onToggle);
    return () => window.removeEventListener('toggleSidebarCollapsed', onToggle);
  }, [collapsed]);

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
  const DRAWER_WIDTH = collapsed ? 80 : 250;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Sidebar Header / Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          borderBottom: '1px solid #e5e7eb',
          minHeight: '70px',
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            flex: 1,
            cursor: 'pointer',
          }}
          onClick={(e) => handleLogoClick(e)}
        >
          <img 
            src={AdminlogoUrl ? `${AdminlogoUrl}` : '/logos/sidebarlogo.ico'} 
            alt="Just Connect" 
            style={{ width: 40, height: 40, objectFit: 'contain' }}
          />
          {!collapsed && (
            <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box sx={{ display: 'flex', gap: '0', alignItems: 'baseline' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0760c7', fontSize: '0.9rem', margin: 0 }}>just</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f97316', fontSize: '0.9rem', margin: 0 }}>Connect</Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.6rem', lineHeight: 1.2 }}>Enterprise Conversations Simplified</Typography>
            </Box>
          )}
        </Link>
      </Box>

      {/* Sidebar Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <AppSidebarNav items={navigationItem} collapsed={collapsed} />
      </Box>
    </Drawer>
  );
};

export default React.memo(AppSidebar);
