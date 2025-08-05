import React from 'react';
import { CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilCheckCircle, 
  cilXCircle, 
  cilMoon, 
  cilCoffee, 
  cilWatch, 
  cilAvTimer 
} from '@coreui/icons';
import { USER_STATUSES, STATUS_CONFIG } from '../../context/UserActivityContext';

// Map status IDs to icons
const statusIcons = {
  [USER_STATUSES.ONLINE]: cilCheckCircle,
  [USER_STATUSES.OFFLINE]: cilXCircle,
  [USER_STATUSES.AWAY]: cilMoon,
  [USER_STATUSES.LUNCH]: cilCoffee,
  [USER_STATUSES.BREAK]: cilWatch,
  [USER_STATUSES.MEETING]: cilAvTimer,
  [USER_STATUSES.BUSY]: cilXCircle
};

/**
 * Displays a status indicator dot
 * @param {string} status - The status ID (online, busy, away, etc.)
 * @param {string} size - Size of the indicator (xs, sm, md, lg)
 * @param {boolean} animated - Whether to show animation for online status
 */
export const UserStatusIndicator = ({ status = USER_STATUSES.ONLINE, size = 'md', animated = false }) => {
  const statusObj = STATUS_CONFIG[status] || STATUS_CONFIG[USER_STATUSES.ONLINE];
  const sizeClass = size ? `status-indicator-${size}` : '';
  const animatedClass = animated && status === USER_STATUSES.ONLINE ? 'status-indicator-animated' : '';
  
  return (
    <CBadge 
      color={statusObj.color} 
      className={`status-indicator ${sizeClass} ${animatedClass}`} 
      shape="rounded-circle"
    />
  );
};

/**
 * Displays a status badge with icon
 * @param {string} status - The status ID (online, busy, away, etc.)
 * @param {boolean} showLabel - Whether to show the status label
 */
export const UserStatusBadge = ({ status = USER_STATUSES.ONLINE, showLabel = true }) => {
  const statusObj = STATUS_CONFIG[status] || STATUS_CONFIG[USER_STATUSES.ONLINE];
  const icon = statusIcons[status] || statusIcons[USER_STATUSES.ONLINE];
  
  return (
    <CBadge color={statusObj.color} className="d-flex align-items-center">
      <CIcon icon={icon} size="sm" className="me-1" />
      {showLabel && statusObj.label}
    </CBadge>
  );
};

/**
 * Formats the last activity time into a human-readable string
 * @param {Date|string} lastActivity - The timestamp of the last activity
 * @param {boolean} includePrefix - Whether to include "Active" prefix
 */
export const formatLastActivity = (lastActivity, includePrefix = true) => {
  if (!lastActivity) return '';
  
  const now = new Date();
  const lastActive = new Date(lastActivity);
  const diffMs = now - lastActive;
  const diffMins = Math.floor(diffMs / 60000);
  
  const prefix = includePrefix ? 'Active ' : '';
  
  if (diffMins < 1) return `${prefix}just now`;
  if (diffMins === 1) return `${prefix}1 minute ago`;
  if (diffMins < 60) return `${prefix}${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return `${prefix}1 hour ago`;
  if (diffHours < 24) return `${prefix}${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return `${prefix}1 day ago`;
  return `${prefix}${diffDays} days ago`;
};

/**
 * Calculates the duration between two timestamps
 * @param {Date|string} startTime - Start timestamp
 * @param {Date|string} endTime - End timestamp (defaults to now if not provided)
 */
export const calculateDuration = (startTime, endTime = new Date()) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Displays a username with status indicator
 * @param {string} username - The user's name
 * @param {string} status - The status ID (online, busy, away, etc.)
 * @param {Date|string} lastActivity - When the user was last active
 * @param {boolean} animated - Whether to show animation for online status
 * @param {boolean} showLastSeen - Whether to show last seen time for offline users
 */
export const UserWithStatus = ({ 
  username, 
  status = USER_STATUSES.ONLINE, 
  lastActivity,
  animated = false,
  showLastSeen = true
}) => {
  return (
    <div className="user-with-status">
      <UserStatusIndicator status={status} size="sm" animated={animated} />
      <div className="ms-2">
        <div className="user-name">{username}</div>
        {showLastSeen && status === USER_STATUSES.OFFLINE && lastActivity && (
          <small className="text-muted">Last seen: {formatLastActivity(lastActivity, false)}</small>
        )}
      </div>
    </div>
  );
};

export default { 
  UserStatusIndicator, 
  UserStatusBadge, 
  UserWithStatus,
  formatLastActivity,
  calculateDuration
};
