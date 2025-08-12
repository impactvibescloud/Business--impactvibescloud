import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG, ENDPOINTS, apiCall } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const fetchBusinessId = async () => {
      try {
        const response = await apiCall(ENDPOINTS.GET_BUSINESS_DETAILS);
        if (response && response.data && response.data.businessId) {
          setBusinessId(response.data.businessId);
        }
      } catch (error) {
        console.error('Error fetching business ID:', error);
      }
    };

    fetchBusinessId();
  }, []);

  return (
    <AuthContext.Provider value={{ businessId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
