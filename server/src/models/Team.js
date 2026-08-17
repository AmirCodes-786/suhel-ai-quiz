const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  members: [MemberSchema],
  quizzes: [{ type: String }],
  inviteCode: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
