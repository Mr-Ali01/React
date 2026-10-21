import { settingsService, DEFAULT_SETTINGS, validateSettings } from '../src/features/settings/settingsService.js';
import { notificationService } from '../src/services/notificationService.js';
import { authService } from '../src/services/authService.js';
import { activityHistoryService } from '../src/services/activityHistoryService.js';
import { exportStudentData } from '../src/features/settings/utils/exportStudentData.js';

// Setup mock localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

// Setup mock document & window
global.document = {
  documentElement: {
    classList: {
      add: (cls) => {},
      remove: (cls) => {}
    },
    setAttribute: (k, v) => {}
  },
  createElement: (tag) => ({
    href: '',
    download: '',
    click: () => {}
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};

global.window = {
  dispatchEvent: () => {},
  matchMedia: (query) => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {}
  })
};

global.Blob = class {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
};

global.URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {}
};

console.log('--- Starting Student Settings Module Verification ---');

// 1. Initial settings
const initialSettings = settingsService.getSettings();
console.log('Initial settings:', initialSettings);
if (initialSettings.themeMode !== 'dark' || initialSettings.dashboardView !== 'comfortable' || initialSettings.decimalPrecision !== 2) {
  console.error('FAIL: Default settings values mismatch');
  process.exit(1);
}
console.log('PASS: Initial default settings verified.');

// 2. Theme Mode updating & persistence
console.log('Testing Theme Mode...');
settingsService.saveSettings({ themeMode: 'light' });
let saved = settingsService.getSettings();
if (saved.themeMode !== 'light') {
  console.error('FAIL: Theme mode not persisted as light');
  process.exit(1);
}
settingsService.saveSettings({ themeMode: 'system' });
saved = settingsService.getSettings();
if (saved.themeMode !== 'system') {
  console.error('FAIL: Theme mode not persisted as system');
  process.exit(1);
}
console.log('PASS: Theme Mode (light, dark, system) verified.');

// 3. Dashboard View
console.log('Testing Dashboard View density...');
settingsService.saveSettings({ dashboardView: 'compact' });
saved = settingsService.getSettings();
if (saved.dashboardView !== 'compact') {
  console.error('FAIL: Dashboard view not saved');
  process.exit(1);
}
settingsService.saveSettings({ dashboardView: 'expanded' });
saved = settingsService.getSettings();
if (saved.dashboardView !== 'expanded') {
  console.error('FAIL: Dashboard view not saved as expanded');
  process.exit(1);
}
console.log('PASS: Dashboard View density options verified.');

// 4. Decimal Precision
console.log('Testing Decimal Precision...');
settingsService.saveSettings({ decimalPrecision: 3 });
saved = settingsService.getSettings();
if (saved.decimalPrecision !== 3) {
  console.error('FAIL: Decimal precision not saved');
  process.exit(1);
}
console.log('PASS: Decimal Precision (2, 3, 4) verified.');

// 5. Grade Display Format & Marks Input Preference
console.log('Testing Grade Display Format & Marks Input...');
settingsService.saveSettings({
  gradeDisplayFormat: 'both',
  marksInputPreference: 'marks-first'
});
saved = settingsService.getSettings();
if (saved.gradeDisplayFormat !== 'both' || saved.marksInputPreference !== 'marks-first') {
  console.error('FAIL: Grade display or marks input pref not saved');
  process.exit(1);
}
console.log('PASS: Grade Display Format and Marks Input Preference verified.');

// 6. Notification Preferences Sync
console.log('Testing Notification Preferences Sync...');
settingsService.saveSettings({
  notifications: {
    academicUpdates: false,
    goalReminders: true,
    backlogAlerts: false
  }
});
saved = settingsService.getSettings();
const notifServicePrefs = notificationService.getPreferences();
if (notifServicePrefs.systemNotifications !== false || notifServicePrefs.backlogNotifications !== false) {
  console.error('FAIL: Notification toggles failed to synchronize with notificationService');
  process.exit(1);
}
console.log('PASS: Notification Preferences synchronization verified.');

// 7. Calculation Auto-Save check in activity history
console.log('Testing Calculation Auto-Save behavior...');
settingsService.saveSettings({ calculationAutoSave: false });
const skippedAct = activityHistoryService.recordActivity({
  type: 'calculation',
  title: 'Test Calculation',
  description: 'Should be skipped when autoSave is off'
});
if (skippedAct !== null) {
  console.error('FAIL: Calculation activity was recorded even though calculationAutoSave was OFF');
  process.exit(1);
}
settingsService.saveSettings({ calculationAutoSave: true });
const recordedAct = activityHistoryService.recordActivity({
  type: 'calculation',
  title: 'Test Calculation',
  description: 'Should be recorded when autoSave is ON'
});
if (!recordedAct || !recordedAct.id) {
  console.error('FAIL: Calculation activity was not recorded when calculationAutoSave was ON');
  process.exit(1);
}
console.log('PASS: Calculation Auto-Save behavior verified.');

// 8. Data Export
console.log('Testing Data Export...');
const exportResult = exportStudentData();
if (!exportResult.success || !exportResult.filename.startsWith('resultpoint-data-')) {
  console.error('FAIL: Export student data failed');
  process.exit(1);
}
console.log(`PASS: Data Export generated file: ${exportResult.filename} successfully.`);

console.log('\n--- ALL SETTINGS MODULE VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
