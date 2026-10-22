import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Home,
  ChevronRight,
  Calculator,
  Layers,
  BookOpen,
  Info
} from 'lucide-react';
import { roundAcademic } from '../../services/academicCalculationEngine';

export default function CGPAImprovementGuide() {
  // Interactive Simulator State
  const [completedCredits, setCompletedCredits] = useState('60');
  const [currentCgpa, setCurrentCgpa] = useState('7.20');
  const [upcomingCredits, setUpcomingCredits] = useState('22');
  const [targetSgpa, setTargetSgpa] = useState('8.80');

  // Interactive Simulation Math
  const simulation = useMemo(() => {
    const compCr = parseFloat(completedCredits);
    const curGpa = parseFloat(currentCgpa);
    const upCr = parseFloat(upcomingCredits);
    const tgtGpa = parseFloat(targetSgpa);

    if (
      isNaN(compCr) || compCr <= 0 ||
      isNaN(curGpa) || curGpa < 0 || curGpa > 10 ||
      isNaN(upCr) || upCr <= 0 ||
      isNaN(tgtGpa) || tgtGpa < 0 || tgtGpa > 10
    ) {
      return { isValid: false };
    }

    const currentPoints = compCr * curGpa;
    const upcomingPoints = upCr * tgtGpa;
    const totalCredits = compCr + upCr;
    const newCgpa = roundAcademic((currentPoints + upcomingPoints) / totalCredits, 2, 'HALF_UP');
    const netChange = roundAcademic(newCgpa - curGpa, 2);

    return {
      isValid: true,
      newCgpa,
      netChange,
      totalCredits,
      percentGain: roundAcademic((newCgpa - curGpa) * 10, 2)
    };
  }, [completedCredits, currentCgpa, upcomingCredits, targetSgpa]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-start">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li>
              <Link to="/calculators" className="hover:text-accent transition-colors">Calculators & Tools</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">CGPA Improvement Guide</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Practical Strategies & Guidance */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Academic Performance Optimization</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How to Improve Your Cumulative CGPA
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Strategic methods to elevate your cumulative grade point average, maximize high-credit courses, recover from backlogs, and plan future semester targets.
              </p>
            </div>

            {/* Strategic Pillars */}
            <div className="space-y-4">
              {/* Strategy 1: High Credit Weighting */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Prioritize High-Credit Courses (3 & 4 Credits)
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                  Because CGPA is credit-weighted, earning an <strong>O Grade (10 pts)</strong> in a 4-credit core subject contributes <strong>40 quality points</strong> to your numerator. In contrast, securing an O Grade in a 1.5-credit lab provides only 15 points. Directing early study hours toward 4-credit courses has more than 2.6× the mathematical impact on your final GPA.
                </p>
              </div>

              {/* Strategy 2: Clear Backlogs Early */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Clear Active Backlogs in the Next Immediate Session
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                  An uncleared backlog assigns <strong>0 grade points</strong> while its credits remain counted in your total registered credits denominator, severely depressing your CGPA. Clearing that paper even with a Grade C (5 pts) or Grade B (6 pts) instantly lifts your cumulative grade point average by replacing the zero with positive quality points.
                </p>
              </div>

              {/* Strategy 3: Target CGPA Planning */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brandBlue flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Model Required SGPA for Campus Placement Eligibility
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                  Top tier hiring companies and graduate scholarship programs typically demand a minimum threshold (e.g., <strong>7.00, 7.50, or 8.00 CGPA</strong>). As you progress in semesters, each new semester has a smaller mathematical pull on your cumulative GPA. Calculate your required target early using our Target CGPA Calculator.
                </p>
              </div>

              {/* Strategy 4: Revaluation Tactics */}
              <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Understand Revaluation & Recounting Boundaries
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
                  If your marks in a subject are within 1 – 2 marks of the next higher grade boundary (for example, scoring 69 when 70 awards Grade A+), applying for challenge evaluation or recounting under university rules may elevate your grade point by a full point without sitting for a re-examination.
                </p>
              </div>
            </div>

            {/* Regulation Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-accent shrink-0" />
                <span>Institutional Policy Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Revaluation deadlines, maximum grade limits on supplementary exams, and credit carry-forward rules vary strictly by university (JNTUH, Osmania, VTU, Mumbai Univ). Always consult your official examination branch notifications before applying.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Impact Simulator & Calculator Shortcuts */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-5 sticky top-24">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-2">
                  Interactive Projection Simulator
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  See how achieving your target SGPA next semester will lift your overall CGPA.
                </p>
              </div>

              {/* Simulator Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label htmlFor="completed-credits-input" className="font-bold text-slate-700 dark:text-slate-300 block">
                    Completed Credits
                  </label>
                  <input
                    id="completed-credits-input"
                    type="number"
                    min="1"
                    max="200"
                    value={completedCredits}
                    onChange={(e) => setCompletedCredits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="current-cgpa-input" className="font-bold text-slate-700 dark:text-slate-300 block">
                    Current CGPA
                  </label>
                  <input
                    id="current-cgpa-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="next-sem-credits-input" className="font-bold text-slate-700 dark:text-slate-300 block">
                    Next Sem Credits
                  </label>
                  <input
                    id="next-sem-credits-input"
                    type="number"
                    min="1"
                    max="40"
                    value={upcomingCredits}
                    onChange={(e) => setUpcomingCredits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="target-sgpa-input" className="font-bold text-slate-700 dark:text-slate-300 block">
                    Target Next SGPA
                  </label>
                  <input
                    id="target-sgpa-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetSgpa}
                    onChange={(e) => setTargetSgpa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Simulation Result */}
              {simulation.isValid ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-orange-500/5 to-transparent border border-emerald-500/20 text-center space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Projected New CGPA
                  </span>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {simulation.newCgpa.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                      {simulation.netChange >= 0 ? `+${simulation.netChange.toFixed(2)}` : simulation.netChange.toFixed(2)} CGPA Gain
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                  Enter valid values above to view your projected CGPA.
                </div>
              )}

              {/* Related Interactive Calculators */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2A35]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Actionable Calculators
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/calculators/target-cgpa"
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-accent">
                        Target CGPA Planner
                      </div>
                      <div className="text-[10px] text-slate-400">Find required SGPA to hit honours</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/calculators/backlog"
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-accent">
                        Backlog Impact Calculator
                      </div>
                      <div className="text-[10px] text-slate-400">Analyze backlog clearance lift</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/tools/sgpa-to-cgpa"
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#222E3C] hover:border-accent flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-accent">
                        SGPA to CGPA Converter
                      </div>
                      <div className="text-[10px] text-slate-400">Aggregate semester grades</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
