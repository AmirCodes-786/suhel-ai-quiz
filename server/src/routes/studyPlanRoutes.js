const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get User Study Plans
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const plans = mockDB.studyPlans.filter(p => p.userId === userId);
  res.json({ success: true, plans });
});

// Toggle Task Completion (Owner only)
router.patch('/:planId/task/:taskId', authMiddleware, (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const { planId, taskId } = req.params;
  const { completed } = req.body;

  const plan = mockDB.studyPlans.find(p => p._id === planId || p.id === planId);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Study Plan not found' });
  }

  if (plan.userId && plan.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied to this study plan' });
  }

  const task = plan.tasks.find(t => t.id === taskId || t._id === taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.completed = completed !== undefined ? completed : !task.completed;
  
  // Recalculate progress
  const completedCount = plan.tasks.filter(t => t.completed).length;
  plan.progress = Math.round((completedCount / (plan.tasks.length || 1)) * 100);

  res.json({ success: true, task, plan });
});

module.exports = router;
