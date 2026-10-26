import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../../services/studentService.js';
import { resultService } from '../../services/resultService.js';
import { performanceService } from '../../services/performanceService.js';
import { academicCatalogService } from '../../services/academicCatalogService.js';
import { reportApi } from '../../services/api/reportApi.js';

const getInitialPerformance = () => {
  try {
    const profile = studentService.getProfile() || {};
    const results = resultService.getAllResults() || [];
    const catalogConfig = academicCatalogService.getFullConfiguration(
      profile.universityId,
      profile.courseId,
      profile.regulationId
    );

    const overview = performanceService.getOverview(profile, results, catalogConfig);
    const gradeTrends = performanceService.getSemesterTrends(results, 'all');
    const categories = performanceService.getSubjectCategoryPerformance(results);
    const distribution = performanceService.getGradeDistribution(results, catalogConfig?.gradeScale);
    const topSubjects = performanceService.getTopPerformingSubjects(results, 6);
    const improveSubjects = performanceService.getSubjectsToImprove(results, 6);
    const insights = performanceService.generateInsights(overview, categories, topSubjects, improveSubjects);
    const projections = performanceService.getProjections(overview, 8.5);

    return {
      overview,
      gradeTrends,
      categories,
      distribution,
      topSubjects,
      improveSubjects,
      insights,
      projections,
      analytics: overview,
    };
  } catch {
    return {
      overview: null,
      gradeTrends: [],
      categories: [],
      distribution: { distribution: [], totalSubjects: 0, totalPass: 0, passRate: 0 },
      topSubjects: [],
      improveSubjects: [],
      insights: [],
      projections: null,
      analytics: null,
    };
  }
};

const initialData = getInitialPerformance();

const initialState = {
  overview: initialData.overview,
  analytics: initialData.analytics,
  gradeTrends: initialData.gradeTrends,
  categories: initialData.categories,
  distribution: initialData.distribution,
  topSubjects: initialData.topSubjects,
  improveSubjects: initialData.improveSubjects,
  insights: initialData.insights,
  projections: initialData.projections,
  loading: false,
  error: null,
};

export const fetchPerformanceData = createAsyncThunk(
  'performance/fetchPerformanceData',
  async (_, { rejectWithValue }) => {
    try {
      const profile = studentService.getProfile() || {};
      const results = resultService.getAllResults() || [];
      const catalogConfig = academicCatalogService.getFullConfiguration(
        profile.universityId,
        profile.courseId,
        profile.regulationId
      );

      let overview = performanceService.getOverview(profile, results, catalogConfig);
      let gradeTrends = performanceService.getSemesterTrends(results, 'all');

      try {
        const backendReport = await reportApi.getPerformanceReport();
        if (backendReport) {
          if (overview) {
            overview = {
              ...overview,
              currentCGPA: backendReport.cumulativeCgpa !== null && backendReport.cumulativeCgpa !== undefined
                ? Number(backendReport.cumulativeCgpa)
                : overview.currentCGPA,
              earnedCredits: backendReport.totalCreditsEarned !== null && backendReport.totalCreditsEarned !== undefined
                ? Number(backendReport.totalCreditsEarned)
                : overview.earnedCredits,
              totalCredits: backendReport.totalCreditsAttempted !== null && backendReport.totalCreditsAttempted !== undefined
                ? Number(backendReport.totalCreditsAttempted)
                : overview.totalCredits,
              estimatedPercentage: backendReport.estimatedPercentage !== null && backendReport.estimatedPercentage !== undefined
                ? Number(backendReport.estimatedPercentage)
                : overview.estimatedPercentage,
              percentageVerificationStatus: backendReport.percentageVerificationStatus || overview.percentageVerificationStatus,
              totalPassedSubjects: backendReport.totalPassedSubjects ?? overview.totalPassedSubjects,
              totalFailedSubjects: backendReport.totalFailedSubjects ?? overview.totalFailedSubjects,
            };
          }

          if (Array.isArray(backendReport.semesterTrends) && backendReport.semesterTrends.length > 0) {
            gradeTrends = backendReport.semesterTrends.map((st) => ({
              semester: `Sem ${st.semesterNumber}`,
              semesterNumber: st.semesterNumber,
              sgpa: st.sgpa !== null ? Number(st.sgpa) : null,
              cgpa: st.cumulativeCgpa !== null ? Number(st.cumulativeCgpa) : null,
              creditsEarned: st.creditsEarned,
              creditsAttempted: st.creditsAttempted,
              passed: st.subjectsPassed,
              failed: st.subjectsFailed,
              status: st.resultStatus || 'Passed'
            }));
          }
        }
      } catch (apiErr) {
        console.warn('Backend performance report unavailable, using local calculation fallback:', apiErr.message);
      }

      const categories = performanceService.getSubjectCategoryPerformance(results);
      const distribution = performanceService.getGradeDistribution(results, catalogConfig?.gradeScale);
      const topSubjects = performanceService.getTopPerformingSubjects(results, 6);
      const improveSubjects = performanceService.getSubjectsToImprove(results, 6);
      const insights = performanceService.generateInsights(overview, categories, topSubjects, improveSubjects);
      const projections = performanceService.getProjections(overview, 8.5);

      return {
        overview,
        analytics: overview,
        gradeTrends,
        categories,
        distribution,
        topSubjects,
        improveSubjects,
        insights,
        projections,
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch performance data');
    }
  }
);

export const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    setAnalytics: (state, action) => {
      state.overview = action.payload;
      state.analytics = action.payload;
    },
    setInsights: (state, action) => {
      state.insights = action.payload;
    },
    clearPerformanceError: (state) => {
      state.error = null;
    },
    resetPerformanceState: (state) => {
      state.overview = null;
      state.analytics = null;
      state.gradeTrends = [];
      state.categories = [];
      state.distribution = { distribution: [], totalSubjects: 0, totalPass: 0, passRate: 0 };
      state.topSubjects = [];
      state.improveSubjects = [];
      state.insights = [];
      state.projections = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPerformanceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformanceData.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload.overview;
        state.analytics = action.payload.analytics;
        state.gradeTrends = action.payload.gradeTrends;
        state.categories = action.payload.categories;
        state.distribution = action.payload.distribution;
        state.topSubjects = action.payload.topSubjects;
        state.improveSubjects = action.payload.improveSubjects;
        state.insights = action.payload.insights;
        state.projections = action.payload.projections;
      })
      .addCase(fetchPerformanceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase('auth/logout', (state) => {
        state.overview = null;
        state.analytics = null;
        state.gradeTrends = [];
        state.categories = [];
        state.distribution = { distribution: [], totalSubjects: 0, totalPass: 0, passRate: 0 };
        state.topSubjects = [];
        state.improveSubjects = [];
        state.insights = [];
        state.projections = null;
        state.loading = false;
        state.error = null;
      })
      .addMatcher(
        (action) =>
          [
            'results/addSemesterResult/fulfilled',
            'results/updateSemesterResult/fulfilled',
            'results/deleteSemesterResult/fulfilled',
            'academicProfile/updateProfile/fulfilled',
          ].includes(action.type),
        (state) => {
          const fresh = getInitialPerformance();
          state.overview = fresh.overview;
          state.analytics = fresh.analytics;
          state.gradeTrends = fresh.gradeTrends;
          state.categories = fresh.categories;
          state.distribution = fresh.distribution;
          state.topSubjects = fresh.topSubjects;
          state.improveSubjects = fresh.improveSubjects;
          state.insights = fresh.insights;
          state.projections = fresh.projections;
        }
      );
  },
});

export const { setAnalytics, setInsights, clearPerformanceError } =
  performanceSlice.actions;

// Selectors
export const selectPerformanceOverview = (state) => state.performance.overview;
export const selectPerformanceAnalytics = (state) => state.performance.analytics;
export const selectGradeTrends = (state) => state.performance.gradeTrends;
export const selectSubjectCategories = (state) => state.performance.categories;
export const selectGradeDistribution = (state) => state.performance.distribution;
export const selectTopSubjects = (state) => state.performance.topSubjects;
export const selectImproveSubjects = (state) => state.performance.improveSubjects;
export const selectPerformanceInsights = (state) => state.performance.insights;
export const selectCGPAProjections = (state) => state.performance.projections;
export const selectPerformanceLoading = (state) => state.performance.loading;
export const selectPerformanceError = (state) => state.performance.error;

export default performanceSlice.reducer;
