import React, { useState, useEffect } from 'react';
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Target,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import { useSound } from '../../context/SoundContext';

export default function StudyPlanRoadmap() {
  const { play } = useSound();
  const [plans, setPlans] = useState([]);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadStudyPlans();
  }, []);

  const loadStudyPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/study-plans');
      if (res.data?.success && res.data.plans) {
        setPlans(res.data.plans);
      }
    } catch (e) {
      console.warn('Study plans load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans[activePlanIdx] || {
    title: 'AI Engineering & LLM Architecture Mastery',
    goal: 'Master Transformer Attention, Fine-tuning, RAG pipelines, and Quantization',
    targetWeeks: 4,
    progress: 65,
    tasks: [
      { id: 't1', title: 'Implement Multi-Head Attention in PyTorch from scratch', priority: 'High', estimatedMinutes: 90, completed: true, category: 'Coding', day: 1 },
      { id: 't2', title: 'Study LoRA (Low-Rank Adaptation) and QLoRA paper', priority: 'High', estimatedMinutes: 60, completed: true, category: 'Reading', day: 2 },
      { id: 't3', title: 'Solve 20 Practice Questions on Vector Embeddings & HNSW Indexing', priority: 'Medium', estimatedMinutes: 45, completed: false, category: 'Quiz', day: 3 },
      { id: 't4', title: 'Benchmark KV Cache memory overhead in vLLM vs HuggingFace', priority: 'Medium', estimatedMinutes: 60, completed: false, category: 'Lab', day: 4 }
    ]
  };

  const handleToggleTask = async (taskId) => {
    play('playClick');
    const task = currentPlan.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      if (task.completed) play('playCorrect');

      const completedCount = currentPlan.tasks.filter(t => t.completed).length;
      currentPlan.progress = Math.round((completedCount / currentPlan.tasks.length) * 100);
      setPlans([...plans]);

      try {
        await api.patch(`/study-plans/${currentPlan._id || currentPlan.id}/task/${taskId}`, {
          completed: task.completed
        });
      } catch (e) {}
    }
  };

  const handleGeneratePlan = async () => {
    if (!newGoal.trim()) return;
    try {
      setIsGenerating(true);
      play('playClick');
      const res = await api.post('/generate/study-plan', {
        goal: newGoal,
        targetWeeks: 4,
        weakTopics: ['Bloom Analyze Tier', 'Transformer Math']
      });

      if (res.data?.success && res.data.studyPlan) {
        play('playCorrect');
        setPlans([res.data.studyPlan, ...plans]);
        setActivePlanIdx(0);
        setIsModalOpen(false);
        setNewGoal('');
      }
    } catch (e) {
      console.error(e);
      play('playWrong');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Personalized AI Roadmaps</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">Weakness Targeted</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            Adaptive Study Plans
          </h1>
        </div>

        <button
          onClick={() => {
            play('playClick');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-black font-extrabold text-xs shadow-glow-primary hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Study Roadmap
        </button>
      </div>

      {/* PLAN SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {plans.map((p, idx) => (
          <button
            key={p._id || p.id || idx}
            onClick={() => {
              play('playClick');
              setActivePlanIdx(idx);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activePlanIdx === idx
                ? 'bg-primary text-black font-extrabold shadow-glow-primary'
                : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* ROADMAP OVERVIEW CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold uppercase">
              {currentPlan.targetWeeks} Week Intensive
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {currentPlan.title}
            </h2>
            <p className="text-xs text-gray-400 max-w-xl">
              Target Objective: {currentPlan.goal}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-border flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-primary font-heading">{currentPlan.progress}%</span>
              <span className="text-[10px] text-gray-500 block font-mono">Completed</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary flex items-center justify-center font-mono text-xs text-white">
              🎯
            </div>
          </div>
        </div>

        {/* Task Items Checklist */}
        <div className="space-y-3 pt-4 border-t border-surface-border">
          <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider font-bold">
            Prioritized Learning Milestones
          </h3>

          <div className="space-y-2.5">
            {currentPlan.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  task.completed
                    ? 'bg-primary/5 border-primary/30 text-gray-400'
                    : 'bg-surface-50 border-surface-border hover:border-primary/40 text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-1 rounded-full ${
                    task.completed ? 'text-primary' : 'text-gray-500 group-hover:text-primary'
                  }`}>
                    {task.completed ? <CheckCircle2 className="w-5 h-5 fill-primary text-black" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-semibold block ${
                      task.completed ? 'line-through text-gray-400' : 'text-white'
                    }`}>
                      {task.title}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>Day {task.day || 1}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.estimatedMinutes}m</span>
                      <span>•</span>
                      <span className="text-primary">{task.category}</span>
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  task.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                  task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  {task.priority} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: NEW STUDY PLAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-surface-100 border border-primary/30 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Study Plan Generator
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              State your learning goal, certification exam, or technical topic to synthesize a structured weekly roadmap.
            </p>

            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect, Kubernetes CKA Exam Prep"
              className="w-full p-3 rounded-xl bg-surface-50 border border-surface-border text-white text-xs focus:outline-none focus:border-primary"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating || !newGoal.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-black font-extrabold text-xs shadow-glow-primary hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isGenerating ? 'Synthesizing Roadmap...' : 'Create Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
