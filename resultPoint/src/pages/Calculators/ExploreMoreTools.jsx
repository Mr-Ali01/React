import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calculator,
  Percent,
  FileText,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

const TOOLS = [
  { to: '/calculators/cgpa', name: 'CGPA Calculator', desc: 'Calculate your cumulative grade point average', icon: GraduationCap, color: 'text-accent bg-orange-500/10 border-accent/20' },
  { to: '/calculators/sgpa', name: 'SGPA Calculator', desc: 'Calculate your semester grade point average', icon: Calculator, color: 'text-brandGreen bg-emerald-500/10 border-brandGreen/20' },
  { to: '/calculators/percentage', name: 'Percentage Calculator', desc: 'Convert your marks to percentage accurately', icon: Percent, color: 'text-brandAmber bg-amber-500/10 border-brandAmber/20' },
  { to: '/calculators/grade', name: 'Grade Calculator', desc: 'Find your letter grades based on university rules', icon: FileText, color: 'text-brandPurple bg-purple-500/10 border-brandPurple/20' },
  { to: '/calculators/marks-grade', name: 'Marks to Grade', desc: 'Convert examination marks to grade points', icon: Award, color: 'text-brandPink bg-pink-500/10 border-brandPink/20' },
  { to: '/calculators/credit-calculate', name: 'Credits Calculator', desc: 'Calculate your earned total degree credits', icon: Layers, color: 'text-brandBlue bg-blue-500/10 border-brandBlue/20' }
];

export default function ExploreMoreTools() {
  return (
    <section className="explore-tools mt-6 mb-4 space-y-3" aria-label="Related Calculators and Tools">
      <h3 className="text-base font-bold text-text-h tracking-tight">Explore More Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.name}
              to={tool.to}
              className="group p-3.5 rounded-2xl bg-card border border-border hover:border-accent hover:shadow-subtle transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${tool.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="mt-2.5 text-xs font-bold text-text-h group-hover:text-accent transition-colors leading-tight">
                  {tool.name}
                </h4>
                <p className="mt-1 text-[10.5px] text-text-m leading-relaxed line-clamp-2">
                  {tool.desc}
                </p>
              </div>
              <div className="mt-3 pt-1 flex justify-end">
                <ArrowRight className="w-3.5 h-3.5 text-accent -rotate-45 group-hover:rotate-0 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}