import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import axios from '../api/axios';
import './CompanyVerify.css';

const OtpVerify = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Determine verification type based on current path
  const isCompanyVerify = location.pathname === '/company-verify';

  useEffect(() => {
    // Get email from location state or URL params
    const emailFromState = location.state?.email;
    const emailFromParams = new URLSearchParams(location.search).get('email');
    const emailFromStorage = isCompanyVerify
      ? sessionStorage.getItem('pendingCompanyVerifyEmail')
      : sessionStorage.getItem('pendingAdminVerifyEmail');

    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromParams) {
      setEmail(emailFromParams);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      setError(`No email found. Please ${isCompanyVerify ? 'register' : 'login'} again.`);
    }
  }, [location, isCompanyVerify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isCompanyVerify ? '/admin/verify-company-otp' : '/admin/admins/verify-otp';

      await axios.post(endpoint, {
        email,
        otp: otp.trim()
      });

      setSuccess('Account verified successfully! Redirecting to login...');
      setTimeout(() => {
        if (isCompanyVerify) {
          sessionStorage.removeItem('pendingCompanyVerifyEmail');
        } else {
          sessionStorage.removeItem('pendingAdminVerifyEmail');
        }
        navigate(isCompanyVerify ? '/company-login' : '/admin-login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isCompanyVerify ? '/admin/register-company' : '/auth/admin/resend-otp';

      await axios.post(endpoint, {
        email,
        ...(isCompanyVerify && { resendOtp: true })
      });
      setSuccess('Verification code sent successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        {/* Icon */}
        <div className="verify-icon-wrapper">
          <ShieldCheck size={40} className="verify-icon" />
        </div>

        {/* Header */}
        <h2>Verify Your Account</h2>
        <p>
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="btn-spinner"></span>}
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        {/* Resend Section */}
        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleResendOtp}
            disabled={resendLoading}
          >
            {resendLoading && <span className="btn-spinner"></span>}
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
