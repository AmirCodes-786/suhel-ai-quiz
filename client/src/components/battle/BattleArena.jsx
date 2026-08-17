import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Users, 
  Crown, 
  Trophy, 
  Clock, 
  Check, 
  X, 
  Copy,
  Sparkles,
  Play
} from 'lucide-react';
import getSocket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageTransition from '../common/PageTransition';

const TOPIC_SUGGESTIONS = [
  'HTML & Web Foundations',
  'Transformer Neural Networks',
  'JavaScript & Modern React',
  'World History & Civilizations',
  'Quantum Computing'
];

export default function BattleArena() {
  const { user } = useAuth();
  const toast = useToast();
  const socket = getSocket(user);
  const shouldReduceMotion = useReducedMotion();

  const [viewState, setViewState] = useState('hub'); // 'hub', 'lobby', 'countdown', 'active', 'results'
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Host Configuration State
  const [hostTopic, setHostTopic] = useState('HTML & Web Foundations');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  useEffect(() => {
    // 1. Room Created
    socket.on('room_created', ({ roomCode, room }) => {
      setIsCreating(false);
      setCurrentRoom(room);
      setPlayers(room.players || []);
      setViewState('lobby');
      setErrorMsg('');
    });

    // 2. Room Joined
    socket.on('room_joined', ({ roomCode, room }) => {
      setCurrentRoom(room);
      setPlayers(room.players || []);
      setViewState('lobby');
      setErrorMsg('');
    });

    // 3. Players Updated (Sync Roster)
    socket.on('players_updated', ({ players: updatedPlayers, room }) => {
      setPlayers(updatedPlayers || []);
      if (room) setCurrentRoom(room);
    });

    // 4. Countdown to Battle Start
    socket.on('battle_starting', ({ countdown: cd }) => {
      setViewState('countdown');
      setCountdown(cd || 3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 5. Synchronized Question Delivery
    socket.on('new_question', ({ questionIndex: qIdx, totalQuestions: total, question, leaderboard: lb }) => {
      setViewState('active');
      setCurrentQuestion(question);
      setQuestionIndex(qIdx);
      setTotalQuestions(total);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setLeaderboard(lb || []);
      setTimeLeft(question.timeLimit || 15);
    });

    // 6. Server Clock Tick
    socket.on('question_tick', ({ timeLeft: serverTimeLeft }) => {
      setTimeLeft(serverTimeLeft);
    });

    // 7. Answer Evaluated
    socket.on('answer_evaluated', (result) => {
      setAnswerResult(result);
    });

    // 8. Question Ended (Reveal - NEVER overwrite already evaluated answer)
    socket.on('question_ended', ({ correctAnswer, explanation, leaderboard: lb }) => {
      if (lb) setLeaderboard(lb);
      setAnswerResult((prev) => {
        if (prev) {
          return {
            ...prev,
            correctAnswer: prev.correctAnswer || correctAnswer,
            explanation: prev.explanation || explanation
          };
        }
        return {
          isCorrect: false,
          correctAnswer,
          explanation,
          pointsAwarded: 0,
          timedOut: true
        };
      });
    });

    // 9. Real-time Leaderboard Update
    socket.on('leaderboard_updated', ({ leaderboard: lb }) => {
      setLeaderboard(lb || []);
    });

    // 10. Battle Finished
    socket.on('battle_finished', ({ leaderboard: lb, winner }) => {
      setViewState('results');
      setLeaderboard(lb || []);
    });

    // 11. Error Message
    socket.on('error_message', ({ message }) => {
      setIsCreating(false);
      setErrorMsg(message);
      toast.error(message);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('players_updated');
      socket.off('battle_starting');
      socket.off('new_question');
      socket.off('question_tick');
      socket.off('answer_evaluated');
      socket.off('question_ended');
      socket.off('leaderboard_updated');
      socket.off('battle_finished');
      socket.off('error_message');
    };
  }, [socket, toast]);

  const handleCreateRoom = (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    setIsCreating(true);
    socket.emit('create_room', {
      topic: hostTopic.trim(),
      questionCount,
      difficulty,
      hostName: user?.name || 'Challenger',
      hostAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setErrorMsg('');
    socket.emit('join_room', {
      roomCode: roomCodeInput.trim().toUpperCase(),
      playerName: user?.name || 'Challenger',
      playerAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    });
  };

  const handleStartBattle = () => {
    const code = currentRoom?.roomCode || currentRoom?.code;
    if (code) {
      socket.emit('start_battle', { roomCode: code });
    }
  };

  const handleAnswerSubmit = (option) => {
    if (selectedAnswer !== null || !currentQuestion || !currentRoom) return;
    setSelectedAnswer(option);
    const code = currentRoom.roomCode || currentRoom.code;
    socket.emit('submit_answer', {
      roomCode: code,
      questionId: currentQuestion.id,
      selectedAnswer: option
    });
  };

  const copyRoomCode = () => {
    const code = currentRoom?.roomCode || currentRoom?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Room code ${code} copied.`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = players.find(p => p.id === socket.id || p.userId === (user?._id || user?.id))?.isHost;

  return (
    <PageTransition className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Quiz Battles</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time synchronized multiplayer challenges with classmates and peers.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1. HUB VIEW */}
      {viewState === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Host a Live Battle Card */}
          <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Host a Live Battle</h3>
                  <p className="text-[11px] text-slate-500">Configure your arena topic & question count</p>
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Battle Topic / Concept
                </label>
                <input
                  type="text"
                  value={hostTopic}
                  onChange={(e) => setHostTopic(e.target.value)}
                  placeholder="e.g. HTML & Web Foundations, Quantum Computing"
                  className="w-full p-2 rounded-lg border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />

                {/* Suggestions */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {TOPIC_SUGGESTIONS.slice(0, 3).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setHostTopic(sug)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions & Difficulty Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-surface-border text-xs bg-white focus:outline-none focus:border-primary"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2 rounded-lg border border-surface-border text-xs bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isCreating || !hostTopic.trim()}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isCreating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isCreating ? 'Synthesizing Arena...' : 'Create Battle Room'}</span>
            </button>
          </div>

          {/* Join a Room Card */}
          <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Join a Room</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter a 6-character invitation room code provided by your battle host.
              </p>
            </div>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="flex-1 p-2 rounded-lg border border-surface-border text-xs font-mono uppercase text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. LOBBY VIEW */}
      {viewState === 'lobby' && currentRoom && (
        <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Lobby</span>
              <h2 className="text-base font-bold text-slate-900">{currentRoom.quizTitle || 'Live AI Battle Arena'}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentRoom.quiz?.questions?.length || 5} Questions • {currentRoom.quiz?.difficulty || 'Medium'}</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-800">
              <span>CODE: {currentRoom.roomCode || currentRoom.code}</span>
              <button 
                onClick={copyRoomCode} 
                className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors"
                aria-label="Copy room code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Players Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Players In Lobby ({players.length})</h3>
              {players.length > 1 ? (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  ✓ Ready to battle
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Waiting for opponents to enter code...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {players.map((p) => (
                <div key={p.id || p.userId} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {p.name} {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">Ready</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host Launch Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isHost ? `${players.length} player(s) joined` : 'Waiting for host to start battle...'}
            </span>

            {isHost && (
              <button
                onClick={handleStartBattle}
                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Battle</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. COUNTDOWN */}
      {viewState === 'countdown' && (
        <div className="py-24 text-center space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Starting In</span>
          <motion.div
            key={countdown}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-6xl font-extrabold text-primary"
          >
            {countdown}
          </motion.div>
        </div>
      )}

      {/* 4. ACTIVE BATTLE QUIZ */}
      {viewState === 'active' && currentQuestion && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <span className="text-xs font-semibold text-slate-500">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              {timeLeft}s
            </span>
          </div>

          <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-5">
            <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.text}
            </h3>

            <div className="space-y-2">
              {currentQuestion.options?.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer = answerResult && (
                  opt === answerResult.correctAnswer || 
                  opt.replace(/^[a-d][\).\s:-]+/i, '').trim() === String(answerResult.correctAnswer).replace(/^[a-d][\).\s:-]+/i, '').trim()
                );

                let buttonStyle = 'border-surface-border bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60';

                if (answerResult) {
                  if (isSelected && answerResult.isCorrect) {
                    buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-500';
                  } else if (isSelected && !answerResult.isCorrect) {
                    buttonStyle = 'border-red-400 bg-red-50 text-red-800 font-semibold ring-1 ring-red-400';
                  } else if (isCorrectAnswer) {
                    buttonStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold';
                  }
                } else if (isSelected) {
                  buttonStyle = 'border-primary bg-primary-light text-primary font-semibold ring-1 ring-primary';
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerSubmit(opt)}
                    className={`w-full p-3.5 rounded-lg border text-left text-xs font-medium transition-all ${buttonStyle}`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt.replace(/^[a-d][\).\s:-]+/i, '')}
                  </button>
                );
              })}
            </div>

            {answerResult && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                answerResult.isCorrect 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {answerResult.isCorrect 
                  ? `✓ Correct! (+${answerResult.pointsAwarded} pts)` 
                  : `✗ Incorrect (Correct: ${answerResult.correctAnswer})`
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. RESULTS & LEADERBOARD */}
      {viewState === 'results' && (
        <div className="p-6 sm:p-8 rounded-xl border border-surface-border bg-white shadow-subtle space-y-6 text-center">
          <div className="space-y-1">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-slate-900">Battle Finished</h2>
            <p className="text-xs text-slate-500">Final Leaderboard Scores</p>
          </div>

          <div className="space-y-2 max-w-md mx-auto text-left">
            {leaderboard.map((p, idx) => (
              <div key={p.id || p.userId || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">#{idx + 1} {p.name}</span>
                <span className="font-mono font-bold text-primary">{p.score} pts</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setViewState('hub')}
            className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            Back to Battles
          </button>
        </div>
      )}
    </PageTransition>
  );
}
