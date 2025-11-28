import React, { Suspense, useEffect, useState } from "react";
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { isAutheticated } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
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

  // Initialize timeout prevention systems
  useEffect(() => {
    console.log('🚀 Initializing timeout prevention systems...')
    
    // Setup axios interceptors for better error handling and session management
    setupAxiosInterceptors()
    
    // Setup fetch interceptor for any remaining direct fetch calls
    setupFetchInterceptor()
    
    // Store session start time for reference
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString())
    }
    
    console.log('✅ Basic interceptors initialized')
  }, [])

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
          <Suspense
            fallback={
              <div className="pt-3 text-center">
                <div className="sk-spinner sk-spinner-pulse"></div>
              </div>
            }
          >
        <Routes>
          {/* <Route exact path="/change-password" name="My profile" element={<ChangePassword />} /> */}
          <Route exact path="/" name="Login Page" element={<Login />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />
          <Route
            exact
            path="/forget-password"
            name="Page 500"
            element={<ForgotPassword />}
          />

          <Route
            path="/*"
            element={<ProtectedRoute element={DefaultLayout} />}
          />
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
        <Toaster />
      </Suspense>
        </AuthProvider>
      </UserActivityProvider>
  </Router>
  );
};

export default App;
