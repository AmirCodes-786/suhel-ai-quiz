const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { initBattleSockets } = require('./sockets/battleSocket');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const generatorRoutes = require('./routes/generatorRoutes');
const quizRoutes = require('./routes/quizRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const teamRoutes = require('./routes/teamRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Allowed origins for CORS
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

initBattleSockets(io);

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limiter for expensive AI generation endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'AI generation rate limit exceeded. Please wait before generating more content.' }
});
app.use('/api/generate', aiLimiter);

// Connect to MongoDB Atlas
connectDB();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'QuizForge AI Engine',
    version: '1.0.0-PROD',
    aiEngines: ['Google Gemini (3.5/3.7/Flash)', 'Groq (GPT-OSS/Qwen)', 'A4F Gateway', 'Smart Fallback Engine'],
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generatorRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 QuizForge AI Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Battle Arena listening on port ${PORT}`);
});
