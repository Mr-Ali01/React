import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, ChevronRight, ArrowRight } from 'lucide-react';

const BADGE_COLORS = {
  4: 'bg-purple-500/20 text-brandPurple border border-purple-500/30',
  3: 'bg-blue-500/20 text-brandBlue border border-blue-500/30',
  2: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/30',
  1: 'bg-amber-500/20 text-brandAmber border border-amber-500/30'
};

export default function RecentResults({ results = [] }) {
  // Sort descending by semesterNumber (S4, S3, S2, S1)
  const recent = [...results].sort((a, b) => b.semesterNumber - a.semesterNumber).slice(0, 4);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-brandBlue flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Recent Results</h3>
        </div>

        <Link
          to="/student/results"
          className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Results Rows */}
      <div className="divide-y divide-border/60 my-2">
        {recent.map((r) => {
          const badgeStyle = BADGE_COLORS[r.semesterNumber] || BADGE_COLORS[1];

          return (
            <Link
              key={r.id}
              to={`/student/results?sem=${r.semesterNumber}`}
              className="group flex items-center justify-between py-3 px-2 rounded-xl hover:bg-bg-sec/70 transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Semester S1-S4 Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}
                >
                  S{r.semesterNumber}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-text-h group-hover:text-accent transition-colors">
                    {r.semesterTitle}
                  </h4>
                  <p className="text-[11px] text-text-light">{r.academicPeriod}</p>
                </div>
              </div>

              {/* SGPA Pill & Chevron */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-brandGreen flex items-center gap-1">
                  <span className="text-[10px] text-text-light font-normal">SGPA</span>
                  <span>{r.sgpa.toFixed(2)}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {recent.length === 0 && (
        <div className="text-center py-6 text-xs text-text-light">
          No semester results recorded yet.
        </div>
      )}
    </div>
  );
}
