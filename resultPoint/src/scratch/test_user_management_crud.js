/**
 * ResultPoint Admin Dashboard — Phase 3A: Users Management CRUD Test Suite
 *
 * Comprehensive automated verification covering:
 * - Seed preservation and idempotent initialization
 * - User listing and sensitive credential sanitization
 * - Create user validation (name, email format, duplicate email, role, password, catalog binding)
 * - Edit user operations and stable ID preservation
 * - Account status transitions (Active, Inactive, Suspended)
 * - Inactive/Suspended login defenses
 * - Search and filtering (role, status, university, search query)
 * - Reference detection (results, calculations, backlogs, education records)
 * - Guarded deletion and safe deactivation
 * - Primary administrator deletion protection
 * - Permanent deletion of unreferenced user
 * - Audit history event recording (USER_CREATED, USER_UPDATED, USER_STATUS_CHANGED, USER_DEACTIVATED, USER_DELETED)
 * - Dashboard statistics reflection and event emission
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

const emittedEvents = [];
class CustomEventMock {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict ? eventInitDict.detail : null;
  }
}
global.CustomEvent = CustomEventMock;
global.Event = CustomEventMock;
global.window = {
  dispatchEvent: (evt) => {
    emittedEvents.push(evt);
  }
};

// Dynamic imports
const { STORAGE_KEYS } = await import('../services/storageKeys.js');
const { authService } = await import('../services/authService.js');
const { userService } = await import('../services/userService.js');
const { adminDashboardService } = await import('../services/adminDashboardService.js');
const { auditHistoryService } = await import('../services/auditHistoryService.js');

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
  console.log('======================================================================');
  console.log('ResultPoint Phase 3A: Users Management CRUD Automated Test Suite');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Canonical Seed Users Preservation & Idempotence
  // -------------------------------------------------------------------------
  console.log('--- Test 1: Canonical Seed Users Preservation & Idempotence ---');
  userService.initialize();
  const initialUsers = userService.getAllUsers();
  assert(Array.isArray(initialUsers) && initialUsers.length >= 2, 'Seed users loaded successfully (at least 2 accounts)');

  const studentUser = initialUsers.find((u) => u.email === 'student@resultpoint.edu');
  assert(Boolean(studentUser), 'Canonical student seed account exists');
  assert(studentUser.role === 'student', 'Student seed account role is "student"');
  assert(studentUser.status === 'Active', 'Student seed account status is "Active"');

  const adminUser = initialUsers.find((u) => u.email === 'admin@resultpoint.edu');
  assert(Boolean(adminUser), 'Canonical administrator seed account exists');
  assert(adminUser.role === 'admin', 'Administrator seed account role is "admin"');
  assert(adminUser.id === 'usr_admin_01', 'Administrator seed account has stable ID "usr_admin_01"');

  // Re-running initialization should be idempotent and not duplicate accounts
  userService.initialize();
  const reloadedUsers = userService.getAllUsers();
  assert(reloadedUsers.length === initialUsers.length, 'Idempotent initialization preserves user count without duplicates');

  // -------------------------------------------------------------------------
  // TEST 2: Credential Sanitization
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Sensitive Credential Sanitization ---');
  initialUsers.forEach((u) => {
    assert(u.password === undefined, `Password is omitted from user listing for ${u.email}`);
    assert(u.token === undefined, `Token is omitted from user listing for ${u.email}`);
  });

  const studentFetched = userService.getUserById(studentUser.id);
  assert(studentFetched.password === undefined, 'Password omitted in standard getUserById retrieval');

  // -------------------------------------------------------------------------
  // TEST 3: Create User Validation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Create User Validations ---');

  // 3a: Empty/short name
  let nameErr = false;
  try {
    userService.createUser({ fullName: 'A', email: 'valid@edu.in', password: 'password123' });
  } catch (err) {
    nameErr = true;
    assert(err.message.includes('Full Name is required'), 'Rejects user with invalid full name');
  }
  assert(nameErr, 'Name validation triggered');

  // 3b: Invalid email format
  let emailFormatErr = false;
  try {
    userService.createUser({ fullName: 'Valid Name', email: 'not-an-email', password: 'password123' });
  } catch (err) {
    emailFormatErr = true;
    assert(err.message.includes('valid email address'), 'Rejects user with malformed email');
  }
  assert(emailFormatErr, 'Email format validation triggered');

  // 3c: Duplicate email
  let duplicateErr = false;
  try {
    userService.createUser({ fullName: 'Duplicate User', email: 'student@resultpoint.edu', password: 'password123' });
  } catch (err) {
    duplicateErr = true;
    assert(err.message.includes('already exists'), 'Rejects user with duplicate email');
  }
  assert(duplicateErr, 'Duplicate email validation triggered');

  // 3d: Invalid role
  let roleErr = false;
  try {
    userService.createUser({ fullName: 'Test User', email: 'test@edu.in', role: 'super_hacker', password: 'password123' });
  } catch (err) {
    roleErr = true;
    assert(err.message.includes('Invalid role specified'), 'Rejects unapproved user role');
  }
  assert(roleErr, 'Role validation triggered');

  // 3e: Password length (<6)
  let pwdErr = false;
  try {
    userService.createUser({ fullName: 'Test User', email: 'test@edu.in', role: 'student', password: '123' });
  } catch (err) {
    pwdErr = true;
    assert(err.message.includes('at least 6 characters'), 'Rejects password shorter than 6 characters');
  }
  assert(pwdErr, 'Password length validation triggered');

  // 3f: Invalid catalog reference
  let catalogErr = false;
  try {
    userService.createUser({
      fullName: 'Test Student',
      email: 'student.invalid@edu.in',
      role: 'student',
      password: 'password123',
      universityId: 'non-existent-university-xyz'
    });
  } catch (err) {
    catalogErr = true;
    assert(err.message.includes('not found in academic catalog'), 'Rejects invalid university catalog reference');
  }
  assert(catalogErr, 'Catalog reference validation triggered');

  // -------------------------------------------------------------------------
  // TEST 4: Successful User Creation & Event Emission
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Successful User Creation ---');
  emittedEvents.length = 0; // Clear events

  const createdStudent = userService.createUser({
    fullName: 'Jane Doe',
    email: 'jane.doe@resultpoint.edu',
    password: 'securepassword123',
    role: 'student',
    status: 'Active',
    universityId: 'osmania',
    courseId: 'bca',
    regulationId: 'ou-bca-cbcs',
    hallTicketNumber: 'HT-998877',
    currentSemester: 2,
    batch: '2025-2027',
    phoneNumber: '+91 91234 56789'
  });

  assert(Boolean(createdStudent && createdStudent.id), 'New user created with unique ID');
  assert(createdStudent.fullName === 'Jane Doe', 'User name saved accurately');
  assert(createdStudent.email === 'jane.doe@resultpoint.edu', 'User email saved accurately');
  assert(createdStudent.role === 'student', 'User role saved accurately');
  assert(createdStudent.university === 'Osmania University', 'Academic university resolved from catalog');
  assert(createdStudent.course.includes('BCA'), 'Academic course resolved from catalog');
  assert(createdStudent.password === undefined, 'Password omitted in create return payload');

  // Check event emitted
  const userCreatedEvent = emittedEvents.find((e) => e.type === 'rp_users_updated');
  assert(Boolean(userCreatedEvent), 'Dispatched rp_users_updated event upon user creation');

  // Verify retrieval
  const retrievedJane = userService.getUserById(createdStudent.id);
  assert(retrievedJane !== null, 'User can be retrieved by unique ID');
  assert(retrievedJane.email === 'jane.doe@resultpoint.edu', 'Retrieved user matches created record');

  // -------------------------------------------------------------------------
  // TEST 5: Update User Profile & Stable ID
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Update User Profile ---');
  const updatedJane = userService.updateUser(createdStudent.id, {
    fullName: 'Jane Doe Updated',
    phoneNumber: '+91 99999 88888',
    currentSemester: 3
  });

  assert(updatedJane.id === createdStudent.id, 'User ID remains strictly stable during updates');
  assert(updatedJane.fullName === 'Jane Doe Updated', 'Full name updated successfully');
  assert(updatedJane.phoneNumber === '+91 99999 88888', 'Phone number updated successfully');
  assert(updatedJane.currentSemester === 3, 'Semester updated successfully');

  // Attempting to update to an existing email should fail
  let emailCollisionErr = false;
  try {
    userService.updateUser(createdStudent.id, { email: 'student@resultpoint.edu' });
  } catch (err) {
    emailCollisionErr = true;
    assert(err.message.includes('already in use'), 'Rejects updating email to an existing account email');
  }
  assert(emailCollisionErr, 'Email collision check triggered during update');

  // Primary admin cannot be downgraded
  let adminDowngradeErr = false;
  try {
    userService.updateUser('usr_admin_01', { role: 'student' });
  } catch (err) {
    adminDowngradeErr = true;
    assert(err.message.includes('Cannot downgrade the primary platform administrator'), 'Prevents downgrading primary admin');
  }
  assert(adminDowngradeErr, 'Admin role protection triggered');

  // -------------------------------------------------------------------------
  // TEST 6: Account Status Transitions & Login Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Account Status Transitions & Login Enforcement ---');

  // 6a: Change status to Inactive
  const deactivatedJane = userService.setUserStatus(createdStudent.id, 'Inactive', 'Semester leave');
  assert(deactivatedJane.status === 'Inactive', 'User status transitioned to Inactive');

  // 6b: Inactive account cannot log in
  const inactiveLogin = authService.login({
    email: 'jane.doe@resultpoint.edu',
    password: 'securepassword123',
    expectedRole: 'student'
  });
  assert(inactiveLogin.success === false, 'Inactive user login is rejected');
  assert(inactiveLogin.error.includes('inactive'), 'Informative inactive account error message returned');

  // 6c: Change status to Suspended
  const suspendedJane = userService.setUserStatus(createdStudent.id, 'Suspended', 'Policy violation');
  assert(suspendedJane.status === 'Suspended', 'User status transitioned to Suspended');

  // 6d: Suspended account cannot log in
  const suspendedLogin = authService.login({
    email: 'jane.doe@resultpoint.edu',
    password: 'securepassword123',
    expectedRole: 'student'
  });
  assert(suspendedLogin.success === false, 'Suspended user login is rejected');
  assert(suspendedLogin.error.includes('suspended'), 'Informative suspended account error message returned');

  // 6e: Reactivate account
  const reactivatedJane = userService.setUserStatus(createdStudent.id, 'Active', 'Reinstated');
  assert(reactivatedJane.status === 'Active', 'User status reactivated to Active');

  const activeLogin = authService.login({
    email: 'jane.doe@resultpoint.edu',
    password: 'securepassword123',
    expectedRole: 'student'
  });
  assert(activeLogin.success === true, 'Reactivated user can log in successfully');

  // Verify that an active logged-in user cannot be deleted (self-deletion guard)
  const selfDeleteCheck = userService.checkUserReferences(createdStudent.id);
  assert(selfDeleteCheck.canDelete === false, 'Logged-in user cannot delete own account');
  assert(selfDeleteCheck.isSelf === true, 'Self-delete protection identified isSelf: true');

  // Switch session back to platform admin
  const adminLoginResult = authService.login({
    email: 'admin@resultpoint.edu',
    password: 'adminpassword123',
    expectedRole: 'admin'
  });
  assert(adminLoginResult.success === true, 'Admin login restored successfully');

  // -------------------------------------------------------------------------
  // TEST 7: Search and Filtering Logic
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Search & Filtering Logic ---');

  // Search by name
  const nameSearchResults = userService.getAllUsers({ search: 'Jane' });
  assert(nameSearchResults.some((u) => u.id === createdStudent.id), 'Search by name returns matching user');

  // Search by email
  const emailSearchResults = userService.getAllUsers({ search: 'jane.doe' });
  assert(emailSearchResults.some((u) => u.id === createdStudent.id), 'Search by email returns matching user');

  // Search by hall ticket
  const htSearchResults = userService.getAllUsers({ search: '998877' });
  assert(htSearchResults.some((u) => u.id === createdStudent.id), 'Search by hall ticket returns matching user');

  // Filter by role
  const onlyAdmins = userService.getAllUsers({ role: 'admin' });
  assert(onlyAdmins.every((u) => u.role === 'admin'), 'Role filter "admin" returns exclusively administrators');

  const onlyStudents = userService.getAllUsers({ role: 'student' });
  assert(onlyStudents.every((u) => u.role === 'student'), 'Role filter "student" returns exclusively students');

  // Filter by status
  const onlyActive = userService.getAllUsers({ status: 'active' });
  assert(onlyActive.every((u) => u.status === 'Active'), 'Status filter returns exclusively active accounts');

  // -------------------------------------------------------------------------
  // TEST 8: Dependency Detection & Guarded Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Dependency Detection & Guarded Deletion ---');

  // Check references for primary student with semester results
  const studentRefCheck = userService.checkUserReferences('usr_student_01');
  assert(studentRefCheck.canDelete === false, 'Primary student account reports canDelete: false');
  assert(studentRefCheck.hasReferences === true, 'Dependencies detected for primary student');
  assert(studentRefCheck.reasons.length > 0, 'Detailed reasons provided for blocking deletion');

  // Attempting deleteUser on referenced student must throw error
  let blockedDelete = false;
  try {
    userService.deleteUser('usr_student_01');
  } catch (err) {
    blockedDelete = true;
    assert(err.message.includes('Cannot permanently delete'), 'deleteUser throws informative error blocking deletion');
  }
  assert(blockedDelete, 'Destructive deletion of referenced student was blocked');

  // Attempting to delete primary admin must throw error
  let adminDeleteBlocked = false;
  try {
    userService.deleteUser('usr_admin_01');
  } catch (err) {
    adminDeleteBlocked = true;
    assert(err.message.includes('primary platform administrator'), 'deleteUser blocks deleting primary admin');
  }
  assert(adminDeleteBlocked, 'Primary admin deletion protection verified');

  // Safe Deactivation alternative for referenced user
  const deactivatedSeed = userService.deactivateUser('usr_student_01', 'Graduation archive');
  assert(deactivatedSeed.status === 'Inactive', 'Referenced user successfully deactivated without data loss');
  // Re-activate for test suite continuity
  userService.setUserStatus('usr_student_01', 'Active', 'Test reset');

  // -------------------------------------------------------------------------
  // TEST 9: Permanent Deletion of Unreferenced User
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Clean Deletion of Unreferenced User ---');

  // Jane Doe has no semester results or calculation logs
  const janeRefCheck = userService.checkUserReferences(createdStudent.id);
  assert(janeRefCheck.canDelete === true, 'Unreferenced user reports canDelete: true');

  const deleteResult = userService.deleteUser(createdStudent.id);
  assert(deleteResult.success === true, 'deleteUser returns success for unreferenced user');
  assert(deleteResult.deletedUser.id === createdStudent.id, 'Deleted user object returned');

  const afterDeleteUser = userService.getUserById(createdStudent.id);
  assert(afterDeleteUser === null, 'Deleted user no longer exists in user directory');

  // -------------------------------------------------------------------------
  // TEST 10: Audit History Logging
  // -------------------------------------------------------------------------
  console.log('\n--- Test 10: Audit History Logging ---');
  const auditLogs = auditHistoryService.getAllAuditEvents();
  const userAuditEvents = auditLogs.filter((a) => a.entityType === 'user');

  assert(userAuditEvents.length >= 3, 'Audit logs recorded for user management operations');

  const createdLog = userAuditEvents.find((a) => a.action === 'USER_CREATED');
  assert(Boolean(createdLog), 'USER_CREATED action logged in audit history');
  assert(createdLog.details.includes('Jane Doe'), 'Audit log includes safe user name');
  assert(createdLog.details.includes('password') === false, 'Audit log does not expose passwords');

  const updatedLog = userAuditEvents.find((a) => a.action === 'USER_UPDATED');
  assert(Boolean(updatedLog), 'USER_UPDATED action logged in audit history');

  const statusLog = userAuditEvents.find((a) => a.action === 'USER_STATUS_CHANGED' || a.action === 'USER_DEACTIVATED');
  assert(Boolean(statusLog), 'USER_STATUS_CHANGED or USER_DEACTIVATED action logged in audit history');

  const deletedLog = userAuditEvents.find((a) => a.action === 'USER_DELETED');
  assert(Boolean(deletedLog), 'USER_DELETED action logged in audit history');

  // -------------------------------------------------------------------------
  // TEST 11: Admin Dashboard Statistics Integration
  // -------------------------------------------------------------------------
  console.log('\n--- Test 11: Admin Dashboard Statistics Integration ---');
  const stats = adminDashboardService.getStats();
  assert(stats.totalStudents !== undefined, 'totalStudents metric exists on dashboard');
  assert(stats.activeUsers !== undefined, 'activeUsers metric exists on dashboard');

  const recentUsers = adminDashboardService.getRecentUsers();
  assert(Array.isArray(recentUsers) && recentUsers.length > 0, 'getRecentUsers returns registered users');
  assert(recentUsers[0].name !== undefined, 'Recent user has sanitized name');
  assert(recentUsers[0].password === undefined, 'Recent user does not expose password');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`Phase 3A Users Management CRUD Tests Completed: ${passedCount} / ${totalCount} Assertions Passed`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
