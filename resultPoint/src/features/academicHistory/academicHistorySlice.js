import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultService } from '../../services/resultService';
import { auditHistoryService } from '../../services/auditHistoryService';

const getInitialHistory = () => {
  try {
    const list = resultService.getAllResults();
    return [...list].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
  } catch {
    return [];
  }
};

const getInitialAuditEvents = () => {
  try {
    return auditHistoryService.getAllAuditEvents();
  } catch {
    return [];
  }
};

const initialState = {
  historyRecords: getInitialHistory(),
  auditEvents: getInitialAuditEvents(),
  selectedRecord: null,
  filterAction: 'ALL',
  filterSemester: 'ALL',
  searchQuery: '',
  sortOrder: 'LATEST_FIRST',
  loading: false,
  error: null,
};

export const fetchAcademicHistory = createAsyncThunk(
  'academicHistory/fetchAcademicHistory',
  async (_, { rejectWithValue }) => {
    try {
      const results = resultService.getAllResults();
      const sorted = [...results].sort(
        (a, b) => Number(a.semesterNumber) - Number(b.semesterNumber)
      );
      const audits = auditHistoryService.getAllAuditEvents();
      return { results: sorted, auditEvents: audits };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load academic history');
    }
  }
);

export const recordAuditEvent = createAsyncThunk(
  'academicHistory/recordAuditEvent',
  async (eventPayload, { rejectWithValue }) => {
    try {
      const created = auditHistoryService.recordEvent(eventPayload);
      return created;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to record audit event');
    }
  }
);

export const academicHistorySlice = createSlice({
  name: 'academicHistory',
  initialState,
  reducers: {
    setSelectedRecord: (state, action) => {
      state.selectedRecord = action.payload;
    },
    setFilterAction: (state, action) => {
      state.filterAction = action.payload;
    },
    setFilterSemester: (state, action) => {
      state.filterSemester = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    clearHistoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAcademicHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyRecords = action.payload.results;
        state.auditEvents = action.payload.auditEvents;
      })
      .addCase(fetchAcademicHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(recordAuditEvent.fulfilled, (state, action) => {
        state.auditEvents = [action.payload, ...state.auditEvents];
      })
      .addMatcher(
        (action) =>
          [
            'results/addSemesterResult/fulfilled',
            'results/updateSemesterResult/fulfilled',
            'results/deleteSemesterResult/fulfilled',
          ].includes(action.type),
        (state) => {
          state.historyRecords = getInitialHistory();
          state.auditEvents = getInitialAuditEvents();
        }
      );
  },
});

export const {
  setSelectedRecord,
  setFilterAction,
  setFilterSemester,
  setSearchQuery,
  setSortOrder,
  clearHistoryError,
} = academicHistorySlice.actions;

// Selectors
export const selectAcademicHistoryRecords = (state) => state.academicHistory.historyRecords;
export const selectAuditEvents = (state) => state.academicHistory.auditEvents;
export const selectSelectedHistoryRecord = (state) => state.academicHistory.selectedRecord;
export const selectHistoryFilterAction = (state) => state.academicHistory.filterAction;
export const selectHistoryFilterSemester = (state) => state.academicHistory.filterSemester;
export const selectHistorySearchQuery = (state) => state.academicHistory.searchQuery;
export const selectHistorySortOrder = (state) => state.academicHistory.sortOrder;
export const selectHistoryLoading = (state) => state.academicHistory.loading;
export const selectHistoryError = (state) => state.academicHistory.error;

export default academicHistorySlice.reducer;
