import React from 'react'
import { CForm, CCol, CFormLabel, CContainer, CRow, CCardGroup, CCard, CCardBody, CFormInput, CFormSelect, CFormCheck, CButton } from '@coreui/react'
import { Country, City } from 'country-state-city'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
const NewRegister = () => {
    const [cities, setCities] = useState([])
    const [ownerDetails, setOwnerDetails] = useState({
        cafeName: '',
        email: '',
        password: '',
        location: '',
        country: 'India',
        city: ''
    })
    const history = useNavigate()
    const [processing, setProcessing] = useState(false)
    const countries = Country.getAllCountries()
    useEffect(() => {
        // console.log(countries);
        const countryCode = countries.find(item => item.name === ownerDetails.country)
        // console.log(countryCode);
        setCities(() => City.getCitiesOfCountry(countryCode?.isoCode))
        // console.log(cities);
    }, [ownerDetails.country])


    const handleChange = (event) => {
        const { name, value } = event.target;
        setOwnerDetails({ ...ownerDetails, [name]: value });
    };


    async function handleSubmit() {

        let res = await axios.post(`/owner/signup`, ownerDetails, {
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`,
            }
        })
        setProcessing(true)
        console.log(res.data);

        if (res) {
            // localStorage.setItem("auth", JSON.stringify({

            //     token: res.data.token,
            // }));
            history('/')
        }
    }

    return (
        <div >
            <CContainer >
                <CRow className="justify-content-center mt-3">

                    <CCol md={8} className='mt-5'>
                        <CCardGroup>
                            <CCard className="p-4">

                                <CCardBody>
                                    <h1 >Sign Up!!!</h1>
                                    <CForm className="row g-3">
                                        <CCol xs={12}>
                                            <CFormLabel htmlFor="inputAddress">Cafe Name</CFormLabel>
                                            <CFormInput id="inputAddress" placeholder="" name='cafeName' value={ownerDetails.cafeName} onChange={handleChange} />
                                        </CCol>

                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputEmail4">Email</CFormLabel>
                                            <CFormInput type="email" id="inputEmail4" name='email' value={ownerDetails.email} onChange={handleChange} />
                                        </CCol>
                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputPassword4">Password</CFormLabel>
                                            <CFormInput type="password" id="inputPassword4" name='password' value={ownerDetails.password} onChange={handleChange} />
                                        </CCol>


                                        <CCol md={12}>
                                            <CFormLabel htmlFor="inputCity">Location</CFormLabel>
                                            <CFormInput id="inputCity" name='location' value={ownerDetails.location} onChange={handleChange} />
                                        </CCol>
                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputState">Country</CFormLabel>
                                            <CFormSelect id="inputState" name='country' onChange={handleChange}>
                                                <option>Select a country</option>
                                                {countries.map(item => <option value={item.name}>{item.name}</option>)}

                                            </CFormSelect>
                                        </CCol>
                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputState">City</CFormLabel>
                                            <CFormSelect id="inputState" name='city' onChange={handleChange}>
                                                <option>Select a city</option>
                                                {cities.map(item => <option value={item.name}>{item.name}</option>)}

                                            </CFormSelect>
                                        </CCol>
                                        {/* <CCol md={2}>
                                            <CFormLabel htmlFor="inputZip">Zip</CFormLabel>
                                            <CFormInput id="inputZip" />
                                        </CCol> */}
                                        {/* <CCol xs={12}>
                                            <CFormCheck type="checkbox" id="gridCheck" label="Check me out" />
                                        </CCol> */}
                                        <CCol xs={12}>
                                            <CButton onClick={handleSubmit} color='dark'>Sign Up</CButton>
                                        </CCol>
                                    </CForm>
                                </CCardBody>
                            </CCard>
                        </CCardGroup>
                    </CCol>
                </CRow>
            </CContainer>
        </div>
    )
}

export default NewRegister