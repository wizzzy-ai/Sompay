import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';
import { useAuth } from '../AuthContext';
import './AdminLogin.css';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const CompanyLogin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/auth/company/login', data);
      setAccessToken(r.data.accessToken);
      login(r.data.accessToken, r.data.user);
      navigate('/company/dashboard', { replace: true });
    } catch (e) {
      const errorMsg = e.response?.data?.error || 'Company login failed';
      setError(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-back">
        <Link to="/" className="admin-login-back-btn">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon-wrapper">
            <Building2 size={40} className="admin-login-icon" />
          </div>
          <h1>Company Login</h1>
          <p>Sign in to access your company workspace</p>
        </div>

        {error && (
          <div className="admin-login-alert admin-login-alert-error">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="admin-login-form">
          <div className="admin-login-form-group">
            <label htmlFor="email" className="admin-login-label">Email Address</label>
            <div className="admin-login-input-wrapper">
              <input
                type="email"
                id="email"
                placeholder="company@example.com"
                className={`admin-login-input ${errors.email ? 'admin-login-input-error' : ''}`}
                {...register('email')}
              />
              <Mail size={20} className="admin-login-input-icon" />
            </div>
            {errors.email && (
              <div className="admin-login-error-message">
                <AlertCircle size={14} />
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="admin-login-form-group">
            <label htmlFor="password" className="admin-login-label">Password</label>
            <div className="admin-login-input-wrapper">
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                className={`admin-login-input ${errors.password ? 'admin-login-input-error' : ''}`}
                {...register('password')}
              />
              <Lock size={20} className="admin-login-input-icon" />
            </div>
            {errors.password && (
              <div className="admin-login-error-message">
                <AlertCircle size={14} />
                {errors.password.message}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="admin-login-submit">
            {loading && <span className="admin-login-spinner"></span>}
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default CompanyLogin;
