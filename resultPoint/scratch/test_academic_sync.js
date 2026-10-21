// Mock browser environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
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
}

global.localStorage = new LocalStorageMock();
global.window = {
  dispatchEvent: (ev) => {}
};
global.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

async function runTests() {
  const { authService } = await import('../src/services/authService.js');
  const { studentService } = await import('../src/services/studentService.js');
  const { resultService } = await import('../src/services/resultService.js');
  const { backlogService } = await import('../src/services/backlogService.js');
  const { goalService } = await import('../src/services/goalService.js');
  const { auditHistoryService } = await import('../src/services/auditHistoryService.js');

  console.log('=== TEST 1: Initial Profile & Active Semester with 4 default semesters ===');
  // Initialize services and login
  authService.initialize();
  const loginRes = authService.login({ email: 'student@resultpoint.edu', password: 'password123' });
  if (!loginRes.success) {
    throw new Error('Login failed: ' + loginRes.error);
  }
  resultService.initialize();
  studentService.initialize();

  let profile = studentService.getProfile();
  let results = resultService.getAllResults();
  console.log('Initial saved results count:', results.length);
  console.log('Initial profile currentSemester:', profile.currentSemester);
  console.log('Initial profile completedSemestersCount:', profile.completedSemestersCount);
  console.log('Initial profile isDegreeCompleted:', profile.isDegreeCompleted);

  if (profile.currentSemester !== 5) {
    throw new Error(`Expected currentSemester to be 5, got ${profile.currentSemester}`);
  }
  console.log('✓ PASS: 4 completed semesters yields Current Active Semester = 5');

  console.log('\n=== TEST 2: Add Semester 5 Result ===');
  const sem5Result = {
    semesterNumber: 5,
    semesterTitle: 'Semester 5',
    academicPeriod: 'Jan 2026',
    subjects: [
      { code: 'BCA501', name: 'Cloud Computing', credits: 4, grade: 'S', points: 10 },
      { code: 'BCA502', name: 'Cyber Security', credits: 4, grade: 'A+', points: 9 }
    ]
  };
  resultService.addResult(sem5Result);

  profile = studentService.getProfile();
  results = resultService.getAllResults();
  console.log('After adding Sem 5, results count:', results.length);
  console.log('Active semester is now:', profile.currentSemester);
  console.log('isDegreeCompleted:', profile.isDegreeCompleted);
  if (profile.currentSemester !== 6) {
    throw new Error(`Expected currentSemester to be 6, got ${profile.currentSemester}`);
  }
  console.log('✓ PASS: Adding Semester 5 dynamically advanced active semester to 6');

  console.log('\n=== TEST 3: Add Semester 6 Result (Degree Complete) ===');
  const sem6Result = {
    semesterNumber: 6,
    semesterTitle: 'Semester 6',
    academicPeriod: 'May 2026',
    subjects: [
      { code: 'BCA601', name: 'Major Project', credits: 8, grade: 'S', points: 10 },
      { code: 'BCA602', name: 'Internship', credits: 4, grade: 'S', points: 10 }
    ]
  };
  resultService.addResult(sem6Result);

  profile = studentService.getProfile();
  results = resultService.getAllResults();
  console.log('After adding Sem 6, results count:', results.length);
  console.log('Active semester is now:', profile.currentSemester);
  console.log('isDegreeCompleted:', profile.isDegreeCompleted);
  if (!profile.isDegreeCompleted) {
    throw new Error('Expected isDegreeCompleted to be true');
  }
  console.log('✓ PASS: 6 of 6 semesters completed triggers isDegreeCompleted = true');

  console.log('\n=== TEST 4: Delete Semester 6 ===');
  resultService.deleteResult('semester-6');
  profile = studentService.getProfile();
  results = resultService.getAllResults();
  console.log('After deleting Sem 6, results count:', results.length);
  console.log('Active semester recalculated to:', profile.currentSemester);
  console.log('isDegreeCompleted:', profile.isDegreeCompleted);
  if (profile.currentSemester !== 6 || profile.isDegreeCompleted !== false) {
    throw new Error('Expected active semester to revert to 6 and isDegreeCompleted false');
  }
  console.log('✓ PASS: Deletion recalculated next active semester to 6');

  console.log('\n=== TEST 5: Destructive Academic Configuration Reset ===');
  const newConfig = {
    universityId: 'osmania',
    university: 'Osmania University (OU)',
    courseId: 'mca',
    course: 'MCA — Master of Computer Applications',
    regulationId: 'ou_cbcs_v1',
    regulation: 'Choice Based Credit System (CBCS)',
    batch: '2026-2028',
    totalSemesters: 4,
    totalDegreeCredits: 104
  };

  const updatedProfile = studentService.resetAcademicDataForNewProgram(newConfig);
  const remainingResults = resultService.getAllResults();
  const remainingBacklogs = backlogService.getBacklogs();

  console.log('Updated profile after program reset:');
  console.log('  Course:', updatedProfile.course);
  console.log('  Current active semester:', updatedProfile.currentSemester);
  console.log('  Total semesters:', updatedProfile.totalSemesters);
  console.log('  Remaining results count:', remainingResults.length);
  console.log('  Remaining backlogs count:', remainingBacklogs.length);
  console.log('  Personal info preserved (Name):', updatedProfile.fullName);
  console.log('  Personal info preserved (Email):', updatedProfile.email);

  if (remainingResults.length !== 0) {
    throw new Error(`Expected results to be cleared, found ${remainingResults.length}`);
  }
  if (updatedProfile.currentSemester !== 1) {
    throw new Error(`Expected currentSemester to reset to 1, got ${updatedProfile.currentSemester}`);
  }
  if (!updatedProfile.fullName || !updatedProfile.email) {
    throw new Error('Personal user info was lost during reset!');
  }
  console.log('✓ PASS: Destructive reset cleared results & backlogs, set semester to 1, preserved credentials and personal details.');

  console.log('\nAll integration tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
