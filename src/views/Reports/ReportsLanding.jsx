import React from 'react'
import { CCard, CCardBody, CRow, CCol } from '@coreui/react'
import './ReportsLanding.css'

const ReportCard = ({ title, description, href }) => {
  const navigate = () => {
    if (!href) return
    window.location.assign(href)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate()
    }
  }

  return (
    <div className="report-card">
      <div
        className="report-card-header"
        role="button"
        tabIndex={0}
        onClick={navigate}
        onKeyDown={onKeyDown}
        aria-pressed="false"
      >
        <span className="report-card-title">{title}</span>
        <span className="report-card-arrow">›</span>
      </div>
      <div className="report-card-body">
        <div className="report-desc">{description}{'\u00A0'}<a className="report-action report-action-link" href={href || '#'} onClick={(e)=>e.stopPropagation()}><span className="explore">Explore</span></a></div>
      </div>
    </div>
  )
}

const ReportsLanding = () => {
  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <h4 className="page-title mb-0">Reporting</h4>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <CCard className="section-card">
                <CCardBody>
                  <div className="section-title">Real Time Reporting</div>
                  <CRow className="cards-row">
                    <CCol xs={6} md={3}><ReportCard title="Active Calls" description="Displays active calls on Extensions" href="/callmonitor" /></CCol>
                    <CCol xs={6} md={3}><ReportCard title="Agent Real Time" description="Monitor agents live performance and status." href="/agent-performance" /></CCol>
                    <CCol xs={6} md={3}><ReportCard title="Department Wallboard" description="Display real-time departmental metrics." href="/department-performance" /></CCol>
                    <CCol xs={6} md={3}><ReportCard title="Dialer Real Time" description="View real-time dialer performance metrics." href="/dialer-real-time" /></CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <CCard className="section-card">
                <CCardBody>
                  <div className="section-title">Call Details</div>
                  <CRow className="cards-row">
                    <CCol xs={12} md={3}><ReportCard title="Call Detail Records (CDR)" description="Get detailed information on all calls." href="/reports/cdr" /></CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <CCard className="section-card">
                <CCardBody>
                  <div className="section-title">HPBX Reporting</div>
                  <CRow className="cards-row">
                    <CCol xs={12} md={3}><ReportCard title="Agent Performance" description="Evaluate agent productivity and effectiveness." href="/agent-performance" /></CCol>
                    <CCol xs={12} md={3}><ReportCard title="Department Performance" description="Assess departmental performance metrics." href="/department-performance" /></CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ReportsLanding
