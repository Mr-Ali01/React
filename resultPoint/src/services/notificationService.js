/**
 * ResultPoint Notification Service
 * Production-ready notification system with student-scoped localStorage persistence,
 * event-driven notification generation, idempotency duplicate prevention,
 * dynamic relative timestamps, category filtering, and recoverable trash/archive.
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { authService } from './authService.js';

// Categories matching the UI specification
export const NOTIFICATION_CATEGORIES = {
  RESULT: 'RESULT',
  GOAL: 'GOAL',
  BACKLOG: 'BACKLOG',
  ACADEMIC_UPDATE: 'ACADEMIC_UPDATE',
  SYSTEM: 'SYSTEM'
};

// Generates realistic ISO timestamps relative to now
const now = Date.now();
const hours = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();
const days = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
const weeks = (w) => new Date(now - w * 7 * 24 * 60 * 60 * 1000).toISOString();

// Default 8 reference notifications matching the provided screenshot exactly (3 Unread, 5 Read, 0 Deleted)
const SEED_NOTIFICATIONS = [
  {
    id: 'notif_sem4_saved',
    category: NOTIFICATION_CATEGORIES.RESULT,
    categoryLabel: 'Result',
    type: 'RESULT_SAVED',
    title: 'Semester 4 Result Saved',
    message: 'Your Semester 4 result with SGPA 8.72 has been saved successfully.',
    unread: true,
    readAt: null,
    createdAt: hours(2),
    action: {
      label: 'View Result',
      route: '/student/results',
      params: { semester: 4 }
    },
    metadata: { semester: 4, sgpa: 8.72, credits: 24 },
    deletedAt: null,
    iconType: 'result_saved'
  },
  {
    id: 'notif_goal_progress',
    category: NOTIFICATION_CATEGORIES.GOAL,
    categoryLabel: 'Goals',
    type: 'GOAL_PROGRESS',
    title: 'Academic Goal Progress Update',
    message: 'You are now at 92% of your target CGPA of 8.50. Keep up the high score in Sem 5!',
    unread: true,
    readAt: null,
    createdAt: days(1),
    action: {
      label: 'View Goal',
      route: '/student/goals',
      params: {}
    },
    metadata: { currentCGPA: 8.14, targetCGPA: 8.50, progress: 92 },
    deletedAt: null,
    iconType: 'goal_progress'
  },
  {
    id: 'notif_exam_schedule',
    category: NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE,
    categoryLabel: 'Academic Update',
    type: 'ACADEMIC_UPDATE',
    title: 'Osmania University Exam Schedule',
    message: 'Upcoming internal assessment timetable published for MCA CBCS regulation.',
    unread: true,
    readAt: null,
    createdAt: days(3),
    action: {
      label: 'View Details',
      route: '/student/notifications',
      isModal: true
    },
    metadata: { university: 'Osmania University', course: 'MCA', regulation: 'CBCS' },
    deletedAt: null,
    iconType: 'exam_schedule'
  },
  {
    id: 'notif_backlog_alert',
    category: NOTIFICATION_CATEGORIES.BACKLOG,
    categoryLabel: 'Backlogs',
    type: 'BACKLOG_ALERT',
    title: 'Backlog Alert',
    message: 'You have 1 backlog in Semester 3. Please plan your re-attempt.',
    unread: false,
    readAt: days(4),
    createdAt: days(5),
    action: {
      label: 'View Backlog',
      route: '/student/backlogs',
      params: { filter: 'active' }
    },
    metadata: { semester: 3, subject: 'Web Technologies', code: 'BCA303' },
    deletedAt: null,
    iconType: 'backlog_alert'
  },
  {
    id: 'notif_cgpa_calc',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    categoryLabel: 'System',
    type: 'CGPA_RECALCULATED',
    title: 'CGPA Calculation Completed',
    message: 'Your overall CGPA has been recalculated based on the latest results.',
    unread: false,
    readAt: days(6),
    createdAt: weeks(1),
    action: {
      label: 'View Details',
      route: '/student/calculation-history',
      params: {}
    },
    metadata: { cgpa: 8.14, totalCredits: 96 },
    deletedAt: null,
    iconType: 'cgpa_calc'
  },
  {
    id: 'notif_profile_complete',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    categoryLabel: 'System',
    type: 'PROFILE_REMINDER',
    title: 'Complete Your Academic Profile',
    message: 'Add your academic profile details to get better recommendations.',
    unread: false,
    readAt: days(6),
    createdAt: weeks(1),
    action: {
      label: 'Complete Now',
      route: '/student/profile',
      params: {}
    },
    metadata: { profileStatus: 'verified' },
    deletedAt: null,
    iconType: 'profile_complete'
  },
  {
    id: 'notif_sem3_updated',
    category: NOTIFICATION_CATEGORIES.RESULT,
    categoryLabel: 'Result',
    type: 'RESULT_UPDATED',
    title: 'Semester 3 Result Updated',
    message: 'Your Semester 3 result has been updated successfully.',
    unread: false,
    readAt: weeks(1),
    createdAt: weeks(2),
    action: {
      label: 'View Result',
      route: '/student/results',
      params: { semester: 3 }
    },
    metadata: { semester: 3, sgpa: 8.42 },
    deletedAt: null,
    iconType: 'result_updated'
  },
  {
    id: 'notif_backlog_cleared',
    category: NOTIFICATION_CATEGORIES.BACKLOG,
    categoryLabel: 'Backlogs',
    type: 'BACKLOG_CLEARED',
    title: 'Backlog Cleared',
    message: 'Your backlog in Database Management Systems has been cleared.',
    unread: false,
    readAt: weeks(2),
    createdAt: weeks(3),
    action: {
      label: 'View Backlog',
      route: '/student/backlogs',
      params: { filter: 'cleared' }
    },
    metadata: { subject: 'Database Management Systems', code: 'CS202', clearedGrade: 'A', clearedPoints: 8 },
    deletedAt: null,
    iconType: 'backlog_cleared'
  }
];

function getNotificationsStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.NOTIFICATIONS}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (err) {
    console.warn('Error reading auth user for notifications key:', err);
  }
  return STORAGE_KEYS.NOTIFICATIONS;
}

function getPreferencesStorageKey() {
  try {
    const user = authService.getCurrentUser();
    if (user && user.email) {
      return `${STORAGE_KEYS.SETTINGS}_notif_prefs_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  } catch (err) {
    console.warn('Error reading auth user for preferences key:', err);
  }
  return `${STORAGE_KEYS.SETTINGS}_notif_prefs`;
}

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key: ${key}`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key: ${key}`, err);
  }
}

export const notificationService = {
  /**
   * Initializes notifications for the authenticated student.
   * Preserves empty notifications array if student explicitly cleared all.
   */
  initialize() {
    const key = getNotificationsStorageKey();
    const existing = safeGet(key, null);
    if (existing === null) {
      safeSet(key, SEED_NOTIFICATIONS);
    }
  },

  /**
   * Returns all notifications (active + deleted)
   */
  getAllRaw() {
    this.initialize();
    const key = getNotificationsStorageKey();
    const records = safeGet(key, []);
    return Array.isArray(records) ? records : [];
  },

  /**
   * Returns only active notifications (not in trash)
   */
  getNotifications() {
    const raw = this.getAllRaw();
    return raw.filter((n) => !n.deletedAt);
  },

  /**
   * Returns only deleted/archived notifications in trash
   */
  getDeletedNotifications() {
    const raw = this.getAllRaw();
    return raw.filter((n) => Boolean(n.deletedAt));
  },

  /**
   * Calculates dynamic counts for summary cards
   */
  getCounts() {
    const raw = this.getAllRaw();
    const active = raw.filter((n) => !n.deletedAt);
    const deleted = raw.filter((n) => Boolean(n.deletedAt));
    const unread = active.filter((n) => n.unread);
    const read = active.filter((n) => !n.unread);

    return {
      all: active.length,
      unread: unread.length,
      read: read.length,
      deleted: deleted.length
    };
  },

  /**
   * Returns current unread count for badges
   */
  getUnreadCount() {
    return this.getCounts().unread;
  },

  /**
   * Marks all unread active notifications as read
   */
  markAllAsRead() {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();
    const readTimestamp = new Date().toISOString();

    const updated = raw.map((n) => {
      if (!n.deletedAt && n.unread) {
        return {
          ...n,
          unread: false,
          readAt: n.readAt || readTimestamp
        };
      }
      return n;
    });

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Marks a single notification as read
   */
  markAsRead(id) {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();

    const updated = raw.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          unread: false,
          readAt: n.readAt || new Date().toISOString()
        };
      }
      return n;
    });

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Marks a single notification as unread
   */
  markAsUnread(id) {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();

    const updated = raw.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          unread: true,
          readAt: null
        };
      }
      return n;
    });

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Soft deletes / archives a notification into recoverable trash
   */
  deleteNotification(id) {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();

    const updated = raw.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          deletedAt: new Date().toISOString()
        };
      }
      return n;
    });

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Restores a deleted notification back to active status
   */
  restoreNotification(id) {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();

    const updated = raw.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          deletedAt: null
        };
      }
      return n;
    });

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Permanently purges a notification from storage
   */
  permanentlyDelete(id) {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();
    const updated = raw.filter((n) => n.id !== id);

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated.filter((n) => !n.deletedAt);
  },

  /**
   * Clears all deleted notifications permanently
   */
  clearAllDeleted() {
    const key = getNotificationsStorageKey();
    const raw = this.getAllRaw();
    const updated = raw.filter((n) => !n.deletedAt);

    safeSet(key, updated);
    this.broadcastUpdate();
    return updated;
  },

  /**
   * Adds a notification with idempotency duplicate prevention
   */
  addNotification({
    category = NOTIFICATION_CATEGORIES.SYSTEM,
    categoryLabel = 'System',
    type = 'SYSTEM_EVENT',
    title,
    message,
    action = null,
    metadata = {},
    iconType = 'system_calc',
    idempotencyKey = null
  }) {
    if (!title || !message) return null;

    // Check student preferences
    const prefs = this.getPreferences();
    if (category === NOTIFICATION_CATEGORIES.RESULT && prefs.resultNotifications === false) return null;
    if (category === NOTIFICATION_CATEGORIES.GOAL && prefs.goalNotifications === false) return null;
    if (category === NOTIFICATION_CATEGORIES.BACKLOG && prefs.backlogNotifications === false) return null;
    if (category === NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE && prefs.systemNotifications === false) return null;
    if (category === NOTIFICATION_CATEGORIES.SYSTEM && prefs.systemNotifications === false) return null;

    const raw = this.getAllRaw();

    // Idempotency check: prevent duplicate notifications with same key within 24h
    if (idempotencyKey) {
      const recentDuplicate = raw.find((n) => n.idempotencyKey === idempotencyKey);
      if (recentDuplicate) {
        return recentDuplicate;
      }
    }

    const key = getNotificationsStorageKey();
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      idempotencyKey,
      category,
      categoryLabel,
      type,
      title,
      message,
      unread: true,
      readAt: null,
      createdAt: new Date().toISOString(),
      action: action || {
        label: 'View Details',
        route: '/student/notifications',
        isModal: true
      },
      metadata,
      deletedAt: null,
      iconType
    };

    const updated = [newNotif, ...raw];
    safeSet(key, updated);
    this.broadcastUpdate();
    return newNotif;
  },

  /**
   * Event generator: result saved
   */
  notifyResultSaved(semesterNumber, sgpa) {
    return this.addNotification({
      category: NOTIFICATION_CATEGORIES.RESULT,
      categoryLabel: 'Result',
      type: 'RESULT_SAVED',
      title: `Semester ${semesterNumber} Result Saved`,
      message: `Your Semester ${semesterNumber} result with SGPA ${Number(sgpa).toFixed(2)} has been saved successfully.`,
      action: {
        label: 'View Result',
        route: '/student/results',
        params: { semester: semesterNumber }
      },
      metadata: { semester: semesterNumber, sgpa: Number(sgpa) },
      iconType: 'result_saved',
      idempotencyKey: `res_save_sem_${semesterNumber}_${Date.now()}`
    });
  },

  /**
   * Event generator: result updated
   */
  notifyResultUpdated(semesterNumber, sgpa) {
    return this.addNotification({
      category: NOTIFICATION_CATEGORIES.RESULT,
      categoryLabel: 'Result',
      type: 'RESULT_UPDATED',
      title: `Semester ${semesterNumber} Result Updated`,
      message: `Your Semester ${semesterNumber} result has been updated successfully.`,
      action: {
        label: 'View Result',
        route: '/student/results',
        params: { semester: semesterNumber }
      },
      metadata: { semester: semesterNumber, sgpa: Number(sgpa) },
      iconType: 'result_updated',
      idempotencyKey: `res_update_sem_${semesterNumber}_${Date.now()}`
    });
  },

  /**
   * Event generator: goal progress update
   */
  notifyGoalProgress(targetCGPA, progressPercent) {
    return this.addNotification({
      category: NOTIFICATION_CATEGORIES.GOAL,
      categoryLabel: 'Goals',
      type: 'GOAL_PROGRESS',
      title: 'Academic Goal Progress Update',
      message: `You are now at ${progressPercent}% of your target CGPA of ${Number(targetCGPA).toFixed(2)}. Keep up the high score!`,
      action: {
        label: 'View Goal',
        route: '/student/goals',
        params: {}
      },
      metadata: { targetCGPA, progressPercent },
      iconType: 'goal_progress',
      idempotencyKey: `goal_progress_${targetCGPA}_${progressPercent}`
    });
  },

  /**
   * Event generator: backlog cleared
   */
  notifyBacklogCleared(subjectName, clearedGrade) {
    return this.addNotification({
      category: NOTIFICATION_CATEGORIES.BACKLOG,
      categoryLabel: 'Backlogs',
      type: 'BACKLOG_CLEARED',
      title: 'Backlog Cleared',
      message: `Your backlog in ${subjectName} has been cleared${clearedGrade ? ` with grade ${clearedGrade}` : ''}.`,
      action: {
        label: 'View Backlog',
        route: '/student/backlogs',
        params: { filter: 'cleared' }
      },
      metadata: { subjectName, clearedGrade },
      iconType: 'backlog_cleared',
      idempotencyKey: `backlog_cleared_${subjectName}_${Date.now()}`
    });
  },

  /**
   * Event generator: backlog alert
   */
  notifyBacklogAlert(semesterNumber, subjectCount) {
    return this.addNotification({
      category: NOTIFICATION_CATEGORIES.BACKLOG,
      categoryLabel: 'Backlogs',
      type: 'BACKLOG_ALERT',
      title: 'Backlog Alert',
      message: `You have ${subjectCount} backlog in Semester ${semesterNumber}. Please plan your re-attempt.`,
      action: {
        label: 'View Backlog',
        route: '/student/backlogs',
        params: { filter: 'active' }
      },
      metadata: { semester: semesterNumber, subjectCount },
      iconType: 'backlog_alert',
      idempotencyKey: `backlog_alert_sem_${semesterNumber}_${subjectCount}`
    });
  },

  /**
   * Broadcasts storage event to synchronize open tabs, header, and sidebar
   */
  broadcastUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications_data_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  },

  /**
   * Returns student's notification preferences
   */
  getPreferences() {
    const key = getPreferencesStorageKey();
    return safeGet(key, {
      resultNotifications: true,
      goalNotifications: true,
      backlogNotifications: true,
      systemNotifications: true
    });
  },

  /**
   * Updates student's notification preferences
   */
  updatePreferences(newPrefs) {
    const key = getPreferencesStorageKey();
    const current = this.getPreferences();
    const updated = { ...current, ...newPrefs };
    safeSet(key, updated);
    return updated;
  },

  /**
   * Helper formatting relative timestamp string
   */
  formatRelativeTime(isoString) {
    if (!isoString) return 'Recently';
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return 'Recently';

    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

// Initialize default notifications on service load
notificationService.initialize();
