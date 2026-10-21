// Node.js test script for academicCatalogService university CRUD
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

  console.log('--- TEST 1: Initial catalog load ---');
  const catalog = academicCatalogService.getCatalog();
  console.log('Universities count:', catalog.universities.length);
  const ou = catalog.universities.find(u => u.id === 'osmania' || u.shortName === 'OU');
  const jntuh = catalog.universities.find(u => u.id === 'jntuh' || u.shortName === 'JNTUH');
  if (!ou || !jntuh) throw new Error('OU or JNTUH missing from catalog!');
  console.log('OU courses:', ou.courses.length, 'JNTUH courses:', jntuh.courses.length);

  console.log('--- TEST 2: Add University validation & success ---');
  let caughtError = false;
  try {
    academicCatalogService.addUniversity({ name: '', shortName: '' });
  } catch (e) {
    caughtError = true;
    console.log('Properly rejected empty name/shortName:', e.message);
  }
  if (!caughtError) throw new Error('Failed to reject empty name/shortName');

  let caughtDuplicate = false;
  try {
    academicCatalogService.addUniversity({ name: 'Osmania Duplicate', shortName: 'OU' });
  } catch (e) {
    caughtDuplicate = true;
    console.log('Properly rejected duplicate shortName OU:', e.message);
  }
  if (!caughtDuplicate) throw new Error('Failed to reject duplicate shortName');

  const newUniv = academicCatalogService.addUniversity({
    name: 'Delhi Technological University',
    shortName: 'DTU_TEST',
    city: 'New Delhi',
    state: 'Delhi',
    type: 'State Public University',
    website: 'https://www.dtu.ac.in'
  });
  console.log('Added new university:', newUniv.id, newUniv.name);

  console.log('--- TEST 3: Update University metadata ---');
  const updatedUniv = academicCatalogService.updateUniversity(newUniv.id, {
    name: 'Delhi Technological University Main Campus',
    website: 'https://dtu.ac.in'
  });
  if (updatedUniv.name !== 'Delhi Technological University Main Campus') throw new Error('Name update failed');
  console.log('Updated university successfully:', updatedUniv.name);

  console.log('--- TEST 4: Set status & Archive ---');
  academicCatalogService.setUniversityStatus(newUniv.id, 'inactive');
  let checkU = academicCatalogService.getUniversity(newUniv.id);
  if (checkU.status !== 'inactive') throw new Error('Status change failed');
  console.log('Set status to inactive successfully');

  academicCatalogService.archiveUniversity(newUniv.id);
  checkU = academicCatalogService.getUniversity(newUniv.id);
  if (checkU.status !== 'archived') throw new Error('Archiving failed');
  console.log('Archived university successfully');

  console.log('--- TEST 5: Reference check on OU & JNTUH ---');
  const ouRef = academicCatalogService.checkUniversityReferences(ou.id);
  console.log('OU canDelete:', ouRef.canDelete, 'Reasons:', ouRef.reasons);
  if (ouRef.canDelete) throw new Error('OU should NOT be deletable!');

  let deleteBlocked = false;
  try {
    academicCatalogService.deleteUniversity(ou.id);
  } catch (e) {
    deleteBlocked = true;
    console.log('Properly blocked deletion of referenced university:', e.message);
  }
  if (!deleteBlocked) throw new Error('OU deletion should have been blocked');

  console.log('--- TEST 6: Clean deletion of unreferenced test university ---');
  academicCatalogService.deleteUniversity(newUniv.id);
  const deletedCheck = academicCatalogService.getUniversity(newUniv.id);
  if (deletedCheck) throw new Error('Test university should be deleted');
  console.log('Successfully deleted test university');

  console.log('--- TEST 7: Audit history verified ---');
  const auditLogs = auditHistoryService.getAllAuditEvents();
  console.log('Recent audit events logged:', auditLogs.length);
  auditLogs.slice(0, 3).forEach(l => console.log('Log:', l.title, '| Action:', l.action, '| Entity:', l.entityName));

  console.log('>>> ALL CRUD LOGIC TESTS PASSED SUCCESSFULLY! <<<');
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
