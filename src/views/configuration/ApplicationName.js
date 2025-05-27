import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'

import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'

function ApplicationName() {
    const [loading, setLoading] = useState(false)
    const token = isAutheticated()

    const [appName, setAppName] = useState('')

    useEffect(() => {
        async function getConfiguration() {
            const configDetails = await axios.get(`/api/config`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            configDetails.data.result.map((item) => {
                setAppName(item?.appName)

            })
        }
        getConfiguration()
    }, [])

    async function handelChange(e) {


        setAppName(e.target.value)
    }
    async function handelSubmit() {
        setLoading(true)

        let res = await axios.post(`/api/config/application/name`, { appName }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (res) {
            setLoading(false)
            console.log(res)
            swal('Success!', res.data.message, res.data.status)
        }
    }
    return (
        <div>

            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-12 col-lg-6 col-xl-6">
                                                <h1 className="text-left head-small">Application Name</h1>

                                                <form>
                                                    <div className="row">
                                                        <div className="col-lg-12">
                                                            <div className="form-group">
                                                                <>



                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Application Name
                                                                    </label>
                                                                    <input
                                                                        value={appName}
                                                                        type="text"
                                                                        name="appName"
                                                                        onChange={(e) => handelChange(e)}
                                                                        className="form-control input-field "
                                                                        id="basicpill-phoneno-input"
                                                                    />
                                                                </>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row mt-1">
                                                        <div className="col-lg-12">
                                                            <div className="form-group text-left">
                                                                <button
                                                                    type="button"
                                                                    onClick={handelSubmit}
                                                                    className="btn btn-success btn-login waves-effect waves-light me-3 pt-2 pb-2 pr-4 pl-4"
                                                                >
                                                                    <ClipLoader loading={loading} size={18} />
                                                                    {!loading && 'Save'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>

                                        {/* <!-- end table-responsive --> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <!-- container-fluid --> */}
                </div>
                {/* <!-- End Page-content --> */}
            </div>
        </div>
    )
}

export default ApplicationName
