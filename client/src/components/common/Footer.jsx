import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" id="app-footer">
      <div className="footer__accent-line" />
      <div className="footer__inner">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">☀️</span>
              <span className="footer__logo-text">SolarPredict</span>
            </div>
            <p className="footer__tagline">
              Weather-Based Solar Energy Prediction & Decision Support System
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h4 className="footer__heading">Quick Links</h4>
            <div className="footer__links">
              <Link to="/" className="footer__link">Home</Link>
              <Link to="/dashboard" className="footer__link">Dashboard</Link>
              <Link to="/history" className="footer__link">History</Link>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="footer__section">
            <h4 className="footer__heading">Powered By</h4>
            <div className="footer__tags">
              <span className="footer__tag">React</span>
              <span className="footer__tag">FastAPI</span>
              <span className="footer__tag">Random Forest</span>
              <span className="footer__tag">OpenWeather</span>
              <span className="footer__tag">Gemini AI</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>SolarPredict — Final Year Project • Built with ☀️</p>
        </div>
      </div>
    </footer>
  );
}
