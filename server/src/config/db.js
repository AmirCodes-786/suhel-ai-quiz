const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS setServers warning:', e.message);
}

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizforge_ai';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log('✅ MongoDB Atlas Connected successfully to database:', mongoose.connection.name);
    console.log('🌐 Cluster Host:', mongoose.connection.host);
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning:', error.message);
    console.log('ℹ️ Running in resilient In-Memory / Hybrid Mock mode for development!');
    isConnected = false;
  }
};

module.exports = { connectDB, getIsConnected: () => isConnected };
