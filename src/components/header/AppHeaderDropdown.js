import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
  cilPencil,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import swal from 'sweetalert';

import userImage from './../../assets/images/avatars/1.jpeg'
import { Link } from 'react-router-dom'
// import { signout } from 'src/auth'
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';


const AppHeaderDropdown = () => {
  const [userData, setUserData] = useState()
  let history = useNavigate();
  const signout = async () => {
    localStorage.removeItem('authToken')
    swal("success!", "Logged Out", "success");
    history("/");
  }

  //for user image 

  const getUser = async () => {
    let token = localStorage.getItem("authToken");
    try {
      let response = await axios.get(`/api/v1/user/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success === true) {
        setUserData(response.data.user)

      }
    }
    catch (err) {

      console.log(err);
    };
  }


  useEffect(() => {
    getUser()
  }, [])

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        {/* {userData && userData ? <CAvatar src={userData.avatar.url} size="md" /> : */}
        <CAvatar src={userImage} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-light fw-semibold py-2">Account</CDropdownHeader>
        <CDropdownItem href="#">
          {/* <CIcon icon={cilBell} className="me-2" />
          Updates
          <CBadge color="info" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          <CBadge color="success" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilTask} className="me-2" />
          Tasks
          <CBadge color="danger" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilCommentSquare} className="me-2" />
          Comments
          <CBadge color="warning" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownHeader className="bg-light fw-semibold py-2">Settings</CDropdownHeader>
        <CDropdownItem href="#">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilCreditCard} className="me-2" />
          Payments
          <CBadge color="secondary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilFile} className="me-2" />
          Projects
          <CBadge color="primary" className="ms-2">
            42
          </CBadge> */}
        </CDropdownItem>
        {/* <CDropdownDivider /> */}
        <Link to='/profile/edit'>
          <CDropdownItem>
            <CIcon icon={cilUser} className="me-2" />
            Edit Profile
          </CDropdownItem>
        </Link>
        <Link to='/change_password'>
          <CDropdownItem>
            <CIcon icon={cilPencil} className="me-2" />
            Change Password
          </CDropdownItem>
        </Link>
        <CDropdownItem href="#">
          <CIcon icon={cilLockLocked} className="me-2" />
          <span onClick={signout} >Log Out</span>
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
