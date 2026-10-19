import { STORAGE_KEYS } from './storageKeys';

// Default Demo User matching the reference dashboard
const DEFAULT_DEMO_USER = {
  id: 'usr_samir_01',
  fullName: 'Samir Ali',
  email: 'samir@resultpoint.edu',
  password: 'password123',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  course: 'MCA',
  university: 'Osmania University',
  currentSemester: 4,
  totalSemesters: 8,
  regulation: 'CBCS',
  joinedDate: '2024-08-15'
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
      safeSet(STORAGE_KEYS.USERS, users);
    }
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
        avatar: user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        course: user.course || 'MCA',
        university: user.university || 'Osmania University',
        currentSemester: user.currentSemester || 4,
        totalSemesters: user.totalSemesters || 8,
        regulation: user.regulation || 'CBCS'
      },
      token: `demo_token_${Date.now()}`,
      loginAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.AUTH, session);
    return session.user;
  },

  login({ email, password }) {
    this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const users = safeGet(STORAGE_KEYS.USERS, [DEFAULT_DEMO_USER]);

    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid email or password. (Demo: samir@resultpoint.edu / password123)'
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      course: 'MCA',
      university: 'Osmania University',
      currentSemester: 4,
      totalSemesters: 8,
      regulation: 'CBCS',
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
