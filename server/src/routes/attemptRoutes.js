const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Certificate = require('../models/Certificate');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Submit Quiz Attempt (Authoritative authenticated user ID)
router.post('/', authMiddleware, async (req, res) => {
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

  const userId = req.user?._id || req.user?.id;
  const userName = req.user?.name || (req.headers['x-user-name'] 
    ? decodeURIComponent(req.headers['x-user-name']) 
    : 'User');

  const attemptId = `att_${uuidv4().slice(0, 8)}`;
  const calculatedPercentage = percentage !== undefined 
    ? Number(percentage) 
    : (maxScore > 0 ? Math.round(((score || 0) / maxScore) * 100) : 0);

  const newAttempt = {
    _id: attemptId,
    id: attemptId,
    quizId: quizId || 'quiz_assessment',
    quizTitle: quizTitle || 'Diagnostic Assessment',
    userId,
    userName,
    score: score || 0,
    maxScore: maxScore || 10,
    percentage: calculatedPercentage,
    timeSpent: timeSpent || 0,
    answers: answers || [],
    bloomScoreBreakdown: bloomScoreBreakdown || {},
    createdAt: new Date().toISOString()
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await Attempt.create(newAttempt);
    }
  } catch (err) {
    console.warn('MongoDB Attempt.create warning:', err.message);
  }

  mockDB.attempts.unshift(newAttempt);

  // Update user stats
  const user = mockDB.users.find(u => u._id === userId || u.id === userId);
  if (user) {
    user.stats = user.stats || {};
    user.stats.totalAttempts = (user.stats.totalAttempts || 0) + 1;
    const allUserAttempts = mockDB.attempts.filter(a => a.userId === userId);
    const avgScore = Math.round(allUserAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / (allUserAttempts.length || 1));
    user.stats.averageScore = avgScore;
  }

  // Check and issue certificate if eligible (>= 80%) strictly for current authenticated user
  let certificateEarned = false;
  let certificate = null;

  if (newAttempt.percentage >= 80) {
    let existingCert = null;
    try {
      if (mongoose.connection.readyState === 1) {
        existingCert = await Certificate.findOne({
          userId: userId,
          $or: [{ quizId: newAttempt.quizId }, { quizTitle: newAttempt.quizTitle }]
        }).lean();
      }
    } catch (e) {}

    if (!existingCert) {
      existingCert = mockDB.certificates.find(c => 
        (c.userId === userId) && (c.quizId === newAttempt.quizId || c.quizTitle === newAttempt.quizTitle)
      );
    }

    if (existingCert) {
      certificateEarned = true;
      certificate = existingCert;
    } else {
      const certId = `QF-AI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const newCert = {
        _id: `cert_${uuidv4().slice(0, 8)}`,
        id: `cert_${uuidv4().slice(0, 8)}`,
        certificateId: certId,
        recipientName: userName,
        recipientEmail: req.user?.email || '',
        userId: userId,
        quizId: newAttempt.quizId,
        quizTitle: newAttempt.quizTitle,
        score: newAttempt.percentage,
        issueDate: new Date().toISOString().split('T')[0],
        verificationUrl: `/verify/${certId}`,
        skills: ['Cognitive Mastery', 'Bloom Level Evaluation', 'Problem Solving']
      };

      try {
        if (mongoose.connection.readyState === 1) {
          await Certificate.create(newCert);
        }
      } catch (e) {
        console.warn('MongoDB Certificate.create warning:', e.message);
      }

      mockDB.certificates.unshift(newCert);
      certificateEarned = true;
      certificate = newCert;
    }
  }

  res.status(201).json({ 
    success: true, 
    attempt: newAttempt,
    certificateEarned,
    certificate
  });
});

// Get User Attempt History (Strictly filtered by authenticated user ID)
router.get('/my-history', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  try {
    if (mongoose.connection.readyState === 1) {
      const dbHistory = await Attempt.find({ userId }).sort({ createdAt: -1 }).lean();
      if (dbHistory) {
        return res.json({ success: true, count: dbHistory.length, history: dbHistory });
      }
    }
  } catch (err) {
    console.warn('MongoDB Attempt history warning:', err.message);
  }

  const history = mockDB.attempts.filter(a => a.userId === userId);
  res.json({ success: true, count: history.length, history });
});

// Get Attempt by ID (Protected — only owner or admin can view full attempt)
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const targetId = req.params.id;
  const isAdmin = req.user?.role === 'admin';

  let attempt = null;
  try {
    if (mongoose.connection.readyState === 1) {
      attempt = await Attempt.findOne({ $or: [{ _id: targetId }, { id: targetId }] }).lean();
    }
  } catch (err) {}

  if (!attempt) {
    attempt = mockDB.attempts.find(a => a._id === targetId || a.id === targetId);
  }

  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Attempt not found' });
  }

  if (attempt.userId && attempt.userId !== userId && !isAdmin) {
    return res.status(404).json({ success: false, message: 'Attempt not found' });
  }

  res.json({ success: true, attempt });
});

module.exports = router;
