import React, { useState } from 'react'
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader";

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
import { cilEnvelopeLetter, cilEnvelopeOpen, cilLockLocked, cilUser } from '@coreui/icons'
import { Link, useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState()
    // console.log(email)
    const handleSubmit = async () => {
        if (email) {
            try {
                setLoading(true)

                const res = await axios.post(`/api/v1/user/password/forgot`, { email: email })
                // console.log(res);
                if (res.data.success === true) {
                    setLoading(false)
                    // alert("Email Send Successfully! please check your mail for reset password")
                    swal("success!", "Email Send Successfully! please check your Email for new password", "success");
                    navigate("/");

                }
            } catch (e) {
                swal('Error!', 'Wrong Email ID. Enter valid email to get the password', 'error')
                setLoading(false)


            }
        } else {
            alert("please fill Email field..")
            setLoading(false)
        }


    }
    return <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
            <CRow className="justify-content-center">
                <CCol md={9} lg={7} xl={6}>
                    <CCard className="mx-4">
                        <CCardBody className="p-4">
                            <CForm>
                                <h1>Forgot Password?</h1>
                                <p className="text-medium-emphasis"> Enter your email Below, we will send you password in your Email</p>
                                {/* <CInputGroup className="mb-3">
                <CInputGroupText>
                  <CIcon icon={cilUser} />
                </CInputGroupText>
                <CFormInput placeholder="Username" autoComplete="username" />
              </CInputGroup> */}

                                <CInputGroup className="mb-4">
                                    <CInputGroupText>
                                        <CIcon icon={cilEnvelopeOpen} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="email"
                                        placeholder="Email"
                                        autoComplete="email"
                                        // value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </CInputGroup>

                                <CButton color="primary" disabled={!email} onClick={() => handleSubmit()}>
                                    <ClipLoader loading={loading} size={18} />
                                    {!loading && "Send"}
                                </CButton>
                                <Link to='/'>
                                    <CButton color="secondary" className='ms-2'>Back to Login</CButton>
                                </Link>
                            </CForm>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </CContainer>
    </div>;
};

export default ForgotPassword;
