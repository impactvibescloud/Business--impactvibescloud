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
  cilPeople,
  cilBullhorn,
  cilPhone,
  cilChart,
  cilGroup,
  cilDescription,
  cilDollar,
  cilBuilding,
  cilNotes,
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
    icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
    to: "/branch",
    group: "Agents",
  },
  {
    component: CNavItem,
    name: "Department",
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    to: "/department",
    group: "Department",
  },
  {
    component: CNavItem,
    name: "Department Performance",
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    to: "/department-performance",
    group: "Reports & Analytics",
    feature: "advancedReporting",
  },
  {
    component: CNavItem,
    name: "Call Dispositions",
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    to: "/reports/call-dispositions",
    group: "Data & Analytics",
    feature: "advancedDispositions",
  },
  {
    component: CNavItem,
    name: "Reports & Analytics",
    icon: <CIcon icon={cilViewModule} customClassName="nav-icon" />,
    to: "/reports-analytics",
    group: "Reports & Analytics",
    feature: "analytics",
  },
  {
    component: CNavItem,
    name: "Agent Performance",
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    to: "/agent-performance",
    group: "Reports & Analytics",
    feature: "advancedReporting",
  },
  {
    component: CNavItem,
    name: "Call Logs",
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
    to: "/callogs",
    group: "Call Logs",
    feature: "callRecording",
  },
  {
    component: CNavItem,
    name: "Call Uses",
    icon: <CIcon icon={cilText} customClassName="nav-icon" />,
    to: "/calluses",
    group: "Call Logs",
  },
  {
    component: CNavItem,
    name: "Call Settings",
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    to: "/call-settings",
    group: "Settings",
  },
  {
    component: CNavItem,
    name: "IVR Management",
    icon: <CIcon icon={cilCommand} customClassName="nav-icon" />,
    to: "/ivr-management",
    group: "Call Logs",
    feature: "ivrManagement",
  },
  
  {
    component: CNavItem,
    name: "Virtual Numbers",
    icon: <CIcon icon={cilPhone} customClassName="nav-icon" />,
    to: "/virtual-numbers",
    group: "Virtual Numbers",
  },
  {
    component: CNavItem,
    name: "Contacts",
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    to: "/contacts",
    group: "Contacts",
  },
  {
    component: CNavItem,
    name: "Contact Lists",
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
    to: "/contactlists",
    group: "Contact Lists",
  },
  
  // {
  //   component: CNavGroup,
  //   name: "Campaigns",
  //   icon: <CIcon icon={cilBullhorn} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: "Autodial",
  //       to: "/campaigns/autodial",
  //     },
  //     {
  //       component: CNavItem,
  //       name: "Surveys",
  //       to: "/campaigns/surveys",
  //     },
  //   ],
  // },
  {
    component: CNavItem,
    name: "Audio Cmpaign",
    icon: <CIcon icon={cilBullhorn} customClassName="nav-icon" />,
    to: "/campaigns/audio",
    group: "Campaigns",
    feature: "bulkOperations",
  },
  // {
  //   component: CNavItem,
  //   name: "Users & Teams",
  //   icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
  //   to: "/users-teams",
  //   group: "Users & Teams",
  // },
  // {
  //   component: CNavItem,
  //   name: "Templates",
  //   icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  //   to: "/templates",
  //   group: "Templates",
  // },
  
  {
    component: CNavItem,
    name: "Billing",
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
    to: "/billing",
    group: "Billing",
  },
  
  
  // {
  //   component: CNavItem,
  //   name: "Settings",
  //   icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  //   to: "/settings",
  //   group: "Settings",
  // },
  {
    component: CNavItem,
    name: "Support Tickets",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    to: "/tickets",
    group: "Support",
    feature: "ticketing",
  },
];

export default _nav;
