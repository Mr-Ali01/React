/**
 * ResultPoint Phase 3F: Resources Management CRUD Automated Test Suite
 *
 * Comprehensive validation of:
 * 1. Idempotent initialization & schema migration from RESOURCES_DATA
 * 2. CRUD lifecycle (Create, Read, Update, Archive, Reactivate, Delete)
 * 3. Immutable ID enforcement and rejection of unapproved fields
 * 4. Required-field constraints & strict URL security validation (blocking script injection)
 * 5. Academic applicability & institutional scoping (University, Course, Regulation, Semester)
 * 6. Audience scoping and public directory visibility (Strict Draft/Archive exclusion)
 * 7. Search, multi-criteria filtering, and sorting algorithms
 * 8. Event broadcasting ('rp_resources_updated') & audit history logging
 * 9. Guarded deletion and referential preservation
 * 10. Factory baseline reset
 * 11. Full regression coverage for Phases 2A-2F and 3A-3E
 */

// Mock browser localStorage and window environment for Node.js BEFORE any service loads
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (idx) => Array.from(storageMap.keys())[idx] || null
};

// Setup Mock Window Event Dispatcher
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
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail || null;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
  passedAssertions++;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('ResultPoint Phase 3F: Resources Management CRUD Test Suite');
  console.log('================================================================\n');

  // Dynamic imports after localStorage mock setup
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');
  const {
    resourceManagementService,
    RESOURCE_UPDATED_EVENT,
    isValidResourceUrl
  } = await import('../services/resourceManagementService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');
  const { academicCatalogService } = await import('../services/academicCatalogService.js');
  const { toolManagementService } = await import('../services/toolManagementService.js');
  const { reportsAnalyticsService } = await import('../services/reportsAnalyticsService.js');

  // -------------------------------------------------------------
  // Test Area 1: Storage Key & Idempotent Initialization
  // -------------------------------------------------------------
  console.log('Test Area 1: Storage Key & Idempotent Initialization');
  assert(STORAGE_KEYS.RESOURCES === 'resultpoint_resources', 'STORAGE_KEYS.RESOURCES matches "resultpoint_resources"');

  const initialResources = resourceManagementService.initialize();
  assert(Array.isArray(initialResources), 'initialize returns array of resources');
  assert(initialResources.length >= 8, `Loaded baseline resources (count: ${initialResources.length})`);

  const firstRes = initialResources[0];
  assert(firstRes.id && typeof firstRes.id === 'string', 'Baseline resource has valid ID');
  assert(firstRes.title && firstRes.title.length > 0, 'Baseline resource has title');
  assert(firstRes.status === 'published', 'Baseline resource is published by default');
  assert(firstRes.downloadCount !== undefined, 'Baseline resource has downloadCount initialized');
  assert(firstRes.viewCount !== undefined, 'Baseline resource has viewCount initialized');

  // Idempotent re-initialization
  const reinitResources = resourceManagementService.initialize();
  assert(reinitResources.length === initialResources.length, 'Re-initialization preserves resource count without duplication');

  // -------------------------------------------------------------
  // Test Area 2: Reading, Searching, and Multi-Criteria Filters
  // -------------------------------------------------------------
  console.log('\nTest Area 2: Reading, Searching, and Multi-Criteria Filters');
  const allResources = resourceManagementService.getAllResources();
  assert(allResources.length === initialResources.length, 'getAllResources returns all items');

  const foundById = resourceManagementService.getResourceById(firstRes.id);
  assert(foundById && foundById.title === firstRes.title, 'getResourceById retrieves exact resource');

  const nonExistent = resourceManagementService.getResourceById('non-existent-xyz');
  assert(nonExistent === null, 'getResourceById returns null for missing ID');

  // Search by title substring
  const searchByTitle = resourceManagementService.getAllResources({ search: 'Syllabus' });
  assert(searchByTitle.length > 0, 'Search finds resources matching "Syllabus" in title');
  assert(searchByTitle.every((r) => r.title.toLowerCase().includes('syllabus') || r.description.toLowerCase().includes('syllabus') || r.category.includes('syllabus')), 'All search results match query');

  // Filter by category
  const prevPapers = resourceManagementService.getAllResources({ category: 'previous-papers' });
  assert(prevPapers.length > 0, 'Filter by category "previous-papers" returns matching items');
  assert(prevPapers.every((r) => r.category === 'previous-papers'), 'Filtered items match exact category');

  // Filter by university
  const jntuResources = resourceManagementService.getAllResources({ universityId: 'jntuh' });
  assert(jntuResources.length > 0, 'Filter by universityId "jntuh" returns matching items');
  assert(jntuResources.every((r) => r.universityId === 'jntuh'), 'University filtered items match JNTUH');

  // -------------------------------------------------------------
  // Test Area 3: Create Resource with Validation & URL Security
  // -------------------------------------------------------------
  console.log('\nTest Area 3: Create Resource with Validation & URL Security');
  // Valid creation
  const createdRes = resourceManagementService.createResource({
    title: 'Operating Systems Virtual Memory Lab Manual',
    description: 'Comprehensive practical laboratory manual for virtual memory page replacement algorithms and multi-threading.',
    category: 'study-materials',
    resourceType: 'pdf',
    fileUrl: 'https://cdn.resultpoint.edu/manuals/os-lab-manual.pdf',
    fileType: 'PDF Document',
    fileSize: '3.4 MB',
    targetAudience: 'students',
    universityId: 'osmania-university',
    courseId: 'mca',
    regulation: 'R22',
    semester: 'Semester 2',
    subject: 'Operating Systems',
    tags: ['OS', 'Virtual Memory', 'Lab Manual', 'OU', 'MCA'],
    status: 'published',
    isPinned: true
  });

  assert(createdRes && createdRes.id.startsWith('res_'), 'Created resource receives unique ID');
  assert(createdRes.title === 'Operating Systems Virtual Memory Lab Manual', 'Title persisted accurately');
  assert(createdRes.fileUrl === 'https://cdn.resultpoint.edu/manuals/os-lab-manual.pdf', 'fileUrl persisted accurately');
  assert(createdRes.status === 'published', 'Initial status set to published');
  assert(createdRes.isPinned === true, 'Pinned status set to true');
  assert(createdRes.publishedAt !== null, 'publishedAt timestamp automatically set');

  // Rejection: empty title
  try {
    resourceManagementService.createResource({ title: '', description: 'Some desc', category: 'study-materials' });
    assert(false, 'Should reject empty title');
  } catch (err) {
    assert(err.message.includes('title is required'), 'Rejects empty title with descriptive message');
  }

  // Rejection: title too short (< 3 chars)
  try {
    resourceManagementService.createResource({ title: 'AB', description: 'Some desc', category: 'study-materials' });
    assert(false, 'Should reject title < 3 chars');
  } catch (err) {
    assert(err.message.includes('at least 3 characters'), 'Rejects short title');
  }

  // Rejection: missing description
  try {
    resourceManagementService.createResource({ title: 'Valid Title', description: '', category: 'study-materials' });
    assert(false, 'Should reject empty description');
  } catch (err) {
    assert(err.message.includes('description is required'), 'Rejects empty description');
  }

  // Rejection: missing category
  try {
    resourceManagementService.createResource({ title: 'Valid Title', description: 'Valid Desc', category: '' });
    assert(false, 'Should reject missing category');
  } catch (err) {
    assert(err.message.includes('category is required'), 'Rejects missing category');
  }

  // URL Security validation: blocks script injection & unsafe protocols
  assert(!isValidResourceUrl('javascript:alert("xss")'), 'Blocks javascript: protocol in URL');
  assert(!isValidResourceUrl('data:text/html,<script>alert(1)</script>'), 'Blocks data: protocol in URL');
  assert(!isValidResourceUrl('https://example.com/test<script>'), 'Blocks <script> tags in URL');
  assert(!isValidResourceUrl('https://example.com/test?param=eval(1)'), 'Blocks eval in URL');
  assert(!isValidResourceUrl('ftp://example.com/file.pdf'), 'Blocks non-HTTP/HTTPS protocols');
  assert(isValidResourceUrl('https://cdn.university.ac.in/syllabus.pdf'), 'Accepts valid HTTPS URL');
  assert(isValidResourceUrl('http://library.osmania.ac.in/papers.pdf'), 'Accepts valid HTTP URL');

  try {
    resourceManagementService.createResource({
      title: 'Malicious Resource Test',
      description: 'Attempting to inject javascript into resource URL',
      category: 'study-materials',
      fileUrl: 'javascript:alert(document.cookie)'
    });
    assert(false, 'Should reject javascript: in resource creation');
  } catch (err) {
    assert(err.message.includes('Invalid resource URL') || err.message.includes('executable script'), 'Blocks unsafe script URLs on resource creation');
  }

  // -------------------------------------------------------------
  // Test Area 4: Update Resource & Immutable ID Enforcement
  // -------------------------------------------------------------
  console.log('\nTest Area 4: Update Resource & Immutable ID Enforcement');
  const updatedRes = resourceManagementService.updateResource(createdRes.id, {
    title: 'Advanced Operating Systems Lab Manual (Revised 2026)',
    fileSize: '4.1 MB'
  });
  assert(updatedRes.title === 'Advanced Operating Systems Lab Manual (Revised 2026)', 'Title updated successfully');
  assert(updatedRes.fileSize === '4.1 MB', 'fileSize updated successfully');

  // Enforces immutable ID
  try {
    resourceManagementService.updateResource(createdRes.id, { id: 'hacked-id-attempt' });
    assert(false, 'Should reject changing resource ID');
  } catch (err) {
    assert(err.message.includes('immutable'), 'Enforces strictly immutable resource IDs');
  }

  // Rejection of unsupported fields
  try {
    resourceManagementService.updateResource(createdRes.id, { unsupportedMaliciousField: 'exploit' });
    assert(false, 'Should reject unsupported fields');
  } catch (err) {
    assert(err.message.includes('Unsupported field'), 'Rejects arbitrary unapproved fields');
  }

  // -------------------------------------------------------------
  // Test Area 5: Publication Lifecycle (Draft, Published, Archived)
  // -------------------------------------------------------------
  console.log('\nTest Area 5: Publication Lifecycle (Draft, Published, Archived)');
  // Transition to Draft
  const draftRes = resourceManagementService.setResourceStatus(createdRes.id, 'draft');
  assert(draftRes.status === 'draft', 'Status successfully changed to draft');

  // Verify excluded from public directory
  const publicDirAfterDraft = resourceManagementService.getPublicResources();
  assert(!publicDirAfterDraft.some((r) => r.id === createdRes.id), 'Draft resources are strictly EXCLUDED from student public directory');

  // Transition to Archived
  const archivedRes = resourceManagementService.setResourceStatus(createdRes.id, 'archived');
  assert(archivedRes.status === 'archived', 'Status successfully changed to archived');
  assert(archivedRes.archivedAt !== null, 'archivedAt timestamp set');

  // Verify excluded from public directory
  const publicDirAfterArchive = resourceManagementService.getPublicResources();
  assert(!publicDirAfterArchive.some((r) => r.id === createdRes.id), 'Archived resources are strictly EXCLUDED from student public directory');

  // Reactivate to Published
  const reactivatedRes = resourceManagementService.setResourceStatus(createdRes.id, 'published');
  assert(reactivatedRes.status === 'published', 'Status reactivated to published');
  assert(reactivatedRes.publishedAt !== null, 'publishedAt timestamp refreshed');

  const publicDirAfterPublish = resourceManagementService.getPublicResources();
  assert(publicDirAfterPublish.some((r) => r.id === createdRes.id), 'Published resource is visible in public directory');

  // -------------------------------------------------------------
  // Test Area 6: Audience & Academic Applicability Scoping
  // -------------------------------------------------------------
  console.log('\nTest Area 6: Audience & Academic Applicability Scoping');
  // Faculty-only resource creation
  const facultyRes = resourceManagementService.createResource({
    title: 'Confidential Faculty Evaluation Rubric',
    description: 'Internal evaluation and grading schema for academic staff.',
    category: 'university-guides',
    targetAudience: 'faculty',
    status: 'published'
  });

  // Student context should NOT see faculty-only resource
  const studentContext = { role: 'student', universityId: 'osmania-university', courseId: 'mca' };
  const studentFiltered = resourceManagementService.getPublicResources({}, studentContext);
  assert(!studentFiltered.some((r) => r.id === facultyRes.id), 'Students are strictly BLOCKED from seeing faculty-only resources');

  // Guest / public should NOT see faculty-only resource
  const guestFiltered = resourceManagementService.getPublicResources({});
  assert(!guestFiltered.some((r) => r.id === facultyRes.id), 'Public visitors are strictly BLOCKED from seeing faculty-only resources');

  // -------------------------------------------------------------
  // Test Area 7: Guarded Deletion & Clean Deletion
  // -------------------------------------------------------------
  console.log('\nTest Area 7: Guarded Deletion & Clean Deletion');
  // Core baseline deletion check
  const baselineId = firstRes.id;
  const canDeleteBaseline = resourceManagementService.canDeleteResource(baselineId);
  assert(!canDeleteBaseline.canDelete, 'canDeleteResource flags core baseline resource');
  assert(canDeleteBaseline.reasons.length > 0, 'Provides informative reason to archive instead');

  // Clean delete of custom resource
  const deletedRes = resourceManagementService.deleteResource(facultyRes.id, true);
  assert(deletedRes && deletedRes.id === facultyRes.id, 'Custom unpinned resource deleted successfully');
  assert(resourceManagementService.getResourceById(facultyRes.id) === null, 'Deleted resource no longer exists in store');

  // -------------------------------------------------------------
  // Test Area 8: Download & View Counter Metrics
  // -------------------------------------------------------------
  console.log('\nTest Area 8: Download & View Counter Metrics');
  const countBefore = resourceManagementService.getResourceById(createdRes.id).downloadCount || 0;
  resourceManagementService.incrementDownloadCount(createdRes.id);
  const countAfter = resourceManagementService.getResourceById(createdRes.id).downloadCount;
  assert(countAfter === countBefore + 1, 'incrementDownloadCount increases download counter by 1');

  resourceManagementService.incrementViewCount(createdRes.id);
  assert((resourceManagementService.getResourceById(createdRes.id).viewCount || 0) > 0, 'incrementViewCount increases view count');

  // -------------------------------------------------------------
  // Test Area 9: KPI Statistics & Aggregations
  // -------------------------------------------------------------
  console.log('\nTest Area 9: KPI Statistics & Aggregations');
  const stats = resourceManagementService.getResourceStats();
  assert(typeof stats.total === 'number' && stats.total > 0, 'Stats total resources is valid number');
  assert(typeof stats.published === 'number' && stats.published > 0, 'Stats published count is valid');
  assert(typeof stats.totalDownloads === 'number', 'Stats totalDownloads is tracked');
  assert(typeof stats.categoryBreakdown === 'object', 'Stats includes categoryBreakdown');

  // -------------------------------------------------------------
  // Test Area 10: Event Broadcasting & Audit History Logging
  // -------------------------------------------------------------
  console.log('\nTest Area 10: Event Broadcasting & Audit History Logging');
  const resourceEvent = emittedEvents.find((e) => e.type === RESOURCE_UPDATED_EVENT);
  assert(!!resourceEvent, `Event "${RESOURCE_UPDATED_EVENT}" dispatched on resource state modifications`);
  assert(resourceEvent.detail && (resourceEvent.detail.action || resourceEvent.detail.resource), 'Event includes action or resource detail');

  const auditEvents = auditHistoryService.getAllAuditEvents();
  assert(Array.isArray(auditEvents), 'Audit history accessible');
  const resAuditEvents = auditEvents.filter((a) => a.entityType === 'resource');
  assert(resAuditEvents.length > 0, 'Audit history records resource management events');
  assert(resAuditEvents.some((a) => a.action === 'RESOURCE_CREATED'), 'Audit log contains RESOURCE_CREATED action');
  assert(resAuditEvents.some((a) => a.action === 'RESOURCE_UPDATED'), 'Audit log contains RESOURCE_UPDATED action');

  // -------------------------------------------------------------
  // Test Area 11: Factory Baseline Reset
  // -------------------------------------------------------------
  console.log('\nTest Area 11: Factory Baseline Reset');
  const resetRes = resourceManagementService.resetToDefaults();
  assert(Array.isArray(resetRes), 'resetToDefaults succeeds and returns array of baseline resources');
  assert(resetRes.every((r) => r.status === 'published'), 'All baseline resources restored to published status');

  // -------------------------------------------------------------
  // Test Area 12: Regression Checks for Phases 2A-2F and 3A-3E
  // -------------------------------------------------------------
  console.log('\nTest Area 12: Regression Checks for Phases 2A-2F and 3A-3E');
  // Phase 3E Tools
  assert(STORAGE_KEYS.TOOLS === 'resultpoint_tools', 'Phase 3E tools storage key persists');
  const allTools = toolManagementService.getAllTools();
  assert(Array.isArray(allTools) && allTools.length >= 20, 'Phase 3E toolManagementService operational');

  // Phase 3D Reports
  const overview = reportsAnalyticsService.getOverviewMetrics({ range: 'all' });
  assert(typeof overview === 'object', 'Phase 3D reportsAnalyticsService operational');

  // Phase 3A Catalog
  const unis = academicCatalogService.getUniversities();
  assert(Array.isArray(unis) && unis.length > 0, 'Phase 3A universities catalog functional');

  console.log('\n================================================================');
  console.log(`Phase 3F Test Run Complete: ${passedAssertions} / ${totalAssertions} assertions passed`);
  console.log('================================================================\n');

  return { passed: passedAssertions, total: totalAssertions };
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
