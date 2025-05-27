import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'

import swal from 'sweetalert'
import axios from 'axios'
import { isAutheticated } from 'src/auth'

function Socialmedia() {
    const [loading, setLoading] = useState(false)
    const token = isAutheticated()
    const [facebook, setFacebook] = useState('')
    const [instagram, setInstagram] = useState('')
    const [twitter, setTwitter] = useState('')
    const [linkedin, setLinkedin] = useState('')
    const [youtube, setYoutube] = useState('')
    console.log("youtube", youtube);
    useEffect(() => {
        async function getConfiguration() {
            const configDetails = await axios.get(`/api/config`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            configDetails.data.result.map((item) => {
                console.log(item.socialMedia)
                setFacebook(item?.socialMedia[0]?.facebook)
                setInstagram(item?.socialMedia[0]?.instagram)
                setTwitter(item?.socialMedia[0]?.twitter)
                setLinkedin(item?.socialMedia[0]?.linkedin)
                setYoutube(item?.socialMedia[0]?.youtube)
            })
        }
        getConfiguration()
    }, [])

    async function handelChange(e) {
        if (e.target.name === 'facebook') {
            setFacebook(e.target.value)
        } else if (e.target.name === 'twitter') {
            setTwitter(e.target.value)
        } else if (e.target.name === 'instagram') {
            setInstagram(e.target.value)
        } else if (e.target.name === 'linkedin') {
            setLinkedin(e.target.value)
        } else if (e.target.name === 'youtube') {
            setYoutube(e.target.value)
        }
    }
    async function handelSubmit() {
        setLoading(true)
        let data = {
            facebook,
            twitter,
            instagram,
            linkedin,
            youtube
        }
        let res = await axios.post(`/api/config/social`, data, {
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
            {/* <Config
        heading="Social Media"
        labels={["Facebook", "Twitter", "Instagram", "LinkedIn"]}
        postUrl="social"
      /> */}
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-12 col-lg-6 col-xl-6">
                                                <h1 className="text-left head-small">Social Media</h1>

                                                <form>
                                                    <div className="row">
                                                        <div className="col-lg-12">
                                                            <div className="form-group">
                                                                <>
                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Facebook
                                                                    </label>
                                                                    <input
                                                                        value={facebook}
                                                                        type="text"
                                                                        name="facebook"
                                                                        onChange={(e) => handelChange(e)}
                                                                        className="form-control input-field "
                                                                        id="basicpill-phoneno-input"
                                                                    />
                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Twitter
                                                                    </label>
                                                                    <input
                                                                        value={twitter}
                                                                        type="text"
                                                                        name="twitter"
                                                                        onChange={(e) => handelChange(e)}
                                                                        className="form-control input-field "
                                                                        id="basicpill-phoneno-input"
                                                                    />{' '}
                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Instagram
                                                                    </label>
                                                                    <input
                                                                        value={instagram}
                                                                        type="text"
                                                                        name="instagram"
                                                                        onChange={(e) => handelChange(e)}
                                                                        className="form-control input-field "
                                                                        id="basicpill-phoneno-input"
                                                                    />{' '}
                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Youtube
                                                                    </label>
                                                                    <input
                                                                        value={youtube}
                                                                        type="text"
                                                                        name="youtube"
                                                                        onChange={(e) => handelChange(e)}
                                                                        className="form-control input-field "
                                                                        id="basicpill-phoneno-input"
                                                                    />{' '}
                                                                    <label for="basicpill-phoneno-input" className="label-100 mt-3">
                                                                        Linkedin
                                                                    </label>
                                                                    <input
                                                                        value={linkedin}
                                                                        type="text"
                                                                        name="linkedin"
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

export default Socialmedia
