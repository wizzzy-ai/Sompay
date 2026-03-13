import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const CompanyProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user?.companyId) {
    return <Navigate to="/app/select-company" state={{ from: location }} replace />;
  }

  return children;
};

export default CompanyProtectedRoute;

