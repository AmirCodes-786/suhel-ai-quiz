const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['mcq', 'true_false', 'fill_blank', 'match_pairs', 'short_answer'], 
    default: 'mcq' 
  },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Expert'], default: 'Medium' },
  bloomLevel: { 
    type: String, 
    enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'], 
    default: 'Understand' 
  },
  options: [{ type: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
  explanation: { type: String, default: '' },
  learningTips: [{ type: String }],
  points: { type: Number, default: 10 }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id: { type: String },
  credentialId: { type: String, index: true }, // Unique Accreditation / Credential ID for verification
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Expert', 'Mixed'], default: 'Medium' },
  creator: { type: String, required: true, index: true },
  creatorName: { type: String, default: 'Anonymous' },
  isPublic: { type: Boolean, default: false, index: true },
  timeLimit: { type: Number, default: 10 }, // in minutes
  sourceType: { 
    type: String, 
    enum: ['text', 'pdf', 'docx', 'ppt', 'image', 'url', 'youtube', 'manual'], 
    default: 'text' 
  },
  bloomLevels: [{ type: String }],
  tags: [{ type: String }],
  views: { type: Number, default: 0 },
  clones: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  ratingsCount: { type: Number, default: 1 },
  questions: [QuestionSchema]
}, { timestamps: true, _id: false });

QuizSchema.index({ creator: 1, createdAt: -1 });
QuizSchema.index({ category: 1 });
QuizSchema.index({ credentialId: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);
