const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Get User Teams
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const userTeams = mockDB.teams.filter(t => 
    t.ownerId === userId || t.members.some(m => m.userId === userId || (req.user?.email && m.email === req.user?.email))
  );
  res.json({ success: true, teams: userTeams });
});

// Create Team
router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body;
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const userName = req.headers['x-user-name']
    ? decodeURIComponent(req.headers['x-user-name'])
    : (req.user?.name || 'User');
  const userEmail = req.user?.email || '';

  const teamId = `team_${uuidv4().slice(0, 8)}`;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newTeam = {
    _id: teamId,
    id: teamId,
    name: name || 'New Workspace',
    ownerId: userId,
    inviteCode,
    members: [
      {
        userId,
        name: userName,
        email: userEmail,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }
    ],
    quizzes: [],
    createdAt: new Date().toISOString()
  };

  mockDB.teams.unshift(newTeam);
  res.status(201).json({ success: true, team: newTeam });
});

// Invite Member
router.post('/:id/members', authMiddleware, (req, res) => {
  const { email, role = 'member' } = req.body;
  const team = mockDB.teams.find(t => t._id === req.params.id || t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const newMember = {
    userId: `user_${uuidv4().slice(0, 8)}`,
    name: email ? email.split('@')[0] : 'Member',
    email: email || '',
    role,
    joinedAt: new Date().toISOString()
  };

  team.members.push(newMember);
  res.status(201).json({ success: true, member: newMember, team });
});

// Share Quiz to Team
router.post('/:id/quizzes', authMiddleware, (req, res) => {
  const { quizId } = req.body;
  const team = mockDB.teams.find(t => t._id === req.params.id || t.id === req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (quizId && !team.quizzes.includes(quizId)) {
    team.quizzes.push(quizId);
  }

  res.json({ success: true, team });
});

module.exports = router;
