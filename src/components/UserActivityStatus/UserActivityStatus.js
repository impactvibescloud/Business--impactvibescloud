import React, { useState, useRef } from 'react';
import { CAvatar, CBadge, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CDropdownHeader, CDropdownDivider, CSpinner } from '@coreui/react';
import { useUserActivity, STATUS_OPTIONS, STATUS_COLORS } from '../../context/UserActivityContext';
import CIcon from '@coreui/icons-react';
import { cilUser, cilPencil, cilLockLocked } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

function UserActivityStatus({ asMenu = false }) {
  const { userStatus, userData, updateStatus, loading, STATUS_OPTIONS, STATUS_COLORS } = useUserActivity();

  const navigate = useNavigate();

  const handleStatusChange = (status) => {
    updateStatus(status);
  };

  const signout = async () => {
    try {
      localStorage.removeItem('authToken');
      swal('success!', 'Logged Out', 'success');
      navigate('/');
    } catch (err) {
      console.error('Signout error', err);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case STATUS_OPTIONS.ONLINE:
        return 'Online';
      case STATUS_OPTIONS.OFFLINE:
        return 'Offline';
      case STATUS_OPTIONS.LUNCH:
        return 'Lunch';
      case STATUS_OPTIONS.BREAK:
        return 'Break';
      default:
        return 'Unknown';
    }
  };

  // Small soft-color icon SVG for statuses (use hex colors so icons always show)
  const STATUS_COLOR_HEX = {
    [STATUS_OPTIONS.ONLINE]: '#10B981', // green
    [STATUS_OPTIONS.OFFLINE]: '#6B7280', // gray
    [STATUS_OPTIONS.LUNCH]: '#F59E0B', // amber
    [STATUS_OPTIONS.BREAK]: '#06B6D4' // teal
  };

  const hexToRgba = (hex, alpha = 1) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStatusIcon = (status) => {
    const color = STATUS_COLOR_HEX[status] || '#9CA3AF';
    switch (status) {
      case STATUS_OPTIONS.ONLINE:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.95" />
            <path d="M9 12.5l1.8 1.8L15 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case STATUS_OPTIONS.OFFLINE:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 2a9.99 9.99 0 100 20 9.99 9.99 0 000-20z" fill={color} fillOpacity="0.95" />
            <path d="M12 6v6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )
      case STATUS_OPTIONS.LUNCH:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="7" width="14" height="10" rx="3" fill={color} fillOpacity="0.95" />
            <path d="M20 9v6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
            <path d="M7 10v6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M10 10v6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )
      case STATUS_OPTIONS.BREAK:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="6" width="12" height="9" rx="2" fill={color} fillOpacity="0.95" />
            <path d="M15 8h4a2 2 0 110 4h-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 4s1.5 1 2.5 0S12 4 12 4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          </svg>
        )
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.95" />
          </svg>
        )
    }
  }

  // derive avatar url from possible shapes returned by API
  const avatarUrl = userData && (userData.avatar?.url || userData.avatar || userData.photo || userData.profileImage || userData.profile_image || null);

  // Manage hover popover visibility for status options
  const [showStatusPopover, setShowStatusPopover] = useState(false)
  const hoverTimerRef = useRef(null)

  // Build the menu content so it can be reused either as a full dropdown menu
  // or rendered inline inside another container (e.g. header modal).
  const menuContent = (
    <div className="user-activity-menu">
      {userData && (
        <>
          <div className="user-activity-section user-activity-account bg-light fw-semibold py-2">Account</div>
          <div className="user-activity-item pb-2" aria-disabled>
            <div>
              <strong>{userData.name}</strong>
            </div>
            <small className="text-muted">
              Last seen: {userData.lastSeen ? new Date(userData.lastSeen).toLocaleString() : 'Unknown'}
            </small>
          </div>
        </>
      )}

      <div className="status-row" role="region" aria-label="Status selector">
        {/* Combined single container: left label + right current status.
            Use a wrapper so hover state remains while moving between button and popover */}
        <div
          className="status-hover-wrap"
          onMouseEnter={() => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            setShowStatusPopover(true)
          }}
          onMouseLeave={() => {
            hoverTimerRef.current = setTimeout(() => setShowStatusPopover(false), 150)
          }}
        >
          <button
            className="user-activity-item status-combined"
            onFocus={() => setShowStatusPopover(true)}
            onBlur={() => hoverTimerRef.current = setTimeout(() => setShowStatusPopover(false), 150)}
            aria-haspopup="true"
            aria-expanded={showStatusPopover}
          >
            <span className="status-title">Status</span>
            <span className="status-current-wrap">
              <span
                className="status-label-pill"
                style={{
                  background: hexToRgba(STATUS_COLOR_HEX[userStatus] || '#9CA3AF', 0.12),
                  border: `1px solid ${hexToRgba(STATUS_COLOR_HEX[userStatus] || '#9CA3AF', 0.18)}`,
                  color: STATUS_COLOR_HEX[userStatus] || '#0f1724'
                }}
              >
                <span className="status-icon-inline">{getStatusIcon(userStatus)}</span>
                <span className="status-current-text">{getStatusLabel(userStatus)}</span>
              </span>
            </span>
          </button>

          {showStatusPopover && (
            <div className="status-popover" role="dialog" aria-label="Change status">
              <button className={`user-activity-item ${userStatus === STATUS_OPTIONS.ONLINE ? 'active' : ''}`} onClick={() => { handleStatusChange(STATUS_OPTIONS.ONLINE); setShowStatusPopover(false); }} disabled={loading}>
                <span className="status-option-label">Online</span>
                <span className="status-option-icon">{getStatusIcon(STATUS_OPTIONS.ONLINE)}</span>
              </button>
              <button className={`user-activity-item ${userStatus === STATUS_OPTIONS.OFFLINE ? 'active' : ''}`} onClick={() => { handleStatusChange(STATUS_OPTIONS.OFFLINE); setShowStatusPopover(false); }} disabled={loading}>
                <span className="status-option-label">Offline</span>
                <span className="status-option-icon">{getStatusIcon(STATUS_OPTIONS.OFFLINE)}</span>
              </button>
              <button className={`user-activity-item ${userStatus === STATUS_OPTIONS.LUNCH ? 'active' : ''}`} onClick={() => { handleStatusChange(STATUS_OPTIONS.LUNCH); setShowStatusPopover(false); }} disabled={loading}>
                <span className="status-option-label">Lunch</span>
                <span className="status-option-icon">{getStatusIcon(STATUS_OPTIONS.LUNCH)}</span>
              </button>
              <button className={`user-activity-item ${userStatus === STATUS_OPTIONS.BREAK ? 'active' : ''}`} onClick={() => { handleStatusChange(STATUS_OPTIONS.BREAK); setShowStatusPopover(false); }} disabled={loading}>
                <span className="status-option-label">Break</span>
                <span className="status-option-icon">{getStatusIcon(STATUS_OPTIONS.BREAK)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="user-activity-divider" />
      <button className="user-activity-item" onClick={(e) => { e.preventDefault(); navigate('/profile/edit'); }}>
        <CIcon icon={cilUser} className="me-2" />
        Edit Profile
      </button>
      <button className="user-activity-item" onClick={(e) => { e.preventDefault(); navigate('/change_password'); }}>
        <CIcon icon={cilPencil} className="me-2" />
        Change Password
      </button>
      <button className="user-activity-item" onClick={(e) => { e.preventDefault(); signout(); }}>
        <CIcon icon={cilLockLocked} className="me-2" />
        Log Out
      </button>
    </div>
  )

  if (asMenu) {
    return menuContent
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle caret={false} placement="bottom-end" className="py-0 sidebar-user-chip" style={{ cursor: 'pointer' }}>
        <div className="d-flex align-items-center">
          {loading ? (
            <CSpinner size="sm" color="primary" className="me-2" style={{ width: '10px', height: '10px' }} />
          ) : null}
          {/* Compact avatar + status dot for collapsed sidebar */}
          <span className="user-avatar-wrapper d-inline-flex align-items-center">
            {avatarUrl ? (
              <CAvatar src={avatarUrl} size="md" className="user-avatar" />
            ) : (
              <CAvatar size="md" className="user-avatar">{userData && userData.name ? userData.name.charAt(0) : 'U'}</CAvatar>
            )}
            <span className={`status-dot status-${userStatus || 'offline'}`} aria-hidden />
          </span>
          <span className="ms-2 sidebar-user-text">
            {userData ? (
              <small className="d-flex flex-column">
                <span>{userData.name}</span>
                <span className="text-muted">{getStatusLabel(userStatus)}</span>
              </small>
            ) : (
              getStatusLabel(userStatus)
            )}
          </span>
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        {menuContent}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default UserActivityStatus;