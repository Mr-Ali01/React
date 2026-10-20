import { STORAGE_KEYS } from './storageKeys';

// Default Demo Student matching the reference dashboard
const DEFAULT_DEMO_USER = {
  id: 'usr_samir_01',
  fullName: 'Samir Ali',
  email: 'samir@resultpoint.edu',
  password: 'password123',
  role: 'student',
  hasCompletedProfile: true,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  universityId: 'osmania',
  courseId: 'mca',
  regulationId: 'ou-mca-cbcs',
  course: 'MCA',
  university: 'Osmania University',
  currentSemester: 4,
  totalSemesters: 4,
  regulation: 'CBCS',
  joinedDate: '2024-08-15'
};

// Default Demo Admin matching the reference admin dashboard
export const DEFAULT_DEMO_ADMIN = {
  id: 'usr_admin_01',
  fullName: 'Admin',
  email: 'admin@resultpoint.edu',
  password: 'adminpassword123',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
  title: 'Platform Owner'
};

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
  // Ensure default demo users and data exist
  initialize() {
    const users = safeGet(STORAGE_KEYS.USERS, []);
    if (!users.some((u) => u.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase())) {
      users.push(DEFAULT_DEMO_USER);
    }
    if (!users.some((u) => u.email.toLowerCase() === DEFAULT_DEMO_ADMIN.email.toLowerCase())) {
      users.push(DEFAULT_DEMO_ADMIN);
    }
    safeSet(STORAGE_KEYS.USERS, users);
  },

  loginAsAdmin() {
    return this.setSession(DEFAULT_DEMO_ADMIN);
  },

  getAllUsers() {
    return safeGet(STORAGE_KEYS.USERS, [DEFAULT_DEMO_USER]);
  },

  getCurrentUser() {
    const auth = safeGet(STORAGE_KEYS.AUTH, null);
    return auth?.user || null;
  },

  isAuthenticated() {
    const auth = safeGet(STORAGE_KEYS.AUTH, null);
    return Boolean(auth && auth.user);
  },

  setSession(user) {
    const session = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || 'student',
        hasCompletedProfile: Boolean(user.hasCompletedProfile),
        avatar: user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        universityId: user.universityId || '',
        courseId: user.courseId || '',
        regulationId: user.regulationId || '',
        course: user.course || '',
        university: user.university || '',
        currentSemester: user.currentSemester || 1,
        totalSemesters: user.totalSemesters || 8,
        regulation: user.regulation || ''
      },
      token: `demo_token_${Date.now()}`,
      loginAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.AUTH, session);
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

  login({ email, password }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, [DEFAULT_DEMO_USER, DEFAULT_DEMO_ADMIN]);

    // Check if logging in as admin
    if (cleanEmail === 'admin@resultpoint.edu' && (password === 'adminpassword123' || password === 'admin123' || password === 'password123')) {
      const adminSession = this.loginAsAdmin();
      return { success: true, user: adminSession };
    }

    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid email or password. Please verify your credentials.'
      };
    }

    const sessionUser = this.setSession(found);
    return { success: true, user: sessionUser };
  },

  register({ fullName, email, password }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, [DEFAULT_DEMO_USER]);

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
    } catch (e) {
      console.error(e);
    }
  }
};

// Auto-run initializer on import
authService.initialize();
