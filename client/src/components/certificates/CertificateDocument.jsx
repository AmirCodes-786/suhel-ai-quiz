import React from 'react';
import { Zap, Award } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CertificateDocument({
  certificate,
  className = '',
  isPrint = false
}) {
  const certId = certificate?.certificateId || 'QF-AI-2026-000000';
  const recipientName = certificate?.recipientName || 'Recipient';
  const quizTitle = certificate?.quizTitle || 'Assessment';
  const score = certificate?.score ?? 100;
  const issueDateFormatted = formatDate(certificate?.issueDate);

  return (
    <div
      className={`relative w-full min-h-[380px] sm:min-h-[460px] md:aspect-[1.414/1] bg-[#FCFCFA] text-slate-900 select-none overflow-hidden flex flex-col justify-between p-4 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl border border-slate-300/80 ${className}`}
      style={{
        boxShadow: isPrint ? 'none' : '0 20px 50px -12px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(15, 23, 42, 0.05)'
      }}
    >
      {/* Outer Sophisticated Border */}
      <div className="absolute inset-2 sm:inset-4 md:inset-5 border-2 border-slate-900/90 pointer-events-none rounded-lg" />

      {/* Inner Fine Hairline Border */}
      <div className="absolute inset-3 sm:inset-5 md:inset-6 border border-slate-300 pointer-events-none rounded" />

      {/* Corner Geometric Accents */}
      <div className="absolute top-3 sm:top-5 md:top-6 left-3 sm:left-5 md:left-6 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-indigo-900 pointer-events-none" />
      <div className="absolute top-3 sm:top-5 md:top-6 right-3 sm:right-5 md:right-6 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-indigo-900 pointer-events-none" />
      <div className="absolute bottom-3 sm:bottom-5 md:bottom-6 left-3 sm:left-5 md:left-6 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-indigo-900 pointer-events-none" />
      <div className="absolute bottom-3 sm:bottom-5 md:bottom-6 right-3 sm:right-5 md:right-6 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-indigo-900 pointer-events-none" />

      {/* Top Header: Brand & Title */}
      <div className="text-center space-y-1 sm:space-y-1.5 pt-1 relative z-10">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
          </div>
          <span className="text-[9px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-slate-800 uppercase font-sans">
            QUIZFORGE AI
          </span>
        </div>

        <h1 className="text-sm sm:text-2xl md:text-3xl font-serif tracking-wider sm:tracking-widest text-slate-900 uppercase font-bold">
          CERTIFICATE OF ACHIEVEMENT
        </h1>

        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-0.5">
          <div className="w-8 sm:w-16 h-px bg-slate-300" />
          <span className="text-[8px] sm:text-[11px] text-slate-500 font-sans tracking-wider uppercase font-medium">
            Cognitive Assessment Credential
          </span>
          <div className="w-8 sm:w-16 h-px bg-slate-300" />
        </div>
      </div>

      {/* Middle Section: Recipient & Achievement */}
      <div className="text-center my-auto space-y-2 sm:space-y-4 py-2 relative z-10">
        <p className="text-[10px] sm:text-sm text-slate-600 font-sans tracking-wide italic">
          This certificate is proudly presented to
        </p>

        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight px-2 break-words">
            {recipientName}
          </div>
          <div className="w-20 sm:w-36 h-0.5 bg-indigo-900/70 mx-auto" />
        </div>

        <div className="space-y-0.5 sm:space-y-1 max-w-xl mx-auto px-2 sm:px-4">
          <p className="text-[10px] sm:text-sm text-slate-600 font-sans">
            for successfully completing
          </p>
          <div className="text-xs sm:text-lg md:text-xl font-serif font-bold text-slate-900 px-1 break-words">
            {quizTitle}
          </div>
          <p className="text-[9px] sm:text-xs text-slate-500 font-sans leading-snug max-w-md mx-auto pt-0.5 hidden xs:block">
            Demonstrating verified proficiency and high score achievement in the assessed curriculum.
          </p>
        </div>
      </div>

      {/* Bottom Section: Score, Seal, Issuer & Verification */}
      <div className="pt-2 sm:pt-3 border-t border-slate-200/90 grid grid-cols-3 items-end gap-1 sm:gap-2 text-slate-700 font-sans text-xs relative z-10">
        {/* Left: Score & Date */}
        <div className="space-y-0.5 text-left">
          <div>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold leading-tight">
              Score
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 font-serif">
              {score}%
            </span>
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold leading-tight">
              Issued
            </span>
            <span className="text-[9px] sm:text-xs text-slate-800 font-medium truncate block">
              {issueDateFormatted}
            </span>
          </div>
        </div>

        {/* Center: Official Certification Seal */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 border-amber-600/70 bg-amber-50/40 p-0.5 sm:p-1 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-full h-full rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-amber-900">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700 mb-0.5" />
              <span className="text-[5px] sm:text-[7px] font-bold tracking-widest uppercase">
                VERIFIED
              </span>
              <span className="text-[4px] sm:text-[6px] text-amber-800 uppercase tracking-tighter hidden sm:inline">
                QUIZFORGE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Signature & ID */}
        <div className="space-y-1 text-right">
          <div className="space-y-0.5">
            <div className="w-14 sm:w-28 h-px bg-slate-400 ml-auto" />
            <span className="text-[9px] sm:text-xs font-semibold text-slate-900 block font-serif leading-tight">
              QuizForge AI
            </span>
            <span className="text-[7px] sm:text-[9px] uppercase tracking-wider text-slate-400 block">
              Authorized Issuer
            </span>
          </div>

          <div className="pt-0.5">
            <span className="text-[7px] sm:text-[9px] font-mono text-slate-500 uppercase truncate block">
              ID: {certId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
