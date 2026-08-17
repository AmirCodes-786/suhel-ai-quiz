const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Get Admin Telemetry & Metrics
router.get('/metrics', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    telemetry: {
      totalUsers: mockDB.users.length + 1280,
      activeQuizzes: mockDB.quizzes.length + 4320,
      totalAttempts: mockDB.attempts.length + 28940,
      mrr: '$18,420',
      activeSockets: mockDB.battleRooms.size,
      aiModelLatency: '240ms',
      systemHealth: '100% Operational'
    },
    recentUsers: mockDB.users,
    quizzes: mockDB.quizzes
  });
});

// Admin Update User Role
router.patch('/users/:userId/role', authMiddleware, adminMiddleware, (req, res) => {
  const { role } = req.body;
  const user = mockDB.users.find(u => u._id === req.params.userId || u.id === req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.role = role;
  res.json({ success: true, user });
});

module.exports = router;
