import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  Sparkles, 
  CreditCard, 
  X, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';

export default function BillingModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const { play } = useSound();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (planId) => {
    try {
      setIsProcessing(true);
      play('playClick');
      const res = await api.post('/billing/checkout', {
        planId,
        paymentGateway: selectedGateway
      });

      if (res.data?.success) {
        play('playFanfare');
        setSuccessMsg(`Successfully activated ${planId.toUpperCase()} membership!`);
        if (user) {
          setUser({ ...user, plan: planId });
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (e) {
      play('playWrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-3xl w-full p-8 rounded-3xl bg-surface-100 border border-primary/40 shadow-2xl space-y-6 animate-scaleUp relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-surface-50 border border-surface-border text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold">
            <Crown className="w-4 h-4" />
            UNLIMITED AI ASSESSMENT SUPERPOWERS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Upgrade Your Tier</h2>
          <p className="text-xs text-gray-400">Choose between Stripe and Razorpay instant checkout.</p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/40 text-primary text-xs text-center font-bold font-mono animate-fadeIn">
            ⚡ {successMsg}
          </div>
        )}

        {/* Gateway Selector */}
        <div className="flex justify-center gap-3">
          {['stripe', 'razorpay'].map((gw) => (
            <button
              key={gw}
              onClick={() => {
                setSelectedGateway(gw);
                play('playClick');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all uppercase font-mono ${
                selectedGateway === gw
                  ? 'bg-secondary/20 border-secondary text-secondary shadow-glow-secondary'
                  : 'bg-surface-50 border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              Pay with {gw}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pro */}
          <div className="p-6 rounded-2xl bg-surface-card border-2 border-primary/50 shadow-glow-primary space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Pro Alchemist</span>
                <span className="text-xl font-extrabold text-primary font-heading">$19 / mo</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Multimodal AI Synthesis</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Full 6-Tier Bloom's Taxonomy</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Verifiable PDF Certificates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Priority Arena Hosting</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-black font-extrabold text-xs shadow-glow-primary hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Enterprise Matrix</span>
                <span className="text-xl font-extrabold text-secondary font-heading">$99 / mo</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" /> Unlimited Workspace Seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" /> Team RBAC Permissions</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" /> Enterprise Skill Gap Analytics</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" /> 24/7 SLA Support</li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('enterprise')}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-surface-50 border border-secondary/40 text-secondary hover:bg-secondary hover:text-black font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? 'Processing...' : 'Upgrade to Enterprise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
