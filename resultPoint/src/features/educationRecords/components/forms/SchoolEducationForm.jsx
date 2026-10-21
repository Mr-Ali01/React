import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

const BOARDS = [
  'CBSE (Central Board of Secondary Education)',
  'ICSE (Council for the Indian School Certificate Examinations)',
  'State Board of Secondary Education',
  'IB (International Baccalaureate)',
  'Cambridge Assessment International Education (IGCSE)',
  'National Institute of Open Schooling (NIOS)',
  'Other / Autonomous School Board'
];

const CLASS_LEVELS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9'
];

const DEFAULT_SUBJECTS = [
  { name: 'English', maxMarks: 100, marksObtained: 85, grade: 'A' },
  { name: 'Mathematics', maxMarks: 100, marksObtained: 90, grade: 'A+' },
  { name: 'Science', maxMarks: 100, marksObtained: 88, grade: 'A' },
  { name: 'Social Studies', maxMarks: 100, marksObtained: 80, grade: 'B+' },
  { name: 'Second Language', maxMarks: 100, marksObtained: 82, grade: 'A' }
];

export default function SchoolEducationForm({ initialData = {}, onSave, onCancel }) {
  const [level, setLevel] = useState(initialData.level || 'Class 9');
  const [schoolName, setSchoolName] = useState(initialData.schoolName || '');
  const [board, setBoard] = useState(initialData.board || 'CBSE (Central Board of Secondary Education)');
  const [academicYear, setAcademicYear] = useState(initialData.academicYear || '2018-2019');
  const [termPeriod, setTermPeriod] = useState(initialData.termPeriod || 'Annual Examination');
  const [city, setCity] = useState(initialData.city || 'Hyderabad');
  const [state, setState] = useState(initialData.state || 'Telangana');
  const [status, setStatus] = useState(initialData.status || 'Completed');

  const [subjects, setSubjects] = useState(
    Array.isArray(initialData.subjects) && initialData.subjects.length > 0
      ? initialData.subjects
      : DEFAULT_SUBJECTS
  );

  const [errors, setErrors] = useState({});

  // Auto-calculate total and percentage
  const totalMarks = subjects.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0);
  const maxMarks = subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
  const percentage = maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(2)) : 0;

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { name: '', maxMarks: 100, marksObtained: 0, grade: 'A' }
    ]);
  };

  const handleRemoveSubject = (index) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!academicYear.trim()) newErrors.academicYear = 'Academic year is required';
    if (subjects.some((s) => !s.name.trim())) {
      newErrors.subjects = 'All subjects must have a name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      type: 'school_early',
      level,
      schoolName: schoolName.trim(),
      board,
      academicYear: academicYear.trim(),
      termPeriod: termPeriod.trim(),
      city: city.trim(),
      state: state.trim(),
      status,
      resultStatus: status,
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      finalGrade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : 'Pass'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Class / Grade Level <span className="text-amber-500">*</span>
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          >
            {CLASS_LEVELS.map((c) => (
              <option key={c} value={c} className="bg-card text-text-h">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Education Board <span className="text-amber-500">*</span>
          </label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          >
            {BOARDS.map((b) => (
              <option key={b} value={b} className="bg-card text-text-h">{b}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            School Name <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => {
              setSchoolName(e.target.value);
              if (errors.schoolName) setErrors({ ...errors, schoolName: null });
            }}
            placeholder="e.g., Delhi Public School, ABC Model High School"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
          {errors.schoolName && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.schoolName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Academic Year <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g., 2018-2019"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Term / Examination Period
          </label>
          <input
            type="text"
            value={termPeriod}
            onChange={(e) => setTermPeriod(e.target.value)}
            placeholder="e.g., Annual Examination, Final Term"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          >
            <option value="Completed" className="bg-card text-text-h">Completed</option>
            <option value="In Progress" className="bg-card text-text-h">In Progress</option>
          </select>
        </div>
      </div>

      {/* Subjects & Marks Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
            <span>Subjects & Assessments</span>
            <span className="text-[11px] font-semibold text-text-light bg-bg-sec px-2 py-0.5 rounded-full border border-border">
              {subjects.length} Subjects
            </span>
          </h4>
          <button
            type="button"
            onClick={handleAddSubject}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF6B00] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>

        {errors.subjects && <p className="text-xs text-rose-500 dark:text-rose-400">{errors.subjects}</p>}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs text-text-m">
            <thead className="bg-bg-sec text-text-light font-semibold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3 w-24">Max Marks</th>
                <th className="py-2.5 px-3 w-28">Obtained</th>
                <th className="py-2.5 px-3 w-24">Grade</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-bg-sec/40">
                  <td className="p-2 px-3">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                      placeholder="e.g., Mathematics"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 px-3">
                    <input
                      type="number"
                      value={sub.maxMarks}
                      onChange={(e) => handleSubjectChange(idx, 'maxMarks', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 px-3">
                    <input
                      type="number"
                      value={sub.marksObtained}
                      onChange={(e) => handleSubjectChange(idx, 'marksObtained', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 px-3">
                    <input
                      type="text"
                      value={sub.grade || ''}
                      onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
                      placeholder="A+"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      disabled={subjects.length <= 1}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculated Summary Preview Card */}
      <div className="p-4 rounded-xl bg-bg-sec border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Calculated Result</span>
            <span className="text-base font-extrabold text-text-h">
              {percentage}% <span className="text-xs font-normal text-text-light">({totalMarks} / {maxMarks} Marks)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer active:scale-95"
        >
          Save Education Record
        </button>
      </div>
    </form>
  );
}
