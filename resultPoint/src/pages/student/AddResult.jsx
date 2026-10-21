import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  PlusCircle,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { resultService } from '../../services/resultService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { academicCalculationEngine } from '../../services/academicCalculationEngine';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectResults,
  addSemesterResult,
  updateSemesterResult,
  fetchResults
} from '../../features/results/resultsSlice';
import { selectAcademicProfile, fetchAcademicProfile } from '../../features/academicProfile/academicProfileSlice';
import { selectMarksInputPreference } from '../../features/settings/settingsSlice';

export default function AddResult() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxProfile = useAppSelector(selectAcademicProfile);
  const reduxResults = useAppSelector(selectResults);
  const marksInputPreference = useAppSelector(selectMarksInputPreference);

  useEffect(() => {
    dispatch(fetchResults());
    dispatch(fetchAcademicProfile());
  }, [dispatch]);

  const profile = useMemo(() => ({
    ...studentService.getProfile(),
    ...(reduxProfile || {}),
  }), [reduxProfile]);

  const existingResults = reduxResults && reduxResults.length > 0 ? reduxResults : resultService.getAllResults();

  // Load catalog configuration
  const catalogConfig = useMemo(() => {
    return academicCatalogService.getFullConfiguration(
      profile.universityId,
      profile.courseId,
      profile.regulationId
    );
  }, [profile.universityId, profile.courseId, profile.regulationId]);

  const maxSemesters = catalogConfig?.course?.totalSemesters || profile.totalSemesters || 8;
  const gradeScale = catalogConfig?.gradeScale || [
    { grade: 'O', points: 10, isPass: true },
    { grade: 'A+', points: 9, isPass: true },
    { grade: 'A', points: 8, isPass: true },
    { grade: 'B+', points: 7, isPass: true },
    { grade: 'B', points: 6, isPass: true },
    { grade: 'C', points: 5, isPass: true },
    { grade: 'P', points: 4, isPass: true },
    { grade: 'F', points: 0, isPass: false }
  ];

  // Determine which semesters already exist
  const existingSemesterNumbers = useMemo(() => {
    return new Set(existingResults.map((r) => Number(r.semesterNumber)));
  }, [existingResults]);

  const { resultId } = useParams();
  const [searchParams] = useSearchParams();
  const editParamId = resultId || searchParams.get('edit') || searchParams.get('id');

  const editTargetResult = useMemo(() => {
    if (!editParamId) return null;
    const clean = String(editParamId).replace('semester-', '').replace('res_sem_', '');
    const match = existingResults.find(
      (r) =>
        r.id === editParamId ||
        String(r.semesterNumber) === String(editParamId) ||
        String(r.semesterNumber) === clean ||
        r.id === `semester-${editParamId}` ||
        r.id === `semester-${clean}`
    );
    return match || resultService.getResultById(editParamId);
  }, [editParamId, existingResults]);

  const isEditMode = Boolean(editTargetResult);

  // Determine available (unsaved) semesters
  const availableSemesters = useMemo(() => {
    const list = [];
    for (let i = 1; i <= maxSemesters; i++) {
      if (!existingSemesterNumbers.has(i)) {
        list.push(i);
      }
    }
    return list;
  }, [maxSemesters, existingSemesterNumbers]);

  const defaultEligibleSemester = editTargetResult
    ? Number(editTargetResult.semesterNumber)
    : availableSemesters.length > 0
    ? availableSemesters[0]
    : 1;

  const [semesterNumber, setSemesterNumber] = useState(defaultEligibleSemester);
  const [academicPeriod, setAcademicPeriod] = useState(
    editTargetResult?.academicPeriod || `Semester ${defaultEligibleSemester} Exam`
  );
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When editTargetResult loads or updates, prefill all form fields with saved data
  useEffect(() => {
    if (editTargetResult) {
      setSemesterNumber(Number(editTargetResult.semesterNumber));
      setAcademicPeriod(editTargetResult.academicPeriod || `Semester ${editTargetResult.semesterNumber} Exam`);
      if (Array.isArray(editTargetResult.subjects) && editTargetResult.subjects.length > 0) {
        setSubjects(
          editTargetResult.subjects.map((s, idx) => ({
            id: s.id || `edit_sub_${idx}_${Date.now()}`,
            code: s.code || '',
            name: s.name || '',
            credits: Number(s.credits) || 4,
            defaultCredits: Number(s.defaultCredits || s.credits) || 4,
            marksObtained: Number(s.marksObtained) || 0,
            maxMarks: Number(s.maxMarks) || 100,
            grade: s.grade || 'A',
            isElective: Boolean(s.isElective)
          }))
        );
      }
    }
  }, [editTargetResult]);

  // Keep semesterNumber pointing to valid available semester (only in add mode)
  useEffect(() => {
    if (isEditMode) return;
    if (availableSemesters.length > 0) {
      if (!semesterNumber || existingSemesterNumbers.has(Number(semesterNumber))) {
        setSemesterNumber(availableSemesters[0]);
      }
    }
  }, [isEditMode, availableSemesters, existingSemesterNumbers, semesterNumber]);

  // Check if chosen semester is already recorded
  const isDuplicateSemester = !isEditMode && existingSemesterNumbers.has(Number(semesterNumber));
  const allSemestersCompleted = !isEditMode && availableSemesters.length === 0;

  // Initialize/Load subjects when semesterNumber changes or when catalogConfig loads (only in add mode)
  useEffect(() => {
    if (isEditMode || !semesterNumber) return;

    const configuredSubjects = academicCatalogService.getSemesterSubjects(
      profile.universityId,
      profile.courseId,
      profile.regulationId,
      semesterNumber
    );

    if (configuredSubjects && configuredSubjects.length > 0) {
      setSubjects(
        configuredSubjects.map((s, idx) => ({
          id: s.id || `sub_${idx}_${Date.now()}`,
          code: s.code,
          name: s.name,
          credits: Number(s.credits || s.defaultCredits) || 4,
          defaultCredits: Number(s.defaultCredits || s.credits) || 4,
          marksObtained: 85,
          maxMarks: 100,
          grade: (s.credits || s.defaultCredits || 4) >= 4 ? 'A+' : 'A',
          isElective: Boolean(s.isElective)
        }))
      );
    } else {
      // Default subjects for this semester if catalog has no specific list
      setSubjects([
        { id: '1', code: `CS${semesterNumber}01`, name: `Core Subject 1`, credits: 4, defaultCredits: 4, marksObtained: 85, maxMarks: 100, grade: 'A+' },
        { id: '2', code: `CS${semesterNumber}02`, name: `Core Subject 2`, credits: 4, defaultCredits: 4, marksObtained: 80, maxMarks: 100, grade: 'A' },
        { id: '3', code: `CS${semesterNumber}03`, name: `Core Subject 3`, credits: 4, defaultCredits: 4, marksObtained: 78, maxMarks: 100, grade: 'B+' },
        { id: '4', code: `CS${semesterNumber}04`, name: `Department Elective`, credits: 4, defaultCredits: 4, marksObtained: 90, maxMarks: 100, grade: 'O' },
        { id: '5', code: `CS${semesterNumber}05`, name: `Laboratory / Practical`, credits: 2, defaultCredits: 2, marksObtained: 92, maxMarks: 100, grade: 'O' }
      ]);
    }

    setAcademicPeriod(`Semester ${semesterNumber} - 202${Number(semesterNumber) + 2}`);
  }, [isEditMode, semesterNumber, profile.universityId, profile.courseId, profile.regulationId]);

  // Set default subject credit value to 4 credits when adding an elective/subject (Requirement 3)
  const handleAddSubject = () => {
    const newIdx = subjects.length + 1;
    setSubjects([
      ...subjects,
      {
        id: String(Date.now()),
        code: `EL${semesterNumber}0${newIdx}`,
        name: `Professional Elective ${newIdx}`,
        credits: 4,
        defaultCredits: 4,
        marksObtained: 75,
        maxMarks: 100,
        grade: 'A',
        isElective: true
      }
    ]);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };

        // If marks changed, automatically derive the letter grade using catalog grading scale
        if (field === 'marksObtained') {
          const rawVal = value === '' ? '' : Number(value);
          updated.marksObtained = rawVal;
          if (value !== '' && !isNaN(rawVal) && rawVal >= 0) {
            const derived = academicCalculationEngine.getGradeFromMarks(rawVal, s.maxMarks || 100, gradeScale);
            updated.grade = derived.grade;
            updated.points = derived.points;
            updated.isPass = derived.isPass;
          }
        }

        // If user manually changes grade, resolve points and pass status
        if (field === 'grade') {
          const matched = gradeScale.find((g) => g.grade.toUpperCase() === String(value).toUpperCase());
          if (matched) {
            updated.points = matched.points;
            updated.isPass = matched.isPass;
          }
        }

        return updated;
      })
    );
  };

  // Dynamic SGPA Calculation using centralized engine
  const calculationResult = useMemo(() => {
    return academicCalculationEngine.calculateSGPA(subjects, gradeScale);
  }, [subjects, gradeScale]);

  // Dynamic CGPA simulation: what will cumulative CGPA be when saving this semester?
  const projectedCGPA = useMemo(() => {
    const otherSemesters = existingResults.filter(
      (r) => Number(r.semesterNumber) !== Number(semesterNumber)
    );
    const simulatedSemesters = [
      ...otherSemesters,
      {
        semesterNumber: Number(semesterNumber),
        creditsEarned: calculationResult.earnedCredits,
        totalCredits: calculationResult.totalCredits,
        sgpa: calculationResult.sgpa
      }
    ];
    return academicCalculationEngine.calculateCGPA(simulatedSemesters).cgpa;
  }, [existingResults, semesterNumber, calculationResult]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (allSemestersCompleted) {
      showToast('All semesters for this course have already been saved.', 'error');
      return;
    }

    if (isDuplicateSemester) {
      showToast(`Semester ${semesterNumber} already exists in your records. Please choose another semester or edit the existing result.`, 'error');
      return;
    }

    if (Number(semesterNumber) < 1 || Number(semesterNumber) > maxSemesters) {
      showToast(`Invalid semester. Allowed semesters for ${catalogConfig?.course?.name || 'this course'} are 1 to ${maxSemesters}.`, 'error');
      return;
    }

    if (!subjects || subjects.length === 0) {
      showToast('Please add at least one subject to save semester results.', 'error');
      return;
    }

    const hasInvalidSubject = subjects.some(s => !s.name || !s.name.trim() || Number(s.credits) <= 0);
    if (hasInvalidSubject) {
      showToast('Please provide valid subject names and positive credits for all subjects.', 'error');
      return;
    }

    if (calculationResult.totalCredits <= 0) {
      showToast('Total credits must be greater than zero.', 'error');
      return;
    }

    setIsSubmitting(true);

    const formattedSubjects = calculationResult.subjects.map((s) => ({
      code: (s.code || `SUB-${Date.now()}`).trim(),
      name: s.name.trim(),
      credits: Number(s.credits) || 4,
      defaultCredits: s.defaultCredits || Number(s.credits) || 4,
      grade: s.grade,
      points: s.points,
      marksObtained: Number(s.marksObtained) || 0,
      maxMarks: Number(s.maxMarks) || 100,
      isPass: s.isPass
    }));

    const resultRecord = {
      id: isEditMode ? editTargetResult.id : `semester-${semesterNumber}`,
      semesterNumber: Number(semesterNumber),
      semesterLabel: `Semester ${semesterNumber}`,
      semesterTitle: `Semester ${semesterNumber}`,
      academicPeriod: academicPeriod.trim() || `Semester ${semesterNumber} Exam`,
      sgpa: calculationResult.sgpa,
      cgpa: projectedCGPA,
      creditsEarned: calculationResult.earnedCredits,
      totalCredits: calculationResult.totalCredits,
      subjectCount: formattedSubjects.length,
      status: calculationResult.status,
      badgeColor: calculationResult.sgpa >= 8.5 ? 'purple' : calculationResult.sgpa >= 7.5 ? 'blue' : 'emerald',
      subjects: formattedSubjects,
      universityId: profile.universityId,
      courseId: profile.courseId,
      regulationId: profile.regulationId,
      ruleVersion: catalogConfig?.regulation?.ruleVersion || '1.0',
      academicBatch: profile.batch,
      savedAt: isEditMode ? (editTargetResult.savedAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: isEditMode ? new Date().toISOString() : undefined
    };

    try {
      if (isEditMode) {
        await dispatch(updateSemesterResult({ id: editTargetResult.id, updates: resultRecord })).unwrap();
        showToast(`Semester ${semesterNumber} result updated with SGPA: ${calculationResult.sgpa.toFixed(2)} and CGPA: ${projectedCGPA.toFixed(2)}!`);
      } else {
        await dispatch(addSemesterResult(resultRecord)).unwrap();
        showToast(`Semester ${semesterNumber} result saved with SGPA: ${calculationResult.sgpa.toFixed(2)} and CGPA: ${projectedCGPA.toFixed(2)}!`);
      }
      navigate('/student/results');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to save semester result', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If profile is incomplete, display AcademicProfileGate
  if (!studentService.isProfileComplete()) {
    return (
      <AcademicProfileGate
        title="Academic Profile Setup Required"
        description="Before adding semester results, please configure your University, Course, and Regulation so the platform can load the correct subjects, credit weights, and grading rules."
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-text-light hover:text-text-h flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h flex items-center gap-2">
            <span>{isEditMode ? 'Edit Semester Result' : 'Add Semester Result'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              {catalogConfig?.course?.code || 'Course'} • {catalogConfig?.regulation?.code || 'Regulation'}
            </span>
          </h1>
          <p className="text-xs text-text-light">
            {isEditMode
              ? `Editing verified scorecard and subject grades for Semester ${semesterNumber} (${catalogConfig?.university?.name || profile.university || ''})`
              : `${catalogConfig?.university?.name} (${catalogConfig?.course?.name})`}
          </p>
        </div>

        {/* Live Metrics Previews */}
        <div className="flex items-center gap-3">
          <div className="text-right p-3 rounded-2xl bg-card border border-border">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block">
              Semester SGPA
            </span>
            <span className="text-xl font-extrabold text-accent">
              {calculationResult.sgpa.toFixed(2)}
            </span>
            <span className="text-[10px] text-text-light block">
              {calculationResult.earnedCredits} / {calculationResult.totalCredits} Credits
            </span>
          </div>

          <div className="text-right p-3 rounded-2xl bg-card border border-border">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block">
              Projected CGPA
            </span>
            <span className="text-xl font-extrabold text-brandGreen">
              {projectedCGPA.toFixed(2)}
            </span>
            <span className="text-[10px] text-text-light block">
              Cumulative
            </span>
          </div>
        </div>
      </div>

      {/* All Semesters Completed Banner */}
      {allSemestersCompleted && (
        <div className="p-4 rounded-2xl bg-brandGreen/10 border border-brandGreen/30 flex items-start gap-3 text-brandGreen">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">All {maxSemesters} Semesters Recorded!</p>
            <p className="text-text-light dark:text-slate-300">
              You have already saved scorecards for all {maxSemesters} semesters in your curriculum.
              You can review, print, or update any semester result in{' '}
              <Link to="/student/results" className="text-accent underline font-semibold">
                My Results
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Warning Alert */}
      {!allSemestersCompleted && isDuplicateSemester && (
        <div className="p-4 rounded-2xl bg-brandPink/10 border border-brandPink/30 flex items-start gap-3 text-brandPink">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Semester {semesterNumber} has already been saved!</p>
            <p className="text-text-light dark:text-slate-300">
              You already have a verified scorecard for Semester {semesterNumber}. To update subjects or marks,
              go to <Link to="/student/results" className="text-accent underline font-semibold">My Results</Link> and select Edit.
              Or choose an unsaved semester number below.
            </p>
          </div>
        </div>
      )}



      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Semester Configuration Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border">
          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Select Semester <span className="text-brandPink">*</span>
            </label>
            <select
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(Number(e.target.value))}
              disabled={isEditMode || allSemestersCompleted}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              required
            >
              {isEditMode ? (
                <option value={semesterNumber}>
                  Semester {semesterNumber} (Editing Saved Result)
                </option>
              ) : availableSemesters.length > 0 ? (
                availableSemesters.map((num, idx) => (
                  <option key={num} value={num}>
                    Semester {num} {idx === 0 ? '(Next Eligible Semester)' : ''}
                  </option>
                ))
              ) : (
                <option value="">No More Semesters Available</option>
              )}
            </select>
            <p className="text-[11px] text-text-light mt-1">
              {isEditMode
                ? `Updating saved records for Semester ${semesterNumber}. Modifying will recalculate all dependent SGPA and CGPAs.`
                : availableSemesters.length > 0
                ? `${availableSemesters.length} of ${maxSemesters} semesters remaining to be recorded.`
                : `All ${maxSemesters} semesters completed for this degree program.`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">
              Examination Period / Label <span className="text-brandPink">*</span>
            </label>
            <input
              type="text"
              value={academicPeriod}
              onChange={(e) => setAcademicPeriod(e.target.value)}
              placeholder="e.g. Nov 2026 Regular"
              className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
              required
            />
            <p className="text-[11px] text-text-light mt-1">
              Display title for the scorecard and semester transcript.
            </p>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Configured Course Subjects & Credits</span>
              </h3>
              <p className="text-[11px] text-text-light">
                Pre-populated from {catalogConfig?.university?.name} curriculum. You can adjust elective names or credits.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white transition-all shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Elective / Lab</span>
            </button>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-3 rounded-xl bg-bg border border-border/70 hover:border-accent/40 transition-colors"
              >
                {/* Subject Code */}
                <div className="col-span-3 sm:col-span-2">
                  <label className="text-[10px] text-text-light uppercase font-bold block mb-0.5">Code</label>
                  <input
                    type="text"
                    value={sub.code}
                    onChange={(e) => handleSubjectChange(sub.id, 'code', e.target.value)}
                    placeholder="Code"
                    className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-center uppercase"
                  />
                </div>

                {/* Subject Name */}
                <div className="col-span-9 sm:col-span-3">
                  <label className="text-[10px] text-text-light uppercase font-bold block mb-0.5">Subject Title</label>
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                    placeholder="Subject Name"
                    className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                    required
                  />
                </div>

                {/* Credits Dropdown */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-text-light uppercase font-bold block mb-0.5">Credits</label>
                  <select
                    value={sub.credits}
                    onChange={(e) => handleSubjectChange(sub.id, 'credits', Number(e.target.value))}
                    className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6].map((c) => (
                      <option key={c} value={c}>
                        {c} Credit{c > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {marksInputPreference === 'marks-first' ? (
                  <>
                    {/* Marks Input (Primary in marks-first mode) */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] text-accent uppercase font-bold block mb-0.5">Marks (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max={sub.maxMarks || 100}
                        value={sub.marksObtained !== undefined && sub.marksObtained !== null ? sub.marksObtained : ''}
                        onChange={(e) => handleSubjectChange(sub.id, 'marksObtained', e.target.value)}
                        placeholder="Marks"
                        className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-bold text-center text-accent border-accent/40"
                      />
                    </div>

                    {/* Grade Dropdown (Auto-derived from Marks) */}
                    <div className="col-span-3 sm:col-span-2">
                      <label className="text-[10px] text-text-light uppercase font-bold block mb-0.5">Grade (Scale)</label>
                      <select
                        value={sub.grade}
                        onChange={(e) => handleSubjectChange(sub.id, 'grade', e.target.value)}
                        className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-bold text-accent cursor-pointer"
                      >
                        {gradeScale.map((g) => (
                          <option key={g.grade} value={g.grade}>
                            {g.grade} ({g.points} pts{g.isPass ? '' : ' - Fail'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Grade Dropdown (Primary in grade-first mode) */}
                    <div className="col-span-3 sm:col-span-2">
                      <label className="text-[10px] text-accent uppercase font-bold block mb-0.5">Grade</label>
                      <select
                        value={sub.grade}
                        onChange={(e) => handleSubjectChange(sub.id, 'grade', e.target.value)}
                        className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-bold text-accent cursor-pointer border-accent/40"
                      >
                        {gradeScale.map((g) => (
                          <option key={g.grade} value={g.grade}>
                            {g.grade} ({g.points} pts{g.isPass ? '' : ' - Fail'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Marks Input (Optional in grade-first mode) */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] text-text-light uppercase font-bold block mb-0.5">Marks (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max={sub.maxMarks || 100}
                        value={sub.marksObtained !== undefined && sub.marksObtained !== null ? sub.marksObtained : ''}
                        onChange={(e) => handleSubjectChange(sub.id, 'marksObtained', e.target.value)}
                        placeholder="Marks"
                        className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-center text-text-h"
                      />
                    </div>
                  </>
                )}

                {/* Delete Button */}
                <div className="col-span-1 sm:col-span-1 text-right pt-4 sm:pt-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub.id)}
                    disabled={subjects.length <= 1}
                    className="p-1.5 rounded-lg text-text-light hover:text-brandPink hover:bg-brandPink/10 transition-colors disabled:opacity-30"
                    title="Remove subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Summary Footer */}
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-h">
                Rule Formula: <span className="text-accent">{catalogConfig?.regulation?.sgpaFormula || 'SGPA = Σ(Credit × GradePoint) / Σ(Credit)'}</span>
              </p>
              <p className="text-[11px] text-text-light">
                Results conform to official {catalogConfig?.regulation?.code || 'Regulation'} passing criteria.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-h hover:bg-bg-sec border border-border transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={(!isEditMode && (isDuplicateSemester || allSemestersCompleted)) || isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isEditMode
                    ? 'Updating Result...'
                    : 'Saving Result...'
                  : isEditMode
                  ? 'Update Semester Result'
                  : 'Save Semester Result'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

