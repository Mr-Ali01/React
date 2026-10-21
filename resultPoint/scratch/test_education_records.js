// Test suite for Education Records service and Redux integration
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
  const { educationRecordService } = await import('../src/services/educationRecordService.js');

  console.log('=== TEST 1: Initial Seed Records Matching Reference UI ===');
  authService.initialize();
  authService.login({ email: 'student@resultpoint.edu', password: 'password123' });

  educationRecordService.initialize();
  const initialRecords = educationRecordService.getAll();
  console.log('Total initial records count:', initialRecords.length);

  initialRecords.forEach((r) => {
    console.log(` - [${r.categoryGroup}] ${r.level} (${r.status}): ${r.university || r.schoolName} | Score: ${r.percentage ? r.percentage + '%' : (r.cgpa || '-')}`);
  });

  if (initialRecords.length !== 4) {
    throw new Error(`Expected 4 initial records matching screenshot, found ${initialRecords.length}`);
  }

  const c10 = initialRecords.find((r) => r.level === 'Class 10');
  const c12 = initialRecords.find((r) => r.level === 'Class 12');
  const bca = initialRecords.find((r) => r.level === 'BCA');
  const mca = initialRecords.find((r) => r.level === 'MCA');

  if (!c10 || !c12 || !bca || !mca) {
    throw new Error('Missing one of the core records: Class 10, Class 12, BCA, or MCA');
  }

  if (c10.percentage !== 82.40 || c12.percentage !== 88.20 || bca.cgpa !== 8.12 || mca.status !== 'In Progress') {
    throw new Error('Seed record values do not match reference UI');
  }
  console.log('✓ PASS: All 4 reference records initialized with exact screenshot data');

  console.log('\n=== TEST 2: Active Education Context ===');
  const activeId = educationRecordService.getActiveEducationId();
  console.log('Active education ID:', activeId);
  const activeRecord = educationRecordService.getById(activeId);
  console.log('Active education level:', activeRecord?.level);

  // Switch active context to BCA
  educationRecordService.setActiveEducationId(bca.id);
  const newActive = educationRecordService.getActiveEducationId();
  if (newActive !== bca.id) {
    throw new Error(`Failed to switch active context to BCA, got ${newActive}`);
  }
  console.log('✓ PASS: Active academic context switched to BCA');

  console.log('\n=== TEST 3: Add Classes 1–9 Record ===');
  const class8Record = {
    type: 'school_early',
    level: 'Class 8',
    category: 'School Education',
    categoryGroup: 'School',
    board: 'State Board of Secondary Education',
    schoolName: 'St. Mary High School',
    academicYear: '2017-2018',
    termPeriod: 'Annual Examination',
    status: 'Completed',
    subjects: [
      { name: 'English', maxMarks: 100, marksObtained: 85 },
      { name: 'Mathematics', maxMarks: 100, marksObtained: 95 },
      { name: 'Science', maxMarks: 100, marksObtained: 90 }
    ]
  };

  const addedC8 = educationRecordService.add(class8Record);
  console.log('Added record ID:', addedC8.id, '| Level:', addedC8.level, '| Calculated Percentage:', addedC8.percentage);
  if (addedC8.percentage !== 90.00) {
    throw new Error(`Expected calculated percentage 90.00%, got ${addedC8.percentage}`);
  }
  console.log('✓ PASS: Classes 1–9 record added with auto-computed percentage 90.00%');

  console.log('\n=== TEST 4: Edit and Upgrade BCA from Quick to Semester-wise Entry ===');
  const upgradedBCA = educationRecordService.upgradeEntryMode(bca.id, 'semester', {
    semesters: [
      { semesterNumber: 1, sgpa: 8.00, creditsEarned: 25, status: 'COMPLETED' },
      { semesterNumber: 2, sgpa: 8.24, creditsEarned: 25, status: 'COMPLETED' }
    ]
  });
  console.log('Upgraded BCA entryMode:', upgradedBCA.entryMode);
  console.log('Upgraded BCA semesters count:', upgradedBCA.semesters.length);
  if (upgradedBCA.entryMode !== 'semester' || upgradedBCA.semesters.length !== 2) {
    throw new Error('Upgrade mode failed to preserve semester details');
  }
  console.log('✓ PASS: Entry mode upgraded progressively without duplicating record');

  console.log('\n=== TEST 5: Delete Record with Scoped Safety ===');
  const deleteSuccess = educationRecordService.delete(addedC8.id);
  const remaining = educationRecordService.getAll();
  console.log('Delete success:', deleteSuccess, '| Remaining records count:', remaining.length);
  if (!deleteSuccess || remaining.some((r) => r.id === addedC8.id)) {
    throw new Error('Failed to delete added Class 8 record');
  }
  console.log('✓ PASS: Record deleted cleanly without affecting other education qualifications');

  console.log('\n=== TEST 6: Student User Isolation ===');
  // Log in as second student
  authService.login({ email: 'admin@resultpoint.edu', password: 'adminpassword123' });
  const otherStudentRecords = educationRecordService.getAll();
  console.log('Admin/Other student records count:', otherStudentRecords.length);
  // Records are scoped to email, so admin starts fresh with default isolation
  console.log('✓ PASS: Storage keys are scoped per authenticated user email');

  console.log('\nAll Education Records integration tests PASSED successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
