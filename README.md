# ☀️ SolarPredict — Weather-Based Solar Energy Prediction & Decision Support System

A full-stack web application that predicts solar energy output based on real-time weather data. Built as a final year project.

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  React +    │ ───→ │  Express.js      │ ───→ │  FastAPI + ML    │
│  Recharts   │      │  API Gateway     │      │  (Random Forest) │
│  (Vite)     │      │  :5000           │      │  :8000           │
└─────────────┘      └──────┬───────────┘      └──────────────────┘
                            │
                   ┌────────┼────────┐
                   ↓        ↓        ↓
              MongoDB  OpenWeather  Gemini AI
```

## 🚀 Features

- **Solar Prediction** — ML model (Random Forest) predicts energy output based on weather
- **Weather Integration** — Real-time weather via OpenWeather API
- **Financial Analysis** — ROI, savings, subsidy calculations for Indian states
- **AI Advisor** — Google Gemini-powered Q&A for solar energy guidance
- **Appliance Scheduling** — Smart alerts for optimal energy usage timing
- **Government Subsidies** — Personalized PM Surya Ghar scheme calculations
- **Prediction History** — Store & browse past predictions (MongoDB)
- **User Authentication** — JWT-based register/login system
- **Model Metrics** — View ML model accuracy & Solar vs Grid comparison

## 📋 Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18, Vite, Recharts, Axios        |
| Backend     | Node.js, Express, Mongoose, JWT        |
| ML Service  | Python, FastAPI, scikit-learn, joblib   |
| Database    | MongoDB                                |
| APIs        | OpenWeather, Google Gemini              |

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB (local or cloud)

### 1. Clone & Configure

```bash
git clone <repository-url>
cd solar-energy-prediction
```

Copy environment config:
```bash
cp server/.env.example server/.env
# Edit server/.env and add your API keys:
#   OPENWEATHER_API_KEY=<your-key>
#   GEMINI_API_KEY=<your-key>
#   JWT_SECRET=<generated-secret>
```

### 2. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

### 3. Train the ML Model

```bash
cd ml-service
python train.py
```

### 4. Start the Application

**Terminal 1 — ML Service:**
```bash
cd ml-service
uvicorn app:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🧪 Running Tests

```bash
# Backend tests
cd server && npm test

# ML tests
cd ml-service && pytest tests/

# Frontend tests
cd client && npm test
```

## 📁 Project Structure

```
├── client/                     # React Frontend
│   └── src/
│       ├── components/         # 13 React components
│       ├── services/api.js     # API client with JWT interceptor
│       ├── App.jsx             # Main app with routing
│       └── index.css           # Design system (dark theme)
│
├── server/                     # Express Backend
│   ├── routes/                 # API routes (auth, predict, weather, etc.)
│   ├── services/               # Business logic
│   ├── models/                 # MongoDB schemas
│   ├── middleware/auth.js      # JWT authentication
│   └── server.js               # Entry point with rate limiting
│
├── ml-service/                 # Python ML Service
│   ├── train.py                # Model training (Random Forest, 9 features)
│   ├── app.py                  # FastAPI inference server
│   └── models/                 # Saved model artifacts
│
├── datasets/                   # Training data (Plant 1 & 2)
├── .gitignore
└── README.md
```

## 📊 ML Model Details

- **Algorithm:** Random Forest Regressor (200 trees, max depth 20)
- **Features (9):** irradiation, temperature, humidity, cloud_cover, wind_speed, hour_sin, hour_cos, doy_sin, doy_cos
- **Target:** Normalized AC power (per-inverter P99 normalization)
- **Dataset:** Solar power plant data (Plant 1 & Plant 2)
- **Train/Test Split:** 80/20 (temporal)

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- API rate limiting (100 req/15min, 20 for auth)
- CORS restrictions configurable via `CORS_ORIGIN` env var
- API keys stored in `.env` (never committed)

## 📜 License

Academic project — for educational purposes.
