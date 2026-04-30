import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ENDPOINTS, apiCall } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [businessId, setBusinessId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchBusinessId = async () => {
      try {
        // ENDPOINTS.GET_BUSINESS_DETAILS doesn't exist; the previous code
        // silently no-op'd because the URL was undefined. BUSINESS_DETAILS is
        // a function that requires a businessId we don't yet have, so the
        // sensible source of truth is /user/details.
        const response = await apiCall(ENDPOINTS.USER_DETAILS, 'GET');
        if (cancelled) return;
        const id =
          response?.user?.businessId ||
          response?.data?.businessId ||
          response?.businessId ||
          null;
        if (id) setBusinessId(id);
      } catch (err) {
        if (cancelled) return;
        // Don't crash the tree on a transient failure; keep businessId null
        // and let consumers fall back to localStorage / re-login flow.
        setError(err?.message || 'Failed to load business id');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBusinessId();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ businessId, error, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
