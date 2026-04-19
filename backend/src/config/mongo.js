// src/config/mongo.js
const mongoose = require('mongoose');
const logger = require('./logger');

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/magazine_content';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.warn('⚠️ MongoDB connection failed. Running in demo mode.');
  }
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));

module.exports = { connectMongo };
