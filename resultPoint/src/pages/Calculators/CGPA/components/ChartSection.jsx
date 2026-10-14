import React, { useState } from 'react';

export default function ChartSection({ currentCgpa }) {
  const [metric, setMetric] = useState('cgpa');

  const clamped = Math.max(0, Math.min(10, currentCgpa));
  const currentY = 145 - (clamped / 10) * 125;

  return (
    <section className="mt-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Your Performance Trend</h3>
        </div>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="calc-input px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
        >
          <option value="cgpa">CGPA Trend</option>
          <option value="sgpa">SGPA Trend</option>
        </select>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg className="w-full h-44" viewBox="0 0 700 170" preserveAspectRatio="none">
            <line x1="40" y1="20" x2="680" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
            <text x="25" y="24" fontSize="9.5" fill="currentColor" className="text-text-muted font-medium">10</text>

            <line x1="40" y1="55" x2="680" y2="55" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
            <text x="25" y="59" fontSize="9.5" fill="currentColor" className="text-text-muted font-medium">8</text>

            <line x1="40" y1="90" x2="680" y2="90" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
            <text x="25" y="94" fontSize="9.5" fill="currentColor" className="text-text-muted font-medium">6</text>

            <line x1="40" y1="125" x2="680" y2="125" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
            <text x="25" y="129" fontSize="9.5" fill="currentColor" className="text-text-muted font-medium">4</text>

            <line x1="40" y1="145" x2="680" y2="145" stroke="currentColor" className="text-border" strokeWidth="1" />
            <text x="25" y="149" fontSize="9.5" fill="currentColor" className="text-text-muted font-medium">0</text>

            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d={`M 100 80 L 260 72 L 440 56 L 620 ${currentY} L 620 145 L 100 145 Z`}
              fill="url(#chartGradient)"
            />
            <polyline
              fill="none"
              stroke="#FF6B00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={`100,80 260,72 440,56 620,${currentY}`}
            />

            <circle cx="100" cy="80" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
            <text x="100" y="68" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-primary">7.10</text>
            <text x="100" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-secondary">Sem 1</text>

            <circle cx="260" cy="72" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
            <text x="260" y="60" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-primary">7.35</text>
            <text x="260" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-secondary">Sem 2</text>

            <circle cx="440" cy="56" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
            <text x="440" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-primary">7.92</text>
            <text x="440" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-secondary">Sem 3</text>

            <circle cx="620" cy={currentY} r="5.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
            <text x="620" y={currentY - 12} textAnchor="middle" fontSize="10.5" fontWeight="extrabold" fill="#FF6B00">
              {currentCgpa.toFixed(2)}
            </text>
            <text x="620" y="160" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-primary">Sem 4</text>
          </svg>
        </div>
      </div>
    </section>
  );
}