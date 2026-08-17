import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  Heart
} from 'lucide-react';
import PageTransition from '../common/PageTransition';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const shouldReduceMotion = useReducedMotion();
  const previewRef = useRef(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Subtle GSAP scroll parallax on product preview
  useEffect(() => {
    if (shouldReduceMotion) return;
    const ctx = gsap.context(() => {
      if (previewRef.current) {
        gsap.to(previewRef.current, {
          y: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: previewRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        });
      }
    });
    return () => ctx.revert();
  }, [shouldReduceMotion]);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: shouldReduceMotion ? 1 : 0, 
      y: shouldReduceMotion ? 0 : 16 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <PageTransition className="bg-white text-slate-900 min-h-screen">
      {/* 1. PUBLIC LANDING HEADER */}
      <motion.header 
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: 'easeOut' }}
        className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-30"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span>QuizForge <span className="text-primary">AI</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Log in
            </Link>
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <Link
                to="/sign-up"
                className="inline-block text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                Get Started Free
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* 2. HERO SECTION */}
      <section className="py-16 sm:py-24 px-4 text-center max-w-4xl mx-auto">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Active Recall & Mastery Platform</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6"
        >
          Create Smarter Quizzes.<br />
          <span className="text-primary">Learn Deeper.</span>
        </motion.h1>

        {/* Supporting Paragraph */}
        <motion.p 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 0.3 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Generate high-quality quizzes from your notes, documents, PDFs, YouTube videos, and web content in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm transition-colors block"
            >
              See How It Works
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. PRODUCT PREVIEW */}
      <motion.section 
        ref={previewRef}
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20, scale: shouldReduceMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: shouldReduceMotion ? 0 : 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        className="px-4 pb-20 max-w-5xl mx-auto"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-card">
          <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded">
                  Question 2 of 5
                </span>
                <span className="text-xs text-slate-500 font-medium">• Medium Difficulty</span>
              </div>
              <span className="text-xs font-mono text-slate-400">01:45</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Why does scaled dot-product attention divide queries and keys by the square root of the key dimension (√d_k)?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-primary bg-primary-light text-primary font-medium text-xs">
                  A. To counteract small gradients caused by large dot products in softmax
                </div>
                <div className="p-3.5 rounded-lg border border-slate-200 text-slate-700 text-xs">
                  B. To double the sequence length memory capacity
                </div>
                <div className="p-3.5 rounded-lg border border-slate-200 text-slate-700 text-xs">
                  C. To normalize positional token weights
                </div>
                <div className="p-3.5 rounded-lg border border-slate-200 text-slate-700 text-xs">
                  D. To remove the need for feed-forward neural layers
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-900">AI Explanation:</strong> When d_k is large, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Dividing by √d_k prevents this gradient vanishing.
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. CORE FEATURES */}
      <section id="features" className="py-20 px-4 max-w-5xl mx-auto border-t border-slate-100">
        <motion.div 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Built for Real Learning
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to turn information into long-term knowledge without the noise.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">AI Quiz Generation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Turn your notes, PDFs, YouTube lectures, and web articles into focused quizzes in seconds.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Cognitive Bloom Levels</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate questions targeted to specific cognitive levels: Recall, Application, and Analysis.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Spaced Flashcards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Convert any quiz directly into flashcards to reinforce retention through active recall.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Detailed Explanations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every question includes clear conceptual feedback and learning tips for missed concepts.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 max-w-4xl mx-auto border-t border-slate-100">
        <motion.div 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-600 text-sm">Three simple steps to test and improve your mastery.</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Add Content</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste your raw notes, upload a PDF document, or drop a YouTube lecture URL.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              2
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Generate Quiz</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your target question count, difficulty tier, and cognitive focus levels.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              3
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Learn & Practice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Take the assessment, earn verifiable certificates, and practice your weak topic areas.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-20 px-4 max-w-4xl mx-auto border-t border-slate-100">
        <motion.div 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Simple, Transparent Pricing</h2>
          <p className="text-slate-600 text-sm">Start for free. Upgrade when you need higher limits.</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {/* Free */}
          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border border-slate-200 bg-white shadow-subtle flex flex-col justify-between space-y-6 transition-all"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Free</h3>
                <p className="text-xs text-slate-500">Perfect for trying QuizForge AI on your course notes.</p>
              </div>
              <div className="text-3xl font-bold text-slate-900">$0</div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 10 AI quiz generations per month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Text, PDF, & YouTube imports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Flashcard deck creation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Verifiable certificates</li>
              </ul>
            </div>
            <Link
              to="/sign-up"
              className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-center transition-colors block"
            >
              Get Started Free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div 
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="p-6 rounded-xl border-2 border-primary bg-white shadow-card flex flex-col justify-between space-y-6 relative transition-all"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pro</h3>
                  <p className="text-xs text-slate-500">For serious students and professionals.</p>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">POPULAR</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">$12 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited AI quiz generations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Large document and long lecture parsing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Targeted weak-topic adaptive practice</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Multiplayer battles & team leaderboards</li>
              </ul>
            </div>
            <Link
              to="/sign-up"
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold text-center shadow-xs transition-colors block"
            >
              Upgrade to Pro
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-20 px-4 max-w-3xl mx-auto border-t border-slate-100">
        <motion.div 
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h2>
        </motion.div>

        <div className="space-y-3">
          {[
            {
              q: 'What formats can I use to generate quizzes?',
              a: 'You can paste plain text notes, upload PDF or Word documents, or provide a link to any public website or YouTube video.'
            },
            {
              q: 'How does QuizForge AI help me improve on mistakes?',
              a: 'After completing each quiz, the platform analyzes which topics you missed, provides clear conceptual explanations, and lets you click "Practice Weak Topics" to generate a focused practice session.'
            },
            {
              q: 'Can I earn official certificates of completion?',
              a: 'Yes! Scoring 80% or higher on eligible assessments automatically awards a verifiable Certificate of Mastery with a unique credential ID and downloadable PDF.'
            },
            {
              q: 'Can I study with flashcards?',
              a: 'Yes, you can generate flashcard decks directly from your quizzes and study them with simple active recall cards.'
            },
            {
              q: 'Are there multiplayer quiz battles?',
              a: 'Yes, you can host or join live quiz rooms using a room code to practice with friends or classmates in real time.'
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden transition-colors">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
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
                    transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeInOut' }}
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

      {/* 8. FINAL CTA */}
      <motion.section 
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="py-16 px-4 max-w-4xl mx-auto text-center border-t border-slate-100"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Start Creating Smarter Quizzes Today
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Turn your study materials into interactive quizzes in less than a minute.
        </p>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="inline-block"
        >
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xs transition-colors"
          >
            Generate a Quiz Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.section>

      {/* CLEAN FOOTER */}
      <footer className="border-t border-slate-100 py-6 px-4 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} QuizForge AI. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
            Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" /> by <span className="text-slate-900 font-semibold">Suhel</span>
          </p>
        </div>
      </footer>
    </PageTransition>
  );
}
