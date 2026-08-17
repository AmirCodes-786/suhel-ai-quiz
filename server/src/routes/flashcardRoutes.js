const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Flashcard = require('../models/Flashcard');
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Get all Flashcard sets for the user
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  
  try {
    if (mongoose.connection.readyState === 1) {
      const dbSets = await Flashcard.find({ userId }).sort({ createdAt: -1 }).lean();
      if (dbSets && dbSets.length > 0) {
        return res.json({ success: true, sets: dbSets });
      }
    }
  } catch (err) {
    console.warn('DB flashcard fetch warning, falling back to mockDB:', err.message);
  }

  const sets = mockDB.flashcards.filter(f => f.userId === userId);
  res.json({ success: true, sets });
});

// Update Card Mastery / Bookmark
router.patch('/:setId/card/:cardId', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const { setId, cardId } = req.params;
  const { mastery, bookmarked } = req.body;

  // 1. Update in MongoDB if connected
  try {
    if (mongoose.connection.readyState === 1) {
      const updateFields = {};
      if (mastery) updateFields['cards.$.mastery'] = mastery;
      if (bookmarked !== undefined) updateFields['cards.$.bookmarked'] = bookmarked;
      updateFields['cards.$.lastReviewed'] = new Date();

      const updatedSet = await Flashcard.findOneAndUpdate(
        { _id: setId, userId, 'cards.id': cardId },
        { $set: updateFields },
        { new: true }
      );

      if (updatedSet) {
        const card = updatedSet.cards.find(c => c.id === cardId || c._id?.toString() === cardId);
        return res.json({ success: true, card, set: updatedSet });
      }
    }
  } catch (err) {
    console.warn('DB flashcard update warning:', err.message);
  }

  // 2. In-memory update
  const set = mockDB.flashcards.find(s => s._id === setId || s.id === setId);
  if (!set) {
    return res.status(404).json({ success: false, message: 'Flashcard set not found' });
  }

  if (set.userId && set.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this flashcard set' });
  }

  const card = set.cards.find(c => c.id === cardId || c._id === cardId);
  if (!card) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  if (mastery) card.mastery = mastery;
  if (bookmarked !== undefined) card.bookmarked = bookmarked;
  card.lastReviewed = new Date().toISOString();

  res.json({ success: true, card, set });
});

// Delete Flashcard Set
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const { id } = req.params;
  
  const set = mockDB.flashcards.find(s => s._id === id || s.id === id);
  if (set && set.userId && set.userId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this flashcard set' });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      await Flashcard.deleteOne({ _id: id, userId });
    }
  } catch (err) {
    console.warn('DB flashcard delete warning:', err.message);
  }

  mockDB.flashcards = mockDB.flashcards.filter(s => s._id !== id && s.id !== id);
  res.json({ success: true, message: 'Flashcard set deleted successfully' });
});

// Create Custom Flashcard Set
router.post('/', authMiddleware, async (req, res) => {
  const { title, topic, cards } = req.body;
  const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
  const newId = `fc_${uuidv4().slice(0, 8)}`;

  const setPayload = {
    _id: newId,
    id: newId,
    userId,
    title: title || 'Custom Flashcards',
    topic: topic || 'General',
    cards: (cards || []).map((c, idx) => ({
      id: `c_${uuidv4().slice(0, 6)}_${idx + 1}`,
      front: c.front,
      back: c.back,
      mastery: c.mastery || 'unseen',
      bookmarked: Boolean(c.bookmarked)
    })),
    createdAt: new Date().toISOString()
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const created = await Flashcard.create(setPayload);
      mockDB.flashcards.unshift(created.toObject());
      return res.status(201).json({ success: true, flashcards: created });
    }
  } catch (err) {
    console.warn('DB flashcard create warning:', err.message);
  }

  mockDB.flashcards.unshift(setPayload);
  res.status(201).json({ success: true, flashcards: setPayload });
});

module.exports = router;
