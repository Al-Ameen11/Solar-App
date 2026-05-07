import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('solar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Weather API
 */
export const fetchWeather = async (city) => {
  const response = await api.get(`/weather/${encodeURIComponent(city)}`);
  return response.data;
};

/**
 * Prediction API
 */
export const fetchPrediction = async (city, panelCapacity = 5, state = 'default', monthlyBill = 0) => {
  const response = await api.post('/predict', { city, panelCapacity, state, monthlyBill });
  return response.data;
};

/**
 * AI Advisor API
 */
export const fetchAdvice = async (predictionData, financialData, weatherData, question = '') => {
  const response = await api.post('/advisor', {
    predictionData,
    financialData,
    weatherData,
    question
  });
  return response.data;
};

/**
 * Appliance Alerts API — now includes forecast for tomorrow comparison
 */
export const fetchApplianceAlerts = async (predictionData, weatherData, forecastData = []) => {
  const response = await api.post('/advisor/appliance-alerts', {
    predictionData,
    weatherData,
    forecastData
  });
  return response.data;
};

/**
 * Subsidies API
 */
export const fetchSubsidies = async (userType = 'residential') => {
  const response = await api.get(`/subsidies?userType=${userType}`);
  return response.data;
};

/**
 * Prediction History API
 */
export const fetchHistory = async (city = '', limit = 20, skip = 0) => {
  const params = new URLSearchParams({ limit, skip });
  if (city) params.append('city', city);
  const response = await api.get(`/history?${params.toString()}`);
  return response.data;
};

/**
 * ML Model Health/Metrics — proxied through Express backend to avoid CORS
 */
export const fetchModelMetrics = async () => {
  const response = await api.get('/ml/health', { timeout: 5000 });
  return response.data;
};

/**
 * Auth APIs
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export default api;
