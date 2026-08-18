const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const Flashcard = require('../models/Flashcard');
const Certificate = require('../models/Certificate');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');

function getTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function formatStudyTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const range = req.query.range || '7d';

  let userQuizzes = [];
  let userAttempts = [];
  let userFlashcards = [];
  let userCertificates = [];

  // Query MongoDB Atlas live if connected
  try {
    if (mongoose.connection.readyState === 1) {
      const [dbQuizzes, dbAttempts, dbFlashcards, dbCertificates] = await Promise.all([
        Quiz.find({ $or: [{ creator: userId }, { isPublic: true }] }).sort({ createdAt: -1 }).lean(),
        Attempt.find({ userId }).sort({ createdAt: -1 }).lean(),
        Flashcard.find({ userId }).sort({ createdAt: -1 }).lean(),
        Certificate.find({ userId }).sort({ createdAt: -1 }).lean()
      ]);

      if (dbQuizzes && dbQuizzes.length > 0) userQuizzes = dbQuizzes;
      if (dbAttempts && dbAttempts.length > 0) userAttempts = dbAttempts;
      if (dbFlashcards && dbFlashcards.length > 0) userFlashcards = dbFlashcards;
      if (dbCertificates && dbCertificates.length > 0) userCertificates = dbCertificates;
    }
  } catch (err) {
    console.warn('Dashboard MongoDB query warning, falling back to in-memory store:', err.message);
  }

  // Fallback to in-memory store if DB had nothing
  if (userQuizzes.length === 0) {
    userQuizzes = mockDB.quizzes.filter(q => q.creator === userId || q.isPublic);
  }
  if (userAttempts.length === 0) {
    userAttempts = mockDB.attempts.filter(a => a.userId === userId);
  }
  if (userFlashcards.length === 0) {
    userFlashcards = mockDB.flashcards.filter(f => f.userId === userId);
  }
  if (userCertificates.length === 0) {
    userCertificates = mockDB.certificates.filter(c => c.userId === userId);
  }

  const isNewUser = userQuizzes.length === 0 && userAttempts.length === 0;

  // 2. Real Overview Metrics Calculation
  let totalScoreSum = 0;
  let totalSeconds = 0;
  let totalAnswered = 0;
  let totalCorrect = 0;
  let attemptsThisWeek = 0;
  let studyTimeThisWeek = 0;

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  let currentPeriodScores = [];
  let previousPeriodScores = [];

  userAttempts.forEach(att => {
    const attTime = new Date(att.createdAt || now).getTime();
    totalScoreSum += Number(att.percentage || 0);
    totalSeconds += Number(att.timeSpent || 0);

    if (attTime >= oneWeekAgo) {
      attemptsThisWeek += 1;
      studyTimeThisWeek += Number(att.timeSpent || 0);
      currentPeriodScores.push(Number(att.percentage || 0));
    } else if (attTime >= twoWeeksAgo) {
      previousPeriodScores.push(Number(att.percentage || 0));
    }

    if (att.answers && Array.isArray(att.answers)) {
      totalAnswered += att.answers.length;
      totalCorrect += att.answers.filter(a => a.isCorrect === true).length;
    }
  });

  const avgScore = userAttempts.length > 0 ? Math.round(totalScoreSum / userAttempts.length) : 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : (userAttempts.length > 0 ? avgScore : 0);

  let averageScoreDiff = 'No previous baseline';
  if (currentPeriodScores.length > 0 && previousPeriodScores.length > 0) {
    const currAvg = currentPeriodScores.reduce((a, b) => a + b, 0) / currentPeriodScores.length;
    const prevAvg = previousPeriodScores.reduce((a, b) => a + b, 0) / previousPeriodScores.length;
    const diff = Math.round(currAvg - prevAvg);
    averageScoreDiff = `${diff >= 0 ? '+' : ''}${diff}% vs previous period`;
  } else if (userAttempts.length > 0) {
    averageScoreDiff = `${userAttempts.length} total attempt${userAttempts.length > 1 ? 's' : ''}`;
  }

  const overview = {
    averageScore: avgScore,
    averageScoreDiff,
    quizzesCompleted: userAttempts.length,
    quizzesCompletedContext: `${attemptsThisWeek} this week`,
    studyTime: formatStudyTime(totalSeconds),
    studyTimeContext: `+${formatStudyTime(studyTimeThisWeek)} this week`,
    accuracy: accuracy,
    accuracyContext: totalAnswered > 0 ? `Across ${totalAnswered} questions` : 'No questions answered yet',
    certificatesEarned: userCertificates.length
  };

  // 3. Real Performance Trend Data
  const performance = [];
  if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const dayAttempts = userAttempts.filter(a => {
        const t = new Date(a.createdAt).getTime();
        return t >= dayStart && t <= dayEnd;
      });

      const dayAvg = dayAttempts.length > 0
        ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / dayAttempts.length)
        : null;

      performance.push({
        date: dayLabel,
        score: dayAvg,
        attempts: dayAttempts.length
      });
    }
  } else if (range === '30d') {
    for (let w = 4; w >= 1; w--) {
      const weekStart = now - w * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - (w - 1) * 7 * 24 * 60 * 60 * 1000;
      const weekAttempts = userAttempts.filter(a => {
        const t = new Date(a.createdAt).getTime();
        return t >= weekStart && t < weekEnd;
      });

      const weekAvg = weekAttempts.length > 0
        ? Math.round(weekAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / weekAttempts.length)
        : null;

      performance.push({
        date: `Wk ${5 - w}`,
        score: weekAvg,
        attempts: weekAttempts.length
      });
    }
  } else {
    for (let m = 3; m >= 1; m--) {
      const monthStart = now - m * 30 * 24 * 60 * 60 * 1000;
      const monthEnd = now - (m - 1) * 30 * 24 * 60 * 60 * 1000;
      const monthAttempts = userAttempts.filter(a => {
        const t = new Date(a.createdAt).getTime();
        return t >= monthStart && t < monthEnd;
      });

      const monthAvg = monthAttempts.length > 0
        ? Math.round(monthAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / monthAttempts.length)
        : null;

      performance.push({
        date: `M${4 - m}`,
        score: monthAvg,
        attempts: monthAttempts.length
      });
    }
  }

  // 4. Real Topic Mastery
  const categoryStats = {};
  userQuizzes.forEach(q => {
    const cat = q.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { topic: cat, totalQuestions: 0, quizzesCount: 0, scores: [] };
    }
    categoryStats[cat].quizzesCount += 1;
    categoryStats[cat].totalQuestions += (q.questions?.length || 0);
  });

  userAttempts.forEach(att => {
    const cat = att.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { topic: cat, totalQuestions: 0, quizzesCount: 0, scores: [] };
    }
    categoryStats[cat].scores.push(Number(att.percentage || 0));
  });

  const topicMastery = Object.values(categoryStats).map(c => {
    const avgCatScore = c.scores.length > 0
      ? Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length)
      : (c.quizzesCount > 0 ? 0 : 0);
    return {
      topic: c.topic,
      mastery: avgCatScore,
      questions: c.totalQuestions
    };
  });

  // 5. Real Recent Quizzes List
  const recentQuizzes = userQuizzes.slice(0, 6).map(q => {
    const attemptsOnQuiz = userAttempts.filter(a => a.quizId === q._id || a.quizId === q.id);
    const lastAttempt = attemptsOnQuiz.length > 0 ? attemptsOnQuiz[0] : null;

    return {
      id: q._id || q.id,
      title: q.title,
      category: q.category || 'General',
      difficulty: q.difficulty || 'Medium',
      questionCount: q.questions?.length || 0,
      credentialId: q.credentialId,
      score: lastAttempt ? lastAttempt.percentage : null,
      date: getTimeAgo(q.createdAt),
      status: lastAttempt ? 'Completed' : 'Ready'
    };
  });

  // 6. Real Continue Learning
  let continueLearning = null;
  if (userQuizzes.length > 0) {
    const targetQuiz = userQuizzes[0];
    const attempt = userAttempts.find(a => a.quizId === targetQuiz._id || a.quizId === targetQuiz.id);
    const totalQ = targetQuiz.questions?.length || 5;
    const completedQ = attempt ? (attempt.answers?.length || totalQ) : 0;

    continueLearning = {
      quizId: targetQuiz._id || targetQuiz.id,
      title: targetQuiz.title,
      category: targetQuiz.category || 'General',
      completedQuestions: completedQ,
      totalQuestions: totalQ,
      progress: Math.round((completedQ / (totalQ || 1)) * 100),
      isCompleted: Boolean(attempt)
    };
  }

  // 7. Real Weak Topics
  const weakTopicCounts = {};
  userAttempts.forEach(att => {
    if (att.answers && Array.isArray(att.answers)) {
      att.answers.forEach(ans => {
        const topicName = ans.topic || ans.bloomLevel || att.category || 'Core Concept';
        if (!weakTopicCounts[topicName]) {
          weakTopicCounts[topicName] = { topic: topicName, total: 0, correct: 0 };
        }
        weakTopicCounts[topicName].total += 1;
        if (ans.isCorrect) {
          weakTopicCounts[topicName].correct += 1;
        }
      });
    }
  });

  const weakTopics = Object.values(weakTopicCounts)
    .map(t => ({
      topic: t.topic,
      accuracy: Math.round((t.correct / t.total) * 100),
      totalQuestions: t.total
    }))
    .filter(t => t.accuracy < 85)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  // 8. Real Activity Feed
  const recentActivity = [];
  userAttempts.forEach(att => {
    recentActivity.push({
      id: `act_att_${att._id || att.id}`,
      type: 'quiz_completed',
      title: `Completed "${att.quizTitle}"`,
      score: `${att.percentage}%`,
      timestampRaw: new Date(att.createdAt || now).getTime(),
      timestamp: getTimeAgo(att.createdAt)
    });
  });

  userQuizzes.forEach(q => {
    recentActivity.push({
      id: `act_q_${q._id || q.id}`,
      type: 'quiz_created',
      title: `Created "${q.title}"`,
      timestampRaw: new Date(q.createdAt || now).getTime(),
      timestamp: getTimeAgo(q.createdAt)
    });
  });

  userFlashcards.forEach(fc => {
    recentActivity.push({
      id: `act_fc_${fc._id || fc.id}`,
      type: 'flashcard_reviewed',
      title: `Created deck "${fc.title}"`,
      timestampRaw: new Date(fc.createdAt || now).getTime(),
      timestamp: getTimeAgo(fc.createdAt)
    });
  });

  recentActivity.sort((a, b) => b.timestampRaw - a.timestampRaw);

  res.json({
    success: true,
    isNewUser,
    overview,
    performance,
    topicMastery,
    recentQuizzes,
    continueLearning,
    weakTopics,
    recentActivity: recentActivity.slice(0, 5)
  });
});

module.exports = router;
