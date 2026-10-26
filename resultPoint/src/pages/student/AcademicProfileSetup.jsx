import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { academicCatalogService } from '../../services/academicCatalogService';
import { studentService } from '../../services/studentService';
import { catalogApi } from '../../services/api/catalogApi';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { saveAcademicProfile } from '../../features/academicProfile/academicProfileSlice';

export default function AcademicProfileSetup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [universities, setUniversities] = useState(() => academicCatalogService.getUniversities() || []);
  const initialProfile = studentService.getProfile();

  const [selectedUnivId, setSelectedUnivId] = useState(
    initialProfile?.universityId || universities[0]?.id || 'uni_ou'
  );
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialProfile?.courseId || '');
  const [regulations, setRegulations] = useState([]);
  const [selectedRegulationId, setSelectedRegulationId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(initialProfile?.batch || '');
  const [hallTicketNumber, setHallTicketNumber] = useState(initialProfile?.hallTicketNumber || '');
  const [currentSemester, setCurrentSemester] = useState(initialProfile?.currentSemester || 1);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Universities from Catalog API
  useEffect(() => {
    let ignore = false;
    async function loadUniversities() {
      try {
        const res = await catalogApi.getUniversities({ size: 50 });
        if (!ignore) {
          const list = res?.content || res?.items || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setUniversities(list);
            setSelectedUnivId((prev) => (list.some((u) => u.id === prev) ? prev : list[0].id));
          }
        }
      } catch {
        if (!ignore) {
          const fallback = academicCatalogService.getUniversities();
          if (fallback.length > 0) setUniversities(fallback);
        }
      }
    }
    loadUniversities();
    return () => { ignore = true; };
  }, []);

  // 2. When university changes, load its courses
  useEffect(() => {
    let ignore = false;
    async function loadCourses() {
      if (!selectedUnivId) return;
      try {
        const res = await catalogApi.getCoursesByUniversity(selectedUnivId);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setCourses(list);
            setSelectedCourseId((prev) => (list.some((c) => c.id === prev) ? prev : list[0].id));
          } else {
            const fallback = academicCatalogService.getCoursesByUniversity(selectedUnivId);
            setCourses(fallback);
            setSelectedCourseId((prev) => (fallback.length > 0 && fallback.some((c) => c.id === prev) ? prev : (fallback[0]?.id || '')));
          }
        }
      } catch {
        if (!ignore) {
          const fallback = academicCatalogService.getCoursesByUniversity(selectedUnivId);
          setCourses(fallback);
          setSelectedCourseId((prev) => (fallback.length > 0 && fallback.some((c) => c.id === prev) ? prev : (fallback[0]?.id || '')));
        }
      }
    }
    loadCourses();
    return () => { ignore = true; };
  }, [selectedUnivId]);

  // 3. When course changes, load its regulations
  // 3. When course changes, load its regulations
  useEffect(() => {
    let ignore = false;
    async function loadRegulations() {
      if (!selectedCourseId) return;
      try {
        const res = await catalogApi.getRegulationsByCourse(selectedCourseId);
        if (!ignore) {
          const list = res?.content || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setRegulations(list);
            const targetId = list.some((r) => r.id === selectedRegulationId) ? selectedRegulationId : list[0].id;
            setSelectedRegulationId(targetId);
            const activeReg = list.find((r) => r.id === targetId);
            const batches = activeReg?.effectiveBatches || [];
            if (batches.length > 0 && !batches.includes(selectedBatch)) {
              setSelectedBatch(batches[0]);
            }
          } else {
            const fallback = academicCatalogService.getRegulationsByCourse(selectedUnivId, selectedCourseId);
            setRegulations(fallback);
            const targetId = fallback.length > 0 && fallback.some((r) => r.id === selectedRegulationId) ? selectedRegulationId : (fallback[0]?.id || '');
            setSelectedRegulationId(targetId);
            const activeReg = fallback.find((r) => r.id === targetId);
            const batches = activeReg?.effectiveBatches || [];
            if (batches.length > 0 && !batches.includes(selectedBatch)) {
              setSelectedBatch(batches[0]);
            }
          }
        }
      } catch {
        if (!ignore) {
          const fallback = academicCatalogService.getRegulationsByCourse(selectedUnivId, selectedCourseId);
          setRegulations(fallback);
          const targetId = fallback.length > 0 && fallback.some((r) => r.id === selectedRegulationId) ? selectedRegulationId : (fallback[0]?.id || '');
          setSelectedRegulationId(targetId);
          const activeReg = fallback.find((r) => r.id === targetId);
          const batches = activeReg?.effectiveBatches || [];
          if (batches.length > 0 && !batches.includes(selectedBatch)) {
            setSelectedBatch(batches[0]);
          }
        }
      }
    }
    loadRegulations();
    return () => { ignore = true; };
  }, [selectedCourseId, selectedUnivId, selectedRegulationId, selectedBatch]);

  // Retrieve full configuration for the selected combination
  // Retrieve full configuration for the selected combination
  const activeConfig = academicCatalogService.getFullConfiguration(
    selectedUnivId,
    selectedCourseId,
    selectedRegulationId
  );

  const fallbackConfig = useMemo(() => {
    if (activeConfig) return activeConfig;
    const univObj = universities.find(
      (u) => u.id === selectedUnivId || u.shortName?.toLowerCase() === String(selectedUnivId).toLowerCase()
    );
    const courseObj = courses.find(
      (c) => c.id === selectedCourseId || c.shortName?.toLowerCase() === String(selectedCourseId).toLowerCase()
    );
    const regObj = regulations.find(
      (r) => r.id === selectedRegulationId || r.code?.toLowerCase() === String(selectedRegulationId).toLowerCase()
    );
    if (!univObj && !courseObj) return null;

    const isOu = univObj?.shortName?.toUpperCase() === 'OU' || String(selectedUnivId).includes('ou');
    const isBcaOrMca = courseObj?.shortName?.toUpperCase() === 'BCA' || courseObj?.shortName?.toUpperCase() === 'MCA';
    const isOuBcaOrMca = isOu && isBcaOrMca;

    return {
      university: {
        id: univObj?.id || selectedUnivId,
        name: univObj?.name || 'Selected University',
        shortName: univObj?.shortName || 'Univ',
        state: univObj?.state || ''
      },
      course: {
        id: courseObj?.id || selectedCourseId,
        name: courseObj?.name || 'Selected Course',
        shortName: courseObj?.shortName || '',
        level: courseObj?.level || 'UG',
        durationYears: courseObj?.durationYears || 3,
        totalSemesters: Number(courseObj?.totalSemesters || 6),
        totalDegreeCredits: Number(courseObj?.totalDegreeCredits || 150)
      },
      regulation: {
        id: regObj?.id || selectedRegulationId,
        code: regObj?.code || 'CBCS',
        name: regObj?.name || 'Academic Regulation',
        ruleVersion: regObj?.ruleVersion || '1.0',
        effectiveBatches: regObj?.effectiveBatches || ['2023 - 2026', '2024 - 2027'],
        gradingSystem: isOuBcaOrMca ? '10-point (S-Grade Scheme)' : '10-point'
      },
      gradeScale: isOuBcaOrMca
        ? [
            { grade: 'S', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Super', isPass: true },
            { grade: 'A', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
            { grade: 'B', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
            { grade: 'C', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
            { grade: 'D', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
            { grade: 'E', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
            { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
          ]
        : [
            { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
            { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
            { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
            { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
            { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Above Average', isPass: true },
            { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
            { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
          ],
      calculationRule: {
        sgpaFormula: 'WEIGHTED_CREDIT_SUM',
        cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
        percentageFormula: isOu ? 'CGPA * 10' : '(CGPA - 0.75) * 10',
        formulaDescription: isOu ? 'Percentage = CGPA × 10' : 'Percentage = (CGPA - 0.75) × 10'
      }
    };
  }, [activeConfig, selectedUnivId, selectedCourseId, selectedRegulationId, universities, courses, regulations]);

  const effectiveConfig = activeConfig || fallbackConfig;

  const courseObj = courses.find((c) => c.id === selectedCourseId);
  const maxSemesters = Number(courseObj?.totalSemesters || effectiveConfig?.course?.totalSemesters || 8);
  const activeSemester = currentSemester > maxSemesters ? 1 : currentSemester;

  const handleRegulationChange = (newRegId) => {
    setSelectedRegulationId(newRegId);
    const reg = regulations.find((r) => r.id === newRegId);
    if (reg?.effectiveBatches && reg.effectiveBatches.length > 0) {
      if (!reg.effectiveBatches.includes(selectedBatch)) {
        setSelectedBatch(reg.effectiveBatches[0]);
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedUnivId || !selectedCourseId) {
        showToast('Please select both a university and course.');
        return;
      }
      if (!hallTicketNumber.trim()) {
        showToast('Please enter your Hall Ticket / Roll Number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedRegulationId || !selectedBatch) {
        showToast('Please select regulation and academic batch.');
        return;
      }
      setStep(3);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!selectedUnivId || !selectedCourseId || !selectedRegulationId) {
      showToast('Academic configuration is incomplete.', 'error');
      return;
    }
    if (!hallTicketNumber.trim()) {
      showToast('Hall ticket / roll number is required.', 'error');
      setStep(1);
      return;
    }

    const regObj = regulations.find((r) => r.id === selectedRegulationId);
    const courseObj = courses.find((c) => c.id === selectedCourseId);
    const univObj = universities.find((u) => u.id === selectedUnivId);

    const updatedProfile = {
      universityId: selectedUnivId,
      university: univObj?.name || effectiveConfig?.university?.name || selectedUnivId,
      universityShortName: univObj?.shortName || effectiveConfig?.university?.shortName || '',
      courseId: selectedCourseId,
      course: courseObj?.name || effectiveConfig?.course?.name || selectedCourseId,
      courseShortName: courseObj?.shortName || effectiveConfig?.course?.shortName || '',
      regulationId: selectedRegulationId,
      regulation: regObj?.code || regObj?.name || effectiveConfig?.regulation?.code || selectedRegulationId,
      ruleVersion: regObj?.ruleVersion || effectiveConfig?.regulation?.ruleVersion || '',
      totalSemesters: Number(courseObj?.totalSemesters || effectiveConfig?.course?.totalSemesters || 8),
      totalDegreeCredits: Number(courseObj?.totalDegreeCredits || effectiveConfig?.course?.totalDegreeCredits || 160),
      currentSemester: Number(activeSemester) || 1,
      batch: selectedBatch,
      batchYear: selectedBatch,
      hallTicketNumber: hallTicketNumber.trim(),
      gradingSystem: regObj?.gradingSystem || effectiveConfig?.regulation?.gradingSystem || '10-point',
      hasCompletedProfile: true
    };

    setIsSaving(true);
    try {
      const resultAction = await dispatch(saveAcademicProfile(updatedProfile));
      if (saveAcademicProfile.fulfilled.match(resultAction)) {
        showToast('Academic Profile configured and verified successfully!');
        navigate('/student/dashboard');
      } else {
        showToast(resultAction.payload || 'Failed to save academic profile.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error saving academic profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-100 dark:border-orange-900/40 flex items-center justify-center mx-auto shadow-xs">
          <GraduationCap className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Academic Profile Setup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Configure your enrolled university, academic regulation, and grading system to enable accurate calculation rules.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3">
        {[
          { num: 1, label: 'Institution & Degree' },
          { num: 2, label: 'Regulation & Batch' },
          { num: 3, label: 'Review & Verify' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                step === s.num
                  ? 'bg-accent text-white shadow-xs scale-105'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              {s.label}
            </span>
            {s.num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-slate-200 dark:bg-slate-800" />}
          </div>
        ))}
      </div>

      {/* Step 1: University & Course */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                1. Select Enrolled University
              </label>
              <select
                value={selectedUnivId}
                onChange={(e) => setSelectedUnivId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName}) — {u.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                2. Select Course / Degree Program
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {courses.some((c) => c.level === 'UG') && (
                  <optgroup label="Undergraduate (UG) Programs" className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#151d28]">
                    {courses
                      .filter((c) => c.level === 'UG')
                      .map((c) => (
                        <option key={c.id} value={c.id} className="font-normal text-slate-800 dark:text-slate-200">
                          {c.name} ({c.durationYears} Years • {c.totalSemesters} Semesters)
                        </option>
                      ))}
                  </optgroup>
                )}
                {courses.some((c) => c.level === 'PG') && (
                  <optgroup label="Postgraduate (PG) Programs" className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#151d28]">
                    {courses
                      .filter((c) => c.level === 'PG')
                      .map((c) => (
                        <option key={c.id} value={c.id} className="font-normal text-slate-800 dark:text-slate-200">
                          {c.name} ({c.durationYears} Years • {c.totalSemesters} Semesters)
                        </option>
                      ))}
                  </optgroup>
                )}
                {courses
                  .filter((c) => !['UG', 'PG'].includes(c.level))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.durationYears} Years • {c.totalSemesters} Semesters)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                3. Hall Ticket / Roll Number
              </label>
              <input
                type="text"
                value={hallTicketNumber}
                onChange={(e) => setHallTicketNumber(e.target.value)}
                placeholder="e.g. 1005-23-772-045"
                className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-sm transition-all cursor-pointer"
            >
              <span>Continue to Regulation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Fallback State if configuration is missing */}
      {step === 2 && !effectiveConfig && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Academic Regulation Details Unavailable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Unable to resolve academic regulation details for the selected program. Please return to Step 1 and verify your university and course selection.
          </p>
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Step 1</span>
          </button>
        </div>
      )}

      {/* Step 2: Regulation & Batch */}
      {step === 2 && effectiveConfig && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                1. Academic Regulation
              </label>
              <select
                value={selectedRegulationId}
                onChange={(e) => handleRegulationChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — Rule Version: {r.ruleVersion}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  2. Academic Batch / Year of Admission
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {regulations
                    .find((r) => r.id === selectedRegulationId)
                    ?.effectiveBatches?.map((b) => (
                      <option key={b} value={b}>
                        Batch {b}
                      </option>
                    )) || (
                    <>
                      <option value="2023 - 2026">2023 - 2026</option>
                      <option value="2024 - 2027">2024 - 2027</option>
                      <option value="2025 - 2028">2025 - 2028</option>
                      <option value="2026 - 2029">2026 - 2029</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  3. Current Active Semester
                </label>
                <select
                  value={activeSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {Array.from(
                    { length: effectiveConfig?.course?.totalSemesters || 8 },
                    (_, i) => i + 1
                  ).map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem} (of {effectiveConfig?.course?.totalSemesters || 8})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Automatic Grading System Preview */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1E2A35] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Automatic Grading System Preview
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Loaded for {effectiveConfig.course.name} ({effectiveConfig.university.shortName})
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                {effectiveConfig.regulation.gradingSystem}
              </span>
            </div>

            {/* Special Notice for MCA / BCA S-Grade Rule */}
            {['mca', 'bca', 'course_ou_mca', 'course_ou_bca'].includes(String(effectiveConfig.course.id).toLowerCase()) && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-start gap-2.5 text-xs">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="font-bold text-accent">Osmania University S-Grade Exception:</span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    Under Osmania University academic regulations, <strong>{effectiveConfig.course.shortName}</strong> awards grade{' '}
                    <strong className="text-accent font-black">S (Super)</strong> with <strong>10 Grade Points</strong> for marks 85% and above, in place of O (Outstanding).
                  </span>
                </div>
              </div>
            )}

            {/* Grade Scale Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#1E2A35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Grade Points</th>
                    <th className="py-2.5 px-3">Marks Range</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Passing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/70 font-medium">
                  {effectiveConfig.gradeScale.map((g) => (
                    <tr key={g.grade} className="hover:bg-slate-50/50 dark:hover:bg-[#15202D]/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {g.grade === 'S' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold bg-orange-500 text-white text-[11px] shadow-2xs">
                            <Sparkles className="w-3 h-3" />
                            <span>S (Super)</span>
                          </span>
                        ) : g.grade === 'O' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px]">
                            O (Outstanding)
                          </span>
                        ) : (
                          <span className="px-1 text-xs font-bold">{g.grade}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-orange-500">{g.points}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {g.minPercentage}% - {g.maxPercentage}%
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                        {g.desc}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.isPass
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {g.isPass ? 'Pass' : 'Backlog'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formula callout bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">SGPA Formula:</span> Weighted Credit Sum (Σ(Credits × Grade Points) / ΣCredits)
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">Conversion Rule:</span> {effectiveConfig.calculationRule.formulaDescription}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-sm transition-all cursor-pointer"
            >
              <span>Review & Verify</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Fallback Actionable State */}
      {step === 3 && !effectiveConfig && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Configuration summary is unavailable. Please verify your regulation selection.
          </p>
          <button
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Step 2</span>
          </button>
        </div>
      )}

      {/* Step 3: Review & Confirmation */}
      {step === 3 && effectiveConfig && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-[#1E2A35] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Academic Configuration Confirmation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Please verify your university, course, regulation, batch, and semester details before saving.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
              Verified Catalog
            </span>
          </div>

          {/* Configuration Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Enrolled University
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {effectiveConfig.university.name} ({effectiveConfig.university.shortName})
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{effectiveConfig.university.state}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Degree Program & Level
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {effectiveConfig.course.name} ({effectiveConfig.course.shortName})
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {effectiveConfig.course.level} • {effectiveConfig.course.durationYears} Years ({effectiveConfig.course.totalSemesters} Semesters / {effectiveConfig.course.totalDegreeCredits} Total Credits)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Academic Regulation
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {effectiveConfig.regulation.name} [{effectiveConfig.regulation.code}]
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Rule Version: {effectiveConfig.regulation.ruleVersion}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Admission Batch
              </span>
              <span className="text-sm font-bold text-accent block mt-0.5">
                Batch {selectedBatch}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Academic Year of Enrollment</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Active Semester
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                Semester {currentSemester} (of {effectiveConfig.course.totalSemesters} Semesters)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Active Term for Results & Calculations</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Hall Ticket / Roll Number
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {hallTicketNumber.trim() || 'Auto-generated upon save'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Institutional Student Identifier</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Grading System Scheme
              </span>
              <span className="text-sm font-bold text-accent block mt-0.5">
                {effectiveConfig.regulation.gradingSystem}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {['mca', 'bca', 'course_ou_mca', 'course_ou_bca'].includes(String(effectiveConfig.course.id).toLowerCase())
                  ? 'S (Super) grade scheme configured'
                  : 'O (Outstanding) grade scheme configured'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Percentage Conversion Formula
              </span>
              <span className="text-sm font-bold text-orange-500 block mt-0.5">
                {effectiveConfig.calculationRule.formulaDescription}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Official University Conversion Algorithm</span>
            </div>
          </div>

          {/* Grade Scale Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-left">
              Configured Course Grade Scale & Points
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#1E2A35]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0D141F] text-slate-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Grade Points</th>
                    <th className="py-2.5 px-3">Marks Range</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Passing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A35]/70 font-medium">
                  {effectiveConfig.gradeScale.map((g) => (
                    <tr key={g.grade} className="hover:bg-slate-50/50 dark:hover:bg-[#15202D]/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {g.grade === 'S' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold bg-orange-500 text-white text-[11px] shadow-2xs">
                            <Sparkles className="w-3 h-3" />
                            <span>S (Super)</span>
                          </span>
                        ) : g.grade === 'O' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px]">
                            O (Outstanding)
                          </span>
                        ) : (
                          <span className="px-1 text-xs font-bold">{g.grade}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-orange-500">{g.points}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {g.minPercentage}% - {g.maxPercentage}%
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-semibold">{g.desc}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.isPass
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {g.isPass ? 'Pass' : 'Backlog'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1E2A35]">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleConfirmAndSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Profile...' : 'Confirm & Save Academic Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
