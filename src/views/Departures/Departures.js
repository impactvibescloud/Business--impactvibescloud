

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { isAutheticated } from 'src/auth'

const Departures = () => {
    const token = isAutheticated()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [success, setSuccess] = useState(true)
    const [DeparturesData, setDeparturesData] = useState([])

    const [currentPage, setCurrentPage] = useState(1)
    const [itemPerPage, setItemPerPage] = useState(10)
    const [showData, setShowData] = useState(DeparturesData)

    const handleShowEntries = (e) => {
        setCurrentPage(1)
        setItemPerPage(e.target.value)
    }



    const getDeparturesData = async () => {
        axios
            .get(`/api/departure/flight/getAll/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                console.log(res.data.departure)
                setDeparturesData(res.data?.departure)
                setLoading(false)
            })
            .catch((err) => {
                setLoading(false)
            })
    }

    useEffect(() => {
        getDeparturesData()
    }, [success])

    useEffect(() => {
        const loadData = () => {
            const indexOfLastPost = currentPage * itemPerPage
            const indexOfFirstPost = indexOfLastPost - itemPerPage
            setShowData(DeparturesData.slice(indexOfFirstPost, indexOfLastPost))
        }
        loadData()
    }, [currentPage, itemPerPage, DeparturesData])

    const handleDelete = (id) => {
        swal({
            title: 'Are you sure?',
            icon: 'error',
            buttons: { Yes: { text: 'Yes', value: true }, Cancel: { text: 'Cancel', value: 'cancel' } },
        }).then((value) => {
            if (value === true) {
                axios
                    .delete(`/api/product/delete/${id}`, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    .then((res) => {
                        setSuccess((prev) => !prev)
                    })
                    .catch((err) => {
                        swal({
                            title: 'Warning',
                            text: 'Something went wrong!',
                            icon: 'error',
                            button: 'Retry',
                            dangerMode: true,
                        })
                    })
            }
        })
    }

    return (
        <div className="main-content">
            <div className="page-content">
                <div className="container-fluid">
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
                                    Departures
                                </div>

                                <div className="page-title-right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        style={{
                                            fontWeight: 'bold',
                                            marginBottom: '1rem',
                                            textTransform: 'capitalize',
                                        }}
                                        onClick={() => {
                                            navigate('/departure/add', { replace: true })
                                        }}
                                    >
                                        Add New Flight
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row ml-0 mr-0 mb-10">
                                        <div className="col-sm-12 col-md-12">
                                            <div className="dataTables_length">
                                                <label className="w-100">
                                                    Show
                                                    <select
                                                        style={{ width: '10%' }}
                                                        name=""
                                                        onChange={(e) => handleShowEntries(e)}
                                                        className="
                                select-w
                                custom-select custom-select-sm
                                form-control form-control-sm
                              "
                                                    >
                                                        <option value="10">10</option>
                                                        <option value="25">25</option>
                                                        <option value="50">50</option>
                                                        <option value="100">100</option>
                                                    </select>
                                                    entries
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive table-shoot mt-3">
                                        <table
                                            className="table table-centered table-nowrap"
                                            style={{ border: '1px solid' }}
                                        >
                                            <thead className="thead-info" style={{ background: 'rgb(140, 213, 213)' }}>
                                                <tr>

                                                    <th className="text-start">Flight Number </th>
                                                    <th className="text-start">Airline</th>
                                                    <th className="text-start"> Destination</th>
                                                    <th className="text-start"> Gate Number</th>

                                                    <th className="text-start"> Actual Time of Departure</th>
                                                    <th className="text-start"> Scheduled Time of Departure</th>

                                                    <th className="text-start"> Estimated Time of Departure</th>
                                                    <th className="text-start"> Status</th>


                                                    <th className="text-start">Added On</th>
                                                    {/* <th className="text-start">Actions</th> */}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!loading && showData.length === 0 && (
                                                    <tr className="text-center">
                                                        <td colSpan="6">
                                                            <h5>No Data Available</h5>
                                                        </td>
                                                    </tr>
                                                )}
                                                {loading ? (
                                                    <tr>
                                                        <td className="text-center" colSpan="6">
                                                            Loading...
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    showData.map((product, i) => {
                                                        return (
                                                            <tr key={i}>
                                                                <td className="text-start">{product.FlightNumber}</td>

                                                                <td className="text-start">{product.Airline}</td>
                                                                <td className="text-start">{product.Destination}</td>

                                                                <td className="text-start">{product.GateNumber}</td>

                                                                <td className="text-start">{product.ActualTimeofDeparture}</td>
                                                                <td className="text-start">{product.ScheduledTimeofDeparture}</td>

                                                                <td className="text-start">{product.EstimatedTimeofDeparture}</td>

                                                                <td className="text-start"> <button className=" btn btn-info btn-sm mt-1">{product.Status}</button></td>


                                                                <td className="text-start">
                                                                    {new Date(product.createdAt).toLocaleString('en-IN', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: 'numeric',
                                                                        minute: 'numeric',
                                                                        hour12: true,
                                                                    })}
                                                                </td>
                                                                {/* <td className="text-start">

                                                                    <Link to={`/product/view/${product._id}`}>
                                                                        <button
                                                                            style={{ color: 'white', marginRight: '1rem' }}
                                                                            type="button"
                                                                            className="
                                      btn btn-primary btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mx-1
                                    mt-1
                                  "
                                                                        >
                                                                            View
                                                                        </button>
                                                                    </Link>
                                                                    <Link to={`/product/edit/${product._id}`}>
                                                                        <button
                                                                            style={{ color: 'white', marginRight: '1rem' }}
                                                                            type="button"
                                                                            className="
                                      btn btn-info btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mt-1
                                    mx-1
                                  "
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </Link>
                                                                    <Link
                                                                        to={'#'}
                                                                        style={{
                                                                            marginRight: '1rem',
                                                                        }}
                                                                    >
                                                                        <button
                                                                            style={{ color: 'white' }}
                                                                            type="button"
                                                                            className="
                                    btn btn-danger btn-sm
                                    waves-effect waves-light
                                    btn-table
                                    mt-1
                                    mx-1
                                    
                                  "
                                                                            onClick={() => {
                                                                                handleDelete(product._id)
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </Link>
                                                                </td> */}
                                                            </tr>
                                                        )
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="row mt-20">
                                        <div className="col-sm-12 col-md-6 mb-20">
                                            <div
                                                className="dataTables_info"
                                                id="datatable_info"
                                                role="status"
                                                aria-live="polite"
                                            >
                                                Showing {currentPage * itemPerPage - itemPerPage + 1} to{' '}
                                                {Math.min(currentPage * itemPerPage, DeparturesData.length)} of{' '}
                                                {DeparturesData.length} entries
                                            </div>
                                        </div>

                                        <div className="col-sm-12 col-md-6">
                                            <div className="d-flex">
                                                <ul className="pagination ms-auto">
                                                    <li
                                                        className={
                                                            currentPage === 1
                                                                ? 'paginate_button page-item previous disabled'
                                                                : 'paginate_button page-item previous'
                                                        }
                                                    >
                                                        <span
                                                            className="page-link"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setCurrentPage((prev) => prev - 1)}
                                                        >
                                                            Previous
                                                        </span>
                                                    </li>

                                                    {!(currentPage - 1 < 1) && (
                                                        <li className="paginate_button page-item">
                                                            <span
                                                                className="page-link"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={(e) => setCurrentPage((prev) => prev - 1)}
                                                            >
                                                                {currentPage - 1}
                                                            </span>
                                                        </li>
                                                    )}

                                                    <li className="paginate_button page-item active">
                                                        <span className="page-link" style={{ cursor: 'pointer' }}>
                                                            {currentPage}
                                                        </span>
                                                    </li>

                                                    {!(
                                                        (currentPage + 1) * itemPerPage - itemPerPage >
                                                        DeparturesData.length - 1
                                                    ) && (
                                                            <li className="paginate_button page-item ">
                                                                <span
                                                                    className="page-link"
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => {
                                                                        setCurrentPage((prev) => prev + 1)
                                                                    }}
                                                                >
                                                                    {currentPage + 1}
                                                                </span>
                                                            </li>
                                                        )}

                                                    <li
                                                        className={
                                                            !(
                                                                (currentPage + 1) * itemPerPage - itemPerPage >
                                                                DeparturesData.length - 1
                                                            )
                                                                ? 'paginate_button page-item next'
                                                                : 'paginate_button page-item next disabled'
                                                        }
                                                    >
                                                        <span
                                                            className="page-link"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setCurrentPage((prev) => prev + 1)}
                                                        >
                                                            Next
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
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

export default Departures
