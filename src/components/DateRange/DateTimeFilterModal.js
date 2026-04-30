import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';

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
    <Dialog 
      open={visible} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>Date & Time Filter</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* From Date & Time */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>
              From
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                label="Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                label="Time"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* To Date & Time */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>
              To
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                label="Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                label="Time"
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* Selected Range Display */}
          {startDate && endDate && (
            <Alert severity="info" sx={{ borderLeft: '4px solid #0b5a47' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Selected Range:</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {startDate} {startTime} → {endDate} {endTime}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleClear} sx={{ textTransform: 'none' }}>
          Clear
        </Button>
        <Button variant="outlined" onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleApply} sx={{ textTransform: 'none', backgroundColor: '#0b5a47' }}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateTimeFilterModal;
