const mongoose = require('mongoose');

const userQuerySchema = new mongoose.Schema({
  sessionId: { type: String },
  query: { type: String, required: true },
  response: { type: String, required: true },
  context: {
    city: String,
    predictionData: Object
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserQuery', userQuerySchema);
