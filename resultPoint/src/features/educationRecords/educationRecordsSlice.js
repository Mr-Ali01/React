import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { educationRecordService } from '../../services/educationRecordService.js';
import { educationRecordApi } from '../../services/api/educationRecordApi.js';

const EMPTY_RECORDS = [];

const getInitialRecords = () => {
  try {
    return educationRecordService.getAll();
  } catch {
    return [];
  }
};

const getInitialActiveId = () => {
  try {
    return educationRecordService.getActiveEducationId();
  } catch {
    return null;
  }
};

const initialState = {
  records: getInitialRecords(),
  activeEducationId: getInitialActiveId(),
  selectedRecord: null,
  activeFilterTab: 'ALL', // 'ALL' | 'SCHOOL' | 'UNDERGRADUATE' | 'POSTGRADUATE'
  searchQuery: '',
  statusFilter: 'ALL', // 'ALL' | 'COMPLETED' | 'IN_PROGRESS'
  loading: false,
  error: null,
  operationSuccess: false
};

export const fetchEducationRecords = createAsyncThunk(
  'educationRecords/fetchEducationRecords',
  async (_, { rejectWithValue }) => {
    try {
      try {
        const backendRecords = await educationRecordApi.getEducationRecords();
        if (Array.isArray(backendRecords)) {
          educationRecordService.saveAll(backendRecords);
          const activeId = educationRecordService.getActiveEducationId();
          return { records: backendRecords, activeId };
        }
      } catch (apiErr) {
        console.warn('Backend education records fetch failed, using local service fallback:', apiErr.message);
      }
      const records = educationRecordService.getAll();
      const activeId = educationRecordService.getActiveEducationId();
      return { records, activeId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch education records');
    }
  }
);

export const addEducationRecord = createAsyncThunk(
  'educationRecords/addEducationRecord',
  async (recordData, { rejectWithValue }) => {
    try {
      let created = null;
      try {
        created = await educationRecordApi.createEducationRecord(recordData);
      } catch (apiErr) {
        if (apiErr?.status === 400 || apiErr?.status === 401 || apiErr?.status === 404) {
          return rejectWithValue(apiErr.message || 'Validation error while saving education record');
        }
        console.warn('API create education record failed, using local service fallback:', apiErr.message);
      }

      if (created) {
        educationRecordService.add(created);
        const activeId = educationRecordService.getActiveEducationId();
        return { created, activeId };
      }

      created = educationRecordService.add(recordData);
      const activeId = educationRecordService.getActiveEducationId();
      return { created, activeId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to add education record');
    }
  }
);

export const updateEducationRecord = createAsyncThunk(
  'educationRecords/updateEducationRecord',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      // Backend contract note: Backend currently exposes GET, POST, DELETE. No PUT endpoint exists.
      const updated = educationRecordService.update(id, updates);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update education record');
    }
  }
);

export const deleteEducationRecord = createAsyncThunk(
  'educationRecords/deleteEducationRecord',
  async (id, { rejectWithValue }) => {
    try {
      try {
        await educationRecordApi.deleteEducationRecord(id);
      } catch (apiErr) {
        console.warn('API delete education record failed, using local service fallback:', apiErr.message);
      }
      const success = educationRecordService.delete(id);
      const activeId = educationRecordService.getActiveEducationId();
      return { id, success, activeId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete education record');
    }
  }
);

export const setActiveEducation = createAsyncThunk(
  'educationRecords/setActiveEducation',
  async (id, { rejectWithValue }) => {
    try {
      const active = educationRecordService.setActiveEducationId(id);
      return { id, active };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to set active education');
    }
  }
);

export const upgradeRecordEntryMode = createAsyncThunk(
  'educationRecords/upgradeRecordEntryMode',
  async ({ id, newMode, newModeData }, { rejectWithValue }) => {
    try {
      const updated = educationRecordService.upgradeEntryMode(id, newMode, newModeData);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to upgrade education entry mode');
    }
  }
);

export const educationRecordsSlice = createSlice({
  name: 'educationRecords',
  initialState,
  reducers: {
    setActiveFilterTab: (state, action) => {
      state.activeFilterTab = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSelectedRecord: (state, action) => {
      state.selectedRecord = action.payload;
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    resetOperationSuccess: (state) => {
      state.operationSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchEducationRecords
      .addCase(fetchEducationRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEducationRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.activeEducationId = action.payload.activeId;
      })
      .addCase(fetchEducationRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addEducationRecord
      .addCase(addEducationRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operationSuccess = false;
      })
      .addCase(addEducationRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift(action.payload.created);
        state.activeEducationId = action.payload.activeId;
        state.operationSuccess = true;
      })
      .addCase(addEducationRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateEducationRecord
      .addCase(updateEducationRecord.fulfilled, (state, action) => {
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
        if (state.selectedRecord?.id === action.payload.id) {
          state.selectedRecord = action.payload;
        }
        state.operationSuccess = true;
      })

      // deleteEducationRecord
      .addCase(deleteEducationRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((r) => r.id !== action.payload.id);
        state.activeEducationId = action.payload.activeId;
        if (state.selectedRecord?.id === action.payload.id) {
          state.selectedRecord = null;
        }
        state.operationSuccess = true;
      })

      // setActiveEducation
      .addCase(setActiveEducation.fulfilled, (state, action) => {
        state.activeEducationId = action.payload.id;
        state.records = state.records.map((r) => ({
          ...r,
          isCurrentEducation: r.id === action.payload.id
        }));
      })

      // upgradeRecordEntryMode
      .addCase(upgradeRecordEntryMode.fulfilled, (state, action) => {
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
        if (state.selectedRecord?.id === action.payload.id) {
          state.selectedRecord = action.payload;
        }
      })
      // auth/logout
      .addCase('auth/logout', (state) => {
        state.records = [];
        state.activeEducationId = null;
        state.selectedRecord = null;
        state.loading = false;
        state.error = null;
        state.operationSuccess = false;
      });
  }
});

export const {
  setActiveFilterTab,
  setSearchQuery,
  setStatusFilter,
  setSelectedRecord,
  clearSelectedRecord,
  resetOperationSuccess
} = educationRecordsSlice.actions;

// Selectors
export const selectAllEducationRecords = (state) => state.educationRecords?.records || EMPTY_RECORDS;
export const selectActiveEducationId = (state) => state.educationRecords?.activeEducationId || null;
export const selectSelectedRecord = (state) => state.educationRecords?.selectedRecord || null;
export const selectActiveFilterTab = (state) => state.educationRecords?.activeFilterTab || 'ALL';
export const selectSearchQuery = (state) => state.educationRecords?.searchQuery || '';
export const selectStatusFilter = (state) => state.educationRecords?.statusFilter || 'ALL';
export const selectEducationLoading = (state) => state.educationRecords?.loading || false;

export const selectActiveEducationRecord = createSelector(
  [selectAllEducationRecords, selectActiveEducationId],
  (records, activeId) => records.find((r) => r.id === activeId) || null
);

export const selectEducationStats = createSelector(
  [selectAllEducationRecords],
  (records) => ({
    allCount: records.length,
    schoolCount: records.filter((r) => r.categoryGroup === 'School' || r.category === 'School Education').length,
    ugCount: records.filter((r) => r.categoryGroup === 'Undergraduate' || r.category === 'Undergraduate').length,
    pgCount: records.filter((r) => r.categoryGroup === 'Postgraduate' || r.category === 'Postgraduate').length
  })
);

export const selectFilteredEducationRecords = createSelector(
  [
    selectAllEducationRecords,
    selectActiveFilterTab,
    selectSearchQuery,
    selectStatusFilter
  ],
  (records, tab, rawQuery, status) => {
    const query = (rawQuery || '').toLowerCase().trim();

    return records.filter((rec) => {
      // 1. Tab filter
      if (tab === 'SCHOOL') {
        if (rec.categoryGroup !== 'School' && rec.category !== 'School Education') return false;
      } else if (tab === 'UNDERGRADUATE') {
        if (rec.categoryGroup !== 'Undergraduate' && rec.category !== 'Undergraduate') return false;
      } else if (tab === 'POSTGRADUATE') {
        if (rec.categoryGroup !== 'Postgraduate' && rec.category !== 'Postgraduate') return false;
      }

      // 2. Status filter
      if (status === 'COMPLETED' && rec.status !== 'Completed') return false;
      if (status === 'IN_PROGRESS' && rec.status !== 'In Progress') return false;

      // 3. Search query
      if (query) {
        const matchLevel = (rec.level || '').toLowerCase().includes(query);
        const matchBoard = (rec.board || '').toLowerCase().includes(query);
        const matchSchool = (rec.schoolName || '').toLowerCase().includes(query);
        const matchUniv = (rec.university || rec.universityShortName || '').toLowerCase().includes(query);
        const matchCourse = (rec.course || rec.courseShortName || '').toLowerCase().includes(query);
        const matchStream = (rec.stream || '').toLowerCase().includes(query);
        const matchRoll = (rec.rollNumber || '').toLowerCase().includes(query);

        return matchLevel || matchBoard || matchSchool || matchUniv || matchCourse || matchStream || matchRoll;
      }

      return true;
    });
  }
);

export default educationRecordsSlice.reducer;
