import React from 'react';
import PredictionHistory from '../components/history/PredictionHistory';

export default function HistoryPage() {
  return (
    <div className="history-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-header__title">Prediction History</h1>
          <p className="page-header__subtitle">Browse all past solar energy predictions</p>
        </div>
        <PredictionHistory />
      </div>
    </div>
  );
}
