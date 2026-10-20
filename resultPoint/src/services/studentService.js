import { STORAGE_KEYS } from './storageKeys';
import { authService } from './authService';
import { resultService } from './resultService';

const DEFAULT_PROFILE = {
  fullName: 'Samir Ali',
  email: 'samir@resultpoint.edu',
  hasCompletedProfile: true,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  universityId: 'osmania',
  courseId: 'mca',
  regulationId: 'ou-mca-cbcs',
  course: 'MCA — Master of Computer Applications',
  university: 'Osmania University',
  currentSemester: 4,
  totalSemesters: 4,
  totalDegreeCredits: 80,
  regulation: 'CBCS',
  hallTicketNumber: '1005-23-772-045',
  batch: '2023 - 2025'
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

export const studentService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.STUDENT, null);
    if (!existing) {
      safeSet(STORAGE_KEYS.STUDENT, DEFAULT_PROFILE);
    }
  },

  getProfile() {
    this.initialize();
    const stored = safeGet(STORAGE_KEYS.STUDENT, DEFAULT_PROFILE);
    const authUser = authService.getCurrentUser();
    if (authUser) {
      const isComplete = Boolean(authUser.hasCompletedProfile);
      return {
        ...stored,
        fullName: authUser.fullName || stored.fullName,
        username: authUser.username || authUser.fullName || stored.username || stored.fullName,
        email: authUser.email || stored.email,
        hasCompletedProfile: isComplete,
        avatar: authUser.avatar || stored.avatar,
        universityId: isComplete ? (authUser.universityId || stored.universityId) : (authUser.universityId || ''),
        courseId: isComplete ? (authUser.courseId || stored.courseId) : (authUser.courseId || ''),
        regulationId: isComplete ? (authUser.regulationId || stored.regulationId) : (authUser.regulationId || ''),
        course: isComplete ? (authUser.course || stored.course) : (authUser.course || ''),
        university: isComplete ? (authUser.university || stored.university) : (authUser.university || ''),
        currentSemester: authUser.currentSemester || stored.currentSemester,
        totalSemesters: authUser.totalSemesters || stored.totalSemesters,
        regulation: authUser.regulation || stored.regulation
      };
    }
    return stored;
  },

  isProfileComplete() {
    const p = this.getProfile();
    return Boolean(p && p.hasCompletedProfile === true && p.universityId && p.courseId);
  },

  updateProfile(updates) {
    const current = this.getProfile();
    const updated = { ...current, ...updates, hasCompletedProfile: true };
    safeSet(STORAGE_KEYS.STUDENT, updated);
    authService.updateCurrentUser(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_profile_updated'));
    }
    return updated;
  },

  getAcademicSummary() {
    const profile = this.getProfile();
    const results = resultService.getAllResults();

    // Sort by semesterNumber ascending for correct calculations
    const sorted = [...results].sort((a, b) => a.semesterNumber - b.semesterNumber);
    const completedCount = sorted.length;
    const totalSemesters = profile.totalSemesters || 8;

    let totalCreditsEarned = 0;
    let latestCGPA = 8.37;
    let prevSGPA = 8.45;
    let latestSGPA = 8.72;

    if (sorted.length > 0) {
      const latest = sorted[sorted.length - 1];
      latestCGPA = Number(latest.cgpa) || 8.37;
      latestSGPA = Number(latest.sgpa) || 8.72;

      if (sorted.length >= 2) {
        prevSGPA = Number(sorted[sorted.length - 2].sgpa) || 8.45;
      }

      totalCreditsEarned = sorted.reduce((sum, item) => sum + (Number(item.creditsEarned) || 0), 0);
    }

    if (totalCreditsEarned === 0) totalCreditsEarned = 86; // fallback demo
    const degreeTotalCredits = profile.totalDegreeCredits || 160;
    const creditsRemaining = Math.max(0, degreeTotalCredits - totalCreditsEarned);
    const creditsPercentage = Number(((totalCreditsEarned / degreeTotalCredits) * 100).toFixed(2));

    const semestersRemaining = Math.max(0, totalSemesters - completedCount);
    const semestersPercentage = Math.round((completedCount / totalSemesters) * 100);

    // Compute diff vs previous semester
    const sgpaDiff = (latestSGPA - prevSGPA).toFixed(2);
    const diffSign = Number(sgpaDiff) >= 0 ? `+${sgpaDiff}` : sgpaDiff;

    // Performance standing
    let performanceLabel = 'Excellent';
    if (latestCGPA < 6.0) performanceLabel = 'Average';
    else if (latestCGPA < 7.5) performanceLabel = 'Good';
    else if (latestCGPA < 8.5) performanceLabel = 'Excellent';
    else performanceLabel = 'Outstanding';

    return {
      currentCGPA: latestCGPA.toFixed(2),
      cgpaScale: 10,
      performanceBadge: performanceLabel,
      diffText: `${diffSign} vs last semester`,
      isDiffPositive: Number(sgpaDiff) >= 0,
      totalCredits: totalCreditsEarned,
      degreeCredits: degreeTotalCredits,
      creditsRemaining,
      creditsPercentage,
      semestersCompleted: completedCount,
      totalSemesters,
      semestersRemaining,
      semestersPercentage,
      backlogs: 0,
      backlogStatus: 'All Clear'
    };
  },

  getPerformanceInsights() {
    const summary = this.getAcademicSummary();
    const results = resultService.getAllResults();
    
    // Calculate dynamic diff if available
    let jump = '0.42';
    if (results.length >= 2) {
      const sorted = [...results].sort((a, b) => a.semesterNumber - b.semesterNumber);
      const diff = Math.abs(sorted[sorted.length - 1].sgpa - sorted[sorted.length - 2].sgpa);
      jump = diff > 0 ? diff.toFixed(2) : '0.42';
    }

    return [
      {
        id: 'strongest',
        type: 'positive',
        title: 'Strongest Subject Area',
        subtitle: 'Programming & Development',
        detail: 'Average Grade: A',
        badge: 'Excellent',
        badgeColor: 'emerald'
      },
      {
        id: 'needs_work',
        type: 'warning',
        title: 'Needs Improvement',
        subtitle: 'Mathematics',
        detail: 'Average Grade: B',
        badge: 'Work on it',
        badgeColor: 'amber'
      },
      {
        id: 'trend',
        type: 'trend',
        title: 'Performance Trend',
        subtitle: `Your SGPA increased by ${jump} points compared to the previous semester.`,
        detail: '',
        badge: 'Improving',
        badgeColor: 'purple'
      }
    ];
  }
};

studentService.initialize();
