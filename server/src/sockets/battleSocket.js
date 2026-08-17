const mongoose = require('mongoose');
const Battle = require('../models/Battle');
const Quiz = require('../models/Quiz');
const { mockDB } = require('../models/store');
const { generateBattleQuizAI } = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// Valid characters for clean, unambiguous 6-character room codes
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateUniqueRoomCode(rooms) {
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
    if (!rooms.has(code)) return code;
  }
  return `RM${Math.floor(1000 + Math.random() * 9000)}`;
}

function getLeaderboard(players = []) {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      isOnline: p.isOnline !== false
    }));
}

/**
 * Robust, universal answer evaluation handling
 */
function checkAnswerCorrectness(submitted, question) {
  if (submitted === undefined || submitted === null || !question) return false;
  const sStr = String(submitted).trim().toLowerCase();
  const cStr = String(question.correctAnswer || '').trim().toLowerCase();
  const options = (question.options || []).map(o => String(o).trim().toLowerCase());

  // 1. Direct text match
  if (sStr === cStr) return true;

  // 2. Normalize option prefixes (e.g. "A. Option Text" -> "Option Text")
  const cleanS = sStr.replace(/^[a-d][\).\s:-]+/i, '').trim();
  const cleanC = cStr.replace(/^[a-d][\).\s:-]+/i, '').trim();
  if (cleanS && cleanC && cleanS === cleanC) return true;

  // 3. If correctAnswer is letter 'a', 'b', 'c', 'd'
  const letterMap = { a: 0, b: 1, c: 2, d: 3 };
  if (cStr in letterMap) {
    const targetIdx = letterMap[cStr];
    if (options[targetIdx]) {
      const optClean = options[targetIdx].replace(/^[a-d][\).\s:-]+/i, '').trim();
      if (options[targetIdx] === sStr || optClean === cleanS) return true;
    }
  }

  // 4. If correctAnswer is numeric index 0, 1, 2, 3
  const numC = parseInt(cStr, 10);
  if (!isNaN(numC) && numC >= 0 && numC < options.length) {
    const optClean = options[numC].replace(/^[a-d][\).\s:-]+/i, '').trim();
    if (options[numC] === sStr || optClean === cleanS) return true;
  }

  // 5. If submitted is letter 'a', 'b', 'c', 'd'
  if (sStr in letterMap) {
    const targetIdx = letterMap[sStr];
    if (options[targetIdx]) {
      const optClean = options[targetIdx].replace(/^[a-d][\).\s:-]+/i, '').trim();
      if (options[targetIdx] === cStr || optClean === cleanC) return true;
    }
  }

  // 6. Check if submitted matches options array index
  const submittedIdx = options.findIndex(opt => opt === sStr || opt.replace(/^[a-d][\).\s:-]+/i, '').trim() === cleanS);
  if (submittedIdx !== -1) {
    if (cStr in letterMap && letterMap[cStr] === submittedIdx) return true;
    if (!isNaN(numC) && numC === submittedIdx) return true;
    const correctOpt = options[submittedIdx];
    if (correctOpt === cStr || correctOpt.replace(/^[a-d][\).\s:-]+/i, '').trim() === cleanC) return true;
  }

  return false;
}

/**
 * Get human-readable correct answer text
 */
function getDisplayCorrectAnswer(question) {
  if (!question) return '';
  const cStr = String(question.correctAnswer || '').trim();
  const letterMap = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };
  
  if (cStr in letterMap && question.options && question.options[letterMap[cStr]]) {
    return question.options[letterMap[cStr]];
  }

  const numC = parseInt(cStr, 10);
  if (!isNaN(numC) && question.options && question.options[numC]) {
    return question.options[numC];
  }

  return cStr;
}

function initBattleSockets(io) {
  const rooms = mockDB.battleRooms; // Map of roomCode -> roomState
  const roomTimers = new Map(); // roomCode -> { tickInterval, transitionTimeout }

  function clearRoomTimers(code) {
    const active = roomTimers.get(code);
    if (active) {
      if (active.tickInterval) clearInterval(active.tickInterval);
      if (active.transitionTimeout) clearTimeout(active.transitionTimeout);
      roomTimers.delete(code);
    }
  }

  // Authoritative server-driven next question progression
  function startQuestionTimer(roomCode, ioInstance) {
    clearRoomTimers(roomCode);
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'active') return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQ) return;

    room.questionStartTime = Date.now();
    room.answersForCurrentQuestion = new Map();
    const timeLimit = 15; // 15 seconds per question

    // Broadcast synchronized question to all participants
    ioInstance.to(roomCode).emit('new_question', {
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      serverStartTime: room.questionStartTime,
      question: {
        id: currentQ.id || `q_${room.currentQuestionIndex + 1}`,
        text: currentQ.text,
        type: currentQ.type || 'mcq',
        options: currentQ.options || [],
        points: currentQ.points || 10,
        timeLimit
      },
      leaderboard: getLeaderboard(room.players)
    });

    let remainingSeconds = timeLimit;

    const tickInterval = setInterval(() => {
      remainingSeconds -= 1;
      ioInstance.to(roomCode).emit('question_tick', {
        questionIndex: room.currentQuestionIndex,
        timeLeft: Math.max(0, remainingSeconds)
      });

      if (remainingSeconds <= 0) {
        clearInterval(tickInterval);
        handleQuestionTimeout(roomCode, ioInstance);
      }
    }, 1000);

    roomTimers.set(roomCode, { tickInterval, transitionTimeout: null });
  }

  function handleQuestionTimeout(roomCode, ioInstance) {
    clearRoomTimers(roomCode);
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'active') return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    const displayAnswer = getDisplayCorrectAnswer(currentQ);

    // Broadcast correct answer reveal to everyone
    ioInstance.to(roomCode).emit('question_ended', {
      correctAnswer: displayAnswer,
      explanation: currentQ.explanation || '',
      leaderboard: getLeaderboard(room.players)
    });

    // 2.5s pause to digest answer before advancing
    const transitionTimeout = setTimeout(() => {
      advanceQuestion(roomCode, ioInstance);
    }, 2500);

    roomTimers.set(roomCode, { tickInterval: null, transitionTimeout });
  }

  async function advanceQuestion(roomCode, ioInstance) {
    clearRoomTimers(roomCode);
    const room = rooms.get(roomCode);
    if (!room) return;

    room.currentQuestionIndex += 1;

    if (room.currentQuestionIndex < room.quiz.questions.length) {
      startQuestionTimer(roomCode, ioInstance);
    } else {
      // BATTLE FINISHED
      room.status = 'finished';
      const finalLeaderboard = getLeaderboard(room.players);
      const winner = finalLeaderboard[0] || null;

      ioInstance.to(roomCode).emit('battle_finished', {
        winner,
        podium: finalLeaderboard.slice(0, 3),
        leaderboard: finalLeaderboard
      });

      // Save Battle summary to MongoDB Atlas
      try {
        const battleRecord = {
          roomCode,
          quizId: room.quiz._id || room.quiz.id || 'custom_quiz',
          quizTitle: room.quiz.title || 'Live AI Battle Arena',
          hostUserId: room.hostUserId,
          hostName: room.hostName,
          participants: room.players.map((p, idx) => ({
            userId: p.userId || p.id,
            name: p.name,
            avatar: p.avatar,
            score: p.score,
            rank: idx + 1,
            correctAnswersCount: p.answers.filter(a => a.isCorrect).length,
            totalQuestionsAnswered: p.answers.length
          })),
          winner: winner ? { userId: winner.userId || winner.id, name: winner.name, score: winner.score } : null,
          totalQuestions: room.quiz.questions.length,
          durationSeconds: Math.round((Date.now() - (room.battleStartTime || Date.now())) / 1000),
          status: 'completed'
        };

        if (mongoose.connection.readyState === 1) {
          await Battle.create(battleRecord);
          console.log(`🏆 Battle ${roomCode} results persisted to MongoDB Atlas!`);
        }
      } catch (err) {
        console.warn('Battle persistence warning:', err.message);
      }

      // Schedule room cleanup in 10 minutes
      setTimeout(() => {
        rooms.delete(roomCode);
        clearRoomTimers(roomCode);
      }, 600000);
    }
  }

  // Socket Connection Handshake
  io.on('connection', (socket) => {
    const authData = socket.handshake.auth || {};
    const authUserId = authData.userId || `guest_${socket.id.slice(0, 5)}`;
    const authUserName = authData.userName || 'Challenger';
    const authUserAvatar = authData.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

    console.log(`⚡ Battle Socket Connected: ${socket.id} (User: ${authUserName} [${authUserId}])`);

    // 1. CREATE ROOM — SYNTHESIZE BRAND-NEW AI QUIZ FROM THE GIVEN TOPIC/COMMAND
    socket.on('create_room', async ({ hostName, hostAvatar, topic, questionCount, difficulty }) => {
      try {
        const roomCode = generateUniqueRoomCode(rooms);
        const name = hostName || authUserName || 'Host Leader';
        const avatar = hostAvatar || authUserAvatar;
        const targetTopic = (topic || 'General Science & Technology').trim();
        const targetCount = Math.min(10, Math.max(3, parseInt(questionCount, 10) || 5));
        const targetDifficulty = difficulty || 'Medium';

        console.log(`🤖 Synthesizing Brand-New AI Battle for topic "${targetTopic}" (${targetCount} Qs, ${targetDifficulty})...`);

        // Generate 100% Brand-New AI Quiz on the given topic/command
        const synthesizedQuiz = await generateBattleQuizAI({
          topic: targetTopic,
          questionCount: targetCount,
          difficulty: targetDifficulty
        });

        const selectedQuiz = {
          id: `battle_quiz_${roomCode}`,
          title: synthesizedQuiz.title || `${targetTopic} Arena Battle`,
          category: targetTopic,
          difficulty: targetDifficulty,
          questions: synthesizedQuiz.questions
        };

        const room = {
          roomCode,
          code: roomCode,
          hostUserId: authUserId,
          hostSocketId: socket.id,
          hostName: name,
          quizTitle: selectedQuiz.title,
          quiz: selectedQuiz,
          currentQuestionIndex: 0,
          status: 'waiting', // waiting -> countdown -> active -> finished
          battleStartTime: null,
          questionStartTime: null,
          answersForCurrentQuestion: new Map(),
          players: [
            {
              id: socket.id,
              userId: authUserId,
              name,
              avatar,
              score: 0,
              streak: 0,
              isHost: true,
              isReady: true,
              isOnline: true,
              answers: []
            }
          ]
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.emit('room_created', { roomCode, room });
        console.log(`🏛️ Real Battle Room created: ${roomCode} with ${selectedQuiz.questions.length} brand-new questions on "${targetTopic}"!`);
      } catch (err) {
        console.error('Error creating battle room:', err);
        socket.emit('error_message', { message: 'Failed to create battle room. Please try again.' });
      }
    });

    // 2. JOIN ROOM
    socket.on('join_room', ({ roomCode, playerName, playerAvatar }) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return socket.emit('error_message', { message: `Room "${code}" not found! Please check the code.` });
      }

      const name = playerName || authUserName || 'Challenger';
      const avatar = playerAvatar || authUserAvatar;

      // Handle Reconnection of existing player
      let existingPlayer = room.players.find(p => p.userId === authUserId || p.id === socket.id);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        existingPlayer.isOnline = true;
        socket.join(code);
        socket.emit('room_joined', { roomCode: code, room });
        io.to(code).emit('players_updated', { players: room.players, room });

        // If battle is already active, send current question and state
        if (room.status === 'active') {
          const currentQ = room.quiz.questions[room.currentQuestionIndex];
          const elapsed = Math.max(0, Math.round((Date.now() - (room.questionStartTime || Date.now())) / 1000));
          socket.emit('new_question', {
            questionIndex: room.currentQuestionIndex,
            totalQuestions: room.quiz.questions.length,
            serverStartTime: room.questionStartTime,
            question: {
              id: currentQ.id,
              text: currentQ.text,
              type: currentQ.type || 'mcq',
              options: currentQ.options || [],
              points: currentQ.points || 10,
              timeLimit: Math.max(1, 15 - elapsed)
            },
            leaderboard: getLeaderboard(room.players)
          });
        }
        return;
      }

      if (room.status !== 'waiting') {
        return socket.emit('error_message', { message: 'This battle has already started!' });
      }

      if (room.players.length >= 20) {
        return socket.emit('error_message', { message: 'This battle room is full (max 20 players).' });
      }

      // Add new player to room
      room.players.push({
        id: socket.id,
        userId: authUserId,
        name,
        avatar,
        score: 0,
        streak: 0,
        isHost: false,
        isReady: true,
        isOnline: true,
        answers: []
      });

      socket.join(code);
      socket.emit('room_joined', { roomCode: code, room });
      io.to(code).emit('players_updated', { players: room.players, room });
      console.log(`⚔️ Player ${name} joined room ${code}`);
    });

    // 3. START BATTLE (Host Only)
    socket.on('start_battle', ({ roomCode }) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return socket.emit('error_message', { message: 'Room not found.' });
      }

      // Authoritative host check
      const player = room.players.find(p => p.id === socket.id);
      const isHost = player?.isHost || room.hostUserId === authUserId;

      if (!isHost) {
        return socket.emit('error_message', { message: 'Only the room host can start the battle!' });
      }

      if (room.status !== 'waiting') {
        return socket.emit('error_message', { message: 'Battle is already in progress.' });
      }

      room.status = 'countdown';
      room.battleStartTime = Date.now();
      io.to(code).emit('battle_starting', { countdown: 3 });

      // After 3-second countdown, launch Question 0
      setTimeout(() => {
        room.status = 'active';
        room.currentQuestionIndex = 0;
        startQuestionTimer(code, io);
      }, 3000);
    });

    // 4. SUBMIT ANSWER (Authoritative Scoring)
    socket.on('submit_answer', ({ roomCode, questionId, selectedAnswer, answer }) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room || room.status !== 'active') return;

      const player = room.players.find(p => p.id === socket.id || p.userId === authUserId);
      if (!player) return;

      const currentQ = room.quiz.questions[room.currentQuestionIndex];
      if (!currentQ) return;

      // Prevent duplicate answers for the same question
      if (room.answersForCurrentQuestion.has(player.userId || player.id)) {
        return;
      }

      const submittedAnswer = selectedAnswer !== undefined ? selectedAnswer : answer;
      const serverElapsedMs = Date.now() - (room.questionStartTime || Date.now());
      const timeTakenSec = Math.min(15, Math.max(0.1, serverElapsedMs / 1000));

      const isCorrect = checkAnswerCorrectness(submittedAnswer, currentQ);
      const displayCorrect = getDisplayCorrectAnswer(currentQ);

      let pointsAwarded = 0;
      if (isCorrect) {
        player.streak += 1;
        // Base 100 pts + Speed Bonus (up to 100 pts based on server timing) + Streak Bonus (up to 50 pts)
        const speedBonus = Math.max(0, Math.round((15 - timeTakenSec) * 7));
        const streakBonus = Math.min(player.streak * 10, 50);
        pointsAwarded = 100 + speedBonus + streakBonus;
        player.score += pointsAwarded;
      } else {
        player.streak = 0;
      }

      player.answers.push({
        questionId: currentQ.id || `q_${room.currentQuestionIndex + 1}`,
        selectedAnswer: submittedAnswer,
        isCorrect,
        pointsAwarded,
        timeTaken: timeTakenSec
      });

      room.answersForCurrentQuestion.set(player.userId || player.id, {
        submittedAnswer,
        isCorrect,
        pointsAwarded
      });

      // Send evaluation to the answering player
      socket.emit('answer_evaluated', {
        isCorrect,
        correctAnswer: displayCorrect,
        explanation: currentQ.explanation || '',
        pointsAwarded,
        playerScore: player.score
      });

      // Broadcast live updated leaderboard immediately to all participants
      io.to(code).emit('leaderboard_updated', {
        leaderboard: getLeaderboard(room.players)
      });

      // If all online players in the room have answered, fast-forward to answer reveal
      const onlinePlayers = room.players.filter(p => p.isOnline !== false);
      if (room.answersForCurrentQuestion.size >= onlinePlayers.length) {
        handleQuestionTimeout(code, io);
      }
    });

    // 5. DISCONNECT / RECONNECT HANDLING
    socket.on('disconnect', () => {
      rooms.forEach((room, code) => {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.isOnline = false;
          io.to(code).emit('players_updated', { players: room.players, room });

          // If room was in waiting lobby and host left, transfer host or cleanup
          if (room.status === 'waiting') {
            const activeOnline = room.players.filter(p => p.isOnline);
            if (activeOnline.length === 0) {
              rooms.delete(code);
            } else if (player.isHost) {
              activeOnline[0].isHost = true;
              room.hostUserId = activeOnline[0].userId;
              room.hostSocketId = activeOnline[0].id;
              io.to(code).emit('players_updated', { players: room.players, room });
            }
          }
        }
      });
    });
  });
}

module.exports = { initBattleSockets };
