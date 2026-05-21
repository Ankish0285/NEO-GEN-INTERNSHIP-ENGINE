import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveStoryImageUrl } from '../utils/resolveStoryImageUrl';
import defaultLogo from '../assets/images/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { branding } = settings;
  const logoSrc = branding.logoUrl
    ? resolveStoryImageUrl(branding.logoUrl) || branding.logoUrl
    : defaultLogo;
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  const handleNavClick = (section) => {
    setIsMenuOpen(false);
    
    if (location.pathname !== '/') {
      // Navigate to home first, then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home, just scroll
      const element = document.querySelector(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'neo-navbar--scrolled' : ''}`}>
        <div className="container flex justify-between items-center">
          <div className="navbar-brand">
            <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px', textDecoration: 'none'}}>
              <img src={logoSrc} alt="Site logo" className="brand-logo-img" style={{width:'48px', height:'48px', flexShrink:0, objectFit:'contain'}} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultLogo; }} />
              <div className="brand-text">
                <h2 className="brand-name" style={{marginBottom: 0}}>
                  <span className="neo-text" style={{ color: branding.primaryColor }}>{branding.brandNameLine1}</span>{' '}
                  <span className="gen-text" style={{ color: branding.secondaryColor }}>{branding.brandNameLine2}</span>
                </h2>
                <p className="brand-subtitle" style={{marginTop: '2px'}}>{branding.brandSubtitle}</p>
              </div>
            </Link>
          </div>

          <button 
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`} 
            id="navbarToggle" 
            aria-label="Toggle navigation" 
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#111827' }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} id="navbarMenu">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`} 
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <a 
              href="#about-section" 
              className="nav-link" 
              onClick={(e) => { 
                e.preventDefault(); 
                handleNavClick('#about-section'); 
              }}
            >
              About
            </a>
            <a 
              href="#internships-section" 
              className="nav-link" 
              onClick={(e) => { 
                e.preventDefault(); 
                handleNavClick('#internships-section'); 
              }}
            >
              Internships
            </a>
            <a 
              href="#resources-section" 
              className="nav-link" 
              onClick={(e) => { 
                e.preventDefault(); 
                handleNavClick('#resources-section'); 
              }}
            >
              Resources
            </a>
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className="nav-link" 
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <a 
              href="#contact-section" 
              className="nav-link" 
              onClick={(e) => { 
                e.preventDefault(); 
                handleNavClick('#contact-section'); 
              }}
            >
              Contact
            </a>
          </div>

          <div className="navbar-auth">
            {!isAuthenticated ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="neo-btn neo-btn-primary" 
                  id="loginBtn" 
                  onClick={() => navigate('/login')}
                >
                  Sign Up / Login
                </button>
              </div>
            ) : (
              <div className="user-profile-dropdown" id="userProfile" style={{ position: 'relative' }}>
                <button 
                  className="user-profile-btn" 
                  id="profileMenuBtn" 
                  onClick={toggleProfileDropdown}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '50px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'}
                >
                  {(() => {
                    const raw = typeof user?.profilePicture === 'string' ? user.profilePicture.trim() : '';
                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.fullName || 'User')}&background=random`;
                    if (!raw || raw.startsWith('blob:')) {
                      return (
                    <div 
                      className="user-avatar-placeholder"
                      style={{
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: '2px solid #15803d'
                      }}
                    >
                      {(user?.name || user?.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                      );
                    }
                    return (
                    <img 
                      className="user-avatar" 
                      id="userAvatar" 
                      src={resolveStoryImageUrl(raw) || fallback} 
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }}
                      style={{
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #16a34a'
                      }}
                    />
                    );
                  })()}
                  <span className="user-name" id="userName" style={{ fontWeight: '500', color: '#374151' }}>{user?.name || user?.fullName || 'User'}</span>
                  <ChevronDown size={16} color="#6b7280" />
                </button>
                <div className={`dropdown-menu ${isProfileDropdownOpen ? '' : 'hidden'}`} id="profileMenu"
                  style={{
                    display: isProfileDropdownOpen ? 'block' : 'none',
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    backgroundColor: 'white',
                    minWidth: '220px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    borderRadius: '12px',
                    padding: '8px',
                    zIndex: 1000,
                    border: '1px solid #f3f4f6'
                  }}
                >
                  <Link 
                    to="/dashboard" 
                    className="dropdown-item" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      color: '#374151',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                      fontSize: '0.95rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LayoutDashboard size={18} color="#4b5563" /> Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    className="dropdown-item" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      color: '#374151',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                      fontSize: '0.95rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserIcon size={18} color="#4b5563" /> Profile
                  </Link>
                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }}></div>
                  <button 
                    onClick={handleLogout} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      color: '#dc2626',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                      fontSize: '0.95rem',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={18} color="#dc2626" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
