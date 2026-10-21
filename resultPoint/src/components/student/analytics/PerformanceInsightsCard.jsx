import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function PerformanceInsightsCard({ insights = [] }) {
  if (!insights || insights.length === 0) return null;

  const getBadgeClasses = (badgeColor) => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
      case 'pink':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/25';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'positive':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h">Performance Insights</h3>
            <p className="text-[11px] text-text-light">
              Automated data-driven observations on semester velocity, strengths, and areas for focus.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-sec border border-border text-text-light">
          Real-time AI Insights
        </span>
      </div>

      {/* Grid of Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-bg border border-border/80 hover:border-accent/40 transition-all flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 rounded-lg bg-bg-sec border border-border/60 group-hover:scale-105 transition-transform">
                {getIcon(item.type)}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClasses(
                  item.badgeColor
                )}`}
              >
                {item.badge}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-h">
                {item.title}
              </h4>
              <p className="text-[11px] text-text-light mt-1 leading-relaxed">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
