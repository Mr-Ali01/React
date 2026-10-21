import { STORAGE_KEYS } from './storageKeys.js';
import { authService } from './authService.js';
import { resultService } from './resultService.js';
import { academicCatalogService } from './academicCatalogService.js';
import { academicCalculationEngine } from './academicCalculationEngine.js';
import { backlogService } from './backlogService.js';
import { goalService } from './goalService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { auditHistoryService } from './auditHistoryService.js';

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

export function calculateActiveSemesterInfo(resultsList = [], totalSemesters = 6, userPreferredSemester = null) {
  const maxSem = Number(totalSemesters) || 6;
  const validResults = (resultsList || []).filter(
    (r) => r && Number(r.semesterNumber) >= 1 && Number(r.semesterNumber) <= maxSem
  );

  // Distinct completed semester numbers
  const completedSemestersSet = new Set(validResults.map((r) => Number(r.semesterNumber)));
  const completedCount = completedSemestersSet.size;

  // Find lowest missing semester (1 .. maxSem)
  let lowestMissingSemester = null;
  for (let s = 1; s <= maxSem; s++) {
    if (!completedSemestersSet.has(s)) {
      lowestMissingSemester = s;
      break;
    }
  }

  const isDegreeCompleted = completedCount >= maxSem && lowestMissingSemester === null;

  let activeSemester;
  if (isDegreeCompleted) {
    activeSemester = maxSem;
  } else {
    const pref = Number(userPreferredSemester);
    // If the student preferred an active semester that is within range and NOT already completed
    if (pref >= 1 && pref <= maxSem && !completedSemestersSet.has(pref)) {
      activeSemester = pref;
    } else {
      activeSemester = lowestMissingSemester || 1;
    }
  }

  return {
    activeSemester,
    isDegreeCompleted,
    completedCount,
    completedSemesters: Array.from(completedSemestersSet).sort((a, b) => a - b),
    lowestMissingSemester,
    maxSemesters: maxSem
  };
}

export const studentService = {
  initialize() {
    // Only initialize student profile if an authenticated user session exists
    const authUser = authService.getCurrentUser();
    if (authUser && authUser.role === 'student') {
      const existing = safeGet(STORAGE_KEYS.STUDENT, null);
      if (!existing) {
        safeSet(STORAGE_KEYS.STUDENT, {
          fullName: authUser.fullName,
          email: authUser.email,
          hasCompletedProfile: Boolean(authUser.hasCompletedProfile),
          avatar: authUser.avatar || '',
          universityId: authUser.universityId || '',
          courseId: authUser.courseId || '',
          regulationId: authUser.regulationId || '',
          course: authUser.course || '',
          university: authUser.university || '',
          currentSemester: authUser.currentSemester || 1,
          totalSemesters: authUser.totalSemesters || 6,
          regulation: authUser.regulation || '',
          ruleVersion: authUser.ruleVersion || '',
          hallTicketNumber: authUser.hallTicketNumber || '',
          batch: authUser.batch || '',
          phoneNumber: authUser.phoneNumber || '',
          dob: authUser.dob || '',
          gender: authUser.gender || 'Male',
          totalDegreeCredits: authUser.totalDegreeCredits || 150
        });
      }
    }
  },

  calculateActiveSemesterInfo(resultsList, totalSemesters, userPreferredSemester) {
    return calculateActiveSemesterInfo(resultsList, totalSemesters, userPreferredSemester);
  },

  getProfile() {
    const authUser = authService.getCurrentUser();
    if (!authUser) {
      return null;
    }
    const stored = safeGet(STORAGE_KEYS.STUDENT, null) || {};
    const isComplete = Boolean(authUser.hasCompletedProfile ?? stored.hasCompletedProfile ?? true);
    const totalSem = Number(authUser.totalSemesters || stored.totalSemesters || 6);

    // Calculate dynamic active semester from actual valid results
    let results = [];
    try {
      results = resultService.getAllResults() || [];
    } catch {
      results = [];
    }

    const preferredSem = stored.currentSemester || authUser.currentSemester;
    const semInfo = calculateActiveSemesterInfo(results, totalSem, preferredSem);

    return {
      fullName: authUser.fullName || stored.fullName || 'Student User',
      username: authUser.username || authUser.fullName || stored.fullName || 'Student',
      email: authUser.email || stored.email || 'student@resultpoint.edu',
      hasCompletedProfile: isComplete,
      avatar: authUser.avatar || stored.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      universityId: authUser.universityId || stored.universityId || 'osmania',
      courseId: authUser.courseId || stored.courseId || 'bca',
      regulationId: authUser.regulationId || stored.regulationId || 'ou-bca-cbcs',
      course: authUser.course || stored.course || 'BCA — Bachelor of Computer Applications (6 Semesters)',
      university: authUser.university || stored.university || 'Osmania University (OU)',
      currentSemester: semInfo.activeSemester,
      isDegreeCompleted: semInfo.isDegreeCompleted,
      completedSemestersCount: semInfo.completedCount,
      completedSemestersList: semInfo.completedSemesters,
      totalSemesters: totalSem,
      regulation: authUser.regulation || stored.regulation || 'Choice Based Credit System (CBCS) — [OU_BCA_CBCS_V1]',
      ruleVersion: authUser.ruleVersion || stored.ruleVersion || 'OU_BCA_CBCS_V1',
      hallTicketNumber: stored.hallTicketNumber || authUser.hallTicketNumber || 'REG-478583',
      batch: stored.batch || authUser.batch || '2025-2027',
      phoneNumber: stored.phoneNumber || authUser.phoneNumber || '+91 98765 43210',
      dob: stored.dob || authUser.dob || '15 Mar 2003',
      gender: stored.gender || authUser.gender || 'Male',
      totalDegreeCredits: stored.totalDegreeCredits || authUser.totalDegreeCredits || 150
    };
  },

  isProfileComplete() {
    const p = this.getProfile();
    return Boolean(p && p.hasCompletedProfile === true && p.universityId && p.courseId);
  },

  updateProfile(updates) {
    const current = this.getProfile() || {};
    const updated = { ...current, ...updates, hasCompletedProfile: true };
    safeSet(STORAGE_KEYS.STUDENT, updated);
    authService.updateCurrentUser(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('academic_profile_updated'));
    }
    return updated;
  },

  clearProfile() {
    try {
      localStorage.removeItem(STORAGE_KEYS.STUDENT);
    } catch (e) {
      console.error(e);
    }
  },

  resetAcademicDataForNewProgram(newConfig) {
    // 1. Reset saved semester results to empty
    resultService.resetResults([]);

    // 2. Clear backlogs
    backlogService.resetBacklogs();

    // 3. Reset academic goal to new degree name and total semesters
    goalService.resetGoal(newConfig.course, newConfig.totalSemesters);

    // 4. Reset audit history
    if (typeof auditHistoryService?.resetAuditHistory === 'function') {
      auditHistoryService.resetAuditHistory();
    }

    // 5. Clear old activities and record a fresh configuration milestone
    activityHistoryService.clearActivityHistory();
    try {
      activityHistoryService.recordActivity({
        type: 'result',
        action: 'updated',
        title: 'Academic Configuration Updated',
        description: `Program updated to ${newConfig.course} (${newConfig.universityShortName || newConfig.university}). Academic records reinitialized.`,
        entityId: 'config-reset',
        badgeValues: [
          newConfig.courseShortName || 'Program',
          newConfig.universityShortName || 'University',
          newConfig.regulationCode || 'Regulation'
        ],
        resultMetric: { label: 'Status', value: 'Reinitialized', color: 'emerald' },
        metadata: {
          activityType: 'Configuration Reset',
          university: newConfig.university,
          course: newConfig.course,
          regulation: newConfig.regulation,
          totalSemesters: newConfig.totalSemesters,
          remarks: 'All dependent academic records cleared for new program curriculum.'
        }
      });
    } catch (err) {
      console.warn('Could not record activity history for program reset:', err);
    }

    // 6. Update student profile with new course and active semester 1
    const current = this.getProfile() || {};
    const updated = {
      ...current,
      universityId: newConfig.universityId,
      university: newConfig.university,
      universityShortName: newConfig.universityShortName,
      courseId: newConfig.courseId,
      course: newConfig.course,
      courseShortName: newConfig.courseShortName,
      regulationId: newConfig.regulationId,
      regulation: newConfig.regulation,
      ruleVersion: newConfig.ruleVersion,
      batch: newConfig.batch,
      currentSemester: 1, // Fresh program starts at Semester 1
      totalSemesters: newConfig.totalSemesters,
      totalDegreeCredits: newConfig.totalDegreeCredits || 150,
      hasCompletedProfile: true
    };

    safeSet(STORAGE_KEYS.STUDENT, updated);
    authService.updateCurrentUser(updated);

    // Broadcast across entire application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('results_data_updated'));
      window.dispatchEvent(new Event('academic_profile_updated'));
      window.dispatchEvent(new Event('academic_goals_updated'));
      window.dispatchEvent(new Event('activity_history_updated'));
      window.dispatchEvent(new Event('backlog_data_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return updated;
  },

  getAcademicSummary(customProfile, customResults) {
    const profile = customProfile || this.getProfile() || {};
    const results = customResults || resultService.getAllResults();

    // Sort by semesterNumber ascending for correct chronological calculations
    const sorted = [...(results || [])].sort((a, b) => Number(a.semesterNumber) - Number(b.semesterNumber));
    const completedCount = sorted.length;
    const totalSemesters = Number(profile.totalSemesters) || 8;
    const degreeTotalCredits = Number(profile.totalDegreeCredits) || 160;

    let totalCreditsEarned = 0;
    let latestCGPA = 0;
    let prevSGPA = 0;
    let latestSGPA = 0;
    let backlogsCount = 0;

    if (sorted.length > 0) {
      const cgpaResult = academicCalculationEngine.calculateCGPA(sorted);
      latestCGPA = cgpaResult.cgpa;
      const latest = sorted[sorted.length - 1];
      latestSGPA = Number(latest.sgpa) || 0;

      if (sorted.length >= 2) {
        prevSGPA = Number(sorted[sorted.length - 2].sgpa) || 0;
      } else {
        prevSGPA = latestSGPA;
      }

      totalCreditsEarned = sorted.reduce(
        (sum, item) => sum + (Number(item.creditsEarned || item.totalCredits) || 0),
        0
      );

      const backlogScan = backlogService.scanBacklogs(sorted);
      backlogsCount = backlogScan.activeBacklogs;
    }

    const creditsRemaining = Math.max(0, degreeTotalCredits - totalCreditsEarned);
    const creditsPercentage = degreeTotalCredits > 0 ? Number(((totalCreditsEarned / degreeTotalCredits) * 100).toFixed(2)) : 0;

    const semestersRemaining = Math.max(0, totalSemesters - completedCount);
    const semestersPercentage = totalSemesters > 0 ? Math.round((completedCount / totalSemesters) * 100) : 0;

    // Diff vs previous semester
    const sgpaDiff = (latestSGPA - prevSGPA).toFixed(2);
    const diffSign = Number(sgpaDiff) >= 0 ? `+${sgpaDiff}` : sgpaDiff;

    // Load university grading configuration for overall grade determination
    const catalogConfig = academicCatalogService.getFullConfiguration(
      profile.universityId,
      profile.courseId,
      profile.regulationId
    );

    const overallMetrics = academicCalculationEngine.calculateOverallMetrics(
      sorted,
      catalogConfig?.gradeScale,
      catalogConfig?.regulation?.calculationRule
    );

    return {
      currentCGPA: latestCGPA.toFixed(2),
      currentGPA: latestCGPA.toFixed(2),
      latestSGPA: latestSGPA.toFixed(2),
      cgpaScale: 10,
      overallGrade: overallMetrics.overallGrade,
      overallGradeDesc: overallMetrics.overallGradeDesc,
      percentage: Number(overallMetrics.percentage) || 0,
      percentageFormula: catalogConfig?.calculationRule?.percentageFormula || catalogConfig?.regulation?.calculationRule?.percentageFormula || 'CGPA * 10',
      formulaDescription: catalogConfig?.calculationRule?.formulaDescription || catalogConfig?.regulation?.calculationRule?.formulaDescription || 'Percentage = CGPA × 10',
      gradeScale: catalogConfig?.gradeScale || [],
      performanceBadge: overallMetrics.overallGradeDesc || (latestCGPA >= 8.5 ? 'Excellent' : latestCGPA >= 7.0 ? 'Good' : 'Average'),
      diffText: completedCount > 1 ? `${diffSign} vs last semester` : 'Current semester',
      isDiffPositive: Number(sgpaDiff) >= 0,
      totalCredits: totalCreditsEarned,
      degreeCredits: degreeTotalCredits,
      creditsRemaining,
      creditsPercentage,
      semestersCompleted: completedCount,
      totalSemesters,
      semestersRemaining,
      semestersPercentage,
      backlogs: backlogsCount,
      backlogStatus: backlogsCount === 0 ? 'All Clear' : `${backlogsCount} Active`
    };
  },

  getPerformanceInsights(customProfile, customResults) {
    const summary = this.getAcademicSummary(customProfile, customResults);
    const results = customResults || resultService.getAllResults();
    
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
