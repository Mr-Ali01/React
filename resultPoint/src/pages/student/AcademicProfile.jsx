import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Save,
  CheckCircle2,
  GraduationCap,
  Building2,
  Layers,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { academicCatalogService } from '../../services/academicCatalogService';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';

export default function AcademicProfile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(() => studentService.getProfile());

  const universities = academicCatalogService.getUniversities();
  const [univId, setUnivId] = useState(profile.universityId || universities[0]?.id || 'jntuh');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(profile.courseId || '');
  const [regulations, setRegulations] = useState([]);
  const [regulationId, setRegulationId] = useState(profile.regulationId || '');

  // Load courses when university changes
  useEffect(() => {
    if (!univId) return;
    const avail = academicCatalogService.getCoursesByUniversity(univId);
    setCourses(avail);
    if (!avail.some((c) => c.id === courseId)) {
      setCourseId(avail[0]?.id || '');
    }
  }, [univId]);

  // Load regulations when course changes
  useEffect(() => {
    if (!univId || !courseId) return;
    const regs = academicCatalogService.getRegulationsByCourse(univId, courseId);
    setRegulations(regs);
    if (!regs.some((r) => r.id === regulationId)) {
      setRegulationId(regs[0]?.id || '');
    }
  }, [univId, courseId]);

  const activeConfig = academicCatalogService.getFullConfiguration(univId, courseId, regulationId);

  const handleSave = (e) => {
    e.preventDefault();
    if (!activeConfig) {
      showToast('Please select a valid academic configuration.');
      return;
    }

    const updated = studentService.updateProfile({
      ...profile,
      universityId: activeConfig.university.id,
      university: activeConfig.university.name,
      courseId: activeConfig.course.id,
      course: activeConfig.course.name,
      regulationId: activeConfig.regulation.id,
      regulation: activeConfig.regulation.code,
      ruleVersion: activeConfig.regulation.ruleVersion,
      totalSemesters: activeConfig.course.totalSemesters,
      totalDegreeCredits: activeConfig.course.totalDegreeCredits
    });

    setProfile(updated);
    showToast('Student academic profile updated and verified successfully.');
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before reviewing or updating your academic profile, please complete your initial Academic Profile Setup to configure your University, Course, and Regulation."
    >
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-accent" />
            <span>Academic Profile</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
            Manage your verified enrollment details, course regulations, and institution information.
          </p>
        </div>

        <Link
          to="/student/profile-setup"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-accent bg-accent-soft hover:bg-accent/20 border border-accent/30 transition-all self-start sm:self-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Setup Wizard</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card Header */}
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center gap-4">
          <img
            src={profile.avatar}
            alt={profile.fullName}
            className="w-18 h-18 rounded-2xl object-cover ring-4 ring-accent/30"
          />
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-lg font-bold text-text-h">{profile.fullName}</h2>
            <p className="text-xs text-text-light">{profile.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/10 text-accent">
                {profile.course || 'Degree Program'} • {profile.university || 'University'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-brandGreen flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Regulation: {profile.regulation || 'CBCS'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Core Personal Details */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Full Student Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Hall Ticket / Roll Number
              </label>
              <input
                type="text"
                value={profile.hallTicketNumber || ''}
                onChange={(e) => setProfile({ ...profile, hallTicketNumber: e.target.value })}
                placeholder="e.g. 1005-23-772-045"
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Academic Batch / Admission Year
              </label>
              <input
                type="text"
                value={profile.batch || ''}
                onChange={(e) => setProfile({ ...profile, batch: e.target.value })}
                placeholder="e.g. 2023 - 2027"
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                required
              />
            </div>
          </div>
        </div>

        {/* Academic Catalog Configuration (Dependent Dropdowns) */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
              Enrolled Academic Program & Catalog Rules
            </h3>
            <span className="text-[11px] text-text-light">
              Managed via Academic Catalog
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                University / Institute
              </label>
              <select
                value={univId}
                onChange={(e) => setUnivId(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Course / Degree
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {courses.some((c) => c.level === 'UG') && (
                  <optgroup label="Undergraduate (UG) Programs">
                    {courses
                      .filter((c) => c.level === 'UG')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.totalSemesters} Semesters)
                        </option>
                      ))}
                  </optgroup>
                )}
                {courses.some((c) => c.level === 'PG') && (
                  <optgroup label="Postgraduate (PG) Programs">
                    {courses
                      .filter((c) => c.level === 'PG')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.totalSemesters} Semesters)
                        </option>
                      ))}
                  </optgroup>
                )}
                {courses
                  .filter((c) => !['UG', 'PG'].includes(c.level))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.totalSemesters} Semesters)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Academic Regulation
              </label>
              <select
                value={regulationId}
                onChange={(e) => setRegulationId(e.target.value)}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — [{r.ruleVersion}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-h mb-1">
                Current Semester (Max: {activeConfig?.course?.totalSemesters || 8})
              </label>
              <input
                type="number"
                min="1"
                max={activeConfig?.course?.totalSemesters || 8}
                value={profile.currentSemester}
                onChange={(e) => setProfile({ ...profile, currentSemester: Number(e.target.value) })}
                className="calc-input w-full px-3 py-2 rounded-xl text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Active Formula Banner */}
          {activeConfig && (
            <div className="p-3.5 rounded-xl bg-bg-sec border border-border/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-text-h block">
                  Active Percentage Formula: {activeConfig.calculationRule.formulaDescription}
                </span>
                <span className="text-[11px] text-text-light">
                  Rule Version: {activeConfig.regulation.ruleVersion} • Grading System: {activeConfig.regulation.gradingSystem}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent self-start sm:self-center">
                Total Degree Credits: {activeConfig.course.totalDegreeCredits}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
      </div>
    </AcademicProfileGate>
  );
}
