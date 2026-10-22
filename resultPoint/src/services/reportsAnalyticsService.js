/**
 * ResultPoint Reports & Analytics Service
 *
 * Centralized service for platform reports, calculator usage analytics,
 * academic distribution, support ticket metrics, and announcement summaries.
 *
 * Adheres strictly to genuine, un-fabricated data:
 * - userService (registered students, administrators, active/inactive, profile completeness)
 * - academicCatalogService (configured universities and courses vs actual enrolled students)
 * - calculationSaveService & activityHistoryService (actual recorded calculator events)
 * - supportQueryService (tickets, status, priority, resolution timestamps)
 * - announcementService (draft, published, archived, audience scopes)
 * - auditHistoryService (platform audit activity logs)
 *
 * Security & Integrity:
 * - RFC 4180 compliant CSV export
 * - Formula injection prevention (prepends single quote to values starting with =, +, -, @)
 * - Complete exclusion of passwords, hashes, and tokens
 * - Pure aggregations (zero mutation of source records)
 * - Safe percentage division (zero denominator -> 0)
 */

import { userService } from './userService.js';
import { academicCatalogService } from './academicCatalogService.js';
import { supportQueryService } from './supportQueryService.js';
import { announcementService } from './announcementService.js';
import { auditHistoryService } from './auditHistoryService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { adminDashboardService } from './adminDashboardService.js';
import { STORAGE_KEYS } from './storageKeys.js';
import { TOOLS_DATA } from '../data/toolsData.js';

export const DATE_RANGES = [
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 3 Months', days: 90 },
  { id: '1y', label: 'Last 1 Year', days: 365 },
  { id: 'all', label: 'All Time', days: null },
  { id: 'custom', label: 'Custom Range', days: null }
];

export const REPORTS_UPDATED_EVENT = 'rp_reports_updated';

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}:`, err);
    return fallback;
  }
}

/**
 * Identify and discard mock student demo seed activities to prevent fabricating historical analytics.
 */
function isSeedActivity(act) {
  if (!act) return true;
  if (typeof act.id === 'string' && /^act_\d{3}$/.test(act.id)) return true;
  if (
    act.entityId &&
    (act.entityId.startsWith('calc_cgpa_1') ||
      act.entityId.startsWith('calc_pct_1') ||
      act.entityId.startsWith('calc_target_1'))
  ) {
    return true;
  }
  return false;
}

/**
 * Escapes a cell for RFC 4180 CSV export and prevents spreadsheet formula injection.
 */
export function escapeCSVCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // Security: Formula injection prevention
  // If string starts with =, +, -, @, prefix with a single quote
  if (/^[=\+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 double-quote escaping
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  } else {
    str = `"${str}"`;
  }
  return str;
}

/**
 * Trigger client-side file download for CSV content
 */
export function downloadCSV(filename, csvContent) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const reportsAnalyticsService = {
  /**
   * Filter an array of records by date range using a specified timestamp field.
   * Excludes records with missing or invalid timestamps when range is not 'all'.
   */
  filterByDateRange(records, timestampField = 'timestamp', range = '30d', customStart = null, customEnd = null) {
    if (!Array.isArray(records)) return { filtered: [], missingTimestampsCount: 0 };
    if (range === 'all') {
      return { filtered: [...records], missingTimestampsCount: 0 };
    }

    const now = Date.now();
    let startTime = null;
    let endTime = now;

    if (range === 'custom') {
      if (customStart) {
        const s = new Date(customStart);
        s.setHours(0, 0, 0, 0);
        startTime = s.getTime();
      }
      if (customEnd) {
        const e = new Date(customEnd);
        e.setHours(23, 59, 59, 999);
        endTime = e.getTime();
      }
    } else {
      const match = DATE_RANGES.find((r) => r.id === range);
      const days = match?.days || 30;
      startTime = now - days * 24 * 60 * 60 * 1000;
    }

    let missingTimestampsCount = 0;
    const filtered = records.filter((rec) => {
      if (!rec) return false;
      const rawDate = rec[timestampField] || rec.createdAt || rec.date || rec.savedAt;
      if (!rawDate) {
        missingTimestampsCount++;
        return false;
      }
      const t = new Date(rawDate).getTime();
      if (isNaN(t)) {
        missingTimestampsCount++;
        return false;
      }
      if (startTime !== null && t < startTime) return false;
      if (endTime !== null && t > endTime) return false;
      return true;
    });

    return { filtered, missingTimestampsCount };
  },

  /**
   * 1. Overview Platform Metrics
   */
  getOverviewMetrics(options = {}) {
    const range = options.range || '30d';
    const customStart = options.customStart || null;
    const customEnd = options.customEnd || null;

    // Users
    const allUsers = userService.getAllUsers();
    const students = allUsers.filter((u) => u.role === 'student');
    const admins = allUsers.filter((u) => u.role === 'admin');
    const activeUsers = allUsers.filter((u) => (u.status || 'Active').toLowerCase() === 'active');
    const inactiveUsers = allUsers.filter((u) => (u.status || '').toLowerCase() === 'inactive');
    const suspendedUsers = allUsers.filter((u) => (u.status || '').toLowerCase() === 'suspended');

    const userDateResult = this.filterByDateRange(allUsers, 'joinedDate', range, customStart, customEnd);
    const usersInPeriod = userDateResult.filtered.length;

    // Calculations
    const savedCalculations = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
    let allActivities = [];
    try {
      allActivities = activityHistoryService.getAllActivities();
    } catch {
      allActivities = [];
    }
    const calculationActivities = allActivities.filter(
      (a) => a.type === 'calculation' && !isSeedActivity(a)
    );

    // Combine distinct calculation records without duplicates
    const seenCalcIds = new Set();
    const distinctCalculations = [];
    savedCalculations.forEach((c) => {
      const id = c.id || `${c.userId}_${c.tool}_${c.timestamp}`;
      if (!seenCalcIds.has(id)) {
        seenCalcIds.add(id);
        distinctCalculations.push({
          id,
          tool: c.tool,
          userId: c.userId,
          score: c.score,
          timestamp: c.timestamp || c.date,
          type: 'saved'
        });
      }
    });
    calculationActivities.forEach((a) => {
      const id = a.entityId || a.id;
      if (!seenCalcIds.has(id)) {
        seenCalcIds.add(id);
        distinctCalculations.push({
          id,
          tool: a.metadata?.tool || a.title?.replace('Used ', '') || 'Academic Calculator',
          userId: a.userId,
          score: a.resultMetric?.value || a.metadata?.output || '',
          timestamp: a.timestamp,
          type: 'activity'
        });
      }
    });

    const calcDateResult = this.filterByDateRange(distinctCalculations, 'timestamp', range, customStart, customEnd);
    const calculationsInPeriod = calcDateResult.filtered.length;

    // Academic Catalog
    const universities = academicCatalogService.getUniversities();
    const catalog = academicCatalogService.getCatalog();
    const totalCatalogCourses = (catalog?.universities || []).reduce(
      (sum, u) => sum + (Array.isArray(u.courses) ? u.courses.length : 0),
      0
    );

    // Support Queries
    const queries = supportQueryService.getAllQueries();
    const queryDateResult = this.filterByDateRange(queries, 'createdAt', range, customStart, customEnd);
    const queriesInPeriod = queryDateResult.filtered;

    const openQueries = queriesInPeriod.filter((q) => (q.status || 'open').toLowerCase() === 'open').length;
    const inProgressQueries = queriesInPeriod.filter((q) => (q.status || '').toLowerCase() === 'in progress').length;
    const resolvedQueries = queriesInPeriod.filter((q) => (q.status || '').toLowerCase() === 'resolved').length;
    const closedQueries = queriesInPeriod.filter((q) => (q.status || '').toLowerCase() === 'closed').length;

    // Announcements
    const announcements = announcementService.getAllAnnouncements();
    const ancDateResult = this.filterByDateRange(announcements, 'createdAt', range, customStart, customEnd);
    const announcementsInPeriod = ancDateResult.filtered;

    const publishedAnc = announcementsInPeriod.filter((a) => (a.status || '').toLowerCase() === 'published').length;
    const draftAnc = announcementsInPeriod.filter((a) => (a.status || '').toLowerCase() === 'draft').length;
    const archivedAnc = announcementsInPeriod.filter((a) => (a.status || '').toLowerCase() === 'archived').length;

    // System Metrics
    let systemStorage = { used: '0 KB', total: '5 MB', percentage: 0 };
    try {
      const sys = adminDashboardService.getSystemMetrics();
      if (sys && sys.totalStorage) systemStorage = sys.totalStorage;
    } catch {}

    // Audit logs
    let auditEventsCount = 0;
    try {
      auditEventsCount = auditHistoryService.getAllAuditEvents().length;
    } catch {}

    return {
      range,
      users: {
        total: allUsers.length,
        students: students.length,
        admins: admins.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        suspended: suspendedUsers.length,
        joinedInPeriod: usersInPeriod,
        missingTimestampsCount: userDateResult.missingTimestampsCount
      },
      calculations: {
        totalRecorded: distinctCalculations.length,
        periodRecorded: calculationsInPeriod,
        missingTimestampsCount: calcDateResult.missingTimestampsCount
      },
      academic: {
        catalogUniversities: universities.length,
        catalogCourses: totalCatalogCourses
      },
      support: {
        total: queriesInPeriod.length,
        allTimeTotal: queries.length,
        open: openQueries,
        inProgress: inProgressQueries,
        resolved: resolvedQueries,
        closed: closedQueries,
        pending: openQueries + inProgressQueries,
        missingTimestampsCount: queryDateResult.missingTimestampsCount
      },
      announcements: {
        total: announcementsInPeriod.length,
        allTimeTotal: announcements.length,
        published: publishedAnc,
        draft: draftAnc,
        archived: archivedAnc,
        missingTimestampsCount: ancDateResult.missingTimestampsCount
      },
      system: {
        storage: systemStorage,
        auditEventsCount
      }
    };
  },

  /**
   * 2. Calculator Usage Analytics
   */
  getCalculatorUsageAnalytics(options = {}) {
    const range = options.range || '30d';
    const customStart = options.customStart || null;
    const customEnd = options.customEnd || null;
    const toolFilter = options.tool || 'all';

    const savedCalculations = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
    let allActivities = [];
    try {
      allActivities = activityHistoryService.getAllActivities();
    } catch {
      allActivities = [];
    }
    const calculationActivities = allActivities.filter(
      (a) => a.type === 'calculation' && !isSeedActivity(a)
    );

    // Aggregate distinct calculation events
    const seenCalcIds = new Set();
    const rawEvents = [];

    savedCalculations.forEach((c) => {
      const id = c.id || `${c.userId}_${c.tool}_${c.timestamp}`;
      if (!seenCalcIds.has(id)) {
        seenCalcIds.add(id);
        rawEvents.push({
          id,
          tool: c.tool || 'Academic Calculator',
          userId: c.userId,
          score: c.score,
          timestamp: c.timestamp || c.date,
          path: c.path || '/calculators'
        });
      }
    });

    calculationActivities.forEach((a) => {
      const id = a.entityId || a.id;
      if (!seenCalcIds.has(id)) {
        seenCalcIds.add(id);
        rawEvents.push({
          id,
          tool: a.metadata?.tool || a.title?.replace('Used ', '') || 'Academic Calculator',
          userId: a.userId,
          score: a.resultMetric?.value || a.metadata?.output || '',
          timestamp: a.timestamp,
          path: a.metadata?.path || '/calculators'
        });
      }
    });

    // Date range filter
    const dateResult = this.filterByDateRange(rawEvents, 'timestamp', range, customStart, customEnd);
    let events = dateResult.filtered;

    // Tool filter
    if (toolFilter && toolFilter !== 'all') {
      const q = toolFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
      events = events.filter((e) => {
        const t = (e.tool || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return t.includes(q);
      });
    }

    const totalCalculations = events.length;

    // Breakdown per tool
    const toolCounts = {};
    const toolLastUsed = {};
    const toolScores = {};

    events.forEach((evt) => {
      const toolName = evt.tool || 'Academic Calculator';
      toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;

      if (evt.timestamp) {
        const curTime = new Date(evt.timestamp).getTime();
        const prevTime = toolLastUsed[toolName] ? new Date(toolLastUsed[toolName]).getTime() : 0;
        if (curTime > prevTime) {
          toolLastUsed[toolName] = evt.timestamp;
        }
      }

      // Collect numeric scores if parseable
      if (evt.score) {
        const num = parseFloat(String(evt.score).replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) {
          if (!toolScores[toolName]) toolScores[toolName] = [];
          toolScores[toolName].push(num);
        }
      }
    });

    // Match with catalog tools from TOOLS_DATA
    const toolRows = Object.entries(toolCounts).map(([toolName, count]) => {
      const percentage = totalCalculations > 0 ? Number(((count / totalCalculations) * 100).toFixed(1)) : 0;
      const scores = toolScores[toolName] || [];
      const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;

      // Identify catalog tool id if available
      const matchedTool = TOOLS_DATA.find(
        (t) =>
          t.name.toLowerCase() === toolName.toLowerCase() ||
          toolName.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(toolName.toLowerCase())
      );

      return {
        toolId: matchedTool?.id || toolName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        toolName,
        category: matchedTool?.category || 'Academic Evaluation',
        count,
        percentage,
        averageScore: avgScore,
        lastUsed: toolLastUsed[toolName] || null
      };
    });

    // Sort descending by usage count
    toolRows.sort((a, b) => b.count - a.count);

    const mostUsedTool = toolRows.length > 0 ? toolRows[0] : null;

    // Timeline buckets for charts (7 to 8 buckets depending on range)
    const numBuckets = range === '7d' ? 7 : range === '1y' ? 12 : 8;
    const timeline = [];
    const now = Date.now();
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    if (range === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
    else if (range === '90d') durationMs = 90 * 24 * 60 * 60 * 1000;
    else if (range === '1y') durationMs = 365 * 24 * 60 * 60 * 1000;
    else if (range === 'all') durationMs = 180 * 24 * 60 * 60 * 1000;

    const bucketDuration = durationMs / numBuckets;
    const startPeriod = now - durationMs;

    for (let i = 0; i < numBuckets; i++) {
      const bStart = startPeriod + i * bucketDuration;
      const bEnd = bStart + bucketDuration;
      const bDate = new Date(bEnd);

      const bucketLabel =
        range === '1y'
          ? bDate.toLocaleDateString('en-GB', { month: 'short' })
          : bDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      const bucketCount = events.filter((e) => {
        if (!e.timestamp) return false;
        const t = new Date(e.timestamp).getTime();
        return t >= bStart && t < bEnd;
      }).length;

      timeline.push({
        label: bucketLabel,
        count: bucketCount,
        startTime: bStart,
        endTime: bEnd
      });
    }

    return {
      totalCalculations,
      toolRows,
      mostUsedTool,
      timeline,
      missingTimestampsCount: dateResult.missingTimestampsCount,
      instrumentationGapNotice:
        'Calculations performed anonymously by visitors without saving to their student profile are not recorded, preserving student privacy and avoiding fabricated page-view inflation.'
    };
  },

  /**
   * 3. University and Course Distribution Analytics
   */
  getAcademicDistributionAnalytics(options = {}) {
    const allUsers = userService.getAllUsers();
    const students = allUsers.filter((u) => u.role === 'student');
    const totalStudents = students.length;

    // Academic Catalog
    const catalogUniversities = academicCatalogService.getUniversities();
    const catalog = academicCatalogService.getCatalog();
    const universitiesMap = new Map();
    catalogUniversities.forEach((u) => universitiesMap.set(u.id, u));

    // Distribution by University
    const universityCounts = {};
    const courseCounts = {};
    let completeProfilesCount = 0;
    let missingUniversityCount = 0;
    let missingCourseCount = 0;
    let missingHallTicketCount = 0;
    let missingSemesterCount = 0;

    students.forEach((student) => {
      // Check completeness
      const hasUniv = Boolean(student.universityId || student.university);
      const hasCourse = Boolean(student.courseId || student.course);
      const hasTicket = Boolean(student.hallTicketNumber);
      const hasSem = Boolean(student.currentSemester);

      if (!hasUniv) missingUniversityCount++;
      if (!hasCourse) missingCourseCount++;
      if (!hasTicket) missingHallTicketCount++;
      if (!hasSem) missingSemesterCount++;

      if (hasUniv && hasCourse && hasTicket && hasSem) {
        completeProfilesCount++;
      }

      // University mapping
      const uKey = student.universityId || student.university || 'unassigned';
      universityCounts[uKey] = (universityCounts[uKey] || 0) + 1;

      // Course mapping
      if (student.courseId || student.course) {
        const cKey = `${student.universityId || 'univ'}_${student.courseId || student.course}`;
        courseCounts[cKey] = {
          courseId: student.courseId || 'custom',
          courseName: student.course || student.courseId || 'General Course',
          universityId: student.universityId || 'unassigned',
          universityName:
            student.university ||
            universitiesMap.get(student.universityId)?.name ||
            student.universityId ||
            'Unassigned',
          count: ((courseCounts[cKey]?.count) || 0) + 1
        };
      }
    });

    // Formatted university rows
    const universityRows = Object.entries(universityCounts).map(([uKey, count]) => {
      const resolvedName =
        uKey === 'unassigned'
          ? 'Unassigned / Incomplete Profile'
          : universitiesMap.get(uKey)?.name || uKey;

      const percentage = totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(1)) : 0;
      return {
        universityId: uKey,
        universityName: resolvedName,
        shortName: universitiesMap.get(uKey)?.shortName || (uKey === 'unassigned' ? 'N/A' : uKey.toUpperCase()),
        studentCount: count,
        percentage
      };
    });

    universityRows.sort((a, b) => b.studentCount - a.studentCount);

    // Formatted course rows
    const courseRows = Object.values(courseCounts).map((item) => {
      const percentage = totalStudents > 0 ? Number(((item.count / totalStudents) * 100).toFixed(1)) : 0;
      return {
        ...item,
        percentage
      };
    });

    courseRows.sort((a, b) => b.count - a.count);

    // Catalog stats vs Enrolled stats
    const enrolledUniversitiesCount = universityRows.filter((r) => r.universityId !== 'unassigned').length;
    const enrolledCoursesCount = courseRows.length;
    const totalCatalogCourses = (catalog?.universities || []).reduce(
      (sum, u) => sum + (Array.isArray(u.courses) ? u.courses.length : 0),
      0
    );

    const completenessRate =
      totalStudents > 0 ? Number(((completeProfilesCount / totalStudents) * 100).toFixed(1)) : 0;

    return {
      totalStudents,
      catalogUniversitiesCount: catalogUniversities.length,
      enrolledUniversitiesCount,
      catalogCoursesCount: totalCatalogCourses,
      enrolledCoursesCount,
      universityRows,
      courseRows,
      profileCompleteness: {
        completeCount: completeProfilesCount,
        incompleteCount: Math.max(0, totalStudents - completeProfilesCount),
        completenessRate,
        missingFields: {
          missingUniversity: missingUniversityCount,
          missingCourse: missingCourseCount,
          missingHallTicket: missingHallTicketCount,
          missingSemester: missingSemesterCount
        }
      }
    };
  },

  /**
   * 4. Support Queries Analytics
   */
  getSupportAnalytics(options = {}) {
    const range = options.range || '30d';
    const customStart = options.customStart || null;
    const customEnd = options.customEnd || null;
    const statusFilter = options.status || 'all';
    const categoryFilter = options.category || 'all';

    const allQueries = supportQueryService.getAllQueries();
    const dateResult = this.filterByDateRange(allQueries, 'createdAt', range, customStart, customEnd);
    let queries = dateResult.filtered;

    if (statusFilter && statusFilter !== 'all') {
      queries = queries.filter((q) => (q.status || 'open').toLowerCase() === statusFilter.toLowerCase());
    }
    if (categoryFilter && categoryFilter !== 'all') {
      queries = queries.filter((q) => (q.category || q.subject || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    const totalTickets = queries.length;

    // Status distribution
    const statusCounts = {
      open: queries.filter((q) => (q.status || 'open').toLowerCase() === 'open').length,
      inProgress: queries.filter((q) => (q.status || '').toLowerCase() === 'in progress').length,
      resolved: queries.filter((q) => (q.status || '').toLowerCase() === 'resolved').length,
      closed: queries.filter((q) => (q.status || '').toLowerCase() === 'closed').length
    };

    // Priority distribution
    const priorityCounts = {
      urgent: queries.filter((q) => (q.priority || '').toLowerCase() === 'urgent').length,
      high: queries.filter((q) => (q.priority || '').toLowerCase() === 'high').length,
      medium: queries.filter((q) => (q.priority || 'medium').toLowerCase() === 'medium').length,
      low: queries.filter((q) => (q.priority || '').toLowerCase() === 'low').length
    };

    // Category distribution
    const categoryCounts = {};
    queries.forEach((q) => {
      const cat = q.category || q.subject || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryRows = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      count,
      percentage: totalTickets > 0 ? Number(((count / totalTickets) * 100).toFixed(1)) : 0
    }));
    categoryRows.sort((a, b) => b.count - a.count);

    // Assignment distribution
    let unassignedCount = 0;
    const adminAssignments = {};
    queries.forEach((q) => {
      if (!q.assignedAdminId) {
        unassignedCount++;
      } else {
        const adminName = q.assignedAdminName || q.assignedAdminId;
        adminAssignments[adminName] = (adminAssignments[adminName] || 0) + 1;
      }
    });

    // Resolution Time Computation (only if reliable creation and resolution timestamps exist)
    const resolvedWithDates = queries.filter((q) => {
      const isDone = ['resolved', 'closed'].includes((q.status || '').toLowerCase());
      const hasCreated = Boolean(q.createdAt && !isNaN(new Date(q.createdAt).getTime()));
      const hasResolved = Boolean((q.resolvedAt || q.closedAt || q.updatedAt) && !isNaN(new Date(q.resolvedAt || q.closedAt || q.updatedAt).getTime()));
      return isDone && hasCreated && hasResolved;
    });

    let avgResolutionHours = null;
    if (resolvedWithDates.length > 0) {
      const totalHours = resolvedWithDates.reduce((sum, q) => {
        const cTime = new Date(q.createdAt).getTime();
        const rTime = new Date(q.resolvedAt || q.closedAt || q.updatedAt).getTime();
        const diffHrs = Math.max(0, (rTime - cTime) / (1000 * 60 * 60));
        return sum + diffHrs;
      }, 0);
      avgResolutionHours = Number((totalHours / resolvedWithDates.length).toFixed(1));
    }

    return {
      totalTickets,
      statusCounts,
      priorityCounts,
      categoryRows,
      unassignedCount,
      adminAssignments,
      resolutionMetrics: {
        hasResolutionData: resolvedWithDates.length > 0,
        resolvedWithDatesCount: resolvedWithDates.length,
        avgResolutionHours,
        avgResolutionFormatted:
          avgResolutionHours !== null
            ? avgResolutionHours < 24
              ? `${avgResolutionHours} hrs`
              : `${(avgResolutionHours / 24).toFixed(1)} days`
            : 'Insufficient resolution timestamps'
      },
      missingTimestampsCount: dateResult.missingTimestampsCount
    };
  },

  /**
   * 5. Announcements Analytics
   */
  getAnnouncementAnalytics(options = {}) {
    const range = options.range || '30d';
    const customStart = options.customStart || null;
    const customEnd = options.customEnd || null;

    const allAnnouncements = announcementService.getAllAnnouncements();
    const dateResult = this.filterByDateRange(allAnnouncements, 'createdAt', range, customStart, customEnd);
    const announcements = dateResult.filtered;
    const total = announcements.length;

    // Status counts
    const statusCounts = {
      published: announcements.filter((a) => (a.status || '').toLowerCase() === 'published').length,
      draft: announcements.filter((a) => (a.status || '').toLowerCase() === 'draft').length,
      archived: announcements.filter((a) => (a.status || '').toLowerCase() === 'archived').length
    };

    // Audience counts
    const audienceCounts = {
      all: announcements.filter((a) => (a.targetAudience || 'all').toLowerCase() === 'all').length,
      students: announcements.filter((a) => (a.targetAudience || '').toLowerCase() === 'students').length,
      admins: announcements.filter((a) => (a.targetAudience || '').toLowerCase() === 'admins').length,
      university: announcements.filter((a) => (a.targetAudience || '').toLowerCase() === 'university').length,
      course: announcements.filter((a) => (a.targetAudience || '').toLowerCase() === 'course').length,
      regulation: announcements.filter((a) => (a.targetAudience || '').toLowerCase() === 'regulation').length
    };

    // Priority counts
    const priorityCounts = {
      urgent: announcements.filter((a) => (a.priority || '').toLowerCase() === 'urgent').length,
      high: announcements.filter((a) => (a.priority || '').toLowerCase() === 'high').length,
      medium: announcements.filter((a) => (a.priority || 'medium').toLowerCase() === 'medium').length,
      low: announcements.filter((a) => (a.priority || '').toLowerCase() === 'low').length
    };

    // Active banners
    const activeBanners = announcements.filter(
      (a) => a.isBanner && (a.status || '').toLowerCase() === 'published'
    ).length;

    return {
      total,
      allTimeTotal: allAnnouncements.length,
      statusCounts,
      audienceCounts,
      priorityCounts,
      activeBanners,
      missingTimestampsCount: dateResult.missingTimestampsCount,
      noticeAnalyticsDisclaimer:
        'Audience delivery is scoped to target criteria. Read-receipts and impression tracking are not recorded in this client-side architecture.'
    };
  },

  /**
   * 6. Generate RFC 4180 Escaped CSV Data with Formula Injection Prevention
   */
  generateCSV(reportType = 'overview', options = {}) {
    const timestampStr = new Date().toISOString().slice(0, 10);
    const range = options.range || '30d';

    if (reportType === 'calculators') {
      const data = this.getCalculatorUsageAnalytics(options);
      const headers = ['Tool ID', 'Tool Name', 'Category', 'Usage Count', 'Percentage Share', 'Average Score', 'Last Recorded Usage'];
      const rows = data.toolRows.map((r) => [
        escapeCSVCell(r.toolId),
        escapeCSVCell(r.toolName),
        escapeCSVCell(r.category),
        escapeCSVCell(r.count),
        escapeCSVCell(`${r.percentage}%`),
        escapeCSVCell(r.averageScore || 'N/A'),
        escapeCSVCell(r.lastUsed || 'N/A')
      ]);

      const csvLines = [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))];
      return {
        filename: `resultpoint_calculator_usage_${range}_${timestampStr}.csv`,
        content: csvLines.join('\r\n')
      };
    }

    if (reportType === 'academic') {
      const data = this.getAcademicDistributionAnalytics(options);
      const headers = ['University ID', 'University Name', 'Short Code', 'Enrolled Students', 'Enrollment Share'];
      const rows = data.universityRows.map((r) => [
        escapeCSVCell(r.universityId),
        escapeCSVCell(r.universityName),
        escapeCSVCell(r.shortName),
        escapeCSVCell(r.studentCount),
        escapeCSVCell(`${r.percentage}%`)
      ]);

      const csvLines = [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))];
      return {
        filename: `resultpoint_academic_distribution_${timestampStr}.csv`,
        content: csvLines.join('\r\n')
      };
    }

    if (reportType === 'support') {
      const allQueries = supportQueryService.getAllQueries();
      const dateResult = this.filterByDateRange(allQueries, 'createdAt', range, options.customStart, options.customEnd);
      const headers = ['Ticket ID', 'Requester Name', 'Email', 'Subject', 'Category', 'Priority', 'Status', 'Created At', 'Resolved At'];
      const rows = dateResult.filtered.map((q) => [
        escapeCSVCell(q.ticketId || q.id),
        escapeCSVCell(q.fullName || 'Anonymous'),
        escapeCSVCell(q.email || ''),
        escapeCSVCell(q.subject || ''),
        escapeCSVCell(q.category || q.subject || ''),
        escapeCSVCell(q.priority || 'Medium'),
        escapeCSVCell(q.status || 'Open'),
        escapeCSVCell(q.createdAt || 'N/A'),
        escapeCSVCell(q.resolvedAt || q.closedAt || 'N/A')
      ]);

      const csvLines = [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))];
      return {
        filename: `resultpoint_support_queries_${range}_${timestampStr}.csv`,
        content: csvLines.join('\r\n')
      };
    }

    if (reportType === 'announcements') {
      const allAnnouncements = announcementService.getAllAnnouncements();
      const dateResult = this.filterByDateRange(allAnnouncements, 'createdAt', range, options.customStart, options.customEnd);
      const headers = ['Title', 'Category', 'Priority', 'Status', 'Target Audience', 'Published Date', 'Expiration Date'];
      const rows = dateResult.filtered.map((a) => [
        escapeCSVCell(a.title),
        escapeCSVCell(a.category || 'General'),
        escapeCSVCell(a.priority || 'Medium'),
        escapeCSVCell(a.status || 'Draft'),
        escapeCSVCell(a.targetAudience || 'all'),
        escapeCSVCell(a.publishedAt || a.createdAt || 'N/A'),
        escapeCSVCell(a.expiresAt || 'Never')
      ]);

      const csvLines = [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))];
      return {
        filename: `resultpoint_announcements_${range}_${timestampStr}.csv`,
        content: csvLines.join('\r\n')
      };
    }

    // Default: Platform Overview Summary
    const overview = this.getOverviewMetrics(options);
    const headers = ['Category', 'Metric', 'Value', 'Reporting Range'];
    const rows = [
      ['Users', 'Total Registered Accounts', overview.users.total, range],
      ['Users', 'Registered Students', overview.users.students, range],
      ['Users', 'System Administrators', overview.users.admins, range],
      ['Users', 'Active Accounts', overview.users.active, range],
      ['Users', 'Joined In Selected Period', overview.users.joinedInPeriod, range],
      ['Calculators', 'Total Recorded Calculations', overview.calculations.totalRecorded, range],
      ['Calculators', 'Calculations In Selected Period', overview.calculations.periodRecorded, range],
      ['Academic', 'Configured Universities in Catalog', overview.academic.catalogUniversities, 'All Time'],
      ['Academic', 'Configured Courses in Catalog', overview.academic.catalogCourses, 'All Time'],
      ['Support', 'Total Tickets in Period', overview.support.total, range],
      ['Support', 'Open Tickets', overview.support.open, range],
      ['Support', 'Resolved Tickets', overview.support.resolved, range],
      ['Announcements', 'Published Notices', overview.announcements.published, range],
      ['Announcements', 'Draft Notices', overview.announcements.draft, range],
      ['System', 'Local Storage Quota Used', overview.system.storage?.used || '0 KB', 'Current']
    ].map((r) => r.map(escapeCSVCell));

    const csvLines = [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))];
    return {
      filename: `resultpoint_platform_overview_${range}_${timestampStr}.csv`,
      content: csvLines.join('\r\n')
    };
  },

  /**
   * 7. Export helper that triggers download
   */
  exportReportToCSV(reportType = 'overview', options = {}) {
    const { filename, content } = this.generateCSV(reportType, options);
    downloadCSV(filename, content);
    return { filename, success: true };
  }
};
