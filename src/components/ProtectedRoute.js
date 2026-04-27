import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import PropTypes from 'prop-types'

const TOKEN_KEY = 'authToken'

const isTokenValid = (token) => {
  if (!token) return false
  try {
    const decoded = jwtDecode(token)
    if (!decoded || typeof decoded.exp !== 'number') return false
    // 30-second buffer covers clock skew without keeping near-expired tokens
    // alive long enough to fire a write that the server will then reject.
    return decoded.exp > Date.now() / 1000 + 30
  } catch {
    return false
  }
}

const ProtectedRoute = ({ element: Element }) => {
  const navigate = useNavigate()
  // Synchronous initial check — render <Navigate> immediately if the token
  // is missing or expired, so we never paint a single frame of authenticated
  // UI to an unauthenticated user.
  const [authorized, setAuthorized] = useState(() => isTokenValid(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    const checkToken = () => {
      const valid = isTokenValid(localStorage.getItem(TOKEN_KEY))
      if (!valid) {
        localStorage.removeItem(TOKEN_KEY)
        setAuthorized(false)
        navigate('/', { replace: true })
      }
    }

    // Re-check on tab focus and on storage events (other tabs logging out).
    const onVisibility = () => {
      if (!document.hidden) checkToken()
    }
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) checkToken()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('storage', onStorage)
    const intervalId = setInterval(checkToken, 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
      clearInterval(intervalId)
    }
  }, [navigate])

  if (!authorized) return <Navigate to="/" replace />
  return <Element />
}

ProtectedRoute.propTypes = {
  element: PropTypes.elementType.isRequired,
}

export default ProtectedRoute
