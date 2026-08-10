import { Navigate } from 'react-router-dom';
import { isAuthenticated, getAuthUser } from '../utils/auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = getAuthUser();
  const effectiveRole = user?.role;
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/" replace />; // redirect to home if not authorized
  }
  
  return children;
}
