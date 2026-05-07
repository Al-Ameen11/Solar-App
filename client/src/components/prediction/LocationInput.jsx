import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LocationInput() {
  const { handleSearch, loading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [city, setCity] = useState('');
  const [panelCapacity, setPanelCapacity] = useState(5);
  const [state, setState] = useState('default');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (city.trim()) {
      await handleSearch(city.trim(), panelCapacity, state, monthlyBill ? parseFloat(monthlyBill) : 0);
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="search-card" id="location-input-section">
      <form onSubmit={handleSubmit}>
        <div className="search-card__main">
          <div className="search-card__input-wrap">
            <svg className="search-card__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-card__input"
              id="city-input"
              placeholder="Enter city name (e.g., Mumbai, Delhi, Bangalore)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-glow"
            id="predict-button"
            disabled={loading || !city.trim()}
          >
            {loading ? (
              <><span className="spinner spinner--sm" /> Analyzing...</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Predict Solar Energy
              </>
            )}
          </button>
        </div>

        {/* Toggle config */}
        <button
          type="button"
          className="search-card__config-toggle"
          onClick={() => setShowConfig(!showConfig)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {showConfig ? 'Hide' : 'Show'} Panel Configuration
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showConfig ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Config panel */}
        <div className={`search-card__config ${showConfig ? 'search-card__config--open' : ''}`}>
          <div className="search-card__config-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="panel-capacity">Panel Capacity (kW)</label>
              <input
                type="number"
                className="form-input"
                id="panel-capacity"
                min="1"
                max="20"
                step="0.5"
                value={panelCapacity}
                onChange={(e) => setPanelCapacity(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="state-select">State / Region</label>
              <select
                className="form-input"
                id="state-select"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="default">Select State</option>
                <option value="maharashtra">Maharashtra</option>
                <option value="delhi">Delhi</option>
                <option value="karnataka">Karnataka</option>
                <option value="tamilnadu">Tamil Nadu</option>
                <option value="rajasthan">Rajasthan</option>
                <option value="gujarat">Gujarat</option>
                <option value="kerala">Kerala</option>
                <option value="andhra">Andhra Pradesh</option>
                <option value="telangana">Telangana</option>
                <option value="westbengal">West Bengal</option>
                <option value="up">Uttar Pradesh</option>
                <option value="punjab">Punjab</option>
                <option value="madhyapradesh">Madhya Pradesh</option>
                <option value="bihar">Bihar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="monthly-bill">
                Monthly Bill (₹) <span className="form-hint">Optional</span>
              </label>
              <input
                type="number"
                className="form-input"
                id="monthly-bill"
                min="0"
                max="100000"
                step="100"
                placeholder="e.g. 3000"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
