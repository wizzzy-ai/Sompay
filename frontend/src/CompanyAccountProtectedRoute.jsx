import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const CompanyAccountProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/company-login" state={{ from: location.pathname }} replace />;
  }

  if (!user.roles || !user.roles.includes('company')) {
    const redirectPath = user.roles?.includes('admin') ? '/admin/dashboard' : '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default CompanyAccountProtectedRoute;

