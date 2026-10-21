import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalService } from '../../services/goalService.js';
import { studentService } from '../../services/studentService.js';
import { resultService } from '../../services/resultService.js';
import { academicCatalogService } from '../../services/academicCatalogService.js';

const getInitialGoalData = () => {
  try {
    const goal = goalService.getGoal();
    const profile = studentService.getProfile() || {};
    const results = resultService.getAllResults() || [];
    const catalogConfig = academicCatalogService.getFullConfiguration(
      profile.universityId,
      profile.courseId,
      profile.regulationId
    );
    const details = goalService.calculateGoalDetails(profile, results, catalogConfig, goal?.targetCGPA);
    const metrics = goalService.calculateGoalMetrics(
      Number(details.currentCGPA) || 8.14,
      details.semestersCompleted || 4,
      details.totalSemesters || 6
    );

    return { goal, metrics, details };
  } catch {
    return { goal: null, metrics: null, details: null };
  }
};

const initialData = getInitialGoalData();

const initialState = {
  goal: initialData.goal,
  metrics: initialData.metrics,
  details: initialData.details,
  loading: false,
  error: null,
  saveSuccess: false,
};

export const fetchAcademicGoal = createAsyncThunk(
  'academicGoals/fetchAcademicGoal',
  async (_, { rejectWithValue }) => {
    try {
      const goal = goalService.getGoal();
      const profile = studentService.getProfile() || {};
      const results = resultService.getAllResults() || [];
      const catalogConfig = academicCatalogService.getFullConfiguration(
        profile.universityId,
        profile.courseId,
        profile.regulationId
      );
      const details = goalService.calculateGoalDetails(profile, results, catalogConfig, goal?.targetCGPA);
      const metrics = goalService.calculateGoalMetrics(
        Number(details.currentCGPA) || 8.14,
        details.semestersCompleted || 4,
        details.totalSemesters || 6
      );

      return { goal, metrics, details };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch academic goal');
    }
  }
);

export const saveAcademicGoal = createAsyncThunk(
  'academicGoals/saveAcademicGoal',
  async (newGoal, { rejectWithValue }) => {
    try {
      const updatedGoal = goalService.updateGoal(newGoal);
      const profile = studentService.getProfile() || {};
      const results = resultService.getAllResults() || [];
      const catalogConfig = academicCatalogService.getFullConfiguration(
        profile.universityId,
        profile.courseId,
        profile.regulationId
      );
      const details = goalService.calculateGoalDetails(profile, results, catalogConfig, updatedGoal?.targetCGPA);
      const metrics = goalService.calculateGoalMetrics(
        Number(details.currentCGPA) || 8.14,
        details.semestersCompleted || 4,
        details.totalSemesters || 6
      );

      return { goal: updatedGoal, metrics, details };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update academic goal');
    }
  }
);

export const academicGoalsSlice = createSlice({
  name: 'academicGoals',
  initialState,
  reducers: {
    setGoal: (state, action) => {
      state.goal = action.payload;
    },
    setMetrics: (state, action) => {
      state.metrics = action.payload;
    },
    setDetails: (state, action) => {
      state.details = action.payload;
    },
    resetSaveGoalSuccess: (state) => {
      state.saveSuccess = false;
    },
    clearGoalError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAcademicGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goal = action.payload.goal;
        state.metrics = action.payload.metrics;
        state.details = action.payload.details;
      })
      .addCase(fetchAcademicGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save
      .addCase(saveAcademicGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveAcademicGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.saveSuccess = true;
        state.goal = action.payload.goal;
        state.metrics = action.payload.metrics;
        state.details = action.payload.details;
      })
      .addCase(saveAcademicGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.saveSuccess = false;
      })
      // Synchronize whenever semester results or academic profile change
      .addMatcher(
        (action) =>
          [
            'results/addSemesterResult/fulfilled',
            'results/updateSemesterResult/fulfilled',
            'results/deleteSemesterResult/fulfilled',
            'academicProfile/updateProfile/fulfilled',
          ].includes(action.type),
        (state) => {
          const fresh = getInitialGoalData();
          state.metrics = fresh.metrics;
          state.details = fresh.details;
        }
      );
  },
});

export const { setGoal, setMetrics, setDetails, resetSaveGoalSuccess, clearGoalError } =
  academicGoalsSlice.actions;

// Selectors
export const selectAcademicGoal = (state) => state.academicGoals.goal;
export const selectGoalMetrics = (state) => state.academicGoals.metrics;
export const selectGoalDetails = (state) => state.academicGoals.details;
export const selectGoalLoading = (state) => state.academicGoals.loading;
export const selectGoalError = (state) => state.academicGoals.error;
export const selectGoalSaveSuccess = (state) => state.academicGoals.saveSuccess;

export default academicGoalsSlice.reducer;
