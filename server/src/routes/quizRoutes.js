const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const Certificate = require('../models/Certificate');
const Flashcard = require('../models/Flashcard');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Helper to check answer correctness robustly
function isAnswerCorrect(submitted, question) {
  if (submitted === undefined || submitted === null || !question) return false;
  const sStr = String(submitted).trim().toLowerCase();
  const cStr = String(question.correctAnswer || '').trim().toLowerCase();
  const options = (question.options || []).map(o => String(o).trim().toLowerCase());

  if (sStr === cStr) return true;

  // Clean prefixes (e.g. "A. Option" -> "Option")
  const cleanS = sStr.replace(/^[a-d][\).\s:-]+/i, '').trim();
  const cleanC = cStr.replace(/^[a-d][\).\s:-]+/i, '').trim();
  if (cleanS && cleanC && cleanS === cleanC) return true;

  // Letter indexing
  const letterMap = { a: 0, b: 1, c: 2, d: 3 };
  if (cStr in letterMap && options[letterMap[cStr]]) {
    const optClean = options[letterMap[cStr]].replace(/^[a-d][\).\s:-]+/i, '').trim();
    if (options[letterMap[cStr]] === sStr || optClean === cleanS) return true;
  }

  // Numeric indexing
  const numC = parseInt(cStr, 10);
  if (!isNaN(numC) && numC >= 0 && numC < options.length) {
    const optClean = options[numC].replace(/^[a-d][\).\s:-]+/i, '').trim();
    if (options[numC] === sStr || optClean === cleanS) return true;
  }

  return false;
}

// Get all quizzes (from MongoDB Atlas with fallback sync & credential ID guarantee)
router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty, isPublic, myQuizzes, userId } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (myQuizzes === 'true' && userId) query.creator = userId;
      if (isPublic === 'true') query.isPublic = true;
      if (category && category !== 'All') query.category = new RegExp(`^${category}$`, 'i');
      if (difficulty && difficulty !== 'All') query.difficulty = new RegExp(`^${difficulty}$`, 'i');
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { credentialId: { $regex: search, $options: 'i' } }
        ];
      }

      let dbQuizzes = await Quiz.find(query).sort({ createdAt: -1 }).lean();
      if (dbQuizzes && dbQuizzes.length > 0) {
        dbQuizzes = dbQuizzes.map(q => ({
          ...q,
          credentialId: q.credentialId || `QF-CR-${String(q._id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
        }));
        return res.json({ success: true, count: dbQuizzes.length, quizzes: dbQuizzes });
      }
    }
  } catch (err) {
    console.warn('MongoDB query quizzes fallback:', err.message);
  }

  // Fallback to in-memory store
  const { search, category, difficulty, isPublic, myQuizzes, userId } = req.query;
  let results = mockDB.quizzes.map(q => ({
    ...q,
    credentialId: q.credentialId || `QF-CR-${String(q._id || q.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
  }));

  if (myQuizzes === 'true' && userId) {
    results = results.filter(q => q.creator === userId);
  } else if (isPublic === 'true') {
    results = results.filter(q => q.isPublic !== false);
  }

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(q => 
      q.title.toLowerCase().includes(s) || 
      q.description?.toLowerCase().includes(s) ||
      q.category?.toLowerCase().includes(s) ||
      q.credentialId?.toLowerCase().includes(s) ||
      q.tags?.some(t => t.toLowerCase().includes(s))
    );
  }

  if (category && category !== 'All') {
    results = results.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }

  if (difficulty && difficulty !== 'All') {
    results = results.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  res.json({ success: true, count: results.length, quizzes: results });
});

// Get Quiz by ID
router.get('/:id', async (req, res) => {
  const targetId = req.params.id;

  try {
    if (mongoose.connection.readyState === 1) {
      const dbQuiz = await Quiz.findOne({ 
        $or: [{ _id: targetId }, { id: targetId }, { credentialId: targetId.toUpperCase() }] 
      }).lean();
      if (dbQuiz) {
        await Quiz.updateOne({ _id: dbQuiz._id }, { $inc: { views: 1 } });
        const withCred = {
          ...dbQuiz,
          credentialId: dbQuiz.credentialId || `QF-CR-${String(dbQuiz._id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
        };
        return res.json({ success: true, quiz: withCred });
      }
    }
  } catch (err) {}

  const quiz = mockDB.quizzes.find(q => 
    q._id === targetId || q.id === targetId || (q.credentialId && q.credentialId.toUpperCase() === targetId.toUpperCase())
  );
  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }
  quiz.views = (quiz.views || 0) + 1;
  const withCred = {
    ...quiz,
    credentialId: quiz.credentialId || `QF-CR-${String(quiz._id || quiz.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
  };
  res.json({ success: true, quiz: withCred });
});

// Create Quiz manually
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const userName = req.headers['x-user-name']
    ? decodeURIComponent(req.headers['x-user-name'])
    : (req.user?.name || 'User');

  const newQuizId = `quiz_${uuidv4().slice(0, 8)}`;
  const uniqueCredentialId = `QF-CR-${uuidv4().slice(0, 6).toUpperCase()}`;

  const newQuiz = {
    _id: newQuizId,
    id: newQuizId,
    credentialId: uniqueCredentialId,
    title: req.body.title || 'Untitled Assessment',
    description: req.body.description || '',
    category: req.body.category || 'General',
    difficulty: req.body.difficulty || 'Medium',
    creator: userId,
    creatorName: userName,
    isPublic: req.body.isPublic || false,
    timeLimit: req.body.timeLimit || 10,
    bloomLevels: req.body.bloomLevels || ['Understand'],
    tags: req.body.tags || ['Custom'],
    views: 0,
    clones: 0,
    rating: 5.0,
    ratingsCount: 1,
    questions: req.body.questions || [],
    createdAt: new Date().toISOString()
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await Quiz.create(newQuiz);
    }
  } catch (err) {
    console.warn('MongoDB Quiz.create warning:', err.message);
  }

  mockDB.quizzes.unshift(newQuiz);
  res.status(201).json({ success: true, quiz: newQuiz });
});

// Delete Quiz
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const targetId = req.params.id;
  const targetQuiz = mockDB.quizzes.find(q => q._id === targetId || q.id === targetId);

  if (targetQuiz && targetQuiz.creator && targetQuiz.creator !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this quiz' });
  }

  const quizTitle = targetQuiz?.title || '';

  // 1. Remove Quiz from Store
  mockDB.quizzes = mockDB.quizzes.filter(q => q._id !== targetId && q.id !== targetId);

  // 2. Cascade delete from MongoDB Atlas
  try {
    if (mongoose.connection.readyState === 1) {
      await Promise.allSettled([
        Quiz.deleteMany({ $or: [{ _id: targetId }, { id: targetId }] }),
        Attempt.deleteMany({ $or: [{ quizId: targetId }, ...(quizTitle ? [{ quizTitle }] : [])] }),
        Certificate.deleteMany({ $or: [{ quizId: targetId }, ...(quizTitle ? [{ quizTitle }] : [])] }),
        Flashcard.deleteMany({ $or: [{ quizId: targetId }, ...(quizTitle ? [{ title: quizTitle }] : [])] })
      ]);
    }
  } catch (err) {}

  res.json({ 
    success: true, 
    message: 'Quiz deleted successfully' 
  });
});

// Record Quiz Attempt with Authoritative Server-Side Evaluation & Automatic Certificate Issuance on Score >= 80%
router.post('/:id/attempt', authMiddleware, async (req, res) => {
  const targetId = req.params.id;
  let quiz = null;

  try {
    if (mongoose.connection.readyState === 1) {
      quiz = await Quiz.findOne({ 
        $or: [{ _id: targetId }, { id: targetId }, { credentialId: targetId.toUpperCase() }] 
      }).lean();
    }
  } catch (e) {}

  if (!quiz) {
    quiz = mockDB.quizzes.find(q => 
      q._id === targetId || q.id === targetId || (q.credentialId && q.credentialId.toUpperCase() === targetId.toUpperCase())
    );
  }

  const { timeSpent, answers = [], weakTopics = [], quizTitle } = req.body;
  const rawUserName = req.headers['x-user-name'] ? decodeURIComponent(req.headers['x-user-name']) : (req.user?.name || 'Student');
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'] || 'guest_user';
  const userName = rawUserName || 'Student';
  const effectiveQuizTitle = quiz ? quiz.title : (quizTitle || 'Mastery Assessment');
  const quizCredentialId = quiz ? (quiz.credentialId || `QF-CR-${String(quiz._id || targetId).slice(-6).toUpperCase()}`) : `QF-CR-${String(targetId).slice(-6).toUpperCase()}`;

  // Authoritative Server-Side Scoring
  let calculatedScore = 0;
  let maxPossibleScore = 0;
  let evaluatedAnswers = [];

  if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
    quiz.questions.forEach((q, idx) => {
      const qPoints = q.points || 10;
      maxPossibleScore += qPoints;

      const userAnsObj = answers.find(a => (a.questionId && (a.questionId === q.id || a.questionId === q._id)) || a.questionIndex === idx) || answers[idx];
      const submittedValue = userAnsObj ? (userAnsObj.selectedAnswer !== undefined ? userAnsObj.selectedAnswer : userAnsObj.userAnswer) : undefined;
      const correct = isAnswerCorrect(submittedValue, q);

      if (correct) {
        calculatedScore += qPoints;
      }

      evaluatedAnswers.push({
        questionId: q.id || `q_${idx + 1}`,
        questionText: q.text,
        userAnswer: submittedValue,
        correctAnswer: q.correctAnswer,
        isCorrect: correct,
        points: correct ? qPoints : 0,
        topic: q.topic || q.bloomLevel || quiz.category || 'Core Concept'
      });
    });
  } else {
    calculatedScore = Number(req.body.score) || 0;
    maxPossibleScore = Number(req.body.maxScore) || 100;
    evaluatedAnswers = answers;
  }

  const finalPercentage = maxPossibleScore > 0 
    ? Math.round((calculatedScore / maxPossibleScore) * 100) 
    : (Number(req.body.percentage) || 0);

  const attemptId = `att_${uuidv4().slice(0, 8)}`;
  const newAttempt = {
    _id: attemptId,
    id: attemptId,
    quizId: targetId,
    quizTitle: effectiveQuizTitle,
    category: quiz ? quiz.category : 'General',
    userId,
    userName,
    score: calculatedScore,
    maxScore: maxPossibleScore,
    percentage: finalPercentage,
    timeSpent: Number(timeSpent) || 120,
    answers: evaluatedAnswers,
    weakTopics: Array.isArray(weakTopics) ? weakTopics : [],
    createdAt: new Date().toISOString()
  };

  // Save Attempt to MongoDB Atlas
  try {
    if (mongoose.connection.readyState === 1) {
      await Attempt.create(newAttempt);
    }
  } catch (e) {
    console.warn('MongoDB Attempt.create warning:', e.message);
  }

  mockDB.attempts.unshift(newAttempt);

  // AUTOMATIC CERTIFICATE ISSUANCE on Score >= 80%
  let certificateEarned = false;
  let certificate = null;

  if (finalPercentage >= 80) {
    certificateEarned = true;
    
    // Check if certificate already exists for this user and quiz
    let existingCert = null;
    try {
      if (mongoose.connection.readyState === 1) {
        existingCert = await Certificate.findOne({
          $or: [
            { userId, quizId: targetId },
            { userId, quizCredentialId },
            { userId, quizTitle: effectiveQuizTitle }
          ]
        }).lean();
      }
    } catch (e) {}

    if (!existingCert) {
      existingCert = mockDB.certificates.find(c => 
        (c.userId === userId) && (c.quizId === targetId || c.quizTitle === effectiveQuizTitle || c.quizCredentialId === quizCredentialId)
      );
    }

    if (existingCert) {
      certificate = existingCert;
    } else {
      const generatedCertId = `QF-AI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const certDocId = `cert_${uuidv4().slice(0, 8)}`;
      
      const newCert = {
        _id: certDocId,
        id: certDocId,
        certificateId: generatedCertId,
        recipientName: userName,
        recipientEmail: req.user?.email || '',
        userId: userId,
        quizId: targetId,
        quizCredentialId: quizCredentialId,
        quizTitle: effectiveQuizTitle,
        score: finalPercentage,
        issueDate: new Date().toISOString().split('T')[0],
        verificationUrl: `/verify/${generatedCertId}`,
        skills: ['Cognitive Mastery', 'Bloom Level Evaluation', 'Critical Problem Solving', 'Active Recall Mastery']
      };

      try {
        if (mongoose.connection.readyState === 1) {
          await Certificate.create(newCert);
        }
      } catch (e) {
        console.warn('MongoDB Certificate.create warning:', e.message);
      }

      mockDB.certificates.unshift(newCert);
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

module.exports = router;
