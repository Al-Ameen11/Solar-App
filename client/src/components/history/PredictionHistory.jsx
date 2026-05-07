import React, { useState, useEffect } from 'react';
import { fetchHistory } from '../../services/api';

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => { loadHistory(); }, [page, searchCity]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * 10;
      const result = await fetchHistory(searchCity, 10, skip);
      if (result.success) {
        setPredictions(result.data.predictions || []);
        setTotal(result.data.total || 0);
      }
    } catch { setPredictions([]); }
    setLoading(false);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatCurrency = (val) => {
    if (!val) return '—';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="card" id="prediction-history">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">📜</span>
          <h2 className="card__title">Prediction History</h2>
        </div>
        <span className="badge badge--amber">{total} Records</span>
      </div>

      <div className="history-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" className="form-input" placeholder="Filter by city..." value={searchCity} onChange={(e) => { setSearchCity(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner" /> Loading history...</div>
      ) : predictions.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">📊</div><p>No prediction history yet.</p></div>
      ) : (
        <>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th><th>City</th><th>Panel</th><th>Output</th><th>Efficiency</th><th>Savings</th><th>Weather</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={p._id || i}>
                    <td>{formatDate(p.createdAt)}</td>
                    <td><strong>{p.city}</strong> {p.country && <span className="text-muted">{p.country}</span>}</td>
                    <td>{p.panelCapacity} kW</td>
                    <td><span className="text-amber">{p.prediction?.dailyOutput?.toFixed(1) || '—'} kWh</span></td>
                    <td>{p.prediction?.efficiency || '—'}%</td>
                    <td><span className="text-green">{formatCurrency(p.financial?.monthlySavings)}</span></td>
                    <td>{p.weatherData?.temperature?.toFixed(0)}°C, {p.weatherData?.cloudCover}%☁️</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="pagination__info">Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
