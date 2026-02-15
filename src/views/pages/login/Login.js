import React, { useEffect, useRef } from "react";
// Add modern form styles using useEffect to inject CSS only once
const MODERN_LOGIN_CSS = [
  '/* Fullscreen soft background with subtle radial glow */',
  '.login-modern-bg {',
  '  min-height: 100vh;',
  '  width: 100vw;',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: center;',
  '  background: linear-gradient(180deg, #f6fbff 0%, #ffffff 60%);',
  '  position: relative;',
  '  overflow: hidden;',
  '}',
  '.login-modern-bg::before {',
  '  content: "";',
  '  position: absolute;',
  '  top: -20%;',
  '  left: 50%;',
  '  transform: translateX(-50%);',
  '  width: 1100px;',
  '  height: 1100px;',
  '  border-radius: 50%;',
  '  background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.12), transparent 20%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.06), transparent 30%);',
  '  filter: blur(40px);',
  '  pointer-events: none;',
  '}',
  '.modern-login-card {',
  '  display: none;',
  '}',
  '.login-content {',
  '  width: 420px;',
  '  max-width: calc(100% - 48px);',
  '  background: transparent;',
  '  border-radius: 8px;',
  '  padding: 0;',
  '  position: relative;',
  '  z-index: 2;',
  '}',
  '.login-content .brand {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 12px;',
  '  margin-bottom: 24px;',
  '  text-align: center;',
  '  justify-content: center;',
  '  flex-direction: row;',
  '}',
  '.login-content .brand img {',
  '  width: 96px;',
  '  height: 96px;',
  '  object-fit: contain;',
  '  flex-shrink: 0;',
  '}',
  '.login-content .brand-text {',
  '  display: flex;',
  '  flex-direction: column;',
  '  gap: 2px;',
  '  align-items: flex-start;',
  '}',
  '.login-content .brand-text .title {',
  '  display: flex;',
  '  gap: 0;',
  '  align-items: baseline;',
  '  justify-content: flex-start;',
  '  font-weight: 800;',
  '  font-size: 20px;',
  '}',
  '.login-content .brand-text .subtitle {',
  '  font-size: 13px;',
  '  color: #6b7280;',
  '  text-align: left;',
  '  font-weight: 700;',
  '}',
  '.login-content .modern-login-form {',
  '  margin-top: 6px;',
  '}',
  // sign-in header and subtitle removed per design
  '.modern-login-card h2 {',
  '  margin: 8px 0 0 0;',
  '  font-size: 26px;',
  '  font-weight: 700;',
  '  color: #111827;',
  '}',
  '.modern-login-card p.lead {',
  '  margin: 6px 0 18px 0;',
  '  color: #6b7280;',
  '}',
  '.modern-login-form label {',
  '  font-weight: 600;',
  '  color: #111827;',
  '  margin-bottom: 6px;',
  '}',
  '.modern-input {',
  '  background: #ffffff;',
  '  border: 1px solid rgba(15,23,42,0.06);',
  '  border-radius: 12px;',
  '  padding: 12px 12px 12px 40px;',
  '  font-size: 15px;',
  '  transition: box-shadow 0.15s, border-color 0.15s;',
  '  max-width: 100%;',
  '}',
  '.modern-input:focus {',
  '  outline: none;',
  '  box-shadow: 0 6px 18px rgba(37,99,235,0.08);',
  '  border-color: rgba(37,99,235,0.25);',
  '}',
  '.modern-login-btn {',
  '  background: linear-gradient(90deg, #f97316 0%, #fb923c 100%);',
  '  border: none;',
  '  color: #fff;',
  '  padding: 12px 18px;',
  '  border-radius: 12px;',
  '  font-size: 16px;',
  '  width: 100%;',
  '}',
  '.modern-login-footer {',
  '  position: fixed;',
  '  left: 50%;',
  '  bottom: 18px;',
  '  transform: translateX(-50%);',
  '  text-align: center;',
  '  color: rgba(17,24,39,0.55);',
  '  font-size: 13px;',
  '  z-index: 9999;',
  '  background: transparent;',
  '}',
  '.validation-error {',
  '  font-size: 12px;',
  '}',
].join('\n');

function useModernLoginCss() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.head.querySelector('style[data-modern-login]')) {
      const style = document.createElement('style');
      style.setAttribute('data-modern-login', 'true');
      style.innerHTML = MODERN_LOGIN_CSS;
      document.head.appendChild(style);
    }
  }, []);
}
import { Link, useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import swal from "sweetalert";

const Login = () => {
  useModernLoginCss();
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
  const submitGuardRef = useRef(false);
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
  const dark = typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('c-dark-theme');
  // const handleChange = (e) => (event) => {

  //   setAuth({ ...auth, [e]: event.target.value });
  // };
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
    // read current DOM values first (covers autofill) then fall back to state
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
    setLoading(true);
    submitGuardRef.current = true;
    try {
      const res = await axios.post("/api/v1/user/login/", { email: emailVal, password: passwordVal });
      console.log(res);
      if (res.data.success == true) {
        localStorage.setItem("authToken", res.data.token);

        let response = await axios.get(`/api/v1/user/details`, {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });
        const data = res.data;
        if (data.user.role === "business_admin" || data.user.role === "Employee") {
          history("/dashboard");
          window.location.reload();
          return;
        } else {
          swal("Error!", "please try with admin credential!!", "error");
          return;
        }
      } else {
        swal("Error!", "Invalid Credentials", "error");
        return;
      }
    } catch (error) {
      swal("Error!", "Invalid Credentials", "error");
      return;
    } finally {
      setLoading(false);
      submitGuardRef.current = false;
    }
  };

  return (
    <div className="login-modern-bg">
      <div className="login-content">
        <div className="brand">
          <img src={adminLogo ? adminLogo : publicLogoPath} alt="JustConnect" />
          <div className="brand-text">
            <div className="title">
              <div style={{ color: '#0760c7' }}>just</div>
              <div style={{ color: '#f97316' }}>Connect</div>
            </div>
            <div className="subtitle">Enterprise Conversations Simplified</div>
          </div>
        </div>
        {/* Sign-in header and subtitle removed */}

        <CForm className="modern-login-form">
          <div className="mb-3">
            <label htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.7 }}>
                <CIcon icon={cilUser} />
              </span>
              <input
                type="email"
                className="form-control modern-input"
                id="email"
                placeholder="jane.doe@gmail.com"
                onChange={handleChange}
                value={auth.email}
                name="email"
                autoComplete="email"
                style={{ paddingLeft: 44 }}
              />
            </div>
          </div>
            {errors.emailError && <p className="text-danger validation-error mb-2">{errors.emailError}</p>}

          <div className="mb-3">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.7 }}>
                <CIcon icon={cilLockLocked} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control modern-input"
                id="password"
                placeholder="Password"
                name="password"
                value={auth.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingLeft: 44, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, color: '#2563eb' }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M2.25 12C3.75 7.5 7.5 4 12 4s8.25 3.5 9.75 8c-1.5 4.5-5.25 8-9.75 8S3.75 16.5 2.25 12z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 9.5a3 3 0 11-4 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M2.25 12C3.75 7.5 7.5 4 12 4s8.25 3.5 9.75 8c-1.5 4.5-5.25 8-9.75 8S3.75 16.5 2.25 12z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {errors.passwordError && <p className="text-danger validation-error mb-2">{errors.passwordError}</p>}

          <div className="d-grid mb-3">
            <CButton
              type="button"
              className="modern-login-btn"
              onMouseUp={() => {
                if (loading) return;
                if (!isValid) {
                  swal("Error!", "Please enter valid credentials", "error");
                  return;
                }
                if (!submitGuardRef.current) {
                  submitGuardRef.current = true;
                  Login();
                }
              }}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                  return;
                }
                if (submitGuardRef.current) {
                  e.preventDefault();
                  return;
                }
                // fallback: ensure validation before submitting
                if (!isValid) {
                  e.preventDefault();
                  swal("Error!", "Please enter valid credentials", "error");
                  return;
                }
                Login();
              }}
            >
              <ClipLoader loading={loading} size={16} />
              {!loading && 'Sign In'}
            </CButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }} />
            <Link to="/forget-password" style={{ fontSize: 14, color: '#2563eb', textDecoration: 'none' }}>Forgot password?</Link>
          </div>

          <div className="modern-login-footer">©2026 justConnect. All rights reserved.</div>
        </CForm>
      </div>
    </div>
  );
};

export default Login;

// < Route path = "/" name = "Home" render = {(props) => (
//   userdata && userdata.role === 'admin' ? <DefaultLayout {...props} /> :
//     <><Login {...props} /></>
// )} />
