import React from 'react';
import {
  TrendingUp,
  Sparkles,
  Layers,
  BookOpen,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function PerformanceOverviewCards({ overview }) {
  if (!overview) return null;

  const {
    currentCGPA = 0,
    latestSGPA = 0,
    sgpaDiff = 0,
    isDiffPositive = true,
    completedSemesters = 0,
    totalSemesters = 6,
    semestersRemaining = 2,
    totalCreditsEarned = 0,
    totalDegreeCredits = 150,
    creditsRemaining = 64,
    creditsPercentage = 0,
    requiredAvgForDistinction = 0,
    standingBadge = 'Good',
    standingColor = 'blue'
  } = overview;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Current CGPA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            {standingBadge}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Current CGPA
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h">
              {Number(currentCGPA).toFixed(2)}
            </span>
            <span className="text-xs text-text-light">/ 10.0</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            Based on {completedSemesters} semester{completedSemesters !== 1 ? 's' : ''} • {totalCreditsEarned} credits
          </p>
        </div>
      </div>

      {/* 2. Latest SGPA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          {completedSemesters >= 2 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 border ${
                isDiffPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
              }`}
            >
              {isDiffPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{isDiffPositive ? `+${sgpaDiff}` : sgpaDiff}</span>
            </span>
          )}
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Latest SGPA
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-accent">
              {Number(latestSGPA).toFixed(2)}
            </span>
            <span className="text-xs text-text-light">Sem {completedSemesters}</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            {completedSemesters > 1 ? `vs previous semester SGPA` : `First semester benchmark`}
          </p>
        </div>
      </div>

      {/* 3. Completed Semesters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-brandPurple/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
            {semestersRemaining} Left
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Semesters
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h">
              {completedSemesters}
            </span>
            <span className="text-xs text-text-light">/ {totalSemesters}</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            Out of {totalSemesters} curriculum semesters
          </p>
        </div>
      </div>

      {/* 4. Credits Earned */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-blue-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {creditsPercentage}%
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Credits Earned
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h">
              {totalCreditsEarned}
            </span>
            <span className="text-xs text-text-light">/ {totalDegreeCredits}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-bg-sec mt-2 overflow-hidden border border-border/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, creditsPercentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-text-light mt-1">
            {creditsRemaining} credits remaining
          </p>
        </div>
      </div>

      {/* 5. Required Remaining Avg */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-amber-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            {requiredAvgForDistinction <= 8.5
              ? 'Achievable'
              : requiredAvgForDistinction <= 9.5
              ? 'Challenging'
              : 'Distinction'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Remaining Avg (8.50 Goal)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {requiredAvgForDistinction > 0 ? requiredAvgForDistinction.toFixed(2) : 'Done'}
            </span>
            <span className="text-xs text-text-light">SGPA</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            {creditsRemaining > 0
              ? `Need avg ${requiredAvgForDistinction.toFixed(2)} in remaining ${creditsRemaining} credits`
              : 'Curriculum requirements fulfilled'}
          </p>
        </div>
      </div>
    </div>
  );
}
