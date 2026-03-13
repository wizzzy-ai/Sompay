import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-column">
              <div className="footer-logo">
                <span className="logo-text">Sompay</span>
                <span className="logo-badge">PSP</span>
              </div>
              <p className="footer-description">
                Secure, fast, and reliable payment solutions for modern businesses. 
                Trusted by thousands of companies worldwide.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <Github size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h3 className="footer-title">Company</h3>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="#">Careers</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="footer-column">
              <h3 className="footer-title">Resources</h3>
              <ul className="footer-links">
                <li><Link to="#">Documentation</Link></li>
                <li><Link to="#">API Reference</Link></li>
                <li><Link to="#">Support</Link></li>
                <li><Link to="#">Blog</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-column">
              <h3 className="footer-title">Contact Us</h3>
              <ul className="footer-contact">
                <li>
                  <Mail size={18} />
                  <span>support@sompay.com</span>
                </li>
                <li>
                  <Phone size={18} />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li>
                  <MapPin size={18} />
                  <span>123 Payment St, Finance City</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} Sompay. All rights reserved.
            </p>
            <div className="footer-legal">
              <Link to="#">Privacy Policy</Link>
              <Link to="#">Terms of Service</Link>
              <Link to="#">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;