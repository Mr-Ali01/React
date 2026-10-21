import { authService } from '../../../services/authService.js';
import { studentService } from '../../../services/studentService.js';
import { resultService } from '../../../services/resultService.js';
import { goalService } from '../../../services/goalService.js';
import { backlogService } from '../../../services/backlogService.js';
import { educationRecordService } from '../../../services/educationRecordService.js';
import { settingsService } from '../settingsService.js';
import { STORAGE_KEYS } from '../../../services/storageKeys.js';

/**
 * Gathers all data belonging to the authenticated student and triggers a JSON download
 */
export function exportStudentData() {
  const user = authService.getCurrentUser() || {};
  const profile = studentService.getProfile() || {};
  const results = resultService.getAllResults() || [];
  const goal = goalService.getGoal() || {};
  const backlogs = backlogService.getBacklogs() || [];
  const educationRecords = educationRecordService.getAll() || [];
  const settings = settingsService.getSettings() || {};

  let calculationHistory = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS);
    if (raw) calculationHistory = JSON.parse(raw);
  } catch {}

  const exportPayload = {
    appName: 'ResultPoint',
    exportVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    student: {
      id: user.id || profile.id,
      fullName: profile.fullName || user.fullName || 'Student User',
      email: profile.email || user.email,
      course: profile.course || 'BCA',
      university: profile.university || 'Osmania University',
      regulation: profile.regulation || 'CBCS',
      hallTicketNumber: profile.hallTicketNumber || '',
      currentSemester: profile.currentSemester || 1,
      totalSemesters: profile.totalSemesters || 6,
    },
    educationRecords,
    academicResults: results,
    academicGoals: goal,
    backlogs,
    calculationHistory,
    settings: {
      themeMode: settings.themeMode,
      dashboardView: settings.dashboardView,
      decimalPrecision: settings.decimalPrecision,
      gradeDisplayFormat: settings.gradeDisplayFormat,
      marksInputPreference: settings.marksInputPreference,
      calculationAutoSave: settings.calculationAutoSave,
      notifications: settings.notifications,
    }
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateSlug = new Date().toISOString().split('T')[0];
  const safeName = (profile.fullName || user.fullName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const filename = `resultpoint-data-${safeName}-${dateSlug}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, filename, countResults: results.length, countRecords: educationRecords.length };
}
