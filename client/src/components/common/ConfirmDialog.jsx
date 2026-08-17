import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Accessible, minimal confirmation dialog for destructive actions
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  description = 'Are you sure you want to perform this action? This cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
  isLoading = false
}) {
  const shouldReduceMotion = useReducedMotion();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={isLoading ? undefined : onCancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-xl border border-surface-border bg-white p-6 shadow-xl z-10"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="dialog-title" className="text-sm font-semibold text-slate-900">
                  {title}
                </h3>
                <p id="dialog-description" className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-lg border border-surface-border text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`
                  px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5
                  ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'}
                  disabled:opacity-50
                `}
              >
                {isLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
