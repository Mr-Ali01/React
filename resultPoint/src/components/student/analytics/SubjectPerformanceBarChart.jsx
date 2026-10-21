import React from 'react';
import { Layers, Calculator, FlaskConical, BookOpen, Award } from 'lucide-react';

const CATEGORY_ICONS = {
  core: Layers,
  maths: Calculator,
  labs: FlaskConical,
  electives: BookOpen
};

export default function SubjectPerformanceBarChart({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 text-center text-xs text-text-light">
        No categorized subject records available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Fully Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/80">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-text-h leading-tight">
              Subject-wise Performance
            </h3>
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              Average Grade Points across curriculum disciplines and practical labs.
            </p>
          </div>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-sec border border-border text-text-light whitespace-nowrap">
            10-Point Scale
          </span>
        </div>
      </div>

      {/* Categories Bar List */}
      <div className="space-y-4 pt-4">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Layers;
          const percentage = Math.min(100, Math.max(0, (cat.avgGradePoints / 10) * 100));

          return (
            <div key={cat.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-text-h block">{cat.name}</span>
                    <span className="text-[10px] text-text-light">
                      {cat.subjectCount} subject{cat.subjectCount !== 1 ? 's' : ''} • {cat.totalCredits} credits
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      border: `1px solid ${cat.color}30`
                    }}
                  >
                    {cat.standing}
                  </span>
                  <div className="font-mono text-right">
                    <span className="text-sm font-extrabold text-text-h">
                      {cat.avgGradePoints.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-text-light ml-0.5">/10</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar with Color Gradient */}
              <div className="w-full h-2 rounded-full bg-bg-sec overflow-hidden border border-border/40">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cat.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-text-light">
        <span>Higher credit categories have greater influence on overall CGPA.</span>
      </div>
    </div>
  );
}
