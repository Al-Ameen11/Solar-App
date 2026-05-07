const express = require('express');
const router = express.Router();
const { getSubsidySchemes, calculateSubsidy } = require('../services/financialService');

// GET /api/subsidies — Get government subsidy schemes
router.get('/', (req, res) => {
  try {
    const { userType = 'residential' } = req.query;
    const schemes = getSubsidySchemes(userType);
    
    res.json({
      success: true,
      data: { schemes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subsidies/calculate/:capacity — Calculate subsidy for capacity
router.get('/calculate/:capacity', (req, res) => {
  try {
    const capacity = parseFloat(req.params.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ success: false, error: 'Valid capacity (kW) is required' });
    }
    
    const subsidy = calculateSubsidy(capacity);
    
    res.json({
      success: true,
      data: {
        capacity,
        subsidy,
        scheme: 'PM Surya Ghar: Muft Bijli Yojana'
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
