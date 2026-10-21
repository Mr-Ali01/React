import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsService, DEFAULT_SETTINGS } from './settingsService.js';

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    return settingsService.getSettings();
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (newSettings, { rejectWithValue }) => {
    try {
      const updated = settingsService.saveSettings(newSettings);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update settings');
    }
  }
);

const initialState = {
  ...settingsService.getSettings(),
  loading: false,
  error: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
      state.theme = action.payload === 'system' ? 'dark' : action.payload;
      settingsService.saveSettings({ themeMode: action.payload });
    },
    toggleTheme: (state) => {
      const nextTheme = state.themeMode === 'dark' ? 'light' : 'dark';
      state.themeMode = nextTheme;
      state.theme = nextTheme;
      settingsService.saveSettings({ themeMode: nextTheme });
    },
    setDashboardView: (state, action) => {
      state.dashboardView = action.payload;
      settingsService.saveSettings({ dashboardView: action.payload });
    },
    setCalculationAutoSave: (state, action) => {
      state.calculationAutoSave = action.payload;
      state.autoSaveCalculations = action.payload;
      settingsService.saveSettings({ calculationAutoSave: action.payload });
    },
    setDecimalPrecision: (state, action) => {
      state.decimalPrecision = Number(action.payload);
      settingsService.saveSettings({ decimalPrecision: Number(action.payload) });
    },
    setGradeDisplayFormat: (state, action) => {
      state.gradeDisplayFormat = action.payload;
      settingsService.saveSettings({ gradeDisplayFormat: action.payload });
    },
    setMarksInputPreference: (state, action) => {
      state.marksInputPreference = action.payload;
      settingsService.saveSettings({ marksInputPreference: action.payload });
    },
    setNotificationToggle: (state, action) => {
      const { key, value } = action.payload;
      state.notifications = {
        ...state.notifications,
        [key]: value,
      };
      settingsService.saveSettings({
        notifications: {
          ...state.notifications,
          [key]: value,
        }
      });
    },
    setSettingField: (state, action) => {
      const { key, value } = action.payload;
      state[key] = value;
      settingsService.saveSettings({ [key]: value });
    },
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setThemeMode,
  toggleTheme,
  setDashboardView,
  setCalculationAutoSave,
  setDecimalPrecision,
  setGradeDisplayFormat,
  setMarksInputPreference,
  setNotificationToggle,
  setSettingField,
  clearSettingsError,
} = settingsSlice.actions;

// Selectors
export const selectTheme = (state) => state.settings.themeMode || state.settings.theme || 'dark';
export const selectThemeMode = (state) => state.settings.themeMode || 'dark';
export const selectDashboardView = (state) => state.settings.dashboardView || 'comfortable';
export const selectCalculationAutoSave = (state) => state.settings.calculationAutoSave ?? true;
export const selectDecimalPrecision = (state) => state.settings.decimalPrecision || 2;
export const selectGradeDisplayFormat = (state) => state.settings.gradeDisplayFormat || 'letter';
export const selectMarksInputPreference = (state) => state.settings.marksInputPreference || 'grade-first';
export const selectNotificationPreferences = (state) => state.settings.notifications || DEFAULT_SETTINGS.notifications;
export const selectSettings = (state) => state.settings;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsError = (state) => state.settings.error;

export default settingsSlice.reducer;
