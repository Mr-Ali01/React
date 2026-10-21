import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

export default function PerformanceInsights({ insights = [] }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Performance Insights</h3>
        </div>

        <Link
          to="/student/analytics"
          className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Insight Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 my-3">
        {insights.map((item) => {
          let IconComponent = TrendingUp;
          let iconColorClass = 'bg-purple-500/10 text-brandPurple';
          let badgeClass = 'bg-purple-500/10 text-brandPurple';

          if (item.type === 'positive') {
            IconComponent = ArrowUp;
            iconColorClass = 'bg-emerald-500/10 text-brandGreen';
            badgeClass = 'bg-emerald-500/10 text-brandGreen';
          } else if (item.type === 'warning') {
            IconComponent = ArrowDown;
            iconColorClass = 'bg-amber-500/10 text-brandAmber';
            badgeClass = 'bg-amber-500/10 text-brandAmber';
          }

          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-bg border border-border/60 hover:border-border transition-colors min-w-0"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconColorClass}`}
                >
                  <IconComponent className="w-4 h-4 stroke-[2.5]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-text-light truncate">{item.title}</h4>
                  <p className="text-xs font-bold text-text-h mt-0.5 line-clamp-2">{item.subtitle}</p>
                  {item.detail && (
                    <span className="text-[11px] text-text-light block mt-0.5 truncate">{item.detail}</span>
                  )}
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 self-start ${badgeClass}`}
              >
                {item.badge}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
