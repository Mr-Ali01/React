import React from 'react';
import {
  UserCheck,
  BarChart2,
  Trophy,
  CheckCircle2,
  Target,
  MinusCircle,
  Hourglass,
  Layers
} from 'lucide-react';

export default function SubjectPriorityAndProgress({ details }) {
  if (!details) return null;

  const {
    currentCGPA = 8.14,
    targetCGPA = 8.50,
    cgpaGap = 0.36,
    semestersLeft = 2,
    remainingCredits = 64,
    goalProgress = 67,
    subjectPriorities = [],
    creditsImpactAnalysis = []
  } = details;

  // Donut chart calculations with optimized inner diameter so text never overlaps
  const size = 116;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(100, Math.max(0, goalProgress)) / 100;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Subject-Wise Priority: Takes full width on 1005px screens (lg) so table never scrolls or wraps, and 4 cols on large desktop (xl: 1280px+) */}
      <div className="col-span-12 xl:col-span-4 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/80">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-text-h truncate">Subject-Wise Priority</h3>
              <p className="text-[11px] text-text-light truncate">
                Focus on these subjects to improve your CGPA.
              </p>
            </div>
          </div>

          {/* Priority Table - Clean column widths with no text clipping */}
          <div className="pt-2 w-full overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead>
                <tr className="border-b border-border/70 text-[10px] font-bold text-text-light uppercase tracking-wider">
                  <th className="pb-1.5 w-[46%] sm:w-[48%] whitespace-nowrap">Subject</th>
                  <th className="pb-1.5 text-center w-[16%] whitespace-nowrap">Credits</th>
                  <th className="pb-1.5 text-center w-[16%] whitespace-nowrap">Grade</th>
                  <th className="pb-1.5 text-right w-[22%] sm:w-[20%] whitespace-nowrap">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {subjectPriorities.length > 0 ? (
                  subjectPriorities.map((sub, i) => (
                    <tr key={`${sub.name}-${i}`} className="hover:bg-bg-sec/40 transition-colors">
                      <td className="py-2 pr-1 font-bold text-text-h text-xs truncate" title={sub.name}>
                        {sub.name}
                      </td>
                      <td className="py-2 text-center text-text-light font-mono text-xs">
                        {sub.credits}
                      </td>
                      <td className="py-2 text-center font-mono font-bold text-text-h text-xs">
                        {sub.currentGrade}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap inline-block ${
                            sub.priority === 'High'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : sub.priority === 'Medium'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {sub.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-text-light text-xs">
                      No low-scoring subjects flagged! Excellent progress.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Credits Impact Analysis: 6 cols on 1005px (lg), 4 cols on large desktop (xl: 1280px+) */}
      <div className="col-span-12 sm:col-span-6 xl:col-span-4 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/80">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-text-h truncate">Credits Impact Analysis</h3>
              <p className="text-[11px] text-text-light truncate">
                Higher-credit subjects have a greater effect on CGPA.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="pt-2 w-full overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead>
                <tr className="border-b border-border/70 text-[10px] font-bold text-text-light uppercase tracking-wider">
                  <th className="pb-1.5 w-[42%] whitespace-nowrap">Credit Range</th>
                  <th className="pb-1.5 text-center w-[26%] whitespace-nowrap">Subjects</th>
                  <th className="pb-1.5 text-right w-[32%] whitespace-nowrap">Impact on CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {creditsImpactAnalysis.map((item) => (
                  <tr key={item.range} className="hover:bg-bg-sec/40 transition-colors">
                    <td className="py-2 font-bold text-text-h text-xs whitespace-nowrap">
                      {item.range}
                    </td>
                    <td className="py-2 text-center text-text-light font-mono font-bold text-xs">
                      {item.subjects}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap inline-block ${
                          item.impact === 'High'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : item.impact === 'Medium'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {item.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Your Goal Progress: 6 cols on 1005px (lg), 4 cols on large desktop (xl: 1280px+) */}
      <div className="col-span-12 sm:col-span-6 xl:col-span-4 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/80">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-text-h truncate">Your Goal Progress</h3>
              <p className="text-[11px] text-text-light truncate">
                Track your progress towards your target CGPA.
              </p>
            </div>
          </div>

          {/* Donut Chart + Stats List */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* SVG Donut - text sized and placed with ample clearance */}
            <div className="relative shrink-0 flex items-center justify-center my-1">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-bg-sec"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#F97316"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-1">
                <span className="text-xl sm:text-2xl font-black text-text-h font-mono leading-none">
                  {goalProgress}%
                </span>
                <span className="text-[8px] sm:text-[9px] text-text-light font-bold uppercase tracking-wide block mt-1 leading-tight">
                  Goal Progress
                </span>
              </div>
            </div>

            {/* Stats Breakdown List - clean spacing and alignment */}
            <div className="space-y-1.5 w-full flex-1 min-w-0 text-xs font-medium">
              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <div className="flex items-center gap-1.5 text-text-light min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Current CGPA</span>
                </div>
                <span className="font-mono font-bold text-text-h shrink-0 text-right">
                  {Number(currentCGPA).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <div className="flex items-center gap-1.5 text-text-light min-w-0">
                  <Target className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">Target CGPA</span>
                </div>
                <span className="font-mono font-bold text-accent shrink-0 text-right">
                  {Number(targetCGPA).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <div className="flex items-center gap-1.5 text-text-light min-w-0">
                  <MinusCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">CGPA Gap</span>
                </div>
                <span className="font-mono font-bold text-blue-400 shrink-0 text-right">
                  {cgpaGap.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <div className="flex items-center gap-1.5 text-text-light min-w-0">
                  <Hourglass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Semesters Left</span>
                </div>
                <span className="font-mono font-bold text-purple-400 shrink-0 text-right">
                  {semestersLeft}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 gap-2">
                <div className="flex items-center gap-1.5 text-text-light min-w-0">
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Remaining Credits</span>
                </div>
                <span className="font-mono font-bold text-amber-400 shrink-0 text-right">
                  {remainingCredits}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
