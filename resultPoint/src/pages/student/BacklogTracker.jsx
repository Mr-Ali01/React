import { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectBacklogs,
  selectActiveBacklogs,
  selectClearedBacklogs,
  selectTotalBacklogs,
  selectClearanceStatus,
  fetchBacklogs,
  markBacklogCleared
} from '../../features/backlog/backlogSlice';
import { selectPerformanceAnalytics, fetchPerformanceData } from '../../features/performance/performanceSlice';
import { fetchResults } from '../../features/results/resultsSlice';
import { selectAcademicProfile, fetchAcademicProfile } from '../../features/academicProfile/academicProfileSlice';
import { studentService } from '../../services/studentService';
import { academicCatalogService } from '../../services/academicCatalogService';
import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import { useToast } from '../../context/ToastContext';

export default function BacklogTracker() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxProfile = useAppSelector(selectAcademicProfile);
  const backlogs = useAppSelector(selectBacklogs);
  const activeBacklogs = useAppSelector(selectActiveBacklogs);
  const clearedBacklogs = useAppSelector(selectClearedBacklogs);
  const totalBacklogs = useAppSelector(selectTotalBacklogs);
  const clearanceStatus = useAppSelector(selectClearanceStatus);
  const performance = useAppSelector(selectPerformanceAnalytics);

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CLEARED'
  const [searchQuery, setSearchQuery] = useState('');
  const [clearingBacklog, setClearingBacklog] = useState(null);
  const [clearedGrade, setClearedGrade] = useState('B');
  const [examinationPeriod, setExaminationPeriod] = useState('Supplementary Examination');

  useEffect(() => {
    dispatch(fetchAcademicProfile());
    dispatch(fetchBacklogs());
    dispatch(fetchResults());
    dispatch(fetchPerformanceData());

    const handleSync = () => {
      dispatch(fetchBacklogs());
      dispatch(fetchResults());
      dispatch(fetchPerformanceData());
    };

    window.addEventListener('backlogs_data_updated', handleSync);
    window.addEventListener('results_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('backlogs_data_updated', handleSync);
      window.removeEventListener('results_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch]);

  const profile = useMemo(
    () => ({
      ...studentService.getProfile(),
      ...(reduxProfile || {})
    }),
    [reduxProfile]
  );

  // University-specific catalog configuration to provide accurate grade options
  const catalogConfig = useMemo(() => {
    return academicCatalogService.getFullConfiguration(
      profile?.universityId,
      profile?.courseId,
      profile?.regulationId
    );
  }, [profile?.universityId, profile?.courseId, profile?.regulationId]);

  const passingGrades = useMemo(() => {
    if (catalogConfig && Array.isArray(catalogConfig.gradeScale)) {
      const list = catalogConfig.gradeScale.filter((g) => g.isPass && g.grade !== 'F');
      if (list.length > 0) return list;
    }
    // Standard scale fallback
    return [
      { grade: 'S', points: 10, desc: 'Super' },
      { grade: 'A+', points: 9, desc: 'Excellent' },
      { grade: 'A', points: 8, desc: 'Very Good' },
      { grade: 'B+', points: 7, desc: 'Good' },
      { grade: 'B', points: 6, desc: 'Above Average' },
      { grade: 'C', points: 5, desc: 'Pass' }
    ];
  }, [catalogConfig]);

  // Filtered backlogs
  const filteredBacklogs = useMemo(() => {
    let list = Array.isArray(backlogs) ? [...backlogs] : [];

    if (activeTab === 'ACTIVE') {
      list = list.filter((b) => b.status === 'Active');
    } else if (activeTab === 'CLEARED') {
      list = list.filter((b) => b.status === 'Cleared');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          (b.subjectCode || '').toLowerCase().includes(q) ||
          (b.subjectName || '').toLowerCase().includes(q) ||
          (b.semesterLabel || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [backlogs, activeTab, searchQuery]);

  const handleOpenClearModal = (item) => {
    setClearingBacklog(item);
    // Pre-select B or the first available passing grade
    const defaultGrade = passingGrades.find((g) => g.grade === 'B') || passingGrades[0];
    setClearedGrade(defaultGrade ? defaultGrade.grade : 'B');
    setExaminationPeriod(`Supplementary Examination (${item.semesterLabel || `Semester ${item.semesterNumber}`})`);
  };

  const handleClearSupplementary = async (e) => {
    e.preventDefault();
    if (!clearingBacklog) return;

    try {
      const gradeObj = passingGrades.find((g) => g.grade === clearedGrade) || { points: 6 };

      await dispatch(
        markBacklogCleared({
          semesterId: `semester-${clearingBacklog.semesterNumber}`,
          semesterNumber: clearingBacklog.semesterNumber,
          subjectCode: clearingBacklog.subjectCode,
          clearedGrade,
          clearedPoints: gradeObj.points,
          clearedPeriod: examinationPeriod || 'Supplementary Examination'
        })
      ).unwrap();

      // Immediate refresh across all slices
      dispatch(fetchResults());
      dispatch(fetchPerformanceData());
      dispatch(fetchBacklogs());

      showToast(
        `${clearingBacklog.subjectCode} (${clearingBacklog.subjectName}) marked as cleared with grade ${clearedGrade} (${gradeObj.points} points)!`
      );
      setClearingBacklog(null);
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to update backlog', 'error');
    }
  };

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before tracking active arrears, backlog clearances, and examination eligibility, please complete your Academic Profile Setup."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-brandAmber" />
              <span>Backlog Tracker</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
              Automated arrears detection, supplementary examination records, and clearance status.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border self-start sm:self-auto ${
              activeBacklogs === 0
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            Status: {activeBacklogs === 0 ? 'All Clear' : `${activeBacklogs} Active Arrear${activeBacklogs > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Active Arrears
            </span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                activeBacklogs === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {activeBacklogs}
            </span>
            <span className="text-[11px] text-text-light mt-1 block">
              {activeBacklogs === 0 ? 'All subjects cleared' : 'Supplementary pending'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Cleared Backlogs
            </span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
              {clearedBacklogs}
            </span>
            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 block">
              Passed on re-attempt
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Total Recorded
            </span>
            <span className="text-2xl font-extrabold text-text-h mt-1 block">
              {totalBacklogs}
            </span>
            <span className="text-[11px] text-text-light mt-1 block">
              Curriculum lifetime
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[11px] font-bold text-text-light uppercase tracking-wider block">
              Degree Eligibility
            </span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                activeBacklogs === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
              }`}
            >
              {activeBacklogs === 0 ? '100%' : 'Conditional'}
            </span>
            <span className="text-[11px] text-text-light mt-1 block">
              {activeBacklogs === 0 ? 'Placement & Graduation' : 'Clear pending backlogs'}
            </span>
          </div>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject code, name, or semester..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-bg border border-border text-text-h placeholder:text-text-light focus:outline-none focus:border-accent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-bg rounded-xl border border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-card text-text-h shadow-xs font-bold'
                    : 'text-text-light hover:text-text-h'
                }`}
              >
                All ({totalBacklogs})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'ACTIVE'
                    ? 'bg-card text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                    : 'text-text-light hover:text-text-h'
                }`}
              >
                Active ({activeBacklogs})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CLEARED')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'CLEARED'
                    ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-text-light hover:text-text-h'
                }`}
              >
                Cleared ({clearedBacklogs})
              </button>
            </div>
          </div>
        </div>

        {/* Backlog List Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          {filteredBacklogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-text-light font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4">Recorded Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action / Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBacklogs.map((item) => {
                    const isActive = item.status === 'Active';
                    return (
                      <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-text-h block">
                              {item.subjectCode}
                            </span>
                            <span className="text-text-light text-[11px] block truncate max-w-xs">
                              {item.subjectName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-text-h">
                          <div>
                            <span>{item.semesterLabel}</span>
                            <span className="text-[10px] text-text-light block">
                              {item.academicPeriod}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-text-h text-center">
                          {item.credits}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-bold font-mono text-[11px] bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              {item.originalGrade || item.grade || 'F'}
                            </span>
                            {!isActive && item.clearedGrade && (
                              <span className="text-[11px] text-text-light">
                                &rarr; <span className="font-bold text-emerald-500 font-mono">{item.clearedGrade}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Active Arrear</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Cleared</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isActive ? (
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/student/edit-result/semester-${item.semesterNumber}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
                              >
                                <span>Edit Result</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenClearModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Cleared</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs block">
                                Cleared: Grade {item.clearedGrade || 'Pass'} {typeof item.clearedPoints === 'number' ? `(${item.clearedPoints} pts)` : ''}
                              </span>
                              <span className="text-[10px] text-text-light block">
                                {item.clearedPeriod || 'Supplementary Examination'}
                                {item.clearedAt ? ` • ${new Date(item.clearedAt).toLocaleDateString()}` : ''}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-text-h">
                {activeTab === 'ACTIVE'
                  ? 'Zero Active Backlogs!'
                  : activeTab === 'CLEARED'
                  ? 'No Cleared Records'
                  : 'Clean Academic Record!'}
              </h3>
              <p className="text-xs text-text-light max-w-md mx-auto">
                {activeTab === 'ACTIVE'
                  ? 'You have successfully passed every enrolled subject in your saved semesters.'
                  : activeTab === 'CLEARED'
                  ? 'No backlogs have been marked as cleared yet.'
                  : 'No active or historical backlogs are recorded for your academic profile.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/student/results"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>View My Results</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Mark Cleared Supplementary Modal */}
        {clearingBacklog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-text-h">
                    Record Supplementary Clearance
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setClearingBacklog(null)}
                  className="text-text-light hover:text-text-h text-xs p-1 rounded-md hover:bg-bg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-bg rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-h text-sm">
                      {clearingBacklog.subjectCode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-500">
                      Failed Grade: {clearingBacklog.originalGrade || clearingBacklog.grade}
                    </span>
                  </div>
                  <span className="text-text-light text-xs block font-medium">
                    {clearingBacklog.subjectName}
                  </span>
                  <div className="text-[11px] text-text-light pt-1 flex items-center gap-3">
                    <span>{clearingBacklog.semesterLabel}</span>
                    <span>•</span>
                    <span>{clearingBacklog.credits} Credits</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Passing Grade Awarded
                  </label>
                  <select
                    value={clearedGrade}
                    onChange={(e) => setClearedGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-bg border border-border text-text-h font-semibold focus:outline-none focus:border-accent"
                  >
                    {passingGrades.map((g) => (
                      <option key={g.grade} value={g.grade}>
                        {g.grade} — {g.desc || 'Pass'} ({g.points} Points)
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-text-light mt-1 block">
                    Conforms to university grading regulation. The semester SGPA and CGPA will be automatically recalculated.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">
                    Examination Session / Period
                  </label>
                  <input
                    type="text"
                    value={examinationPeriod}
                    onChange={(e) => setExaminationPeriod(e.target.value)}
                    placeholder="e.g. Supplementary Examination (Nov 2026)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-bg border border-border text-text-h font-medium focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setClearingBacklog(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-light hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearSupplementary}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Confirm Clearance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AcademicProfileGate>
  );
}
