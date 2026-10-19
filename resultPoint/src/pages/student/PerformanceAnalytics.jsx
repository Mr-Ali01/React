import React from 'react';
import { TrendingUp, BarChart2, Award, CheckCircle, ArrowUp } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { resultService } from '../../services/resultService';
import PerformanceChart from '../../components/student/PerformanceChart';

export default function PerformanceAnalytics() {
  const summary = studentService.getAcademicSummary();
  const results = resultService.getAllResults();
  const insights = studentService.getPerformanceInsights();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-brandPurple" />
          <span>Performance Analytics</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Comprehensive analysis of your academic trajectory, semester velocity, and grade distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <PerformanceChart results={results} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
              Academic Standing
            </h3>
            <div className="text-3xl font-extrabold text-brandGreen">
              {summary.performanceBadge}
            </div>
            <p className="text-xs text-text-m leading-relaxed">
              Your overall cumulative grade point average of <strong>{summary.currentCGPA}</strong> places you in the top 10% of your MCA cohort at Osmania University.
            </p>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
              Credit Completion
            </h3>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-h">{summary.totalCredits} / {summary.degreeCredits}</span>
              <span className="text-xs font-bold text-brandBlue">{summary.creditsPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${summary.creditsPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
