const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Issue new Certificate
router.post('/issue', authMiddleware, (req, res) => {
  const { quizId, quizTitle, score, recipientName, skills } = req.body;
  const userId = req.user?.id || req.user?._id || req.headers['x-user-id'];
  const userName = req.headers['x-user-name']
    ? decodeURIComponent(req.headers['x-user-name'])
    : (req.user?.name || recipientName || 'Student');
  const userEmail = req.user?.email || '';

  // Check if score is eligible (>= 80%)
  const numericScore = Number(score) || 0;
  if (numericScore < 80) {
    return res.status(400).json({ 
      success: false, 
      message: 'Certificate requires a minimum passing score of 80%' 
    });
  }

  // Avoid duplicates for same quiz and user
  const existing = mockDB.certificates.find(c => (c.userId === userId) && (c.quizId === quizId));
  if (existing) {
    return res.status(200).json({ success: true, certificate: existing, isExisting: true });
  }

  const certId = `QF-AI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const newCert = {
    _id: `cert_${uuidv4().slice(0, 8)}`,
    id: `cert_${uuidv4().slice(0, 8)}`,
    certificateId: certId,
    recipientName: userName,
    recipientEmail: userEmail,
    userId: userId,
    quizId: quizId || 'quiz_assessment',
    quizTitle: quizTitle || 'Mastery Assessment',
    score: numericScore,
    issueDate: new Date().toISOString().split('T')[0],
    verificationUrl: `/verify/${certId}`,
    skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Cognitive Mastery', 'Problem Solving', 'Bloom Taxonomy Evaluation']
  };

  mockDB.certificates.unshift(newCert);
  res.status(201).json({ success: true, certificate: newCert });
});

// Verify Certificate by Code (Public — sanitized verification metadata)
router.get('/verify/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const cert = mockDB.certificates.find(c => 
    c.certificateId.toUpperCase() === code || 
    (c._id && c._id.toUpperCase() === code) ||
    (c.id && c.id.toUpperCase() === code)
  );

  if (!cert) {
    return res.status(404).json({ 
      success: false, 
      valid: false, 
      message: 'Certificate ID was not found or is invalid' 
    });
  }

  res.json({ 
    success: true, 
    valid: true, 
    certificate: {
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      quizTitle: cert.quizTitle,
      score: cert.score,
      issueDate: cert.issueDate,
      skills: cert.skills || ['AI Literacy', 'Problem Solving'],
      verifiedAt: new Date().toISOString()
    }
  });
});

// Get User Certificates (Protected — strictly isolated to authenticated user)
router.get('/my-certificates', authMiddleware, (req, res) => {
  const userId = req.user?.id || req.user?._id || req.headers['x-user-id'];
  const certs = mockDB.certificates.filter(c => c.userId === userId);
  res.json({ success: true, count: certs.length, certificates: certs });
});

// Get Certificate by ID (Protected)
router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.user?.id || req.user?._id || req.headers['x-user-id'];
  const cert = mockDB.certificates.find(c => 
    c.certificateId.toUpperCase() === req.params.id.toUpperCase() ||
    c._id === req.params.id ||
    c.id === req.params.id
  );

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  if (cert.userId && cert.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied to this certificate' });
  }

  res.json({ success: true, certificate: cert });
});

module.exports = router;
