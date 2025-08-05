import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiCall, ENDPOINTS, API_CONFIG } from '../config/api';
import axios from 'axios';

// Create the context
const UserActivityContext = createContext();

// Status options
export const STATUS_OPTIONS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  LUNCH: 'lunch',
  BREAK: 'break'
};

// Status colors for badges
export const STATUS_COLORS = {
  [STATUS_OPTIONS.ONLINE]: 'success',
  [STATUS_OPTIONS.OFFLINE]: 'secondary',
  [STATUS_OPTIONS.LUNCH]: 'warning',
  [STATUS_OPTIONS.BREAK]: 'info'
};

// Provider component
export function UserActivityProvider({ children }) {
  const [userStatus, setUserStatus] = useState(STATUS_OPTIONS.ONLINE);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch current user status on mount
  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  // Fetch current user status
  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      const endpoint = 'http://localhost:5040/api/v1/user/status';
      const authToken = localStorage.getItem('authToken') || API_CONFIG.AUTH_TOKEN;
      
      console.log('Fetching current status from:', endpoint);
      
      const response = await axios.get(
        endpoint,
        {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      console.log('Response:', response.data);
      
      if (response.status === 200 && response.data.success) {
        // Parse the response according to the format provided
        const { data } = response.data;
        
        if (data && data.current_status) {
          setUserStatus(data.current_status);
          setUserData({
            id: data._id,
            name: data.name,
            email: data.email,
            lastSeen: data.last_seen
          });
          console.log('User status set to:', data.current_status);
        } else {
          console.warn('Response did not contain expected status data:', data);
          setUserStatus(STATUS_OPTIONS.ONLINE);
        }
      } else {
        console.warn('Unexpected API response:', response.data);
        setUserStatus(STATUS_OPTIONS.ONLINE);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
      // Default to online if there's an error
      setUserStatus(STATUS_OPTIONS.ONLINE);
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      const endpoint = 'http://localhost:5040/api/v1/user/status';
      const authToken = localStorage.getItem('authToken') || API_CONFIG.AUTH_TOKEN;
      
      console.log('Updating status to:', newStatus);
      
      const response = await axios.post(
        endpoint, 
        { status: newStatus }, // Sending status in the request body
        {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      if (response.status === 200 && response.data.success) {
        // If the update was successful, update the local state
        setUserStatus(newStatus);
        
        // If the response includes the updated user data, update that as well
        if (response.data.data) {
          const { data } = response.data;
          setUserData({
            id: data._id,
            name: data.name,
            email: data.email,
            lastSeen: data.last_seen
          });
        }
        
        console.log('Status updated successfully to:', newStatus);
      } else {
        console.warn('Status update failed:', response.data);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userStatus,
    userData,
    updateStatus,
    loading,
    STATUS_OPTIONS,
    STATUS_COLORS
  };

  return (
    <UserActivityContext.Provider value={value}>
      {children}
    </UserActivityContext.Provider>
  );
}

// Custom hook for using the context
export function useUserActivity() {
  const context = useContext(UserActivityContext);
  if (!context) {
    throw new Error('useUserActivity must be used within a UserActivityProvider');
  }
  return context;
}

export default UserActivityContext;