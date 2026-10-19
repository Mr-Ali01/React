import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Info, Lightbulb } from 'lucide-react';

export default function AcademicGoalCard({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brandPink/15 text-brandPink flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Your Academic Goal</h3>
        </div>

        <Link
          to="/student/goals"
          className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <span>View Goal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Target Metric Triple Blocks */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        <div className="p-2.5 rounded-xl bg-bg border border-border/70 text-center">
          <span className="text-[10px] sm:text-[11px] font-semibold text-text-light block mb-1">
            Target CGPA
          </span>
          <span className="text-base sm:text-lg font-extrabold text-brandCyan">
            {metrics.targetCGPA}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-bg border border-border/70 text-center">
          <span className="text-[10px] sm:text-[11px] font-semibold text-text-light block mb-1">
            Current CGPA
          </span>
          <span className="text-base sm:text-lg font-extrabold text-text-h">
            {metrics.currentCGPA}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-bg border border-border/70 text-center">
          <span className="text-[10px] sm:text-[11px] font-semibold text-text-light block mb-1 flex items-center justify-center gap-0.5">
            <span>Req. Avg</span>
            <Info className="w-3 h-3 text-text-light" />
          </span>
          <span className="text-base sm:text-lg font-extrabold text-text-h">
            {metrics.requiredAverage}
          </span>
        </div>
      </div>

      {/* Goal Progress Bar */}
      <div className="space-y-1.5 my-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-h">Goal Progress</span>
          <span className="font-bold text-brandGreen">{metrics.progress}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.progress)}%` }}
          />
        </div>

        <p className="text-[11px] text-text-light">
          You're on the right track to achieve your target!
        </p>
      </div>

      {/* Academic Tip Box */}
      <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold text-amber-500 mr-1.5">Tip</span>
          <span className="text-text-m">{metrics.tip}</span>
        </div>
      </div>
    </div>
  );
}
