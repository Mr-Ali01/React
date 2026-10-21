import React, { useState } from 'react';
import { Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';

const BOARDS = [
  'CBSE Board',
  'Telangana State Board of Intermediate Education (TSBIE)',
  'Andhra Pradesh Board of Intermediate Education (BIEAP)',
  'CISCE (ISC Class 12)',
  'Maharashtra State Board (HSC)',
  'Karnataka Department of Pre-University Education (Karnataka PUC)',
  'Tamil Nadu State Board',
  'NIOS (National Institute of Open Schooling)',
  'Other Higher Secondary Board'
];

const STREAMS = [
  'Science (PCM)',
  'Science (PCB)',
  'Science (PCMB)',
  'Commerce',
  'Commerce with Maths',
  'Arts / Humanities',
  'Vocational Stream'
];

const STREAM_DEFAULT_SUBJECTS = {
  'Science (PCM)': [
    { name: 'English Core', code: '301', maxMarks: 100, marksObtained: 92, grade: 'A1' },
    { name: 'Mathematics', code: '041', maxMarks: 100, marksObtained: 85, grade: 'A2' },
    { name: 'Physics', code: '042', maxMarks: 100, marksObtained: 88, grade: 'A1' },
    { name: 'Chemistry', code: '043', maxMarks: 100, marksObtained: 86, grade: 'A2' },
    { name: 'Computer Science', code: '083', maxMarks: 100, marksObtained: 90, grade: 'A1' }
  ],
  'Science (PCB)': [
    { name: 'English Core', code: '301', maxMarks: 100, marksObtained: 90, grade: 'A1' },
    { name: 'Biology', code: '044', maxMarks: 100, marksObtained: 92, grade: 'A1' },
    { name: 'Physics', code: '042', maxMarks: 100, marksObtained: 85, grade: 'A2' },
    { name: 'Chemistry', code: '043', maxMarks: 100, marksObtained: 88, grade: 'A1' },
    { name: 'Physical Education', code: '048', maxMarks: 100, marksObtained: 94, grade: 'A1' }
  ],
  Commerce: [
    { name: 'English Core', code: '301', maxMarks: 100, marksObtained: 88, grade: 'A1' },
    { name: 'Accountancy', code: '055', maxMarks: 100, marksObtained: 90, grade: 'A1' },
    { name: 'Business Studies', code: '054', maxMarks: 100, marksObtained: 87, grade: 'A2' },
    { name: 'Economics', code: '030', maxMarks: 100, marksObtained: 85, grade: 'A2' },
    { name: 'Mathematics', code: '041', maxMarks: 100, marksObtained: 82, grade: 'A2' }
  ]
};

export default function Class12Form({ initialData = {}, onSave, onCancel }) {
  const [board, setBoard] = useState(initialData.board || 'CBSE Board');
  const [schoolName, setSchoolName] = useState(initialData.schoolName || 'ABC Junior College, Hyderabad');
  const [city, setCity] = useState(initialData.city || 'Hyderabad');
  const [state, setState] = useState(initialData.state || 'Telangana');
  const [stream, setStream] = useState(initialData.stream || 'Science (PCM)');
  const [passingYear, setPassingYear] = useState(initialData.passingYear || 2022);
  const [academicYear, setAcademicYear] = useState(initialData.academicYear || '2021-2022');
  const [rollNumber, setRollNumber] = useState(initialData.rollNumber || 'CBSE-12-920148');
  const [status, setStatus] = useState(initialData.status || 'Completed');

  const [subjects, setSubjects] = useState(
    Array.isArray(initialData.subjects) && initialData.subjects.length > 0
      ? initialData.subjects
      : STREAM_DEFAULT_SUBJECTS['Science (PCM)']
  );

  const [errors, setErrors] = useState({});

  // Auto-calculated summary
  const totalMarks = subjects.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0);
  const maxMarks = subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);
  const percentage = maxMarks > 0 ? Number(((totalMarks / maxMarks) * 100).toFixed(2)) : 0;

  const handleStreamChange = (newStream) => {
    setStream(newStream);
    if (!initialData.id && STREAM_DEFAULT_SUBJECTS[newStream]) {
      setSubjects(STREAM_DEFAULT_SUBJECTS[newStream]);
    }
  };

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

    if (!schoolName.trim()) newErrors.schoolName = 'College / School name is required';
    if (!passingYear) newErrors.passingYear = 'Passing year is required';
    if (subjects.some((s) => !s.name.trim())) {
      newErrors.subjects = 'All subjects must have a name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      type: 'school_12',
      level: 'Class 12',
      category: 'School Education',
      categoryGroup: 'School',
      board,
      schoolName: schoolName.trim(),
      city: city.trim(),
      state: state.trim(),
      stream,
      passingYear: Number(passingYear),
      academicYear: academicYear.trim(),
      rollNumber: rollNumber.trim(),
      status,
      resultStatus: status,
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      finalGrade: percentage >= 85 ? 'Distinction' : percentage >= 75 ? 'First Class' : percentage >= 60 ? 'Second Class' : 'Pass'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Board / Authority <span className="text-amber-500">*</span>
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
            Stream / Specialization <span className="text-amber-500">*</span>
          </label>
          <select
            value={stream}
            onChange={(e) => handleStreamChange(e.target.value)}
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          >
            {STREAMS.map((s) => (
              <option key={s} value={s} className="bg-card text-text-h">{s}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Junior College / School Name <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => {
              setSchoolName(e.target.value);
              if (errors.schoolName) setErrors({ ...errors, schoolName: null });
            }}
            placeholder="e.g., ABC Junior College, Hyderabad"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
          {errors.schoolName && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.schoolName}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Passing Year <span className="text-amber-500">*</span>
          </label>
          <input
            type="number"
            value={passingYear}
            onChange={(e) => setPassingYear(e.target.value)}
            placeholder="e.g., 2022"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Academic Session / Year
          </label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g., 2021-2022"
            className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-light mb-1.5">
            Hall Ticket / Roll Number
          </label>
          <input
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g., CBSE-12-920148"
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
                      placeholder="e.g., Physics"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 px-3">
                    <input
                      type="text"
                      value={sub.code || ''}
                      onChange={(e) => handleSubjectChange(idx, 'code', e.target.value)}
                      placeholder="042"
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
          Save Class 12 Record
        </button>
      </div>
    </form>
  );
}
