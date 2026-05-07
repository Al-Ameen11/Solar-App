const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Prediction = require('../models/Prediction');

// GET /api/history — Get prediction history (most recent 50)
router.get('/', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: { predictions: [], total: 0, page: 1, totalPages: 0 } });
  }
  try {
    const { city, limit = 20, skip = 0 } = req.query;
    const query = city ? { city: new RegExp(city, 'i') } : {};

    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(Math.min(parseInt(limit), 50))
      .select('-forecast') // Exclude large forecast array for list view
      .lean();

    const total = await Prediction.countDocuments(query);

    res.json({
      success: true,
      data: {
        predictions,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history/:id — Get single prediction with full details
router.get('/:id', async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id).lean();
    if (!prediction) {
      return res.status(404).json({ success: false, error: 'Prediction not found' });
    }
    res.json({ success: true, data: { prediction } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
