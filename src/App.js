import React, { Suspense, useEffect, useState } from "react";
import GlobalMaintenanceModal from "./components/GlobalMaintenanceModal";
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { isAutheticated } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import axios from "axios";
import ForgotPassword from "./views/pages/register/ForgotPassword";

// Import timeout prevention utilities
import setupAxiosInterceptors from "./utils/axiosInterceptors";
import { setupFetchInterceptor } from "./utils/fetchInterceptor";

// User activity context
import { UserActivityProvider } from "./context/UserActivityContext";
import { AuthProvider } from "./context/authContext";

// Containers
const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));

// Pages
const Login = React.lazy(() => import("./views/pages/login/Login"));
const Page404 = React.lazy(() =>
  import("./views/pages/register/page404/Page404")
);
const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));

const App = () => {
  const [userdata, setUserData] = useState(null);
  const token = isAutheticated();
  const [maintenance, setMaintenance] = useState({ active: false, message: '', estimatedDowntime: '' });

  // Initialize timeout prevention systems. Mount-only: setupAxios/Fetch
  // interceptors are idempotent (guarded with their own internal flag) and
  // setMaintenance is stable from useState, so [] is the correct dep list —
  // no eslint-disable needed.
  useEffect(() => {
    setupAxiosInterceptors()
    setupFetchInterceptor()
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString())
    }
    const respInterceptor = axios.interceptors.response.use(
      (response) => {
        if (response?.data?.maintenanceMode) {
          setMaintenance({
            active: true,
            message: response.data.message || 'System is currently under maintenance. Please try again later.',
            estimatedDowntime: response.data.estimatedDowntime || '',
          });
        }
        return response;
      },
      (error) => {
        if (error?.response?.data?.maintenanceMode) {
          setMaintenance({
            active: true,
            message: error.response.data.message || 'System is currently under maintenance. Please try again later.',
            estimatedDowntime: error.response.data.estimatedDowntime || '',
          });
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(respInterceptor);
    };
  }, []);

  useEffect(() => {
    // Read the token fresh inside the effect rather than relying on the
    // mount-time `token` const; otherwise login-from-this-tab and
    // login/logout-from-another-tab don't trigger a re-fetch until a full
    // page reload. The storage listener below covers the cross-tab case.
    const getUser = async () => {
      const existanceData = localStorage.getItem("authToken");
      if (!existanceData) {
        setUserData(false);
        return;
      }
      try {
        const response = await axios.get(`/api/v1/user/details`, {
          headers: {
            Authorization: `Bearer ${existanceData}`,
          },
        });
        const data = response?.data;
        if (
          data?.success
          && (data?.user?.role === "business_admin" || data?.user?.role === "Employee")
        ) {
          setUserData(data?.user);
        } else {
          setUserData(false);
        }
      } catch (err) {
        setUserData(false);
        console.log(err);
      }
    };
    getUser();
    const onStorage = (e) => {
      if (e.key === "authToken") getUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [token]);
  return (
    <Router>
      <UserActivityProvider>
        <AuthProvider>
          {/* ErrorBoundary catches failures in any lazy chunk (Login,
              DefaultLayout, error pages); without it a chunk-load error
              would leave the user staring at the Suspense fallback forever. */}
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="pt-3 text-center">
                  <div className="sk-spinner sk-spinner-pulse"></div>
                </div>
              }
            >
              <Routes>
                <Route path="/" name="Login Page" element={<Login />} />
                <Route path="/404" name="Page 404" element={<Page404 />} />
                <Route path="/500" name="Page 500" element={<Page500 />} />
                <Route
                  path="/forget-password"
                  name="Forgot password"
                  element={<ForgotPassword />}
                />
                <Route
                  path="/*"
                  element={<ProtectedRoute element={DefaultLayout} />}
                />
              </Routes>
              <Toaster />
              {maintenance.active && (
                <GlobalMaintenanceModal message={maintenance.message} estimatedDowntime={maintenance.estimatedDowntime} />
              )}
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </UserActivityProvider>
    </Router>
  );
};

export default App;
