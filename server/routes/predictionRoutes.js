const express = require('express');
const router = express.Router();
const { getCurrentWeather, getForecast } = require('../services/weatherService');
const { predictSolarEnergy, predictForecast } = require('../services/predictionService');
const { predictWithMLService } = require('../services/mlPredictionClient');
const { calculateFinancials } = require('../services/financialService');

// POST /api/predict — Get solar prediction with financial analysis
router.post('/', async (req, res) => {
  try {
    const { city, panelCapacity = 5, state = 'default', monthlyBill = 0 } = req.body;
    
    if (!city) {
      return res.status(400).json({ success: false, error: 'City is required' });
    }
    
    // Fetch weather data
    const [current, forecast] = await Promise.all([
      getCurrentWeather(city),
      getForecast(city)
    ]);
    
    let prediction;
    let forecastPredictions;

    try {
      const mlResult = await predictWithMLService({
        panelCapacity,
        latitude: current.latitude,
        currentWeather: {
          temperature: current.temperature,
          humidity: current.humidity,
          cloudCover: current.cloudCover,
          windSpeed: current.windSpeed,
          description: current.description
        },
        forecastDays: forecast
      });

      prediction = mlResult.prediction;
      forecastPredictions = mlResult.forecast;
    } catch (mlError) {
      // Fallback to existing model if FastAPI service is down/unavailable.
      prediction = predictSolarEnergy({
        temperature: current.temperature,
        humidity: current.humidity,
        cloudCover: current.cloudCover,
        windSpeed: current.windSpeed,
        latitude: current.latitude
      }, panelCapacity);

      forecastPredictions = predictForecast(forecast, panelCapacity, current.latitude);
      console.error(`ML service fallback activated: ${mlError.message}`);
    }
    
    // Financial analysis
    const financials = calculateFinancials(prediction, panelCapacity, state, monthlyBill);
    
    // Try to save to database (non-blocking)
    try {
      const Prediction = require('../models/Prediction');
      await Prediction.create({
        city: current.city,
        country: current.country,
        latitude: current.latitude,
        longitude: current.longitude,
        panelCapacity,
        weatherData: {
          temperature: current.temperature,
          humidity: current.humidity,
          cloudCover: current.cloudCover,
          windSpeed: current.windSpeed,
          description: current.description,
          icon: current.icon
        },
        prediction,
        financial: {
          installationCost: financials.installationCost.net,
          monthlySavings: financials.savings.monthly,
          yearlySavings: financials.savings.yearly,
          roiPeriod: financials.roi.period,
          savingsOver25Years: financials.savings.netOver25Years,
          subsidyAmount: financials.installationCost.subsidy
        },
        forecast: forecastPredictions
      });
    } catch (dbError) {
      // Database save is not critical
    }
    
    res.json({
      success: true,
      data: {
        weather: current,
        prediction,
        forecast: forecastPredictions,
        financials
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
