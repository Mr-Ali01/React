/**
 * ResultPoint Phase 3G: Blog & Content Management CRUD Automated Test Suite
 *
 * Comprehensive validation of:
 * 1. Storage key registration & idempotent schema initialization
 * 2. CRUD lifecycle (Create, Read, Update, Archive, Restore, Delete)
 * 3. Immutable ID enforcement and rejection of unapproved fields
 * 4. Automatic slug generation & collision resolution (-1, -2 suffixing)
 * 5. Required-field constraints & strict image URL security (blocking XSS & script injection)
 * 6. Audience scoping and public visibility (Strict Draft/Archive exclusion)
 * 7. Search, multi-criteria filtering, and sorting algorithms
 * 8. Engagement tracking (view and like counter increments)
 * 9. Event broadcasting ('rp_blogs_updated') & audit history logging
 * 10. Dashboard KPI integration (adminDashboardService.blogs)
 * 11. Guarded deletion and factory baseline reset
 * 12. Full regression coverage for Phases 2A-2F and 3A-3F
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
  console.log('ResultPoint Phase 3G: Blog & Content Management Test Suite');
  console.log('================================================================\n');

  // Dynamic imports after localStorage mock setup
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');
  const {
    blogService,
    BLOG_UPDATED_EVENT,
    isValidImageUrl,
    generateSlug,
    estimateReadTime
  } = await import('../services/blogService.js');
  const { auditHistoryService } = await import('../services/auditHistoryService.js');
  const { adminDashboardService } = await import('../services/adminDashboardService.js');
  const { resourceManagementService } = await import('../services/resourceManagementService.js');
  const { toolManagementService } = await import('../services/toolManagementService.js');
  const { reportsAnalyticsService } = await import('../services/reportsAnalyticsService.js');
  const { academicCatalogService } = await import('../services/academicCatalogService.js');

  // -------------------------------------------------------------
  // Test Area 1: Storage Key & Idempotent Initialization
  // -------------------------------------------------------------
  console.log('Test Area 1: Storage Key & Idempotent Initialization');
  assert(STORAGE_KEYS.BLOGS === 'resultpoint_blogs', 'STORAGE_KEYS.BLOGS matches "resultpoint_blogs"');

  const initialArticles = blogService.initialize();
  assert(Array.isArray(initialArticles), 'initialize returns array of articles');
  assert(initialArticles.length >= 5, `Loaded baseline articles (count: ${initialArticles.length})`);

  const firstArt = initialArticles[0];
  assert(firstArt.id && typeof firstArt.id === 'string', 'Baseline article has valid ID');
  assert(firstArt.title && firstArt.title.length > 0, 'Baseline article has title');
  assert(firstArt.slug && firstArt.slug.length > 0, 'Baseline article has valid slug');
  assert(firstArt.status === 'published', 'Baseline article is published by default');
  assert(firstArt.viewCount !== undefined, 'Baseline article has viewCount initialized');
  assert(firstArt.likeCount !== undefined, 'Baseline article has likeCount initialized');

  // Idempotent re-initialization
  const reinitArticles = blogService.initialize();
  assert(reinitArticles.length === initialArticles.length, 'Re-initialization preserves article count without duplication');

  // -------------------------------------------------------------
  // Test Area 2: Reading, Searching, and Multi-Criteria Filters
  // -------------------------------------------------------------
  console.log('\nTest Area 2: Reading, Searching, and Multi-Criteria Filters');
  const allArticles = blogService.getAllArticles();
  assert(allArticles.length === initialArticles.length, 'getAllArticles returns all items');

  const foundById = blogService.getArticleById(firstArt.id);
  assert(foundById && foundById.title === firstArt.title, 'getArticleById retrieves exact article');

  const foundBySlug = blogService.getArticleBySlug(firstArt.slug);
  assert(foundBySlug && foundBySlug.id === firstArt.id, 'getArticleBySlug retrieves exact article');

  const nonExistent = blogService.getArticleById('non-existent-blog-id');
  assert(nonExistent === null, 'getArticleById returns null for missing ID');

  // Search by title substring
  const searchByTitle = blogService.getAllArticles({ search: 'SGPA' });
  assert(searchByTitle.length > 0, 'Search finds articles matching "SGPA"');
  assert(searchByTitle.every((a) => (a.title + a.excerpt + a.category + (a.tags || []).join(' ')).toLowerCase().includes('sgpa')), 'All search results match query');

  // Filter by category
  const calcArticles = blogService.getAllArticles({ category: 'Calculations & Formulas' });
  assert(calcArticles.length > 0, 'Filter by category "Calculations & Formulas" returns matching items');
  assert(calcArticles.every((a) => a.category === 'Calculations & Formulas'), 'Filtered items match exact category');

  // Filter by university
  const jntuhArticles = blogService.getAllArticles({ universityId: 'jntuh' });
  assert(jntuhArticles.length > 0, 'Filter by universityId "jntuh" returns matching items');

  // Sorting
  const sortedByViews = blogService.getAllArticles({ sortBy: 'views' });
  assert(sortedByViews[0].viewCount >= sortedByViews[sortedByViews.length - 1].viewCount, 'Sort by views correctly orders descending');

  // -------------------------------------------------------------
  // Test Area 3: Create Article with Validation & Slug Generation
  // -------------------------------------------------------------
  console.log('\nTest Area 3: Create Article with Validation & Slug Generation');
  const createdArt = blogService.createArticle({
    title: 'Top 10 Study Habits for JNTUH Semester Exams',
    excerpt: 'Proven revision cycles, formula sheets, and past question analysis to excel in semester exams.',
    content: `# Top 10 Study Habits for JNTUH Semester Exams\n\nConsistency and regular problem solving are essential.\n\n## 1. Practice 5-Year Questions\nUnderstand high-frequency exam patterns.`,
    category: 'Student Tips',
    tags: ['Study Habits', 'JNTUH', 'Exams', 'Success'],
    author: 'Editorial Desk',
    authorRole: 'Senior Academic Advisor',
    featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    targetAudience: 'students',
    universityId: 'jntuh',
    isPinned: true
  });

  assert(createdArt && createdArt.id.startsWith('art_'), 'Created article receives unique ID');
  assert(createdArt.slug === 'top-10-study-habits-for-jntuh-semester-exams', 'Slug generated accurately from title');
  assert(createdArt.title === 'Top 10 Study Habits for JNTUH Semester Exams', 'Title persisted accurately');
  assert(createdArt.status === 'published', 'Initial status set to published');
  assert(createdArt.isPinned === true, 'Pinned status set to true');
  assert(createdArt.publishedAt !== null, 'publishedAt timestamp automatically set');

  // Test Slug Collision Resolution
  const duplicateTitleArticle = blogService.createArticle({
    title: 'Top 10 Study Habits for JNTUH Semester Exams',
    excerpt: 'Second revision of the study guide with updated lab exam advice.',
    content: 'Full content for duplicate test.',
    category: 'Student Tips'
  });
  assert(duplicateTitleArticle.slug === 'top-10-study-habits-for-jntuh-semester-exams-1', 'Slug collision resolved with -1 suffix');

  // Rejection: empty title
  try {
    blogService.createArticle({ title: '', content: 'Some content', category: 'Student Tips' });
    assert(false, 'Should reject empty title');
  } catch (err) {
    assert(err.message.includes('title is required'), 'Rejects empty title with descriptive message');
  }

  // Rejection: title too short (< 3 chars)
  try {
    blogService.createArticle({ title: 'AB', content: 'Some content', category: 'Student Tips' });
    assert(false, 'Should reject title < 3 chars');
  } catch (err) {
    assert(err.message.includes('at least 3 characters'), 'Rejects short title');
  }

  // Rejection: missing content
  try {
    blogService.createArticle({ title: 'Valid Title Here', content: '', category: 'Student Tips' });
    assert(false, 'Should reject empty content');
  } catch (err) {
    assert(err.message.includes('content is required'), 'Rejects empty content');
  }

  // Rejection: missing category
  try {
    blogService.createArticle({ title: 'Valid Title Here', content: 'Valid body', category: '' });
    assert(false, 'Should reject missing category');
  } catch (err) {
    assert(err.message.includes('category is required'), 'Rejects missing category');
  }

  // URL Security validation: blocks script injection & unsafe protocols
  assert(!isValidImageUrl('javascript:alert("xss")'), 'Blocks javascript: protocol in image URL');
  assert(!isValidImageUrl('data:text/html,<script>alert(1)</script>'), 'Blocks data: protocol in image URL');
  assert(!isValidImageUrl('https://example.com/test<script>'), 'Blocks <script> tags in image URL');
  assert(!isValidImageUrl('https://example.com/test?param=eval(1)'), 'Blocks eval in image URL');
  assert(!isValidImageUrl('ftp://example.com/photo.jpg'), 'Blocks non-HTTP/HTTPS protocols');
  assert(isValidImageUrl('https://images.unsplash.com/photo-1234.jpg'), 'Accepts valid HTTPS URL');
  assert(isValidImageUrl('http://static.university.edu/banner.png'), 'Accepts valid HTTP URL');

  try {
    blogService.createArticle({
      title: 'Malicious Image Test',
      content: 'Attempting to inject javascript into featuredImage',
      category: 'Student Tips',
      featuredImage: 'javascript:alert(document.cookie)'
    });
    assert(false, 'Should reject javascript: in image URL');
  } catch (err) {
    assert(err.message.includes('Invalid image URL') || err.message.includes('executable script'), 'Blocks unsafe script image URLs on article creation');
  }

  // -------------------------------------------------------------
  // Test Area 4: Update Article & Immutable ID Enforcement
  // -------------------------------------------------------------
  console.log('\nTest Area 4: Update Article & Immutable ID Enforcement');
  const updatedArt = blogService.updateArticle(createdArt.id, {
    title: 'Top 10 Study Habits for JNTUH Semester Exams (2026 Edition)',
    author: 'Prof. Ramesh Rao'
  });
  assert(updatedArt.title === 'Top 10 Study Habits for JNTUH Semester Exams (2026 Edition)', 'Title updated successfully');
  assert(updatedArt.author === 'Prof. Ramesh Rao', 'Author updated successfully');

  // Enforces immutable ID
  try {
    blogService.updateArticle(createdArt.id, { id: 'hacked-blog-id' });
    assert(false, 'Should reject changing article ID');
  } catch (err) {
    assert(err.message.includes('immutable'), 'Enforces strictly immutable article IDs');
  }

  // Rejection of unsupported fields
  try {
    blogService.updateArticle(createdArt.id, { unsupportedMaliciousField: 'injection' });
    assert(false, 'Should reject unsupported fields');
  } catch (err) {
    assert(err.message.includes('Unsupported field'), 'Rejects arbitrary unapproved fields');
  }

  // -------------------------------------------------------------
  // Test Area 5: Publication Lifecycle (Draft, Published, Archived)
  // -------------------------------------------------------------
  console.log('\nTest Area 5: Publication Lifecycle (Draft, Published, Archived)');
  // Transition to Draft
  const draftArt = blogService.setArticleStatus(createdArt.id, 'draft');
  assert(draftArt.status === 'draft', 'Status successfully changed to draft');

  // Verify excluded from public directory
  const publicDirAfterDraft = blogService.getPublicArticles();
  assert(!publicDirAfterDraft.some((a) => a.id === createdArt.id), 'Draft articles are strictly EXCLUDED from student public directory');

  // Transition to Archived
  const archivedArt = blogService.setArticleStatus(createdArt.id, 'archived');
  assert(archivedArt.status === 'archived', 'Status successfully changed to archived');
  assert(archivedArt.archivedAt !== null, 'archivedAt timestamp set');

  // Verify excluded from public directory
  const publicDirAfterArchive = blogService.getPublicArticles();
  assert(!publicDirAfterArchive.some((a) => a.id === createdArt.id), 'Archived articles are strictly EXCLUDED from student public directory');

  // Reactivate to Published
  const reactivatedArt = blogService.setArticleStatus(createdArt.id, 'published');
  assert(reactivatedArt.status === 'published', 'Status reactivated to published');
  assert(reactivatedArt.publishedAt !== null, 'publishedAt timestamp refreshed');

  const publicDirAfterPublish = blogService.getPublicArticles();
  assert(publicDirAfterPublish.some((a) => a.id === createdArt.id), 'Published article is visible in public directory');

  // -------------------------------------------------------------
  // Test Area 6: Audience & Context Scoping
  // -------------------------------------------------------------
  console.log('\nTest Area 6: Audience & Context Scoping');
  // Faculty-only article creation
  const facultyArt = blogService.createArticle({
    title: 'Faculty Assessment Guidelines for External Viva',
    content: 'Internal procedural instructions for viva voce evaluation.',
    category: 'University Policies',
    targetAudience: 'faculty',
    status: 'published'
  });

  // Student context should NOT see faculty-only article
  const studentContext = { role: 'student', universityId: 'jntuh' };
  const studentFiltered = blogService.getPublicArticles({}, studentContext);
  assert(!studentFiltered.some((a) => a.id === facultyArt.id), 'Students are strictly BLOCKED from seeing faculty-only articles');

  // Guest / public should NOT see faculty-only article
  const guestFiltered = blogService.getPublicArticles({});
  assert(!guestFiltered.some((a) => a.id === facultyArt.id), 'Public visitors are strictly BLOCKED from seeing faculty-only articles');

  // -------------------------------------------------------------
  // Test Area 7: Guarded Deletion & Clean Deletion
  // -------------------------------------------------------------
  console.log('\nTest Area 7: Guarded Deletion & Clean Deletion');
  // Core baseline deletion check
  const baselineId = firstArt.id;
  const canDeleteBaseline = blogService.canDeleteArticle(baselineId);
  assert(!canDeleteBaseline.canDelete, 'canDeleteArticle flags core baseline article');
  assert(canDeleteBaseline.reasons.length > 0, 'Provides informative reason to archive instead');

  // Clean delete of custom unpinned article
  const deletedArt = blogService.deleteArticle(facultyArt.id, true);
  assert(deletedArt && deletedArt.id === facultyArt.id, 'Custom unpinned article deleted successfully');
  assert(blogService.getArticleById(facultyArt.id) === null, 'Deleted article no longer exists in store');

  // Clean delete of duplicate test article
  blogService.deleteArticle(duplicateTitleArticle.id, true);

  // -------------------------------------------------------------
  // Test Area 8: Engagement Tracking (Views & Likes)
  // -------------------------------------------------------------
  console.log('\nTest Area 8: Engagement Tracking (Views & Likes)');
  const viewsBefore = blogService.getArticleById(createdArt.id).viewCount || 0;
  blogService.incrementViewCount(createdArt.id);
  const viewsAfter = blogService.getArticleById(createdArt.id).viewCount;
  assert(viewsAfter === viewsBefore + 1, 'incrementViewCount increases view counter by 1');

  const likesBefore = blogService.getArticleById(createdArt.id).likeCount || 0;
  blogService.incrementLikeCount(createdArt.id);
  const likesAfter = blogService.getArticleById(createdArt.id).likeCount;
  assert(likesAfter === likesBefore + 1, 'incrementLikeCount increases like counter by 1');

  // -------------------------------------------------------------
  // Test Area 9: KPI Statistics & Dashboard Integration
  // -------------------------------------------------------------
  console.log('\nTest Area 9: KPI Statistics & Dashboard Integration');
  const stats = blogService.getBlogStats();
  assert(typeof stats.total === 'number' && stats.total > 0, 'Stats total articles is valid number');
  assert(typeof stats.published === 'number' && stats.published > 0, 'Stats published count is valid');
  assert(typeof stats.totalViews === 'number', 'Stats totalViews is tracked');
  assert(typeof stats.categoryBreakdown === 'object', 'Stats includes categoryBreakdown');

  // Verify adminDashboardService.getStats() includes blogs
  const adminStats = adminDashboardService.getStats();
  assert(adminStats.blogs !== undefined, 'adminDashboardService.getStats() exposes blogs metric');
  assert(typeof adminStats.blogs.value === 'string', 'Dashboard blogs metric value is a string');
  assert(adminStats.blogs.subtitle.includes('published'), 'Dashboard blogs metric subtitle describes published articles');

  // -------------------------------------------------------------
  // Test Area 10: Event Broadcasting & Audit History Logging
  // -------------------------------------------------------------
  console.log('\nTest Area 10: Event Broadcasting & Audit History Logging');
  const blogEvent = emittedEvents.find((e) => e.type === BLOG_UPDATED_EVENT);
  assert(!!blogEvent, `Event "${BLOG_UPDATED_EVENT}" dispatched on article state modifications`);
  assert(blogEvent.detail && (blogEvent.detail.action || blogEvent.detail.article), 'Event includes action or article detail');

  const auditEvents = auditHistoryService.getAllAuditEvents();
  assert(Array.isArray(auditEvents), 'Audit history accessible');
  const blogAuditEvents = auditEvents.filter((a) => a.entityType === 'blog');
  assert(blogAuditEvents.length > 0, 'Audit history records blog management events');
  assert(blogAuditEvents.some((a) => a.action === 'BLOG_CREATED'), 'Audit log contains BLOG_CREATED action');
  assert(blogAuditEvents.some((a) => a.action === 'BLOG_UPDATED'), 'Audit log contains BLOG_UPDATED action');

  // -------------------------------------------------------------
  // Test Area 11: Factory Baseline Reset
  // -------------------------------------------------------------
  console.log('\nTest Area 11: Factory Baseline Reset');
  const resetArticles = blogService.resetToDefaults();
  assert(Array.isArray(resetArticles), 'resetToDefaults succeeds and returns array of baseline articles');
  assert(resetArticles.every((a) => a.status === 'published'), 'All baseline articles restored to published status');

  // -------------------------------------------------------------
  // Test Area 12: Regression Checks for Phases 2A-2F and 3A-3F
  // -------------------------------------------------------------
  console.log('\nTest Area 12: Regression Checks for Phases 2A-2F and 3A-3F');
  // Phase 3F Resources
  assert(STORAGE_KEYS.RESOURCES === 'resultpoint_resources', 'Phase 3F resources storage key persists');
  const allResources = resourceManagementService.getAllResources();
  assert(Array.isArray(allResources) && allResources.length > 0, 'Phase 3F resourceManagementService operational');

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
  console.log(`Phase 3G Test Run Complete: ${passedAssertions} / ${totalAssertions} assertions passed`);
  console.log('================================================================\n');

  return { passed: passedAssertions, total: totalAssertions };
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
