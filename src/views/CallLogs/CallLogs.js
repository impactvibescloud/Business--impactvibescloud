import React, { useState, useEffect } from 'react'
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner } from '@coreui/react'

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
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={10}>
          <CCard>
            <CCardHeader>
              <h4>Call Logs</h4>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <CTable hover responsive>
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
                        <CTableDataCell>{log.caller}</CTableDataCell>
                        <CTableDataCell>{log.receiver}</CTableDataCell>
                        <CTableDataCell>{log.time}</CTableDataCell>
                        <CTableDataCell>{log.duration}</CTableDataCell>
                        <CTableDataCell>{log.status}</CTableDataCell>
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