import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { activityHistoryService } from '../../services/activityHistoryService.js';

const EMPTY_ACTIVITIES = [];

const getInitialActivities = () => {
  try {
    return activityHistoryService.getAllActivities();
  } catch {
    return [];
  }
};

const initialList = getInitialActivities();

const initialState = {
  activities: initialList,
  selectedActivity: initialList.length > 0 ? initialList[0] : null,
  searchQuery: '',
  typeFilter: 'ALL', // 'ALL' | 'result' | 'calculation' | 'goal' | 'backlog'
  semesterFilter: 'ALL', // 'ALL' | 1 | 2 | 3 | 4 | 5 | 6
  dateFilter: 'ALL', // 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_SEMESTER'
  sortOrder: 'LATEST_FIRST', // 'LATEST_FIRST' | 'OLDEST_FIRST'
  currentPage: 1,
  itemsPerPage: 8,
  loading: false,
  error: null
};

export const fetchActivities = createAsyncThunk(
  'activityHistory/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const list = activityHistoryService.getAllActivities();
      return list;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load activities');
    }
  }
);

export const recordNewActivity = createAsyncThunk(
  'activityHistory/recordNewActivity',
  async (activityData, { rejectWithValue }) => {
    try {
      const created = activityHistoryService.recordActivity(activityData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to record activity');
    }
  }
);

export const deleteActivityItem = createAsyncThunk(
  'activityHistory/deleteActivityItem',
  async (activityId, { rejectWithValue }) => {
    try {
      const updated = activityHistoryService.deleteActivity(activityId);
      return { activityId, updatedList: updated };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete activity');
    }
  }
);

export const clearAllActivities = createAsyncThunk(
  'activityHistory/clearAllActivities',
  async (_, { rejectWithValue }) => {
    try {
      const empty = activityHistoryService.clearActivityHistory();
      return empty;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to clear activity history');
    }
  }
);

export const activityHistorySlice = createSlice({
  name: 'activityHistory',
  initialState,
  reducers: {
    setSelectedActivity: (state, action) => {
      state.selectedActivity = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setTypeFilter: (state, action) => {
      state.typeFilter = action.payload;
      state.currentPage = 1;
    },
    setSemesterFilter: (state, action) => {
      state.semesterFilter = action.payload;
      state.currentPage = 1;
    },
    setDateFilter: (state, action) => {
      state.dateFilter = action.payload;
      state.currentPage = 1;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = Number(action.payload) || 1;
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.typeFilter = 'ALL';
      state.semesterFilter = 'ALL';
      state.dateFilter = 'ALL';
      state.sortOrder = 'LATEST_FIRST';
      state.currentPage = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchActivities
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
        if (!state.selectedActivity && action.payload.length > 0) {
          state.selectedActivity = action.payload[0];
        } else if (state.selectedActivity) {
          // Re-sync selected activity if updated
          const updatedSelected = action.payload.find((a) => a.id === state.selectedActivity.id);
          state.selectedActivity = updatedSelected || (action.payload.length > 0 ? action.payload[0] : null);
        }
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // recordNewActivity
      .addCase(recordNewActivity.fulfilled, (state, action) => {
        state.activities = [action.payload, ...state.activities];
        state.selectedActivity = action.payload;
      })
      // deleteActivityItem
      .addCase(deleteActivityItem.fulfilled, (state, action) => {
        state.activities = action.payload.updatedList;
        if (state.selectedActivity?.id === action.payload.activityId) {
          state.selectedActivity = action.payload.updatedList.length > 0 ? action.payload.updatedList[0] : null;
        }
      })
      // clearAllActivities
      .addCase(clearAllActivities.fulfilled, (state) => {
        state.activities = [];
        state.selectedActivity = null;
      });
  }
});

export const {
  setSelectedActivity,
  setSearchQuery,
  setTypeFilter,
  setSemesterFilter,
  setDateFilter,
  setSortOrder,
  setCurrentPage,
  resetFilters
} = activityHistorySlice.actions;

// Selectors
export const selectActivities = (state) => state.activityHistory?.activities || EMPTY_ACTIVITIES;
export const selectSelectedActivity = (state) => state.activityHistory.selectedActivity;
export const selectSearchQuery = (state) => state.activityHistory.searchQuery;
export const selectTypeFilter = (state) => state.activityHistory.typeFilter;
export const selectSemesterFilter = (state) => state.activityHistory.semesterFilter;
export const selectDateFilter = (state) => state.activityHistory.dateFilter;
export const selectSortOrder = (state) => state.activityHistory.sortOrder;
export const selectCurrentPage = (state) => state.activityHistory.currentPage;
export const selectItemsPerPage = (state) => state.activityHistory.itemsPerPage;
export const selectActivityLoading = (state) => state.activityHistory.loading;
export const selectActivityError = (state) => state.activityHistory.error;

export const selectActivitySummary = createSelector(
  [selectActivities],
  (list) => ({
    totalActivities: list.length,
    calculatorUsage: list.filter((a) => a.type === 'calculation').length,
    resultUpdates: list.filter((a) => a.type === 'result').length,
    goalUpdates: list.filter((a) => a.type === 'goal').length,
    backlogsCleared: list.filter((a) => a.type === 'backlog').length
  })
);

export default activityHistorySlice.reducer;
