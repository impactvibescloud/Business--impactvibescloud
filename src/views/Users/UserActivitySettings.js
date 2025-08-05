import React from 'react';
import { 
  CCard, 
  CCardBody, 
  CCardHeader, 
  CForm, 
  CFormCheck, 
  CButton, 
  CFormSwitch,
  CRow,
  CCol 
} from '@coreui/react';
import { useUserActivity } from '../../context/UserActivityContext';

const UserActivitySettings = () => {
  const { userStatus, updateStatus, STATUS_OPTIONS } = useUserActivity();
  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [statusTimeout, setStatusTimeout] = React.useState(15);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, these settings would be saved to the backend
    alert('Settings saved');
  };

  return (
    <div>
      <CCard className="mb-4">
        <CCardHeader>
          <h5>Activity Status Settings</h5>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <h6 className="mb-3">Default Status</h6>
            <div className="mb-4">
              <CFormCheck 
                type="radio" 
                name="defaultStatus" 
                id="status-online" 
                label="Online" 
                value={STATUS_OPTIONS.ONLINE}
                checked={userStatus === STATUS_OPTIONS.ONLINE}
                onChange={() => updateStatus(STATUS_OPTIONS.ONLINE)}
                className="mb-2"
              />
              <CFormCheck 
                type="radio" 
                name="defaultStatus" 
                id="status-offline" 
                label="Offline" 
                value={STATUS_OPTIONS.OFFLINE}
                checked={userStatus === STATUS_OPTIONS.OFFLINE}
                onChange={() => updateStatus(STATUS_OPTIONS.OFFLINE)}
                className="mb-2"
              />
              <CFormCheck 
                type="radio" 
                name="defaultStatus" 
                id="status-lunch" 
                label="Lunch" 
                value={STATUS_OPTIONS.LUNCH}
                checked={userStatus === STATUS_OPTIONS.LUNCH}
                onChange={() => updateStatus(STATUS_OPTIONS.LUNCH)}
                className="mb-2"
              />
              <CFormCheck 
                type="radio" 
                name="defaultStatus" 
                id="status-break" 
                label="Break" 
                value={STATUS_OPTIONS.BREAK}
                checked={userStatus === STATUS_OPTIONS.BREAK}
                onChange={() => updateStatus(STATUS_OPTIONS.BREAK)}
              />
            </div>

            <CRow className="mb-4">
              <CCol xs={12}>
                <CFormSwitch 
                  label="Automatically update status when inactive" 
                  id="auto-update"
                  checked={autoUpdate}
                  onChange={() => setAutoUpdate(!autoUpdate)}
                />
              </CCol>
            </CRow>

            {autoUpdate && (
              <CRow className="mb-4">
                <CCol xs={12} md={6}>
                  <label htmlFor="status-timeout" className="form-label">
                    Set status to "Away" after inactivity (minutes)
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="status-timeout"
                    min="1"
                    max="60" 
                    value={statusTimeout}
                    onChange={(e) => setStatusTimeout(e.target.value)}
                  />
                </CCol>
              </CRow>
            )}

            <div className="d-flex justify-content-end">
              <CButton color="primary" type="submit">
                Save Settings
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default UserActivitySettings;
