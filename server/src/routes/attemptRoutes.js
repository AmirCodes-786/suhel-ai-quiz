const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Submit Quiz Attempt
router.post('/', authMiddleware, (req, res) => {
  const {
    quizId,
    quizTitle,
    score,
    maxScore,
    percentage,
    timeSpent,
    answers,
    bloomScoreBreakdown
  } = req.body;

  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const userName = req.headers['x-user-name'] 
    ? decodeURIComponent(req.headers['x-user-name']) 
    : (req.user?.name || 'User');

  const attemptId = `att_${uuidv4().slice(0, 8)}`;
  const newAttempt = {
    _id: attemptId,
    id: attemptId,
    quizId,
    quizTitle: quizTitle || 'Diagnostic Assessment',
    userId,
    userName,
    score: score || 0,
    maxScore: maxScore || 10,
    percentage: percentage || Math.round(((score || 0) / (maxScore || 1)) * 100),
    timeSpent: timeSpent || 0,
    answers: answers || [],
    bloomScoreBreakdown: bloomScoreBreakdown || {},
    createdAt: new Date().toISOString()
  };

  mockDB.attempts.unshift(newAttempt);

  // Update user stats
  const user = mockDB.users.find(u => u._id === userId || u.id === userId);
  if (user) {
    user.stats = user.stats || {};
    user.stats.totalAttempts = (user.stats.totalAttempts || 0) + 1;
    const allUserAttempts = mockDB.attempts.filter(a => a.userId === user._id || a.userId === user.id);
    const avgScore = Math.round(allUserAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / (allUserAttempts.length || 1));
    user.stats.averageScore = avgScore;
  }

  // Check and issue certificate if eligible (>= 80%)
  let certificateEarned = false;
  let certificate = null;

  if (newAttempt.percentage >= 80) {
    const existingCert = mockDB.certificates.find(c => 
      (c.userId === newAttempt.userId) && (c.quizId === newAttempt.quizId)
    );
    if (!existingCert) {
      const certId = `QF-AI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const newCert = {
        _id: `cert_${uuidv4().slice(0, 8)}`,
        id: `cert_${uuidv4().slice(0, 8)}`,
        certificateId: certId,
        recipientName: newAttempt.userName || userName,
        recipientEmail: req.user?.email || '',
        userId: newAttempt.userId,
        quizId: newAttempt.quizId,
        quizTitle: newAttempt.quizTitle,
        score: newAttempt.percentage,
        issueDate: new Date().toISOString().split('T')[0],
        verificationUrl: `/verify/${certId}`,
        skills: ['Cognitive Mastery', 'Bloom Level Evaluation', 'Problem Solving']
      };
      mockDB.certificates.unshift(newCert);
      certificateEarned = true;
      certificate = newCert;
    } else {
      certificateEarned = true;
      certificate = existingCert;
    }
  }

  res.status(201).json({ 
    success: true, 
    attempt: newAttempt,
    certificateEarned,
    certificate
  });
});

// Get User Attempt History
router.get('/my-history', authMiddleware, (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const history = mockDB.attempts.filter(a => a.userId === userId);
  res.json({ success: true, count: history.length, history });
});

// Get Attempt by ID (Protected — only owner can view full attempt)
router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const attempt = mockDB.attempts.find(a => a._id === req.params.id || a.id === req.params.id);
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Attempt not found' });
  }

  if (attempt.userId && attempt.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied to this attempt record' });
  }

  res.json({ success: true, attempt });
});

module.exports = router;
