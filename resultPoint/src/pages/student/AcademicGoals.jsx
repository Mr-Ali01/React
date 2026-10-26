import { useState, useEffect, useMemo } from 'react';
import { Target, PlusCircle, Download } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectAcademicGoal,
  fetchAcademicGoal,
  saveAcademicGoal
} from '../../features/academicGoals/academicGoalsSlice';
import { selectResults, fetchResults } from '../../features/results/resultsSlice';
import {
  selectAcademicProfile,
  selectIsProfileComplete,
  fetchAcademicProfile
} from '../../features/academicProfile/academicProfileSlice';
import { studentService } from '../../services/studentService';
import { resultService } from '../../services/resultService';
import { goalService } from '../../services/goalService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { exportApi, triggerBlobDownload } from '../../services/api/exportApi';
import { useToast } from '../../context/ToastContext';

import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import GoalOverviewCards from '../../components/student/goals/GoalOverviewCards';
import TargetSetterAndFeasibility from '../../components/student/goals/TargetSetterAndFeasibility';
import ProjectedTrendAndTargets from '../../components/student/goals/ProjectedTrendAndTargets';
import SubjectPriorityAndProgress from '../../components/student/goals/SubjectPriorityAndProgress';

export default function AcademicGoals() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const reduxProfile = useAppSelector(selectAcademicProfile);
  const reduxResults = useAppSelector(selectResults);
  const reduxGoal = useAppSelector(selectAcademicGoal);

  const isProfileComplete = Boolean(
    useAppSelector(selectIsProfileComplete) || studentService.isProfileComplete()
  );

  // Initialize and synchronize
  useEffect(() => {
    dispatch(fetchAcademicProfile());
    if (isProfileComplete) {
      dispatch(fetchResults());
      dispatch(fetchAcademicGoal());
    }
  }, [dispatch, isProfileComplete]);

  const profile = useMemo(() => ({
    ...studentService.getProfile(),
    ...(reduxProfile || {})
  }), [reduxProfile]);

  const results = useMemo(() => {
    return reduxResults && reduxResults.length > 0 ? reduxResults : resultService.getAllResults();
  }, [reduxResults]);

  const catalogConfig = useMemo(() => {
    return academicCatalogService.getFullConfiguration(
      profile.universityId,
      profile.courseId,
      profile.regulationId
    );
  }, [profile.universityId, profile.courseId, profile.regulationId]);

  // Target CGPA interactive state
  const [userSelectedTarget, setUserSelectedTarget] = useState(null);
  const currentTarget = userSelectedTarget ?? reduxGoal?.targetCGPA ?? 8.50;
  const [planScope, setPlanScope] = useState('remaining'); // 'remaining' | 'all' | 'next'

  // Recalculate dynamic goal details whenever results or currentTarget change
  const details = useMemo(() => {
    return goalService.calculateGoalDetails(profile, results, catalogConfig, currentTarget);
  }, [profile, results, catalogConfig, currentTarget]);

  // Handle saving target CGPA
  const handleSaveGoal = async (newTarget) => {
    const val = Number(parseFloat(newTarget).toFixed(2));
    setUserSelectedTarget(val);
    try {
      await dispatch(saveAcademicGoal({ targetCGPA: val })).unwrap();
      showToast(`Target Degree CGPA updated to ${val.toFixed(2)}!`);
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Failed to save goal', 'error');
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  // Handle exporting goals PDF report
  const handleExportGoalsReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showToast('Downloading academic goals & progress report...');
    try {
      const blob = await exportApi.downloadGoalsReportPdf();
      triggerBlobDownload(blob, 'academic-goals-progress.pdf');
      showToast('Goals and progress report PDF downloaded successfully!');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to download goals report PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const hasResults = results && results.length > 0;

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before setting graduation targets, modeling semester milestones, and analyzing credit weight impacts, please complete your Academic Profile Setup."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Top Header matching reference image */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 uppercase tracking-wider">
                {catalogConfig?.course?.shortName || profile.course || 'Degree Program'} • {catalogConfig?.regulation?.code || profile.regulation || 'CBCS'}
              </span>
              <span className="text-xs text-text-light">
                {catalogConfig?.university?.name || profile.university}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-pink-600 text-white flex items-center justify-center shadow-accent/20 shadow-sm">
                <Target className="w-4 h-4" />
              </div>
              <span>Academic Goals</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
              Plan, track, and achieve your target CGPA with personalized guidance.
            </p>
          </div>

          {/* Right Header Controls matching reference design */}
          {hasResults && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Degree Dropdown */}
              <div className="px-3 py-1.5 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  Target Degree CGPA
                </span>
                <select
                  value={currentTarget}
                  onChange={(e) => handleSaveGoal(Number(e.target.value))}
                  className="calc-input bg-transparent border-0 p-0 text-xs font-bold text-accent font-mono cursor-pointer focus:ring-0"
                >
                  <option value={9.50}>9.50 (Outstanding)</option>
                  <option value={9.00}>9.00 (High Distinction)</option>
                  <option value={8.50}>8.50 (Distinction)</option>
                  <option value={8.00}>8.00 (First Class)</option>
                  <option value={7.50}>7.50 (First Division)</option>
                  <option value={7.00}>7.00 (Second Class)</option>
                </select>
              </div>

              {/* View Plan For Dropdown */}
              <div className="px-3 py-1.5 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  View Plan For
                </span>
                <select
                  value={planScope}
                  onChange={(e) => setPlanScope(e.target.value)}
                  className="calc-input bg-transparent border-0 p-0 text-xs font-bold text-text-h cursor-pointer focus:ring-0"
                >
                  <option value="remaining">Remaining Semesters</option>
                  <option value="all">All Semesters</option>
                  <option value="next">Next Semester Only</option>
                </select>
              </div>

              {/* Export Goals PDF Button */}
              <button
                type="button"
                onClick={handleExportGoalsReport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-text-h bg-card border border-border hover:bg-bg-sec shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download Goals and Trajectory PDF Report"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State when student has no saved results */}
        {!hasResults ? (
          <div className="rounded-2xl bg-card border border-border p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-text-h">
                No Semester Results Recorded Yet
              </h3>
              <p className="text-xs text-text-light leading-relaxed">
                Academic goal forecasting, semester targets, and What-If projections will automatically calibrate once your first semester results are recorded.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/student/add-result"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add First Semester Result</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. Goal Overview Cards (5 across) */}
            <GoalOverviewCards details={details} />

            {/* 2. Target Setter Slider, Goal Feasibility & What-If Analysis */}
            <TargetSetterAndFeasibility
              details={details}
              targetCGPA={currentTarget}
              onTargetChange={(val) => setUserSelectedTarget(val)}
              onSaveGoal={handleSaveGoal}
            />

            {/* 3. Projected CGPA Trend Line Chart & Recommended Semester Targets + Tip */}
            <ProjectedTrendAndTargets
              details={details}
              targetCGPA={currentTarget}
            />

            {/* 4. Subject-Wise Priority, Credits Impact Analysis & Your Goal Progress */}
            <SubjectPriorityAndProgress
              details={details}
            />
          </div>
        )}
      </div>
    </AcademicProfileGate>
  );
}
