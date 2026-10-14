import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Calculator,
  Info,
  PlusCircle,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Trash2,
  Bookmark,
  Lightbulb,
  X,
  Lock,
  Table,
  Binary,
  Percent,
  FileCheck,
  Award,
  Layers,
  Target,
  AlertTriangle,
  PieChart,
} from 'lucide-react';
import { UNIVERSITY_DATA } from '../../../data/universityData';

export default function CGPACalculator() {
  const [selectedUni, setSelectedUni] = useState('jntuh');
  const [selectedCourse, setSelectedCourse] = useState('btech-cse');
  const [selectedRegulation, setSelectedRegulation] = useState('r18');
  const [selectedSem, setSelectedSem] = useState('sem4');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Active Regulation Data
  const activeReg = useMemo(() => {
    return UNIVERSITY_DATA[selectedUni]?.courses[selectedCourse]?.regulations[selectedRegulation] || null;
  }, [selectedUni, selectedCourse, selectedRegulation]);

  // Initial subjects populated from regulation defaults
  const [subjects, setSubjects] = useState(() => {
    const defaults = UNIVERSITY_DATA.jntuh.courses['btech-cse'].regulations.r18.defaultSubjects;
    return defaults.map((s, idx) => ({ ...s, id: String(idx + 1) }));
  });

  const getPointsForGrade = (gradeSymbol) => {
    if (!activeReg) return 0;
    const found = activeReg.grades.find((g) => g.grade === gradeSymbol);
    return found ? found.points : 0;
  };

  const handleRegulationChange = (regKey) => {
    setSelectedRegulation(regKey);
    const newReg = UNIVERSITY_DATA[selectedUni]?.courses[selectedCourse]?.regulations[regKey];
    if (newReg?.defaultSubjects) {
      setSubjects(newReg.defaultSubjects.map((s, idx) => ({ ...s, id: String(Date.now() + idx) })));
    }
  };

  const handleUniversityChange = (uniKey) => {
    setSelectedUni(uniKey);
    const firstCourse = Object.keys(UNIVERSITY_DATA[uniKey]?.courses || {})[0];
    setSelectedCourse(firstCourse);
    const firstReg = Object.keys(UNIVERSITY_DATA[uniKey]?.courses[firstCourse]?.regulations || {})[0];
    handleRegulationChange(firstReg);
  };

  const handleAddSubject = () => {
    if (subjects.length >= 12) return;
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', credits: 3, grade: activeReg?.grades[0]?.grade || 'A' },
    ]);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required to compute CGPA.');
      setTimeout(() => setValidationError(''), 3000);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleReset = () => {
    if (activeReg?.defaultSubjects) {
      setSubjects(activeReg.defaultSubjects.map((s, idx) => ({ ...s, id: String(Date.now() + idx) })));
    }
  };

  // Live Metrics Calculation
  const metrics = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach((s) => {
      const cr = parseFloat(s.credits) || 0;
      const pts = getPointsForGrade(s.grade);
      totalCredits += cr;
      totalPoints += cr * pts;
    });

    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const percentage = cgpa * 10;

    let letterGrade = 'F';
    if (cgpa >= 9.0) letterGrade = 'A+';
    else if (cgpa >= 8.0) letterGrade = 'A';
    else if (cgpa >= 7.0) letterGrade = 'B+';
    else if (cgpa >= 6.0) letterGrade = 'B';
    else if (cgpa >= 5.0) letterGrade = 'C';
    else if (cgpa >= 4.0) letterGrade = 'D';

    return { totalCredits, totalPoints, cgpa, percentage, letterGrade };
  }, [subjects, activeReg]);

  // Standing Narrative & Status
  const standing = useMemo(() => {
    if (metrics.cgpa >= 8.5) {
      return {
        icon: '🏆',
        text: 'Excellent',
        narrative: 'You are doing great! Keep it up and maintain your performance.',
        tips: 'Focus on consistency and try to score more A grades in core subjects.',
      };
    }
    if (metrics.cgpa >= 7.5) {
      return {
        icon: '✨',
        text: 'Good Performance',
        narrative: 'Solid results! A slight push in high-credit papers can unlock distinction.',
        tips: 'Focus on laboratory components and internal assessments for extra point gains.',
      };
    }
    if (metrics.cgpa >= 6.0) {
      return {
        icon: '📈',
        text: 'Keep Improving',
        narrative: 'Consistent effort in upcoming semesters will bring your cumulative average higher.',
        tips: 'Allocate targeted revision hours toward core analytical and mathematical papers.',
      };
    }
    return {
      icon: '⚠️',
      text: 'Needs Improvement',
      narrative: 'Prioritize fundamentals and consult professors to convert lower credit grades.',
      tips: 'Meet academic mentors to clarify complex subjects before final examinations.',
    };
  }, [metrics.cgpa]);

  const circumference = 2 * Math.PI * 64; // 402.12
  const fraction = Math.max(0, Math.min(1, metrics.cgpa / 10));
  const strokeDashoffset = circumference - fraction * circumference;
  const currentChartY = 145 - (Math.max(0, Math.min(10, metrics.cgpa)) / 10) * 125;

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">CGPA Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        {/* Header Cards */}
        <section className="mb-5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
          <div className="sm:col-span-8 lg:col-span-9 rounded-2xl bg-card border border-border p-4 shadow-subtle flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-text-h tracking-tight">
                CGPA Calculator
              </h1>
              <p className="text-xs text-text-m mt-0.5">
                Calculate your CGPA based on your subject credits and grades
              </p>
            </div>
          </div>

          <div className="sm:col-span-4 lg:col-span-3 rounded-2xl bg-card border border-border p-4 shadow-subtle flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-light block">
                Calculation Method
              </span>
              <span className="text-xs font-bold text-text-h leading-tight block mt-0.5">
                Weighted Average (Credit Based)
              </span>
            </div>
          </div>
        </section>

        {/* 3-Column Calculator Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Tools Directory Sidebar */}
          <aside className="lg:col-span-2 xl:col-span-2 space-y-3.5" aria-label="Calculators Directory">
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="pb-2.5 mb-2.5 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-h">Calculators</h2>
              </div>

              <div className="space-y-0.5 mb-3">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
                  Academic Performance
                </span>
                <Link
                  to="/calculators/cgpa"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-soft text-accent border border-accent/25 transition-all"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>CGPA Calculator</span>
                </Link>
                <Link
                  to="/calculators/sgpa"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Table className="w-3.5 h-3.5 text-brandGreen" />
                  <span>SGPA Calculator</span>
                </Link>
                <Link
                  to="/calculators/gpa"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Binary className="w-3.5 h-3.5 text-brandBlue" />
                  <span>GPA Calculator</span>
                </Link>
                <Link
                  to="/calculators/percentage"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Percent className="w-3.5 h-3.5 text-brandPink" />
                  <span>Percentage Calculator</span>
                </Link>
              </div>

              <div className="space-y-0.5 mb-3">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
                  Grade & Marks
                </span>
                <Link
                  to="/calculators/grade"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <FileCheck className="w-3.5 h-3.5 text-brandPurple" />
                  <span>Grade Calculator</span>
                </Link>
                <Link
                  to="/calculators/marks-grade"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Award className="w-3.5 h-3.5 text-brandCyan" />
                  <span>Marks to Grade</span>
                </Link>
                <Link
                  to="/calculators/credite-calculate"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-brandBlue" />
                  <span>Credits Calculator</span>
                </Link>
              </div>

              <div className="space-y-0.5 mb-3">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
                  Academic Planning
                </span>
                <Link
                  to="/calculators/target-cgpa"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span>Target CGPA</span>
                </Link>
                <Link
                  to="/calculators/backlog"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-brandAmber" />
                  <span>Backlog Calculator</span>
                </Link>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
                  Analysis
                </span>
                <Link
                  to="/calculators/result-analysis"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all"
                >
                  <PieChart className="w-3.5 h-3.5 text-brandPink" />
                  <span>Result Analyzer</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-h">Not sure which to use?</h3>
                  <p className="text-[11px] text-text-m mt-1 leading-snug">
                    Check our guide to find the right tool for your regulation.
                  </p>
                  <Link
                    to="/resources"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline mt-2"
                  >
                    <span>View Guide</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Column: Inputs & Form */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select University</label>
                  <select
                    value={selectedUni}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {Object.keys(UNIVERSITY_DATA).map((key) => (
                      <option key={key} value={key}>{UNIVERSITY_DATA[key].name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {Object.keys(UNIVERSITY_DATA[selectedUni]?.courses || {}).map((key) => (
                      <option key={key} value={key}>{UNIVERSITY_DATA[selectedUni].courses[key].name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Regulation</label>
                  <select
                    value={selectedRegulation}
                    onChange={(e) => handleRegulationChange(e.target.value)}
                    className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {Object.keys(UNIVERSITY_DATA[selectedUni]?.courses[selectedCourse]?.regulations || {}).map((key) => (
                      <option key={key} value={key}>{key.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Semester</label>
                  <select
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {activeReg?.semesters?.map((sem) => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="my-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                <Info className="w-4 h-4 text-brandBlue shrink-0" />
                <span>Enter your subjects, credits and grades for the selected semester to calculate your CGPA.</span>
              </div>

              <div className="flex items-center justify-between pb-3">
                <h3 className="text-sm font-bold text-text-h">Enter Subject Details</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
                  {subjects.length} Subjects
                </span>
              </div>

              {/* Subject Rows Table */}
              <div className="space-y-2 mt-2">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/60">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">Subject Name</div>
                  <div className="col-span-2 text-center">Credits</div>
                  <div className="col-span-2 text-center">Grade</div>
                  <div className="col-span-1 text-center">Points</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {subjects.map((sub, idx) => (
                  <div key={sub.id} className="p-2.5 rounded-xl border border-border bg-bg-sec/50 hover:bg-bg-sec transition-colors">
                    {/* Desktop View */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-center font-bold text-xs text-text-light">{idx + 1}</div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                          placeholder="e.g. Data Structures"
                          className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={sub.credits}
                          onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                          className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={sub.grade}
                          onChange={(e) => handleSubjectChange(sub.id, 'grade', e.target.value)}
                          className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          {activeReg?.grades?.map((g) => (
                            <option key={g.grade} value={g.grade}>{g.grade}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 text-center font-extrabold text-xs text-text-h bg-card py-1.5 rounded-lg border border-border">
                        {getPointsForGrade(sub.grade)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                          aria-label="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile View */}
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
                          <label className="text-[10px] text-text-light font-semibold block mb-0.5">Credits</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={sub.credits}
                            onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-light font-semibold block mb-0.5">Grade</label>
                          <select
                            value={sub.grade}
                            onChange={(e) => handleSubjectChange(sub.id, 'grade', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          >
                            {activeReg?.grades?.map((g) => (
                              <option key={g.grade} value={g.grade}>{g.grade}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-text-light font-semibold block mb-0.5">Points</label>
                          <div className="calc-input w-full py-1.5 text-center rounded-lg text-xs font-extrabold bg-card">
                            {getPointsForGrade(sub.grade)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Subject Row Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAddSubject}
                  disabled={subjects.length >= 12}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/60 bg-accent-soft/30 hover:bg-accent-soft hover:border-accent text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Another Subject</span>
                </button>
                {validationError && (
                  <p className="text-[11px] text-brandPink mt-1 text-center font-medium">{validationError}</p>
                )}
              </div>

              {/* Grade System Badges */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-h">
                    Grade System ({activeReg?.name})
                  </h4>
                  <span className="text-[11px] text-text-light">10 Point Scale</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {activeReg?.grades?.map((item) => (
                    <div key={item.grade} className="p-2 rounded-xl border border-border bg-bg-sec text-center">
                      <div className="text-[11px] font-bold text-accent">{item.grade}</div>
                      <div className="text-xs font-extrabold text-text-h mt-0.5">{item.points}</div>
                      <div className="text-[9px] text-text-light truncate mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
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
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Calculate & Save</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Result Showcase */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20">
            <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-5 shadow-accent text-center relative overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Your CGPA Result
              </h3>

              <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="64" fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="12" />
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="transparent"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="progress-ring-circle"
                    strokeDasharray="402.12"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {metrics.cgpa.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-semibold text-white/80">out of 10</span>
                </div>
              </div>

              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <span>{standing.icon}</span>
                  <span>{standing.text}</span>
                </span>
              </div>

              <p className="text-[11px] text-white/90 leading-relaxed px-1">
                {standing.narrative}
              </p>

              <div className="mt-3.5 p-3 rounded-xl bg-card text-text-h border border-white/20 space-y-1.5 text-xs text-left shadow-subtle">
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Total Credits</span>
                  <span className="font-bold text-text-h">{metrics.totalCredits}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Total Grade Points</span>
                  <span className="font-bold text-text-h">{Math.round(metrics.totalPoints)}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>CGPA</span>
                  <span className="font-extrabold text-accent">{metrics.cgpa.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Percentage Equivalent</span>
                  <span className="font-bold text-text-h">{metrics.percentage.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Letter Grade</span>
                  <span className="font-bold text-text-h">{metrics.letterGrade}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-white text-accent hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle active:scale-95"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Result</span>
              </button>
            </div>

            {/* Semester History */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-h">Semester History</h4>
                <button type="button" className="text-[11px] font-semibold text-accent hover:underline">View All</button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-accent-soft/50 border border-accent/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-accent block text-xs">Semester 4</span>
                    <span className="text-[10px] text-text-m">24 Credits</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-text-h block text-xs">{metrics.cgpa.toFixed(2)}</span>
                    <span className="text-[9px] font-semibold text-accent uppercase tracking-wider">Current</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-bg-sec border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 3</span>
                    <span className="text-[10px] text-text-m">24 Credits</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="font-extrabold text-text-h text-xs">7.92</span>
                    <span className="text-brandGreen font-bold text-xs">↑</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-bg-sec border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 2</span>
                    <span className="text-[10px] text-text-m">24 Credits</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="font-extrabold text-text-h text-xs">7.35</span>
                    <span className="text-brandGreen font-bold text-xs">↑</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-bg-sec border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 1</span>
                    <span className="text-[10px] text-text-m">24 Credits</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="font-extrabold text-text-h text-xs">7.10</span>
                    <span className="text-brandGreen font-bold text-xs">↑</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Tips to Improve</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  {standing.tips}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Keep it up!</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Your CGPA is improving consistently.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Dynamic Trend Chart */}
        <section className="mt-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-text-h">Your Performance Trend</h3>
            <select className="calc-input px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer">
              <option value="cgpa">CGPA Trend</option>
              <option value="sgpa">SGPA Trend</option>
            </select>
          </div>

          <div className="mt-4 w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg className="w-full h-44" viewBox="0 0 700 170" preserveAspectRatio="none">
                <line x1="40" y1="20" x2="680" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
                <text x="25" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">10</text>

                <line x1="40" y1="55" x2="680" y2="55" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
                <text x="25" y="59" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">8</text>

                <line x1="40" y1="90" x2="680" y2="90" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
                <text x="25" y="94" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">6</text>

                <line x1="40" y1="125" x2="680" y2="125" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="1" />
                <text x="25" y="129" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>

                <line x1="40" y1="145" x2="680" y2="145" stroke="currentColor" className="text-border" strokeWidth="1" />
                <text x="25" y="149" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <defs>
                  <linearGradient id="calcChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path
                  d={`M 100 80 L 260 72 L 440 56 L 620 ${currentChartY} L 620 145 L 100 145 Z`}
                  fill="url(#calcChartGradient)"
                />
                <polyline
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={`100,80 260,72 440,56 620,${currentChartY}`}
                />

                <circle cx="100" cy="80" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
                <text x="100" y="68" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-h">7.10</text>
                <text x="100" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-m">Sem 1</text>

                <circle cx="260" cy="72" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
                <text x="260" y="60" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-h">7.35</text>
                <text x="260" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-m">Sem 2</text>

                <circle cx="440" cy="56" r="4.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
                <text x="440" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-h">7.92</text>
                <text x="440" y="160" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-m">Sem 3</text>

                <circle cx="620" cy={currentChartY} r="5.5" fill="#FF6B00" stroke="var(--card)" strokeWidth="2" />
                <text x="620" y={currentChartY - 12} textAnchor="middle" fontSize="10.5" fontWeight="extrabold" fill="#FF6B00">
                  {metrics.cgpa.toFixed(2)}
                </text>
                <text x="620" y="160" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" className="text-text-h">Sem 4</text>
              </svg>
            </div>
          </div>
        </section>
      </main>

      {/* Save Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-theme text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg text-text-m hover:text-text-h flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent mx-auto flex items-center justify-center mb-2.5">
              <Lock className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-text-h">Save Your Academic Record</h3>
            <p className="mt-1.5 text-xs text-text-m leading-relaxed">
              Create an account to save your academic result and track your progress across semesters.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-accent"
              >
                Create Account
              </button>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-border hover:bg-bg-sec text-text-h text-xs font-semibold transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}