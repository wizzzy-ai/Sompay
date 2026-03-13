import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';
import './VerifyOtp.css';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
});

const VerifyOtp = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');

  useEffect(() => {
    const emailFromState = location.state?.email || '';
    const emailFromParams = new URLSearchParams(location.search).get('email') || '';
    const emailFromStorage = sessionStorage.getItem('pendingVerifyEmail') || '';
    const resolvedEmail = emailFromState || emailFromParams || emailFromStorage;

    if (resolvedEmail) {
      setEmail(resolvedEmail);
      setValue('email', resolvedEmail, { shouldValidate: true });
    }
  }, [location.state, location.search, setValue]);

  // OTP input refs
  const otpRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let r;
      try {
        r = await api.post('/auth/verify', data);
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          r = await api.post('/api/auth/verify', data);
        } else {
          throw e;
        }
      }
      setAccessToken(r.data.accessToken);
      sessionStorage.setItem('token', r.data.accessToken);
      sessionStorage.removeItem('pendingVerifyEmail');
      setSuccess('Account verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (e) {
      if (axios.isAxiosError(e) && e.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Check your internet/DevTools offline mode and backend status.');
      } else {
        setError(e.response?.data?.error || 'Verification failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    // Update the OTP value
    const currentOtp = otpRefs.current.map(ref => ref?.value || '').join('');
    const newOtp = currentOtp.split('');
    newOtp[index] = value;
    const finalOtp = newOtp.join('');
    setValue('otp', finalOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpRefs.current[index].value && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      pastedData.split('').forEach((digit, index) => {
        if (otpRefs.current[index]) {
          otpRefs.current[index].value = digit;
        }
      });
      setValue('otp', pastedData);
      if (pastedData.length === 6) {
        otpRefs.current[5]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      try {
        await api.post('/auth/resend-otp', { email });
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          await api.post('/api/auth/resend-otp', { email });
        } else {
          throw e;
        }
      }
      setSuccess('A new OTP has been sent to your email.');
      setCountdown(60); // 60 second cooldown
    } catch (e) {
      if (axios.isAxiosError(e) && e.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Check your internet/DevTools offline mode and backend status.');
      } else {
        setError(e.response?.data?.error || 'Failed to resend OTP');
      }
    }
    setResendLoading(false);
  };

  return (
    <div className="verify-otp-page">
      {/* Animated Background */}
      <div className="verify-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="container">
        <div className="verify-container">
          {/* Left Side - Illustration/Info */}
          <motion.div 
            className="verify-info"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="info-content">
              <motion.div 
                className="shield-icon-wrapper"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <ShieldCheck size={80} strokeWidth={1.5} />
              </motion.div>
              <h2 className="info-title">Secure Verification</h2>
              <p className="info-description">
                We've sent a 6-digit verification code to your email address. 
                Please enter it below to verify your account and complete the registration process.
              </p>
              <div className="security-features">
                <div className="feature-item">
                  <CheckCircle size={20} />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={20} />
                  <span>One-time use code</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={20} />
                  <span>Expires in 10 minutes</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - OTP Form */}
          <motion.div 
            className="verify-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/register" className="back-link">
              <ArrowLeft size={20} />
              <span>Back to Register</span>
            </Link>

            <div className="card-header">
              <div className="mail-icon-wrapper">
                <Mail size={48} strokeWidth={1.5} />
              </div>
              <h1 className="card-title">Verify Your Email</h1>
              <p className="card-subtitle">
                Enter the verification code sent to
              </p>
              {email && (
                <p className="email-display">{email}</p>
              )}
            </div>

            {/* Alert Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  className="alert alert-danger d-flex align-items-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={20} className="me-2" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  className="alert alert-success d-flex align-items-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CheckCircle size={20} className="me-2" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Hidden email input for form validation */}
              <input
                type="hidden"
                {...register('email')}
              />

              {!email && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEmail(next);
                      setValue('email', next, { shouldValidate: true });
                    }}
                    placeholder="Enter your email"
                    className="form-control"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="error-message" style={{ marginTop: '0.5rem' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>
              )}

              {/* OTP Input Boxes */}
              <div className="otp-section">
                <label className="otp-label">Enter OTP Code</label>
                <div className="otp-input-container" onPaste={handlePaste}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <motion.input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      className="otp-input"
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="error-message">{errors.otp.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="btn verify-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} className="me-2" />
                    Verify Account
                  </>
                )}
              </motion.button>
            </form>

            {/* Resend Section */}
            <div className="resend-section">
              <p className="resend-text">Didn't receive the code?</p>
              <motion.button
                onClick={handleResendOtp}
                className="resend-btn"
                disabled={resendLoading || countdown > 0}
                whileHover={{ scale: countdown > 0 ? 1 : 1.05 }}
                whileTap={{ scale: countdown > 0 ? 1 : 0.95 }}
              >
                {resendLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>Resend in {countdown}s</>
                ) : (
                  <>
                    <RefreshCw size={16} className="me-2" />
                    Resend Code
                  </>
                )}
              </motion.button>
            </div>

            {/* Help Text */}
            <div className="help-section">
              <p className="help-text">
                Need help? <Link to="/contact" className="help-link">Contact Support</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
