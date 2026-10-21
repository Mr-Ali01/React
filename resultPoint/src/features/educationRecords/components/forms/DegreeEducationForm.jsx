import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { academicCatalogService } from '../../../../services/academicCatalogService.js';
import { academicCalculationEngine } from '../../../../services/academicCalculationEngine.js';
import { educationRecordService } from '../../../../services/educationRecordService.js';

const ENTRY_MODES = [
  {
    id: 'quick',
    name: 'Quick Entry',
    desc: 'Enter overall degree completion CGPA and credit total without individual semesters.'
  },
  {
    id: 'semester',
    name: 'Semester-wise Entry',
    desc: 'Record semester summaries (SGPA, credits, status) progressively.'
  },
  {
    id: 'subject',
    name: 'Detailed Subject Entry',
    desc: 'Enter subject-level marks and letter grades calculated by university rules.'
  }
];

export default function DegreeEducationForm({
  degreeType = 'ug', // 'ug' | 'pg'
  initialData = {},
  onSave,
  onCancel
}) {
  const isUG = degreeType === 'ug';
  const catalog = academicCatalogService.getCatalog();
  const universities = catalog.universities || [];

  // 1. University, Course & Regulation state
  const [universityId, setUniversityId] = useState(
    initialData.universityId || (universities[1]?.id || 'osmania')
  );

  const selectedUniv = useMemo(() => {
    return universities.find((u) => u.id === universityId) || universities[0];
  }, [universities, universityId]);

  const availableCourses = useMemo(() => {
    if (!selectedUniv || !Array.isArray(selectedUniv.courses)) return [];
    return selectedUniv.courses.filter((c) =>
      isUG ? c.level === 'UG' || !c.level : c.level === 'PG'
    );
  }, [selectedUniv, isUG]);

  const [courseId, setCourseId] = useState(
    initialData.courseId || (availableCourses[0]?.id || (isUG ? 'bca' : 'mca'))
  );

  const selectedCourse = useMemo(() => {
    return availableCourses.find((c) => c.id === courseId) || availableCourses[0];
  }, [availableCourses, courseId]);

  const availableRegulations = useMemo(() => {
    if (!selectedCourse || !Array.isArray(selectedCourse.regulations)) return [];
    return selectedCourse.regulations;
  }, [selectedCourse]);

  const [regulationId, setRegulationId] = useState(
    initialData.regulationId || (availableRegulations[0]?.id || '')
  );

  const selectedRegulation = useMemo(() => {
    return availableRegulations.find((r) => r.id === regulationId) || availableRegulations[0];
  }, [availableRegulations, regulationId]);

  // Keep regulationId in sync if course changes
  useEffect(() => {
    if (availableRegulations.length > 0 && !availableRegulations.some((r) => r.id === regulationId)) {
      setRegulationId(availableRegulations[0].id);
    }
  }, [availableRegulations, regulationId]);

  // 2. Timeline & Status state
  const defaultTotalSem = Number(selectedCourse?.totalSemesters) || (isUG ? 6 : 4);
  const defaultDurationYears = Number(selectedCourse?.durationYears) || (isUG ? 3 : 2);

  const [totalSemesters, setTotalSemesters] = useState(
    initialData.totalSemesters || defaultTotalSem
  );
  const [durationYears, setDurationYears] = useState(
    initialData.durationYears || defaultDurationYears
  );

  useEffect(() => {
    if (!initialData.id && selectedCourse) {
      setTotalSemesters(Number(selectedCourse.totalSemesters) || (isUG ? 6 : 4));
      setDurationYears(Number(selectedCourse.durationYears) || (isUG ? 3 : 2));
    }
  }, [selectedCourse, initialData.id, isUG]);

  const [admissionYear, setAdmissionYear] = useState(
    initialData.admissionYear || (isUG ? 2021 : 2024)
  );

  const [status, setStatus] = useState(
    initialData.status || (isUG ? 'Completed' : 'In Progress')
  );

  const isCompleted = status === 'Completed';

  const [completionYear, setCompletionYear] = useState(
    initialData.completionYear ||
    initialData.expectedCompletionYear ||
    Number(admissionYear) + Number(durationYears)
  );

  const [currentSemester, setCurrentSemester] = useState(
    initialData.currentSemester || (isCompleted ? totalSemesters : 1)
  );

  const [batch, setBatch] = useState(
    initialData.batch || `${admissionYear}-${Number(admissionYear) + Number(durationYears)}`
  );

  // 3. Entry Mode state ('quick' | 'semester' | 'subject')
  const [entryMode, setEntryMode] = useState(initialData.entryMode || 'quick');

  // Mode 1: Quick entry state
  const [quickCGPA, setQuickCGPA] = useState(initialData.cgpa ? String(initialData.cgpa) : '8.12');
  const [quickCredits, setQuickCredits] = useState(
    initialData.totalCreditsEarned || (selectedCourse?.totalDegreeCredits || (isUG ? 150 : 104))
  );
  const [quickGrade, setQuickGrade] = useState(initialData.finalGrade || 'First Class with Distinction');

  // Mode 2: Semester-wise entry state
  const [semesters, setSemesters] = useState(() => {
    if (Array.isArray(initialData.semesters) && initialData.semesters.length > 0) {
      return initialData.semesters;
    }
    const timeline = educationRecordService.generateAcademicTimeline(
      admissionYear,
      courseId,
      universityId
    );
    return timeline.semesters;
  });

  // Mode 3: Detailed Subject entry state
  const [selectedSemNumber, setSelectedSemNumber] = useState(1);
  const [subjectSemesters, setSubjectSemesters] = useState(() => {
    const semMap = {};
    for (let i = 1; i <= totalSemesters; i++) {
      semMap[i] = [];
    }
    return semMap;
  });

  const [errors, setErrors] = useState({});

  // When university, course, or admissionYear changes, suggest updated timeline
  useEffect(() => {
    if (!initialData.id) {
      const expected = Number(admissionYear) + Number(durationYears);
      setCompletionYear(expected);
      setBatch(`${admissionYear}-${expected}`);
    }
  }, [admissionYear, durationYears, initialData.id]);

  const handleSemesterFieldChange = (semNum, field, value) => {
    setSemesters((prev) =>
      prev.map((s) => (s.semesterNumber === semNum ? { ...s, [field]: value } : s))
    );
  };

  const handleAddSubjectToSem = (semNum) => {
    setSubjectSemesters((prev) => ({
      ...prev,
      [semNum]: [
        ...(prev[semNum] || []),
        { id: `sub_${Date.now()}`, name: '', code: '', credits: 4, grade: 'A', marksObtained: 80, maxMarks: 100 }
      ]
    }));
  };

  const handleRemoveSubjectFromSem = (semNum, idx) => {
    setSubjectSemesters((prev) => ({
      ...prev,
      [semNum]: prev[semNum].filter((_, i) => i !== idx)
    }));
  };

  const handleSubjectChange = (semNum, idx, field, value) => {
    setSubjectSemesters((prev) => {
      const list = [...(prev[semNum] || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, [semNum]: list };
    });
  };

  // Grade points mapping for Osmania vs Standard
  const isOU = universityId === 'osmania';
  const isOUCourse = isOU && (courseId === 'bca' || courseId === 'mca');
  const gradeScale = selectedRegulation?.gradeScale || [
    { grade: isOUCourse ? 'S' : 'O', points: 10, isPass: true },
    { grade: 'A+', points: 9, isPass: true },
    { grade: 'A', points: 8, isPass: true },
    { grade: 'B+', points: 7, isPass: true },
    { grade: 'B', points: 6, isPass: true },
    { grade: 'C', points: 5, isPass: true },
    { grade: 'F', points: 0, isPass: false }
  ];

  // Live SGPA calculation for Mode 3 active semester
  const currentSemSubjects = subjectSemesters[selectedSemNumber] || [];
  const activeSemCalc = useMemo(() => {
    if (entryMode !== 'subject' || currentSemSubjects.length === 0) {
      return { sgpa: 0, earnedCredits: 0, totalCredits: 0 };
    }
    return academicCalculationEngine.calculateSGPA(currentSemSubjects, gradeScale);
  }, [entryMode, currentSemSubjects, gradeScale]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!admissionYear) newErrors.admissionYear = 'Admission year is required';
    if (isCompleted && !completionYear) newErrors.completionYear = 'Completion year is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cleanCourseName = selectedCourse?.name || (isUG ? 'Bachelor of Computer Applications' : 'Master of Computer Applications');
    const courseShort = selectedCourse?.shortName || (isUG ? 'BCA' : 'MCA');

    let calculatedCGPA = null;
    let finalCredits = Number(quickCredits) || (selectedCourse?.totalDegreeCredits || 150);

    if (entryMode === 'quick') {
      calculatedCGPA = quickCGPA ? Number(Number(quickCGPA).toFixed(2)) : null;
    } else if (entryMode === 'semester') {
      const validSems = semesters.filter((s) => s.sgpa !== null && s.sgpa !== undefined && Number(s.sgpa) > 0);
      if (validSems.length > 0) {
        calculatedCGPA = academicCalculationEngine.calculateCGPA(
          validSems.map((s) => ({
            semesterNumber: s.semesterNumber,
            sgpa: Number(s.sgpa),
            creditsEarned: Number(s.creditsEarned || 24),
            totalCredits: Number(s.totalCredits || 24)
          }))
        ).cgpa;
      }
    } else if (entryMode === 'subject') {
      const builtSems = [];
      Object.keys(subjectSemesters).forEach((semKey) => {
        const subs = subjectSemesters[semKey];
        if (subs.length > 0) {
          const res = academicCalculationEngine.calculateSGPA(subs, gradeScale);
          builtSems.push({
            semesterNumber: Number(semKey),
            sgpa: res.sgpa,
            creditsEarned: res.earnedCredits,
            totalCredits: res.totalCredits
          });
        }
      });
      if (builtSems.length > 0) {
        calculatedCGPA = academicCalculationEngine.calculateCGPA(builtSems).cgpa;
      }
    }

    const payload = {
      type: degreeType,
      level: courseShort,
      category: isUG ? 'Undergraduate' : 'Postgraduate',
      categoryGroup: isUG ? 'Undergraduate' : 'Postgraduate',
      universityId: selectedUniv?.id || 'osmania',
      university: `${selectedUniv?.name || 'Osmania University'} (${selectedUniv?.shortName || 'OU'})`,
      universityShortName: selectedUniv?.shortName || 'OU',
      courseId: selectedCourse?.id || (isUG ? 'bca' : 'mca'),
      course: cleanCourseName,
      courseShortName: courseShort,
      regulationId: selectedRegulation?.id || 'ou-bca-cbcs',
      regulationName: selectedRegulation?.name || 'Choice Based Credit System (CBCS)',
      regulationCode: selectedRegulation?.code || 'CBCS',
      ruleVersion: selectedRegulation?.ruleVersion || (isUG ? 'OU_BCA_CBCS_V1' : 'OU_MCA_CBCS_V1'),
      batch: batch.trim(),
      admissionYear: Number(admissionYear),
      completionYear: isCompleted ? Number(completionYear) : null,
      expectedCompletionYear: Number(completionYear),
      durationYears: Number(durationYears),
      totalSemesters: Number(totalSemesters),
      durationText: `${totalSemesters} Semesters (${durationYears} Years)`,
      status: isCompleted ? 'Completed' : 'In Progress',
      resultStatus: isCompleted ? 'Completed' : 'In Progress',
      currentSemester: isCompleted ? Number(totalSemesters) : Number(currentSemester),
      entryMode,
      cgpa: calculatedCGPA,
      finalGrade: quickGrade,
      totalCreditsEarned: finalCredits,
      totalDegreeCredits: selectedCourse?.totalDegreeCredits || (isUG ? 150 : 104),
      semesters: entryMode === 'semester' ? semesters : [],
      subjectSemesters: entryMode === 'subject' ? subjectSemesters : {}
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Academic Program & Catalog Rules */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF6B00]" />
          <span>University, Degree & Catalog Rules</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              University / Institution <span className="text-amber-500">*</span>
            </label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-text-h">
                  {u.name} ({u.shortName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Course / Degree <span className="text-amber-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id} className="bg-card text-text-h">
                  {c.shortName} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Academic Regulation
            </label>
            <select
              value={regulationId}
              onChange={(e) => setRegulationId(e.target.value)}
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            >
              {availableRegulations.map((r) => (
                <option key={r.id} value={r.id} className="bg-card text-text-h">
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Admission Batch
            </label>
            <input
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g., 2021-2024"
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. Timeline, Duration & Completion Status */}
      <div className="space-y-4 pt-2 border-t border-border">
        <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF6B00]" />
          <span>Timeline & Completion Status</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Education Status <span className="text-amber-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            >
              <option value="Completed" className="bg-card text-text-h">Completed Degree</option>
              <option value="In Progress" className="bg-card text-text-h">In Progress (Current Education)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Admission Year <span className="text-amber-500">*</span>
            </label>
            <input
              type="number"
              value={admissionYear}
              onChange={(e) => setAdmissionYear(Number(e.target.value))}
              placeholder="e.g., 2021"
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              {isCompleted ? 'Actual Completion Year' : 'Expected Completion Year'} <span className="text-amber-500">*</span>
            </label>
            <input
              type="number"
              value={completionYear}
              onChange={(e) => setCompletionYear(Number(e.target.value))}
              placeholder="e.g., 2024"
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Total Semesters
            </label>
            <input
              type="number"
              value={totalSemesters}
              onChange={(e) => setTotalSemesters(Number(e.target.value))}
              className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          {!isCompleted && (
            <div>
              <label className="block text-xs font-semibold text-text-light mb-1.5">
                Current Active Semester <span className="text-amber-500">*</span>
              </label>
              <select
                value={currentSemester}
                onChange={(e) => setCurrentSemester(Number(e.target.value))}
                className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
              >
                {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s} className="bg-card text-text-h">Semester {s}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-light mb-1.5">
              Course Duration Text
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-bg-sec border border-border text-text-m">
              {totalSemesters} Semesters ({durationYears} Years)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Result Entry Mode Selector */}
      <div className="space-y-4 pt-2 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-text-h uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF6B00]" />
            <span>Result Entry Mode</span>
          </h4>
          <span className="text-[11px] text-text-light">
            Choose how you want to record your grades
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ENTRY_MODES.map((mode) => {
            const isSelected = entryMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setEntryMode(mode.id)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-text-h shadow-sm'
                    : 'bg-bg-sec border-border text-text-light hover:text-text-h hover:border-slate-300 dark:hover:border-[#2A374A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-h">{mode.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />}
                </div>
                <p className="text-[11px] leading-relaxed text-text-light">{mode.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Mode 1 Content: Quick Entry Form */}
        {entryMode === 'quick' && (
          <div className="p-4 rounded-xl bg-bg-sec border border-border space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-text-h mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Degree Completion Summary</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-light mb-1.5">
                  Final CGPA / GPA <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={quickCGPA}
                  onChange={(e) => setQuickCGPA(e.target.value)}
                  placeholder="e.g., 8.12"
                  className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-light mb-1.5">
                  Total Credits Earned
                </label>
                <input
                  type="number"
                  value={quickCredits}
                  onChange={(e) => setQuickCredits(Number(e.target.value))}
                  placeholder="150"
                  className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-light mb-1.5">
                  Final Division / Standing
                </label>
                <input
                  type="text"
                  value={quickGrade}
                  onChange={(e) => setQuickGrade(e.target.value)}
                  placeholder="e.g., First Class with Distinction"
                  className="calc-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <p className="text-[11px] text-text-light italic">
              Note: Quick entry values are saved as student-provided summary records. You can upgrade to semester-wise or subject-level tracking at any time without losing this record.
            </p>
          </div>
        )}

        {/* Mode 2 Content: Semester-wise Entry Table */}
        {entryMode === 'semester' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs text-text-m">
                <thead className="bg-bg-sec text-text-light font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Semester</th>
                    <th className="py-2.5 px-3">Session / Period</th>
                    <th className="py-2.5 px-3 w-32">Status</th>
                    <th className="py-2.5 px-3 w-24">SGPA</th>
                    <th className="py-2.5 px-3 w-28">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesters.map((sem) => (
                    <tr key={sem.semesterNumber} className="hover:bg-bg-sec/40">
                      <td className="p-2 px-3 font-bold text-text-h">
                        Semester {sem.semesterNumber}
                      </td>
                      <td className="p-2 px-3">
                        <input
                          type="text"
                          value={sem.academicSession || ''}
                          onChange={(e) => handleSemesterFieldChange(sem.semesterNumber, 'academicSession', e.target.value)}
                          placeholder="e.g., Sep 2024 - Jan 2025"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                        />
                      </td>
                      <td className="p-2 px-3">
                        <select
                          value={sem.status || 'COMPLETED'}
                          onChange={(e) => handleSemesterFieldChange(sem.semesterNumber, 'status', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                        >
                          <option value="COMPLETED" className="bg-card text-text-h">Completed</option>
                          <option value="IN_PROGRESS" className="bg-card text-text-h">In Progress</option>
                          <option value="RESULT_PENDING" className="bg-card text-text-h">Result Pending</option>
                          <option value="NOT_STARTED" className="bg-card text-text-h">Not Started</option>
                        </select>
                      </td>
                      <td className="p-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sem.sgpa !== null && sem.sgpa !== undefined ? sem.sgpa : ''}
                          onChange={(e) => handleSemesterFieldChange(sem.semesterNumber, 'sgpa', e.target.value ? Number(e.target.value) : null)}
                          placeholder="8.20"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                        />
                      </td>
                      <td className="p-2 px-3">
                        <input
                          type="number"
                          value={sem.creditsEarned !== undefined ? sem.creditsEarned : 24}
                          onChange={(e) => handleSemesterFieldChange(sem.semesterNumber, 'creditsEarned', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mode 3 Content: Detailed Subject Entry */}
        {entryMode === 'subject' && (
          <div className="p-4 rounded-xl bg-bg-sec border border-border space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-light">Select Semester:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSemNumber(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSemNumber === s
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-card text-text-light hover:text-text-h border border-border'
                      }`}
                    >
                      Sem {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddSubjectToSem(selectedSemNumber)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF6B00] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            {currentSemSubjects.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border bg-card/50">
                <p className="text-xs text-text-light">
                  No subjects recorded for Semester {selectedSemNumber} yet.
                </p>
                <button
                  type="button"
                  onClick={() => handleAddSubjectToSem(selectedSemNumber)}
                  className="mt-2 text-xs font-semibold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  + Add First Subject
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs text-text-m">
                  <thead className="bg-bg-sec text-text-light font-semibold uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-3 w-20">Code</th>
                      <th className="py-2 px-3 w-16">Credits</th>
                      <th className="py-2 px-3 w-20">Grade</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentSemSubjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-bg-sec/40">
                        <td className="p-1.5 px-3">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => handleSubjectChange(selectedSemNumber, idx, 'name', e.target.value)}
                            placeholder="e.g., Data Structures"
                            className="w-full px-2 py-1 rounded bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                          />
                        </td>
                        <td className="p-1.5 px-3">
                          <input
                            type="text"
                            value={sub.code}
                            onChange={(e) => handleSubjectChange(selectedSemNumber, idx, 'code', e.target.value)}
                            placeholder="CS101"
                            className="w-full px-2 py-1 rounded bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                          />
                        </td>
                        <td className="p-1.5 px-3">
                          <input
                            type="number"
                            value={sub.credits}
                            onChange={(e) => handleSubjectChange(selectedSemNumber, idx, 'credits', Number(e.target.value))}
                            className="w-full px-2 py-1 rounded bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                          />
                        </td>
                        <td className="p-1.5 px-3">
                          <input
                            type="text"
                            value={sub.grade}
                            onChange={(e) => handleSubjectChange(selectedSemNumber, idx, 'grade', e.target.value)}
                            placeholder={isOUCourse ? 'S' : 'A+'}
                            className="w-full px-2 py-1 rounded bg-card border border-border text-text-h text-xs focus:border-[#FF6B00] focus:outline-none"
                          />
                        </td>
                        <td className="p-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromSem(selectedSemNumber, idx)}
                            className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {currentSemSubjects.length > 0 && (
              <div className="p-3 bg-bg-sec border border-border rounded-xl flex items-center justify-between text-xs">
                <span className="text-text-light">Semester {selectedSemNumber} Live Calculation:</span>
                <span className="font-bold text-text-h">
                  SGPA: <span className="text-[#FF6B00]">{activeSemCalc.sgpa.toFixed(2)}</span> ({activeSemCalc.earnedCredits} Credits)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer active:scale-95"
        >
          Save {isUG ? 'Undergraduate' : 'Postgraduate'} Record
        </button>
      </div>
    </form>
  );
}
