import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-4 px-4 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} QuizForge AI. All rights reserved.</p>
        <p className="flex items-center gap-1.5 text-slate-600 font-medium">
          Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" /> by <span className="text-slate-900 font-semibold">Suhel</span>
        </p>
      </div>
    </footer>
  );
}
