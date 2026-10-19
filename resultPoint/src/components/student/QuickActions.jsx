import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Plus, Calculator, PieChart, Target } from 'lucide-react';

const ACTIONS = [
  {
    title: 'Add Result',
    desc: 'Add your semester result.',
    icon: Plus,
    color: 'bg-emerald-500/10 text-brandGreen group-hover:bg-emerald-500 group-hover:text-white',
    path: '/student/add-result'
  },
  {
    title: 'Calculate CGPA',
    desc: 'Calculate from your results.',
    icon: Calculator,
    color: 'bg-blue-500/10 text-brandBlue group-hover:bg-blue-500 group-hover:text-white',
    path: '/calculators/cgpa'
  },
  {
    title: 'Analyze Result',
    desc: 'Get detailed analysis.',
    icon: PieChart,
    color: 'bg-purple-500/10 text-brandPurple group-hover:bg-purple-500 group-hover:text-white',
    path: '/calculators/result-analysis'
  },
  {
    title: 'Set Goal',
    desc: 'Plan your academic goals.',
    icon: Target,
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white',
    path: '/student/goals'
  }
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/70">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-brandBlue flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-text-h">Quick Actions</h3>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.path}
              className="group p-3 rounded-xl bg-bg border border-border/70 hover:border-accent/40 hover:shadow-sm transition-all flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${action.color}`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-text-h group-hover:text-accent transition-colors">
                  {action.title}
                </h4>
                <p className="text-[10.5px] text-text-light">{action.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
