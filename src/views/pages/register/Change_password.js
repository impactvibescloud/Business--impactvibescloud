import React, { useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

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

const validPasswordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{7,}$/

const ChangePassword = () => {
  const [loading, setLoading] = useState(false)
  const history = useNavigate()

  const [user, setUser] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    oldPasswordError: '',
    newPasswordError: '',
    confirmPasswordError: '',
  })
  const [show, setShow] = useState({ old: false, new: false, confirm: false })

  const handleChange = (e) => {
    const { name, value } = e.target
    const ruleMsg =
      'Password must be at least 8 characters with an uppercase, a lowercase, a digit, and a special character.'

    if (name === 'oldPassword') {
      setErrors((p) => ({
        ...p,
        oldPasswordError: validPasswordRegex.test(value) ? '' : ruleMsg,
      }))
    } else if (name === 'newPassword') {
      setErrors((p) => ({
        ...p,
        newPasswordError: validPasswordRegex.test(value) ? '' : ruleMsg,
      }))
    } else if (name === 'confirmPassword') {
      setErrors((p) => ({
        ...p,
        confirmPasswordError: validPasswordRegex.test(value) ? '' : ruleMsg,
      }))
    }
    setUser({ ...user, [name]: value })
  }

  const handleSubmit = async () => {
    if (!(user.oldPassword && user.newPassword && user.confirmPassword)) {
      return swal('Error!', 'All fields are required', 'error')
    }
    if (user.newPassword.length < 8) {
      return swal('Error!', 'New password must be at least 8 characters', 'error')
    }
    if (user.newPassword !== user.confirmPassword) {
      return swal('Error!', 'New password and confirm password do not match', 'error')
    }

    const token = localStorage.getItem('authToken')
    setLoading(true)
    try {
      const res = await axios.put(
        '/api/v1/user/password/update',
        { ...user },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.data.success === true) {
        Swal.fire({
          title: 'Done',
          text: 'Password Changed',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#303c54',
          iconColor: '#303c54',
        }).then(() => history('/dashboard'))
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Could not update password. Please try again.'
      swal('Error!', message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderField = (label, name, showKey, placeholder, errorMsg) => (
    <>
      <label className="label-100 mt-3">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[showKey] ? 'text' : 'password'}
          name={name}
          value={user[name]}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={name === 'oldPassword' ? 'current-password' : 'new-password'}
          className="form-control input-field"
          style={{ paddingRight: 70 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            color: '#6c757d',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {show[showKey] ? 'Hide' : 'Show'}
        </button>
      </div>
      {errorMsg && (
        <div className="text-danger" style={{ fontSize: 12, marginTop: 4 }}>
          {errorMsg}
        </div>
      )}
    </>
  )

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-12 col-lg-7 col-xl-6">
                      <h1 className="text-left head-small">Change Password</h1>
                      <p className="text-muted mb-3" style={{ marginTop: 6 }}>
                        Use a strong password you don&apos;t reuse elsewhere.
                      </p>

                      <form>
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="form-group">
                              {renderField(
                                'Old Password',
                                'oldPassword',
                                'old',
                                'Enter current password',
                                errors.oldPasswordError,
                              )}
                              {renderField(
                                'New Password',
                                'newPassword',
                                'new',
                                'Enter new password',
                                errors.newPasswordError,
                              )}
                              {renderField(
                                'Confirm Password',
                                'confirmPassword',
                                'confirm',
                                'Re-enter new password',
                                errors.confirmPasswordError,
                              )}
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
                                {!loading && 'Update Password'}
                              </button>
                              <button
                                type="button"
                                onClick={() => history('/dashboard')}
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

export default ChangePassword
