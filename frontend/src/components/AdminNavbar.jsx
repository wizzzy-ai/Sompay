import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, Users, CreditCard, MessageCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

		  const navLinks = [
		    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
		    { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
		    { path: '/admin/companies', label: 'Companies', icon: <Building2 size={18} /> },
		    { path: '/admin/payments', label: 'Payments', icon: <CreditCard size={18} /> },
		    { path: '/admin/messages', label: 'Messages', icon: <MessageCircle size={18} /> },
		  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className={`admin-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/admin/dashboard" className="navbar-logo">
            <motion.div
              className="logo-wrapper"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="logo-text">Sompay</span>
              <span className="logo-badge">ADMIN</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.icon}
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    className="nav-link-underline"
                    layoutId="underline"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            ))}
          </div>



          {/* Auth Buttons */}
          <div className="navbar-actions">
            <button
              className="btn-nav-secondary"
              onClick={() => navigate('/admin/dashboard')}
            >
              <User size={20} className="me-2" />
              Admin
            </button>
            <button
              className="btn-nav-primary"
              onClick={() => {
                logout();
                navigate('/admin-login');
              }}
            >
              <LogOut size={20} className="me-2" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-menu-links">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mobile-menu-actions">
                <button
                  className="btn-nav-secondary w-100"
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <User size={20} className="me-2" />
                  Admin
                </button>
                <button
                  className="btn-nav-primary w-100"
                  onClick={() => {
                    logout();
                    navigate('/admin-login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={20} className="me-2" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default AdminNavbar;
