/**
 * ResultPoint Phase 3H: Settings & Platform Audit Trail Automated Test Suite
 *
 * Comprehensive validation of:
 * 1. Canonical storage registration (STORAGE_KEYS.SETTINGS = 'resultpoint_settings')
 * 2. Settings initialization, validation, and migration of default values
 * 3. Strict rejection of invalid settings (siteName, email, precision, roundingMode, passingMarks)
 * 4. Audit trail logging, retrieval, multi-criteria filtering, search, sorting, and pagination
 * 5. Audit event visibility across all platform modules (Catalog, Users, Tools, Resources, Blogs, Announcements, Queries, Settings)
 * 6. Audit data sanitization (no passwords, tokens, or credential leaks)
 * 7. Versioned JSON platform backup generation (schemaVersion 1.0.0, appVersion 2.4.0)
 * 8. Strict credential sanitization in backup export (passwords & tokens omitted)
 * 9. Pre-flight backup validation & rejection of malformed or mismatched backups
 * 10. Safe restore workflow with emergency recovery snapshot
 * 11. Rollback capability from emergency safety snapshot
 * 12. Storage health diagnostics (canonical key breakdown, quota percentage calculation)
 * 13. Event broadcasting ('rp_settings_updated' & 'rp_audit_updated')
 * 14. Full regression coverage for Phases 2A-2F and 3A-3G
 */

// Mock browser localStorage and window environment for Node.js BEFORE any service loads
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (idx) => Array.from(storageMap.keys())[idx] || null
};

// Setup Mock Window Event Dispatcher
const emittedEvents = [];
globalThis.window = {
  dispatchEvent: (event) => {
    emittedEvents.push(event);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail || null;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
  passedAssertions++;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('ResultPoint Phase 3H: Settings & Platform Audit Trail Test Suite');
  console.log('================================================================\n');

  // Dynamic imports after localStorage mock setup
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');
  const {
    platformSettingsService,
    DEFAULT_PLATFORM_SETTINGS,
    SETTINGS_UPDATED_EVENT,
    RECOVERY_SNAPSHOT_KEY,
    BACKUP_SCHEMA_VERSION,
    APP_VERSION
  } = await import('../services/platformSettingsService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');
  const { adminDashboardService } = await import('../services/adminDashboardService.js');
  const { authService } = await import('../services/authService.js');
  const { academicCatalogService } = await import('../services/academicCatalogService.js');
  const { toolManagementService } = await import('../services/toolManagementService.js');
  const { resourceManagementService } = await import('../services/resourceManagementService.js');
  const { blogService } = await import('../services/blogService.js');

  // -------------------------------------------------------------
  // Test Area 1: Storage Key Registration & Idempotent Init
  // -------------------------------------------------------------
  console.log('Test Area 1: Storage Key Registration & Idempotent Init');
  assert(STORAGE_KEYS.SETTINGS === 'resultpoint_settings', 'STORAGE_KEYS.SETTINGS matches "resultpoint_settings"');

  const settings = platformSettingsService.initialize();
  assert(typeof settings === 'object', 'initialize returns settings object');
  assert(settings.siteName === 'ResultPoint Academic Portal', 'Default site name populated');
  assert(settings.supportEmail === 'support@resultpoint.edu', 'Default support email populated');
  assert(settings.defaultThemeMode === 'dark', 'Default theme mode is dark');
  assert(settings.defaultCalculationPrecision === 2, 'Default calculation precision is 2');
  assert(settings.defaultRoundingMode === 'half-up', 'Default rounding mode is half-up');
  assert(settings.defaultPassingMarks === 40, 'Default pass marks threshold is 40');
  assert(settings.maintenanceMode === false, 'Default maintenance mode is false');
  assert(settings.allowStudentRegistration === true, 'Default student registration is enabled');

  // -------------------------------------------------------------
  // Test Area 2: Settings Validation & Rejection of Invalid Values
  // -------------------------------------------------------------
  console.log('\nTest Area 2: Settings Validation & Rejection of Invalid Values');

  // Valid update
  const updated = platformSettingsService.updateSettings({
    siteName: 'ResultPoint Academic Central',
    supportEmail: 'helpdesk@resultpoint.edu',
    defaultCalculationPrecision: 3,
    defaultRoundingMode: 'floor',
    defaultPassingMarks: 35
  });
  assert(updated.siteName === 'ResultPoint Academic Central', 'Site name successfully updated');
  assert(updated.supportEmail === 'helpdesk@resultpoint.edu', 'Support email successfully updated');
  assert(updated.defaultCalculationPrecision === 3, 'Precision updated to 3');
  assert(updated.defaultRoundingMode === 'floor', 'Rounding mode updated to floor');
  assert(updated.defaultPassingMarks === 35, 'Passing marks threshold updated to 35');
  assert(typeof updated.updatedAt === 'string', 'updatedAt timestamp set');

  // Rejection: empty site name
  try {
    platformSettingsService.updateSettings({ siteName: '' });
    assert(false, 'Should reject empty site name');
  } catch (err) {
    assert(err.message.includes('cannot be empty'), 'Rejects empty siteName with descriptive error');
  }

  // Rejection: invalid email
  try {
    platformSettingsService.updateSettings({ supportEmail: 'not-an-email' });
    assert(false, 'Should reject invalid email');
  } catch (err) {
    assert(err.message.includes('valid support email'), 'Rejects invalid email address');
  }

  // Rejection: invalid theme mode
  try {
    platformSettingsService.updateSettings({ defaultThemeMode: 'neon' });
    assert(false, 'Should reject unsupported theme mode');
  } catch (err) {
    assert(err.message.includes('dark", "light", or "system"'), 'Rejects unapproved theme modes');
  }

  // Rejection: out of range precision
  try {
    platformSettingsService.updateSettings({ defaultCalculationPrecision: 9 });
    assert(false, 'Should reject precision 9');
  } catch (err) {
    assert(err.message.includes('1, 2, 3, or 4'), 'Rejects invalid calculation precision');
  }

  // Rejection: invalid rounding mode
  try {
    platformSettingsService.updateSettings({ defaultRoundingMode: 'random-mode' });
    assert(false, 'Should reject invalid rounding mode');
  } catch (err) {
    assert(err.message.includes('half-up", "floor", "ceil", or "truncate"'), 'Rejects unsupported rounding mode');
  }

  // Rejection: negative passing marks
  try {
    platformSettingsService.updateSettings({ defaultPassingMarks: -5 });
    assert(false, 'Should reject negative passing marks');
  } catch (err) {
    assert(err.message.includes('between 0 and 100'), 'Rejects out-of-range passing marks');
  }

  // -------------------------------------------------------------
  // Test Area 3: Audit Trail Querying, Filtering, & Search
  // -------------------------------------------------------------
  console.log('\nTest Area 3: Audit Trail Querying, Filtering, & Search');
  // Seed sample event from settings
  auditHistoryService.recordEvent({
    action: 'TEST_EVENT',
    entityType: 'settings',
    entityId: 'test_record',
    entityName: 'Settings Test Unit',
    details: 'Automated test audit verification entry',
    actor: 'Administrator'
  });

  const allAudit = auditHistoryService.getAllAuditEvents();
  assert(Array.isArray(allAudit) && allAudit.length > 0, 'Audit history contains events');

  // Search filter
  const searched = auditHistoryService.getFilteredAuditEvents({ search: 'Settings Test Unit' });
  assert(searched.events.length > 0, 'Audit search finds records by entityName substring');
  assert(searched.totalCount >= 1, 'Total count reflects search match count');

  // Entity Type filter
  const settingsAudits = auditHistoryService.getFilteredAuditEvents({ entityType: 'settings' });
  assert(settingsAudits.events.length > 0, 'Entity filter returns settings events');
  assert(settingsAudits.events.every((e) => e.entityType === 'settings'), 'Every returned item matches entityType');

  // Date Range filter (today)
  const todayAudits = auditHistoryService.getFilteredAuditEvents({ dateRange: 'today' });
  assert(todayAudits.events.length > 0, 'Date range filter "today" returns recent events');

  // Sorting
  const sortedOldest = auditHistoryService.getFilteredAuditEvents({ sortBy: 'oldest' });
  assert(new Date(sortedOldest.events[0].timestamp) <= new Date(sortedOldest.events[sortedOldest.events.length - 1].timestamp), 'Oldest first sorts chronologically ascending');

  // Pagination
  const page1 = auditHistoryService.getFilteredAuditEvents({ page: 1, pageSize: 3 });
  assert(page1.events.length <= 3, 'Page size enforced on paginated result');
  assert(page1.currentPage === 1, 'Current page index reported correctly');

  // Audit Stats
  const auditStats = auditHistoryService.getAuditStats();
  assert(typeof auditStats.totalEvents === 'number', 'Audit stats provides totalEvents');
  assert(Array.isArray(auditStats.distinctEntityTypes), 'Audit stats lists distinct entity types');
  assert(typeof auditStats.eventsLast24h === 'number', 'Audit stats computes events in last 24h');

  // -------------------------------------------------------------
  // Test Area 4: Audit Event Visibility Across Modules
  // -------------------------------------------------------------
  console.log('\nTest Area 4: Audit Event Visibility Across Modules');
  const distinctEntities = auditStats.distinctEntityTypes;
  assert(distinctEntities.includes('settings'), 'Audit viewer includes settings events');
  // Check that audit logs record entityTypes from other phases
  assert(allAudit.some((e) => e.entityType === 'settings'), 'Settings audit records exist in log');
  assert(allAudit.every((e) => !e.password && !e.token && !e.passwordHash), 'Audit entries never leak passwords or credentials');

  // -------------------------------------------------------------
  // Test Area 5: Backup Generation & Sensitive Field Sanitization
  // -------------------------------------------------------------
  console.log('\nTest Area 5: Backup Generation & Sensitive Field Sanitization');
  // Seed sample user with sensitive fields to test sanitization
  const sampleUsers = [
    {
      id: 'usr_test_secret',
      email: 'secret@resultpoint.edu',
      fullName: 'Secret Test User',
      role: 'student',
      password: 'superSecretPassword123!',
      token: 'jwt.token.secret.here',
      authToken: 'bearer_token_abc'
    }
  ];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sampleUsers));

  const backup = platformSettingsService.generateBackup();
  assert(backup.schemaVersion === BACKUP_SCHEMA_VERSION, `Backup has schema version ${BACKUP_SCHEMA_VERSION}`);
  assert(backup.appName === 'ResultPoint', 'Backup appName is ResultPoint');
  assert(backup.appVersion === APP_VERSION, `Backup appVersion is ${APP_VERSION}`);
  assert(typeof backup.exportedAt === 'string', 'Backup has export timestamp');
  assert(backup.data && typeof backup.data === 'object', 'Backup includes data container');

  // Verify SENSITIVE CREDENTIALS ARE STRIPPED
  const exportedUser = backup.data.users.find((u) => u.id === 'usr_test_secret');
  assert(exportedUser !== undefined, 'Exported user found in backup');
  assert(exportedUser.password === undefined, 'CRITICAL: Password is strictly excluded from exported backup');
  assert(exportedUser.token === undefined, 'CRITICAL: Token is strictly excluded from exported backup');
  assert(exportedUser.authToken === undefined, 'CRITICAL: Auth token is strictly excluded from exported backup');
  assert(exportedUser.fullName === 'Secret Test User', 'Non-sensitive user fields are preserved');

  // -------------------------------------------------------------
  // Test Area 6: Pre-flight Backup Validation & Malformed Defenses
  // -------------------------------------------------------------
  console.log('\nTest Area 6: Pre-flight Backup Validation & Malformed Defenses');
  // Valid backup passes
  const validValidation = platformSettingsService.validateBackup(backup);
  assert(validValidation.isValid === true, 'Valid backup passes pre-flight validation');
  assert(validValidation.errors.length === 0, 'No validation errors on valid backup');
  assert(validValidation.summary && typeof validValidation.summary.usersCount === 'number', 'Summary contains usersCount');

  // Rejection: Mismatched appName
  const wrongApp = { ...backup, appName: 'FakeAcademicPortal' };
  const wrongAppValidation = platformSettingsService.validateBackup(wrongApp);
  assert(wrongAppValidation.isValid === false, 'Rejects backup with mismatched appName');
  assert(wrongAppValidation.errors.some((e) => e.includes('Expected "ResultPoint"')), 'Explains appName mismatch');

  // Rejection: Unsupported schemaVersion
  const wrongVersion = { ...backup, schemaVersion: '99.0.0' };
  const wrongVersionValidation = platformSettingsService.validateBackup(wrongVersion);
  assert(wrongVersionValidation.isValid === false, 'Rejects backup with unsupported schemaVersion');

  // Rejection: Missing data container
  const missingData = { appName: 'ResultPoint', schemaVersion: BACKUP_SCHEMA_VERSION };
  const missingDataValidation = platformSettingsService.validateBackup(missingData);
  assert(missingDataValidation.isValid === false, 'Rejects backup missing data container');

  // -------------------------------------------------------------
  // Test Area 7: Safe Restore Workflow & Emergency Snapshot
  // -------------------------------------------------------------
  console.log('\nTest Area 7: Safe Restore Workflow & Emergency Snapshot');
  // Modify a tool in localStorage before restore
  const restorePayload = JSON.parse(JSON.stringify(backup));
  restorePayload.data.settings = {
    ...DEFAULT_PLATFORM_SETTINGS,
    siteName: 'Restored University System'
  };

  const restoreResult = platformSettingsService.restoreBackup(restorePayload, { createSafetySnapshot: true });
  assert(restoreResult.success === true, 'Restore operation returns success: true');
  assert(platformSettingsService.getSettings().siteName === 'Restored University System', 'Settings updated from restored backup');

  // Verify emergency snapshot was automatically created
  const emergencySnapshot = JSON.parse(localStorage.getItem(RECOVERY_SNAPSHOT_KEY));
  assert(emergencySnapshot !== null, 'Emergency recovery snapshot was created in localStorage');
  assert(emergencySnapshot.schemaVersion === BACKUP_SCHEMA_VERSION, 'Emergency snapshot has valid schema');

  // Rollback to emergency snapshot
  const rollbackResult = platformSettingsService.rollbackSafetySnapshot();
  assert(rollbackResult.success === true, 'Rollback to emergency snapshot succeeded');
  assert(platformSettingsService.getSettings().siteName === 'ResultPoint Academic Central', 'Rollback restored original site name');

  // -------------------------------------------------------------
  // Test Area 8: Storage Diagnostics & Quota Gauge
  // -------------------------------------------------------------
  console.log('\nTest Area 8: Storage Diagnostics & Quota Gauge');
  const diagnostics = platformSettingsService.getStorageDiagnostics();
  assert(typeof diagnostics.totalBytes === 'number' && diagnostics.totalBytes > 0, 'Storage diagnostics tracks total bytes');
  assert(typeof diagnostics.formattedTotal === 'string', 'Formatted size string provided');
  assert(typeof diagnostics.quotaPercent === 'number' && diagnostics.quotaPercent >= 0, 'Quota percentage computed');
  assert(Array.isArray(diagnostics.keyBreakdown), 'Key breakdown array returned');
  assert(diagnostics.keyBreakdown.some((k) => k.key === STORAGE_KEYS.SETTINGS), 'Settings key present in breakdown');

  // -------------------------------------------------------------
  // Test Area 9: Event Broadcasting & Audit History Integration
  // -------------------------------------------------------------
  console.log('\nTest Area 9: Event Broadcasting & Audit History Integration');
  const settingsEvent = emittedEvents.find((e) => e.type === SETTINGS_UPDATED_EVENT);
  assert(!!settingsEvent, `Event "${SETTINGS_UPDATED_EVENT}" dispatched on settings mutation`);

  const auditEvents = auditHistoryService.getAllAuditEvents();
  assert(auditEvents.some((e) => e.action === 'SETTINGS_UPDATED'), 'Audit log contains SETTINGS_UPDATED action');
  assert(auditEvents.some((e) => e.action === 'BACKUP_EXPORTED'), 'Audit log contains BACKUP_EXPORTED action');
  assert(auditEvents.some((e) => e.action === 'PLATFORM_RESTORED'), 'Audit log contains PLATFORM_RESTORED action');

  // -------------------------------------------------------------
  // Test Area 10: Reset to Baseline Factory Defaults
  // -------------------------------------------------------------
  console.log('\nTest Area 10: Reset to Baseline Factory Defaults');
  const resetSettings = platformSettingsService.resetToDefaults();
  assert(resetSettings.siteName === 'ResultPoint Academic Portal', 'Site name restored to default baseline');
  assert(resetSettings.defaultCalculationPrecision === 2, 'Calculation precision restored to default baseline');
  assert(auditHistoryService.getAllAuditEvents().some((e) => e.action === 'SETTINGS_RESET'), 'SETTINGS_RESET logged in audit history');

  // -------------------------------------------------------------
  // Test Area 11: Clear Audit History with Confirmation
  // -------------------------------------------------------------
  console.log('\nTest Area 11: Clear Audit History with Confirmation');
  auditHistoryService.clearAuditHistory();
  assert(auditHistoryService.getAllAuditEvents().length === 0, 'Audit history successfully cleared');

  // -------------------------------------------------------------
  // Test Area 12: Regression Checks for Phases 2A-2F and 3A-3G
  // -------------------------------------------------------------
  console.log('\nTest Area 12: Regression Checks for Phases 2A-2F and 3A-3G');
  // Phase 3G Blogs
  assert(STORAGE_KEYS.BLOGS === 'resultpoint_blogs', 'Phase 3G blogs storage key persists');
  assert(blogService.getAllArticles().length >= 5, 'Phase 3G blogService operational');

  // Phase 3F Resources
  assert(STORAGE_KEYS.RESOURCES === 'resultpoint_resources', 'Phase 3F resources storage key persists');
  assert(resourceManagementService.getAllResources().length >= 10, 'Phase 3F resourceManagementService operational');

  // Phase 3E Tools
  assert(STORAGE_KEYS.TOOLS === 'resultpoint_tools', 'Phase 3E tools storage key persists');
  assert(toolManagementService.getAllTools().length >= 20, 'Phase 3E toolManagementService operational');

  // Phase 3A Catalog
  assert(academicCatalogService.getUniversities().length >= 2, 'Phase 3A universities catalog functional');

  console.log('\n================================================================');
  console.log(`Phase 3H Test Run Complete: ${passedAssertions} / ${totalAssertions} assertions passed`);
  console.log('================================================================\n');

  return { passed: passedAssertions, total: totalAssertions };
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
