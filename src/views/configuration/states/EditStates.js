import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { Link, useNavigate, useParams } from 'react-router-dom'
import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'


const EditState = () => {
    const id = useParams()?.id
    const token = isAutheticated()
    const navigate = useNavigate()
    const [data, setData] = useState({
        state_code: '',
        state_name: '',
    })
    const [loading, setLoading] = useState(false)
    const [limiter, setLimiter] = useState({
        state_code: 10,
        state_name: 50,
        state_codeHas: 10,
        state_nameHas: 50,
    })

    const getCategory = () => {
        axios
            .get(`/api/state/${id}`, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setData((prev) => ({
                    ...prev,
                    ...res.data?.data,
                }))
                setLimiter((prev) => ({
                    ...prev,
                    state_nameHas: prev.state_name - res.data?.data?.state_name.length,
                    state_codeHas: prev.state_code - res.data?.data?.state_code?.toString()?.length,
                }))
            })
            .catch((err) => { })
    }

    useEffect(() => {
        getCategory()
    }, [])

    const handleChange = (e) => {
        if (e.target.id === 'state_code' && /^\D+$/.test(e.target.value)) return
        if (e.target.type === 'text') {
            if (e.target.value.length === limiter[e.target.id] + 1) return
            setLimiter((prev) => ({
                ...prev,
                [e.target.id + 'Has']: prev[e.target.id] - e.target.value.length,
            }))
        }
        setData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleSubmit = () => {
        if (data.state_name.trim() === '') {
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
            .patch(`/api/state/${id}`, data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                swal({
                    title: 'Updated',
                    text: 'State updated successfully!',
                    icon: 'success',
                    button: 'Close',
                })
                setLoading(false)
                navigate('/states', { replace: true })
            })
            .catch((err) => {
                setLoading(false)
                swal({
                    title: 'Warning',
                    text: 'Something went wrong!',
                    icon: 'error',
                    button: 'Retry',
                    dangerMode: true,
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
                            Edit State
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
                                {loading ? 'Loading' : 'Update'}
                            </Button>
                            <Link to="/states">
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
                                <label htmlFor="city_name" className="form-label">
                                    State Name*
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="state_name"
                                    value={data.state_name}
                                    maxLength={limiter.state_name}
                                    onChange={(e) => handleChange(e)}
                                />
                                <p className="pt-1 pl-2 text-secondary">
                                    Remaining characters : {limiter.state_nameHas}
                                </p>
                            </div>
                            {/* <div className="mb-3">
                                <label htmlFor="city_name" className="form-label">
                                    State Code (GST)*
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="state_code"
                                    value={data.state_code}
                                    maxLength={limiter.state_code}
                                    onChange={(e) => handleChange(e)}
                                />
                                <p className="pt-1 pl-2 text-secondary">
                                    Remaining characters : {limiter.state_codeHas}
                                </p>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditState
