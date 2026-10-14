import React from 'react';
import { Bookmark, Lightbulb, TrendingUp } from 'lucide-react';

export default function ResultDisplay({ metrics, onOpenSaveModal }) {
  const { totalCredits, totalPoints, cgpa, percentage, letterGrade } = metrics;
  const circumference = 2 * Math.PI * 64; // 402.12
  const fraction = Math.max(0, Math.min(1, cgpa / 10));
  const strokeDashoffset = circumference - fraction * circumference;

  let standing = { icon: '🏆', text: 'Excellent', narrative: 'You are doing great! Keep it up and maintain your performance.', tips: 'Focus on consistency and try to score more A grades in core subjects.' };

  if (cgpa < 6.0) {
    standing = { icon: '⚠️', text: 'Needs Improvement', narrative: 'Prioritize fundamentals and consult professors to convert lower credit grades.', tips: 'Meet academic mentors to clarify complex subjects before final examinations.' };
  } else if (cgpa < 7.5) {
    standing = { icon: '📈', text: 'Keep Improving', narrative: 'Consistent effort in upcoming semesters will bring your cumulative average higher.', tips: 'Allocate targeted revision hours toward core analytical and mathematical papers.' };
  } else if (cgpa < 8.5) {
    standing = { icon: '✨', text: 'Good Performance', narrative: 'Solid results! A slight push in high-credit papers can unlock distinction.', tips: 'Focus on laboratory components and internal assessments for extra point gains.' };
  }

  return (
    <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20">
      <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-5 shadow-orange text-center relative overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
          Your CGPA Result
        </h3>

        {/* Circular SVG Gauge */}
        <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="64" fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="12" />
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="transparent"
              stroke="#FFFFFF"
              strokeWidth="12"
              strokeLinecap="round"
              className="progress-ring-circle"
              strokeDasharray="402.12"
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {cgpa.toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold text-white/80">out of 10</span>
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            <span>{standing.icon}</span>
            <span>{standing.text}</span>
          </span>
        </div>

        <p className="text-[11px] text-white/90 leading-relaxed px-1">
          {standing.narrative}
        </p>

        {/* Breakdown Card */}
        <div className="mt-3.5 p-3 rounded-xl bg-card text-text-primary border border-white/20 space-y-1.5 text-xs text-left shadow-sm">
          <div className="flex items-center justify-between text-text-secondary text-[11px]">
            <span>Total Credits</span>
            <span className="font-bold text-text-primary">{totalCredits}</span>
          </div>
          <div className="flex items-center justify-between text-text-secondary text-[11px]">
            <span>Total Grade Points</span>
            <span className="font-bold text-text-primary">{Math.round(totalPoints)}</span>
          </div>
          <div className="flex items-center justify-between text-text-secondary text-[11px]">
            <span>CGPA</span>
            <span className="font-extrabold text-accent">{cgpa.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-text-secondary text-[11px]">
            <span>Percentage Equivalent</span>
            <span className="font-bold text-text-primary">{percentage.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between text-text-secondary text-[11px]">
            <span>Letter Grade</span>
            <span className="font-bold text-text-primary">{letterGrade}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSaveModal}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-white text-accent hover:bg-white/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save Result</span>
        </button>
      </div>

      {/* Semester History */}
      <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">Semester History</h4>
          <button type="button" className="text-[11px] font-semibold text-accent hover:underline">View All</button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-xl bg-accent-soft/50 border border-accent/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-accent block text-xs">Semester 4</span>
              <span className="text-[10px] text-text-secondary">24 Credits</span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-text-primary block text-xs">{cgpa.toFixed(2)}</span>
              <span className="text-[9px] font-semibold text-accent uppercase tracking-wider">Current</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-surface border border-border flex items-center justify-between">
            <div>
              <span className="font-bold text-text-primary block text-xs">Semester 3</span>
              <span className="text-[10px] text-text-secondary">24 Credits</span>
            </div>
            <div className="text-right flex items-center gap-1">
              <span className="font-extrabold text-text-primary text-xs">7.92</span>
              <span className="text-emerald-500 font-bold text-xs">↑</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-surface border border-border flex items-center justify-between">
            <div>
              <span className="font-bold text-text-primary block text-xs">Semester 2</span>
              <span className="text-[10px] text-text-secondary">24 Credits</span>
            </div>
            <div className="text-right flex items-center gap-1">
              <span className="font-extrabold text-text-primary text-xs">7.35</span>
              <span className="text-emerald-500 font-bold text-xs">↑</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-surface border border-border flex items-center justify-between">
            <div>
              <span className="font-bold text-text-primary block text-xs">Semester 1</span>
              <span className="text-[10px] text-text-secondary">24 Credits</span>
            </div>
            <div className="text-right flex items-center gap-1">
              <span className="font-extrabold text-text-primary text-xs">7.10</span>
              <span className="text-emerald-500 font-bold text-xs">↑</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-accent flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-text-primary block">Tips to Improve</span>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
            {standing.tips}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-text-primary block">Keep it up!</span>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
            Your CGPA is improving consistently.
          </p>
        </div>
      </div>
    </aside>
  );
}