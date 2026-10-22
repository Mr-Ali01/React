import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, AlertTriangle, Layers, Award, Calendar, Repeat, ArrowRight } from 'lucide-react';

const tools = [
  {
    title: 'Result Analyzer',
    desc: 'Analyze your academic performance, grade trends and identify courses requiring focus.',
    to: '/calculators/result-analysis',
    icon: PieChart,
    color: 'bg-amber-500/10 text-brandAmber border-brandAmber/20',
    hoverBorder: 'hover:border-brandAmber/50',
  },
  {
    title: 'Backlog Calculator',
    desc: 'Track pending backlogs, compute backlog credits, and model recovery strategies to graduate on time.',
    to: '/calculators/backlog',
    icon: AlertTriangle,
    color: 'bg-pink-500/10 text-brandPink border-brandPink/20',
    hoverBorder: 'hover:border-brandPink/50',
  },
  {
    title: 'Credits Calculator',
    desc: 'Calculate total credits earned, distinguish core vs elective weightings, and verify requirements.',
    to: '/calculators/credit-calculate',
    icon: Layers,
    color: 'bg-blue-500/10 text-brandBlue border-brandBlue/20',
    hoverBorder: 'hover:border-brandBlue/50',
  },
  {
    title: 'Marks to Grade',
    desc: 'Convert your subject marks directly to university grade letters and official grade points.',
    to: '/calculators/marks-grade',
    icon: Award,
    color: 'bg-emerald-500/10 text-brandGreen border-brandGreen/20',
    hoverBorder: 'hover:border-brandGreen/50',
  },
  {
    title: 'Study Planner',
    desc: 'Plan your study schedule, track syllabus milestones, and pace revisions ahead of exam weeks.',
    to: '/resources',
    icon: Calendar,
    color: 'bg-purple-500/10 text-brandPurple border-brandPurple/20',
    hoverBorder: 'hover:border-brandPurple/50',
  },
  {
    title: 'CGPA Converter',
    desc: 'Convert CGPA to percentage using university-specific official formulas (AICTE, JNTUH, AU).',
    to: '/tools',
    icon: Repeat,
    color: 'bg-orange-500/10 text-accent border-accent/20',
    hoverBorder: 'hover:border-accent/50',
  },
];

export default function ToolsSection() {
  return (
    <section id="tools" className="py-16 sm:py-20 bg-bg-sec border-y border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              ACADEMIC TOOLS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              Go Beyond Basic Calculations
            </h2>
            <p className="text-xs sm:text-sm text-text-m">
              Explore useful tools to help you manage and understand your academic journey.
            </p>
          </div>

          <Link
            to="/tools"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>Explore All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                to={t.to}
                className={`group p-5 rounded-2xl bg-card border border-border shadow-subtle ${t.hoverBorder} hover:-translate-y-1 transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${t.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-h group-hover:text-accent transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-text-m mt-1 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-text-light group-hover:text-accent">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}