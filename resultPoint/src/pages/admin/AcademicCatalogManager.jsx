import React, { useState, useMemo } from 'react';
import {
  Building2,
  BookOpen,
  Award,
  Layers,
  Sliders,
  Plus,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  History
} from 'lucide-react';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useToast } from '../../context/ToastContext';

export default function AcademicCatalogManager({ initialTab = 'universities' }) {
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState(() => academicCatalogService.getCatalog());
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync if prop changes
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Selected hierarchy states for drilling down
  const [selectedUnivId, setSelectedUnivId] = useState(() => catalog.universities[0]?.id || 'jntuh');
  const selectedUniv = useMemo(() => {
    return catalog.universities.find((u) => u.id === selectedUnivId) || catalog.universities[0];
  }, [catalog, selectedUnivId]);

  const [selectedCourseId, setSelectedCourseId] = useState(() => selectedUniv?.courses[0]?.id || 'btech-cse');
  const selectedCourse = useMemo(() => {
    return selectedUniv?.courses.find((c) => c.id === selectedCourseId) || selectedUniv?.courses[0];
  }, [selectedUniv, selectedCourseId]);

  const [selectedRegId, setSelectedRegId] = useState(() => selectedCourse?.regulations[0]?.id || 'jntuh-cse-r18');
  const selectedReg = useMemo(() => {
    return selectedCourse?.regulations?.find((r) => r.id === selectedRegId) || selectedCourse?.regulations?.[0];
  }, [selectedCourse, selectedRegId]);

  const [selectedSemester, setSelectedSemester] = useState(1);

  // Modal / Form states for creation
  const [isAddUnivOpen, setIsAddUnivOpen] = useState(false);
  const [newUniv, setNewUniv] = useState({ name: '', shortName: '', city: '', state: '', type: 'State Technical University' });

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', shortName: '', level: 'UG', durationYears: 4, totalSemesters: 8, totalDegreeCredits: 160 });

  const [isPublishVersionOpen, setIsPublishVersionOpen] = useState(false);
  const [newRuleVersion, setNewRuleVersion] = useState({ ruleVersion: '', formulaDescription: '' });

  // Add University submit
  const handleAddUniversity = (e) => {
    e.preventDefault();
    if (!newUniv.name || !newUniv.shortName) return;

    academicCatalogService.addUniversity({
      ...newUniv,
      courses: []
    });
    setCatalog(academicCatalogService.getCatalog());
    showToast(`University ${newUniv.shortName} added to Academic Catalog!`);
    setIsAddUnivOpen(false);
    setNewUniv({ name: '', shortName: '', city: '', state: '', type: 'State Technical University' });
  };

  // Add Course submit
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.shortName) return;

    academicCatalogService.addCourse(selectedUnivId, newCourse);
    setCatalog(academicCatalogService.getCatalog());
    showToast(`Course ${newCourse.shortName} added under ${selectedUniv.shortName}!`);
    setIsAddCourseOpen(false);
    setNewCourse({ name: '', shortName: '', level: 'UG', durationYears: 4, totalSemesters: 8, totalDegreeCredits: 160 });
  };

  // Publish New Rule Version (preserving historical integrity)
  const handlePublishVersion = (e) => {
    e.preventDefault();
    if (!newRuleVersion.ruleVersion) return;

    academicCatalogService.publishNewRegulationVersion(selectedUnivId, selectedCourseId, selectedRegId, {
      ruleVersion: newRuleVersion.ruleVersion,
      calculationRule: {
        ...selectedReg.calculationRule,
        formulaDescription: newRuleVersion.formulaDescription || selectedReg.calculationRule?.formulaDescription
      }
    });

    setCatalog(academicCatalogService.getCatalog());
    showToast(`Published immutable Rule Version "${newRuleVersion.ruleVersion}"! Existing student historical records remain untouched.`);
    setIsPublishVersionOpen(false);
    setNewRuleVersion({ ruleVersion: '', formulaDescription: '' });
  };

  const handleResetCatalog = () => {
    if (window.confirm('Reset catalog to official verified university seeds?')) {
      const reset = academicCatalogService.resetToDefaults();
      setCatalog(reset);
      showToast('Catalog reset to standard verified university data.');
    }
  };

  // Aggregate Stats
  const totalUniversities = catalog.universities.length;
  const totalCourses = catalog.universities.reduce((acc, u) => acc + (u.courses?.length || 0), 0);
  const totalRegulations = catalog.universities.reduce(
    (acc, u) => acc + (u.courses?.reduce((cAcc, c) => cAcc + (c.regulations?.length || 0), 0) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-accent" />
            <span>Academic Catalog & Regulation Registry</span>
          </h1>
          <p className="text-xs text-text-light mt-0.5">
            Manage official universities, courses, duration constraints, regulations, and immutable calculation rule versions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-light hover:text-text-h bg-card border border-border hover:bg-bg-sec transition-all"
            title="Restore seed catalog"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* High-Level Registry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalUniversities}</span>
            <span className="text-xs text-text-light font-medium">Universities Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brandGreen/10 border border-brandGreen/20 flex items-center justify-center text-brandGreen">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalCourses}</span>
            <span className="text-xs text-text-light font-medium">Academic Programs / Courses</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brandPurple/10 border border-brandPurple/20 flex items-center justify-center text-brandPurple">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-text-h block">{totalRegulations}</span>
            <span className="text-xs text-text-light font-medium">Regulations & Rule Versions</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'universities', label: 'Universities', icon: Building2 },
          { id: 'courses', label: 'Courses & Semesters', icon: BookOpen },
          { id: 'regulations', label: 'Regulations & Versions', icon: Sliders },
          { id: 'grading', label: 'Grading Rules & Scales', icon: Award },
          { id: 'subjects', label: 'Curriculums & Subjects', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-light hover:text-text-h hover:bg-bg-sec'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIVERSITIES */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-h uppercase tracking-wider">
              Configured Institutional Catalogs
            </h2>
            <button
              onClick={() => setIsAddUnivOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add University</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.universities.map((univ) => (
              <div
                key={univ.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-3 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent uppercase">
                      {univ.shortName}
                    </span>
                    <h3 className="text-base font-bold text-text-h mt-1">{univ.name}</h3>
                    <p className="text-xs text-text-light">
                      {univ.city}, {univ.state} • {univ.type}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brandGreen/10 text-brandGreen border border-brandGreen/20">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-light">
                  <span>{univ.courses?.length || 0} Configured Courses</span>
                  <button
                    onClick={() => {
                      setSelectedUnivId(univ.id);
                      setActiveTab('courses');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    View Courses →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COURSES & SEMESTERS */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-text-h">Selected University:</label>
              <select
                value={selectedUnivId}
                onChange={(e) => {
                  setSelectedUnivId(e.target.value);
                  const u = catalog.universities.find((item) => item.id === e.target.value);
                  if (u?.courses?.[0]) setSelectedCourseId(u.courses[0].id);
                }}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {catalog.universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddCourseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course under {selectedUniv?.shortName}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedUniv?.courses?.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-3 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brandGreen/10 text-brandGreen uppercase">
                      {course.level} • {course.shortName}
                    </span>
                    <h3 className="text-base font-bold text-text-h mt-1">{course.name}</h3>
                  </div>
                  <span className="text-xs font-extrabold text-accent bg-accent/10 px-2 py-1 rounded-xl">
                    {course.totalSemesters} Semesters
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-bg border border-border">
                    <span className="text-text-light block text-[10px]">Duration</span>
                    <strong className="text-text-h">{course.durationYears} Years</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-bg border border-border">
                    <span className="text-text-light block text-[10px]">Max Semesters</span>
                    <strong className="text-text-h">1 to {course.totalSemesters}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-bg border border-border">
                    <span className="text-text-light block text-[10px]">Degree Credits</span>
                    <strong className="text-text-h">{course.totalDegreeCredits || 160} Cr</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-light">
                  <span>{course.regulations?.length || 0} Regulations</span>
                  <button
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setActiveTab('regulations');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    View Regulations →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGULATIONS & RULE VERSIONS */}
      {activeTab === 'regulations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div>
              <label className="text-xs font-bold text-text-h block mb-1">University</label>
              <select
                value={selectedUnivId}
                onChange={(e) => setSelectedUnivId(e.target.value)}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {catalog.universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.shortName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-h block mb-1">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {selectedUniv?.courses?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto self-end">
              <button
                onClick={() => setIsPublishVersionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-all"
              >
                <History className="w-4 h-4" />
                <span>Publish New Immutable Rule Version</span>
              </button>
            </div>
          </div>

          {/* Regulation Details */}
          <div className="space-y-3">
            {selectedCourse?.regulations?.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-accent text-white">
                        {reg.code}
                      </span>
                      <h3 className="text-base font-bold text-text-h">{reg.name}</h3>
                    </div>
                    <p className="text-xs text-text-light mt-1">
                      Rule Version Identifier: <code className="text-accent font-mono">{reg.ruleVersion}</code>
                    </p>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-xl bg-brandGreen/10 text-brandGreen border border-brandGreen/20 font-semibold self-start sm:self-auto">
                    Grading: {reg.gradingSystem}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-bg border border-border text-xs space-y-1.5">
                  <p className="text-text-h font-semibold">
                    SGPA Formula: <span className="font-mono text-accent">{reg.calculationRule?.sgpaFormula || 'WEIGHTED_CREDIT_SUM'}</span>
                  </p>
                  <p className="text-text-h font-semibold">
                    CGPA Formula: <span className="font-mono text-brandGreen">{reg.calculationRule?.cgpaFormula || 'CUMULATIVE_WEIGHTED_CREDIT_SUM'}</span>
                  </p>
                  <p className="text-text-light">
                    Percentage Conversion: <span className="font-mono">{reg.calculationRule?.percentageFormula || 'CGPA * 10'}</span>
                  </p>
                  <p className="text-[11px] text-text-light pt-1">
                    Applicable Admission Batches: {reg.effectiveBatches?.join(', ') || 'All active cohorts'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GRADING RULES & PASSING CRITERIA */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <h3 className="text-xs font-bold text-text-h uppercase tracking-wider mb-1">
              Active Regulation: {selectedReg?.name} ({selectedReg?.code})
            </h3>
            <p className="text-xs text-text-light">
              Official grade letter mappings and grade points applied when students calculate results.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-sec text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Letter Grade</th>
                  <th className="py-3 px-4 text-center">Grade Points</th>
                  <th className="py-3 px-4">Marks Range</th>
                  <th className="py-3 px-4">Performance Standing</th>
                  <th className="py-3 px-4 text-center">Passing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {selectedReg?.gradeScale?.map((g) => (
                  <tr key={g.grade} className="hover:bg-bg-sec/40 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-accent text-sm">{g.grade}</td>
                    <td className="py-3 px-4 text-center font-bold text-text-h">{g.points}</td>
                    <td className="py-3 px-4 text-text-light font-medium">
                      {g.minPercentage}% - {g.maxPercentage}%
                    </td>
                    <td className="py-3 px-4 font-medium text-text-h">{g.desc}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.isPass
                            ? 'bg-brandGreen/10 text-brandGreen border border-brandGreen/20'
                            : 'bg-brandPink/10 text-brandPink border border-brandPink/20'
                        }`}
                      >
                        {g.isPass ? 'Pass' : 'Fail (Backlog)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CURRICULUMS & SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div>
              <label className="text-xs font-bold text-text-h block mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="calc-input px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {Array.from({ length: selectedCourse?.totalSemesters || 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-text-light self-end pb-1.5">
              Curriculum for <strong>{selectedUniv?.shortName} • {selectedCourse?.name} • Semester {selectedSemester}</strong>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-sec text-text-light font-bold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4 text-center">Default Credits</th>
                  <th className="py-3 px-4 text-center">Course Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {academicCatalogService
                  .getSemesterSubjects(selectedUnivId, selectedCourseId, selectedRegId, selectedSemester)
                  .map((sub, idx) => (
                    <tr key={idx} className="hover:bg-bg-sec/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-accent">{sub.code}</td>
                      <td className="py-3 px-4 font-semibold text-text-h">{sub.name}</td>
                      <td className="py-3 px-4 text-center font-bold">{sub.defaultCredits || sub.credits}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-bg-sec text-text-light text-[11px] font-medium border border-border">
                          {sub.type || 'Core Course'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD UNIVERSITY */}
      {isAddUnivOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            <h2 className="text-base font-bold text-text-h">Add New University</h2>
            <form onSubmit={handleAddUniversity} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">University Name</label>
                <input
                  type="text"
                  placeholder="e.g. University of Mumbai"
                  value={newUniv.name}
                  onChange={(e) => setNewUniv({ ...newUniv, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Acronym / Short Name</label>
                <input
                  type="text"
                  placeholder="e.g. MU"
                  value={newUniv.shortName}
                  onChange={(e) => setNewUniv({ ...newUniv, shortName: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-h font-semibold mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={newUniv.city}
                    onChange={(e) => setNewUniv({ ...newUniv, city: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={newUniv.state}
                    onChange={(e) => setNewUniv({ ...newUniv, state: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnivOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COURSE */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            <h2 className="text-base font-bold text-text-h">Add Course under {selectedUniv?.shortName}</h2>
            <form onSubmit={handleAddCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Course Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech - Information Technology"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Short Name / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. IT"
                    value={newCourse.shortName}
                    onChange={(e) => setNewCourse({ ...newCourse, shortName: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Degree Level</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="calc-input w-full px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="UG">UG (Undergraduate)</option>
                    <option value="PG">PG (Postgraduate)</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-text-h font-semibold mb-1">Duration (Yrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.durationYears}
                    onChange={(e) => setNewCourse({ ...newCourse, durationYears: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={newCourse.totalSemesters}
                    onChange={(e) => setNewCourse({ ...newCourse, totalSemesters: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl font-bold text-accent"
                  />
                </div>
                <div>
                  <label className="block text-text-h font-semibold mb-1">Total Credits</label>
                  <input
                    type="number"
                    value={newCourse.totalDegreeCredits}
                    onChange={(e) => setNewCourse({ ...newCourse, totalDegreeCredits: Number(e.target.value) })}
                    className="calc-input w-full px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH IMMUTABLE RULE VERSION */}
      {isPublishVersionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            <h2 className="text-base font-bold text-text-h">Publish New Rule Version</h2>
            <p className="text-xs text-text-light">
              This creates an immutable regulation version for <strong>{selectedReg?.name}</strong>. Historical student results linked to previous versions will remain untouched.
            </p>

            <form onSubmit={handlePublishVersion} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-h font-semibold mb-1">Rule Version ID</label>
                <input
                  type="text"
                  placeholder="e.g. JNTUH_R18_V2_2026"
                  value={newRuleVersion.ruleVersion}
                  onChange={(e) => setNewRuleVersion({ ...newRuleVersion, ruleVersion: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-text-h font-semibold mb-1">Formula Change Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Revised percentage conversion formula to (CGPA - 0.75) * 10 for 2026+ admissions."
                  value={newRuleVersion.formulaDescription}
                  onChange={(e) => setNewRuleVersion({ ...newRuleVersion, formulaDescription: e.target.value })}
                  className="calc-input w-full px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishVersionOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-light hover:bg-bg-sec font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover shadow-accent"
                >
                  Publish Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
