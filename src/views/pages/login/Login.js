import React, { useEffect, useRef, useState } from 'react';
import './ModernLogin.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import ClipLoader from "react-spinners/ClipLoader";
import axios from "axios";
import swal from "sweetalert";
import { debugWarn } from "../../../utils/logger";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    emailError: "",
    passwordError: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const validEmailRegex = RegExp(
    /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  );
  const validPasswordRegex = RegExp(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{7,}$/
  );
  const history = useNavigate();
  const location = useLocation();
  // If the user was redirected here from a protected route, ProtectedRoute
  // attaches the original location in `state.from`. Sending them back there
  // after login restores the flow they intended.
  const redirectTo = location.state?.from?.pathname || '/dashboard';
  const submitGuardRef = useRef(false);
  // AbortController for the in-flight login request — lets us cancel on
  // unmount and prevents a stale response from updating state.
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Sync DOM values into React state on mount (handles browser autofill that doesn't trigger React events)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        const e = document.getElementById('email');
        const p = document.getElementById('password');
        const emailVal = e && e.value ? e.value : '';
        const passwordVal = p && p.value ? p.value : '';
        if ((emailVal && emailVal.length > 0) || (passwordVal && passwordVal.length > 0)) {
          setAuth((prev) => {
            if (prev.email !== emailVal || prev.password !== passwordVal) {
              return { ...prev, email: emailVal, password: passwordVal };
            }
            return prev;
          });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);
  // Use the public logos sidebar icon from the `public/logos` folder (case-sensitive on Linux)
  const adminLogo = process.env.PUBLIC_URL + "/logos/sidebarlogo.ico";
  const publicLogoPath = process.env.PUBLIC_URL + "/logos/sidebarlogo.ico";

  const validateForm = () => {
    let valid = true;
    Object.values(errors).forEach((val) => {
      if (val.length > 0) {
        valid = false;
        return false;
      }
    });
    Object.values(auth).forEach((val) => {
      if (val.length <= 0) {
        valid = false;
        return false;
      }
    });
    return valid;
  };

  // derive validity from current state or DOM (handles browser autofill)
  const isValid = (() => {
    let emailVal = auth.email || "";
    let passwordVal = auth.password || "";
    if (typeof document !== 'undefined') {
      const e = document.getElementById('email');
      const p = document.getElementById('password');
      if (e && e.value && e.value.length > 0) emailVal = e.value;
      if (p && p.value && p.value.length > 0) passwordVal = p.value;
    }
    return validEmailRegex.test(emailVal) && validPasswordRegex.test(passwordVal);
  })();
  const handleChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case "email":
        setErrors({
          ...errors,
          emailError: validEmailRegex.test(value) ? "" : "Email is not valid!",
        });

        break;
      case "password":
        setErrors((errors) => ({
          ...errors,
          passwordError: validPasswordRegex.test(value)
            ? ""
            : "Password Shoud Be 8 Characters Long, Atleast One Uppercase, Atleast One Lowercase,Atleast One Digit, Atleast One Special Character",
        }));
        break;
      default:
        break;
    }

    setAuth({ ...auth, [name]: value });
  };

  const Login = async () => {
    // Re-entrancy guard: if a submission is already in flight, drop this one.
    if (submitGuardRef.current) return;

    // Read current DOM values first (covers autofill) then fall back to state.
    let emailVal = auth.email || "";
    let passwordVal = auth.password || "";
    if (typeof document !== 'undefined') {
      const e = document.getElementById('email');
      const p = document.getElementById('password');
      if (e && e.value && e.value.length > 0) emailVal = e.value;
      if (p && p.value && p.value.length > 0) passwordVal = p.value;
    }
    if (!(emailVal && passwordVal)) {
      return swal("Error!", "All fields are required", "error");
    }

    // Set loading state BEFORE awaiting so the spinner / disabled state
    // takes effect on the very next render, not after the round-trip.
    submitGuardRef.current = true;
    setLoading(true);

    // Cancel any prior in-flight login request.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await axios.post(
        "/api/v1/user/login/",
        { email: emailVal, password: passwordVal },
        { signal: controller.signal },
      );
      if (res?.data?.success === true && res?.data?.token) {
        try {
          localStorage.setItem("authToken", res.data.token);
        } catch (e) {
          // Storage may be disabled (private mode / quota exceeded). Surface
          // a real error instead of pretending the login worked.
          debugWarn('localStorage.setItem failed:', e);
          swal("Error!", "Browser storage is unavailable. Please enable cookies/storage and try again.", "error");
          return;
        }

        const response = await axios.get(`/api/v1/user/details`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
          signal: controller.signal,
        });
        const businessId =
          response?.data?.user?.businessId || response?.data?.businessId;
        if (businessId) {
          try {
            localStorage.setItem('businessId', businessId);
          } catch (e) {
            debugWarn('localStorage.setItem(businessId) failed:', e);
          }
        }

        const role = res?.data?.user?.role;
        if (role === "business_admin" || role === "Employee") {
          // Single navigation — no reload(). The auth state is in localStorage
          // and the protected route reads it on next render, so reloading
          // only adds a flicker and wipes any in-memory app state.
          history(redirectTo, { replace: true });
        } else {
          swal("Error!", "please try with admin credential!!", "error");
        }
      } else {
        swal("Error!", res?.data?.message || "Invalid Credentials", "error");
      }
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        // Component unmounted or a new submission superseded this one. Don't
        // show an error toast — that would be misleading.
        return;
      }
      // Surface the real server message (suspended tenant, role mismatch,
      // rate limit, 503 cold-start). The previous always-generic
      // "Invalid Credentials" toast hid these and made server hiccups look
      // like password failures, which is the "first attempt fails" symptom
      // users were seeing.
      const msg =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK' ? 'Network error — please try again' : 'Invalid Credentials');
      swal("Error!", msg, "error");
    } finally {
      // Only clear flags if this controller is still the active one;
      // otherwise a superseding call has already taken over.
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
        submitGuardRef.current = false;
      }
    }
  };

  return (
    <div className="login-modern-container">
      {/* Left Panel - Advertisement Area (Empty/Ready for Images) */}
      <div className="login-advertise-panel">
        <div className="login-advertise-content">
          {/* Advertisement images can be placed here */}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-card-wrapper">
        <div className="login-card-content">
          {/* Brand Section - Logo with Title and Subtitle */}
          <div className="login-brand-section">
            <img
              src={adminLogo ? adminLogo : publicLogoPath}
              alt="JustConnect"
              className="brand-logo"
            />
            <div className="login-brand-text">
              <div className="brand-title">
                <span className="title-just">just</span>
                <span className="title-connect">Connect</span>
              </div>
              <div className="brand-subtitle">Enterprise Conversations Simplified</div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="login-form-section">
            <form className="login-form">
              {/* Email Field */}
              <div className="login-form-group">
                <label htmlFor="email">Email</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <CIcon icon={cilUser} />
                  </div>
                  <input
                    type="email"
                    className="login-modern-input"
                    id="email"
                    placeholder="jane.doe@gmail.com"
                    onChange={handleChange}
                    value={auth.email}
                    name="email"
                    autoComplete="email"
                  />
                </div>
                {errors.emailError && (
                  <span className="login-error-message">{errors.emailError}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="login-form-group">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <CIcon icon={cilLockLocked} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-modern-input"
                    id="password"
                    placeholder="Enter your password"
                    name="password"
                    value={auth.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2.25 12C3.75 7.5 7.5 4 12 4s8.25 3.5 9.75 8c-1.5 4.5-5.25 8-9.75 8S3.75 16.5 2.25 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 9.5a3 3 0 11-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2.25 12C3.75 7.5 7.5 4 12 4s8.25 3.5 9.75 8c-1.5 4.5-5.25 8-9.75 8S3.75 16.5 2.25 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.passwordError && (
                  <span className="login-error-message">{errors.passwordError}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="login-actions">
                <button
                  type="button"
                  className="login-submit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    if (loading || submitGuardRef.current) return;
                    if (!isValid) {
                      swal("Error!", "Please enter valid credentials", "error");
                      return;
                    }
                    // Login() owns submitGuardRef now — handlers must not pre-set it,
                    // otherwise the re-entrancy check inside Login() would early-return.
                    Login();
                  }}
                  disabled={loading}
                >
                  {loading && <ClipLoader loading={loading} size={16} color="#ffffff" />}
                  {!loading && 'Sign In'}
                </button>
              </div>

              {/* Footer Links */}
              <div className="login-footer-section">
                <span></span>
                <Link to="/forget-password" className="login-forgot-password-link">
                  Forgot password?
                </Link>
              </div>

              {/* Copyright */}
              <div className="login-copyright">©2026 justConnect. All rights reserved.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
