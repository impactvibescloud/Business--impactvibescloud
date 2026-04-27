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
    const getUser = async () => {
      let existanceData = localStorage.getItem("authToken");
      if (!existanceData) {
        setUserData(false);
      } else {
        try {
          let response = await axios.get(`/api/v1/user/details`, {
            headers: {
              Authorization: `Bearer ${token}`,
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
      }
    };
    getUser();
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
                <Route exact path="/" name="Login Page" element={<Login />} />
                <Route exact path="/404" name="Page 404" element={<Page404 />} />
                <Route exact path="/500" name="Page 500" element={<Page500 />} />
                <Route
                  exact
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
