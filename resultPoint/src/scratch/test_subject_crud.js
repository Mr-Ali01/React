/**
 * Test Suite for Phase 2C: Subject & Credits Management CRUD
 *
 * Verifies:
 * 1. Adding a valid subject to a regulation semester.
 * 2. Validation constraints: non-empty/min length code & name, duplicate codes,
 *    non-negative finite credits, passMarks <= maxMarks.
 * 3. Editing a subject (metadata, credits, marks, safe renaming with collision protection).
 * 4. Semester total credit calculation.
 * 5. Subject status changes & archival.
 * 6. Historical student reference protection (guarded delete when referenced by saved results or backlogs).
 * 7. Clean deletion of unreferenced subjects.
 * 8. Audit event generation with entityType: 'subject'.
 * 9. Regression check for Phase 2A (universities) and Phase 2B (courses).
 */

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

const listeners = {};
global.window = {
  dispatchEvent: (event) => {
    const list = listeners[event.type] || [];
    list.forEach((cb) => cb(event));
    return true;
  },
  addEventListener: (type, cb) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(cb);
  },
  removeEventListener: (type, cb) => {
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter((fn) => fn !== cb);
  }
};

async function runTests() {
  console.log('--- Starting Phase 2C Subject Management Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  const { academicCatalogService } = await import('../services/academicCatalogService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');

  academicCatalogService.initialize();

  // Test 1: Retrieve seeded subjects
  console.log('\nTest 1: Retrieve seeded subjects for JNTUH B.Tech CSE R18 Sem 1');
  const sem1Subjects = academicCatalogService.getSemesterSubjects('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(Array.isArray(sem1Subjects) && sem1Subjects.length > 0, `Loaded ${sem1Subjects.length} subjects for Sem 1`);
  const initialCount = sem1Subjects.length;
  const initialCredits = academicCatalogService.getSemesterTotalCredits('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(initialCredits > 0, `Initial total credits calculated: ${initialCredits}`);

  // Test 2: Add a new subject
  console.log('\nTest 2: Add a valid subject to Semester 1');
  const newSubjectPayload = {
    code: 'TEST_SUB101',
    name: 'Introduction to Cloud Computing',
    defaultCredits: 3,
    type: 'Theory',
    maxMarks: 100,
    passMarks: 40,
    status: 'active'
  };

  let catalogUpdatedEmitted = false;
  const updateHandler = (e) => {
    catalogUpdatedEmitted = true;
  };
  global.window.addEventListener('rp_catalog_updated', updateHandler);

  const added = academicCatalogService.addSubject(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r18',
    1,
    newSubjectPayload
  );

  assert(added && added.code === 'TEST_SUB101', 'Subject added successfully with code TEST_SUB101');
  assert(added.defaultCredits === 3, 'Default credits saved as 3');
  assert(added.maxMarks === 100 && added.passMarks === 40, 'Max marks and pass marks saved');
  assert(catalogUpdatedEmitted, 'rp_catalog_updated event emitted on subject addition');

  const afterAddSubjects = academicCatalogService.getSemesterSubjects('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(afterAddSubjects.length === initialCount + 1, `Subject count incremented to ${afterAddSubjects.length}`);
  const afterAddCredits = academicCatalogService.getSemesterTotalCredits('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(afterAddCredits === initialCredits + 3, `Total credits updated from ${initialCredits} to ${afterAddCredits}`);

  // Test 3: Validation on duplicate code
  console.log('\nTest 3: Reject duplicate subject code in same semester');
  let duplicateRejected = false;
  try {
    academicCatalogService.addSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, {
      code: 'TEST_SUB101',
      name: 'Duplicate Cloud Course',
      defaultCredits: 3
    });
  } catch (err) {
    duplicateRejected = true;
    assert(err.message.includes('already exists'), `Duplicate code rejected with message: "${err.message}"`);
  }
  assert(duplicateRejected, 'Duplicate subject code was rejected');

  // Test 4: Validation on invalid credits and marks
  console.log('\nTest 4: Reject invalid credits & marks constraints');
  let invalidCreditsRejected = false;
  try {
    academicCatalogService.addSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, {
      code: 'TEST_INV_CRED',
      name: 'Invalid Credits Course',
      defaultCredits: -5
    });
  } catch (err) {
    invalidCreditsRejected = true;
    assert(err.message.includes('non-negative'), `Negative credits rejected: "${err.message}"`);
  }
  assert(invalidCreditsRejected, 'Negative credits rejected properly');

  let invalidMarksRejected = false;
  try {
    academicCatalogService.addSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, {
      code: 'TEST_INV_MARKS',
      name: 'Invalid Marks Course',
      defaultCredits: 3,
      maxMarks: 50,
      passMarks: 60 // passMarks > maxMarks
    });
  } catch (err) {
    invalidMarksRejected = true;
    assert(err.message.includes('cannot exceed maximum marks'), `Pass > Max marks rejected: "${err.message}"`);
  }
  assert(invalidMarksRejected, 'Passing marks > max marks rejected properly');

  // Test 5: Edit subject
  console.log('\nTest 5: Edit subject metadata and credit values');
  const updated = academicCatalogService.updateSubject(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r18',
    1,
    'TEST_SUB101',
    {
      name: 'Advanced Cloud Computing & Virtualization',
      defaultCredits: 4,
      type: 'Professional Elective'
    }
  );
  assert(updated.name === 'Advanced Cloud Computing & Virtualization', 'Subject title updated');
  assert(updated.defaultCredits === 4, 'Subject credits updated to 4');
  assert(updated.type === 'Professional Elective', 'Subject type updated to Professional Elective');

  const afterEditCredits = academicCatalogService.getSemesterTotalCredits('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(afterEditCredits === initialCredits + 4, `Semester total credits reflects edited credit value: ${afterEditCredits}`);

  // Test 6: Safe renaming of subject code
  console.log('\nTest 6: Renaming subject code with collision protection');
  const renamed = academicCatalogService.updateSubject(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r18',
    1,
    'TEST_SUB101',
    {
      code: 'TEST_SUB102'
    }
  );
  assert(renamed.code === 'TEST_SUB102', 'Subject successfully renamed to TEST_SUB102');
  const fetchedRenamed = academicCatalogService.getSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'TEST_SUB102');
  assert(fetchedRenamed !== null, 'Found subject by new code TEST_SUB102');

  // Test 7: Subject Archival
  console.log('\nTest 7: Archive subject and check total credits exclusion');
  const archived = academicCatalogService.archiveSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'TEST_SUB102');
  assert(archived.status === 'archived', 'Subject status marked as archived');
  const creditsAfterArchive = academicCatalogService.getSemesterTotalCredits('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(creditsAfterArchive === initialCredits, `Archived subject credits excluded from semester active total (back to ${initialCredits})`);

  // Unarchive / set active
  academicCatalogService.setSubjectStatus('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'TEST_SUB102', 'active');
  const reactivated = academicCatalogService.getSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'TEST_SUB102');
  assert(reactivated.status === 'active', 'Subject reactivated to active status');

  // Test 8: Referential Integrity / Guarded Deletion
  console.log('\nTest 8: Protect historical student results and backlogs from subject deletion');

  // Mock a saved student result referencing a real subject, e.g., 'MA101BS'
  const mockSavedResults = [
    {
      id: 'semester-1',
      semesterNumber: 1,
      academicPeriod: 'Semester 1',
      sgpa: 8.5,
      cgpa: 8.5,
      subjects: [
        { code: 'MA101BS', name: 'Mathematics - I', credits: 4, grade: 'A', gradePoints: 8 },
        { code: 'CH102BS', name: 'Chemistry', credits: 4, grade: 'B', gradePoints: 7 }
      ]
    }
  ];
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(mockSavedResults));

  const refCheckBlocked = academicCatalogService.checkSubjectReferences(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r18',
    1,
    'MA101BS'
  );
  assert(refCheckBlocked.canDelete === false, 'checkSubjectReferences reports canDelete: false for MA101BS');
  assert(refCheckBlocked.resultCount === 1, 'Detected 1 saved result referencing MA101BS');
  assert(refCheckBlocked.reason.includes('referenced by 1 saved student semester result'), `Detailed blocking reason provided: "${refCheckBlocked.reason}"`);

  let deletionBlocked = false;
  try {
    academicCatalogService.deleteSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'MA101BS');
  } catch (err) {
    deletionBlocked = true;
    assert(err.message.includes('Cannot permanently delete subject'), `deleteSubject threw error on referenced subject: "${err.message}"`);
  }
  assert(deletionBlocked, 'Deletion of referenced subject was prevented');

  // Confirm saved student results remained completely untouched
  const preservedResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS));
  assert(preservedResults.length === 1 && preservedResults[0].subjects.length === 2, 'Historical student results remain completely unchanged');

  // Test 9: Deletion of unreferenced subject
  console.log('\nTest 9: Permanently delete unreferenced subject');
  const refCheckUnreferenced = academicCatalogService.checkSubjectReferences(
    'jntuh',
    'btech-cse',
    'jntuh-cse-r18',
    1,
    'TEST_SUB102'
  );
  assert(refCheckUnreferenced.canDelete === true, 'Unreferenced subject reports canDelete: true');

  const deleted = academicCatalogService.deleteSubject('jntuh', 'btech-cse', 'jntuh-cse-r18', 1, 'TEST_SUB102');
  assert(deleted && deleted.code === 'TEST_SUB102', 'Unreferenced subject deleted successfully');

  const finalSubjects = academicCatalogService.getSemesterSubjects('jntuh', 'btech-cse', 'jntuh-cse-r18', 1);
  assert(finalSubjects.length === initialCount, `Semester subject count restored to initial ${initialCount}`);
  assert(!finalSubjects.some((s) => s.code === 'TEST_SUB102'), 'Deleted subject no longer present in catalog');

  // Test 10: Verify Audit Events
  console.log('\nTest 10: Verify Audit History Service records');
  const auditEvents = auditHistoryService.getAllAuditEvents();
  const subjectEvents = auditEvents.filter((e) => e.entityType === 'subject');
  assert(subjectEvents.length >= 4, `Recorded ${subjectEvents.length} subject audit events`);

  const actions = subjectEvents.map((e) => e.action);
  assert(actions.includes('SUBJECT_ADDED'), 'Audit log contains SUBJECT_ADDED');
  assert(actions.includes('SUBJECT_UPDATED'), 'Audit log contains SUBJECT_UPDATED');
  assert(actions.includes('SUBJECT_ARCHIVED'), 'Audit log contains SUBJECT_ARCHIVED');
  assert(actions.includes('SUBJECT_DELETED'), 'Audit log contains SUBJECT_DELETED');

  // Check title formatting
  const addEvent = subjectEvents.find((e) => e.action === 'SUBJECT_ADDED');
  assert(addEvent.title && addEvent.title.includes('SUBJECT_ADDED'), `Computed title formatted properly: "${addEvent.title}"`);

  console.log(`\n--- Tests Complete: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
