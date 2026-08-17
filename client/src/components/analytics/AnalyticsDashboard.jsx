import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight
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
import { Skeleton } from '../common/SkeletonLoader';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../common/PageTransition';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const fetchAnalytics = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/analytics/student');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (e) {
      console.warn('Analytics live sync fallback:', e.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Auto-sync whenever user focuses the window or tab
    const handleFocus = () => fetchAnalytics(true);
    window.addEventListener('focus', handleFocus);

    // 15-second background heartbeat polling for live multiplayer battle / attempt updates
    const interval = setInterval(() => fetchAnalytics(true), 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-surface-border pb-4 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats || {
    averageScore: 0,
    accuracyRate: 0,
    totalAttempts: 0,
    totalQuizzes: 0,
    studyTimeFormatted: '0m'
  };

  const performanceTrend = data?.performanceTrend || [];
  const strengths = data?.strengths || [];
  const weaknesses = data?.weaknesses || [];

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time insights on your accuracy, retention, and learning progress over time.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sync Active</span>
        </div>
      </div>

      {/* 2 Core Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors">
          <span className="text-xs font-medium text-slate-500 block mb-1">Average Score</span>
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalAttempts > 0 ? `${stats.averageScore}%` : '—'}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {stats.totalAttempts > 0 
              ? `${stats.totalAttempts} total assessment attempt${stats.totalAttempts > 1 ? 's' : ''}`
              : 'Complete your first quiz to calculate'
            }
          </span>
        </div>

        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors">
          <span className="text-xs font-medium text-slate-500 block mb-1">Overall Accuracy</span>
          <div className="text-3xl font-bold text-primary">
            {stats.totalAttempts > 0 ? `${stats.accuracyRate}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500">
            {stats.totalQuestionsAnswered 
              ? `Across ${stats.totalQuestionsAnswered} answered questions`
              : 'Real-time accuracy metric'
            }
          </span>
        </div>
      </div>

      {/* Performance Over Time Chart */}
      <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Performance Over Time</h2>
            <p className="text-[11px] text-slate-500">Chronological quiz session scores</p>
          </div>
          {performanceTrend.length > 0 && (
            <span className="text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded">
              Last {performanceTrend.length} Sessions
            </span>
          )}
        </div>

        {performanceTrend.length > 0 ? (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  formatter={(val, name, item) => [`${val}%`, item.payload.quizTitle ? `${item.payload.quizTitle}` : 'Score']}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#scoreColor)" 
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-lg">
            <BarChart3 className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No session history yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Play a quiz or start a live battle to generate real-time performance analytics and trend graphs.
            </p>
            <Link
              to="/generate"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
            >
              <span>Generate a Quiz</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mastered Concepts */}
        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Mastered Concepts (≥ 80%)</h3>
          </div>
          <div className="space-y-2">
            {strengths.length > 0 ? (
              strengths.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">{item.topic}</span>
                  <span className="text-emerald-600 font-bold">{item.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 italic">
                Concepts with ≥ 80% accuracy will be recorded here as you take quizzes.
              </p>
            )}
          </div>
        </div>

        {/* Recommended Review */}
        <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Recommended Review (&lt; 80%)</h3>
          </div>
          <div className="space-y-2">
            {weaknesses.length > 0 ? (
              weaknesses.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">{item.topic}</span>
                  <span className="text-amber-600 font-bold">{item.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 italic">
                {stats.totalAttempts > 0 
                  ? 'Great job! No weak concepts identified.'
                  : 'Topics needing review will appear here automatically.'
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
