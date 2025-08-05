import React from 'react';
import { CCard, CCardBody, CCardHeader, CTable, CBadge } from '@coreui/react';
import { useUserActivity } from '../../context/UserActivityContext';

const TeamStatusView = () => {
  const { teamStatuses, fetchTeamStatuses, STATUS_COLORS } = useUserActivity();

  // Refresh team statuses
  const handleRefresh = () => {
    fetchTeamStatuses();
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'lunch':
        return 'Lunch';
      case 'break':
        return 'Break';
      default:
        return 'Unknown';
    }
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Team Activity Status</span>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </CCardHeader>
      <CCardBody>
        {teamStatuses.length === 0 ? (
          <div className="text-center py-3">No team members data available</div>
        ) : (
          <CTable hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {teamStatuses.map((member) => (
                <tr key={member.userId}>
                  <td>
                    <div className="d-flex align-items-center">
                      {member.avatar && (
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="me-2 rounded-circle"
                          style={{ width: '30px', height: '30px' }} 
                        />
                      )}
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>
                    <CBadge color={STATUS_COLORS[member.status]} className="px-2 py-1">
                      {getStatusLabel(member.status)}
                    </CBadge>
                  </td>
                  <td>
                    {new Date(member.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TeamStatusView;
