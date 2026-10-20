import React from 'react';
import { Layers, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { studentService } from '../../services/studentService';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';

export default function BacklogTracker() {
  const summary = studentService.getAcademicSummary();

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before tracking active arrears, backlog clearances, and examination eligibility, please complete your Academic Profile Setup."
    >
      <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-brandAmber" />
          <span>Backlog Tracker</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Monitor arrears, supplementary examination schedules, and clear history.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-subtle text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-brandGreen flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-brandGreen mb-2">
            Status: All Clear
          </span>
          <h2 className="text-2xl font-extrabold text-text-h">
            Zero Active Backlogs!
          </h2>
          <p className="text-xs sm:text-sm text-text-m max-w-md mx-auto mt-1 leading-relaxed">
            You have successfully cleared all subjects across Semesters 1 through {summary.semestersCompleted}. You are fully eligible for on-campus placements and final degree awards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/70 max-w-lg mx-auto text-left">
          <div className="p-3 rounded-xl bg-bg border border-border/70 text-center">
            <span className="text-[10px] font-semibold text-text-light uppercase block">Backlogs</span>
            <span className="text-lg font-extrabold text-brandGreen">0</span>
          </div>
          <div className="p-3 rounded-xl bg-bg border border-border/70 text-center">
            <span className="text-[10px] font-semibold text-text-light uppercase block">Semesters Passed</span>
            <span className="text-lg font-extrabold text-text-h">{summary.semestersCompleted} / {summary.totalSemesters}</span>
          </div>
          <div className="p-3 rounded-xl bg-bg border border-border/70 text-center">
            <span className="text-[10px] font-semibold text-text-light uppercase block">Eligibility</span>
            <span className="text-lg font-extrabold text-brandBlue">100%</span>
          </div>
        </div>
      </div>
      </div>
    </AcademicProfileGate>
  );
}
