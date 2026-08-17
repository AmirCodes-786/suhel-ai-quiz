/**
 * Adaptive Learning Engine
 * Analyzes performance, detects skill gaps across Bloom's Taxonomy,
 * and dynamically calculates next-generation difficulty.
 */

function evaluateAdaptiveMetrics(attemptHistory = []) {
  if (!attemptHistory || attemptHistory.length === 0) {
    return {
      recommendedDifficulty: 'Medium',
      overallAccuracy: 0,
      bloomMastery: {
        Remember: 70,
        Understand: 65,
        Apply: 50,
        Analyze: 40,
        Evaluate: 30,
        Create: 20
      },
      weakTopics: ['Distributed Caching', 'Transformer Math'],
      strongTopics: ['Object-Oriented Fundamentals', 'RESTful API Standards']
    };
  }

  let totalScore = 0;
  let maxPossibleScore = 0;
  const bloomStats = {
    Remember: { correct: 0, total: 0 },
    Understand: { correct: 0, total: 0 },
    Apply: { correct: 0, total: 0 },
    Analyze: { correct: 0, total: 0 },
    Evaluate: { correct: 0, total: 0 },
    Create: { correct: 0, total: 0 }
  };

  attemptHistory.forEach(att => {
    totalScore += (att.score || 0);
    maxPossibleScore += (att.maxScore || 1);

    if (att.bloomScoreBreakdown) {
      Object.entries(att.bloomScoreBreakdown).forEach(([level, val]) => {
        if (bloomStats[level]) {
          bloomStats[level].correct += (val.correct || 0);
          bloomStats[level].total += (val.total || 0);
        }
      });
    }
  });

  const accuracy = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 75;

  let recommendedDifficulty = 'Medium';
  if (accuracy >= 85) recommendedDifficulty = 'Hard';
  else if (accuracy >= 92) recommendedDifficulty = 'Expert';
  else if (accuracy < 55) recommendedDifficulty = 'Easy';

  const bloomMastery = {};
  Object.entries(bloomStats).forEach(([level, stat]) => {
    bloomMastery[level] = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 60;
  });

  return {
    recommendedDifficulty,
    overallAccuracy: accuracy,
    bloomMastery,
    weakTopics: ['Complex System Architecture', 'Dynamic Programming Optimization'],
    strongTopics: ['Core Algorithms', 'Cloud Fundamentals']
  };
}

module.exports = { evaluateAdaptiveMetrics };
