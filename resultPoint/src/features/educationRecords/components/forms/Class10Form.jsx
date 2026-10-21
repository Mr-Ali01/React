import React, { useState } from 'react';
import { Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';

const BOARDS = [
  'CBSE Board',
  'ICSE Board',
  'State Board of Secondary Education (SSC)',
  'Telangana State Board (TS SSC)',
  'Andhra Pradesh State Board (AP SSC)',
  'Maharashtra State Board (MSBSHSE)',
  'Karnataka State Board (KSEEB)',
  'Tamil Nadu State Board',
  'NIOS (National Institute of Open Schooling)',
  'Other State Board'
];

const DEFAULT_SUBJECTS = [
  { name: 'English Communicative', code: '101', maxMarks: 100, marksObtained: 88, grade: 'A1' },
  { name: 'Mathematics', code: '041', maxMarks: 100, marksObtained: 82, grade: 'A2' },
  { name: 'Science', code: '086', maxMarks: 100, marksObtained: 79, grade: 'B1' },
  { name: 'Social Science', code: '087', maxMarks: 100, marksObtained: 85, grade: 'A2' },
  { name: 'Hindi Course-A', code: '002', maxMarks: 100, marksObtained: 78, grade: 'B1' }
];

export default function Class10Form({ initialData = {}, onSave, onCancel }) {
  const [board, setBoard] = useState(initialData.board || 'CBSE Board');
  const [schoolName, setSchoolName] = useState(initialData.schoolName || 'ABC High School, Hyderabad');
  const [city, setCity] = useState(initialData.city || 'Hyderabad');
  const [state, setState] = useState(initialData.state || 'Telangana');
  const [passingYear, setPassingYear] = useState(initialData.passingYear || 2020);
  const [academicYear, setAcademicYear] = useState(initialData.academicYear || '2019-2020');
  const [rollNumber, setRollNumber] = useState(initialData.rollNumber || 'CBSE-10-847291');
  const [status, setStatus] = useState(initialData.status || 'Completed');

  const [subjects, setSubjects] = useState(
    Array.isArray(initialData.subjects) && initialData.subjects.length > 0
      ? initialData.subjects
      : DEFAULT_SUBJECTS
  );

  const [errors, setErrors] = useState({});

  // Auto-calculated summary
  const totalMarks = subjects.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0);
  const maxMarks = subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
  const percentage = maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(2)) : 0;

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { name: '', code: '', maxMarks: 100, marksObtained: 0, grade: 'A1' }
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
    if (!passingYear) newErrors.passingYear = 'Passing year is required';
    if (subjects.some((s) => !s.name.trim())) {
      newErrors.subjects = 'All subjects must have a name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      type: 'school_10',
      level: 'Class 10',
      category: 'School Education',
      categoryGroup: 'School',
      board,
      schoolName: schoolName.trim(),
      city: city.trim(),
      state: state.trim(),
      passingYear: Number(passingYear),
      academicYear: academicYear.trim(),
      rollNumber: rollNumber.trim(),
      status,
      resultStatus: status,
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      finalGrade: percentage >= 90 ? 'A1' : percentage >= 80 ? 'A2' : percentage >= 70 ? 'B1' : percentage >= 60 ? 'B2' : 'Pass'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Board / Examination Authority <span className="text-amber-500">*</span>
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

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Passing Year <span className="text-amber-500">*</span>
          </label>
          <input
            type="number"
            value={passingYear}
            onChange={(e) => setPassingYear(e.target.value)}
            placeholder="e.g., 2020"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            School Name / Institution <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => {
              setSchoolName(e.target.value);
              if (errors.schoolName) setErrors({ ...errors, schoolName: null });
            }}
            placeholder="e.g., ABC High School, Hyderabad"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
          {errors.schoolName && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.schoolName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Academic Session / Year
          </label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g., 2019-2020"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Roll / Registration Number
          </label>
          <input
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g., CBSE-10-847291"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">City & State</label>
          <input
            type="text"
            value={`${city}, ${state}`}
            onChange={(e) => {
              const parts = e.target.value.split(',');
              setCity(parts[0]?.trim() || '');
              setState(parts[1]?.trim() || '');
            }}
            placeholder="e.g., Hyderabad, Telangana"
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
            <span>Subject Marks & Grades</span>
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
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3 w-24">Max Marks</th>
                <th className="py-2.5 px-3 w-24">Obtained</th>
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
                      type="text"
                      value={sub.code || ''}
                      onChange={(e) => handleSubjectChange(idx, 'code', e.target.value)}
                      placeholder="041"
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
                      placeholder="A1"
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

      {/* Calculated Result Preview Card */}
      <div className="p-4 rounded-xl bg-bg-sec border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-light block">Result Summary</span>
            <span className="text-base font-extrabold text-text-h">
              {percentage}% <span className="text-xs font-normal text-text-light">({totalMarks} / {maxMarks} Marks)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
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
          Save Class 10 Record
        </button>
      </div>
    </form>
  );
}
