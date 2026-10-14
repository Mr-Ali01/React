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

export default function CalculatorDirectorySidebar({ activeTool = 'gpa' }) {
  const getToolLinkClass = (toolKey) => {
    return activeTool === toolKey
      ? 'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-soft text-accent border border-accent/25 transition-all'
      : 'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all';
  };

  return (
    <aside className="lg:col-span-3 xl:col-span-2 space-y-3.5" aria-label="Calculators Directory">
      <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
        <div className="pb-2.5 mb-2.5 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-h">Calculators</h2>
        </div>

        {/* Academic Performance */}
        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
            Academic Performance
          </span>
          <Link to="/calculators/cgpa" className={getToolLinkClass('cgpa')}>
            <Calculator className="w-3.5 h-3.5 text-accent" />
            <span>CGPA Calculator</span>
          </Link>
          <Link to="/calculators/sgpa" className={getToolLinkClass('sgpa')}>
            <Table className="w-3.5 h-3.5 text-brandGreen" />
            <span>SGPA Calculator</span>
          </Link>
          <Link to="/calculators/gpa" className={getToolLinkClass('gpa')}>
            <Binary className="w-3.5 h-3.5 text-brandBlue" />
            <span>GPA Calculator</span>
          </Link>
          <Link to="/calculators/percentage" className={getToolLinkClass('percentage')}>
            <Percent className="w-3.5 h-3.5 text-brandPink" />
            <span>Percentage Calculator</span>
          </Link>
        </div>

        {/* Grade & Marks */}
        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
            Grade & Marks
          </span>
          <Link to="/calculators/grade" className={getToolLinkClass('grade')}>
            <FileCheck className="w-3.5 h-3.5 text-brandPurple" />
            <span>Grade Calculator</span>
          </Link>
          <Link to="/calculators/marks-convert" className={getToolLinkClass('marks-grade')}>
            <Award className="w-3.5 h-3.5 text-brandCyan" />
            <span>Marks Convert</span>
          </Link>
          <Link to="/calculators/credite-calculate" className={getToolLinkClass('credits')}>
            <Layers className="w-3.5 h-3.5 text-brandBlue" />
            <span>Credits Calculator</span>
          </Link>
        </div>

        {/* Academic Planning */}
        <div className="space-y-0.5 mb-3">
          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
            Academic Planning
          </span>
          <Link to="/calculators/target-cgpa" className={getToolLinkClass('target-cgpa')}>
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Target CGPA</span>
          </Link>
          <Link to="/calculators/backlog" className={getToolLinkClass('backlog')}>
            <AlertTriangle className="w-3.5 h-3.5 text-brandAmber" />
            <span>Backlog Calculator</span>
          </Link>
        </div>

        {/* Analysis */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
            Analysis
          </span>
          <Link to="/calculators/result-analysis" className={getToolLinkClass('result-analysis')}>
            <PieChart className="w-3.5 h-3.5 text-brandPink" />
            <span>Result Analyzer</span>
          </Link>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-h">Not sure which to use?</h3>
            <p className="text-[11px] text-text-m mt-1 leading-snug">
              Check our guide to find the right calculator for your needs.
            </p>
            <Link to="/resources" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline mt-2">
              <span>View Guide</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}