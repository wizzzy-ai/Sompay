import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api/axios';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Chrome,
  Github,
  Fingerprint
} from 'lucide-react';
import './Login.css';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError('You appear to be offline. Disable DevTools “Offline” and check your network, then try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let r;
      try {
        r = await api.post('/auth/login', data);
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          r = await api.post('/api/auth/login', data);
        } else {
          throw e;
        }
      }
      login(r.data.accessToken, r.data.user);

      // Redirect based on role
      if (r.data.user.roles && r.data.user.roles.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/profile');
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Check internet/DevTools offline mode and ensure backend is running on port 5000.');
      } else {
        const errorMsg = e.response?.data?.error || 'Login failed';
        if (errorMsg === 'Account not verified') {
          navigate('/verify-otp', { state: { email: data.email } });
        } else {
          setError(errorMsg);
        }
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const base = api.defaults.baseURL || 'http://localhost:5000';
    window.location.href = `${base}/auth/google`;
  };

  const handleGithubLogin = () => {
    const base = api.defaults.baseURL || 'http://localhost:5000';
    window.location.href = `${base}/auth/github`;
  };

  return (
    <div className="login-page">
      {/* Animated Background Elements */}
      <div className="background-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="grid-pattern"></div>
        <div className="gradient-overlay"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Header Section */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-inner">
                <Fingerprint size={32} />
                <div className="logo-pulse"></div>
              </div>
            </div>
            
            <div className="header-content">
              <h1>Welcome Back</h1>
            </div>

            {/* Security Indicators */}
            <div className="security-indicators">
              <div className="security-item">
                <Shield size={16} />
                <span>256-bit Encryption</span>
              </div>
              <div className="security-item">
                <Zap size={16} />
                <span>Instant Access</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <Mail size={18} />
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'input-error' : ''} ${watchedEmail ? 'input-filled' : ''}`}
                  placeholder="Enter your email"
                  {...register('email')}
                />
                <div className="input-border"></div>
                {watchedEmail && !errors.email && (
                  <div className="input-success">
                    <CheckCircle size={16} />
                  </div>
                )}
              </div>
              {errors.email && (
                <div className="field-error">
                  <AlertCircle size={14} />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <Lock size={18} />
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input ${errors.password ? 'input-error' : ''} ${watchedPassword ? 'input-filled' : ''}`}
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <div className="input-border"></div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {watchedPassword && !errors.password && (
                  <div className="input-success">
                    <CheckCircle size={16} />
                  </div>
                )}
              </div>
              {errors.password && (
                <div className="field-error">
                  <AlertCircle size={14} />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <a href="/forgot-password" className="forgot-password">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              <span className="button-content">
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="button-icon" />
                  </>
                )}
              </span>
              <div className="button-glow"></div>
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>Or continue with</span>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <button className="social-button google" onClick={handleGoogleLogin}>
              <Chrome size={20} />
              <span>Google</span>
            </button>
            <button className="social-button github" onClick={handleGithubLogin}>
              <Github size={20} />
              <span>GitHub</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="signup-link">
            <span>Don't have an account?</span>
            <a href="/register">Create Account</a>
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <div className="trust-icon">
                <Shield size={16} />
              </div>
              <div className="trust-content">
                <div className="trust-title">Bank-Level Security</div>
                <div className="trust-subtitle">Your data is protected</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <Zap size={16} />
              </div>
              <div className="trust-content">
                <div className="trust-title">Lightning Fast</div>
                <div className="trust-subtitle">Instant authentication</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
