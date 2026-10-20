import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Award,
  BookOpen,
  Printer,
  Download,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { resultService } from '../../services/resultService';
import { studentService } from '../../services/studentService';
import ResultStatusBadge from '../../components/student/ResultStatusBadge';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';
import { printScorecard, exportScorecardPDF } from '../../utils/scorecardExport';

export default function ResultDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const result = resultService.getResultById(resultId);
  const student = studentService.getProfile();

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-8 bg-card border border-border rounded-2xl shadow-subtle space-y-4">
          <h2 className="text-xl font-bold text-text-h">Result Record Not Found</h2>
          <p className="text-sm text-text-light max-w-md mx-auto">
            The requested semester result could not be located in your academic profile.
          </p>
          <button
            onClick={() => navigate('/student/results')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Results</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate earned credits out of sum of all subject credits (e.g., 20/24 or 22/22)
  const subjects = result.subjects || [];
  const totalSubjectCredits = subjects.length > 0
    ? subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0)
    : (Number(result.totalCredits) || 22);
  const earnedCredits = Number(result.creditsEarned) || totalSubjectCredits;

  const handlePrint = () => {
    printScorecard(result, student);
  };

  const handleDownload = () => {
    showToast(`Downloading ${result.semesterTitle || result.semesterLabel} Scorecard PDF...`);
    exportScorecardPDF(result, student);
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before viewing individual semester result scorecards, please complete your Academic Profile Setup to link your course curriculum and grading rules."
    >
      <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Actions Bar (Excluded during printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <Link
          to="/student/results"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-light hover:text-accent transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Results</span>
        </Link>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            title="Print only this semester's scorecard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-bg-sec text-xs font-semibold text-text-h transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-accent" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            title="Export and download as PDF"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scorecard</span>
          </button>
        </div>
      </div>

      {/* Main Scorecard Overview (Printed element) */}
      <div id="printable-scorecard" className="printable-card rounded-2xl bg-card border border-border p-6 shadow-subtle space-y-6">
        {/* Header Information */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-text-h tracking-tight">
                {result.semesterTitle || result.semesterLabel}
              </h1>
              <ResultStatusBadge
                status={result.status}
                semesterNumber={result.semesterNumber}
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-text-light mt-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{result.academicPeriod}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Academic Record</span>
              </span>
            </div>
          </div>

          {/* Quick SGPA & CGPA Pill */}
          <div className="flex items-center gap-4 bg-bg-sec/60 dark:bg-slate-900/50 p-3 rounded-xl border border-border/60">
            <div className="text-center px-3 border-r border-border/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-light block">
                SGPA
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {Number(result.sgpa).toFixed(2)}
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-light block">
                CGPA
              </span>
              <span className="text-xl font-black text-accent">
                {Number(result.cgpa || result.sgpa).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-bg-sec/50 border border-border/60">
            <span className="text-xs text-text-light block">Total Subjects</span>
            <span className="text-lg font-bold text-text-h mt-0.5 block">
              {subjects.length || result.subjectCount || 6} Courses
            </span>
          </div>
          <div className="p-4 rounded-xl bg-bg-sec/50 border border-border/60">
            <span className="text-xs text-text-light block">Credits Earned</span>
            <span className="text-lg font-bold text-text-h mt-0.5 block">
              {earnedCredits}/{totalSubjectCredits}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-bg-sec/50 border border-border/60">
            <span className="text-xs text-text-light block">Backlog Count</span>
            <span className="text-lg font-bold text-text-h mt-0.5 block">
              0 Active
            </span>
          </div>
        </div>

        {/* Subject-Wise Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-h flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Course-wise Performance Breakdown</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-sec text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Grade Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {result.subjects && result.subjects.length > 0 ? (
                  result.subjects.map((s, idx) => (
                    <tr key={idx} className="hover:bg-bg-sec/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-light">
                        {s.code || `CS${result.semesterNumber}0${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-text-h">{s.name}</td>
                      <td className="py-3 px-4 text-center text-text-light">{s.credits}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-accent/10 text-accent">
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-text-h">
                        {s.points}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-text-light">
                      No course-specific marks recorded for this semester.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </AcademicProfileGate>
  );
}
