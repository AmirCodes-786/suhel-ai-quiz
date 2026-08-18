import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Check, 
  Sparkles, 
  Save, 
  Shield, 
  LogOut, 
  AlertTriangle,
  Camera,
  Mail,
  Briefcase,
  FileText,
  X
} from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isClerkConfigured } from '../../utils/clerk';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../common/PageTransition';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
];

export default function SettingsView() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const hasClerk = isClerkConfigured();

  const [activeTab, setActiveTab] = useState('account');
  const [name, setName] = useState(user?.name || 'User');
  const [email, setEmail] = useState(user?.email || 'alex@quizforge.ai');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [headline, setHeadline] = useState(user?.headline || 'Continuous Learner & AI Enthusiast');
  const [bio, setBio] = useState(user?.bio || 'Preparing for technical assessments and mastering core STEM concepts.');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.put('/auth/profile', {
        name,
        email,
        avatar,
        headline,
        bio
      });

      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        toast.success('Profile changes saved successfully!');
      } else {
        if (user) setUser({ ...user, name, email, avatar, headline, bio });
        toast.success('Profile updated locally.');
      }
    } catch (err) {
      console.warn('Profile save warning:', err.message);
      if (user) setUser({ ...user, name, email, avatar, headline, bio });
      toast.success('Profile updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    await logout();
    toast.info('Signed out successfully.');
  };

  return (
    <PageTransition className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal profile, details, and subscription plan.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'account' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'billing' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subscription & Plan
        </button>
      </div>

      {/* 1. Account / Edit Profile View */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Header Profile Badge Card */}
          <div className="p-5 rounded-2xl border border-surface-border bg-white shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img 
                  src={avatar || user?.avatar || AVATAR_PRESETS[0]} 
                  alt={name || 'User'} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{name || 'User'}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    user?.isAdmin || user?.role === 'admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {user?.isAdmin || user?.role === 'admin' ? '👑 Admin' : 'Pro Learner'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-surface-border bg-white shadow-subtle space-y-5">
            <div className="border-b border-surface-border pb-3">
              <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your display name, email, avatar, and learning profile.
              </p>
            </div>

            {/* Avatar Selection Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Profile Avatar
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_PRESETS.map((avUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(avUrl)}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                      avatar === avUrl ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={avUrl} alt="Preset Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Headline / Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Headline / Professional Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. CS Student, Medical Resident, Frontend Developer"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Bio & Learning Goals
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us what topics or exams you are preparing for..."
                  className="w-full p-3 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Form Footer Action */}
            <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Subscription Settings */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-surface-border bg-white shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Current Plan</h3>
                <p className="text-xs text-slate-500">Your active QuizForge AI subscription status.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full uppercase tracking-wider">
                {user?.isAdmin ? '👑 ADMIN UNLIMITED' : (user?.plan?.toUpperCase() || 'PRO')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-surface-border bg-white space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Standard Tier</h4>
                    <span className="text-lg font-bold text-slate-900">$0</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li>• 10 AI quiz generations / day</li>
                  <li>• Flashcards & Certificates</li>
                  <li>• Standard processing speed</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-primary bg-primary-light/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pro & Admin Tier</h4>
                    <span className="text-lg font-bold text-slate-900">Active</span>
                  </div>
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li>• Unlimited AI quiz generations</li>
                  <li>• Real-time multiplayer battle arena</li>
                  <li>• Verified certificate verification</li>
                  <li>• Priority LLM GPU processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL (Mobile & Desktop) */}
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
              className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-white p-6 shadow-2xl z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to sign out of QuizForge AI? You will need to sign back in to access your quizzes.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
