import React from 'react';

/**
 * ResultStatusBadge Component
 * Renders status pills (Excellent, Very Good, Good, Failed) matching ResultPoint's design system
 */
export default function ResultStatusBadge({ status, semesterNumber }) {
  const normalized = (status || '').toLowerCase().trim();

  // If status is "very good", match subtle tint nuance (Row 2 is warm amber, Row 3 is fresh teal/green)
  if (normalized.includes('very good')) {
    if (semesterNumber === 3) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300">
          Very Good
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#CCFBF1] dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-300">
        Very Good
      </span>
    );
  }

  if (normalized.includes('excellent')) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] dark:bg-emerald-950/50 text-[#15803D] dark:text-emerald-300">
        Excellent
      </span>
    );
  }

  if (normalized.includes('good')) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DBEAFE] dark:bg-blue-950/50 text-[#1D4ED8] dark:text-blue-300">
        Good
      </span>
    );
  }

  if (normalized.includes('fail') || normalized.includes('backlog')) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFE4E6] dark:bg-rose-950/50 text-[#E11D48] dark:text-rose-300">
        Failed
      </span>
    );
  }

  // Default fallback
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
      {status || 'Passed'}
    </span>
  );
}
