import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Info,
  RotateCcw,
  BarChart2,
  ArrowRight,
  PlusCircle,
  Trash2,
  RotateCw,
  TrendingUp,
  AlertCircle,
  Award,
  Target
} from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import ResultGaugeCard from '../ResultGaugeCard';
import CalculatorPageHeader from '../CalculatorPageHeader';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';

const DEFAULT_SEMESTER_RESULTS = [
  { id: '1', sem: 1, sgpa: 7.8, credits: 20, status: 'Cleared' },
  { id: '2', sem: 2, sgpa: 8.2, credits: 20, status: 'Cleared' },
  { id: '3', sem: 3, sgpa: 7.5, credits: 20, status: 'Cleared' },
  { id: '4', sem: 4, sgpa: 6.8, credits: 20, status: 'Cleared' },
  { id: '5', sem: 5, sgpa: 0.0, credits: 20, status: 'Backlog' },
  { id: '6', sem: 6, sgpa: 7.9, credits: 20, status: 'Cleared' },
  { id: '7', sem: 7, sgpa: 8.4, credits: 20, status: 'Cleared' },
  { id: '8', sem: 8, sgpa: '', credits: '', status: 'Not Attempted' }
];

export default function ResultAnalysis() {
  const [university, setUniversity] = useState('jntuh');
  const [regulation, setRegulation] = useState('r18');
  const [course, setCourse] = useState('btech-cse');
  const [totalSemestersConfigured, setTotalSemestersConfigured] = useState(8);
  const [semesters, setSemesters] = useState(DEFAULT_SEMESTER_RESULTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { showToast } = useToast();

  const handleTotalSemestersChange = (val) => {
    const total = parseInt(val, 10) || 8;
    setTotalSemestersConfigured(total);

    setSemesters((prev) => {
      let updated = [...prev];
      while (updated.length < total) {
        updated.push({
          id: String(Date.now() + updated.length),
          sem: updated.length + 1,
          sgpa: '',
          credits: '',
          status: 'Not Attempted'
        });
      }
      return updated.slice(0, total);
    });
  };

  const handleSemesterChange = (id, field, value) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        if (field === 'sgpa') {
          if (value === '' || value === null) updated.status = 'Not Attempted';
          else if (parseFloat(value) === 0) updated.status = 'Backlog';
          else updated.status = 'Cleared';
        }
        return updated;
      })
    );
  };

  const handleAddSemester = () => {
    if (semesters.length >= totalSemestersConfigured) return;
    setSemesters((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sem: prev.length + 1,
        sgpa: 7.5,
        credits: 20,
        status: 'Cleared'
      }
    ]);
    showToast(`Added Semester ${semesters.length + 1}`);
  };

  const handleRemoveSemester = (id) => {
    if (semesters.length <= 1) {
      setValidationError('At least one semester entry is required.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSemesters((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, sem: idx + 1 }));
    });
    showToast('Semester row removed');
  };

  const handleLoadSampleData = () => {
    setSemesters(DEFAULT_SEMESTER_RESULTS);
    setTotalSemestersConfigured(8);
    setValidationError('');
    showToast('Sample academic dataset loaded successfully!');
  };

  const handleReset = () => {
    setSemesters([
      { id: '1', sem: 1, sgpa: '', credits: '', status: 'Not Attempted' },
      { id: '2', sem: 2, sgpa: '', credits: '', status: 'Not Attempted' },
      { id: '3', sem: 3, sgpa: '', credits: '', status: 'Not Attempted' },
      { id: '4', sem: 4, sgpa: '', credits: '', status: 'Not Attempted' }
    ]);
    setTotalSemestersConfigured(4);
    setValidationError('');
    showToast('Analyzer reset to fresh blank form.');
  };

  // Performance Analysis Metrics Calculation
  const metrics = useMemo(() => {
    let totalWeightedPoints = 0;
    let totalAttemptedCredits = 0;
    let completedCount = 0;
    let backlogs = 0;

    let validSgpas = [];
    let clearedSgpas = [];
    let bestSem = null;
    let bestSgpaVal = -1;
    let worstSem = null;
    let worstSgpaVal = 999;

    let hasError = false;

    semesters.forEach((item) => {
      if (item.sgpa !== '' && item.sgpa !== null && !isNaN(item.sgpa)) {
        const sgpa = parseFloat(item.sgpa);
        const credits = item.credits !== '' && !isNaN(item.credits) ? parseFloat(item.credits) : 20;

        if (sgpa < 0 || sgpa > 10) hasError = true;

        completedCount++;
        validSgpas.push({ sem: item.sem, sgpa, credits });

        if (sgpa === 0) {
          backlogs++;
        } else {
          clearedSgpas.push(sgpa);
        }

        totalWeightedPoints += sgpa * credits;
        totalAttemptedCredits += credits;

        if (sgpa > bestSgpaVal) {
          bestSgpaVal = sgpa;
          bestSem = item.sem;
        }
        if (sgpa < worstSgpaVal) {
          worstSgpaVal = sgpa;
          worstSem = item.sem;
        }
      }
    });

    const currentCgpa = totalAttemptedCredits > 0 ? totalWeightedPoints / totalAttemptedCredits : 0;
    const formattedCgpa = currentCgpa.toFixed(2);

    const highestSgpaStr = bestSgpaVal >= 0 ? bestSgpaVal.toFixed(2) : '-';
    const lowestSgpaStr = clearedSgpas.length > 0 ? Math.min(...clearedSgpas).toFixed(2) : (worstSgpaVal < 999 ? worstSgpaVal.toFixed(2) : '-');

    const recentValid = validSgpas.slice(-2);
    const recentAvg = recentValid.length > 0 ? recentValid.reduce((acc, c) => acc + c.sgpa, 0) / recentValid.length : currentCgpa;
    const projectedCgpa = Math.min(10.0, Math.max(currentCgpa, (currentCgpa * 0.7 + recentAvg * 0.3) + 0.15)).toFixed(2);

    // Distribution breakdown
    let counts = { s: 0, a: 0, b: 0, c: 0, d: 0, f: 0 };
    validSgpas.forEach((item) => {
      if (item.sgpa > 0) {
        if (item.sgpa >= 9.0) counts.s++;
        else if (item.sgpa >= 8.0) counts.a++;
        else if (item.sgpa >= 7.0) counts.b++;
        else if (item.sgpa >= 6.0) counts.c++;
        else if (item.sgpa >= 5.0) counts.d++;
        else counts.f++;
      }
    });

    return {
      hasError,
      completedCount,
      backlogs,
      currentCgpa,
      formattedCgpa,
      highestSgpaStr,
      lowestSgpaStr,
      bestSem,
      worstSem,
      worstSgpaVal,
      projectedCgpa,
      validSgpas,
      counts
    };
  }, [semesters]);

  const standing = useMemo(() => {
    const cgpa = metrics.currentCgpa;
    const backlogs = metrics.backlogs;

    if (backlogs > 2 || cgpa < 6.0) {
      return {
        icon: '⚠️',
        text: 'Needs Improvement',
        narrative: 'Keep a disciplined revision schedule to clear backlogs in upcoming terms.',
        tips: 'Try to improve subjects where you scored below 7.0.'
      };
    } else if (cgpa >= 8.0) {
      return {
        icon: '🏆',
        text: 'Excellent Performance',
        narrative: 'Outstanding academic consistency! You are well positioned for graduation honors.',
        tips: 'Keep up the good work and consider pursuing technical projects or research.'
      };
    } else {
      return {
        icon: '📈',
        text: 'Good Performance',
        narrative: 'You are doing well! Keep it up and focus on improving in upcoming semesters.',
        tips: 'Maintain a consistent study rhythm to achieve your targets.'
      };
    }
  }, [metrics]);

  const resultCardsData = [
    { label: 'Total Semesters', value: totalSemestersConfigured },
    { label: 'Completed Semesters', value: metrics.completedCount },
    { label: 'Backlog Subjects', value: metrics.backlogs },
    { label: 'Current CGPA', value: metrics.formattedCgpa, highlight: true },
    { label: 'Highest SGPA', value: metrics.highestSgpaStr },
    { label: 'Lowest SGPA', value: metrics.lowestSgpaStr },
    { label: 'Overall Status', value: standing.text }
  ];

  const getLetterGrade = (sgpa) => {
    if (sgpa === null || isNaN(sgpa) || sgpa === '') return '-';
    const val = parseFloat(sgpa);
    if (val >= 9.0) return 'S';
    if (val >= 8.0) return 'A';
    if (val >= 7.0) return 'B+';
    if (val >= 6.0) return 'B';
    if (val >= 5.0) return 'C';
    if (val >= 4.0) return 'D';
    return 'F';
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">Result Analyzer</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Result Analyzer"
          description="Get detailed insights into your academic performance"
          icon={BarChart2}
          methodTitle="ANALYSIS METHOD"
          methodSubtitle="Based on your semester-wise results"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights result-analysis) */}
          <CalculatorDirectorySidebar activeTool="result-analysis" />

          {/* Center Column: Form & Semester Entry */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
              {/* Academic Selectors */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Select Your Details</h3>
                  <p className="text-[11px] text-text-m mt-0.5">Choose your university and enter your semester results</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">University</label>
                    <div className="relative">
                      <select
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                      >
                        <option value="jntuh">JNTU Hyderabad</option>
                        <option value="anna">Anna University</option>
                        <option value="osmania">Osmania University</option>
                        <option value="generic">Standard 10-Point Scale</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Regulation</label>
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
                    <label className="block text-xs font-semibold text-text-h mb-1">Course</label>
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
                    <label className="block text-xs font-semibold text-text-h mb-1">Total Semesters</label>
                    <div className="relative">
                      <select
                        value={totalSemestersConfigured}
                        onChange={(e) => handleTotalSemestersChange(e.target.value)}
                        className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                      >
                        <option value="4">4</option>
                        <option value="6">6</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                  <Info className="w-4 h-4 text-brandBlue shrink-0" />
                  <span>Enter your semester-wise SGPA and credits to get a detailed analysis of your performance.</span>
                </div>
              </div>

              {/* Semester Entry Section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-bold text-text-h">Enter Semester Results</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
                      {metrics.completedCount} Semesters
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Load Sample Data</span>
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className="space-y-2 mt-2">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/50">
                    <div className="col-span-2 text-center">SEM</div>
                    <div className="col-span-3 text-center">SGPA</div>
                    <div className="col-span-3 text-center">CREDITS</div>
                    <div className="col-span-3 text-center">STATUS</div>
                    <div className="col-span-1 text-center">ACTION</div>
                  </div>

                  {semesters.map((item, idx) => {
                    let badgeClass = 'bg-bg-sec text-text-m border border-border';
                    if (item.status === 'Cleared') {
                      badgeClass = 'bg-emerald-500/10 text-brandGreen border border-brandGreen/20';
                    } else if (item.status === 'Backlog') {
                      badgeClass = 'bg-pink-500/10 text-brandPink border border-brandPink/20';
                    }

                    return (
                      <div key={item.id} className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/40 transition-colors">
                        <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                          <div className="col-span-2 text-center font-bold text-xs text-text-h">{idx + 1}</div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={item.sgpa}
                              onChange={(e) => handleSemesterChange(item.id, 'sgpa', e.target.value)}
                              placeholder="-"
                              className="calc-input w-full px-2.5 py-1.5 text-center rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              max="40"
                              step="1"
                              value={item.credits}
                              onChange={(e) => handleSemesterChange(item.id, 'credits', e.target.value)}
                              placeholder="-"
                              className="calc-input w-full px-2.5 py-1.5 text-center rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div className="col-span-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-md text-[10.5px] font-bold ${badgeClass} whitespace-nowrap`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSemester(item.id)}
                              className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                              aria-label={`Delete semester ${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Stack */}
                        <div className="sm:hidden space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-h">Semester {idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                                {item.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSemester(item.id)}
                                className="text-xs text-brandPink font-semibold flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-text-light font-semibold block mb-0.5">SGPA</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={item.sgpa}
                                onChange={(e) => handleSemesterChange(item.id, 'sgpa', e.target.value)}
                                placeholder="SGPA"
                                className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-text-light font-semibold block mb-0.5">Credits</label>
                              <input
                                type="number"
                                min="0"
                                max="40"
                                step="1"
                                value={item.credits}
                                onChange={(e) => handleSemesterChange(item.id, 'credits', e.target.value)}
                                placeholder="Credits"
                                className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={handleAddSemester}
                    disabled={semesters.length >= totalSemestersConfigured}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/70 bg-accent-soft/40 hover:bg-accent-soft text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Another Semester</span>
                  </button>
                  {validationError && (
                    <p className="text-[11px] text-brandPink mt-1.5 text-center font-medium">{validationError}</p>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-3">
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
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Analyze & Save</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Result Summary Gauge & Insights */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Result Analysis Summary">
            <ResultGaugeCard
              score={metrics.currentCgpa}
              maxScale={10}
              title="YOUR RESULT SUMMARY"
              metrics={resultCardsData}
              standing={standing}
              onSave={() => setIsModalOpen(true)}
            />

            {/* Quick Insights Cards */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle space-y-2.5">
              <h4 className="text-xs font-bold text-text-h uppercase tracking-wider pb-1 border-b border-border">
                Quick Insights
              </h4>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-brandGreen/20 flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-brandGreen shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-h block text-xs">Improving Trend</span>
                  <span className="text-[11px] text-text-m leading-snug">Recent semesters reflect consistent upward momentum.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-brandPink/20 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-brandPink shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-h block text-xs">Focus on Weak Areas</span>
                  <span className="text-[11px] text-text-m leading-snug">Prioritize subjects where your score falls below 7.0.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-accent/20 flex items-start gap-2.5">
                <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-h block text-xs">Stay Consistent</span>
                  <span className="text-[11px] text-text-m leading-snug">Maintain high credit semester targets to achieve honors.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Charts Row: Trend Line Chart & Grade Doughnut Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch" aria-label="Performance Charts">
          {/* CGPA & SGPA Line Trend Chart */}
          <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/70">
              <div>
                <h3 className="text-sm font-bold text-text-h">CGPA & SGPA Trend</h3>
                <p className="text-[11px] text-text-m mt-0.5">Semester-wise SGPA and cumulative CGPA progression</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-text-m">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  <span>SGPA</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brandBlue"></span>
                  <span>CGPA</span>
                </span>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72 overflow-x-auto">
              <div className="min-w-[500px] h-full flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 650 220">
                  <line x1="40" y1="20" x2="620" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                  <text x="25" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">10</text>
                  <line x1="40" y1="60" x2="620" y2="60" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                  <text x="25" y="64" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">8</text>
                  <line x1="40" y1="100" x2="620" y2="100" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                  <text x="25" y="104" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">6</text>
                  <line x1="40" y1="140" x2="620" y2="140" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                  <text x="25" y="144" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                  <line x1="40" y1="180" x2="620" y2="180" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                  <text x="25" y="184" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                  {/* Lines mapped to SVG coordinates */}
                  {metrics.validSgpas.length > 1 && (
                    <>
                      {/* SGPA Polyline (Orange) */}
                      <polyline
                        fill="none"
                        stroke="#FF7300"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={metrics.validSgpas
                          .map((v, i) => `${80 + i * 80},${180 - (v.sgpa / 10) * 160}`)
                          .join(' ')}
                      />
                      {metrics.validSgpas.map((v, i) => (
                        <circle
                          key={`sgpa-${i}`}
                          cx={80 + i * 80}
                          cy={180 - (v.sgpa / 10) * 160}
                          r="4"
                          fill="#FF7300"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      ))}

                      {/* CGPA Cumulative Polyline (Blue) */}
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={metrics.validSgpas
                          .map((v, i) => {
                            const subslice = metrics.validSgpas.slice(0, i + 1);
                            const weighted = subslice.reduce((acc, cur) => acc + cur.sgpa * cur.credits, 0);
                            const credits = subslice.reduce((acc, cur) => acc + cur.credits, 0);
                            const cgpa = credits > 0 ? weighted / credits : 0;
                            return `${80 + i * 80},${180 - (cgpa / 10) * 160}`;
                          })
                          .join(' ')}
                      />
                    </>
                  )}

                  {metrics.validSgpas.map((v, i) => (
                    <text
                      key={`lbl-${i}`}
                      x={80 + i * 80}
                      y="200"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill="currentColor"
                      className="text-text-m"
                    >
                      Sem {v.sem}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Grade Distribution Doughnut Chart */}
          <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3 flex flex-col justify-between">
            <div className="pb-2 border-b border-border/70">
              <h3 className="text-sm font-bold text-text-h">Grade Distribution</h3>
              <p className="text-[11px] text-text-m mt-0.5">Distribution of grades across semester evaluations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              <div className="sm:col-span-6 relative flex items-center justify-center h-48">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="58" fill="transparent" stroke="currentColor" className="text-border" strokeWidth="18" />
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#FF7300"
                    strokeWidth="18"
                    strokeDasharray="364.4"
                    strokeDashoffset={364.4 - (364.4 * (metrics.counts.s + metrics.counts.a + metrics.counts.b)) / Math.max(1, metrics.completedCount)}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-text-h leading-none">{metrics.completedCount}</span>
                  <span className="text-[10px] font-bold text-text-m mt-0.5">Semesters</span>
                </div>
              </div>

              <div className="sm:col-span-6 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                    <span>S (≥ 9.0)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.s}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                    <span>A (8.0 - 8.9)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.a}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
                    <span>B (7.0 - 7.9)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.b}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                    <span>C (6.0 - 6.9)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.c}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                    <span>D (5.0 - 5.9)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.d}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-text-h font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                    <span>F (&lt; 5.0)</span>
                  </span>
                  <span className="font-bold text-text-m">{metrics.counts.f}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lower Row: Semester Analysis Table & Insights Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch" aria-label="Detailed Performance Breakdown">
          <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3">
            <div className="pb-2 border-b border-border/70">
              <h3 className="text-sm font-bold text-text-h">Semester-wise Analysis</h3>
              <p className="text-[11px] text-text-m mt-0.5">Detailed performance analysis for each semester</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/60">
                    <th className="py-2.5 px-3 text-center">SEM</th>
                    <th className="py-2.5 px-3 text-center">SGPA</th>
                    <th className="py-2.5 px-3 text-center">CREDITS</th>
                    <th className="py-2.5 px-3 text-center">GRADE</th>
                    <th className="py-2.5 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium">
                  {semesters
                    .filter((s) => s.status !== 'Not Attempted')
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-bg-sec/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-text-h">{item.sem}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-text-h">{Number(item.sgpa).toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-center text-text-m">{item.credits || 20}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-accent">{getLetterGrade(item.sgpa)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-bold ${
                            item.status === 'Cleared'
                              ? 'bg-emerald-500/10 text-brandGreen border border-brandGreen/20'
                              : 'bg-pink-500/10 text-brandPink border border-brandPink/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3 flex flex-col justify-between">
            <div className="pb-2 border-b border-border/70">
              <h3 className="text-sm font-bold text-text-h">Performance Insights</h3>
              <p className="text-[11px] text-text-m mt-0.5">Key milestones about your academic journey</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-brandGreen/20 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-2 text-brandGreen font-bold text-[11px]">
                  <Award className="w-4 h-4" />
                  <span>Best Performance</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-text-h block">Semester {metrics.bestSem || 7}</span>
                  <span className="text-xs font-black text-brandGreen block">SGPA: {metrics.highestSgpaStr}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pink-500/10 border border-brandPink/20 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-2 text-brandPink font-bold text-[11px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Needs Improvement</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-text-h block">Semester {metrics.worstSem || 5}</span>
                  <span className="text-xs font-black text-brandPink block">SGPA: {metrics.worstSgpaVal < 999 ? metrics.worstSgpaVal.toFixed(2) : '0.00'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-accent/20 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-2 text-accent font-bold text-[11px]">
                  <BarChart2 className="w-4 h-4" />
                  <span>Current CGPA</span>
                </div>
                <div>
                  <span className="text-base font-black text-accent block leading-tight">{metrics.formattedCgpa}</span>
                  <span className="text-[10px] font-semibold text-text-m">Cumulative Grade Point</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-brandBlue/20 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-2 text-brandBlue font-bold text-[11px]">
                  <TrendingUp className="w-4 h-4" />
                  <span>Projected CGPA</span>
                </div>
                <div>
                  <span className="text-base font-black text-brandBlue block leading-tight">{metrics.projectedCgpa}</span>
                  <span className="text-[10px] font-semibold text-text-m">Expected Final Standing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reusable Bottom Explore Tools */}
        <ExploreMoreTools />
      </main>

      <SaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}