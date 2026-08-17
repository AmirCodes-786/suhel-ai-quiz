import React from 'react';
import { Zap, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

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
  const verifyUrl = `${window.location.origin}/verify/${certId}`;

  return (
    <div
      className={`relative w-full aspect-[1.414/1] bg-[#FCFCFA] text-slate-900 select-none overflow-hidden flex flex-col justify-between p-6 sm:p-10 md:p-12 ${className}`}
      style={{
        boxShadow: isPrint ? 'none' : '0 20px 50px -12px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(15, 23, 42, 0.05)'
      }}
    >
      {/* Outer Sophisticated Border */}
      <div className="absolute inset-3 sm:inset-4 md:inset-5 border-2 border-slate-900/90 pointer-events-none" />

      {/* Inner Fine Hairline Border */}
      <div className="absolute inset-4 sm:inset-5 md:inset-6 border border-slate-300 pointer-events-none" />

      {/* Corner Geometric Accents */}
      <div className="absolute top-4 sm:top-5 md:top-6 left-4 sm:left-5 md:left-6 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-indigo-900 pointer-events-none" />
      <div className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-indigo-900 pointer-events-none" />
      <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 left-4 sm:left-5 md:left-6 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-indigo-900 pointer-events-none" />
      <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 right-4 sm:right-5 md:right-6 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-indigo-900 pointer-events-none" />

      {/* Top Header: Brand & Title */}
      <div className="text-center space-y-1.5 pt-1 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <Zap className="w-3 h-3 fill-white text-white" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-slate-800 uppercase font-sans">
            QUIZFORGE AI
          </span>
        </div>

        <h1 className="text-lg sm:text-2xl md:text-3xl font-serif tracking-widest text-slate-900 uppercase font-bold">
          CERTIFICATE OF ACHIEVEMENT
        </h1>

        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="w-12 sm:w-16 h-px bg-slate-300" />
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans tracking-wider uppercase font-medium">
            Cognitive Assessment Credential
          </span>
          <div className="w-12 sm:w-16 h-px bg-slate-300" />
        </div>
      </div>

      {/* Middle Section: Recipient & Achievement */}
      <div className="text-center my-auto space-y-3 sm:space-y-4 py-2 relative z-10">
        <p className="text-xs sm:text-sm text-slate-600 font-sans tracking-wide italic">
          This certificate is proudly presented to
        </p>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            {recipientName}
          </div>
          <div className="w-24 sm:w-36 h-0.5 bg-indigo-900/70 mx-auto" />
        </div>

        <div className="space-y-1 max-w-xl mx-auto px-4">
          <p className="text-xs sm:text-sm text-slate-600 font-sans">
            for successfully completing
          </p>
          <div className="text-base sm:text-lg md:text-xl font-serif font-bold text-slate-900">
            {quizTitle}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-sans leading-relaxed max-w-md mx-auto pt-0.5">
            Demonstrating strong proficiency and successful completion of the assessed curriculum.
          </p>
        </div>
      </div>

      {/* Bottom Section: Score, Seal, Issuer & Verification */}
      <div className="pt-3 border-t border-slate-200/90 grid grid-cols-3 items-end gap-2 text-slate-700 font-sans text-xs relative z-10">
        {/* Left: Score & Date */}
        <div className="space-y-1 text-left">
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Final Score
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 font-serif">
              {score}%
            </span>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Issued
            </span>
            <span className="text-[10px] sm:text-xs text-slate-800 font-medium">
              {issueDateFormatted}
            </span>
          </div>
        </div>

        {/* Center: Official Certification Seal */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-amber-600/70 bg-amber-50/40 p-1 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-full h-full rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-amber-900">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 mb-0.5" />
              <span className="text-[6px] sm:text-[7px] font-bold tracking-widest uppercase">
                VERIFIED
              </span>
              <span className="text-[5px] sm:text-[6px] text-amber-800 uppercase tracking-tighter">
                QUIZFORGE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Signature & ID */}
        <div className="space-y-1.5 text-right">
          <div className="space-y-0.5">
            <div className="w-20 sm:w-28 h-px bg-slate-400 ml-auto" />
            <span className="text-[10px] sm:text-xs font-semibold text-slate-900 block font-serif">
              QuizForge AI
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 block">
              Authorized Issuer
            </span>
          </div>

          <div className="pt-0.5">
            <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase block">
              ID: {certId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
