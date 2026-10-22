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
  FileCheck,
  Bookmark,
  Award,
  Lightbulb,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import CalculatorPageHeader from '../CalculatorPageHeader';
import MobileResultModal from '../MobileResultModal';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { saveCalculationToHistory } from '../../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../../services/calculationSaveService';
import { downloadCalculatorPdf } from '../../../services/calculatorPdfService';
import { shareCalculationResult } from '../../../services/calculatorShareService';
import { academicCatalogService } from '../../../services/academicCatalogService';
import { academicCalculationEngine } from '../../../services/academicCalculationEngine';

const GRADING_TABLE_DATA = [
  { range: '90 - 100', grade: 'S', points: 10, performance: 'Outstanding', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
  { range: '80 - 89', grade: 'A+', points: 9, performance: 'Excellent', badgeClass: 'bg-emerald-500/10 text-brandGreen' },
  { range: '70 - 79', grade: 'A', points: 8, performance: 'Very Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
  { range: '60 - 69', grade: 'B+', points: 7, performance: 'Good', badgeClass: 'bg-blue-500/10 text-brandBlue' },
  { range: '50 - 59', grade: 'B', points: 6, performance: 'Above Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
  { range: '40 - 49', grade: 'C', points: 5, performance: 'Average', badgeClass: 'bg-amber-500/10 text-brandAmber' },
  { range: '30 - 39', grade: 'D', points: 4, performance: 'Pass', badgeClass: 'bg-pink-500/10 text-brandPink' },
  { range: '0 - 29', grade: 'F', points: 0, performance: 'Fail', badgeClass: 'bg-pink-500/10 text-brandPink' },
];

export default function GradeCalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [university, setUniversity] = useState('jntuh');
  const [regulation, setRegulation] = useState('r18');
  const [course, setCourse] = useState('btech-cse');
  const [subjectType, setSubjectType] = useState('theory');
  const [maxMarks, setMaxMarks] = useState(100);
  const [obtainedMarks, setObtainedMarks] = useState(85);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleCalculate = () => {
    if (isNaN(obtainedMarks) || obtainedMarks < 0) {
      setValidationError('Please enter valid obtained marks.');
      return;
    }
    if (obtainedMarks > maxMarks) {
      setValidationError('Obtained marks cannot exceed maximum marks.');
      return;
    }
    setValidationError('');
    setIsResultModalOpen(true);
  };

  const handleMaxMarksChange = (val) => {
    const num = parseFloat(val);
    setMaxMarks(isNaN(num) || num <= 0 ? 100 : num);
  };

  const handleObtainedMarksChange = (val) => {
    const num = parseFloat(val);
    const parsed = isNaN(num) || num < 0 ? 0 : num;
    if (parsed > maxMarks) {
      setValidationError('Obtained marks cannot exceed maximum marks.');
      setObtainedMarks(maxMarks);
    } else {
      setValidationError('');
      setObtainedMarks(parsed);
    }
  };

  const handleReset = () => {
    setMaxMarks(100);
    setObtainedMarks(85);
    setValidationError('');
    showToast('Form reset to default marks (85 / 100)');
  };

  // Live Catalog Configuration & Dynamic Grading Scale
  const catalogConfig = useMemo(() => {
    try {
      return academicCatalogService.getFullConfiguration(university, course, regulation);
    } catch {
      return null;
    }
  }, [university, course, regulation]);

  const displayedGradingTable = useMemo(() => {
    if (catalogConfig?.gradeScale && Array.isArray(catalogConfig.gradeScale) && catalogConfig.gradeScale.length > 0) {
      return catalogConfig.gradeScale.map((tier) => ({
        range: `${tier.minPercentage} - ${tier.maxPercentage || 100}%`,
        grade: tier.grade,
        points: tier.points,
        performance: tier.desc,
        badgeClass:
          tier.points >= 8
            ? 'bg-emerald-500/10 text-brandGreen'
            : tier.points >= 6
            ? 'bg-blue-500/10 text-brandBlue'
            : tier.points >= 4
            ? 'bg-amber-500/10 text-brandAmber'
            : 'bg-pink-500/10 text-brandPink',
      }));
    }
    return GRADING_TABLE_DATA;
  }, [catalogConfig]);

  // Grade Evaluation Calculation
  const result = useMemo(() => {
    const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
    const roundedPercent = parseFloat(percentage.toFixed(2));

    let evaluated = null;
    let activeRowIdx = -1;

    if (catalogConfig?.gradeScale && Array.isArray(catalogConfig.gradeScale) && catalogConfig.gradeScale.length > 0) {
      const engineRes = academicCalculationEngine.getGradeFromMarks(obtainedMarks, maxMarks, catalogConfig.gradeScale);
      activeRowIdx = catalogConfig.gradeScale.findIndex((g) => g.grade === engineRes.grade);
      evaluated = {
        grade: engineRes.grade,
        points: engineRes.points,
        performance: engineRes.desc,
        rowIdx: activeRowIdx,
        icon: engineRes.points >= 8 ? '🏆' : engineRes.points >= 6 ? '🌟' : engineRes.points >= 4 ? '📈' : '⚠️',
      };
    } else {
      let fallback = { grade: 'F', points: 0, performance: 'Fail', rowIdx: 7, icon: '⚠️' };
      if (roundedPercent >= 90) {
        fallback = { grade: 'O', points: 10, performance: 'Outstanding', rowIdx: 0, icon: '🏆' };
      } else if (roundedPercent >= 80) {
        fallback = { grade: 'A+', points: 9, performance: 'Excellent', rowIdx: 1, icon: '🏆' };
      } else if (roundedPercent >= 70) {
        fallback = { grade: 'A', points: 8, performance: 'Very Good', rowIdx: 2, icon: '🌟' };
      } else if (roundedPercent >= 60) {
        fallback = { grade: 'B+', points: 7, performance: 'Good', rowIdx: 3, icon: '🌟' };
      } else if (roundedPercent >= 50) {
        fallback = { grade: 'B', points: 6, performance: 'Above Average', rowIdx: 4, icon: '📈' };
      } else if (roundedPercent >= 40) {
        fallback = { grade: 'C', points: 5, performance: 'Average', rowIdx: 5, icon: '📈' };
      } else if (roundedPercent >= 30) {
        fallback = { grade: 'D', points: 4, performance: 'Pass', rowIdx: 6, icon: '📈' };
      }
      evaluated = fallback;
    }

    const circumference = 2 * Math.PI * 64; // ~402.12
    const clamped = Math.max(0, Math.min(100, roundedPercent));
    const strokeDashoffset = circumference - (clamped / 100) * circumference;

    return {
      percentage: roundedPercent,
      strokeDashoffset,
      ...evaluated,
    };
  }, [maxMarks, obtainedMarks, catalogConfig]);

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'Grade Calculator',
      title: 'Grade Evaluation',
      score: `${result.grade} (${result.points} pts)`,
      scale: '10.0',
      result: `Grade ${result.grade} (${result.percentage}%)`,
      standing: result.performance,
      summary: `Marks: ${obtainedMarks}/${maxMarks} | Grade: ${result.grade} | Points: ${result.points} | Performance: ${result.performance}`,
      data: {
        obtainedMarks,
        maxMarks,
        percentage: result.percentage,
        grade: result.grade,
        points: result.points,
        performance: result.performance,
        university,
        regulation,
        course,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('Grade calculation saved to your history!');
      } else {
        showToast(res.error || 'Failed to save calculation');
      }
    } else {
      setPendingCalc(calcRecord);
      calculationSaveService.setPendingCalculation(calcRecord);
      setIsModalOpen(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const pdfData = {
        calculatorName: 'Grade Evaluation Result Card',
        subtitle: 'Calculated using your marks and university grading scale',
        filename: 'ResultPoint_Grade_Result.pdf',
        score: result.grade,
        maxScale: `${result.points} pts`,
        standing: result.performance,
        metadata: {
          university: university.toUpperCase(),
          regulation: regulation.toUpperCase(),
          course: course.toUpperCase(),
          subjectType: subjectType.toUpperCase(),
          calculationMethod: 'Absolute Scale Grading',
          totalMarks: `${obtainedMarks} / ${maxMarks}`
        },
        metrics: [
          { label: 'Obtained Marks', value: Math.round(obtainedMarks) },
          { label: 'Maximum Marks', value: Math.round(maxMarks) },
          { label: 'Percentage', value: `${result.percentage.toFixed(2)}%` },
          { label: 'Grade', value: result.grade },
          { label: 'Grade Point', value: result.points },
          { label: 'Performance', value: result.performance }
        ],
        subjectRows: [
          { param: 'Obtained Marks', value: `${Math.round(obtainedMarks)} marks` },
          { param: 'Maximum Marks', value: `${Math.round(maxMarks)} marks` },
          { param: 'Calculated Percentage', value: `${result.percentage.toFixed(2)}%` },
          { param: 'Assigned Letter Grade', value: result.grade },
          { param: 'Grade Point Value', value: `${result.points} / 10` },
          { param: 'Academic Standing', value: result.performance },
          { param: 'Curriculum Regulation', value: regulation.toUpperCase() }
        ]
      };
      downloadCalculatorPdf(pdfData);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to download PDF. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareResult = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const shareData = {
        toolName: 'Grade Calculator',
        score: result.grade,
        scaleText: `(${result.points} Grade Points)`,
        metrics: [
          { label: 'Obtained Marks', value: `${Math.round(obtainedMarks)} / ${Math.round(maxMarks)}` },
          { label: 'Percentage', value: `${result.percentage.toFixed(2)}%` },
          { label: 'Performance', value: result.performance }
        ],
        metadata: {
          university: university.toUpperCase(),
          regulation: regulation.toUpperCase()
        }
      };
      const res = await shareCalculationResult(shareData);
      if (res.success) {
        showToast(res.message);
      } else if (!res.cancelled) {
        showToast(res.message || 'Unable to share result.', 'error');
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('Failed to share result.', 'error');
    } finally {
      setIsSharing(false);
    }
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
            <li className="font-bold text-text-h" aria-current="page">Grade Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Grade Calculator"
          description="Find your grade based on your marks and university grading system"
          icon={FileCheck}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Based on University Grading System"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights grade) */}
          <CalculatorDirectorySidebar activeTool="grade" />

          {/* Center Column: Interactive Grade Form & Grading Table */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            {/* Form Card */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              {/* Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select University</label>
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
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Course (Optional)</label>
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
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Subject Type</label>
                  <div className="relative">
                    <select
                      value={subjectType}
                      onChange={(e) => setSubjectType(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="theory">Theory (End Semester)</option>
                      <option value="practical">Practical / Lab</option>
                      <option value="project">Major Project / Seminar</option>
                      <option value="internal">Internal Assessment</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>
              </div>

              {/* Information Banner */}
              <div className="my-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                <Info className="w-4 h-4 text-brandBlue shrink-0" />
                <span>Enter your marks to find the corresponding grade based on the selected university grading system.</span>
              </div>

              {/* Enter Marks Section */}
              <div className="space-y-4 pt-1">
                <h3 className="text-sm font-bold text-text-h">Enter Your Marks</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Maximum Marks</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={maxMarks}
                      onChange={(e) => handleMaxMarksChange(e.target.value)}
                      className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Obtained Marks</label>
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={obtainedMarks}
                      onChange={(e) => handleObtainedMarksChange(e.target.value)}
                      className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border-accent/70 focus:border-accent"
                    />
                  </div>
                </div>

                {/* Marks Slider Control */}
                <div className="mt-5 pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-text-m">
                      Adjust Marks Interactive Slider
                    </label>
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-accent font-extrabold text-xs border border-accent/20">
                      {Math.round(obtainedMarks)} / {Math.round(maxMarks)}
                    </span>
                  </div>

                  <div className="relative py-1">
                    <input
                      type="range"
                      min="0"
                      max={maxMarks}
                      step="1"
                      value={obtainedMarks}
                      onChange={(e) => handleObtainedMarksChange(e.target.value)}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-text-m px-1">
                    <span>0</span>
                    <span>{Math.round(maxMarks * 0.25)}</span>
                    <span>{Math.round(maxMarks * 0.5)}</span>
                    <span>{Math.round(maxMarks * 0.75)}</span>
                    <span>{maxMarks}</span>
                  </div>
                </div>

                {validationError && (
                  <p className="text-[11px] text-brandPink mt-2 text-center font-medium">{validationError}</p>
                )}

                {/* Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-xs font-semibold text-text-m hover:text-text-h transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCalculate}
                    className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Calculate Grade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reference Table with Dynamic Active Row Highlight */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Grading System ({regulation.toUpperCase()})</h3>
                  <p className="text-[11px] text-text-m mt-0.5">
                    Grade ranges and grade points for {university.toUpperCase()} ({regulation.toUpperCase()} Regulation)
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-m px-2.5 py-1 rounded-lg bg-bg-sec border border-border shrink-0 self-start sm:self-auto">
                  10 Point Scale
                </span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/60">
                      <th className="py-2.5 px-3">Percentage Range</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Grade Point</th>
                      <th className="py-2.5 px-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    {displayedGradingTable.map((row, idx) => {
                      const isActive = idx === result.rowIdx;
                      return (
                        <tr
                          key={row.range}
                          className={`transition-colors ${
                            isActive
                              ? 'bg-orange-500/10 font-bold border-l-4 border-accent'
                              : 'hover:bg-bg-sec/60'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-text-h">{row.range}</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-accent">{row.grade}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-text-h">{row.points}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold ${row.badgeClass}`}>
                              {row.performance}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Grade Result Showcase & Quick Reference (Desktop / Tablet Only) */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Grade Evaluation Results">
            {/* Orange Result Card */}
            <div className="rounded-2xl bg-gradient-to-b from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-5 shadow-accent text-center relative overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                YOUR GRADE RESULT
              </h3>

              {/* Gauge */}
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
                    strokeDashoffset={result.strokeDashoffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white tracking-tight leading-none">
                    {result.grade}
                  </span>
                  <span className="text-[11px] font-bold text-white/90 mt-1">
                    {result.performance}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <span>{result.icon}</span>
                  <span>Great! You scored a {result.performance} grade.</span>
                </span>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-3.5 p-3 rounded-xl bg-card text-text-h border border-white/20 space-y-1.5 text-xs text-left shadow-subtle">
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Obtained Marks</span>
                  <span className="font-bold text-text-h">{Math.round(obtainedMarks)}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Maximum Marks</span>
                  <span className="font-bold text-text-h">{Math.round(maxMarks)}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Percentage</span>
                  <span className="font-extrabold text-accent">{result.percentage.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Grade</span>
                  <span className="font-bold text-text-h">{result.grade}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Grade Point</span>
                  <span className="font-bold text-text-h">{result.points}</span>
                </div>
                <div className="flex items-center justify-between text-text-m text-[11px]">
                  <span>Performance</span>
                  <span className="font-bold text-brandGreen">{result.performance}</span>
                </div>
              </div>

              {/* Action Button Cluster: Save, Download PDF, Share */}
              <div className="mt-3.5 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveResult}
                  className="w-full py-2 px-3 rounded-xl bg-white text-accent hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle active:scale-95 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Result</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={handleDownloadPdf}
                    className="py-2 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download result as a clean PDF"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSharing}
                    onClick={handleShareResult}
                    className="py-2 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Share result or copy summary"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Examples Reference Card */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-h">Quick Examples</h4>
                </div>
                <span className="text-[10.5px] text-text-light">Reference</span>
              </div>
              <p className="text-[11px] text-text-m mb-2.5">See how marks convert to grades</p>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">95 marks (95%)</span>
                    <span className="text-[10px] text-text-m">Outstanding (10 pts)</span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brandGreen font-extrabold text-xs flex items-center justify-center border border-brandGreen/20">
                    S
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">85 marks (85%)</span>
                    <span className="text-[10px] text-text-m">Very Good (8 pts)</span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue font-extrabold text-xs flex items-center justify-center border border-brandBlue/20">
                    A
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">72 marks (72%)</span>
                    <span className="text-[10px] text-text-m">Good (7 pts)</span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-brandBlue font-extrabold text-xs flex items-center justify-center border border-brandBlue/20">
                    B+
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">55 marks (55%)</span>
                    <span className="text-[10px] text-text-m">Above Average (6 pts)</span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-brandAmber font-extrabold text-xs flex items-center justify-center border border-brandAmber/20">
                    B
                  </span>
                </div>
              </div>
            </div>

            {/* Tip Card */}
            <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Tip</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Grades may vary depending on your university and regulation. Always check your official academic guidelines.
                </p>
              </div>
            </div>
          </aside>
        </div>

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

      {/* Mobile Result Modal Popup */}
      <MobileResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="YOUR GRADE RESULT"
        score={result.points}
        maxScale={10}
        standing={{
          icon: result.icon,
          text: `Grade ${result.grade} (${result.performance})`,
          narrative: `You achieved an assigned letter grade of ${result.grade} with ${result.points} grade points (${result.percentage.toFixed(2)}%).`
        }}
        metrics={[
          { label: 'Letter Grade', value: result.grade },
          { label: 'Grade Points', value: `${result.points} / 10` },
          { label: 'Obtained Marks', value: `${Math.round(obtainedMarks)} / ${Math.round(maxMarks)}` },
          { label: 'Calculated Percentage', value: `${result.percentage.toFixed(2)}%` },
          { label: 'Academic Standing', value: result.performance }
        ]}
        metadata={{
          university: university.toUpperCase(),
          regulation: regulation.toUpperCase(),
          course: course.toUpperCase(),
          calculationMethod: 'Absolute Scale Grading'
        }}
        calculationMethod="Absolute Scale Grading"
        onSave={handleSaveResult}
        onDownloadPdf={handleDownloadPdf}
        onShareResult={handleShareResult}
        isGeneratingPdf={isGeneratingPdf}
        isSharing={isSharing}
      />
    </>
  );
}