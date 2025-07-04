import React, { useState, useEffect } from 'react'
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner } from '@coreui/react'
import './CallLogs.css'

const dummyCallLogs = [
  { id: 1, caller: 'John Doe', receiver: 'Jane Smith', time: '2025-06-17 10:30', duration: '5 min', status: 'Completed' },
  { id: 2, caller: 'Alice', receiver: 'Bob', time: '2025-06-16 14:20', duration: '2 min', status: 'Missed' },
  { id: 3, caller: 'Charlie', receiver: 'David', time: '2025-06-15 09:10', duration: '10 min', status: 'Completed' },
]

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCallLogs(dummyCallLogs)
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <CContainer className="call-logs-container">
      <CRow className="justify-content-center">
        <CCol md={10}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h4 className="call-logs-title">Call Logs</h4>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                </div>
              ) : callLogs.length === 0 ? (
                <div className="empty-state">
                  <h4>No call logs found</h4>
                  <p>There are no call logs available at this time.</p>
                </div>
              ) : (
                <CTable hover responsive className="call-logs-table">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Caller</CTableHeaderCell>
                      <CTableHeaderCell>Receiver</CTableHeaderCell>
                      <CTableHeaderCell>Time</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {callLogs.map((log, idx) => (
                      <CTableRow key={log.id}>
                        <CTableDataCell>{idx + 1}</CTableDataCell>
                        <CTableDataCell className="caller-name">{log.caller}</CTableDataCell>
                        <CTableDataCell className="receiver-name">{log.receiver}</CTableDataCell>
                        <CTableDataCell className="call-time">{log.time}</CTableDataCell>
                        <CTableDataCell className="call-duration">{log.duration}</CTableDataCell>
                        <CTableDataCell>
                          <span className={`call-status ${log.status.toLowerCase() === 'completed' ? 'status-completed' : 'status-missed'}`}>
                            {log.status}
                          </span>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default CallLogs