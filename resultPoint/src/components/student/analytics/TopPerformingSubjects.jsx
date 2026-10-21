import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

export default function TopPerformingSubjects({ subjects = [] }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 text-center text-xs text-text-light">
        No high-scoring subjects recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      {/* Fully Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/80">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-text-h leading-tight">
              Top Performing Subjects
            </h3>
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              Highest scoring subjects with distinction grade points.
            </p>
          </div>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 whitespace-nowrap">
            Leaderboard
          </span>
        </div>
      </div>

      {/* Ranked List */}
      <div className="divide-y divide-border/60 pt-2">
        {subjects.map((sub, idx) => (
          <div
            key={`${sub.code}-${sub.semesterNumber}-${idx}`}
            className="py-2.5 flex items-center justify-between gap-3 hover:bg-bg-sec/40 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Rank Badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                  idx === 0
                    ? 'bg-amber-500 text-white shadow-amber-500/30 shadow-xs'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-800'
                    : idx === 2
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-bg-sec text-text-light'
                }`}
              >
                {idx + 1}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-text-h truncate">
                    {sub.name}
                  </span>
                  <span className="text-[10px] font-semibold text-text-light px-1.5 py-0.2 rounded bg-bg-sec uppercase">
                    {sub.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-light mt-0.5">
                  <span>Semester {sub.semesterNumber}</span>
                  <span>•</span>
                  <span>{sub.credits} Credits</span>
                </div>
              </div>
            </div>

            {/* Grade & Points Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {sub.grade}
              </span>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 block font-mono">
                  {sub.points.toFixed(1)} pts
                </span>
                <span className="text-[9px] text-text-light">
                  Grade Point
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
