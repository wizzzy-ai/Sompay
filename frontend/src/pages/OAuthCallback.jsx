import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Loading from '../components/Loading';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const user = urlParams.get('user');

      if (token && user) {
        try {
          const userData = JSON.parse(decodeURIComponent(user));
          login(token, userData);

          // Redirect based on role
          if (userData.roles && userData.roles.includes('admin')) {
            navigate('/admin/dashboard');
          } else {
            navigate('/app/profile');
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate, login]);

  return <Loading />;
};

export default OAuthCallback;
