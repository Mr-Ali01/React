import { STORAGE_KEYS } from './storageKeys.js';
import { tokenStorage } from './api/tokenStorage.js';
import { authApi } from './api/authApi.js';
import { refreshCoordinator } from './api/refreshCoordinator.js';

// Seed registered user accounts in the user directory if not already present.
export const SEED_ACCOUNTS = [
  {
    id: 'usr_student_01',
    fullName: 'Student User',
    email: 'student@resultpoint.edu',
    password: 'password123',
    role: 'student',
    status: 'Active',
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
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    title: 'Platform Owner',
    joinedDate: '2026-01-01'
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

function isMockAuthAllowed() {
  // Strictly disabled in production builds
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.PROD || import.meta.env.MODE === 'production') return false;
    // In dev mode, only allowed if explicitly enabled via VITE_ENABLE_MOCK_AUTH === 'true'
    return import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined' && globalThis.process.env) {
    if (globalThis.process.env.NODE_ENV === 'production') return false;
    return globalThis.process.env.VITE_ENABLE_MOCK_AUTH === 'true';
  }
  return false;
}

function normalizeUserRole(role) {
  if (!role) return 'student';
  const lower = String(role).toLowerCase();
  if (lower.includes('admin')) return 'admin';
  return 'student';
}

function sanitizeUserSummary(user) {
  if (!user) return null;
  const role = normalizeUserRole(user.role);
  return {
    id: user.id || user.userId,
    fullName: user.fullName || (role === 'admin' ? 'Administrator' : 'Student User'),
    email: (user.email || '').toLowerCase().trim(),
    role,
    status: user.status || 'Active',
    hasCompletedProfile: Boolean(user.hasCompletedProfile),
    avatar: user.avatar || user.avatarUrl || (role === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'),
    universityId: user.universityId || null,
    courseId: user.courseId || null,
    regulationId: user.regulationId || null,
    course: user.course || null,
    university: user.university || null,
    currentSemester: user.currentSemester || 1,
    totalSemesters: user.totalSemesters || (role === 'admin' ? 0 : 8),
    regulation: user.regulation || null,
    hallTicketNumber: user.hallTicketNumber || null,
    batch: user.batch || null,
    phoneNumber: user.phone || user.phoneNumber || null,
  };
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
        if (seed.role === 'student' && (!users[existingIdx].universityId || !users[existingIdx].hallTicketNumber)) {
          users[existingIdx] = { ...seed, ...users[existingIdx] };
          modified = true;
        }
        if (!users[existingIdx].status) {
          users[existingIdx].status = seed.status || 'Active';
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
   * Synchronously returns cached user summary.
   */
  getCurrentUser() {
    return tokenStorage.getCurrentUser();
  },

  /**
   * Retrieves active access token.
   */
  getToken() {
    return tokenStorage.getAccessToken();
  },

  /**
   * Checks if an authenticated session exists.
   */
  isAuthenticated() {
    const user = this.getCurrentUser();
    const hasToken = Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());
    return Boolean(user && hasToken);
  },

  /**
   * Clears invalid or expired session.
   */
  clearInvalidSession(reason = '') {
    tokenStorage.clearSession();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth_session_changed', { detail: { reason, action: 'invalidated' } })
      );
    }
  },

  /**
   * Sets session in token storage and local storage.
   */
  setSession(user, tokens = {}) {
    if (!user) {
      throw new Error('Cannot create session for invalid user payload');
    }

    const sanitized = sanitizeUserSummary(user);
    tokenStorage.setSession({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitized,
    });

    return sanitized;
  },

  updateCurrentUser(updates) {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    const sanitized = sanitizeUserSummary(updated);
    tokenStorage.setCurrentUser(sanitized);

    // Keep users directory in sync
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(
      (u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase()
    );
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      safeSet(STORAGE_KEYS.USERS, users);
    }
    return sanitized;
  },

  /**
   * Authenticate user with credentials.
   * Connects to POST /api/v1/auth/login.
   */
  async login({ email, password, expectedRole }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary: Attempt backend authentication
    try {
      const authResponse = await authApi.login({
        email: cleanEmail,
        password,
      });

      const { accessToken, refreshToken, user: backendUser } = authResponse;
      const sanitizedUser = sanitizeUserSummary(backendUser);

      // Verify expected role if specified
      if (expectedRole && sanitizedUser.role !== expectedRole) {
        if (expectedRole === 'admin') {
          return {
            success: false,
            error: 'Access denied: Administrator privileges required. Please switch to Student Login.',
          };
        }
        if (expectedRole === 'student') {
          return {
            success: false,
            error: 'Access denied: This login is for students. Please switch to Admin Login.',
          };
        }
      }

      this.setSession(sanitizedUser, { accessToken, refreshToken });

      return {
        success: true,
        user: sanitizedUser,
        token: accessToken,
        refreshToken,
      };
    } catch (err) {
      // If backend explicitly rejected credentials (401), return backend error
      if (err.status === 401) {
        return {
          success: false,
          error: err.message || 'Invalid email or password. Please verify your credentials.',
        };
      }

      // If backend is unreachable (network failure), check if mock auth is explicitly enabled (dev only)
      if (err.code === 'NETWORK_FAILURE' || err.status === 0) {
        if (isMockAuthAllowed()) {
          console.warn('[DEV ONLY] Backend server unreachable at /api/v1/auth/login. Using explicit VITE_ENABLE_MOCK_AUTH mock registry.');
          return this._offlineMockLogin({ cleanEmail, password, expectedRole });
        }
        return {
          success: false,
          error: 'Unable to connect to ResultPoint authentication server. Please check your network connection or verify that the backend is running.',
        };
      }

      return {
        success: false,
        error: err.message || 'Login failed. Please check your credentials.',
      };
    }
  },

  _offlineMockLogin({ cleanEmail, password, expectedRole }) {
    const users = safeGet(STORAGE_KEYS.USERS, []);
    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid email or password. Please verify your credentials.',
      };
    }

    if (found.status && (found.status.toLowerCase() === 'inactive' || found.status.toLowerCase() === 'suspended')) {
      return {
        success: false,
        error: `Your account is ${found.status.toLowerCase()}. Please contact the platform administrator.`,
      };
    }

    const sanitizedUser = sanitizeUserSummary(found);

    if (expectedRole && sanitizedUser.role !== expectedRole) {
      if (expectedRole === 'admin') {
        return {
          success: false,
          error: 'Access denied: Administrator privileges required. Please switch to Student Login.',
        };
      }
      return {
        success: false,
        error: 'Access denied: This login is for students. Please switch to Admin Login.',
      };
    }

    const mockAccessToken = `mock_access_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_${Date.now()}`;
    this.setSession(sanitizedUser, { accessToken: mockAccessToken, refreshToken: mockRefreshToken });

    return {
      success: true,
      user: sanitizedUser,
      token: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
  },

  /**
   * Register a new student account.
   * Connects to POST /api/v1/auth/signup.
   */
  async register({ fullName, email, password, phone = null }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary: Attempt backend registration
    try {
      const authResponse = await authApi.register({
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
        phone,
      });

      const { accessToken, refreshToken, user: backendUser } = authResponse;
      const sanitizedUser = sanitizeUserSummary(backendUser);

      this.setSession(sanitizedUser, { accessToken, refreshToken });

      return {
        success: true,
        user: sanitizedUser,
        token: accessToken,
        refreshToken,
      };
    } catch (err) {
      // If backend is unreachable, check if mock auth is explicitly enabled (dev only)
      if (err.code === 'NETWORK_FAILURE' || err.status === 0) {
        if (isMockAuthAllowed()) {
          console.warn('[DEV ONLY] Backend server unreachable at /api/v1/auth/signup. Using explicit VITE_ENABLE_MOCK_AUTH mock registry.');
          return this._offlineMockRegister({ fullName, cleanEmail, password, phone });
        }
        return {
          success: false,
          error: 'Unable to connect to ResultPoint server to complete registration. Please check your network connection or try again later.',
        };
      }

      return {
        success: false,
        error: err.message || 'Registration failed. Please check the entered details.',
        details: err.details || null,
        code: err.code || 'UNKNOWN_ERROR',
        status: err.status || 500,
      };
    }
  },

  _offlineMockRegister({ fullName, cleanEmail, password }) {
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

    const sanitizedUser = sanitizeUserSummary(newUser);
    const mockAccessToken = `mock_access_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_${Date.now()}`;
    this.setSession(sanitizedUser, { accessToken: mockAccessToken, refreshToken: mockRefreshToken });

    return {
      success: true,
      user: sanitizedUser,
      token: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
  },

  /**
   * Log out authenticated user from device.
   * Connects to POST /api/v1/auth/logout.
   */
  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken && !refreshToken.startsWith('mock_')) {
        await authApi.logout({ refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout request notice:', err.message);
    } finally {
      refreshCoordinator.broadcastLogout();
      tokenStorage.clearSession();
      try {
        localStorage.removeItem(STORAGE_KEYS.STUDENT);
      } catch {
        // Fallback
      }
    }
  },

  /**
   * Log out user from all active devices.
   * Connects to POST /api/v1/auth/logout-all.
   */
  async logoutAll() {
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.warn('Backend logout-all request notice:', err.message);
    } finally {
      refreshCoordinator.broadcastLogout();
      tokenStorage.clearSession();
    }
  },

  /**
   * Verifies current session against backend on app boot or reload.
   */
  async checkSession() {
    const refreshToken = tokenStorage.getRefreshToken();
    const accessToken = tokenStorage.getAccessToken();

    if (!refreshToken && !accessToken) {
      return null;
    }

    // If mock token from offline mode
    if (refreshToken && refreshToken.startsWith('mock_')) {
      if (!isMockAuthAllowed()) {
        this.clearInvalidSession('Mock tokens not permitted in this environment');
        return null;
      }
      const user = tokenStorage.getCurrentUser();
      if (user) {
        return { user, token: accessToken || refreshToken };
      }
      return null;
    }

    try {
      // If we don't have an access token in memory, refresh first
      if (!accessToken && refreshToken) {
        const fresh = await refreshCoordinator.acquireFreshTokens();
        return {
          user: sanitizeUserSummary(fresh.user || tokenStorage.getCurrentUser()),
          token: fresh.accessToken,
        };
      }

      // If access token exists, verify via GET /api/v1/auth/me
      const userSummary = await authApi.getCurrentUser();
      const sanitized = sanitizeUserSummary(userSummary);
      tokenStorage.setCurrentUser(sanitized);

      return {
        user: sanitized,
        token: tokenStorage.getAccessToken(),
      };
    } catch (err) {
      console.warn('Session verification notice:', err.message);
      this.clearInvalidSession('Session expired or invalidated by server');
      return null;
    }
  },
};
