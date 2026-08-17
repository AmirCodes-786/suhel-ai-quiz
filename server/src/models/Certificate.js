const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String },
  userId: { type: String, required: true },
  quizId: { type: String, required: true },
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  issueDate: { type: String, required: true },
  verificationUrl: { type: String },
  skills: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
