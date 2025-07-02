import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CFormInput,
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
  CPagination,
  CPaginationItem,
  CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPlus, cilOptions } from '@coreui/icons'
import './UsersTeams.css'

function UsersTeams() {
  const [activeTab, setActiveTab] = useState('Users')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('Role')
  const [licenseFilter, setLicenseFilter] = useState('License')
  const [statusFilter, setStatusFilter] = useState('Status')
  const [teamFilter, setTeamFilter] = useState('Team')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Sample data for demonstration
  const users = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@example.com',
      status: 'Active',
      role: 'Admin',
      licenses: 'Professional',
      teams: 'Sales'
    },
    {
      id: 2,
      name: 'Emily Johnson',
      email: 'emily.johnson@example.com',
      status: 'Active',
      role: 'Agent',
      licenses: 'Professional, Autodial',
      teams: 'Support'
    },
    {
      id: 3,
      name: 'Michael Davis',
      email: 'michael.davis@example.com',
      status: 'Inactive',
      role: 'Manager',
      licenses: 'Professional',
      teams: 'Sales, Support'
    }
  ]

  // Filter users based on search term and filters
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(user => 
      roleFilter === 'Role' || user.role === roleFilter
    )
    .filter(user => 
      licenseFilter === 'License' || user.licenses.includes(licenseFilter)
    )
    .filter(user => 
      statusFilter === 'Status' || user.status === statusFilter
    )
    .filter(user => 
      teamFilter === 'Team' || user.teams.includes(teamFilter)
    )

  const handleClearAll = () => {
    setSearchTerm('')
    setRoleFilter('Role')
    setLicenseFilter('License')
    setStatusFilter('Status')
    setTeamFilter('Team')
  }

  const tabs = ['Users', 'Teams', 'Roles']

  return (
    <div className="users-teams-container">
      <CRow>
        <CCol xs={12}>
          <div className="users-teams-content">
            <CNav variant="tabs" className="custom-tabs">
              {tabs.map((tab) => (
                <CNavItem key={tab}>
                  <CNavLink
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-link ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>

            <div className="tab-content">
              <div className="license-info-section">
                <div className="license-info">
                  <div className="license-item">
                    <span className="license-type">Professional plan: 5 licenses</span>
                    <span className="license-status">(3 assigned)</span>
                  </div>
                  <div className="license-item">
                    <span className="license-type">Autodial: 2 licenses</span>
                    <span className="license-status">(1 assigned)</span>
                  </div>
                </div>
                <CButton color="link" className="view-more-btn">
                  View more
                </CButton>
              </div>

              <div className="controls-section">
                <CRow className="align-items-center mb-3">
                  <CCol md={2}>
                    <CFormSelect
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Role">Role</option>
                      <option value="Admin">Admin</option>
                      <option value="Agent">Agent</option>
                      <option value="Manager">Manager</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={2}>
                    <CFormSelect
                      value={licenseFilter}
                      onChange={(e) => setLicenseFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="License">License</option>
                      <option value="Professional">Professional</option>
                      <option value="Autodial">Autodial</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={2}>
                    <CFormSelect
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Status">Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={2}>
                    <CFormSelect
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Team">Team</option>
                      <option value="Sales">Sales</option>
                      <option value="Support">Support</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={2}>
                    <CButton
                      color="link"
                      className="clear-all-btn"
                      onClick={handleClearAll}
                    >
                      Clear all
                    </CButton>
                  </CCol>
                  <CCol md={2} className="text-end">
                    <CButton className="invite-user-btn">
                      <CIcon icon={cilPlus} className="me-1" />
                      Invite user
                    </CButton>
                  </CCol>
                </CRow>

                <CRow className="align-items-center">
                  <CCol md={6}>
                    <div className="search-input-container">
                      <CIcon 
                        icon={cilSearch} 
                        className="search-icon"
                      />
                      <CFormInput
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                  </CCol>
                  <CCol md={6} className="text-end">
                    <div className="table-controls">
                      <CIcon icon={cilFilter} className="filter-icon" />
                      <CIcon icon={cilOptions} className="sort-icon" />
                    </div>
                  </CCol>
                </CRow>
              </div>

              <CCard className="users-table-card">
                <CCardBody className="p-0">
                  <div className="users-table-container">
                    <CTable className="mb-0">
                      <CTableHead className="table-header">
                        <CTableRow>
                          <CTableHeaderCell className="table-header-cell">
                            USER
                          </CTableHeaderCell>
                          <CTableHeaderCell className="table-header-cell text-center">
                            STATUS
                          </CTableHeaderCell>
                          <CTableHeaderCell className="table-header-cell text-center">
                            ROLE
                          </CTableHeaderCell>
                          <CTableHeaderCell className="table-header-cell text-center">
                            LICENSE(S)
                          </CTableHeaderCell>
                          <CTableHeaderCell className="table-header-cell text-center">
                            TEAMS
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {filteredUsers.length === 0 ? (
                          <CTableRow>
                            <CTableDataCell colSpan="5" className="empty-state">
                              <div className="empty-content">
                                <div className="empty-text">No users found</div>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <CTableRow key={user.id} className="table-row">
                              <CTableDataCell className="table-cell">
                                <div className="user-info">
                                  <span className="user-name">{user.name}</span>
                                  <span className="user-email">{user.email}</span>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell className="table-cell text-center">
                                <span className={`status-badge status-${user.status?.toLowerCase()}`}>
                                  {user.status}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell className="table-cell text-center">
                                {user.role}
                              </CTableDataCell>
                              <CTableDataCell className="table-cell text-center">
                                {user.licenses}
                              </CTableDataCell>
                              <CTableDataCell className="table-cell text-center">
                                {user.teams}
                              </CTableDataCell>
                            </CTableRow>
                          ))
                        )}
                      </CTableBody>
                    </CTable>
                  </div>

                  <div className="pagination-container">
                    <CRow className="align-items-center">
                      <CCol md={6}>
                        <div className="rows-per-page">
                          <span className="pagination-info">Rows per page:</span>
                          <CFormSelect
                            size="sm"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            style={{ width: 'auto' }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </CFormSelect>
                        </div>
                      </CCol>
                      <CCol md={6} className="text-end">
                        <span className="pagination-info me-3">
                          {filteredUsers.length > 0 ? 
                            `1-${filteredUsers.length} of ${filteredUsers.length}` : 
                            '0-0 of 0'
                          }
                        </span>
                      </CCol>
                    </CRow>
                  </div>
                </CCardBody>
              </CCard>
            </div>
          </div>
        </CCol>
      </CRow>
    </div>
  )
}

export default UsersTeams
