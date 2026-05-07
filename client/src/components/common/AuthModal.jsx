import React, { useState } from 'react';
import { loginUser, registerUser } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AuthModal() {
  const { setShowAuth, handleLogin } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await registerUser(name, email, password);
      } else {
        result = await loginUser(email, password);
      }

      if (result.success) {
        handleLogin(result.data.user, result.data.token);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  const onClose = () => setShowAuth(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title-group">
            <div className="modal__icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="modal__subtitle">
          {isRegister
            ? 'Join SolarPredict to save your predictions'
            : 'Sign in to access your prediction history'}
        </p>

        <form onSubmit={handleSubmit} className="modal__form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Name</label>
              <input
                type="text"
                className="form-input"
                id="auth-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              type="email"
              className="form-input"
              id="auth-email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              type="password"
              className="form-input"
              id="auth-password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="form-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <><span className="spinner spinner--sm" /> Please wait...</>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>

          <p className="modal__switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="modal__switch-btn"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
            >
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
