import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Printer,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectResults, fetchResults } from '../../features/results/resultsSlice';
import {
  selectAcademicProfile,
  selectIsProfileComplete,
  fetchAcademicProfile
} from '../../features/academicProfile/academicProfileSlice';
import { resultService } from '../../services/resultService';
import { studentService } from '../../services/studentService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { academicCalculationEngine } from '../../services/academicCalculationEngine';
import { exportApi, triggerBlobDownload } from '../../services/api/exportApi';
import ResultStatusBadge from '../../components/student/ResultStatusBadge';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';
import { printScorecard, exportScorecardPDF } from '../../utils/scorecardExport';

export default function ResultDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxResults = useAppSelector(selectResults);
  const reduxProfile = useAppSelector(selectAcademicProfile);
  const isProfileComplete = Boolean(
    useAppSelector(selectIsProfileComplete) || studentService.isProfileComplete()
  );
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicProfile());
    if (isProfileComplete) {
      dispatch(fetchResults());
    }
  }, [dispatch, isProfileComplete]);

  const cleanId = String(resultId || '').replace('semester-', '').replace('res_sem_', '');
  const resultFromRedux = reduxResults.find(
    (r) =>
      r.id === resultId ||
      String(r.semesterNumber) === String(resultId) ||
      String(r.semesterNumber) === cleanId ||
      r.id === `semester-${resultId}` ||
      r.id === `res_sem_${resultId}` ||
      r.id === `semester-${cleanId}` ||
      r.id === `res_sem_${cleanId}`
  );

  const result = resultFromRedux || resultService.getResultById(resultId);
  const student = { ...studentService.getProfile(), ...(reduxProfile || {}) };

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-8 bg-card border border-border rounded-2xl shadow-subtle space-y-4">
          <h2 className="text-xl font-bold text-text-h">Result Record Not Found</h2>
          <p className="text-sm text-text-light max-w-md mx-auto">
            The requested semester result could not be located in your academic profile.
          </p>
          <button
            onClick={() => navigate('/student/results')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Results</span>
          </button>
        </div>
      </div>
    );
  }

  const catalogConfig = academicCatalogService.getFullConfiguration(
    student.universityId,
    student.courseId,
    student.regulationId
  );
  const gradeScale = catalogConfig?.gradeScale || [];
  const percentResult = academicCalculationEngine.convertCGPAToPercentage(
    Number(result.sgpa) || 0,
    catalogConfig?.regulation?.calculationRule?.percentageFormula || 'CGPA * 10'
  );
  const gradeInfo = academicCalculationEngine.getGradeFromMarks(percentResult.percentage, 100, gradeScale);

  const handlePrint = () => {
    printScorecard(result, student);
    showToast(`Scorecard for ${result.semesterLabel || `Semester ${result.semesterNumber}`} opened in print viewer.`);
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showToast('Downloading official scorecard PDF from server...');
    try {
      const blob = await exportApi.downloadSemesterScorecardPdf(result.semesterNumber);
      triggerBlobDownload(blob, `semester-${result.semesterNumber}-scorecard.pdf`);
      showToast(`Official PDF scorecard for ${result.semesterLabel || `Semester ${result.semesterNumber}`} downloaded successfully!`);
    } catch (err) {
      console.warn('Backend PDF export failed, falling back to printable scorecard:', err.message);
      exportScorecardPDF(result, student);
      showToast(`Scorecard PDF generated for ${result.semesterLabel || `Semester ${result.semesterNumber}`}.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before accessing institutional scorecards and printable results, please complete your Academic Profile Setup."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/results')}
              className="p-2.5 rounded-xl border border-border text-text-light hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
              title="Return to My Results"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
                  {result.semesterLabel || `Semester ${result.semesterNumber}`} Result
                </h1>
                <ResultStatusBadge status={result.status} />
              </div>
              <p className="text-xs text-text-light mt-0.5 flex items-center gap-2">
                <span>{student.university}</span>
                <span>•</span>
                <span>{student.course}</span>
                <span>•</span>
                <span>{student.regulation} Regulation</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-text-h bg-card border border-border hover:bg-bg-sec shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-accent" />
              <span>Print Scorecard</span>
            </button>

            <button
              onClick={handleExportPDF}
              type="button"
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Overview Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center">
            <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider block">
              Semester SGPA
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-accent mt-1 block">
              {Number(result.sgpa).toFixed(2)}
            </span>
            <span className="text-[10px] text-text-light mt-0.5 block">Current Term GPA</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center">
            <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider block">
              Progressive CGPA
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-text-h mt-1 block">
              {Number(result.cgpa || result.sgpa).toFixed(2)}
            </span>
            <span className="text-[10px] text-text-light mt-0.5 block">Cumulative Scale</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center">
            <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider block">
              Semester Grade
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-brandGreen mt-1 block">
              {gradeInfo.grade}
            </span>
            <span className="text-[10px] text-text-light mt-0.5 block truncate">{gradeInfo.desc}</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center">
            <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider block">
              Credits Earned
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-brandBlue mt-1 block">
              {result.creditsEarned} <span className="text-xs text-text-light font-normal">/ {result.totalCredits || 21}</span>
            </span>
            <span className="text-[10px] text-text-light mt-0.5 block">Registered Credits</span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider block">
              Total Subjects
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              {result.subjects ? result.subjects.length : result.subjectCount || 6}
            </span>
            <span className="text-[10px] text-text-light mt-0.5 block">Exam Papers</span>
          </div>
        </div>

        {/* Subjects Scorecard Table */}
        <div className="rounded-2xl bg-card border border-border shadow-subtle overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-sm sm:text-base font-bold text-text-h">
                Subject-wise Performance Breakdown
              </h2>
            </div>
            <span className="text-xs font-semibold text-text-light">
              Batch: {student.batch || '2023 - 2025'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg text-text-light font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Grade Points</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(result.subjects || []).map((sub, idx) => {
                  const isFail = sub.grade === 'F' || sub.isPass === false;
                  return (
                    <tr key={sub.code || idx} className="hover:bg-bg-sec/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-text-h">{sub.code}</td>
                      <td className="py-3.5 px-4 font-medium text-text-h">{sub.name}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-text-light">{sub.credits}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            sub.grade === 'S'
                              ? 'bg-orange-500 text-white'
                              : sub.grade === 'O'
                              ? 'bg-amber-500/15 text-amber-500 font-bold'
                              : isFail
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-accent">{sub.points}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            !isFail
                              ? 'bg-emerald-500/10 text-brandGreen'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{!isFail ? 'Passed' : 'Arrear'}</span>
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
    </AcademicProfileGate>
  );
}
