import React from 'react';
import MaintenanceAlert from './MaintenanceAlert/MaintenanceAlert';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  zIndex: 2147483647,
  pointerEvents: 'all',
  cursor: 'not-allowed',
};

const GlobalMaintenanceModal = ({ message, estimatedDowntime }) => (
  <div style={overlayStyle}>
    <MaintenanceAlert
      message={message || 'System is currently under maintenance. Please try again later.'}
      title="System Maintenance"
      severity="danger"
      showCountdown={false}
      dismissible={false}
    />
    {/* Overlay disables all interaction */}
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2147483648, pointerEvents: 'all' }} />
    {estimatedDowntime && (
      <div style={{ position: 'fixed', bottom: 32, left: 0, width: '100vw', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: 18, zIndex: 2147483649 }}>
        {estimatedDowntime}
      </div>
    )}
  </div>
);

export default GlobalMaintenanceModal;
