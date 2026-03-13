import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const baseNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' },
  ];

  const navLinks = isLoggedIn ? [...baseNavLinks, { path: '/dashboard', label: 'Dashboard' }] : baseNavLinks;

  const isActive = (path) => location.pathname === path;
  const userName = user?.name || 'User';
  const userInitial = userName.trim().charAt(0).toUpperCase();

  return (
    <nav className={`public-navbar ${isScrolled ? 'public-navbar-scrolled' : ''}`}>
      <div className="container">
        <div className="public-navbar-content">
          <Link to="/" className="public-navbar-logo">
            <span className="public-logo-mark">S</span>
            <div className="public-logo-wrapper">
              <span className="public-logo-text">Sompay</span>
              <span className="public-logo-badge">PSP</span>
            </div>
          </Link>

          <div className="public-navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`public-nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

	          <div className="public-navbar-actions">
	            {isLoggedIn && location.pathname !== '/login' && location.pathname !== '/admin-login' && location.pathname !== '/company-login' ? (
	              <button
	                className="public-btn-chip"
	                onClick={() => navigate(user?.roles?.includes('admin') ? '/admin/dashboard' : user?.roles?.includes('company') ? '/company/dashboard' : '/app/profile')}
	              >
                <span className="public-chip-avatar">{userInitial}</span>
                <span className="public-chip-text">{userName}</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="public-btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="public-btn-primary">
                  Get Started
                  <ArrowRight size={16} />
                </Link>
                <Link to="/company-register" className="public-btn-outline">
                  Register Company
                </Link>
              </>
            )}
          </div>

          <button
            className={`public-mobile-menu-toggle ${isMobileMenuOpen ? 'public-mobile-menu-open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="public-hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="public-mobile-menu show">
              <div className="public-mobile-menu-header">
                <span className="public-mobile-menu-title">Menu</span>
              </div>
              <div className="public-mobile-menu-links">
                {navLinks.map((link) => (
                  <div key={link.path}>
                    <Link
                      to={link.path}
                      className={`public-mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
              <div className="public-mobile-menu-actions">

            
                {isLoggedIn ? (
                  <>
                    <button
                      className="public-btn-chip w-100"
                      onClick={() => {
                        navigate(user?.roles?.includes('admin') ? '/admin/dashboard' : user?.roles?.includes('company') ? '/company/dashboard' : '/app/profile');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User size={18} />
                      Profile
                    </button>
                    <button
                      className="public-btn-primary w-100"
                      onClick={() => {
                        logout();
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut size={20} className="me-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="public-btn-secondary w-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="public-btn-primary w-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
