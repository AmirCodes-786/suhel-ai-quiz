import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Premium PageTransition wrapper
 * Provides silky-smooth cubic-bezier fade & vertical drift.
 * Automatically respects reduced motion preferences.
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 12,
      scale: shouldReduceMotion ? 1 : 0.995
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: [0.22, 1, 0.36, 1], // Smooth custom cubic bezier
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : -8,
      scale: shouldReduceMotion ? 1 : 0.995,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.15,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
