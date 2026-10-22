import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileDown,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  Download,
  Loader2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { downloadCalculatorPdf } from '../../services/calculatorPdfService';
import { roundAcademic } from '../../services/academicCalculationEngine';
import { useToast } from '../../context/ToastContext';

const GRADE_POINTS_MAP = {
  O: 10,
  S: 10, // Osmania University BCA/MCA standard 10-point tier
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0
};

const DEFAULT_SUBJECTS = [
  { id: '1', code: 'CS401PC', name: 'Database Management Systems', credits: '4', grade: 'A+' },
  { id: '2', code: 'CS402PC', name: 'Operating Systems', credits: '4', grade: 'O' },
  { id: '3', code: 'CS403PC', name: 'Java Programming', credits: '3', grade: 'A' },
  { id: '4', code: 'CS404PC', name: 'Computer Organization & Architecture', credits: '3', grade: 'B+' },
  { id: '5', code: 'CS405PC', name: 'Database Management Systems Lab', credits: '1.5', grade: 'O' },
  { id: '6', code: 'CS406PC', name: 'Operating Systems Lab', credits: '1.5', grade: 'A+' }
];

export default function ResultPdfGenerator() {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Student & University Metadata
  const [studentName, setStudentName] = useState('Rahul Sharma');
  const [rollNumber, setRollNumber] = useState('21071A0501');
  const [university, setUniversity] = useState('Jawaharlal Nehru Technological University Hyderabad');
  const [course, setCourse] = useState('B.Tech Computer Science and Engineering');
  const [semester, setSemester] = useState('Semester 4');
  const [regulation, setRegulation] = useState('R18 Regulations');

  // Subjects
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);

  const addSubject = () => {
    if (subjects.length >= 15) {
      showToast('Maximum 15 subjects allowed on single scorecard.');
      return;
    }
    const nextIdx = subjects.length + 1;
    setSubjects([
      ...subjects,
      {
        id: String(Date.now()),
        code: `SUB40${nextIdx}`,
        name: `Course Subject ${nextIdx}`,
        credits: '3',
        grade: 'A'
      }
    ]);
  };

  const removeSubject = (id) => {
    if (subjects.length <= 1) {
      showToast('At least one subject is required.');
      return;
    }
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const updateSubject = (id, field, value) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleReset = () => {
    setStudentName('Rahul Sharma');
    setRollNumber('21071A0501');
    setUniversity('Jawaharlal Nehru Technological University Hyderabad');
    setCourse('B.Tech Computer Science and Engineering');
    setSemester('Semester 4');
    setRegulation('R18 Regulations');
    setSubjects(DEFAULT_SUBJECTS);
    showToast('Reset to sample student record.');
  };

  // Computations
  const calculation = useMemo(() => {
    let totalCredits = 0;
    let earnedCredits = 0;
    let totalPoints = 0;
    let backlogCount = 0;

    const rowDetails = subjects.map((sub) => {
      const cr = parseFloat(sub.credits) || 0;
      const pts = GRADE_POINTS_MAP[sub.grade] !== undefined ? GRADE_POINTS_MAP[sub.grade] : 0;
      totalCredits += cr;
      if (pts > 0) {
        earnedCredits += cr;
      } else {
        backlogCount++;
      }
      totalPoints += cr * pts;

      return {
        ...sub,
        creditNum: cr,
        gradePoints: pts,
        earnedPoints: roundAcademic(cr * pts, 2)
      };
    });

    const sgpa = totalCredits > 0 ? roundAcademic(totalPoints / totalCredits, 2, 'HALF_UP') : 0;
    const percentage = roundAcademic(sgpa * 10, 2);

    let standing = 'First Class with Distinction';
    if (backlogCount > 0) standing = 'Pending Backlog Clearance';
    else if (sgpa >= 8.0) standing = 'First Class with Distinction';
    else if (sgpa >= 6.5) standing = 'First Class';
    else if (sgpa >= 5.5) standing = 'Second Class';
    else standing = 'Pass Division';

    return {
      totalCredits: roundAcademic(totalCredits, 1),
      earnedCredits: roundAcademic(earnedCredits, 1),
      totalPoints: roundAcademic(totalPoints, 2),
      backlogCount,
      sgpa,
      percentage,
      standing,
      rowDetails
    };
  }, [subjects]);

  const handleDownload = async () => {
    if (!studentName.trim()) {
      showToast('Please enter the student name.');
      return;
    }
    if (!rollNumber.trim()) {
      showToast('Please enter the hall ticket / roll number.');
      return;
    }
    if (subjects.length === 0 || calculation.totalCredits === 0) {
      showToast('Please enter at least one valid course subject.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        calculatorName: 'Academic Scorecard',
        title: `${course} Result Card`,
        subtitle: `${semester} Official Grade Summary — ${regulation}`,
        university,
        course,
        regulation,
        semester,
        calculationMethod: 'CBCS Credit-Weighted Grade Point Average',
        score: calculation.sgpa.toFixed(2),
        scaleText: 'out of 10.0',
        scoreLabel: 'SGPA',
        metadata: {
          studentName: studentName.trim(),
          hallTicket: rollNumber.trim()
        },
        metrics: [
          { label: 'Student Name', value: studentName.trim() },
          { label: 'Hall Ticket No', value: rollNumber.trim() },
          { label: 'Total Credits', value: String(calculation.totalCredits) },
          { label: 'Credits Earned', value: String(calculation.earnedCredits) },
          { label: 'Percentage (approx)', value: `${calculation.percentage.toFixed(2)}%` },
          { label: 'Status', value: calculation.standing }
        ],
        subjects: calculation.rowDetails.map((s) => ({
          name: `${s.code} - ${s.name}`,
          credits: s.creditNum,
          val: `${s.grade} (${s.gradePoints} pts)`
        })),
        standing: {
          text: calculation.standing,
          narrative: calculation.backlogCount === 0
            ? 'Candidate has successfully completed all registered course requirements for the semester.'
            : 'Candidate has backlog papers pending in the examination session.'
        },
        filename: `${rollNumber.trim()}_${semester.replace(/\s+/g, '_')}_Result.pdf`
      };

      const res = await downloadCalculatorPdf(payload);
      if (res.success) {
        showToast('PDF Scorecard downloaded successfully!');
      } else {
        showToast(res.error || 'Failed to generate PDF document.');
      }
    } catch (err) {
      console.error('PDF Generation Failure:', err);
      showToast('Error generating PDF document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-start">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li>
              <Link to="/calculators" className="hover:text-accent transition-colors">Calculators & Tools</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">Result PDF Generator</li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-3">
                <FileDown className="w-3.5 h-3.5" />
                <span>Client-Side Document Export</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Result PDF Scorecard Generator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Enter your semester grades to generate and download a clean, vector-formatted academic transcript and grade scorecard in PDF format.
              </p>
            </div>

            {/* Student & Academic Info */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-2">
                1. Student & Institutional Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="student-name-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Student Full Name
                  </label>
                  <input
                    id="student-name-input"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="hall-ticket-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Hall Ticket / Roll Number
                  </label>
                  <input
                    id="hall-ticket-input"
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 21071A0501"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="university-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    University / Institute Name
                  </label>
                  <input
                    id="university-input"
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. Osmania University"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="degree-course-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Degree Course / Branch
                  </label>
                  <input
                    id="degree-course-input"
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="semester-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Semester / Academic Term
                  </label>
                  <input
                    id="semester-input"
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Semester 4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="regulation-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Regulation
                  </label>
                  <input
                    id="regulation-input"
                    type="text"
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    placeholder="e.g. R18 / CBCS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Course Subjects Table */}
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E2A35]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Registered Course Subjects ({subjects.length})
                </h2>
                <button
                  type="button"
                  onClick={addSubject}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#222E3C] hover:border-accent text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-accent transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C]"
                  >
                    <div className="w-full sm:w-28">
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Code</label>
                      <input
                        type="text"
                        value={sub.code}
                        onChange={(e) => updateSubject(sub.id, 'code', e.target.value)}
                        placeholder="CS401PC"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-full sm:flex-grow">
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Subject Name</label>
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                        placeholder="Subject Name"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-full sm:w-20">
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Credits</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={sub.credits}
                        onChange={(e) => updateSubject(sub.id, 'credits', e.target.value)}
                        placeholder="4"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-semibold text-slate-900 dark:text-white text-center"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Grade</label>
                      <select
                        value={sub.grade}
                        onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#222E3C] bg-white dark:bg-[#111418] text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                      >
                        {Object.keys(GRADE_POINTS_MAP).map((gr) => (
                          <option key={gr} value={gr}>
                            {gr} ({GRADE_POINTS_MAP[gr]} pts)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSubject(sub.id)}
                      disabled={subjects.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none transition-colors self-end sm:self-center mt-1 sm:mt-0"
                      title="Remove Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scorecard Summary & Download */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#1E2A35] pb-3">
                Scorecard Summary
              </h2>

              {/* SGPA Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-orange-500/5 to-transparent border border-blue-500/20 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Computed SGPA
                </span>
                <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {calculation.sgpa.toFixed(2)}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Equivalent Percentage: <strong className="text-accent">{calculation.percentage.toFixed(2)}%</strong>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{studentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{rollNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Total Credits:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{calculation.totalCredits}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Earned Credits:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{calculation.earnedCredits}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E2A35]">
                  <span className="text-slate-500">Backlogs:</span>
                  <span className={`font-bold ${calculation.backlogCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {calculation.backlogCount}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Standing:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{calculation.standing}</span>
                </div>
              </div>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling PDF Document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF Scorecard</span>
                  </>
                )}
              </button>

              {/* Privacy Notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-[#222E3C] text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  100% Client-Side Privacy: Your student details and result data are rendered directly into the PDF in your browser and are never uploaded to any server.
                </span>
              </div>

              {/* Navigation Links */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  to="/calculators/sgpa"
                  className="text-accent hover:underline font-semibold"
                >
                  SGPA Calculator
                </Link>
                <Link
                  to="/calculators"
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  All Tools
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
