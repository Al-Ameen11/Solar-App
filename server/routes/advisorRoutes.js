const express = require('express');
const router = express.Router();
const { getSolarAdvice, getApplianceAlerts } = require('../services/aiAdvisorService');

// POST /api/advisor — Get AI advisor response
router.post('/', async (req, res) => {
  try {
    const { predictionData, financialData, weatherData, question } = req.body;
    
    if (!predictionData || !weatherData) {
      return res.status(400).json({
        success: false,
        error: 'Prediction and weather data are required. Please run a prediction first.'
      });
    }
    
    const advice = await getSolarAdvice(
      predictionData,
      financialData || {},
      weatherData,
      question || ''
    );
    
    // Try to save query to database (non-blocking)
    try {
      const UserQuery = require('../models/UserQuery');
      await UserQuery.create({
        query: question || 'General advice request',
        response: advice,
        context: { city: weatherData.city, predictionData }
      });
    } catch (dbError) {
      // Not critical
    }
    
    res.json({
      success: true,
      data: { advice }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/advisor/appliance-alerts — Get smart appliance alerts
router.post('/appliance-alerts', async (req, res) => {
  try {
    const { predictionData, weatherData, forecastData } = req.body;
    
    if (!predictionData || !weatherData) {
      return res.status(400).json({
        success: false,
        error: 'Prediction and weather data are required.'
      });
    }
    
    const alerts = await getApplianceAlerts(predictionData, weatherData, forecastData || []);
    
    res.json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
