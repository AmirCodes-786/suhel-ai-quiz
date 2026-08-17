import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserPlus, 
  Crown, 
  Check, 
  Share2, 
  Copy, 
  FolderPlus,
  Play
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';

export default function TeamWorkspace() {
  const { user } = useAuth();
  const { play } = useSound();
  const [teams, setTeams] = useState([]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams');
      if (res.data?.success && res.data.teams) {
        setTeams(res.data.teams);
      }
    } catch (e) {
      console.warn('Teams load fallback:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTeam = teams[activeTeamIdx] || (teams.length > 0 ? teams[0] : {
    name: `${user?.name || 'My'} Study Workspace`,
    inviteCode: 'JOIN-TEAM',
    members: [
      { userId: user?._id || user?.id || 'u1', name: user?.name || 'Workspace Owner', email: user?.email || '', role: 'owner' }
    ],
    quizzes: []
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      play('playClick');
      const res = await api.post(`/teams/${currentTeam._id || currentTeam.id}/members`, {
        email: inviteEmail,
        role: inviteRole
      });
      if (res.data?.success) {
        play('playCorrect');
        currentTeam.members.push(res.data.member);
        setTeams([...teams]);
        setInviteEmail('');
      }
    } catch (e) {}
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`https://quizforge.ai/join-team?code=${currentTeam.inviteCode}`);
    setCopied(true);
    play('playClick');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Collaborative Repositories</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">Role-Based Access Control</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          Team Workspaces
        </h1>
      </div>

      {/* WORKSPACE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20 text-xs font-mono font-bold uppercase">
              ACTIVE WORKSPACE
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">{currentTeam.name}</h2>
          </div>

          <button
            onClick={copyInvite}
            className="px-4 py-2 rounded-xl bg-surface-50 border border-surface-border text-xs font-bold text-gray-200 hover:text-white flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            <span>Invite Code: {currentTeam.inviteCode}</span>
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="p-4 rounded-2xl bg-surface-50 border border-surface-border flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 p-3 rounded-xl bg-surface-100 border border-surface-border text-white text-xs focus:outline-none focus:border-primary"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="p-3 rounded-xl bg-surface-100 border border-surface-border text-white text-xs focus:outline-none"
          >
            <option value="member">Member (Can take quizzes)</option>
            <option value="admin">Admin (Can create & edit)</option>
          </select>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-primary text-black font-extrabold text-xs shadow-glow-primary hover:brightness-110 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Invite Colleague
          </button>
        </form>

        {/* Members Table */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider font-bold">
            Workspace Members ({currentTeam.members.length})
          </h3>
          <div className="space-y-2">
            {currentTeam.members.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-surface-50 border border-surface-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold font-mono">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      {m.name}
                      {m.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </span>
                    <span className="text-[11px] text-gray-400">{m.email}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                  m.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  m.role === 'admin' ? 'bg-secondary/10 text-secondary border border-secondary/30' :
                  'bg-surface-200 text-gray-400'
                }`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
