import React from 'react';
import { Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Clean, minimal authentication loading screen
 * Features a small centered QuizForge AI mark with a subtle breathing pulse.
 * Avoids giant spinners or flash of unstyled content.
 */
export default function AuthLoadingScreen() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
        }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-3"
      >
        {/* Brand Mark */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm"
        >
          <Zap className="w-5 h-5 fill-white" />
        </motion.div>

        {/* Minimal Label */}
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 tracking-tight">
          <span>QuizForge</span>
          <span className="text-primary">AI</span>
        </div>
      </motion.div>
    </div>
  );
}
