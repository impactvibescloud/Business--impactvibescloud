import React, { useState, useEffect } from 'react'
// Inject modern login styles (reuses same data attribute to avoid duplication)
const MODERN_LOGIN_CSS = [
    '.login-modern-bg { min-height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #f6fbff 0%, #ffffff 60%); position: relative; overflow: hidden; }',
    '.login-modern-bg::before { content: ""; position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 1100px; height: 1100px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.12), transparent 20%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.06), transparent 30%); filter: blur(40px); pointer-events: none; }',
    '.home-login-content, .login-content { width: 420px; max-width: calc(100% - 48px); background: transparent; border-radius: 8px; padding: 0; position: relative; z-index: 2; }',
    '.home-login-content .brand, .login-content .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; text-align: center; justify-content: center; flex-direction: row; }',
    '.home-login-content .brand img, .login-content .brand img { width: 96px; height: 96px; object-fit: contain; flex-shrink: 0; }',
    '.home-login-content .brand-text, .login-content .brand-text { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; }',
    '.home-login-content .brand-text .title, .login-content .brand-text .title { display: flex; gap: 0; align-items: baseline; justify-content: flex-start; font-weight: 800; font-size: 20px; }',
    '.home-login-content .brand-text .subtitle, .login-content .brand-text .subtitle { font-size: 13px; color: #6b7280; text-align: left; font-weight: 700; }',
    '.modern-input { background: #ffffff; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 12px 12px 12px 40px; font-size: 15px; transition: box-shadow 0.15s, border-color 0.15s; max-width: 100%; }',
    '.modern-input:focus { outline: none; box-shadow: 0 6px 18px rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.25); }',
    '.modern-login-btn { background: linear-gradient(90deg, #f97316 0%, #fb923c 100%); border: none; color: #fff; padding: 12px 18px; border-radius: 12px; font-size: 16px; width: 100%; }',
    '.modern-login-footer { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); text-align: center; color: rgba(17,24,39,0.55); font-size: 13px; z-index: 9999; background: transparent; }',
].join('\n');

function useModernLoginCss() {
    useEffect(() => {
        if (typeof window !== 'undefined' && !document.head.querySelector('style[data-modern-login]')) {
            const style = document.createElement('style');
            style.setAttribute('data-modern-login', 'true');
            style.innerHTML = MODERN_LOGIN_CSS;
            document.head.appendChild(style);
        }
    }, []);
}
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader";

import {

    CButton,
    CCard,
    CCardBody,
    CCol,
    CContainer,
    CForm,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeLetter, cilEnvelopeOpen, cilLockLocked, cilUser } from '@coreui/icons'
import { Link, useNavigate } from 'react-router-dom';
import swal from 'sweetalert';

const ForgotPassword = () => {
    useModernLoginCss();
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('')
    // console.log(email)
    const handleSubmit = async (emailVal) => {
        const emailToSend = emailVal || email || (typeof document !== 'undefined' && document.getElementById('email') ? document.getElementById('email').value : '')
        if (!emailToSend) {
            swal('Error!', 'Please enter your email', 'error')
            return
        }
        try {
            setLoading(true)
            const res = await axios.post(`/api/v1/user/password/forgot`, { email: emailToSend })
            if (res.data && res.data.success === true) {
                swal("success!", "Email sent successfully! Please check your email.", "success");
                navigate("/");
                return
            }
            swal('Error!', 'Unable to send reset email', 'error')
        } catch (e) {
            swal('Error!', 'Wrong Email ID. Enter valid email to get the password', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-modern-bg">
            <div className="home-login-content">
                <div className="brand">
                    <img src={process.env.PUBLIC_URL + '/logos/sidebarlogo.ico'} alt="JustConnect" />
                    <div className="brand-text">
                        <div className="title"><div style={{ color: '#0760c7' }}>just</div><div style={{ color: '#f97316' }}>Connect</div></div>
                        <div className="subtitle">Enterprise Conversations Simplified</div>
                    </div>
                </div>

                <CForm className="modern-login-form">
                    <div className="mb-3">
                        <label htmlFor="email">Email</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.7 }}>
                                <CIcon icon={cilEnvelopeOpen} />
                            </span>
                            <input id="email" type="email" className="form-control modern-input" placeholder="Enter your email" onChange={(e)=>setEmail(e.target.value)} value={email} style={{ paddingLeft: 44 }} />
                        </div>
                    </div>

                    <div className="d-grid mb-3">
                        <CButton className="modern-login-btn" type="button" onClick={() => handleSubmit()}>
                            <ClipLoader loading={loading} size={16} />
                            {!loading && 'Send'}
                        </CButton>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Link to='/' style={{ textDecoration: 'none' }}>Back to Login</Link>
                    </div>

                    <div className="modern-login-footer">©2026 justConnect. All rights reserved.</div>
                </CForm>

            </div>
        </div>
    )
};

export default ForgotPassword;
