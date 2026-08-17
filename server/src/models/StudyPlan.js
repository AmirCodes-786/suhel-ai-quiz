const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  estimatedMinutes: { type: Number, default: 30 },
  completed: { type: Boolean, default: false },
  category: { type: String, default: 'General' },
  day: { type: Number, default: 1 }
});

const StudyPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  goal: { type: String, required: true },
  targetWeeks: { type: Number, default: 4 },
  progress: { type: Number, default: 0 },
  tasks: [TaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
