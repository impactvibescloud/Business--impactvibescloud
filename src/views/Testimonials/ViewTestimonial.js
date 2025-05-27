



import axios from "axios";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import swal from 'sweetalert';

import { Link, useParams } from "react-router-dom";
import { isAutheticated } from "src/auth";

function ViewTestimonial() {
    const [testimonial, setTestimonial] = useState([])
    const { id } = useParams();
    const token = isAutheticated();

    const getTestimonial = useCallback(async () => {
        let res = await axios.get(
            `/api/testimonial/getOne/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        setTestimonial(res.data.testimonial)


    }, [token]);

    useEffect(() => {
        getTestimonial();
    }, [getTestimonial]);





    //change time formate
    function formatAMPM(date) {
        var hours = new Date(date).getHours();
        var minutes = new Date(date).getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }


    return (
        <div className=" main-content">
            <div className="  my-3 page-content">
                <div className="container-fluid">
                    {/* <!-- start page title --> */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-3">Testimonial</h4>
                                <Link to="/testimonials"><button type="button" className="btn btn-info float-end mb-3 ml-4">Back</button></Link>

                            </div>
                        </div>
                    </div>
                    {/* <!-- end page title --> */}

                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row ml-0 mr-0  mb-10">

                                    </div>
                                    <div className="table-responsive table-shoot">
                                        <table className="table table-centered table-nowrap mb-0">
                                            <thead className="thead-light">

                                                <tr><th>Id</th> <td><h5>{testimonial?._id}</h5></td></tr>
                                                <tr><th>Name</th>                                                        <td>{testimonial?.name}</td></tr>

                                                {testimonial.image && <tr><th>image</th><td>

                                                    <img className="me-2" src={`${testimonial.image?.url}`} width="70" alt="" />

                                                </td></tr>}
                                                {testimonial?.company && <tr><th> Company</th><td>{testimonial?.company}</td></tr>}
                                                <tr><th>Testimonial</th><td>{testimonial?.testimonial}</td></tr>


                                                {/* <tr><th>Testimonial Time</th><td>{testimonial?.time}</td></tr>
                                                <tr><th>Location</th><td>{testimonial?.location}</td></tr> */}
                                                <tr><th>Created On</th><td>
                                                    {new Date(`${testimonial?.createdAt}`).toDateString()}<span> , {`${formatAMPM(testimonial?.createdAt)}`}</span>
                                                </td></tr>
                                                <tr><th>Updated At</th>
                                                    <td>
                                                        {new Date(`${testimonial?.updatedAt}`).toDateString()}<span> , {`${formatAMPM(testimonial?.updatedAt)}`}</span>
                                                    </td>
                                                </tr>

                                            </thead>
                                            <tbody>

                                            </tbody>
                                        </table>
                                    </div>


                                    {/* <!-- end table-responsive --> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <!-- container-fluid --> */}
            </div>
        </div>
    );
}

export default ViewTestimonial;
