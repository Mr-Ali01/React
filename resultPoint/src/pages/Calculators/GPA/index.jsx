import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, Calculator } from 'lucide-react';
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

const DEFAULT_GRADE_POINTS_MAP = {
  S: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, D: 4, F: 0
};

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Mathematics - I', credits: 4, grade: 'A' },
  { id: '2', name: 'Engineering Physics', credits: 4, grade: 'B+' },
  { id: '3', name: 'Programming for Problem Solving', credits: 3, grade: 'A' },
  { id: '4', name: 'Engineering Graphics', credits: 3, grade: 'B' },
  { id: '5', name: 'Environmental Science', credits: 2, grade: 'A+' }
];

export default function GPACalculator() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [university, setUniversity] = useState('jntuh');
  const [course, setCourse] = useState('btech-cse');
  const [regulation, setRegulation] = useState('r18');
  const [gradeSystem, setGradeSystem] = useState('10-point');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Dynamic Catalog States
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [activeRegDetail, setActiveRegDetail] = useState(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // 1. Fetch Universities on Mount
  useEffect(() => {
    let ignore = false;
    async function loadUniversities() {
      setIsLoadingCatalog(true);
      try {
        const data = await catalogApi.getUniversities();
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setUniversities(data);
          setApiError(null);
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

  // 4. Fetch Regulation Details when Regulation changes
  useEffect(() => {
    let ignore = false;
    async function loadRegulationDetail() {
      if (!regulation) return;
      try {
        const detail = await catalogApi.getRegulationById(regulation);
        if (!ignore && detail) {
          setActiveRegDetail(detail);
        }
      } catch {
        if (!ignore) {
          setActiveRegDetail(null);
        }
      }
    }
    loadRegulationDetail();
    return () => { ignore = true; };
  }, [regulation, university, course]);

  // Dynamically resolved Grade Points Map
  const dynamicGradePointsMap = useMemo(() => {
    if (activeRegDetail?.gradingScale?.boundaries && Array.isArray(activeRegDetail.gradingScale.boundaries)) {
      const map = {};
      activeRegDetail.gradingScale.boundaries.forEach((b) => {
        map[b.grade] = Number(b.gradePoints);
      });
      return map;
    }
    // Fallback: check Osmania University rule
    if (university === 'osmania' || university === 'uni_ou') {
      return { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
    }
    return DEFAULT_GRADE_POINTS_MAP;
  }, [activeRegDetail, university]);

  const handleAddSubject = () => {
    if (subjects.length >= 12) return;
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Subject ${prev.length + 1}`, credits: 3, grade: 'A' }
    ]);
    showToast(`Subject ${subjects.length + 1} added`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required for GPA calculation.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Subject removed');
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_SUBJECTS);
    showToast('Form reset to default subjects');
  };

  const metrics = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach((s) => {
      const cr = parseFloat(s.credits) || 0;
      const pts = dynamicGradePointsMap[s.grade] ?? 0;
      totalCredits += cr;
      totalPoints += cr * pts;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    // Wire to central Academic Calculation Engine with university rule
    const isJntuh = university === 'jntuh' || university === 'uni_jntuh';
    const percentRes = academicCalculationEngine.convertCGPAToPercentage(
      gpa,
      isJntuh ? '(CGPA - 0.5) * 10' : 'CGPA * 10'
    );
    const percentage = percentRes.percentage;

    let letterGrade = 'F';
    if (gpa >= 9.0) letterGrade = dynamicGradePointsMap['S'] ? 'S' : 'A+';
    else if (gpa >= 8.0) letterGrade = 'A';
    else if (gpa >= 7.0) letterGrade = 'B+';
    else if (gpa >= 6.0) letterGrade = 'B';
    else if (gpa >= 5.0) letterGrade = 'C';
    else if (gpa >= 4.0) letterGrade = 'D';

    return { totalCredits, totalPoints, gpa, percentage, letterGrade, formulaUsed: percentRes.formulaUsed };
  }, [subjects, university, dynamicGradePointsMap]);

  const standing = useMemo(() => {
    if (metrics.gpa >= 9.0) {
      return { icon: '🏆', text: 'Excellent Performance', narrative: "Outstanding work! You're performing at the top tier.", tips: 'Aim for consistency and consider pursuing academic honors.' };
    }
    if (metrics.gpa >= 7.5) {
      return { icon: '📊', text: 'Good Performance', narrative: "You're doing well! Keep up the consistent effort.", tips: 'Focus on understanding core concepts and practice regularly.' };
    }
    if (metrics.gpa >= 6.0) {
      return { icon: '📈', text: 'Steady Progress', narrative: 'Good effort! Pushing slightly higher will elevate your grade bracket.', tips: 'Dedicate more revision time to theoretical and numerical problems.' };
    }
    return { icon: '⚠️', text: 'Needs Improvement', narrative: 'Revisit foundational topics and clarify doubts ahead of final exams.', tips: 'Prioritize high-credit courses and consult professors.' };
  }, [metrics.gpa]);

  const handleSaveResult = () => {
    const calcRecord = {
      calculatorType: 'GPA Calculator',
      title: 'GPA Evaluation',
      score: metrics.gpa.toFixed(2),
      scale: '10.0',
      result: `${metrics.gpa.toFixed(2)} GPA`,
      standing: standing?.text || 'Good',
      summary: `Total Credits: ${metrics.totalCredits} | Points: ${Math.round(metrics.totalPoints)} | Percentage: ${metrics.percentage.toFixed(1)}%`,
      data: {
        gpa: metrics.gpa,
        percentage: metrics.percentage,
        totalCredits: metrics.totalCredits,
        totalPoints: metrics.totalPoints,
        letterGrade: metrics.letterGrade,
        university,
        course,
        regulation,
        gradeSystem,
        subjects,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('GPA calculation saved to your history!');
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
      setValidationError('At least one subject is required for GPA calculation.');
      return;
    }
    const invalid = subjects.some(
      (s) => !s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) <= 0
    );
    if (invalid) {
      setValidationError('Please enter valid positive credits for all subjects.');
      return;
    }
    setValidationError('');

    // Call backend SGPA calculation API
    setIsCalculating(true);
    try {
      const payload = {
        regulationId: regulation,
        subjects: subjects.map((s) => ({
          subjectName: s.name,
          credits: parseFloat(s.credits) || 0,
          grade: s.grade,
        })),
      };
      await calculationApi.calculateSgpa(payload);
      setApiError(null);
    } catch (err) {
      console.warn('Backend SGPA calculation API failed, using fallback engine:', err);
    } finally {
      setIsCalculating(false);
      setIsResultModalOpen(true);
    }
  };

  const resultCardsData = [
    { label: 'Total Credits', value: metrics.totalCredits },
    { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
    { label: 'GPA', value: metrics.gpa.toFixed(2), highlight: true },
    { label: 'Percentage Equivalent', value: `${metrics.percentage.toFixed(2)}%` },
    { label: 'Letter Grade', value: metrics.letterGrade }
  ];

  return (
    <>
      {/* Breadcrumb */}
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
            <li className="font-bold text-text-h" aria-current="page">GPA Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Reusable Header */}
        <CalculatorPageHeader
          title="GPA Calculator"
          description="Calculate your Grade Point Average based on subject credits and grades"
          icon={Calculator}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Weighted Average (Credit Based)"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <CalculatorDirectorySidebar activeTool="gpa" />

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
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onRemoveSubject={handleRemoveSubject}
            onSubjectChange={handleSubjectChange}
            onReset={handleReset}
            onSubmit={handleCalculate}
            gradePointsMap={dynamicGradePointsMap}
            regulationName={activeRegDetail?.name || regulation.toUpperCase()}
            validationError={validationError}
            infoBannerText="Enter your subjects, credits and grades to calculate your GPA."
            actionButtonText="Calculate GPA"
            universityOptions={universities.map((u) => ({ id: u.id, name: u.name, code: u.code }))}
            courseOptions={courses.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
            regulationOptions={regulations.map((r) => ({ id: r.id, name: r.name, code: r.code }))}
            isLoading={isLoadingCatalog}
            isCalculating={isCalculating}
            apiError={apiError}
          />

          {/* Reusable Result Gauge Card */}
          <ResultGaugeCard
            score={metrics.gpa}
            maxScale={10}
            title="YOUR GPA RESULT"
            metrics={resultCardsData}
            standing={standing}
            isMobileModalOpen={isResultModalOpen}
            onCloseMobileModal={() => setIsResultModalOpen(false)}
            metadata={{
              university: university.toUpperCase(),
              regulation: regulation.toUpperCase(),
              course: course.toUpperCase(),
              semester: 'Semester',
              calculationMethod: 'Weighted Average (Credit Based)',
              totalSubjects: subjects.length
            }}
            subjectRows={subjects.map((s, idx) => ({
              num: idx + 1,
              name: s.name || `Subject ${idx + 1}`,
              credits: s.credits,
              grade: s.grade,
              gradePoints: dynamicGradePointsMap[s.grade] ?? 0,
              creditPoints: (parseFloat(s.credits) || 0) * (dynamicGradePointsMap[s.grade] ?? 0)
            }))}
            pdfData={{
              calculatorName: 'GPA Result Card',
              subtitle: 'Calculated using your subject credits and grades',
              filename: 'ResultPoint_GPA_Result.pdf',
              score: metrics.gpa.toFixed(2),
              maxScale: 10,
              standing: standing?.text,
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase(),
                course: course.toUpperCase(),
                calculationMethod: 'Weighted Average (Credit Based)',
                totalSubjects: subjects.length
              },
              subjectRows: subjects.map((s, idx) => ({
                num: idx + 1,
                name: s.name || `Subject ${idx + 1}`,
                credits: s.credits,
                grade: s.grade,
                gradePoints: dynamicGradePointsMap[s.grade] ?? 0,
                creditPoints: (parseFloat(s.credits) || 0) * (dynamicGradePointsMap[s.grade] ?? 0)
              })),
              metrics: [
                { label: 'Total Credits', value: metrics.totalCredits },
                { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
                { label: 'Percentage Equivalent', value: `${metrics.percentage.toFixed(2)}%` },
                { label: 'Letter Grade', value: metrics.letterGrade }
              ]
            }}
            shareData={{
              toolName: 'GPA',
              score: metrics.gpa.toFixed(2),
              scaleText: 'out of 10',
              metrics: [
                { label: 'Total Credits', value: metrics.totalCredits },
                { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
                { label: 'Percentage', value: `${metrics.percentage.toFixed(2)}%` },
                { label: 'Letter Grade', value: metrics.letterGrade }
              ],
              metadata: {
                university: university.toUpperCase(),
                regulation: regulation.toUpperCase()
              }
            }}
            onSave={handleSaveResult}
          />
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
    </>
  );
}