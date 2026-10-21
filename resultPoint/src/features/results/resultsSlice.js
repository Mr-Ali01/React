import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultService } from '../../services/resultService';

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
      const created = resultService.addResult(resultData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to add semester result');
    }
  }
);

export const updateSemesterResult = createAsyncThunk(
  'results/updateSemesterResult',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const updated = resultService.updateResult(id, updates);
      if (!updated) return rejectWithValue('Result not found to update');
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update semester result');
    }
  }
);

export const deleteSemesterResult = createAsyncThunk(
  'results/deleteSemesterResult',
  async (id, { rejectWithValue }) => {
    try {
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
      .addCase(addSemesterResult.fulfilled, (state) => {
        state.loading = false;
        state.operationSuccess = true;
        state.results = resultService.getAllResults();
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
      .addCase(updateSemesterResult.fulfilled, (state) => {
        state.loading = false;
        state.operationSuccess = true;
        state.results = resultService.getAllResults();
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
        state.results = resultService.getAllResults();
        if (state.selectedResult?.id === action.payload) {
          state.selectedResult = null;
        }
      })
      .addCase(deleteSemesterResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
