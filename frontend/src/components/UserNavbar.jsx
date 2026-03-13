import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { User, LayoutDashboard, CreditCard, MessageSquare, Settings, Bell, ChevronDown, LogOut, Building2 } from 'lucide-react';

import { useAuth } from '../AuthContext';
import './UserNavbar.css';

const UserNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = user?.companyId
    ? [
        { path: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/app/payments', label: 'Payment', icon: <CreditCard size={18} /> },
        { path: '/app/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
        { path: '/app/settings', label: 'Settings', icon: <Settings size={18} /> },
        { path: '/app/notifications', label: 'Notifications', icon: <Bell size={18} /> },
      ]
    : [
        { path: '/app/select-company', label: 'Select Company', icon: <Building2 size={18} /> },
        { path: '/app/settings', label: 'Settings', icon: <Settings size={18} /> },
        { path: '/app/notifications', label: 'Notifications', icon: <Bell size={18} /> },
      ];

  const isActive = (path) => location.pathname === path;
  const userName = user?.name || 'User';
  const userInitial = userName.trim().charAt(0).toUpperCase();

  return (
    <nav className={`user-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/app/profile" className="navbar-logo">
            <div className="logo-mark">{userInitial}</div>
            <div className="logo-wrapper">
              <span className="logo-text">Sompay</span>
              <span className="logo-subtitle">Client Portal</span>
            </div>
          </Link>

          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions" ref={dropdownRef}>
            <button
              className="user-dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User menu"
            >
              <span className="user-avatar">{userInitial}</span>
              <span className="user-name">{userName}</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <Link to="/app/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <User size={16} />
                  Profile
                </Link>
                <Link to="/app/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  className="dropdown-item logout-btn"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

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

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-user">
              <span className="mobile-user-avatar">{userInitial}</span>
              <div className="mobile-user-text">
                <strong>{userName}</strong>
                <span>Signed in</span>
              </div>
            </div>
            <div className="mobile-menu-links">
              {navLinks.map((link) => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
            <div className="mobile-menu-actions">
              <button
                className="btn-nav-secondary w-100"
                onClick={() => {
                  logout();
                  navigate('/');
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default UserNavbar;
