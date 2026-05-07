const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_SERVICE_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 5000);
const ML_RETRY_COUNT = 1;

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_SERVICE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatError = (error) => {
  if (error?.response?.data?.detail) return String(error.response.data.detail);
  if (error?.response?.data?.error) return String(error.response.data.error);
  if (error?.message) return String(error.message);
  return 'Unknown ML service error';
};

const predictWithMLService = async ({ panelCapacity, latitude, currentWeather, forecastDays }) => {
  const payload = {
    panelCapacity,
    latitude,
    currentWeather,
    forecastDays
  };

  let lastError = null;
  for (let attempt = 0; attempt <= ML_RETRY_COUNT; attempt++) {
    try {
      const response = await client.post('/predict', payload);
      const data = response.data;

      if (!data || typeof data !== 'object') {
        throw new Error('ML service returned an empty response');
      }
      if (!data.prediction || !Array.isArray(data.forecast)) {
        throw new Error('ML service returned an invalid prediction payload');
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < ML_RETRY_COUNT) {
        await wait(150);
      }
    }
  }

  throw new Error(`ML service unavailable: ${formatError(lastError)}`);
};

module.exports = { predictWithMLService };
