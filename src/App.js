// import React, { Component, Suspense } from "react";
// import axios from "axios";
// import { Router, Route, Routes, HashRouter } from "react-router-dom";
// import { useState, useEffect } from "react";
// import { Toaster } from "react-hot-toast";
// import "./scss/style.scss";
// import ForgotPassword from "./views/pages/register/ForgotPassword";
// import NewRegister from "./views/pages/register/NewRegister";
// import ProtectedRoute from './components/ProtectedRoute';
// import { isAutheticated } from "./auth";
// import InternetConnectionPopUp from "./views/InternetConnectionPopUp";

// const loading = (
//   <div className="pt-3 text-center">
//     <div className="sk-spinner sk-spinner-pulse"></div>
//   </div>
// );
// // import EditProducts from './views/Commerce/Editproducts'
// // Containers
// const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));

// // Pages
// const Login = React.lazy(() => import("./views/pages/login/Login"));
// const Register = React.lazy(() =>
//   import("./views/pages/register/Change_password")
// );
// const Page404 = React.lazy(() =>
//   import("./views/pages/register/page404/Page404")
// );
// const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));

// const App = () => {
//   const [userdata, setUserData] = useState(null);
//   const token = isAutheticated();

//   useEffect(() => {
//     const getUser = async () => {
//       let existanceData = localStorage.getItem("authToken");
//       if (!existanceData) {
//         // console.log(existanceData.userData)
//         setUserData(false);
//       } else {
//         try {
//           // console.log('requesting user data from server')
//           let response = await axios.get(`/api/v1/user/details`, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           });
//           // console.log("jjjjjjjj", response.data);
//           const data = response?.data;
//           if (
//             data?.success &&
//             (data?.user?.role === "admin" || data?.user?.role === "Employee")
//           ) {
//             setUserData(data?.user);
//           } else {
//             setUserData(false);
//           }
//         } catch (err) {
//           setUserData(false);
//           console.log(err);
//         }
//       }
//     };
//     getUser();
//   }, []);
//   return (
//     <HashRouter>
//       <Suspense fallback={loading}>
//         <Routes>
//           <Route exact path="/" name="Login Page" element={<Login />} />
//           <Route
//             exact
//             path="/register"
//             name="Register Page"
//             element={<NewRegister />}
//           />
//           <Route
//             exact
//             path="/password/forgot"
//             name="Forgot Page"
//             element={<ForgotPassword />}
//           />
//           <Route exact path="/404" name="Page 404" element={<Page404 />} />
//           <Route exact path="/500" name="Page 500" element={<Page500 />} />

//           <Route
//             path="/"
//             name="Home"
//             element={<ProtectedRoute
//             element={
//               userdata &&
//               (userdata.role === "admin" || userdata.role === "Employee") ? (
//                 <DefaultLayout />
//               ) : userdata === false ? (
//                 <Login />
//               ) : (
//                 <div></div>
//               )
//             }/>}
//           />

//           <Route path="*" name="Home" element={<ProtectedRoute element={<DefaultLayout />} />}/>
//         </Routes>
//         <Toaster />
//       </Suspense>
//       <InternetConnectionPopUp />
//     </HashRouter>
//   );
// };
// export default App;

// import React, { Suspense, useEffect, useState } from "react";
// import axios from "axios";
// import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast";
// import "./scss/style.scss";
// import ForgotPassword from "./views/pages/register/ForgotPassword";
// import NewRegister from "./views/pages/register/NewRegister";
// import ProtectedRoute from './components/ProtectedRoute';
// import { isAutheticated } from "./auth";
// import InternetConnectionPopUp from "./views/InternetConnectionPopUp";

// const loading = (
//     <div className="pt-3 text-center">
//         <div className="sk-spinner sk-spinner-pulse"></div>
//     </div>
// );

// const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
// const Login = React.lazy(() => import("./views/pages/login/Login"));
// const Page404 = React.lazy(() => import("./views/pages/register/page404/Page404"));
// const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));

// const App = () => {
//     const [userdata, setUserData] = useState(null);
//     const token = isAutheticated();

//     useEffect(() => {
//         const getUser = async () => {
//             let existanceData = localStorage.getItem("authToken");
//             if (!existanceData) {
//                 setUserData(false);
//             } else {
//                 try {
//                     let response = await axios.get(`/api/v1/user/details`, {
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                         },
//                     });
//                     const data = response?.data;
//                     if (data?.success && (data?.user?.role === "admin" || data?.user?.role === "Employee")) {
//                         setUserData(data?.user);
//                     } else {
//                         setUserData(false);
//                     }
//                 } catch (err) {
//                     setUserData(false);
//                     console.log(err);
//                 }
//             }
//         };
//         getUser();
//     }, [token]);

//     return (
//         <HashRouter>
//             <Suspense fallback={loading}>
//                 <Routes>
//                     <Route path="/" element={<Login />} />
//                     <Route path="/register" element={<NewRegister />} />
//                     <Route path="/password/forgot" element={<ForgotPassword />} />
//                     <Route path="/404" element={<Page404 />} />
//                     <Route path="/500" element={<Page500 />} />

//                     <Route
//                         path="/*"
//                         element={<ProtectedRoute element={DefaultLayout} />}
//                     />

//                     {/* Redirect all other routes to 404 */}
//                     <Route path="*" element={<Navigate to="/404" />} />
//                 </Routes>
//                 <Toaster />
//             </Suspense>
//             <InternetConnectionPopUp />
//         </HashRouter>
//     );
// };

// export default App;

import React, { Suspense, useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { isAutheticated } from "./auth";
import "./scss/style.scss";
import ProtectedRoute from "./components/ProtectedRoute";
import axios from "axios";
import ForgotPassword from "./views/pages/register/ForgotPassword";

// Import timeout prevention utilities
import setupAxiosInterceptors from "./utils/axiosInterceptors";
import { setupFetchInterceptor } from "./utils/fetchInterceptor";

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
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
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
    </HashRouter>
  );
};

export default App;
