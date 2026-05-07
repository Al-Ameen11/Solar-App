import React, { useState, useEffect } from 'react';
import { fetchModelMetrics } from '../../services/api';

export default function ModelMetrics({ prediction, financials }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const result = await fetchModelMetrics();
      if (result.status === 'ok' && result.modelVersion !== 'untrained') {
        setMetrics(result);
      }
    } catch (error) {
      // ML service might not be running
    }
    setLoading(false);
  };

  const getComparativeAnalysis = () => {
    if (!prediction || !financials) return null;
    const gridCostMonthly = prediction.monthlyOutput * financials.electricityRate;
    const solarCostMonthly = financials.maintenance?.yearlyMaintenance / 12 || 167;
    const savingsPercent = gridCostMonthly > 0
      ? ((gridCostMonthly - solarCostMonthly) / gridCostMonthly * 100)
      : 0;

    return {
      gridCostMonthly,
      solarCostMonthly,
      savingsPercent: Math.min(99, savingsPercent),
      co2PerMonth: financials.environmental?.co2OffsetMonthly || 0
    };
  };

  const comparison = getComparativeAnalysis();

  return (
    <div className="card animate-on-scroll" id="model-metrics">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">📈</span>
          <h2 className="card__title">Model & Comparison</h2>
        </div>
      </div>

      <div className="metrics-grid">
        {/* ML Model */}
        <div className="metrics-section">
          <h3 className="metrics-section__title">🤖 ML Model Performance</h3>
          {loading ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : metrics ? (
            <div className="metrics-cards">
              <MetricCard label="Model Version" value={metrics.modelVersion} color="#3B82F6" />
              <MetricCard label="Status" value={metrics.ready ? '✅ Ready' : '⚠️ Loading'} color={metrics.ready ? '#22C55E' : '#F59E0B'} />
            </div>
          ) : (
            <div className="metrics-fallback">
              <p>🔌 ML service not connected. Using physics-based prediction model.</p>
              <code>uvicorn app:app --port 8000</code>
            </div>
          )}
        </div>

        {/* Solar vs Grid */}
        {comparison && (
          <div className="metrics-section">
            <h3 className="metrics-section__title">⚡ Solar vs Grid</h3>
            <div className="metrics-cards">
              <MetricCard label="Grid Cost/Month" value={`₹${comparison.gridCostMonthly.toLocaleString()}`} color="#EF4444" sub="Without solar" />
              <MetricCard label="Solar Cost/Month" value={`₹${Math.round(comparison.solarCostMonthly).toLocaleString()}`} color="#22C55E" sub="Maintenance only" />
              <MetricCard label="You Save" value={`${comparison.savingsPercent.toFixed(0)}%`} color="#F59E0B" sub="Monthly savings rate" />
              <MetricCard label="CO₂ Offset" value={`${comparison.co2PerMonth} kg`} color="#3B82F6" sub="per month" />
            </div>
          </div>
        )}
      </div>

      <div className="metrics-note">
        ℹ️ Estimates based on current weather. Actual output depends on panel orientation, shading, and maintenance.
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div className="metric-chip">
      <div className="metric-chip__label">{label}</div>
      <div className="metric-chip__value" style={{ color }}>{value}</div>
      {sub && <div className="metric-chip__sub">{sub}</div>}
    </div>
  );
}
