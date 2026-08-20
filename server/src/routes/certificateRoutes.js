const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Issue new Certificate (Manual / Direct)
router.post('/issue', authMiddleware, async (req, res) => {
  const { quizId, quizTitle, score, recipientName, skills, quizCredentialId } = req.body;
  const userId = req.user?._id || req.user?.id;
  const userName = req.user?.name || (req.headers['x-user-name']
    ? decodeURIComponent(req.headers['x-user-name'])
    : (recipientName || 'Student'));
  const userEmail = req.user?.email || '';

  const numericScore = Number(score) || 0;
  if (numericScore < 80) {
    return res.status(400).json({ 
      success: false, 
      message: 'Certificate requires a minimum passing score of 80%' 
    });
  }

  // Avoid duplicates for same quiz and user
  let existing = null;
  try {
    if (mongoose.connection.readyState === 1) {
      existing = await Certificate.findOne({
        userId,
        $or: [
          { quizId },
          { quizCredentialId },
          { quizTitle }
        ]
      }).lean();
    }
  } catch (e) {}

  if (!existing) {
    existing = mockDB.certificates.find(c => (c.userId === userId) && (c.quizId === quizId || c.quizTitle === quizTitle || c.quizCredentialId === quizCredentialId));
  }

  if (existing) {
    return res.status(200).json({ success: true, certificate: existing, isExisting: true });
  }

  const certId = `QF-AI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const newDocId = `cert_${uuidv4().slice(0, 8)}`;

  const newCert = {
    _id: newDocId,
    id: newDocId,
    certificateId: certId,
    recipientName: userName,
    recipientEmail: userEmail,
    userId: userId,
    quizId: quizId || 'quiz_assessment',
    quizCredentialId: quizCredentialId || `QF-CR-${uuidv4().slice(0, 6).toUpperCase()}`,
    quizTitle: quizTitle || 'Mastery Assessment',
    score: numericScore,
    issueDate: new Date().toISOString().split('T')[0],
    verificationUrl: `/verify/${certId}`,
    skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Cognitive Mastery', 'Problem Solving', 'Bloom Taxonomy Evaluation']
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await Certificate.create(newCert);
    }
  } catch (e) {
    console.warn('MongoDB Certificate.create warning:', e.message);
  }

  mockDB.certificates.unshift(newCert);
  res.status(201).json({ success: true, certificate: newCert });
});

// Verify Certificate by Code or Quiz Credential ID (Public verification)
router.get('/verify/:code', async (req, res) => {
  const code = (req.params.code || '').trim();
  const upperCode = code.toUpperCase();

  let cert = null;

  try {
    if (mongoose.connection.readyState === 1) {
      cert = await Certificate.findOne({
        $or: [
          { certificateId: new RegExp(`^${code}$`, 'i') },
          { quizCredentialId: new RegExp(`^${code}$`, 'i') },
          { _id: code },
          { id: code },
          { quizId: code }
        ]
      }).lean();
    }
  } catch (e) {}

  if (!cert) {
    cert = mockDB.certificates.find(c => 
      (c.certificateId && c.certificateId.toUpperCase() === upperCode) ||
      (c.quizCredentialId && c.quizCredentialId.toUpperCase() === upperCode) ||
      (c._id && c._id === code) ||
      (c.id && c.id === code) ||
      (c.quizId && c.quizId === code)
    );
  }

  if (!cert) {
    return res.status(404).json({ 
      success: false, 
      valid: false, 
      message: `No active certificate found for Credential ID "${code}". Complete this quiz with 80%+ score to earn this certificate.` 
    });
  }

  res.json({ 
    success: true, 
    valid: true, 
    certificate: {
      certificateId: cert.certificateId,
      quizCredentialId: cert.quizCredentialId || cert.quizId,
      recipientName: cert.recipientName,
      quizTitle: cert.quizTitle,
      score: cert.score,
      issueDate: cert.issueDate,
      skills: cert.skills || ['AI Literacy', 'Problem Solving', 'Mastery Accreditation'],
      verifiedAt: new Date().toISOString()
    }
  });
});

// Get User Certificates (Protected — strictly authenticated user)
router.get('/my-certificates', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  let certs = [];
  let isDbQueried = false;

  try {
    if (mongoose.connection.readyState === 1) {
      certs = await Certificate.find({ userId }).sort({ createdAt: -1 }).lean();
      isDbQueried = true;
    }
  } catch (e) {}

  if (!isDbQueried) {
    certs = mockDB.certificates.filter(c => c.userId === userId);
  }

  res.json({ success: true, count: (certs || []).length, certificates: certs || [] });
});

// Get Certificate by ID (Protected — only owner or admin)
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const targetId = req.params.id;
  const upperId = targetId.toUpperCase();
  const isAdmin = req.user?.role === 'admin';

  let cert = null;
  try {
    if (mongoose.connection.readyState === 1) {
      cert = await Certificate.findOne({
        $or: [
          { certificateId: new RegExp(`^${targetId}$`, 'i') },
          { quizCredentialId: new RegExp(`^${targetId}$`, 'i') },
          { _id: targetId },
          { id: targetId }
        ]
      }).lean();
    }
  } catch (e) {}

  if (!cert) {
    cert = mockDB.certificates.find(c => 
      (c.certificateId && c.certificateId.toUpperCase() === upperId) ||
      (c.quizCredentialId && c.quizCredentialId.toUpperCase() === upperId) ||
      c._id === targetId ||
      c.id === targetId
    );
  }

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  if (cert.userId && cert.userId !== userId && !isAdmin) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  res.json({ success: true, certificate: cert });
});

module.exports = router;
