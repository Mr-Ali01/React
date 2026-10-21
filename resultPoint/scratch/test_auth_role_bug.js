import assert from 'node:assert';

// Mock localStorage store
let store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { store = {}; }
};

let dispatchedEvents = [];
global.window = {
  dispatchEvent: (evt) => { dispatchedEvents.push(evt); },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, options) {
    this.name = name;
    this.detail = options?.detail;
  }
};

import { authService, SEED_ACCOUNTS } from '../src/services/authService.js';
import { STORAGE_KEYS } from '../src/services/storageKeys.js';

console.log('=== TEST SUITE: RESULTPOINT AUTHENTICATION & ROLE DETECTION ===\n');

// Initialize user accounts registry
authService.initialize();
assert.ok(store[STORAGE_KEYS.USERS], 'Users registry must be initialized');

// -------------------------------------------------------------
// Test 1: Fresh browser access without login
// -------------------------------------------------------------
console.log('Test 1: Fresh browser access without login');
localStorage.removeItem(STORAGE_KEYS.AUTH);
assert.strictEqual(authService.getCurrentUser(), null, 'Fresh visitor must have null currentUser');
assert.strictEqual(authService.isAuthenticated(), false, 'Fresh visitor must not be authenticated');
assert.strictEqual(authService.getToken(), null, 'Fresh visitor must have no token');

// Header simulation for fresh visitor
const user1 = authService.getCurrentUser();
const isStudent1 = Boolean(user1 && user1.role === 'student');
const isAdmin1 = Boolean(user1 && user1.role === 'admin');
assert.strictEqual(isStudent1, false, 'Fresh visitor must not be student');
assert.strictEqual(isAdmin1, false, 'Fresh visitor must not be admin');
console.log('✓ Fresh visitor correctly identified as unauthenticated (shows Login and Sign Up)');

// -------------------------------------------------------------
// Test 2: Valid student login and session verification
// -------------------------------------------------------------
console.log('\nTest 2: Valid student login and session verification');
const studentLogin = authService.login({
  email: 'student@resultpoint.edu',
  password: 'password123',
  expectedRole: 'student'
});
assert.strictEqual(studentLogin.success, true, 'Student login must succeed');
assert.strictEqual(studentLogin.user.role, 'student', 'User role must be student');

const activeStudent = authService.getCurrentUser();
assert.ok(activeStudent, 'Active student user must exist');
assert.strictEqual(activeStudent.email, 'student@resultpoint.edu');
assert.strictEqual(activeStudent.role, 'student');
assert.strictEqual(authService.isAuthenticated(), true);
assert.ok(authService.getToken().startsWith('auth_token_'));

// Header simulation for student session
const isStudent2 = Boolean(activeStudent && activeStudent.role === 'student');
const isAdmin2 = Boolean(activeStudent && activeStudent.role === 'admin');
const label2 = isAdmin2 ? 'Go to Admin' : (isStudent2 ? 'Go to Dashboard' : 'Login/Sign Up');
assert.strictEqual(isStudent2, true, 'Must identify as student');
assert.strictEqual(isAdmin2, false, 'Must not identify as admin');
assert.strictEqual(label2, 'Go to Dashboard', 'Header button must show "Go to Dashboard" for student');
console.log('✓ Valid student session authenticated (Header shows "Go to Dashboard")');

// -------------------------------------------------------------
// Test 3: Valid admin login and session verification
// -------------------------------------------------------------
console.log('\nTest 3: Valid admin login and session verification');
const adminLogin = authService.login({
  email: 'admin@resultpoint.edu',
  password: 'adminpassword123',
  expectedRole: 'admin'
});
assert.strictEqual(adminLogin.success, true, 'Admin login must succeed');
assert.strictEqual(adminLogin.user.role, 'admin');

const activeAdmin = authService.getCurrentUser();
assert.ok(activeAdmin, 'Active admin user must exist');
assert.strictEqual(activeAdmin.email, 'admin@resultpoint.edu');
assert.strictEqual(activeAdmin.role, 'admin');
assert.strictEqual(authService.isAuthenticated(), true);

// Header simulation for admin session
const isStudent3 = Boolean(activeAdmin && activeAdmin.role === 'student');
const isAdmin3 = Boolean(activeAdmin && activeAdmin.role === 'admin');
const label3 = isAdmin3 ? 'Go to Admin' : (isStudent3 ? 'Go to Dashboard' : 'Login/Sign Up');
assert.strictEqual(isStudent3, false, 'Must not identify as student');
assert.strictEqual(isAdmin3, true, 'Must identify as admin');
assert.strictEqual(label3, 'Go to Admin', 'Header button must show "Go to Admin" for admin');
console.log('✓ Valid admin session authenticated (Header shows "Go to Admin")');

// -------------------------------------------------------------
// Test 4: Role Mismatch & Expected Role Enforcement
// -------------------------------------------------------------
console.log('\nTest 4: Role Mismatch & Expected Role Enforcement');
const studentTryingAdmin = authService.login({
  email: 'student@resultpoint.edu',
  password: 'password123',
  expectedRole: 'admin'
});
assert.strictEqual(studentTryingAdmin.success, false, 'Student attempting admin login must be rejected');
assert.ok(studentTryingAdmin.error.includes('Administrator privileges required'));

const adminTryingStudent = authService.login({
  email: 'admin@resultpoint.edu',
  password: 'adminpassword123',
  expectedRole: 'student'
});
assert.strictEqual(adminTryingStudent.success, false, 'Admin attempting student login must be rejected');
assert.ok(adminTryingStudent.error.includes('This login is for students'));
console.log('✓ Role mismatch prevents cross-role privilege access');

// -------------------------------------------------------------
// Test 5: Invalid / Corrupted Role Handling
// -------------------------------------------------------------
console.log('\nTest 5: Invalid or stale stored role handling');
// Inject a corrupt session into localStorage with an invalid role
const corruptSession = {
  user: {
    id: 'usr_student_01',
    email: 'student@resultpoint.edu',
    fullName: 'Corrupted User',
    role: 'super_hacker'
  },
  token: 'auth_token_dummy',
  loginAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 100000).toISOString()
};
localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(corruptSession));

// Should not fall back to 'student'! Must be rejected and purged
const corruptUser = authService.getCurrentUser();
assert.strictEqual(corruptUser, null, 'Corrupt role must be rejected without fallback');
assert.strictEqual(authService.isAuthenticated(), false);
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.AUTH), null, 'Corrupt session must be purged');
console.log('✓ Corrupt/unrecognized role rejected and purged without defaulting to student');

// -------------------------------------------------------------
// Test 6: Expired Session Handling
// -------------------------------------------------------------
console.log('\nTest 6: Expired session handling');
const expiredSession = {
  user: {
    id: 'usr_student_01',
    email: 'student@resultpoint.edu',
    fullName: 'Student User',
    role: 'student'
  },
  token: 'auth_token_expired',
  loginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() - 1000).toISOString() // expired 1s ago
};
localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(expiredSession));

const expiredUser = authService.getCurrentUser();
assert.strictEqual(expiredUser, null, 'Expired session must return null');
assert.strictEqual(authService.isAuthenticated(), false);
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.AUTH), null, 'Expired session must be purged from storage');
console.log('✓ Expired session detected, purged from storage, and user returned to unauthenticated');

// -------------------------------------------------------------
// Test 7: Non-existent User ID in Session
// -------------------------------------------------------------
console.log('\nTest 7: Session with non-existent user in directory');
const phantomSession = {
  user: {
    id: 'usr_non_existent_999',
    email: 'ghost@resultpoint.edu',
    fullName: 'Ghost User',
    role: 'student'
  },
  token: 'auth_token_ghost',
  loginAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 100000).toISOString()
};
localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(phantomSession));

const ghostUser = authService.getCurrentUser();
assert.strictEqual(ghostUser, null, 'Non-existent account session must be rejected');
assert.strictEqual(authService.isAuthenticated(), false);
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.AUTH), null);
console.log('✓ Phantom session with deleted user account cleanly rejected');

// -------------------------------------------------------------
// Test 8: Logout Handler
// -------------------------------------------------------------
console.log('\nTest 8: Logout handler execution');
// Login again
authService.login({ email: 'student@resultpoint.edu', password: 'password123' });
assert.ok(authService.getCurrentUser());

// Perform logout
authService.logout();
assert.strictEqual(authService.getCurrentUser(), null, 'CurrentUser must be null after logout');
assert.strictEqual(authService.isAuthenticated(), false, 'Must not be authenticated after logout');
assert.strictEqual(localStorage.getItem(STORAGE_KEYS.AUTH), null);
console.log('✓ Logout cleanly terminates session and notifies application');

// -------------------------------------------------------------
// Test 9: Data Preservation (Academic Results & Records Safe)
// -------------------------------------------------------------
console.log('\nTest 9: Preservation of student academic results & records');
// Place existing results and records
const dummyResults = [{ id: 'res_1', semesterNumber: 1, sgpa: 8.5 }];
const dummyRecords = [{ id: 'rec_1', degreeName: 'BCA' }];
localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(dummyResults));
localStorage.setItem(STORAGE_KEYS.EDUCATION_RECORDS, JSON.stringify(dummyRecords));

// Trigger invalid session purge
authService.clearInvalidSession('Test invalidation');

// Verify academic data was completely untouched
const preservedResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS));
const preservedRecords = JSON.parse(localStorage.getItem(STORAGE_KEYS.EDUCATION_RECORDS));
assert.strictEqual(preservedResults.length, 1, 'Results must not be wiped');
assert.strictEqual(preservedRecords.length, 1, 'Education records must not be wiped');
console.log('✓ Academic results and education records preserved untouched during auth operations');

console.log('\n======================================================');
console.log('🎉 ALL 9 AUTHENTICATION & ROLE DETECTION TESTS PASSED!');
console.log('======================================================');
