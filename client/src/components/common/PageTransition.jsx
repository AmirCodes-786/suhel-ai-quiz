import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Premium PageTransition wrapper
 * Provides visible, snappy, buttery-smooth page entry and exit animations.
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 16,
      scale: shouldReduceMotion ? 1 : 0.99
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.24,
        ease: [0.22, 1, 0.36, 1], // Smooth exponential deceleration
        staggerChildren: 0.06
      }
    },
    exit: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : -10,
      scale: shouldReduceMotion ? 1 : 0.99,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.14,
        ease: 'easeIn'
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
