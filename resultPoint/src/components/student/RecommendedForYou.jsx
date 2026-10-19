import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Target, BarChart2, Repeat, Layers, ChevronRight, ArrowRight } from 'lucide-react';

const RECOMMENDED_TOOLS = [
  {
    title: 'Target CGPA Calculator',
    desc: 'Find required CGPA to achieve your goal.',
    icon: Target,
    iconColor: 'bg-accent/10 text-accent',
    path: '/calculators/target-cgpa'
  },
  {
    title: 'Result Analyzer',
    desc: 'Get detailed performance analysis.',
    icon: BarChart2,
    iconColor: 'bg-purple-500/10 text-brandPurple',
    path: '/calculators/result-analysis'
  },
  {
    title: 'Academic Converters',
    desc: 'Convert between CGPA, GPA, percentage etc.',
    icon: Repeat,
    iconColor: 'bg-emerald-500/10 text-brandGreen',
    path: '/calculators/percentage'
  },
  {
    title: 'Backlog Calculator',
    desc: 'Track and plan your backlogs.',
    icon: Layers,
    iconColor: 'bg-amber-500/10 text-brandAmber',
    path: '/calculators/backlog'
  }
];

export default function RecommendedForYou() {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-brandPurple flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Recommended for You</h3>
        </div>

        <Link
          to="/calculators"
          className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <span>View All Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tool List */}
      <div className="divide-y divide-border/60 my-2">
        {RECOMMENDED_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.title}
              to={tool.path}
              className="group flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-bg-sec/70 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tool.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-h group-hover:text-accent transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-[10.5px] text-text-light">{tool.desc}</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
