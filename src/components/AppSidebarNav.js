import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import { CBadge } from "@coreui/react";

export const AppSidebarNav = ({ items }) => {
  const location = useLocation();
  // We'll inject section headers above certain items (Data & Analytics, Agents)
  let headerInjectedDataAnalytics = false;
  let headerInjectedAgents = false;
  let headerInjectedCallSettings = false;
  let headerInjectedContacts = false;
  let headerInjectedMoreSettings = false;
  let headerInjectedCampaigns = false;
  const navLink = (name, icon, badge) => {
    return (
      <>
        {icon && (
          <span className="nav-icon-wrapper" aria-hidden>
            {React.isValidElement(icon) ? icon : icon}
          </span>
        )}
        {name && (
          <span style={{ color: '#1f2937', display: 'inline-block' }}>
            {name}
          </span>
        )}
        {badge && (
          <CBadge color={badge.color} className="ms-auto" style={{ color: '#1f2937' }}>
            {badge.text}
          </CBadge>
        )}
      </>
    );
  };

  const navItem = (item, index) => {
    const { component, name, badge, icon, ...rest } = item;
    const Component = component;
    // Force a visible link color (inline style has highest priority)
    const forcedStyle = Object.assign({}, rest.style || {}, { color: '#1f2937' });
    const forcedClass = ['app-sidebar-link', rest.className].filter(Boolean).join(' ');
    return (
      <Component
        {...(rest.to &&
          !rest.items && {
            component: NavLink,
            activeclassname: "active",
          })}
        key={`navitem-${index}`}
        {...rest}
        style={forcedStyle}
        className={forcedClass}
      >
        {navLink(name, icon, badge)}
      </Component>
    );
  };
  const navGroup = (item, index) => {
    const { component, name, icon, to, ...rest } = item;
    const Component = component;
    const groupStyle = Object.assign({}, rest.style || {}, { color: '#1f2937' });
    const groupClass = ['app-sidebar-group', rest.className].filter(Boolean).join(' ');
    return (
      <Component
        idx={String(index)}
        key={`navgroup-${index}-${name}`}
        toggler={navLink(name, icon)}
        visible={location.pathname.startsWith(to)}
        {...rest}
        style={groupStyle}
        className={groupClass}
      >
        {item.items?.map((item, index) =>
          item.items ? navGroup(item, `${index}-${item.name}`) : navItem(item, `${index}-${item.name}`)
        )}
      </Component>
    );
  };

  const rendered = [];
  if (items && items.length) {
    items.forEach((item, index) => {
      // Insert the DATA & ANALYTICS header before the first analytics-related item
      if (
        !headerInjectedDataAnalytics &&
        (item.name === 'Agent Performance' || item.name === 'Department Performance')
      ) {
        headerInjectedDataAnalytics = true;
        rendered.push(
          <div key={`section-data-analytics`} className="sidebar-section">
            <span className="sidebar-section-label">DATA &amp; ANALYTICS</span>
          </div>
        );
      }

      // Insert the AGENT & DEPARTMENT header before the Agents item
      if (!headerInjectedAgents && item.name === 'Agents') {
        headerInjectedAgents = true;
        rendered.push(
          <div key={`section-agent-dept`} className="sidebar-section">
            <span className="sidebar-section-label">AGENT &amp; DEPARTMENT</span>
          </div>
        );
      }

      // Insert the CALL SETTINGS header before the Call Settings item
      if (!headerInjectedCallSettings && item.name === 'Call Settings') {
        headerInjectedCallSettings = true;
        rendered.push(
          <div key={`section-call-settings`} className="sidebar-section">
            <span className="sidebar-section-label">CALL SETTINGS</span>
          </div>
        );
      }

      // Insert the CONTACT & VIRTUAL NUMBERS header before the first contact-related item
      if (
        !headerInjectedContacts &&
        (item.name === 'Virtual Numbers' || item.name === 'Contacts')
      ) {
        headerInjectedContacts = true;
        rendered.push(
          <div key={`section-contact`} className="sidebar-section">
            <span className="sidebar-section-label">CONTACT &amp; VIRTUAL NUMBERS</span>
          </div>
        );
      }

      // Insert CAMPAIGNS header before the first campaigns-related item (Audio Cmpaign)
      if (!headerInjectedCampaigns && item.name === 'Audio Cmpaign') {
        headerInjectedCampaigns = true;
        rendered.push(
          <div key={`section-campaigns`} className="sidebar-section">
            <span className="sidebar-section-label">CAMPAIGNS</span>
          </div>
        );
      }

      // Insert MORE SETTINGS header before the Billing item
      if (!headerInjectedMoreSettings && item.name === 'Billing') {
        headerInjectedMoreSettings = true;
        rendered.push(
          <div key={`section-more-settings`} className="sidebar-section">
            <span className="sidebar-section-label">MORE SETTINGS</span>
          </div>
        );
      }

      rendered.push(item.items ? navGroup(item, `main-${index}-${item.name}`) : navItem(item, `main-${index}-${item.name}`));
    });
  }

  return <>{rendered}</>;
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};
