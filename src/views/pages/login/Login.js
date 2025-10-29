import React, { useEffect } from "react";
// Add modern form styles using useEffect to inject CSS only once
const MODERN_LOGIN_CSS = [
  '.modern-login-card, .modern-login-form, .modern-login-card h2, .modern-login-card p, .modern-login-form label, .modern-login-form input, .modern-login-form .form-floating {',
  '  text-align: left !important;',
  '}',
  '.modern-login-form .form-floating {',
  '  position: relative;',
  '}',
  '.modern-login-form .form-floating > label {',
  '  display: flex;',
  '  align-items: center;',
  '  position: absolute;',
  '  left: 16px;',
  '  top: 50%;',
  '  transform: translateY(-50%);',
  '  height: 100%;',
  '  color: #64748b;',
  '  font-size: 16px;',
  '  font-weight: 500;',
  '  pointer-events: none;',
  '  background: transparent;',
  '  z-index: 2;',
  '  transition: all 0.2s;',
  '  padding: 0;',
  '}',
  '.modern-login-form .form-floating > .form-control:focus ~ label,',
  '.modern-login-form .form-floating > .form-control:not(:placeholder-shown) ~ label {',
  '  top: 2px;',
  '  left: 12px;',
  '  background: #f4f8fb;',
  '  color: #2563eb;',
  '  font-size: 13px;',
  '  height: auto;',
  '  padding: 0 0.25rem;',
  '  transform: none;',
  '}',
  '.modern-login-form .form-floating .input-icon {',
  '  position: absolute;',
  '  left: 16px;',
  '  top: 50%;',
  '  transform: translateY(-50%);',
  '  font-size: 20px;',
  '  opacity: 0.7;',
  '  pointer-events: none;',
  '}',
  '.modern-login-form .form-floating > .form-control {',
  '  background: #f4f8fb;',
  '  border: 1.5px solid #d1d5db;',
  '  border-radius: 16px;',
  '  font-size: 17px;',
  '  padding: 1.25rem 1.25rem 0.5rem 3rem;',
  '  box-shadow: 0 2px 12px 0 rgba(59,130,246,0.07);',
  '  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;',
  '}',
  '.modern-login-form .form-floating > .form-control:focus {',
  '  border-color: #38bdf8;',
  '  box-shadow: 0 0 0 3px rgba(59,130,246,0.18);',
  '  background: #e0f2fe;',
  '}',
  '.modern-login-btn {',
  '  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);',
  '  border: none;',
  '  color: #fff;',
  '  transition: background 0.2s, box-shadow 0.2s;',
  '}',
  '.modern-login-btn:active, .modern-login-btn:focus {',
  '  background: linear-gradient(90deg, #2563eb 0%, #0891b2 100%);',
  '  box-shadow: 0 2px 8px 0 rgba(59,130,246,0.15);',
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
  const [validForm, setValidForm] = useState(false);
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

  //cheking email and password
  useEffect(() => {
    if (validateForm()) {
      setValidForm(true);
    } else {
      setValidForm(false);
    }
  }, [errors]);
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
    if (!(auth.email && auth.password)) {
      return swal("Error!", "All fields are required", "error");
    }
    setLoading({ loading: true });
    try {
      const res = await axios.post("/api/v1/user/login/", auth);
      console.log(res);
      if (res.data.success == true) {
        localStorage.setItem("authToken", res.data.token);

        let response = await axios.get(`/api/v1/user/details`, {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });
        // console.log(response.data)
        const data = res.data;
        if (data.user.role === "business_admin" || data.user.role === "Employee") {
          history("/dashboard");
          setLoading(false);
          window.location.reload();
        } else {
          swal("Error!", "please try with admin credential!!", "error");
          setLoading(false);
        }
      } else {
        setLoading(false);

        swal("Error!", "Invalid Credentials", "error");
      }
    } catch (error) {
      setLoading(false);

      swal("Error!", "Invalid Credentials", "error");
    }
  };

  return (
    <div className="login-modern-bg min-vh-100 vw-100 d-flex flex-row" style={{ background: '#f8fafc', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left Side: Brand */}
  <div
    className="login-modern-left d-flex flex-column justify-content-center align-items-center"
    style={{
  background: "linear-gradient(135deg, #f0fdf4 0%, #6ee7b7 60%, #34d399 100%)",
      color: "#222",
      width: "50vw",
      minWidth: 350,
      padding: "0 5vw",
  backgroundImage: 'url(/image/grid-01.svg), linear-gradient(135deg, #f0fdf4 0%, #6ee7b7 60%, #34d399 100%)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      position: 'relative',
    }}
  >
        <div className="w-100" style={{ textAlign: 'left' }}>
          <img src="/favicon.ico" alt="Brand Logo" style={{ width: 80, height: 80, marginBottom: 32 }} />
          <h1 className="fw-bold mb-3" style={{ letterSpacing: 1, fontSize: 38 }}>Just Connect</h1>
          <p className="fs-4 mb-4" style={{ opacity: 0.97, fontWeight: 400 }}>
            Empowering Business Communication<br />
            <span style={{ fontSize: 18, opacity: 0.85 }}>Cloud Telephony for Modern Enterprises</span>
          </p>
        </div>
      </div>
      {/* Right Side: Login Form */}
  <div className="login-modern-right d-flex align-items-center justify-content-center" style={{ width: '50vw', minWidth: 350, background: '#fff', padding: '0 5vw' }}>
        <div className="w-100" style={{ maxWidth: 420, margin: '0 auto', padding: '3.5rem 0' }}>
          <h2 className="mb-2 fw-semibold" style={{ color: '#222', fontSize: 30, textAlign: 'left' }}>Business Sign In</h2>
          <p className="mb-4" style={{ color: '#6b7280', fontSize: 17, textAlign: 'left' }}>Business Owners & Employees Only</p>
          <CForm className="modern-login-form">
            <div className="mb-4">
              <label htmlFor="email" style={{ fontWeight: 500, color: '#222', marginBottom: 6, display: 'block' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, opacity: 0.7 }}>
                  <CIcon icon={cilUser} />
                </span>
                <input
                  type="email"
                  className="form-control modern-input"
                  id="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  value={auth.email}
                  name="email"
                  autoComplete="email"
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>
            {errors.emailError && (
              <p className="text-danger mb-3" style={{ fontSize: 15 }}>{errors.emailError}</p>
            )}
            <div className="mb-4">
              <label htmlFor="password" style={{ fontWeight: 500, color: '#222', marginBottom: 6, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, opacity: 0.7 }}>
                  <CIcon icon={cilLockLocked} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control modern-input"
                  id="password"
                  placeholder="Enter your password"
                  name="password"
                  value={auth.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#2563eb',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {errors.passwordError && (
              <p className="text-danger mb-3" style={{ fontSize: 15 }}>{errors.passwordError}</p>
            )}
            <div className="row mb-4 align-items-center">
              <div className="col-7 d-grid gap-2">
                <CButton
                  color="primary"
                  className="py-2 fw-semibold modern-login-btn"
                  style={{ fontSize: 18, borderRadius: 14, boxShadow: '0 4px 16px 0 rgba(59,130,246,0.10)' }}
                  disabled={!validForm}
                  onClick={Login}
                >
                  <ClipLoader loading={loading} size={18} />
                  {!loading && "Sign In"}
                </CButton>
              </div>
              <div className="col-5 text-end">
                <Link to="/forget-password" style={{ fontSize: 15, textDecoration: 'none', color: '#2563eb', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
            </div>
            {/* <div className="d-flex justify-content-between align-items-center mb-2">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <CButton color="secondary" variant="outline" className="fw-semibold px-3 py-1" style={{ borderRadius: 10, fontSize: 16 }}>
                  Cancel
                </CButton>
              </Link>
              <Link to="/forget-password" style={{ fontSize: 15 }}>Forgot password?</Link>
            </div> */}
          </CForm>
          {/* <div className="text-center mt-3">
            <Link to="/newRegister" style={{ fontSize: 16 }}>Don't have an account? <span className="fw-bold">Sign Up</span></Link>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;

// < Route path = "/" name = "Home" render = {(props) => (
//   userdata && userdata.role === 'admin' ? <DefaultLayout {...props} /> :
//     <><Login {...props} /></>
// )} />
