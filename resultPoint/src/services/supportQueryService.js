import { STORAGE_KEYS } from './storageKeys.js';
import { userService } from './userService.js';
import { auditHistoryService } from './auditHistoryService.js';

export const QUERY_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const QUERY_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const QUERY_CATEGORIES = [
  'Calculator Support',
  'University Information',
  'Resource Request',
  'Feedback & Suggestions',
  'Account or Dashboard Support',
  'Other'
];

export const QUERY_UPDATED_EVENT = 'rp_queries_updated';

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

function dispatchQueriesUpdated(action, query) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(QUERY_UPDATED_EVENT, {
          detail: { action, query, timestamp: new Date().toISOString() }
        })
      );
    }
  } catch (err) {
    console.warn('Failed to dispatch query update event:', err);
  }
}

/**
 * Seed queries initialized idempotently when storage is empty
 */
export const SEED_QUERIES = [
  {
    id: 'query_seed_01',
    ticketId: 'RP-TICK-OU-8921',
    subject: 'Calculator Support',
    category: 'Calculator Support',
    fullName: 'Student User',
    email: 'student@resultpoint.edu',
    userId: 'usr_student_01',
    status: 'In Progress',
    priority: 'High',
    assignedAdminId: 'usr_admin_01',
    assignedAdminName: 'Administrator',
    message:
      'In Semester 3 OU BCA CBCS, should Professional Elective credits be counted towards SGPA or considered audit credits? The calculator includes them in the total.',
    source: 'Student Dashboard',
    responses: [
      {
        id: 'resp_seed_01',
        senderId: 'usr_admin_01',
        senderName: 'Administrator',
        senderRole: 'admin',
        message:
          'Under Osmania University BCA CBCS regulations, Professional Electives carry 3 credits and are fully counted toward SGPA and CGPA. Only Non-Credit Audit Courses (such as Environmental Studies) are excluded from the GPA computation.',
        timestamp: '2026-02-14T11:20:00.000Z'
      }
    ],
    createdAt: '2026-02-14T10:15:00.000Z',
    updatedAt: '2026-02-14T11:20:00.000Z'
  },
  {
    id: 'query_seed_02',
    ticketId: 'RP-TICK-JNTU-4402',
    subject: 'University Information',
    category: 'University Information',
    fullName: 'Rahul Sharma',
    email: 'rahul.s@gmail.com',
    userId: null,
    status: 'Resolved',
    priority: 'Medium',
    assignedAdminId: 'usr_admin_01',
    assignedAdminName: 'Administrator',
    message:
      'Could you please verify if the JNTUH R22 regulation formula for percentage conversion is (CGPA - 0.5) * 10 or CGPA * 10? Thanks!',
    source: 'Public Contact Form',
    responses: [
      {
        id: 'resp_seed_02',
        senderId: 'usr_admin_01',
        senderName: 'Administrator',
        senderRole: 'admin',
        message:
          'Hi Rahul, JNTUH officially uses the standard formula Percentage = (CGPA - 0.5) * 10 as per Academic Regulation Clause 11.2.',
        timestamp: '2026-02-15T09:30:00.000Z'
      }
    ],
    resolutionDetails: 'Confirmed official academic circular clause 11.2 for JNTUH R22.',
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T09:30:00.000Z',
    resolvedAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: 'query_seed_03',
    ticketId: 'RP-TICK-RES-1039',
    subject: 'Resource Request',
    category: 'Resource Request',
    fullName: 'Priya Patel',
    email: 'priya.patel@student.ac.in',
    userId: null,
    status: 'Open',
    priority: 'Low',
    assignedAdminId: null,
    assignedAdminName: null,
    message:
      'Requesting syllabus handbook and model question papers for 2nd Year Data Structures & Algorithms.',
    source: 'Public Contact Form',
    responses: [],
    createdAt: '2026-02-16T14:45:00.000Z',
    updatedAt: '2026-02-16T14:45:00.000Z'
  }
];

export const supportQueryService = {
  /**
   * Idempotently initialize seed support queries if none exist
   */
  initialize() {
    const raw = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      safeSet(STORAGE_KEYS.SUPPORT_QUERIES, SEED_QUERIES);
    }
  },

  /**
   * Safe requester sanitization that attaches student profile details
   * without exposing any passwords, hashes, or tokens
   */
  sanitizeQuery(query) {
    if (!query || typeof query !== 'object') return null;

    let userSummary = null;
    if (query.userId) {
      try {
        const user = userService.getUserById(query.userId);
        if (user) {
          userSummary = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            status: user.status || 'Active',
            university: user.university || null,
            course: user.course || null,
            hallTicketNumber: user.hallTicketNumber || null,
            currentSemester: user.currentSemester || null
          };
        }
      } catch (err) {
        console.warn(`Failed to resolve user ${query.userId} for query ${query.id}:`, err);
      }
    }

    return {
      ...query,
      userSummary,
      responses: Array.isArray(query.responses) ? query.responses : []
    };
  },

  /**
   * Validate support query fields
   */
  validate(data, isUpdate = false) {
    const errors = {};

    // Full name validation
    if (!isUpdate || data.fullName !== undefined) {
      if (!data.fullName || typeof data.fullName !== 'string' || !data.fullName.trim()) {
        errors.fullName = 'Requester full name is required.';
      } else if (data.fullName.trim().length < 2) {
        errors.fullName = 'Requester name must be at least 2 characters.';
      } else if (data.fullName.trim().length > 60) {
        errors.fullName = 'Requester name cannot exceed 60 characters.';
      }
    }

    // Email validation
    if (!isUpdate || data.email !== undefined) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
        errors.email = 'Valid requester email address is required.';
      } else if (!emailRegex.test(data.email.trim())) {
        errors.email = 'Please provide a valid email format (e.g. name@university.edu).';
      }
    }

    // Subject validation
    if (!isUpdate || data.subject !== undefined) {
      if (!data.subject || typeof data.subject !== 'string' || !data.subject.trim()) {
        errors.subject = 'Subject is required.';
      } else if (data.subject.trim().length < 3) {
        errors.subject = 'Subject must be at least 3 characters.';
      } else if (data.subject.trim().length > 120) {
        errors.subject = 'Subject cannot exceed 120 characters.';
      }
    }

    // Message validation
    if (!isUpdate || data.message !== undefined) {
      if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
        errors.message = 'Message content is required.';
      } else if (data.message.trim().length < 5) {
        errors.message = 'Message must be at least 5 characters.';
      } else if (data.message.trim().length > 2000) {
        errors.message = 'Message cannot exceed 2000 characters.';
      }
    }

    // Status validation
    if (data.status !== undefined) {
      if (!QUERY_STATUSES.includes(data.status)) {
        errors.status = `Status must be one of: ${QUERY_STATUSES.join(', ')}.`;
      }
    }

    // Priority validation
    if (data.priority !== undefined) {
      if (!QUERY_PRIORITIES.includes(data.priority)) {
        errors.priority = `Priority must be one of: ${QUERY_PRIORITIES.join(', ')}.`;
      }
    }

    // Assigned Admin validation
    if (data.assignedAdminId) {
      try {
        const adminUser = userService.getUserById(data.assignedAdminId);
        if (!adminUser) {
          errors.assignedAdminId = `Assigned administrator ID "${data.assignedAdminId}" does not exist.`;
        } else if (adminUser.role !== 'admin') {
          errors.assignedAdminId = `User "${adminUser.fullName}" is not an administrator and cannot be assigned tickets.`;
        }
      } catch {
        errors.assignedAdminId = 'Invalid administrator reference.';
      }
    }

    // Associated User validation
    if (data.userId) {
      try {
        const linkedUser = userService.getUserById(data.userId);
        if (!linkedUser) {
          errors.userId = `Referenced user ID "${data.userId}" does not exist.`;
        }
      } catch {
        errors.userId = 'Invalid user reference.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Retrieve all support queries with rich filtering, search, sorting, and pagination
   */
  getAllQueries(options = {}) {
    this.initialize();
    const rawQueries = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    let results = rawQueries.map((q) => this.sanitizeQuery(q));

    // 1. Search filter
    if (options.search && typeof options.search === 'string') {
      const q = options.search.trim().toLowerCase();
      results = results.filter((item) => {
        const ticketMatch = (item.ticketId || '').toLowerCase().includes(q);
        const nameMatch = (item.fullName || '').toLowerCase().includes(q);
        const emailMatch = (item.email || '').toLowerCase().includes(q);
        const subjectMatch = (item.subject || '').toLowerCase().includes(q);
        const messageMatch = (item.message || '').toLowerCase().includes(q);
        const userMatch = item.userSummary && item.userSummary.fullName.toLowerCase().includes(q);
        return ticketMatch || nameMatch || emailMatch || subjectMatch || messageMatch || userMatch;
      });
    }

    // 2. Status filter
    if (options.status && options.status !== 'all') {
      const targetStatus = options.status.toLowerCase();
      results = results.filter((item) => (item.status || 'open').toLowerCase() === targetStatus);
    }

    // 3. Priority filter
    if (options.priority && options.priority !== 'all') {
      const targetPriority = options.priority.toLowerCase();
      results = results.filter((item) => (item.priority || 'medium').toLowerCase() === targetPriority);
    }

    // 4. Category filter
    if (options.category && options.category !== 'all') {
      const targetCategory = options.category.toLowerCase();
      results = results.filter((item) => (item.category || item.subject || '').toLowerCase() === targetCategory);
    }

    // 5. Assigned Admin filter
    if (options.assignedAdminId && options.assignedAdminId !== 'all') {
      if (options.assignedAdminId === 'unassigned') {
        results = results.filter((item) => !item.assignedAdminId);
      } else {
        results = results.filter((item) => item.assignedAdminId === options.assignedAdminId);
      }
    }

    // 6. User filter
    if (options.userId) {
      results = results.filter((item) => item.userId === options.userId);
    }

    // 7. Sorting
    const sortBy = options.sortBy || 'newest';
    results.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      }
      if (sortBy === 'priority') {
        const rank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority] || 2) - (rank[a.priority] || 2);
      }
      if (sortBy === 'status') {
        const statusRank = { Open: 4, 'In Progress': 3, Resolved: 2, Closed: 1 };
        return (statusRank[b.status] || 0) - (statusRank[a.status] || 0);
      }
      // Default: newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // 8. Pagination
    if (options.page && options.limit) {
      const page = Math.max(1, parseInt(options.page, 10));
      const limit = Math.max(1, parseInt(options.limit, 10));
      const startIndex = (page - 1) * limit;
      return {
        data: results.slice(startIndex, startIndex + limit),
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit)
      };
    }

    return results;
  },

  /**
   * Retrieve single query by internal ID or public Ticket reference
   */
  getQueryById(idOrTicketId) {
    if (!idOrTicketId) return null;
    this.initialize();
    const rawQueries = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const match = rawQueries.find(
      (q) => q.id === idOrTicketId || (q.ticketId && q.ticketId.toUpperCase() === idOrTicketId.toUpperCase())
    );
    return match ? this.sanitizeQuery(match) : null;
  },

  /**
   * Create a new validated support query
   */
  createQuery(data) {
    const validation = this.validate(data, false);
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      throw new Error(firstErr || 'Support query validation failed.');
    }

    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const timestamp = new Date().toISOString();

    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateCode = Date.now().toString(36).toUpperCase();
    const ticketId = data.ticketId && data.ticketId.trim()
      ? data.ticketId.trim().toUpperCase()
      : `RP-TICK-${dateCode}-${uniqueSuffix}`;

    // Prevent duplicate ticketId
    if (existing.some((q) => q.ticketId === ticketId)) {
      throw new Error(`Ticket with reference "${ticketId}" already exists.`);
    }

    let assignedAdminName = null;
    if (data.assignedAdminId) {
      const adminUser = userService.getUserById(data.assignedAdminId);
      if (adminUser) assignedAdminName = adminUser.fullName;
    }

    const newQuery = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ticketId,
      subject: data.subject.trim(),
      category: data.category || data.subject.trim(),
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      userId: data.userId || null,
      message: data.message.trim(),
      status: data.status || 'Open',
      priority: data.priority || 'Medium',
      assignedAdminId: data.assignedAdminId || null,
      assignedAdminName,
      source: data.source || 'Admin Desk',
      responses: Array.isArray(data.responses) ? data.responses : [],
      resolutionDetails: data.resolutionDetails || null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    existing.unshift(newQuery);
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    // Audit History Logging
    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_CREATED',
        entityType: 'support_query',
        entityId: newQuery.id,
        entityName: newQuery.ticketId,
        details: `Support ticket #${newQuery.ticketId} created for "${newQuery.fullName}" [${newQuery.subject}] with priority ${newQuery.priority}.`,
        actor: 'Admin'
      });
    } catch (err) {
      console.warn('Failed to record audit event for query creation:', err);
    }

    dispatchQueriesUpdated('CREATE', newQuery);
    return this.sanitizeQuery(newQuery);
  },

  /**
   * Update permitted metadata fields for an existing query
   */
  updateQuery(id, updates = {}) {
    if (!id) throw new Error('Query ID is required for update.');
    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    const current = existing[index];
    const validation = this.validate(updates, true);
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      throw new Error(firstErr || 'Update validation failed.');
    }

    let assignedAdminName = current.assignedAdminName;
    if (updates.assignedAdminId !== undefined) {
      if (updates.assignedAdminId) {
        const adminUser = userService.getUserById(updates.assignedAdminId);
        assignedAdminName = adminUser ? adminUser.fullName : null;
      } else {
        assignedAdminName = null;
      }
    }

    const updated = {
      ...current,
      ...(updates.subject !== undefined && { subject: updates.subject.trim() }),
      ...(updates.category !== undefined && { category: updates.category.trim() }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.assignedAdminId !== undefined && { assignedAdminId: updates.assignedAdminId || null, assignedAdminName }),
      ...(updates.fullName !== undefined && { fullName: updates.fullName.trim() }),
      ...(updates.email !== undefined && { email: updates.email.trim().toLowerCase() }),
      updatedAt: new Date().toISOString()
    };

    existing[index] = updated;
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_UPDATED',
        entityType: 'support_query',
        entityId: updated.id,
        entityName: updated.ticketId,
        details: `Updated metadata for support ticket #${updated.ticketId}.`,
        actor: 'Admin'
      });
    } catch {}

    dispatchQueriesUpdated('UPDATE', updated);
    return this.sanitizeQuery(updated);
  },

  /**
   * Change status with validation, transition rules, and audit history
   */
  setQueryStatus(id, newStatus, resolutionDetails = null) {
    if (!id) throw new Error('Query ID is required to set status.');
    if (!QUERY_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${QUERY_STATUSES.join(', ')}.`);
    }

    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    const current = existing[index];
    const prevStatus = current.status || 'Open';

    if (prevStatus === newStatus) {
      return this.sanitizeQuery(current);
    }

    const now = new Date().toISOString();
    let actionType = 'SUPPORT_QUERY_STATUS_CHANGED';

    const updated = {
      ...current,
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === 'Resolved') {
      actionType = 'SUPPORT_QUERY_RESOLVED';
      updated.resolvedAt = now;
      if (resolutionDetails) updated.resolutionDetails = String(resolutionDetails).trim();
    } else if (newStatus === 'Closed') {
      actionType = 'SUPPORT_QUERY_CLOSED';
      updated.closedAt = now;
      if (resolutionDetails) updated.resolutionDetails = String(resolutionDetails).trim();
    } else if ((prevStatus === 'Resolved' || prevStatus === 'Closed') && (newStatus === 'Open' || newStatus === 'In Progress')) {
      actionType = 'SUPPORT_QUERY_REOPENED';
    }

    existing[index] = updated;
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: actionType,
        entityType: 'support_query',
        entityId: updated.id,
        entityName: updated.ticketId,
        details: `Status for ticket #${updated.ticketId} changed from ${prevStatus} to ${newStatus}.${resolutionDetails ? ` Note: ${resolutionDetails}` : ''}`,
        actor: 'Admin'
      });
    } catch {}

    dispatchQueriesUpdated('STATUS_CHANGE', updated);
    return this.sanitizeQuery(updated);
  },

  /**
   * Change query priority
   */
  setQueryPriority(id, newPriority) {
    if (!id) throw new Error('Query ID is required to set priority.');
    if (!QUERY_PRIORITIES.includes(newPriority)) {
      throw new Error(`Invalid priority "${newPriority}". Must be one of: ${QUERY_PRIORITIES.join(', ')}.`);
    }

    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    const current = existing[index];
    const prevPriority = current.priority || 'Medium';
    if (prevPriority === newPriority) return this.sanitizeQuery(current);

    const updated = {
      ...current,
      priority: newPriority,
      updatedAt: new Date().toISOString()
    };

    existing[index] = updated;
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_PRIORITY_CHANGED',
        entityType: 'support_query',
        entityId: updated.id,
        entityName: updated.ticketId,
        details: `Priority for ticket #${updated.ticketId} changed from ${prevPriority} to ${newPriority}.`,
        actor: 'Admin'
      });
    } catch {}

    dispatchQueriesUpdated('PRIORITY_CHANGE', updated);
    return this.sanitizeQuery(updated);
  },

  /**
   * Assign query to an administrator
   */
  assignQuery(id, adminId) {
    if (!id) throw new Error('Query ID is required to assign admin.');
    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    let assignedAdminName = null;
    if (adminId) {
      const adminUser = userService.getUserById(adminId);
      if (!adminUser) {
        throw new Error(`Admin with ID "${adminId}" does not exist.`);
      }
      if (adminUser.role !== 'admin') {
        throw new Error(`User "${adminUser.fullName}" does not have administrator privileges.`);
      }
      assignedAdminName = adminUser.fullName;
    }

    const current = existing[index];
    const updated = {
      ...current,
      assignedAdminId: adminId || null,
      assignedAdminName,
      updatedAt: new Date().toISOString()
    };

    existing[index] = updated;
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_ASSIGNED',
        entityType: 'support_query',
        entityId: updated.id,
        entityName: updated.ticketId,
        details: adminId
          ? `Ticket #${updated.ticketId} assigned to administrator ${assignedAdminName}.`
          : `Ticket #${updated.ticketId} unassigned.`,
        actor: 'Admin'
      });
    } catch {}

    dispatchQueriesUpdated('ASSIGN', updated);
    return this.sanitizeQuery(updated);
  },

  /**
   * Add response entry to a query without overwriting original message
   */
  addResponse(id, { message, senderId, senderName, senderRole = 'admin' }) {
    if (!id) throw new Error('Query ID is required to add response.');
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Response message cannot be empty.');
    }

    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    const current = existing[index];
    const timestamp = new Date().toISOString();

    const responseEntry = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: senderId || 'usr_admin_01',
      senderName: senderName || 'Administrator',
      senderRole: senderRole || 'admin',
      message: message.trim(),
      timestamp
    };

    const responses = Array.isArray(current.responses) ? [...current.responses, responseEntry] : [responseEntry];

    // If query is currently Open and admin responds, advance to In Progress automatically
    const nextStatus = current.status === 'Open' && senderRole === 'admin' ? 'In Progress' : current.status;

    const updated = {
      ...current,
      responses,
      status: nextStatus,
      updatedAt: timestamp
    };

    existing[index] = updated;
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_RESPONDED',
        entityType: 'support_query',
        entityId: updated.id,
        entityName: updated.ticketId,
        details: `Response added to ticket #${updated.ticketId} by ${responseEntry.senderName} (${responseEntry.senderRole}).`,
        actor: senderRole === 'admin' ? 'Admin' : 'Student'
      });
    } catch {}

    dispatchQueriesUpdated('RESPONSE', updated);
    return this.sanitizeQuery(updated);
  },

  /**
   * Delete query permanently (only for cleanups where appropriate)
   */
  deleteQuery(id) {
    if (!id) throw new Error('Query ID is required for deletion.');
    this.initialize();
    const existing = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const index = existing.findIndex((q) => q.id === id || q.ticketId === id);

    if (index === -1) {
      throw new Error(`Support query with ID or ticket "${id}" was not found.`);
    }

    const removed = existing.splice(index, 1)[0];
    safeSet(STORAGE_KEYS.SUPPORT_QUERIES, existing);

    try {
      auditHistoryService.recordEvent({
        action: 'SUPPORT_QUERY_DELETED',
        entityType: 'support_query',
        entityId: removed.id,
        entityName: removed.ticketId,
        details: `Permanently deleted support ticket #${removed.ticketId} [${removed.subject}].`,
        actor: 'Admin'
      });
    } catch {}

    dispatchQueriesUpdated('DELETE', removed);
    return {
      success: true,
      deletedQuery: this.sanitizeQuery(removed)
    };
  },

  /**
   * Aggregate high-level ticket statistics
   */
  getQueryStats() {
    this.initialize();
    const rawQueries = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
    const total = rawQueries.length;
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let urgent = 0;
    let unassigned = 0;

    rawQueries.forEach((q) => {
      const st = (q.status || 'open').toLowerCase();
      if (st === 'open') open++;
      else if (st === 'in progress') inProgress++;
      else if (st === 'resolved') resolved++;
      else if (st === 'closed') closed++;

      if ((q.priority || '').toLowerCase() === 'urgent') urgent++;
      if (!q.assignedAdminId) unassigned++;
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
      unassigned,
      pending: open + inProgress
    };
  }
};
