const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Flashcard = require('../models/Flashcard');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');

// 1. Live Real-Time Student Analytics (Strictly scoped to authenticated user)
router.get('/student', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  let userAttempts = [];
  let userQuizzes = [];
  let userFlashcardSets = [];
  let isDbQueried = false;

  // Query MongoDB Atlas if connected
  try {
    if (mongoose.connection.readyState === 1) {
      const [dbAttempts, dbQuizzes, dbFlashcards] = await Promise.all([
        Attempt.find({ userId }).sort({ createdAt: 1 }).lean(),
        Quiz.find({ $or: [{ creator: userId }, { userId: userId }] }).lean(),
        Flashcard.find({ userId }).lean()
      ]);

      userAttempts = dbAttempts || [];
      userQuizzes = dbQuizzes || [];
      userFlashcardSets = dbFlashcards || [];
      isDbQueried = true;
    }
  } catch (err) {
    console.warn('DB analytics fetch warning, using in-memory store:', err.message);
  }

  // Fallback to in-memory store only if DB query wasn't active
  if (!isDbQueried) {
    userAttempts = mockDB.attempts.filter(a => a.userId === userId);
    userQuizzes = mockDB.quizzes.filter(q => q.creator === userId || q.userId === userId);
    userFlashcardSets = mockDB.flashcards.filter(f => f.userId === userId);
  }

  const totalAttemptsCount = userAttempts.length;
  let totalScoreSum = 0;
  let totalQuestionsAnswered = 0;
  let totalCorrectAnswers = 0;
  let totalStudySeconds = 0;

  const topicAccuracyMap = new Map(); // topic -> { correct, total }
  const bloomAccuracyMap = new Map(); // bloomLevel -> { correct, total }

  userAttempts.forEach(att => {
    totalScoreSum += (att.percentage || (att.maxScore > 0 ? (att.score / att.maxScore) * 100 : 0));
    totalStudySeconds += (att.timeSpent || 0);

    if (Array.isArray(att.answers)) {
      att.answers.forEach(ans => {
        totalQuestionsAnswered += 1;
        if (ans.isCorrect) totalCorrectAnswers += 1;

        const topic = ans.topic || att.category || 'General';
        const currTopic = topicAccuracyMap.get(topic) || { correct: 0, total: 0 };
        currTopic.total += 1;
        if (ans.isCorrect) currTopic.correct += 1;
        topicAccuracyMap.set(topic, currTopic);
      });
    }

    if (att.weakTopics && Array.isArray(att.weakTopics)) {
      att.weakTopics.forEach(wt => {
        const curr = topicAccuracyMap.get(wt) || { correct: 0, total: 0 };
        curr.total += 1;
        topicAccuracyMap.set(wt, curr);
      });
    }
  });

  const averageScore = totalAttemptsCount > 0 ? Math.round(totalScoreSum / totalAttemptsCount) : 0;
  const accuracyRate = totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100 * 10) / 10 : (totalAttemptsCount > 0 ? averageScore : 0);

  // 1. Performance Over Time Trend (Real chronological sessions or days)
  let performanceTrend = [];
  if (totalAttemptsCount > 0) {
    performanceTrend = userAttempts.slice(-10).map((att, idx) => {
      const dateStr = att.createdAt ? new Date(att.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : `Session ${idx + 1}`;
      const score = Math.round(att.percentage || (att.maxScore > 0 ? (att.score / att.maxScore) * 100 : 0));
      return {
        date: dateStr,
        score,
        quizTitle: att.quizTitle || 'Assessment'
      };
    });
  }

  // 2. Real Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];

  topicAccuracyMap.forEach((data, topic) => {
    const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    if (acc >= 80) {
      strengths.push({ topic, score: acc, totalQuestions: data.total });
    } else {
      weaknesses.push({ topic, score: acc, totalQuestions: data.total });
    }
  });

  // If no granular topic answers yet, derive from overall quiz categories
  if (strengths.length === 0 && weaknesses.length === 0 && totalAttemptsCount > 0) {
    if (averageScore >= 80) {
      strengths.push({ topic: userAttempts[0]?.category || 'General Mastery', score: averageScore, totalQuestions: totalQuestionsAnswered || 5 });
    } else {
      weaknesses.push({ topic: userAttempts[0]?.category || 'General Review', score: averageScore, totalQuestions: totalQuestionsAnswered || 5 });
    }
  }

  // 3. Topic Mastery Breakdown
  const topicMastery = [];
  userQuizzes.forEach(q => {
    const cat = q.category || 'General';
    const existing = topicMastery.find(t => t.topic === cat);
    if (!existing) {
      const topicStats = topicAccuracyMap.get(cat);
      const mastery = topicStats && topicStats.total > 0 ? Math.round((topicStats.correct / topicStats.total) * 100) : averageScore;
      topicMastery.push({
        topic: cat,
        mastery,
        questions: q.questions?.length || 5
      });
    }
  });

  res.json({
    success: true,
    isNewUser: totalAttemptsCount === 0,
    stats: {
      totalQuizzes: userQuizzes.length,
      totalAttempts: totalAttemptsCount,
      averageScore,
      accuracyRate,
      studyTimeFormatted: totalStudySeconds >= 3600 ? `${Math.floor(totalStudySeconds / 3600)}h ${Math.floor((totalStudySeconds % 3600) / 60)}m` : `${Math.floor(totalStudySeconds / 60)}m`,
      totalQuestionsAnswered
    },
    performanceTrend,
    strengths,
    weaknesses,
    topicMastery
  });
});

module.exports = router;
