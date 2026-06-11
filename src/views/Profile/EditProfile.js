import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { isAutheticated } from 'src/auth'
import Swal from 'sweetalert2'
import ClipLoader from 'react-spinners/ClipLoader'

const swal = (...args) => {
  if (args.length === 1 && typeof args[0] === 'object') {
    const o = args[0]
    return Swal.fire({
      title: o.title,
      text: o.text,
      icon: o.icon,
      confirmButtonText: o.button || o.confirmButtonText || 'OK',
    })
  }
  const [title, text, icon] = args
  return Swal.fire({ title, text, icon })
}

const EditProfile = () => {
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagesPreview, setImagesPreview] = useState()
  const token = isAutheticated()
  const history = useNavigate()

  const [ownerDetails, setOwnerDetails] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const getData = async () => {
    const res = await axios.get(`/api/v1/user/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.data.success) {
      setOwnerDetails({ ...res.data.user })
      if (res.data.user.avatar) setImagesPreview(res.data.user.avatar.url)
    }
  }

  useEffect(() => {
    getData()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setOwnerDetails({ ...ownerDetails, [name]: value })
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (reader.readyState === 2) setImagesPreview(reader.result)
    }
  }

  const handleSubmit = async () => {
    if (!ownerDetails.name || !ownerDetails.email || !ownerDetails.phone) {
      swal({
        title: 'Warning',
        text: 'Fill all mandatory fields',
        icon: 'error',
        button: 'Close',
      })
      return
    }
    const formData = new FormData()
    formData.append('name', ownerDetails.name)
    formData.append('email', ownerDetails.email)
    formData.append('phone', ownerDetails.phone)
    if (image) formData.append('avatar', image)

    setLoading(true)
    try {
      const res = await axios.put(`/api/v1/user/update/profile`, formData, {
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
      })
    }
  }

  const handleCancel = () => {
    history('/dashboard')
  }

  const initial = (ownerDetails.name || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-12 col-lg-8 col-xl-7">
                      <h1 className="text-left head-small">Edit Profile</h1>

                      <div
                        className="d-flex align-items-center mb-4 mt-3"
                        style={{ gap: 16 }}
                      >
                        {imagesPreview ? (
                          <img
                            src={imagesPreview}
                            alt="Avatar preview"
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #e5e7eb',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: '50%',
                              background: '#303c54',
                              color: '#fff',
                              fontSize: 28,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {initial}
                          </div>
                        )}
                        <div>
                          <label
                            htmlFor="profile-avatar"
                            className="btn btn-light btn-sm"
                            style={{ cursor: 'pointer', marginBottom: 4 }}
                          >
                            Change photo
                          </label>
                          <input
                            id="profile-avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            style={{ display: 'none' }}
                          />
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            PNG or JPG, up to ~2MB.
                          </div>
                        </div>
                      </div>

                      <form>
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="form-group">
                              <label className="label-100 mt-3">Name *</label>
                              <input
                                type="text"
                                name="name"
                                value={ownerDetails.name || ''}
                                onChange={handleChange}
                                className="form-control input-field"
                                placeholder="Your full name"
                              />

                              <label className="label-100 mt-3">Email *</label>
                              <input
                                type="email"
                                name="email"
                                value={ownerDetails.email || ''}
                                onChange={handleChange}
                                className="form-control input-field"
                                placeholder="name@example.com"
                              />

                              <label className="label-100 mt-3">Phone *</label>
                              <input
                                type="text"
                                name="phone"
                                value={ownerDetails.phone || ''}
                                onChange={handleChange}
                                className="form-control input-field"
                                placeholder="10-digit phone"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="row mt-4">
                          <div className="col-lg-12">
                            <div className="form-group text-left">
                              <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn btn-success btn-login waves-effect waves-light me-3 pt-2 pb-2 pr-4 pl-4"
                              >
                                <ClipLoader loading={loading} size={18} />
                                {!loading && 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-light waves-effect pt-2 pb-2 pr-4 pl-4"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
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

export default EditProfile
