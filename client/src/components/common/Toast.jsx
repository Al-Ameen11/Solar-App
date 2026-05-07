import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      default: return 'ℹ';
    }
  };

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className={`toast__icon toast__icon--${toast.type}`}>
            {getIcon(toast.type)}
          </div>
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
          <div
            className="toast__progress"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      ))}
    </div>
  );
}
