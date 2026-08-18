import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles,
  Bookmark,
  Shuffle,
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../../services/api';
import { FlashcardsSkeleton } from '../common/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageTransition from '../common/PageTransition';

const DEPTH_FOCUS_OPTIONS = [
  { id: 'comprehensive', label: 'Comprehensive (Concepts, Trade-offs & Scenarios)', desc: 'Balanced coverage of foundational rules and advanced applications' },
  { id: 'mechanisms', label: 'Mechanisms & Algorithms Deep Dive', desc: 'Step-by-step logic, pipeline stages, and operational architectures' },
  { id: 'scenarios', label: 'Real-World Scenarios & Edge Cases', desc: 'Practical problems, failure modes, and debugging trade-offs' },
  { id: 'high_yield', label: 'High-Yield Definitions & Formulas', desc: 'Precision recall for exam prep and rapid technical review' }
];

const TOPIC_SUGGESTIONS = [
  'Transformer Neural Networks',
  'Distributed Consensus (Raft/Paxos)',
  'Microservices & Kubernetes',
  'PostgreSQL Indexing Internals',
  'Quantum Computing Gates'
];

export default function FlashcardStudio() {
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();
  const [sets, setSets] = useState([]);
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [customText, setCustomText] = useState('');
  const [cardCount, setCardCount] = useState(6);
  const [depthFocus, setDepthFocus] = useState(DEPTH_FOCUS_OPTIONS[0].label);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadSets();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen || !cards || cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (isFlipped && (e.key === '1' || e.key === 'h')) {
        handleRateMastery('hard');
      } else if (isFlipped && (e.key === '2' || e.key === 'g')) {
        handleRateMastery('good');
      } else if (isFlipped && (e.key === '3' || e.key === 'e')) {
        handleRateMastery('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, sets, activeSetIdx, currentCardIdx, isFlipped]);

  const loadSets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/flashcards');
      if (res.data?.success && Array.isArray(res.data.sets)) {
        setSets(res.data.sets);
      } else {
        setSets([]);
      }
    } catch (e) {
      console.warn('Flashcards fetch fallback:', e.message);
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  const currentSet = sets[activeSetIdx] || null;
  const cards = currentSet?.cards || [];
  const currentCard = cards[currentCardIdx] || null;

  // Calculate deck mastery metrics
  const masteredCount = cards.filter(c => c.mastery === 'easy').length;
  const goodCount = cards.filter(c => c.mastery === 'good').length;
  const hardCount = cards.filter(c => c.mastery === 'hard').length;
  const masteryPercentage = cards.length > 0 
    ? Math.round(((masteredCount * 1.0 + goodCount * 0.6) / cards.length) * 100) 
    : 0;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentCardIdx((prev) => (cards.length > 0 ? (prev - 1 + cards.length) % cards.length : 0));
  };

  const handleShuffle = () => {
    if (cards.length <= 1) return;
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const updatedSets = [...sets];
    updatedSets[activeSetIdx] = { ...currentSet, cards: shuffledCards };
    setSets(updatedSets);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    toast.success('Cards shuffled for fresh active recall.');
  };

  const handleRestart = () => {
    setCurrentCardIdx(0);
    setIsFlipped(false);
    toast.info('Restarted deck review.');
  };

  const handleToggleBookmark = async () => {
    if (!currentCard) return;
    const newStatus = !currentCard.bookmarked;

    // Optimistic UI update
    const updatedSets = [...sets];
    const targetCards = [...(updatedSets[activeSetIdx]?.cards || [])];
    if (targetCards[currentCardIdx]) {
      targetCards[currentCardIdx] = { ...targetCards[currentCardIdx], bookmarked: newStatus };
      updatedSets[activeSetIdx].cards = targetCards;
      setSets(updatedSets);
    }

    try {
      await api.patch(`/flashcards/${currentSet._id || currentSet.id}/card/${currentCard.id || currentCard._id}`, {
        bookmarked: newStatus
      });
      toast.success(newStatus ? 'Card bookmarked.' : 'Bookmark removed.');
    } catch (e) {
      console.warn('Bookmark sync warning:', e.message);
    }
  };

  const handleRateMastery = async (rating) => {
    if (!currentCard) return;

    // Optimistic UI update
    const updatedSets = [...sets];
    const targetCards = [...(updatedSets[activeSetIdx]?.cards || [])];
    if (targetCards[currentCardIdx]) {
      targetCards[currentCardIdx] = { ...targetCards[currentCardIdx], mastery: rating };
      updatedSets[activeSetIdx].cards = targetCards;
      setSets(updatedSets);
    }

    try {
      await api.patch(`/flashcards/${currentSet._id || currentSet.id}/card/${currentCard.id || currentCard._id}`, {
        mastery: rating
      });
    } catch (e) {
      console.warn('Mastery sync warning:', e.message);
    }

    // Auto-advance to next card smoothly
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  const handleDeleteDeck = async (setId) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;
    try {
      await api.delete(`/flashcards/${setId}`);
      const remaining = sets.filter(s => s._id !== setId && s.id !== setId);
      setSets(remaining);
      setActiveSetIdx(0);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      toast.success('Deck deleted.');
    } catch (e) {
      toast.error('Failed to delete deck.');
    }
  };

  const handleGenerateDeck = async (e) => {
    if (e) e.preventDefault();
    if (!newTopic.trim()) return;
    try {
      setIsGenerating(true);
      const res = await api.post('/generate/flashcards', { 
        topic: newTopic.trim(), 
        text: customText.trim(),
        count: cardCount,
        depthFocus
      });

      if (res.data?.success && res.data.flashcards) {
        setSets([res.data.flashcards, ...sets]);
        setActiveSetIdx(0);
        setCurrentCardIdx(0);
        setIsModalOpen(false);
        setNewTopic('');
        setCustomText('');
        toast.success(`Generated ${res.data.flashcards.cards?.length || cardCount} fresh active recall cards!`);
      }
    } catch (e) {
      toast.error('Failed to generate flashcard deck. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <FlashcardsSkeleton />;
  }

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Flashcards Studio</h1>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Active Recall
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Spaced repetition mastery system for long-term conceptual retention.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Generate New Deck
        </button>
      </div>

      {/* Main Flashcard Content */}
      {sets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white shadow-subtle space-y-4 max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Flashcard Decks Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Synthesize your first customized active recall deck from your study notes, topics, or lecture material.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Your First AI Deck</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Deck Selector Tabs & Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
                {sets.map((s, idx) => (
                  <button
                    key={s._id || s.id || idx}
                    onClick={() => {
                      setActiveSetIdx(idx);
                      setCurrentCardIdx(0);
                      setIsFlipped(false);
                    }}
                    className={`
                      px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                      ${activeSetIdx === idx 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'bg-white border border-surface-border text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    {s.title || s.topic}
                  </button>
                ))}
              </div>

              {currentSet && (
                <button
                  onClick={() => handleDeleteDeck(currentSet._id || currentSet.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete this deck"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Deck Mastery Progress Bar */}
            <div className="p-3 bg-white border border-surface-border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  {masteryPercentage}%
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Retention Mastery</p>
                  <p className="text-[11px] text-slate-500">
                    {masteredCount} Mastered • {goodCount} Good • {hardCount} Review Needed • {cards.length - masteredCount - goodCount - hardCount} Unseen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffle}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-surface-border bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors"
                  title="Shuffle card order"
                >
                  <Shuffle className="w-3 h-3 text-slate-500" />
                  Shuffle
                </button>
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-surface-border bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors"
                  title="Restart review from first card"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  Restart
                </button>
              </div>
            </div>
          </div>

          {/* Cards View */}
          {cards.length > 0 && currentCard && (
            <div className="space-y-4">
              {/* Card Top Metadata & Bookmark */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Card {currentCardIdx + 1} of {cards.length}</span>
                  {currentCard?.mastery && (
                    <span className={`
                      text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                      ${currentCard.mastery === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                      ${currentCard.mastery === 'good' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                      ${currentCard.mastery === 'hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' : ''}
                      ${currentCard.mastery === 'unseen' ? 'bg-slate-100 text-slate-600' : ''}
                    `}>
                      {currentCard.mastery}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-slate-400">
                    Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[10px]">Space</kbd> to flip
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark();
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      currentCard?.bookmarked 
                        ? 'border-amber-300 bg-amber-50 text-amber-600' 
                        : 'border-surface-border text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                    title={currentCard?.bookmarked ? 'Bookmarked' : 'Bookmark card'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${currentCard?.bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer select-none perspective-1000 min-h-[20rem] sm:min-h-[22rem]"
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative w-full h-full min-h-[20rem] sm:min-h-[22rem] rounded-2xl border border-surface-border bg-white shadow-subtle hover:border-slate-300 transition-colors p-8 flex flex-col justify-between"
                >
                  {/* Front Side */}
                  <div 
                    style={{ backfaceVisibility: 'hidden' }}
                    className={`absolute inset-0 p-8 flex flex-col justify-between ${isFlipped ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Question / Challenge
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </div>
                    </div>

                    <div className="my-auto text-center px-4">
                      <h3 className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed">
                        {currentCard?.front}
                      </h3>
                    </div>

                    <div className="text-center text-xs text-slate-400">
                      Click card or press <kbd className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">Space</kbd> to reveal answer
                    </div>
                  </div>

                  {/* Back Side */}
                  <div
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      transform: 'rotateY(180deg)' 
                    }}
                    className={`absolute inset-0 p-8 flex flex-col justify-between bg-slate-50/90 rounded-2xl ${!isFlipped ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Core Answer & Breakdown
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Prompt</span>
                      </div>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="text-xs sm:text-base text-slate-800 leading-relaxed font-medium">
                        {currentCard?.back}
                      </p>
                    </div>

                    {/* Leitner Spaced Repetition Rating Buttons */}
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200"
                    >
                      <span className="text-[11px] font-medium text-slate-500 mr-1 hidden sm:inline">Rate Recall:</span>
                      <button
                        onClick={() => handleRateMastery('hard')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Press '1' or 'H'"
                      >
                        🔴 Hard
                      </button>
                      <button
                        onClick={() => handleRateMastery('good')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Press '2' or 'G'"
                      >
                        🟡 Good
                      </button>
                      <button
                        onClick={() => handleRateMastery('easy')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Press '3' or 'E'"
                      >
                        🟢 Easy (Mastered)
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={handlePrev}
                  className="p-3 rounded-full border border-surface-border bg-white text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-xs"
                  aria-label="Previous card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-6 py-2.5 rounded-lg border border-surface-border bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
                >
                  {isFlipped ? 'Show Question' : 'Reveal Answer'}
                </button>

                <button
                  onClick={handleNext}
                  className="p-3 rounded-full border border-surface-border bg-white text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-xs"
                  aria-label="Next card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced AI Deck Generator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg rounded-2xl border border-surface-border bg-white p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Generate AI Flashcards</h3>
                    <p className="text-[11px] text-slate-500">Non-repetitive, randomized active recall deck</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateDeck} className="space-y-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Topic / Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Constitutional Law, Enzyme Kinetics, Transformers"
                    className="w-full p-2.5 rounded-lg border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TOPIC_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewTopic(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cognitive Depth Dimension */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Cognitive Depth Focus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEPTH_FOCUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDepthFocus(opt.label)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          depthFocus === opt.label
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-surface-border bg-white hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900">{opt.label.split('(')[0]}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Count Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Deck Size ({cardCount} Cards)
                  </label>
                  <div className="flex items-center gap-2">
                    {[5, 8, 12, 16].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setCardCount(count)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          cardCount === count
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-surface-border bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {count} Cards
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Custom Notes / Context <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Paste specific lecture notes, documentation, or syllabus snippets..."
                    className="w-full p-2.5 rounded-lg border border-surface-border text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-surface-border text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !newTopic.trim()}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Synthesizing Deck...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Flashcards</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
