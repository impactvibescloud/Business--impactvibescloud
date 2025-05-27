import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilCommand,
  cilSpeedometer,
  cilText,
  cilLocationPin,
  cilSettings,
  cilMoney,
  cilViewModule,
  cilHistory,
  cilVideo,
  cilCamera,
  cilPeople,
} from "@coreui/icons";
import { CNavGroup, CNavItem, } from "@coreui/react";

const _nav = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    group: "",
  },
  {
    component: CNavItem,
    name: "Branches",
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
    to: "/branch",
    group: "Branches",
  },
  {
    component: CNavItem,
    name: "Devices",
    icon: <CIcon icon={cilCamera} customClassName="nav-icon" />,
    to: "/Devices",
    group: "Devices",
  },
  {
    component: CNavItem,
    name: "Customer Visits",
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    to: "/customer-visits",
    group: "customer-visits",
  },
];

export default _nav;
