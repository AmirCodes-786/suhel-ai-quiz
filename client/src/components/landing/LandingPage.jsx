import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  Brain, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  ChevronDown,
  Check,
  Award,
  Layers,
  ShieldCheck,
  Heart,
  RotateCw,
  Swords,
  UploadCloud,
  FileText,
  Video,
  Globe,
  Star,
  Users,
  Flame,
  CheckCircle2,
  TrendingUp,
  Play
} from 'lucide-react';
import PageTransition from '../common/PageTransition';

// Interactive Sample Questions for Live Hero Demo
const DEMO_QUESTIONS = [
  {
    topic: 'Artificial Intelligence',
    icon: Brain,
    badge: 'AI & Neural Networks',
    question: 'Why does scaled dot-product attention divide queries and keys by the square root of the key dimension (√d_k)?',
    options: [
      'To counteract extremely small gradients caused by large dot-product magnitudes in softmax',
      'To double the maximum sequence length memory capacity',
      'To completely remove the need for feed-forward neural layers',
      'To force recurrent state preservation across time steps'
    ],
    correctIdx: 0,
    explanation: 'When d_k is large, dot products grow substantially in magnitude, pushing softmax into regions with vanishing gradients. Dividing by √d_k stabilizes training gradients.'
  },
  {
    topic: 'Cell Biology',
    icon: Sparkles,
    badge: 'Biochemistry',
    question: 'What is the primary function of ATP synthase during oxidative phosphorylation in mitochondria?',
    options: [
      'Hydrolyzing glucose directly into pyruvate molecules',
      'Using the proton electrochemical gradient (pmf) across the inner membrane to synthesize ATP from ADP and Pi',
      'Pumping electrons back into the mitochondrial matrix',
      'Synthesizing phospholipid bilayers for cellular membranes'
    ],
    correctIdx: 1,
    explanation: 'ATP synthase acts as a molecular turbine, harnessing the potential energy of the proton electrochemical gradient across the mitochondrial inner membrane to phosphorylate ADP into ATP.'
  },
  {
    topic: 'Distributed Systems',
    icon: Zap,
    badge: 'Computer Science',
    question: 'In the Raft consensus algorithm, what occurs when a follower does not receive a heartbeat within the election timeout period?',
    options: [
      'The cluster immediately drops all pending transaction logs',
      'The follower transitions to Candidate state, increments currentTerm, and requests votes',
      'The node is permanently disconnected from the peer group',
      'It immediately assumes the Leader role without elections'
    ],
    correctIdx: 1,
    explanation: 'When election timeout expires without heartbeats from a leader, the follower assumes leader failure, increments its term, transitions to candidate state, votes for itself, and broadcasts RequestVote RPCs.'
  }
];

const FAQS = [
  {
    q: 'What study materials can I turn into quizzes?',
    a: 'You can paste lecture notes, upload PDF or Word documents, provide a link to any public website article, or paste a YouTube video lecture URL. QuizForge AI extracts and grounds all questions directly in your source.'
  },
  {
    q: 'How does the balanced answer distribution work?',
    a: 'Our backend algorithm automatically distributes the correct answer positions evenly across A, B, C, and D (e.g. 5 each in a 20-question quiz), while eliminating predictable streaks and patterns without altering factual truth.'
  },
  {
    q: 'How do I earn an official Certificate of Mastery?',
    a: 'Scoring 80% or higher on eligible assessments instantly awards an official, verifiable Certificate of Mastery equipped with a unique Credential ID (e.g. QF-AI-2026-XXXXXX) and a high-resolution downloadable PDF.'
  },
  {
    q: 'Can I study with flashcards and multiplayer battles?',
    a: 'Yes! Convert any quiz into active recall flashcards with Leitner spaced-repetition ratings, or create real-time multiplayer battle arena rooms to challenge friends and classmates with a live leaderboard.'
  },
  {
    q: 'Is QuizForge AI free to use?',
    a: 'Yes! Every user gets 10 AI quiz generations every day with full access to flashcards, multiplayer battles, and certificates. Admin and Pro tiers provide unlimited generations.'
  }
];

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Interactive 3D Flip Card state on landing page
  const [isDemoFlipped, setIsDemoFlipped] = useState(false);

  // Interactive Battle Arena Demo State
  const [battleScores, setBattleScores] = useState([
    { name: 'Alex (You)', score: 380, streak: 3, isYou: true },
    { name: 'Sophia', score: 340, streak: 2, isYou: false },
    { name: 'Marcus', score: 290, streak: 1, isYou: false }
  ]);

  const currentQ = DEMO_QUESTIONS[activeDemoIdx];

  const handleSelectOption = (idx) => {
    setSelectedOption(idx);
    setShowExplanation(true);
  };

  const handleNextDemo = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setActiveDemoIdx((prev) => (prev + 1) % DEMO_QUESTIONS.length);
  };

  return (
    <PageTransition className="min-h-screen bg-[#FDFDFC] text-slate-900 selection:bg-primary-light selection:text-primary">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-amber-400/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -right-40 w-[450px] h-[450px] bg-indigo-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-[70%] -left-40 w-[450px] h-[450px] bg-primary/10 blur-[140px] rounded-full" />
      </div>

      {/* 1. FIXED NAVBAR (Always visible when scrolling) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-primary/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="tracking-tight text-base sm:text-lg">
              QuizForge <span className="text-primary font-black">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <a href="#demo" className="hover:text-primary transition-colors">Live Demo</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#modes" className="hover:text-primary transition-colors">Modes</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/sign-in"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100/70 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-xl shadow-sm shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (With pt-20 for fixed header clearance) */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 max-w-5xl mx-auto text-center">
        {/* Animated Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] sm:text-xs font-medium shadow-md shadow-slate-900/10 mb-6"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200">QuizForge AI 2.0</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Active Recall & Mastery
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-5 sm:mb-6"
        >
          Transform Any Material Into <br className="hidden xs:inline" />
          <span className="bg-gradient-to-r from-primary via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            Mastery-Level Quizzes
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
        >
          Upload lecture notes, PDFs, or YouTube links. Synthesize grounded assessments, active recall flashcards, live battles, and verified credentials in seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto"
        >
          <Link
            to="/sign-up"
            className="w-full xs:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-sm shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Free Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full xs:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-800 font-bold text-sm shadow-2xs flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-slate-700 text-slate-700" />
            <span>Try Interactive Demo</span>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-500 pt-8 sm:pt-10"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Balanced A/B/C/D Distribution</span>
          <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" /> Verified Accreditation Certificates</span>
          <span className="flex items-center gap-1.5"><Swords className="w-4 h-4 text-indigo-600" /> Real-Time Multiplayer Battles</span>
        </motion.div>
      </section>

      {/* 3. INTERACTIVE LIVE DEMO PLAYGROUND (WOW Factor) */}
      <section id="demo" className="relative z-10 px-4 pb-16 sm:pb-24 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl sm:rounded-3xl border-2 border-slate-200/90 bg-white/90 backdrop-blur-xl p-3 sm:p-6 shadow-xl shadow-slate-200/50 space-y-4"
        >
          {/* Demo Header Bar */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-primary" /> Live Interactive AI Simulator
              </span>
            </div>

            {/* Topic Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {DEMO_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveDemoIdx(idx);
                    setSelectedOption(null);
                    setShowExplanation(false);
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    activeDemoIdx === idx
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {q.topic}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Question Card */}
          <div className="p-4 sm:p-6 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/20">
                {currentQ.badge}
              </span>
              <span className="font-mono text-slate-500 font-medium">Question {activeDemoIdx + 1} of {DEMO_QUESTIONS.length}</span>
            </div>

            <h3 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            {/* Interactive Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQ.correctIdx;
                const letter = ['A', 'B', 'C', 'D'][oIdx];

                let btnStyles = 'bg-white border-slate-200 text-slate-700 hover:border-primary/60 hover:bg-primary-light/10';
                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                  } else if (isSelected) {
                    btnStyles = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                  } else {
                    btnStyles = 'bg-white/60 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 active:scale-[0.98] ${btnStyles}`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                      selectedOption !== null && isCorrect 
                        ? 'bg-emerald-600 text-white' 
                        : isSelected 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {letter}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Answer Feedback */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      {selectedOption === currentQ.correctIdx ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer! (+100 XP)
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          Incorrect Choice. (Correct: {['A', 'B', 'C', 'D'][currentQ.correctIdx]})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleNextDemo}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-slate-600 leading-relaxed pt-1">
                    <strong className="text-slate-900">AI Breakdown:</strong> {currentQ.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* 4. FOUR LEARNING MODALITIES (Interactive 3D Cards) */}
      <section id="modes" className="relative z-10 py-16 sm:py-24 px-4 max-w-5xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider border border-primary/20">
            Omnichannel Learning
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-3">
            Every Way You Study, Supercharged.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From deep diagnostic assessments to live competitive battle arenas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: 7 Input Modalities */}
          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">7 Input Modalities</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste raw notes, upload PDF/Word documents, insert YouTube video lectures, or scrape article URLs.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['PDF & Word', 'YouTube Video', 'Website URLs', 'Raw Notes', 'Images'].map(tag => (
                  <span key={tag} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Active Recall Flashcards (Interactive Flip Preview) */}
          <div 
            onClick={() => setIsDemoFlipped(!isDemoFlipped)}
            className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-subtle hover:border-slate-300 cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" /> Tap to Flip
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Spaced Repetition Flashcards</h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs min-h-[70px] flex items-center justify-center text-center">
                {isDemoFlipped ? (
                  <span className="font-semibold text-emerald-800">
                    "Backpropagation calculates gradients via the chain rule to minimize neural error."
                  </span>
                ) : (
                  <span className="font-semibold text-slate-800">
                    "What fundamental algorithm drives neural network weight updates?"
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Multiplayer Battle Arena */}
          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Head-to-Head Multiplayer Arena</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Host multiplayer rooms on any topic. Compete in real-time with speed bonuses and live podium rankings.
              </p>
              <div className="space-y-1.5 pt-1">
                {battleScores.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="font-semibold text-slate-800">#{idx + 1} {p.name}</span>
                    <span className="font-mono font-bold text-primary">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Verifiable Accreditation Certificates */}
          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Verifiable Certificates (Score ≥ 80%)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Earn authentic credentials with unique cryptographic IDs (e.g. <code>QF-AI-2026-XXXXXX</code>) and shareable PDF diplomas.
              </p>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-950 block">Official Mastery Credential</span>
                  <span className="text-[10px] font-mono text-amber-800">ID: QF-CR-9A4B2C</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="relative z-10 py-16 sm:py-24 px-4 max-w-4xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider border border-primary/20">
            Simple Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            Start Free. Upgrade Anytime.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Zero commitment. Try high-yield active recall with full feature access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* Free Tier */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-subtle flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Standard Tier</h3>
                <p className="text-xs text-slate-500 mt-0.5">Perfect for day-to-day study notes and exam preparation.</p>
              </div>
              <div className="text-4xl font-black text-slate-900">$0 <span className="text-xs font-normal text-slate-500">/ forever</span></div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 10 AI quiz generations per day</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> PDF, YouTube, URL & Notes ingestion</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Active recall flashcards studio</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Verifiable accreditation certificates</li>
              </ul>
            </div>
            <Link
              to="/sign-up"
              className="w-full py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold text-center transition-colors block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-primary bg-gradient-to-b from-white to-primary-light/10 shadow-card flex flex-col justify-between space-y-6 relative">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pro & Admin</h3>
                  <p className="text-xs text-slate-500 mt-0.5">For power learners, educators, and enterprise teams.</p>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/30 uppercase tracking-wider">
                  Unlimited
                </span>
              </div>
              <div className="text-4xl font-black text-slate-900">$12 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Unlimited AI quiz generations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> High-concurrency multiplayer battles</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Deep Bloom's cognitive taxonomy weighting</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /> Priority GPU LLM processing stream</li>
              </ul>
            </div>
            <Link
              to="/sign-up"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold text-center shadow-md shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98] block"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="relative z-10 py-16 sm:py-24 px-4 max-w-3xl mx-auto border-t border-slate-200/80">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <div key={idx} className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION BANNER */}
      <section className="relative z-10 py-16 sm:py-20 px-4 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl space-y-6">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 uppercase tracking-wider">
            Ready to Excel?
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Start Generating Smarter Quizzes Today
          </h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            Turn your courses, lecture notes, and research materials into active mastery in under 60 seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Create Your First Quiz Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 py-8 px-4 text-slate-500 text-xs bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} QuizForge AI. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
            Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" /> by <span className="text-slate-900 font-bold">Suhel</span>
          </p>
        </div>
      </footer>
    </PageTransition>
  );
}
