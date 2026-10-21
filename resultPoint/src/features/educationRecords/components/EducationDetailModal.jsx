import React from 'react';
import {
  X,
  School,
  BookOpen,
  Layers,
  GraduationCap,
  Award,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function EducationDetailModal({
  record,
  isOpen,
  isActiveContext,
  onClose,
  onEdit,
  onDelete,
  onSetActiveContext,
  onUpgradeMode
}) {
  if (!isOpen || !record) return null;

  const isSchool = record.categoryGroup === 'School' || record.category === 'School Education';
  const isUG = record.type === 'ug';
  const isPG = record.type === 'pg';
  const isCompleted = record.status === 'Completed';

  // Icon selection
  let Icon = GraduationCap;
  let iconColor = 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20';
  if (record.type === 'school_early') {
    Icon = School;
    iconColor = 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
  } else if (record.type === 'school_10') {
    Icon = BookOpen;
    iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  } else if (record.type === 'school_12') {
    Icon = Layers;
    iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (record.type === 'ug') {
    Icon = GraduationCap;
    iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (record.type === 'pg') {
    Icon = Award;
    iconColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3 bg-bg-sec/60">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-text-h tracking-tight">
                  {record.level}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20">
                  {record.category}
                </span>
                {isCompleted ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>In Progress</span>
                  </span>
                )}
                {isActiveContext && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30">
                    Active Context
                  </span>
                )}
              </div>

              <p className="text-xs text-text-light mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{record.university || record.schoolName}</span>
                {record.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {record.city}{record.state ? `, ${record.state}` : ''}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-sec hover:bg-border text-text-light hover:text-text-h flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Academic Context Switch Prompt for UG/PG */}
          {(isUG || isPG) && (
            <div className="p-3.5 rounded-xl bg-bg-sec border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-text-h block">
                  {isActiveContext ? 'Current Active Academic Context' : 'Set as Active Academic Context'}
                </span>
                <p className="text-[11px] text-text-light">
                  {isActiveContext
                    ? 'Dashboard, My Results, Analytics, and Goals are currently reflecting this degree.'
                    : 'Switching active context sets this degree for your dashboard, results, and GPA goals.'}
                </p>
              </div>

              {!isActiveContext && onSetActiveContext && (
                <button
                  type="button"
                  onClick={() => onSetActiveContext(record.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-sm flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Set Active</span>
                </button>
              )}
            </div>
          )}

          {/* Academic Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isSchool ? (
              <>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Passing Year</span>
                  <span className="text-base font-bold text-text-h">{record.passingYear || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Percentage</span>
                  <span className="text-base font-bold text-emerald-500">
                    {record.percentage ? `${record.percentage}%` : '-'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Marks</span>
                  <span className="text-base font-bold text-text-h">
                    {record.totalMarks ? `${record.totalMarks} / ${record.maxMarks}` : '-'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Result Status</span>
                  <span className="text-base font-bold text-text-h">{record.status}</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Admission Year</span>
                  <span className="text-base font-bold text-text-h">{record.admissionYear || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Duration</span>
                  <span className="text-base font-bold text-text-h">{record.durationText || `${record.totalSemesters} Semesters`}</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">CGPA</span>
                  <span className="text-base font-bold text-[#FF6B00]">
                    {record.cgpa ? Number(record.cgpa).toFixed(2) : '-'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-bg-sec border border-border">
                  <span className="text-[10px] font-semibold text-text-light uppercase block">Completed Semesters</span>
                  <span className="text-base font-bold text-text-h">
                    {record.completedSemestersRatio || `${record.completedSemesters || 0} / ${record.totalSemesters}`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* School Subjects Scorecard Table */}
          {isSchool && Array.isArray(record.subjects) && record.subjects.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Verified Subject Scorecard</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs text-text-m">
                  <thead className="bg-bg-sec text-text-light font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 w-20">Code</th>
                      <th className="py-2.5 px-3 w-24 text-right">Max Marks</th>
                      <th className="py-2.5 px-3 w-24 text-right">Obtained</th>
                      <th className="py-2.5 px-3 w-20 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {record.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-bg-sec/40">
                        <td className="p-2.5 px-3 font-medium text-text-h">{sub.name}</td>
                        <td className="p-2.5 px-3 text-text-light">{sub.code || '-'}</td>
                        <td className="p-2.5 px-3 text-right">{sub.maxMarks}</td>
                        <td className="p-2.5 px-3 text-right font-bold text-text-h">{sub.marksObtained}</td>
                        <td className="p-2.5 px-3 text-center font-bold text-emerald-500">{sub.grade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UG/PG Semester-wise Summaries */}
          {(isUG || isPG) && Array.isArray(record.semesters) && record.semesters.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Semester-wise Breakdown</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.semesters.map((sem) => (
                  <div key={sem.semesterNumber} className="p-3.5 rounded-xl bg-bg-sec border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-h">Semester {sem.semesterNumber}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sem.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : sem.status === 'IN_PROGRESS'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20'
                          : 'bg-bg-sec text-text-light'
                      }`}>
                        {sem.status || 'Completed'}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-light">{sem.academicSession || 'Examination Session'}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                      <span className="text-text-light">SGPA:</span>
                      <span className="font-bold text-text-h">
                        {sem.sgpa ? Number(sem.sgpa).toFixed(2) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-3 bg-bg-sec/60">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(record);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-white hover:bg-rose-500/15 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Record</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
