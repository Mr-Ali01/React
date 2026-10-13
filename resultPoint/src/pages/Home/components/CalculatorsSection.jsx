import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calculator,
  Binary,
  FileCheck,
  Target,
  ArrowRight,
} from 'lucide-react';

const calculators = [
  {
    to: '/calculators/sgpa',
    title: 'SGPA Calculator',
    desc: 'Calculate your semester grade point average with university-specific credit weights.',
    icon: GraduationCap,
    colorClass: 'bg-emerald-500/10 text-brandGreen border-brandGreen/20',
    hoverBorder: 'hover:border-brandGreen/40',
  },
  {
    to: '/calculators/cgpa',
    title: 'CGPA Calculator',
    desc: 'Calculate your cumulative GPA accurately across all completed university semesters.',
    icon: Calculator,
    colorClass: 'bg-blue-500/10 text-brandBlue border-brandBlue/20',
    hoverBorder: 'hover:border-brandBlue/40',
  },
  {
    to: '/calculators/gpa',
    title: 'GPA Calculator',
    desc: 'Compute weighted grade point average based on individual course credits and marks.',
    icon: Binary,
    colorClass: 'bg-purple-500/10 text-brandPurple border-brandPurple/20',
    hoverBorder: 'hover:border-brandPurple/40',
  },
  {
    to: '/calculators/percentage',
    title: 'Percentage Calculator',
    desc: 'Convert subject scores and semester marks into accurate aggregate percentages.',
    customIcon: '%',
    colorClass: 'bg-amber-500/10 text-brandAmber border-brandAmber/20 font-black text-sm',
    hoverBorder: 'hover:border-brandAmber/40',
  },
  {
    to: '/calculators/grade',
    title: 'Grade Calculator',
    desc: 'Convert raw test and exam marks into standard university letter grades and grade points.',
    icon: FileCheck,
    colorClass: 'bg-pink-500/10 text-brandPink border-brandPink/20',
    hoverBorder: 'hover:border-brandPink/40',
  },
  {
    to: '/calculators/target-cgpa',
    title: 'Target CGPA Calculator',
    desc: 'Find the exact required CGPA in upcoming semesters to achieve your graduation goal.',
    icon: Target,
    colorClass: 'bg-cyan-500/10 text-brandCyan border-brandCyan/20',
    hoverBorder: 'hover:border-brandCyan/40',
  },
];

export default function CalculatorsSection() {
  return (
    <section id="calculators" className="py-14 sm:py-18 bg-bg-sec border-y border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              POPULAR CALCULATORS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              Most Used Calculators
            </h2>
            <p className="text-xs sm:text-sm text-text-m">
              Calculate your academic results quickly and accurately.
            </p>
          </div>

          <Link
            to="/calculators"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>View All Calculators</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
          {calculators.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                to={c.to}
                className={`group p-5 rounded-2xl bg-card border border-border shadow-subtle ${c.hoverBorder} hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${c.colorClass}`}>
                    {Icon ? <Icon className="w-5 h-5" /> : c.customIcon}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-h group-hover:text-accent transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-text-m mt-1 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-accent">
                  <span>Calculate →</span>
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