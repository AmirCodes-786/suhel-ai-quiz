import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Check, 
  Sparkles, 
  Save,
  Shield,
  LogOut
} from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isClerkConfigured } from '../../utils/clerk';
import api from '../../services/api';
import PageTransition from '../common/PageTransition';

function ClerkSettingsProfile() {
  return (
    <SignedIn>
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-10 h-10 border border-surface-border rounded-full'
          }
        }}
      />
    </SignedIn>
  );
}

export default function SettingsView() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || 'User');
  const [email, setEmail] = useState(user?.email || 'alex@quizforge.ai');
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasClerk = isClerkConfigured();

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    if (user) {
      setUser({ ...user, name, email });
    }
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully.');
    }, 400);
  };

  const handleUpgrade = async (planId) => {
    try {
      setIsProcessing(true);
      const res = await api.post('/billing/checkout', { planId });
      if (res.data?.success) {
        if (user) setUser({ ...user, plan: planId });
        toast.success(`Plan upgraded to ${planId.toUpperCase()}!`);
      }
    } catch (e) {
      toast.error('Could not complete plan update.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageTransition className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your account profile and subscription plan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'account' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Account Profile
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'billing' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subscription & Billing
        </button>
      </div>

      {/* 1. Account Settings */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-5 rounded-xl border border-surface-border bg-white shadow-subtle flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hasClerk ? (
                <ClerkSettingsProfile />
              ) : (
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                  alt={user?.name || 'User'} 
                  className="w-10 h-10 rounded-full object-cover border border-surface-border"
                />
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</h3>
                <p className="text-xs text-slate-500">{user?.email || 'user@quizforge.ai'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-surface-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Subscription Settings */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-surface-border bg-white shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Current Plan</h3>
                <p className="text-xs text-slate-500">Your active QuizForge subscription tier.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full uppercase tracking-wider">
                {user?.plan?.toUpperCase() || 'PRO'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className={`p-4 rounded-xl border ${user?.plan === 'free' ? 'border-primary bg-primary-light/10' : 'border-surface-border bg-white'} space-y-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Free Tier</h4>
                    <span className="text-lg font-bold text-slate-900">$0</span>
                  </div>
                  {user?.plan === 'free' && <Check className="w-4 h-4 text-primary" />}
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li>• 10 AI quiz generations / month</li>
                  <li>• Standard processing</li>
                </ul>
              </div>

              <div className={`p-4 rounded-xl border ${user?.plan !== 'free' ? 'border-primary bg-primary-light/10' : 'border-surface-border bg-white'} space-y-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pro Tier</h4>
                    <span className="text-lg font-bold text-slate-900">$12 <span className="text-xs font-normal text-slate-500">/ mo</span></span>
                  </div>
                  {user?.plan !== 'free' && <Check className="w-4 h-4 text-primary" />}
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li>• Unlimited AI quiz generations</li>
                  <li>• Deep cognitive evaluation</li>
                  <li>• Multiplayer quiz battles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
