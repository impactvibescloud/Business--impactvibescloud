import React, { useState, useEffect } from 'react';
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilX } from '@coreui/icons';

const DateTimeFilterModal = ({ visible, onClose, onApply, initialStartDate, initialStartTime, initialEndDate, initialEndTime }) => {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [startTime, setStartTime] = useState(initialStartTime || '00:00');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [endTime, setEndTime] = useState(initialEndTime || '23:59');

  useEffect(() => {
    if (visible) {
      setStartDate(initialStartDate || '');
      setStartTime(initialStartTime || '00:00');
      setEndDate(initialEndDate || '');
      setEndTime(initialEndTime || '23:59');
    }
  }, [visible, initialStartDate, initialStartTime, initialEndDate, initialEndTime]);

  const handleApply = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (startDateTime > endDateTime) {
      alert('Start date/time must be before end date/time');
      return;
    }

    onApply({
      startDate,
      startTime,
      endDate,
      endTime
    });
    onClose();
  };

  const handleClear = () => {
    setStartDate('');
    setStartTime('00:00');
    setEndDate('');
    setEndTime('23:59');
  };

  return (
    <CModal 
      visible={visible} 
      onClose={onClose} 
      backdrop="static"
    >
      <CModalHeader closeButton>
        <span>Date & Time Filter</span>
      </CModalHeader>
      <CModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* From Date & Time */}
          <div>
            <h6 style={{ marginBottom: '12px', color: '#374151', fontWeight: '600' }}>From</h6>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* To Date & Time */}
          <div>
            <h6 style={{ marginBottom: '12px', color: '#374151', fontWeight: '600' }}>To</h6>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Selected Range Display */}
          {startDate && endDate && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              borderLeft: '4px solid #0b5a47'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <strong>Selected Range:</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#111827', marginTop: '4px' }}>
                {startDate} {startTime} → {endDate} {endTime}
              </div>
            </div>
          )}
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClear}>
          Clear
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleApply}>
          Apply
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DateTimeFilterModal;
