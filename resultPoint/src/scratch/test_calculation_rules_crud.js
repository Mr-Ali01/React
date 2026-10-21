/**
 * ResultPoint Admin Dashboard — Phase 2E: Calculation Rules Management Test Suite
 */

// Setup Mock LocalStorage before importing services
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

class CustomEventMock {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict ? eventInitDict.detail : null;
  }
}
global.CustomEvent = CustomEventMock;
global.Event = CustomEventMock;
global.window = {
  dispatchEvent: () => {}
};

// Dynamic imports after globals are ready
const { academicCatalogService } = await import('../services/academicCatalogService.js');
const { academicCalculationEngine } = await import('../services/academicCalculationEngine.js');
const { auditHistoryService } = await import('../services/auditHistoryService.js');
const { STORAGE_KEYS } = await import('../services/storageKeys.js');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('===============================================================');
  console.log('ResultPoint Phase 2E: Calculation Rules Management Test Suite');
  console.log('===============================================================\n');

  // Test 1: Initialization and preservation of existing calculation rules
  console.log('--- Test 1: Seed Calculation Rules Initialization ---');
  academicCatalogService.resetToDefaults();
  const initialRules = academicCatalogService.getCalculationRules();
  assert(Array.isArray(initialRules) && initialRules.length >= 4, 'Seed catalog contains at least 4 default calculation rules');

  const jntuhRule = initialRules.find((r) => r.id === 'jntuh-r18-r22-rule');
  assert(Boolean(jntuhRule), 'JNTUH R18/R22 rule exists in seed catalog');
  assert(jntuhRule.percentageFormula === '(CGPA - 0.5) * 10', 'JNTUH rule uses standard formula (CGPA - 0.5) * 10');
  assert(jntuhRule.decimalPrecision === 2 && jntuhRule.roundingMode === 'round', 'JNTUH rule specifies 2 decimal places and half-up rounding');

  const ouRule = initialRules.find((r) => r.id === 'ou-cbcs-standard-rule');
  assert(Boolean(ouRule), 'Osmania University standard rule exists in seed catalog');
  assert(ouRule.percentageFormula === 'CGPA * 10', 'OU rule uses standard formula CGPA * 10');

  // Test 2: Listing and retrieving calculation rules
  console.log('\n--- Test 2: Listing and Retrieving Calculation Rules ---');
  const retrievedJntuh = academicCatalogService.getCalculationRule('jntuh-r18-r22-rule');
  assert(retrievedJntuh && retrievedJntuh.id === 'jntuh-r18-r22-rule', 'Can retrieve rule by unique ID');
  const nonExistent = academicCatalogService.getCalculationRule('non-existent-rule-id');
  assert(nonExistent === null, 'Returns null for non-existent rule ID');

  // Test 3: Successful creation and metadata updates
  console.log('\n--- Test 3: Rule Creation and Metadata Updates ---');
  const customRuleData = {
    id: 'test-autonomous-rule',
    name: 'Autonomous College Conversion Rule',
    description: 'Custom formula for autonomous engineering college',
    ruleType: 'percentage',
    percentageFormula: '(CGPA - 0.5) * 10',
    decimalPrecision: 3,
    roundingMode: 'floor',
    minPassingGradePoints: 4.5,
    status: 'active',
    isOfficial: false
  };
  const createdRule = academicCatalogService.addCalculationRule(customRuleData);
  assert(createdRule && createdRule.id === 'test-autonomous-rule', 'Successfully created custom calculation rule');
  assert(createdRule.decimalPrecision === 3 && createdRule.roundingMode === 'floor', 'Preserves precision and rounding parameters');

  const updatedRule = academicCatalogService.updateCalculationRule('test-autonomous-rule', {
    name: 'Updated Autonomous Rule Name',
    decimalPrecision: 2,
    roundingMode: 'round'
  });
  assert(updatedRule.name === 'Updated Autonomous Rule Name', 'Successfully updated rule name');
  assert(updatedRule.decimalPrecision === 2 && updatedRule.roundingMode === 'round', 'Successfully updated precision and rounding');

  // Test 4: Duplicate-ID rejection
  console.log('\n--- Test 4: Duplicate-ID Rejection ---');
  let duplicateThrown = false;
  try {
    academicCatalogService.addCalculationRule({
      id: 'test-autonomous-rule',
      name: 'Duplicate ID Rule',
      ruleType: 'percentage',
      percentageFormula: 'CGPA * 10'
    });
  } catch (err) {
    duplicateThrown = true;
    assert(err.message.toLowerCase().includes('already exists'), 'Duplicate ID throws descriptive error');
  }
  assert(duplicateThrown, 'Rejected attempt to register duplicate calculation rule ID');

  // Test 5: Invalid or unsupported rule configurations
  console.log('\n--- Test 5: Invalid or Unsupported Formula Rejection & Security Checks ---');
  // Script / eval injection attempt
  let scriptThrown = false;
  try {
    academicCatalogService.addCalculationRule({
      id: 'malicious-rule',
      name: 'Malicious Rule',
      ruleType: 'percentage',
      percentageFormula: 'eval("window.alert(1)")'
    });
  } catch (err) {
    scriptThrown = true;
    assert(err.message.toLowerCase().includes('security') || err.message.toLowerCase().includes('unsafe') || err.message.toLowerCase().includes('declarative'), 'Blocks unsafe script / eval token in formula');
  }
  assert(scriptThrown, 'Rejects code injection / script tokens');

  // Unsupported formula pattern
  let invalidPatternThrown = false;
  try {
    academicCatalogService.addCalculationRule({
      id: 'invalid-pattern-rule',
      name: 'Invalid Pattern Rule',
      ruleType: 'percentage',
      percentageFormula: 'Math.sin(CGPA) + 5'
    });
  } catch (err) {
    invalidPatternThrown = true;
    assert(err.message.toLowerCase().includes('linear') || err.message.toLowerCase().includes('unsupported') || err.message.toLowerCase().includes('declarative'), 'Rejects non-linear / unsupported formula pattern');
  }
  assert(invalidPatternThrown, 'Rejects arbitrary unapproved mathematical expressions');

  // Invalid rounding mode
  let invalidRoundingThrown = false;
  try {
    academicCatalogService.addCalculationRule({
      id: 'invalid-rounding-rule',
      name: 'Invalid Rounding Rule',
      ruleType: 'percentage',
      percentageFormula: 'CGPA * 10',
      roundingMode: 'random-mode'
    });
  } catch (err) {
    invalidRoundingThrown = true;
  }
  assert(invalidRoundingThrown, 'Rejects invalid rounding mode');

  // Test 6: Invalid catalog references rejection
  console.log('\n--- Test 6: Invalid Catalog Entity References ---');
  let invalidUnivThrown = false;
  try {
    academicCatalogService.addCalculationRule({
      id: 'invalid-univ-ref-rule',
      name: 'Invalid Univ Reference Rule',
      ruleType: 'percentage',
      universityId: 'nonexistent-university-id',
      percentageFormula: 'CGPA * 10'
    });
  } catch (err) {
    invalidUnivThrown = true;
    assert(err.message.toLowerCase().includes('university'), 'Rejects rule with invalid university reference');
  }
  assert(invalidUnivThrown, 'Prevents calculation rule from referencing nonexistent university');

  // Test 7: Active-to-archived and archived-to-active transitions
  console.log('\n--- Test 7: Active / Archived Status Transitions ---');
  const archived = academicCatalogService.archiveCalculationRule('test-autonomous-rule');
  assert(archived.status === 'archived', 'Rule successfully transitioned to archived status');

  const reactivated = academicCatalogService.setCalculationRuleStatus('test-autonomous-rule', 'active');
  assert(reactivated.status === 'active', 'Rule successfully reactivated to active status');

  // Test 8: Dependency detection and guarded deletion
  console.log('\n--- Test 8: Dependency Detection and Guarded Deletion ---');
  // First, check JNTUH rule which is referenced by JNTUH B.Tech R22 regulation
  const refCheck = academicCatalogService.checkCalculationRuleReferences('jntuh-r18-r22-rule');
  assert(refCheck.hasReferences === true, 'Correctly detects references to jntuh-r18-r22-rule');
  assert(refCheck.regulations.length >= 1, 'Identifies referenced regulations');

  let blockedDelete = false;
  try {
    academicCatalogService.deleteCalculationRule('jntuh-r18-r22-rule');
  } catch (err) {
    blockedDelete = true;
    assert(err.message.toLowerCase().includes('cannot delete') || err.message.toLowerCase().includes('referenced'), 'Blocks deletion with informative error suggesting archival');
  }
  assert(blockedDelete, 'Guarded delete successfully prevents deletion of referenced calculation rule');

  // An unreferenced rule can be deleted
  const deleted = academicCatalogService.deleteCalculationRule('test-autonomous-rule');
  assert(deleted && deleted.id === 'test-autonomous-rule', 'Unreferenced rule can be cleanly deleted');
  assert(academicCatalogService.getCalculationRule('test-autonomous-rule') === null, 'Deleted rule no longer exists in registry');

  // Test 9: Historical calculation / result preservation after rule updates
  console.log('\n--- Test 9: Historical Result Preservation ---');
  // Simulate historical result stored in localStorage
  const historicalRecord = {
    id: 'res-historical-001',
    studentName: 'Test Student',
    universityId: 'jntuh',
    courseId: 'btech-cse',
    regulationId: 'jntuh-cse-r18',
    cgpa: 8.50,
    percentage: 80.00, // (8.5 - 0.5) * 10
    calculationRuleId: 'jntuh-r18-r22-rule',
    timestamp: '2024-05-15T10:00:00Z'
  };
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([historicalRecord]));

  // Update JNTUH rule metadata
  academicCatalogService.updateCalculationRule('jntuh-r18-r22-rule', {
    description: 'Updated JNTUH description for test'
  });

  // Verify historical record remains unchanged
  const savedResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  assert(savedResults[0].percentage === 80.00 && savedResults[0].cgpa === 8.50, 'Historical student results remain completely unchanged after rule updates');

  // Also check referential integrity detects the student result
  const refCheckWithResult = academicCatalogService.checkCalculationRuleReferences('jntuh-r18-r22-rule');
  assert(refCheckWithResult.resultsCount >= 1, 'Correctly detects dependent historical calculation results');

  // Test 10: Audit-history entries
  console.log('\n--- Test 10: Audit History Logging ---');
  const auditEntries = auditHistoryService.getAllAuditEvents();
  const addRuleLog = auditEntries.find((l) => l.action === 'CALCULATION_RULE_ADDED');
  assert(Boolean(addRuleLog), 'Recorded CALCULATION_RULE_ADDED in audit history');
  const updateRuleLog = auditEntries.find((l) => l.action === 'CALCULATION_RULE_UPDATED');
  assert(Boolean(updateRuleLog), 'Recorded CALCULATION_RULE_UPDATED in audit history');
  const archiveRuleLog = auditEntries.find((l) => l.action === 'CALCULATION_RULE_ARCHIVED');
  assert(Boolean(archiveRuleLog), 'Recorded CALCULATION_RULE_ARCHIVED in audit history');
  const deleteRuleLog = auditEntries.find((l) => l.action === 'CALCULATION_RULE_DELETED');
  assert(Boolean(deleteRuleLog), 'Recorded CALCULATION_RULE_DELETED in audit history');

  // Test 11: Correct calculation-engine integration for supported rules
  console.log('\n--- Test 11: Calculation Engine Integration ---');
  // JNTUH formula: (8.25 - 0.5) * 10 = 77.50%
  const jntuhCalculated = academicCalculationEngine.convertCGPAToPercentage(8.25, 'jntuh-r18-r22-rule');
  assert(jntuhCalculated.percentage === 77.5, 'JNTUH R18/R22 formula converts 8.25 CGPA to 77.50% independently');

  // OU formula: 8.25 * 10 = 82.50%
  const ouCalculated = academicCalculationEngine.convertCGPAToPercentage(8.25, 'ou-cbcs-standard-rule');
  assert(ouCalculated.percentage === 82.5, 'Osmania University CBCS formula converts 8.25 CGPA to 82.50% independently');

  // AICTE formula: (8.25 - 0.75) * 10 = 75.00%
  const aicteCalculated = academicCalculationEngine.convertCGPAToPercentage(8.25, 'aicte-75-formula-rule');
  assert(aicteCalculated.percentage === 75.0, 'AICTE formula converts 8.25 CGPA to 75.00% independently');

  // CBSE formula: 8.25 * 9.5 = 78.375 -> rounded to 2 decimals = 78.38%
  const cbseCalculated = academicCalculationEngine.convertCGPAToPercentage(8.25, 'cbse-95-formula-rule');
  assert(cbseCalculated.percentage === 78.38, 'CBSE formula converts 8.25 CGPA to 78.38% with 2 decimal precision and half-up rounding');

  // executeCalculationRule interface test
  const engineResult = academicCalculationEngine.executeCalculationRule(
    academicCatalogService.getCalculationRule('jntuh-r18-r22-rule'),
    { cgpa: 8.0 }
  );
  assert(engineResult && engineResult.result === 75.0 && engineResult.ruleId === 'jntuh-r18-r22-rule', 'executeCalculationRule returns standardized structured execution envelope');

  // Test 12: OU and JNTUH rule separation
  console.log('\n--- Test 12: OU and JNTUH Rule Separation ---');
  const jntuhFor7_5 = academicCalculationEngine.convertCGPAToPercentage(7.5, 'jntuh-r18-r22-rule'); // (7.5 - 0.5) * 10 = 70.0
  const ouFor7_5 = academicCalculationEngine.convertCGPAToPercentage(7.5, 'ou-cbcs-standard-rule'); // 7.5 * 10 = 75.0
  assert(jntuhFor7_5.percentage === 70.0, 'JNTUH yields 70.0% for 7.5 CGPA');
  assert(ouFor7_5.percentage === 75.0, 'OU yields 75.0% for 7.5 CGPA');
  assert(jntuhFor7_5.percentage !== ouFor7_5.percentage, 'JNTUH and OU percentage rules remain strictly isolated without global cross-contamination');

  // Test 13: Regression protection for the OU BCA/MCA S-grade behavior
  console.log('\n--- Test 13: OU BCA/MCA S-Grade Protection ---');
  const ouScale = academicCatalogService.getGradingScales().find((s) => s.id === 'ou-s-grade-10-point');
  assert(Boolean(ouScale), 'OU S-grade scale is preserved in catalog');
  const sTier = ouScale.grades.find((g) => g.grade === 'S');
  assert(Boolean(sTier) && sTier.points === 10, 'OU S-grade maintains 10 grade points and is not substituted by O grade');

  // Test 14: Assign Rule to Regulation with Versioning Option
  console.log('\n--- Test 14: Assign Rule to Regulation with Immutable Versioning ---');
  const publishedVersion = academicCatalogService.assignCalculationRuleToRegulation(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r22',
    'aicte-75-formula-rule',
    { publishNewVersion: true, ruleVersion: 'R22_AICTE_V2' }
  );
  assert(publishedVersion && publishedVersion.ruleVersion === 'R22_AICTE_V2', 'Successfully published new immutable regulation version with new calculation rule');
  assert(publishedVersion.percentageFormula === '(CGPA - 0.75) * 10', 'New version bound to AICTE calculation formula');

  console.log('\n===============================================================');
  console.log(`✅ All Phase 2E Tests Passed! (${passedCount}/${totalCount} assertions)`);
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Phase 2E Test Suite Failure:\n', err);
  process.exit(1);
});
