import React from 'react';
import {
  School,
  BookOpen,
  Layers,
  GraduationCap,
  Award,
  Building,
  MapPin,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';

export default function EducationRecordCard({
  record,
  isActiveContext = false,
  onView,
  onEdit,
  onDelete
}) {
  const isSchool = record.categoryGroup === 'School' || record.category === 'School Education';
  const isUG = record.type === 'ug';
  const isPG = record.type === 'pg';
  const isCompleted = record.status === 'Completed';

  // Determine Icon & Icon container styling
  let Icon = GraduationCap;
  let iconWrapperClass = 'bg-[#FF6B00]/10 border-[#FF6B00]/25 text-[#FF6B00]';

  if (record.type === 'school_early') {
    Icon = School;
    iconWrapperClass = 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-[#38BDF8]';
  } else if (record.type === 'school_10') {
    Icon = School;
    iconWrapperClass = 'bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-[#38BDF8]';
  } else if (record.type === 'school_12') {
    Icon = BookOpen;
    iconWrapperClass = 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400';
  } else if (record.type === 'ug') {
    Icon = GraduationCap;
    iconWrapperClass = 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]';
  } else if (record.type === 'pg') {
    Icon = GraduationCap;
    iconWrapperClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
  }

  // Count subjects for school
  const subjectCountText = Array.isArray(record.subjects) && record.subjects.length > 0
    ? `${record.subjects.length} Subjects`
    : '5 Subjects';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-[#2A374A] transition-all space-y-4 group">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconWrapperClass}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-text-h tracking-tight">
                {record.level}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20">
                {record.category}
              </span>
              {isActiveContext && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30">
                  Active Context
                </span>
              )}
            </div>

            <div className="text-xs text-text-light space-y-0.5">
              {/* Institution / Board line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Building className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                <span>{record.board || record.university}</span>
              </div>

              {/* School / Course name line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isSchool ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                    <span>{record.schoolName}</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                    <span>{record.course}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 self-end sm:self-start">
          {/* Status Badge */}
          {isCompleted ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Completed
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20">
              In Progress
            </span>
          )}

          <button
            type="button"
            onClick={() => onView(record)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-500" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(record)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(record)}
            className="p-1.5 px-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Bottom Metrics Bar (Grid matching screenshot) */}
      <div className="pt-3 border-t border-border/80">
        {/* Class 10 layout */}
        {record.type === 'school_10' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-text-light text-[11px] block">Passing Year</span>
              <span className="font-semibold text-text-h">{record.passingYear}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Subjects</span>
              <span className="font-semibold text-text-h">{subjectCountText}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Percentage</span>
              <span className="font-semibold text-text-h">{record.percentage ? `${record.percentage.toFixed(2)}%` : '-'}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Result Status</span>
              <span className="font-semibold text-text-h flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{record.resultStatus || 'Completed'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Class 12 layout (has Stream column) */}
        {record.type === 'school_12' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-text-light text-[11px] block">Passing Year</span>
              <span className="font-semibold text-text-h">{record.passingYear}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Stream</span>
              <span className="font-semibold text-text-h truncate block">{record.stream || 'Science (PCM)'}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Subjects</span>
              <span className="font-semibold text-text-h">{subjectCountText}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Percentage</span>
              <span className="font-semibold text-text-h">{record.percentage ? `${record.percentage.toFixed(2)}%` : '-'}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Result Status</span>
              <span className="font-semibold text-text-h flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{record.resultStatus || 'Completed'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Classes 1-9 layout */}
        {record.type === 'school_early' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-text-light text-[11px] block">Academic Year</span>
              <span className="font-semibold text-text-h">{record.academicYear}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Term / Assessment</span>
              <span className="font-semibold text-text-h">{record.termPeriod || 'Annual Exam'}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Percentage</span>
              <span className="font-semibold text-text-h">{record.percentage ? `${record.percentage.toFixed(2)}%` : '-'}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Result Status</span>
              <span className="font-semibold text-text-h flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{record.resultStatus || 'Completed'}</span>
              </span>
            </div>
          </div>
        )}

        {/* UG & PG layout (BCA, MCA, etc.) */}
        {(isUG || isPG) && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-text-light text-[11px] block">Admission Year</span>
              <span className="font-semibold text-text-h">{record.admissionYear}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Duration</span>
              <span className="font-semibold text-text-h">{record.durationText || `${record.totalSemesters} Semesters`}</span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">CGPA</span>
              <span className="font-semibold text-text-h">
                {record.cgpa !== null && record.cgpa !== undefined && record.cgpa !== ''
                  ? Number(record.cgpa).toFixed(2)
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Completed Semesters</span>
              <span className="font-semibold text-text-h">
                {record.completedSemestersRatio || `${record.completedSemesters || 0} / ${record.totalSemesters}`}
              </span>
            </div>
            <div>
              <span className="text-text-light text-[11px] block">Status</span>
              <span className="font-semibold text-text-h flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                />
                <span>{record.status}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
