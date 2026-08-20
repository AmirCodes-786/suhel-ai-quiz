const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS setServers warning:', e.message);
}

let isConnected = false;

// Safe Database Ownership Migration Strategy (Requirement 9)
const runSafeOwnershipMigration = async () => {
  try {
    const Quiz = require('../models/Quiz');
    const Attempt = require('../models/Attempt');
    const Certificate = require('../models/Certificate');

    // 1. Ensure all quizzes have both creator and userId properly synchronized
    await Quiz.updateMany(
      { creator: { $exists: true, $ne: null }, userId: { $exists: false } },
      [{ $set: { userId: '$creator' } }]
    );

    await Quiz.updateMany(
      { userId: { $exists: true, $ne: null }, creator: { $exists: false } },
      [{ $set: { creator: '$userId' } }]
    );

    // 2. Quarantine any ownerless private quizzes so they never leak to normal users
    await Quiz.updateMany(
      {
        $and: [
          { $or: [{ creator: { $exists: false } }, { creator: null }, { creator: '' }] },
          { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] }
        ]
      },
      {
        $set: {
          creator: 'system_legacy_admin',
          userId: 'system_legacy_admin',
          isPublic: false
        }
      }
    );

    // 3. Quarantine any ownerless attempts and certificates
    await Attempt.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] },
      { $set: { userId: 'system_legacy_admin' } }
    );

    await Certificate.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] },
      { $set: { userId: 'system_legacy_admin' } }
    );

    console.log('🔒 Safe Quiz Ownership & Isolation Migration verified.');
  } catch (migErr) {
    console.warn('Database migration warning:', migErr.message);
  }
};

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

    await runSafeOwnershipMigration();
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning:', error.message);
    console.log('ℹ️ Running in resilient In-Memory / Hybrid Mock mode for development!');
    isConnected = false;
  }
};

module.exports = { connectDB, getIsConnected: () => isConnected, runSafeOwnershipMigration };
