/**
 * ResultPoint Admin Dashboard Service
 * Centralized authority for admin overview metrics, live usage analytics,
 * popular tools, user activity, and system health status.
 *
 * Dynamically aggregates real records from:
 * - authService (registered users, roles)
 * - academicCatalogService (universities, courses, regulations)
 * - contactService (support queries)
 * - calculationSaveService & activityHistoryService (calculations, student events)
 * - auditHistoryService (semester results and catalog mutations)
 * - toolsData (calculator catalog)
 */

import { authService } from './authService.js';
import { academicCatalogService } from './academicCatalogService.js';
import { contactService } from './contactService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { auditHistoryService } from './auditHistoryService.js';
import { STORAGE_KEYS } from './storageKeys.js';
import { TOOLS_DATA } from '../data/toolsData.js';

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse ${key}:`, err);
    return fallback;
  }
}

/**
 * Format relative time for activity log display
 */
function formatRelativeTime(isoString) {
  if (!isoString) return 'Recent';
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return 'Recent';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(timestamp));
  } catch {
    return 'Recent';
  }
}

export const adminDashboardService = {
  /**
   * Aggregate primary platform metrics from real local data
   */
  getStats() {
    // 1. Users & Students
    const allUsers = authService.getAllUsers();
    const students = allUsers.filter((u) => u.role === 'student');
    const activeUsers = allUsers.filter((u) => u.status !== 'Inactive');

    // 2. Universities & Courses from Academic Catalog
    const universities = academicCatalogService.getUniversities();
    const catalog = academicCatalogService.getCatalog();
    const totalCourses = (catalog?.universities || []).reduce(
      (sum, u) => sum + (Array.isArray(u.courses) ? u.courses.length : 0),
      0
    );

    // 3. Saved Calculations & Calculation Events
    const savedCalculations = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
    let allActivities = [];
    try {
      allActivities = activityHistoryService.getAllActivities();
    } catch {
      allActivities = [];
    }
    const calculationActivities = allActivities.filter((a) => a.type === 'calculation');
    const totalCalculations = Math.max(savedCalculations.length, calculationActivities.length);

    // 4. Support Queries
    const queries = contactService.getAllQueries();
    const openQueries = queries.filter((q) => (q.status || 'open').toLowerCase() === 'open');
    const resolvedQueries = queries.filter((q) => (q.status || '').toLowerCase() === 'resolved');

    return {
      totalStudents: {
        value: students.length.toLocaleString(),
        growth: students.length > 0 ? `${students.length} Total` : '0 Registered',
        subtitle: students.length === 1 ? '1 registered student account' : `${students.length} registered student accounts`,
        trend: 'up'
      },
      universities: {
        value: String(universities.length),
        growth: universities.length > 0 ? 'Verified' : 'Empty',
        subtitle:
          universities.length > 0
            ? `${universities.map((u) => u.shortName || u.name).slice(0, 3).join(', ')} configured`
            : 'No universities in catalog',
        trend: 'up'
      },
      courses: {
        value: String(totalCourses),
        growth: 'Catalog',
        subtitle: `Across ${universities.length} configured universitie${universities.length === 1 ? '' : 's'}`,
        trend: 'up'
      },
      calculations: {
        value: totalCalculations.toLocaleString(),
        growth: totalCalculations > 0 ? 'Recorded' : 'No records yet',
        subtitle: `${savedCalculations.length} saved • ${calculationActivities.length} calculation logs`,
        trend: 'up'
      },
      activeUsers: {
        value: activeUsers.length.toLocaleString(),
        growth: activeUsers.length > 0 ? 'Active' : '0 Active',
        subtitle: `${activeUsers.length} of ${allUsers.length} registered accounts`,
        trend: 'up'
      },
      supportQueries: {
        value: String(queries.length),
        growth: openQueries.length > 0 ? `${openQueries.length} pending` : 'All clear',
        subtitle: queries.length > 0 ? `Open: ${openQueries.length} • Resolved: ${resolvedQueries.length}` : 'No queries logged yet',
        trend: openQueries.length > 0 ? 'down' : 'up'
      }
    };
  },

  /**
   * Compute tool usage from real saved calculations and user activities
   */
  getPopularTools() {
    const savedCalculations = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
    let activities = [];
    try {
      activities = activityHistoryService.getAllActivities();
    } catch {
      activities = [];
    }

    const toolUsageMap = {};

    // Count saved calculations per tool
    savedCalculations.forEach((calc) => {
      const toolName = calc.tool || '';
      const toolKey = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      toolUsageMap[toolKey] = (toolUsageMap[toolKey] || 0) + 1;
    });

    // Count calculation activity records per tool
    activities.forEach((act) => {
      if (act.type === 'calculation') {
        const title = act.title || '';
        const key = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        toolUsageMap[key] = (toolUsageMap[key] || 0) + 1;
      }
    });

    // Score tools in TOOLS_DATA
    const scoredTools = TOOLS_DATA.map((tool) => {
      const directKey = tool.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const idKey = tool.id.toLowerCase();
      
      let localUsage = toolUsageMap[directKey] || toolUsageMap[idKey] || 0;
      // Search keywords in usage map
      if (localUsage === 0 && Array.isArray(tool.keywords)) {
        tool.keywords.forEach((kw) => {
          Object.keys(toolUsageMap).forEach((mapKey) => {
            if (mapKey.includes(kw.toLowerCase())) {
              localUsage += toolUsageMap[mapKey];
            }
          });
        });
      }

      return {
        id: tool.id,
        name: tool.name,
        path: tool.route,
        numericUsage: localUsage,
        usage: localUsage === 1 ? '1 use' : `${localUsage} uses`,
        growth: localUsage > 0 ? `+${localUsage} local` : 'Ready',
        barColor:
          tool.id === 'cgpa-calculator'
            ? 'from-orange-500 to-amber-400'
            : tool.id === 'sgpa-calculator'
            ? 'from-sky-500 to-cyan-400'
            : tool.id === 'cgpa-converter'
            ? 'from-emerald-500 to-teal-400'
            : tool.id === 'target-cgpa'
            ? 'from-pink-500 to-rose-400'
            : 'from-purple-500 to-indigo-400'
      };
    });

    // Sort: tools with real local usage first, then catalog popularity
    scoredTools.sort((a, b) => b.numericUsage - a.numericUsage);

    const maxUsage = Math.max(...scoredTools.map((t) => t.numericUsage), 1);
    return scoredTools.slice(0, 5).map((tool, idx) => ({
      ...tool,
      rank: idx + 1,
      barPercent: tool.numericUsage > 0 ? Math.max(15, Math.round((tool.numericUsage / maxUsage) * 100)) : 0
    }));
  },

  /**
   * Retrieve real registered accounts, safely sanitized
   */
  getRecentUsers() {
    const allUsers = authService.getAllUsers();
    const avatarBgs = [
      'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
      'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
    ];

    // Sanitize: never expose passwords or secret tokens
    return allUsers.slice(0, 5).map((user, idx) => ({
      id: user.id || `usr_${idx}`,
      name: user.fullName || user.name || (user.role === 'admin' ? 'Administrator' : 'Student User'),
      email: user.email,
      university:
        user.university ||
        (user.universityId === 'osmania'
          ? 'Osmania University'
          : user.universityId === 'jntuh'
          ? 'JNTU Hyderabad'
          : user.universityId || (user.role === 'admin' ? 'ResultPoint HQ' : 'General')),
      joinDate: user.joinedDate
        ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(user.joinedDate))
        : 'Registered',
      status: user.status || 'Active',
      avatarBg: avatarBgs[idx % avatarBgs.length]
    }));
  },

  /**
   * Aggregate recent activities from activityHistoryService and auditHistoryService
   */
  getRecentActivities() {
    let activities = [];
    let auditEvents = [];

    try {
      activities = activityHistoryService.getAllActivities();
    } catch {
      activities = [];
    }

    try {
      auditEvents = auditHistoryService.getAllAuditEvents();
    } catch {
      auditEvents = [];
    }

    const list = [];

    activities.forEach((act) => {
      let iconColor = 'bg-blue-500';
      if (act.type === 'calculation') iconColor = 'bg-[#FF6B00]';
      else if (act.type === 'result' || act.action === 'cleared') iconColor = 'bg-emerald-500';
      else if (act.type === 'goal') iconColor = 'bg-purple-500';
      else if (act.type === 'backlog') iconColor = 'bg-amber-500';

      list.push({
        id: act.id,
        type: act.type || 'activity',
        title: act.title || 'Academic Activity',
        detail: act.description || 'Academic record updated',
        timestamp: act.timestamp || new Date().toISOString(),
        time: formatRelativeTime(act.timestamp),
        iconColor
      });
    });

    auditEvents.forEach((evt) => {
      let iconColor = 'bg-emerald-500';
      if (evt.action === 'UPDATED') iconColor = 'bg-purple-500';
      else if (evt.action === 'DELETED') iconColor = 'bg-rose-500';

      list.push({
        id: evt.id,
        type: 'audit',
        title: `${evt.semesterLabel || `Semester ${evt.semesterNumber}`} ${evt.action || 'Event'}`,
        detail: evt.details || `SGPA ${evt.sgpa || 0} • CGPA ${evt.cgpa || 0}`,
        timestamp: evt.timestamp || new Date().toISOString(),
        time: formatRelativeTime(evt.timestamp),
        iconColor
      });
    });

    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return list.slice(0, 6);
  },

  /**
   * Calculate system overview metrics based on actual runtime environment
   */
  getSystemMetrics() {
    let totalBytes = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const val = localStorage.getItem(key);
            if (typeof val === 'string') {
              totalBytes += (val.length + key.length) * 2;
            }
          }
        }
      }
    } catch {
      totalBytes = 1024;
    }

    const kbUsed = (totalBytes / 1024).toFixed(1);
    const totalCapacityBytes = 5 * 1024 * 1024; // 5 MB typical quota
    const storagePercentage = Math.min(100, Math.max(1, Math.round((totalBytes / totalCapacityBytes) * 100)));

    const catalog = academicCatalogService.getCatalog();
    const universities = catalog?.universities || [];
    const universitiesWithCourses = universities.filter((u) => Array.isArray(u.courses) && u.courses.length > 0);
    const univDataPercent = universities.length > 0 ? Math.round((universitiesWithCourses.length / universities.length) * 100) : 100;

    return {
      activeTools: {
        current: TOOLS_DATA.length,
        total: TOOLS_DATA.length,
        percentage: 100,
        label: 'Active Calculators & Tools'
      },
      universitiesData: {
        percentage: univDataPercent,
        label: 'Configured University Data'
      },
      uptime: {
        value: 'Online',
        label: 'Runtime Session Status',
        percentage: 100
      },
      totalStorage: {
        used: `${kbUsed} KB`,
        total: '5 MB',
        percentage: storagePercentage,
        label: 'Storage Quota Used'
      }
    };
  },

  /**
   * Aggregate real timestamped events into time-series buckets for the SVG chart
   */
  getUsageChartData(range = 'Last 30 Days') {
    const savedCalculations = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
    let activities = [];
    try {
      activities = activityHistoryService.getAllActivities();
    } catch {
      activities = [];
    }
    const allUsers = authService.getAllUsers();

    // Map timestamps into Date objects
    const calcTimes = [];
    savedCalculations.forEach((c) => {
      if (c.timestamp || c.date) {
        const t = new Date(c.timestamp || c.date).getTime();
        if (!isNaN(t)) calcTimes.push(t);
      }
    });
    activities.forEach((a) => {
      if (a.type === 'calculation' && a.timestamp) {
        const t = new Date(a.timestamp).getTime();
        if (!isNaN(t)) calcTimes.push(t);
      }
    });

    const userTimes = [];
    allUsers.forEach((u) => {
      if (u.joinedDate) {
        const t = new Date(u.joinedDate).getTime();
        if (!isNaN(t)) userTimes.push(t);
      }
    });

    const now = Date.now();
    let numBuckets = 7;
    let durationMs = 7 * 24 * 60 * 60 * 1000;
    let labelFormat = 'day';

    if (range === 'Last 7 Days') {
      numBuckets = 7;
      durationMs = 7 * 24 * 60 * 60 * 1000;
      labelFormat = 'day';
    } else if (range === 'Last 30 Days') {
      numBuckets = 8;
      durationMs = 30 * 24 * 60 * 60 * 1000;
      labelFormat = 'shortDate';
    } else if (range === 'Last 3 Months') {
      numBuckets = 6;
      durationMs = 90 * 24 * 60 * 60 * 1000;
      labelFormat = 'shortDate';
    } else if (range === 'Last 1 Year') {
      numBuckets = 7;
      durationMs = 365 * 24 * 60 * 60 * 1000;
      labelFormat = 'month';
    }

    const bucketDuration = durationMs / numBuckets;
    const startTime = now - durationMs;

    const labels = [];
    const calculations = [];
    const activeUsers = [];
    const newRegistrations = [];

    for (let i = 0; i < numBuckets; i++) {
      const bStart = startTime + i * bucketDuration;
      const bEnd = bStart + bucketDuration;
      const bDate = new Date(bEnd);

      if (labelFormat === 'day') {
        labels.push(bDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      } else if (labelFormat === 'shortDate') {
        labels.push(bDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      } else {
        labels.push(bDate.toLocaleDateString('en-GB', { month: 'short' }));
      }

      const cCount = calcTimes.filter((t) => t >= bStart && t < bEnd).length;
      const rCount = userTimes.filter((t) => t >= bStart && t < bEnd).length;
      const aCount = activities.filter((act) => {
        if (!act.timestamp) return false;
        const t = new Date(act.timestamp).getTime();
        return t >= bStart && t < bEnd;
      }).length;

      calculations.push(cCount);
      newRegistrations.push(rCount);
      activeUsers.push(Math.max(cCount, aCount, rCount));
    }

    const hasData =
      calculations.some((v) => v > 0) ||
      activeUsers.some((v) => v > 0) ||
      newRegistrations.some((v) => v > 0);

    return {
      labels,
      calculations,
      activeUsers,
      newRegistrations,
      hasData
    };
  }
};

// Backwards compatibility dynamic getters
export const ADMIN_STATS = new Proxy({}, {
  get(_, prop) {
    return adminDashboardService.getStats()[prop];
  }
});

export const POPULAR_TOOLS = new Proxy([], {
  get(_, prop) {
    const list = adminDashboardService.getPopularTools();
    return list[prop];
  }
});

export const RECENT_USERS = new Proxy([], {
  get(_, prop) {
    const list = adminDashboardService.getRecentUsers();
    return list[prop];
  }
});

export const RECENT_ACTIVITIES = new Proxy([], {
  get(_, prop) {
    const list = adminDashboardService.getRecentActivities();
    return list[prop];
  }
});

export const SYSTEM_METRICS = new Proxy({}, {
  get(_, prop) {
    return adminDashboardService.getSystemMetrics()[prop];
  }
});

export const USAGE_CHART_SERIES = new Proxy({}, {
  get(_, prop) {
    return adminDashboardService.getUsageChartData(prop);
  }
});
