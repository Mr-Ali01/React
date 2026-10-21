import React, { useState } from 'react';
import { PieChart } from 'lucide-react';

export default function GradeDistributionDonut({ distributionData }) {
  const [hoveredGrade, setHoveredGrade] = useState(null);

  if (!distributionData || !distributionData.distribution || distributionData.distribution.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 text-center text-xs text-text-light">
        No grade distribution data available.
      </div>
    );
  }

  const { distribution, totalSubjects, passRate } = distributionData;

  // SVG Donut Calculations
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = distribution.map((item) => {
    const fraction = totalSubjects > 0 ? item.count / totalSubjects : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += fraction * circumference;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between overflow-hidden">
      {/* Fully Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/80">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-text-h leading-tight">
              Grade Distribution
            </h3>
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              Breakdown of letter grades across all recorded course papers.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
            {passRate}% Pass Rate
          </span>
        </div>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 lg:gap-5 pt-4">
        {/* SVG Donut with fluid viewBox scaling */}
        <div className="relative shrink-0 flex items-center justify-center my-1">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-36 h-36 sm:w-40 sm:h-40 xl:w-44 xl:h-44 transform -rotate-90 overflow-visible"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-bg-sec"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {segments.map((seg) => {
              const isHovered = hoveredGrade === seg.grade;
              return (
                <circle
                  key={seg.grade}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredGrade(seg.grade)}
                  onMouseLeave={() => setHoveredGrade(null)}
                />
              );
            })}
          </svg>

          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-2">
            {hoveredGrade ? (
              (() => {
                const active = distribution.find((d) => d.grade === hoveredGrade);
                return (
                  <div className="animate-in fade-in duration-200">
                    <span className="text-xl sm:text-2xl font-black text-text-h block font-mono leading-none">
                      {active?.count}
                    </span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{
                        backgroundColor: `${active?.color}20`,
                        color: active?.color
                      }}
                    >
                      Grade {active?.grade}
                    </span>
                  </div>
                );
              })()
            ) : (
              <div>
                <span className="text-xl sm:text-2xl font-black text-text-h block font-mono leading-none">
                  {totalSubjects}
                </span>
                <span className="text-[10px] text-text-light font-bold uppercase tracking-wider block mt-1">
                  Total Papers
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend List - 1 column alongside donut prevents any text overlapping */}
        <div className="flex flex-col gap-1 sm:gap-1.5 w-full flex-1 min-w-0">
          {distribution.map((item) => (
            <div
              key={item.grade}
              onMouseEnter={() => setHoveredGrade(item.grade)}
              onMouseLeave={() => setHoveredGrade(null)}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                hoveredGrade === item.grade
                  ? 'bg-bg-sec border-border shadow-xs'
                  : 'border-transparent hover:bg-bg-sec/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-extrabold text-xs text-text-h font-mono">
                  {item.grade}
                </span>
                <span className="text-[10px] text-text-light truncate">
                  ({item.points} pts)
                </span>
              </div>

              <div className="font-mono text-right shrink-0 text-xs">
                <span className="font-bold text-text-h">{item.count}</span>
                <span className="text-[10px] text-text-light ml-1 font-sans">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
