

import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { Link, useParams, useNavigate } from 'react-router-dom'

import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'


const AddBusiness = () => {
    const token = isAutheticated();
    const navigate = useNavigate()
    const [data, setData] = useState({
        business: '',


    })
    const [loading, setLoading] = useState(false)




    const handleChange = (e) => {

        setData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleSubmit = () => {
        if (data.business.trim() === '') {
            swal({
                title: 'Warning',
                text: 'Fill all mandatory fields',
                icon: 'error',
                button: 'Close',
                dangerMode: true,
            })
            return
        }
        setLoading(true)
        axios
            .post(`/api/business`, data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                swal({
                    title: 'Added',
                    text: 'business added successfully!',
                    icon: 'success',
                    button: 'Return',
                })
                setLoading(false)
                navigate('/business_type', { replace: true })
            })
            .catch((err) => {
                setLoading(false)

                swal({
                    title: 'Warning',
                    text: 'Something went wrong!',
                    icon: 'error',
                    button: 'Retry',
                    dangerMode: true
                })
            })
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div
                        className="
                    page-title-box
                    d-flex
                    align-items-center
                    justify-content-between
                  "
                    >
                        <div style={{ fontSize: '22px' }} className="fw-bold">
                            Add Business Type
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <h4 className="mb-0"></h4>
                        </div>

                        <div className="page-title-right">
                            <Button
                                variant="contained"
                                color="primary"
                                style={{
                                    fontWeight: 'bold',
                                    marginBottom: '1rem',
                                    textTransform: 'capitalize',
                                    marginRight: '5px',
                                }}
                                onClick={() => handleSubmit()}
                                disabled={loading}
                            >
                                {loading ? 'Loading' : 'Save'}
                            </Button>
                            <Link to="/business_type">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    style={{
                                        fontWeight: 'bold',
                                        marginBottom: '1rem',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-8 mx-auto">
                    <div className="card h-100">
                        <div className="card-body px-5">
                            <div className="mb-3">
                                <label htmlFor="business" className="form-label">
                                    Business *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="business"
                                    value={data.business}
                                    maxLength="50"
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.business && <p className="pt-1 pl-2 text-secondary">
                                    Remaining characters : {50 - data.business.length}
                                </p>}
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddBusiness
