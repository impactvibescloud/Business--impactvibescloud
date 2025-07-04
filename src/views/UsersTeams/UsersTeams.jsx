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
  CFormCheck,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPlus, cilPencil, cilTrash, cilUser, cilSettings, cilX, cilCloudDownload } from '@coreui/icons'
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
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [roleSuccessMessage, setRoleSuccessMessage] = useState('')
  
  // Team modal states
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamVirtualNumber, setNewTeamVirtualNumber] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [newTeamMember, setNewTeamMember] = useState('')
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)
  
  // Invite user modal states
  const [showInviteUserModal, setShowInviteUserModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteVirtualNumber, setInviteVirtualNumber] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Success message for team creation
  const [teamSuccessMessage, setTeamSuccessMessage] = useState('')

  // Sample data for Users
  const [users, setUsers] = useState([
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
  ])

  // Sample data for Teams
  const [teams, setTeams] = useState([
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
  ])

  // Sample data for Roles - changed to useState
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Admin',
      type: 'System',
      description: 'Full system access with all privileges',
      users: ['John Smith'],
      permissions: ['View and manage calls', 'View and manage teams', 'View and manage users', 'View and manage reports', 'Admin access']
    },
    {
      id: 2,
      name: 'Agent',
      type: 'Custom',
      description: 'Can manage calls and customer interactions',
      users: ['Emily Johnson', 'David Brown'],
      permissions: ['View and manage calls']
    },
    {
      id: 3,
      name: 'Manager',
      type: 'Custom',
      description: 'Can manage teams and view reports',
      users: ['Michael Davis', 'Sarah Wilson'],
      permissions: ['View and manage teams', 'View and manage reports']
    }
  ])

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
      if (editingRoleId) {
        // If we're editing, update the existing role
        handleUpdateRole()
        return
      }
      
      // In a real app, you would save this to your backend
      const newRole = {
        id: roles.length + 1,
        name: newRoleName,
        type: 'Custom',
        description: `Role with ${selectedPermissions.length} permissions`,
        users: [],
        permissions: [...selectedPermissions]
      }
      
      // Add the new role to the state
      setRoles([...roles, newRole])
      
      // Show success message
      setRoleSuccessMessage(`Role "${newRoleName}" has been created successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setRoleSuccessMessage('')
      }, 3000)
      
      // Reset form and close modal
      resetRoleForm()
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
      if (editingTeamId) {
        // If we're editing, update the existing team
        handleUpdateTeam()
        return
      }
      
      // In a real app, you would save this to your backend
      const newTeam = {
        id: teams.length + 1,
        name: newTeamName,
        virtualNumber: newTeamVirtualNumber.trim() || `+1 ${Math.floor(100000000 + Math.random() * 900000000)}`,
        members: teamMembers
      }
      
      // Add the new team to the state
      setTeams([...teams, newTeam])
      
      // Show success message
      setTeamSuccessMessage(`Team "${newTeamName}" has been created successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTeamSuccessMessage('')
      }, 3000)
      
      // Reset form and close modal
      resetTeamForm()
    }
  }

  // Handle team editing
  const handleEditTeam = (teamId) => {
    const teamToEdit = teams.find(team => team.id === teamId)
    if (teamToEdit) {
      setEditingTeamId(teamId)
      setNewTeamName(teamToEdit.name)
      setNewTeamVirtualNumber(teamToEdit.virtualNumber)
      setTeamMembers([...teamToEdit.members])
      setShowCreateTeamModal(true)
    }
  }

  // Handle team update
  const handleUpdateTeam = () => {
    if (newTeamName.trim()) {
      const updatedTeams = teams.map(team => {
        if (team.id === editingTeamId) {
          return {
            ...team,
            name: newTeamName,
            virtualNumber: newTeamVirtualNumber.trim() || team.virtualNumber,
            members: teamMembers
          }
        }
        return team
      })
      
      // Update teams state
      setTeams(updatedTeams)
      
      // Show success message
      setTeamSuccessMessage(`Team "${newTeamName}" has been updated successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTeamSuccessMessage('')
      }, 3000)
      
      // Reset form and close modal
      resetTeamForm()
    }
  }

  // Reset team form
  const resetTeamForm = () => {
    setNewTeamName('')
    setNewTeamVirtualNumber('')
    setTeamMembers([])
    setEditingTeamId(null)
    setShowCreateTeamModal(false)
  }

  // Reset role form
  const resetRoleForm = () => {
    setNewRoleName('')
    setSelectedPermissions([])
    setEditingRoleId(null)
    setShowCreateRoleModal(false)
  }

  // Handle role editing
  const handleEditRole = (roleId) => {
    const roleToEdit = roles.find(role => role.id === roleId)
    if (roleToEdit) {
      setEditingRoleId(roleId)
      setNewRoleName(roleToEdit.name)
      setSelectedPermissions(roleToEdit.permissions || [])
      setShowCreateRoleModal(true)
    }
  }

  // Handle role update
  const handleUpdateRole = () => {
    if (newRoleName.trim()) {
      const updatedRoles = roles.map(role => {
        if (role.id === editingRoleId) {
          return {
            ...role,
            name: newRoleName,
            description: `Role with ${selectedPermissions.length} permissions`,
            permissions: [...selectedPermissions]
          }
        }
        return role
      })
      
      // Update roles state
      setRoles(updatedRoles)
      
      // Show success message
      setRoleSuccessMessage(`Role "${newRoleName}" has been updated successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setRoleSuccessMessage('')
      }, 3000)
      
      // Reset form and close modal
      resetRoleForm()
    }
  }

  // Handle team delete confirmation
  const handleDeleteConfirmation = (teamId) => {
    const teamToDelete = teams.find(team => team.id === teamId)
    if (teamToDelete) {
      setTeamToDelete(teamToDelete)
      setShowDeleteTeamModal(true)
    }
  }

  // Handle team deletion
  const handleDeleteTeam = () => {
    if (teamToDelete) {
      const updatedTeams = teams.filter(team => team.id !== teamToDelete.id)
      
      // Update teams state
      setTeams(updatedTeams)
      
      // Show success message
      setTeamSuccessMessage(`Team "${teamToDelete.name}" has been deleted successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTeamSuccessMessage('')
      }, 3000)
      
      // Reset and close modal
      setTeamToDelete(null)
      setShowDeleteTeamModal(false)
    }
  }

  // Handle role delete confirmation
  const handleDeleteRoleConfirmation = (roleId) => {
    const roleToDelete = roles.find(role => role.id === roleId)
    if (roleToDelete) {
      setRoleToDelete(roleToDelete)
      setShowDeleteRoleModal(true)
    }
  }

  // Handle role deletion
  const handleDeleteRole = () => {
    if (roleToDelete) {
      const updatedRoles = roles.filter(role => role.id !== roleToDelete.id)
      
      // Update roles state
      setRoles(updatedRoles)
      
      // Show success message
      setRoleSuccessMessage(`Role "${roleToDelete.name}" has been deleted successfully.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setRoleSuccessMessage('')
      }, 3000)
      
      // Reset and close modal
      setRoleToDelete(null)
      setShowDeleteRoleModal(false)
    }
  }

  // Handle inviting a new user
  const handleInviteUser = () => {
    // Basic validation
    if (!inviteEmail.trim() || !inviteRole) {
      return
    }
    
    // Create a new user object
    const newUser = {
      id: users.length + 1,
      name: inviteEmail.split('@')[0],  // Extract name from email as placeholder
      email: inviteEmail,
      status: 'Active',
      role: inviteRole,
      licenses: 'Professional', // Default license
      teams: 'None'  // Default team
    }
    
    // Add the user to the users array
    setUsers([...users, newUser])
    
    // Show success message
    setSuccessMessage(`User ${inviteEmail} has been invited successfully.`)
    
    // Reset form fields
    setInviteEmail('')
    setInviteRole('')
    setInviteVirtualNumber('')
    
    // Close the modal
    setShowInviteUserModal(false)
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 5000)
  }

  // Handle downloading user data as CSV
  const handleDownloadUsers = () => {
    // Get currently filtered users
    const dataToExport = filteredUsers
    
    // Create CSV header
    const headers = ['Name', 'Email', 'Status', 'Role', 'Licenses', 'Teams']
    
    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(user => [
        user.name,
        user.email,
        user.status,
        user.role,
        user.licenses,
        user.teams
      ].join(','))
    ]
    
    // Combine into CSV string
    const csvString = csvRows.join('\n')
    
    // Create a download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary link and click it to trigger download
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'users_export.csv')
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
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
              color="primary" 
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
          <CCol md={12} className="text-end">
            <CButton className="create-team-btn" onClick={() => setShowCreateTeamModal(true)}>
              <CIcon icon={cilPlus} className="me-1" />
              Create Team
            </CButton>
          </CCol>
        </CRow>
      )
    } else if (activeTab === 'Roles') {
      return (
        <CRow className="align-items-center mb-3">
          <CCol md={12} className="text-end">
            <CButton className="create-role-btn" onClick={() => setShowCreateRoleModal(true)}>
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
                      <CButton color="light" size="sm" className="action-btn edit-btn me-2" onClick={() => handleEditTeam(team.id)}>
                        <CIcon icon={cilPencil} size="sm" />
                      </CButton>
                      <CButton color="light" size="sm" className="action-btn delete-btn" onClick={() => handleDeleteConfirmation(team.id)}>
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
                    <div className="role-permissions">
                      {role.description}
                      <div className="permissions-list-small">
                        {role.permissions && role.permissions.map((permission, idx) => (
                          <span key={idx} className="permission-badge">
                            {permission}
                            {idx < role.permissions.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
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
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="action-btn edit-btn me-2"
                        onClick={() => handleEditRole(role.id)}
                        title="Edit role"
                      >
                        <CIcon icon={cilPencil} size="sm" />
                      </CButton>
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteRoleConfirmation(role.id)}
                        title="Delete role"
                      >
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
              {successMessage && (
                <CAlert color="success" dismissible onClose={() => setSuccessMessage('')}>
                  {successMessage}
                </CAlert>
              )}
              
              {teamSuccessMessage && (
                <CAlert color="success" dismissible onClose={() => setTeamSuccessMessage('')}>
                  {teamSuccessMessage}
                </CAlert>
              )}
              
              {roleSuccessMessage && (
                <CAlert color="success" dismissible onClose={() => setRoleSuccessMessage('')}>
                  {roleSuccessMessage}
                </CAlert>
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
                      <CButton 
                        color="light" 
                        className="download-btn"
                        onClick={handleDownloadUsers}
                        title="Download data"
                      >
                        <CIcon icon={cilCloudDownload} className="download-icon" />
                      </CButton>
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

                  <div className="table-footer">
                    <div className="rows-per-page">
                      <span className="rows-text">Rows per page:</span>
                      <CFormSelect
                        className="rows-select"
                        size="sm"
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </CFormSelect>
                    </div>
                    <div className="pagination-info">
                      {activeTab === 'Users' && filteredUsers.length > 0 ? 
                        `1-${filteredUsers.length} of ${filteredUsers.length}` : 
                        activeTab === 'Teams' && filteredTeams.length > 0 ?
                        `1-${filteredTeams.length} of ${filteredTeams.length}` :
                        activeTab === 'Roles' && filteredRoles.length > 0 ?
                        `1-${filteredRoles.length} of ${filteredRoles.length}` :
                        '0-0 of 0'
                      }
                    </div>
                    <div className="pagination-controls">
                      <button className="pagination-button" disabled>&lt;</button>
                      <button className="pagination-button" disabled>&gt;</button>
                    </div>
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
          <CModalTitle>{editingRoleId ? 'Edit role' : 'Create role'}</CModalTitle>
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
            onClick={resetRoleForm}
          >
            Cancel
          </CButton>
          <CButton 
            color="success" 
            className="save-btn"
            onClick={editingRoleId ? handleUpdateRole : handleCreateRole}
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
          <CModalTitle>{editingTeamId ? 'Edit team' : 'Create team'}</CModalTitle>
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
          
          <div className="mb-4">
            <label htmlFor="virtualNumber" className="modal-label">Virtual number</label>
            <CFormInput
              id="virtualNumber"
              placeholder="Enter virtual number (e.g., +1 234 567 8900)"
              value={newTeamVirtualNumber}
              onChange={(e) => setNewTeamVirtualNumber(e.target.value)}
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
            onClick={resetTeamForm}
          >
            Cancel
          </CButton>
          <CButton 
            color="success" 
            className="save-btn"
            onClick={editingTeamId ? handleUpdateTeam : handleCreateTeam}
            disabled={!newTeamName.trim()}
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
            color="primary"
            onClick={handleInviteUser}
            className="invite-btn"
            disabled={!inviteEmail.trim() || !inviteRole}
          >
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Team Confirmation Modal */}
      <CModal
        alignment="center"
        visible={showDeleteTeamModal}
        onClose={() => setShowDeleteTeamModal(false)}
        className="delete-team-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Delete team</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {teamToDelete && (
            <p>
              Are you sure you want to delete the team "{teamToDelete.name}"? This action cannot be undone.
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="light" 
            onClick={() => setShowDeleteTeamModal(false)}
            className="cancel-btn"
          >
            Cancel
          </CButton>
          <CButton 
            color="danger"
            onClick={handleDeleteTeam}
            className="delete-btn"
          >
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Role Confirmation Modal */}
      <CModal
        alignment="center"
        visible={showDeleteRoleModal}
        onClose={() => setShowDeleteRoleModal(false)}
        className="delete-role-modal"
      >
        <CModalHeader closeButton>
          <CModalTitle>Delete role</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {roleToDelete && (
            <p>
              Are you sure you want to delete the role "{roleToDelete.name}"? This action cannot be undone.
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="light" 
            onClick={() => setShowDeleteRoleModal(false)}
            className="cancel-btn"
          >
            Cancel
          </CButton>
          <CButton 
            color="danger"
            onClick={handleDeleteRole}
            className="delete-btn"
          >
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Success message toast */}
      {successMessage && (
        <div className="toast-container">
          <div className="toast-message">
            {successMessage}
          </div>
        </div>
      )}

      {/* Team Success message toast */}
      {teamSuccessMessage && (
        <div className="toast-container">
          <div className="toast-message">
            {teamSuccessMessage}
          </div>
        </div>
      )}

      {/* Role Success message toast */}
      {roleSuccessMessage && (
        <div className="toast-container">
          <div className="toast-message">
            {roleSuccessMessage}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersTeams
