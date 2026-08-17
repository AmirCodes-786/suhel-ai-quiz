const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'quizforge_ai_super_secret_jwt_key_2026_production';

// Get Current User
router.get('/me', authMiddleware, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const user = mockDB.users.find(u => u._id === userId || u.id === userId || (req.user?.email && u.email === req.user.email));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and Email are required.' });
  }

  const existing = mockDB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'User with this email already exists.' });
  }

  const newUser = {
    _id: `user_${uuidv4().slice(0, 8)}`,
    id: `user_${uuidv4().slice(0, 8)}`,
    name,
    email,
    password: password ? await bcrypt.hash(password, 10) : undefined,
    role: 'user',
    plan: 'free',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 },
    createdAt: new Date().toISOString()
  };

  mockDB.users.push(newUser);
  const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ success: true, user: newUser, token });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = mockDB.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.password && password) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  }

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user, token });
});

// Clerk Sync Webhook / Profile Sync
router.post('/clerk-sync', (req, res) => {
  const { clerkId, email, name, avatar } = req.body;
  let user = mockDB.users.find(u => (clerkId && u.clerkId === clerkId) || (email && u.email.toLowerCase() === email.toLowerCase()));

  if (!user) {
    user = {
      _id: clerkId || `user_${uuidv4().slice(0, 8)}`,
      id: clerkId || `user_${uuidv4().slice(0, 8)}`,
      clerkId,
      name: name || 'User',
      email: email || '',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'user',
      plan: 'pro',
      stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 },
      createdAt: new Date().toISOString()
    };
    mockDB.users.push(user);
  } else {
    // Update profile info
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (clerkId) user.clerkId = clerkId;
  }

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user, token });
});

module.exports = router;
