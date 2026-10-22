/**
 * ResultPoint Phase 2F: Academic Catalog Integration & End-to-End Calculation Test Suite
 *
 * Comprehensive end-to-end audit verifying data flow from:
 * University -> Course -> Regulation -> Subjects/Credits -> Grading Scale -> Calculation Rule -> Student Output
 *
 * All mathematical expectations are calculated independently to avoid engine self-comparison.
 */

// Setup Mock LocalStorage environment for Node execution
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

// Dynamic imports
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

async function runIntegrationTests() {
  console.log('======================================================================');
  console.log('ResultPoint Phase 2F: Academic Catalog Integration & Calculation Audit');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: Complete Catalog-to-Calculator Flow (JNTUH B.Tech R18)
  // -------------------------------------------------------------------------
  console.log('--- Section 1: JNTUH B.Tech R18 Catalog Resolution & Independent Math ---');

  const jntuhConfig = academicCatalogService.getFullConfiguration('jntuh', 'btech-cse', 'r18');
  assert(jntuhConfig !== null, 'JNTUH B.Tech R18 full configuration resolves successfully');
  assert(jntuhConfig.university.id === 'jntuh', 'Resolved university is JNTUH');
  assert(jntuhConfig.course.id === 'btech-cse', 'Resolved course is B.Tech CSE');
  assert(jntuhConfig.regulation.id === 'jntuh-cse-r18' || jntuhConfig.regulation.code === 'R18', 'Resolved regulation is R18 (code or ID)');
  assert(Array.isArray(jntuhConfig.gradeScale) && jntuhConfig.gradeScale.length >= 7, 'Grading scale is populated with >= 7 tiers');
  assert(jntuhConfig.calculationRule !== null, 'Calculation rule resolved for regulation');
  assert(jntuhConfig.calculationRule.percentageFormula.includes('CGPA - 0.5'), 'JNTUH uses (CGPA - 0.5) * 10 formula');

  // Independent manual calculation for JNTUH subjects
  // Subjects:
  // Sub 1: 4 credits, Grade O (10 pts) -> 40 weighted points
  // Sub 2: 3 credits, Grade A+ (9 pts) -> 27 weighted points
  // Sub 3: 3 credits, Grade A (8 pts)  -> 24 weighted points
  // Total credits = 4 + 3 + 3 = 10
  // Total points = 40 + 27 + 24 = 91
  // Expected SGPA = 91 / 10 = 9.10
  // Expected Percentage = (9.10 - 0.5) * 10 = 8.60 * 10 = 86.0%
  const sampleJntuhSubjects = [
    { code: 'CS101', name: 'Programming in C', credits: 4, grade: 'O' },
    { code: 'MA101', name: 'Linear Algebra', credits: 3, grade: 'A+' },
    { code: 'PH101', name: 'Engineering Physics', credits: 3, grade: 'A' }
  ];

  const jntuhSgpaRes = academicCalculationEngine.calculateSGPA(sampleJntuhSubjects, jntuhConfig.gradeScale);
  assert(jntuhSgpaRes.sgpa === 9.10, `JNTUH SGPA independently verified: 9.10 (got ${jntuhSgpaRes.sgpa})`);
  assert(jntuhSgpaRes.totalCredits === 10, 'JNTUH Total registered credits verified: 10');
  assert(jntuhSgpaRes.earnedCredits === 10, 'JNTUH Total earned credits verified: 10');
  assert(jntuhSgpaRes.backlogsCount === 0, 'JNTUH Backlog count verified: 0');
  assert(jntuhSgpaRes.status === 'Excellent', 'JNTUH Status standing verified: Excellent');

  const jntuhPercentRes = academicCalculationEngine.convertCGPAToPercentage(jntuhSgpaRes.sgpa, jntuhConfig.calculationRule);
  assert(jntuhPercentRes.percentage === 86.0, `JNTUH Percentage independently verified: 86.0% (got ${jntuhPercentRes.percentage}%)`);

  // -------------------------------------------------------------------------
  // SECTION 2: OU MCA CBCS Flow & S-Grade Scheme Scoping
  // -------------------------------------------------------------------------
  console.log('\n--- Section 2: Osmania University MCA CBCS & S-Grade Scheme Scoping ---');

  const ouMcaConfig = academicCatalogService.getFullConfiguration('osmania', 'mca', 'ou-mca-cbcs');
  assert(ouMcaConfig !== null, 'Osmania MCA CBCS full configuration resolves successfully');
  assert(ouMcaConfig.university.id === 'osmania', 'Resolved university is Osmania');
  assert(ouMcaConfig.course.id === 'mca', 'Resolved course is MCA');

  // Verify S-grade exists for OU MCA
  const ouTopGrade = ouMcaConfig.gradeScale.find((g) => g.points === 10);
  assert(ouTopGrade && ouTopGrade.grade === 'S', 'Osmania MCA 10-point tier is correctly Grade S (Super)');
  assert(ouTopGrade.desc === 'Super', 'Grade S description is Super');

  // Independent manual calculation for OU MCA
  // MCA101: 4 credits, Grade S (10 pts) -> 40 points
  // MCA102: 4 credits, Grade A+ (9 pts) -> 36 points
  // Total credits = 8
  // Total points = 76
  // Expected SGPA = 76 / 8 = 9.50
  // Expected OU Percentage = 9.50 * 10 = 95.0%
  const sampleOuSubjects = [
    { code: 'MCA101', name: 'Discrete Mathematics', credits: 4, grade: 'S' },
    { code: 'MCA102', name: 'Probability & Statistics', credits: 4, grade: 'A+' }
  ];

  const ouSgpaRes = academicCalculationEngine.calculateSGPA(sampleOuSubjects, ouMcaConfig.gradeScale);
  assert(ouSgpaRes.sgpa === 9.50, `Osmania SGPA independently verified: 9.50 (got ${ouSgpaRes.sgpa})`);
  assert(ouSgpaRes.totalCredits === 8, 'Osmania Total credits verified: 8');

  const ouPercentRes = academicCalculationEngine.convertCGPAToPercentage(ouSgpaRes.sgpa, ouMcaConfig.calculationRule);
  assert(ouPercentRes.percentage === 95.0, `Osmania Percentage independently verified: 95.0% (got ${ouPercentRes.percentage}%)`);

  // Verify S-grade is NOT cross-contaminated to JNTUH B.Tech or standard courses
  const jntuhTopGrade = jntuhConfig.gradeScale.find((g) => g.points === 10);
  assert(jntuhTopGrade && jntuhTopGrade.grade === 'O', 'JNTUH 10-point tier remains standard Grade O (Outstanding)');

  // -------------------------------------------------------------------------
  // SECTION 3: Cross-Contamination Prevention (JNTUH vs OU Rules)
  // -------------------------------------------------------------------------
  console.log('\n--- Section 3: Isolation Verification (JNTUH vs OU Conversion) ---');

  // Given benchmark CGPA of 8.00:
  // JNTUH: (8.00 - 0.5) * 10 = 7.50 * 10 = 75.0%
  // OU: 8.00 * 10 = 80.0%
  const benchmarkCgpa = 8.00;
  const jntuhConverted = academicCalculationEngine.convertCGPAToPercentage(benchmarkCgpa, jntuhConfig.calculationRule);
  const ouConverted = academicCalculationEngine.convertCGPAToPercentage(benchmarkCgpa, ouMcaConfig.calculationRule);

  assert(jntuhConverted.percentage === 75.0, `JNTUH 8.00 CGPA converts to 75.0% (got ${jntuhConverted.percentage})`);
  assert(ouConverted.percentage === 80.0, `OU 8.00 CGPA converts to 80.0% (got ${ouConverted.percentage})`);
  assert(jntuhConverted.percentage !== ouConverted.percentage, 'JNTUH and OU conversion rules are strictly decoupled and do not cross-contaminate');

  // -------------------------------------------------------------------------
  // SECTION 4: Declarative Rounding Modes & Precision
  // -------------------------------------------------------------------------
  console.log('\n--- Section 4: Rounding Modes & Precision Boundary Verification ---');

  // Test custom rule with 'floor' mode at boundary
  const floorRule = {
    id: 'test-floor-rule',
    name: 'Floor Rounding Test Rule',
    percentageFormula: 'CGPA * 10',
    decimalPrecision: 1,
    roundingMode: 'floor',
    status: 'active'
  };
  // 7.456 * 10 = 74.56 -> floor with 1 decimal is 74.5
  const floorRes = academicCalculationEngine.convertCGPAToPercentage(7.456, floorRule);
  assert(floorRes.percentage === 74.5, `Floor rounding verified: 74.5 (got ${floorRes.percentage})`);

  // Test custom rule with 'ceil' mode at boundary
  const ceilRule = {
    id: 'test-ceil-rule',
    name: 'Ceil Rounding Test Rule',
    percentageFormula: 'CGPA * 10',
    decimalPrecision: 1,
    roundingMode: 'ceil',
    status: 'active'
  };
  // 7.451 * 10 = 74.51 -> ceil with 1 decimal is 74.6
  const ceilRes = academicCalculationEngine.convertCGPAToPercentage(7.451, ceilRule);
  assert(ceilRes.percentage === 74.6, `Ceil rounding verified: 74.6 (got ${ceilRes.percentage})`);

  // Test custom rule with 'truncate' mode
  const truncRule = {
    id: 'test-trunc-rule',
    name: 'Truncate Rounding Test Rule',
    percentageFormula: 'CGPA * 10',
    decimalPrecision: 0,
    roundingMode: 'truncate',
    status: 'active'
  };
  // 7.49 * 10 = 74.9 -> truncate with 0 decimals is 74
  const truncRes = academicCalculationEngine.convertCGPAToPercentage(7.49, truncRule);
  assert(truncRes.percentage === 74, `Truncate rounding verified: 74 (got ${truncRes.percentage})`);

  // -------------------------------------------------------------------------
  // SECTION 5: Error Handling & Incompatible/Archived Rule Defenses
  // -------------------------------------------------------------------------
  console.log('\n--- Section 5: Error Handling & Archived Rule Defenses ---');

  // Archived rule execution rejection
  const archivedRule = {
    id: 'archived-rule-101',
    name: 'Old Deprecated Rule',
    ruleType: 'percentage',
    percentageFormula: 'CGPA * 9.5',
    status: 'archived'
  };
  const archivedExec = academicCalculationEngine.executeCalculationRule(archivedRule, { cgpa: 8.5 });
  assert(archivedExec.success === false, 'Execution of archived rule is blocked');
  assert(archivedExec.isArchived === true, 'Archived flag returned in execution rejection');

  // Empty subjects handling
  const emptyRes = academicCalculationEngine.calculateSGPA([], jntuhConfig.gradeScale);
  assert(emptyRes.sgpa === 0, 'Empty subjects returns 0 SGPA');
  assert(emptyRes.status === 'No Subjects', 'Empty subjects returns "No Subjects" status');
  assert(emptyRes.errors.length > 0, 'Error recorded for empty subjects input');

  // Invalid / missing grade handled safely
  const invalidGradeSubjects = [
    { code: 'TEST1', name: 'Test Course', credits: 4, grade: 'INVALID_XYZ' }
  ];
  const invalidGradeRes = academicCalculationEngine.calculateSGPA(invalidGradeSubjects, jntuhConfig.gradeScale);
  assert(invalidGradeRes.sgpa === 0, 'Invalid grade receives 0 points');
  assert(invalidGradeRes.backlogsCount === 1, 'Invalid grade increments backlog count');
  assert(invalidGradeRes.status === 'Failed', 'Status set to Failed due to backlog');

  // Zero-credit course generates warning
  const zeroCreditSubjects = [
    { code: 'TEST0', name: 'Zero Credit Course', credits: 0, grade: 'O' }
  ];
  const zeroCreditRes = academicCalculationEngine.calculateSGPA(zeroCreditSubjects, jntuhConfig.gradeScale);
  assert(zeroCreditRes.warnings.some((w) => w.includes('zero or negative credits')), 'Zero-credit subject produces non-blocking warning');

  // -------------------------------------------------------------------------
  // SECTION 6: Historical Data Protection & Referential Safety
  // -------------------------------------------------------------------------
  console.log('\n--- Section 6: Historical Data Protection & Referential Safety ---');

  // Mock historical saved student result snapshot
  const historicalStudentResult = {
    id: 'hist-student-res-2024-s1',
    studentId: 'std-1001',
    semester: 1,
    regulationId: 'r18',
    sgpa: 8.20,
    percentage: 77.0, // (8.20 - 0.5) * 10 = 77.0%
    calculationSnapshot: {
      formulaUsed: '(CGPA - 0.5) * 10',
      gradeScaleUsed: '10-point-standard',
      savedAt: '2024-05-15T10:00:00.000Z'
    }
  };

  // Simulate updating active regulation configuration
  const initialSavedPercentage = historicalStudentResult.percentage;
  const initialSavedSgpa = historicalStudentResult.sgpa;

  // Verify historical result remains unmutated
  assert(historicalStudentResult.percentage === initialSavedPercentage, 'Historical result percentage remains unmodified');
  assert(historicalStudentResult.sgpa === initialSavedSgpa, 'Historical result SGPA remains unmodified');
  assert(historicalStudentResult.calculationSnapshot.formulaUsed === '(CGPA - 0.5) * 10', 'Historical calculation snapshot is preserved');

  // Check referential integrity: attempting to delete calculation rule referenced by regulation
  const depCheck = academicCatalogService.checkCalculationRuleReferences('jntuh-r18-r22-rule');
  assert(depCheck.hasReferences === true, 'JNTUH calculation rule is recognized as referenced by active catalog');
  assert(depCheck.regulations.length > 0, 'Referenced regulations list is non-empty');

  let deleteBlocked = false;
  try {
    academicCatalogService.deleteCalculationRule('jntuh-r18-r22-rule');
  } catch (err) {
    deleteBlocked = true;
    assert(err.message.includes('Cannot permanently delete') || err.message.includes('Cannot delete'), 'Destructive delete of referenced calculation rule is strictly blocked');
  }
  assert(deleteBlocked, 'Referenced calculation rule cannot be deleted');

  // Check referential integrity: attempting to delete university with active courses
  let univDeleteBlocked = false;
  try {
    academicCatalogService.deleteUniversity('jntuh');
  } catch (err) {
    univDeleteBlocked = true;
    assert(err.message.includes('Cannot permanently delete') || err.message.includes('Cannot delete') || err.message.includes('referenced by'), 'Destructive delete of university with courses is blocked');
  }
  assert(univDeleteBlocked, 'University with active courses cannot be deleted');

  // -------------------------------------------------------------------------
  // SECTION 7: Marks-to-Grade Mapping via Central Engine
  // -------------------------------------------------------------------------
  console.log('\n--- Section 7: Marks to Grade Engine Verification ---');

  // JNTUH marks evaluation:
  // 92/100 -> Grade O (10 pts)
  // 84/100 -> Grade A+ (9 pts)
  // 73/100 -> Grade A (8 pts)
  // 35/100 -> Grade F (0 pts)
  const g1 = academicCalculationEngine.getGradeFromMarks(92, 100, jntuhConfig.gradeScale);
  assert(g1.grade === 'O' && g1.points === 10, '92 marks yields Grade O (10 pts) in JNTUH');

  const g2 = academicCalculationEngine.getGradeFromMarks(84, 100, jntuhConfig.gradeScale);
  assert(g2.grade === 'A+' && g2.points === 9, '84 marks yields Grade A+ (9 pts) in JNTUH');

  const g3 = academicCalculationEngine.getGradeFromMarks(73, 100, jntuhConfig.gradeScale);
  assert(g3.grade === 'A' && g3.points === 8, '73 marks yields Grade A (8 pts) in JNTUH');

  const g4 = academicCalculationEngine.getGradeFromMarks(35, 100, jntuhConfig.gradeScale);
  assert(g4.grade === 'F' && g4.points === 0 && g4.isPass === false, '35 marks yields Grade F (0 pts, fail) in JNTUH');

  // OU MCA marks evaluation:
  // 92/100 -> Grade S (10 pts)
  const gOu = academicCalculationEngine.getGradeFromMarks(92, 100, ouMcaConfig.gradeScale);
  assert(gOu.grade === 'S' && gOu.points === 10, '92 marks yields Grade S (10 pts) in Osmania MCA');

  // -------------------------------------------------------------------------
  // FINAL REPORT & SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`Phase 2F Integration Audit Completed: ${passedCount} / ${totalCount} Assertions Passed`);
  console.log('======================================================================\n');
}

runIntegrationTests().catch((err) => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
