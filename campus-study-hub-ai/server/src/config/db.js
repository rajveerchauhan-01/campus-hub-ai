const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Copy .env.example to .env and configure MongoDB.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
