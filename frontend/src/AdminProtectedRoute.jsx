import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Loading Admin Dashboard...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
	  }

	  if (!user) {
	    return <Navigate to="/admin-login" state={{ from: location.pathname }} replace />;
	  }

	  if (user.roles?.includes('company')) {
	    return <Navigate to="/company/dashboard" replace />;
	  }

	  if (!user.roles?.includes('admin')) {
	    return <Navigate to="/login" replace />;
	  }

	  return children;
};

export default AdminProtectedRoute;
