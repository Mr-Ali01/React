import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Layers,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Award,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { academicCatalogService } from '../../services/academicCatalogService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';

export default function AcademicProfileSetup() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const universities = academicCatalogService.getUniversities();
  const initialProfile = studentService.getProfile();

  const [selectedUnivId, setSelectedUnivId] = useState(
    initialProfile?.universityId || universities.find((u) => u.id === 'osmania')?.id || universities[0]?.id || 'osmania'
  );
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialProfile?.courseId || '');
  const [regulations, setRegulations] = useState([]);
  const [selectedRegulationId, setSelectedRegulationId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(initialProfile?.batch || '');
  const [hallTicketNumber, setHallTicketNumber] = useState(initialProfile?.hallTicketNumber || '');
  const [currentSemester, setCurrentSemester] = useState(initialProfile?.currentSemester || 1);

  // When university changes, load its courses
  useEffect(() => {
    if (!selectedUnivId) return;
    const availableCourses = academicCatalogService.getCoursesByUniversity(selectedUnivId);
    setCourses(availableCourses);
    if (availableCourses.length > 0) {
      if (!availableCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(availableCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [selectedUnivId]);

  // When course changes, load its regulations
  useEffect(() => {
    if (!selectedUnivId || !selectedCourseId) return;
    const availableRegs = academicCatalogService.getRegulationsByCourse(selectedUnivId, selectedCourseId);
    setRegulations(availableRegs);
    if (availableRegs.length > 0) {
      const activeReg = availableRegs.find((r) => r.id === selectedRegulationId) || availableRegs[0];
      setSelectedRegulationId(activeReg.id);
      if (activeReg.effectiveBatches && activeReg.effectiveBatches.length > 0) {
        if (!activeReg.effectiveBatches.includes(selectedBatch)) {
          setSelectedBatch(activeReg.effectiveBatches[0]);
        }
      }
    } else {
      setSelectedRegulationId('');
      setSelectedBatch('');
    }
  }, [selectedUnivId, selectedCourseId]);

  // When regulation changes, ensure selected batch belongs to that regulation's effectiveBatches
  useEffect(() => {
    if (!selectedRegulationId || regulations.length === 0) return;
    const currentReg = regulations.find((r) => r.id === selectedRegulationId);
    if (currentReg?.effectiveBatches && currentReg.effectiveBatches.length > 0) {
      if (!currentReg.effectiveBatches.includes(selectedBatch)) {
        setSelectedBatch(currentReg.effectiveBatches[0]);
      }
    }
  }, [selectedRegulationId, regulations]);

  // Retrieve full configuration for the selected combination
  const activeConfig = academicCatalogService.getFullConfiguration(
    selectedUnivId,
    selectedCourseId,
    selectedRegulationId
  );

  // Keep current semester within course bounds
  useEffect(() => {
    if (activeConfig?.course?.totalSemesters && currentSemester > activeConfig.course.totalSemesters) {
      setCurrentSemester(1);
    }
  }, [activeConfig?.course?.totalSemesters]);

  const handleNext = () => {
    if (step === 1) {
      if (!selectedUnivId || !selectedCourseId) {
        showToast('Please select both a university and course.');
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

  const handleConfirmAndSave = () => {
    if (!activeConfig) {
      showToast('Academic configuration is incomplete.');
      return;
    }

    const updatedProfile = {
      universityId: activeConfig.university.id,
      university: activeConfig.university.name,
      universityShortName: activeConfig.university.shortName,
      courseId: activeConfig.course.id,
      course: activeConfig.course.name,
      courseShortName: activeConfig.course.shortName,
      regulationId: activeConfig.regulation.id,
      regulation: activeConfig.regulation.code,
      ruleVersion: activeConfig.regulation.ruleVersion,
      totalSemesters: activeConfig.course.totalSemesters,
      totalDegreeCredits: activeConfig.course.totalDegreeCredits,
      currentSemester: Number(currentSemester) || 1,
      batch: selectedBatch,
      hallTicketNumber: hallTicketNumber.trim() || 'REG-' + Date.now().toString().slice(-6),
      gradingSystem: activeConfig.regulation.gradingSystem,
      hasCompletedProfile: true
    };

    studentService.updateProfile(updatedProfile);
    showToast('Academic Profile configured and verified successfully!');
    navigate('/student/dashboard');
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

      {/* Step 2: Regulation & Batch */}
      {step === 2 && activeConfig && (
        <div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                1. Academic Regulation
              </label>
              <select
                value={selectedRegulationId}
                onChange={(e) => setSelectedRegulationId(e.target.value)}
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
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {Array.from(
                    { length: activeConfig?.course?.totalSemesters || 8 },
                    (_, i) => i + 1
                  ).map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem} (of {activeConfig?.course?.totalSemesters || 8})
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
                    Loaded for {activeConfig.course.name} ({activeConfig.university.shortName})
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                {activeConfig.regulation.gradingSystem}
              </span>
            </div>

            {/* Special Notice for MCA / BCA S-Grade Rule */}
            {['mca', 'bca'].includes(String(activeConfig.course.id).toLowerCase()) && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-start gap-2.5 text-xs">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="font-bold text-accent">Osmania University S-Grade Exception:</span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    Under Osmania University academic regulations, <strong>{activeConfig.course.shortName}</strong> awards grade{' '}
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
                  {activeConfig.gradeScale.map((g) => (
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
                <span className="font-semibold text-slate-900 dark:text-white">Conversion Rule:</span> {activeConfig.calculationRule.formulaDescription}
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

      {/* Step 3: Review & Confirmation */}
      {step === 3 && activeConfig && (
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
                {activeConfig.university.name} ({activeConfig.university.shortName})
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{activeConfig.university.state}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Degree Program & Level
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {activeConfig.course.name} ({activeConfig.course.shortName})
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {activeConfig.course.level} • {activeConfig.course.durationYears} Years ({activeConfig.course.totalSemesters} Semesters / {activeConfig.course.totalDegreeCredits} Total Credits)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Academic Regulation
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                {activeConfig.regulation.name} [{activeConfig.regulation.code}]
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Rule Version: {activeConfig.regulation.ruleVersion}</span>
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
                Semester {currentSemester} (of {activeConfig.course.totalSemesters} Semesters)
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
                {activeConfig.regulation.gradingSystem}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {['mca', 'bca'].includes(String(activeConfig.course.id).toLowerCase())
                  ? 'S (Super) grade scheme configured'
                  : 'O (Outstanding) grade scheme configured'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200/70 dark:border-[#1E2A35]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Percentage Conversion Formula
              </span>
              <span className="text-sm font-bold text-orange-500 block mt-0.5">
                {activeConfig.calculationRule.formulaDescription}
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
                  {activeConfig.gradeScale.map((g) => (
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save Academic Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
