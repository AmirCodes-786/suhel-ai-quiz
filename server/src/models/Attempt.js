const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id: { type: String },
  quizId: { type: String, required: true, index: true },
  quizTitle: { type: String, required: true },
  category: { type: String, default: 'General' },
  userId: { type: String, required: true, index: true },
  userName: { type: String, default: 'Student' },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeSpent: { type: Number, default: 0 }, // in seconds
  answers: [{
    questionId: { type: String },
    selectedAnswer: { type: mongoose.Schema.Types.Mixed },
    userAnswer: { type: mongoose.Schema.Types.Mixed },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    isCorrect: { type: Boolean, required: true },
    topic: { type: String },
    timeTaken: { type: Number }
  }],
  bloomScoreBreakdown: { type: Map, of: mongoose.Schema.Types.Mixed },
  weakTopics: [{ type: String }],
  strongTopics: [{ type: String }]
}, { timestamps: true, _id: false });

AttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Attempt', AttemptSchema);
