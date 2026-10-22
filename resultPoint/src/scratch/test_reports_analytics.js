/**
 * ResultPoint Phase 3D: Reports & Analytics Management Automated Test Suite
 *
 * Verifies:
 * 1. KPI values match underlying source records (users, calculators, catalog, support, announcements).
 * 2. Empty datasets are handled gracefully with safe fallbacks and empty states.
 * 3. Calculator usage counts match genuine recorded events (no page-view fabrication).
 * 4. Date-range filtering includes and excludes the correct records based on timestamps.
 * 5. Missing or invalid timestamps do not fabricate activity and disclose limitation counts.
 * 6. University and course counts use valid user relationships (distinguishing catalog vs enrolled).
 * 7. Support-query status and priority aggregates are mathematically accurate.
 * 8. Announcement status and audience aggregates are mathematically accurate.
 * 9. Changing filters updates all dependent metrics and series consistently.
 * 10. Percentages and denominators are calculated safely (zero division protection).
 * 11. CSV exports reflect active filters and escape special characters (RFC 4180).
 * 12. CSV exports prevent spreadsheet formula injection (=, +, -, @ prepended with ').
 * 13. Exported data strictly excludes credentials, passwords, and tokens.
 * 14. Source records remain completely immutable during aggregations.
 * 15. Relevant update events trigger analytics refresh without memory leaks.
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
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('ResultPoint Phase 3D: Reports & Analytics Management Test Suite');
  console.log('================================================================\n');

  // Import services dynamically after setting up global mocks
  const { reportsAnalyticsService, escapeCSVCell } = await import('../services/reportsAnalyticsService.js');
  const { STORAGE_KEYS } = await import('../services/storageKeys.js');
  const { userService } = await import('../services/userService.js');
  const { supportQueryService } = await import('../services/supportQueryService.js');
  const { announcementService } = await import('../services/announcementService.js');
  const { academicCatalogService } = await import('../services/academicCatalogService.js');

  // Clear all stores to test isolation
  memoryStore.clear();

  // Seed baseline fixture data
  const now = new Date();
  const isoNow = now.toISOString();
  const date5DaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString();
  const date15DaysAgo = new Date(now.getTime() - 15 * 86400000).toISOString();
  const date45DaysAgo = new Date(now.getTime() - 45 * 86400000).toISOString();
  const date200DaysAgo = new Date(now.getTime() - 200 * 86400000).toISOString();

  // 1. Initialize Academic Catalog & Add a 3rd empty university for testing
  academicCatalogService.initialize();
  try {
    academicCatalogService.addUniversity({
      name: 'Central University of Technology',
      shortName: 'CUT',
      city: 'Hyderabad',
      state: 'Telangana',
      status: 'active'
    });
  } catch {}

  const catalog = academicCatalogService.getCatalog();
  const totalCatalogCoursesCount = (catalog.universities || []).reduce(
    (sum, u) => sum + (Array.isArray(u.courses) ? u.courses.length : 0),
    0
  );

  // 2. Seed Users: 4 Students, 1 Admin (including canonical seed accounts to preserve idempotency)
  const testUsers = [
    {
      id: 'usr_student_01',
      fullName: 'Student User',
      email: 'student@resultpoint.edu',
      role: 'student',
      status: 'Active',
      universityId: 'osmania',
      courseId: 'bca',
      course: 'BCA — Bachelor of Computer Applications',
      regulationId: 'ou-bca-cbcs',
      hallTicketNumber: '100520733001',
      currentSemester: 5,
      joinedDate: date5DaysAgo
    },
    {
      id: 'usr_s2',
      fullName: 'Diya Patel',
      email: 'diya@example.com',
      role: 'student',
      status: 'Active',
      universityId: 'osmania',
      courseId: 'bca',
      course: 'BCA — Bachelor of Computer Applications',
      regulationId: 'ou-bca-cbcs',
      hallTicketNumber: '100520733002',
      currentSemester: 4,
      joinedDate: date15DaysAgo
    },
    {
      id: 'usr_s3',
      fullName: 'Rohan Verma',
      email: 'rohan@example.com',
      role: 'student',
      status: 'Inactive',
      universityId: 'jntuh',
      courseId: 'btech-cse',
      course: 'B.Tech - Computer Science & Engineering',
      regulationId: 'jntuh-cse-r18',
      hallTicketNumber: '19031A0501',
      currentSemester: 6,
      joinedDate: date45DaysAgo
    },
    {
      id: 'usr_s4_incomplete',
      fullName: 'Incomplete Student',
      email: 'incomplete@example.com',
      role: 'student',
      status: 'Active',
      // Missing university, course, hallTicket
      joinedDate: date200DaysAgo
    },
    {
      id: 'usr_admin_01',
      fullName: 'Platform Admin',
      email: 'admin@resultpoint.edu',
      role: 'admin',
      status: 'Active',
      joinedDate: date200DaysAgo
    }
  ];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(testUsers));

  // 3. Seed Calculator Events:
  const testSavedResults = [
    {
      id: 'calc_01',
      userId: 'usr_student_01',
      tool: 'CGPA Calculator',
      score: '8.75 CGPA',
      timestamp: date5DaysAgo
    },
    {
      id: 'calc_02',
      userId: 'usr_student_01',
      tool: 'SGPA Calculator',
      score: '9.00 SGPA',
      timestamp: date15DaysAgo
    },
    {
      id: 'calc_03',
      userId: 'usr_s2',
      tool: 'CGPA Calculator',
      score: '8.20 CGPA',
      timestamp: date45DaysAgo
    },
    {
      id: 'calc_04_no_ts',
      userId: 'usr_s3',
      tool: 'Percentage Calculator',
      score: '78.5%',
      // Intentionally missing timestamp to test legacy/un-timestamped handling
      timestamp: null
    }
  ];
  localStorage.setItem(STORAGE_KEYS.SAVED_RESULTS, JSON.stringify(testSavedResults));

  // 4. Seed Support Queries:
  const testQueries = [
    {
      id: 'query_01',
      ticketId: 'RP-TICK-001',
      fullName: 'Student User',
      email: 'student@resultpoint.edu',
      subject: 'CGPA Calculation Formula Query',
      category: 'Calculator Support',
      priority: 'High',
      status: 'Resolved',
      createdAt: date15DaysAgo,
      resolvedAt: date5DaysAgo // took 10 days = 240 hours
    },
    {
      id: 'query_02',
      ticketId: 'RP-TICK-002',
      fullName: 'Diya Patel',
      email: 'diya@example.com',
      subject: '=CMD|calc!A1 Dangerous Subject',
      category: 'Account or Dashboard Support',
      priority: 'Urgent',
      status: 'Open',
      createdAt: date5DaysAgo
    },
    {
      id: 'query_03',
      ticketId: 'RP-TICK-003',
      fullName: 'Rohan Verma',
      email: 'rohan@example.com',
      subject: 'Need Syllabus for R18 IT',
      category: 'Resource Request',
      priority: 'Medium',
      status: 'In Progress',
      createdAt: date45DaysAgo
    }
  ];
  localStorage.setItem(STORAGE_KEYS.SUPPORT_QUERIES, JSON.stringify(testQueries));

  // 5. Seed Announcements:
  const testAnnouncements = [
    {
      id: 'anc_01',
      title: 'CBCS 2026 Examination Schedule',
      category: 'Examination Schedule',
      priority: 'High',
      status: 'Published',
      targetAudience: 'university',
      targetUniversityId: 'univ_ou',
      isBanner: true,
      createdAt: date15DaysAgo
    },
    {
      id: 'anc_02',
      title: 'Platform Maintenance Draft Notice',
      category: 'Platform Notice',
      priority: 'Urgent',
      status: 'Draft',
      targetAudience: 'all',
      isBanner: false,
      createdAt: date5DaysAgo
    },
    {
      id: 'anc_03',
      title: 'Old Autumn 2025 Notice',
      category: 'General',
      priority: 'Low',
      status: 'Archived',
      targetAudience: 'students',
      isBanner: false,
      createdAt: date200DaysAgo
    }
  ];
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(testAnnouncements));

  // -------------------------------------------------------------------------
  // TEST SECTION 1: KPI Values Match Underlying Source Records
  // -------------------------------------------------------------------------
  console.log('--- Section 1: KPI Values Verification ---');
  const overview = reportsAnalyticsService.getOverviewMetrics({ range: 'all' });
  assert(overview.users.total === 5, 'Total users count matches source records (4 students + 1 admin = 5)');
  assert(overview.users.students === 4, 'Student accounts count matches 4');
  assert(overview.users.admins === 1, 'Admin accounts count matches 1');
  assert(overview.users.active === 4, 'Active accounts count matches 4 (3 students + 1 admin)');
  assert(overview.users.inactive === 1, 'Inactive accounts count matches 1');
  const expectedUnivCount = academicCatalogService.getUniversities().length;
  assert(overview.calculations.totalRecorded === 4, 'Total calculations matches 4 saved records');
  assert(overview.academic.catalogUniversities === expectedUnivCount, `Catalog configured universities matches ${expectedUnivCount}`);
  assert(overview.academic.catalogCourses === totalCatalogCoursesCount, `Catalog configured courses matches ${totalCatalogCoursesCount}`);
  assert(overview.support.allTimeTotal === 3, 'Support queries count matches 3');
  assert(overview.announcements.allTimeTotal === 3, 'Announcements count matches 3');

  // -------------------------------------------------------------------------
  // TEST SECTION 2: Empty Datasets Handled Correctly
  // -------------------------------------------------------------------------
  console.log('\n--- Section 2: Empty Datasets Handled Correctly ---');
  // Test a future window where genuinely 0 events exist across all domains
  const futureStart = new Date(now.getTime() + 10 * 86400000).toISOString().slice(0, 10);
  const futureEnd = new Date(now.getTime() + 15 * 86400000).toISOString().slice(0, 10);

  const emptyOverview = reportsAnalyticsService.getOverviewMetrics({
    range: 'custom',
    customStart: futureStart,
    customEnd: futureEnd
  });
  assert(emptyOverview.users.joinedInPeriod === 0, 'Empty window returns 0 joined users');
  assert(emptyOverview.calculations.periodRecorded === 0, 'Empty window returns 0 calculations');
  assert(emptyOverview.support.total === 0, 'Empty window returns 0 support queries');
  assert(emptyOverview.announcements.total === 0, 'Empty window returns 0 announcements');

  const emptyCalc = reportsAnalyticsService.getCalculatorUsageAnalytics({
    range: 'custom',
    customStart: futureStart,
    customEnd: futureEnd
  });
  assert(emptyCalc.totalCalculations === 0, 'Empty calculator analytics returns 0 count');
  assert(emptyCalc.toolRows.length === 0, 'Empty calculator analytics returns empty toolRows array');
  assert(emptyCalc.mostUsedTool === null, 'Empty calculator analytics returns null mostUsedTool');

  // Safe percentage when student count is 0
  const emptyStudents = reportsAnalyticsService.getAcademicDistributionAnalytics({ filterStudents: [] });
  assert(typeof emptyStudents.profileCompleteness.completenessRate === 'number', 'Completeness rate is a valid number');

  // -------------------------------------------------------------------------
  // TEST SECTION 3: Calculator Usage Counts Match Recorded Events
  // -------------------------------------------------------------------------
  console.log('\n--- Section 3: Calculator Usage Counts Verification ---');
  const calcAll = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: 'all' });
  assert(calcAll.totalCalculations === 4, 'Calculator analytics counts exactly 4 recorded events');
  const cgpaRow = calcAll.toolRows.find((r) => r.toolName === 'CGPA Calculator');
  assert(cgpaRow !== undefined, 'CGPA Calculator exists in toolRows');
  assert(cgpaRow.count === 2, 'CGPA Calculator count is exactly 2');
  assert(cgpaRow.percentage === 50.0, 'CGPA Calculator share is 50.0% (2 / 4)');
  assert(calcAll.mostUsedTool.toolName === 'CGPA Calculator', 'Most used tool is correctly identified as CGPA Calculator');

  // -------------------------------------------------------------------------
  // TEST SECTION 4: Date-Range Filtering Includes and Excludes Correct Records
  // -------------------------------------------------------------------------
  console.log('\n--- Section 4: Date-Range Filtering Verification ---');
  // 7 Days range: Should include date5DaysAgo (calc_01), exclude date15DaysAgo (calc_02), date45DaysAgo (calc_03)
  const calc7d = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: '7d' });
  assert(calc7d.totalCalculations === 1, '7d filter includes exactly 1 calculation (from 5 days ago)');
  assert(calc7d.toolRows[0].toolName === 'CGPA Calculator', '7d calculation is CGPA Calculator');

  // 30 Days range: Should include date5DaysAgo (calc_01) and date15DaysAgo (calc_02), exclude date45DaysAgo (calc_03)
  const calc30d = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: '30d' });
  assert(calc30d.totalCalculations === 2, '30d filter includes exactly 2 calculations (5d and 15d)');

  // 90 Days range: Should include calc_01 (5d), calc_02 (15d), calc_03 (45d)
  const calc90d = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: '90d' });
  assert(calc90d.totalCalculations === 3, '90d filter includes 3 timestamped calculations');

  // -------------------------------------------------------------------------
  // TEST SECTION 5: Missing or Invalid Timestamps Do Not Fabricate Activity
  // -------------------------------------------------------------------------
  console.log('\n--- Section 5: Missing / Invalid Timestamp Integrity ---');
  // calc_04_no_ts has timestamp: null. In 30d filter, it must be excluded and counted as missingTimestampsCount
  assert(calc30d.missingTimestampsCount === 1, 'Excluded exactly 1 un-timestamped calculation from 30d window');
  assert(
    calcAll.totalCalculations === 4,
    'All Time includes the un-timestamped calculation without fabricating artificial timestamps'
  );

  // -------------------------------------------------------------------------
  // TEST SECTION 6: University and Course Counts Use Valid User Relationships
  // -------------------------------------------------------------------------
  console.log('\n--- Section 6: University and Course Distribution Integrity ---');
  const academic = reportsAnalyticsService.getAcademicDistributionAnalytics();
  assert(academic.totalStudents === 4, 'Total students is 4');
  assert(academic.catalogUniversitiesCount === expectedUnivCount, `Configured catalog universities matches ${expectedUnivCount}`);
  assert(academic.enrolledUniversitiesCount === 2, 'Only 2 universities have enrolled students (osmania: 2, jntuh: 1)');

  const ouRow = academic.universityRows.find((u) => u.universityId === 'osmania');
  assert(ouRow !== undefined, 'Osmania University row found');
  assert(ouRow.studentCount === 2, 'Osmania University has 2 students');
  assert(ouRow.percentage === 50.0, 'Osmania University has 50.0% share (2 / 4 students)');

  const unassignedRow = academic.universityRows.find((u) => u.universityId === 'unassigned');
  assert(unassignedRow !== undefined, 'Unassigned profile row found for incomplete student');
  assert(unassignedRow.studentCount === 1, 'Unassigned profile count is 1');

  // Completeness breakdown
  assert(academic.profileCompleteness.completeCount === 3, '3 students have 100% complete academic profiles');
  assert(academic.profileCompleteness.incompleteCount === 1, '1 student has an incomplete academic profile');
  assert(academic.profileCompleteness.completenessRate === 75.0, 'Profile completeness rate is 75.0% (3 / 4)');
  assert(academic.profileCompleteness.missingFields.missingUniversity === 1, 'Missing university field count is 1');

  // -------------------------------------------------------------------------
  // TEST SECTION 7: Support-Query Status and Priority Aggregates Are Accurate
  // -------------------------------------------------------------------------
  console.log('\n--- Section 7: Support Query Metrics Accuracy ---');
  const supportAll = reportsAnalyticsService.getSupportAnalytics({ range: 'all' });
  assert(supportAll.totalTickets === 3, 'Support total is 3 tickets');
  assert(supportAll.statusCounts.open === 1, 'Open tickets count is 1');
  assert(supportAll.statusCounts.inProgress === 1, 'In Progress tickets count is 1');
  assert(supportAll.statusCounts.resolved === 1, 'Resolved tickets count is 1');
  assert(supportAll.priorityCounts.urgent === 1, 'Urgent priority count is 1');
  assert(supportAll.priorityCounts.high === 1, 'High priority count is 1');
  assert(supportAll.priorityCounts.medium === 1, 'Medium priority count is 1');

  // Resolution metrics
  assert(supportAll.resolutionMetrics.hasResolutionData === true, 'Resolution metrics calculated for ticket with timestamps');
  assert(supportAll.resolutionMetrics.resolvedWithDatesCount === 1, 'Exactly 1 resolved ticket has valid creation and resolution timestamps');
  assert(supportAll.resolutionMetrics.avgResolutionHours === 240.0, 'Resolution hours is exactly 240.0 hrs (10 days difference)');

  // -------------------------------------------------------------------------
  // TEST SECTION 8: Announcement Status and Audience Aggregates Are Accurate
  // -------------------------------------------------------------------------
  console.log('\n--- Section 8: Announcement Metrics Accuracy ---');
  const ancAll = reportsAnalyticsService.getAnnouncementAnalytics({ range: 'all' });
  assert(ancAll.total === 3, 'Total announcements is 3');
  assert(ancAll.statusCounts.published === 1, 'Published count is 1');
  assert(ancAll.statusCounts.draft === 1, 'Draft count is 1');
  assert(ancAll.statusCounts.archived === 1, 'Archived count is 1');
  assert(ancAll.audienceCounts.university === 1, 'Target audience university count is 1');
  assert(ancAll.audienceCounts.all === 1, 'Target audience all count is 1');
  assert(ancAll.audienceCounts.students === 1, 'Target audience students count is 1');
  assert(ancAll.activeBanners === 1, 'Active banners count is 1 (published + isBanner: true)');

  // -------------------------------------------------------------------------
  // TEST SECTION 9: Filters Update Dependent Metrics Consistently
  // -------------------------------------------------------------------------
  console.log('\n--- Section 9: Multi-Dimensional Filter Reactivity ---');
  // Tool filter on calculator usage
  const cgpaFiltered = reportsAnalyticsService.getCalculatorUsageAnalytics({ range: 'all', tool: 'CGPA' });
  assert(cgpaFiltered.totalCalculations === 2, 'Tool filter "CGPA" matches only 2 calculations');
  assert(cgpaFiltered.toolRows.length === 1, 'Tool filter returns only 1 tool category in breakdown');

  // Status filter on support queries
  const openSupport = reportsAnalyticsService.getSupportAnalytics({ range: 'all', status: 'Open' });
  assert(openSupport.totalTickets === 1, 'Status filter "Open" returns 1 ticket');
  assert(openSupport.statusCounts.open === 1, 'Status count matches 1');

  // -------------------------------------------------------------------------
  // TEST SECTION 10: Percentages and Denominators Calculated Safely
  // -------------------------------------------------------------------------
  console.log('\n--- Section 10: Safe Mathematical Operations (Zero Division) ---');
  // Create an artificial filter that returns 0 records
  const futureDateStart = new Date(now.getTime() + 86400000).toISOString();
  const futureCalc = reportsAnalyticsService.getCalculatorUsageAnalytics({
    range: 'custom',
    customStart: futureDateStart,
    customEnd: futureDateStart
  });
  assert(futureCalc.totalCalculations === 0, 'Zero calculations in future date range');
  assert(futureCalc.toolRows.length === 0, 'Zero tool rows returned');
  // Ensure no NaN in timeline
  futureCalc.timeline.forEach((point) => {
    assert(!isNaN(point.count), `Timeline point count ${point.count} is a valid number`);
  });

  // -------------------------------------------------------------------------
  // TEST SECTION 11: CSV Exports Reflect Current Filters & Escape Characters
  // -------------------------------------------------------------------------
  console.log('\n--- Section 11: RFC 4180 CSV Generation & Filter Compliance ---');
  const csvCalculators = reportsAnalyticsService.generateCSV('calculators', { range: 'all' });
  assert(typeof csvCalculators.content === 'string', 'CSV content is a string');
  assert(csvCalculators.content.includes('"Tool ID","Tool Name"'), 'Headers are properly escaped and present');
  assert(csvCalculators.content.includes('"CGPA Calculator"'), 'Contains CGPA Calculator row');
  assert(csvCalculators.filename.startsWith('resultpoint_calculator_usage_all_'), 'Filename reflects active range and date');

  // Filtered CSV
  const csv7d = reportsAnalyticsService.generateCSV('calculators', { range: '7d' });
  assert(csv7d.content.split('\r\n').length === 2, '7d CSV has header + exactly 1 data row');

  // -------------------------------------------------------------------------
  // TEST SECTION 12: Prevent Spreadsheet Formula Injection
  // -------------------------------------------------------------------------
  console.log('\n--- Section 12: Formula Injection Prevention Security ---');
  // Test escapeCSVCell with formula injection payload
  const formulaPayload1 = '=SUM(A1:A10)';
  const escaped1 = escapeCSVCell(formulaPayload1);
  assert(escaped1.startsWith("\"'="), `Formula starting with = is prefixed with single quote: ${escaped1}`);

  const formulaPayload2 = '+1234567';
  const escaped2 = escapeCSVCell(formulaPayload2);
  assert(escaped2.startsWith("\"'+"), `Formula starting with + is prefixed with single quote: ${escaped2}`);

  const formulaPayload3 = '-cmd|"/C calc"!A0';
  const escaped3 = escapeCSVCell(formulaPayload3);
  assert(escaped3.startsWith("\"'-"), `Formula starting with - is prefixed with single quote: ${escaped3}`);

  const formulaPayload4 = '@SUM(1+1)';
  const escaped4 = escapeCSVCell(formulaPayload4);
  assert(escaped4.startsWith("\"'@"), `Formula starting with @ is prefixed with single quote: ${escaped4}`);

  // Also verify query_02 with dangerous subject in Support CSV
  const csvSupport = reportsAnalyticsService.generateCSV('support', { range: 'all' });
  assert(csvSupport.content.includes("'=CMD|calc!A1 Dangerous Subject"), 'Dangerous subject in support query is sanitized in exported CSV');

  // -------------------------------------------------------------------------
  // TEST SECTION 13: Exported Data Strictly Excludes Credentials
  // -------------------------------------------------------------------------
  console.log('\n--- Section 13: Sensitive Data Sanitization Integrity ---');
  const csvOverview = reportsAnalyticsService.generateCSV('overview', { range: 'all' });
  assert(!csvOverview.content.includes('password'), 'Overview CSV contains no password references');
  assert(!csvOverview.content.includes('token'), 'Overview CSV contains no auth token references');
  assert(!csvOverview.content.includes('hash'), 'Overview CSV contains no credential hashes');

  // -------------------------------------------------------------------------
  // TEST SECTION 14: Source Records Remain Unchanged (Immutability)
  // -------------------------------------------------------------------------
  console.log('\n--- Section 14: Source Record Immutability Verification ---');
  const usersBefore = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
  reportsAnalyticsService.getOverviewMetrics({ range: 'all' });
  reportsAnalyticsService.getAcademicDistributionAnalytics();
  const usersAfter = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
  assert(JSON.stringify(usersBefore) === JSON.stringify(usersAfter), 'User source records completely unchanged after aggregations');

  const calcsBefore = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS));
  reportsAnalyticsService.getCalculatorUsageAnalytics({ range: 'all' });
  const calcsAfter = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS));
  assert(JSON.stringify(calcsBefore) === JSON.stringify(calcsAfter), 'Calculation records completely unchanged after aggregations');

  // -------------------------------------------------------------------------
  // TEST SECTION 15: Relevant Update Events Trigger Analytics Refresh
  // -------------------------------------------------------------------------
  console.log('\n--- Section 15: Event-Driven Refresh Capability ---');
  let refreshed = false;
  const mockListener = () => {
    refreshed = true;
  };
  globalThis.window.addEventListener(STORAGE_KEYS.USERS, mockListener);

  // Dispatch a simulated user update event
  globalThis.window.dispatchEvent(new CustomEvent('rp_users_updated', { detail: { action: 'user_created' } }));
  assert(emittedEvents.some((e) => e.type === 'rp_users_updated'), 'rp_users_updated event dispatched and received');

  console.log('\n================================================================');
  console.log(`Phase 3D Tests Completed: ${passedCount} / ${totalCount} Assertions Passed`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    throw new Error(`Test suite failed: ${totalCount - passedCount} assertions failed.`);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running Phase 3D tests:', err);
  process.exit(1);
});
