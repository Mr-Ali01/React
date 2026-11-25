import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  LineChart,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const InstitutionalReadinessRoadmapCard: React.FC = () => {
  const roadmapSteps = [
    {
      title: 'Academic Structure Provisioning',
      phase: 'Phase 04',
      description:
        'Establish institutional faculties, academic departments, and degree programs matching statutory university affiliation.',
      icon: BookOpen,
      status: 'Upcoming Phase',
    },
    {
      title: 'Academic Staff & Faculty Ingestion',
      phase: 'Phase 04',
      description:
        'Provision role-based access for Department Heads, Examination Officers, and Teaching Faculty under tenant boundaries.',
      icon: Users,
      status: 'Upcoming Phase',
    },
    {
      title: 'Student Roster Onboarding',
      phase: 'Phase 04+',
      description:
        'Import batch enrollments, student identity records, and program admission cohorts securely.',
      icon: GraduationCap,
      status: 'Upcoming Phase',
    },
    {
      title: 'Longitudinal Academic Intelligence',
      phase: 'Phase 05+',
      description:
        'Aggregate examination datasets, automated SGPA/CGPA evaluation, and NAAC/NBA compliance analytics.',
      icon: LineChart,
      status: 'Upcoming Phase',
    },
  ];

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Institutional Readiness Roadmap
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Informational Guidance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overview of upcoming platform capabilities scheduled for subsequent deployment phases. Transactional notifications reflect outbox queueing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roadmapSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {step.phase}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <CalendarDays className="h-3 w-3" />
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
