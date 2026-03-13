import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setFormStatus('success');
      setIsLoading(false);
      setFormData({ name: '', email: '', message: '' });
    }, 2000);
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-card animate-fade-in">
        {/* Header Section */}
        <div className="contact-header">
          <div className="contact-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="title">Contact Us</h1>
          <p className="subtitle">
            Get in touch with our team for any inquiries or support. We're here to help you succeed.
          </p>
        </div>

        {/* Form Status Messages */}
        {formStatus === 'success' && (
          <div className="form-message success">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        {formStatus === 'error' && (
          <div className="form-message error">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Sorry, there was an error sending your message. Please try again.
          </div>
        )}

        {/* Contact Form */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group animate-fade-in">
            <label htmlFor="name" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="input-field"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group animate-fade-in">
            <label htmlFor="email" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-field"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group animate-fade-in">
            <label htmlFor="message" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              className="textarea-field"
              rows="5"
              placeholder="Tell us how we can help you..."
              value={formData.message}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            className={`submit-btn animate-fade-in ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {/* Contact Information */}
        <div className="contact-info">
          <h3>Other Ways to Reach Us</h3>
          <div className="contact-methods">
            <a href="tel:+1234567890" className="contact-method">
              <div className="contact-method-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="contact-method-info">
                <div className="contact-method-label">Phone</div>
                <div className="contact-method-value">+1 (234) 567-8900</div>
              </div>
            </a>

            <a href="mailto:support@company.com" className="contact-method">
              <div className="contact-method-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="contact-method-info">
                <div className="contact-method-label">Email</div>
                <div className="contact-method-value">support@company.com</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;