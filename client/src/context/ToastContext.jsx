import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className={`
                pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg text-xs font-medium bg-white
                ${t.type === 'success' ? 'border-emerald-200 text-slate-800' : ''}
                ${t.type === 'error' ? 'border-red-200 text-red-800' : ''}
                ${t.type === 'info' ? 'border-slate-200 text-slate-800' : ''}
              `}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                {t.type === 'info' && <Info className="w-4 h-4 text-slate-600 shrink-0" />}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast:', msg),
      error: (msg) => console.error('Toast Error:', msg),
      info: (msg) => console.info('Toast Info:', msg),
    };
  }
  return context;
}
