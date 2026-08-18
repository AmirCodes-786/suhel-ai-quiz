import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Swords, 
  Award,
  BarChart3, 
  Settings,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ai-studio', label: 'AI Quiz Studio', icon: Sparkles },
  { to: '/library', label: 'Quiz Library', icon: BookOpen },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/battles', label: 'Battles', icon: Swords },
  { to: '/certificates', label: 'Certificates', icon: Award },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onItemClick }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowSignOutConfirm(false);
    if (onItemClick) onItemClick();
    await logout();
    toast.info('Signed out successfully.');
  };

  return (
    <>
      <aside className="w-56 border-r border-surface-border bg-white flex flex-col justify-between p-3 shrink-0 h-full overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-primary-light text-primary font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User / Sign Out Area */}
        {user && (
          <div className="pt-3 border-t border-surface-border space-y-2">
            <button
              onClick={handleSignOutClick}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Sign Out Warning Modal (For Mobile & Desktop) */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutConfirm(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-xs rounded-2xl border border-surface-border bg-white p-5 shadow-2xl z-10 space-y-3.5 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-500 leading-snug">
                  Are you sure you want to sign out of QuizForge AI?
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
