import React, { useState } from 'react';
import { TrendingUp, Target, Lightbulb } from 'lucide-react';

export default function ProjectedTrendAndTargets({ details, targetCGPA = 8.50 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!details) return null;

  const {
    historicalTrend = [],
    projectedTrend = [],
    recommendedSemesterTargets = [],
    personalizedTip = 'Focus on scoring higher in core and higher-credit subjects to reach your target CGPA more easily.'
  } = details;

  // Chart layout
  const width = 640;
  const height = 230;
  const padding = { top: 30, right: 35, bottom: 40, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minY = 6.0;
  const maxY = 10.0;
  const yRange = maxY - minY;

  // Combine historical and projected points for slot indexing
  const totalPointsCount = historicalTrend.length + projectedTrend.length;

  const getX = (index) => {
    if (totalPointsCount <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (totalPointsCount - 1)) * plotWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, Number(val) || 0));
    return padding.top + plotHeight - ((clamped - minY) / yRange) * plotHeight;
  };

  // Build coordinate arrays
  const actualPoints = historicalTrend.map((d, i) => ({
    x: getX(i),
    y: getY(d.actualCGPA),
    val: d.actualCGPA,
    sem: d.semesterLabel,
    isProjected: false
  }));

  const projectedPoints = [];
  if (actualPoints.length > 0 && projectedTrend.length > 0) {
    const lastActual = actualPoints[actualPoints.length - 1];
    projectedPoints.push({
      x: lastActual.x,
      y: lastActual.y,
      val: lastActual.val,
      sem: lastActual.sem,
      isProjected: false
    });

    projectedTrend.forEach((p, idx) => {
      const slotIndex = historicalTrend.length + idx;
      projectedPoints.push({
        x: getX(slotIndex),
        y: getY(p.projectedCGPA),
        val: p.projectedCGPA,
        sem: p.semesterLabel,
        subLabel: p.subLabel,
        targetSGPA: p.targetSGPA,
        isProjected: true
      });
    });
  }

  const createLinePath = (pts) => {
    if (!pts || pts.length === 0) return '';
    return pts.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  const ticks = [6, 7, 8, 9, 10];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Projected CGPA Trend Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Projected CGPA Trend</h3>
                  <p className="text-[11px] text-text-light">
                    Your current CGPA and projected CGPA based on different future SGPA values.
                  </p>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-[11px] self-start sm:self-center font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-text-m">Actual CGPA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-accent" />
                  <span className="text-accent">Projected CGPA (Target {targetCGPA.toFixed(2)})</span>
                </div>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="relative w-full pt-3 select-none">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Horizontal Grid lines */}
                {ticks.map((t) => {
                  const y = getY(t);
                  return (
                    <g key={t}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-border/60"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-text-light text-[11px] font-mono font-semibold"
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}

                {/* Actual CGPA Solid Line */}
                <path
                  d={createLinePath(actualPoints)}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Projected CGPA Dashed Line */}
                {projectedPoints.length > 1 && (
                  <path
                    d={createLinePath(projectedPoints)}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Historical Points & Labels */}
                {actualPoints.map((pt, i) => (
                  <g key={`act-${i}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#1E293B"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onMouseEnter={() => setHoveredPoint({ ...pt, color: '#3B82F6' })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className="fill-blue-400 text-[10px] font-bold font-mono"
                    >
                      {pt.val.toFixed(2)}
                    </text>
                    <text
                      x={pt.x}
                      y={height - padding.bottom + 20}
                      textAnchor="middle"
                      className="fill-text-light text-[11px] font-semibold"
                    >
                      {pt.sem}
                    </text>
                  </g>
                ))}

                {/* Projected Points & Labels */}
                {projectedPoints.slice(1).map((pt, i) => (
                  <g key={`proj-${i}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#1E293B"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onMouseEnter={() => setHoveredPoint({ ...pt, color: '#F97316' })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className="fill-accent text-[10px] font-bold font-mono"
                    >
                      {pt.val.toFixed(2)}
                    </text>
                    <text
                      x={pt.x}
                      y={height - padding.bottom + 16}
                      textAnchor="middle"
                      className="fill-accent text-[10px] font-bold"
                    >
                      {pt.sem}
                    </text>
                    <text
                      x={pt.x}
                      y={height - padding.bottom + 28}
                      textAnchor="middle"
                      className="fill-text-light text-[9px]"
                    >
                      (Projected)
                    </text>
                  </g>
                ))}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-lg bg-card border border-border shadow-xl text-xs space-y-0.5 transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(hoveredPoint.x / width) * 100}%`,
                    top: `${(hoveredPoint.y / height) * 100 - 4}%`
                  }}
                >
                  <span className="font-bold text-text-h block">{hoveredPoint.sem}</span>
                  <span className="font-mono font-bold" style={{ color: hoveredPoint.color }}>
                    CGPA: {hoveredPoint.val.toFixed(2)}
                  </span>
                  {hoveredPoint.targetSGPA && (
                    <span className="text-[10px] text-text-light block">
                      Target SGPA: ≥ {hoveredPoint.targetSGPA.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Recommended Semester Targets */}
        <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h">Recommended Semester Targets</h3>
                <p className="text-[11px] text-text-light">
                  Suggested SGPA targets to achieve your goal.
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="pt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-[10px] font-bold text-text-light uppercase tracking-wider">
                    <th className="pb-2">Semester</th>
                    <th className="pb-2">Remaining Credits (Est.)</th>
                    <th className="pb-2">Target SGPA</th>
                    <th className="pb-2 text-right">Projected CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {recommendedSemesterTargets.length > 0 ? (
                    recommendedSemesterTargets.map((item) => (
                      <tr key={item.semesterNumber} className="hover:bg-bg-sec/40">
                        <td className="py-2.5 font-bold text-text-h">{item.semester}</td>
                        <td className="py-2.5 text-text-light">{item.remainingCredits}</td>
                        <td className="py-2.5 font-bold text-amber-400">≥ {item.targetSGPA.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-extrabold text-purple-400">{item.projectedCGPA.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-text-light font-sans text-xs">
                        All curriculum semesters already completed!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/90 flex items-center gap-3 text-xs shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-extrabold text-orange-400 uppercase tracking-wider text-[11px]">
            Tip:
          </span>
          <span className="text-text-m text-[11px] sm:text-xs leading-relaxed">
            {personalizedTip}
          </span>
        </div>
      </div>
    </div>
  );
}
