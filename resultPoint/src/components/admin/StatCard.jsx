import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  growth,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-500',
  isPositive = true
}) {
  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs hover:shadow-subtle transition-all flex items-center gap-3.5">
      {/* Colored Left Icon */}
      <div className={`w-12 h-12 rounded-2xl ${iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
          {title}
        </span>

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>

          <span
            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {growth}
          </span>
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
