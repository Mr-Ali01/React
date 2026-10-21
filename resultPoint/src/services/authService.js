import { STORAGE_KEYS } from './storageKeys.js';

// Seed registered user accounts in the user directory if not already present.
// NOTE: Neither account is ever automatically logged in; session is strictly established on valid credential submit.
export const SEED_ACCOUNTS = [
  {
    id: 'usr_student_01',
    fullName: 'Student User',
    email: 'student@resultpoint.edu',
    password: 'password123',
    role: 'student',
    hasCompletedProfile: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    universityId: 'osmania',
    courseId: 'bca',
    regulationId: 'ou-bca-cbcs',
    course: 'BCA — Bachelor of Computer Applications (6 Semesters)',
    university: 'Osmania University (OU)',
    currentSemester: 3,
    totalSemesters: 6,
    regulation: 'Choice Based Credit System (CBCS) — [OU_BCA_CBCS_V1]',
    ruleVersion: 'OU_BCA_CBCS_V1',
    hallTicketNumber: 'REG-478583',
    batch: '2025-2027',
    phoneNumber: '+91 98765 43210',
    dob: '15 Mar 2003',
    gender: 'Male',
    totalDegreeCredits: 150,
    joinedDate: '2026-01-10'
  },
  {
    id: 'usr_admin_01',
    fullName: 'Administrator',
    email: 'admin@resultpoint.edu',
    password: 'adminpassword123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    title: 'Platform Owner'
  }
];

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key: ${key}`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key: ${key}`, err);
  }
}

export const authService = {
  // Ensure seed registered accounts exist in user registry, without creating an active session
  initialize() {
    const users = safeGet(STORAGE_KEYS.USERS, []);
    let modified = false;
    SEED_ACCOUNTS.forEach((seed) => {
      const existingIdx = users.findIndex((u) => u.email.toLowerCase() === seed.email.toLowerCase());
      if (existingIdx === -1) {
        users.push(seed);
        modified = true;
      } else {
        // Ensure student has full verified academic and personal defaults if previously empty
        if (seed.role === 'student' && (!users[existingIdx].universityId || !users[existingIdx].hallTicketNumber)) {
          users[existingIdx] = { ...seed, ...users[existingIdx] };
          if (!users[existingIdx].universityId) users[existingIdx].universityId = seed.universityId;
          if (!users[existingIdx].courseId) users[existingIdx].courseId = seed.courseId;
          if (!users[existingIdx].regulationId) users[existingIdx].regulationId = seed.regulationId;
          if (!users[existingIdx].hallTicketNumber) users[existingIdx].hallTicketNumber = seed.hallTicketNumber;
          if (!users[existingIdx].batch) users[existingIdx].batch = seed.batch;
          if (!users[existingIdx].phoneNumber) users[existingIdx].phoneNumber = seed.phoneNumber;
          if (!users[existingIdx].dob) users[existingIdx].dob = seed.dob;
          if (!users[existingIdx].gender) users[existingIdx].gender = seed.gender;
          modified = true;
        }
      }
    });
    if (modified || users.length === 0) {
      safeSet(STORAGE_KEYS.USERS, users);
    }
  },

  getAllUsers() {
    this.initialize();
    return safeGet(STORAGE_KEYS.USERS, []);
  },

  /**
   * Returns the current valid authenticated user or null.
   * Deterministically validates:
   * 1. Session structure & non-empty token
   * 2. Strict role ('student' | 'admin') without assuming fallback
   * 3. Session expiration based on expiresAt or loginAt
   * 4. User record existence and matching role in the user directory
   */
  getCurrentUser() {
    const auth = safeGet(STORAGE_KEYS.AUTH, null);
    if (!auth || typeof auth !== 'object') {
      return null;
    }

    // 1. Session structure and token validation
    if (!auth.token || typeof auth.token !== 'string' || !auth.user || !auth.user.id || !auth.user.email) {
      this.clearInvalidSession('Missing session token or required user identity');
      return null;
    }

    // 2. Strict Role validation (Do not default to student or accept stale roles)
    const role = auth.user.role;
    if (role !== 'student' && role !== 'admin') {
      this.clearInvalidSession(`Invalid or unrecognized role: "${role}"`);
      return null;
    }

    // 3. Expiration validation (Handle expired sessions deterministically)
    const now = Date.now();
    let isExpired = false;

    if (auth.expiresAt) {
      const expTime = new Date(auth.expiresAt).getTime();
      if (isNaN(expTime) || expTime <= now) {
        isExpired = true;
      }
    } else if (auth.loginAt) {
      // Legacy session without explicit expiresAt: evaluate against 7d window
      const loginTime = new Date(auth.loginAt).getTime();
      const defaultDurationMs = 7 * 24 * 60 * 60 * 1000;
      if (isNaN(loginTime) || (loginTime + defaultDurationMs) <= now) {
        isExpired = true;
      }
    } else {
      isExpired = true;
    }

    if (isExpired) {
      this.clearInvalidSession('Session has expired');
      return null;
    }

    // 4. Verify user exists in registered directory with matching role
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const matchingUser = users.find(
      (u) => u.id === auth.user.id && u.email.toLowerCase() === auth.user.email.toLowerCase()
    );

    if (!matchingUser) {
      this.clearInvalidSession('User account does not exist in registry');
      return null;
    }

    if (matchingUser.role !== role) {
      this.clearInvalidSession('Role mismatch against user record');
      return null;
    }

    return auth.user;
  },

  /**
   * Retrieves the current active session token if valid, else null
   */
  getToken() {
    const user = this.getCurrentUser();
    if (!user) return null;
    const auth = safeGet(STORAGE_KEYS.AUTH, null);
    return auth?.token || null;
  },

  /**
   * True only when a valid, non-expired authenticated session exists
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Safely clears an invalid, expired, or corrupted session without clearing unrelated student data
   */
  clearInvalidSession(reason = '') {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_session_changed', { detail: { reason, action: 'invalidated' } }));
      }
    } catch (err) {
      console.warn('Error clearing invalid session:', err);
    }
  },

  setSession(user, customDuration = '7d') {
    if (!user || (!user.id && !user.userId) || !user.email) {
      throw new Error('Cannot create session for invalid user payload');
    }

    // Strict role validation - must be 'student' or 'admin'
    const role = user.role === 'admin' ? 'admin' : (user.role === 'student' ? 'student' : null);
    if (!role) {
      throw new Error(`Cannot create session with unrecognized role: "${user.role}"`);
    }

    const now = Date.now();
    let durationMs = 7 * 24 * 60 * 60 * 1000;
    if (customDuration === '24h') durationMs = 24 * 60 * 60 * 1000;
    else if (customDuration === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

    const session = {
      user: {
        id: user.id || user.userId,
        fullName: user.fullName || (role === 'admin' ? 'Administrator' : 'Student'),
        email: user.email.toLowerCase().trim(),
        role,
        hasCompletedProfile: Boolean(user.hasCompletedProfile),
        avatar: user.avatar || (role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'),
        universityId: user.universityId || '',
        courseId: user.courseId || '',
        regulationId: user.regulationId || '',
        course: user.course || '',
        university: user.university || '',
        currentSemester: user.currentSemester || 1,
        totalSemesters: user.totalSemesters || (role === 'admin' ? 0 : 8),
        regulation: user.regulation || '',
        ruleVersion: user.ruleVersion || '',
        hallTicketNumber: user.hallTicketNumber || '',
        batch: user.batch || '',
        phoneNumber: user.phoneNumber || '',
        dob: user.dob || '',
        gender: user.gender || 'Male',
        totalDegreeCredits: user.totalDegreeCredits || 150
      },
      token: `auth_token_${now}_${Math.random().toString(36).substring(2, 9)}`,
      loginAt: new Date(now).toISOString(),
      expiresAt: new Date(now + durationMs).toISOString()
    };

    safeSet(STORAGE_KEYS.AUTH, session);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_session_changed', { detail: { action: 'login', role } }));
    }
    return session.user;
  },

  updateCurrentUser(updates) {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    this.setSession(updated);

    // Also update in users list
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      safeSet(STORAGE_KEYS.USERS, users);
    }
    return updated;
  },

  login({ email, password, expectedRole }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, []);

    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid email or password. Please verify your credentials.'
      };
    }

    if (expectedRole && found.role !== expectedRole) {
      if (expectedRole === 'admin') {
        return {
          success: false,
          error: 'Access denied: Administrator privileges required. Please switch to Student Login.'
        };
      }
      if (expectedRole === 'student') {
        return {
          success: false,
          error: 'Access denied: This login is for students. Please switch to Admin Login.'
        };
      }
    }

    const sessionUser = this.setSession(found);
    return { success: true, user: sessionUser };
  },

  register({ fullName, email, password }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, []);

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      password,
      role: 'student',
      hasCompletedProfile: false,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      universityId: '',
      courseId: '',
      regulationId: '',
      course: '',
      university: '',
      currentSemester: 1,
      totalSemesters: 8,
      regulation: '',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    safeSet(STORAGE_KEYS.USERS, users);

    const sessionUser = this.setSession(newUser);
    return { success: true, user: sessionUser };
  },

  logout() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.STUDENT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_session_changed', { detail: { action: 'logout' } }));
      }
    } catch (e) {
      console.error(e);
    }
  }
};
