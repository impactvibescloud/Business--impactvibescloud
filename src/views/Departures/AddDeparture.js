
import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { Link, useNavigate } from 'react-router-dom'
import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'
// import { WebsiteURL } from '../WebsiteURL'

const AddDeparture = () => {
    const token = isAutheticated()
    const navigate = useNavigate()
    const [data, setData] = useState({
        FlightNumber: '',
        Airline: '',
        Destination: '',
        GateNumber: '',

        ActualTimeofDeparture: '',
        EstimatedTimeofDeparture: '',
        ScheduledTimeofDeparture: '',
        Status: '',




    })


    const [loading, setLoading] = useState(false)







    const handleChange = (e) => {
        setData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }
    const handleClick = (e) => {
        setData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }




    const handleSubmit = () => {
        if (

            data.FlightNumber.trim() === '' ||

            data.Airline.trim() === '' ||
            data.Destination === '' ||
            data.GateNumber === '' ||
            data.ActualTimeofDeparture === '' ||
            data.EstimatedTimeofDeparture === '' ||
            data.ScheduledTimeofDeparture === ''
            // data.Status === ''

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
        formData.set('FlightNumber', data.FlightNumber)

        formData.set('Airline', data.Airline)
        formData.set('Destination', data.Destination)
        formData.set('GateNumber', data.GateNumber)

        formData.set('ActualTimeofDeparture', data.ActualTimeofDeparture)
        formData.set('EstimatedTimeofDeparture', data.EstimatedTimeofDeparture)

        formData.set('ScheduledTimeofDeparture', data.ScheduledTimeofDeparture)
        formData.set('Status', data.Status)



        axios
            .post(`/api/departure/flight/new/`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/formdata',
                    'Access-Control-Allow-Origin': '*',
                },
            })
            .then((res) => {
                swal({
                    title: 'Added',
                    text: 'New Flight added successfully!',
                    icon: 'success',
                    button: 'ok',
                })
                setLoading(false)
                navigate('/departures', { replace: true })
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
                            Add New Flight
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
                                {loading ? 'Loading' : 'Add'}
                            </Button>
                            <Link to="/departures">
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
                <div className="col-lg-6 col-md-6  col-sm-12 my-1">
                    <div className="card h-100">
                        <div className="card-body px-5">
                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Flight Number *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="FlightNumber"
                                    value={data.FlightNumber}
                                    maxLength={7}
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.FlightNumber ? <><small className="charLeft mt-4 fst-italic">
                                    {7 - data.FlightNumber.length} characters left
                                </small></> : <></>

                                }                            </div>

                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Airline *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="Airline"
                                    value={data.Airline}
                                    maxLength="25"
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.Airline ? <><small className="charLeft mt-4 fst-italic">
                                    {25 - data.Airline.length} characters left
                                </small></> : <></>
                                }
                            </div>
                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Destination(City) *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="Destination"
                                    value={data.Destination}
                                    maxLength="25"
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.Destination ? <><small className="charLeft mt-4 fst-italic">
                                    {25 - data.Destination.length} characters left
                                </small></> : <></>
                                }
                            </div>

                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">
                                    Gate Number *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="GateNumber"
                                    value={data.GateNumber}
                                    maxLength="3"
                                    onChange={(e) => handleChange(e)}
                                />
                                {data.GateNumber ? <><small className="charLeft mt-4 fst-italic">
                                    {3 - data.GateNumber.length} characters left
                                </small></> : <></>
                                }
                            </div>



                        </div>
                    </div>
                </div>
                <div className="col-lg-6 col-md-6  col-sm-12 my-1">
                    <div className="card h-100">
                        <div className="card-body px-5">


                            <div className="mb-3 ">
                                <label htmlFor="title" className="form-label">
                                    Actual Time of Departure *
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="ActualTimeofDeparture"
                                    value={data.ActualTimeofDeparture}
                                    onChange={(e) => handleChange(e)}

                                />
                            </div>
                            <div className="mb-3 ">
                                <label htmlFor="title" className="form-label">
                                    Scheduled Time of Departure *
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="ScheduledTimeofDeparture"
                                    value={data.ScheduledTimeofDeparture}
                                    onChange={(e) => handleChange(e)}

                                />
                            </div>
                            <div className="mb-4 ">
                                <label htmlFor="title" className="form-label">
                                    Estimated Time of Departure *
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="EstimatedTimeofDeparture"
                                    value={data.EstimatedTimeofDeparture}
                                    onChange={(e) => handleChange(e)}

                                />
                            </div>

                            <div className="mb-3 ">
                                <label htmlFor="title" className="form-label">
                                    Status *
                                </label>
                                <div className="v" >
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input mt-1" type="radio" id="Status" value="Departed" checked={data.Status === 'Departed'} onChange={(e) => handleChange(e)} />
                                        <label class="form-check-label" for="inlineRadio1">Departed</label>

                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input mt-1" type="radio" id="Status" value="OnTime" checked={data.Status === 'OnTime'} onChange={(e) => handleChange(e)} />
                                        <label class="form-check-label" for="inlineRadio2">OnTime</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input mt-1" type="radio" id="Status" value="Boarding" checked={data.Status === 'Boarding'} onChange={(e) => handleChange(e)} />
                                        <label class="form-check-label" for="inlineRadio2">Boarding</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input mt-1" type="radio" id="Status" value="Delayed" checked={data.Status === 'Delayed'} onChange={(e) => handleChange(e)} />
                                        <label class="form-check-label" for="Delayed">Delayed</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input mt-1" type="radio" id="Status" value="Cancelled" checked={data.Status === 'Cancelled'} onChange={(e) => handleChange(e)} />
                                        <label class="form-check-label" for="inlineRadio2">Cancelled</label>
                                    </div>

                                </div>
                            </div>









                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddDeparture
