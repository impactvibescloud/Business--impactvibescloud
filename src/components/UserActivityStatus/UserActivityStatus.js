import React from 'react';
import { CAvatar, CBadge, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CDropdownHeader, CDropdownDivider, CSpinner } from '@coreui/react';
import { useUserActivity, STATUS_OPTIONS, STATUS_COLORS } from '../../context/UserActivityContext';
import CIcon from '@coreui/icons-react';
import { cilUser, cilPencil, cilLockLocked } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

function UserActivityStatus() {
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

  // derive avatar url from possible shapes returned by API
  const avatarUrl = userData && (userData.avatar?.url || userData.avatar || userData.photo || userData.profileImage || userData.profile_image || null);

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
        {userData && (
          <>
            <CDropdownHeader className="bg-light fw-semibold py-2">Account</CDropdownHeader>
            <CDropdownItem disabled className="pb-2">
              <div>
                <strong>{userData.name}</strong>
              </div>
              <small className="text-muted">
                Last seen: {userData.lastSeen ? new Date(userData.lastSeen).toLocaleString() : 'Unknown'}
              </small>
            </CDropdownItem>
            <CDropdownDivider />
          </>
        )}

        <CDropdownHeader className="bg-light fw-semibold py-2">Status</CDropdownHeader>
        <CDropdownItem 
          onClick={() => handleStatusChange(STATUS_OPTIONS.ONLINE)}
          active={userStatus === STATUS_OPTIONS.ONLINE}
          disabled={loading}
        >
          <CBadge color={STATUS_COLORS[STATUS_OPTIONS.ONLINE]} shape="rounded-pill" className="me-2" />
          Online
        </CDropdownItem>
        <CDropdownItem 
          onClick={() => handleStatusChange(STATUS_OPTIONS.OFFLINE)}
          active={userStatus === STATUS_OPTIONS.OFFLINE}
          disabled={loading}
        >
          <CBadge color={STATUS_COLORS[STATUS_OPTIONS.OFFLINE]} shape="rounded-pill" className="me-2" />
          Offline
        </CDropdownItem>
        <CDropdownItem 
          onClick={() => handleStatusChange(STATUS_OPTIONS.LUNCH)}
          active={userStatus === STATUS_OPTIONS.LUNCH}
          disabled={loading}
        >
          <CBadge color={STATUS_COLORS[STATUS_OPTIONS.LUNCH]} shape="rounded-pill" className="me-2" />
          Lunch
        </CDropdownItem>
        <CDropdownItem 
          onClick={() => handleStatusChange(STATUS_OPTIONS.BREAK)}
          active={userStatus === STATUS_OPTIONS.BREAK}
          disabled={loading}
        >
          <CBadge color={STATUS_COLORS[STATUS_OPTIONS.BREAK]} shape="rounded-pill" className="me-2" />
          Break
        </CDropdownItem>

        <CDropdownDivider />
        <CDropdownHeader className="bg-light fw-semibold py-2">Settings</CDropdownHeader>
        <CDropdownItem
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/profile/edit'); }}
        >
          <CIcon icon={cilUser} className="me-2" />
          Edit Profile
        </CDropdownItem>
        <CDropdownItem
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/change_password'); }}
        >
          <CIcon icon={cilPencil} className="me-2" />
          Change Password
        </CDropdownItem>
        <CDropdownItem
          href="#"
          onClick={(e) => { e.preventDefault(); signout(); }}
        >
          <CIcon icon={cilLockLocked} className="me-2" />
          Log Out
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
}

export default UserActivityStatus;