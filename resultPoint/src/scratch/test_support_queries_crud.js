/**
 * ResultPoint Phase 3B: Support Queries Management CRUD Automated Test Suite
 *
 * Verifies:
 * 1. Seed query preservation and idempotent initialization.
 * 2. Query listing, retrieval, and search.
 * 3. Valid support query creation.
 * 4. Validation rules (required fields, email format, status, priority, admin assignment).
 * 5. Multi-criteria filtering (status, priority, category, assigned admin) and sorting.
 * 6. Status lifecycle transitions (Open -> In Progress -> Resolved -> Closed -> Reopened).
 * 7. Priority modifications and validation.
 * 8. Administrator assignment and role enforcement (blocking assignment to students).
 * 9. Threaded interaction history preservation (preventing message overwriting).
 * 10. Query-to-user relationships, profile resolution, and credential sanitization.
 * 11. User reference detection preventing destructive student deletion.
 * 12. Deletion of support tickets.
 * 13. Audit history logging with sanitized metadata.
 * 14. Admin dashboard statistics synchronization.
 * 15. Update event dispatching and public contact integration.
 */

// Mock browser localStorage and window environment for Node.js
const memoryStore = new Map();

globalThis.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
  get length() {
    return memoryStore.size;
  },
  key: (idx) => Array.from(memoryStore.keys())[idx] || null
};

const emittedEvents = [];
globalThis.window = {
  dispatchEvent: (event) => {
    emittedEvents.push(event);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
  }
};

let totalCount = 0;
let passedCount = 0;

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
  console.log('\n======================================================================');
  console.log('ResultPoint Phase 3B: Support Queries Management CRUD Test Suite');
  console.log('======================================================================');

  // Dynamic imports after localStorage mock is ready
  const { supportQueryService, QUERY_STATUSES, QUERY_PRIORITIES } = await import(
    '../services/supportQueryService.js'
  );
  const { userService } = await import('../services/userService.js');
  const { contactService } = await import('../services/contactService.js');
  const { adminDashboardService } = await import('../services/adminDashboardService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');

  // Ensure services are initialized
  userService.initialize();
  supportQueryService.initialize();

  // -------------------------------------------------------------------------
  // TEST 1: Preservation of Seed Queries & Idempotence
  // -------------------------------------------------------------------------
  console.log('\n--- Test 1: Seed Queries Preservation & Idempotence ---');
  const initialQueries = supportQueryService.getAllQueries();
  assert(Array.isArray(initialQueries), 'getAllQueries returns an array');
  assert(initialQueries.length >= 3, 'Seed queries loaded successfully (at least 3 default tickets)');

  const ouTicket = initialQueries.find((q) => q.ticketId === 'RP-TICK-OU-8921');
  assert(Boolean(ouTicket), 'Found seed ticket RP-TICK-OU-8921 in canonical store');
  assert(ouTicket.status === 'In Progress', 'Seed ticket RP-TICK-OU-8921 has status "In Progress"');
  assert(ouTicket.priority === 'High', 'Seed ticket RP-TICK-OU-8921 has priority "High"');
  assert(ouTicket.userId === 'usr_student_01', 'Seed ticket links to student user usr_student_01');

  const jntuTicket = initialQueries.find((q) => q.ticketId === 'RP-TICK-JNTU-4402');
  assert(Boolean(jntuTicket), 'Found seed ticket RP-TICK-JNTU-4402 in canonical store');
  assert(jntuTicket.status === 'Resolved', 'Seed ticket RP-TICK-JNTU-4402 has status "Resolved"');

  // Idempotence: Calling initialize again does not duplicate or reset records
  supportQueryService.initialize();
  const queriesAfterReinit = supportQueryService.getAllQueries();
  assert(queriesAfterReinit.length === initialQueries.length, 'Idempotent initialization preserves query count');

  // -------------------------------------------------------------------------
  // TEST 2: Listing & Retrieval Operations
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Listing & Retrieval Operations ---');
  const byId = supportQueryService.getQueryById('query_seed_01');
  assert(Boolean(byId), 'getQueryById retrieves query by internal ID');
  assert(byId.ticketId === 'RP-TICK-OU-8921', 'Retrieved query matches expected ticket ID');

  const byTicket = supportQueryService.getQueryById('RP-TICK-OU-8921');
  assert(Boolean(byTicket), 'getQueryById retrieves query by public ticket reference');
  assert(byTicket.id === 'query_seed_01', 'Retrieved query matches internal ID');

  const nonExistent = supportQueryService.getQueryById('non-existent-ticket-xyz');
  assert(nonExistent === null, 'getQueryById returns null for non-existent ticket');

  // -------------------------------------------------------------------------
  // TEST 3: Validation Safeguards
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Validation Safeguards ---');

  // 3a: Empty Name
  let nameErr = false;
  try {
    supportQueryService.createQuery({
      fullName: ' ',
      email: 'valid@student.edu',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.'
    });
  } catch (err) {
    nameErr = true;
    assert(err.message.includes('name is required'), 'Rejects empty requester full name');
  }
  assert(nameErr, 'Requester name validation triggered');

  // 3b: Malformed Email
  let emailErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'not-an-email',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.'
    });
  } catch (err) {
    emailErr = true;
    assert(err.message.includes('valid email'), 'Rejects malformed email address');
  }
  assert(emailErr, 'Email format validation triggered');

  // 3c: Empty Subject
  let subjectErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'ab',
      message: 'Valid message description goes here.'
    });
  } catch (err) {
    subjectErr = true;
    assert(err.message.includes('Subject must be at least 3 characters'), 'Rejects subject shorter than 3 chars');
  }
  assert(subjectErr, 'Subject validation triggered');

  // 3d: Empty Message
  let messageErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'Valid Subject',
      message: 'hi'
    });
  } catch (err) {
    messageErr = true;
    assert(err.message.includes('Message must be at least 5 characters'), 'Rejects message shorter than 5 chars');
  }
  assert(messageErr, 'Message length validation triggered');

  // 3e: Invalid Status
  let statusErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.',
      status: 'ArchivedBogus'
    });
  } catch (err) {
    statusErr = true;
    assert(err.message.includes('Status must be one of'), 'Rejects unapproved ticket status');
  }
  assert(statusErr, 'Status validation triggered');

  // 3f: Invalid Priority
  let priorityErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.',
      priority: 'SuperCrucial'
    });
  } catch (err) {
    priorityErr = true;
    assert(err.message.includes('Priority must be one of'), 'Rejects unapproved priority value');
  }
  assert(priorityErr, 'Priority validation triggered');

  // 3g: Invalid Assigned Admin
  let adminAssignErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.',
      assignedAdminId: 'non_existent_admin'
    });
  } catch (err) {
    adminAssignErr = true;
    assert(err.message.includes('does not exist'), 'Rejects assigning ticket to non-existent admin');
  }
  assert(adminAssignErr, 'Non-existent admin assignment prevented');

  // 3h: Attempting to assign student as admin must fail
  let studentAsAdminErr = false;
  try {
    supportQueryService.createQuery({
      fullName: 'Valid Name',
      email: 'student@resultpoint.edu',
      subject: 'Valid Subject',
      message: 'Valid message description goes here.',
      assignedAdminId: 'usr_student_01'
    });
  } catch (err) {
    studentAsAdminErr = true;
    assert(err.message.includes('not an administrator'), 'Rejects assigning ticket to a student account');
  }
  assert(studentAsAdminErr, 'Student role assignment prevented');

  // -------------------------------------------------------------------------
  // TEST 4: Successful Query Creation & Event Broadcasting
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Successful Query Creation & Event Broadcasting ---');
  emittedEvents.length = 0;

  const newTicket = supportQueryService.createQuery({
    fullName: 'Ananya Sharma',
    email: 'ananya.sharma@college.edu',
    subject: 'Marks to Percentage Conversion Inconsistency',
    category: 'Calculator Support',
    message: 'My college grade card shows 8.4 SGPA but your tool converted it to 79% instead of 84%. Please check JNTUH formulas.',
    priority: 'High',
    assignedAdminId: 'usr_admin_01'
  });

  assert(Boolean(newTicket && newTicket.id), 'Support query created with unique ID');
  assert(newTicket.ticketId.startsWith('RP-TICK-'), 'Generated formatted ticket reference starting with RP-TICK-');
  assert(newTicket.fullName === 'Ananya Sharma', 'Requester name preserved');
  assert(newTicket.email === 'ananya.sharma@college.edu', 'Requester email preserved');
  assert(newTicket.status === 'Open', 'Default status set to "Open"');
  assert(newTicket.priority === 'High', 'Priority set to "High"');
  assert(newTicket.assignedAdminId === 'usr_admin_01', 'Assigned admin ID set to usr_admin_01');
  assert(newTicket.assignedAdminName === 'Administrator', 'Assigned admin name resolved accurately');

  // Verify custom event emitted
  const createEvt = emittedEvents.find((e) => e.type === 'rp_queries_updated');
  assert(Boolean(createEvt), 'Dispatched "rp_queries_updated" custom event on query creation');
  assert(createEvt.detail.action === 'CREATE', 'Event detail action is "CREATE"');

  // -------------------------------------------------------------------------
  // TEST 5: Search & Multi-Criteria Filtering
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Search & Multi-Criteria Filtering ---');

  // 5a: Search by Ticket ID
  const searchByTicket = supportQueryService.getAllQueries({ search: newTicket.ticketId });
  assert(searchByTicket.some((q) => q.id === newTicket.id), 'Search by ticket ID matches new query');

  // 5b: Search by Name
  const searchByName = supportQueryService.getAllQueries({ search: 'Ananya' });
  assert(searchByName.some((q) => q.id === newTicket.id), 'Search by requester name matches new query');

  // 5c: Search by Email
  const searchByEmail = supportQueryService.getAllQueries({ search: 'ananya.sharma' });
  assert(searchByEmail.some((q) => q.id === newTicket.id), 'Search by email matches new query');

  // 5d: Search by Content in Message
  const searchByMsg = supportQueryService.getAllQueries({ search: 'grade card' });
  assert(searchByMsg.some((q) => q.id === newTicket.id), 'Search by message content matches new query');

  // 5e: Status Filter
  const openOnly = supportQueryService.getAllQueries({ status: 'open' });
  assert(openOnly.every((q) => q.status.toLowerCase() === 'open'), 'Status filter "open" returns only open tickets');

  const resolvedOnly = supportQueryService.getAllQueries({ status: 'resolved' });
  assert(resolvedOnly.every((q) => q.status.toLowerCase() === 'resolved'), 'Status filter "resolved" returns only resolved tickets');

  // 5f: Priority Filter
  const highPriority = supportQueryService.getAllQueries({ priority: 'high' });
  assert(highPriority.every((q) => q.priority.toLowerCase() === 'high'), 'Priority filter "high" returns only high-priority tickets');

  // 5g: Category Filter
  const calcSupport = supportQueryService.getAllQueries({ category: 'Calculator Support' });
  assert(calcSupport.every((q) => q.category === 'Calculator Support' || q.subject === 'Calculator Support'), 'Category filter returns only calculator support tickets');

  // 5h: Assigned Admin Filter
  const adminAssigned = supportQueryService.getAllQueries({ assignedAdminId: 'usr_admin_01' });
  assert(adminAssigned.every((q) => q.assignedAdminId === 'usr_admin_01'), 'Assigned admin filter matches correctly');

  // -------------------------------------------------------------------------
  // TEST 6: Status Transitions & Resolution Workflow
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Status Transitions & Resolution Workflow ---');

  // 6a: Advance Open -> In Progress
  const inProgressTicket = supportQueryService.setQueryStatus(newTicket.id, 'In Progress');
  assert(inProgressTicket.status === 'In Progress', 'Status transitioned from Open to In Progress');

  // 6b: Advance In Progress -> Resolved with Resolution Note
  const resolvedTicket = supportQueryService.setQueryStatus(
    newTicket.id,
    'Resolved',
    'Investigated JNTUH regulation clause: (CGPA - 0.5) * 10 is standard for R18/R22, confirmed calculation is correct.'
  );
  assert(resolvedTicket.status === 'Resolved', 'Status transitioned from In Progress to Resolved');
  assert(Boolean(resolvedTicket.resolvedAt), 'resolvedAt timestamp recorded');
  assert(resolvedTicket.resolutionDetails.includes('clause'), 'Resolution note recorded');

  // 6c: Advance Resolved -> Closed
  const closedTicket = supportQueryService.setQueryStatus(newTicket.id, 'Closed', 'Archived after student confirmation.');
  assert(closedTicket.status === 'Closed', 'Status transitioned from Resolved to Closed');
  assert(Boolean(closedTicket.closedAt), 'closedAt timestamp recorded');

  // 6d: Reopen Closed -> Open
  const reopenedTicket = supportQueryService.setQueryStatus(newTicket.id, 'Open');
  assert(reopenedTicket.status === 'Open', 'Status successfully reopened to Open');

  // 6e: Reject Invalid Status Transition
  let invalidStatusErr = false;
  try {
    supportQueryService.setQueryStatus(newTicket.id, 'FinishedDone');
  } catch (err) {
    invalidStatusErr = true;
    assert(err.message.includes('Invalid status'), 'Rejects non-standard status value');
  }
  assert(invalidStatusErr, 'Invalid status rejection verified');

  // -------------------------------------------------------------------------
  // TEST 7: Priority Management
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Priority Management ---');

  const urgentTicket = supportQueryService.setQueryPriority(newTicket.id, 'Urgent');
  assert(urgentTicket.priority === 'Urgent', 'Priority upgraded to "Urgent"');

  const lowTicket = supportQueryService.setQueryPriority(newTicket.id, 'Low');
  assert(lowTicket.priority === 'Low', 'Priority downgraded to "Low"');

  let invalidPriorityErr = false;
  try {
    supportQueryService.setQueryPriority(newTicket.id, 'CriticalExtreme');
  } catch (err) {
    invalidPriorityErr = true;
    assert(err.message.includes('Invalid priority'), 'Rejects unsupported priority identifier');
  }
  assert(invalidPriorityErr, 'Unsupported priority rejected');

  // -------------------------------------------------------------------------
  // TEST 8: Administrator Assignment & Unassignment
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Administrator Assignment & Unassignment ---');

  // Assign to valid administrator
  const assigned = supportQueryService.assignQuery(newTicket.id, 'usr_admin_01');
  assert(assigned.assignedAdminId === 'usr_admin_01', 'Assigned admin ID updated');
  assert(assigned.assignedAdminName === 'Administrator', 'Assigned admin name updated');

  // Unassign admin
  const unassigned = supportQueryService.assignQuery(newTicket.id, null);
  assert(unassigned.assignedAdminId === null, 'Admin ID cleared on unassignment');
  assert(unassigned.assignedAdminName === null, 'Admin name cleared on unassignment');

  // -------------------------------------------------------------------------
  // TEST 9: Threaded Response History (Preserving Messages)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Threaded Response History ---');

  const originalMsg = newTicket.message;

  // Add first admin response
  const afterFirstResponse = supportQueryService.addResponse(newTicket.id, {
    message: 'Hello Ananya! We are verifying this against official JNTUH examination branch circulars.',
    senderId: 'usr_admin_01',
    senderName: 'Administrator',
    senderRole: 'admin'
  });

  assert(afterFirstResponse.responses.length === 1, 'First response added to ticket thread');
  assert(afterFirstResponse.responses[0].message.includes('verifying this'), 'Response content preserved');
  assert(afterFirstResponse.message === originalMsg, 'Original student message remains strictly intact');

  // Add student reply
  const afterSecondResponse = supportQueryService.addResponse(newTicket.id, {
    message: 'Thank you for checking! My branch is CSE 2022 batch.',
    senderId: 'student_custom',
    senderName: 'Ananya Sharma',
    senderRole: 'student'
  });

  assert(afterSecondResponse.responses.length === 2, 'Second response appended to thread in order');
  assert(afterSecondResponse.responses[1].senderRole === 'student', 'Student sender role identified');
  assert(afterSecondResponse.message === originalMsg, 'Original message never overwritten by subsequent responses');

  // Empty response must fail
  let emptyRespErr = false;
  try {
    supportQueryService.addResponse(newTicket.id, { message: '   ' });
  } catch (err) {
    emptyRespErr = true;
    assert(err.message.includes('Response message cannot be empty'), 'Rejects empty response message');
  }
  assert(emptyRespErr, 'Empty response validation triggered');

  // -------------------------------------------------------------------------
  // TEST 10: Query-to-User Relationships & Credential Sanitization
  // -------------------------------------------------------------------------
  console.log('\n--- Test 10: Query-to-User Relationships & Credential Sanitization ---');

  // ouTicket was created with userId: 'usr_student_01'
  const studentLinkedQuery = supportQueryService.getQueryById('RP-TICK-OU-8921');
  assert(studentLinkedQuery.userId === 'usr_student_01', 'Query correctly references student account');
  assert(Boolean(studentLinkedQuery.userSummary), 'userSummary resolved from canonical user service');
  assert(studentLinkedQuery.userSummary.email === 'student@resultpoint.edu', 'Linked user email matches canonical user');
  assert(studentLinkedQuery.userSummary.role === 'student', 'Linked user role matches canonical user');

  // Absolute credential sanitization: password, hash, or token must NOT exist
  assert(studentLinkedQuery.userSummary.password === undefined, 'Password omitted in userSummary');
  assert(studentLinkedQuery.userSummary.token === undefined, 'Token omitted in userSummary');
  assert(studentLinkedQuery.password === undefined, 'Password omitted in query payload');

  // -------------------------------------------------------------------------
  // TEST 11: User Reference Detection (Guarded User Deletion)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 11: User Reference Detection (Guarded User Deletion) ---');

  // userService.checkUserReferences must detect queries referencing the student
  const studentRefCheck = userService.checkUserReferences('usr_student_01');
  assert(studentRefCheck.hasReferences === true, 'userService recognizes support query references');
  assert(studentRefCheck.canDelete === false, 'Destructive deletion blocked due to support query references');
  assert(
    studentRefCheck.reasons.some((r) => r.includes('support quer')),
    'Detailed reference reason explicitly mentions support query dependencies'
  );

  // -------------------------------------------------------------------------
  // TEST 12: Ticket Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- Test 12: Ticket Deletion ---');

  const deleteRes = supportQueryService.deleteQuery(newTicket.id);
  assert(deleteRes.success === true, 'deleteQuery returns success');
  assert(deleteRes.deletedQuery.id === newTicket.id, 'Returned deleted query object');

  const afterDelete = supportQueryService.getQueryById(newTicket.id);
  assert(afterDelete === null, 'Deleted query no longer exists in repository');

  // Non-existent delete throws error
  let deleteNonExistentErr = false;
  try {
    supportQueryService.deleteQuery('non-existent-ticket-id');
  } catch (err) {
    deleteNonExistentErr = true;
    assert(err.message.includes('not found'), 'deleteQuery throws error for non-existent ticket');
  }
  assert(deleteNonExistentErr, 'Non-existent ticket deletion error verified');

  // -------------------------------------------------------------------------
  // TEST 13: Audit History Logging
  // -------------------------------------------------------------------------
  console.log('\n--- Test 13: Audit History Logging ---');

  const auditEvents = auditHistoryService.getAllAuditEvents();
  const queryAuditEvents = auditEvents.filter((a) => a.entityType === 'support_query');

  assert(queryAuditEvents.length >= 4, 'Multiple support query audit events logged');

  const createAudit = queryAuditEvents.find((a) => a.action === 'SUPPORT_QUERY_CREATED');
  assert(Boolean(createAudit), 'SUPPORT_QUERY_CREATED logged in audit history');
  assert(createAudit.title.includes('SUPPORT_QUERY_CREATED'), 'Audit title formatted correctly');

  const statusAudit = queryAuditEvents.find((a) => a.action.includes('STATUS_CHANGED') || a.action.includes('RESOLVED'));
  assert(Boolean(statusAudit), 'Status change or resolution logged in audit history');

  const responseAudit = queryAuditEvents.find((a) => a.action === 'SUPPORT_QUERY_RESPONDED');
  assert(Boolean(responseAudit), 'SUPPORT_QUERY_RESPONDED logged in audit history');

  const deleteAudit = queryAuditEvents.find((a) => a.action === 'SUPPORT_QUERY_DELETED');
  assert(Boolean(deleteAudit), 'SUPPORT_QUERY_DELETED logged in audit history');

  // Audit safety check: Ensure no passwords or raw credentials appear in audit log details
  assert(
    queryAuditEvents.every((a) => !a.details.includes('password') && !a.details.includes('token')),
    'Audit logs for support queries do not leak sensitive credentials'
  );

  // -------------------------------------------------------------------------
  // TEST 14: Dashboard KPI Synchronization
  // -------------------------------------------------------------------------
  console.log('\n--- Test 14: Dashboard KPI Synchronization ---');

  const queryStats = supportQueryService.getQueryStats();
  assert(queryStats.total >= 3, 'getQueryStats returns accurate total count');
  assert(queryStats.open >= 1, 'getQueryStats returns accurate open count');
  assert(queryStats.inProgress >= 1, 'getQueryStats returns accurate in-progress count');
  assert(queryStats.resolved >= 1, 'getQueryStats returns accurate resolved count');

  const dashboardStats = adminDashboardService.getStats();
  assert(Boolean(dashboardStats.supportQueries), 'adminDashboardService provides supportQueries metric');
  assert(dashboardStats.supportQueries.value === String(queryStats.total), 'Dashboard support queries count matches real data');
  assert(
    dashboardStats.supportQueries.growth.includes('pending') || dashboardStats.supportQueries.growth.includes('clear'),
    'Dashboard pending indicator reflects real open & in-progress tickets'
  );

  // -------------------------------------------------------------------------
  // TEST 15: Public Contact Submission Integration
  // -------------------------------------------------------------------------
  console.log('\n--- Test 15: Public Contact Submission Integration ---');

  const publicContactRes = await contactService.submitMessage({
    fullName: 'Siddharth Rao',
    email: 'siddharth@student.org',
    subject: 'Feedback & Suggestions',
    message: 'The new ResultPoint dark mode and CGPA calculator look fantastic. Would love to see target CGPA projections.'
  });

  assert(publicContactRes.success === true, 'Public contact submission returns success: true');
  assert(Boolean(publicContactRes.ticketId), 'Public contact submission generated real ticket ID');

  // Verify the submitted query was saved in canonical support query store
  const submittedQuery = supportQueryService.getQueryById(publicContactRes.ticketId);
  assert(Boolean(submittedQuery), 'Public contact submission is retrieved from canonical supportQueryService');
  assert(submittedQuery.fullName === 'Siddharth Rao', 'Requester name matches contact submission');
  assert(submittedQuery.category === 'Feedback & Suggestions', 'Category matches contact submission');
  assert(submittedQuery.status === 'Open', 'Public contact submission initialized as Open');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`Phase 3B Support Queries CRUD Tests Completed: ${passedCount} / ${totalCount} Assertions Passed`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
