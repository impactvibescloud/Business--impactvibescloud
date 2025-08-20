import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTabContent,
  CTabPane,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react';
import TicketForm from './TicketForm';
import TicketList from './TicketList';
import './Ticket.scss';

const TicketDashboard = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <CCard className="ticket-dashboard">
      <CCardBody>
        <CNav variant="tabs" role="tablist">
          <CNavItem role="presentation">
            <CNavLink
              active={activeTab === 1}
              onClick={() => setActiveTab(1)}
              role="tab"
            >
              Tickets List
            </CNavLink>
          </CNavItem>
          <CNavItem role="presentation">
            <CNavLink
              active={activeTab === 2}
              onClick={() => setActiveTab(2)}
              role="tab"
            >
              Create Ticket
            </CNavLink>
          </CNavItem>
        </CNav>
        <CTabContent>
          <CTabPane role="tabpanel" visible={activeTab === 1} className="py-3">
            <CRow>
              <CCol>
                <TicketList />
              </CCol>
            </CRow>
          </CTabPane>
          <CTabPane role="tabpanel" visible={activeTab === 2} className="py-3">
            <CRow>
              <CCol>
                <TicketForm 
                  onSuccess={() => {
                    // Switch to list view after successful ticket creation
                    setActiveTab(1);
                  }}
                />
              </CCol>
            </CRow>
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  );
};

export default TicketDashboard;
