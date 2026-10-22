/**
 * ResultPoint Platform Settings & Backup Service
 *
 * Canonical administrative authority for platform configuration, academic defaults,
 * system health diagnostics, and versioned JSON data export/restore workflows.
 *
 * Architecture Highlights:
 * - Single canonical storage key: STORAGE_KEYS.SETTINGS ('resultpoint_settings')
 * - Idempotent initialization & schema validation
 * - Sensitive credential exclusion during JSON backup export (passwords & tokens omitted)
 * - Safe restore workflow with pre-flight schema validation & emergency recovery snapshot
 * - Event-driven reactivity: emits 'rp_settings_updated'
 * - Audit trail logging via auditHistoryService ('SETTINGS_UPDATED', 'BACKUP_EXPORTED', 'PLATFORM_RESTORED', 'SETTINGS_RESET')
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { auditHistoryService } from './auditHistoryService.js';

export const SETTINGS_UPDATED_EVENT = 'rp_settings_updated';
export const RECOVERY_SNAPSHOT_KEY = 'resultpoint_recovery_snapshot';

export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const APP_VERSION = '2.4.0';

export const DEFAULT_PLATFORM_SETTINGS = {
  // General Platform Preferences
  siteName: 'ResultPoint Academic Portal',
  supportEmail: 'support@resultpoint.edu',
  contactPhone: '+91 40 2709 8254',
  defaultThemeMode: 'dark', // 'dark' | 'light' | 'system'
  defaultLanguage: 'en',
  maintenanceMode: false,
  maintenanceMessage: 'ResultPoint is undergoing scheduled platform maintenance. Services will resume shortly.',
  allowStudentRegistration: true,
  allowPublicCalculators: true,
  defaultItemsPerPage: 10,

  // Academic Platform Defaults (Fallback defaults when not defined by university-specific ordinances)
  defaultGradingScale: 'ugc-10-point',
  defaultCalculationPrecision: 2, // 1 | 2 | 3 | 4
  defaultRoundingMode: 'half-up', // 'half-up' | 'floor' | 'ceil' | 'truncate'
  defaultPassingMarks: 40,
  defaultMaxMarks: 100,

  // Audit & System
  enableAuditLogging: true,
  auditRetentionDays: 90,

  // Metadata
  updatedAt: '2026-10-15T00:00:00.000Z',
  updatedBy: 'Administrator'
};

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key: ${key}`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key: ${key}`, err);
  }
}

function dispatchSettingsUpdated(action, settings) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(SETTINGS_UPDATED_EVENT, {
          detail: { action, settings, timestamp: new Date().toISOString() }
        })
      );
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Failed to dispatch settings update event:', err);
  }
}

export const platformSettingsService = {
  /**
   * Idempotent initialization of platform settings.
   * Migrates from default values if uninitialized.
   */
  initialize() {
    const existing = safeGet(STORAGE_KEYS.SETTINGS, null);
    if (!existing || typeof existing !== 'object') {
      const initial = { ...DEFAULT_PLATFORM_SETTINGS, updatedAt: new Date().toISOString() };
      safeSet(STORAGE_KEYS.SETTINGS, initial);
      return initial;
    }

    // Merge missing fields safely for forward-compatibility
    const merged = {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...existing
    };
    return merged;
  },

  /**
   * Retrieve platform settings
   */
  getSettings() {
    return this.initialize();
  },

  /**
   * Validate and update platform settings
   */
  updateSettings(updates = {}, actor = 'Administrator') {
    if (!updates || typeof updates !== 'object') {
      throw new Error('Settings update payload must be an object.');
    }

    const current = this.getSettings();

    // Field-level validations
    if (updates.siteName !== undefined) {
      if (typeof updates.siteName !== 'string' || !updates.siteName.trim()) {
        throw new Error('Platform site name cannot be empty.');
      }
      if (updates.siteName.trim().length < 3 || updates.siteName.trim().length > 100) {
        throw new Error('Platform site name must be between 3 and 100 characters.');
      }
    }

    if (updates.supportEmail !== undefined) {
      if (typeof updates.supportEmail !== 'string' || !updates.supportEmail.trim()) {
        throw new Error('Support email cannot be empty.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.supportEmail.trim())) {
        throw new Error('Please provide a valid support email address.');
      }
    }

    if (updates.defaultThemeMode !== undefined) {
      const mode = String(updates.defaultThemeMode).toLowerCase();
      if (!['dark', 'light', 'system'].includes(mode)) {
        throw new Error('Theme mode must be "dark", "light", or "system".');
      }
    }

    if (updates.defaultCalculationPrecision !== undefined) {
      const prec = Number(updates.defaultCalculationPrecision);
      if (![1, 2, 3, 4].includes(prec)) {
        throw new Error('Calculation precision must be 1, 2, 3, or 4 decimal places.');
      }
    }

    if (updates.defaultRoundingMode !== undefined) {
      const mode = String(updates.defaultRoundingMode).toLowerCase();
      if (!['half-up', 'floor', 'ceil', 'truncate'].includes(mode)) {
        throw new Error('Rounding mode must be "half-up", "floor", "ceil", or "truncate".');
      }
    }

    if (updates.defaultPassingMarks !== undefined) {
      const pass = Number(updates.defaultPassingMarks);
      if (isNaN(pass) || pass < 0 || pass > 100) {
        throw new Error('Passing marks threshold must be between 0 and 100.');
      }
    }

    if (updates.defaultItemsPerPage !== undefined) {
      const items = Number(updates.defaultItemsPerPage);
      if (![5, 10, 15, 20, 25, 50].includes(items)) {
        throw new Error('Items per page must be 5, 10, 15, 20, 25, or 50.');
      }
    }

    const now = new Date().toISOString();
    const validated = {
      ...current,
      ...updates,
      updatedAt: now,
      updatedBy: actor
    };

    safeSet(STORAGE_KEYS.SETTINGS, validated);

    // Audit log
    try {
      auditHistoryService.recordEvent({
        action: 'SETTINGS_UPDATED',
        entityType: 'settings',
        entityId: 'platform_settings',
        entityName: 'Platform Configuration',
        details: `Platform settings updated by ${actor}.`,
        actor
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchSettingsUpdated('UPDATE', validated);
    return validated;
  },

  /**
   * Reset platform settings to baseline factory defaults
   */
  resetToDefaults(actor = 'Administrator') {
    const baseline = {
      ...DEFAULT_PLATFORM_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    safeSet(STORAGE_KEYS.SETTINGS, baseline);

    try {
      auditHistoryService.recordEvent({
        action: 'SETTINGS_RESET',
        entityType: 'settings',
        entityId: 'platform_settings',
        entityName: 'Platform Configuration',
        details: `Platform configuration restored to factory defaults by ${actor}.`,
        actor
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchSettingsUpdated('RESET', baseline);
    return baseline;
  },

  /**
   * Generate a versioned JSON backup containing all supported platform data.
   * STRICT SECURITY: Credentials, passwords, authentication tokens, and session secrets
   * are unconditionally sanitized and omitted from the exported backup payload.
   */
  generateBackup(actor = 'Administrator') {
    const rawUsers = safeGet(STORAGE_KEYS.USERS, []);
    // Sanitize users: strip passwords, tokens, auth secrets
    const sanitizedUsers = Array.isArray(rawUsers)
      ? rawUsers.map((u) => {
          const { password, token, authToken, passwordHash, ...safeUser } = u;
          return safeUser;
        })
      : [];

    const backupData = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appName: 'ResultPoint',
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: actor,
      environment: 'client-localstorage',
      metadata: {
        totalKeys: Object.keys(STORAGE_KEYS).length,
        sensitiveDataExcluded: true,
        securityNotice:
          'This backup contains academic catalogs, user directory, announcements, and calculation records. Keep this file in a secure location.'
      },
      data: {
        users: sanitizedUsers,
        academicCatalog: safeGet(STORAGE_KEYS.ACADEMIC_CATALOG, {}),
        savedResults: safeGet(STORAGE_KEYS.SAVED_RESULTS, []),
        results: safeGet(STORAGE_KEYS.RESULTS, []),
        goals: safeGet(STORAGE_KEYS.GOALS, []),
        backlogs: safeGet(STORAGE_KEYS.BACKLOGS, []),
        educationRecords: safeGet(STORAGE_KEYS.EDUCATION_RECORDS, []),
        tools: safeGet(STORAGE_KEYS.TOOLS, []),
        resources: safeGet(STORAGE_KEYS.RESOURCES, []),
        blogs: safeGet(STORAGE_KEYS.BLOGS, []),
        announcements: safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []),
        supportQueries: safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []),
        auditHistory: safeGet(STORAGE_KEYS.AUDIT_HISTORY, []),
        activityHistory: safeGet(STORAGE_KEYS.ACTIVITY_HISTORY, []),
        settings: this.getSettings()
      }
    };

    try {
      auditHistoryService.recordEvent({
        action: 'BACKUP_EXPORTED',
        entityType: 'settings',
        entityId: 'platform_backup',
        entityName: 'Platform Backup',
        details: `Generated platform backup (version ${BACKUP_SCHEMA_VERSION}) by ${actor}.`,
        actor
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    return backupData;
  },

  /**
   * Pre-flight validation of an imported backup JSON structure
   */
  validateBackup(backupPayload) {
    if (!backupPayload || typeof backupPayload !== 'object') {
      return { isValid: false, errors: ['Backup payload must be a valid JSON object.'] };
    }

    const errors = [];

    if (backupPayload.appName !== 'ResultPoint') {
      errors.push(`Invalid application name "${backupPayload.appName}". Expected "ResultPoint".`);
    }

    if (backupPayload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      errors.push(
        `Unsupported schema version "${backupPayload.schemaVersion}". Supported version is "${BACKUP_SCHEMA_VERSION}".`
      );
    }

    if (!backupPayload.data || typeof backupPayload.data !== 'object') {
      errors.push('Backup payload is missing the core "data" container.');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const d = backupPayload.data;
    const summary = {
      usersCount: Array.isArray(d.users) ? d.users.length : 0,
      hasCatalog: Boolean(d.academicCatalog && typeof d.academicCatalog === 'object'),
      toolsCount: Array.isArray(d.tools) ? d.tools.length : 0,
      resourcesCount: Array.isArray(d.resources) ? d.resources.length : 0,
      blogsCount: Array.isArray(d.blogs) ? d.blogs.length : 0,
      announcementsCount: Array.isArray(d.announcements) ? d.announcements.length : 0,
      supportQueriesCount: Array.isArray(d.supportQueries) ? d.supportQueries.length : 0,
      auditHistoryCount: Array.isArray(d.auditHistory) ? d.auditHistory.length : 0,
      savedResultsCount: Array.isArray(d.savedResults) ? d.savedResults.length : 0
    };

    return {
      isValid: true,
      errors: [],
      summary
    };
  },

  /**
   * Restores platform data from an exported backup with pre-flight safety snapshot
   */
  restoreBackup(backupPayload, options = { createSafetySnapshot: true }, actor = 'Administrator') {
    const validation = this.validateBackup(backupPayload);
    if (!validation.isValid) {
      throw new Error(`Cannot restore backup: ${validation.errors.join(' ')}`);
    }

    // 1. Create an emergency recovery snapshot before touching existing storage
    if (options.createSafetySnapshot) {
      try {
        const emergencySnapshot = this.generateBackup('System-EmergencySnapshot');
        safeSet(RECOVERY_SNAPSHOT_KEY, emergencySnapshot);
      } catch (snapErr) {
        console.warn('Failed to save emergency snapshot:', snapErr);
      }
    }

    const d = backupPayload.data;

    // 2. Safely restore supported application stores
    if (Array.isArray(d.users)) safeSet(STORAGE_KEYS.USERS, d.users);
    if (d.academicCatalog && typeof d.academicCatalog === 'object') {
      safeSet(STORAGE_KEYS.ACADEMIC_CATALOG, d.academicCatalog);
    }
    if (Array.isArray(d.savedResults)) safeSet(STORAGE_KEYS.SAVED_RESULTS, d.savedResults);
    if (Array.isArray(d.results)) safeSet(STORAGE_KEYS.RESULTS, d.results);
    if (Array.isArray(d.goals)) safeSet(STORAGE_KEYS.GOALS, d.goals);
    if (Array.isArray(d.backlogs)) safeSet(STORAGE_KEYS.BACKLOGS, d.backlogs);
    if (Array.isArray(d.educationRecords)) safeSet(STORAGE_KEYS.EDUCATION_RECORDS, d.educationRecords);
    if (Array.isArray(d.tools)) safeSet(STORAGE_KEYS.TOOLS, d.tools);
    if (Array.isArray(d.resources)) safeSet(STORAGE_KEYS.RESOURCES, d.resources);
    if (Array.isArray(d.blogs)) safeSet(STORAGE_KEYS.BLOGS, d.blogs);
    if (Array.isArray(d.announcements)) safeSet(STORAGE_KEYS.ANNOUNCEMENTS, d.announcements);
    if (Array.isArray(d.supportQueries)) safeSet(STORAGE_KEYS.SUPPORT_QUERIES, d.supportQueries);
    if (Array.isArray(d.auditHistory)) safeSet(STORAGE_KEYS.AUDIT_HISTORY, d.auditHistory);
    if (Array.isArray(d.activityHistory)) safeSet(STORAGE_KEYS.ACTIVITY_HISTORY, d.activityHistory);
    if (d.settings && typeof d.settings === 'object') safeSet(STORAGE_KEYS.SETTINGS, d.settings);

    // 3. Log restoration in audit history
    try {
      auditHistoryService.recordEvent({
        action: 'PLATFORM_RESTORED',
        entityType: 'settings',
        entityId: 'platform_restore',
        entityName: 'Platform Restore',
        details: `Platform restored from backup file (Schema ${backupPayload.schemaVersion}, Exported: ${backupPayload.exportedAt}) by ${actor}.`,
        actor
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchSettingsUpdated('RESTORE', d.settings || this.getSettings());

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      summary: validation.summary
    };
  },

  /**
   * Rollback to the previous emergency recovery snapshot if available
   */
  rollbackSafetySnapshot(actor = 'Administrator') {
    const snapshot = safeGet(RECOVERY_SNAPSHOT_KEY, null);
    if (!snapshot) {
      throw new Error('No emergency recovery snapshot is available in localStorage.');
    }
    return this.restoreBackup(snapshot, { createSafetySnapshot: false }, actor);
  },

  /**
   * Calculate live storage consumption across all canonical keys
   */
  getStorageDiagnostics() {
    if (typeof localStorage === 'undefined') {
      return { totalBytes: 0, formattedTotal: '0 KB', quotaPercent: 0, keyBreakdown: [] };
    }

    const keyBreakdown = [];
    let totalBytes = 0;

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const raw = localStorage.getItem(key);
        const bytes = raw ? new Blob([raw]).size : 0;
        totalBytes += bytes;

        let itemCount = 0;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) itemCount = parsed.length;
            else if (typeof parsed === 'object') itemCount = Object.keys(parsed).length;
          } catch {}
        }

        keyBreakdown.push({
          name,
          key,
          bytes,
          formattedSize: bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`,
          itemCount
        });
      } catch {
        keyBreakdown.push({ name, key, bytes: 0, formattedSize: '0 B', itemCount: 0 });
      }
    });

    const standardQuotaBytes = 5 * 1024 * 1024; // Standard 5MB browser quota
    const quotaPercent = Math.min(100, Number(((totalBytes / standardQuotaBytes) * 100).toFixed(2)));

    return {
      totalBytes,
      formattedTotal: totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalBytes} B`,
      quotaPercent,
      standardQuotaBytes,
      appVersion: APP_VERSION,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      keyBreakdown
    };
  }
};

// Auto-initialize on module load
platformSettingsService.initialize();
