import React from 'react';
import {
  TrendingUp,
  Target,
  Hourglass,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

export default function GoalOverviewCards({ details }) {
  if (!details) return null;

  const {
    currentCGPA = 0,
    targetCGPA = 8.50,
    currentStanding = 'Very Good',
    targetClassification = 'Distinction',
    semestersCompleted = 0,
    semestersLeft = 0,
    totalSemesters = 6,
    completedCredits = 0,
    totalDegreeCredits = 150,
    remainingCredits = 0,
    creditsPercentage = 0,
    requiredAverage = 0,
    feasibilityBadge = 'Achievable',
    feasibilityBadgeColor = 'emerald'
  } = details;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Current CGPA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            {currentStanding}
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
            Based on {semestersCompleted} semesters • {completedCredits} credits
          </p>
        </div>
      </div>

      {/* 2. Target CGPA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/20">
            {targetClassification}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Target CGPA
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-accent">
              {Number(targetCGPA).toFixed(2)}
            </span>
            <span className="text-xs text-text-light">Goal</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            Your graduation goal
          </p>
        </div>
      </div>

      {/* 3. Semesters Left */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-purple-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Hourglass className="w-5 h-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
            {semestersLeft} Left
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Semesters Left
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h">
              {semestersLeft}
            </span>
            <span className="text-xs text-text-light">remaining</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            Out of {totalSemesters} semesters
          </p>
        </div>
      </div>

      {/* 4. Credits Completed */}
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
            Credits Completed
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h">
              {completedCredits}
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
            {remainingCredits} credits remaining
          </p>
        </div>
      </div>

      {/* 5. Required Remaining Avg */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-amber-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              feasibilityBadgeColor === 'emerald'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : feasibilityBadgeColor === 'amber'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                : feasibilityBadgeColor === 'purple'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
            }`}
          >
            {feasibilityBadge}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
            Required Remaining Avg
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {requiredAverage > 0 ? requiredAverage.toFixed(2) : 'Done'}
            </span>
            <span className="text-xs text-text-light">SGPA</span>
          </div>
          <p className="text-[11px] text-text-light mt-1">
            {remainingCredits > 0
              ? `Need average ${requiredAverage.toFixed(2)} in remaining credits`
              : 'All degree credits fulfilled'}
          </p>
        </div>
      </div>
    </div>
  );
}
