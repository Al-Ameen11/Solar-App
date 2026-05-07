const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || !mongoUri.trim()) {
    console.log('MONGODB_URI not set. Running without database. Prediction history will not be saved.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit — allow app to run without DB for demo purposes
    console.log('⚠️  Running without database. Prediction history will not be saved.');
  }
};

module.exports = connectDB;
