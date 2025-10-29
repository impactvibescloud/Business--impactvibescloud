import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";

import { AppSidebarNav } from "./AppSidebarNav";

import { logoNegative } from "src/assets/brand/logo-negative";
import { sygnet } from "src/assets/brand/sygnet";

import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

// sidebar nav config
import navigation from "../_nav";
import { isAutheticated } from "src/auth";
import axios from "axios";
import { Link } from "react-router-dom";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.coreUI.sidebarShow); // Updated selector
  const [navigationItem, setNavigationItem] = useState(navigation);

  const [userdata, setUserData] = useState(null);
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
  useEffect(() => {
    if (userdata && userdata.accessTo) {
      const filteredNavigation = navigation.filter((item) => {
        if (userdata.accessTo[item.name]) {
          return true;
        }
        return false;
      });
      setNavigationItem(filteredNavigation);
    } else {
      setNavigationItem(navigation);
    }
  }, [userdata]);

  ///----------------------//
  const [loading, setLoading] = useState(false);

  // urlcreated images
  const [AppName, setAppName] = useState("ImpactVibes");
  const [HeaderlogoUrl, setHeaderlogoUrl] = useState("");
  const [FooterlogoUrl, setFooterlogoUrl] = useState("");
  const [AdminlogoUrl, setAdminlogoUrl] = useState("");

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
      onVisibleChange={(visible) => {
        dispatch({ type: "set", payload: { sidebarShow: visible } }); // Updated dispatch action
      }}
    >
      <CSidebarBrand
        className="d-none d-md-flex"
        style={{ background: "rgb(140, 213, 213)", height: "56px", position: "relative", overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        to="/"
      >
        <Link to="/dashboard" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <img
            src={process.env.PUBLIC_URL + "/logos/sidebar_head.png"}
            alt="Sidebar Heading"
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: "100px", width: "auto", maxWidth: "150%", zIndex: 2, pointerEvents: "none" }}
          />
        </Link>
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={navigationItem} />
        </SimpleBar>
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() =>
          dispatch({ type: "set", sidebarUnfoldable: !unfoldable })
        }
      />
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
