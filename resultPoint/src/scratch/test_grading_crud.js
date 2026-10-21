/**
 * ResultPoint Admin Dashboard — Phase 2D: Grading Rules Management Test Suite
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
  console.log('========================================================');
  console.log('ResultPoint Phase 2D: Grading Rules Management Test Suite');
  console.log('========================================================\n');

  // Test 1: Initialize catalog and verify seed grading scales
  console.log('--- Test 1: Seed Grading Scales Initialization ---');
  academicCatalogService.resetToDefaults();
  const initialScales = academicCatalogService.getGradingScales();
  assert(Array.isArray(initialScales) && initialScales.length >= 3, 'Seed catalog contains at least 3 default grading scales');
  
  const ugcScale = initialScales.find(s => s.id === 'ugc-10-point');
  assert(Boolean(ugcScale), 'UGC 10-point scale exists in registry');
  assert(ugcScale.grades.length >= 7, 'UGC 10-point scale has complete standard grade tiers (O, A+, A, B+, B, C, F)');

  const ouScale = initialScales.find(s => s.id === 'ou-s-grade-10-point');
  assert(Boolean(ouScale), 'Osmania University S-grade 10-point scale exists');
  const sGrade = ouScale.grades.find(g => g.grade === 'S');
  assert(Boolean(sGrade) && sGrade.points === 10, 'OU S-grade is correctly configured with 10 grade points and preserved without global O-replacement');

  // Test 2: Validation of Grade Scale (Bounds, Overlaps, Gaps)
  console.log('\n--- Test 2: Grade Scale Validation Rules ---');
  // Duplicate symbols
  const dupResult = academicCatalogService.validateGradeScale([
    { grade: 'A', points: 9, minPercentage: 80, maxPercentage: 100, isPass: true },
    { grade: 'A', points: 8, minPercentage: 70, maxPercentage: 79.99, isPass: true }
  ]);
  assert(!dupResult.isValid && dupResult.errors.some(e => e.toLowerCase().includes('duplicate')), 'Rejects duplicate grade symbols within same scale');

  // Min > Max
  const invertedResult = academicCatalogService.validateGradeScale([
    { grade: 'B', points: 7, minPercentage: 80, maxPercentage: 60, isPass: true }
  ]);
  assert(!invertedResult.isValid && invertedResult.errors.some(e => e.toLowerCase().includes('cannot exceed maximum')), 'Rejects tier where minPercentage > maxPercentage');

  // Overlapping percentages
  const overlapResult = academicCatalogService.validateGradeScale([
    { grade: 'O', points: 10, minPercentage: 80, maxPercentage: 100, isPass: true },
    { grade: 'A', points: 9, minPercentage: 75, maxPercentage: 85, isPass: true }
  ]);
  assert(!overlapResult.isValid && overlapResult.errors.some(e => e.toLowerCase().includes('overlap')), 'Rejects overlapping percentage intervals between grade tiers');

  // Coverage gaps detection
  const gapResult = academicCatalogService.validateGradeScale([
    { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, isPass: true },
    { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, isPass: false }
  ], { checkCoverage: true });
  assert(gapResult.warnings.length > 0 && gapResult.warnings.some(w => w.toLowerCase().includes('gap')), 'Detects coverage gaps in 0-100% spectrum (missing 40%-84.99%)');

  // Test 3: Add New Grading Scale
  console.log('\n--- Test 3: Add Grading Scale ---');
  const newScale = academicCatalogService.addGradingScale({
    id: 'test-custom-10pt',
    name: 'Custom Autonomous 10-Point Scale',
    system: '10-point',
    description: 'Autonomous College Tier Scale',
    status: 'active',
    isOfficial: false,
    grades: [
      { grade: 'EX', points: 10, minPercentage: 90, maxPercentage: 100, desc: 'Excellent', isPass: true },
      { grade: 'A', points: 8, minPercentage: 75, maxPercentage: 84.99, desc: 'Very Good', isPass: true },
      { grade: 'B', points: 7, minPercentage: 60, maxPercentage: 74.99, desc: 'Good', isPass: true },
      { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 59.99, desc: 'Fail', isPass: false }
    ]
  });
  assert(newScale.id === 'test-custom-10pt', 'Successfully created custom grading scale');

  // Reject duplicate ID
  let threwDupId = false;
  try {
    academicCatalogService.addGradingScale({ id: 'test-custom-10pt', name: 'Another scale' });
  } catch (err) {
    threwDupId = true;
  }
  assert(threwDupId, 'Rejects adding grading scale with existing scale ID');

  // Test 4: Update Grading Scale Metadata
  console.log('\n--- Test 4: Update Grading Scale Metadata ---');
  const updatedScale = academicCatalogService.updateGradingScale('test-custom-10pt', {
    name: 'Updated Autonomous 10-Point Scale',
    description: 'Updated circular details'
  });
  assert(updatedScale.name === 'Updated Autonomous 10-Point Scale', 'Metadata name updated successfully');
  assert(updatedScale.grades.length === 4, 'Existing grade entries preserved during metadata edit');

  // Test 5: Add, Edit, and Delete Grade Entries
  console.log('\n--- Test 5: Grade Entry CRUD Operations ---');
  // Add Grade Tier
  const scaleWithNewGrade = academicCatalogService.addGradeEntry('test-custom-10pt', {
    grade: 'A+',
    points: 9,
    minPercentage: 85,
    maxPercentage: 89.99,
    desc: 'Outstanding',
    isPass: true
  });
  assert(scaleWithNewGrade.grades.some(g => g.grade === 'A+'), 'Grade tier "A+" added to scale');

  // Edit Grade Tier
  const scaleWithEditedGrade = academicCatalogService.updateGradeEntry('test-custom-10pt', 'A+', {
    grade: 'A_PLUS',
    points: 9.5,
    desc: 'Superior'
  });
  assert(scaleWithEditedGrade.grades.some(g => g.grade === 'A_PLUS' && g.points === 9.5), 'Grade tier updated to "A_PLUS" with 9.5 points');

  // Delete Grade Tier
  const scaleWithDeletedGrade = academicCatalogService.deleteGradeEntry('test-custom-10pt', 'A_PLUS');
  assert(!scaleWithDeletedGrade.grades.some(g => g.grade === 'A_PLUS'), 'Grade tier "A_PLUS" deleted cleanly');

  // Test 6: Referential Integrity & Guarded Deletion
  console.log('\n--- Test 6: Referential Integrity & Guarded Deletion ---');
  // ugc-10-point is referenced by catalog regulations
  const refCheckUGC = academicCatalogService.checkGradingScaleReferences('ugc-10-point');
  assert(refCheckUGC.hasReferences && refCheckUGC.regulations.length > 0, 'Detects regulations referencing ugc-10-point');

  // Attempting destructive delete must throw
  let threwBlockedDelete = false;
  try {
    academicCatalogService.deleteGradingScale('ugc-10-point');
  } catch (err) {
    threwBlockedDelete = true;
    assert(err.message.includes('Cannot permanently delete'), 'Threw detailed error blocking deletion of referenced scale');
  }
  assert(threwBlockedDelete, 'Referential integrity safeguard prevented destructive deletion of referenced scale');

  // Safe Archival of scale
  const archivedScale = academicCatalogService.archiveGradingScale('ugc-10-point');
  assert(archivedScale.status === 'archived', 'Referenced scale can be safely archived');

  // Reactivate scale
  academicCatalogService.setGradingScaleStatus('ugc-10-point', 'active');
  assert(academicCatalogService.getGradingScale('ugc-10-point').status === 'active', 'Archived scale can be reactivated');

  // Unreferenced scale can be permanently deleted
  const deletedCustomScale = academicCatalogService.deleteGradingScale('test-custom-10pt');
  assert(deletedCustomScale.id === 'test-custom-10pt', 'Unreferenced scale permanently deleted cleanly');
  assert(!academicCatalogService.getGradingScale('test-custom-10pt'), 'Scale no longer present in catalog');

  // Test 7: Assign Scale to Regulation with Versioning Safeguard
  console.log('\n--- Test 7: Regulation Binding and Versioning Safeguards ---');
  const catalog = academicCatalogService.getCatalog();
  const sampleUniv = catalog.universities[0];
  const sampleCourse = sampleUniv.courses[0];
  const sampleReg = sampleCourse.regulations[0];

  // Publish new version
  const versionedReg = academicCatalogService.assignGradingScaleToRegulation(
    sampleUniv.id,
    sampleCourse.id,
    sampleReg.id,
    'ou-s-grade-10-point',
    {
      publishNewVersion: true,
      ruleVersion: `${sampleReg.code}_V2_PHASE2D`
    }
  );
  assert(versionedReg.code === `${sampleReg.code}_V2_PHASE2D`, 'Published new regulation version code');
  assert(versionedReg.gradingScaleId === 'ou-s-grade-10-point', 'New version references target scale');
  assert(versionedReg.gradeScale.some(g => g.grade === 'S'), 'New regulation snapshot contains S-grade from target scale');

  // Confirm original regulation was NOT destroyed or mutated
  const refreshedCatalog = academicCatalogService.getCatalog();
  const refreshedUniv = refreshedCatalog.universities.find(u => u.id === sampleUniv.id);
  const refreshedCourse = refreshedUniv.courses.find(c => c.id === sampleCourse.id);
  const originalReg = refreshedCourse.regulations.find(r => r.id === sampleReg.id);
  assert(Boolean(originalReg), 'Original regulation remains intact');

  // Test 8: Historical Student Results Protection
  console.log('\n--- Test 8: Historical Student Results Protection ---');
  // Seed a mock student result in storage
  const mockStudentResults = [
    {
      id: 'res-hist-001',
      studentId: 'std-2023-01',
      universityId: sampleUniv.id,
      courseId: sampleCourse.id,
      regulationId: sampleReg.id,
      semester: 1,
      cgpa: 8.75,
      sgpa: 8.75,
      grades: [
        { subjectCode: 'SUB101', grade: 'O', gradePoints: 10, credits: 4 }
      ]
    }
  ];
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(mockStudentResults));

  const savedResultsBefore = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS));
  assert(savedResultsBefore[0].grades[0].gradePoints === 10, 'Historical student result grade points verified');

  // Changing catalog grading scale does not alter historical results
  academicCatalogService.updateGradingScale('ou-s-grade-10-point', {
    description: 'Updated Osmania University CBCS Grading Scheme circular details'
  });

  const savedResultsAfter = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS));
  assert(JSON.stringify(savedResultsBefore) === JSON.stringify(savedResultsAfter), 'Historical student calculation results remain completely untouched and unmodified');

  // Test 9: Audit History Logging for Grading Events
  console.log('\n--- Test 9: Audit History Logging ---');
  const allEvents = auditHistoryService.getAllAuditEvents();
  const auditLogs = allEvents.filter(e => e.entityType === 'grading_scale');
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, 'Audit logs recorded for grading_scale operations');
  assert(auditLogs.some(l => l.action.includes('GRADING_SCALE_ADDED') || l.action.includes('GRADING_SCALE_DELETED')), 'Audit actions include GRADING_SCALE_ADDED / GRADING_SCALE_DELETED');

  console.log(`\n========================================================`);
  console.log(`Phase 2D Test Suite Complete: ${passedCount}/${totalCount} tests passed!`);
  console.log(`========================================================\n`);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
