import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Plus, Search, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleMobileNav, isMobileNavOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">
              QuizForge <span className="text-primary">AI</span>
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search your quizzes..."
              onKeyDown={handleSearchSubmit}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-surface-border text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Right Actions: Create Quiz + User Profile */}
        <div className="flex items-center gap-3">
          <Link
            to="/ai-studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Create Quiz</span>
          </Link>

          {/* User Profile */}
          <div className="flex items-center pl-1">
            {user ? (
              <Link
                to="/settings"
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Account Settings"
              >
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                  alt={user?.name || 'User'} 
                  className="w-7 h-7 rounded-full object-cover border border-surface-border"
                />
                <span className="hidden sm:inline text-xs font-medium text-slate-700">
                  {user?.name?.split(' ')[0] || 'Account'}
                </span>
              </Link>
            ) : (
              <Link
                to="/sign-in"
                className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
