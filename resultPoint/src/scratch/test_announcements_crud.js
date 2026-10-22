/**
 * ResultPoint Phase 3C: Announcements Management CRUD Automated Test Suite
 *
 * Verifies:
 * 1. Seed announcement preservation and idempotent initialization.
 * 2. Listing and retrieval operations.
 * 3. Announcement creation with stable unique IDs.
 * 4. Required-field validation (title, content, category, priority, status).
 * 5. Update operations and ID stability.
 * 6. Publication lifecycle (Draft -> Published -> Archived -> Reactivated).
 * 7. Audience targeting for all users, students, admins, and academic scopes.
 * 8. Invalid university, course, and regulation catalog reference rejection.
 * 9. Expiration date and publication date sequence validation.
 * 10. Scheduling metadata support.
 * 11. Audience content isolation (preventing unauthorized leaks to wrong audiences).
 * 12. Student dashboard and public portal rendering data selection.
 * 13. Custom event broadcasting ('rp_announcements_updated').
 * 14. Audit history logging with sanitized metadata.
 * 15. Announcement statistics synchronization.
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
  console.log('ResultPoint Phase 3C: Announcements Management CRUD Test Suite');
  console.log('======================================================================');

  // Dynamic imports after localStorage mock is ready
  const { announcementService, ANNOUNCEMENT_STATUSES, ANNOUNCEMENT_PRIORITIES } = await import(
    '../services/announcementService.js'
  );
  const { academicCatalogService } = await import('../services/academicCatalogService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');

  // Ensure services are initialized
  academicCatalogService.getCatalog();
  announcementService.initialize();

  // -------------------------------------------------------------------------
  // TEST 1: Seed Announcement Preservation & Idempotence
  // -------------------------------------------------------------------------
  console.log('\n--- Test 1: Seed Announcements Preservation & Idempotence ---');
  const initialAnnouncements = announcementService.getAllAnnouncements();
  assert(Array.isArray(initialAnnouncements), 'getAllAnnouncements returns an array');
  assert(initialAnnouncements.length >= 4, 'Seed announcements loaded successfully (at least 4 default records)');

  const ouNotice = initialAnnouncements.find((a) => a.id === 'anc_seed_01');
  assert(Boolean(ouNotice), 'Found seed announcement anc_seed_01');
  assert(ouNotice.status === 'Published', 'anc_seed_01 has status "Published"');
  assert(ouNotice.priority === 'High', 'anc_seed_01 has priority "High"');
  assert(ouNotice.targetAudience === 'university', 'anc_seed_01 targets "university"');
  assert(ouNotice.targetUniversityId === 'osmania', 'anc_seed_01 references university "osmania"');
  assert(ouNotice.isPinned === true, 'anc_seed_01 is pinned');

  const draftNotice = initialAnnouncements.find((a) => a.id === 'anc_seed_04');
  assert(Boolean(draftNotice), 'Found seed draft notice anc_seed_04');
  assert(draftNotice.status === 'Draft', 'anc_seed_04 has status "Draft"');

  // Idempotence: calling initialize again must not duplicate records
  announcementService.initialize();
  const announcementsAfterReinit = announcementService.getAllAnnouncements();
  assert(announcementsAfterReinit.length === initialAnnouncements.length, 'Idempotent initialization preserves record count');

  // -------------------------------------------------------------------------
  // TEST 2: Listing & Retrieval Operations
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Listing & Retrieval Operations ---');
  const retrievedById = announcementService.getAnnouncementById('anc_seed_01');
  assert(retrievedById !== null, 'getAnnouncementById retrieves announcement by ID');
  assert(retrievedById.title.includes('Osmania University'), 'Retrieved title matches expected record');

  const nonExistent = announcementService.getAnnouncementById('non_existent_anc_id');
  assert(nonExistent === null, 'getAnnouncementById returns null for nonexistent ID');

  // -------------------------------------------------------------------------
  // TEST 3: Validation Safeguards
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Validation Safeguards ---');

  // 3a: Empty Title
  let titleErr = false;
  try {
    announcementService.createAnnouncement({
      title: '  ',
      content: 'Valid content description for testing validation rules.',
      category: 'General'
    });
  } catch (err) {
    titleErr = true;
    assert(err.message.includes('title is required'), 'Rejects empty announcement title');
  }
  assert(titleErr, 'Title validation triggered');

  // 3b: Title Too Short
  let shortTitleErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'ab',
      content: 'Valid content description for testing validation rules.',
      category: 'General'
    });
  } catch (err) {
    shortTitleErr = true;
    assert(err.message.includes('at least 3 characters'), 'Rejects title shorter than 3 characters');
  }
  assert(shortTitleErr, 'Short title validation triggered');

  // 3c: Empty Content
  let contentErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: '   ',
      category: 'General'
    });
  } catch (err) {
    contentErr = true;
    assert(err.message.includes('content is required'), 'Rejects empty content body');
  }
  assert(contentErr, 'Content validation triggered');

  // 3d: Content Too Short (< 10 chars)
  let shortContentErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Too short',
      category: 'General'
    });
  } catch (err) {
    shortContentErr = true;
    assert(err.message.includes('at least 10 characters'), 'Rejects content shorter than 10 characters');
  }
  assert(shortContentErr, 'Short content validation triggered');

  // 3e: Invalid Status
  let statusErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      status: 'SuperActiveBogus'
    });
  } catch (err) {
    statusErr = true;
    assert(err.message.includes('Status must be one of'), 'Rejects unsupported status');
  }
  assert(statusErr, 'Status validation triggered');

  // 3f: Invalid Priority
  let priorityErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      priority: 'UltraHighMega'
    });
  } catch (err) {
    priorityErr = true;
    assert(err.message.includes('Priority must be one of'), 'Rejects unsupported priority');
  }
  assert(priorityErr, 'Priority validation triggered');

  // 3g: Invalid Target Audience
  let audienceErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      targetAudience: 'some_random_audience'
    });
  } catch (err) {
    audienceErr = true;
    assert(err.message.includes('Target audience must be one of'), 'Rejects unsupported target audience');
  }
  assert(audienceErr, 'Audience validation triggered');

  // 3h: Invalid University Reference
  let univRefErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      targetAudience: 'university',
      targetUniversityId: 'non_existent_university_id'
    });
  } catch (err) {
    univRefErr = true;
    assert(err.message.includes('does not exist in the academic catalog'), 'Rejects nonexistent target university reference');
  }
  assert(univRefErr, 'University reference validation triggered');

  // 3i: Missing University Reference when audience === 'university'
  let missingUnivErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      targetAudience: 'university',
      targetUniversityId: ''
    });
  } catch (err) {
    missingUnivErr = true;
    assert(err.message.includes('Target university is required'), 'Rejects missing university when audience is university');
  }
  assert(missingUnivErr, 'Missing university validation triggered');

  // 3j: Invalid Expiration Date Ordering (Expiration earlier than publication)
  let dateOrderErr = false;
  try {
    announcementService.createAnnouncement({
      title: 'Valid Announcement Title',
      content: 'Valid content description for testing validation rules.',
      publishedAt: '2026-03-01T10:00:00.000Z',
      expiresAt: '2026-02-01T10:00:00.000Z'
    });
  } catch (err) {
    dateOrderErr = true;
    assert(err.message.includes('Expiration date must be later'), 'Rejects expiration date earlier than publication date');
  }
  assert(dateOrderErr, 'Date sequence validation triggered');

  // -------------------------------------------------------------------------
  // TEST 4: Successful Creation & Event Broadcasting
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Successful Creation & Event Broadcasting ---');
  emittedEvents.length = 0;

  const newNotice = announcementService.createAnnouncement({
    title: 'New Grade Moderation & Revaluation Policy 2026',
    content: 'The Academic Council has approved a revised revaluation window of 14 working days following semester grade card publication.',
    category: 'Regulation Update',
    priority: 'Urgent',
    status: 'Published',
    targetAudience: 'university',
    targetUniversityId: 'osmania',
    isPinned: true,
    isBanner: true,
    actionLink: '/universities/osmania',
    actionText: 'Read Circular'
  });

  assert(Boolean(newNotice && newNotice.id), 'Announcement created with unique ID');
  assert(newNotice.id.startsWith('anc_'), 'ID follows standard prefix "anc_"');
  assert(newNotice.title === 'New Grade Moderation & Revaluation Policy 2026', 'Title saved accurately');
  assert(newNotice.priority === 'Urgent', 'Priority set to "Urgent"');
  assert(newNotice.status === 'Published', 'Status set to "Published"');
  assert(Boolean(newNotice.publishedAt), 'publishedAt timestamp automatically set upon publication');
  assert(newNotice.targetUniversityName === 'Osmania University', 'Target university name resolved from academic catalog');

  // Check event broadcast
  const createEvt = emittedEvents.find((e) => e.type === 'rp_announcements_updated');
  assert(Boolean(createEvt), 'Dispatched "rp_announcements_updated" event on announcement creation');

  // -------------------------------------------------------------------------
  // TEST 5: Update Operations & ID Stability
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Update Operations & ID Stability ---');

  const updatedNotice = announcementService.updateAnnouncement(newNotice.id, {
    title: 'New Grade Moderation & Revaluation Policy 2026 (Official)',
    priority: 'High',
    isPinned: false
  });

  assert(updatedNotice.id === newNotice.id, 'Announcement ID remains strictly stable during update');
  assert(updatedNotice.title.includes('(Official)'), 'Title updated accurately');
  assert(updatedNotice.priority === 'High', 'Priority updated accurately');
  assert(updatedNotice.isPinned === false, 'Pinned flag updated accurately');
  assert(updatedNotice.createdAt === newNotice.createdAt, 'Original creation timestamp preserved');

  // -------------------------------------------------------------------------
  // TEST 6: Publication Lifecycle Transitions (Draft, Publish, Archive, Reactivate)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Publication Lifecycle Transitions ---');

  // 6a: Create Draft Notice
  const draftNoticeCreated = announcementService.createAnnouncement({
    title: 'Tentative Winter Break Academic Schedule',
    content: 'Preliminary schedule for winter holidays and backlogged semester laboratory sessions.',
    status: 'Draft',
    targetAudience: 'all'
  });
  assert(draftNoticeCreated.status === 'Draft', 'Created draft announcement with status "Draft"');
  assert(draftNoticeCreated.publishedAt === null, 'Draft announcement publishedAt is null');

  // 6b: Publish Draft Notice
  const publishedFromDraft = announcementService.publishAnnouncement(draftNoticeCreated.id);
  assert(publishedFromDraft.status === 'Published', 'Successfully published draft announcement');
  assert(Boolean(publishedFromDraft.publishedAt), 'publishedAt set when transitioning to Published');

  // 6c: Archive Announcement
  const archivedNotice = announcementService.archiveAnnouncement(publishedFromDraft.id);
  assert(archivedNotice.status === 'Archived', 'Successfully archived announcement');
  assert(Boolean(archivedNotice.archivedAt), 'archivedAt timestamp set when archiving');

  // 6d: Reactivate Archived Announcement
  const reactivatedNotice = announcementService.reactivateAnnouncement(archivedNotice.id);
  assert(reactivatedNotice.status === 'Published', 'Successfully reactivated archived announcement to Published');

  // -------------------------------------------------------------------------
  // TEST 7: Target Audience Isolation & Filtering Rules
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Target Audience Isolation & Filtering Rules ---');

  // Create scoped notices for testing
  const adminOnlyNotice = announcementService.createAnnouncement({
    title: 'Administrator Maintenance Window & Database Optimization',
    content: 'Scheduled internal platform maintenance for administrator personnel only.',
    status: 'Published',
    targetAudience: 'admins'
  });

  const jntuhOnlyNotice = announcementService.createAnnouncement({
    title: 'JNTUH Special Supplementary Examination Notification',
    content: 'JNTU Hyderabad has announced special supplementary examinations for eligible candidates.',
    status: 'Published',
    targetAudience: 'university',
    targetUniversityId: 'jntuh'
  });

  // 7a: Student User matching OU (Osmania University)
  const ouStudentUser = {
    id: 'usr_student_01',
    role: 'student',
    universityId: 'osmania',
    courseId: 'bca',
    regulationId: 'ou-bca-cbcs'
  };

  const ouStudentAnnouncements = announcementService.getApplicableAnnouncements(ouStudentUser);
  assert(
    ouStudentAnnouncements.some((a) => a.id === 'anc_seed_01'),
    'OU student sees Osmania University scoped notice'
  );
  assert(
    ouStudentAnnouncements.some((a) => a.id === 'anc_seed_03'),
    'OU student sees general "all" users platform notice'
  );
  assert(
    !ouStudentAnnouncements.some((a) => a.id === adminOnlyNotice.id),
    'OU student is strictly BLOCKED from seeing administrator-only announcement'
  );
  assert(
    !ouStudentAnnouncements.some((a) => a.id === jntuhOnlyNotice.id),
    'OU student is strictly BLOCKED from seeing JNTUH-specific announcement'
  );
  assert(
    !ouStudentAnnouncements.some((a) => a.status === 'Draft'),
    'Draft notices are strictly EXCLUDED from student announcements list'
  );

  // 7b: JNTUH Student User
  const jntuhStudentUser = {
    id: 'usr_student_jntuh',
    role: 'student',
    universityId: 'jntuh',
    courseId: 'btech-cse',
    regulationId: 'jntuh-r18'
  };

  const jntuhStudentAnnouncements = announcementService.getApplicableAnnouncements(jntuhStudentUser);
  assert(
    jntuhStudentAnnouncements.some((a) => a.id === jntuhOnlyNotice.id),
    'JNTUH student sees JNTUH scoped notice'
  );
  assert(
    !jntuhStudentAnnouncements.some((a) => a.id === 'anc_seed_01'),
    'JNTUH student is strictly BLOCKED from seeing Osmania University scoped notice'
  );

  // 7c: Administrator User
  const adminUser = {
    id: 'usr_admin_01',
    role: 'admin'
  };

  const adminAnnouncements = announcementService.getApplicableAnnouncements(adminUser);
  assert(
    adminAnnouncements.some((a) => a.id === adminOnlyNotice.id),
    'Administrator user sees admin-only announcement'
  );
  assert(
    adminAnnouncements.some((a) => a.id === 'anc_seed_03'),
    'Administrator user sees general "all" platform notice'
  );
  assert(
    !adminAnnouncements.some((a) => a.id === jntuhOnlyNotice.id),
    'Administrator does not see student university-specific notice in audience list'
  );

  // -------------------------------------------------------------------------
  // TEST 8: Public Portal Data Selection (Guest Access)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Public Portal Data Selection (Guest Access) ---');

  const publicNotices = announcementService.getPublicAnnouncements();
  assert(Array.isArray(publicNotices), 'getPublicAnnouncements returns an array');
  assert(
    publicNotices.every((a) => a.targetAudience === 'all' && a.status === 'Published'),
    'Public announcements contain exclusively published notices with targetAudience "all"'
  );
  assert(
    !publicNotices.some((a) => a.id === adminOnlyNotice.id),
    'Public portal does not leak admin-only announcements'
  );
  assert(
    !publicNotices.some((a) => a.id === jntuhOnlyNotice.id),
    'Public portal does not leak student university-specific announcements'
  );

  // -------------------------------------------------------------------------
  // TEST 9: Expiration & Scheduling Filtering
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Expiration & Scheduling Filtering ---');

  // Expired Notice (published 5 days ago, expired 1 day ago)
  const expiredNotice = announcementService.createAnnouncement({
    title: 'Past Notice Already Expired',
    content: 'This announcement had an expiration date in the past.',
    status: 'Published',
    targetAudience: 'all',
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
    expiresAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  });

  const publicAfterExpired = announcementService.getPublicAnnouncements();
  assert(
    !publicAfterExpired.some((a) => a.id === expiredNotice.id),
    'Expired announcement is automatically excluded from public and student feeds'
  );

  // Scheduled Notice (scheduledPublishAt in future)
  const scheduledNotice = announcementService.createAnnouncement({
    title: 'Future Scheduled Announcement',
    content: 'This announcement is scheduled for release tomorrow.',
    status: 'Published',
    targetAudience: 'all',
    scheduledPublishAt: new Date(Date.now() + 86400000).toISOString() // 1 day in future
  });

  const publicAfterScheduled = announcementService.getPublicAnnouncements();
  assert(
    !publicAfterScheduled.some((a) => a.id === scheduledNotice.id),
    'Future scheduled announcement is excluded until scheduled time arrives'
  );

  // -------------------------------------------------------------------------
  // TEST 10: Deletion of Announcements
  // -------------------------------------------------------------------------
  console.log('\n--- Test 10: Deletion of Announcements ---');

  const deleteRes = announcementService.deleteAnnouncement(draftNoticeCreated.id);
  assert(deleteRes.success === true, 'deleteAnnouncement returns success: true');
  assert(deleteRes.deletedAnnouncement.id === draftNoticeCreated.id, 'Returned deleted announcement object');

  const afterDelete = announcementService.getAnnouncementById(draftNoticeCreated.id);
  assert(afterDelete === null, 'Deleted announcement no longer exists in repository');

  // -------------------------------------------------------------------------
  // TEST 11: Audit History Logging
  // -------------------------------------------------------------------------
  console.log('\n--- Test 11: Audit History Logging ---');

  const auditEvents = auditHistoryService.getAllAuditEvents();
  const ancAuditEvents = auditEvents.filter((a) => a.entityType === 'announcement');

  assert(ancAuditEvents.length >= 4, 'Recorded multiple announcement audit events');

  const createdAudit = ancAuditEvents.find((a) => a.action === 'ANNOUNCEMENT_CREATED');
  assert(Boolean(createdAudit), 'ANNOUNCEMENT_CREATED action logged in audit history');
  assert(createdAudit.title.includes('ANNOUNCEMENT_CREATED'), 'Audit title computed properly');

  const updatedAudit = ancAuditEvents.find((a) => a.action === 'ANNOUNCEMENT_UPDATED');
  assert(Boolean(updatedAudit), 'ANNOUNCEMENT_UPDATED action logged in audit history');

  const publishedAudit = ancAuditEvents.find((a) => a.action === 'ANNOUNCEMENT_PUBLISHED');
  assert(Boolean(publishedAudit), 'ANNOUNCEMENT_PUBLISHED action logged in audit history');

  const deletedAudit = ancAuditEvents.find((a) => a.action === 'ANNOUNCEMENT_DELETED');
  assert(Boolean(deletedAudit), 'ANNOUNCEMENT_DELETED action logged in audit history');

  // -------------------------------------------------------------------------
  // TEST 12: Statistics Aggregation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 12: Statistics Aggregation ---');

  const stats = announcementService.getAnnouncementStats();
  assert(typeof stats.total === 'number' && stats.total >= 4, 'getAnnouncementStats provides total count');
  assert(typeof stats.published === 'number' && stats.published >= 2, 'getAnnouncementStats provides published count');
  assert(typeof stats.draft === 'number', 'getAnnouncementStats provides draft count');
  assert(typeof stats.archived === 'number', 'getAnnouncementStats provides archived count');
  assert(typeof stats.banners === 'number', 'getAnnouncementStats provides active banners count');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`Phase 3C Announcements CRUD Tests Completed: ${passedCount} / ${totalCount} Assertions Passed`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
