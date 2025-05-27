







import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { Link, useNavigate } from 'react-router-dom'
import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'
// import { WebsiteURL } from '../WebsiteURL'

const AddInformations = () => {
    const token = isAutheticated()
    const navigate = useNavigate()
    const [data, setData] = useState({

        title: '',
        description: '',



    })


    const [loading, setLoading] = useState(false)







    const handleChange = (e) => {


        setData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }




    const handleSubmit = () => {
        if (
            data.title.trim() === '' ||

            data.description.trim() === ''

        ) {
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
        const formData = new FormData()
        formData.set('title', data.title)

        formData.set('description', data.description)



        axios
            .post(`/api/information/new/`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/formdata',
                    'Access-Control-Allow-Origin': '*',
                },
            })
            .then((res) => {
                swal({
                    title: 'Added',
                    text: 'information added successfully!',
                    icon: 'success',
                    button: 'ok',
                })
                setLoading(false)
                navigate('/informations', { replace: true })
            })
            .catch((err) => {
                setLoading(false)
                const message = err.response?.data?.message || 'Something went wrong!'
                swal({
                    title: 'Warning',
                    text: message,
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
                            Add Information
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
                            <Link to="/informations">
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
                <div className="col-lg-12 col-md-12  col-sm-12 my-1">
                    <div className="card h-100">
                        <div className="card-body px-5">
                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="title"
                                    value={data.title}
                                    maxLength={150}
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.title ? <><small className="charLeft mt-4 fst-italic">
                                    {150 - data.title.length} characters left
                                </small></> : <></>

                                }                            </div>

                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Description *
                                </label>
                                <textarea
                                    type="text"
                                    className="form-control"
                                    id="description"
                                    rows="10"
                                    cols="100"
                                    value={data.description}
                                    placeholder='your message...'
                                    maxLength="500"
                                    onChange={(e) => handleChange(e)}
                                >
                                </textarea>

                                {data.description ? <><small className="charLeft mt-4 fst-italic">
                                    {500 - data.description.length} characters left
                                </small></> : <></>
                                }
                            </div>


                            {/* <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Description *
                                </label>
                                <br />
                                <textarea id="w3review" name="w3review" rows="10" cols="100">
                                    At w3schools.com you will learn how to make a website. They offer free tutorials in all web development technologies.
                                </textarea>
                            </div> */}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default AddInformations
