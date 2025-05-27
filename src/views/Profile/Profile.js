import React, { useEffect } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CForm,
    CFormInput,
    CFormLabel,
    CFormSelect,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
} from '@coreui/react'
import { useState } from 'react'
import axios from 'axios';
import { isAutheticated } from 'src/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    // const user = JSON.parse(localStorage.getItem('auth')).user
    const [user, setUser] = useState({});
    const { token } = isAutheticated();
    const history = useNavigate()
    // console.log(token);
    useEffect(async () => {
        let res = await axios.get('/owner', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (res) {
            // console.log(res.data.user._id)
            localStorage.setItem('ownerId', res.data.user._id)
            setUser(res.data.user)
        }
        // console.log(res);
    }, [])


    // console.log(user);
    return (
        <div>
            <CRow>
                <CCol>
                    <h1>Profile</h1>
                </CCol>
                <CCol>
                    <CButton color='dark'
                        className="float-right" onClick={() => history('/edit')}>Edit Profile</CButton>
                </CCol>
            </CRow>
            <CCard className="p-4">
                <CCardBody>
                    {/* <h1 >Edit Profile</h1> */}
                    <CForm className="row g-3">
                        <CCol xs={12}>
                            <CFormLabel htmlFor="inputAddress">Cafe Name</CFormLabel>
                            <CFormInput id="inputAddress" placeholder="" name='cafeName' value={"jsw"} />
                        </CCol>

                        <CCol md={6}>
                            <CFormLabel htmlFor="inputEmail4">Email</CFormLabel>
                            <CFormInput type="email" id="inputEmail4" name='email' value={"habhs"} />
                        </CCol>
                        {/* <CCol md={6}>
                                            <CFormLabel htmlFor="inputPassword4">Password</CFormLabel>
                                            <CFormInput type="password" id="inputPassword4" name='password' value={ownerDetails.password} onChange={handleChange} />
                                        </CCol> */}


                        <CCol md={12}>
                            <CFormLabel htmlFor="inputCity">Location</CFormLabel>
                            <CFormInput id="inputCity" name='location' value={"ajnsj"} />
                        </CCol>
                        <CCol md={12}>
                            <CFormLabel htmlFor="inputCity">image</CFormLabel>
                            <CFormInput
                                type="file"
                                placeholder="image"
                                accept="image/*"
                                required
                            // onChange={handleImage}


                            />
                        </CCol>
                        {/* <CCol md={6}>
                            <CFormLabel htmlFor="inputState">Country</CFormLabel>
                            <CFormSelect id="inputState" name='country' >
                                <option>Select a country</option>
                                {countries.map(item => <option value={item.name}>{item.name}</option>)}

                            </CFormSelect>
                        </CCol> */}
                        {/* <CCol md={6}>
                            <CFormLabel htmlFor="inputState">City</CFormLabel>
                            <CFormSelect id="inputState" name='city' >
                                <option>Select a city</option>
                                {cities.map(item => <option value={item.name}>{item.name}</option>)}

                            </CFormSelect>
                        </CCol> */}

                        {/* <CCol xs={12}>
                            <CButton onClick={handleSubmit} color='dark'>Submit</CButton>
                        </CCol> */}
                    </CForm>
                </CCardBody>
            </CCard>
        </div >
    )
}

export default Profile
