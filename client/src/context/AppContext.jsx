import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchPrediction } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [panelCapacity, setPanelCapacity] = useState(5);
  const [selectedState, setSelectedState] = useState('default');
  const [showAuth, setShowAuth] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('solar_user');
    return stored ? JSON.parse(stored) : null;
  });

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSearch = useCallback(async (city, capacity, state, monthlyBill = 0) => {
    setLoading(true);
    setError(null);
    setPanelCapacity(capacity);
    setSelectedState(state);

    try {
      const result = await fetchPrediction(city, capacity, state, monthlyBill);

      if (result.success) {
        setWeatherData(result.data.weather);
        setPredictionData(result.data.prediction);
        setForecastData(result.data.forecast);
        setFinancialData(result.data.financials);
        addToast(`Solar prediction for ${result.data.weather.city} is ready!`, 'success');
      } else {
        setError(result.error || 'Prediction failed');
        addToast(result.error || 'Prediction failed', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch prediction';
      setError(msg);
      addToast(msg, 'error');
    }

    setLoading(false);
  }, [addToast]);

  const handleLogin = useCallback((userData, token) => {
    setUser(userData);
    localStorage.setItem('solar_user', JSON.stringify(userData));
    localStorage.setItem('solar_token', token);
    setShowAuth(false);
    addToast(`Welcome back, ${userData.name}!`, 'success');
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('solar_user');
    localStorage.removeItem('solar_token');
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  const value = {
    // State
    loading,
    error,
    weatherData,
    predictionData,
    forecastData,
    financialData,
    panelCapacity,
    selectedState,
    user,
    showAuth,
    toasts,
    // Actions
    handleSearch,
    handleLogin,
    handleLogout,
    setShowAuth,
    addToast,
    removeToast,
    // Derived
    hasResults: !!weatherData && !loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
