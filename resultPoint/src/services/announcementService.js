import { STORAGE_KEYS } from './storageKeys.js';
import { academicCatalogService } from './academicCatalogService.js';
import { auditHistoryService } from './auditHistoryService.js';

export const ANNOUNCEMENT_STATUSES = ['Draft', 'Published', 'Archived'];
export const ANNOUNCEMENT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const ANNOUNCEMENT_CATEGORIES = [
  'Academic Notification',
  'Examination Schedule',
  'Regulation Update',
  'Platform Notice',
  'Holiday / Closure',
  'General'
];
export const ANNOUNCEMENT_AUDIENCES = ['all', 'students', 'admins', 'university', 'course', 'regulation'];

export const ANNOUNCEMENT_UPDATED_EVENT = 'rp_announcements_updated';

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

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key ${key}:`, err);
  }
}

function dispatchAnnouncementsUpdated(action, announcement) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(ANNOUNCEMENT_UPDATED_EVENT, {
          detail: { action, announcement, timestamp: new Date().toISOString() }
        })
      );
    }
  } catch (err) {
    console.warn('Failed to dispatch announcement update event:', err);
  }
}

/**
 * Seed announcements loaded idempotently when storage is empty
 */
export const SEED_ANNOUNCEMENTS = [
  {
    id: 'anc_seed_01',
    title: 'Osmania University CBCS 2026 Examination Schedule Released',
    content:
      'The Controller of Examinations, Osmania University has published the official timetable for Semester 2 & Semester 4 examinations. Please verify your registered subject codes, credit requirements, and hall ticket credentials in your academic profile.',
    category: 'Examination Schedule',
    priority: 'High',
    status: 'Published',
    targetAudience: 'university',
    targetUniversityId: 'osmania',
    targetUniversityName: 'Osmania University',
    isPinned: true,
    isBanner: true,
    actionLink: '/universities/osmania',
    actionText: 'View University Details',
    publishedAt: '2026-02-10T09:00:00.000Z',
    createdById: 'usr_admin_01',
    createdByName: 'Administrator',
    createdAt: '2026-02-10T08:30:00.000Z',
    updatedAt: '2026-02-10T09:00:00.000Z'
  },
  {
    id: 'anc_seed_02',
    title: 'JNTUH R22 SGPA to Percentage Conversion Rule Clarification',
    content:
      'As per JNTUH Academic Senate circular clause 11.2, the standard percentage formula for R22 and R18 regulations remains (CGPA - 0.5) * 10. The ResultPoint conversion engine is verified 100% compliant with no cross-contamination to other university formulas.',
    category: 'Regulation Update',
    priority: 'Medium',
    status: 'Published',
    targetAudience: 'university',
    targetUniversityId: 'jntuh',
    targetUniversityName: 'JNTU Hyderabad',
    isPinned: false,
    isBanner: false,
    actionLink: '/calculators/marks-convert',
    actionText: 'Launch Percentage Converter',
    publishedAt: '2026-02-12T10:00:00.000Z',
    createdById: 'usr_admin_01',
    createdByName: 'Administrator',
    createdAt: '2026-02-12T09:45:00.000Z',
    updatedAt: '2026-02-12T10:00:00.000Z'
  },
  {
    id: 'anc_seed_03',
    title: 'ResultPoint Platform Upgrade — High-Contrast Dark Mode & Real-Time Calculation Audit',
    content:
      'Welcome to ResultPoint v2.4! We have rolled out enhanced high-contrast dark mode, dynamic audit history tracking, and instant target CGPA forecasting for all students and institutional administrators.',
    category: 'Platform Notice',
    priority: 'Low',
    status: 'Published',
    targetAudience: 'all',
    isPinned: false,
    isBanner: true,
    actionLink: '/calculators',
    actionText: 'Explore Calculators',
    publishedAt: '2026-02-15T12:00:00.000Z',
    createdById: 'usr_admin_01',
    createdByName: 'Administrator',
    createdAt: '2026-02-15T11:30:00.000Z',
    updatedAt: '2026-02-15T12:00:00.000Z'
  },
  {
    id: 'anc_seed_04',
    title: '[Draft] Final Year Comprehensive Capstone Project Submission Guidelines',
    content:
      'Detailed guidelines and evaluation rubrics for final year capstone project documentation, internal viva assessments, code repository submissions, and external examiner reviews.',
    category: 'Academic Notification',
    priority: 'Medium',
    status: 'Draft',
    targetAudience: 'students',
    isPinned: false,
    isBanner: false,
    createdById: 'usr_admin_01',
    createdByName: 'Administrator',
    createdAt: '2026-02-18T14:00:00.000Z',
    updatedAt: '2026-02-18T14:00:00.000Z'
  }
];

export const announcementService = {
  /**
   * Idempotently initialize seed announcements if none exist
   */
  initialize() {
    const raw = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      safeSet(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    }
  },

  /**
   * Validate announcement fields
   */
  validate(data, isUpdate = false) {
    const errors = {};

    // Title validation
    if (!isUpdate || data.title !== undefined) {
      if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
        errors.title = 'Announcement title is required.';
      } else if (data.title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters.';
      } else if (data.title.trim().length > 120) {
        errors.title = 'Title cannot exceed 120 characters.';
      }
    }

    // Content validation
    if (!isUpdate || data.content !== undefined) {
      if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
        errors.content = 'Announcement content is required.';
      } else if (data.content.trim().length < 10) {
        errors.content = 'Content must be at least 10 characters.';
      } else if (data.content.trim().length > 2500) {
        errors.content = 'Content cannot exceed 2500 characters.';
      }
    }

    // Status validation
    if (data.status !== undefined) {
      if (!ANNOUNCEMENT_STATUSES.includes(data.status)) {
        errors.status = `Status must be one of: ${ANNOUNCEMENT_STATUSES.join(', ')}.`;
      }
    }

    // Priority validation
    if (data.priority !== undefined) {
      if (!ANNOUNCEMENT_PRIORITIES.includes(data.priority)) {
        errors.priority = `Priority must be one of: ${ANNOUNCEMENT_PRIORITIES.join(', ')}.`;
      }
    }

    // Category validation
    if (data.category !== undefined) {
      if (!ANNOUNCEMENT_CATEGORIES.includes(data.category)) {
        errors.category = `Category must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}.`;
      }
    }

    // Target Audience validation
    if (data.targetAudience !== undefined) {
      if (!ANNOUNCEMENT_AUDIENCES.includes(data.targetAudience)) {
        errors.targetAudience = `Target audience must be one of: ${ANNOUNCEMENT_AUDIENCES.join(', ')}.`;
      }

      // University reference check
      if (data.targetAudience === 'university') {
        if (!data.targetUniversityId) {
          errors.targetUniversityId = 'Target university is required for university-scoped announcements.';
        } else {
          try {
            const univ = academicCatalogService.getUniversityById(data.targetUniversityId);
            if (!univ) {
              errors.targetUniversityId = `University with ID "${data.targetUniversityId}" does not exist in the academic catalog.`;
            }
          } catch {
            errors.targetUniversityId = 'Invalid university reference.';
          }
        }
      }

      // Course reference check
      if (data.targetAudience === 'course') {
        if (!data.targetCourseId) {
          errors.targetCourseId = 'Target course is required for course-scoped announcements.';
        } else {
          try {
            const course = academicCatalogService.getCourseById(data.targetCourseId);
            if (!course) {
              errors.targetCourseId = `Course with ID "${data.targetCourseId}" does not exist in the academic catalog.`;
            }
          } catch {
            errors.targetCourseId = 'Invalid course reference.';
          }
        }
      }

      // Regulation reference check
      if (data.targetAudience === 'regulation') {
        if (!data.targetRegulationId) {
          errors.targetRegulationId = 'Target regulation is required for regulation-scoped announcements.';
        } else {
          try {
            const reg = academicCatalogService.getRegulationById(data.targetRegulationId);
            if (!reg) {
              errors.targetRegulationId = `Regulation with ID "${data.targetRegulationId}" does not exist in the academic catalog.`;
            }
          } catch {
            errors.targetRegulationId = 'Invalid regulation reference.';
          }
        }
      }
    }

    // Date range validation
    if (data.expiresAt) {
      const expDate = new Date(data.expiresAt).getTime();
      if (isNaN(expDate)) {
        errors.expiresAt = 'Invalid expiration date format.';
      } else {
        const baseDate = data.publishedAt || data.scheduledPublishAt || new Date().toISOString();
        const pubDate = new Date(baseDate).getTime();
        if (!isNaN(pubDate) && expDate <= pubDate) {
          errors.expiresAt = 'Expiration date must be later than the publication date.';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Retrieve all announcements with search, filtering, and sorting
   */
  getAllAnnouncements(options = {}) {
    this.initialize();
    let list = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);

    // 1. Search (Title or Content)
    if (options.search && typeof options.search === 'string') {
      const q = options.search.trim().toLowerCase();
      list = list.filter((a) => {
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const contentMatch = (a.content || '').toLowerCase().includes(q);
        const catMatch = (a.category || '').toLowerCase().includes(q);
        const univMatch = (a.targetUniversityName || '').toLowerCase().includes(q);
        return titleMatch || contentMatch || catMatch || univMatch;
      });
    }

    // 2. Status filter
    if (options.status && options.status !== 'all') {
      const target = options.status.toLowerCase();
      list = list.filter((a) => (a.status || 'draft').toLowerCase() === target);
    }

    // 3. Category filter
    if (options.category && options.category !== 'all') {
      const targetCat = options.category.toLowerCase();
      list = list.filter((a) => (a.category || '').toLowerCase() === targetCat);
    }

    // 4. Priority filter
    if (options.priority && options.priority !== 'all') {
      const targetPri = options.priority.toLowerCase();
      list = list.filter((a) => (a.priority || 'medium').toLowerCase() === targetPri);
    }

    // 5. Target Audience filter
    if (options.targetAudience && options.targetAudience !== 'all') {
      const targetAud = options.targetAudience.toLowerCase();
      list = list.filter((a) => (a.targetAudience || 'all').toLowerCase() === targetAud);
    }

    // 6. University filter
    if (options.targetUniversityId && options.targetUniversityId !== 'all') {
      list = list.filter((a) => a.targetUniversityId === options.targetUniversityId);
    }

    // 7. Pinned / Banner filters
    if (options.isPinned !== undefined) {
      list = list.filter((a) => Boolean(a.isPinned) === Boolean(options.isPinned));
    }
    if (options.isBanner !== undefined) {
      list = list.filter((a) => Boolean(a.isBanner) === Boolean(options.isBanner));
    }

    // 8. Sorting
    const sortBy = options.sortBy || 'newest';
    list.sort((a, b) => {
      // Pinned notices can be pinned on top if requested
      if (options.keepPinnedOnTop) {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'priority') {
        const rank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority] || 2) - (rank[a.priority] || 2);
      }
      if (sortBy === 'status') {
        const sRank = { Published: 3, Draft: 2, Archived: 1 };
        return (sRank[b.status] || 0) - (sRank[a.status] || 0);
      }
      if (sortBy === 'published') {
        return new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime();
      }
      // Default: newest createdAt
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // 9. Pagination
    if (options.page && options.limit) {
      const page = Math.max(1, parseInt(options.page, 10));
      const limit = Math.max(1, parseInt(options.limit, 10));
      const startIndex = (page - 1) * limit;
      return {
        data: list.slice(startIndex, startIndex + limit),
        total: list.length,
        page,
        limit,
        totalPages: Math.ceil(list.length / limit)
      };
    }

    return list;
  },

  /**
   * Retrieve single announcement by unique ID
   */
  getAnnouncementById(id) {
    if (!id) return null;
    this.initialize();
    const list = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Create a new announcement with validation and audit logging
   */
  createAnnouncement(data) {
    const validation = this.validate(data, false);
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      throw new Error(firstErr || 'Announcement validation failed.');
    }

    this.initialize();
    const existing = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const now = new Date().toISOString();

    // Resolve human-readable catalog names
    let targetUniversityName = null;
    if (data.targetUniversityId) {
      const u = academicCatalogService.getUniversityById(data.targetUniversityId);
      if (u) targetUniversityName = u.name || u.shortName;
    }

    let targetCourseName = null;
    if (data.targetCourseId) {
      const c = academicCatalogService.getCourseById(data.targetCourseId);
      if (c) targetCourseName = c.name || c.shortName;
    }

    let targetRegulationName = null;
    if (data.targetRegulationId) {
      const r = academicCatalogService.getRegulationById(data.targetRegulationId);
      if (r) targetRegulationName = r.name || r.code;
    }

    const isPublished = (data.status || 'Draft') === 'Published';

    const newAnnouncement = {
      id: `anc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      status: data.status || 'Draft',
      targetAudience: data.targetAudience || 'all',
      targetUniversityId: data.targetUniversityId || null,
      targetUniversityName,
      targetCourseId: data.targetCourseId || null,
      targetCourseName,
      targetRegulationId: data.targetRegulationId || null,
      targetRegulationName,
      isPinned: Boolean(data.isPinned),
      isBanner: Boolean(data.isBanner),
      actionLink: data.actionLink ? data.actionLink.trim() : null,
      actionText: data.actionText ? data.actionText.trim() : null,
      scheduledPublishAt: data.scheduledPublishAt || null,
      expiresAt: data.expiresAt || null,
      publishedAt: isPublished ? (data.publishedAt || now) : null,
      archivedAt: null,
      createdById: data.createdById || 'usr_admin_01',
      createdByName: data.createdByName || 'Administrator',
      createdAt: now,
      updatedAt: now
    };

    existing.unshift(newAnnouncement);
    safeSet(STORAGE_KEYS.ANNOUNCEMENTS, existing);

    // Audit History Recording
    try {
      auditHistoryService.recordEvent({
        action: isPublished ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_CREATED',
        entityType: 'announcement',
        entityId: newAnnouncement.id,
        entityName: newAnnouncement.title,
        details: `Announcement "${newAnnouncement.title}" [${newAnnouncement.category}] created with status ${newAnnouncement.status} for audience "${newAnnouncement.targetAudience}".`,
        actor: 'Admin'
      });
    } catch (err) {
      console.warn('Failed to record announcement audit event:', err);
    }

    dispatchAnnouncementsUpdated(isPublished ? 'PUBLISH' : 'CREATE', newAnnouncement);
    return newAnnouncement;
  },

  /**
   * Update permitted fields of an existing announcement
   */
  updateAnnouncement(id, updates = {}) {
    if (!id) throw new Error('Announcement ID is required for update.');
    this.initialize();
    const existing = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const index = existing.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Announcement with ID "${id}" was not found.`);
    }

    const current = existing[index];
    const validation = this.validate(updates, true);
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      throw new Error(firstErr || 'Update validation failed.');
    }

    const now = new Date().toISOString();

    // Re-resolve catalog names if target IDs changed
    let targetUniversityName = current.targetUniversityName;
    if (updates.targetUniversityId !== undefined) {
      if (updates.targetUniversityId) {
        const u = academicCatalogService.getUniversityById(updates.targetUniversityId);
        targetUniversityName = u ? (u.name || u.shortName) : null;
      } else {
        targetUniversityName = null;
      }
    }

    let targetCourseName = current.targetCourseName;
    if (updates.targetCourseId !== undefined) {
      if (updates.targetCourseId) {
        const c = academicCatalogService.getCourseById(updates.targetCourseId);
        targetCourseName = c ? (c.name || c.shortName) : null;
      } else {
        targetCourseName = null;
      }
    }

    let targetRegulationName = current.targetRegulationName;
    if (updates.targetRegulationId !== undefined) {
      if (updates.targetRegulationId) {
        const r = academicCatalogService.getRegulationById(updates.targetRegulationId);
        targetRegulationName = r ? (r.name || r.code) : null;
      } else {
        targetRegulationName = null;
      }
    }

    const nextStatus = updates.status || current.status;
    let publishedAt = current.publishedAt;
    let archivedAt = current.archivedAt;

    if (nextStatus === 'Published' && current.status !== 'Published') {
      publishedAt = now;
      archivedAt = null;
    } else if (nextStatus === 'Archived' && current.status !== 'Archived') {
      archivedAt = now;
    }

    const updated = {
      ...current,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.content !== undefined && { content: updates.content.trim() }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.targetAudience !== undefined && { targetAudience: updates.targetAudience }),
      ...(updates.targetUniversityId !== undefined && { targetUniversityId: updates.targetUniversityId || null, targetUniversityName }),
      ...(updates.targetCourseId !== undefined && { targetCourseId: updates.targetCourseId || null, targetCourseName }),
      ...(updates.targetRegulationId !== undefined && { targetRegulationId: updates.targetRegulationId || null, targetRegulationName }),
      ...(updates.isPinned !== undefined && { isPinned: Boolean(updates.isPinned) }),
      ...(updates.isBanner !== undefined && { isBanner: Boolean(updates.isBanner) }),
      ...(updates.actionLink !== undefined && { actionLink: updates.actionLink ? updates.actionLink.trim() : null }),
      ...(updates.actionText !== undefined && { actionText: updates.actionText ? updates.actionText.trim() : null }),
      ...(updates.scheduledPublishAt !== undefined && { scheduledPublishAt: updates.scheduledPublishAt || null }),
      ...(updates.expiresAt !== undefined && { expiresAt: updates.expiresAt || null }),
      publishedAt,
      archivedAt,
      updatedAt: now
    };

    existing[index] = updated;
    safeSet(STORAGE_KEYS.ANNOUNCEMENTS, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'ANNOUNCEMENT_UPDATED',
        entityType: 'announcement',
        entityId: updated.id,
        entityName: updated.title,
        details: `Updated announcement metadata for "${updated.title}".`,
        actor: 'Admin'
      });
    } catch {}

    dispatchAnnouncementsUpdated('UPDATE', updated);
    return updated;
  },

  /**
   * Publish an announcement
   */
  publishAnnouncement(id) {
    if (!id) throw new Error('Announcement ID is required to publish.');
    const announcement = this.getAnnouncementById(id);
    if (!announcement) throw new Error(`Announcement "${id}" not found.`);

    // Check required fields before publishing
    if (!announcement.title || !announcement.content) {
      throw new Error('Cannot publish announcement with missing title or content.');
    }

    return this.updateAnnouncement(id, {
      status: 'Published'
    });
  },

  /**
   * Archive an announcement
   */
  archiveAnnouncement(id) {
    if (!id) throw new Error('Announcement ID is required to archive.');
    return this.updateAnnouncement(id, {
      status: 'Archived'
    });
  },

  /**
   * Reactivate an archived announcement back to Published
   */
  reactivateAnnouncement(id) {
    if (!id) throw new Error('Announcement ID is required to reactivate.');
    return this.updateAnnouncement(id, {
      status: 'Published'
    });
  },

  /**
   * Permanently delete an announcement
   */
  deleteAnnouncement(id) {
    if (!id) throw new Error('Announcement ID is required for deletion.');
    this.initialize();
    const existing = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const index = existing.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Announcement with ID "${id}" was not found.`);
    }

    const removed = existing.splice(index, 1)[0];
    safeSet(STORAGE_KEYS.ANNOUNCEMENTS, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'ANNOUNCEMENT_DELETED',
        entityType: 'announcement',
        entityId: removed.id,
        entityName: removed.title,
        details: `Permanently deleted announcement "${removed.title}".`,
        actor: 'Admin'
      });
    } catch {}

    dispatchAnnouncementsUpdated('DELETE', removed);
    return {
      success: true,
      deletedAnnouncement: removed
    };
  },

  /**
   * Get announcements applicable to a specific authenticated user (student or admin)
   * Resolves academic catalog scope (university, course, regulation)
   */
  getApplicableAnnouncements(user, options = {}) {
    this.initialize();
    const raw = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const now = Date.now();

    const applicable = raw.filter((a) => {
      // 1. Must be Published
      if (a.status !== 'Published') return false;

      // 2. Expiration check
      if (a.expiresAt) {
        const expTime = new Date(a.expiresAt).getTime();
        if (!isNaN(expTime) && now > expTime) return false;
      }

      // 3. Scheduling check
      if (a.scheduledPublishAt) {
        const schedTime = new Date(a.scheduledPublishAt).getTime();
        if (!isNaN(schedTime) && now < schedTime) return false;
      }

      // 4. Target Audience check
      const aud = (a.targetAudience || 'all').toLowerCase();

      // 'all' matches everyone
      if (aud === 'all') return true;

      // Guest or unauthenticated user can only view 'all'
      if (!user) return false;

      const userRole = (user.role || '').toLowerCase();

      // 'admins' audience
      if (aud === 'admins') {
        return userRole === 'admin';
      }

      // 'students' audience
      if (aud === 'students') {
        return userRole === 'student';
      }

      // University-scoped
      if (aud === 'university') {
        if (userRole !== 'student') return false;
        const targetUniv = (a.targetUniversityId || '').toLowerCase();
        const userUniv = (user.universityId || '').toLowerCase();
        return targetUniv === userUniv;
      }

      // Course-scoped
      if (aud === 'course') {
        if (userRole !== 'student') return false;
        const targetCourse = (a.targetCourseId || '').toLowerCase();
        const userCourse = (user.courseId || '').toLowerCase();
        return targetCourse === userCourse;
      }

      // Regulation-scoped
      if (aud === 'regulation') {
        if (userRole !== 'student') return false;
        const targetReg = (a.targetRegulationId || '').toLowerCase();
        const userReg = (user.regulationId || '').toLowerCase();
        return targetReg === userReg;
      }

      return false;
    });

    // Sort: Pinned first, then newest
    applicable.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });

    if (options.limit && typeof options.limit === 'number') {
      return applicable.slice(0, options.limit);
    }

    return applicable;
  },

  /**
   * Get public announcements for guest portal and website visitors
   */
  getPublicAnnouncements(options = {}) {
    return this.getApplicableAnnouncements(null, options);
  },

  /**
   * Aggregate high-level announcement metrics for dashboard
   */
  getAnnouncementStats() {
    this.initialize();
    const raw = safeGet(STORAGE_KEYS.ANNOUNCEMENTS, []);
    let published = 0;
    let draft = 0;
    let archived = 0;
    let urgent = 0;
    let pinned = 0;
    let banners = 0;

    raw.forEach((a) => {
      const st = (a.status || 'draft').toLowerCase();
      if (st === 'published') published++;
      else if (st === 'draft') draft++;
      else if (st === 'archived') archived++;

      if ((a.priority || '').toLowerCase() === 'urgent') urgent++;
      if (a.isPinned) pinned++;
      if (a.isBanner && st === 'published') banners++;
    });

    return {
      total: raw.length,
      published,
      draft,
      archived,
      urgent,
      pinned,
      banners
    };
  }
};
