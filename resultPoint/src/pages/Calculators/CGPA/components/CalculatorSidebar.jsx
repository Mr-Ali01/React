import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Table,
  Binary,
  Percent,
  FileCheck,
  Award,
  Layers,
  Target,
  AlertTriangle,
  PieChart,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export default function CalculatorSidebar() {
  return (
    <aside className="lg:col-span-2 xl:col-span-2 space-y-3.5" aria-label="Calculators Directory">
      <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
        <div className="pb-2.5 mb-2.5 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">Calculators</h2>
        </div>

        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block px-2 mb-1">
            Academic Performance
          </span>
          <Link
            to="/calculators/cgpa"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-soft text-accent border border-accent/25 transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>CGPA Calculator</span>
          </Link>
          <Link
            to="/calculators/sgpa"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Table className="w-3.5 h-3.5 text-emerald-500" />
            <span>SGPA Calculator</span>
          </Link>
          <Link
            to="/calculators/gpa"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Binary className="w-3.5 h-3.5 text-blue-500" />
            <span>GPA Calculator</span>
          </Link>
          <Link
            to="/calculators/percentage"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Percent className="w-3.5 h-3.5 text-pink-500" />
            <span>Percentage Calculator</span>
          </Link>
        </div>

        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block px-2 mb-1">
            Grade & Marks
          </span>
          <Link
            to="/calculators/grade"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-500" />
            <span>Grade Calculator</span>
          </Link>
          <Link
            to="/calculators/marks-grade"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Award className="w-3.5 h-3.5 text-cyan-500" />
            <span>Marks to Grade</span>
          </Link>
          <Link
            to="/calculators/credit-calculate"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Credits Calculator</span>
          </Link>
        </div>

        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block px-2 mb-1">
            Academic Planning
          </span>
          <Link
            to="/calculators/target-cgpa"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Target CGPA</span>
          </Link>
          <Link
            to="/calculators/backlog"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Backlog Calculator</span>
          </Link>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block px-2 mb-1">
            Analysis
          </span>
          <Link
            to="/calculators/result-analysis"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
          >
            <PieChart className="w-3.5 h-3.5 text-rose-500" />
            <span>Result Analyzer</span>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary">Not sure which calculator to use?</h3>
            <p className="text-[11px] text-text-secondary mt-1 leading-snug">
              Check our guide to find the right calculator for your needs.
            </p>
            <Link
              to="/guide"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline mt-2"
            >
              <span>View Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}