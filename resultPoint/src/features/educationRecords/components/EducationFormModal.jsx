import React from 'react';
import { X, School, BookOpen, Layers, GraduationCap, Award } from 'lucide-react';
import SchoolEducationForm from './forms/SchoolEducationForm.jsx';
import Class10Form from './forms/Class10Form.jsx';
import Class12Form from './forms/Class12Form.jsx';
import DegreeEducationForm from './forms/DegreeEducationForm.jsx';

export default function EducationFormModal({
  isOpen,
  levelKey, // 'school_early' | 'school_10' | 'school_12' | 'ug' | 'pg'
  initialData = null,
  onSave,
  onClose
}) {
  if (!isOpen) return null;

  // Determine Title, Subtitle, and Icon based on levelKey
  let title = 'Add Education Record';
  let subtitle = 'Enter your academic information and grades';
  let Icon = GraduationCap;
  let iconColor = 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20';

  if (levelKey === 'school_early') {
    title = initialData ? 'Edit School Record (Classes 1–9)' : 'Add School Education (Classes 1–9)';
    subtitle = 'Record grades, assessments, and marks for elementary and middle school';
    Icon = School;
    iconColor = 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
  } else if (levelKey === 'school_10') {
    title = initialData ? 'Edit Class 10 Record' : 'Add Class 10 (High School)';
    subtitle = '10th board details, scorecard, subjects, and percentage';
    Icon = BookOpen;
    iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  } else if (levelKey === 'school_12') {
    title = initialData ? 'Edit Class 12 Record' : 'Add Class 12 (Intermediate / Higher Secondary)';
    subtitle = '12th board details, stream (PCM/PCB/Commerce), marks, and percentage';
    Icon = Layers;
    iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (levelKey === 'ug') {
    title = initialData ? 'Edit Undergraduate Degree' : 'Add Undergraduate (UG) Degree';
    subtitle = 'Bachelor degree (BCA, B.Tech, B.Sc, B.Com) with Quick, Semester-wise, or Subject Entry';
    Icon = GraduationCap;
    iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (levelKey === 'pg') {
    title = initialData ? 'Edit Postgraduate Degree' : 'Add Postgraduate (PG) Degree';
    subtitle = 'Master degree (MCA, MBA, M.Sc, M.Com) with semester summaries or full subject marks';
    Icon = Award;
    iconColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-bg-sec/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-text-light">
                {subtitle}
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

        {/* Modal Body / Scrollable Form Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {levelKey === 'school_early' && (
            <SchoolEducationForm
              initialData={initialData || {}}
              onSave={onSave}
              onCancel={onClose}
            />
          )}

          {levelKey === 'school_10' && (
            <Class10Form
              initialData={initialData || {}}
              onSave={onSave}
              onCancel={onClose}
            />
          )}

          {levelKey === 'school_12' && (
            <Class12Form
              initialData={initialData || {}}
              onSave={onSave}
              onCancel={onClose}
            />
          )}

          {levelKey === 'ug' && (
            <DegreeEducationForm
              degreeType="ug"
              initialData={initialData || {}}
              onSave={onSave}
              onCancel={onClose}
            />
          )}

          {levelKey === 'pg' && (
            <DegreeEducationForm
              degreeType="pg"
              initialData={initialData || {}}
              onSave={onSave}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
