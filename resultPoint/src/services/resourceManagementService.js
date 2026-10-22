/**
 * ResultPoint Resource Management Service
 *
 * Canonical administrative service and data authority for academic resources,
 * syllabi, previous examination papers, study notes, formula sheets, and university guides.
 *
 * Adheres to ResultPoint architecture:
 * - Single canonical storage key: STORAGE_KEYS.RESOURCES ('resultpoint_resources')
 * - Idempotent initialization and schema migration from baseline RESOURCES_DATA
 * - Strict URL validation (HTTP/HTTPS only; blocks javascript:, data:, vbscript:, eval, XSS)
 * - Pure data sanitization and strict rejection of script injections
 * - Event-driven reactivity: emits 'rp_resources_updated'
 * - Audit history logging via auditHistoryService
 * - Clean student-facing scoping: draft/archived resources are strictly hidden from students
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { RESOURCES_DATA, RESOURCE_CATEGORIES } from '../data/resourcesData.js';
import { academicCatalogService } from './academicCatalogService.js';
import { auditHistoryService } from './auditHistoryService.js';

export const RESOURCE_UPDATED_EVENT = 'rp_resources_updated';
export const RESOURCE_STATUSES = ['published', 'draft', 'archived'];
export const RESOURCE_AUDIENCES = ['all', 'students', 'faculty', 'university'];
export const RESOURCE_TYPES = ['pdf', 'article', 'notes', 'link', 'document', 'sheet', 'video'];

// Safe storage accessors
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

function dispatchResourcesUpdated(action, resource) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(RESOURCE_UPDATED_EVENT, {
          detail: { action, resource, timestamp: new Date().toISOString() }
        })
      );
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Failed to dispatch resource update event:', err);
  }
}

/**
 * Validates a resource URL strictly.
 * Allows null/empty for internal article guides.
 * If provided, must use HTTP or HTTPS protocol and contain no executable script tokens.
 */
export function isValidResourceUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const trimmed = url.trim();

  // Security checks against script injection & dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('eval(') ||
    lower.includes('onload=') ||
    lower.includes('onerror=')
  ) {
    return false;
  }

  // Must start with http:// or https://
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a baseline seed resource to the canonical schema
 */
function normalizeResource(raw, index = 0) {
  const now = new Date(Date.now() - index * 86400000).toISOString();
  return {
    id: raw.id || `res_${Date.now()}_${index}`,
    title: String(raw.title || '').trim(),
    description: String(raw.description || '').trim(),
    category: raw.category || 'study-materials',
    categoryLabel: raw.categoryLabel || 'Study Material',
    resourceType: raw.resourceType || 'pdf',
    fileUrl: raw.fileUrl || null,
    detailRoute: raw.detailRoute || null,
    fileType: raw.fileType || 'PDF Document',
    fileSize: raw.fileSize || '1.8 MB',
    targetAudience: raw.targetAudience || 'all',
    universityId: raw.universityId || null,
    universityName: raw.universityName || (raw.universityId ? raw.universityId.toUpperCase() : 'General'),
    courseId: raw.courseId || null,
    regulation: raw.regulation || null,
    semester: raw.semester || null,
    subject: raw.subject || null,
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    status: raw.status || 'published',
    isPinned: Boolean(raw.isPinned),
    isFeatured: Boolean(raw.isFeatured || index < 4),
    downloadCount: typeof raw.downloadCount === 'number' ? raw.downloadCount : 45 + (index * 13),
    viewCount: typeof raw.viewCount === 'number' ? raw.viewCount : 120 + (index * 27),
    publishedAt: raw.publishedAt || now,
    archivedAt: raw.status === 'archived' ? now : null,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    createdBy: raw.createdBy || 'Administrator'
  };
}

export const resourceManagementService = {
  /**
   * Idempotent initialization of the resources registry.
   * Preserves existing stored resources and migrates from RESOURCES_DATA if uninitialized.
   */
  initialize() {
    const existing = safeGet(STORAGE_KEYS.RESOURCES, null);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }

    // Seed baseline resources from RESOURCES_DATA
    const seeded = (RESOURCES_DATA || []).map((r, i) => normalizeResource(r, i));
    safeSet(STORAGE_KEYS.RESOURCES, seeded);
    return seeded;
  },

  /**
   * Retrieve all resources with optional administrative filtering and sorting
   */
  getAllResources(options = {}) {
    const resources = this.initialize();
    const {
      search = '',
      category = 'all',
      universityId = 'all',
      courseId = 'all',
      semester = 'all',
      audience = 'all',
      status = 'all',
      sortBy = 'latest'
    } = options;

    let filtered = [...resources];

    // Status filter
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => (r.status || 'published').toLowerCase() === status.toLowerCase());
    }

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter((r) => r.category === category || r.categoryLabel === category);
    }

    // University filter
    if (universityId && universityId !== 'all') {
      filtered = filtered.filter((r) => {
        if (!r.universityId) return universityId === 'general' || universityId === 'none';
        return r.universityId.toLowerCase() === universityId.toLowerCase();
      });
    }

    // Course filter
    if (courseId && courseId !== 'all') {
      filtered = filtered.filter((r) => {
        if (!r.courseId) return courseId === 'general' || courseId === 'none';
        return r.courseId.toLowerCase() === courseId.toLowerCase();
      });
    }

    // Semester filter
    if (semester && semester !== 'all') {
      filtered = filtered.filter((r) => {
        if (!r.semester) return false;
        return r.semester.toLowerCase() === semester.toLowerCase() || r.semester === 'All Semesters';
      });
    }

    // Target Audience filter
    if (audience && audience !== 'all') {
      filtered = filtered.filter((r) => (r.targetAudience || 'all').toLowerCase() === audience.toLowerCase());
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const inTitle = (r.title || '').toLowerCase().includes(q);
        const inDesc = (r.description || '').toLowerCase().includes(q);
        const inSub = (r.subject || '').toLowerCase().includes(q);
        const inUni = (r.universityName || '').toLowerCase().includes(q);
        const inCat = (r.categoryLabel || r.category || '').toLowerCase().includes(q);
        const inTags = Array.isArray(r.tags) && r.tags.some((t) => t.toLowerCase().includes(q));
        const inId = (r.id || '').toLowerCase().includes(q);
        return inTitle || inDesc || inSub || inUni || inCat || inTags || inId;
      });
    }

    // Sorting
    if (sortBy === 'latest' || sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.updatedAt || b.publishedAt || b.createdAt) - new Date(a.updatedAt || a.publishedAt || a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt || a.publishedAt) - new Date(b.createdAt || b.publishedAt));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'downloads') {
      filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return filtered;
  },

  /**
   * Retrieve single resource by ID
   */
  getResourceById(id) {
    if (!id) return null;
    const resources = this.initialize();
    return resources.find((r) => r.id === id) || null;
  },

  /**
   * Student/Public Facing: Returns only published resources respecting audience and academic applicability
   */
  getPublicResources(options = {}, userContext = null) {
    const resources = this.initialize();
    const {
      search = '',
      category = 'all',
      universityId = 'all',
      courseId = 'all',
      semester = 'all',
      sortBy = 'latest'
    } = options;

    // 1. Strictly published resources only (draft and archived excluded)
    let published = resources.filter((r) => (r.status || 'published').toLowerCase() === 'published');

    // 2. Audience & Academic Applicability Scoping
    if (userContext && typeof userContext === 'object') {
      const { role = 'student', universityId: userUni, courseId: userCourse } = userContext;

      published = published.filter((r) => {
        const aud = (r.targetAudience || 'all').toLowerCase();
        // Faculty-only resources are blocked from students
        if (role === 'student' && aud === 'faculty') return false;

        // University scoping
        if (r.universityId && r.universityId !== 'all') {
          if (userUni && r.universityId.toLowerCase() !== userUni.toLowerCase()) {
            return false;
          }
        }

        // Course scoping
        if (r.courseId && r.courseId !== 'all') {
          if (userCourse && r.courseId.toLowerCase() !== userCourse.toLowerCase()) {
            return false;
          }
        }

        return true;
      });
    } else {
      // Guest/Public: Only 'all' or 'students' audience
      published = published.filter((r) => {
        const aud = (r.targetAudience || 'all').toLowerCase();
        return aud === 'all' || aud === 'students';
      });
    }

    // 3. Category filter
    if (category && category !== 'all') {
      published = published.filter((r) => r.category === category || r.categoryLabel === category);
    }

    // 4. University filter
    if (universityId && universityId !== 'all') {
      published = published.filter((r) => {
        if (!r.universityId) return universityId === 'general';
        return r.universityId.toLowerCase() === universityId.toLowerCase();
      });
    }

    // 5. Course filter
    if (courseId && courseId !== 'all') {
      published = published.filter((r) => {
        if (!r.courseId) return courseId === 'general';
        return r.courseId.toLowerCase() === courseId.toLowerCase();
      });
    }

    // 6. Semester filter
    if (semester && semester !== 'all') {
      published = published.filter((r) => {
        if (!r.semester) return false;
        return r.semester.toLowerCase() === semester.toLowerCase() || r.semester === 'All Semesters';
      });
    }

    // 7. Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      published = published.filter((r) => {
        const inTitle = (r.title || '').toLowerCase().includes(q);
        const inDesc = (r.description || '').toLowerCase().includes(q);
        const inSub = (r.subject || '').toLowerCase().includes(q);
        const inUni = (r.universityName || '').toLowerCase().includes(q);
        const inTags = Array.isArray(r.tags) && r.tags.some((t) => t.toLowerCase().includes(q));
        return inTitle || inDesc || inSub || inUni || inTags;
      });
    }

    // 8. Sorting
    if (sortBy === 'latest') {
      published.sort((a, b) => new Date(b.updatedAt || b.publishedAt || b.createdAt) - new Date(a.updatedAt || a.publishedAt || a.createdAt));
    } else if (sortBy === 'oldest') {
      published.sort((a, b) => new Date(a.createdAt || a.publishedAt) - new Date(b.createdAt || b.publishedAt));
    } else if (sortBy === 'title') {
      published.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'downloads') {
      published.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    }

    return published;
  },

  /**
   * Create a new resource with validation and audit logging
   */
  createResource(data = {}) {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new Error('Resource title is required.');
    }
    const trimmedTitle = data.title.trim();
    if (trimmedTitle.length < 3) {
      throw new Error('Resource title must be at least 3 characters.');
    }
    if (trimmedTitle.length > 150) {
      throw new Error('Resource title cannot exceed 150 characters.');
    }

    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      throw new Error('Resource category is required.');
    }

    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      throw new Error('Resource description is required.');
    }
    if (data.description.trim().length > 1000) {
      throw new Error('Resource description cannot exceed 1000 characters.');
    }

    // URL validation
    if (data.fileUrl && !isValidResourceUrl(data.fileUrl)) {
      throw new Error('Invalid resource URL. Must be a valid HTTP or HTTPS URL and contain no executable script expressions.');
    }

    // Status validation
    const status = data.status ? String(data.status).toLowerCase() : 'published';
    if (!RESOURCE_STATUSES.includes(status)) {
      throw new Error(`Invalid status "${data.status}". Allowed values: ${RESOURCE_STATUSES.join(', ')}.`);
    }

    // Target Audience validation
    const targetAudience = data.targetAudience ? String(data.targetAudience).toLowerCase() : 'all';
    if (!RESOURCE_AUDIENCES.includes(targetAudience)) {
      throw new Error(`Invalid targetAudience "${data.targetAudience}". Allowed: ${RESOURCE_AUDIENCES.join(', ')}.`);
    }

    // University existence check if specified
    let universityName = data.universityName || 'General';
    if (data.universityId && data.universityId !== 'all' && data.universityId !== 'general') {
      const universities = academicCatalogService.getUniversities();
      const uniMatch = universities.find((u) => u.id === data.universityId || u.shortName?.toLowerCase() === data.universityId.toLowerCase());
      if (uniMatch) {
        universityName = uniMatch.name;
      }
    }

    const resources = this.initialize();
    const newId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Resolve category label
    const categoryConfig = RESOURCE_CATEGORIES.find((c) => c.id === data.category);
    const categoryLabel = data.categoryLabel || (categoryConfig ? categoryConfig.name : data.category);

    const now = new Date().toISOString();
    const newResource = {
      id: newId,
      title: trimmedTitle,
      description: data.description.trim(),
      category: data.category.trim(),
      categoryLabel,
      resourceType: data.resourceType || 'pdf',
      fileUrl: data.fileUrl ? data.fileUrl.trim() : null,
      detailRoute: data.detailRoute || null,
      fileType: data.fileType || 'PDF Document',
      fileSize: data.fileSize || '2.0 MB',
      targetAudience,
      universityId: data.universityId || null,
      universityName,
      courseId: data.courseId || null,
      regulation: data.regulation || null,
      semester: data.semester || null,
      subject: data.subject ? data.subject.trim() : null,
      tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      status,
      isPinned: Boolean(data.isPinned),
      isFeatured: Boolean(data.isFeatured),
      downloadCount: 0,
      viewCount: 0,
      publishedAt: status === 'published' ? now : null,
      archivedAt: status === 'archived' ? now : null,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || 'Administrator'
    };

    const updatedResources = [newResource, ...resources];
    safeSet(STORAGE_KEYS.RESOURCES, updatedResources);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'RESOURCE_CREATED',
        entityType: 'resource',
        entityId: newId,
        entityName: newResource.title,
        details: `Created new academic resource "${newResource.title}" under category "${categoryLabel}". Status: ${status}.`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchResourcesUpdated('CREATE', newResource);
    return newResource;
  },

  /**
   * Update an existing resource
   */
  updateResource(id, updateData = {}) {
    if (!id) throw new Error('Resource ID is required.');

    const resources = this.initialize();
    const idx = resources.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Resource with ID "${id}" does not exist.`);
    }

    // Immutable ID check
    if (updateData.id && updateData.id !== id) {
      throw new Error('Resource ID is immutable and cannot be modified.');
    }

    const existing = resources[idx];

    // Allowed fields
    const allowedFields = [
      'title',
      'description',
      'category',
      'categoryLabel',
      'resourceType',
      'fileUrl',
      'detailRoute',
      'fileType',
      'fileSize',
      'targetAudience',
      'universityId',
      'universityName',
      'courseId',
      'regulation',
      'semester',
      'subject',
      'tags',
      'status',
      'isPinned',
      'isFeatured',
      'downloadCount',
      'viewCount'
    ];

    Object.keys(updateData).forEach((field) => {
      if (!allowedFields.includes(field) && field !== 'id') {
        throw new Error(`Unsupported field "${field}" for resource.`);
      }
    });

    // Validate title if supplied
    if (updateData.title !== undefined) {
      if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
        throw new Error('Resource title cannot be empty.');
      }
      if (updateData.title.trim().length < 3) {
        throw new Error('Resource title must be at least 3 characters.');
      }
      if (updateData.title.trim().length > 150) {
        throw new Error('Resource title cannot exceed 150 characters.');
      }
    }

    // Validate description if supplied
    if (updateData.description !== undefined) {
      if (!updateData.description || typeof updateData.description !== 'string' || !updateData.description.trim()) {
        throw new Error('Resource description cannot be empty.');
      }
      if (updateData.description.trim().length > 1000) {
        throw new Error('Resource description cannot exceed 1000 characters.');
      }
    }

    // Validate URL if supplied
    if (updateData.fileUrl !== undefined && updateData.fileUrl !== null && updateData.fileUrl !== '') {
      if (!isValidResourceUrl(updateData.fileUrl)) {
        throw new Error('Invalid resource URL. Must be a valid HTTP or HTTPS URL and contain no executable script expressions.');
      }
    }

    // Validate status if supplied
    if (updateData.status !== undefined) {
      const normStatus = String(updateData.status).toLowerCase();
      if (!RESOURCE_STATUSES.includes(normStatus)) {
        throw new Error(`Invalid status "${updateData.status}". Allowed values: ${RESOURCE_STATUSES.join(', ')}.`);
      }
    }

    // Validate audience if supplied
    if (updateData.targetAudience !== undefined) {
      const normAud = String(updateData.targetAudience).toLowerCase();
      if (!RESOURCE_AUDIENCES.includes(normAud)) {
        throw new Error(`Invalid targetAudience "${updateData.targetAudience}". Allowed: ${RESOURCE_AUDIENCES.join(', ')}.`);
      }
    }

    const now = new Date().toISOString();
    const newStatus = updateData.status !== undefined ? String(updateData.status).toLowerCase() : existing.status;

    let publishedAt = existing.publishedAt;
    let archivedAt = existing.archivedAt;
    if (newStatus === 'published' && existing.status !== 'published') {
      publishedAt = now;
      archivedAt = null;
    } else if (newStatus === 'archived' && existing.status !== 'archived') {
      archivedAt = now;
    }

    const updatedResource = {
      ...existing,
      title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      category: updateData.category !== undefined ? updateData.category.trim() : existing.category,
      categoryLabel: updateData.categoryLabel || existing.categoryLabel,
      resourceType: updateData.resourceType || existing.resourceType,
      fileUrl: updateData.fileUrl !== undefined ? (updateData.fileUrl ? updateData.fileUrl.trim() : null) : existing.fileUrl,
      detailRoute: updateData.detailRoute !== undefined ? updateData.detailRoute : existing.detailRoute,
      fileType: updateData.fileType || existing.fileType,
      fileSize: updateData.fileSize || existing.fileSize,
      targetAudience: updateData.targetAudience !== undefined ? String(updateData.targetAudience).toLowerCase() : existing.targetAudience,
      universityId: updateData.universityId !== undefined ? updateData.universityId : existing.universityId,
      universityName: updateData.universityName || existing.universityName,
      courseId: updateData.courseId !== undefined ? updateData.courseId : existing.courseId,
      regulation: updateData.regulation !== undefined ? updateData.regulation : existing.regulation,
      semester: updateData.semester !== undefined ? updateData.semester : existing.semester,
      subject: updateData.subject !== undefined ? updateData.subject : existing.subject,
      tags: Array.isArray(updateData.tags) ? updateData.tags.map((t) => String(t).trim()).filter(Boolean) : existing.tags,
      status: newStatus,
      isPinned: updateData.isPinned !== undefined ? Boolean(updateData.isPinned) : existing.isPinned,
      isFeatured: updateData.isFeatured !== undefined ? Boolean(updateData.isFeatured) : existing.isFeatured,
      publishedAt,
      archivedAt,
      updatedAt: now
    };

    resources[idx] = updatedResource;
    safeSet(STORAGE_KEYS.RESOURCES, resources);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'RESOURCE_UPDATED',
        entityType: 'resource',
        entityId: id,
        entityName: updatedResource.title,
        details: `Updated details for academic resource "${updatedResource.title}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchResourcesUpdated('UPDATE', updatedResource);
    return updatedResource;
  },

  /**
   * Change publication status (e.g. published, draft, archived)
   */
  setResourceStatus(id, newStatus) {
    if (!id) throw new Error('Resource ID is required.');
    const normalizedStatus = String(newStatus).toLowerCase();
    if (!RESOURCE_STATUSES.includes(normalizedStatus)) {
      throw new Error(`Invalid status "${newStatus}". Allowed values: ${RESOURCE_STATUSES.join(', ')}.`);
    }

    const resources = this.initialize();
    const idx = resources.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Resource with ID "${id}" does not exist.`);
    }

    const existing = resources[idx];
    if (existing.status === normalizedStatus) {
      return existing;
    }

    const now = new Date().toISOString();
    let publishedAt = existing.publishedAt;
    let archivedAt = existing.archivedAt;

    let auditAction = 'RESOURCE_STATUS_CHANGED';
    if (normalizedStatus === 'published') {
      publishedAt = now;
      archivedAt = null;
      auditAction = existing.status === 'archived' ? 'RESOURCE_REACTIVATED' : 'RESOURCE_PUBLISHED';
    } else if (normalizedStatus === 'archived') {
      archivedAt = now;
      auditAction = 'RESOURCE_ARCHIVED';
    }

    const updatedResource = {
      ...existing,
      status: normalizedStatus,
      publishedAt,
      archivedAt,
      updatedAt: now
    };

    resources[idx] = updatedResource;
    safeSet(STORAGE_KEYS.RESOURCES, resources);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: auditAction,
        entityType: 'resource',
        entityId: id,
        entityName: updatedResource.title,
        details: `Resource "${updatedResource.title}" status changed from "${existing.status}" to "${normalizedStatus}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchResourcesUpdated(auditAction, updatedResource);
    return updatedResource;
  },

  /**
   * Check if resource can be safely deleted or if references exist
   */
  canDeleteResource(id) {
    if (!id) return { canDelete: false, reasons: ['Resource ID is required'] };

    const resources = this.initialize();
    const existing = resources.find((r) => r.id === id);
    if (!existing) {
      return { canDelete: false, reasons: ['Resource does not exist'] };
    }

    const reasons = [];

    // Core baseline check
    const isBaseline = (RESOURCES_DATA || []).some((r) => r.id === id);
    if (isBaseline) {
      reasons.push('This is a baseline platform resource. Archiving is recommended to preserve public reference links.');
    }

    // Pinned check
    if (existing.isPinned) {
      reasons.push('This resource is currently pinned to the top of the resource portal.');
    }

    const canDelete = reasons.length === 0;
    return {
      canDelete,
      reasons,
      message: canDelete
        ? 'Resource can be safely deleted.'
        : `Cannot permanently delete: ${reasons.join(' ')}`
    };
  },

  /**
   * Delete resource with safety validation
   */
  deleteResource(id, force = false) {
    if (!id) throw new Error('Resource ID is required.');

    const resources = this.initialize();
    const idx = resources.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Resource with ID "${id}" does not exist.`);
    }

    const target = resources[idx];

    if (!force) {
      const check = this.canDeleteResource(id);
      if (!check.canDelete) {
        throw new Error(check.message);
      }
    }

    const deletedResource = resources.splice(idx, 1)[0];
    safeSet(STORAGE_KEYS.RESOURCES, resources);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'RESOURCE_DELETED',
        entityType: 'resource',
        entityId: id,
        entityName: deletedResource.title,
        details: `Permanently deleted academic resource "${deletedResource.title}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchResourcesUpdated('DELETE', deletedResource);
    return deletedResource;
  },

  /**
   * Safely increment download count
   */
  incrementDownloadCount(id) {
    if (!id) return;
    const resources = this.initialize();
    const target = resources.find((r) => r.id === id);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      safeSet(STORAGE_KEYS.RESOURCES, resources);
    }
  },

  /**
   * Safely increment view count
   */
  incrementViewCount(id) {
    if (!id) return;
    const resources = this.initialize();
    const target = resources.find((r) => r.id === id);
    if (target) {
      target.viewCount = (target.viewCount || 0) + 1;
      safeSet(STORAGE_KEYS.RESOURCES, resources);
    }
  },

  /**
   * Aggregate statistics for administrative dashboard and KPI cards
   */
  getResourceStats() {
    const resources = this.initialize();
    const total = resources.length;
    const published = resources.filter((r) => (r.status || 'published').toLowerCase() === 'published').length;
    const draft = resources.filter((r) => (r.status || '').toLowerCase() === 'draft').length;
    const archived = resources.filter((r) => (r.status || '').toLowerCase() === 'archived').length;

    const totalDownloads = resources.reduce((acc, r) => acc + (r.downloadCount || 0), 0);
    const totalViews = resources.reduce((acc, r) => acc + (r.viewCount || 0), 0);

    const categoryBreakdown = {};
    resources.forEach((r) => {
      const cat = r.categoryLabel || r.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    return {
      total,
      published,
      draft,
      archived,
      totalDownloads,
      totalViews,
      categoryBreakdown
    };
  },

  /**
   * Safe factory reset of the resources registry to defaults
   */
  resetToDefaults() {
    const freshSeeded = (RESOURCES_DATA || []).map((r, i) => normalizeResource(r, i));
    safeSet(STORAGE_KEYS.RESOURCES, freshSeeded);

    try {
      auditHistoryService.recordEvent({
        action: 'RESOURCE_REGISTRY_RESET',
        entityType: 'resource',
        entityId: 'all_resources',
        entityName: 'Resources Registry',
        details: 'Restored academic resources catalog to factory baseline defaults.',
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchResourcesUpdated('RESET', null);
    return freshSeeded;
  }
};

// Initialize on module load
resourceManagementService.initialize();
