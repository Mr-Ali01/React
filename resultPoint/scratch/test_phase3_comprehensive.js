import path from 'path';

// Mock storage and DOM environment
const store = {};
const sessionStore = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.sessionStorage = {
  getItem: (key) => sessionStore[key] || null,
  setItem: (key, val) => { sessionStore[key] = String(val); },
  removeItem: (key) => { delete sessionStore[key]; },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[key]); }
};
global.window = {
  location: { pathname: '/calculators/cgpa' },
  dispatchEvent: (event) => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.opts = opts;
  }
};

const { calculationSaveService } = await import('file:///c:/React/resultPoint/src/services/calculationSaveService.js');
const { STORAGE_KEYS } = await import('file:///c:/React/resultPoint/src/services/storageKeys.js');

console.log('====================================================');
console.log('RUNNING PHASE 3 COMPREHENSIVE AUTOMATED VERIFICATION');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`       Details: ${details}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------
// 1. Preservation & Sanitization
// ---------------------------------------------------------
console.log('--- Suite 1: Pending Calculation Preservation & Sanitization ---');
const rawCalc = {
  calculatorType: 'CGPA',
  title: 'Semester 6 Cumulative GPA',
  score: '8.85',
  scale: '10.0',
  query: '6 Semesters Total Credits: 132',
  metrics: [{ label: 'Total Credits', value: 132 }, { label: 'Grade Points', value: 1168 }],
  rawData: { semesters: [{ sem: 1, sgpa: 8.5 }, { sem: 2, sgpa: 9.0 }] },
  path: '/calculators/cgpa',
  // Malicious / sensitive fields that must be stripped:
  password: 'superSecretPassword123!',
  token: 'jwt-auth-bearer-token-xyz',
  authToken: 'secret-token-12345'
};

const savedPending = calculationSaveService.setPendingCalculation(rawCalc);
assert(savedPending !== null, 'setPendingCalculation returns sanitized object');
assert(savedPending.password === undefined, 'Stripped sensitive "password" field');
assert(savedPending.token === undefined, 'Stripped sensitive "token" field');
assert(savedPending.authToken === undefined, 'Stripped sensitive "authToken" field');
assert(savedPending.score === '8.85', 'Preserved calculated score accurately');
assert(savedPending.path === '/calculators/cgpa', 'Preserved source path');
assert(savedPending.rawData.semesters.length === 2, 'Preserved raw calculation inputs');

// Check that it is stored in both sessionStorage and localStorage for resilience across modal/tabs/refresh
assert(sessionStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) !== null, 'Stored in sessionStorage');
assert(localStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) !== null, 'Stored in localStorage');

// ---------------------------------------------------------
// 2. Retrieval & Modal/Tab Navigation Persistence
// ---------------------------------------------------------
console.log('\n--- Suite 2: Modal & Tab Navigation Persistence ---');
// Simulating user switching between Login and Signup tabs without completing auth:
let retrievedPending = calculationSaveService.getPendingCalculation();
assert(retrievedPending !== null, 'Retrieved pending calculation on tab toggle');
assert(retrievedPending.score === '8.85', 'Score matches original calculation without recalculation');
assert(retrievedPending.calculatorType === 'CGPA', 'Calculator type preserved accurately');

// Simulate modal close and reopen:
assert(calculationSaveService.getPendingCalculation() !== null, 'Pending calculation survives closing and reopening auth modal');

// ---------------------------------------------------------
// 3. Resume After Successful Authentication
// ---------------------------------------------------------
console.log('\n--- Suite 3: Resume After Successful Authentication ---');
const studentUser = {
  id: 'student_456',
  userId: 'student_456',
  fullName: 'Priya Sharma',
  email: 'priya@resultpoint.edu'
};

const saveRes = calculationSaveService.savePendingCalculationForUser(studentUser);
assert(saveRes.success === true, 'Successfully saved pending calculation for authenticated student');
assert(saveRes.record.userId === 'student_456', 'Saved calculation associated with correct student userId');
assert(saveRes.record.score === '8.85', 'Saved calculation has exact original score');

// Verify pending calculation is cleared after successful save
assert(calculationSaveService.getPendingCalculation() === null, 'Pending calculation cleared after successful save');
assert(sessionStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) === null, 'sessionStorage cleared after save');
assert(localStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) === null, 'localStorage cleared after save');

// Verify it exists in student's saved calculations
const studentCalculations = calculationSaveService.getSavedCalculations(studentUser);
assert(studentCalculations.length === 1, 'Calculation stored in student Calculation History');
assert(studentCalculations[0].tool.includes('CGPA'), 'Record has correct calculator tool name');

// ---------------------------------------------------------
// 4. Duplicate Prevention (Repeated Clicks)
// ---------------------------------------------------------
console.log('\n--- Suite 4: Duplicate Prevention on Repeated Save Clicks ---');
const repeatSaveRes = calculationSaveService.saveCalculation(rawCalc, studentUser);
assert(repeatSaveRes.success === true, 'Repeated call handled cleanly');
// Check student's saved count; duplicate check within 5s should prevent double entry:
const afterDuplicateAttempt = calculationSaveService.getSavedCalculations(studentUser);
assert(afterDuplicateAttempt.length === 1, 'Duplicate save within 5s prevented from adding duplicate history item');

// ---------------------------------------------------------
// 5. Account Isolation & Account Switching
// ---------------------------------------------------------
console.log('\n--- Suite 5: Account Isolation & Account Switching ---');
// User A creates a pending calculation while signed in or logged in as User A:
const userACalc = {
  calculatorType: 'Percentage',
  title: 'Percentage Calculator',
  score: '78.5%',
  originUserId: 'student_user_A'
};
// Store manually to simulate User A leaving a pending calculation
sessionStorage.setItem(STORAGE_KEYS.PENDING_CALCULATION, JSON.stringify({
  ...userACalc,
  originUserId: 'student_user_A',
  savedAt: new Date().toISOString()
}));

const userB = {
  id: 'student_user_B',
  userId: 'student_user_B',
  fullName: 'Rahul Verma',
  email: 'rahul@resultpoint.edu'
};

// When User B logs in, getPendingCalculation must discard User A's calculation!
const leakAttempt = calculationSaveService.getPendingCalculation(userB);
assert(leakAttempt === null, 'Cross-account isolation: User A calculation discarded when User B logs in');
assert(sessionStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) === null, 'Pending storage wiped on account mismatch to prevent leakage');

// ---------------------------------------------------------
// 6. Preservation on Failed Save (Retry Support)
// ---------------------------------------------------------
console.log('\n--- Suite 6: Preservation on Failed Save (Retry Support) ---');
const retryCalc = {
  calculatorType: 'Backlog',
  title: 'Backlog Impact',
  score: '2 Pending Papers',
  summary: 'Total Backlogs: 2 | Credit Deficit: 8'
};
calculationSaveService.setPendingCalculation(retryCalc);

// Attempt to save for unauthenticated user (simulates session expiration or failure):
const failedSave = calculationSaveService.savePendingCalculationForUser(null);
assert(failedSave.success === false, 'Save rejected when unauthenticated');
// Calculation must STILL be preserved in storage!
const preservedForRetry = calculationSaveService.getPendingCalculation();
assert(preservedForRetry !== null, 'Pending calculation preserved after failed save for retry');
assert(preservedForRetry.score === '2 Pending Papers', 'Retry calculation data remains intact');

// Now retry with authenticated user:
const retrySuccess = calculationSaveService.savePendingCalculationForUser(studentUser);
assert(retrySuccess.success === true, 'Retry save succeeds once authenticated');
assert(calculationSaveService.getPendingCalculation() === null, 'Pending calculation cleared after successful retry');

// ---------------------------------------------------------
// 7. Academic Records Separation
// ---------------------------------------------------------
console.log('\n--- Suite 7: Calculation History vs Official Academic Records Separation ---');
// Ensure official semester results in STORAGE_KEYS.SEMESTER_RESULTS were NOT modified:
const officialSemesterRecords = localStorage.getItem(STORAGE_KEYS.SEMESTER_RESULTS);
assert(officialSemesterRecords === null || !officialSemesterRecords.includes('2 Pending Papers'), 
  'Official semester results remain untouched by public calculator saves');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  console.log('ALL PHASE 3 REQUIREMENTS SUCCESSFULLY VERIFIED!');
} else {
  process.exit(1);
}
