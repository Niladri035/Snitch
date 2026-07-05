import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'

/**
 * SellerRoute — wraps any page that only sellers can access.
 *
 * Rules:
 *   • Not logged in  → redirect to /login
 *   • Logged in as buyer → redirect to / with a flash state so the
 *     home page can optionally show a toast
 *   • Logged in as seller → render children normally
 */
export default function SellerRoute({ children }) {
  const user     = useSelector(state => state.auth.user)
  const location = useLocation()

  if (!user) {
    // Not authenticated — go to login, remember where they came from
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'seller') {
    // Authenticated but not a seller
    return (
      <Navigate
        to="/"
        state={{ accessDenied: true, message: 'Only seller accounts can access this page.' }}
        replace
      />
    )
  }

  return children
}
