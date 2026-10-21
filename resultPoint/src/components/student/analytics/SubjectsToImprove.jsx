import React from 'react';
import { AlertTriangle, ArrowUpCircle } from 'lucide-react';

export default function SubjectsToImprove({ subjects = [] }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 text-center text-xs text-text-light flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
          <ArrowUpCircle className="w-4 h-4" />
        </div>
        <span className="font-bold text-text-h">No Low-Performing Subjects Found!</span>
        <span className="text-[11px] text-text-light">
          All registered course subjects maintain solid academic standings with no arrears or grade deficits.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Fully Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/80">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-text-h leading-tight">
              Subjects to Improve
            </h3>
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              Focus on these subjects to maximize overall CGPA recovery.
            </p>
          </div>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 whitespace-nowrap">
            Priority Matrix
          </span>
        </div>
      </div>

      {/* Table / List */}
      <div className="divide-y divide-border/60 pt-2">
        {subjects.map((sub, idx) => {
          const isHigh = sub.priority === 'High';
          const isFail = sub.isFail;

          return (
            <div
              key={`${sub.code}-${sub.semesterNumber}-${idx}`}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-bg-sec/40 px-2 rounded-xl transition-colors"
            >
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
                  {sub.credits >= 4 && (
                    <span className="text-amber-400 font-semibold">• High Impact</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Current Grade */}
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-extrabold border ${
                      isFail
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {sub.grade}
                  </span>
                  <span className="block text-[9px] text-text-light mt-0.5 font-mono">
                    {sub.points} pts
                  </span>
                </div>

                {/* Priority Badge */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isHigh
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                  }`}
                >
                  {sub.priority}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip Banner */}
      <div className="mt-3 p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-[11px] text-text-light flex items-center gap-2">
        <ArrowUpCircle className="w-4 h-4 text-accent shrink-0" />
        <span>Improving a 4-credit course from C (5 pts) to A (8 pts) increases your overall CGPA by up to +0.08 points.</span>
      </div>
    </div>
  );
}
