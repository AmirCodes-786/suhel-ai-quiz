import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reusable PageTransition wrapper
 * Provides a fast, subtle fade and vertical displacement (180ms).
 * Automatically disables motion if the user prefers reduced motion.
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 6
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.18,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : -4,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.12,
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
      className={className}
    >
      {children}
    </motion.div>
  );
}
