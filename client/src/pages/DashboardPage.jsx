import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LocationInput from '../components/prediction/LocationInput';
import WeatherCard from '../components/prediction/WeatherCard';
import EnergyGauge from '../components/prediction/EnergyGauge';
import PredictionChart from '../components/prediction/PredictionChart';
import FinancialAnalysis from '../components/financial/FinancialAnalysis';
import SubsidyInfo from '../components/financial/SubsidyInfo';
import ModelMetrics from '../components/financial/ModelMetrics';
import AIAdvisor from '../components/ai/AIAdvisor';
import ApplianceAlerts from '../components/ai/ApplianceAlerts';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'financials', label: 'Financials', icon: '💰' },
  { id: 'advisor', label: 'AI Advisor', icon: '🤖' },
  { id: 'model', label: 'Analytics', icon: '📈' },
];

export default function DashboardPage() {
  const { weatherData, predictionData, forecastData, financialData, panelCapacity, selectedState, loading } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // If no data and not loading, prompt user
  if (!weatherData && !loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <LocationInput />
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div className="empty-state__icon">🌞</div>
            <h3>No Prediction Yet</h3>
            <p>Enter a city above to see your solar energy analysis, or</p>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
              ← Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        {/* Search bar */}
        <LocationInput />

        {/* Loading */}
        {loading && (
          <div className="dashboard__loading">
            <div className="dashboard__grid">
              <div className="dashboard__col-8"><LoadingSkeleton variant="card" /></div>
              <div className="dashboard__col-4"><LoadingSkeleton variant="gauge" /></div>
            </div>
            <LoadingSkeleton variant="chart" />
          </div>
        )}

        {weatherData && !loading && (
          <>
            {/* Summary bar */}
            <div className="summary-bar">
              <div className="summary-bar__item">
                <span className="summary-bar__value">{predictionData?.dailyOutput} kWh</span>
                <span className="summary-bar__label">Daily Output</span>
              </div>
              <div className="summary-bar__divider" />
              <div className="summary-bar__item">
                <span className="summary-bar__value">{predictionData?.efficiency}%</span>
                <span className="summary-bar__label">Efficiency</span>
              </div>
              <div className="summary-bar__divider" />
              <div className="summary-bar__item">
                <span className="summary-bar__value">{predictionData?.peakHours}h</span>
                <span className="summary-bar__label">Peak Hours</span>
              </div>
              <div className="summary-bar__divider" />
              <div className="summary-bar__item">
                <span className="summary-bar__value summary-bar__value--green">
                  {financialData?.savings?.monthly ? `₹${financialData.savings.monthly.toLocaleString()}` : '—'}
                </span>
                <span className="summary-bar__label">Monthly Savings</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-nav" id="dashboard-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-nav__item ${activeTab === tab.id ? 'tab-nav__item--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-nav__icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="tab-panel">
                  <div className="dashboard__grid">
                    <div className="dashboard__col-8">
                      <WeatherCard weather={weatherData} />
                    </div>
                    <div className="dashboard__col-4">
                      <EnergyGauge prediction={predictionData} panelCapacity={panelCapacity} />
                    </div>
                  </div>
                  <PredictionChart forecast={forecastData} />
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="tab-panel">
                  <FinancialAnalysis financials={financialData} prediction={predictionData} />
                  <SubsidyInfo state={selectedState} panelCapacity={panelCapacity} />
                </div>
              )}

              {activeTab === 'advisor' && (
                <div className="tab-panel">
                  <div className="dashboard__grid dashboard__grid--equal">
                    <AIAdvisor predictionData={predictionData} financialData={financialData} weatherData={weatherData} />
                    <ApplianceAlerts predictionData={predictionData} weatherData={weatherData} forecastData={forecastData} />
                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="tab-panel">
                  <ModelMetrics prediction={predictionData} financials={financialData} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
