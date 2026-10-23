import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Info,
  RotateCcw,
  BarChart2,
  ArrowRight,
  Target,
  History,
  Lightbulb,
  TrendingUp,
  Loader2
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
import { catalogApi } from '../../../services/api/catalogApi';
import { calculationApi } from '../../../services/api/calculationApi';
import { academicCatalogService } from '../../../services/academicCatalogService';

export default function TargetCGPACalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [university, setUniversity] = useState('jntuh');
  const [regulation, setRegulation] = useState('r18');
  const [course, setCourse] = useState('btech-cse');
  const [semester, setSemester] = useState('sem4');

  const [currentCgpa, setCurrentCgpa] = useState(7.5);
  const [completedCredits, setCompletedCredits] = useState(80);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [totalCourseCredits, setTotalCourseCredits] = useState(160);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Dynamic Catalog States
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  // 1. Fetch Universities on Mount
  useEffect(() => {
    let ignore = false;
    async function loadUniversities() {
      setIsLoadingCatalog(true);
      try {
        const data = await catalogApi.getUniversities();
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setUniversities(data);
        }
      } catch (err) {
        if (!ignore) {
          console.warn('Catalog API unavailable, using fallback data:', err);
          const fallbackUnis = academicCatalogService.getUniversities();
          setUniversities(fallbackUnis.map((u) => ({ id: u.id, name: u.name, code: u.code })));
        }
      } finally {
        if (!ignore) setIsLoadingCatalog(false);
      }
    }
    loadUniversities();
    return () => { ignore = true; };
  }, []);

  // 2. Fetch Courses when University changes
  useEffect(() => {
    let ignore = false;
    async function loadCourses() {
      if (!university) return;
      try {
        const data = await catalogApi.getCoursesByUniversity(university);
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setCourses(data);
          setCourse((prev) => (data.some((c) => c.id === prev || c.code?.toLowerCase() === prev?.toLowerCase()) ? prev : (data[0].id || data[0].code?.toLowerCase())));
        }
      } catch {
        if (!ignore) {
          const fallbackCourses = academicCatalogService.getCourses(university);
          setCourses(fallbackCourses.map((c) => ({ id: c.id, name: c.name, code: c.code })));
        }
      }
    }
    loadCourses();
    return () => { ignore = true; };
  }, [university]);

  // 3. Fetch Regulations when Course changes
  useEffect(() => {
    let ignore = false;
    async function loadRegulations() {
      if (!course) return;
      try {
        const data = await catalogApi.getRegulationsByCourse(course);
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setRegulations(data);
          setRegulation((prev) => (data.some((r) => r.id === prev || r.code?.toLowerCase() === prev?.toLowerCase()) ? prev : (data[0].id || data[0].code?.toLowerCase())));
        }
      } catch {
        if (!ignore) {
          const fallbackRegs = academicCatalogService.getRegulations(university, course);
          setRegulations(fallbackRegs.map((r) => ({ id: r.id, name: r.name, code: r.code })));
        }
      }
    }
    loadRegulations();
    return () => { ignore = true; };
  }, [university, course]);

  const handleReset = () => {
    setCurrentCgpa(7.5);
    setCompletedCredits(80);
    setTargetCgpa(8.5);
    setTotalCourseCredits(160);
    setValidationError('');
    setApiResult(null);
    showToast('Reset to default target parameters (Target: 8.50)');
  };

  // Target Computation Engine (incorporating backend calculation if available)
  const metrics = useMemo(() => {
    const cur = parseFloat(currentCgpa) || 0;
    const comp = parseFloat(completedCredits) || 0;
    const tgt = parseFloat(targetCgpa) || 0;
    const tot = parseFloat(totalCourseCredits) || 0;

    if (comp >= tot) {
      return {
        hasError: true,
        errorMsg: 'Completed credits must be strictly less than total course credits.',
        remainingCredits: 0,
        requiredCgpa: 0,
        formattedRequired: '0.00',
        maxPossibleCgpa: cur.toFixed(2),
        isAchievable: false,
        feasibility: 'Impossible',
        recommendation: 'Completed credits cannot be equal or greater than total course credits.'
      };
    }

    const remainingCredits = tot - comp;
    
    // If backend returned result, use authoritative figures
    if (apiResult) {
      return {
        hasError: false,
        errorMsg: '',
        remainingCredits: Math.round(remainingCredits),
        requiredCgpa: Number(apiResult.requiredSgpa ?? apiResult.requiredCgpa ?? 0),
        formattedRequired: Number(apiResult.requiredSgpa ?? apiResult.requiredCgpa ?? 0).toFixed(2),
        maxPossibleCgpa: apiResult.maxPossibleCgpa != null ? Number(apiResult.maxPossibleCgpa).toFixed(2) : null,
        isAchievable: apiResult.isAchievable ?? (Number(apiResult.requiredSgpa ?? 0) <= 10.0),
        feasibility: apiResult.feasibility || (Number(apiResult.requiredSgpa ?? 0) <= 8.5 ? 'Achievable' : Number(apiResult.requiredSgpa ?? 0) <= 10 ? 'Challenging' : 'Impossible'),
        recommendation: apiResult.recommendation,
        formulaExplanation: apiResult.formulaExplanation
      };
    }

    // Client fallback Formula: ((Target * Total) - (Current * Completed)) / Remaining
    const requiredCgpa = ((tgt * tot) - (cur * comp)) / remainingCredits;
    const formattedRequired = requiredCgpa.toFixed(2);
    const maxPossible = ((cur * comp) + (10.0 * remainingCredits)) / tot;

    return {
      hasError: false,
      errorMsg: '',
      remainingCredits: Math.round(remainingCredits),
      requiredCgpa,
      formattedRequired,
      maxPossibleCgpa: maxPossible.toFixed(2),
      isAchievable: requiredCgpa <= 10.0,
      feasibility: requiredCgpa <= 7.5 ? 'Achievable' : requiredCgpa <= 8.5 ? 'Moderate' : requiredCgpa <= 10.0 ? 'Challenging' : 'Impossible',
      recommendation: null,
      formulaExplanation: null
    };
  }, [currentCgpa, completedCredits, targetCgpa, totalCourseCredits, apiResult]);

  // Determine status and narrative guidance
  const standing = useMemo(() => {
    const req = metrics.requiredCgpa;
    const tgtFormatted = parseFloat(targetCgpa).toFixed(2);
    const reqFormatted = metrics.formattedRequired;

    if (metrics.hasError) {
      return {
        icon: '⚠️',
        text: 'Invalid Parameters',
        narrative: metrics.errorMsg,
        tips: 'Ensure completed credits do not exceed course limits.'
      };
    }

    if (req <= 7.0) {
      return {
        icon: '📈',
        text: 'Manageable',
        narrative: `You need to maintain a CGPA of ${reqFormatted} in the remaining semesters to achieve your target of ${tgtFormatted}.`,
        tips: 'Stay consistent with class lectures and prepare early for semester exams.'
      };
    } else if (req <= 8.5) {
      return {
        icon: '📊',
        text: 'Challenging',
        narrative: `You need to maintain a CGPA of ${reqFormatted} in the remaining semesters to achieve your target of ${tgtFormatted}.`,
        tips: 'Focus on high-credit core papers and aim for A/A+ grades in laboratory components.'
      };
    } else if (req <= 10.0) {
      return {
        icon: '⚡',
        text: 'Very Challenging',
        narrative: `You need to maintain an ambitious CGPA of ${reqFormatted} in the remaining semesters to achieve your target of ${tgtFormatted}.`,
        tips: 'Dedicated revision and scoring maximum internal assessment marks is required.'
      };
    } else {
      return {
        icon: '⚠️',
        text: 'Target Not Achievable',
        narrative: `Target cannot be mathematically achieved (${reqFormatted} > 10.00). Consider choosing a realistic target CGPA.`,
        tips: 'Recalculate with a balanced target to establish a realistic semester goal.'
      };
    }
  }, [metrics, targetCgpa]);

  const resultCardsData = [
    { label: 'Current CGPA', value: parseFloat(currentCgpa).toFixed(2) },
    { label: 'Completed Credits', value: completedCredits },
    { label: 'Remaining Credits', value: metrics.remainingCredits },
    { label: 'Target CGPA', value: parseFloat(targetCgpa).toFixed(2) },
    { label: 'Required CGPA', value: metrics.formattedRequired, highlight: true },
    { label: 'Status', value: standing.text }
  ];

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'Target CGPA Calculator',
      title: 'Target CGPA Planning',
      score: metrics.formattedRequired,
      scale: '10.0',
      result: `Required: ${metrics.formattedRequired} for Target ${parseFloat(targetCgpa).toFixed(2)}`,
      standing: standing?.text || 'Target Plan',
      summary: `Target: ${parseFloat(targetCgpa).toFixed(2)} | Current: ${parseFloat(currentCgpa).toFixed(2)} | Remaining Credits: ${metrics.remainingCredits}`,
      data: {
        currentCgpa: parseFloat(currentCgpa),
        completedCredits: parseFloat(completedCredits),
        targetCgpa: parseFloat(targetCgpa),
        totalCourseCredits: parseFloat(totalCourseCredits),
        remainingCredits: metrics.remainingCredits,
        requiredCgpa: metrics.requiredCgpa,
        formattedRequired: metrics.formattedRequired,
        university,
        course,
        regulation,
        semester,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('Target CGPA plan saved to your history!');
      } else {
        showToast(res.error || 'Failed to save calculation');
      }
    } else {
      setPendingCalc(calcRecord);
      calculationSaveService.setPendingCalculation(calcRecord);
      setIsModalOpen(true);
    }
  };

  const handleCalculate = async () => {
    if (metrics.errorMsg) {
      setValidationError(metrics.errorMsg);
      return;
    }
    const cur = parseFloat(currentCgpa);
    const tgt = parseFloat(targetCgpa);
    if (isNaN(cur) || cur < 0 || cur > 10) {
      setValidationError('Please enter a valid current CGPA between 0.0 and 10.0.');
      return;
    }
    if (isNaN(tgt) || tgt < 0 || tgt > 10) {
      setValidationError('Please enter a valid target CGPA between 0.0 and 10.0.');
      return;
    }
    setValidationError('');

    setIsCalculating(true);
    try {
      const remaining = parseFloat(totalCourseCredits) - parseFloat(completedCredits);
      const res = await calculationApi.calculateTargetCgpa({
        currentCgpa: cur,
        targetCgpa: tgt,
        completedCredits: parseFloat(completedCredits),
        remainingCredits: remaining > 0 ? remaining : 0,
      });
      if (res) {
        setApiResult(res);
      }
    } catch (err) {
      console.warn('Backend target CGPA calculation API failed, using client calculation:', err);
    } finally {
      setIsCalculating(false);
      setIsResultModalOpen(true);
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
            <li className="font-bold text-text-h" aria-current="page">Target CGPA Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Target CGPA Calculator"
          description="Plan your future semesters and find out the CGPA you need to achieve your target"
          icon={Target}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Based on weighted average of total credits"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights target-cgpa) */}
          <CalculatorDirectorySidebar activeTool="target-cgpa" />

          {/* Center Column: Target Form & Calculation Breakdown */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
              {/* Section 1: Current Academic Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Current Academic Details</h3>
                  <p className="text-[11px] text-text-m mt-0.5">Enter your current performance details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1 flex items-center justify-between">
                      <span>University</span>
                      {isLoadingCatalog && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                    </label>
                    <div className="relative">
                      <select
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                      >
                        {universities.length > 0 ? (
                          universities.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.code})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="jntuh">JNTU Hyderabad</option>
                            <option value="anna">Anna University</option>
                            <option value="osmania">Osmania University</option>
                            <option value="generic">Standard 10-Point Scale</option>
                          </>
                        )}
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
                        {regulations.length > 0 ? (
                          regulations.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.code})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="r18">R18</option>
                            <option value="r22">R22</option>
                            <option value="r16">R16</option>
                          </>
                        )}
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
                        {courses.length > 0 ? (
                          courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="btech-cse">B.Tech - Computer Science</option>
                            <option value="btech-ece">B.Tech - Electronics & Comm</option>
                            <option value="btech-it">B.Tech - Information Tech</option>
                            <option value="btech-mech">B.Tech - Mechanical Engg</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Current Semester</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                      placeholder="7.50"
                      required
                    />
                    <p className="text-[10px] text-text-m mt-1">Your current cumulative GPA</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Total Credits Completed</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="1"
                      value={completedCredits}
                      onChange={(e) => setCompletedCredits(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                      placeholder="80"
                      required
                    />
                    <p className="text-[10px] text-text-m mt-1">Total credits completed till now</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/80"></div>

              {/* Section 2: Target Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Target Details</h3>
                  <p className="text-[11px] text-text-m mt-0.5">Set your target and plan ahead</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Target CGPA</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={targetCgpa}
                      onChange={(e) => setTargetCgpa(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                      placeholder="8.50"
                      required
                    />
                    <p className="text-[10px] text-text-m mt-1">The graduation CGPA you want to achieve</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-h mb-1">Total Credits of Course</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="1"
                      value={totalCourseCredits}
                      onChange={(e) => setTotalCourseCredits(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                      placeholder="160"
                      required
                    />
                    <p className="text-[10px] text-text-m mt-1">Total degree credits required</p>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                  <Info className="w-4 h-4 text-brandBlue shrink-0" />
                  <span>The calculator estimates the minimum semester average required in remaining credits to hit your goal.</span>
                </div>

                {(metrics.hasError || validationError) && (
                  <p className="text-[11px] text-brandPink mt-1.5 text-center font-medium">{metrics.errorMsg || validationError}</p>
                )}

                {/* Form Buttons */}
                <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between gap-3">
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
                    disabled={isCalculating}
                    className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-70 text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Calculate Target</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Algebraic Breakdown Table Card */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-2.5">
              <div className="pb-2 border-b border-border/70">
                <h3 className="text-sm font-bold text-text-h">Calculation Breakdown</h3>
                <p className="text-[11px] text-text-m mt-0.5">Step-by-step formula resolving remaining requirements</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/60">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    <tr className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-h">Total Credits of Course (A)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-h">{totalCourseCredits}</td>
                    </tr>
                    <tr className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-h">Credits Completed (B)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-h">{completedCredits}</td>
                    </tr>
                    <tr className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-h">Remaining Credits (C) = A − B</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-h">{metrics.remainingCredits}</td>
                    </tr>
                    <tr className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-h">Current CGPA (D)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-h">{parseFloat(currentCgpa).toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-h">Target CGPA (T)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text-h">{parseFloat(targetCgpa).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-orange-500/10 font-bold border-l-4 border-accent">
                      <td className="py-2.5 px-3 text-text-h">
                        <span>Required CGPA for Remaining Credits</span>
                        <span className="block text-[10px] text-text-m font-normal mt-0.5">[(T × A) − (D × B)] ÷ C</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-accent text-sm">
                        {metrics.formattedRequired}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10.5px] text-text-m italic pt-1">
                Note: Assumes a uniform average grade across all remaining semester credits.
              </p>
            </div>
          </div>

          {/* Right Column: Result Gauge & Target History (Desktop / Tablet Only) */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Target Evaluation Results">
            <ResultGaugeCard
              score={Math.min(10, Math.max(0, metrics.requiredCgpa))}
              maxScale={10}
              title="YOUR TARGET RESULT"
              metrics={resultCardsData}
              standing={standing}
              isMobileModalOpen={isResultModalOpen}
              onCloseMobileModal={() => setIsResultModalOpen(false)}
              metadata={{
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase(),
                course: course.toUpperCase(),
                targetCGPA: parseFloat(targetCgpa).toFixed(2),
                calculationMethod: 'Linear Academic Credit Balance Model',
                remainingCredits: `${metrics.remainingCredits} Credits`
              }}
              subjectRows={[
                { param: 'Current CGPA', value: `${parseFloat(currentCgpa).toFixed(2)} / 10` },
                { param: 'Completed Credits', value: `${completedCredits} Credits` },
                { param: 'Target CGPA Goal', value: `${parseFloat(targetCgpa).toFixed(2)} / 10` },
                { param: 'Total Degree Credits', value: `${totalCourseCredits} Credits` },
                { param: 'Remaining Credits', value: `${metrics.remainingCredits} Credits` },
                { param: 'Required Future SGPA', value: `${metrics.formattedRequired} / 10` },
                { param: 'Feasibility Assessment', value: standing.text }
              ]}
              pdfData={{
                calculatorName: 'Target CGPA Strategy Card',
                subtitle: 'Calculated required future performance to hit target CGPA',
                filename: 'ResultPoint_Target_CGPA_Result.pdf',
                score: `${metrics.formattedRequired}`,
                maxScale: '10.0 Target Scale',
                standing: standing?.text,
                metadata: {
                  university: university.toUpperCase(),
                  regulation: regulation.toUpperCase(),
                  course: course.toUpperCase(),
                  targetCGPA: parseFloat(targetCgpa).toFixed(2),
                  calculationMethod: 'Linear Academic Credit Balance Model',
                  remainingCredits: `${metrics.remainingCredits} Credits`
                },
                metrics: [
                  { label: 'Current CGPA', value: parseFloat(currentCgpa).toFixed(2) },
                  { label: 'Target CGPA', value: parseFloat(targetCgpa).toFixed(2) },
                  { label: 'Completed Credits', value: completedCredits },
                  { label: 'Remaining Credits', value: metrics.remainingCredits },
                  { label: 'Required CGPA', value: metrics.formattedRequired },
                  { label: 'Strategic Status', value: standing.text }
                ],
                subjectRows: [
                  { param: 'Current CGPA', value: `${parseFloat(currentCgpa).toFixed(2)} / 10` },
                  { param: 'Completed Credits', value: `${completedCredits} Credits` },
                  { param: 'Target CGPA Goal', value: `${parseFloat(targetCgpa).toFixed(2)} / 10` },
                  { param: 'Total Degree Credits', value: `${totalCourseCredits} Credits` },
                  { param: 'Remaining Credits', value: `${metrics.remainingCredits} Credits` },
                  { param: 'Required Future SGPA', value: `${metrics.formattedRequired} / 10` },
                  { param: 'Feasibility Assessment', value: standing.text }
                ]
              }}
              shareData={{
                toolName: 'Target CGPA Planner',
                score: `${metrics.formattedRequired} CGPA Required`,
                scaleText: `(to reach ${parseFloat(targetCgpa).toFixed(2)} Target)`,
                metrics: [
                  { label: 'Current CGPA', value: parseFloat(currentCgpa).toFixed(2) },
                  { label: 'Target CGPA', value: parseFloat(targetCgpa).toFixed(2) },
                  { label: 'Remaining Credits', value: metrics.remainingCredits },
                  { label: 'Required CGPA', value: metrics.formattedRequired }
                ],
                metadata: {
                  university: university.toUpperCase(),
                  regulation: regulation.toUpperCase()
                }
              }}
              onSave={handleSaveResult}
            />

            {/* Recent Targets Card */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-h uppercase tracking-wider">RECENT CALCULATIONS</h4>
                </div>
                <button type="button" className="text-[10.5px] font-semibold text-accent hover:underline">View All</button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Target CGPA: 8.50</span>
                    <span className="text-[10px] text-text-m">Current: 7.50 | Credits: 80</span>
                  </div>
                  <span className="text-[10px] text-text-light font-medium">Current session</span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Target CGPA: 8.00</span>
                    <span className="text-[10px] text-text-m">Current: 7.20 | Credits: 60</span>
                  </div>
                  <span className="text-[10px] text-text-light font-medium">1 day ago</span>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Target CGPA: 9.00</span>
                    <span className="text-[10px] text-text-m">Current: 8.10 | Credits: 80</span>
                  </div>
                  <span className="text-[10px] text-text-light font-medium">1 week ago</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Tips to Achieve Target</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Focus on consistency, attend classes regularly and practice numerical papers early.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Keep Going!</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Set realistic goals and improve gradually semester over semester.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Dynamic Comparison Bar Chart (Desktop / Tablet Only) */}
        <section className="hidden lg:block rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3" aria-label="CGPA Progress Visualization">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">CGPA Progress Visualization</h3>
              <p className="text-[11px] text-text-m mt-0.5">Your current CGPA vs required CGPA vs target CGPA</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] pt-2">
              <svg className="w-full h-56 overflow-visible" viewBox="0 0 650 200">
                <line x1="40" y1="20" x2="620" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">10</text>
                <line x1="40" y1="56" x2="620" y2="56" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="60" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">8</text>
                <line x1="40" y1="92" x2="620" y2="92" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="96" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">6</text>
                <line x1="40" y1="128" x2="620" y2="128" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="25" y="132" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                <line x1="40" y1="170" x2="620" y2="170" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="25" y="174" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                {/* 3 Comparison Bars */}
                {[
                  { label: 'Current CGPA', val: parseFloat(currentCgpa) || 0, color: '#EA580C', x: 120 },
                  { label: 'Required CGPA', val: Math.min(10, Math.max(0, metrics.requiredCgpa)), color: metrics.requiredCgpa > 10 ? '#EC4899' : '#FF7300', x: 300 },
                  { label: 'Target CGPA', val: parseFloat(targetCgpa) || 0, color: '#FBBF24', x: 480 }
                ].map((item) => {
                  const barHeight = (item.val / 10) * 150;
                  const y = 170 - barHeight;
                  const barWidth = 64;

                  return (
                    <g key={item.label}>
                      <text x={item.x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor" className="text-text-h">
                        {item.val.toFixed(2)}
                      </text>
                      <rect
                        x={item.x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, barHeight)}
                        rx="6"
                        fill={item.color}
                        className="transition-all duration-300 hover:opacity-90"
                      />
                      <text x={item.x + barWidth / 2} y={188} textAnchor="middle" fontSize="10.5" fontWeight="500" fill="currentColor" className="text-text-m">
                        {item.label}
                      </text>
                    </g>
                  );
                })}
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