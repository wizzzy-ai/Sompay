import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !user.roles?.includes(requiredRole)) {
    // Redirect to appropriate dashboard if role doesn't match
    const redirectPath = user.roles?.includes('admin')
      ? '/admin/dashboard'
      : user.roles?.includes('company')
        ? '/company/dashboard'
        : '/app/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
