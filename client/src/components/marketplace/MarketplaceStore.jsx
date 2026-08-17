import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Star, 
  Copy, 
  Play, 
  Swords, 
  Eye, 
  Clock, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import { useSound } from '../../context/SoundContext';

const CATEGORIES = ['All', 'Artificial Intelligence', 'DevOps & Cloud', 'Computer Science', 'Cybersecurity', 'Web Development'];

export default function MarketplaceStore() {
  const { play } = useSound();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [clonedMap, setClonedMap] = useState({});

  useEffect(() => {
    fetchMarketplaceQuizzes();
  }, [search, selectedCategory, selectedDifficulty]);

  const fetchMarketplaceQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes', {
        params: {
          search: search || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
          isPublic: 'true'
        }
      });
      if (res.data?.success && res.data.quizzes) {
        setQuizzes(res.data.quizzes);
      }
    } catch (e) {
      console.warn('Marketplace fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneQuiz = async (quizId) => {
    play('playClick');
    try {
      const res = await api.post(`/quizzes/${quizId}/clone`);
      if (res.data?.success) {
        play('playCorrect');
        setClonedMap(prev => ({ ...prev, [quizId]: true }));
        setTimeout(() => {
          setClonedMap(prev => ({ ...prev, [quizId]: false }));
        }, 2500);
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Public Assessment Store</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">Community Curated</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          Public Quiz Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Discover, clone, attempt, and battle across thousands of community-verified AI assessments.
        </p>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 rounded-2xl bg-surface-card border border-surface-border glass-panel flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, keyword, or tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-50 border border-surface-border text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                play('playClick');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-black font-extrabold shadow-glow-primary'
                  : 'bg-surface-50 border border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* QUIZ CARDS GRID */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id || quiz.id}
              className="p-6 rounded-3xl bg-surface-card border border-surface-border hover:border-primary/40 glass-panel-hover flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Meta Badges */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold uppercase">
                    {quiz.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{quiz.rating || '5.0'}</span>
                    <span className="text-gray-500 font-normal">({quiz.ratingsCount || 1})</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {quiz.description || 'Comprehensive evaluation covering key theoretical and practical competencies.'}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400 pt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.timeLimit || 10}m</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {quiz.questions?.length || 5} Questions</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {quiz.views || 120}</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCloneQuiz(quiz._id || quiz.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    clonedMap[quiz._id || quiz.id]
                      ? 'bg-primary/20 text-primary border-primary'
                      : 'bg-surface-50 border-surface-border text-gray-300 hover:text-white'
                  }`}
                  title="Clone to your personal library"
                >
                  {clonedMap[quiz._id || quiz.id] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{clonedMap[quiz._id || quiz.id] ? 'Cloned' : 'Clone'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      play('playClick');
                      navigate(`/quiz/${quiz._id || quiz.id}`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </button>
                  <button
                    onClick={() => {
                      play('playClick');
                      navigate('/battle', { state: { selectedQuizId: quiz._id || quiz.id } });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary hover:text-black font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <Swords className="w-3 h-3" />
                    Battle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
