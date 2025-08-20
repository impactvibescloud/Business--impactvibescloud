import React, { useState, useEffect } from 'react';
import { CModal, CModalHeader, CModalBody, CModalFooter, CSpinner } from '@coreui/react';
import PropTypes from 'prop-types';
import './MaintenanceAlert.scss';

const MaintenanceAlert = ({
  message = 'System maintenance is scheduled. Some features may be temporarily unavailable.',
  title,
  scheduledAt,
  resolvedAt,
  severity = 'warning',
  showCountdown = true,
  dismissible = true,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!showCountdown || !scheduledAt) {
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const scheduled = new Date(scheduledAt).getTime();
      const end = resolvedAt ? new Date(resolvedAt).getTime() : scheduled + (24 * 60 * 60 * 1000);

      if (now < scheduled) {
        const distance = scheduled - now;
        setTimeRemaining(`Maintenance starts in ${formatTimeRemaining(distance)}`);
      } else if (now >= scheduled && now <= end) {
        const distance = end - now;
        setTimeRemaining(resolvedAt ? `Maintenance ends in ${formatTimeRemaining(distance)}` : 'Maintenance in progress');
      } else {
        setVisible(false);
        if (onClose) onClose();
        return false; // Signal to clear interval
      }
      return true;
    };

    // Calculate immediately
    if (!calculateTimeRemaining()) return;

    // Then update every second
    const timer = setInterval(() => {
      if (!calculateTimeRemaining()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledAt, resolvedAt, showCountdown, onClose]);

  const formatTimeRemaining = (distance) => {
    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <>
      <div className={`maintenance-alert-backdrop ${visible ? 'visible' : ''}`} />
      <CModal 
        visible={visible}
        backdrop="static"
        keyboard={false}
        alignment="center"
        className="maintenance-alert-modal"
      >
        <CModalHeader closeButton={false}>
          <div className="maintenance-alert__header">
            <div className="maintenance-alert__icon">
              <CSpinner size="sm" variant="grow" />
            </div>
            <div className="maintenance-alert__title">
              {title || 'System Maintenance'}
            </div>
          </div>
        </CModalHeader>
        <CModalBody>
          <div className="maintenance-alert__content">
            <div className="maintenance-alert__message">
              {message}
            </div>
            {showCountdown && timeRemaining && (
              <div className="maintenance-alert__countdown">
                {timeRemaining}
              </div>
            )}
            {scheduledAt && (
              <div className="maintenance-alert__schedule">
                <div className="schedule-item">
                  <span className="label">Scheduled Start:</span>
                  <span className="value">{new Date(scheduledAt).toLocaleString()}</span>
                </div>
                {resolvedAt && (
                  <div className="schedule-item">
                    <span className="label">Expected Resolution:</span>
                    <span className="value">{new Date(resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter className="maintenance-alert__footer">
          <div className="maintenance-status">
            System is currently under maintenance. Please wait...
          </div>
        </CModalFooter>
      </CModal>
    </>
  );
};

MaintenanceAlert.propTypes = {
  message: PropTypes.string,
  title: PropTypes.string,
  scheduledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  resolvedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  severity: PropTypes.oneOf(['info', 'warning', 'danger']),
  showCountdown: PropTypes.bool,
  dismissible: PropTypes.bool,
  onClose: PropTypes.func,
};

export default MaintenanceAlert;
