import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  Target, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  ChevronDown 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function QuizPlayerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [isCompleted, setIsCompleted] = useState(false);
  const [report, setReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Individual Question Regeneration state
  const [isRegeneratingQ, setIsRegeneratingQ] = useState(false);
  const [showRegenMenu, setShowRegenMenu] = useState(false);

  // Animated Score Counter for Results
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}`);
      if (res.data?.success && res.data.quiz) {
        setQuiz(res.data.quiz);
        setTimeLeft((res.data.quiz.timeLimit || 10) * 60);
      }
    } catch (e) {
      console.warn('Quiz fetch fallback:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCompleted || loading || !quiz) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, loading, quiz]);

  // Score counter animation on completion
  useEffect(() => {
    if (isCompleted && report) {
      let start = 0;
      const target = report.percentage;
      const stepTime = Math.max(10, Math.floor(600 / (target || 1)));
      const counter = setInterval(() => {
        start += 1;
        if (start >= target) {
          setDisplayScore(target);
          clearInterval(counter);
        } else {
          setDisplayScore(start);
        }
      }, stepTime);
      return () => clearInterval(counter);
    }
  }, [isCompleted, report]);

  const handleSelectOption = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleRegenerateQuestion = async (mode = 'same') => {
    if (!quiz || isRegeneratingQ) return;
    const currentQ = quiz.questions[currentIdx];
    try {
      setIsRegeneratingQ(true);
      setShowRegenMenu(false);

      const res = await api.post('/generate/question/regenerate', {
        currentQuestion: currentQ,
        category: quiz.category || quiz.title,
        difficulty: currentQ.difficulty || quiz.difficulty || 'Medium',
        bloomLevel: currentQ.bloomLevel || 'Understand',
        mode
      });

      if (res.data?.success && res.data.question) {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[currentIdx] = res.data.question;
        setQuiz({ ...quiz, questions: updatedQuestions });
        // Clear answer for this question
        setUserAnswers(prev => {
          const updated = { ...prev };
          delete updated[currentQ.id];
          return updated;
        });
        toast.success(`Question regenerated (${mode === 'same' ? 'Fresh prompt' : mode}).`);
      }
    } catch (err) {
      toast.error('Failed to regenerate question. Please try again.');
    } finally {
      setIsRegeneratingQ(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !quiz) return;
    setIsSubmitting(true);

    let score = 0;
    let maxScore = 0;
    const evaluatedAnswers = [];
    const weakTopicsList = [];

    quiz.questions.forEach(q => {
      const selected = userAnswers[q.id];
      const isCorrect = String(selected || '').trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      const points = q.points || 10;
      maxScore += points;

      if (isCorrect) {
        score += points;
      } else {
        const topicName = q.bloomLevel || q.category || 'Core Concepts';
        if (!weakTopicsList.includes(topicName)) {
          weakTopicsList.push(topicName);
        }
      }

      evaluatedAnswers.push({
        questionId: q.id,
        questionText: q.text,
        selectedAnswer: selected || 'Unanswered',
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.bloomLevel || 'Core Concept'
      });
    });

    const percentage = Math.round((score / (maxScore || 1)) * 100);
    const timeSpent = (quiz.timeLimit || 10) * 60 - timeLeft;

    const finalReport = {
      quizId: quiz._id || quiz.id,
      quizTitle: quiz.title,
      score,
      maxScore,
      percentage,
      timeSpent,
      weakTopics: weakTopicsList.length > 0 ? weakTopicsList : ['Core Foundations'],
      answers: evaluatedAnswers
    };

    setReport(finalReport);
    setIsCompleted(true);
    setIsSubmitting(false);

    try {
      await api.post(`/quizzes/${quiz._id || quiz.id}/attempt`, {
        quizTitle: quiz.title,
        score,
        maxScore,
        percentage,
        timeSpent,
        answers: evaluatedAnswers,
        weakTopics: weakTopicsList
      });
      toast.success('Assessment completed.');
    } catch (e) {
      console.warn('Attempt save warning:', e.message);
    }
  };

  const handlePracticeWeakTopics = async () => {
    if (!report || !report.weakTopics) return;
    try {
      toast.info('Generating targeted practice quiz on weak topics...');
      const res = await api.post('/generate/quiz', {
        sourceType: 'text',
        text: `Generate targeted questions focused on: ${report.weakTopics.join(', ')} from ${quiz.title}`,
        category: `${quiz.title} (Practice)`,
        difficulty: 'Medium',
        questionCount: 5,
        questionTypes: 'mcq'
      });

      if (res.data?.success && res.data.quiz) {
        navigate(`/quiz/${res.data.quiz._id || res.data.quiz.id}`);
      }
    } catch (err) {
      toast.error('Could not generate practice quiz.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-3 px-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading quiz questions...</p>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4 px-4">
        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-800">Quiz not found</h2>
        <p className="text-xs text-slate-500">The requested quiz could not be loaded.</p>
        <Link to="/library" className="inline-block px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl touch-manipulation">
          Return to Library
        </Link>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIdx];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;

  // ================= RESULTS & AI ANALYSIS SCREEN =================
  if (isCompleted && report) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 py-2 sm:py-4 px-3 sm:px-4 animate-fadeIn pb-12">
        {/* Score Summary Card */}
        <div className="p-5 sm:p-8 rounded-2xl border border-surface-border bg-white text-center space-y-4 shadow-subtle">
          <span className="text-[11px] sm:text-xs font-semibold text-primary bg-primary-light px-3 py-1 rounded-full uppercase tracking-wider">
            Results & AI Analysis
          </span>

          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
            {report.quizTitle}
          </h1>

          <div className="flex items-center justify-center my-3 sm:my-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center bg-slate-50 shadow-inner">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {displayScore}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Final Score</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-600 border-t border-slate-100 pt-3 sm:pt-4">
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">Correct Answers</span>
              <strong className="text-slate-900 font-bold text-sm">
                {report.answers.filter(a => a.isCorrect).length} / {report.answers.length}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">Time Spent</span>
              <strong className="text-slate-900 font-bold text-sm">
                {Math.floor(report.timeSpent / 60)}m {report.timeSpent % 60}s
              </strong>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handlePracticeWeakTopics}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Practice Weak Topics ({report.weakTopics.slice(0, 2).join(', ')})</span>
            </button>

            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentIdx(0);
                setUserAnswers({});
                setTimeLeft((quiz.timeLimit || 10) * 60);
                setReport(null);
              }}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Review & Retake</span>
            </button>
          </div>
        </div>

        {/* Weak Topics Breakdown */}
        <div className="p-4 sm:p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900">Topic Performance Breakdown</h3>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {report.weakTopics.map((topic, idx) => (
              <span
                key={idx}
                className="text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200"
              >
                Needs Review: {topic}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Review the detailed question explanations below to understand why each option was correct or incorrect.
          </p>
        </div>

        {/* Question Review List with Deep AI Explanations */}
        <div className="space-y-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 px-1">Question Explanations</h3>
          {report.answers.map((ans, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-xl border bg-white space-y-3 transition-colors ${
                ans.isCorrect ? 'border-emerald-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ans.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    Question {idx + 1}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{ans.topic}</span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                {ans.questionText}
              </p>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100">
                <div className="text-slate-600">
                  <span className="font-medium text-slate-500">Your Answer:</span>{' '}
                  <span className={ans.isCorrect ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                    {ans.selectedAnswer}
                  </span>
                </div>
                {!ans.isCorrect && (
                  <div className="text-emerald-700">
                    <span className="font-medium text-slate-500">Correct Answer:</span>{' '}
                    <span className="font-semibold">{ans.correctAnswer}</span>
                  </div>
                )}
              </div>

              {ans.explanation && (
                <div className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                  <strong className="text-slate-900">AI Explanation: </strong>
                  {ans.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= QUIZ PLAYER SCREEN =================
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 py-2 px-3 sm:px-4 pb-8">
      {/* Top Bar: Exit, Progress, Timer */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-border pb-3">
        <Link
          to="/library"
          className="text-slate-500 hover:text-slate-800 active:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </Link>

        <div className="text-xs font-semibold text-slate-700 truncate">
          Question {currentIdx + 1} of {quiz.questions.length}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-medium shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Animated Question Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : -8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="p-4 sm:p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4 sm:space-y-6"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                {currentQ.difficulty || 'Medium'}
              </span>
              {currentQ.bloomLevel && (
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                  • {currentQ.bloomLevel}
                </span>
              )}
            </div>

            {/* Subtle Individual Question Regeneration Control */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowRegenMenu(!showRegenMenu)}
                disabled={isRegeneratingQ}
                className="text-slate-400 hover:text-slate-700 active:text-slate-900 text-[11px] font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation"
                title="Regenerate this specific question"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingQ ? 'animate-spin text-primary' : ''}`} />
                <span className="hidden xs:inline">{isRegeneratingQ ? 'Regenerating...' : 'Regenerate'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRegenMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-dropdown p-1 z-20 space-y-0.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => handleRegenerateQuestion('same')}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateQuestion('easier')}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-1.5"
                  >
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                    <span>Make Easier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateQuestion('harder')}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-1.5"
                  >
                    <TrendingUp className="w-3 h-3 text-amber-500" />
                    <span>Make Harder</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {currentQ.text}
          </h2>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.type === 'true_false' ? (
              ['True', 'False'].map((opt) => {
                const isSelected = userAnswers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`
                      w-full min-h-[48px] p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all touch-manipulation active:scale-[0.99]
                      ${isSelected 
                        ? 'border-primary bg-primary-light/50 text-primary font-semibold ring-1 ring-primary' 
                        : 'border-surface-border bg-white text-slate-800 hover:border-slate-300 active:bg-slate-50'
                      }
                    `}
                  >
                    {opt}
                  </button>
                );
              })
            ) : currentQ.options && currentQ.options.length > 0 ? (
              currentQ.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQ.id] === opt;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`
                      w-full min-h-[48px] p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 sm:gap-3 touch-manipulation active:scale-[0.99]
                      ${isSelected 
                        ? 'border-primary bg-primary-light/50 text-primary font-semibold ring-1 ring-primary' 
                        : 'border-surface-border bg-white text-slate-800 hover:border-slate-300 active:bg-slate-50'
                      }
                    `}
                  >
                    <span className={`w-5 h-5 rounded-full border text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary text-white font-bold' : 'border-slate-300 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                  </button>
                );
              })
            ) : (
              <input
                type="text"
                value={userAnswers[currentQ.id] || ''}
                onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full min-h-[48px] p-3 rounded-xl border border-surface-border bg-white text-slate-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="min-h-[44px] px-4 sm:px-5 py-2 rounded-xl border border-surface-border text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 touch-manipulation"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
            className="min-h-[44px] px-5 sm:px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 touch-manipulation"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
