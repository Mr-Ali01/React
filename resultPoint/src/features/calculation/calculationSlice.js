import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../services/storageKeys';
import { activityHistoryService } from '../../services/activityHistoryService';
import { calculationSaveService } from '../../services/calculationSaveService';

const DEFAULT_HISTORY = [
  {
    id: 'calc_1',
    tool: 'CGPA Calculator',
    query: 'Semester 4 CBCS Evaluation',
    score: '8.72 SGPA',
    date: 'Oct 06, 2026',
    path: '/calculators/cgpa',
  },
  {
    id: 'calc_2',
    tool: 'Target CGPA Calculator',
    query: 'Goal: 8.50 Target from 8.10',
    score: '8.63 Req.',
    date: 'Sep 28, 2026',
    path: '/calculators/target-cgpa',
  },
  {
    id: 'calc_3',
    tool: 'Percentage Converter',
    query: '8.37 CGPA to Osmania %',
    score: '76.2%',
    date: 'Sep 15, 2026',
    path: '/calculators/percentage',
  },
  {
    id: 'calc_4',
    tool: 'Result Analyzer',
    query: 'Performance Risk Audit Sem 3',
    score: 'Low Risk',
    date: 'Jul 10, 2026',
    path: '/calculators/result-analysis',
  },
];

const safeGetHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS);
    if (!raw) return DEFAULT_HISTORY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HISTORY;
  } catch {
    return DEFAULT_HISTORY;
  }
};

const safeGetPendingCalculation = () => {
  try {
    return calculationSaveService.getPendingCalculation();
  } catch {
    return null;
  }
};

const safeSetHistory = (list) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_RESULTS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save calculation history:', e);
  }
};

const initialState = {
  activeCalculator: 'cgpa',
  calculatorInputs: {
    subjects: [],
    targetCGPA: null,
    currentCGPA: null,
    scale: 10,
    marks: null,
    maxMarks: 100,
  },
  lastCalculationResult: null,
  pendingCalculation: safeGetPendingCalculation(),
  calculationHistory: safeGetHistory(),
  loading: false,
  error: null,
};

export const savePendingCalculation = createAsyncThunk(
  'calculation/savePendingCalculation',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const currentUser = state.auth.user;
      if (!currentUser) {
        return rejectWithValue('Please sign in or create an account to save your calculation.');
      }

      const pending = state.calculation.pendingCalculation || calculationSaveService.getPendingCalculation(currentUser);
      if (!pending) {
        return rejectWithValue('No pending calculation found to save.');
      }

      const result = calculationSaveService.saveCalculation(pending, currentUser);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to save calculation to history.');
      }

      calculationSaveService.clearPendingCalculation();
      dispatch(saveCalculationToHistory(result.record));
      return result.record;
    } catch (err) {
      return rejectWithValue(err.message || 'Error occurred while saving pending calculation.');
    }
  }
);

export const loadCalculationHistory = createAsyncThunk(
  'calculation/loadCalculationHistory',
  async () => {
    return safeGetHistory();
  }
);

export const saveCalculationToHistory = createAsyncThunk(
  'calculation/saveCalculationToHistory',
  async (calcRecord, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentList = state.calculation.calculationHistory || [];
      const itemToSave = {
        id: calcRecord.id || `calc_${Date.now()}`,
        tool: calcRecord.tool || 'Academic Calculator',
        query: calcRecord.query || 'Evaluation',
        score: calcRecord.score || 'Computed',
        date: calcRecord.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        path: calcRecord.path || '/calculators',
        details: calcRecord.details || null,
      };
      const updated = [itemToSave, ...currentList];
      safeSetHistory(updated);

      try {
        activityHistoryService.recordActivity({
          type: 'calculation',
          action: 'calculated',
          title: `Used ${itemToSave.tool}`,
          description: itemToSave.query || `Evaluation score: ${itemToSave.score}`,
          entityId: itemToSave.id,
          badgeValues: ['Calculator', itemToSave.tool.replace(' Calculator', '')],
          resultMetric: { label: 'Result', value: String(itemToSave.score), color: 'blue' },
          metadata: {
            activityType: 'Calculator Usage',
            tool: itemToSave.tool,
            path: itemToSave.path || '/calculators',
            output: itemToSave.score,
            remarks: itemToSave.query || 'Calculator evaluation record.'
          }
        });
      } catch (e) {
        console.warn('Activity history calc log warning:', e);
      }

      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to save calculation');
    }
  }
);

export const deleteCalculationHistoryItem = createAsyncThunk(
  'calculation/deleteCalculationHistoryItem',
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentList = state.calculation.calculationHistory || [];
      const updated = currentList.filter((item) => item.id !== id);
      safeSetHistory(updated);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete history item');
    }
  }
);

export const clearCalculationHistory = createAsyncThunk(
  'calculation/clearCalculationHistory',
  async () => {
    safeSetHistory([]);
    return [];
  }
);

export const calculationSlice = createSlice({
  name: 'calculation',
  initialState,
  reducers: {
    setActiveCalculator: (state, action) => {
      state.activeCalculator = action.payload;
    },
    setCalculatorInputs: (state, action) => {
      state.calculatorInputs = { ...state.calculatorInputs, ...action.payload };
    },
    setLastCalculationResult: (state, action) => {
      state.lastCalculationResult = action.payload;
    },
    clearLastCalculation: (state) => {
      state.lastCalculationResult = null;
    },
    clearCalculationError: (state) => {
      state.error = null;
    },
    setPendingCalculation: (state, action) => {
      const sanitized = calculationSaveService.setPendingCalculation(action.payload);
      state.pendingCalculation = sanitized || action.payload;
    },
    clearPendingCalculation: (state) => {
      calculationSaveService.clearPendingCalculation();
      state.pendingCalculation = null;
    },
    restorePendingCalculation: (state, action) => {
      state.pendingCalculation = calculationSaveService.getPendingCalculation(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCalculationHistory.fulfilled, (state, action) => {
        state.calculationHistory = action.payload;
      })
      .addCase(saveCalculationToHistory.fulfilled, (state, action) => {
        state.calculationHistory = action.payload;
      })
      .addCase(deleteCalculationHistoryItem.fulfilled, (state, action) => {
        state.calculationHistory = action.payload;
      })
      .addCase(clearCalculationHistory.fulfilled, (state, action) => {
        state.calculationHistory = action.payload;
      })
      .addCase(savePendingCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePendingCalculation.fulfilled, (state) => {
        state.loading = false;
        state.pendingCalculation = null;
      })
      .addCase(savePendingCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveCalculator,
  setCalculatorInputs,
  setLastCalculationResult,
  clearLastCalculation,
  clearCalculationError,
  setPendingCalculation,
  clearPendingCalculation,
  restorePendingCalculation,
} = calculationSlice.actions;

// Selectors
export const selectActiveCalculator = (state) => state.calculation.activeCalculator;
export const selectCalculatorInputs = (state) => state.calculation.calculatorInputs;
export const selectLastCalculationResult = (state) => state.calculation.lastCalculationResult;
export const selectPendingCalculation = (state) => state.calculation.pendingCalculation;
export const selectCalculationHistory = (state) => state.calculation.calculationHistory;
export const selectCalculationLoading = (state) => state.calculation.loading;
export const selectCalculationError = (state) => state.calculation.error;

export default calculationSlice.reducer;
