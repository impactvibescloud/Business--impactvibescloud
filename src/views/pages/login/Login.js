import React, { useEffect } from "react";
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
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm>
                    <h1>Impactvibescloud Business</h1>
                    <p className="text-medium-emphasis">
                      For Business Owners. Sign in to your account.
                    </p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        onChange={handleChange}
                        value={auth.email}
                        name="email"
                        autoComplete="email"
                      />
                    </CInputGroup>
                    {errors.emailError && (
                      <p className="text-center py-2 text-danger">
                        {errors.emailError}
                      </p>
                    )}
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        name="password"
                        value={auth.password}
                        onChange={handleChange}
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                    </CInputGroup>

                    {errors.passwordError && (
                      <p className="text-center py-2 text-danger">
                        {errors.passwordError}
                      </p>
                    )}
                    <CButton
                      color="primary"
                      className="px-4"
                      disabled={!validForm}
                      onClick={Login}
                    >
                      <ClipLoader loading={loading} size={18} />
                      {!loading && "Login"}
                    </CButton>

                    <Link to="/">
                      <CButton color="dark" className="px-4 ms-2">
                        Cancel
                      </CButton>
                    </Link>
                    <br />

                    {/* <CButton color="link" className="px-0">
                      <Link to="/forget-password">Forgot password.?</Link>
                    </CButton> */}
                  </CForm>
                </CCardBody>
                {/* <CButton color="" className="px-0">
                  <Link to="/newRegister">
                    dont have an account? Sign Up
                  </Link>
                </CButton> */}
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;

// < Route path = "/" name = "Home" render = {(props) => (
//   userdata && userdata.role === 'admin' ? <DefaultLayout {...props} /> :
//     <><Login {...props} /></>
// )} />
