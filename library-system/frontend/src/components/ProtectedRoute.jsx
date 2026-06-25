import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

/**
 * Gate a route behind authentication (and optionally an admin role).
 * Redirects to /login (preserving the intended destination) or home.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
