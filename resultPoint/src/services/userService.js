/**
 * ResultPoint Users Management Service
 *
 * Centralized service for User Management CRUD in Admin Dashboard.
 * Operates on the canonical user store: STORAGE_KEYS.USERS ('resultpoint_users').
 * Integrates with authService, academicCatalogService, and auditHistoryService.
 *
 * Implements strict data integrity:
 * - Deterministic validation (email format, uniqueness, roles, password security)
 * - Safe sanitization (never returns passwords or tokens to listings or audit logs)
 * - Referential integrity checks across student results, calculations, and records
 * - Guarded deletion with deactivation alternative for active academic accounts
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { authService, SEED_ACCOUNTS } from './authService.js';
import { academicCatalogService } from './academicCatalogService.js';
import { auditHistoryService } from './auditHistoryService.js';

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

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const { password, token, ...sanitized } = user;
  return {
    ...sanitized,
    status: sanitized.status || 'Active',
    role: sanitized.role || 'student'
  };
}

export const userService = {
  initialize() {
    authService.initialize();
  },

  /**
   * Retrieves all registered users with optional filtering and sorting.
   * Guaranteed to return sanitized objects (no passwords or credentials).
   */
  getAllUsers(filters = {}) {
    this.initialize();
    const rawUsers = safeGet(STORAGE_KEYS.USERS, []);
    let users = rawUsers.map(sanitizeUser).filter(Boolean);

    // 1. Search Filter (Name, Email, Hall Ticket Number)
    if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      users = users.filter((u) => {
        const nameMatch = (u.fullName || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        const hallTicketMatch = (u.hallTicketNumber || '').toLowerCase().includes(q);
        const uniMatch = (u.university || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || hallTicketMatch || uniMatch;
      });
    }

    // 2. Role Filter
    if (filters.role && filters.role !== 'all') {
      const targetRole = filters.role.toLowerCase();
      users = users.filter((u) => (u.role || '').toLowerCase() === targetRole);
    }

    // 3. Status Filter
    if (filters.status && filters.status !== 'all') {
      const targetStatus = filters.status.toLowerCase();
      users = users.filter((u) => (u.status || 'active').toLowerCase() === targetStatus);
    }

    // 4. University Filter
    if (filters.universityId && filters.universityId !== 'all') {
      users = users.filter((u) => u.universityId === filters.universityId);
    }

    // 5. Course Filter
    if (filters.courseId && filters.courseId !== 'all') {
      users = users.filter((u) => u.courseId === filters.courseId);
    }

    // 6. Sorting
    const sortBy = filters.sortBy || 'joinedDate';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    users.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    return users;
  },

  /**
   * Retrieves a single user by ID.
   */
  getUserById(id, includeSensitive = false) {
    this.initialize();
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const found = users.find((u) => u.id === id);
    if (!found) return null;
    return includeSensitive ? { ...found } : sanitizeUser(found);
  },

  /**
   * Retrieves a single user by email.
   */
  getUserByEmail(email, includeSensitive = false) {
    this.initialize();
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const found = users.find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (!found) return null;
    return includeSensitive ? { ...found } : sanitizeUser(found);
  },

  /**
   * Checks dependencies and references across the application before deleting a user.
   */
  checkUserReferences(userId) {
    this.initialize();
    const user = this.getUserById(userId, false);
    if (!user) {
      return {
        canDelete: false,
        hasReferences: false,
        reason: `User with ID "${userId}" does not exist.`
      };
    }

    // Protection 1: Primary admin account cannot be deleted
    if (userId === 'usr_admin_01' || user.email === 'admin@resultpoint.edu') {
      return {
        canDelete: false,
        hasReferences: true,
        reason: 'Cannot delete the primary platform administrator account.',
        isPrimaryAdmin: true
      };
    }

    // Protection 2: Currently logged in user cannot delete themselves
    const currentSessionUser = authService.getCurrentUser();
    if (currentSessionUser && currentSessionUser.id === userId) {
      return {
        canDelete: false,
        hasReferences: true,
        reason: 'Cannot delete the currently active logged-in user account. Switch accounts or log out first.',
        isSelf: true
      };
    }

    // 1. Semester Results Check
    let resultCount = 0;
    try {
      const results = safeGet(STORAGE_KEYS.RESULTS, []);
      if (Array.isArray(results)) {
        resultCount = results.filter((r) => {
          if (r.userId && r.userId === userId) return true;
          if (r.studentId && r.studentId === userId) return true;
          // Primary student demo results association
          if (userId === 'usr_student_01' && (!r.userId || r.userId === 'usr_student_01')) return true;
          return false;
        }).length;
      }
    } catch {}

    // 2. Saved Calculator Results Check
    let calculationCount = 0;
    try {
      const savedCalcs = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
      if (Array.isArray(savedCalcs)) {
        calculationCount = savedCalcs.filter((c) => {
          return c.userId === userId || (c.userEmail && c.userEmail.toLowerCase() === user.email.toLowerCase());
        }).length;
      }
    } catch {}

    // 3. Backlog Records Check
    let backlogCount = 0;
    try {
      const backlogs = safeGet(STORAGE_KEYS.BACKLOGS, []);
      if (Array.isArray(backlogs)) {
        backlogCount = backlogs.filter((b) => b.studentId === userId || b.userId === userId).length;
      }
    } catch {}

    // 4. Education Records Check
    let educationCount = 0;
    try {
      const eduRecords = safeGet(STORAGE_KEYS.EDUCATION_RECORDS, []);
      if (Array.isArray(eduRecords)) {
        educationCount = eduRecords.filter((e) => {
          if (e.userId && e.userId === userId) return true;
          if (userId === 'usr_student_01') return true;
          return false;
        }).length;
      }
    } catch {}

    // 5. Support Queries Check
    let queryCount = 0;
    try {
      const queries = safeGet(STORAGE_KEYS.SUPPORT_QUERIES, []);
      if (Array.isArray(queries)) {
        queryCount = queries.filter((q) => {
          return q.userId === userId || (q.email && q.email.toLowerCase() === user.email.toLowerCase());
        }).length;
      }
    } catch {}

    const totalReferences = resultCount + calculationCount + backlogCount + educationCount + queryCount;
    const reasons = [];

    if (resultCount > 0) reasons.push(`${resultCount} semester result${resultCount === 1 ? '' : 's'}`);
    if (calculationCount > 0) reasons.push(`${calculationCount} saved calculation log${calculationCount === 1 ? '' : 's'}`);
    if (backlogCount > 0) reasons.push(`${backlogCount} tracked backlog${backlogCount === 1 ? '' : 's'}`);
    if (educationCount > 0) reasons.push(`${educationCount} education record${educationCount === 1 ? '' : 's'}`);
    if (queryCount > 0) reasons.push(`${queryCount} support quer${queryCount === 1 ? 'y' : 'ies'}`);

    const reason = totalReferences > 0
      ? `Cannot permanently delete user "${user.fullName}": Referenced by ${reasons.join(', ')}. Please Deactivate this account instead to preserve academic transcripts and audit integrity.`
      : null;

    return {
      canDelete: totalReferences === 0,
      hasReferences: totalReferences > 0,
      totalReferences,
      resultCount,
      calculationCount,
      backlogCount,
      educationCount,
      queryCount,
      reasons,
      reason,
      details: {
        results: resultCount,
        calculations: calculationCount,
        backlogs: backlogCount,
        education: educationCount,
        supportQueries: queryCount
      }
    };
  },

  /**
   * Creates a new user with strict validation and catalog resolution.
   */
  createUser(payload = {}) {
    this.initialize();
    const {
      fullName,
      email,
      role = 'student',
      password,
      status = 'Active',
      universityId,
      courseId,
      regulationId,
      currentSemester = 1,
      hallTicketNumber = '',
      batch = '',
      phoneNumber = '',
      dob = '',
      gender = 'Male'
    } = payload;

    // Validation 1: Required Full Name
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new Error('Full Name is required and must contain at least 2 characters.');
    }

    // Validation 2: Email format
    if (!email || typeof email !== 'string') {
      throw new Error('Email address is required.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address (e.g., student@university.edu).');
    }

    // Validation 3: Duplicate Email Check
    const users = safeGet(STORAGE_KEYS.USERS, []);
    if (users.some((u) => (u.email || '').toLowerCase() === cleanEmail)) {
      throw new Error(`An account with email "${cleanEmail}" already exists.`);
    }

    // Validation 4: Role Validation
    const cleanRole = String(role || '').toLowerCase();
    if (cleanRole !== 'student' && cleanRole !== 'admin') {
      throw new Error('Invalid role specified. Role must be either "student" or "admin".');
    }

    // Validation 5: Password Requirements
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password is required and must be at least 6 characters long.');
    }

    // Validation 6: Status Validation
    const validStatuses = ['Active', 'Inactive', 'Suspended'];
    const cleanStatus = validStatuses.find((s) => s.toLowerCase() === String(status || '').toLowerCase()) || 'Active';

    // Catalog Academic Resolution (for student role)
    let resolvedUniName = '';
    let resolvedCourseName = '';
    let resolvedRegName = '';
    let totalSemesters = cleanRole === 'admin' ? 0 : 8;

    if (cleanRole === 'student' && universityId) {
      const univ = academicCatalogService.getUniversityById(universityId);
      if (!univ) {
        throw new Error(`University with ID "${universityId}" not found in academic catalog.`);
      }
      resolvedUniName = univ.name;

      if (courseId) {
        const course = academicCatalogService.getCourse(universityId, courseId);
        if (!course) {
          throw new Error(`Course with ID "${courseId}" does not exist under ${univ.name}.`);
        }
        resolvedCourseName = course.name;
        totalSemesters = course.totalSemesters || 8;

        if (regulationId) {
          const reg = academicCatalogService.getRegulation(universityId, courseId, regulationId);
          if (!reg) {
            throw new Error(`Regulation with ID "${regulationId}" does not exist under ${course.name}.`);
          }
          resolvedRegName = reg.name;
        }
      }
    }

    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newUser = {
      id: newId,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: cleanRole,
      status: cleanStatus,
      password, // Retained in canonical registry for authentication matching
      hasCompletedProfile: Boolean(universityId && courseId),
      avatar: cleanRole === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      universityId: universityId || '',
      courseId: courseId || '',
      regulationId: regulationId || '',
      university: resolvedUniName,
      course: resolvedCourseName,
      regulation: resolvedRegName,
      currentSemester: Number(currentSemester) || 1,
      totalSemesters,
      hallTicketNumber: hallTicketNumber.trim(),
      batch: batch.trim(),
      phoneNumber: phoneNumber.trim(),
      dob: dob.trim(),
      gender: gender || 'Male',
      joinedDate: nowIso.split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    users.push(newUser);
    safeSet(STORAGE_KEYS.USERS, users);

    // Record Audit Event
    try {
      auditHistoryService.recordEvent({
        action: 'USER_CREATED',
        entityType: 'user',
        entityId: newId,
        entityName: newUser.fullName,
        details: `Created new ${cleanRole} account for "${newUser.fullName}" (${cleanEmail}) with status "${cleanStatus}".`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Failed to record audit event:', e);
    }

    // Emit live synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_users_updated', { detail: { action: 'created', userId: newId } }));
      window.dispatchEvent(new Event('storage'));
    }

    return sanitizeUser(newUser);
  },

  /**
   * Updates an existing user's profile details.
   */
  updateUser(userId, updates = {}) {
    this.initialize();
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error(`User with ID "${userId}" does not exist.`);
    }

    const current = users[idx];

    // Validate email if changed
    let cleanEmail = current.email;
    if (updates.email && updates.email !== current.email) {
      const proposedEmail = updates.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(proposedEmail)) {
        throw new Error('Please enter a valid email address.');
      }
      const collision = users.find((u) => u.id !== userId && (u.email || '').toLowerCase() === proposedEmail);
      if (collision) {
        throw new Error(`Email "${proposedEmail}" is already in use by another account.`);
      }
      cleanEmail = proposedEmail;
    }

    // Validate full name if provided
    let cleanName = current.fullName;
    if (updates.fullName !== undefined) {
      if (!updates.fullName || updates.fullName.trim().length < 2) {
        throw new Error('Full Name must contain at least 2 characters.');
      }
      cleanName = updates.fullName.trim();
    }

    // Validate role if changing
    let cleanRole = current.role;
    if (updates.role && updates.role !== current.role) {
      const r = updates.role.toLowerCase();
      if (r !== 'student' && r !== 'admin') {
        throw new Error('Role must be either "student" or "admin".');
      }
      if (userId === 'usr_admin_01' && r !== 'admin') {
        throw new Error('Cannot downgrade the primary platform administrator role.');
      }
      cleanRole = r;
    }

    // Validate status if changing
    let cleanStatus = current.status || 'Active';
    if (updates.status && updates.status !== current.status) {
      const validStatuses = ['Active', 'Inactive', 'Suspended'];
      const foundStatus = validStatuses.find((s) => s.toLowerCase() === updates.status.toLowerCase());
      if (!foundStatus) {
        throw new Error('Status must be "Active", "Inactive", or "Suspended".');
      }
      if (userId === 'usr_admin_01' && foundStatus !== 'Active') {
        throw new Error('Cannot deactivate the primary platform administrator account.');
      }
      cleanStatus = foundStatus;
    }

    // Catalog verification if academic fields changed
    let resolvedUni = current.university;
    let resolvedCourse = current.course;
    let resolvedReg = current.regulation;
    let totalSemesters = current.totalSemesters || 8;

    const uniId = updates.universityId !== undefined ? updates.universityId : current.universityId;
    const crsId = updates.courseId !== undefined ? updates.courseId : current.courseId;
    const regId = updates.regulationId !== undefined ? updates.regulationId : current.regulationId;

    if (uniId) {
      const u = academicCatalogService.getUniversityById(uniId);
      if (u) {
        resolvedUni = u.name;
        if (crsId) {
          const c = academicCatalogService.getCourse(uniId, crsId);
          if (c) {
            resolvedCourse = c.name;
            totalSemesters = c.totalSemesters || 8;
            if (regId) {
              const r = academicCatalogService.getRegulation(uniId, crsId, regId);
              if (r) resolvedReg = r.name;
            }
          }
        }
      }
    }

    const updatedUser = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
      fullName: cleanName,
      email: cleanEmail,
      role: cleanRole,
      status: cleanStatus,
      university: resolvedUni,
      course: resolvedCourse,
      regulation: resolvedReg,
      totalSemesters,
      password: updates.password && updates.password.length >= 6 ? updates.password : current.password,
      updatedAt: new Date().toISOString()
    };

    users[idx] = updatedUser;
    safeSet(STORAGE_KEYS.USERS, users);

    // Sync session if currently logged in user was modified
    const session = safeGet(STORAGE_KEYS.AUTH, null);
    if (session && session.user && session.user.id === userId) {
      session.user = {
        ...session.user,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        universityId: updatedUser.universityId,
        courseId: updatedUser.courseId,
        regulationId: updatedUser.regulationId,
        university: updatedUser.university,
        course: updatedUser.course,
        regulation: updatedUser.regulation
      };
      safeSet(STORAGE_KEYS.AUTH, session);
    }

    // Audit Log
    try {
      auditHistoryService.recordEvent({
        action: 'USER_UPDATED',
        entityType: 'user',
        entityId: userId,
        entityName: updatedUser.fullName,
        details: `Updated profile details for "${updatedUser.fullName}" (${updatedUser.email}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Failed to record audit event:', e);
    }

    // Emit synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_users_updated', { detail: { action: 'updated', userId } }));
      window.dispatchEvent(new Event('storage'));
    }

    return sanitizeUser(updatedUser);
  },

  /**
   * Sets account status (Active, Inactive, Suspended).
   */
  setUserStatus(userId, status, reason = '') {
    this.initialize();
    const validStatuses = ['Active', 'Inactive', 'Suspended'];
    const cleanStatus = validStatuses.find((s) => s.toLowerCase() === String(status || '').toLowerCase());
    if (!cleanStatus) {
      throw new Error(`Invalid status "${status}". Allowed values: Active, Inactive, Suspended.`);
    }

    if (userId === 'usr_admin_01' && cleanStatus !== 'Active') {
      throw new Error('Cannot change status of primary platform administrator account.');
    }

    const users = safeGet(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error(`User with ID "${userId}" does not exist.`);
    }

    const prevStatus = users[idx].status || 'Active';
    users[idx].status = cleanStatus;
    users[idx].updatedAt = new Date().toISOString();
    safeSet(STORAGE_KEYS.USERS, users);

    // If active user session was deactivated/suspended, clear active session
    const session = safeGet(STORAGE_KEYS.AUTH, null);
    if (session && session.user && session.user.id === userId && cleanStatus !== 'Active') {
      authService.clearInvalidSession(`Account status was changed to ${cleanStatus}`);
    }

    // Audit Log
    try {
      const actionName = cleanStatus === 'Inactive' ? 'USER_DEACTIVATED' : 'USER_STATUS_CHANGED';
      auditHistoryService.recordEvent({
        action: actionName,
        entityType: 'user',
        entityId: userId,
        entityName: users[idx].fullName,
        details: `Account status for "${users[idx].fullName}" changed from ${prevStatus} to ${cleanStatus}.${reason ? ` Reason: ${reason}` : ''}`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Failed to record audit event:', e);
    }

    // Synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_users_updated', { detail: { action: 'status_changed', userId, status: cleanStatus } }));
      window.dispatchEvent(new Event('storage'));
    }

    return sanitizeUser(users[idx]);
  },

  /**
   * Safe deactivation convenience method.
   */
  deactivateUser(userId, reason = '') {
    return this.setUserStatus(userId, 'Inactive', reason);
  },

  /**
   * Deletes an unreferenced user. Strictly blocks deletion if dependencies exist.
   */
  deleteUser(userId) {
    this.initialize();
    const refCheck = this.checkUserReferences(userId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const users = safeGet(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error(`User with ID "${userId}" does not exist.`);
    }

    const [deletedUser] = users.splice(idx, 1);
    safeSet(STORAGE_KEYS.USERS, users);

    // Audit Log
    try {
      auditHistoryService.recordEvent({
        action: 'USER_DELETED',
        entityType: 'user',
        entityId: userId,
        entityName: deletedUser.fullName,
        details: `Permanently deleted unreferenced user "${deletedUser.fullName}" (${deletedUser.email}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Failed to record audit event:', e);
    }

    // Emit live synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_users_updated', { detail: { action: 'deleted', userId } }));
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      deletedUser: sanitizeUser(deletedUser)
    };
  }
};

// Initialize canonical users on load
userService.initialize();
