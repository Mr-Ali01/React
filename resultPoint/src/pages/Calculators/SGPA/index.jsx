import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, GraduationCap } from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import ResultGaugeCard from '../ResultGaugeCard';
import CalculatorPageHeader from '../CalculatorPageHeader';
import SubjectFormTable from '../SubjectFormTable';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { saveCalculationToHistory } from '../../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../../services/calculationSaveService';
import { academicCatalogService } from '../../../services/academicCatalogService';
import { academicCalculationEngine } from '../../../services/academicCalculationEngine';
import { catalogApi } from '../../../services/api/catalogApi';
import { calculationApi } from '../../../services/api/calculationApi';

const GRADE_POINTS_MAP = {
  S: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  D: 4,
  F: 0,
};

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Operating Systems', credits: 4, grade: 'A' },
  { id: '2', name: 'Database Management Systems', credits: 4, grade: 'A+' },
  { id: '3', name: 'Computer Networks', credits: 3, grade: 'B+' },
  { id: '4', name: 'Software Engineering', credits: 3, grade: 'A' },
  { id: '5', name: 'Web Technologies', credits: 3, grade: 'B' },
  { id: '6', name: 'Design and Analysis of Algorithms', credits: 4, grade: 'A' },
];

export default function SGPACalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [university, setUniversity] = useState('uni_jntuh');
  const [course, setCourse] = useState('course_jntuh_btech_cse');
  const [regulation, setRegulation] = useState('reg_jntuh_r18');
  const [semester, setSemester] = useState('Semester 1');
  const [gradeSystem, setGradeSystem] = useState('10-point');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');

  // WP-2 Dynamic catalog & calculation state
  const [universityOptions, setUniversityOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [regulationOptions, setRegulationOptions] = useState([]);
  const [activeRegulationDetail, setActiveRegulationDetail] = useState(null);
  const [backendResult, setBackendResult] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiNotice, setApiNotice] = useState('');

  // 1. Fetch Universities from Backend Catalog API
  useEffect(() => {
    let ignore = false;
    async function loadUniversities() {
      try {
        setIsCatalogLoading(true);
        const res = await catalogApi.getUniversities({ size: 50 });
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setUniversityOptions(list);
            setUniversity((prev) => (list.some((u) => u.id === prev) ? prev : list[0].id));
          }
        }
      } catch {
        if (!ignore) {
          // Gracefully fallback to local catalog service
          const localUnivs = academicCatalogService.getUniversities();
          if (localUnivs && localUnivs.length > 0) {
            setUniversityOptions(localUnivs);
            setUniversity((prev) => (localUnivs.some((u) => u.id === prev) ? prev : localUnivs[0].id));
          }
          setApiNotice('Operating in offline mode using verified catalog cache.');
        }
      } finally {
        if (!ignore) setIsCatalogLoading(false);
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
        setIsCatalogLoading(true);
        const res = await catalogApi.getCoursesByUniversity(university);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setCourseOptions(list);
            setCourse((prev) => (list.some((c) => c.id === prev) ? prev : list[0].id));
          } else {
            // Local fallback
            const localCourses = academicCatalogService.getCoursesByUniversity(university);
            setCourseOptions(localCourses);
            setCourse((prev) => (localCourses.length > 0 && localCourses.some((c) => c.id === prev) ? prev : (localCourses[0]?.id || '')));
          }
        }
      } catch {
        if (!ignore) {
          const localCourses = academicCatalogService.getCoursesByUniversity(university);
          setCourseOptions(localCourses);
          setCourse((prev) => (localCourses.length > 0 && localCourses.some((c) => c.id === prev) ? prev : (localCourses[0]?.id || '')));
        }
      } finally {
        if (!ignore) setIsCatalogLoading(false);
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
        setIsCatalogLoading(true);
        const res = await catalogApi.getRegulationsByCourse(course);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setRegulationOptions(list);
            setRegulation((prev) => (list.some((r) => r.id === prev) ? prev : list[0].id));
          } else {
            const localRegs = academicCatalogService.getRegulationsByCourse(university, course);
            setRegulationOptions(localRegs);
            setRegulation((prev) => (localRegs.length > 0 && localRegs.some((r) => r.id === prev) ? prev : (localRegs[0]?.id || '')));
          }
        }
      } catch {
        if (!ignore) {
          const localRegs = academicCatalogService.getRegulationsByCourse(university, course);
          setRegulationOptions(localRegs);
          setRegulation((prev) => (localRegs.length > 0 && localRegs.some((r) => r.id === prev) ? prev : (localRegs[0]?.id || '')));
        }
      } finally {
        if (!ignore) setIsCatalogLoading(false);
      }
    }
    loadRegulations();
    return () => { ignore = true; };
  }, [course, university]);

  // 4. Fetch Full Regulation Detail (Grading Scale & Calculation Rule)
  useEffect(() => {
    let ignore = false;
    async function loadRegulationDetail() {
      if (!regulation) return;
      try {
        const detail = await catalogApi.getRegulationById(regulation);
        if (!ignore && detail) {
          setActiveRegulationDetail(detail);
        }
      } catch {
        if (!ignore) {
          const local = academicCatalogService.getFullConfiguration(university, course, regulation);
          setActiveRegulationDetail(local);
        }
      }
    }
    loadRegulationDetail();
    return () => { ignore = true; };
  }, [regulation, course, university]);

  const handleAddSubject = () => {
    if (subjects.length >= 12) return;
    setBackendResult(null);
    const topGrade = activeRegulationDetail?.gradingScale?.boundaries?.[0]?.gradeLetter
      || (activeRegulationDetail?.gradeScale?.[0]?.grade)
      || 'A';
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Subject ${prev.length + 1}`, credits: 3, grade: topGrade },
    ]);
    showToast(`Subject ${subjects.length + 1} added`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required for SGPA calculation.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setBackendResult(null);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Subject removed');
  };

  const handleSubjectChange = (id, field, value) => {
    setBackendResult(null);
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleReset = () => {
    setBackendResult(null);
    setSubjects(DEFAULT_SUBJECTS);
    showToast('Form reset to default subjects');
  };

  // Derive dynamic grading scale lookup (prioritizing backend boundaries, e.g. S-Grade for OU)
  const effectiveGradePointsMap = useMemo(() => {
    if (activeRegulationDetail?.gradingScale?.boundaries?.length > 0) {
      const map = {};
      activeRegulationDetail.gradingScale.boundaries.forEach((b) => {
        map[b.gradeLetter] = Number(b.gradePoints);
      });
      return map;
    }
    if (activeRegulationDetail?.gradeScale?.length > 0) {
      const map = {};
      activeRegulationDetail.gradeScale.forEach((g) => {
        map[g.grade] = Number(g.points);
      });
      return map;
    }
    return GRADE_POINTS_MAP;
  }, [activeRegulationDetail]);

  // Live Metrics: uses backend result when available, otherwise calculates client-side
  const metrics = useMemo(() => {
    if (backendResult) {
      const sgpa = Number(backendResult.sgpa) || 0;
      const totalCredits = Number(backendResult.totalCredits) || 0;
      const totalPoints = Number(backendResult.totalCreditPoints) || 0;
      const percentRes = academicCalculationEngine.convertCGPAToPercentage(
        sgpa,
        activeRegulationDetail?.calculationRule || (university.includes('jntuh') ? '(CGPA - 0.5) * 10' : 'CGPA * 10')
      );
      return {
        totalCredits,
        totalPoints,
        sgpa,
        percentage: percentRes.percentage,
        letterGrade: backendResult.subjectResults?.[0]?.letterGrade || 'A',
        formulaUsed: backendResult.formulaExplanation || percentRes.formulaUsed,
        isVerifiedBackend: true
      };
    }

    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach((s) => {
      const cr = parseFloat(s.credits) || 0;
      const pts = effectiveGradePointsMap[s.grade] ?? (GRADE_POINTS_MAP[s.grade] ?? 0);
      totalCredits += cr;
      totalPoints += cr * pts;
    });

    const sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    const percentRes = academicCalculationEngine.convertCGPAToPercentage(
      sgpa,
      activeRegulationDetail?.calculationRule || (university.includes('jntuh') ? '(CGPA - 0.5) * 10' : 'CGPA * 10')
    );
    const percentage = percentRes.percentage;

    let letterGrade = 'F';
    const topGrade = Object.keys(effectiveGradePointsMap)[0] || 'A+';
    if (sgpa >= 9.0) letterGrade = topGrade;
    else if (sgpa >= 8.0) letterGrade = 'A';
    else if (sgpa >= 7.0) letterGrade = 'B+';
    else if (sgpa >= 6.0) letterGrade = 'B';
    else if (sgpa >= 5.0) letterGrade = 'C';
    else if (sgpa >= 4.0) letterGrade = 'D';

    return { totalCredits, totalPoints, sgpa, percentage, letterGrade, formulaUsed: percentRes.formulaUsed, isVerifiedBackend: false };
  }, [subjects, effectiveGradePointsMap, activeRegulationDetail, university, backendResult]);

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'SGPA Calculator',
      title: 'SGPA Evaluation',
      score: metrics.sgpa.toFixed(2),
      scale: '10.0',
      result: `${metrics.sgpa.toFixed(2)} SGPA`,
      standing: standing?.text || 'Good',
      summary: `Total Credits: ${metrics.totalCredits} | Total Points: ${Math.round(metrics.totalPoints)} | Percentage: ${metrics.percentage.toFixed(1)}%`,
      data: {
        sgpa: metrics.sgpa,
        percentage: metrics.percentage,
        totalCredits: metrics.totalCredits,
        totalPoints: metrics.totalPoints,
        letterGrade: metrics.letterGrade,
        university,
        course,
        regulation,
        semester,
        gradeSystem,
        subjects,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('SGPA calculation saved to your history!');
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
    if (!subjects || subjects.length === 0) {
      setValidationError('At least one subject is required for SGPA calculation.');
      return;
    }
    const invalidCredits = subjects.some(
      (s) => !s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) <= 0
    );
    if (invalidCredits) {
      setValidationError('Please enter valid positive credits for all subjects.');
      return;
    }
    setValidationError('');
    setIsCalculating(true);
    setApiNotice('');

    try {
      const resp = await calculationApi.calculateSgpa({
        universityId: university,
        regulationId: regulation,
        subjects
      });
      if (resp) {
        setBackendResult(resp);
        showToast('SGPA verified by Academic Calculation Engine');
      }
    } catch {
      setApiNotice('Backend calculation service unavailable; calculated using verified client engine.');
    } finally {
      setIsCalculating(false);
      setIsResultModalOpen(true);
    }
  };

  // Standing & Recommendations
  const standing = (() => {
    if (metrics.sgpa >= 9.0) {
      return {
        icon: '🏆',
        text: 'Excellent Performance',
        narrative: "Outstanding work! You've achieved mastery this semester.",
        tips: 'Keep up the remarkable rhythm and consider pursuing honors or advanced capstones.',
      };
    }
    if (metrics.sgpa >= 8.0) {
      return {
        icon: '📊',
        text: 'Good Performance',
        narrative: "Great! You're performing well. Keep up the good work!",
        tips: 'Focus on difficult subjects, manage your time and practice regularly.',
      };
    }
    if (metrics.sgpa >= 7.0) {
      return {
        icon: '📈',
        text: 'Good Progress',
        narrative: 'Steady progress! Pushing higher in core courses will lift your graduation honors.',
        tips: 'Dedicate extra revision sessions to practical and laboratory submissions.',
      };
    }
    if (metrics.sgpa >= 6.0) {
      return {
        icon: '⚖️',
        text: 'Average Performance',
        narrative: 'Consistent effort in upcoming semesters will bring your cumulative standing higher.',
        tips: 'Form collaborative study groups and consult professors on difficult concepts.',
      };
    }
    return {
      icon: '⚠️',
      text: 'Needs Improvement',
      narrative: 'Revisit foundational topics and clarify doubts before end-term evaluations.',
      tips: 'Prioritize high-credit subjects and address pending backlogs early.',
    };
  })();

  const resultCardsData = [
    { label: 'Total Credits', value: metrics.totalCredits },
    { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
    { label: 'SGPA', value: metrics.sgpa.toFixed(2), highlight: true },
    { label: 'Percentage Equivalent', value: `${metrics.percentage.toFixed(2)}%` },
    { label: 'Letter Grade', value: metrics.letterGrade },
  ];

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
            <li className="font-bold text-text-h" aria-current="page">SGPA Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Reusable Header */}
        <CalculatorPageHeader
          title="SGPA Calculator"
          description="Calculate your Semester Grade Point Average based on subject credits and grades"
          icon={GraduationCap}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Weighted Average (Credit Based)"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights SGPA) */}
          <CalculatorDirectorySidebar activeTool="sgpa" />

          {/* Reusable Subject Form Table */}
          <SubjectFormTable
            university={university}
            setUniversity={setUniversity}
            course={course}
            setCourse={setCourse}
            regulation={regulation}
            setRegulation={setRegulation}
            gradeSystem={gradeSystem}
            setGradeSystem={setGradeSystem}
            semester={semester}
            setSemester={setSemester}
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onRemoveSubject={handleRemoveSubject}
            onSubjectChange={handleSubjectChange}
            onReset={handleReset}
            onSubmit={handleCalculate}
            gradePointsMap={effectiveGradePointsMap}
            regulationName={regulation.toUpperCase()}
            validationError={validationError}
            infoBannerText="Enter your subjects, credits and grades for the selected semester to calculate your SGPA."
            actionButtonText="Calculate SGPA"
            universityOptions={universityOptions}
            courseOptions={courseOptions}
            regulationOptions={regulationOptions}
            isLoading={isCatalogLoading}
            isCalculating={isCalculating}
            apiError={apiNotice}
            onRetry={handleCalculate}
          />

          {/* Reusable Result Gauge Card */}
          <ResultGaugeCard
            score={metrics.sgpa}
            maxScale={10}
            title="YOUR SGPA RESULT"
            metrics={resultCardsData}
            standing={standing}
            isMobileModalOpen={isResultModalOpen}
            onCloseMobileModal={() => setIsResultModalOpen(false)}
            metadata={{
              university: (university || 'JNTUH').toUpperCase(),
              regulation: (regulation || 'R18').toUpperCase(),
              course: (course || 'B.Tech').toUpperCase(),
              semester: (semester || 'Semester 1').toUpperCase(),
              calculationMethod: 'Weighted Average (Credit Based)',
              totalSubjects: subjects.length
            }}
            subjectRows={subjects.map((s, idx) => ({
              num: idx + 1,
              name: s.name || `Subject ${idx + 1}`,
              credits: s.credits,
              grade: s.grade,
              gradePoints: effectiveGradePointsMap[s.grade] ?? 0,
              creditPoints: (parseFloat(s.credits) || 0) * (effectiveGradePointsMap[s.grade] ?? 0)
            }))}
            pdfData={{
              calculatorName: 'SGPA Result Card',
              subtitle: 'Calculated using your semester subject credits and grades',
              filename: 'ResultPoint_SGPA_Result.pdf',
              score: metrics.sgpa.toFixed(2),
              maxScale: 10,
              standing: standing?.text,
              metadata: {
                university: (university || 'JNTUH').toUpperCase(),
                regulation: (regulation || 'R18').toUpperCase(),
                course: (course || 'B.Tech').toUpperCase(),
                semester: (semester || 'Semester 1').toUpperCase(),
                calculationMethod: 'Weighted Average (Credit Based)',
                totalSubjects: subjects.length
              },
              subjectRows: subjects.map((s, idx) => ({
                num: idx + 1,
                name: s.name || `Subject ${idx + 1}`,
                credits: s.credits,
                grade: s.grade,
                gradePoints: GRADE_POINTS_MAP[s.grade] ?? 0,
                creditPoints: (parseFloat(s.credits) || 0) * (GRADE_POINTS_MAP[s.grade] ?? 0)
              })),
              metrics: [
                { label: 'Total Credits', value: metrics.totalCredits },
                { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
                { label: 'Percentage Equivalent', value: `${metrics.percentage.toFixed(2)}%` },
                { label: 'Letter Grade', value: metrics.letterGrade }
              ]
            }}
            shareData={{
              toolName: 'SGPA',
              score: metrics.sgpa.toFixed(2),
              scaleText: 'out of 10',
              metrics: [
                { label: 'Total Credits', value: metrics.totalCredits },
                { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
                { label: 'Percentage', value: `${metrics.percentage.toFixed(2)}%` },
                { label: 'Letter Grade', value: metrics.letterGrade }
              ],
              metadata: {
                university: (university || 'JNTUH').toUpperCase(),
                regulation: (regulation || 'R18').toUpperCase(),
                semester: (semester || 'Semester 1').toUpperCase()
              }
            }}
            onSave={handleSaveResult}
          />
        </div>

        {/* Dynamic Semester Bar Chart (Desktop / Tablet Only) */}
        <section className="hidden lg:block rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4" aria-label="Semester Performance Visualization">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">Your Semester Performance</h3>
              <p className="text-xs text-text-m mt-0.5">Track your subject-wise performance in this semester.</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] pt-2">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 760 190">
                <line x1="35" y1="20" x2="740" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">10</text>
                <line x1="35" y1="50" x2="740" y2="50" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="54" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">8</text>
                <line x1="35" y1="80" x2="740" y2="80" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="84" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">6</text>
                <line x1="35" y1="110" x2="740" y2="110" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="114" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                <line x1="35" y1="140" x2="740" y2="140" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="144" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">2</text>
                <line x1="35" y1="160" x2="740" y2="160" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="20" y="164" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <g>
                  {subjects.map((sub, i) => {
                    const pts = GRADE_POINTS_MAP[sub.grade] ?? 0;
                    const barHeight = (pts / 10) * 140;
                    const slotWidth = 690 / subjects.length;
                    const barWidth = Math.min(50, slotWidth * 0.62);
                    const x = 50 + i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = 160 - barHeight;

                    return (
                      <g key={sub.id}>
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-text-h">
                          {pts}
                        </text>
                        <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" fill="#FF7300" className="transition-all duration-300" />
                        <text x={x + barWidth / 2} y={178} textAnchor="middle" fontSize="9.5" fill="currentColor" className="text-text-m">
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