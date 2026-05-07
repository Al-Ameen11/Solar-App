import React, { useState, useEffect } from 'react';
import { fetchApplianceAlerts } from '../../services/api';

export default function ApplianceAlerts({ predictionData, weatherData, forecastData }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (predictionData && weatherData) loadAlerts();
  }, [predictionData, weatherData]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await fetchApplianceAlerts(predictionData, weatherData, forecastData || []);
      setAlerts(result.data.alerts || []);
    } catch {
      setAlerts([
        { appliance: '🧺 Washing Machine', bestTime: '10:00 AM - 12:00 PM', reason: 'High power — run during peak solar', powerConsumption: '500-2000W', priority: 'high' },
        { appliance: '❄️ Air Conditioner', bestTime: '10:00 AM - 3:00 PM', reason: 'Pre-cool using solar power', powerConsumption: '1000-2500W', priority: 'high' },
        { appliance: '🔌 Iron', bestTime: '11:00 AM - 1:00 PM', reason: 'High wattage — use during peak', powerConsumption: '1000-2000W', priority: 'medium' },
        { appliance: '💧 Water Heater', bestTime: '10:00 AM - 12:00 PM', reason: 'Heat water during peak output', powerConsumption: '1500-3000W', priority: 'high' },
      ]);
    }
    setLoading(false);
  };

  if (!predictionData) return null;
  const priorityColors = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

  return (
    <div className="card animate-on-scroll" id="appliance-alerts">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">🔔</span>
          <h2 className="card__title">Smart Scheduling</h2>
        </div>
        <span className="badge badge--green">Auto-optimized</span>
      </div>
      {loading ? (
        <div className="loading-center"><span className="spinner" /> Optimizing...</div>
      ) : (
        <div className="alerts-timeline">
          {alerts.map((alert, i) => (
            <div className="alert-card" key={i}>
              <div className="alert-card__indicator" style={{ background: priorityColors[alert.priority] || '#F59E0B' }} />
              <div className="alert-card__content">
                <div className="alert-card__header">
                  <span className="alert-card__appliance">{alert.appliance}</span>
                  <span className="alert-card__power">{alert.powerConsumption}</span>
                </div>
                <div className="alert-card__time">⏰ {alert.bestTime}</div>
                <div className="alert-card__reason">{alert.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
