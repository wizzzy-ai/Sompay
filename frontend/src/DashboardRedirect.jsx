import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.roles && user.roles.includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.roles && user.roles.includes('company')) {
        navigate('/company/dashboard', { replace: true });
      } else if (!user.companyId) {
        navigate('/app/select-company', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardRedirect;
