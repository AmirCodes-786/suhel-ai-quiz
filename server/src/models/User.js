const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'teacher', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  clerkId: { type: String },
  stats: {
    totalQuizzes: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
