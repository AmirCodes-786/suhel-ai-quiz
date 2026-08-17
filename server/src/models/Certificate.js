const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  id: { type: String },
  certificateId: { type: String, required: true, unique: true, index: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String },
  userId: { type: String, required: true, index: true },
  quizId: { type: String, required: true, index: true },
  quizCredentialId: { type: String, index: true },
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  issueDate: { type: String, required: true },
  verificationUrl: { type: String },
  skills: [{ type: String }]
}, { timestamps: true, _id: false });

CertificateSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
