import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const AppSidebarNav = ({ items, collapsed }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});

  let headerInjectedDataAnalytics = false;
  let headerInjectedAgents = false;
  let headerInjectedCallSettings = false;
  let headerInjectedContacts = false;
  let headerInjectedMoreSettings = false;
  let headerInjectedCampaigns = false;

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const SectionHeader = ({ label }) => (
    <Box sx={{ px: collapsed ? 1 : 2, py: 0.75, mt: 0.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: '#9ca3af',
          fontSize: collapsed ? '0.65rem' : '0.75rem',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: collapsed ? 'none' : 'block',
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  const NavItemComponent = ({ item, index }) => {
    const { name, icon, badge, to } = item;
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
      <ListItem
        disablePadding
        key={`navitem-${index}`}
        sx={{
          display: 'block',
          px: collapsed ? 0.5 : 1,
          mb: 0.25,
        }}
      >
        <NavLink
          to={to}
          style={{ textDecoration: 'none' }}
          className={isActive ? 'active' : ''}
        >
          <ListItemButton
            sx={{
              minHeight: collapsed ? 32 : 36,
              borderRadius: collapsed ? '4px' : '6px',
              backgroundColor: isActive ? '#f3f4f6' : 'transparent',
              '&:hover': {
                backgroundColor: '#f9fafb',
              },
              px: collapsed ? 0.5 : 1,
              py: collapsed ? 0.25 : 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {icon && (
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: isActive ? '#6366f1' : '#6b7280',
                  fontSize: '1.3rem',
                }}
              >
                {icon}
              </ListItemIcon>
            )}
            {!collapsed && (
              <ListItemText
                primary={name}
                primaryTypographyProps={{
                  sx: {
                    color: isActive ? '#111827' : '#6b7280',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.85rem',
                  },
                }}
              />
            )}
            {!collapsed && badge && (
              <Chip
                label={badge.text}
                size="small"
                sx={{
                  ml: 'auto',
                  backgroundColor: badge.color || '#e5e7eb',
                  color: '#fff',
                  height: 20,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </ListItemButton>
        </NavLink>
      </ListItem>
    );
  };

  const NavGroupComponent = ({ item, index }) => {
    const { name, icon, to, items: subItems } = item;
    const isExpanded = expandedGroups[to] !== false; // Default expanded
    const isActive = location.pathname.startsWith(to);

    return (
      <Box key={`navgroup-${index}-${name}`}>
        <ListItem
          disablePadding
          sx={{
            display: 'block',
            px: collapsed ? 0.5 : 1,
            mb: 0.25,
          }}
        >
          <ListItemButton
            onClick={() => toggleGroup(to)}
            sx={{
              minHeight: collapsed ? 32 : 36,
              borderRadius: collapsed ? '4px' : '6px',
              backgroundColor: isActive ? '#f3f4f6' : 'transparent',
              '&:hover': {
                backgroundColor: '#f9fafb',
              },
              px: collapsed ? 0.5 : 1,
              py: collapsed ? 0.25 : 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {icon && (
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: isActive ? '#6366f1' : '#6b7280',
                  fontSize: '1.3rem',
                }}
              >
                {icon}
              </ListItemIcon>
            )}
            {!collapsed && (
              <>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{
                    sx: {
                      color: isActive ? '#111827' : '#6b7280',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.85rem',
                    },
                  }}
                />
                {isExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: '1.2rem', color: '#9ca3af' }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: '1.2rem', color: '#9ca3af' }} />
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {!collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List
              component="div"
              disablePadding
              sx={{
                pl: 2,
                pr: 1,
                mb: 0.25,
              }}
            >
              {subItems?.map((subItem, subIndex) =>
                subItem.items ? (
                  <NavGroupComponent item={subItem} index={`${index}-${subIndex}`} key={`${index}-${subIndex}`} />
                ) : (
                  <NavItemComponent item={subItem} index={`${index}-${subIndex}`} key={`${index}-${subIndex}`} />
                )
              )}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const rendered = [];
  if (items && items.length) {
    items.forEach((item, index) => {
      if (
        !headerInjectedDataAnalytics &&
        (item.name === 'Agent Performance' || item.name === 'Department Performance')
      ) {
        headerInjectedDataAnalytics = true;
        rendered.push(<SectionHeader key="section-data-analytics" label="Data & Analytics" />);
      }

      if (!headerInjectedAgents && item.name === 'Agents') {
        headerInjectedAgents = true;
        rendered.push(<SectionHeader key="section-agent-dept" label="Agent & Department" />);
      }

      if (!headerInjectedCallSettings && item.name === 'Call Settings') {
        headerInjectedCallSettings = true;
        rendered.push(<SectionHeader key="section-call-settings" label="Call Settings" />);
      }

      if (
        !headerInjectedContacts &&
        (item.name === 'Virtual Numbers' || item.name === 'Contacts')
      ) {
        headerInjectedContacts = true;
        rendered.push(<SectionHeader key="section-contact" label="Contact & Virtual Numbers" />);
      }

      if (!headerInjectedCampaigns && item.name === 'Audio Cmpaign') {
        headerInjectedCampaigns = true;
        rendered.push(<SectionHeader key="section-campaigns" label="Campaigns" />);
      }

      if (!headerInjectedMoreSettings && item.name === 'Billing') {
        headerInjectedMoreSettings = true;
        rendered.push(<SectionHeader key="section-more-settings" label="More Settings" />);
      }

      rendered.push(
        item.items ? (
          <NavGroupComponent item={item} index={`main-${index}-${item.name}`} key={`main-${index}-${item.name}`} />
        ) : (
          <NavItemComponent item={item} index={`main-${index}-${item.name}`} key={`main-${index}-${item.name}`} />
        )
      );
    });
  }

  return (
    <List sx={{ py: 0 }}>
      {rendered}
    </List>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  collapsed: PropTypes.bool,
};
