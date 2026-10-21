import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Info,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Trash2,
  AlertTriangle,
  History,
  Lightbulb,
  FileSpreadsheet
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

const DEFAULT_BACKLOG_SUBJECTS = [
  {
    id: '1',
    name: 'Data Structures',
    credits: 4,
    semester: 'Semester 1',
    status: 'Not Cleared',
    recommendation: 'Revise core concepts and solve previous papers'
  },
  {
    id: '2',
    name: 'Computer Networks',
    credits: 4,
    semester: 'Semester 2',
    status: 'Not Cleared',
    recommendation: 'Practice diagrams and numerical questions'
  },
  {
    id: '3',
    name: 'Database Management Systems',
    credits: 4,
    semester: 'Semester 2',
    status: 'Not Cleared',
    recommendation: 'Focus on SQL queries and normalization'
  }
];

const SEMESTER_OPTIONS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8'
];

export default function BacklogCalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [university, setUniversity] = useState('jntuh');
  const [regulation, setRegulation] = useState('r18');
  const [course, setCourse] = useState('btech-cse');
  const [currentSemester, setCurrentSemester] = useState('sem4');
  const [currentCgpa, setCurrentCgpa] = useState(7.20);
  const [subjects, setSubjects] = useState(DEFAULT_BACKLOG_SUBJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');

  const handleCalculate = () => {
    if (!subjects || subjects.length === 0) {
      setValidationError('At least one backlog subject is required.');
      return;
    }
    const hasInvalid = subjects.some(s => !s.name || !s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) < 1);
    if (hasInvalid) {
      setValidationError('Please enter valid names and credit values for all backlog subjects.');
      return;
    }
    setValidationError('');
    setIsResultModalOpen(true);
  };

  const handleAddSubject = () => {
    if (subjects.length >= 15) return;
    setSubjects((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `New Backlog Subject ${prev.length + 1}`,
        credits: 3,
        semester: 'Semester 3',
        status: 'Not Cleared',
        recommendation: 'Review syllabus concepts and practice mock test sets'
      }
    ]);
    showToast(`Added Backlog Subject #${subjects.length + 1}`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one backlog subject entry is required for analysis.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Backlog subject removed');
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === 'credits') {
          const parsed = parseFloat(value);
          const num = isNaN(parsed) || parsed < 1 ? 1 : parsed;
          return { ...s, credits: num };
        }
        return { ...s, [field]: value };
      })
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_BACKLOG_SUBJECTS);
    setCurrentCgpa(7.20);
    setValidationError('');
    showToast('Calculator reset to default parameters');
  };

  // Backlog Calculations & Minimum CGPA formulation
  const metrics = useMemo(() => {
    let totalCredits = 0;
    subjects.forEach((s) => {
      totalCredits += parseFloat(s.credits) || 0;
    });

    const backlogCount = subjects.length;
    const cgpaNum = parseFloat(currentCgpa) || 7.20;

    // Academic recovery estimation: Bump of 0.05 per backlog credit
    const bump = Math.min(2.0, totalCredits * 0.05);
    const minRequiredCgpa = Math.min(10.0, Math.max(cgpaNum, cgpaNum + bump)).toFixed(2);

    return {
      backlogCount,
      totalCredits,
      currentCgpa: cgpaNum.toFixed(2),
      minRequiredCgpa
    };
  }, [subjects, currentCgpa]);

  // Standing Status Tier
  const standing = useMemo(() => {
    const count = metrics.backlogCount;
    if (count === 0) {
      return {
        icon: '🏆',
        text: 'Cleared',
        narrative: 'Congratulations! You have cleared all backlog subjects.',
        tips: 'Maintain your current study rhythm to graduate with high distinction.'
      };
    }
    if (count <= 2) {
      return {
        icon: '📊',
        text: 'Manageable',
        narrative: `You have ${count} backlog subject${count > 1 ? 's' : ''}. With dedicated effort, you can clear them in the upcoming semester.`,
        tips: 'Dedicate 1 extra hour daily specifically for your backlog subjects.'
      };
    }
    if (count <= 4) {
      return {
        icon: '⚠️',
        text: 'Needs Improvement',
        narrative: `You have ${count} backlog subjects. Keep a consistent study plan to clear them soon.`,
        tips: 'Make a dedicated study plan, focus on high-credit papers and practice previous exam questions.'
      };
    }
    return {
      icon: '⚠️',
      text: 'Critical Attention',
      narrative: `You have ${count} backlog subjects totaling ${metrics.totalCredits} credits. Immediate academic planning is recommended.`,
      tips: 'Prioritize high-credit subjects and consult mentors early before final exams.'
    };
  }, [metrics]);

  const resultCardsData = [
    { label: 'Total Backlogs', value: metrics.backlogCount, highlight: true },
    { label: 'Total Backlog Credits', value: metrics.totalCredits },
    { label: 'Current CGPA', value: metrics.currentCgpa },
    { label: 'Min CGPA Required', value: metrics.minRequiredCgpa },
    { label: 'Status', value: standing.text }
  ];

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'Backlog Calculator',
      title: 'Backlog Tracker & Study Plan',
      score: `${metrics.backlogCount} Backlogs`,
      scale: '10',
      result: `${metrics.backlogCount} Backlogs (${metrics.totalCredits} Credits)`,
      standing: standing?.text || 'Review',
      summary: `Backlogs: ${metrics.backlogCount} | Credits: ${metrics.totalCredits} | Current CGPA: ${metrics.currentCgpa}`,
      data: {
        backlogCount: metrics.backlogCount,
        totalCredits: metrics.totalCredits,
        currentCgpa: metrics.currentCgpa,
        minRequiredCgpa: metrics.minRequiredCgpa,
        university,
        course,
        regulation,
        currentSemester,
        subjects,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('Backlog calculation saved to your history!');
      } else {
        showToast(res.error || 'Failed to save calculation');
      }
    } else {
      setPendingCalc(calcRecord);
      calculationSaveService.setPendingCalculation(calcRecord);
      setIsModalOpen(true);
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
            <li className="font-bold text-text-h" aria-current="page">Backlog Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Backlog Calculator"
          description="Track your backlogs, calculate required CGPA and plan for clearance"
          icon={FileSpreadsheet}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Based on remaining credits and target CGPA"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights backlog) */}
          <CalculatorDirectorySidebar activeTool="backlog" />

          {/* Center Column: Academic Selectors & Backlog Entry Form */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
              {/* Academic Details Selectors */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Academic Details</h3>
                  <p className="text-[11px] text-text-m mt-0.5">Enter your current academic information</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                    <label className="block text-xs font-semibold text-text-h mb-1">Current CGPA</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={currentCgpa}
                      onChange={(e) => setCurrentCgpa(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                      placeholder="7.20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Current Semester</label>
                    <div className="relative">
                      <select
                        value={currentSemester}
                        onChange={(e) => setCurrentSemester(e.target.value)}
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

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Total Backlogs</label>
                    <input
                      type="number"
                      readOnly
                      value={subjects.length}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold bg-bg-sec/50 text-accent cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                  <Info className="w-4 h-4 text-brandBlue shrink-0" />
                  <span>Add your backlog subjects below to calculate the total backlog credits and get a clearance recovery plan.</span>
                </div>
              </div>

              {/* Enter Backlog Subjects Section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-bold text-text-h">Enter Backlog Subjects</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
                    {subjects.length} Subjects
                  </span>
                </div>

                {/* Table Header */}
                <div className="space-y-2 mt-2">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/50">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">SUBJECT NAME</div>
                    <div className="col-span-2 text-center">CREDITS</div>
                    <div className="col-span-2 text-center">SEMESTER</div>
                    <div className="col-span-1 text-center">STATUS</div>
                    <div className="col-span-1 text-center">ACTION</div>
                  </div>

                  {subjects.map((sub, idx) => (
                    <div key={sub.id} className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/40 transition-colors">
                      {/* Desktop Grid View */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-center font-bold text-xs text-text-light">{idx + 1}</div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                            placeholder="e.g. Data Structures"
                            className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={sub.credits}
                            onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <select
                              value={sub.semester}
                              onChange={(e) => handleSubjectChange(sub.id, 'semester', e.target.value)}
                              className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer appearance-none pr-7"
                            >
                              {SEMESTER_OPTIONS.map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2 pointer-events-none text-text-light" />
                          </div>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-brandPink border border-brandPink/20 whitespace-nowrap">
                            Not Cleared
                          </span>
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.id)}
                            className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                            aria-label={`Delete backlog ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Card Stack */}
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-text-light font-semibold block mb-0.5">Credits</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              step="1"
                              value={sub.credits}
                              onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                              className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-text-light font-semibold block mb-0.5">Semester</label>
                            <select
                              value={sub.semester}
                              onChange={(e) => handleSubjectChange(sub.id, 'semester', e.target.value)}
                              className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              {SEMESTER_OPTIONS.map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button */}
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    disabled={subjects.length >= 15}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/70 bg-accent-soft/40 hover:bg-accent-soft text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Another Subject</span>
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
                    onClick={handleCalculate}
                    className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Calculate Backlog Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Backlog Detailed Analysis Table */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3" aria-label="Backlog Analysis Table">
              <div className="pb-2 border-b border-border/70">
                <h3 className="text-sm font-bold text-text-h">Backlog Analysis</h3>
                <p className="text-[11px] text-text-m mt-0.5">Detailed breakdown and clearance guidance for each backlog</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/60">
                      <th className="py-2.5 px-3">SUBJECT NAME</th>
                      <th className="py-2.5 px-3 text-center">CREDITS</th>
                      <th className="py-2.5 px-3 text-center">SEMESTER</th>
                      <th className="py-2.5 px-3 text-center">STATUS</th>
                      <th className="py-2.5 px-3">RECOMMENDATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-bg-sec/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-text-h">{sub.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-text-h">{sub.credits}</td>
                        <td className="py-2.5 px-3 text-center text-text-m">{sub.semester}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-pink-500/10 text-brandPink border border-brandPink/20">
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-m leading-relaxed">{sub.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2 border-border/80 bg-bg-sec">
                      <td className="py-2.5 px-3 text-text-h font-extrabold">Total Backlog Credits</td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-accent text-sm">{metrics.totalCredits}</td>
                      <td className="py-2.5 px-3 text-center text-text-m">-</td>
                      <td className="py-2.5 px-3 text-center text-text-m">-</td>
                      <td className="py-2.5 px-3 text-text-m">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-[10.5px] text-text-m italic pt-1">
                Note: Recommendations are academic planning guidelines based on university syllabus structures.
              </p>
            </div>
          </div>

          {/* Right Column: Result Gauge & Statistics */}
          <ResultGaugeCard
            score={metrics.backlogCount}
            maxScale={10}
            title="YOUR BACKLOG SUMMARY"
            metrics={resultCardsData}
            standing={standing}
            isMobileModalOpen={isResultModalOpen}
            onCloseMobileModal={() => setIsResultModalOpen(false)}
            metadata={{
              university: university.toUpperCase(),
              regulation: regulation.toUpperCase(),
              course: course.toUpperCase(),
              calculationMethod: 'Academic Recovery & Clearance Model',
              totalBacklogs: `${metrics.backlogCount} Papers`
            }}
            subjectRows={subjects.map((s, idx) => ({
              num: idx + 1,
              name: s.name || `Subject ${idx + 1}`,
              credits: s.credits,
              semester: s.semester,
              status: s.status,
              recommendation: s.recommendation
            }))}
            pdfData={{
              calculatorName: 'Backlog Clearance Strategy Card',
              subtitle: 'Actionable clearance plan and CGPA recovery impact',
              filename: 'ResultPoint_Backlog_Clearance.pdf',
              score: `${metrics.backlogCount}`,
              maxScale: 10,
              standing: standing?.text,
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase(),
                course: course.toUpperCase(),
                calculationMethod: 'Academic Recovery & Clearance Model',
                totalBacklogs: `${metrics.backlogCount} Papers`
              },
              metrics: [
                { label: 'Backlog Papers', value: metrics.backlogCount },
                { label: 'Backlog Credits', value: metrics.totalCredits },
                { label: 'Current CGPA', value: metrics.currentCgpa },
                { label: 'Min CGPA Required', value: metrics.minRequiredCgpa }
              ],
              subjectRows: subjects.map((s, idx) => ({
                num: idx + 1,
                name: s.name || `Subject ${idx + 1}`,
                credits: s.credits,
                semester: s.semester,
                status: s.status,
                recommendation: s.recommendation
              }))
            }}
            shareData={{
              toolName: 'Backlog Calculator',
              score: `${metrics.backlogCount} Backlogs`,
              scaleText: `(${metrics.totalCredits} Credits to clear)`,
              metrics: [
                { label: 'Backlogs', value: metrics.backlogCount },
                { label: 'Pending Credits', value: metrics.totalCredits },
                { label: 'Current CGPA', value: metrics.currentCgpa },
                { label: 'Min CGPA Required', value: metrics.minRequiredCgpa }
              ],
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase()
              }
            }}
            onSave={(record) => {
              setPendingCalc(record);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Dynamic Backlog Credits by Subject SVG Bar Chart (Desktop / Tablet Only) */}
        <section className="hidden lg:block rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3" aria-label="Backlog Credits by Subject Chart">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">Backlog Credits by Subject</h3>
              <p className="text-[11px] text-text-m mt-0.5">Visual representation of credits across backlog subjects</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] pt-2">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 760 190">
                <line x1="35" y1="20" x2="740" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">5</text>
                <line x1="35" y1="55" x2="740" y2="55" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="59" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                <line x1="35" y1="90" x2="740" y2="90" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="94" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">3</text>
                <line x1="35" y1="125" x2="740" y2="125" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="129" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">2</text>
                <line x1="35" y1="160" x2="740" y2="160" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="20" y="164" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <g>
                  {subjects.map((sub, i) => {
                    const cr = parseFloat(sub.credits) || 0;
                    const maxScale = 5;
                    const barHeight = (cr / maxScale) * 140;
                    const slotWidth = 690 / subjects.length;
                    const barWidth = Math.min(52, slotWidth * 0.55);
                    const x = 50 + i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = 160 - Math.min(140, barHeight);

                    return (
                      <g key={sub.id}>
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-text-h">
                          {cr}
                        </text>
                        <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" fill="#FF7300" className="transition-all duration-300" />
                        <text x={x + barWidth / 2} y={178} textAnchor="middle" fontSize="9.5" fill="currentColor" className="text-text-m">
                          {sub.name.length > 18 ? `${sub.name.substring(0, 16)}...` : sub.name}
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