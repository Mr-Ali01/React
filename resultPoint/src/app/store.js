import { configureStore, combineReducers } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice.js';
import userReducer from '../features/user/userSlice.js';
import academicProfileReducer from '../features/academicProfile/academicProfileSlice.js';
import resultsReducer from '../features/results/resultsSlice.js';
import academicHistoryReducer from '../features/academicHistory/academicHistorySlice.js';
import performanceReducer from '../features/performance/performanceSlice.js';
import academicGoalsReducer from '../features/academicGoals/academicGoalsSlice.js';
import backlogReducer from '../features/backlog/backlogSlice.js';
import calculationReducer from '../features/calculation/calculationSlice.js';
import activityHistoryReducer from '../features/activityHistory/activityHistorySlice.js';
import notificationReducer from '../features/notifications/notificationSlice.js';
import settingsReducer from '../features/settings/settingsSlice.js';
import uiReducer from '../features/ui/uiSlice.js';
import educationRecordsReducer from '../features/educationRecords/educationRecordsSlice.js';

const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  academicProfile: academicProfileReducer,
  results: resultsReducer,
  academicHistory: academicHistoryReducer,
  performance: performanceReducer,
  academicGoals: academicGoalsReducer,
  backlog: backlogReducer,
  calculation: calculationReducer,
  activityHistory: activityHistoryReducer,
  notifications: notificationReducer,
  settings: settingsReducer,
  ui: uiReducer,
  educationRecords: educationRecordsReducer,
});

/**
 * Root Reducer:
 * Intercepts logout events and resets all application domain slices to their initial state,
 * preventing any student result, backlog, or profile data leakage across sessions.
 */
const rootReducer = (state, action) => {
  if (
    action.type === 'auth/logout' ||
    action.type === 'auth/logoutUser/fulfilled' ||
    action.type === 'auth/logoutUser/rejected'
  ) {
    const uiState = state?.ui;
    state = undefined;
    if (uiState) {
      return { ...appReducer(undefined, action), ui: uiState };
    }
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
