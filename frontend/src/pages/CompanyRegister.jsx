import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';
import './CompanyRegister.css';

const CompanyRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactPerson: '',
    phone: '',
    address: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        address: formData.address,
        description: formData.description
      };

      try {
        await api.post('/admin/register-company', payload);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await api.post('/api/admin/register-company', payload);
        } else {
          throw error;
        }
      }

      // Success - redirect to company verification page
      sessionStorage.setItem('pendingCompanyVerifyEmail', formData.email);
      navigate(`/company-verify?email=${encodeURIComponent(formData.email)}`, {
        state: { email: formData.email }
      });
    } catch (error) {
      if (error.response?.data?.details) {
        // Display specific validation errors
        setError(error.response.data.details.join(', '));
      } else if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Check internet/DevTools offline mode and backend status.');
      } else {
        setError(error.response?.data?.message || error.response?.data?.error || 'Failed to register company. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-register-container">
      <div className="company-register-card">
        {/* Header */}
        <div className="company-register-header">
          <div className="company-register-icon-wrapper">
            <Building2 size={36} className="company-register-icon" />
          </div>
          <h1>Company Registration</h1>
          <p>Create your company account to get started</p>
        </div>

        {/* Back Button */}
        <div className="company-register-back">
          <Link to="/" className="company-register-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="company-register-alert company-register-alert-error">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="company-register-form">
          {/* Company Name */}
          <div className="company-register-row">
            <div className="company-register-col-full">
              <div className="company-register-form-group">
                <label htmlFor="name" className="company-register-label">
                  Company Name<span className="company-register-required">*</span>
                </label>
                <div className="company-register-input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                    className="company-register-input"
                    required
                  />
                  <Building2 size={18} className="company-register-input-icon" />
                </div>
              </div>
            </div>
          </div>

          {/* Email & Contact Person */}
          <div className="company-register-row">
            <div className="company-register-form-group">
              <label htmlFor="email" className="company-register-label">
                Company Email<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  className="company-register-input"
                  required
                />
                <Mail size={18} className="company-register-input-icon" />
              </div>
            </div>

            <div className="company-register-form-group">
              <label htmlFor="contactPerson" className="company-register-label">
                Contact Person<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="company-register-input"
                  required
                />
                <User size={18} className="company-register-input-icon" />
              </div>
            </div>
          </div>

          {/* Phone & Address */}
          <div className="company-register-row">
            <div className="company-register-form-group">
              <label htmlFor="phone" className="company-register-label">
                Phone Number<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="company-register-input"
                  required
                />
                <Phone size={18} className="company-register-input-icon" />
              </div>
            </div>

            <div className="company-register-form-group">
              <label htmlFor="address" className="company-register-label">
                Company Address<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, city"
                  className="company-register-input"
                  required
                />
                <MapPin size={18} className="company-register-input-icon" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="company-register-row">
            <div className="company-register-col-full">
              <div className="company-register-form-group">
                <label htmlFor="description" className="company-register-label">
                  Company Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of your company (optional)"
                  className="company-register-textarea"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Password Fields */}
          <div className="company-register-row">
            <div className="company-register-form-group">
              <label htmlFor="password" className="company-register-label">
                Password<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="company-register-input"
                  required
                />
                <Lock size={18} className="company-register-input-icon" />
              </div>
              <small className="company-register-help">
                Use 6+ characters with at least one uppercase letter, one lowercase letter, and one number.
              </small>
            </div>

            <div className="company-register-form-group">
              <label htmlFor="confirmPassword" className="company-register-label">
                Confirm Password<span className="company-register-required">*</span>
              </label>
              <div className="company-register-input-wrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="company-register-input"
                  required
                />
                <Lock size={18} className="company-register-input-icon" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="company-register-submit">
            {loading && <span className="company-register-spinner"></span>}
            {loading ? 'Creating Account...' : 'Create Company Account'}
          </button>
        </form>

        {/* Footer */}
	        <div className="company-register-footer">
	          <p>
	            Already have a company account?{' '}
	            <Link to="/company-login" className="company-register-link">
	              Login
	            </Link>
	          </p>
	        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;
