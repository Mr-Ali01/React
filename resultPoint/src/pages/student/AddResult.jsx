import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, ArrowLeft, CheckCircle, Calculator } from 'lucide-react';
import { resultService } from '../../services/resultService';
import { useToast } from '../../context/ToastContext';

const GRADE_POINTS = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0
};

export default function AddResult() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [semesterNumber, setSemesterNumber] = useState(5);
  const [academicPeriod, setAcademicPeriod] = useState('Jan 2027');
  const [subjects, setSubjects] = useState([
    { id: '1', code: 'CS501', name: 'Cloud Architecture', credits: 4, grade: 'A+' },
    { id: '2', code: 'CS502', name: 'Advanced AI & Deep Learning', credits: 4, grade: 'O' },
    { id: '3', code: 'CS503', name: 'Software Quality Assurance', credits: 4, grade: 'A' },
    { id: '4', code: 'CS504', name: 'Cyber Security Essentials', credits: 3, grade: 'A+' },
    { id: '5', code: 'CS505', name: 'Full Stack Capstone Lab', credits: 3, grade: 'O' }
  ]);

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      {
        id: String(Date.now()),
        code: `CS50${subjects.length + 1}`,
        name: 'New Elective Course',
        credits: 3,
        grade: 'A'
      }
    ]);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Compute SGPA dynamically
  let totalCredits = 0;
  let weightedPoints = 0;
  subjects.forEach((s) => {
    const cred = Number(s.credits) || 0;
    const pts = GRADE_POINTS[s.grade] ?? 8;
    totalCredits += cred;
    weightedPoints += cred * pts;
  });
  const calculatedSGPA = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '0.00';

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedSubjects = subjects.map((s) => ({
      code: s.code,
      name: s.name,
      credits: Number(s.credits) || 3,
      grade: s.grade,
      points: GRADE_POINTS[s.grade] ?? 8
    }));

    resultService.addResult({
      semesterNumber: Number(semesterNumber),
      semesterTitle: `Semester ${semesterNumber}`,
      academicPeriod,
      sgpa: Number(calculatedSGPA),
      cgpa: Number(calculatedSGPA),
      creditsEarned: totalCredits,
      totalCredits,
      status: 'Passed',
      badgeColor: 'purple',
      subjects: formattedSubjects
    });

    showToast(`Semester ${semesterNumber} result saved successfully!`);
    navigate('/student/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-text-light hover:text-text-h flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h">
            Add Semester Result
          </h1>
          <p className="text-xs text-text-light">
            Enter semester subjects, credit weights, and letter grades.
          </p>
        </div>

        {/* Live Computed SGPA Preview */}
        <div className="text-right p-3 rounded-xl bg-accent/10 border border-accent/20">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
            Computed SGPA
          </span>
          <span className="text-xl font-extrabold text-text-h">
            {calculatedSGPA}
          </span>
          <span className="text-[10px] text-text-light block">
            {totalCredits} Total Credits
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Semester Meta Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border">
          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Semester Number
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Academic Examination Period
            </label>
            <input
              type="text"
              value={academicPeriod}
              onChange={(e) => setAcademicPeriod(e.target.value)}
              placeholder="e.g. Jan 2027"
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
          </div>
        </div>

        {/* Subject Rows Table */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
              Subjects & Marks
            </h3>
            <button
              type="button"
              onClick={handleAddSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="space-y-3">
            {subjects.map((sub, idx) => (
              <div
                key={sub.id}
                className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 rounded-xl bg-bg border border-border/70"
              >
                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="text"
                    value={sub.code}
                    onChange={(e) => handleSubjectChange(sub.id, 'code', e.target.value)}
                    placeholder="Code"
                    className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-center uppercase"
                  />
                </div>

                <div className="col-span-9 sm:col-span-5">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                    placeholder="Subject Name"
                    className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                    required
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <select
                    value={sub.credits}
                    onChange={(e) => handleSubjectChange(sub.id, 'credits', Number(e.target.value))}
                    className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <option key={c} value={c}>
                        {c} Credits
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-5 sm:col-span-2">
                  <select
                    value={sub.grade}
                    onChange={(e) => handleSubjectChange(sub.id, 'grade', e.target.value)}
                    className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-bold text-accent"
                  >
                    {Object.keys(GRADE_POINTS).map((g) => (
                      <option key={g} value={g}>
                        {g} ({GRADE_POINTS[g]} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3 sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub.id)}
                    disabled={subjects.length <= 1}
                    className="p-1.5 rounded-lg text-text-light hover:text-brandPink hover:bg-brandPink/10 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-h hover:bg-bg-sec border border-border transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Result & Update Records</span>
          </button>
        </div>
      </form>
    </div>
  );
}
