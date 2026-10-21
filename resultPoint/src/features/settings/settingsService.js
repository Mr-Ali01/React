import { STORAGE_KEYS } from '../../services/storageKeys.js';
import { authService } from '../../services/authService.js';
import { notificationService } from '../../services/notificationService.js';

export const DEFAULT_SETTINGS = {
  themeMode: 'dark', // 'light' | 'dark' | 'system'
  dashboardView: 'comfortable', // 'compact' | 'comfortable' | 'expanded'
  language: 'en', // 'en'
  calculationAutoSave: true,
  decimalPrecision: 2, // 2 | 3 | 4
  gradeDisplayFormat: 'letter', // 'letter' | 'points' | 'both'
  marksInputPreference: 'grade-first', // 'grade-first' | 'marks-first'
  notifications: {
    academicUpdates: true,
    goalReminders: true,
    backlogAlerts: true,
  },
  accountPreferences: {
    sessionDuration: '7d',
    gradePrivacy: false,
    analyticsSharing: false,
  }
};

/**
 * Returns student-scoped storage key for settings
 */
export function getSettingsStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.SETTINGS}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (e) {
    console.warn('Error determining student settings key:', e);
  }
  return STORAGE_KEYS.SETTINGS;
}

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to set localStorage key:', key, e);
  }
}

/**
 * Validates and sanitizes settings against allowed values
 */
export function validateSettings(raw = {}) {
  const sanitized = { ...DEFAULT_SETTINGS };

  if (['light', 'dark', 'system'].includes(raw.themeMode)) {
    sanitized.themeMode = raw.themeMode;
  } else if (raw.theme) {
    sanitized.themeMode = raw.theme;
  }

  if (['compact', 'comfortable', 'expanded'].includes(raw.dashboardView)) {
    sanitized.dashboardView = raw.dashboardView;
  }

  if (raw.language === 'en') {
    sanitized.language = 'en';
  }

  if (typeof raw.calculationAutoSave === 'boolean') {
    sanitized.calculationAutoSave = raw.calculationAutoSave;
  } else if (typeof raw.autoSaveCalculations === 'boolean') {
    sanitized.calculationAutoSave = raw.autoSaveCalculations;
  }

  if ([2, 3, 4].includes(Number(raw.decimalPrecision))) {
    sanitized.decimalPrecision = Number(raw.decimalPrecision);
  }

  if (['letter', 'points', 'both'].includes(raw.gradeDisplayFormat)) {
    sanitized.gradeDisplayFormat = raw.gradeDisplayFormat;
  }

  if (['grade-first', 'marks-first'].includes(raw.marksInputPreference)) {
    sanitized.marksInputPreference = raw.marksInputPreference;
  }

  // Synchronize notification toggles with notificationService
  const notifPrefs = notificationService.getPreferences();
  sanitized.notifications = {
    academicUpdates: raw.notifications?.academicUpdates ?? notifPrefs.systemNotifications ?? true,
    goalReminders: raw.notifications?.goalReminders ?? notifPrefs.goalNotifications ?? true,
    backlogAlerts: raw.notifications?.backlogAlerts ?? notifPrefs.backlogNotifications ?? true,
  };

  if (raw.accountPreferences && typeof raw.accountPreferences === 'object') {
    sanitized.accountPreferences = {
      ...DEFAULT_SETTINGS.accountPreferences,
      ...raw.accountPreferences,
    };
  }

  return sanitized;
}

export const settingsService = {
  /**
   * Loads settings for the authenticated student
   */
  getSettings() {
    const key = getSettingsStorageKey();
    const stored = safeGet(key, null);
    if (!stored) {
      // Also check general key for backwards compatibility
      const legacy = safeGet(STORAGE_KEYS.SETTINGS, null);
      if (legacy) {
        const validated = validateSettings(legacy);
        safeSet(key, validated);
        return validated;
      }
      return DEFAULT_SETTINGS;
    }
    return validateSettings(stored);
  },

  /**
   * Updates settings and persists them
   */
  saveSettings(updates = {}) {
    const current = this.getSettings();
    const merged = {
      ...current,
      ...updates,
      notifications: {
        ...current.notifications,
        ...(updates.notifications || {}),
      },
      accountPreferences: {
        ...current.accountPreferences,
        ...(updates.accountPreferences || {}),
      }
    };
    const validated = validateSettings(merged);
    const key = getSettingsStorageKey();
    safeSet(key, validated);

    // Also sync notifications service preferences if notification toggles changed
    if (updates.notifications) {
      notificationService.updatePreferences({
        systemNotifications: validated.notifications.academicUpdates,
        goalNotifications: validated.notifications.goalReminders,
        backlogNotifications: validated.notifications.backlogAlerts,
      });
    }

    // Apply theme changes to document
    if (updates.themeMode || updates.theme) {
      this.applyTheme(validated.themeMode);
    }

    // Apply dashboard density attribute
    if (updates.dashboardView && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-dashboard-view', validated.dashboardView);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('settings_updated'));
    }

    return validated;
  },

  /**
   * Applies theme mode (light, dark, or system) to the HTML root
   */
  applyTheme(themeMode = 'dark') {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    let effectiveTheme = themeMode;

    if (themeMode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = 'dark';
      }
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEYS.THEME, effectiveTheme);
    } catch {}
  },

  /**
   * Initializes theme on application startup
   */
  initTheme() {
    const settings = this.getSettings();
    this.applyTheme(settings.themeMode);

    // Listen for OS system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const currentSettings = this.getSettings();
        if (currentSettings.themeMode === 'system') {
          this.applyTheme('system');
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
      }
    }
  }
};
