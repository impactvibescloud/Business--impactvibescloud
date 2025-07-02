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
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CTooltip,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPlus, cilOptions, cilPencil, cilTrash, cilUser, cilSettings, cilX } from '@coreui/icons'
import './UsersTeams.css'

function UsersTeams() {
  const [activeTab, setActiveTab] = useState('Users')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('Role')
  const [licenseFilter, setLicenseFilter] = useState('License')
  const [statusFilter, setStatusFilter] = useState('Status')
  const [teamFilter, setTeamFilter] = useState('Team')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Modal states
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])
  
  // Team modal states
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [newTeamMember, setNewTeamMember] = useState('')
  
  // Invite user modal states
  const [showInviteUserModal, setShowInviteUserModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteVirtualNumber, setInviteVirtualNumber] = useState('')

  // Sample data for Users
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

  // Sample data for Teams
  const teams = [
    {
      id: 1,
      name: 'Sales Team',
      virtualNumber: '+1 234 567 8901',
      members: ['John Smith', 'Michael Davis', 'Sarah Wilson']
    },
    {
      id: 2,
      name: 'Support Team',
      virtualNumber: '+1 234 567 8902',
      members: ['Emily Johnson', 'Michael Davis', 'David Brown']
    },
    {
      id: 3,
      name: 'Marketing Team',
      virtualNumber: '+1 234 567 8903',
      members: ['Jennifer Lee', 'Robert Miller']
    }
  ]

  // Sample data for Roles
  const roles = [
    {
      id: 1,
      name: 'Admin',
      type: 'System',
      description: 'Full system access with all privileges',
      users: ['John Smith']
    },
    {
      id: 2,
      name: 'Agent',
      type: 'Custom',
      description: 'Can manage calls and customer interactions',
      users: ['Emily Johnson', 'David Brown']
    },
    {
      id: 3,
      name: 'Manager',
      type: 'Custom',
      description: 'Can manage teams and view reports',
      users: ['Michael Davis', 'Sarah Wilson']
    }
  ]

  // Available permissions for roles
  const availablePermissions = [
    { id: 1, name: 'View and manage calls' },
    { id: 2, name: 'View and manage teams' },
    { id: 3, name: 'View and manage users' },
    { id: 4, name: 'View and manage reports' },
    { id: 5, name: 'Admin access' }
  ]

  // Handle permission selection
  const handlePermissionChange = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission))
    } else {
      setSelectedPermissions([...selectedPermissions, permission])
    }
  }

  // Handle role creation
  const handleCreateRole = () => {
    if (newRoleName.trim()) {
      // In a real app, you would save this to your backend
      const newRole = {
        id: roles.length + 1,
        name: newRoleName,
        type: 'Custom',
        description: `Role with ${selectedPermissions.length} permissions`,
        users: []
      }
      
      // Reset form and close modal
      setNewRoleName('')
      setSelectedPermissions([])
      setShowCreateRoleModal(false)
    }
  }

  // Handle adding a team member
  const handleAddTeamMember = () => {
    if (newTeamMember.trim() && !teamMembers.includes(newTeamMember.trim())) {
      setTeamMembers([...teamMembers, newTeamMember.trim()])
      setNewTeamMember('')
    }
  }

  // Handle removing a team member
  const handleRemoveTeamMember = (member) => {
    setTeamMembers(teamMembers.filter(m => m !== member))
  }

  // Handle team creation
  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      // In a real app, you would save this to your backend
      const newTeam = {
        id: teams.length + 1,
        name: newTeamName,
        virtualNumber: `+1 ${Math.floor(100000000 + Math.random() * 900000000)}`,
        members: teamMembers
      }
      
      // Reset form and close modal
      setNewTeamName('')
      setTeamMembers([])
      setShowCreateTeamModal(false)
    }
  }

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

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    team.virtualNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.members.some(member => member.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    role.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.users.some(user => user.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleClearAll = () => {
    setSearchTerm('')
    setRoleFilter('Role')
    setLicenseFilter('License')
    setStatusFilter('Status')
    setTeamFilter('Team')
  }

  const tabs = ['Users', 'Teams', 'Roles']

  // Render different controls based on active tab
  const renderTabControls = () => {
    if (activeTab === 'Users') {
      return (
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
            <CButton 
              className="invite-user-btn"
              onClick={() => setShowInviteUserModal(true)}
            >
              <CIcon icon={cilPlus} className="me-1" />
              Invite user
            </CButton>
          </CCol>
        </CRow>
      )
    } else if (activeTab === 'Teams') {
      return (
        <CRow className="align-items-center mb-3">
          <CCol md={8}>
            <CButton
              color="link"
              className="clear-all-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear all
            </CButton>
          </CCol>
          <CCol md={4} className="text-end">
            <CButton className="create-btn" onClick={() => setShowCreateTeamModal(true)}>
              <CIcon icon={cilPlus} className="me-1" />
              Create Team
            </CButton>
          </CCol>
        </CRow>
      )
    } else if (activeTab === 'Roles') {
      return (
        <CRow className="align-items-center mb-3">
          <CCol md={8}>
            <CButton
              color="link"
              className="clear-all-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear all
            </CButton>
          </CCol>
          <CCol md={4} className="text-end">
            <CButton className="create-btn" onClick={() => setShowCreateRoleModal(true)}>
              <CIcon icon={cilPlus} className="me-1" />
              Create Role
            </CButton>
          </CCol>
        </CRow>
      )
    }
  }

  // Render table content based on active tab
  const renderTableContent = () => {
    if (activeTab === 'Users') {
      return (
        <>
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
        </>
      )
    } else if (activeTab === 'Teams') {
      return (
        <>
          <CTableHead className="table-header">
            <CTableRow>
              <CTableHeaderCell className="table-header-cell">
                TEAM NAME
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell">
                VIRTUAL NUMBER
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell">
                MEMBERS
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell text-center">
                ACTION
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filteredTeams.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan="4" className="empty-state">
                  <div className="empty-content">
                    <div className="empty-text">No teams found</div>
                  </div>
                </CTableDataCell>
              </CTableRow>
            ) : (
              filteredTeams.map((team) => (
                <CTableRow key={team.id} className="table-row">
                  <CTableDataCell className="table-cell">
                    <div className="team-name">{team.name}</div>
                  </CTableDataCell>
                  <CTableDataCell className="table-cell">
                    {team.virtualNumber}
                  </CTableDataCell>
                  <CTableDataCell className="table-cell">
                    <div className="team-members">
                      {team.members.map((member, index) => (
                        <span key={index} className="member-badge">
                          {member}
                          {index < team.members.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell className="table-cell text-center">
                    <div className="action-buttons">
                      <CButton color="light" size="sm" className="action-btn edit-btn me-2">
                        <CIcon icon={cilPencil} size="sm" />
                      </CButton>
                      <CButton color="light" size="sm" className="action-btn delete-btn">
                        <CIcon icon={cilTrash} size="sm" />
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </>
      )
    } else if (activeTab === 'Roles') {
      return (
        <>
          <CTableHead className="table-header">
            <CTableRow>
              <CTableHeaderCell className="table-header-cell">
                NAME
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell">
                TYPE
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell">
                DESCRIPTION
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell">
                USERS
              </CTableHeaderCell>
              <CTableHeaderCell className="table-header-cell text-center">
                ACTION
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filteredRoles.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan="5" className="empty-state">
                  <div className="empty-content">
                    <div className="empty-text">No roles found</div>
                  </div>
                </CTableDataCell>
              </CTableRow>
            ) : (
              filteredRoles.map((role) => (
                <CTableRow key={role.id} className="table-row">
                  <CTableDataCell className="table-cell">
                    <div className="role-name">{role.name}</div>
                  </CTableDataCell>
                  <CTableDataCell className="table-cell">
                    <span className={`role-type role-type-${role.type.toLowerCase()}`}>
                      {role.type}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell className="table-cell">
                    {role.description}
                  </CTableDataCell>
                  <CTableDataCell className="table-cell">
                    <div className="role-users">
                      {role.users.map((user, index) => (
                        <span key={index} className="user-badge">
                          {user}
                          {index < role.users.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell className="table-cell text-center">
                    <div className="action-buttons">
                      <CButton color="light" size="sm" className="action-btn edit-btn me-2">
                        <CIcon icon={cilPencil} size="sm" />
                      </CButton>
                      <CButton color="light" size="sm" className="action-btn delete-btn">
                        <CIcon icon={cilTrash} size="sm" />
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </>
      )
    }
  }

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
              {activeTab === 'Users' && (
                <div className="license-info-section">
                  <div className="license-info">
                    {/* License information removed as requested */}
                  </div>
                </div>
              )}

              <div className="controls-section">
                {renderTabControls()}

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
                      {renderTableContent()}
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
                          {activeTab === 'Users' && filteredUsers.length > 0 ? 
                            `1-${filteredUsers.length} of ${filteredUsers.length}` : 
                            activeTab === 'Teams' && filteredTeams.length > 0 ?
                            `1-${filteredTeams.length} of ${filteredTeams.length}` :
                            activeTab === 'Roles' && filteredRoles.length > 0 ?
                            `1-${filteredRoles.length} of ${filteredRoles.length}` :
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

      {/* Create Role Modal */}
      <CModal 
        alignment="center" 
        visible={showCreateRoleModal} 
        onClose={() => setShowCreateRoleModal(false)}
        className="create-role-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Create role</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <label htmlFor="roleName" className="modal-label">Role name</label>
            <CFormInput
              id="roleName"
              placeholder="Enter role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="modal-label d-block mb-2">Permissions</label>
            <div className="permissions-list">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="permission-item">
                  <CFormCheck 
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions.includes(permission.name)}
                    onChange={() => handlePermissionChange(permission.name)}
                    label={permission.name}
                  />
                </div>
              ))}
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="link" 
            className="cancel-btn"
            onClick={() => setShowCreateRoleModal(false)}
          >
            Cancel
          </CButton>
          <CButton 
            color="success" 
            className="save-btn"
            onClick={handleCreateRole}
            disabled={!newRoleName.trim()}
          >
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Create Team Modal */}
      <CModal 
        alignment="center" 
        visible={showCreateTeamModal} 
        onClose={() => setShowCreateTeamModal(false)}
        className="create-team-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Create team</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <label htmlFor="teamName" className="modal-label">Team name</label>
            <CFormInput
              id="teamName"
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="modal-label d-block mb-2">Team members ({teamMembers.length})</label>
            <CFormInput
              type="text"
              placeholder="Enter name to add user"
              value={newTeamMember}
              onChange={(e) => setNewTeamMember(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
              className="mb-3"
            />
            
            <div className="team-members-container">
              {teamMembers.length === 0 ? (
                <div className="no-members-message">No team members yet</div>
              ) : (
                teamMembers.map((member, index) => (
                  <div key={index} className="member-item">
                    <span className="member-name">{member}</span>
                    <CButton
                      color="light"
                      size="sm"
                      className="remove-member-btn"
                      onClick={() => handleRemoveTeamMember(member)}
                    >
                      <CIcon icon={cilX} size="sm" />
                    </CButton>
                  </div>
                ))
              )}
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="link" 
            className="cancel-btn"
            onClick={() => setShowCreateTeamModal(false)}
          >
            Cancel
          </CButton>
          <CButton 
            color="success" 
            className="save-btn"
            onClick={handleCreateTeam}
            disabled={!newTeamName.trim() || teamMembers.length === 0}
          >
            Save
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Invite User Modal */}
      <CModal 
        alignment="center" 
        visible={showInviteUserModal} 
        onClose={() => setShowInviteUserModal(false)}
        className="invite-user-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Invite user</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <CFormInput
              type="email"
              placeholder="Enter email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Role</label>
            <CFormSelect
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="">Select roles</option>
              <option value="Admin">Admin</option>
              <option value="Agent">Agent</option>
              <option value="Manager">Manager</option>
            </CFormSelect>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Virtual number</label>
            <CFormSelect
              value={inviteVirtualNumber}
              onChange={(e) => setInviteVirtualNumber(e.target.value)}
            >
              <option value="">Select number</option>
              <option value="+1 234 567 8901">+1 234 567 8901</option>
              <option value="+1 234 567 8902">+1 234 567 8902</option>
              <option value="+1 234 567 8903">+1 234 567 8903</option>
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter className="justify-content-between">
          <CButton 
            color="light" 
            onClick={() => setShowInviteUserModal(false)}
            className="cancel-btn"
          >
            Cancel
          </CButton>
          <CButton 
            color="success"
            onClick={() => {
              // Handle invite user logic here
              setShowInviteUserModal(false);
              setInviteEmail('');
              setInviteRole('');
              setInviteVirtualNumber('');
            }}
            className="invite-btn"
          >
            Invite
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default UsersTeams
