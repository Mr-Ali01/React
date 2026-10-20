import React from 'react';
import { Compass, Quote } from 'lucide-react';

export default function AdminWelcomeBanner() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main Welcome Card (~75% width) */}
      <div className="lg:col-span-9 relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-orange-100/60 dark:from-[#1b1510] dark:via-[#191817] dark:to-[#221710] border border-orange-200/70 dark:border-orange-950/40 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Subtle decorative background ambient glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-300/10 via-amber-200/5 to-transparent pointer-events-none rounded-2xl" />

        {/* Left Side: Welcome Text */}
        <div className="relative z-10 flex items-start gap-3.5 max-w-lg">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, Admin! <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Here's an overview of your platform's activity and data.
            </p>
          </div>
        </div>

        {/* Center/Right Side: Academic Administration Illustration */}
        <div className="relative z-10 flex items-center gap-4 self-center md:self-auto shrink-0">
          <div className="flex items-center gap-3">
            {/* SVG Illustration of Laptop, Graduation Cap & Books matching reference image */}
            <svg
              width="180"
              height="80"
              viewBox="0 0 200 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xs"
            >
              {/* Laptop Screen & Base */}
              <rect x="15" y="14" width="70" height="46" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="2" />
              <rect x="18" y="17" width="64" height="40" rx="2" fill="#1E293B" />
              {/* Mini dashboard UI on laptop */}
              <rect x="22" y="21" width="16" height="12" rx="1.5" fill="#FF6B00" />
              <rect x="42" y="21" width="36" height="12" rx="1.5" fill="#3B82F6" />
              <line x1="22" y1="40" x2="74" y2="40" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M 22 50 Q 35 44 48 48 T 74 42" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
              <rect x="28" y="52" width="6" height="2" rx="1" fill="#94A3B8" />
              {/* Laptop Keyboard Base */}
              <path d="M 8 60 L 92 60 L 86 64 L 14 64 Z" fill="#475569" stroke="#334155" strokeWidth="1" />
              <rect x="42" y="61" width="16" height="2" rx="1" fill="#94A3B8" />

              {/* Stack of Academic Books */}
              {/* Bottom Book (Navy) */}
              <rect x="95" y="52" width="55" height="10" rx="2" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
              <rect x="95" y="54" width="4" height="6" fill="#F59E0B" />
              {/* Middle Book (Orange) */}
              <rect x="98" y="44" width="50" height="9" rx="2" fill="#EA580C" stroke="#C2410C" strokeWidth="1" />
              {/* Top Book (Blue) */}
              <rect x="100" y="36" width="46" height="9" rx="2" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />

              {/* Graduation Cap (Mortarboard) */}
              <path d="M 123 20 L 148 29 L 123 38 L 98 29 Z" fill="#0B132B" stroke="#1E293B" strokeWidth="1.5" />
              <ellipse cx="123" cy="30" rx="14" ry="4" fill="#0F172A" />
              {/* Cap Tassel */}
              <circle cx="123" cy="29" r="2" fill="#F59E0B" />
              <path d="M 124 30 Q 138 34 142 42" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="141" y="42" width="2" height="6" fill="#F59E0B" />

              {/* Sparkles / Ambient Accents */}
              <circle cx="90" cy="18" r="1.5" fill="#FF6B00" />
              <circle cx="160" cy="22" r="2" fill="#FF6B00" />
              <circle cx="155" cy="54" r="1.5" fill="#3B82F6" />
            </svg>

            {/* Script Text: Manage. Configure. Empower! */}
            <div className="hidden sm:block text-right pr-2">
              <span className="text-sm md:text-base font-serif italic font-extrabold text-slate-800 dark:text-slate-200 block leading-tight tracking-tight">
                Manage.<br />Configure.<br /><span className="text-[#FF6B00]">Empower!</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Supporting Card (~25% width) */}
      <div className="lg:col-span-3 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <Quote className="w-6 h-6 text-[#FF6B00] stroke-[2.2] mb-2 opacity-80" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic">
          “Empowering students with accurate academic tools.”
        </p>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block text-right mt-3">
          — ResultPoint
        </span>
      </div>
    </div>
  );
}
