import React, { Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CContainer, CSpinner } from "@coreui/react";
import ErrorBoundary from "./ErrorBoundary";

// routes config
import routes from "../routes";
import { isAutheticated } from "src/auth";
import axios from "axios";
import toast from "react-hot-toast";
import { getFeatureKeyForNavItem, isFeatureEnabled } from '../utils/featureCheck';

const AppContent = () => {
  const [userper, setuserper] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = isAutheticated();

  useEffect(() => {
    let cancelled = false;
    const getUser = async () => {
      const existanceData = localStorage.getItem("authToken");
      if (!existanceData) {
        if (!cancelled) {
          setuserper(null);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await axios.get(`/api/v1/user/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response?.data;
        if (cancelled) return;
        if (data?.success && data?.user) {
          setuserper(data.user);
        } else {
          // Server replied but didn't include a user — treat as unauthenticated
          // rather than promoting the visitor to business_admin (which is what
          // the previous fallback did and effectively bypassed all gating).
          setuserper(null);
        }
      } catch (err) {
        if (cancelled) return;
        // Authentication failure: clear the broken token so ProtectedRoute
        // bounces the user back to login instead of rendering an admin shell
        // around an unverified session.
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          try { localStorage.removeItem("authToken"); } catch (e) { /* ignore */ }
        }
        setuserper(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const [appRoutes, setAppRoutes] = useState(routes);

  // Show loading spinner while fetching user data
  if (loading) {
    return (
      <CContainer lg className="text-center py-5">
        <CSpinner color="primary" />
        <div className="mt-2">Loading...</div>
      </CContainer>
    );
  }

  return (
    <ErrorBoundary>
      <CContainer lg>
        <Suspense fallback={<CSpinner color="primary" />}>
          <Routes>
            {appRoutes.map((route, idx) => {
              // Show routes if user is admin OR if no specific access control needed OR if user has access.
              // Routes explicitly marked `alwaysVisible` bypass both the
              // accessTo check and the feature-flag gate — used for
              // critical admin pages whose access is enforced by the
              // page's own server-side endpoints (e.g., Migrations & Ops).
              if (route.alwaysVisible) {
                return (
                  route.element && (
                    <Route
                      key={idx}
                      path={route.path}
                      exact={route.exact}
                      name={route.name}
                      element={<route.element />}
                    />
                  )
                );
              }

              const baseAccess =
                userper?.role === "business_admin" ||
                !route.navName ||
                route.navName?.trim() === "" ||
                (userper?.accessTo && userper?.accessTo[route?.navName] === true);

              // Feature gating: attempt to read cached features from localStorage
              let featuresMap = {};
              try {
                featuresMap = JSON.parse(localStorage.getItem('businessFeaturesMap') || '{}');
              } catch (e) {
                featuresMap = {};
              }

              let featureAllowed = true;
              const mappedKey = getFeatureKeyForNavItem({ to: route.path, name: route.name });
              const hasFeatureData = Object.keys(featuresMap || {}).length > 0;
              if (mappedKey) {
                if (hasFeatureData) {
                  // If features are known, require the mapped key to be present and enabled.
                  if (Object.prototype.hasOwnProperty.call(featuresMap, mappedKey)) {
                    featureAllowed = isFeatureEnabled(featuresMap, mappedKey);
                  } else {
                    // mapped key not present in backend features -> deny access
                    featureAllowed = false;
                  }
                } else {
                  // No feature data yet (e.g. initial load) -> fallback allow so app isn't locked out
                  featureAllowed = true;
                }
              }

              const shouldShowRoute = baseAccess && featureAllowed;

              if (shouldShowRoute) {
                return (
                  route.element && (
                    <Route
                      key={idx}
                      path={route.path}
                      exact={route.exact}
                      name={route.name}
                      element={<route.element />}
                    />
                  )
                );
              }
              return null;
            })}
            <Route path="/" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </CContainer>
    </ErrorBoundary>
  );
};

export default React.memo(AppContent);
