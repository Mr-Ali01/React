import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PlusCircle,
  BarChart2,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  selectPerformanceOverview,
  selectGradeTrends,
  selectSubjectCategories,
  selectGradeDistribution,
  selectTopSubjects,
  selectImproveSubjects,
  selectPerformanceInsights,
  selectCGPAProjections,
  fetchPerformanceData
} from '../../features/performance/performanceSlice';
import { selectResults, fetchResults } from '../../features/results/resultsSlice';
import { selectAcademicProfile, fetchAcademicProfile } from '../../features/academicProfile/academicProfileSlice';
import { studentService } from '../../services/studentService';
import { resultService } from '../../services/resultService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { performanceService } from '../../services/performanceService';

import AcademicProfileGate from '../../components/student/AcademicProfileGate';
import PerformanceOverviewCards from '../../components/student/analytics/PerformanceOverviewCards';
import PerformanceTrendChart from '../../components/student/analytics/PerformanceTrendChart';
import SubjectPerformanceBarChart from '../../components/student/analytics/SubjectPerformanceBarChart';
import GradeDistributionDonut from '../../components/student/analytics/GradeDistributionDonut';
import TopPerformingSubjects from '../../components/student/analytics/TopPerformingSubjects';
import SubjectsToImprove from '../../components/student/analytics/SubjectsToImprove';
import PerformanceInsightsCard from '../../components/student/analytics/PerformanceInsightsCard';
import CGPAProjectionSimulator from '../../components/student/analytics/CGPAProjectionSimulator';

export default function PerformanceAnalytics() {
  const dispatch = useAppDispatch();

  // Redux Selectors
  const reduxProfile = useAppSelector(selectAcademicProfile);
  const reduxResults = useAppSelector(selectResults);
  const reduxOverview = useAppSelector(selectPerformanceOverview);
  const reduxTrends = useAppSelector(selectGradeTrends);
  const reduxCategories = useAppSelector(selectSubjectCategories);
  const reduxDistribution = useAppSelector(selectGradeDistribution);
  const reduxTopSubjects = useAppSelector(selectTopSubjects);
  const reduxImproveSubjects = useAppSelector(selectImproveSubjects);
  const reduxInsights = useAppSelector(selectPerformanceInsights);
  const reduxProjections = useAppSelector(selectCGPAProjections);

  // Local interactive filter state
  const [rangeFilter, setRangeFilter] = useState('all'); // 'all' | '4' | '2'
  const [metricMode, setMetricMode] = useState('both'); // 'both' | 'sgpa' | 'cgpa'
  const [customTargetCGPA, setCustomTargetCGPA] = useState(8.50);

  // Fetch performance and results on mount
  useEffect(() => {
    dispatch(fetchResults());
    dispatch(fetchAcademicProfile());
    dispatch(fetchPerformanceData());
  }, [dispatch]);

  // Merge profile and results safely with services fallback
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

  // Derived real-time dynamic calculations based strictly on authenticated student's data
  const overview = useMemo(() => {
    if (reduxOverview) return reduxOverview;
    return performanceService.getOverview(profile, results, catalogConfig);
  }, [reduxOverview, profile, results, catalogConfig]);

  const trends = useMemo(() => {
    if (reduxTrends && reduxTrends.length > 0) return reduxTrends;
    return performanceService.getSemesterTrends(results, rangeFilter);
  }, [reduxTrends, results, rangeFilter]);

  const categories = useMemo(() => {
    if (reduxCategories && reduxCategories.length > 0) return reduxCategories;
    return performanceService.getSubjectCategoryPerformance(results);
  }, [reduxCategories, results]);

  const distribution = useMemo(() => {
    if (reduxDistribution && reduxDistribution.totalSubjects > 0) return reduxDistribution;
    return performanceService.getGradeDistribution(results, catalogConfig?.gradeScale);
  }, [reduxDistribution, results, catalogConfig]);

  const topSubjects = useMemo(() => {
    if (reduxTopSubjects && reduxTopSubjects.length > 0) return reduxTopSubjects;
    return performanceService.getTopPerformingSubjects(results, 6);
  }, [reduxTopSubjects, results]);

  const improveSubjects = useMemo(() => {
    if (reduxImproveSubjects && reduxImproveSubjects.length > 0) return reduxImproveSubjects;
    return performanceService.getSubjectsToImprove(results, 6);
  }, [reduxImproveSubjects, results]);

  const insights = useMemo(() => {
    if (reduxInsights && reduxInsights.length > 0) return reduxInsights;
    return performanceService.generateInsights(overview, categories, topSubjects, improveSubjects);
  }, [reduxInsights, overview, categories, topSubjects, improveSubjects]);

  const projections = useMemo(() => {
    return performanceService.getProjections(overview, customTargetCGPA);
  }, [overview, customTargetCGPA]);

  const hasResults = results && results.length > 0;

  return (
    <AcademicProfileGate
      title="Academic Profile Setup Required"
      description="Before accessing deep performance analytics, semester velocity charts, and CGPA trajectory models, please configure your University, Degree Course, and Academic Regulation."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Top Header */}
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shadow-accent/20 shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Performance Analytics</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
              Analyze your semester velocity, subject masteries, grade distributions, and projected trajectories with university-specific rules.
            </p>
          </div>

          {/* Quick Header Metric Summary */}
          {hasResults && (
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-2xl bg-card border border-border text-right">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block">
                  Cumulative CGPA
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-lg font-extrabold text-text-h font-mono">
                    {Number(overview.currentCGPA).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ({overview.standingBadge})
                  </span>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-card border border-border text-right">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block">
                  Target CGPA
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-lg font-extrabold text-accent font-mono">
                    {customTargetCGPA.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-text-light">Goal</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State when student has no saved results */}
        {!hasResults ? (
          <div className="rounded-2xl bg-card border border-border p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-subtle">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-text-h">
                No Semester Results Recorded Yet
              </h3>
              <p className="text-xs text-text-light leading-relaxed">
                Performance Analytics, semester trends, and What-If projections will automatically populate once you add your first semester result scorecard.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/student/add-result"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add First Semester Result</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Performance Overview Top Cards */}
            <PerformanceOverviewCards overview={overview} />

            {/* 2. Performance Insights (Automated Observation Cards) */}
            <PerformanceInsightsCard insights={insights} />

            {/* 3. Semester-wise Performance Trend Interactive Line Chart */}
            <PerformanceTrendChart
              trends={trends}
              projectedTargets={projections.semesterTargets}
              metricMode={metricMode}
              rangeFilter={rangeFilter}
              onMetricModeChange={setMetricMode}
              onRangeFilterChange={setRangeFilter}
            />

            {/* 4. Subject Analytics: Category Bar Chart & Grade Distribution Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <SubjectPerformanceBarChart categories={categories} />
              </div>
              <div className="lg:col-span-5">
                <GradeDistributionDonut distributionData={distribution} />
              </div>
            </div>

            {/* 5. Subject Ranking & Actionable Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6">
                <TopPerformingSubjects subjects={topSubjects} />
              </div>
              <div className="lg:col-span-6">
                <SubjectsToImprove subjects={improveSubjects} />
              </div>
            </div>

            {/* 6. CGPA Projection Simulator & What-If Matrix */}
            <CGPAProjectionSimulator
              overview={overview}
              projections={projections}
              targetCGPA={customTargetCGPA}
              onTargetChange={setCustomTargetCGPA}
            />
          </div>
        )}
      </div>
    </AcademicProfileGate>
  );
}
