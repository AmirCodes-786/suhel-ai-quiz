const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  score: { type: Number, default: 0 },
  rank: { type: Number, default: 1 },
  correctAnswersCount: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 }
});

const BattleSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  quizId: { type: String, index: true },
  quizTitle: { type: String, required: true },
  hostUserId: { type: String, required: true, index: true },
  hostName: { type: String, required: true },
  participants: [ParticipantSchema],
  winner: {
    userId: { type: String },
    name: { type: String },
    score: { type: Number }
  },
  totalQuestions: { type: Number, required: true },
  durationSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'aborted'], default: 'completed' }
}, { timestamps: true });

BattleSchema.index({ hostUserId: 1, createdAt: -1 });
BattleSchema.index({ 'participants.userId': 1, createdAt: -1 });

module.exports = mongoose.model('Battle', BattleSchema);
