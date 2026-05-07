const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initializeAI } = require('./services/aiAdvisorService');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per windowMs per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                   // Stricter limit for auth endpoints
  message: { success: false, error: 'Too many login attempts. Please try again later.' }
});

// --- Middleware ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(optionalAuth);     // Attach user if token present (non-blocking)

// Connect to MongoDB
connectDB();

// Initialize AI
initializeAI();

// --- Routes ---
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/weather', apiLimiter, require('./routes/weatherRoutes'));
app.use('/api/predict', apiLimiter, require('./routes/predictionRoutes'));
app.use('/api/advisor', apiLimiter, require('./routes/advisorRoutes'));
app.use('/api/subsidies', apiLimiter, require('./routes/subsidyRoutes'));
app.use('/api/history', apiLimiter, require('./routes/historyRoutes'));

// ML Service health proxy (avoids CORS issues from browser → ML direct calls)
app.get('/api/ml/health', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
    res.json(response.data);
  } catch (error) {
    res.json({
      status: 'disconnected',
      ready: false,
      modelVersion: 'untrained',
      message: 'ML service not reachable'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Solar Energy Prediction API',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🌞 Solar Energy Prediction Server running on port ${PORT}`);
  console.log(`   API Health: http://localhost:${PORT}/api/health`);
  console.log(`   Weather:    http://localhost:${PORT}/api/weather/:city`);
  console.log(`   Predict:    POST http://localhost:${PORT}/api/predict`);
  console.log(`   ML Proxy:   ${ML_SERVICE_URL}`);
  console.log(`   Advisor:    POST http://localhost:${PORT}/api/advisor`);
  console.log(`   Subsidies:  http://localhost:${PORT}/api/subsidies`);
  console.log(`   Auth:       POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   History:    http://localhost:${PORT}/api/history\n`);
});
