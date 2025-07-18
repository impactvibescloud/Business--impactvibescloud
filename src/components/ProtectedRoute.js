// import React, { useEffect, useState, } from "react";
// import { useNavigate } from "react-router-dom";
// const ProtectedRoute = (props) => {
//     let Cmp = props;
//     const history = useNavigate();
//     useEffect(() => {
//         if (!localStorage.getItem('authToken'))
//             history('/')
//     }, [])
//     return (
//         <>
//             <Cmp />
//             {/* {...props} */}
//         </>
//     )
// }

// export default ProtectedRoute

// import React, { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// const ProtectedRoute = ({ element: Element }) => {
//     const navigate = useNavigate();

//     useEffect(() => {
//         if (!localStorage.getItem('authToken')) {
//             navigate('/');
//         }
//     }, [navigate]);

//     return <Element />;
// }

// export default ProtectedRoute;

/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

const isTokenExpired = (token) => {
  try {
    const decodedToken = jwtDecode(token)
    const currentTime = Date.now() / 1000
    // Add 5 minute buffer to account for clock skew
    return decodedToken.exp < (currentTime + 300)
  } catch (error) {
    console.error('Error decoding token:', error)
    return true // If there's an error decoding the token, consider it expired
  }
}

const ProtectedRoute = ({ element: Element }) => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        console.log('🚪 No token found - redirecting to login')
        navigate('/')
        return
      }
      
      if (isTokenExpired(token)) {
        console.log('⏰ Token expired - redirecting to login')
        localStorage.removeItem('authToken')
        navigate('/')
        return
      }
    }

    // Check token immediately
    checkToken()
    
    // Check token every 2 minutes instead of 1 minute (less aggressive)
    const intervalId = setInterval(checkToken, 2 * 60 * 1000)

    // Also check token when page becomes visible (user returns to tab)
    const visibilityChangeHandler = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible - checking token')
        checkToken()
      }
    }
    
    document.addEventListener('visibilitychange', visibilityChangeHandler)

    // Clear interval and event listener on component unmount
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
    }
  }, [navigate])

  return <Element />
}

export default ProtectedRoute