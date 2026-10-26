import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultService } from '../../services/resultService.js';
import { backlogService } from '../../services/backlogService.js';
import { backlogApi } from '../../services/api/backlogApi.js';
import { fetchResults } from '../results/resultsSlice.js';

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
      try {
        const backendBacklogs = await backlogApi.getBacklogs();
        if (Array.isArray(backendBacklogs)) {
          const totalBacklogs = backendBacklogs.length;
          const activeBacklogs = backendBacklogs.filter((b) => b.status === 'Active').length;
          const clearedBacklogs = backendBacklogs.filter((b) => b.status === 'Cleared').length;
          const clearanceRate = totalBacklogs > 0 ? Math.round((clearedBacklogs / totalBacklogs) * 100) : 100;
          const clearanceStatus = activeBacklogs === 0 ? 'All Clear' : `${activeBacklogs} Active`;

          backlogService.setBacklogs(backendBacklogs);
          return {
            backlogs: backendBacklogs,
            totalBacklogs,
            activeBacklogs,
            clearedBacklogs,
            clearanceRate,
            clearanceStatus,
          };
        }
      } catch (apiErr) {
        console.warn('Backend backlog fetch failed, using local scan fallback:', apiErr.message);
      }
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
        backlogId,
        semesterId,
        semesterNumber,
        subjectCode,
        clearedGrade,
        newGrade,
        clearedPoints,
        newPoints,
        clearedPeriod
      } = payload;

      const finalGrade = (clearedGrade || newGrade || 'C').toUpperCase();
      const period = clearedPeriod || 'Supplementary Examination';

      let clearedDto = null;
      if (backlogId) {
        try {
          clearedDto = await backlogApi.clearBacklog({
            backlogId,
            clearedInPeriod: period,
            clearedGrade: finalGrade
          });
        } catch (apiErr) {
          if (apiErr?.status === 400 || apiErr?.status === 404 || apiErr?.status === 401) {
            return rejectWithValue(apiErr.message || 'Validation error while clearing backlog');
          }
          console.warn('API backlog clearance failed, using local fallback:', apiErr.message);
        }
      }

      if (clearedDto) {
        backlogService.syncBacklogAuthoritative(clearedDto);
        const fresh = await dispatch(fetchBacklogs()).unwrap();
        try {
          dispatch(fetchResults());
        } catch (e) {
          console.warn('Sync results state warning:', e);
        }
        return fresh;
      }

      // Local fallback
      const finalPoints = clearedPoints !== undefined ? clearedPoints : newPoints;
      const res = backlogService.clearBacklog({
        semesterId,
        semesterNumber,
        subjectCode,
        clearedGrade: finalGrade,
        clearedPoints: finalPoints,
        clearedPeriod: period
      });

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
      state.loading = false;
      state.error = null;
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
        if (action.payload) {
          state.backlogs = action.payload.backlogs || state.backlogs;
          state.totalBacklogs = action.payload.totalBacklogs ?? state.totalBacklogs;
          state.activeBacklogs = action.payload.activeBacklogs ?? state.activeBacklogs;
          state.pendingBacklogs = action.payload.activeBacklogs ?? state.pendingBacklogs;
          state.clearedBacklogs = action.payload.clearedBacklogs ?? state.clearedBacklogs;
          state.clearanceRate = action.payload.clearanceRate ?? state.clearanceRate;
          state.clearanceStatus = action.payload.clearanceStatus ?? state.clearanceStatus;
        }
      })
      .addCase(markBacklogCleared.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // auth/logout
      .addCase('auth/logout', (state) => {
        state.backlogs = [];
        state.totalBacklogs = 0;
        state.activeBacklogs = 0;
        state.pendingBacklogs = 0;
        state.clearedBacklogs = 0;
        state.clearanceRate = 100;
        state.clearanceStatus = 'All Clear';
        state.selectedBacklog = null;
        state.loading = false;
        state.error = null;
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
