import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Swords, 
  Award,
  BarChart3, 
  Settings
} from 'lucide-react';

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
  return (
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
    </aside>
  );
}
