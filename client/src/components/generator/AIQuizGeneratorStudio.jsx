import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  UploadCloud, 
  Globe, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../common/PageTransition';

const SOURCES = [
  { id: 'text', label: 'Paste Text', icon: FileText, placeholder: 'Paste your notes, lecture transcript, article, or study outline here...' },
  { id: 'pdf', label: 'Upload Document', icon: UploadCloud, placeholder: 'Upload a PDF or Word (.docx) document...' },
  { id: 'youtube', label: 'YouTube Video', icon: Video, placeholder: 'Enter YouTube lecture link (e.g. https://www.youtube.com/watch?v=...)' },
  { id: 'url', label: 'Website URL', icon: Globe, placeholder: 'Enter article or website URL (e.g. https://en.wikipedia.org/wiki/...)' },
];

const GENERATION_STEPS = [
  'Preparing content & verifying source depth',
  'Generating grounded questions across cognitive tiers',
  'Checking question quality & deduplication',
  'Finalizing your quiz assessment'
];

export default function AIQuizGeneratorStudio() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const loadingCardRef = useRef(null);

  const [sourceType, setSourceType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Settings
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('mcq');

  // Advanced Settings Toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bloomTier, setBloomTier] = useState('Understand,Apply');

  // Progress State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Daily Quota State
  const [quota, setQuota] = useState({
    dailyLimit: 10,
    generationsUsed: 0,
    generationsLeft: 10,
    isAdmin: false,
    canGenerate: true
  });
  const [quotaLoading, setQuotaLoading] = useState(true);

  useEffect(() => {
    fetchQuotaStatus();
  }, [user]);

  const fetchQuotaStatus = async () => {
    try {
      setQuotaLoading(true);
      const res = await api.get('/generate/status');
      if (res.data?.success) {
        setQuota({
          dailyLimit: res.data.dailyLimit || 10,
          generationsUsed: res.data.generationsUsed || 0,
          generationsLeft: res.data.generationsLeft ?? 10,
          isAdmin: Boolean(res.data.isAdmin),
          canGenerate: res.data.canGenerate !== false
        });
      }
    } catch (e) {
      console.warn('Quota fetch warning:', e.message);
    } finally {
      setQuotaLoading(false);
    }
  };

  // Auto-scroll and focus to loading indicator whenever generation starts
  useEffect(() => {
    if (isGenerating) {
      setTimeout(() => {
        if (loadingCardRef.current) {
          loadingCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [isGenerating]);

  // Step advancement timer for realistic progress feedback
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setCurrentStepIdx(0);
      const stepDuration = questionCount >= 30 ? 2500 : 1500;
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
      }, stepDuration);
    }
    return () => clearInterval(interval);
  }, [isGenerating, questionCount]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!quota.isAdmin && quota.generationsLeft <= 0) {
      toast.error('You have reached your daily limit of 10 AI quiz generations.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('sourceType', sourceType);
      formData.append('category', topic || 'General');
      formData.append('difficulty', difficulty);
      formData.append('questionCount', questionCount);
      formData.append('questionTypes', questionType);
      formData.append('bloomLevels', bloomTier);

      if (sourceType === 'pdf' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (sourceType === 'url') {
        formData.append('url', urlContent || 'https://en.wikipedia.org/wiki/Deep_learning');
      } else if (sourceType === 'youtube') {
        formData.append('youtubeUrl', urlContent || 'https://www.youtube.com/watch?v=aircAruvnKk');
      } else {
        formData.append('text', textContent || 'Artificial intelligence fundamentals, neural network layers, and gradient descent optimization.');
      }

      const res = await api.post('/generate/quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.quiz) {
        if (res.data.quota) {
          setQuota(prev => ({
            ...prev,
            generationsUsed: res.data.quota.generationsUsed ?? prev.generationsUsed + 1,
            generationsLeft: res.data.quota.generationsLeft ?? Math.max(0, prev.generationsLeft - 1),
            isAdmin: Boolean(res.data.quota.isAdmin)
          }));
        }
        toast.success(`Generated ${res.data.quiz.questions?.length || questionCount} high-quality questions.`);
        navigate(`/quiz/${res.data.quiz._id || res.data.quiz.id}`);
      } else {
        throw new Error(res.data?.message || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to synthesize quiz. Please check your content.');
      setIsGenerating(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const isAdminEmail = user?.email?.toLowerCase().trim() === 'justforfun09786@gmail.com';
  const isUnlimited = quota.isAdmin || user?.isAdmin || user?.role === 'admin' || isAdminEmail;
  const leftCount = typeof quota.generationsLeft === 'number' ? quota.generationsLeft : 10;
  const progressPercent = isUnlimited ? 100 : Math.min(100, Math.max(0, (leftCount / quota.dailyLimit) * 100));

  return (
    <PageTransition className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-6">
      {/* Header & Live Daily Quota Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">AI Quiz Generator</h1>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Studio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Import your study material and create a targeted, source-grounded assessment in seconds.
          </p>
        </div>

        {/* Real-Time Animated Quota Counter */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-3.5 py-2 rounded-xl shadow-md border border-indigo-800/40 self-start sm:self-auto">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
            {isUnlimited ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono text-white">
                {isUnlimited ? 'UNLIMITED' : `${leftCount}/${quota.dailyLimit}`}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200/80 font-medium">
                {isUnlimited ? 'Admin Access' : 'Gens Left Today'}
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-28 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${leftCount <= 2 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-800">Generation Notice</p>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-3.5 py-2 rounded-lg bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-800 font-medium text-xs flex items-center gap-1.5 transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        </div>
      )}

      {/* Generation Progress Overlay Card */}
      <div ref={loadingCardRef} className="scroll-mt-4 sm:scroll-mt-6">
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-4 sm:p-5 rounded-xl border-2 border-primary/40 bg-primary-light/60 shadow-subtle space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-primary truncate">
                    Synthesizing {questionCount} Questions...
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-primary shrink-0 bg-white/80 px-2 py-0.5 rounded-md">
                  Step {currentStepIdx + 1} of {GENERATION_STEPS.length}
                </span>
              </div>

              {/* Steps Progress List */}
              <div className="space-y-2 pt-1">
                {GENERATION_STEPS.map((step, idx) => {
                  const isPassed = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div 
                      key={step} 
                      className={`flex items-center gap-2.5 text-xs sm:text-sm transition-colors ${
                        isPassed ? 'text-emerald-700 font-medium' : isCurrent ? 'text-primary font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className="leading-snug">{step}</span>
                    </div>
                  );
                })}
              </div>

              {questionCount >= 30 && (
                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  Note: Larger quiz sets ({questionCount} questions) are generated in parallel batches to guarantee high quality and prevent repetition.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleGenerate} className="p-4 sm:p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-5 sm:space-y-6">
        {/* 1. Select Input Modality */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            1. Select Content Source
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {SOURCES.map((s) => {
              const Icon = s.icon;
              const isSelected = sourceType === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceType(s.id)}
                  className={`
                    p-3 sm:p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all touch-manipulation
                    ${isSelected 
                      ? 'border-primary bg-primary-light text-primary ring-1 ring-primary' 
                      : 'border-surface-border bg-white text-slate-600 hover:border-slate-300 active:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Content Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            2. Source Material
          </label>

          {sourceType === 'text' && (
            <textarea
              rows={6}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={SOURCES.find(s => s.id === 'text').placeholder}
              className="w-full p-3 sm:p-3.5 rounded-xl border border-surface-border bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
            />
          )}

          {sourceType === 'pdf' && (
            <div className="relative border-2 border-dashed border-slate-200 hover:border-primary active:border-primary rounded-xl p-6 sm:p-8 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                {selectedFile ? selectedFile.name : 'Tap to select or drag PDF / Word document'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports PDF, DOCX up to 25MB'}
              </p>
            </div>
          )}

          {(sourceType === 'youtube' || sourceType === 'url') && (
            <input
              type="text"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder={sourceType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/article'}
              className="w-full p-3 rounded-xl border border-surface-border bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          )}
        </div>

        {/* 3. Quiz Settings */}
        <div className="space-y-4 pt-2 border-t border-surface-border">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            3. Quiz Settings
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Number of Questions */}
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-2.5 sm:p-3 rounded-lg border border-surface-border bg-white text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5 Questions (Quick)</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={15}>15 Questions (Deep)</option>
                <option value={20}>20 Questions (Comprehensive)</option>
                <option value={30}>30 Questions (Exam Practice)</option>
                <option value={50}>50 Questions (Mastery Marathon)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 sm:p-3 rounded-lg border border-surface-border bg-white text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Easy">Easy (Foundations)</option>
                <option value="Medium">Medium (Balanced)</option>
                <option value="Hard">Hard (In-depth)</option>
                <option value="Mixed">Mixed (Curated Distribution)</option>
              </select>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full p-2.5 sm:p-3 rounded-lg border border-surface-border bg-white text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="mcq,true_false">Mixed Types</option>
              </select>
            </div>
          </div>

          {/* Optional Topic Label */}
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Topic / Subject Title (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Neural Networks, European History, React Hooks"
              className="w-full p-2.5 sm:p-3 rounded-lg border border-surface-border bg-white text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Collapsible Advanced Options */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-800 active:text-slate-900 flex items-center gap-1 font-medium transition-colors py-1 touch-manipulation"
            >
              <span>{showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-2.5 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Bloom's Cognitive Tier</label>
                  <select
                    value={bloomTier}
                    onChange={(e) => setBloomTier(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-primary focus:outline-none"
                  >
                    <option value="Remember,Understand">Remember & Understand (Recall & Definitions)</option>
                    <option value="Understand,Apply">Understand & Apply (Application & Scenarios)</option>
                    <option value="Analyze,Evaluate">Analyze & Evaluate (Critical Breakdown & Trade-offs)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating || (!isUnlimited && leftCount <= 0)}
            className="w-full min-h-[48px] py-3.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating {questionCount} Questions...</span>
              </div>
            ) : !isUnlimited && leftCount <= 0 ? (
              <span>Daily Limit Reached (10/10 Used Today)</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Generate {questionCount} Questions</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </div>
      </form>
    </PageTransition>
  );
}
