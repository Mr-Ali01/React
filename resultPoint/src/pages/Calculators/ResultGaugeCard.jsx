import React from 'react';
import { Bookmark, Lightbulb, TrendingUp } from 'lucide-react';

export default function ResultGaugeCard({
  score = 0,
  maxScale = 10,
  title = 'YOUR GPA RESULT',
  metrics = [],
  standing,
  onSave
}) {
  const circumference = 2 * Math.PI * 64; // 402.12
  const fraction = Math.max(0, Math.min(1, score / maxScale));
  const strokeDashoffset = circumference - fraction * circumference;

  return (
    <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Evaluation Results">
      {/* Orange Gradient Hero Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-5 shadow-accent text-center relative overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
          {title}
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
              {score.toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold text-white/80">out of {maxScale}</span>
          </div>
        </div>

        {standing && (
          <>
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                <span>{standing.icon}</span>
                <span>{standing.text}</span>
              </span>
            </div>
            <p className="text-[11px] text-white/90 leading-relaxed px-1">
              {standing.narrative}
            </p>
          </>
        )}

        {/* Inner Metrics Breakdown */}
        {metrics.length > 0 && (
          <div className="mt-3.5 p-3 rounded-xl bg-card text-text-h border border-white/20 space-y-1.5 text-xs text-left shadow-subtle">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between text-text-m text-[11px]">
                <span>{m.label}</span>
                <span className={`font-bold ${m.highlight ? 'text-accent font-extrabold' : 'text-text-h'}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-white text-accent hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save Result</span>
        </button>
      </div>

      {/* Tips Card */}
      {standing?.tips && (
        <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-h block">Tips to Improve</span>
            <p className="text-[11px] text-text-m mt-0.5 leading-snug">
              {standing.tips}
            </p>
          </div>
        </div>
      )}

      {/* Keep Going Card */}
      <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-text-h block">Keep Going!</span>
          <p className="text-[11px] text-text-m mt-0.5 leading-snug">
            Every subject contributes to your overall performance.
          </p>
        </div>
      </div>
    </aside>
  );
}