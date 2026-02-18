import React, { useEffect, useState, useRef } from 'react'
import './CustomHeader.css'
import axios from 'axios'
import { isAutheticated, signout as doSignout } from 'src/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import routes from 'src/routes'
import { UserActivityStatus } from './index'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'

const CustomHeader = () => {
  const [initial, setInitial] = useState('U')
  const token = isAutheticated()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const toggleRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const getTitleFromRoutes = (pathname) => {
    if (!pathname) return null
    // find best matching route (longest match)
    let best = null
    for (const r of routes) {
      if (!r || !r.path) continue
      let routePath = r.path
      if (!routePath.startsWith('/')) routePath = '/' + routePath
      const segments = routePath.split('/').filter(Boolean).map(seg => {
        if (seg.startsWith(':')) return '([^/]+)'
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }).join('\\/')
      const pattern = '^\\/' + segments + '$'
      const re = new RegExp(pattern)
      if (re.test(pathname)) {
        if (!best || routePath.length > best.routePath.length) {
          best = { route: r, routePath }
        }
      }
    }
    if (best) return best.route.name || best.route.navName || null
    return null
  }

  const getDisplayTitle = (pathname) => {
    const fromRoutes = getTitleFromRoutes(pathname)
    if (fromRoutes) return fromRoutes
    // fallback: derive from last segment
    if (!pathname || pathname === '/' || pathname === '') return 'Home'
    const parts = pathname.split('/').filter(Boolean)
    let key = parts[parts.length - 1] || parts[0] || 'Home'
    key = key.replace(/[-_]/g, ' ')
    key = key.replace(/([a-z])([A-Z])/g, '$1 $2')
    key = key.replace(/\s+/g, ' ').trim()
    return key.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }

  useEffect(() => {
    let mounted = true
    async function fetchUser() {
      if (!token) return
      try {
        const res = await axios.get('/api/v1/user/details', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!mounted) return
        const u = res?.data?.user
        const name = u?.name || u?.fullName || u?.firstName || u?.email || ''
        if (name && name.length > 0) setInitial(name.trim().charAt(0).toUpperCase())
      } catch (err) {
        // ignore errors, keep default initial
      }
    }
    fetchUser()
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    function handleOutside(e) {
      if (!open) return
      if (menuRef.current && !menuRef.current.contains(e.target) && !toggleRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSignout = () => {
    localStorage.removeItem('authToken')
    // optional: clear other user data
    navigate('/')
  }

  return (
    <header className="jc-header" role="banner">
      <div className="jc-header-inner">
        <div className="jc-left">
          <button
            className="jc-icon-btn"
            aria-label="Toggle sidebar"
            onClick={() => {
              try { window.dispatchEvent(new Event('toggleSidebarCollapsed')) } catch (e) {}
            }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CIcon icon={cilMenu} />
          </button>
          <div className="jc-title">
            {getDisplayTitle(location?.pathname || '/')}
          </div>
        </div>
        <div className="jc-actions" style={{ position: 'relative' }}>
          <div
            className="jc-user-chip"
            aria-haspopup="menu"
            ref={toggleRef}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="jc-user-icon"><span className="jc-user-inner">{initial}</span></div>
          </div>

          <div
            ref={menuRef}
            className={`jc-dropdown-menu ${open ? 'open' : ''}`}
            role="menu"
            aria-hidden={!open}
          >
            {/* Render UserActivityStatus menu inline inside header dropdown */}
            <UserActivityStatus asMenu={true} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default CustomHeader
