// Unit test script for academicCatalogService Course CRUD operations
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
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
global.window = {
  dispatchEvent: (event) => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, params) {
    this.name = name;
    this.detail = params?.detail;
  }
};

async function run() {
  const { academicCatalogService } = await import('../services/academicCatalogService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');

  console.log('=== TEST 1: Initial courses verification ===');
  const catalog = academicCatalogService.getCatalog();
  const jntuh = catalog.universities.find(u => u.id === 'jntuh');
  const ou = catalog.universities.find(u => u.id === 'osmania' || u.shortName === 'OU');
  if (!jntuh || !ou) throw new Error('JNTUH or OU missing!');
  console.log(`JNTUH courses: ${jntuh.courses.length}, OU courses: ${ou.courses.length}`);

  const initialJntuhCourses = academicCatalogService.getCoursesByUniversity('jntuh');
  console.log('getCoursesByUniversity(jntuh):', initialJntuhCourses.map(c => `${c.shortName} (${c.status})`).join(', '));

  console.log('\n=== TEST 2: Validation on addCourse ===');
  // 2a: Missing parent university
  let caughtMissingUniv = false;
  try {
    academicCatalogService.addCourse('non-existent-univ', { name: 'M.Tech AI', shortName: 'AI' });
  } catch (e) {
    caughtMissingUniv = true;
    console.log('Properly rejected non-existent parent university:', e.message);
  }
  if (!caughtMissingUniv) throw new Error('Failed to reject non-existent university');

  // 2b: Missing course name
  let caughtMissingName = false;
  try {
    academicCatalogService.addCourse('jntuh', { name: '', shortName: 'TEST' });
  } catch (e) {
    caughtMissingName = true;
    console.log('Properly rejected empty course name:', e.message);
  }
  if (!caughtMissingName) throw new Error('Failed to reject empty course name');

  // 2c: Invalid semester count
  let caughtInvalidSemesters = false;
  try {
    academicCatalogService.addCourse('jntuh', {
      name: 'Master of Technology in Artificial Intelligence',
      shortName: 'MTECH_AI',
      totalSemesters: 0
    });
  } catch (e) {
    caughtInvalidSemesters = true;
    console.log('Properly rejected invalid semester count (0):', e.message);
  }
  if (!caughtInvalidSemesters) throw new Error('Failed to reject invalid semester count');

  // 2d: Invalid credits
  let caughtInvalidCredits = false;
  try {
    academicCatalogService.addCourse('jntuh', {
      name: 'Master of Technology in Artificial Intelligence',
      shortName: 'MTECH_AI',
      totalSemesters: 4,
      totalDegreeCredits: -10
    });
  } catch (e) {
    caughtInvalidCredits = true;
    console.log('Properly rejected negative credits (-10):', e.message);
  }
  if (!caughtInvalidCredits) throw new Error('Failed to reject negative credits');

  // 2e: Duplicate short code under same university
  let caughtDuplicateCode = false;
  try {
    academicCatalogService.addCourse('jntuh', {
      name: 'B.Tech Duplicate CSE',
      shortName: 'CSE',
      level: 'UG',
      durationYears: 4,
      totalSemesters: 8,
      totalDegreeCredits: 160
    });
  } catch (e) {
    caughtDuplicateCode = true;
    console.log('Properly rejected duplicate shortName "CSE":', e.message);
  }
  if (!caughtDuplicateCode) throw new Error('Failed to reject duplicate shortName');

  console.log('\n=== TEST 3: Add valid course ===');
  const addedCourse = academicCatalogService.addCourse('jntuh', {
    name: 'B.Tech - Artificial Intelligence & Data Science',
    shortName: 'AI-DS',
    level: 'UG',
    durationYears: 4,
    totalSemesters: 8,
    totalDegreeCredits: 160,
    status: 'active'
  });
  console.log('Successfully added course:', addedCourse.id, '|', addedCourse.name);
  if (addedCourse.shortName !== 'AI-DS') throw new Error('ShortName mismatch');

  const jntuhAfterAdd = academicCatalogService.getCoursesByUniversity('jntuh');
  console.log('JNTUH courses count now:', jntuhAfterAdd.length);
  if (jntuhAfterAdd.length !== initialJntuhCourses.length + 1) throw new Error('Course count mismatch');

  console.log('\n=== TEST 4: Edit course metadata ===');
  const updatedCourse = academicCatalogService.updateCourse('jntuh', addedCourse.id, {
    name: 'B.Tech - Artificial Intelligence and Machine Learning',
    totalDegreeCredits: 164
  });
  console.log('Updated course name:', updatedCourse.name, 'Credits:', updatedCourse.totalDegreeCredits);
  if (updatedCourse.name !== 'B.Tech - Artificial Intelligence and Machine Learning') throw new Error('Update name failed');
  if (updatedCourse.totalDegreeCredits !== 164) throw new Error('Update credits failed');
  if (updatedCourse.id !== addedCourse.id) throw new Error('Course ID must be preserved!');

  console.log('\n=== TEST 5: Toggle Status & Archive Course ===');
  academicCatalogService.setCourseStatus('jntuh', addedCourse.id, 'inactive');
  let fetchedCourse = academicCatalogService.getCourse('jntuh', addedCourse.id);
  if (fetchedCourse.status !== 'inactive') throw new Error('Status should be inactive');
  console.log('Status successfully changed to:', fetchedCourse.status);

  academicCatalogService.archiveCourse('jntuh', addedCourse.id);
  fetchedCourse = academicCatalogService.getCourse('jntuh', addedCourse.id);
  if (fetchedCourse.status !== 'archived') throw new Error('Status should be archived');
  console.log('Course successfully archived:', fetchedCourse.status);

  console.log('\n=== TEST 6: Referential integrity on existing course with regulations ===');
  const cseRef = academicCatalogService.checkCourseReferences('jntuh', 'btech-cse');
  console.log('btech-cse canDelete:', cseRef.canDelete, 'Reasons:', cseRef.reasons);
  if (cseRef.canDelete) throw new Error('btech-cse has regulations and must NOT be deletable!');

  let blockedDelete = false;
  try {
    academicCatalogService.deleteCourse('jntuh', 'btech-cse');
  } catch (e) {
    blockedDelete = true;
    console.log('Properly blocked deletion of referenced course:', e.message);
  }
  if (!blockedDelete) throw new Error('Deletion of referenced course should have thrown error');

  console.log('\n=== TEST 7: Clean deletion of unreferenced newly added course ===');
  const deleted = academicCatalogService.deleteCourse('jntuh', addedCourse.id);
  console.log('Successfully deleted test course:', deleted.name);
  const checkDeleted = academicCatalogService.getCourse('jntuh', addedCourse.id);
  if (checkDeleted) throw new Error('Course should have been deleted');

  console.log('\n=== TEST 8: Verify audit history logs ===');
  const auditLogs = auditHistoryService.getAllAuditEvents();
  console.log('Audit events recorded:', auditLogs.length);
  const courseEvents = auditLogs.filter(e => e.entityType === 'course');
  console.log('Course-specific audit events:', courseEvents.length);
  courseEvents.slice(0, 4).forEach(e => console.log(' -> Event:', e.action, '| Title:', e.title, '| Details:', e.details));

  console.log('\n>>> ALL PHASE 2B COURSE CRUD TESTS PASSED SUCCESSFULLY! <<<');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
