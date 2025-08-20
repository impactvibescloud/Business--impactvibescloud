import React from 'react';
import { CBadge, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CSpinner } from '@coreui/react';
import { useUserActivity, STATUS_OPTIONS, STATUS_COLORS } from '../../context/UserActivityContext';

function UserActivityStatus() {
  const { userStatus, userData, updateStatus, loading, STATUS_OPTIONS, STATUS_COLORS } = useUserActivity();

  const handleStatusChange = (status) => {
    updateStatus(status);
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

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle caret={false} placement="bottom-end" className="py-0" style={{ cursor: 'pointer' }}>
        <div className="d-flex align-items-center">
          {loading ? (
            <CSpinner size="sm" color="primary" className="me-2" style={{ width: '10px', height: '10px' }} />
          ) : (
            <CBadge 
              color={STATUS_COLORS[userStatus]} 
              shape="rounded-pill" 
              className="me-2" 
              style={{ width: '10px', height: '10px', display: 'inline-block' }} 
            />
          )}
          <span>
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
      <CDropdownMenu>
        {userData && (
          <>
            <CDropdownItem disabled className="pb-2">
              <div>
                <strong>{userData.name}</strong>
              </div>
              <small className="text-muted">
                Last seen: {new Date(userData.lastSeen).toLocaleString()}
              </small>
            </CDropdownItem>
            <CDropdownItem divider="true" />
          </>
        )}
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
      </CDropdownMenu>
    </CDropdown>
  );
}

export default UserActivityStatus;