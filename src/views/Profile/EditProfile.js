import React from 'react'
import { CForm, CCol, CFormLabel, CContainer, CRow, CCardGroup, CCard, CCardBody, CFormInput, CButton } from '@coreui/react'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAutheticated } from 'src/auth'

const EditProfile = () => {

    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(false)
    const [imagesPreview, setImagesPreview] = useState();
    const token = isAutheticated()

    const [ownerDetails, setOwnerDetails] = useState({
        name: '',
        email: '',
        phone: ''

    })
    const history = useNavigate()



    const getData = async () => {
        let res = await axios.get(`/api/v1/user/details`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        if (res.data.success) {

            setOwnerDetails({ ...res.data.user })

            if (res.data.user.avatar) {
                setImagesPreview(res.data.user.avatar.url)
            }
        }



    }
    const handleChange = (event) => {
        const { name, value } = event.target;
        setOwnerDetails({ ...ownerDetails, [name]: value });
    };

    const handleImage = (e) => {
        const files = e.target.files[0];

        // console.log(files)
        setImage(files);
        // only for file preview------------------------------------
        const Reader = new FileReader();
        Reader.readAsDataURL(files);

        Reader.onload = () => {
            if (Reader.readyState === 2) {
                setImagesPreview(Reader.result);
            }
        };


        // -----------------------------------------------------------------------------
    };
    async function handleSubmit() {
        if (ownerDetails.name === '' || ownerDetails.email === '' || ownerDetails.phone === '') {
            swal({
                title: 'Warning',
                text: 'Fill all mandatory fields',
                icon: 'error',
                button: 'Close',
                dangerMode: true,
            })
            return
        }
        const formData = new FormData()
        formData.append('name', ownerDetails.name)
        formData.append('email', ownerDetails.email)
        formData.append('phone', ownerDetails.phone)
        formData.append('avatar', image)
        setLoading(true)
        try {
            const res = await axios
                .put(`/api/v1/user/update/profile`, formData, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/formdata',
                    },
                })
            if (res.data.success === true) {

                setLoading(false)
                swal({
                    title: 'Edited',
                    text: 'Profile Edited Successfully!',
                    icon: 'success',
                    button: 'Return',
                })
                history(-1)

            }
        } catch (error) {
            const message = error?.response?.data?.message || 'Something went wrong!'
            setLoading(false)
            swal({
                title: 'Warning',
                text: message,
                icon: 'error',
                button: 'Retry',
                dangerMode: true,
            })
        }
    }
    const handleCancle = () => {
       Navigate("/dashboard");
    }
    useEffect(() => {

        getData()

    }, [])

    return (
        <div >
            <CContainer >
                <CRow className="justify-content-center mt-3">

                    <CCol md={8} className='mt-5'>
                        <CCardGroup>
                            <CCard className="p-4">
                                <h2 >Edit Profile</h2>
                                <CCardBody>

                                    <CForm className="row g-3">
                                        <CCol xs={12}>
                                            <CFormLabel htmlFor="inputAddress">Name *</CFormLabel>
                                            <CFormInput id="inputAddress" placeholder="" name='name' value={ownerDetails.name} onChange={handleChange} />
                                        </CCol>

                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputEmail4">Email *</CFormLabel>
                                            <CFormInput type="email" id="inputEmail4" name='email' value={ownerDetails.email} onChange={handleChange} />
                                        </CCol>
                                        <CCol md={6}>
                                            <CFormLabel htmlFor="inputPassword4">Phone *</CFormLabel>
                                            <CFormInput type="number" id="inputPassword4" minLength={8} name='phone' value={ownerDetails.phone} onChange={handleChange} />
                                        </CCol>



                                        {/* <CFormInput
                                            type="file"
                                            placeholder="image"
                                            accept="image/*"
                                            required
                                            onChange={handleImage}


                                        />
                                        <div id="createProductFormImage" className="w-50 d-flex">

                                            {imagesPreview && <img className=" w-50 p-1 " src={imagesPreview} alt="Product Preview" />}

                                        </div> */}
                                        <CCol xs={12}>
                                            <CButton onClick={handleSubmit} color='primary'>{loading ? 'Loading...' : 'Submit'}</CButton>
                                            <CButton className='ml-2' onClick={handleCancle} color='warning'>Cancel</CButton>

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

export default EditProfile