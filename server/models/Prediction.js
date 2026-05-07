const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  city: { type: String, required: true },
  country: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  panelCapacity: { type: Number, required: true }, // in kW
  weatherData: {
    temperature: Number,
    humidity: Number,
    cloudCover: Number,
    windSpeed: Number,
    description: String,
    icon: String
  },
  prediction: {
    dailyOutput: Number,     // kWh per day
    monthlyOutput: Number,   // kWh per month
    yearlyOutput: Number,    // kWh per year
    efficiency: Number,      // percentage
    peakHours: Number        // peak sun hours
  },
  financial: {
    installationCost: Number,
    monthlySavings: Number,
    yearlySavings: Number,
    roiPeriod: Number,       // years
    savingsOver25Years: Number,
    subsidyAmount: Number
  },
  forecast: [{
    date: String,
    output: Number,
    temperature: Number,
    cloudCover: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
