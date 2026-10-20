import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Users,
  Building2,
  BookOpen,
  FileSpreadsheet,
  Award,
  Sliders,
  ArrowRight
} from 'lucide-react';

export default function QuickManagementActions() {
  const actions = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View and manage student accounts',
      link: '/admin/users',
      icon: Users,
      iconBg: 'bg-blue-500'
    },
    {
      id: 'universities',
      title: 'Manage Universities',
      description: 'Add, edit and manage universities',
      link: '/admin/universities',
      icon: Building2,
      iconBg: 'bg-emerald-500'
    },
    {
      id: 'courses',
      title: 'Manage Courses',
      description: 'Configure university courses',
      link: '/admin/courses',
      icon: BookOpen,
      iconBg: 'bg-purple-500'
    },
    {
      id: 'regulations',
      title: 'Manage Regulations',
      description: 'Set regulation years and rules',
      link: '/admin/regulations',
      icon: FileSpreadsheet,
      iconBg: 'bg-[#FF6B00]'
    },
    {
      id: 'grading',
      title: 'Grading Rules',
      description: 'Define grade ranges and points',
      link: '/admin/grading-rules',
      icon: Award,
      iconBg: 'bg-pink-500'
    },
    {
      id: 'calculation',
      title: 'Calculation Rules',
      description: 'Configure SGPA/CGPA formulas',
      link: '/admin/calculation-rules',
      icon: Sliders,
      iconBg: 'bg-teal-500'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Quick Management Actions
        </h2>
      </div>

      {/* 6 Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.id}
              to={act.link}
              className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs hover:shadow-subtle hover:border-[#FF6B00]/40 transition-all flex items-start gap-3 group"
            >
              <div className={`w-10 h-10 rounded-xl ${act.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#FF6B00] transition-colors">
                    {act.title}
                  </h3>
                  <ArrowRight className="w-3 h-3 text-[#FF6B00] shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
