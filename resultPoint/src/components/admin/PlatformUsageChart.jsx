import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { USAGE_CHART_SERIES } from '../../services/adminDashboardService';

export default function PlatformUsageChart() {
  const [activeRange, setActiveRange] = useState('Last 30 Days');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 1 Year'];
  const chartData = USAGE_CHART_SERIES[activeRange] || USAGE_CHART_SERIES['Last 30 Days'];

  const { labels, calculations, activeUsers, newRegistrations } = chartData;

  // Chart dimensions
  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 25, bottom: 35, left: 35 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y-axis scale: 0 to 5 (in thousands, K)
  const minY = 0;
  const maxY = 5.0;
  const yTicks = [0, 1, 2, 3, 4, 5];

  const getX = (index) => {
    if (labels.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (labels.length - 1)) * plotWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + plotHeight - ((clamped - minY) / (maxY - minY)) * plotHeight;
  };

  // Convert points to smooth bezier spline curve
  const buildSmoothPath = (values) => {
    const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const buildAreaPath = (values) => {
    const linePath = buildSmoothPath(values);
    if (!linePath) return '';
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + plotHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  return (
    <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header with Title and Date Range Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Usage Overview
          </h2>
        </div>

        {/* Date-Range Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#0D141F] p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => {
                setActiveRange(r);
                setHoveredIndex(null);
              }}
              type="button"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeRange === r
                  ? 'bg-[#FF6B00] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full pt-4 pb-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Orange Gradient for Calculations */}
            <linearGradient id="adminCalcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
            </linearGradient>

            {/* Blue Gradient for Active Users */}
            <linearGradient id="adminUserGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>

            {/* Green Gradient for New Registrations */}
            <linearGradient id="adminRegGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y-axis Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1E2A35]"
                  strokeDasharray={tick === 0 ? 'none' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
                >
                  {tick === 0 ? '0' : `${tick}K`}
                </text>
              </g>
            );
          })}

          {/* X-axis Labels */}
          {labels.map((lbl, idx) => {
            const x = getX(idx);
            return (
              <text
                key={lbl}
                x={x}
                y={padding.top + plotHeight + 20}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
              >
                {lbl}
              </text>
            );
          })}

          {/* Area Gradients */}
          <path d={buildAreaPath(calculations)} fill="url(#adminCalcGrad)" />
          <path d={buildAreaPath(activeUsers)} fill="url(#adminUserGrad)" />
          <path d={buildAreaPath(newRegistrations)} fill="url(#adminRegGrad)" />

          {/* Lines */}
          <path
            d={buildSmoothPath(calculations)}
            fill="none"
            stroke="#FF6B00"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={buildSmoothPath(activeUsers)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d={buildSmoothPath(newRegistrations)}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Interactive Hover Guides & Data Points */}
          {labels.map((_, idx) => {
            const x = getX(idx);
            const calcY = getY(calculations[idx]);
            const userY = getY(activeUsers[idx]);
            const regY = getY(newRegistrations[idx]);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx} className="cursor-pointer">
                {/* Vertical Cursor Guide when Hovered */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + plotHeight}
                    stroke="#FF6B00"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Point for Calculations (Orange) */}
                <circle
                  cx={x}
                  cy={calcY}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#FF6B00"
                  className="stroke-white dark:stroke-[#111418] transition-all"
                  strokeWidth="2"
                />

                {/* Point for Active Users (Blue) */}
                <circle
                  cx={x}
                  cy={userY}
                  r={isHovered ? 5 : 3}
                  fill="#2563EB"
                  className="stroke-white dark:stroke-[#111418] transition-all"
                  strokeWidth="1.5"
                />

                {/* Point for New Registrations (Green) */}
                <circle
                  cx={x}
                  cy={regY}
                  r={isHovered ? 5 : 3}
                  fill="#10B981"
                  className="stroke-white dark:stroke-[#111418] transition-all"
                  strokeWidth="1.5"
                />

                {/* Invisible Hit Target for Easier Hover */}
                <rect
                  x={x - 15}
                  y={padding.top}
                  width={30}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when Hovered */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none p-2 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xl text-[11px] font-semibold -translate-x-1/2 -top-3"
            style={{ left: `${(getX(hoveredIndex) / width) * 100}%` }}
          >
            <div className="text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1">
              {labels[hoveredIndex]}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-orange-400">
                <span>Calculations:</span>
                <span className="font-bold">{(calculations[hoveredIndex] * 1000).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-blue-400">
                <span>Active Users:</span>
                <span className="font-bold">{(activeUsers[hoveredIndex] * 1000).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span>Registrations:</span>
                <span className="font-bold">{(newRegistrations[hoveredIndex] * 1000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend at Bottom matching reference image */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 dark:border-[#1E2A35]/80 text-[11px] font-semibold">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
          <span>Calculations</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          <span>Active Users</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span>New Registrations</span>
        </div>
      </div>
    </div>
  );
}
