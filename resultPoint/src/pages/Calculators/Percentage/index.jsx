import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Info,
  PlusCircle,
  RotateCcw,
  BarChart2,
  ArrowRight,
  Trash2,
  Percent
} from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import ResultGaugeCard from '../ResultGaugeCard';
import CalculatorPageHeader from '../CalculatorPageHeader';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { saveCalculationToHistory } from '../../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../../services/calculationSaveService';

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Mathematics - I', maxMarks: 100, obtainedMarks: 85 },
  { id: '2', name: 'Engineering Physics', maxMarks: 100, obtainedMarks: 78 },
  { id: '3', name: 'Programming for Problem Solving', maxMarks: 100, obtainedMarks: 92 },
  { id: '4', name: 'Engineering Graphics', maxMarks: 100, obtainedMarks: 76 },
  { id: '5', name: 'Environmental Science', maxMarks: 100, obtainedMarks: 88 }
];

const GRADE_RANGES = [
  { range: '90 - 100', grade: 'A+', desc: 'Outstanding' },
  { range: '80 - 89', grade: 'A', desc: 'Excellent' },
  { range: '70 - 79', grade: 'B+', desc: 'Very Good' },
  { range: '60 - 69', grade: 'B', desc: 'Good' },
  { range: '50 - 59', grade: 'C', desc: 'Average' },
  { range: '40 - 49', grade: 'D', desc: 'Pass' },
  { range: '0 - 39', grade: 'F', desc: 'Fail', isDanger: true }
];

export default function PercentageCalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [university, setUniversity] = useState('jntuh');
  const [course, setCourse] = useState('btech-cse');
  const [regulation, setRegulation] = useState('r18');
  const [semester, setSemester] = useState('sem1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');

  const handleAddSubject = () => {
    if (subjects.length >= 12) return;
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Subject ${prev.length + 1}`, maxMarks: 100, obtainedMarks: 80 }
    ]);
    showToast(`Subject ${subjects.length + 1} added`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required for percentage calculation.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Subject removed');
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === 'name') return { ...s, name: value };
        const parsed = parseFloat(value);
        const numVal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
        return { ...s, [field]: numVal };
      })
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_SUBJECTS);
    showToast('Form reset to default marks');
  };

  // Live Metrics Calculation
  const metrics = useMemo(() => {
    let totalMax = 0;
    let totalObtained = 0;

    subjects.forEach((s) => {
      totalMax += s.maxMarks || 0;
      totalObtained += s.obtainedMarks || 0;
    });

    const percent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const roundedPercent = parseFloat(percent.toFixed(2));

    let letterGrade = 'F';
    if (roundedPercent >= 90) letterGrade = 'A+';
    else if (roundedPercent >= 80) letterGrade = 'A';
    else if (roundedPercent >= 70) letterGrade = 'B+';
    else if (roundedPercent >= 60) letterGrade = 'B';
    else if (roundedPercent >= 50) letterGrade = 'C';
    else if (roundedPercent >= 40) letterGrade = 'D';

    return {
      totalSubjects: subjects.length,
      totalMax,
      totalObtained,
      percent: roundedPercent,
      letterGrade
    };
  }, [subjects]);

  // Standing & Narrative Feedback
  const standing = useMemo(() => {
    const p = metrics.percent;
    if (p >= 90) {
      return { icon: '🏆', text: 'Outstanding Performance', narrative: "Outstanding! You've achieved top-tier academic scores.", tips: 'Maintain your consistency and prepare for competitive exams and scholarships.' };
    }
    if (p >= 80) {
      return { icon: '📊', text: 'Excellent Performance', narrative: 'Great! You have secured a strong percentage.', tips: 'Focus on weak subjects and practice regularly to score even higher.' };
    }
    if (p >= 70) {
      return { icon: '📈', text: 'Very Good Performance', narrative: 'Solid results! A focused effort on numerical topics can elevate your score.', tips: 'Spend more revision time on laboratory and problem-solving topics.' };
    }
    if (p >= 60) {
      return { icon: '⚖️', text: 'Good Performance', narrative: 'Good progress! Form daily study schedules to push into distinction range.', tips: 'Dedicate regular weekend mock test revisions for core subjects.' };
    }
    if (p >= 50) {
      return { icon: '⚖️', text: 'Average Performance', narrative: 'Consistent effort in upcoming tests will lift your overall score.', tips: 'Form study circles and clarify doubts ahead of internal evaluations.' };
    }
    if (p >= 40) {
      return { icon: '⚠️', text: 'Pass', narrative: 'Work closely with academic guides to improve your subject fundamentals.', tips: 'Review previous years question papers to grasp essential topics.' };
    }
    return { icon: '⚠️', text: 'Needs Improvement', narrative: 'Revisit core topics and seek faculty guidance before subsequent exams.', tips: 'Focus on foundation chapters and request one-on-one remedial sessions.' };
  }, [metrics.percent]);

  const resultCardsData = [
    { label: 'Total Subjects', value: metrics.totalSubjects },
    { label: 'Total Maximum Marks', value: Math.round(metrics.totalMax) },
    { label: 'Total Obtained Marks', value: Math.round(metrics.totalObtained) },
    { label: 'Percentage', value: `${metrics.percent.toFixed(2)}%`, highlight: true },
    { label: 'Grade', value: metrics.letterGrade }
  ];

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'Percentage Calculator',
      title: 'Percentage Evaluation',
      score: `${metrics.percent.toFixed(2)}%`,
      scale: '100%',
      result: `${metrics.percent.toFixed(2)}% (Grade ${metrics.letterGrade})`,
      standing: standing?.text || 'Good',
      summary: `Total Obtained: ${Math.round(metrics.totalObtained)}/${Math.round(metrics.totalMax)} | Grade: ${metrics.letterGrade} | ${metrics.percent.toFixed(2)}%`,
      data: {
        percent: metrics.percent,
        totalMax: metrics.totalMax,
        totalObtained: metrics.totalObtained,
        letterGrade: metrics.letterGrade,
        totalSubjects: metrics.totalSubjects,
        university,
        course,
        regulation,
        semester,
        subjects,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('Percentage calculation saved to your history!');
      } else {
        showToast(res.error || 'Failed to save calculation');
      }
    } else {
      setPendingCalc(calcRecord);
      calculationSaveService.setPendingCalculation(calcRecord);
      setIsModalOpen(true);
    }
  };

  const handleCalculate = () => {
    if (!subjects || subjects.length === 0) {
      setValidationError('At least one subject is required for calculation.');
      return;
    }
    const invalid = subjects.some(
      (s) => !s.maxMarks || parseFloat(s.maxMarks) <= 0 || s.obtainedMarks === '' || parseFloat(s.obtainedMarks) < 0 || parseFloat(s.obtainedMarks) > parseFloat(s.maxMarks)
    );
    if (invalid) {
      setValidationError('Please enter valid marks. Obtained marks cannot exceed maximum marks.');
      return;
    }
    setValidationError('');
    setIsResultModalOpen(true);
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">Percentage Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Percentage Calculator"
          description="Convert your marks to percentage easily and accurately"
          icon={Percent}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="(Total Obtained Marks ÷ Total Marks) × 100"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights percentage) */}
          <CalculatorDirectorySidebar activeTool="percentage" />

          {/* Center Column: Form */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              {/* Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select University / Board</label>
                  <div className="relative">
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="jntuh">JNTU Hyderabad</option>
                      <option value="anna">Anna University</option>
                      <option value="osmania">Osmania University</option>
                      <option value="generic">Standard CBSE / State Board</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Course / Class</label>
                  <div className="relative">
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="btech-cse">B.Tech - Computer Science</option>
                      <option value="btech-ece">B.Tech - Electronics & Comm</option>
                      <option value="btech-it">B.Tech - Information Tech</option>
                      <option value="btech-mech">B.Tech - Mechanical Engg</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Regulation</label>
                  <div className="relative">
                    <select
                      value={regulation}
                      onChange={(e) => setRegulation(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="r18">R18</option>
                      <option value="r22">R22</option>
                      <option value="r16">R16</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Semester (Optional)</label>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="sem1">Semester 1</option>
                      <option value="sem2">Semester 2</option>
                      <option value="sem3">Semester 3</option>
                      <option value="sem4">Semester 4</option>
                      <option value="sem5">Semester 5</option>
                      <option value="sem6">Semester 6</option>
                      <option value="sem7">Semester 7</option>
                      <option value="sem8">Semester 8</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>
              </div>

              {/* Information Banner */}
              <div className="my-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                <Info className="w-4 h-4 text-brandBlue shrink-0" />
                <span>Enter your subject-wise marks to calculate your percentage accurately.</span>
              </div>

              <div className="flex items-center justify-between pb-2.5">
                <h3 className="text-sm font-bold text-text-h">Enter Subject Marks</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
                  {subjects.length} Subjects
                </span>
              </div>

              {/* Subject Marks Rows Form */}
              <div className="space-y-2 mt-2">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/50">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">SUBJECT NAME</div>
                  <div className="col-span-2 text-center">MAX MARKS</div>
                  <div className="col-span-2 text-center">OBTAINED</div>
                  <div className="col-span-1 text-center">PERCENT</div>
                  <div className="col-span-1 text-center">ACTION</div>
                </div>

                {subjects.map((sub, idx) => {
                  const singlePercent = sub.maxMarks > 0 ? ((sub.obtainedMarks / sub.maxMarks) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={sub.id} className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/40 transition-colors">
                      {/* Desktop Row View */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-center font-bold text-xs text-text-light">{idx + 1}</div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                            placeholder="Subject Name"
                            className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={sub.maxMarks}
                            onChange={(e) => handleSubjectChange(sub.id, 'maxMarks', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            max={sub.maxMarks}
                            value={sub.obtainedMarks}
                            onChange={(e) => handleSubjectChange(sub.id, 'obtainedMarks', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="col-span-1 text-center font-extrabold text-xs text-text-h bg-orange-500/10 border border-border py-1.5 rounded-lg">
                          {singlePercent}%
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.id)}
                            className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                            aria-label={`Delete row ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Row View */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-h">#{idx + 1} Subject</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.id)}
                            className="text-xs font-semibold text-brandPink flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                          placeholder="Subject Name"
                          className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                        />
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="text-[10px] text-text-light font-semibold block mb-0.5">Max Marks</label>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={sub.maxMarks}
                              onChange={(e) => handleSubjectChange(sub.id, 'maxMarks', e.target.value)}
                              className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-text-light font-semibold block mb-0.5">Obtained</label>
                            <input
                              type="number"
                              min="0"
                              max={sub.maxMarks}
                              value={sub.obtainedMarks}
                              onChange={(e) => handleSubjectChange(sub.id, 'obtainedMarks', e.target.value)}
                              className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-text-light font-semibold block mb-0.5">Percent</label>
                            <div className="calc-input w-full py-1.5 text-center rounded-lg text-xs font-extrabold bg-orange-500/10 text-text-h">
                              {singlePercent}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Subject Row */}
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={handleAddSubject}
                  disabled={subjects.length >= 12}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/70 bg-accent-soft/40 hover:bg-accent-soft text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Another Subject</span>
                </button>
                {validationError && (
                  <p className="text-[11px] text-brandPink mt-1.5 text-center font-medium">{validationError}</p>
                )}
              </div>

              {/* Grading Reference Badges */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-h">
                    Grading Reference (Percentage Range)
                  </h4>
                  <span className="text-[11px] text-text-light font-medium">10 Point Scale</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {GRADE_RANGES.map((item) => (
                    <div key={item.range} className="p-2 rounded-xl border border-border bg-card text-center">
                      <div className="text-[11px] font-bold text-text-m">{item.range}</div>
                      <div className={`text-xs font-extrabold mt-0.5 ${item.isDanger ? 'text-brandPink' : 'text-accent'}`}>
                        {item.grade}
                      </div>
                      <div className="text-[9px] text-text-light truncate mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[10.5px] text-text-m italic">
                  Note: Grading may vary based on your university rules and regulation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-xs font-semibold text-text-m hover:text-text-h transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Calculate Percentage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Reusable Result Gauge Card */}
          <ResultGaugeCard
            score={metrics.percent}
            maxScale={100}
            title="YOUR PERCENTAGE RESULT"
            metrics={resultCardsData}
            standing={standing}
            isMobileModalOpen={isResultModalOpen}
            onCloseMobileModal={() => setIsResultModalOpen(false)}
            metadata={{
              university: university.toUpperCase(),
              regulation: regulation.toUpperCase(),
              course: course.toUpperCase(),
              semester: semester.toUpperCase(),
              calculationMethod: 'Sum of Obtained / Sum of Maximum Marks',
              totalSubjects: subjects.length
            }}
            subjectRows={subjects.map((s, idx) => {
              const max = parseFloat(s.maxMarks) || 100;
              const obt = parseFloat(s.obtainedMarks) || 0;
              const pct = max > 0 ? ((obt / max) * 100).toFixed(1) : '0.0';
              return {
                num: idx + 1,
                name: s.name || `Subject ${idx + 1}`,
                maxMarks: Math.round(max),
                obtainedMarks: Math.round(obt),
                percentage: `${pct}%`
              };
            })}
            pdfData={{
              calculatorName: 'Percentage Result Card',
              subtitle: 'Calculated using your subject-wise marks distribution',
              filename: 'ResultPoint_Percentage_Result.pdf',
              score: `${metrics.percent.toFixed(2)}%`,
              maxScale: '100%',
              standing: standing?.text,
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase(),
                course: course.toUpperCase(),
                semester: semester.toUpperCase(),
                calculationMethod: 'Percentage Calculation',
                totalMarks: `${metrics.totalObtained} / ${metrics.totalMax}`
              },
              subjectRows: subjects.map((s, idx) => {
                const max = parseFloat(s.maxMarks) || 100;
                const obt = parseFloat(s.obtainedMarks) || 0;
                const pct = max > 0 ? ((obt / max) * 100).toFixed(1) : '0.0';
                return {
                  num: idx + 1,
                  name: s.name || `Subject ${idx + 1}`,
                  maxMarks: Math.round(max),
                  obtainedMarks: Math.round(obt),
                  percentage: `${pct}%`
                };
              }),
              metrics: [
                { label: 'Total Obtained', value: metrics.totalObtained },
                { label: 'Maximum Marks', value: metrics.totalMax },
                { label: 'Percentage', value: `${metrics.percent.toFixed(2)}%` },
                { label: 'Equivalent Grade', value: metrics.letterGrade }
              ]
            }}
            shareData={{
              toolName: 'Percentage Calculator',
              score: `${metrics.percent.toFixed(2)}%`,
              scaleText: `(${metrics.totalObtained} / ${metrics.totalMax} marks)`,
              metrics: [
                { label: 'Total Marks', value: `${metrics.totalObtained} / ${metrics.totalMax}` },
                { label: 'Percentage', value: `${metrics.percent.toFixed(2)}%` },
                { label: 'Equivalent Grade', value: metrics.letterGrade }
              ],
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase(),
                semester: semester.toUpperCase()
              }
            }}
            onSave={(record) => {
              setPendingCalc(record);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Grouped Bar Chart (Desktop / Tablet Only) */}
        <section className="hidden lg:block rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4" aria-label="Subject-wise Marks Analysis">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">Subject-wise Marks Analysis</h3>
              <p className="text-xs text-text-m mt-0.5">Compare your obtained marks with maximum marks.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-accent"></span>
                <span className="text-text-h">Obtained Marks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-orange-200 dark:bg-orange-950/60 border border-border"></span>
                <span className="text-text-m">Maximum Marks</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] pt-2">
              <svg className="w-full h-56 overflow-visible" viewBox="0 0 760 210">
                <line x1="40" y1="20" x2="740" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">120</text>
                <line x1="40" y1="45" x2="740" y2="45" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="49" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">100</text>
                <line x1="40" y1="75" x2="740" y2="75" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="79" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">80</text>
                <line x1="40" y1="105" x2="740" y2="105" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="109" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">60</text>
                <line x1="40" y1="135" x2="740" y2="135" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="139" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">40</text>
                <line x1="40" y1="165" x2="740" y2="165" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="169" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">20</text>
                <line x1="40" y1="180" x2="740" y2="180" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="25" y="184" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <g>
                  {subjects.map((sub, i) => {
                    const count = subjects.length;
                    const availableWidth = 690;
                    const startX = 45;
                    const slotWidth = availableWidth / count;
                    const singleBarWidth = Math.min(28, slotWidth * 0.28);
                    const groupGap = 4;
                    const scaleFactor = 160 / 120;
                    const baseY = 180;

                    const groupCenterX = startX + i * slotWidth + slotWidth / 2;
                    const obtainedX = groupCenterX - singleBarWidth - groupGap / 2;
                    const maxX = groupCenterX + groupGap / 2;

                    const obtainedHeight = Math.max(2, sub.obtainedMarks * scaleFactor);
                    const maxHeight = Math.max(2, sub.maxMarks * scaleFactor);

                    const obtainedY = baseY - obtainedHeight;
                    const maxY = baseY - maxHeight;

                    return (
                      <g key={sub.id}>
                        {/* Obtained Bar (Orange) */}
                        <text x={obtainedX + singleBarWidth / 2} y={obtainedY - 6} textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="currentColor" className="text-text-h">
                          {sub.obtainedMarks}
                        </text>
                        <rect x={obtainedX} y={obtainedY} width={singleBarWidth} height={obtainedHeight} rx="4" fill="#FF7300" className="transition-all duration-300" />

                        {/* Max Marks Bar (Tint) */}
                        <text x={maxX + singleBarWidth / 2} y={maxY - 6} textAnchor="middle" fontSize="9.5" fontWeight="500" fill="currentColor" className="text-text-m">
                          {sub.maxMarks}
                        </text>
                        <rect x={maxX} y={maxY} width={singleBarWidth} height={maxHeight} rx="4" fill="#FED7AA" className="dark:fill-orange-950/60 transition-all duration-300" />

                        {/* Subject Title */}
                        <text x={groupCenterX} y={198} textAnchor="middle" fontSize="9.5" fontWeight="500" fill="currentColor" className="text-text-m">
                          {sub.name.length > 14 ? `${sub.name.substring(0, 12)}...` : sub.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* Reusable Bottom Explore Tools */}
        <ExploreMoreTools />
      </main>

      <SaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        calculationData={pendingCalc}
        onSaveSuccess={(saved) => {
          if (saved) {
            dispatch(saveCalculationToHistory(saved));
          }
        }}
      />
    </>
  );
}