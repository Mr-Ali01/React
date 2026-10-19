import React from 'react';
import {
  GraduationCap,
  BookOpen,
  BarChart2,
  Layers,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function StatCard({ type, data }) {
  if (type === 'cgpa') {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle hover:border-accent/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              Current CGPA
            </span>
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-brandGreen tracking-tight">
              {data.currentCGPA}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-text-light">
              / {data.cgpaScale}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-brandGreen">
            {data.performanceBadge}
          </span>
          <span className="text-[11px] font-medium text-text-light flex items-center gap-0.5">
            <span className="text-brandGreen font-bold">↑</span>
            {data.diffText}
          </span>
        </div>
      </div>
    );
  }

  if (type === 'credits') {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle hover:border-accent/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              Total Credits
            </span>
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
                {data.totalCredits}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-text-light">
                / {data.degreeCredits}
              </span>
            </div>
            <span className="text-xs font-bold text-brandBlue">
              {data.creditsPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-border mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, data.creditsPercentage)}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] font-medium text-text-light">
          {data.creditsRemaining} credits remaining
        </div>
      </div>
    );
  }

  if (type === 'semesters') {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle hover:border-accent/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              Semesters Completed
            </span>
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
                {data.semestersCompleted}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-text-light">
                / {data.totalSemesters}
              </span>
            </div>
            <span className="text-xs font-bold text-brandPurple">
              {data.semestersPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-border mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.min(100, data.semestersPercentage)}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] font-medium text-text-light">
          {data.semestersRemaining} semesters remaining
        </div>
      </div>
    );
  }

  if (type === 'backlogs') {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle hover:border-accent/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-brandAmber flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              Backlogs
            </span>
          </div>
        </div>

        <div className="my-3 flex items-center justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
            {data.backlogs}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-brandGreen">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{data.backlogStatus}</span>
          </span>
        </div>

        <div className="text-[11px] font-medium text-text-light">
          Keep it up!
        </div>
      </div>
    );
  }

  return null;
}
