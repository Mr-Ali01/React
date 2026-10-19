import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { resultService } from '../../services/resultService';
import { useToast } from '../../context/ToastContext';

export default function MyResults() {
  const [searchParams] = useSearchParams();
  const highlightedSem = Number(searchParams.get('sem')) || null;

  const [results, setResults] = useState(() => resultService.getAllResults());
  const [expandedSem, setExpandedSem] = useState(highlightedSem || 4);
  const { showToast } = useToast();

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete ${title}?`)) {
      resultService.deleteResult(id);
      setResults(resultService.getAllResults());
      showToast(`${title} removed from records.`);
    }
  };

  const handleExportPDF = (semTitle) => {
    showToast(`Downloading scorecard for ${semTitle}...`);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-accent" />
            <span>My Results</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
            Semester-wise breakdown of SGPA, CGPA, subjects, and credits.
          </p>
        </div>

        <Link
          to="/student/add-result"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Semester Result</span>
        </Link>
      </div>

      {/* Results List Accordion */}
      <div className="space-y-4">
        {results
          .sort((a, b) => b.semesterNumber - a.semesterNumber)
          .map((r) => {
            const isExpanded = expandedSem === r.semesterNumber;

            return (
              <div
                key={r.id}
                className={`rounded-2xl bg-card border transition-all ${
                  isExpanded ? 'border-accent/40 shadow-subtle' : 'border-border'
                }`}
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => setExpandedSem(isExpanded ? null : r.semesterNumber)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-bold text-sm flex items-center justify-center shrink-0">
                      S{r.semesterNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-text-h">
                          {r.semesterTitle}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-brandGreen">
                          {r.status}
                        </span>
                      </div>
                      <span className="text-xs text-text-light flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{r.academicPeriod}</span>
                        <span className="mx-1">•</span>
                        <span>{r.creditsEarned} Credits</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Score Badges & Expand Arrow */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-text-light">SGPA</div>
                      <div className="text-base sm:text-lg font-extrabold text-brandGreen">
                        {r.sgpa.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-text-light">CGPA</div>
                      <div className="text-base sm:text-lg font-extrabold text-accent">
                        {r.cgpa.toFixed(2)}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-text-h">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Subject Breakdown */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/70 space-y-4">
                    <div className="flex items-center justify-between pt-2">
                      <h4 className="text-xs font-bold text-text-h uppercase tracking-wider">
                        Subject Performance Breakdown
                      </h4>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportPDF(r.semesterTitle)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-text-h hover:bg-bg-sec border border-border flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-accent" />
                          <span>Scorecard</span>
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.semesterTitle)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-brandPink hover:bg-brandPink/10 border border-brandPink/30 flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Subject Table */}
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">Code</th>
                            <th className="py-2.5 px-3">Subject Name</th>
                            <th className="py-2.5 px-3 text-center">Credits</th>
                            <th className="py-2.5 px-3 text-center">Grade</th>
                            <th className="py-2.5 px-3 text-center">Grade Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {r.subjects && r.subjects.length > 0 ? (
                            r.subjects.map((s, idx) => (
                              <tr key={idx} className="hover:bg-bg-sec/50">
                                <td className="py-2.5 px-3 font-semibold text-text-light">
                                  {s.code || `CS${r.semesterNumber}0${idx + 1}`}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-text-h">{s.name}</td>
                                <td className="py-2.5 px-3 text-center text-text-light">{s.credits}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-accent/10 text-accent">
                                    {s.grade}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-text-h">
                                  {s.points}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="py-4 text-center text-text-light">
                                Detailed subject rows not specified.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
