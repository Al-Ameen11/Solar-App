const express = require('express');
const router = express.Router();
const { getCurrentWeather, getForecast, getUVIndex } = require('../services/weatherService');

// GET /api/weather/:city — Get current weather and forecast
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    const [current, forecast] = await Promise.all([
      getCurrentWeather(city),
      getForecast(city)
    ]);
    
    const uvIndex = await getUVIndex(current.latitude, current.longitude);
    
    res.json({
      success: true,
      data: {
        current: { ...current, uvIndex },
        forecast
      }
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
