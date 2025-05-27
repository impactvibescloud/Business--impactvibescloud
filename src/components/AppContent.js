import React, { Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CContainer, CSpinner } from "@coreui/react";

// routes config
import routes from "../routes";
import { isAutheticated } from "src/auth";
import axios from "axios";
import toast from "react-hot-toast";
const AppContent = () => {
  const [userper, setuserper] = useState(null);
  const token = isAutheticated();

  useEffect(() => {
    const getUser = async () => {
      let existanceData = localStorage.getItem("authToken");
      if (!existanceData) {
        setuserper(null);
      } else {
        try {
          let response = await axios.get(`/api/v1/user/details`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = response?.data;
          if (data?.success){
            setuserper(data?.user);
          } else {
            setuserper(null);
          }
        } catch (err) {
          setuserper(null);
          console.log(err);
        }
      }
    };
    getUser();
  }, []);
  const [appRoutes, setAppRoutes] = useState(routes);
  return (
    <CContainer lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {appRoutes.map((route, idx) => {
            if (
              userper?.role === "business_admin" ||
              route.navName?.trim() === "" ||
              (userper?.accessTo && userper?.accessTo[route?.navName] === true)
            ) {
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
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  );
};

export default React.memo(AppContent);
