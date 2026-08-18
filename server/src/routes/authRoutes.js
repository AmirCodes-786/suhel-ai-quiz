const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { ADMIN_EMAILS, isUserAdmin } = require('../middleware/generationLimiter');

const JWT_SECRET = process.env.JWT_SECRET || 'quizforge_ai_super_secret_jwt_key_2026_production';

// Get Current User with Admin Status and Limits
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userEmail = req.user?.email || req.headers['x-user-email'];

  let user = null;
  try {
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ $or: [{ _id: userId }, { id: userId }, { email: userEmail }] }).lean();
    }
  } catch (e) {}

  if (!user) {
    user = mockDB.users.find(u => u._id === userId || u.id === userId || (userEmail && u.email === userEmail));
  }

  if (!user) {
    const cleanName = (userEmail ? userEmail.split('@')[0] : 'User');
    user = {
      _id: userId || `user_${uuidv4().slice(0, 8)}`,
      id: userId || `user_${uuidv4().slice(0, 8)}`,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email: userEmail || '',
      role: isUserAdmin(null, userEmail, req.headers) ? 'admin' : 'user',
      plan: 'pro',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`
    };
  }

  const isAdmin = isUserAdmin(user, user.email, req.headers);
  res.json({ success: true, user: { ...user, isAdmin, role: isAdmin ? 'admin' : user.role } });
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
  const userId = req.user?.id || req.user?._id || req.headers['x-user-id'];
  const userEmail = req.user?.email || req.headers['x-user-email'];
  const { name, email, avatar, role, bio, headline } = req.body;

  let updatedUser = null;

  try {
    if (mongoose.connection.readyState === 1) {
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (avatar) updateData.avatar = avatar;
      if (role) updateData.role = role;
      if (bio) updateData.bio = bio;
      if (headline) updateData.headline = headline;

      updatedUser = await User.findOneAndUpdate(
        { $or: [{ _id: userId }, { id: userId }, { email: userEmail }] },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();
    }
  } catch (e) {
    console.warn('MongoDB profile update warning:', e.message);
  }

  let inMemUser = mockDB.users.find(u => u._id === userId || u.id === userId || (userEmail && u.email === userEmail));
  if (!inMemUser) {
    inMemUser = {
      _id: userId || `user_${uuidv4().slice(0, 8)}`,
      id: userId || `user_${uuidv4().slice(0, 8)}`,
      name: name || 'User',
      email: email || userEmail || '',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`,
      role: 'user',
      plan: 'pro',
      stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 },
      createdAt: new Date().toISOString()
    };
    mockDB.users.push(inMemUser);
  }

  if (name) inMemUser.name = name.trim();
  if (email) inMemUser.email = email.toLowerCase().trim();
  if (avatar) inMemUser.avatar = avatar;
  if (role) inMemUser.role = role;
  if (bio) inMemUser.bio = bio;
  if (headline) inMemUser.headline = headline;

  const finalUser = updatedUser || inMemUser;
  const isAdmin = isUserAdmin(finalUser, finalUser.email, req.headers);
  const token = jwt.sign({ id: finalUser._id, email: finalUser.email, name: finalUser.name, role: finalUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ 
    success: true, 
    user: { ...finalUser, isAdmin, role: isAdmin ? 'admin' : finalUser.role }, 
    token, 
    message: 'Profile updated successfully!' 
  });
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

  const isAdmin = isUserAdmin(null, email, req.headers);

  const newUser = {
    _id: `user_${uuidv4().slice(0, 8)}`,
    id: `user_${uuidv4().slice(0, 8)}`,
    name,
    email,
    password: password ? await bcrypt.hash(password, 10) : undefined,
    role: isAdmin ? 'admin' : 'user',
    plan: 'pro',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 },
    createdAt: new Date().toISOString()
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await User.create(newUser);
    }
  } catch (e) {}

  mockDB.users.push(newUser);
  const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ success: true, user: { ...newUser, isAdmin }, token });
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

  const isAdmin = isUserAdmin(user, user.email, req.headers);
  const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user: { ...user, isAdmin }, token });
});

// Clerk Sync Webhook / Profile Sync
router.post('/clerk-sync', (req, res) => {
  const { clerkId, email, name, avatar } = req.body;
  let user = mockDB.users.find(u => (clerkId && u.clerkId === clerkId) || (email && u.email.toLowerCase() === email.toLowerCase()));

  const isAdmin = isUserAdmin(null, email, req.headers);

  if (!user) {
    user = {
      _id: clerkId || `user_${uuidv4().slice(0, 8)}`,
      id: clerkId || `user_${uuidv4().slice(0, 8)}`,
      clerkId,
      name: name || 'User',
      email: email || '',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: isAdmin ? 'admin' : 'user',
      plan: 'pro',
      stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 },
      createdAt: new Date().toISOString()
    };
    mockDB.users.push(user);
  } else {
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (clerkId) user.clerkId = clerkId;
    if (isAdmin) user.role = 'admin';
  }

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user: { ...user, isAdmin }, token });
});

module.exports = router;
