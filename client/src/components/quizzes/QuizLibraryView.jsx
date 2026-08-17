import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Play, 
  Copy, 
  Trash2, 
  Clock, 
  BookOpen,
  Award,
  ShieldCheck,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { LibrarySkeleton } from '../common/SkeletonLoader';
import ConfirmDialog from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import PageTransition from '../common/PageTransition';

export default function QuizLibraryView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [copiedCredId, setCopiedCredId] = useState(null);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      if (res.data?.success && res.data.quizzes) {
        setQuizzes(res.data.quizzes);
      }
    } catch (e) {
      console.warn('Library load fallback:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/quizzes/${deleteTargetId}`);
      setQuizzes((prev) => prev.filter(q => q._id !== deleteTargetId && q.id !== deleteTargetId));
      toast.success('Quiz deleted successfully.');
    } catch (e) {
      toast.error('Failed to delete quiz.');
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/quizzes/${id}/clone`);
      if (res.data?.success && res.data.quiz) {
        setQuizzes((prev) => [res.data.quiz, ...prev]);
        toast.success('Quiz duplicated successfully.');
      }
    } catch (e) {
      toast.error('Failed to duplicate quiz.');
    }
  };

  const handleCopyCredential = (credId) => {
    if (!credId) return;
    navigator.clipboard.writeText(credId);
    setCopiedCredId(credId);
    toast.success(`Credential ID ${credId} copied!`);
    setTimeout(() => setCopiedCredId(null), 2500);
  };

  if (loading) {
    return <LibrarySkeleton />;
  }

  const filtered = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                          q.category?.toLowerCase().includes(search.toLowerCase()) ||
                          (q.credentialId && q.credentialId.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quiz Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, duplicate, and practice your saved quizzes with verified accreditation IDs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/certificates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Certificates Portal</span>
          </Link>

          <Link
            to="/ai-studio"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quiz</span>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, title, or Credential ID..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-border bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 max-w-full">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDifficulty === diff 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white border border-surface-border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {search || selectedDifficulty !== 'All' ? 'No matching quizzes found' : 'No quizzes yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedDifficulty !== 'All' 
                ? 'Try adjusting your search terms or filters to find what you are looking for.' 
                : 'Create your first AI-powered quiz from notes, PDFs, YouTube videos, or web content.'
              }
            </p>
          </div>
          <Link
            to="/ai-studio"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((quiz) => {
            const credId = quiz.credentialId || `QF-CR-${String(quiz._id || quiz.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

            return (
              <div
                key={quiz._id || quiz.id}
                className="p-5 rounded-2xl border border-surface-border bg-white shadow-subtle flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded">
                      {quiz.category || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{quiz.difficulty || 'Medium'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {quiz.description || 'Comprehensive evaluation synthesized by QuizForge AI.'}
                  </p>

                  {/* Unique Credential / Accreditation ID Badge */}
                  <div className="pt-2 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-[11px] text-slate-500 font-medium shrink-0">Credential ID:</span>
                      <code className="font-mono text-[11px] font-bold text-slate-800 truncate">{credId}</code>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyCredential(credId)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                        title="Copy Credential ID"
                      >
                        {copiedCredId === credId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <Link
                        to={`/certificates?verify=${encodeURIComponent(credId)}`}
                        className="text-[10px] text-primary hover:underline font-semibold pl-1"
                        title="Verify if Certificate is available for this quiz"
                      >
                        Check Status
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.timeLimit || 10}m
                    </span>
                    <span>{quiz.questions?.length || 5} Questions</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDuplicate(quiz._id || quiz.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Duplicate Quiz"
                      aria-label="Duplicate Quiz"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteTargetId(quiz._id || quiz.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Quiz"
                      aria-label="Delete Quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      to={`/quiz/${quiz._id || quiz.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Practice</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? This action will remove all questions and cannot be undone."
        confirmLabel="Delete Quiz"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </PageTransition>
  );
}
