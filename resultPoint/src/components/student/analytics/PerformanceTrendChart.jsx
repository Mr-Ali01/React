import React, { useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';

export default function PerformanceTrendChart({
  trends = [],
  projectedTargets = [],
  metricMode = 'both', // 'both' | 'sgpa' | 'cgpa'
  rangeFilter = 'all', // 'all' | '4' | '2'
  onMetricModeChange,
  onRangeFilterChange
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Apply range filter
  let displayTrends = [...trends];
  if (rangeFilter === '2') {
    displayTrends = trends.slice(-2);
  } else if (rangeFilter === '4') {
    displayTrends = trends.slice(-4);
  }

  // Combine actual trends with projected targets if available
  const hasProjections = projectedTargets && projectedTargets.length > 0;

  // Chart dimensions & coordinates
  const width = 760;
  const height = 300;
  const padding = { top: 35, right: 40, bottom: 45, left: 50 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Dynamic Y-axis calculation: ensure min accommodates any lower grades, max 10.0
  const allValues = [
    ...displayTrends.map((t) => t.sgpa),
    ...displayTrends.map((t) => t.cgpa),
    ...(hasProjections ? projectedTargets.map((p) => p.projectedCGPA) : [])
  ].filter((v) => typeof v === 'number' && !isNaN(v));

  const minVal = allValues.length > 0 ? Math.min(...allValues) : 7.0;
  const minY = Math.max(0, Math.floor(minVal - 1));
  const maxY = 10.0;
  const yRange = maxY - minY || 1;

  // Compute total horizontal slots
  const totalSlots = displayTrends.length + (hasProjections ? projectedTargets.length : 0);

  const getX = (index) => {
    if (totalSlots <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (totalSlots - 1)) * plotWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, Number(val) || 0));
    return padding.top + plotHeight - ((clamped - minY) / yRange) * plotHeight;
  };

  // Build points for actual results
  const actualSgpaPoints = displayTrends.map((d, i) => ({
    x: getX(i),
    y: getY(d.sgpa),
    val: d.sgpa,
    sem: d.semesterTitle || `Sem ${d.semesterNumber}`,
    period: d.academicPeriod,
    credits: d.creditsEarned || d.totalCredits,
    isProjected: false
  }));

  const actualCgpaPoints = displayTrends.map((d, i) => ({
    x: getX(i),
    y: getY(d.cgpa),
    val: d.cgpa,
    sem: d.semesterTitle || `Sem ${d.semesterNumber}`,
    period: d.academicPeriod,
    credits: d.creditsEarned || d.totalCredits,
    isProjected: false
  }));

  // Build projected points starting from the last actual CGPA point
  const projectedCgpaPoints = [];
  if (hasProjections && actualCgpaPoints.length > 0) {
    const lastActual = actualCgpaPoints[actualCgpaPoints.length - 1];
    projectedCgpaPoints.push({
      x: lastActual.x,
      y: lastActual.y,
      val: lastActual.val,
      sem: lastActual.sem,
      isProjected: false
    });

    projectedTargets.forEach((p, idx) => {
      const slotIndex = displayTrends.length + idx;
      projectedCgpaPoints.push({
        x: getX(slotIndex),
        y: getY(p.projectedCGPA),
        val: p.projectedCGPA,
        sem: `Sem ${p.semesterNumber} (Projected)`,
        targetSGPA: p.targetSGPA,
        credits: p.remainingCredits,
        isProjected: true
      });
    });
  }

  // Path generator helper
  const createLinePath = (pts) => {
    if (!pts || pts.length === 0) return '';
    return pts.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  const createAreaPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    const line = createLinePath(pts);
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const bottomY = padding.top + plotHeight;
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Generate grid ticks
  const ticks = [];
  const tickCount = Math.min(6, Math.round(maxY - minY));
  for (let i = 0; i <= tickCount; i++) {
    const val = minY + (i / tickCount) * yRange;
    ticks.push({
      val: Number(val.toFixed(1)),
      y: getY(val)
    });
  }

  const showSgpa = metricMode === 'both' || metricMode === 'sgpa';
  const showCgpa = metricMode === 'both' || metricMode === 'cgpa';

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header with Title and Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h flex items-center gap-2">
              <span>Semester-wise Performance Trend</span>
              {hasProjections && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-semibold">
                  Trajectory Projected
                </span>
              )}
            </h3>
            <p className="text-[11px] text-text-light">
              Interactive progression comparing semester SGPA with cumulative degree CGPA.
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Metric View Mode Toggle */}
          <div className="flex rounded-xl bg-bg border border-border p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onMetricModeChange && onMetricModeChange('both')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'both'
                  ? 'bg-accent text-white shadow-2xs font-bold'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => onMetricModeChange && onMetricModeChange('sgpa')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'sgpa'
                  ? 'bg-blue-500 text-white shadow-2xs font-bold'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              SGPA
            </button>
            <button
              type="button"
              onClick={() => onMetricModeChange && onMetricModeChange('cgpa')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'cgpa'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              CGPA
            </button>
          </div>

          {/* Range Filter */}
          <select
            value={rangeFilter}
            onChange={(e) => onRangeFilterChange && onRangeFilterChange(e.target.value)}
            className="calc-input px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Semesters</option>
            <option value="4">Last 4 Semesters</option>
            <option value="2">Last 2 Semesters</option>
          </select>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full pt-4 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradients for Line Fills */}
            <linearGradient id="sgpaAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="cgpaAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>

            <filter id="glowSgpa" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.5" />
            </filter>

            <filter id="glowCgpa" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F97316" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Grid Lines & Y-axis Labels */}
          {ticks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="currentColor"
                className="text-border/60"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-text-light text-[11px] font-semibold font-mono"
              >
                {tick.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area Fills */}
          {showSgpa && (
            <path
              d={createAreaPath(actualSgpaPoints)}
              fill="url(#sgpaAreaGrad)"
            />
          )}

          {showCgpa && (
            <path
              d={createAreaPath(actualCgpaPoints)}
              fill="url(#cgpaAreaGrad)"
            />
          )}

          {/* SGPA Line */}
          {showSgpa && (
            <path
              d={createLinePath(actualSgpaPoints)}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowSgpa)"
            />
          )}

          {/* Actual CGPA Line */}
          {showCgpa && (
            <path
              d={createLinePath(actualCgpaPoints)}
              fill="none"
              stroke="#F97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowCgpa)"
            />
          )}

          {/* Projected CGPA Line (Dotted Extension) */}
          {showCgpa && hasProjections && projectedCgpaPoints.length > 1 && (
            <path
              d={createLinePath(projectedCgpaPoints)}
              fill="none"
              stroke="#F97316"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}

          {/* X-axis Semester Labels */}
          {displayTrends.map((d, i) => (
            <text
              key={d.semesterNumber}
              x={getX(i)}
              y={height - padding.bottom + 22}
              textAnchor="middle"
              className="fill-text-light text-[11px] font-semibold"
            >
              Sem {d.semesterNumber}
            </text>
          ))}

          {/* Projected X-axis Labels */}
          {hasProjections &&
            projectedTargets.map((p, idx) => (
              <text
                key={`proj-${p.semesterNumber}`}
                x={getX(displayTrends.length + idx)}
                y={height - padding.bottom + 22}
                textAnchor="middle"
                className="fill-accent text-[11px] font-bold"
              >
                Sem {p.semesterNumber} (Proj)
              </text>
            ))}

          {/* SGPA Interactive Circles */}
          {showSgpa &&
            actualSgpaPoints.map((pt, i) => (
              <g key={`sgpa-pt-${i}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#1E293B"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: pt.x,
                      y: pt.y,
                      type: 'SGPA',
                      value: pt.val,
                      title: pt.sem,
                      period: pt.period,
                      credits: pt.credits,
                      color: '#3B82F6'
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-blue-400 text-[10px] font-bold select-none"
                >
                  {pt.val.toFixed(2)}
                </text>
              </g>
            ))}

          {/* Actual CGPA Interactive Circles */}
          {showCgpa &&
            actualCgpaPoints.map((pt, i) => (
              <g key={`cgpa-pt-${i}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#1E293B"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: pt.x,
                      y: pt.y,
                      type: 'CGPA',
                      value: pt.val,
                      title: pt.sem,
                      period: pt.period,
                      credits: pt.credits,
                      color: '#F97316'
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Avoid label overlap if SGPA is close */}
                {(!showSgpa || Math.abs(pt.val - actualSgpaPoints[i]?.val) > 0.2) && (
                  <text
                    x={pt.x}
                    y={pt.y + 16}
                    textAnchor="middle"
                    className="fill-amber-400 text-[10px] font-bold select-none"
                  >
                    {pt.val.toFixed(2)}
                  </text>
                )}
              </g>
            ))}

          {/* Projected Points Circles */}
          {showCgpa &&
            hasProjections &&
            projectedCgpaPoints.slice(1).map((pt, i) => (
              <g key={`proj-pt-${i}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#1E293B"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: pt.x,
                      y: pt.y,
                      type: 'Projected CGPA',
                      value: pt.val,
                      title: pt.sem,
                      subtitle: `Target SGPA: ≥ ${pt.targetSGPA}`,
                      credits: `${pt.credits} credits`,
                      color: '#F97316'
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-amber-400 text-[10px] font-bold select-none"
                >
                  {pt.val.toFixed(2)}
                </text>
              </g>
            ))}
        </svg>

        {/* Floating Tooltip Box */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-card border border-border shadow-2xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 4}%`
            }}
          >
            <div className="font-bold text-text-h flex items-center justify-between gap-3">
              <span>{hoveredPoint.title}</span>
              <span
                className="px-1.5 py-0.2 rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: hoveredPoint.color }}
              >
                {hoveredPoint.type}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-text-h">
                {Number(hoveredPoint.value).toFixed(2)}
              </span>
              <span className="text-[10px] text-text-light">
                {hoveredPoint.credits ? `${hoveredPoint.credits} credits` : ''}
              </span>
            </div>
            {hoveredPoint.period && (
              <p className="text-[10px] text-text-light">{hoveredPoint.period}</p>
            )}
            {hoveredPoint.subtitle && (
              <p className="text-[10px] text-accent font-semibold">{hoveredPoint.subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-border/70 text-xs">
        <div className="flex items-center gap-4">
          {showSgpa && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-2xs" />
              <span className="font-semibold text-text-m">Semester SGPA</span>
            </div>
          )}
          {showCgpa && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs" />
              <span className="font-semibold text-text-m">Cumulative CGPA</span>
            </div>
          )}
          {showCgpa && hasProjections && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
              <span className="font-semibold text-accent">Projected Path</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-text-light">
          <Info className="w-3.5 h-3.5 text-text-light" />
          <span>Click points or hover for exact scorecard details</span>
        </div>
      </div>
    </div>
  );
}
