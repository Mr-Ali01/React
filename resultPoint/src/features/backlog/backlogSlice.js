import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultService } from '../../services/resultService';
import { backlogService } from '../../services/backlogService';

const getInitialBacklogState = () => {
  try {
    const results = resultService.getAllResults();
    return backlogService.scanBacklogs(results);
  } catch {
    return {
      backlogs: [],
      totalBacklogs: 0,
      activeBacklogs: 0,
      clearedBacklogs: 0,
      clearanceRate: 100,
      clearanceStatus: 'All Clear',
    };
  }
};

const initialData = getInitialBacklogState();

const initialState = {
  backlogs: initialData.backlogs,
  totalBacklogs: initialData.totalBacklogs,
  pendingBacklogs: initialData.activeBacklogs,
  activeBacklogs: initialData.activeBacklogs,
  clearedBacklogs: initialData.clearedBacklogs,
  clearanceRate: initialData.clearanceRate,
  clearanceStatus: initialData.clearanceStatus,
  selectedBacklog: null,
  loading: false,
  error: null,
};

export const fetchBacklogs = createAsyncThunk(
  'backlog/fetchBacklogs',
  async (_, { rejectWithValue }) => {
    try {
      const results = resultService.getAllResults();
      return backlogService.scanBacklogs(results);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to scan backlog subjects');
    }
  }
);

export const markBacklogCleared = createAsyncThunk(
  'backlog/markBacklogCleared',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const {
        semesterId,
        semesterNumber,
        subjectCode,
        clearedGrade,
        newGrade,
        clearedPoints,
        newPoints,
        clearedPeriod
      } = payload;

      const finalGrade = clearedGrade || newGrade || 'C';
      const finalPoints = clearedPoints !== undefined ? clearedPoints : newPoints;

      const res = backlogService.clearBacklog({
        semesterId,
        semesterNumber,
        subjectCode,
        clearedGrade: finalGrade,
        clearedPoints: finalPoints,
        clearedPeriod
      });

      // Synchronize results state in Redux
      try {
        dispatch({ type: 'results/setResultsList', payload: resultService.getAllResults() });
      } catch (e) {
        console.warn('Sync results state warning:', e);
      }

      return res;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to clear backlog');
    }
  }
);

export const backlogSlice = createSlice({
  name: 'backlog',
  initialState,
  reducers: {
    setSelectedBacklog: (state, action) => {
      state.selectedBacklog = action.payload;
    },
    clearBacklogError: (state) => {
      state.error = null;
    },
    resetBacklogsState: (state) => {
      state.backlogs = [];
      state.totalBacklogs = 0;
      state.activeBacklogs = 0;
      state.pendingBacklogs = 0;
      state.clearedBacklogs = 0;
      state.clearanceRate = 100;
      state.clearanceStatus = 'All Clear';
      state.selectedBacklog = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBacklogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBacklogs.fulfilled, (state, action) => {
        state.loading = false;
        state.backlogs = action.payload.backlogs;
        state.totalBacklogs = action.payload.totalBacklogs;
        state.activeBacklogs = action.payload.activeBacklogs;
        state.pendingBacklogs = action.payload.activeBacklogs;
        state.clearedBacklogs = action.payload.clearedBacklogs;
        state.clearanceRate = action.payload.clearanceRate;
        state.clearanceStatus = action.payload.clearanceStatus;
      })
      .addCase(fetchBacklogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear
      .addCase(markBacklogCleared.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markBacklogCleared.fulfilled, (state, action) => {
        state.loading = false;
        state.backlogs = action.payload.backlogs;
        state.totalBacklogs = action.payload.totalBacklogs;
        state.activeBacklogs = action.payload.activeBacklogs;
        state.pendingBacklogs = action.payload.activeBacklogs;
        state.clearedBacklogs = action.payload.clearedBacklogs;
        state.clearanceRate = action.payload.clearanceRate;
        state.clearanceStatus = action.payload.clearanceStatus;
      })
      .addCase(markBacklogCleared.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addMatcher(
        (action) =>
          [
            'results/addSemesterResult/fulfilled',
            'results/updateSemesterResult/fulfilled',
            'results/deleteSemesterResult/fulfilled',
          ].includes(action.type),
        (state) => {
          const fresh = getInitialBacklogState();
          state.backlogs = fresh.backlogs;
          state.totalBacklogs = fresh.totalBacklogs;
          state.activeBacklogs = fresh.activeBacklogs;
          state.pendingBacklogs = fresh.activeBacklogs;
          state.clearedBacklogs = fresh.clearedBacklogs;
          state.clearanceRate = fresh.clearanceRate;
          state.clearanceStatus = fresh.clearanceStatus;
        }
      );
  },
});

export const { setSelectedBacklog, clearBacklogError, resetBacklogsState } = backlogSlice.actions;

// Selectors
export const selectBacklogs = (state) => state.backlog.backlogs;
export const selectTotalBacklogs = (state) => state.backlog.totalBacklogs;
export const selectPendingBacklogs = (state) => state.backlog.pendingBacklogs;
export const selectActiveBacklogs = (state) => state.backlog.activeBacklogs;
export const selectClearedBacklogs = (state) => state.backlog.clearedBacklogs;
export const selectClearanceRate = (state) => state.backlog.clearanceRate;
export const selectClearanceStatus = (state) => state.backlog.clearanceStatus;
export const selectSelectedBacklog = (state) => state.backlog.selectedBacklog;
export const selectBacklogLoading = (state) => state.backlog.loading;
export const selectBacklogError = (state) => state.backlog.error;

export default backlogSlice.reducer;
