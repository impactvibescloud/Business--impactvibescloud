import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import ClipLoader from "react-spinners/ClipLoader";
import axios from 'axios'
import { isAutheticated } from 'src/auth'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

const Register = () => {

  const [loading, setLoading] = useState(false);
  const history = useNavigate();
  const [user, setUser] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    confirmPasswordError: '',
    newPasswordError: '',
    oldPasswordError: '',

  })
  const validEmailRegex = RegExp(
    /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  )
  const validPasswordRegex = RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{7,}$/)
  const handleChange = (e) => {
    const { name, value } = e.target

    switch (name) {
      case 'oldPassword':
        setErrors({
          ...errors,
          oldPasswordError: validPasswordRegex.test(value)
            ? ''
            : 'Password Shoud Be 8 Characters Long, Atleast One Uppercase, Atleast One Lowercase,Atleast One Digit, Atleast One Special Character',
        })

        break
      case 'newPassword':
        setErrors({
          ...errors,
          newPasswordError: validPasswordRegex.test(value)
            ? ''
            : 'Password Shoud Be 8 Characters Long, Atleast One Uppercase, Atleast One Lowercase,Atleast One Digit, Atleast One Special Character',
        })

        break
      case 'confirmPassword':
        setErrors((errors) => ({
          ...errors,
          confirmPasswordError: validPasswordRegex.test(value)
            ? ''
            : 'Password Shoud Be 8 Characters Long, Atleast One Uppercase, Atleast One Lowercase,Atleast One Digit, Atleast One Special Character',
        }))
        break
      default:
        break
    }

    setUser({ ...user, [name]: value })
  }


  const handleSubmit = async () => {
    if (!(user.oldPassword && user.newPassword && user.confirmPassword)) {

      return swal('Error!', 'All fields are required', 'error')
    }
    if (!(user.newPassword.length >= 8)) {

      return swal('Error!', 'All fields are required', 'error');
    }
    const token = localStorage.getItem("authToken")
    setLoading({ loading: true })
    if (user.newPassword == user.confirmPassword) {
      let res = await axios.put('/api/v1/user/password/update',
        {
          ...user
        }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      // console.log(res.data.success)
      if (res.data.success == true) {
        Swal.fire({
          title: 'Done',
          text: 'Password Changed',
          icon: 'success',
          confirmButtonText: 'ok',
          confirmButtonColor: '#303c54',
          iconColor: '#303c54'
        }).then(() => {
          history('/dashboard')
        });

      }
      setLoading(false);
    } else {
      swal('Error!', 'New Password And Confirm Password is Not Match !', 'error')
      setLoading(false);
    }

  }

  return (
    <div className="bg-light min-vh-70 d-flex flex-row align-items-flex-start">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={15} lg={20} xl={16}>
            <CCard className="mx-4">
              <CCardBody className="p-1">
                <CForm>
                  <h2 className="mb-3">Change Password</h2>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput placeholder="Old Password" type="password" value={user.oldPassword}
                      onChange={handleChange}
                      autoComplete="current-password"
                      name="oldPassword" />
                  </CInputGroup>
                  {errors.oldPasswordError && (
                    <p className="text-center py-2 text-danger">{errors.oldPasswordError}</p>
                  )}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder=" New Password"

                      value={user.newPassword}
                      onChange={handleChange}
                      name="newPassword"

                    />
                  </CInputGroup>
                  {errors.newPasswordError && (
                    <p className="text-center py-2 text-danger">{errors.newPasswordError}</p>
                  )}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    {errors.passwordError && (
                      <p className="text-center py-2 text-danger">{errors.passwordError}</p>
                    )}
                    <CFormInput
                      type="password"

                      placeholder="Confirm password "
                      value={user.confirmPassword}
                      onChange={handleChange}
                      name="confirmPassword"
                    />
                  </CInputGroup>
                  {errors.confirmPasswordError && (
                    <p className="text-center py-2 text-danger">{errors.confirmPasswordError}</p>
                  )}
                  <div className="d-grid">
                    <CButton color="success" onClick={handleSubmit}>
                      <ClipLoader loading={loading} size={18} />
                      {!loading && "Submit"}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
