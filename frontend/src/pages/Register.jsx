import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import './Register.css';

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      };

      try {
        await api.post('/auth/register', payload);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await api.post('/api/auth/register', payload);
        } else {
          throw error;
        }
      }

      setSuccess(true);
      reset();
      sessionStorage.setItem('pendingVerifyEmail', data.email);
      // Redirect to OTP verification
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`, { state: { email: data.email } });
      }, 500);
    } catch (error) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Please confirm the backend is running.');
      } else {
        console.error('Unexpected registration error:', error);
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="container">
        <div className="register-container">
          <motion.div
            className="register-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="success-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="success-content"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <motion.div
                      className="success-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle size={64} />
                    </motion.div>
                    <h2>Registration Successful!</h2>
                    <p>Welcome to Sompay! Your account has been created successfully.</p>
                    <p className="redirect-text">Redirecting to OTP verification...</p>
                    <div className="success-animation">
                      <div className="spinner"></div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="register-header">
              <h1>Create Account</h1>
              <p>Join Sompay and start accepting payments today</p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="alert alert-danger"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="register-form">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <User size={18} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="Enter your full name"
                  {...register('name')}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name.message}</div>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Enter your email"
                  {...register('email')}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock size={18} />
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Create a strong password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase & one lowercase letter</li>
                    <li>One number & one special character</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Re-enter your password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="register-info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>Why Choose Sompay?</h2>
            <div className="info-features">
              <div className="info-feature">
                <div className="feature-icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4>Secure & Reliable</h4>
                  <p>Bank-level security with PCI compliance</p>
                </div>
              </div>
              <div className="info-feature">
                <div className="feature-icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4>Fast Processing</h4>
                  <p>Lightning-fast payment processing</p>
                </div>
              </div>
              <div className="info-feature">
                <div className="feature-icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4>Global Reach</h4>
                  <p>Accept payments from 180+ countries</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
