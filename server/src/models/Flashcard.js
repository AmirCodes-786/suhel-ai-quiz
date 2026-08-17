const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  mastery: { type: String, enum: ['unseen', 'hard', 'good', 'easy'], default: 'unseen' },
  bookmarked: { type: Boolean, default: false },
  lastReviewed: { type: Date }
}, { _id: false });

const FlashcardSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id: { type: String },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  topic: { type: String, default: 'General' },
  quizId: { type: String },
  cards: [CardSchema]
}, { timestamps: true, _id: false });

FlashcardSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Flashcard', FlashcardSchema);
