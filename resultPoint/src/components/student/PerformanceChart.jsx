import React, { useState } from 'react';
import { BarChart2, ChevronDown } from 'lucide-react';

export default function PerformanceChart({ results = [] }) {
  const [showSGPA, setShowSGPA] = useState(true);
  const [showCGPA, setShowCGPA] = useState(true);
  const [rangeFilter, setRangeFilter] = useState('4'); // '4' or 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Ensure results are sorted by semesterNumber
  const sorted = [...results].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const chartData = rangeFilter === '4' ? sorted.slice(-4) : sorted;

  // Chart dimensions
  const width = 620;
  const height = 260;
  const padding = { top: 35, right: 35, bottom: 40, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y-axis range: 5.0 to 10.0
  const minY = 5.0;
  const maxY = 10.0;
  const yTicks = [5, 6, 7, 8, 9, 10];

  const getX = (index) => {
    if (chartData.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (chartData.length - 1)) * plotWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + plotHeight - ((clamped - minY) / (maxY - minY)) * plotHeight;
  };

  // Build SVG path strings
  const sgpaPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.sgpa), val: d.sgpa, sem: d.semesterTitle }));
  const cgpaPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.cgpa), val: d.cgpa, sem: d.semesterTitle }));

  const buildLinePath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  const buildAreaPath = (points) => {
    if (points.length === 0) return '';
    const line = buildLinePath(points);
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = padding.top + plotHeight;
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h">Academic Performance</h3>
            <p className="text-[11px] text-text-light">
              Track your semester-wise SGPA and CGPA progress.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* SGPA Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSGPA(!showSGPA)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              showSGPA
                ? 'bg-blue-500/20 text-brandBlue border border-blue-500/30'
                : 'bg-bg text-text-light border border-border hover:text-text-h'
            }`}
          >
            SGPA
          </button>

          {/* CGPA Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCGPA(!showCGPA)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              showCGPA
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-bg text-text-light border border-border hover:text-text-h'
            }`}
          >
            CGPA
          </button>

          {/* Range Dropdown */}
          <div className="relative">
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value)}
              className="calc-input text-xs font-semibold py-1 pl-2.5 pr-7 rounded-lg appearance-none cursor-pointer"
            >
              <option value="4">Last 4 Semesters</option>
              <option value="all">All Semesters</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-light" />
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full my-3 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* SGPA Cyan/Blue gradient */}
            <linearGradient id="sgpaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>

            {/* CGPA Orange gradient */}
            <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7300" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FF7300" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-axis labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  opacity="0.65"
                />
                <text
                  x={padding.left - 12}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-text-light text-[10px] font-medium"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {showSGPA && (
            <path
              d={buildAreaPath(sgpaPoints)}
              fill="url(#sgpaGrad)"
              className="transition-all duration-300"
            />
          )}

          {showCGPA && (
            <path
              d={buildAreaPath(cgpaPoints)}
              fill="url(#cgpaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Connecting Lines */}
          {showCGPA && (
            <path
              d={buildLinePath(cgpaPoints)}
              fill="none"
              stroke="#FF7300"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {showSGPA && (
            <path
              d={buildLinePath(sgpaPoints)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Points & Labels for CGPA */}
          {showCGPA &&
            cgpaPoints.map((p, idx) => (
              <g
                key={`cgpa-pt-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ ...p, type: 'CGPA', color: '#FF7300' })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#FF7300"
                  stroke="var(--card)"
                  strokeWidth="2"
                  className="hover:r-7 transition-all"
                />
                <text
                  x={p.x}
                  y={p.y + 18}
                  textAnchor="middle"
                  className="fill-text-h text-[10.5px] font-bold"
                >
                  {p.val.toFixed(2)}
                </text>
              </g>
            ))}

          {/* Points & Labels for SGPA */}
          {showSGPA &&
            sgpaPoints.map((p, idx) => (
              <g
                key={`sgpa-pt-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ ...p, type: 'SGPA', color: '#38BDF8' })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#38BDF8"
                  stroke="var(--card)"
                  strokeWidth="2"
                  className="hover:r-7 transition-all"
                />
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  className="fill-text-h text-[10.5px] font-bold"
                >
                  {p.val.toFixed(2)}
                </text>
              </g>
            ))}

          {/* X-axis labels */}
          {chartData.map((d, idx) => {
            const x = getX(idx);
            const y = height - 10;
            return (
              <text
                key={`sem-lbl-${idx}`}
                x={x}
                y={y}
                textAnchor="middle"
                className="fill-text-light text-[11px] font-semibold"
              >
                Sem {d.semesterNumber}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-xl bg-card border border-border shadow-theme text-xs font-bold z-20 flex items-center gap-1.5"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 8}%`
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredPoint.color }}
            />
            <span className="text-text-h">{hoveredPoint.sem}:</span>
            <span style={{ color: hoveredPoint.color }}>
              {hoveredPoint.type} {hoveredPoint.val.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Chart Footer Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF7300] ring-2 ring-accent/30" />
          <span className="text-xs font-bold text-text-h">CGPA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#38BDF8] ring-2 ring-blue-500/30" />
          <span className="text-xs font-bold text-text-h">SGPA</span>
        </div>
      </div>
    </div>
  );
}
