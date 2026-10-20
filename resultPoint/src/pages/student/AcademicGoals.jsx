import React, { useState } from 'react';
import { Target, CheckCircle, Lightbulb, TrendingUp, Info } from 'lucide-react';
import { goalService } from '../../services/goalService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';

export default function AcademicGoals() {
  const { showToast } = useToast();
  const summary = studentService.getAcademicSummary();
  const [goal, setGoal] = useState(() => goalService.getGoal());
  const [targetCGPA, setTargetCGPA] = useState(goal.targetCGPA || 8.50);

  const metrics = goalService.calculateGoalMetrics(
    Number(summary.currentCGPA),
    summary.semestersCompleted,
    summary.totalSemesters
  );

  const handleSaveGoal = (e) => {
    e.preventDefault();
    goalService.updateGoal({ targetCGPA: Number(targetCGPA) });
    setGoal(goalService.getGoal());
    showToast(`Target CGPA updated to ${Number(targetCGPA).toFixed(2)}!`);
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before setting academic goals and CGPA projection targets, please complete your Academic Profile Setup."
    >
      <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <Target className="w-6 h-6 text-brandPink" />
          <span>Academic Goals</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Plan, track, and project the required grades for your target graduation degree.
        </p>
      </div>

      {/* Target Metric Triple Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle text-center">
          <span className="text-xs font-semibold text-text-light uppercase tracking-wider block mb-1">
            Target CGPA
          </span>
          <span className="text-3xl font-extrabold text-brandCyan">
            {Number(targetCGPA).toFixed(2)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle text-center">
          <span className="text-xs font-semibold text-text-light uppercase tracking-wider block mb-1">
            Current CGPA
          </span>
          <span className="text-3xl font-extrabold text-text-h">
            {metrics.currentCGPA}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle text-center">
          <span className="text-xs font-semibold text-text-light uppercase tracking-wider block mb-1">
            Required Remaining Avg
          </span>
          <span className="text-3xl font-extrabold text-brandGreen">
            {metrics.requiredAverage}
          </span>
        </div>
      </div>

      {/* Progress & Target Setter Form */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-5">
        <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
          Adjust Your Target CGPA
        </h3>

        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-h">
                Desired Graduation CGPA
              </label>
              <span className="text-base font-extrabold text-accent">
                {Number(targetCGPA).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="6.0"
              max="10.0"
              step="0.05"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value)}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-light font-semibold mt-1">
              <span>6.0 (First Class)</span>
              <span>8.50 (Distinction Target)</span>
              <span>10.0 (Perfect)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Update Target Goal</span>
            </button>
          </div>
        </form>

        {/* Tip Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-text-m leading-relaxed">
            <span className="font-bold text-amber-500 mr-2">Strategy Advice:</span>
            To graduate with a <strong className="text-text-h">{Number(targetCGPA).toFixed(2)}</strong> CGPA,
            maintain an average of <strong className="text-brandGreen">{metrics.requiredAverage} SGPA</strong> over your remaining {summary.semestersRemaining} semesters.
          </div>
        </div>
      </div>
      </div>
    </AcademicProfileGate>
  );
}
