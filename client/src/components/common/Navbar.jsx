import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Navbar() {
  const { user, handleLogout, setShowAuth, hasResults } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/history', label: 'History', icon: '📜' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" id="navbar-logo">
          <div className="navbar__logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="8" fill="url(#sunGrad)" />
              <g stroke="url(#sunGrad)" strokeWidth="2" strokeLinecap="round">
                <line x1="14" y1="1" x2="14" y2="4" />
                <line x1="14" y1="24" x2="14" y2="27" />
                <line x1="1" y1="14" x2="4" y2="14" />
                <line x1="24" y1="14" x2="27" y2="14" />
                <line x1="4.8" y1="4.8" x2="6.9" y2="6.9" />
                <line x1="21.1" y1="21.1" x2="23.2" y2="23.2" />
                <line x1="4.8" y1="23.2" x2="6.9" y2="21.1" />
                <line x1="21.1" y1="6.9" x2="23.2" y2="4.8" />
              </g>
              <defs>
                <linearGradient id="sunGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#F97316" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar__logo-text">SolarPredict</span>
        </Link>

        {/* Nav Links */}
        <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar__link ${isActive(link.path) ? 'navbar__link--active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="navbar__link-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="navbar__actions">
          {hasResults && location.pathname === '/' && (
            <button
              className="btn btn-sm btn-accent"
              onClick={() => navigate('/dashboard')}
            >
              View Results →
            </button>
          )}

          {user ? (
            <div className="navbar__user">
              <span className="navbar__user-badge">
                <span className="navbar__user-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                {user.name}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleLogout}
                id="logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm btn-accent"
              onClick={() => setShowAuth(true)}
              id="signin-btn"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>
    </nav>
  );
}
