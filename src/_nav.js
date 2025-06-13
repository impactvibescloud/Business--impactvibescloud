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
    name: "Agents",
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
    to: "/branch",
    group: "Agents",
  },
];

export default _nav;
