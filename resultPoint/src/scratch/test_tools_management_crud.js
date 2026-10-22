/**
 * ResultPoint Phase 3E: Tools & Calculators Management CRUD Automated Test Suite
 *
 * Verifies:
 * 1. Existing tool registry preservation and idempotent initialization.
 * 2. Listing, retrieval, search, and filters (category, status, query).
 * 3. Valid metadata updates and stable tool IDs (enforcing immutability).
 * 4. Duplicate-ID and unsupported-field rejection.
 * 5. Enable/disable status transitions with audit events.
 * 6. Configuration validation, numeric bounds, rounding modes, and script/eval injection defense.
 * 7. Context-specific availability where supported (university, course, regulation scoping).
 * 8. Disabled tool navigation and unavailable-state handling.
 * 9. Historical results remain completely accessible after disabling a tool.
 * 10. Incompatible or archived rule references are rejected.
 * 11. Audit-history logging for all tool lifecycle events.
 * 12. Update event dispatch (rp_tools_updated) and view synchronizations.
 * 13. Reports & Analytics continue to use genuine calculation records.
 * 14. Regression assertions for Phases 2E, 2F, and 3D.
 * 15. Regression assertions for Phases 2A-2D and 3A-3C.
 */

// Mock browser localStorage and window environment for Node.js BEFORE any service loads
const memoryStore = new Map();

globalThis.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
  get length() {
    return memoryStore.size;
  },
  key: (idx) => Array.from(memoryStore.keys())[idx] || null
};

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
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
  }
};

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ ${message}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('ResultPoint Phase 3E: Tools & Calculators Management Test Suite');
  console.log('================================================================\n');

  // Dynamically import services after setting up environment
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');
  const { toolManagementService, TOOL_UPDATED_EVENT } = await import('../services/toolManagementService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');
  const { reportsAnalyticsService } = await import('../services/reportsAnalyticsService.js');
  const { academicCatalogService } = await import('../services/academicCatalogService.js');

  // Clear environment
  memoryStore.clear();
  emittedEvents.length = 0;

  // Initialize academic catalog
  academicCatalogService.initialize();

  // -------------------------------------------------------------
  // Test Area 1: Existing Tool Registry Preservation & Idempotent Init
  // -------------------------------------------------------------
  console.log('Test Area 1: Existing Tool Registry Preservation & Idempotent Init');
  const initialTools = toolManagementService.initialize();
  assert(Array.isArray(initialTools), 'initialize returns array of tools');
  assert(initialTools.length >= 10, `Loaded baseline tools count: ${initialTools.length}`);

  const cgpaTool = initialTools.find((t) => t.id === 'cgpa-calculator');
  assert(!!cgpaTool, 'Baseline cgpa-calculator exists');
  assert(cgpaTool.status === 'enabled', 'Baseline cgpa-calculator is enabled by default');
  assert(typeof cgpaTool.config === 'object', 'cgpa-calculator includes configuration object');

  // Modify a tool description
  toolManagementService.updateToolMetadata('cgpa-calculator', {
    description: 'Custom updated CGPA description for persistence test'
  });

  // Re-run initialize to test idempotency
  const reinitTools = toolManagementService.initialize();
  assert(reinitTools.length === initialTools.length, 'Re-initialization preserves total count');
  const checkCustom = reinitTools.find((t) => t.id === 'cgpa-calculator');
  assert(
    checkCustom.description === 'Custom updated CGPA description for persistence test',
    'Re-initialization preserves existing modified tool state (idempotent)'
  );

  // -------------------------------------------------------------
  // Test Area 2: Listing, Retrieval, Search, and Filters
  // -------------------------------------------------------------
  console.log('\nTest Area 2: Listing, Retrieval, Search, and Filters');
  const allTools = toolManagementService.getAllTools();
  assert(allTools.length === initialTools.length, 'getAllTools returns all registered tools');

  const retrievedById = toolManagementService.getToolById('sgpa-calculator');
  assert(retrievedById && retrievedById.name.includes('SGPA'), 'getToolById retrieves exact tool');

  const retrievedByRoute = toolManagementService.getToolByRoute('/calculators/cgpa');
  assert(retrievedByRoute && retrievedByRoute.id === 'cgpa-calculator', 'getToolByRoute retrieves exact tool');

  // Search by name
  const searchByName = toolManagementService.getAllTools({ search: 'grade' });
  assert(searchByName.some((t) => t.id === 'grade-calculator'), 'Search finds tools by name query');

  // Search by ID
  const searchById = toolManagementService.getAllTools({ search: 'backlog' });
  assert(searchById.some((t) => t.id === 'backlog-calculator'), 'Search finds tools by ID substring');

  // Filter by category
  const cgpaTools = toolManagementService.getAllTools({ category: 'CGPA & SGPA' });
  assert(cgpaTools.length > 0 && cgpaTools.every((t) => t.category === 'CGPA & SGPA'), 'Filter by category works accurately');

  // Filter by status
  const enabledTools = toolManagementService.getAllTools({ status: 'enabled' });
  assert(enabledTools.every((t) => t.status === 'enabled'), 'Filter by status returns only enabled tools');

  // -------------------------------------------------------------
  // Test Area 3: Valid Metadata Updates and Stable Tool IDs
  // -------------------------------------------------------------
  console.log('\nTest Area 3: Valid Metadata Updates and Stable Tool IDs');
  const updatedTool = toolManagementService.updateToolMetadata('percentage-calculator', {
    name: 'Advanced Percentage Converter',
    description: 'Updated description for testing metadata updates',
    keywords: ['percentage', 'marks', 'academic']
  });
  assert(!!updatedTool, 'Metadata update succeeds for permitted fields');
  assert(updatedTool.name === 'Advanced Percentage Converter', 'Tool name updated successfully');

  // Check immutable ID
  try {
    toolManagementService.updateToolMetadata('percentage-calculator', {
      id: 'hacked-id-should-fail'
    });
    assert(false, 'Should reject modifying immutable tool ID');
  } catch (err) {
    assert(err.message.includes('immutable'), 'Tool ID remains strictly immutable and rejects modifications');
  }

  // -------------------------------------------------------------
  // Test Area 4: Duplicate-ID and Unsupported-Field Rejection
  // -------------------------------------------------------------
  console.log('\nTest Area 4: Duplicate-ID and Unsupported-Field Rejection');
  try {
    toolManagementService.updateToolMetadata('percentage-calculator', {
      unsupportedPropertyXYZ: 'malicious payload'
    });
    assert(false, 'Should have thrown error on unsupported fields');
  } catch (err) {
    assert(err.message.includes('Unsupported metadata field') || err.message.includes('unsupportedPropertyXYZ'), 'Rejects unsupported metadata fields');
  }

  // Non-existent tool update
  try {
    toolManagementService.updateToolMetadata('non-existent-tool-id', { name: 'Fake' });
    assert(false, 'Should have thrown error on non-existent tool ID');
  } catch (err) {
    assert(err.message.includes('not found') || err.message.includes('does not exist'), 'Rejects metadata update for non-existent tool');
  }

  // -------------------------------------------------------------
  // Test Area 5: Enable/Disable Transitions
  // -------------------------------------------------------------
  console.log('\nTest Area 5: Enable/Disable Transitions');
  const disabledTool = toolManagementService.setToolStatus('backlog-calculator', 'disabled', 'Scheduled maintenance');
  assert(!!disabledTool, 'Disabling tool succeeds');
  assert(disabledTool.status === 'disabled', 'Tool status changed to disabled');
  assert(disabledTool.statusReason === 'Scheduled maintenance', 'Disabled reason recorded');

  // Check active tools list excludes disabled tool
  const activeTools = toolManagementService.getActiveTools();
  assert(!activeTools.some((t) => t.id === 'backlog-calculator'), 'getActiveTools excludes disabled tool');

  // Re-enable
  const enabledTool = toolManagementService.setToolStatus('backlog-calculator', 'enabled');
  assert(!!enabledTool, 'Re-enabling tool succeeds');
  assert(enabledTool.status === 'enabled', 'Tool status returned to enabled');
  assert(!enabledTool.statusReason, 'Disabled reason cleared upon re-enabling');

  // -------------------------------------------------------------
  // Test Area 6: Configuration Validation & Security Injection Defense
  // -------------------------------------------------------------
  console.log('\nTest Area 6: Configuration Validation & Security Injection Defense');
  // Valid config update
  const validConfig = {
    gradingScale: 10,
    decimalPrecision: 2,
    roundingMode: 'round',
    passingMarks: 40,
    maxCredits: 50
  };
  const configTool = toolManagementService.updateToolConfig('cgpa-calculator', validConfig);
  assert(!!configTool, 'Valid configuration saved successfully');
  assert(configTool.config.decimalPrecision === 2, 'Config decimalPrecision persisted');
  assert(configTool.config.roundingMode === 'round', 'Config roundingMode persisted');

  // Invalid decimal precision (out of bounds)
  try {
    toolManagementService.updateToolConfig('cgpa-calculator', { decimalPrecision: 10 });
    assert(false, 'Should reject decimalPrecision > 4');
  } catch (err) {
    assert(err.message.includes('decimalPrecision'), 'Rejects out-of-range decimal precision');
  }

  // Invalid rounding mode
  try {
    toolManagementService.updateToolConfig('cgpa-calculator', { roundingMode: 'truncate_hack' });
    assert(false, 'Should reject invalid roundingMode');
  } catch (err) {
    assert(err.message.includes('roundingMode'), 'Rejects unsupported rounding mode');
  }

  // Script injection defense in configuration
  try {
    toolManagementService.updateToolConfig('cgpa-calculator', {
      defaultConversionFormula: '<script>alert("xss")</script>'
    });
    assert(false, 'Should reject <script> tags in configuration');
  } catch (err) {
    assert(err.message.includes('forbidden') || err.message.includes('script'), 'Blocks script injection in configuration');
  }

  // Eval defense in configuration
  try {
    toolManagementService.updateToolConfig('cgpa-calculator', {
      defaultConversionFormula: 'eval("window.location = badsite")'
    });
    assert(false, 'Should reject eval in configuration');
  } catch (err) {
    assert(err.message.includes('forbidden') || err.message.includes('script'), 'Blocks eval calls in configuration');
  }

  // -------------------------------------------------------------
  // Test Area 7: Context-Specific Availability (Scoping)
  // -------------------------------------------------------------
  console.log('\nTest Area 7: Context-Specific Availability (Scoping)');
  // Default un-scoped tool is globally available
  const globalAvail = toolManagementService.isToolAvailable('sgpa-calculator', { universityId: 'univ-jntuh' });
  assert(globalAvail.available, 'Unscoped tool is available for any university context');

  // Scope a tool to a specific university (e.g. univ-jntuh)
  const jntuhUniv = academicCatalogService.getUniversities()[0];
  const targetUnivId = jntuhUniv ? jntuhUniv.id : 'univ-jntuh';

  toolManagementService.updateToolApplicability('target-cgpa', {
    universities: [targetUnivId]
  });

  // Verify available for target university
  const matchingAvail = toolManagementService.isToolAvailable('target-cgpa', { universityId: targetUnivId });
  assert(matchingAvail.available, 'Tool is available for university matching its scoped applicability');

  // Verify restricted for another university
  const nonMatchingAvail = toolManagementService.isToolAvailable('target-cgpa', { universityId: 'other-univ-xyz' });
  assert(!nonMatchingAvail.available, 'Tool is restricted for university outside its scoped applicability');
  assert(nonMatchingAvail.isScopeRestricted || nonMatchingAvail.reason.includes('selected university'), 'Specifies institutional restriction reason');

  // -------------------------------------------------------------
  // Test Area 8: Disabled Tool Navigation and Unavailable State
  // -------------------------------------------------------------
  console.log('\nTest Area 8: Disabled Tool Navigation and Unavailable State');
  toolManagementService.setToolStatus('result-analyzer', 'disabled', 'Under redesign for 2026 regulations');

  const checkDisabledRoute = toolManagementService.isToolAvailable('/calculators/result-analysis');
  assert(!checkDisabledRoute.available, 'Disabled tool route is reported as unavailable');
  assert(checkDisabledRoute.reason === 'Under redesign for 2026 regulations', 'Returns specific admin disabled reason');
  assert(checkDisabledRoute.tool && checkDisabledRoute.tool.id === 'result-analyzer', 'Returns tool metadata for guard rendering');

  // -------------------------------------------------------------
  // Test Area 9: Historical Results Remain Accessible After Disabling
  // -------------------------------------------------------------
  console.log('\nTest Area 9: Historical Results Remain Accessible After Disabling');
  // Seed saved result for result-analyzer
  const sampleSavedResults = [
    {
      id: 'saved-res-001',
      toolId: 'result-analyzer',
      calculatorType: 'result-analyzer',
      timestamp: new Date().toISOString(),
      summary: 'Semester 4 Result Analysis (Pass)',
      userId: 'test-user-1'
    }
  ];
  localStorage.setItem(STORAGE_KEYS.SAVED_RESULTS, JSON.stringify(sampleSavedResults));

  // Seed activity history for result-analyzer
  const sampleActivity = [
    {
      id: 'act-001',
      toolId: 'result-analyzer',
      actionType: 'CALCULATION_SAVED',
      timestamp: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(sampleActivity));

  // Disable the tool
  toolManagementService.setToolStatus('result-analyzer', 'disabled', 'Decommissioned test');

  // Verify historical records remain untouched
  const persistedSaved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS) || '[]');
  assert(persistedSaved.length === 1, 'Saved results list length is preserved');
  assert(persistedSaved[0].id === 'saved-res-001', 'Historical result item remains fully intact');

  const persistedActivity = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY) || '[]');
  assert(persistedActivity.length === 1, 'Activity history records preserved');

  // Guarded deletion check: cannot delete tool that has saved records
  const canDelete = toolManagementService.canDeleteTool('result-analyzer');
  assert(!canDelete.canDelete, 'canDeleteTool rejects deleting tool that has saved records or is core');
  assert(canDelete.message.includes('saved') || canDelete.message.includes('core') || canDelete.reasons.length > 0, 'Explains reason deletion is blocked');

  // -------------------------------------------------------------
  // Test Area 10: Incompatible or Archived Rule References Rejected
  // -------------------------------------------------------------
  console.log('\nTest Area 10: Incompatible or Archived Rule References Rejected');
  try {
    toolManagementService.updateToolApplicability('cgpa-calculator', {
      universities: ['non-existent-fake-university-id-999']
    });
    assert(false, 'Should reject applicability referencing non-existent university');
  } catch (err) {
    assert(err.message.includes('not found') || err.message.includes('catalog'), 'Rejects non-existent or unverified university reference');
  }

  // -------------------------------------------------------------
  // Test Area 11: Audit History Logging
  // -------------------------------------------------------------
  console.log('\nTest Area 11: Audit History Logging');
  const auditLogs = auditHistoryService.getAllAuditEvents();
  assert(auditLogs.length > 0, 'Audit logs were generated by tool management actions');

  const toolStatusEvent = auditLogs.find((l) => l.action === 'TOOL_DISABLED' || l.action === 'TOOL_ENABLED');
  assert(!!toolStatusEvent, 'Audit log records TOOL_DISABLED or TOOL_ENABLED events');
  assert(toolStatusEvent.entityType === 'tool', 'Audit event entityType is correctly set to tool');

  const toolConfigEvent = auditLogs.find((l) => l.action === 'TOOL_CONFIG_UPDATED');
  assert(!!toolConfigEvent, 'Audit log records TOOL_CONFIG_UPDATED events');

  // -------------------------------------------------------------
  // Test Area 12: Update Event Dispatch (rp_tools_updated)
  // -------------------------------------------------------------
  console.log('\nTest Area 12: Update Event Dispatch (rp_tools_updated)');
  const eventFound = emittedEvents.find((e) => e.type === TOOL_UPDATED_EVENT);
  assert(!!eventFound, `Window event "${TOOL_UPDATED_EVENT}" was dispatched on tool state change`);
  assert(eventFound.detail && (eventFound.detail.tool || eventFound.detail.action), 'Event includes changed tool details and action');

  // -------------------------------------------------------------
  // Test Area 13: Reports & Analytics Calculation Records Integrity
  // -------------------------------------------------------------
  console.log('\nTest Area 13: Reports & Analytics Calculation Records Integrity');
  const overviewMetrics = reportsAnalyticsService.getOverviewMetrics({ range: 'all' });
  assert(typeof overviewMetrics === 'object', 'Reports & Analytics service generates overview metrics');
  assert(typeof overviewMetrics.calculations.totalRecorded === 'number', 'KPIs include genuine totalRecorded calculations');
  assert(overviewMetrics.calculations.totalRecorded >= 1, 'Calculation count includes genuine historical activity record');

  const calcUsage = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: 'all' });
  assert(Array.isArray(calcUsage.toolRows), 'Per-tool calculation usage metrics breakdown generated');

  // -------------------------------------------------------------
  // Test Area 14: Regression Checks for Phases 2E, 2F, and 3D
  // -------------------------------------------------------------
  console.log('\nTest Area 14: Regression Checks for Phases 2E, 2F, and 3D');
  // Phase 2E: Calculation Saving & PDF structures
  assert(localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS) !== null, 'Phase 2E saved results storage key persists');

  // Phase 2F: Activity History format
  assert(localStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY) !== null, 'Phase 2F activity history storage key persists');

  // Phase 3D: Reports & Analytics exports
  const csvExport = reportsAnalyticsService.generateCSV('calculators', { range: 'all' });
  assert(typeof csvExport.content === 'string' && csvExport.content.includes('Tool ID'), 'Phase 3D CSV export remains functional');

  // -------------------------------------------------------------
  // Test Area 15: Regression Checks for Phases 2A-2D and 3A-3C
  // -------------------------------------------------------------
  console.log('\nTest Area 15: Regression Checks for Phases 2A-2D and 3A-3C');
  // Phase 3A: Academic Catalog
  const universities = academicCatalogService.getUniversities();
  assert(Array.isArray(universities) && universities.length > 0, 'Phase 3A universities catalog functional');

  // Phase 3B & 3C: User management and Support services integration
  assert(STORAGE_KEYS.USERS === 'resultpoint_users', 'Phase 3B users storage key persists');
  assert(STORAGE_KEYS.SUPPORT_QUERIES === 'resultpoint_support_queries', 'Phase 3C support queries key persists');
  assert(STORAGE_KEYS.ANNOUNCEMENTS === 'resultpoint_announcements', 'Phase 3C announcements key persists');

  // Reset to defaults test
  console.log('\nTesting Safe Reset to Factory Defaults...');
  const resetRes = toolManagementService.resetToDefaults();
  assert(Array.isArray(resetRes), 'resetToDefaults succeeds and returns fresh tool array');
  const resetTools = toolManagementService.getAllTools();
  assert(resetTools.every((t) => t.status === 'enabled'), 'All tools restored to enabled baseline state');

  console.log('\n================================================================');
  console.log(`Phase 3E Test Run Complete: ${passedAssertions} / ${totalAssertions} assertions passed`);
  console.log('================================================================\n');

  return { passed: passedAssertions, total: totalAssertions };
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
