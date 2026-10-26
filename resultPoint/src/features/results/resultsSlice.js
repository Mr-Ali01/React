import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultService } from '../../services/resultService.js';
import { resultApi } from '../../services/api/resultApi.js';

const getInitialResults = () => {
  try {
    return resultService.getAllResults();
  } catch {
    return [];
  }
};

const initialResults = getInitialResults();

const initialState = {
  results: initialResults,
  selectedSemester: initialResults.length > 0 ? initialResults[0].semesterNumber : 1,
  selectedResult: null,
  loading: false,
  error: null,
  operationSuccess: false,
};

export const fetchResults = createAsyncThunk(
  'results/fetchResults',
  async (_, { rejectWithValue }) => {
    try {
      try {
        const backendResults = await resultApi.getResults();
        if (Array.isArray(backendResults)) {
          resultService.setResults(backendResults, false);
          return backendResults;
        }
      } catch (apiErr) {
        // If not authenticated or backend unavailable, fallback to local store
        console.warn('Backend result fetch failed, using local results fallback:', apiErr.message);
      }
      const data = resultService.getAllResults();
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch semester results');
    }
  }
);

export const fetchResultById = createAsyncThunk(
  'results/fetchResultById',
  async (id, { rejectWithValue }) => {
    try {
      const cleanSemNum = Number(String(id).replace('semester-', '').replace('res_sem_', ''));
      if (!isNaN(cleanSemNum) && cleanSemNum > 0) {
        try {
          const apiRes = await resultApi.getResultBySemester(cleanSemNum);
          if (apiRes) return apiRes;
        } catch (apiErr) {
          console.warn(`Backend fetch for semester ${cleanSemNum} failed, using local fallback:`, apiErr.message);
        }
      }
      const data = resultService.getResultById(id);
      if (!data) return rejectWithValue('Result not found');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch result detail');
    }
  }
);

export const addSemesterResult = createAsyncThunk(
  'results/addSemesterResult',
  async (resultData, { rejectWithValue }) => {
    try {
      let created = null;
      try {
        created = await resultApi.saveResult(resultData);
      } catch (apiErr) {
        // Validation errors, duplicates, or missing profiles should be surfaced directly
        if (apiErr?.status === 400 || apiErr?.status === 409 || apiErr?.status === 404 || apiErr?.status === 401) {
          return rejectWithValue(apiErr.message || 'Validation error while saving semester result');
        }
        console.warn('API save failed, falling back to local service:', apiErr.message);
        created = resultService.addResult(resultData);
        return created;
      }

      if (created) {
        resultService.addResultAuthoritative(created);
        return created;
      }
      return rejectWithValue('Failed to save semester result');
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to add semester result');
    }
  }
);

export const updateSemesterResult = createAsyncThunk(
  'results/updateSemesterResult',
  async ({ id, semesterNumber, updates }, { rejectWithValue }) => {
    try {
      const semNum = Number(semesterNumber || updates?.semesterNumber || String(id).replace('semester-', '').replace('res_sem_', ''));
      let updated = null;
      try {
        updated = await resultApi.updateResult(semNum, updates);
      } catch (apiErr) {
        if (apiErr?.status === 400 || apiErr?.status === 404 || apiErr?.status === 401) {
          return rejectWithValue(apiErr.message || 'Validation error while updating semester result');
        }
        console.warn('API update failed, falling back to local service:', apiErr.message);
        updated = resultService.updateResult(id, updates);
        if (!updated) return rejectWithValue('Result not found to update');
        return updated;
      }

      if (updated) {
        resultService.updateResultAuthoritative(updated);
        return updated;
      }
      return rejectWithValue('Failed to update semester result');
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update semester result');
    }
  }
);

export const deleteSemesterResult = createAsyncThunk(
  'results/deleteSemesterResult',
  async (id, { rejectWithValue }) => {
    try {
      const cleanSem = Number(String(id).replace('semester-', '').replace('res_sem_', ''));
      try {
        if (!isNaN(cleanSem) && cleanSem > 0) {
          await resultApi.deleteResult(cleanSem);
        }
      } catch (apiErr) {
        console.warn('API delete failed, falling back to local service:', apiErr.message);
      }
      resultService.deleteResult(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete semester result');
    }
  }
);

export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setSelectedSemester: (state, action) => {
      state.selectedSemester = Number(action.payload);
      state.selectedResult =
        state.results.find((r) => Number(r.semesterNumber) === Number(action.payload)) || null;
    },
    clearSelectedResult: (state) => {
      state.selectedResult = null;
    },
    resetOperationSuccess: (state) => {
      state.operationSuccess = false;
    },
    clearResultsError: (state) => {
      state.error = null;
    },
    setResultsList: (state, action) => {
      state.results = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.selectedSemester = 1;
      state.selectedResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchResults
      .addCase(fetchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
        if (state.results.length > 0 && !state.selectedResult) {
          state.selectedSemester = state.results[0].semesterNumber;
          state.selectedResult = state.results[0];
        }
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchResultById
      .addCase(fetchResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedResult = action.payload;
      })
      .addCase(fetchResultById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // addSemesterResult
      .addCase(addSemesterResult.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operationSuccess = false;
      })
      .addCase(addSemesterResult.fulfilled, (state, action) => {
        state.loading = false;
        state.operationSuccess = true;
        const saved = action.payload;
        const exists = state.results.some((r) => Number(r.semesterNumber) === Number(saved.semesterNumber));
        if (exists) {
          state.results = state.results.map((r) =>
            Number(r.semesterNumber) === Number(saved.semesterNumber) ? saved : r
          );
        } else {
          state.results = [...state.results, saved].sort(
            (a, b) => Number(a.semesterNumber) - Number(b.semesterNumber)
          );
        }
        state.selectedSemester = Number(saved.semesterNumber);
        state.selectedResult = saved;
      })
      .addCase(addSemesterResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.operationSuccess = false;
      })
      // updateSemesterResult
      .addCase(updateSemesterResult.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operationSuccess = false;
      })
      .addCase(updateSemesterResult.fulfilled, (state, action) => {
        state.loading = false;
        state.operationSuccess = true;
        const updated = action.payload;
        state.results = state.results.map((r) =>
          Number(r.semesterNumber) === Number(updated.semesterNumber) || r.id === updated.id ? updated : r
        ).sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
        if (state.selectedResult && (state.selectedResult.id === updated.id || Number(state.selectedResult.semesterNumber) === Number(updated.semesterNumber))) {
          state.selectedResult = updated;
        }
      })
      .addCase(updateSemesterResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.operationSuccess = false;
      })
      // deleteSemesterResult
      .addCase(deleteSemesterResult.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operationSuccess = false;
      })
      .addCase(deleteSemesterResult.fulfilled, (state, action) => {
        state.loading = false;
        state.operationSuccess = true;
        const targetId = action.payload;
        const cleanSem = Number(String(targetId).replace('semester-', '').replace('res_sem_', ''));
        state.results = state.results.filter(
          (r) => r.id !== targetId && Number(r.semesterNumber) !== cleanSem
        );
        if (state.selectedResult?.id === targetId || Number(state.selectedResult?.semesterNumber) === cleanSem) {
          state.selectedResult = null;
        }
      })
      .addCase(deleteSemesterResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.operationSuccess = false;
      })
      // auth/logout
      .addCase('auth/logout', (state) => {
        state.results = [];
        state.selectedSemester = 1;
        state.selectedResult = null;
        state.loading = false;
        state.error = null;
        state.operationSuccess = false;
      });
  },
});

export const {
  setSelectedSemester,
  clearSelectedResult,
  resetOperationSuccess,
  clearResultsError,
  setResultsList,
  clearResults,
} = resultsSlice.actions;

// Selectors
export const selectResults = (state) => state.results.results;
export const selectSelectedSemester = (state) => state.results.selectedSemester;
export const selectSelectedResult = (state) => state.results.selectedResult;
export const selectResultsLoading = (state) => state.results.loading;
export const selectResultsError = (state) => state.results.error;
export const selectResultsOperationSuccess = (state) => state.results.operationSuccess;

// Derived Selectors
export const selectLatestResult = (state) => {
  const list = state.results.results;
  if (!list || list.length === 0) return null;
  return [...list].sort((a, b) => Number(b.semesterNumber) - Number(a.semesterNumber))[0];
};

export const selectResultBySem = (semesterNumber) => (state) => {
  return (
    state.results.results.find((r) => Number(r.semesterNumber) === Number(semesterNumber)) || null
  );
};

export default resultsSlice.reducer;
