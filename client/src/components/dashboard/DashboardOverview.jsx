import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp, 
  Target, 
  FileText, 
  UploadCloud, 
  Layers, 
  Sparkles,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton } from '../common/SkeletonLoader';
import { useReducedMotion } from 'framer-motion';
import PageTransition from '../common/PageTransition';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async (silent = false) => {
    try {
      const res = await api.get(`/dashboard?range=${timeRange}`);
      if (res.data?.success) {
        setDashboardData(res.data);
      }
    } catch (e) {
      console.warn('Dashboard fetch fallback:', e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [timeRange, user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Live Auto-Refresh on window focus without requiring F5
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboard(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboard]);

  if (loading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  const isNewUser = dashboardData?.isNewUser || false;

  // Real overview metrics strictly from backend
  const overview = dashboardData?.overview || {
    averageScore: 0,
    averageScoreDiff: 'No previous baseline',
    quizzesCompleted: 0,
    quizzesCompletedContext: '0 this week',
    studyTime: '0m',
    studyTimeContext: '+0m this week',
    accuracy: 0,
    accuracyContext: 'No questions answered yet'
  };

  const performance = dashboardData?.performance || [];
  const topicMastery = dashboardData?.topicMastery || [];
  const recentQuizzes = dashboardData?.recentQuizzes || [];
  const continueLearning = dashboardData?.continueLearning;
  const weakTopics = dashboardData?.weakTopics || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const userName = user?.name ? user.name.split(' ')[0] : 'Learner';
  const greeting = getGreeting();

  const hasChartData = performance.some(p => p.score !== null && p.score > 0);

  // ================= ONBOARDING EMPTY STATE (BRAND NEW USERS) =================
  if (isNewUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        <div className="p-8 rounded-2xl border border-surface-border bg-white text-center space-y-5 shadow-subtle">
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to QuizForge AI, {userName}</h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Create your first quiz from your study notes, PDFs, YouTube lectures, or web articles to start tracking your learning progress.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/ai-studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create Your First Quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3 Step Onboarding Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">1</div>
            <h3 className="text-xs font-semibold text-slate-900">Import Any Content</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Paste raw lecture notes, upload PDF documents, or link YouTube lectures.</p>
          </div>

          <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">2</div>
            <h3 className="text-xs font-semibold text-slate-900">AI Cognitive Generation</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Questions synthesized across Bloom taxonomy levels with in-depth explanations.</p>
          </div>

          <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">3</div>
            <h3 className="text-xs font-semibold text-slate-900">Live Diagnostic Tracking</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Your dashboard will automatically calculate score trends, mastery, and weak topics.</p>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN REAL SAAS DASHBOARD =================
  return (
    <PageTransition className="space-y-6 max-w-6xl mx-auto">
      {/* 1. HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {greeting}, {userName}. Here's what's happening with your learning.
          </p>
        </div>

        <Link
          to="/ai-studio"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quiz</span>
        </Link>
      </div>

      {/* 2. QUICK OVERVIEW (4 COMPACT METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Average Score */}
        <div className="p-4 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Average Score</span>
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overview.averageScore > 0 ? `${overview.averageScore}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {overview.averageScoreDiff}
          </span>
        </div>

        {/* Quizzes Completed */}
        <div className="p-4 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Quizzes Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.quizzesCompleted}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {overview.quizzesCompletedContext}
          </span>
        </div>

        {/* Study Time */}
        <div className="p-4 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Study Time</span>
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.studyTime}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {overview.studyTimeContext}
          </span>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Accuracy</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overview.accuracy > 0 ? `${overview.accuracy}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {overview.accuracyContext}
          </span>
        </div>
      </div>

      {/* 3. MAIN PERFORMANCE SECTION (TWO-COLUMN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Performance Overview Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Performance Overview</h2>
              <span className="text-[11px] text-slate-400">Score progress over time</span>
            </div>

            {/* Date Filters: 7D, 30D, 90D */}
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors uppercase ${
                    timeRange === range
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart or Empty State */}
          <div className="h-52 w-full pt-2 flex items-center justify-center">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performance} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    formatter={(val) => [val !== null ? `${val}%` : 'No attempts', 'Score']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#scoreGlow)" 
                    isAnimationActive={!shouldReduceMotion}
                    animationDuration={400}
                    connectNulls={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-1.5 py-6">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">No score history recorded for this period</p>
                <p className="text-[11px] text-slate-400">Complete quizzes to visualize your learning trajectory.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Topic Mastery */}
        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Topic Mastery</h2>
            <span className="text-[11px] text-slate-400">Current competency by subject</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {topicMastery.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <Inbox className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No topic data yet</p>
              </div>
            ) : (
              topicMastery.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">{item.topic}</span>
                    <span className="font-bold text-slate-900 text-[11px]">{item.mastery}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, item.mastery)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT QUIZZES (STRUCTURED DATA TABLE / LIST) */}
      <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Quizzes</h2>
            <span className="text-[11px] text-slate-400">Your saved assessments and activity</span>
          </div>
          <Link 
            to="/library" 
            className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors"
          >
            <span>View Library</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No quizzes created yet</p>
            <Link to="/ai-studio" className="inline-block px-3 py-1.5 bg-primary text-white text-xs rounded-lg">
              Create First Quiz
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                      {quiz.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">• {quiz.questionCount} Questions</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {quiz.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    {quiz.score !== null ? (
                      <span className="text-xs font-bold text-slate-900">{quiz.score}%</span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Ready</span>
                    )}
                    <span className="block text-[10px] text-slate-400">{quiz.date}</span>
                  </div>

                  <Link
                    to={`/quiz/${quiz.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>{quiz.score !== null ? 'Retake' : 'Start'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. TWO-COLUMN LOWER SECTION: (CONTINUE LEARNING + WEAK TOPICS) & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (Col 1 & 2): Continue Learning & Needs Practice */}
        <div className="lg:col-span-2 space-y-4">
          {/* Continue Learning Card */}
          {continueLearning ? (
            <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Continue Learning</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    continueLearning.isCompleted ? 'text-emerald-700 bg-emerald-50' : 'text-primary bg-primary-light'
                  }`}>
                    {continueLearning.isCompleted ? 'Completed' : 'Recommended'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {continueLearning.totalQuestions} questions
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{continueLearning.title}</h3>
                <span className="text-[11px] text-slate-400">{continueLearning.category}</span>
              </div>

              <div className="pt-1 flex justify-end">
                <Link
                  to={`/quiz/${continueLearning.quizId}`}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] inline-flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{continueLearning.isCompleted ? 'Practice Again' : 'Start Quiz'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">You're all caught up</h3>
                <p className="text-[11px] text-slate-500">Generate a new quiz to expand your mastery.</p>
              </div>
              <Link to="/ai-studio" className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg">
                Create Quiz
              </Link>
            </div>
          )}

          {/* Needs Practice (Weak Topics) */}
          <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Needs Practice</h2>
                <span className="text-[11px] text-slate-400">Targeted areas to reinforce retention</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {weakTopics.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    No weak topics identified yet. Complete quizzes to discover areas for review!
                  </p>
                </div>
              ) : (
                weakTopics.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{item.topic}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Accuracy: <span className="text-amber-700 font-bold">{item.accuracy}%</span>
                        <span className="text-slate-400 text-[10px] ml-1">({item.totalQuestions} questions)</span>
                      </div>
                    </div>

                    <Link
                      to={`/ai-studio?topic=${encodeURIComponent(item.topic)}`}
                      className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium shrink-0 transition-colors"
                    >
                      Practice
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (Col 3): Recent Activity Feed */}
        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <span className="text-[11px] text-slate-400">Timeline of your study sessions</span>
          </div>

          <div className="space-y-3 pt-1">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <Clock className="w-5 h-5 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No recent activity yet</p>
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="text-xs space-y-0.5 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="font-semibold text-slate-900 leading-snug">
                    {act.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{act.timestamp}</span>
                    {act.score && <span className="font-bold text-emerald-600">{act.score}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. QUICK ACTIONS BAR */}
      <div className="p-4 rounded-xl border border-surface-border bg-white shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700">Quick Actions</span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/ai-studio"
            className="px-3 py-1.5 rounded-lg border border-surface-border text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Paste Notes</span>
          </Link>

          <Link
            to="/ai-studio"
            className="px-3 py-1.5 rounded-lg border border-surface-border text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload PDF</span>
          </Link>

          <Link
            to="/flashcards"
            className="px-3 py-1.5 rounded-lg border border-surface-border text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Flashcards</span>
          </Link>

          <Link
            to="/library"
            className="px-3 py-1.5 rounded-lg border border-surface-border text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>View Library</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
