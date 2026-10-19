import React from 'react';
import { Calculator, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEMO_HISTORY = [
  { id: 1, tool: 'CGPA Calculator', query: 'Semester 4 CBCS Evaluation', score: '8.72 SGPA', date: 'Oct 06, 2026', path: '/calculators/cgpa' },
  { id: 2, tool: 'Target CGPA Calculator', query: 'Goal: 8.50 Target from 8.10', score: '8.63 Req.', date: 'Sep 28, 2026', path: '/calculators/target-cgpa' },
  { id: 3, tool: 'Percentage Converter', query: '8.37 CGPA to Osmania %', score: '76.2%', date: 'Sep 15, 2026', path: '/calculators/percentage' },
  { id: 4, tool: 'Result Analyzer', query: 'Performance Risk Audit Sem 3', score: 'Low Risk', date: 'Jul 10, 2026', path: '/calculators/result-analysis' }
];

export default function CalculationHistory() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <Calculator className="w-6 h-6 text-brandBlue" />
          <span>Calculation History</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Audit trail of academic calculations, conversions, and projections.
        </p>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-subtle divide-y divide-border/60 overflow-hidden">
        {DEMO_HISTORY.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-bg-sec/50 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h">{item.tool}</h3>
                <p className="text-[11px] text-text-light">{item.query}</p>
                <span className="text-[10px] text-text-light flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-brandGreen">
                {item.score}
              </span>
              <Link
                to={item.path}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-accent transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
