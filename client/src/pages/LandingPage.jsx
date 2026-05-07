import React from 'react';
import { useNavigate } from 'react-router-dom';
import LocationInput from '../components/prediction/LocationInput';
import { useApp } from '../context/AppContext';

const features = [
  { icon: '⚡', title: 'Solar Prediction', desc: 'ML-powered energy output prediction based on real-time weather data' },
  { icon: '💰', title: 'Financial Analysis', desc: 'ROI calculations, savings projections, and installation cost breakdowns' },
  { icon: '🤖', title: 'AI Advisor', desc: 'Google Gemini-powered Q&A for personalized solar guidance' },
  { icon: '🔔', title: 'Smart Scheduling', desc: 'Optimal appliance usage timing based on solar output' },
  { icon: '🏛️', title: 'Govt. Subsidies', desc: 'PM Surya Ghar scheme calculations for your state' },
  { icon: '📊', title: 'Forecast & History', desc: 'Multi-day forecasts and prediction history tracking' },
];

const steps = [
  { num: '01', title: 'Enter Your City', desc: 'Type any city name and configure your solar panel capacity' },
  { num: '02', title: 'Get Predictions', desc: 'Our ML model analyzes weather data to predict energy output' },
  { num: '03', title: 'Make Decisions', desc: 'View financials, get AI advice, and plan your solar investment' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { hasResults } = useApp();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="hero__badge">☀️ Weather-Based Solar Energy Prediction</div>
          <h1 className="hero__title">
            Predict Your <span className="hero__title--gradient">Solar Energy</span> Potential
          </h1>
          <p className="hero__subtitle">
            AI-powered predictions, financial analysis, and smart recommendations — everything you need to go solar.
          </p>

          <div className="hero__search">
            <LocationInput />
          </div>

          {hasResults && (
            <button className="btn btn-primary btn-glow hero__cta" onClick={() => navigate('/dashboard')}>
              View Your Results →
            </button>
          )}

          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-value">9</div>
              <div className="hero__stat-label">ML Features</div>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <div className="hero__stat-value">14</div>
              <div className="hero__stat-label">Indian States</div>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <div className="hero__stat-value">5-Day</div>
              <div className="hero__stat-label">Forecast</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="steps-section" id="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Three simple steps to your solar energy analysis</p>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div className="step-card animate-on-scroll" key={i}>
              <div className="step-card__num">{step.num}</div>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__desc">{step.desc}</p>
              {i < steps.length - 1 && <div className="step-card__arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">Everything you need for solar energy decision making</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card animate-on-scroll" key={i}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to Go Solar?</h2>
          <p>Enter your city above and discover your solar energy potential today.</p>
        </div>
      </section>
    </div>
  );
}
