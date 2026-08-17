const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');
const { upload } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  generateQuizFromContent, 
  regenerateQuestionAI, 
  generateFlashcardsAI, 
  generateStudyPlanAI 
} = require('../services/aiService');
const { parseUploadedDocument } = require('../services/documentParserService');
const { scrapeUrlContent, extractYoutubeContent } = require('../services/webScraperService');
const { mockDB } = require('../models/store');
const { v4: uuidv4 } = require('uuid');

// 1. Generate Quiz from 7 Input Modalities with strict question count enforcement & Credential ID
router.post('/quiz', upload.single('file'), authMiddleware, async (req, res, next) => {
  try {
    const {
      sourceType = 'text',
      text = '',
      url = '',
      youtubeUrl = '',
      title = '',
      category = 'General',
      difficulty = 'Medium',
      questionCount = 5,
      bloomLevels = 'Remember,Understand,Apply',
      questionTypes = 'mcq,true_false'
    } = req.body;

    const parsedBloomLevels = typeof bloomLevels === 'string' ? bloomLevels.split(',').map(s => s.trim()) : bloomLevels;
    const parsedQuestionTypes = typeof questionTypes === 'string' ? questionTypes.split(',').map(s => s.trim()) : questionTypes;
    
    // Support 5, 10, 15, 20, 30, 50 up to 50 questions
    const requestedCount = Math.min(50, Math.max(3, parseInt(questionCount, 10) || 5));

    let extractedContent = (text || '').trim();
    let computedTitle = (title || '').trim();

    // Handle File Uploads (PDF, DOCX, PPT, Image)
    if (req.file) {
      extractedContent = await parseUploadedDocument(req.file);
      if (!computedTitle) {
        computedTitle = req.file.originalname.replace(/\.[^/.]+$/, "") + " Quiz";
      }
    } else if (sourceType === 'url' && url) {
      const scraped = await scrapeUrlContent(url);
      extractedContent = scraped.content;
      if (!computedTitle) computedTitle = scraped.title;
    } else if (sourceType === 'youtube' && (youtubeUrl || url)) {
      const ytData = await extractYoutubeContent(youtubeUrl || url);
      extractedContent = ytData.content;
      if (!computedTitle) computedTitle = ytData.title;
    }

    if (!extractedContent) {
      return res.status(400).json({
        success: false,
        message: 'Please provide study notes, paste text, upload a document, or enter a URL to generate your quiz.'
      });
    }

    // Call AI Generation Engine with batching & quality validation
    const generatedQuiz = await generateQuizFromContent({
      content: extractedContent,
      sourceType,
      title: computedTitle,
      category,
      difficulty,
      questionCount: requestedCount,
      questionTypes: parsedQuestionTypes,
      bloomLevels: parsedBloomLevels
    });

    // Enforce strict question count validation
    if (!generatedQuiz.questions || generatedQuiz.questions.length !== requestedCount) {
      return res.status(500).json({
        success: false,
        message: `Generation count mismatch: Expected ${requestedCount} questions, but received ${generatedQuiz.questions?.length || 0}. Please retry.`
      });
    }

    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
    const userName = req.headers['x-user-name']
      ? decodeURIComponent(req.headers['x-user-name'])
      : (req.user?.name || 'User');

    const newQuizId = `quiz_${uuidv4().slice(0, 8)}`;
    const uniqueCredentialId = `QF-CR-${uuidv4().slice(0, 6).toUpperCase()}`;

    const savedQuiz = {
      _id: newQuizId,
      id: newQuizId,
      credentialId: uniqueCredentialId,
      ...generatedQuiz,
      creator: userId,
      creatorName: userName,
      isPublic: false,
      views: 1,
      clones: 0,
      rating: 5.0,
      ratingsCount: 1,
      createdAt: new Date().toISOString()
    };

    // Save to MongoDB if connected
    try {
      if (mongoose.connection.readyState === 1) {
        await Quiz.create(savedQuiz);
      }
    } catch (e) {
      console.warn('DB quiz create warning:', e.message);
    }

    mockDB.quizzes.unshift(savedQuiz);

    res.status(201).json({
      success: true,
      quiz: savedQuiz,
      message: `Successfully synthesized ${savedQuiz.questions.length} questions grounded in your study material!`
    });
  } catch (error) {
    if (error.status === 400 || error.message.includes('not contain enough unique information')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

// 2. Regenerate a Single Individual Question
router.post('/question/regenerate', authMiddleware, async (req, res, next) => {
  try {
    const { 
      currentQuestion, 
      sourceContent = '', 
      category = 'General', 
      difficulty = 'Medium', 
      bloomLevel = 'Understand', 
      mode = 'same' 
    } = req.body;

    const regeneratedQuestion = await regenerateQuestionAI({
      currentQuestion,
      sourceContent,
      category,
      difficulty,
      bloomLevel,
      mode
    });

    res.status(200).json({
      success: true,
      question: regeneratedQuestion
    });
  } catch (error) {
    next(error);
  }
});

// 3. Generate Flashcards from Topic / Content with High Entropy
router.post('/flashcards', authMiddleware, async (req, res, next) => {
  try {
    const { topic = '', text = '', count = 6, depthFocus } = req.body;
    const targetTopic = (topic || text || 'Study Notes').trim();

    if (!targetTopic) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a topic or provide text content to generate flashcards.'
      });
    }

    const cardCount = Math.min(20, Math.max(3, parseInt(count, 10) || 6));
    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
    const generated = await generateFlashcardsAI({ topic: targetTopic, text, count: cardCount, depthFocus });
    
    const newId = `fc_${uuidv4().slice(0, 8)}`;
    const newSet = {
      _id: newId,
      id: newId,
      userId,
      ...generated,
      createdAt: new Date().toISOString()
    };

    // Save to MongoDB if connected
    try {
      if (mongoose.connection.readyState === 1) {
        const created = await Flashcard.create(newSet);
        mockDB.flashcards.unshift(created.toObject());
        return res.status(201).json({ success: true, flashcards: created });
      }
    } catch (e) {
      console.warn('DB flashcard create warning:', e.message);
    }

    mockDB.flashcards.unshift(newSet);
    res.status(201).json({ success: true, flashcards: newSet });
  } catch (error) {
    next(error);
  }
});

// 4. Generate Personalized Study Plan
router.post('/study-plan', authMiddleware, async (req, res, next) => {
  try {
    const { weakTopics = [], goal = 'Exam Mastery', targetWeeks = 4 } = req.body;
    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'];
    const generated = await generateStudyPlanAI({ weakTopics, goal, targetWeeks });

    const newId = `sp_${uuidv4().slice(0, 8)}`;
    const newPlan = {
      _id: newId,
      id: newId,
      userId,
      ...generated,
      createdAt: new Date().toISOString()
    };

    mockDB.studyPlans.unshift(newPlan);
    res.status(201).json({ success: true, studyPlan: newPlan });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
