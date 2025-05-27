import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Save } from '@mui/icons-material';

const AddEquipmentOutlet = () => {
  const [equipment, setEquipment] = useState([]);
  const [outletEquipment, setOutletEquipment] = useState({});
  const [loading, setLoading] = useState(true);
  const outletId = useParams().id;
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/equipment');
        const allEquipment = response.data.data;

        // Fetch previously added equipment
        const addedEquipment = []; // Replace with API call if needed

        // Map previously added equipment quantities
        const outletEquipmentMap = {};
        addedEquipment.forEach((item) => {
          outletEquipmentMap[item.equipment._id] = item.quantity;
        });

        setEquipment(allEquipment);
        setOutletEquipment(outletEquipmentMap);
      } catch (error) {
        console.error(error);
        setNotification({
          open: true,
          message: 'Failed to load equipment',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [outletId]);

  const handleQuantityChange = (equipmentId, quantity) => {
    setOutletEquipment((prevEquipment) => ({
      ...prevEquipment,
      [equipmentId]: quantity,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
  
      // Format the data as an array of objects
      const equipmentToSave = Object.keys(outletEquipment).map((equipmentId) => ({
        [equipmentId]: parseInt(outletEquipment[equipmentId], 10), // Ensure quantity is an integer
      }));
  
      await axios.post(`/api/equipment/outlet/add/${outletId}`, equipmentToSave);
  
      setNotification({
        open: true,
        message: 'Equipment added to outlet successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: 'Failed to add equipment to outlet',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (loading && equipment.length === 0) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container className="py-8">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4" component="h1" className="font-bold text-gray-800">
          Outlet Equipment Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Outlet Equipment
        </Button>
      </Box>
      {equipment.length === 0 ? (
        <Typography variant="h6" color="text.secondary" className="text-center">
          No equipment available to add
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Equipment Name</strong></TableCell>
                <TableCell><strong>Quantity</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      variant="outlined"
                      value={outletEquipment[item._id] || ''}
                      onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddEquipmentOutlet;